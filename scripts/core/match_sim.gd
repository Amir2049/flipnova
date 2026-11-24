class_name MatchSim
extends RefCounted
## The match: players, ball, ball control (touch dribbling, first touch, tackles), kicks, keepers and the rules.
## Runs at a fixed 60 Hz. The view and the input only read this state and call the request_* functions.

const DT := 1.0 / 60.0
const PASS_DIST := [7.8, 13.9, 24.4, 42.9]   # real ground-pass medians (Metrica tracking data)
const PASS_SPEED := [8.8, 11.9, 13.5, 16.1]
const PASS_TEMPO := 1.2                       # game passes are crisper than real ones

var pitch := Pitch.new()
var ball := BallPhysics.new()
var players: Array[PlayerSim] = []
var teams: Array = []        # [{name, short, kit, attack, score, players: Array[PlayerSim], ai}]
var clips := {}              # player_clips.json: touch times, root paths
var rng := RandomNumberGenerator.new()

var time := 0.0              # real seconds since the start
var half := 1
var half_seconds := 240.0    # real seconds per half
var half_t := 0.0
var phase := "kickoff"       # kickoff, play, restart, goal, halftime, fulltime
var phase_t := 0.0
var restart := {}            # kind, team, spot (Vector2), taker (id)
var kickoff_team := 0

var owner := -1              # player dribbling the ball (-1 loose)
var in_hands := false
var last_touch := -1
var last_team := -1
var possession_team := -1    # team that has the ball or touched it last (cleared on long loose balls)
var loose_t := 0.0
var pass_to := -1
var pass_t := 0.0
var shot_by := -1
var shot_t := 0.0
var kick_t := -10.0          # time of the last kick
var gk_eval_cd := 0.0
var celebrated_goal := 0         # goals_log size when the last celebration was played
var keeper_ready := [true, true]
var ball_prev := Vector3.ZERO

var humans: Array = []       # [{team, pid, buffer: {kind, power, dir, t}, switch_cd}]
var events: Array = []       # [{type, ...}] for the view / audio (cleared by the reader)
var stats := {"shots": [0, 0], "on_target": [0, 0], "poss": [0.0, 0.0], "passes": [0, 0], "passes_ok": [0, 0]}
var goals_log: Array = []    # [{team, pid, minute}]
var difficulty := 0.5        # CPU 0..1
var goal_pause := 4.5        # seconds from a goal to the kick-off
var mode := "match"          # match, training, shooting, skills (practice modes park the opponents)
var parked := {}             # pid -> spot: players taken out of a practice mode (stand still off the pitch)
var practice_reset := 0.0    # practice modes: seconds until the next attempt is set up
var pending_restart: Array = []
var dead_dur := 1.5
var fade_sent := false
var wait_halftime := false   # matches with a human: the second half starts when the player continues
var offside_ids := {}        # pid -> spot: attackers in an offside position when the last pass was played
var offside_team := -1
var offside_on := true
var restart_kick := ""       # the kind of restart the next kick is taken from (no offside from some)
var style := "competitive"   # gameplay preset: competitive (quick, responsive) / authentic (realistic tempo)
var sliders := {}            # sprint, accel, pass_speed, shot_error, cpu_press (1.0 = default)
var momentum := [0.0, 0.0]   # 0..1 per team: good play fills it; full = a surge
var surge := [0.0, 0.0]      # seconds of surge left per team
var added := [2, 3]          # stoppage time per half (minutes shown)
var drib := {}               # the dribble touch in flight: {t0, dir, u0, a, next_step}
var give_and_go := {}        # pid -> match time until which he makes a forward run after a one-two pass
var halftime_go := false


# ------------------------------------------------------------------ setup

func setup(team_defs: Array, formation_defs: Array, human_team: int, kind: String = "11v11") -> void:
	rng.randomize()
	added = [1 + rng.randi() % 3, 2 + rng.randi() % 4]
	pitch = Pitch.make(kind) if kind != "11v11" else Pitch.new()
	var f := FileAccess.open("res://assets/player_clips.json", FileAccess.READ)
	if f:
		clips = JSON.parse_string(f.get_as_text())
	teams.clear()
	players.clear()
	for t in 2:
		var td: Dictionary = team_defs[t]
		var lst: Array[PlayerSim] = []
		var team := {"name": td.get("name", "Team"), "short": td.get("short", "TEA"), "kit": td.get("kit", {}),
			"attack": 1 if t == 0 else -1, "score": 0, "players": lst, "ai": null,
			"bench": td.get("bench", []).duplicate(true), "subs_left": 5, "formation": td.get("formation", "4-3-3"),
			"club": td.get("club", -1)}
		var roster: Array = td.get("players", [])
		var slots: Array = formation_defs[t]
		for i in slots.size():
			var p := PlayerSim.new()
			p.id = players.size()
			p.team = t
			p.idx = i
			var s: Array = slots[i]
			p.role = s[2]
			p.slot = Vector2(s[0], s[1])
			var info: Dictionary = roster[i] if i < roster.size() else {"name": "Player %d" % (i + 1), "number": i + 1}
			p.apply_info(info)
			players.append(p)
			team["players"].append(p)
		teams.append(team)
	for t in 2:
		var ai := TeamAI.new()
		ai.setup(self, t)
		teams[t]["ai"] = ai
	humans.clear()
	if human_team >= 0:
		humans.append({"team": human_team, "pid": -1, "buffer": {}, "switch_cd": 0.0})
	kickoff_team = 0
	_setup_kickoff(0)


## Breaks the MatchSim <-> TeamAI reference cycle (both are RefCounted, so without this a finished match, with its
## 22 players and both AIs, is never freed: every match played in a session stayed in memory).
func dispose() -> void:
	for t in teams:
		var ai = t.get("ai")
		if ai:
			ai.m = null
		t["ai"] = null


## Gameplay preset + sliders: applied to every player's derived numbers (and again after substitutions).
func apply_style(preset: String, sl: Dictionary) -> void:
	style = preset
	sliders = sl
	for p in players:
		_style_player(p)


func _style_player(p: PlayerSim) -> void:
	p.derive()
	var auth := style == "authentic"
	p.top_speed *= (0.95 if auth else 1.0) * float(sliders.get("sprint", 1.0))
	p.tau *= (1.18 if auth else 0.92) / maxf(0.4, float(sliders.get("accel", 1.0)))
	p.lateral *= (0.9 if auth else 1.08) * float(sliders.get("grip", 1.0))
	p.turn_rate *= 0.92 if auth else 1.05


func add_momentum(t: int, v: float) -> void:
	if t < 0 or t > 1 or mode != "match" or phase not in ["play", "dead", "restart", "goal"]:
		return
	if surge[t] > 0.0 and v > 0.0:
		return
	momentum[t] = clampf(momentum[t] + v, 0.0, 1.0)
	if momentum[t] >= 1.0:
		momentum[t] = 0.0
		surge[t] = 20.0
		emit("surge", {"team": t})


func surging(t: int) -> bool:
	return t >= 0 and t <= 1 and surge[t] > 0.0


## Bring a bench player on for player `pid` (keeps his place in the shape). Returns false if not allowed.
func substitute(t: int, pid: int, bench_index: int) -> bool:
	var team: Dictionary = teams[t]
	var bench: Array = team["bench"]
	if team["subs_left"] <= 0 or bench_index < 0 or bench_index >= bench.size():
		return false
	var incoming: Dictionary = bench[bench_index]
	if incoming.get("off", false):
		return false
	var p := players[pid]
	if p.team != t or owner == pid or in_hands and owner == pid or p.sent_off:
		return false
	if (p.role == "GK") != (incoming.get("pos", "") == "GK"):
		pass   # allowed (an outfield player can go in goal), the role stays the slot's
	var going: Dictionary = p.info.duplicate(true)
	going["off"] = true
	going["stamina_left"] = p.stamina
	bench[bench_index] = going
	p.apply_info(incoming)
	_style_player(p)
	p.stamina = 1.0
	p.action = ""
	p.clip = ""
	team["subs_left"] -= 1
	emit("sub", {"team": t, "pid": pid, "off": going.get("short", ""), "on": p.short_name})
	return true


func set_formation(t: int, formation: String) -> void:
	if not GameData.FORMATIONS.has(formation) or pitch.walls:
		return
	var slots: Array = GameData.FORMATIONS[formation]
	for p in team_players(t):
		var s: Array = slots[p.idx]
		p.role = s[2]
		p.slot = Vector2(s[0], s[1])
	teams[t]["formation"] = formation
	emit("formation", {"team": t, "formation": formation})


## Swap two players' places in the shape (slots), e.g. move a winger to the other side.
func swap_positions(t: int, a: int, b: int) -> void:
	var pa := players[a]
	var pb := players[b]
	if pa.team != t or pb.team != t or pa == pb:
		return
	var r := pa.role
	var sl := pa.slot
	var ix := pa.idx
	pa.role = pb.role
	pa.slot = pb.slot
	pa.idx = pb.idx
	pb.role = r
	pb.slot = sl
	pb.idx = ix
	var lst: Array[PlayerSim] = teams[t]["players"]
	lst.sort_custom(func(x: PlayerSim, y: PlayerSim) -> bool: return x.idx < y.idx)


func team_players(t: int) -> Array[PlayerSim]:
	return teams[t]["players"]


func attack_dir(t: int) -> float:
	return float(teams[t]["attack"])


func goal_x(t: int) -> float:
	## x of the goal team t attacks
	return attack_dir(t) * pitch.half_l()


func ball2() -> Vector2:
	return Vector2(ball.pos.x, ball.pos.z)


func keeper_of(t: int) -> PlayerSim:
	for p in team_players(t):
		if p.role == "GK":
			return p
	return null


func human_slot_of(p: PlayerSim) -> int:
	for i in humans.size():
		if humans[i]["pid"] == p.id:
			return i
	return -1


func emit(type: String, data: Dictionary = {}) -> void:
	data["type"] = type
	data["t"] = time
	events.append(data)


# ------------------------------------------------------------------ the tick

func step() -> void:
	var dt := DT
	time += dt
	phase_t += dt
	match phase:
		"kickoff", "restart":
			_step_set_piece(dt)
		"play":
			half_t += dt
			_step_play(dt)
			if practice_reset > 0.0:
				practice_reset -= dt
				if practice_reset <= 0.0:
					emit("practice_reset", {})
			if half_t >= half_length() and owner == -1 and ball.pos.y < 2.0 or half_t >= half_length() + 6.0:
				_end_half()
		"dead":
			_step_dead(dt)
			if phase_t > dead_dur - 0.3 and not fade_sent:
				fade_sent = true
				emit("fade_out", {})
			if phase_t >= dead_dur:
				_setup_restart(pending_restart[0], pending_restart[1], pending_restart[2])
		"goal":
			_step_free(dt)
			if phase_t > goal_pause - 0.3 and not fade_sent:
				fade_sent = true
				emit("fade_out", {})
			# nobody picked a celebration: the scorer does one when he gets to the corner
			if phase_t > 2.3 and celebrated_goal != goals_log.size():
				celebrated_goal = goals_log.size()
				var g: Dictionary = goals_log.back()
				if g["pid"] >= 0:
					celebrate(g["pid"], "random")
			if phase_t > goal_pause:
				_setup_kickoff(kickoff_team)
		"halftime":
			_step_free(dt)
			if (not wait_halftime and phase_t > 2.5) or (wait_halftime and halftime_go):
				halftime_go = false
				_start_second_half()
		"fulltime":
			_step_free(dt)


func minute() -> float:
	var m := half_t / half_seconds * 45.0
	return m + (45.0 if half == 2 else 0.0)


func half_length() -> float:
	## real seconds this half lasts, stoppage time included
	return half_seconds * (1.0 + float(added[half - 1]) / 45.0)


func _step_play(dt: float) -> void:
	for t in 2:
		teams[t]["ai"].update(dt)
		momentum[t] = maxf(0.0, momentum[t] - dt * 0.004)
		if surge[t] > 0.0:
			surge[t] = maxf(0.0, surge[t] - dt)
			if surge[t] == 0.0:
				emit("surge_end", {"team": t})
	for p in players:
		if p.fooled > 0.0:
			p.fooled -= dt
			if p.human < 0:
				p.move = p.fooled_dir * 0.7
				p.sprint = 0.0
		# a match wears players down (scaled to the match length), sprinting more so
		p.stamina = maxf(0.0, p.stamina - dt * 0.32 / maxf(60.0, 2.0 * half_seconds) * (1.25 - 0.5 * PlayerSim.q(p.stamina_attr)))
	_update_humans(dt)
	_update_shield()
	_carrier_assist()
	_update_actions(dt)
	_move_players(dt)
	_collide_players()
	_update_ball_control(dt)
	ball_prev = ball.pos
	ball.clear_events()
	ball.step(dt, pitch)
	if in_hands:
		_hold_ball()
	_check_keepers()
	_check_receptions()
	_check_ball_events()
	if possession_team >= 0:
		stats["poss"][possession_team] += dt


func _step_free(dt: float) -> void:
	## celebrations / full time: players move on their intents, the ball just rolls
	for t in 2:
		teams[t]["ai"].update(dt)
	_update_actions(dt)
	_move_players(dt)
	_collide_players()
	ball.clear_events()
	ball.step(dt, pitch)


# ------------------------------------------------------------------ movement

func _move_players(dt: float) -> void:
	_anticipate()
	for p in players:
		p.with_ball = owner == p.id
	for p in players:
		p.boost = 1.04 if surging(p.team) else 1.0
	for p in players:
		if p.anim_cd > 0.0:
			p.anim_cd -= dt
		# a one-shot clip that has played out is cleared here too (the view does it as well), so turn / start /
		# reception clips can follow each other even when nothing is drawn
		if p.clip != "" and p.action not in ["fallen", "gk_hold"]:
			var cinfo: Dictionary = clips.get(p.clip, {})
			if time > p.clip_t0 + float(cinfo.get("dur", 0.6)) / maxf(p.clip_speed, 0.1) + 0.05:
				p.clip = ""
		if p.action == "" and p.clip == "" and p.anim_cd <= 0.0 and owner != p.id and phase in ["play", "kickoff", "restart"] and not parked.has(p.id):
			_start_turn_clip(p)
		if parked.has(p.id):
			p.pos = parked[p.id]
			p.vel = Vector2.ZERO
			p.move = Vector2.ZERO
			continue
		if p.immune > 0.0:
			p.immune -= dt
		if p.action in ["slide", "gk_dive", "fallen", "tackle", "kick", "trap", "throw", "celebrate", "gk_hold", "skill"]:
			_move_in_action(p, dt)
		else:
			if p.human >= 0:
				_loose_ball_assist(p)
			p.update_movement(dt, owner == p.id)
		p.cap = INF
		p.pos += p.vel * dt
		if not pitch.walls:
			p.pos.x = clampf(p.pos.x, -pitch.half_l() - 4.0, pitch.half_l() + 4.0)
			p.pos.y = clampf(p.pos.y, -pitch.half_w() - 4.0, pitch.half_w() + 4.0)
		elif not parked.has(p.id):
			# the cage: players stay inside the walls (a keeper may step back into his goal)
			var in_mouth := absf(p.pos.y) < pitch.goal_width * 0.5
			var lim_x := pitch.half_l() + (0.8 if in_mouth else -0.35)
			p.pos.x = clampf(p.pos.x, -lim_x, lim_x)
			p.pos.y = clampf(p.pos.y, -pitch.half_w() + 0.35, pitch.half_w() - 0.35)


## The human going for a loose ball: when the stick points roughly at it, steer onto where it will be and arrive
## at a speed he can take it from (the way FC helps you onto a loose ball) - no running past it and circling.
func _loose_ball_assist(p: PlayerSim) -> void:
	if in_hands or phase != "play" or ball.pos.y > 1.3 or p.move.length() < 0.2:
		return
	if owner >= 0 and (owner == p.id or players[owner].team == p.team):
		return
	var b := ball2()
	var bv := Vector2(ball.vel.x, ball.vel.z)
	var lead := clampf(p.pos.distance_to(b) / maxf(p.vel.length() + 2.0, 4.0), 0.0, 0.6)
	var aim := b + bv * lead
	var to := aim - p.pos
	var d := to.length()

	if d > 9.0 or d < 0.05:
		return
	if absf(p.move.angle_to(to)) > deg_to_rad(80.0):
		return
	p.move = to / d * p.move.length()
	p.cap = p.arrival_cap(aim)


func _move_in_action(p: PlayerSim, dt: float) -> void:
	if p.action == "skill":
		if owner != p.id and not p.act.get("kicked", false):
			p.pose_lean = 0.0
			p.pose_spin = 0.0
			p.action = ""   # tackled out of it
			return
		Skills.step(self, p, dt)
		return
	if p.action == "celebrate":
		_move_celebration(p, dt)
		return
	match p.action:
		"slide":
			var s := p.vel.length()
			p.vel = p.vel.normalized() * maxf(0.0, s - 6.5 * dt) if s > 0.01 else Vector2.ZERO
		"fallen", "gk_hold":
			p.vel = p.vel.move_toward(Vector2.ZERO, 12.0 * dt)
		"gk_dive":
			var dv: Vector2 = p.act.get("dive_vel", Vector2.ZERO)
			var k := clampf(1.0 - p.act_t / maxf(0.01, p.act_dur), 0.0, 1.0)
			p.vel = dv * k
		"kick", "trap":
			# keep running onto the ball, a little slower
			var to_ball := ball2() - p.pos
			var want: Vector2 = p.move if p.move.length() > 0.1 else to_ball.normalized() * 0.6
			if p.action == "kick" and not p.act.get("done", false) and to_ball.length() > 0.55:
				want = to_ball.normalized()
			var spd := minf(p.vel.length(), p.top_speed * 0.8)
			var target := want.normalized() * maxf(spd, 2.0 if to_ball.length() > 0.7 and not p.act.get("done", false) else 0.0)
			p.vel = p.vel.move_toward(target, 14.0 * dt)
			if to_ball.length() > 0.2 and not p.act.get("done", false):
				p.facing = PlayerSim._rotate_towards(p.facing, to_ball.normalized(), 12.0 * dt)
		"tackle":
			var to_b := ball2() - p.pos
			p.vel = p.vel.move_toward(to_b.normalized() * 3.5 if p.act_t < 0.25 else Vector2.ZERO, 18.0 * dt)
			if to_b.length() > 0.1:
				p.facing = PlayerSim._rotate_towards(p.facing, to_b.normalized(), 14.0 * dt)
		_:
			p.vel = p.vel.move_toward(Vector2.ZERO, 10.0 * dt)
	p.advance_gait(dt)


func _collide_players() -> void:
	var n := players.size()
	for i in n:
		var a := players[i]
		for j in range(i + 1, n):
			var b := players[j]
			var d := b.pos - a.pos
			var dist := d.length()
			if dist >= 0.68 or dist < 1e-6:
				continue
			var nrm := d / dist
			var ma := 70.0 + 30.0 * PlayerSim.q(a.strength)
			var mb := 70.0 + 30.0 * PlayerSim.q(b.strength)
			var overlap := 0.68 - dist
			a.pos -= nrm * (overlap * mb / (ma + mb))
			b.pos += nrm * (overlap * ma / (ma + mb))
			var vrel := (b.vel - a.vel).dot(nrm)
			if vrel >= 0.0:
				continue
			var imp := -1.1 * vrel / (1.0 / ma + 1.0 / mb)
			a.vel -= nrm * (imp / ma)
			b.vel += nrm * (imp / mb)
			# a hard bump can knock the weaker player off the ball
			if -vrel > 4.0 and a.team != b.team and (owner == a.id or owner == b.id):
				var carrier := a if owner == a.id else b
				var other := b if carrier == a else a
				var x := (-vrel - 4.5) * 0.8 + 2.0 * (PlayerSim.q(other.strength) - PlayerSim.q(carrier.strength))
				if rng.randf() < 0.35 / (1.0 + exp(-x)):
					_loose(Vector3(carrier.vel.x * 0.6 + rng.randf_range(-1.5, 1.5), 0, carrier.vel.y * 0.6 + rng.randf_range(-1.5, 1.5)))
					carrier.immune = 0.4
					emit("bump", {"pid": carrier.id})


# ------------------------------------------------------------------ ball control

func _loose(v: Vector3) -> void:
	owner = -1
	in_hands = false
	ball.vel = v
	ball.spin = Vector3.ZERO
	ball.pos.y = maxf(ball.pos.y, BallPhysics.RADIUS)
	pass_to = -1
	loose_t = 0.0


func _set_owner(p: PlayerSim) -> void:
	owner = p.id
	drib = {}
	last_touch = p.id
	if last_team != p.team:
		emit("possession", {"team": p.team, "pid": p.id})
		if last_team >= 0:
			add_momentum(last_team, -0.03)
	last_team = p.team
	possession_team = p.team
	pass_to = -1
	shot_by = -1


## Shielding: the carrier on close control (or an AI carrier under pressure, standing) turns his back / side to the
## nearest opponent and holds the ball with the body.
func _update_shield() -> void:
	for p in players:
		p.shielding = false
	if owner < 0 or in_hands:
		return
	var c := players[owner]
	if c.busy():
		return
	var near: PlayerSim = null
	var nd := 2.6
	for o in team_players(1 - c.team):
		var d := o.pos.distance_to(c.pos)
		if d < nd:
			nd = d
			near = o
	if near == null:
		return
	var wants := c.style == PlayerSim.Style.CLOSE if c.human >= 0 else (c.vel.length() < 2.0 and nd < 1.8 and rng.randf() < 0.5)
	if not wants:
		return
	c.shielding = true
	var away := (c.pos - near.pos).normalized()
	c.face_to = away
	c.facing = PlayerSim._rotate_towards(c.facing, (away + c.move.normalized() * 0.5).normalized(), 6.0 * DT)
	c.sprint = 0.0
	c.move = c.move.limit_length(0.45)
	if c.clip == "" and c.anim_cd <= 0.0:
		_clip_for(c, "shield" if c.vel.length() > 0.8 else "shield_idle")
		c.anim_cd = 0.5


## Players setting off or turning sharply get a proper start / turn animation.
func _start_turn_clip(p: PlayerSim) -> void:
	if p.move.length() < 0.5:
		return
	var want := p.move.normalized()
	var spd := p.vel.length()
	var ang := rad_to_deg(p.facing.angle_to(want))
	var name := Moves.move_turn(self, ang, want.dot(-p.facing.orthogonal()) > 0.0, spd)
	if name == "":
		return
	_clip_for(p, name)
	p.anim_cd = 1.2


## The player the ball is coming to starts his reception (chest, thigh, foot...) so it meets the ball on time.
func _anticipate() -> void:
	if owner >= 0 or in_hands or phase != "play":
		return
	var bv := Vector2(ball.vel.x, ball.vel.z)
	if bv.length() < 3.0 or int(time * 60.0) % 3 != 0:
		return
	var cands: Array[PlayerSim] = []
	if pass_to >= 0:
		cands.append(players[pass_to])
	for h in humans:
		if h["pid"] >= 0 and h["pid"] != pass_to:
			cands.append(players[h["pid"]])
	var pts := ball.predict(1.0 / 60.0, 50)
	for p in cands:
		if p.action != "" or p.clip != "" or time - p.planned_trap < 0.8:
			continue
		for i in range(0, pts.size(), 2):
			var t := (i + 1) / 60.0
			var bp := Vector2(pts[i].x, pts[i].z)
			if bp.distance_to(p.pos + p.vel * t + p.facing * 0.3) < 0.75 and pts[i].y < 1.7:
				var clip := Moves.trap(self, p, pts[i].y, bv, p.vel.length())
				var touch: float = clips.get(clip, {}).get("touch", 0.15)
				if t <= touch + 0.04:
					p.play_clip(clip, time + t - touch)
					p.planned_trap = time + t
				break


func _carrier_assist() -> void:
	## the dribbler goes and gets a ball that is out of reach (only when it lies roughly where he wants to go,
	## otherwise the stick wins and the next touch turns the ball)
	if owner < 0 or in_hands:
		return
	var o := players[owner]
	if o.busy():
		return
	if o.human >= 0 and o.move.length() < 0.1:
		# stick released: he stops the ball; if it is already gone a little ahead he steps up to it first
		var r := ball2() + Vector2(ball.vel.x, ball.vel.z) * 0.15 - o.pos
		if r.length() > 0.8:
			o.move = r.normalized() * 0.45
		return
	var rel := ball2() + Vector2(ball.vel.x, ball.vel.z) * 0.2 - o.pos
	var d := rel.length()
	var reach := dribble_lead(o) + 0.6
	if not drib.is_empty() and int(drib.get("pid", -1)) == o.id:
		reach = maxf(reach, 2.3 if o.sprint > 0.5 else 1.2)   # the ball is out in front after a touch: that's fine
	if d < reach:
		return
	var want: Vector2 = o.move.normalized() if o.move.length() > 0.1 else rel.normalized()
	if o.human >= 0 and absf(want.angle_to(rel)) > deg_to_rad(75.0) and d < reach + 0.8:
		return
	var k := clampf((d - reach) / 1.2, 0.0, 0.8)
	o.move = (want * (1.0 - k) + rel.normalized() * k).normalized() * maxf(o.move.length(), 0.8)
	if o.human < 0:
		var bs := Vector2(ball.vel.x, ball.vel.z).length()
		if bs > o.target_speed(true) * 0.95 and d > reach + 0.6:
			o.sprint = 1.0


func dribble_lead(p: PlayerSim) -> float:
	## how far ahead of the body the ball sits between touches
	var s := p.vel.length()
	var bc := PlayerSim.q(p.control) * 0.5 + PlayerSim.q(p.dribbling) * 0.5
	if p.style == PlayerSim.Style.CLOSE or s < 1.0:
		return 0.34
	var sprinting := p.sprint > 0.5 and s > 0.62 * p.top_speed
	if sprinting:
		return 0.5 + 0.06 * s * (1.2 - 0.4 * bc)
	return 0.34 + 0.035 * s * (1.15 - 0.35 * bc)


func _update_ball_control(dt: float) -> void:
	if owner < 0 or in_hands:
		if owner < 0:
			loose_t += dt
			if loose_t > 1.6:
				possession_team = -1
		return
	var o := players[owner]
	if o.action == "kick" or o.action == "throw" or o.action == "skill":
		return
	if o.action in ["fallen", "slide", "gk_dive"]:
		owner = -1
		return
	var bp := ball2()
	var rel := bp - o.pos
	var dist := rel.length()
	if dist > 3.6 or (ball.pos.y > 1.2 and time - o.control_t > 0.7):
		owner = -1   # it got away
		loose_t = 0.0
		return
	var spd := o.vel.length()
	var bv := Vector2(ball.vel.x, ball.vel.z)
	# standing with the ball: keep it under the sole
	if spd < 0.8 and o.move.length() < 0.1:
		if dist < 0.9:
			var target := o.pos + o.facing * 0.36
			var nb := bp.lerp(target, 1.0 - exp(-dt / 0.12))
			ball.pos = Vector3(nb.x, BallPhysics.RADIUS, nb.y)
			ball.vel = Vector3((nb.x - bp.x) / dt, 0, (nb.y - bp.y) / dt) * 0.5
		return
	if ball.pos.y > 0.4:
		return
	# Dribbling (FC numbers): real touches on the stride, the ball rolls free and straight between them.
	# Jogging: a touch every two steps (~2.4 a second), the ball breathes 0.3 - 0.7 m ahead.
	# Sprinting: a knock every five steps (~1.1 s), the ball runs 1.5 - 2 m ahead. Nothing pulls it in between.
	var want: Vector2 = o.move.normalized() if o.move.length() > 0.1 else (o.vel / spd if spd > 0.5 else o.facing)
	var bc := PlayerSim.q(o.control) * 0.5 + PlayerSim.q(o.dribbling) * 0.5
	var sprinting := o.sprint > 0.5 and spd > 0.62 * o.top_speed and o.style != PlayerSim.Style.CLOSE
	var close := o.style == PlayerSim.Style.CLOSE or spd < 2.6

	# mobile feel (FC Mobile / DLS keep the ball near the boot; the console knock-ons read on a phone as the player
	# running away from it): a touch every step while jogging, every second step sprinting
	var n_steps := 1 if close else (2 if sprinting else 1)
	var rate := maxf(o.step_rate(), 2.0)
	var T := float(n_steps) / rate
	var s0 := 0.26 if close else (0.32 if sprinting else 0.28)
	var tgt := o.target_speed(true)
	var v_end := want * tgt + (o.vel - want * tgt) * exp(-T / o.tau)
	var foot_d := (bp - o.foot_point(0.3)).length()
	var ahead := rel.dot(want)
	var mine := not drib.is_empty() and int(drib.get("pid", -1)) == o.id
	var due := not mine or o.steps >= int(drib["next_step"])
	var bdir := bv.normalized() if bv.length() > 0.6 else want
	var turning := absf(bdir.angle_to(want)) > deg_to_rad(28.0) and o.move.length() > 0.1
	var lagging := ahead < s0 * 0.5 or bv.length() < 0.3   # he has caught up with it / run past it
	var reach := 1.4 if turning else 0.95   # a turn is answered by the next touch, not after the ball has run on
	if o.immune <= 0.0 and foot_d < reach and (due or turning or lagging):
		var future := o.pos + (o.vel + v_end) * 0.5 * T
		var contact := future + want * s0
		var need := contact - bp
		var D := maxf(need.length(), 0.05)
		var dirn := need / D
		var pressure := _pressure_on(o)
		var sigma := deg_to_rad(1.0 + 4.0 * (1.0 - bc)) * (1.0 + pressure * 0.8)
		dirn = dirn.rotated(rng.randfn(0.0, sigma))
		# constant deceleration that brings it to the contact point at the next touch, arriving slower than him
		var k_end := 0.8 if sprinting else 0.8   # the ball arrives nearly at his pace: it stays at the boot
		var v_c := v_end.length() * k_end
		var a := maxf(2.0 * (D / T - v_c) / T, 1.2)
		var u0 := D / T + a * T * 0.5
		if sprinting and rng.randf() < 0.03 * (1.3 - bc) * (1.0 + pressure):
			u0 *= 1.25 + rng.randf() * 0.2   # heavy touch
			emit("heavy_touch", {"pid": o.id})
		u0 = minf(u0, 15.0)
		drib = {"pid": o.id, "t0": time, "dir": dirn, "u0": u0, "a": a, "next_step": o.steps + n_steps}
		ball.vel = Vector3(dirn.x * u0, 0, dirn.y * u0)
		ball.spin = Vector3.ZERO
		o.immune = 0.12 if turning else 0.08
		last_touch = o.id
		var turn_deg := rad_to_deg((bv if bv.length() > 0.6 else o.facing).angle_to(want))
		if turning and absf(turn_deg) > 75.0 and spd < 4.5 and o.clip == "" and o.anim_cd <= 0.0:
			var to_right := want.dot(-o.facing.orthogonal()) > 0.0
			_clip_for(o, Moves.ball_turn(self, turn_deg, to_right, spd))
			o.anim_cd = 0.45
		emit("touch", {"pid": o.id, "speed": u0})
	elif mine:
		# between touches the ball just rolls on its line, slowing down

		var el := time - float(drib["t0"])
		var u := maxf(float(drib["u0"]) - float(drib["a"]) * el, 0.0)
		var lim := 0.7 if sprinting else 0.45
		if ahead > lim:
			u = minf(u, spd * 0.7)
		var d0: Vector2 = drib["dir"]
		ball.vel.x = d0.x * u
		ball.vel.z = d0.y * u


func _clip_for(p: PlayerSim, clip: String, delay: float = 0.0) -> void:
	p.play_clip(clip, time + delay)


func _pressure_on(p: PlayerSim) -> float:
	var best := 99.0
	for q in team_players(1 - p.team):
		best = minf(best, (q.pos - p.pos).length())
	return clampf((3.0 - best) / 3.0, 0.0, 1.0)


func _check_receptions() -> void:
	if owner >= 0 or in_hands:
		return
	var bp := ball2()
	var b0 := Vector2(ball_prev.x, ball_prev.z)
	var seg := bp - b0
	var seg2 := seg.length_squared()
	var h := ball.pos.y
	if h > 2.4:
		return
	var best: PlayerSim = null
	var best_score := 1e9
	for p in players:
		if p.immune > 0.0 or p.action in ["kick", "slide", "fallen", "gk_dive", "throw", "celebrate", "gk_hold"]:
			continue
		var reach := 0.6 + 0.15 * PlayerSim.q(p.control) + (0.2 if p.has_ps("intercept") and p.team != last_team else 0.0)
		if p.id != pass_to:
			# not expecting it: a fast ball is harder to get a foot to
			var bs := Vector2(ball.vel.x, ball.vel.z).length()
			reach *= clampf(1.25 - bs / 28.0, 0.45, 1.0)
			if p.team != last_team and time - kick_t < 0.18 and p.pos.distance_to(Vector2(ball_prev.x, ball_prev.z)) < 1.6:
				reach *= 0.5   # right next to the kicker: no time to react
		if p.id == pass_to:
			reach += 0.25   # he is expecting it and stretches for it
		var rp := p.pos + p.facing * 0.25
		var u := clampf((rp - b0).dot(seg) / seg2, 0.0, 1.0) if seg2 > 1e-6 else 1.0
		var d := (b0 + seg * u - rp).length()
		if Vector2(ball.vel.x, ball.vel.z).length() < 5.0:
			# a slow ball beside him: he turns onto it (the reception clip turns him), not only in front
			var u2 := clampf((p.pos - b0).dot(seg) / seg2, 0.0, 1.0) if seg2 > 1e-6 else 1.0
			d = minf(d, (b0 + seg * u2 - p.pos).length() + 0.12)
		if h > 0.7:
			reach = 0.55
		if d > reach:
			continue
		var score := d - (0.3 if p.id == pass_to else 0.0)
		if score < best_score:
			best_score = score
			best = p
	if best == null:
		return
	_receive(best)


func _receive(p: PlayerSim) -> void:
	if _check_offside_touch(p):
		return
	var bvel := Vector2(ball.vel.x, ball.vel.z)
	var vr := (bvel - p.vel).length()
	var h := ball.pos.y
	var was_pass := pass_to >= 0 and players[pass_to].team == p.team and last_team == p.team
	var intercepted := last_team >= 0 and last_team != p.team and kick_t > time - 3.0
	# a first-time pass / shot asked for while the ball was on its way
	var slot := human_slot_of(p)
	var buf: Dictionary = humans[slot]["buffer"] if slot >= 0 else p.act.get("buffer", {})
	if not buf.is_empty() and time - float(buf["t"]) < 0.8 and h < 1.0:
		if slot >= 0:
			humans[slot]["buffer"] = {}
		_set_owner(p)
		_do_kick(p, buf["kind"], buf.get("power", 0.5), buf.get("dir", p.facing), true)
		return
	# heading
	if h > 1.4:
		var dir := p.facing
		if p.team >= 0:
			var to_goal := Vector2(goal_x(p.team), 0) - p.pos
			dir = (to_goal.normalized() + p.facing).normalized() if to_goal.length() < 22.0 else p.facing
		var hs := 6.0 + vr * 0.3 + (6.0 if Vector2(goal_x(p.team), 0).distance_to(p.pos) < 16.0 else 0.0)
		dir = dir.rotated(rng.randfn(0.0, deg_to_rad(5.0 if p.has_ps("aerial") else 10.0)))
		last_touch = p.id
		last_team = p.team
		possession_team = p.team
		ball.vel = Vector3(dir.x * hs, 2.0 + rng.randf() * 2.0, dir.y * hs)
		ball.spin = Vector3.ZERO
		p.immune = 0.35
		p.play_clip("header_jump" if h > 1.9 else "header", time - 0.25)
		emit("header", {"pid": p.id})
		kick_t = time
		if Vector2(goal_x(p.team), 0).distance_to(p.pos) < 16.0:
			shot_by = p.id
			shot_t = time
			stats["shots"][p.team] += 1
		return
	# first touch: most passes are controlled; fast, bouncing or pressed balls are harder
	var fail := 0.12 * pow(vr / 20.0, 2.0) * (1.2 - 0.8 * PlayerSim.q(p.control))
	fail += (0.12 if h > 0.6 else 0.0) + _pressure_on(p) * 0.05 + (0.08 if intercepted else 0.0)
	if p.has_ps("first_touch"):
		fail *= 0.5
	if surging(p.team):
		fail *= 0.7
	var chance := clampf(1.0 - fail, 0.2, 0.99)
	if p.role == "GK" and _in_own_box(p):
		chance = maxf(chance, 0.9)
	if rng.randf() < chance:
		_set_owner(p)
		if was_pass:
			stats["passes_ok"][p.team] += 1
			add_momentum(p.team, 0.04)
		var dir: Vector2 = p.move.normalized() if p.move.length() > 0.2 else (p.vel.normalized() if p.vel.length() > 1.0 else p.facing)
		var keep := p.vel.length() * 0.85 + 0.7 + vr * 0.06 * (1.0 - PlayerSim.q(p.control))
		dir = dir.rotated(rng.randfn(0.0, deg_to_rad(3.0 + 9.0 * (1.0 - PlayerSim.q(p.control))) * (vr / 15.0)))
		if h > 0.35:
			# cushioned on the thigh / chest: it drops in front of him, he takes it on the next touch
			var c := minf(keep, 2.2)
			ball.vel = Vector3(dir.x * c, 0.6 if h > 0.95 else 0.25, dir.y * c)
		else:
			ball.vel = Vector3(dir.x * keep, 0, dir.y * keep)
		ball.spin = Vector3.ZERO
		p.immune = 0.12
		p.control_t = time
		# the reception clip, met at its contact frame (unless one was started in anticipation)
		if absf(time - p.planned_trap) > 0.3 or p.clip == "":
			var tc := Moves.trap(self, p, h, bvel, p.vel.length())
			var tinfo: Dictionary = clips.get(tc, {})
			p.play_clip(tc, time - float(tinfo.get("touch", 0.15)) * 0.85)
		emit("control", {"pid": p.id, "intercept": intercepted})
	else:
		# bad touch: it bounces off
		var away := (ball2() - p.pos).normalized()
		var v := bvel * 0.3 + away * (vr * 0.25 + 1.0) + Vector2(rng.randf_range(-1.5, 1.5), rng.randf_range(-1.5, 1.5))
		ball.vel = Vector3(v.x, maxf(0.0, ball.vel.y * 0.3) + rng.randf() * 1.0, v.y)
		last_touch = p.id
		last_team = p.team
		p.immune = 0.35
		pass_to = -1
		emit("miscontrol", {"pid": p.id})


func _in_own_box(p: PlayerSim) -> bool:
	return pitch.in_box(p.pos.x, p.pos.y, -attack_dir(p.team))


# ------------------------------------------------------------------ actions

func _update_actions(dt: float) -> void:
	for p in players:
		if p.action == "":
			continue
		p.act_t += dt
		match p.action:
			"kick":
				_update_kick(p)
			"tackle":
				_update_tackle(p)
			"slide":
				_update_slide(p)
			"gk_dive":
				_update_dive(p)
			"throw":
				if p.act_t >= p.act.get("contact", 0.4) and not p.act.get("done", false):
					p.act["done"] = true
					_do_kick(p, p.act["kind"], p.act.get("power", 0.5), p.act.get("dir", p.facing), false)
		if p.act_t >= p.act_dur:
			if p.action == "skill":
				Skills.finish(self, p)
			if p.action == "slide":
				p.start_action("fallen", 0.55)
				_clip_for(p, "getup_front")
				continue
			if p.action == "gk_hold":
				continue
			p.action = ""
			p.act = {}


func request_kick(p: PlayerSim, kind: String, power: float, dir: Vector2) -> bool:
	## Ask for a pass / through / lob / cross / shot / clear. Works with the ball at the feet or close to them.
	if p.busy() and p.action != "gk_hold":
		return false
	if p.action == "gk_hold":
		p.action = ""
		_throw_or_punt(p, kind, power, dir)
		return true
	var d := (ball2() - p.pos).length()
	if owner != p.id and (d > 1.6 or ball.pos.y > 1.3):
		return false
	var spd := p.vel.length()
	var aim := dir if dir.length() > 0.1 else p.facing
	if kind.begins_with("shot"):
		aim = (Vector2(goal_x(p.team), 0) - p.pos).normalized()
	var clip := Moves.kick(self, p, kind.trim_suffix("_low"), spd, aim)
	if clip == "":
		clip = _kick_clip(kind.trim_suffix("_low"), spd)
	var info: Dictionary = clips.get(clip, {})
	var touch: float = info.get("touch", 0.15)
	var contact := clampf(touch, 0.08, 0.3)
	p.start_action("kick", contact + 0.35, {"kind": kind, "power": power, "dir": dir, "contact": contact})
	p.play_clip(clip, time + contact - touch, 1.0)
	return true


func _kick_clip(kind: String, spd: float) -> String:
	match kind:
		"shot":
			if spd > 5.0:
				return "shot_sprint"
			return "shot_walk" if spd > 1.2 else "shot_idle"
		"lob", "cross", "clear":
			if kind == "cross" and spd > 4.0:
				return "cross"
			return "lob_long" if spd > 2.0 else "lob_idle"
		_:
			if spd > 5.5:
				return "pass_sprint"
			if spd > 2.5:
				return "pass_run"
			return "pass_walk" if spd > 0.6 else "pass_idle"


func _update_kick(p: PlayerSim) -> void:
	if p.act.get("done", false):
		return
	var contact: float = p.act["contact"]
	if p.act_t < contact:
		return
	var d := (ball2() - p.foot_point(0.4)).length()
	if d < 1.05 and ball.pos.y < 1.3:
		p.act["done"] = true
		_do_kick(p, p.act["kind"], p.act["power"], p.act["dir"], false)
	elif p.act_t > contact + 0.45:
		p.action = ""   # whiffed: the ball ran away
		p.clip = ""


func _do_kick(p: PlayerSim, kind: String, power: float, dir: Vector2, first_time: bool) -> void:
	var from := ball.pos
	from.y = maxf(from.y, BallPhysics.RADIUS)
	var pressure := _pressure_on(p)
	var body := absf(p.facing.angle_to(dir)) / PI if dir.length() > 0.1 else 0.0
	var err_mult := (1.0 + pressure * 0.6 + body * 0.8) * (1.35 if first_time else 1.0)
	if p.human < 0:
		err_mult *= lerpf(1.6, 0.85, difficulty)
	err_mult *= float(sliders.get("shot_error", 1.0)) if kind.begins_with("shot") else 1.0
	if surging(p.team):
		err_mult *= 0.75
	if p.has_ps("incisive") and not kind.begins_with("shot"):
		err_mult *= 0.6
	if p.has_ps("finesse") and kind == "shot" and power < 0.7:
		err_mult *= 0.7
	var v := Vector3.ZERO
	var w := Vector3.ZERO
	var receiver: PlayerSim = null
	match kind:
		"pass", "through":
			receiver = pick_receiver(p, dir, kind == "through")
			var target: Vector2
			var T: float
			if receiver == null:
				var fwd := dir if dir.length() > 0.1 else p.facing
				target = Vector2(from.x, from.z) + fwd.normalized() * (10.0 + 14.0 * power)
				T = 1.0
			elif kind == "through":
				var run_dir := receiver.vel.normalized() if receiver.vel.length() > 2.0 else Vector2(attack_dir(p.team), 0)
				run_dir = (run_dir + Vector2(attack_dir(p.team), 0) * 0.6).normalized()
				target = receiver.pos + run_dir * (3.0 + 8.0 * power) + receiver.vel * 0.3
				T = maxf(0.6, receiver.pos.distance_to(target) / (receiver.top_speed * 0.92) + 0.25)
			else:
				var dist0 := Vector2(from.x, from.z).distance_to(receiver.pos)
				var t_est := dist0 / _pass_speed(dist0, power)
				target = receiver.pos + receiver.vel * t_est * 0.75
				T = Vector2(from.x, from.z).distance_to(target) / _pass_speed(Vector2(from.x, from.z).distance_to(target), power)
			target.x = clampf(target.x, -pitch.half_l() + 0.5, pitch.half_l() - 0.5)
			target.y = clampf(target.y, -pitch.half_w() + 0.5, pitch.half_w() - 0.5)
			var dd := Vector2(from.x, from.z).distance_to(target)
			var u := minf(BallPhysics.solve_roll_speed(dd, T), 31.0)
			var acc := PlayerSim.q(p.short_pass) if dd < 30.0 else PlayerSim.q(p.long_pass)
			var hd := (target - Vector2(from.x, from.z)).normalized()
			hd = hd.rotated(rng.randfn(0.0, deg_to_rad(1.2 + 3.5 * (1.0 - acc)) * err_mult))
			u *= 1.0 + rng.randfn(0.0, 0.03 + 0.05 * (1.0 - acc)) * err_mult
			v = Vector3(hd.x * u, 0.4, hd.y * u)
			pass_to = receiver.id if receiver else -1
			stats["passes"][p.team] += 1
			_mark_offside(p)
		"lob", "cross", "clear":
			receiver = pick_receiver(p, dir, false, true) if kind != "clear" else null
			var target2: Vector2
			if receiver:
				target2 = receiver.pos + receiver.vel * 0.9 + (Vector2(attack_dir(p.team), 0) * 2.0 * power if kind == "lob" else Vector2.ZERO)
			else:
				var fwd2 := dir if dir.length() > 0.1 else Vector2(attack_dir(p.team), 0)
				target2 = Vector2(from.x, from.z) + fwd2.normalized() * (25.0 + 25.0 * power)
			target2.x = clampf(target2.x, -pitch.half_l() + 1.0, pitch.half_l() - 1.0)
			target2.y = clampf(target2.y, -pitch.half_w() + 1.0, pitch.half_w() - 1.0)
			var dist2 := Vector2(from.x, from.z).distance_to(target2)
			var angle := deg_to_rad(lerpf(24.0, 38.0, clampf(dist2 / 45.0, 0.0, 1.0)))
			var hd2 := (target2 - Vector2(from.x, from.z)).normalized()
			w = Vector3(hd2.y, 0, -hd2.x) * -12.0   # backspin (axis to the kicker's left, turning back)
			var tt := [0.0]
			var u2 := minf(BallPhysics.solve_lofted_speed(from, target2, 1.2 if kind == "cross" else 0.6, angle, w, tt), 30.0)
			var acc2 := PlayerSim.q(p.long_pass)
			hd2 = hd2.rotated(rng.randfn(0.0, deg_to_rad(1.5 + 4.0 * (1.0 - acc2)) * err_mult))
			u2 *= 1.0 + rng.randfn(0.0, 0.03 + 0.05 * (1.0 - acc2)) * err_mult
			v = Vector3(hd2.x * u2 * cos(angle), u2 * sin(angle), hd2.y * u2 * cos(angle))
			pass_to = receiver.id if receiver else -1
			if kind != "clear":
				stats["passes"][p.team] += 1
			_mark_offside(p)
		"shot", "shot_low":
			var gx := goal_x(p.team)
			var to_goal := Vector2(gx, 0) - Vector2(from.x, from.z)
			var gw := pitch.goal_width * 0.5
			# aim across the goal by the stick (assisted toward the corners), height from power
			var side := 0.0
			if dir.length() > 0.2:
				var rel := to_goal.normalized().orthogonal()
				side = clampf(dir.normalized().dot(rel) * 1.6, -1.0, 1.0)
			else:
				var gk := keeper_of(1 - p.team)
				side = -signf(gk.pos.y - from.z) if gk else (1.0 if rng.randf() < 0.5 else -1.0)
				if side == 0.0:
					side = 1.0
			var aim_z := (to_goal.normalized().orthogonal() * side * gw * 0.72).y
			var aim := Vector3(gx, 0.25 + power * power * 1.55, aim_z)
			if kind == "shot_low":
				aim.y = 0.18 + power * 0.25   # low driven: hard and along the ground
			var dist3 := to_goal.length()
			if dist3 > 25.0:
				aim.y += 0.3
			var speed := (19.5 + 13.5 * PlayerSim.q(p.power)) * (0.55 + 0.45 * power)
			var curl := (1.0 - power) * 18.0 * PlayerSim.q(p.curve) * -side
			if kind == "shot_low":
				speed = maxf(speed, 22.0 + 6.0 * PlayerSim.q(p.power))
				curl = 0.0
			if p.has_ps("power_shot"):
				speed *= 1.08
			if p.has_ps("finesse"):
				curl *= 1.3
			w = Vector3(0, curl, 0)
			v = BallPhysics.solve_aim(from, aim, speed, w)
			var fin := PlayerSim.q(p.finishing)
			var sig := deg_to_rad(1.0 + 3.5 * (1.0 - fin)) * (0.75 + power * 0.9) * err_mult * (1.0 + clampf((dist3 - 16.0) / 20.0, 0.0, 1.0))
			var hv := Vector2(v.x, v.z).rotated(rng.randfn(0.0, sig))
			v = Vector3(hv.x, v.y + rng.randfn(0.0, sig * speed * 0.6), hv.y)
			shot_by = p.id
			shot_t = time
			stats["shots"][p.team] += 1
			add_momentum(p.team, 0.07)
			pass_to = -1
	ball.vel = v
	ball.spin = w
	ball.pos = from
	owner = -1
	in_hands = false
	last_touch = p.id
	last_team = p.team
	possession_team = p.team
	pass_t = time
	kick_t = time
	loose_t = 0.0
	p.immune = 0.3
	emit("kick", {"pid": p.id, "kind": kind, "speed": v.length(), "receiver": receiver.id if receiver else -1})


func _pass_speed(d: float, power: float) -> float:
	var s := 16.1
	for i in 3:
		if d <= PASS_DIST[i + 1]:
			var t := clampf((d - PASS_DIST[i]) / (PASS_DIST[i + 1] - PASS_DIST[i]), 0.0, 1.0)
			s = lerpf(PASS_SPEED[i], PASS_SPEED[i + 1], t)
			break
	if d < PASS_DIST[0]:
		s = PASS_SPEED[0]
	var k := (0.94 if style == "authentic" else 1.05) * float(sliders.get("pass_speed", 1.0))
	return s * PASS_TEMPO * (0.9 + 0.25 * power) * k


## The teammate a pass goes to: the stick direction decides, distance and how open he is break ties.
func pick_receiver(p: PlayerSim, dir: Vector2, through: bool, lofted: bool = false) -> PlayerSim:
	var best: PlayerSim = null
	var best_score := -1e9
	var fwd := dir.normalized() if dir.length() > 0.2 else p.facing
	for q in team_players(p.team):
		if q == p or q.role == "GK" and not lofted and (q.pos - p.pos).length() > 25.0:
			continue
		if q == p:
			continue
		var rel := q.pos - p.pos
		var d := rel.length()
		if d < 2.0:
			continue
		var ang := absf(fwd.angle_to(rel))
		if ang > deg_to_rad(80.0):
			continue
		var score := -ang * 3.2 - d * (0.035 if not lofted else 0.01)
		score += _openness(q, p) * 0.6
		if through:
			score += (q.pos.x - p.pos.x) * attack_dir(p.team) * 0.03
		if score > best_score:
			best_score = score
			best = q
	return best


func _openness(q: PlayerSim, from: PlayerSim) -> float:
	## 0 marked tight .. 1 free: distance from the nearest opponent and from the pass line
	var mind := 99.0
	var a := from.pos
	var b := q.pos
	var ab := b - a
	var l2 := ab.length_squared()
	var lane := 99.0
	for o in team_players(1 - q.team):
		mind = minf(mind, (o.pos - q.pos).length())
		var t := clampf((o.pos - a).dot(ab) / l2, 0.0, 1.0) if l2 > 0.01 else 0.0
		lane = minf(lane, (a + ab * t - o.pos).length())
	return clampf(mind / 5.0, 0.0, 1.0) * 0.6 + clampf(lane / 3.0, 0.0, 1.0) * 0.4


# --- tackles

func request_tackle(p: PlayerSim) -> bool:
	if p.busy() or p.fooled > 0.0:
		return false
	p.start_action("tackle", 0.5, {"contact": 0.2})
	_clip_for(p, "tackle")
	return true


func request_slide(p: PlayerSim) -> bool:
	if p.busy() or p.fooled > 0.0:
		return false
	var dir := p.facing
	var to_ball := ball2() + Vector2(ball.vel.x, ball.vel.z) * 0.25 - p.pos
	if to_ball.length() < 7.0:
		dir = to_ball.normalized()
	p.facing = dir
	p.vel = dir * maxf(p.vel.length(), 6.5)
	p.start_action("slide", 0.85, {})
	_clip_for(p, "slide")
	emit("slide", {"pid": p.id})
	return true


func _update_tackle(p: PlayerSim) -> void:
	if p.act.get("done", false) or p.act_t < p.act["contact"]:
		return
	p.act["done"] = true
	var reach := 0.95 + 0.25 * PlayerSim.q(p.tackling) + (0.35 if p.human >= 0 else 0.0) + (0.25 if p.has_ps("intercept") else 0.0)
	var d := (ball2() - p.foot_point(0.5)).length()
	if d > reach or ball.pos.y > 0.7:
		_maybe_foul(p, 0.14)
		return
	var c: PlayerSim = players[owner] if owner >= 0 else null
	var win := 0.85
	if c and c.team != p.team:
		var shield := clampf(1.0 - (ball2() - c.pos).length() / 1.2, 0.0, 1.0)
		win = 0.5 + 0.45 * (PlayerSim.q(p.tackling) - PlayerSim.q(c.dribbling) * 0.6 - PlayerSim.q(c.strength) * 0.2) - shield * 0.25
		if c.has_ps("press_proven"):
			win -= 0.1
		if c.shielding:
			# side-on with the body between ball and tackler: only a strong, well-timed challenge gets it
			win -= 0.22 - 0.12 * (PlayerSim.q(p.strength) - PlayerSim.q(c.strength))
		if p.human >= 0:
			win += 0.08
		win = clampf(win, 0.15, 0.9)
	if rng.randf() < win:
		if rng.randf() < 0.55:
			_set_owner(p)
			var keep := p.facing
			ball.vel = Vector3(keep.x * 2.5, 0, keep.y * 2.5)
		else:
			var poke := p.facing.rotated(rng.randf_range(-0.8, 0.8)) * rng.randf_range(4.0, 8.0)
			_loose(Vector3(poke.x, 0.2, poke.y))
			last_touch = p.id
			last_team = p.team
		if c:
			c.immune = 0.45
		emit("tackle_won", {"pid": p.id})
		add_momentum(p.team, 0.06)
	else:
		emit("tackle_lost", {"pid": p.id})
		_maybe_foul(p, 0.3)


func _update_slide(p: PlayerSim) -> void:
	if p.act.get("done", false) or p.act_t < 0.1 or p.act_t > 0.6:
		return
	var tip := p.pos + p.facing * 0.9
	if (ball2() - tip).length() < 0.85 and ball.pos.y < 0.6:
		p.act["done"] = true
		var dir := p.facing.rotated(rng.randf_range(-0.6, 0.6))
		var s := maxf(p.vel.length(), 4.0) + rng.randf_range(1.0, 5.0)
		_loose(Vector3(dir.x * s, 0.3, dir.y * s))
		last_touch = p.id
		last_team = p.team
		emit("tackle_won", {"pid": p.id, "slide": true})
		return
	for q in team_players(1 - p.team):
		if (q.pos - tip).length() < 0.6 and q.action != "fallen":
			p.act["done"] = true
			_foul(p, q)
			return


func _maybe_foul(p: PlayerSim, chance: float) -> void:
	for q in team_players(1 - p.team):
		if (q.pos - p.foot_point(0.6)).length() < 0.8 and rng.randf() < chance:
			_foul(p, q)
			return


func _foul(by: PlayerSim, on: PlayerSim) -> void:
	_card(by, on)
	on.start_action("fallen", 1.0)
	_clip_for(on, Moves.fall(rng, on.vel.length()))
	emit("foul", {"pid": by.id, "on": on.id})
	var spot := on.pos
	var t := on.team
	if pitch.in_box(spot.x, spot.y, attack_dir(t)):
		_begin_restart("penalty", t, Vector2(attack_dir(t) * (pitch.half_l() - pitch.penalty_spot), 0))
	else:
		_begin_restart("free_kick", t, spot)


# --- keepers

## The referee's card: reckless slides and fouls from behind are booked; a second yellow or a last-man foul is red.
func _card(by: PlayerSim, on: PlayerSim) -> void:
	if mode != "match":
		return
	var behind := by.facing.dot(on.facing) > 0.5   # both facing the same way: from behind
	var slide := by.action == "slide"
	var last_man := on.team != by.team and absf(on.pos.x - goal_x(on.team)) < 30.0 and _defenders_behind(on) <= 1
	var p_yellow := 0.22 + (0.38 if slide else 0.0) + (0.25 if behind else 0.0)
	var p_red := (0.08 if slide and behind else 0.0) + (0.5 if last_man and slide else 0.0)
	if by.role == "GK":
		p_red *= 0.3
	var r := rng.randf()
	if r < p_red:
		_send_off(by, "red")
	elif r < p_red + p_yellow:
		by.cards += 1
		if by.cards >= 2:
			_send_off(by, "second_yellow")
		else:
			emit("card", {"pid": by.id, "color": "yellow"})


func _defenders_behind(attacker: PlayerSim) -> int:
	var n := 0
	var gx := goal_x(attacker.team)
	for o in team_players(1 - attacker.team):
		if absf(o.pos.x - gx) < absf(attacker.pos.x - gx):
			n += 1
	return n


func _send_off(p: PlayerSim, why: String) -> void:
	p.sent_off = true
	emit("card", {"pid": p.id, "color": "red", "why": why})
	parked[p.id] = Vector2(-60.0 + p.id * 2.0, -pitch.half_w() - 30.0)
	p.pos = parked[p.id]
	for h in humans:
		if h["pid"] == p.id:
			_give_human(h, _nearest_to_ball(h["team"], p.id))


func _check_keepers() -> void:
	## any ball flying at a goal (shot, deflection, mishit, back-pass gone wrong) gets the keeper's reaction
	gk_eval_cd -= DT
	if in_hands or owner >= 0 or gk_eval_cd > 0.0:
		return
	var bvh := Vector2(ball.vel.x, ball.vel.z)
	if bvh.length() < 7.0 or absf(ball.vel.x) < 2.0:
		return
	var gx := signf(ball.vel.x) * pitch.half_l()
	if absf(gx - ball.pos.x) > 40.0:
		return
	var t := 0 if is_equal_approx(goal_x(1), gx) else 1   # the team defending that goal
	var gk := keeper_of(t)
	if gk == null or gk.action in ["gk_dive", "gk_hold"] or pass_to == gk.id:
		return
	var react := 0.26 - 0.1 * PlayerSim.q(gk.gk_reflex)
	if time - kick_t < react:
		return
	# where the ball crosses the goal line
	var pts := ball.predict(1.0 / 60.0, 90)
	var cross := Vector3.ZERO
	var tc := -1.0
	var tk := -1.0
	var at_k := Vector3.ZERO
	var gk_depth := absf(gk.pos.x) - 0.25
	for i in pts.size():
		if tk < 0.0 and absf(pts[i].x) >= gk_depth and signf(pts[i].x) == signf(gx):
			tk = (i + 1) / 60.0
			at_k = pts[i]
		if absf(pts[i].x) >= pitch.half_l() - 0.3 and signf(pts[i].x) == signf(gx):
			cross = pts[i]
			tc = (i + 1) / 60.0
			break
	if tc < 0.0:
		gk_eval_cd = 0.08
		return
	if absf(cross.z) > pitch.goal_width * 0.5 + 0.6 or cross.y > pitch.goal_height + 0.4:
		gk_eval_cd = 0.15   # going wide: let it go (looked at again in a moment, in case it bends)
		return
	if absf(gk.pos.x - gx) > 9.0:
		return   # caught out of his goal: nothing to dive at
	# the ball is met where it passes the keeper (he stands off his line), not at the line itself
	if tk > 0.0 and absf(ball.pos.x) < gk_depth:
		tc = tk
		cross = at_k
	var lateral := cross.z - gk.pos.y
	var reach := (0.3 if gk.has_ps("far_reach") else 0.0) + 1.2 + 1.8 * PlayerSim.q(gk.gk_diving) * clampf(tc / 0.45, 0.35, 1.0) + 2.5 * maxf(0.0, tc - 0.3)
	var need := absf(lateral) + maxf(0.0, cross.y - 2.2)
	var speed := ball.vel.length()
	var save := need <= reach
	var p_save := 0.0
	if save:
		p_save = clampf(0.99 - 0.016 * maxf(0.0, speed - 16.0) - 0.26 * pow(need / reach, 2.0) + 0.18 * (PlayerSim.q(gk.gk_reflex) - 0.6), 0.05, 0.97)
	var saved := save and rng.randf() < p_save
	var catch := saved and speed < 21.0 and need < 1.1 and rng.randf() < 0.35 + 0.5 * PlayerSim.q(gk.gk_handling)
	var height := cross.y
	var clip := "gk_catch_chest"
	if absf(lateral) > 0.9:
		clip = "gk_dive_low" if height < 0.7 else ("gk_dive_mid" if height < 1.5 else "gk_dive_high")
		# the clips dive to the keeper's left (+ his facing's left); mirror for the other side
		var left := gk.facing.orthogonal()
		var to := Vector2(0, lateral)
		if to.dot(left) < 0.0:
			clip += "_m"
	else:
		clip = "gk_catch_low" if height < 0.4 else ("gk_catch_knee" if height < 0.8 else ("gk_catch_chest" if height < 1.6 else "gk_catch_high"))
	var dive_v := Vector2(0, lateral).normalized() * minf(absf(lateral), 2.4) / maxf(tc, 0.25) if absf(lateral) > 0.3 else Vector2.ZERO
	gk.start_action("gk_dive", maxf(0.9, tc + 0.5), {"tc": tc, "saved": saved, "catch": catch, "dive_vel": dive_v * 1.6})
	var info: Dictionary = clips.get(clip.trim_suffix("_m"), {})
	var touch: float = info.get("touch", 0.3)
	gk.play_clip(clip, time + tc - touch)
	shot_by = -1


func _update_dive(p: PlayerSim) -> void:
	if p.act.get("done", false) or p.act_t < p.act["tc"] - 0.02:
		return
	p.act["done"] = true
	var t := p.team
	var near := (ball2() - p.pos).length() < 4.2 and absf(ball.pos.x) > pitch.half_l() - 8.0
	if not p.act["saved"] or not near:
		return
	if p.act["catch"]:
		_catch(p)
	else:
		# parry: away from goal and to the side
		var out := Vector2(-signf(ball.pos.x), signf(ball.pos.z - p.pos.y) * rng.randf_range(0.6, 1.4)).normalized()
		var s := ball.vel.length() * rng.randf_range(0.25, 0.4)
		ball.vel = Vector3(out.x * s, rng.randf_range(1.5, 4.0), out.y * s)
		ball.spin = Vector3.ZERO
		last_touch = p.id
		last_team = t
		emit("save", {"pid": p.id, "catch": false})
		add_momentum(t, 0.05)
		stats["on_target"][1 - t] += 1


func _catch(p: PlayerSim) -> void:
	owner = p.id
	in_hands = true
	last_touch = p.id
	last_team = p.team
	possession_team = p.team
	pass_to = -1
	shot_by = -1
	p.start_action("gk_hold", 99.0, {"since": time})
	emit("save", {"pid": p.id, "catch": true})
	if kick_t > time - 3.0:
		stats["on_target"][1 - p.team] += 1


func _hold_ball() -> void:
	var p := players[owner]
	ball.pos = Vector3(p.pos.x + p.facing.x * 0.3, 1.05, p.pos.y + p.facing.y * 0.3)
	ball.vel = Vector3(p.vel.x, 0, p.vel.y)
	ball.spin = Vector3.ZERO


func _throw_or_punt(p: PlayerSim, kind: String, power: float, dir: Vector2) -> void:
	in_hands = false
	owner = p.id
	ball.pos = Vector3(p.pos.x + p.facing.x * 0.5, 0.11 if kind == "pass" else 1.0, p.pos.y + p.facing.y * 0.5)
	if kind == "pass" or kind == "through":
		p.start_action("throw", 0.6, {"kind": "pass", "power": power, "dir": dir, "contact": 0.3})
		_clip_for(p, "gk_throw")
	else:
		_do_kick(p, "clear" if kind != "lob" else "lob", maxf(power, 0.6), dir, false)
		_clip_for(p, "lob_idle")


# ------------------------------------------------------------------ humans

func _update_humans(dt: float) -> void:
	## FC-style assisted auto switching: the ball carrier when we have it, the receiver of our pass, and when
	## defending the best-placed man (nearest to where the ball is going, goal side counts) - even while the stick
	## is busy if the current man is clearly out of the play.
	for h in humans:
		h["switch_cd"] = maxf(0.0, h["switch_cd"] - dt)
		var cur: PlayerSim = players[h["pid"]] if h["pid"] >= 0 else null
		var t: int = h["team"]
		var owner_team := players[owner].team if owner >= 0 else -1
		var lost_now: bool = owner_team >= 0 and owner_team != t and int(h.get("seen_team", -1)) == t
		if owner_team >= 0:
			h["seen_team"] = owner_team
		# our player has the ball: always him
		if owner_team == t and (cur == null or cur.id != owner):
			_give_human(h, players[owner])
			continue
		# a pass from us: take the receiver when the ball is on its way
		if pass_to >= 0 and players[pass_to].team == t and cur and cur.id != pass_to and time - pass_t > 0.12:
			_give_human(h, players[pass_to])
			continue
		if cur == null or parked.has(cur.id):
			_give_human(h, _nearest_to_ball(t, -1))
			continue
		if owner_team == t:
			continue
		# defending or a loose ball
		var aim := _ball_target()
		var best := _best_defender(t, aim)
		if best == null or best == cur:
			continue
		var dc := cur.pos.distance_to(aim)
		var db := best.pos.distance_to(aim)
		var idle := cur.move.length() < 0.2
		var go := false
		if lost_now and dc > 3.5 and db < dc - 1.5:
			go = true                                   # just lost it: straight to the man who can win it back
		elif h["switch_cd"] <= 0.0:
			if idle and dc > 10.0 and db < dc * 0.6:
				go = true
			elif dc > 18.0 and db < dc * 0.55:
				go = true                               # he is out of the play: hand over even mid-run
		if go:
			_give_human(h, best)
			h["switch_cd"] = 0.9


## Where the ball is going: its landing spot when in the air, a little ahead when rolling.
func _ball_target() -> Vector2:
	var b := ball2()
	var v := Vector2(ball.vel.x, ball.vel.z)
	if ball.pos.y > 1.0:
		var g := 9.81
		var tl := (ball.vel.y + sqrt(maxf(ball.vel.y * ball.vel.y + 2.0 * g * ball.pos.y, 0.0))) / g
		return b + v * clampf(tl, 0.0, 3.0)
	return b + v * 0.4


func _best_defender(t: int, aim: Vector2) -> PlayerSim:
	var own_goal := Vector2(-attack_dir(t) * pitch.half_l(), 0)
	var best: PlayerSim = null
	var bv := 1e9
	for p in team_players(t):
		if p.role == "GK" or parked.has(p.id) or p.action in ["fallen", "slide"]:
			continue
		var d := p.pos.distance_to(aim)
		# goal side of the ball is worth a few metres
		var goal_side := (aim - p.pos).dot((aim - own_goal).normalized()) > 0.0
		var v := d - (3.0 if goal_side else 0.0)
		if v < bv:
			bv = v
			best = p
	return best


func _give_human(h: Dictionary, p: PlayerSim) -> void:
	if p == null:
		return
	if h["pid"] >= 0:
		players[h["pid"]].human = -1
	h["pid"] = p.id
	p.human = humans.find(h)
	h["switch_cd"] = 0.6


func human_press(slot: int, dt: float) -> void:
	## held 'pressure': the player closes the carrier down by himself and tackles when the ball is there to win
	var h: Dictionary = humans[slot]
	if h["pid"] < 0 or owner < 0:
		return
	var p := players[h["pid"]]
	var c := players[owner]
	if c.team == p.team or p.busy():
		return
	var own_goal := Vector2(-attack_dir(p.team) * pitch.half_l(), 0)
	var contain := c.pos + c.vel * 0.2 + (own_goal - c.pos).normalized() * 0.9
	var d := contain - p.pos
	if d.length() > 0.3:
		p.move = d.normalized()
		p.sprint = 1.0 if d.length() > 4.0 else 0.0
	if (ball2() - p.foot_point(0.5)).length() < 1.0 and rng.randf() < 3.0 * dt:
		request_tackle(p)


func human_switch(slot: int, dir: Vector2) -> void:
	## switch to the teammate nearest the ball (or the one the stick points at)
	var h: Dictionary = humans[slot]
	var t: int = h["team"]
	var cur: int = h["pid"]
	var best: PlayerSim = null
	var bd := 1e9
	for p in team_players(t):
		if p.id == cur or p.role == "GK" and ball2().distance_to(p.pos) > 20.0 or parked.has(p.id):
			continue
		var d := p.pos.distance_to(ball2() + Vector2(ball.vel.x, ball.vel.z) * 0.3)
		if dir.length() > 0.5 and cur >= 0:
			var rel := p.pos - players[cur].pos
			d += absf(dir.angle_to(rel)) * 6.0
		if d < bd:
			bd = d
			best = p
	_give_human(h, best)
	h["switch_cd"] = 1.4


func _nearest_to_ball(t: int, exclude: int) -> PlayerSim:
	var best: PlayerSim = null
	var bd := 1e9
	for p in team_players(t):
		if p.id == exclude or p.role == "GK" or parked.has(p.id):
			continue
		var d := p.pos.distance_to(ball2())
		if d < bd:
			bd = d
			best = p
	return best


## Start a skill move. side: +1 to the dribbler's right, -1 left.
func request_skill(p: PlayerSim, id: String, side: float) -> bool:
	if owner != p.id or in_hands or p.busy() or phase != "play":
		return false
	var inf := Skills.info(id)
	if inf.is_empty():
		return false
	var spd := p.vel.length()
	var f0 := p.vel / spd if spd > 0.8 else p.facing
	var stars: int = inf["stars"]
	var botch := p.skill_moves < stars and rng.randf() < 0.18 * (stars - p.skill_moves)
	p.start_action("skill", inf["dur"] * (1.0 if p.skill_moves >= stars else 1.15), {"id": id, "side": side, "f0": f0, "spd0": spd, "botch": botch})
	match id:
		"dragback":
			_clip_for(p, "turn180_ball" if side > 0.0 else "turn180_ball_m")
		"cruyff":
			_clip_for(p, "turn90_ball" if side > 0.0 else "turn90_ball_m")
		"fakeshot":
			_clip_for(p, "shot_walk_m" if p.left_footed else "shot_walk", 0.0)
			p.clip_speed = 1.15
		"rainbow":
			_clip_for(p, "pass_back")
		"burst":
			_clip_for(p, "touch_sprint")
	var fooled := Skills.fool_defenders(self, p, id, side)
	emit("skill", {"pid": p.id, "id": id, "fooled": fooled})
	if fooled > 0:
		add_momentum(p.team, 0.1 if pitch.walls else 0.05)
	return true


## Put the ball at a player's feet, in open play (practice set-ups).
func give_ball(p: PlayerSim) -> void:
	phase = "play"
	phase_t = 0.0
	ball.pos = Vector3(p.pos.x + p.facing.x * 0.4, BallPhysics.RADIUS, p.pos.y + p.facing.y * 0.4)
	ball.vel = Vector3.ZERO
	ball.spin = Vector3.ZERO
	in_hands = false
	_set_owner(p)
	for h in humans:
		if h["team"] == p.team:
			_give_human(h, p)


## The dribbler lets the ball go on purpose (knock-on, flick): loose, but it is still his to run onto.
func release_ball(p: PlayerSim, immune: float) -> void:
	owner = -1
	pass_to = p.id
	pass_t = time
	last_touch = p.id
	loose_t = 0.0
	p.immune = immune
	emit("touch", {"pid": p.id, "speed": ball.vel.length()})


## At the moment of a pass: which team-mates of the passer are in an offside position (opponents' half, ahead of
## the ball and of the second-last defender). Not from throw-ins, corners or goal kicks.
func _mark_offside(passer: PlayerSim) -> void:
	offside_ids.clear()
	offside_team = passer.team
	if not offside_on or mode != "match" or restart_kick in ["throw_in", "corner", "goal_kick"]:
		restart_kick = ""
		return
	restart_kick = ""
	var ad := attack_dir(passer.team)
	var xs: Array[float] = []
	for o in team_players(1 - passer.team):
		xs.append(o.pos.x * ad)
	xs.sort()
	var second_last: float = xs[xs.size() - 2] if xs.size() >= 2 else 0.0
	var ball_x := ball.pos.x * ad
	for q in team_players(passer.team):
		if q == passer:
			continue
		var x := q.pos.x * ad
		if x > 0.0 and x > ball_x + 0.2 and x > second_last + 0.25:
			offside_ids[q.id] = q.pos


func _check_offside_touch(p: PlayerSim) -> bool:
	## the player playing the ball was offside when it was passed: free kick to the defenders
	if offside_ids.is_empty():
		return false
	if p.team != offside_team:
		offside_ids.clear()
		return false
	if not offside_ids.has(p.id):
		offside_ids.clear()   # an onside team-mate got it first
		return false
	var spot: Vector2 = offside_ids[p.id]
	offside_ids.clear()
	emit("offside", {"pid": p.id})
	_begin_restart("free_kick", 1 - p.team, spot)
	return true


## Double tap on shoot: the shot being struck becomes a low driven one.
func human_low_shot(slot: int) -> bool:
	var h: Dictionary = humans[slot]
	if h["pid"] < 0:
		return false
	var p := players[h["pid"]]
	if p.action == "kick" and p.act.get("kind", "") == "shot" and not p.act.get("done", false):
		p.act["kind"] = "shot_low"
		emit("low_shot", {"pid": p.id})
		return true
	return false


## A one-two: the passer bursts forward for a return pass.
func human_give_and_go(slot: int) -> void:
	var h: Dictionary = humans[slot]
	if h["pid"] >= 0:
		give_and_go[h["pid"]] = time + 2.8


func human_skill(slot: int, id: String, side: float) -> bool:
	var h: Dictionary = humans[slot]
	if h["pid"] < 0:
		return false
	return request_skill(players[h["pid"]], id, side)


const CELEBRATIONS := ["fist", "arms", "knee_slide", "leap", "spin", "flip", "salute"]


## The scorer's celebration (the human picks one with any action button while the goal is being celebrated).
func celebrate(pid: int, kind: String) -> void:
	if pid < 0:
		return
	var p := players[pid]
	if kind == "random":
		kind = CELEBRATIONS[rng.randi() % CELEBRATIONS.size()]
	var dur := 2.4
	var face := p.facing
	match kind:
		"fist":
			_clip_for(p, "celebrate")
		"arms":
			_clip_for(p, "celebrate2")
		"knee_slide":
			_clip_for(p, "slide")
			p.vel = face * 7.0
			dur = 1.6
		"leap":
			_clip_for(p, "header_jump")
			dur = 1.3
		"spin":
			_clip_for(p, "celebrate2")
		"flip":
			_clip_for(p, "bicycle")
			dur = 1.5
		"salute":
			_clip_for(p, "celebrate")
			p.clip_speed = 0.7
	p.start_action("celebrate", dur, {"kind": kind})
	emit("celebration", {"pid": pid, "kind": kind})


func _move_celebration(p: PlayerSim, dt: float) -> void:
	var kind: String = p.act.get("kind", "")
	match kind:
		"knee_slide":
			p.vel = p.vel.move_toward(Vector2.ZERO, 4.5 * dt)
		"spin":
			p.pose_spin = TAU * 2.0 * smoothstep(0.0, 1.0, p.act_t / maxf(p.act_dur, 0.01))
			p.vel = p.vel.move_toward(Vector2.ZERO, 10.0 * dt)
		_:
			p.vel = p.vel.move_toward(Vector2.ZERO, 10.0 * dt)
	if p.act_t >= p.act_dur - DT:
		p.pose_spin = 0.0


func human_celebrate(slot: int, kind: String = "random") -> bool:
	if phase != "goal" or goals_log.is_empty() or phase_t > 6.0:
		return false
	var g: Dictionary = goals_log.back()
	if g["team"] != humans[slot]["team"] or g["pid"] < 0:
		return false
	var p := players[g["pid"]]
	if celebrated_goal == goals_log.size():
		return false
	celebrated_goal = goals_log.size()
	celebrate(p.id, kind)
	return true


## Who a switch would go to now (for the white arrow): the teammate best placed for the ball.
func next_switch_target(slot: int) -> int:
	var h: Dictionary = humans[slot]
	var cur: int = h["pid"]
	var best := -1
	var bd := 1e9
	for p in team_players(h["team"]):
		if p.id == cur or p.role == "GK" and ball2().distance_to(p.pos) > 20.0 or parked.has(p.id):
			continue
		var d := p.pos.distance_to(ball2() + Vector2(ball.vel.x, ball.vel.z) * 0.3)
		if d < bd:
			bd = d
			best = p.id
	return best


func human_action(slot: int, kind: String, power: float, dir: Vector2) -> void:
	## pass / through / lob / cross / shot from the human: now if he has the ball, else buffered for a first-time kick
	var h: Dictionary = humans[slot]
	if h["pid"] < 0:
		return
	var p := players[h["pid"]]
	if phase == "kickoff" or phase == "restart":
		if restart.get("taker", -1) == p.id:
			_take_set_piece(p, kind, power, dir)
		return
	if not request_kick(p, kind, power, dir):
		h["buffer"] = {"kind": kind, "power": power, "dir": dir, "t": time}


# ------------------------------------------------------------------ rules

func _check_ball_events() -> void:
	if practice_reset > 0.0:
		return
	if mode in ["shooting", "skills"] and (ball.ev_goal != 0 or ball.ev_out != 0):
		# practice: count it and reset instead of restarting play
		if ball.ev_goal != 0:
			var st := 0 if ball.ev_goal == int(attack_dir(0)) else 1
			teams[st]["score"] += 1
			emit("goal", {"team": st, "pid": last_touch, "practice": true})
		else:
			emit("practice_out", {})
		practice_reset = 1.0
		return
	if ball.ev_goal != 0:
		var scorer_team := 0 if ball.ev_goal == int(attack_dir(0)) else 1
		_goal(scorer_team)
		return
	if ball.ev_out == 1:
		_begin_restart("throw_in", 1 - last_team if last_team >= 0 else 0, ball.ev_out_pos)
	elif ball.ev_out == 2:
		var end_sign := signf(ball.ev_out_pos.x)
		var defending := 0 if end_sign == -attack_dir(0) else 1
		if last_team == defending:
			_begin_restart("corner", 1 - defending, Vector2(end_sign * pitch.half_l(), signf(ball.ev_out_pos.y) * pitch.half_w()))
		else:
			_begin_restart("goal_kick", defending, Vector2(end_sign * (pitch.half_l() - pitch.six_depth), 0))


func _goal(team: int) -> void:
	teams[team]["score"] += 1
	var scorer := last_touch if last_touch >= 0 and players[last_touch].team == team else -1
	goals_log.append({"team": team, "pid": scorer, "minute": int(minute()) + 1})
	stats["on_target"][team] += 1
	emit("goal", {"team": team, "pid": scorer})
	add_momentum(team, 0.3)
	momentum[1 - team] = maxf(0.0, momentum[1 - team] - 0.3)
	phase = "goal"
	phase_t = 0.0
	fade_sent = false
	owner = -1
	in_hands = false
	kickoff_team = 1 - team
	for p in players:
		if p.action != "fallen":
			p.action = ""
	teams[team]["ai"].celebrate(scorer)
	teams[1 - team]["ai"].celebrate(-2)


func _end_half() -> void:
	if half == 1:
		phase = "halftime"
		phase_t = 0.0
		emit("halftime", {})
	else:
		phase = "fulltime"
		phase_t = 0.0
		emit("fulltime", {})


## Challenges: start in the second half at a given minute and score, with players already sent off.
func start_scenario(sc: Dictionary) -> void:
	_start_second_half()
	half_t = (float(sc["minute"]) - 45.0) / 45.0 * half_seconds
	added[1] = 3
	teams[0]["score"] = int(sc["score"][0])
	teams[1]["score"] = int(sc["score"][1])
	for side in [[0, int(sc.get("down", 0))], [1, int(sc.get("their_down", 0))]]:
		var n: int = side[1]
		for role in ["DEF", "MID", "FWD"]:
			for p in team_players(side[0]):
				if n > 0 and p.role == role and not p.sent_off:
					p.sent_off = true
					p.cards = 1
					parked[p.id] = Vector2(-60.0 + p.id * 2.0, -pitch.half_w() - 30.0)
					n -= 1
	_setup_kickoff(0)
	for h in humans:
		if parked.has(h["pid"]):
			_give_human(h, _nearest_to_ball(h["team"], h["pid"]))
	events.clear()


func _start_second_half() -> void:
	half = 2
	half_t = 0.0
	for t in 2:
		teams[t]["attack"] = -teams[t]["attack"]
	_setup_kickoff(1)
	emit("second_half", {})


func _setup_kickoff(team: int) -> void:
	phase = "kickoff"
	phase_t = 0.0
	restart = {"kind": "kickoff", "team": team, "spot": Vector2.ZERO, "taker": -1}
	ball.pos = Vector3(0, BallPhysics.RADIUS, 0)
	ball.vel = Vector3.ZERO
	ball.spin = Vector3.ZERO
	owner = -1
	in_hands = false
	pass_to = -1
	shot_by = -1
	for p in players:
		p.action = ""
		p.act = {}
		p.clip = ""
		p.vel = Vector2.ZERO
		p.pose_spin = 0.0
		p.pose_lean = 0.0
		p.fooled = 0.0
		var home: Vector2 = teams[p.team]["ai"].kickoff_spot(p)
		p.pos = home
		p.facing = Vector2(attack_dir(p.team), 0)
	# the taker: the most advanced outfield player of the kicking team, on the ball
	var taker: PlayerSim = null
	for p in team_players(team):
		if p.role == "FWD" and (taker == null or p.slot.y < taker.slot.y):
			taker = p
	if taker == null:
		taker = team_players(team)[team_players(team).size() - 1]
	taker.pos = Vector2(-attack_dir(team) * 0.35, 0.1)
	restart["taker"] = taker.id
	for h in humans:
		if h["team"] == team:
			_give_human(h, taker)
	emit("kickoff_ready", {"team": team})


## The ball is dead (out of play, a foul): a whistle, a moment where play stops, then the restart is set up.
func _begin_restart(kind: String, team: int, spot: Vector2) -> void:
	pending_restart = [kind, team, spot]
	phase = "dead"
	phase_t = 0.0
	dead_dur = 1.9 if kind in ["free_kick", "penalty"] else (1.5 if kind != "throw_in" else 1.2)
	fade_sent = false
	owner = -1
	in_hands = false
	pass_to = -1
	shot_by = -1
	emit("dead", {"kind": kind, "team": team})


func _step_dead(dt: float) -> void:
	# everybody pulls up and looks at the ball; it rolls on out of play
	for t in 2:
		for p in team_players(t):
			if p.action in ["", "celebrate"] and p.human < 0:
				p.move = Vector2.ZERO
				p.sprint = 0.0
				p.face_to = (ball2() - p.pos).normalized()
			elif p.human >= 0:
				p.move *= 0.4
				p.sprint = 0.0
	_update_actions(dt)
	_move_players(dt)
	_collide_players()
	ball.clear_events()
	ball.step(dt, pitch)


func _setup_restart(kind: String, team: int, spot: Vector2) -> void:
	phase = "restart"
	phase_t = 0.0
	owner = -1
	in_hands = false
	pass_to = -1
	shot_by = -1
	if kind == "throw_in":
		spot.y = signf(spot.y) * pitch.half_w()
	restart = {"kind": kind, "team": team, "spot": spot, "taker": -1}
	ball.vel = Vector3.ZERO
	ball.spin = Vector3.ZERO
	ball.pos = Vector3(spot.x, BallPhysics.RADIUS if kind != "throw_in" else 1.9, spot.y)
	var taker: PlayerSim = null
	if kind == "goal_kick":
		taker = keeper_of(team)
	elif kind != "penalty":
		var bd := 1e9
		for p in team_players(team):
			if p.role == "GK":
				continue
			var d := p.pos.distance_to(spot)
			if d < bd:
				bd = d
				taker = p
	else:
		var best := -1.0
		for p in team_players(team):
			if p.role != "GK" and p.finishing > best:
				best = p.finishing
				taker = p
	restart["taker"] = taker.id
	for p in players:
		if p.action != "fallen":
			p.action = ""
		p.clip = ""
		p.vel *= 0.3
	var inward := Vector2(0, -signf(spot.y)) if kind == "throw_in" else (Vector2(attack_dir(team), 0) if kind != "corner" else (Vector2(-signf(spot.x), -signf(spot.y) * 0.6)).normalized())
	taker.pos = spot - inward * (0.35 if kind != "throw_in" else 0.1)
	taker.facing = inward
	for t in 2:
		teams[t]["ai"].set_piece_positions(kind, team, spot)
	for h in humans:
		if h["team"] == team:
			_give_human(h, taker)
	emit("restart", {"kind": kind, "team": team})


func _step_set_piece(dt: float) -> void:
	# players walk to their spots; the taker waits for input (human) or takes it (AI)
	for t in 2:
		teams[t]["ai"].update(dt)
	_update_actions(dt)
	var taker_id: int = restart.get("taker", -1)
	for p in players:
		if parked.has(p.id):
			p.pos = parked[p.id]
			p.vel = Vector2.ZERO
			continue
		if p.id == taker_id:
			p.vel = Vector2.ZERO
			if p.action == "":
				p.facing = PlayerSim._rotate_towards(p.facing, p.move.normalized() if p.move.length() > 0.2 else p.facing, 3.0 * dt)
			continue
		if p.action in ["", "celebrate"]:
			p.update_movement(dt, false)
			p.pos += p.vel * dt
	_collide_players()
	if restart["kind"] == "kickoff":
		ball.pos = Vector3(0, BallPhysics.RADIUS, 0)
	elif restart["kind"] == "throw_in":
		var tk := players[taker_id]
		ball.pos = Vector3(tk.pos.x, 1.9, tk.pos.y)
	if taker_id >= 0:
		var tk2 := players[taker_id]
		var human := tk2.human >= 0
		var wait := 1.6 if restart["kind"] != "kickoff" else 1.4
		if not human and phase_t > wait and tk2.action == "":
			teams[tk2.team]["ai"].take_set_piece(tk2, restart["kind"])
		elif human and phase_t > 9.0 and tk2.action == "":
			_take_set_piece(tk2, "pass", 0.5, tk2.facing)


func _take_set_piece(p: PlayerSim, kind: String, power: float, dir: Vector2) -> void:
	var rk: String = restart["kind"]
	if p.action != "":
		return
	if rk == "throw_in":
		var d := dir if dir.length() > 0.2 else p.facing
		restart_kick = "throw_in"
		p.start_action("throw", 0.7, {"kind": "lob" if kind == "lob" else "pass", "power": power * 0.5, "dir": d, "contact": 0.35})
		_clip_for(p, "throw_in")
		owner = p.id
		phase = "play"
		phase_t = 0.0
		return
	if rk == "corner" and kind == "pass" and dir.length() < 0.2:
		kind = "cross"
	restart_kick = rk
	owner = p.id
	_set_owner(p)
	phase = "play"
	phase_t = 0.0
	if rk == "kickoff":
		emit("whistle", {})
	request_kick(p, kind, power, dir)


func ball_free_kick_ready() -> bool:
	return phase == "restart"
