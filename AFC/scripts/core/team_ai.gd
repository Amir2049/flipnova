class_name TeamAI
extends RefCounted
## One team's brain: team shape (real-football numbers by ball third), pressing and cover, marking, support runs,
## the ball carrier's decisions, the keeper, set pieces and celebrations. Writes the AI players' intents.

# fractions of the pitch length / width, by ball third (own, middle, opponent's); from tracking data
const DEF_LINE := [0.141, 0.302, 0.456]
const DEF_LEN := [0.287, 0.257, 0.331]
const DEF_WIDTH := [0.488, 0.548, 0.575]
const ATT_LINE := [0.165, 0.367, 0.509]
const ATT_LEN := [0.348, 0.310, 0.338]
const ATT_WIDTH := [0.656, 0.774, 0.661]

var m: MatchSim
var t := 0
var think := {}           # pid -> seconds until the next carrier decision
var dribble_dir := {}     # pid -> Vector2
var presser := -1
var cover := -1
var chaser := -1
var celebrating := -3     # -3 none, -2 conceded, -1 own goal / unknown, >= 0 scorer
var tackle_cd := {}
var call_presser := false   # the human holds 'teammate pressure'


func setup(match_sim: MatchSim, team: int) -> void:
	m = match_sim
	t = team


func _ad() -> float:
	return m.attack_dir(t)


func _l() -> float:
	return m.pitch.length


func _w() -> float:
	return m.pitch.width


static func _interp3(arr: Array, f: float) -> float:
	# f: ball position along the pitch from our goal, 0..1 (thirds centred at 1/6, 1/2, 5/6)
	if f <= 1.0 / 6.0:
		return arr[0]
	if f >= 5.0 / 6.0:
		return arr[2]
	if f < 0.5:
		return lerpf(arr[0], arr[1], (f - 1.0 / 6.0) * 3.0)
	return lerpf(arr[1], arr[2], (f - 0.5) * 3.0)


## Where the shape wants this player now.
func home(p: PlayerSim, attacking: bool) -> Vector2:
	var hl := m.pitch.half_l()
	var bp := m.ball2()
	var f := clampf((bp.x * _ad() + hl) / _l(), 0.0, 1.0)
	var line: float = _interp3(ATT_LINE if attacking else DEF_LINE, f)
	var length: float = _interp3(ATT_LEN if attacking else DEF_LEN, f)
	var width: float = _interp3(ATT_WIDTH if attacking else DEF_WIDTH, f)
	if p.role == "GK":
		var gx := -_ad() * hl
		var to_ball := bp - Vector2(gx, 0)
		var off := clampf(0.8 + to_ball.length() * 0.06, 0.8, 3.5) if not attacking else clampf(4.0 + f * 14.0, 4.0, 16.0)
		var dir := to_ball.normalized() if to_ball.length() > 0.1 else Vector2(_ad(), 0)
		var gpos := Vector2(gx, 0) + dir * off
		gpos.y = clampf(gpos.y, -m.pitch.goal_width * 0.6, m.pitch.goal_width * 0.6) if not attacking else gpos.y * 0.3
		return gpos
	var from_goal := (line + p.slot.x * length) * _l()
	var x := _ad() * (-hl + from_goal)
	var z := p.slot.y * width * _w() * 0.5 * _ad()
	z += bp.y * (0.22 if attacking else 0.3)
	# the defensive line never sits deeper than the six-yard box, nobody goes past the ball much when defending
	if not attacking and p.role != "FWD":
		x = _ad() * minf(x * _ad(), bp.x * _ad() + 2.0)
	return Vector2(clampf(x, -hl + 1.5, hl - 1.5), clampf(z, -m.pitch.half_w() + 1.5, m.pitch.half_w() - 1.5))


func kickoff_spot(p: PlayerSim) -> Vector2:
	var hl := m.pitch.half_l()
	if p.role == "GK":
		return Vector2(-_ad() * (hl - 1.0), 0)
	var d := lerpf(0.82, 0.2, p.slot.x)   # 0.82 of the half from the line .. near the halfway line
	var x := -_ad() * maxf(1.2, d * hl * 0.92)
	var z := p.slot.y * m.pitch.half_w() * 0.72 * _ad()
	if absf(x) < m.pitch.circle_radius + 0.5 and absf(z) < m.pitch.circle_radius + 0.5:
		x = -_ad() * (m.pitch.circle_radius + 0.8)
	return Vector2(x, z)


# ------------------------------------------------------------------ per tick

func update(dt: float) -> void:
	for k in tackle_cd.keys():
		tackle_cd[k] = tackle_cd[k] - dt
	match m.phase:
		"goal", "fulltime":
			_update_celebration(dt)
			return
		"kickoff", "restart":
			for p in m.team_players(t):
				if p.human >= 0 or p.id == m.restart.get("taker", -1):
					continue
				_go(p, home(p, m.restart.get("team", 0) == t) if m.phase == "restart" else kickoff_spot(p), 0.0)
			return
	var we_have := m.owner >= 0 and m.players[m.owner].team == t
	var they_have := m.owner >= 0 and not we_have
	var attacking := we_have or (m.owner < 0 and m.possession_team == t)
	presser = -1
	cover = -1
	chaser = -1
	if they_have:
		_pick_pressers()
		# with a human on this team, the AI presser only goes when he is called (or the human is far away)
		var human_p := -1
		for p in m.team_players(t):
			if p.human >= 0:
				human_p = p.id
		if human_p >= 0:
			if presser == human_p:
				presser = cover
				cover = -1
			if not call_presser and presser >= 0 and human_p >= 0 and m.players[human_p].pos.distance_to(m.players[m.owner].pos) < 12.0:
				cover = presser
				presser = -1
	elif m.owner < 0:
		chaser = _pick_chaser()
	if they_have or (m.owner < 0 and m.possession_team != t):
		_assign_marks()
	else:
		marks.clear()
	for p in m.team_players(t):
		if p.human >= 0 or p.busy() or m.parked.has(p.id):
			continue
		p.style = PlayerSim.Style.NORMAL
		p.face_to = Vector2.ZERO
		if p.role == "GK" and m.owner != p.id:
			_keeper(p, dt)
		elif m.owner == p.id:
			_carrier(p, dt)
		elif p.id == chaser:
			_chase(p)
		elif p.id == presser:
			_press(p, dt)
		elif p.id == cover:
			_cover(p)
		elif we_have:
			_support(p)
		else:
			_defend_zone(p)


func _go(p: PlayerSim, target: Vector2, urgency: float) -> void:
	var d := target - p.pos
	var dist := d.length()
	if dist < 0.4:
		p.move = Vector2.ZERO
		p.sprint = 0.0
		var b := m.ball2() - p.pos
		p.face_to = b.normalized() if b.length() > 0.5 else Vector2.ZERO
		return
	var intensity := clampf(dist / 4.0, 0.25, 1.0)
	p.move = d / dist * intensity
	p.sprint = 1.0 if urgency > 0.6 or dist > 14.0 and urgency > 0.2 else 0.0


func _intercept_time(p: PlayerSim, pts: PackedVector3Array) -> Array:
	## [time, point]: when this player can first get to the ball (reaction 0.15 s, 90 % of top speed)
	for i in range(0, pts.size(), 3):
		var tt := (i + 1) / 30.0
		var bp := Vector2(pts[i].x, pts[i].z)
		var d := maxf(0.0, p.pos.distance_to(bp) - 0.6)
		if pts[i].y < 2.0 and d <= p.top_speed * 0.9 * maxf(0.0, tt - 0.15) + 0.3:
			return [tt, bp]
	var last := pts[pts.size() - 1]
	return [99.0, Vector2(last.x, last.z)]


var _pts := PackedVector3Array()
var _pts_t := -1.0


func _ball_path() -> PackedVector3Array:
	if _pts_t != m.time:
		_pts = m.ball.predict(1.0 / 30.0, 90)
		_pts_t = m.time
	return _pts


func _pick_chaser() -> int:
	var pts := _ball_path()
	var best := -1
	var bt := 99.0
	for p in m.team_players(t):
		if p.role == "GK" and not m.pitch.in_box(m.ball.pos.x, m.ball.pos.z, -_ad()):
			continue
		if p.busy():
			continue
		var it: Array = _intercept_time(p, pts)
		var tt: float = it[0] - (0.25 if p.id == m.pass_to else 0.0)
		if tt < bt:
			bt = tt
			best = p.id
	return best


func _chase(p: PlayerSim) -> void:
	var it: Array = _intercept_time(p, _ball_path())
	var target: Vector2 = it[1]
	if p.id == m.pass_to and it[0] < 1.5:
		# meet the pass: come to it, don't run past it
		target = target + (p.pos - target).normalized() * 0.3
	_go(p, target, 1.0)
	p.move = p.move.normalized() if p.move.length() > 0.0 else p.move
	# arrive on the ball instead of sprinting through it and circling back
	var d := p.pos.distance_to(target)
	p.cap = p.arrival_cap(target)
	if d < 7.0:
		p.sprint = 0.0


func _pick_pressers() -> void:
	var c := m.players[m.owner]
	var best := -1
	var second := -1
	var bd := 1e9
	var sd := 1e9
	for p in m.team_players(t):
		if p.role == "GK" or p.busy():
			continue
		var d := p.pos.distance_to(c.pos + c.vel * 0.4)
		if d < bd:
			second = best
			sd = bd
			best = p.id
			bd = d
		elif d < sd:
			second = p.id
			sd = d
	presser = best
	cover = second


func _press(p: PlayerSim, dt: float) -> void:
	var c := m.players[m.owner]
	var own_goal := Vector2(-_ad() * m.pitch.half_l(), 0)
	var gs := (own_goal - c.pos).normalized()
	var contain := c.pos + c.vel * 0.25 + gs * 1.25
	var d := p.pos.distance_to(c.pos)
	_go(p, contain, 0.8 if d > 6.0 else 0.4)
	if d < 4.0:
		p.style = PlayerSim.Style.JOCKEY
		p.face_to = (c.pos - p.pos).normalized()
		p.sprint = 0.0
	# tackle when the ball is exposed
	var exposed := (m.ball2() - c.pos).length()
	var foot_d := (m.ball2() - p.foot_point(0.5)).length()
	if foot_d < 1.0 and tackle_cd.get(p.id, 0.0) <= 0.0:
		var rate := lerpf(0.9, 2.2, m.difficulty) * (1.0 + clampf((exposed - 0.5) * 1.5, 0.0, 2.0))
		if m.rng.randf() < rate * dt:
			m.request_tackle(p)
			tackle_cd[p.id] = 0.7
	elif d < 2.5 and c.vel.length() > 5.0 and m.rng.randf() < 0.05 * dt * m.difficulty and tackle_cd.get(p.id, 0.0) <= 0.0:
		m.request_slide(p)
		tackle_cd[p.id] = 2.0


func _cover(p: PlayerSim) -> void:
	# the second man: 4-5 m goal side of the ball, closing the lane inside (FC: one presses, one helps)
	var c := m.players[m.owner]
	var own_goal := Vector2(-_ad() * m.pitch.half_l(), 0)
	var spot := c.pos + (own_goal - c.pos).normalized() * 4.5
	spot.y = lerpf(spot.y, 0.0, 0.15)
	var h := home(p, false)
	_go(p, spot.lerp(h, 0.2), 0.6)


var marks := {}   # defender id -> opponent he picks up (one each, refreshed every tick)


func _assign_marks() -> void:
	marks.clear()
	var own_goal := Vector2(-_ad() * m.pitch.half_l(), 0)
	var threats := []
	for o in m.team_players(1 - t):
		if o.role != "GK" and o.id != m.owner and not m.parked.has(o.id):
			threats.append(o)
	# the most dangerous first: closest to our goal
	threats.sort_custom(func(x, y): return x.pos.distance_to(own_goal) < y.pos.distance_to(own_goal))
	var free := []
	for q in m.team_players(t):
		if q.role != "GK" and q.role != "FWD" and q.human < 0 and q.id != presser and q.id != cover and not m.parked.has(q.id):
			free.append(q)
	for o in threats:
		if o.pos.distance_to(own_goal) > 38.0:
			continue
		var best: PlayerSim = null
		var bd := 16.0
		for q in free:
			var d: float = q.pos.distance_to(o.pos)
			if d < bd:
				bd = d
				best = q
		if best:
			marks[best.id] = o
			free.erase(best)


func _defend_zone(p: PlayerSim) -> void:
	var h := home(p, false)
	var own_goal := Vector2(-_ad() * m.pitch.half_l(), 0)
	var o: PlayerSim = marks.get(p.id, null)
	if o:
		var danger := clampf(1.0 - (o.pos.distance_to(own_goal) - 12.0) / 26.0, 0.0, 1.0)
		var gap := lerpf(2.2, 1.0, danger)
		var mark := o.pos + o.vel * 0.25 + (own_goal - o.pos).normalized() * gap
		h = h.lerp(mark, lerpf(0.5, 0.92, danger))
		_go(p, h, 0.3 + 0.5 * danger)
		return
	_go(p, h, 0.3)


var support_cache := {}   # pid -> {until, carrier, pos}: where a supporting player is going (kept a moment, no jitter)


func _support(p: PlayerSim) -> void:
	# one-two: the passer bursts into space toward goal for the return
	if m.give_and_go.has(p.id):
		if m.time < float(m.give_and_go[p.id]):
			var fwd := Vector2(_ad(), 0)
			var tgt := p.pos + fwd * 12.0
			tgt.y = clampf(tgt.y + (0.0 - tgt.y) * 0.2, -m.pitch.half_w() + 3.0, m.pitch.half_w() - 3.0)
			_go(p, tgt, 1.0)
			return
		m.give_and_go.erase(p.id)
	var h := home(p, true)
	var c: PlayerSim = m.players[m.owner] if m.owner >= 0 else null
	if c:
		var ahead := (p.pos.x - c.pos.x) * _ad()
		if p.role == "FWD" and c.facing.x * _ad() > 0.3 and ahead > -4.0:
			# on the shoulder of the last defender, staying onside, ready to spin in behind
			var line := _second_last_x() * _ad()
			var onside: float = maxf(line - 0.8, c.pos.x * _ad())
			var lane := clampf(p.pos.y + (h.y - p.pos.y) * 0.5, -m.pitch.half_w() + 4.0, m.pitch.half_w() - 4.0)
			h = Vector2(_ad() * minf(onside, m.pitch.half_l() - 6.0), lane)
		elif _is_short_option(p, c):
			# one of the two nearest: come short and show for it (8-13 m, at an angle), like FC midfielders
			var sc2: Dictionary = support_cache.get(p.id, {})
			if sc2.is_empty() or m.time > sc2["until"] or sc2["carrier"] != c.id:
				var side := signf(p.pos.y - c.pos.y) if absf(p.pos.y - c.pos.y) > 1.0 else (1.0 if p.id % 2 == 0 else -1.0)
				var ang := deg_to_rad(m.rng.randf_range(35.0, 75.0)) * side
				var around := c.pos + Vector2(_ad(), 0).rotated(ang * _ad()) * m.rng.randf_range(8.0, 13.0)
				around = around.lerp(h, 0.3)
				sc2 = {"until": m.time + m.rng.randf_range(1.0, 1.6), "carrier": c.id, "pos": _find_space(p, around, c)}
				support_cache[p.id] = sc2
			h = sc2["pos"]
		elif ahead < 12.0 and p.pos.distance_to(c.pos) < 22.0:
			# offer a pass: a spot near the shape where the line from the ball is clear
			var sc: Dictionary = support_cache.get(p.id, {})
			if sc.is_empty() or m.time > sc["until"] or sc["carrier"] != c.id:
				sc = {"until": m.time + m.rng.randf_range(0.9, 1.5), "carrier": c.id, "pos": _find_space(p, h, c)}
				support_cache[p.id] = sc
			h = sc["pos"]
	_go(p, h, 0.35)


func _is_short_option(p: PlayerSim, c: PlayerSim) -> bool:
	if p.role == "GK" or p.role == "FWD":
		return false
	var mine := p.pos.distance_to(c.pos)
	if mine > 26.0:
		return false
	var closer := 0
	for q in m.team_players(t):
		if q != p and q != c and q.role != "GK" and q.human < 0 and q.pos.distance_to(c.pos) < mine:
			closer += 1
	return closer < 2


func _second_last_x() -> float:
	## the offside line: the second-last opponent (the keeper usually being the last)
	var xs: Array[float] = []
	for o in m.team_players(1 - t):
		xs.append(o.pos.x * _ad())
	xs.sort()
	return (xs[xs.size() - 2] if xs.size() >= 2 else 0.0) * _ad()


func _last_defender_x() -> float:
	var best := -1e9
	for o in m.team_players(1 - t):
		if o.role == "GK":
			continue
		best = maxf(best, o.pos.x * _ad())
	return best * _ad()


func _find_space(p: PlayerSim, around: Vector2, carrier: PlayerSim = null) -> Vector2:
	var best := around
	var bs := -1e9
	for i in 10:
		var cand := around + Vector2(m.rng.randf_range(-7, 7), m.rng.randf_range(-7, 7))
		cand.x = clampf(cand.x, -m.pitch.half_l() + 3.0, m.pitch.half_l() - 3.0)
		cand.y = clampf(cand.y, -m.pitch.half_w() + 2.0, m.pitch.half_w() - 2.0)
		var s := 0.0
		for o in m.team_players(1 - t):
			s += -1.0 / maxf(0.5, o.pos.distance_to(cand))
		if carrier:
			var d := carrier.pos.distance_to(cand)
			s -= absf(d - 11.0) * 0.03                       # a comfortable passing distance
			s -= _pass_risk(carrier.pos, cand, m._pass_speed(d, 0.5)) * 0.8
			s += (cand.x - carrier.pos.x) * _ad() * 0.01      # a little forward is better
		if s > bs:
			bs = s
			best = cand
	return best


# ------------------------------------------------------------------ the ball carrier

var carry_since := {}   # pid -> match time he got the ball (the longer he has it, the keener he is to pass)


func _carrier(p: PlayerSim, dt: float) -> void:
	if carry_since.get("owner", -1) != p.id:
		carry_since["owner"] = p.id
		carry_since[p.id] = m.time
	think[p.id] = think.get(p.id, 0.0) - dt
	if p.role == "GK" and m.time - float(carry_since[p.id]) > 1.5:
		# a keeper with the ball at his feet doesn't dawdle
		if m.request_kick(p, "clear", 0.85, Vector2(_ad(), 0).rotated(m.rng.randf_range(-0.5, 0.5))):
			return
	var dir: Vector2 = dribble_dir.get(p.id, Vector2(_ad(), 0))
	if think[p.id] <= 0.0:
		# quick decisions: pass-and-move football; a first decision right after receiving
		think[p.id] = m.rng.randf_range(0.18, 0.38) * lerpf(1.25, 0.85, m.difficulty)
		if _decide(p):
			return
		dir = _dribble_direction(p)
		dribble_dir[p.id] = dir
	p.move = dir
	var space_ahead := _space_in(p, dir)
	p.sprint = 1.0 if space_ahead > 8.0 else 0.0
	if space_ahead < 2.5:
		p.style = PlayerSim.Style.CLOSE


func _space_in(p: PlayerSim, dir: Vector2) -> float:
	var best := 30.0
	for o in m.team_players(1 - t):
		var rel := o.pos - p.pos
		var along := rel.dot(dir)
		if along < -0.5:
			continue
		var side := absf(rel.cross(dir))
		if side < 2.5:
			best = minf(best, rel.length())
	return best


func _dribble_direction(p: PlayerSim) -> Vector2:
	var goal := Vector2(m.goal_x(t), 0)
	var want := (goal - p.pos).normalized()
	var avoid := Vector2.ZERO
	for o in m.team_players(1 - t):
		var rel := p.pos - o.pos
		var d := rel.length()
		if d < 7.0 and d > 0.01:
			avoid += rel / d * (7.0 - d) / 7.0
	var dir := (want + avoid * 1.3).normalized()
	# stay on the pitch
	if absf(p.pos.y) > m.pitch.half_w() - 4.0:
		dir.y -= signf(p.pos.y) * 0.8
	return dir.normalized()


func _lane_clearance(a: Vector2, b: Vector2) -> float:
	## how far the nearest opponent is from the pass line (time to react grows with the distance from the kicker)
	var ab := b - a
	var l2 := ab.length_squared()
	var best := 99.0
	for o in m.team_players(1 - t):
		var u := clampf((o.pos - a).dot(ab) / l2, 0.0, 1.0) if l2 > 0.01 else 0.0
		var d := (a + ab * u - o.pos).length() + u * 1.2
		best = minf(best, d)
	return best


func _xg(from: Vector2) -> float:
	var gx := m.goal_x(t)
	var gw := m.pitch.goal_width * 0.5
	var a := (Vector2(gx, -gw) - from).angle_to(Vector2(gx, gw) - from)
	var d := from.distance_to(Vector2(gx, 0))
	return 1.0 / (1.0 + exp(-(-1.6 + 3.2 * absf(a) - 0.09 * d)))


func _decide(p: PlayerSim) -> bool:
	var goal := Vector2(m.goal_x(t), 0)
	var d_goal := p.pos.distance_to(goal)
	var pressure := 0.0
	var in_front := false
	for o in m.team_players(1 - t):
		var d := o.pos.distance_to(p.pos)
		pressure = maxf(pressure, clampf((3.0 - d) / 3.0, 0.0, 1.0))
		if d < 3.0 and absf(p.facing.angle_to(o.pos - p.pos)) < deg_to_rad(60.0) and o.role != "GK":
			in_front = true
	# a skill move to beat the man in front (the better the dribbler, the more often)
	if in_front and p.skill_moves >= 2 and m.rng.randf() < 0.05 * p.skill_moves * (0.5 + m.difficulty):
		var options := ["feint", "roll", "dragback"]
		if p.skill_moves >= 3:
			options += ["stepover", "cruyff"]
		if p.skill_moves >= 4:
			options.append("roulette")
		if p.skill_moves >= 5:
			options.append("elastico")
		var side := 1.0 if m.rng.randf() < 0.5 else -1.0
		if m.request_skill(p, options[m.rng.randi() % options.size()], side):
			return true
	# shoot
	var xg := _xg(p.pos)
	var shot_lane := _lane_clearance(p.pos, goal)
	if d_goal < 30.0 and (xg * 2.4 > 0.16 + m.rng.randf() * 0.14 or d_goal < 11.0 and shot_lane > 1.0 or d_goal < 24.0 and shot_lane > 2.5 and m.rng.randf() < 0.07):
		var aim := (goal - p.pos).normalized()
		return m.request_kick(p, "shot", clampf(0.62 + m.rng.randf() * 0.35, 0.0, 1.0), aim.rotated(m.rng.randf_range(-0.6, 0.6)))
	# cross from wide in the final third
	var fx := (p.pos.x * _ad() + m.pitch.half_l()) / m.pitch.length
	if fx > 0.78 and absf(p.pos.y) > m.pitch.box_width * 0.5 and m.rng.randf() < 0.55:
		var target := Vector2(m.goal_x(t) - _ad() * 9.0, m.rng.randf_range(-4.0, 4.0))
		return m.request_kick(p, "cross", 0.6, (target - p.pos).normalized())
	# clear when pressed deep in our own third
	if fx < 0.2 and pressure > 0.6 and m.rng.randf() < 0.6:
		return m.request_kick(p, "clear", 0.9, Vector2(_ad(), 0).rotated(m.rng.randf_range(-0.5, 0.5)))
	# a one-two on: give it back to the runner
	for gid in m.give_and_go:
		var r: PlayerSim = m.players[gid]
		if r.team == t and r != p and m.time < float(m.give_and_go[gid]) and m.time - m.pass_t > 0.3:
			m.give_and_go.erase(gid)
			return m.request_kick(p, "through", 0.55, (r.pos + r.vel * 0.6 - p.pos).normalized())
	# best pass
	var best: PlayerSim = null
	var best_v := -1e9
	var through := false
	for q in m.team_players(t):
		if q == p:
			continue
		var d := q.pos.distance_to(p.pos)
		if d < 5.0 or d > 45.0:
			continue
		var open := m._openness(q, p)
		var progress := (q.pos.x - p.pos.x) * _ad()
		var v := open * 2.2 + progress * 0.08 + _xg(q.pos) * 3.0 - d * 0.015
		var risk := _pass_risk(p.pos, q.pos, m._pass_speed(d, 0.5))
		v -= risk * 3.2
		if risk > 0.6 and pressure < 0.7:
			continue
		if q.role == "GK":
			v -= 1.5
		var behind := q.role == "FWD" and q.vel.x * _ad() > 3.0 and progress > 0.0
		if v > best_v:
			best_v = v
			best = q
			through = behind and open > 0.45
	var ddir := _dribble_direction(p)
	var held: float = m.time - float(carry_since.get(p.id, m.time))
	var dribble_v := 0.3 - pressure * 1.6 + clampf(_space_in(p, ddir) / 10.0, 0.0, 1.0) * 0.8 + maxf(0.0, ddir.x * _ad()) * 0.45 + p.dribbling * 0.004 - held * 0.25
	if best and (best_v > dribble_v + 0.3 or pressure > 0.75 and best_v > 0.5):
		var kind := "through" if through else ("lob" if p.pos.distance_to(best.pos) > 32.0 else "pass")
		var dir := (best.pos - p.pos).normalized()
		var ok := m.request_kick(p, kind, 0.5, dir)
		# now and then a one-two in the final third
		if ok and kind == "pass" and p.role != "GK" and p.role != "DEF" and (p.pos.x * _ad()) > 0.0 and m.rng.randf() < 0.22:
			m.give_and_go[p.id] = m.time + 2.8
		return ok
	return false


func _pass_risk(a: Vector2, b: Vector2, speed: float) -> float:
	## 0..1: can an opponent get to the pass line before the ball does (including the receiver's marker)
	var ab := b - a
	var L := ab.length()
	if L < 0.1:
		return 0.0
	var dirn := ab / L
	var risk := 0.0
	for o in m.team_players(1 - t):
		var along := clampf((o.pos - a).dot(dirn), 0.0, L)
		var lane := (a + dirn * along - o.pos).length()
		var t_b := along / maxf(speed * 0.85, 1.0)
		var t_o := maxf(0.0, lane - 0.9) / 6.5 + 0.3
		risk = maxf(risk, 1.0 / (1.0 + exp(-(t_b - t_o) * 5.0)))
		if along < 2.0 and lane < 1.1 and (o.pos - a).dot(dirn) > -0.6:
			risk = maxf(risk, 0.85)   # he is standing in the way: the pass would hit him
	return risk


# ------------------------------------------------------------------ keeper

func _keeper(p: PlayerSim, dt: float) -> void:
	if p.action == "gk_hold":
		var held: float = m.time - float(p.act.get("since", m.time))
		if held > 1.6:
			# distribute: short throw to a free defender or a long punt
			var best: PlayerSim = null
			var bv := 0.3
			for q in m.team_players(t):
				if q == p:
					continue
				var d := q.pos.distance_to(p.pos)
				var open := m._openness(q, p)
				if d > 10.0 and d < 35.0 and open > bv:
					bv = open
					best = q
			if best and m.rng.randf() < 0.6:
				m.request_kick(p, "pass", 0.6, (best.pos - p.pos).normalized())
			else:
				m.request_kick(p, "clear", 0.9, Vector2(_ad(), 0).rotated(m.rng.randf_range(-0.4, 0.4)))
		return
	var h := home(p, m.possession_team == t)
	# come for loose balls in the box
	if m.owner < 0 and p.id == chaser:
		_chase(p)
		return
	_go(p, h, 0.3)
	p.face_to = (m.ball2() - p.pos).normalized()
	if p.pos.distance_to(h) < 2.0:
		p.style = PlayerSim.Style.JOCKEY


# ------------------------------------------------------------------ set pieces

func set_piece_positions(kind: String, team: int, spot: Vector2) -> void:
	var attacking := team == t
	var hl := m.pitch.half_l()
	var box_x := m.goal_x(team) - m.attack_dir(team) * m.pitch.penalty_spot
	var n := 0
	for p in m.team_players(t):
		if p.id == m.restart.get("taker", -1):
			continue
		var target := home(p, attacking)
		if kind == "corner" or kind == "free_kick" and spot.distance_to(Vector2(m.goal_x(team), 0)) < 30.0:
			if p.role == "GK":
				target = home(p, attacking) if attacking else Vector2(m.goal_x(team) - m.attack_dir(team) * 0.6, 0)
			elif attacking and (p.role == "FWD" or p.role == "DEF" and p.slot.y != 0.0 and absf(p.slot.y) < 0.5 or p.role == "MID" and n < 2):
				target = Vector2(box_x + m.rng.randf_range(-3.0, 4.0) * m.attack_dir(team), m.rng.randf_range(-7.0, 7.0))
				n += 1
			elif not attacking and p.role != "FWD":
				target = Vector2(box_x + m.rng.randf_range(-1.0, 4.0) * m.attack_dir(team), m.rng.randf_range(-8.0, 8.0))
		if kind == "penalty":
			target = Vector2(box_x - m.attack_dir(team) * m.rng.randf_range(6.0, 10.0), m.rng.randf_range(-12.0, 12.0))
			if p.role == "GK" and not attacking:
				target = Vector2(m.goal_x(team), 0)
		# keep 9 m from the ball when defending
		if not attacking and target.distance_to(spot) < 9.0 and p.role != "GK":
			target = spot + (target - spot).normalized() * 9.2
		p.pos = target
		p.vel = Vector2.ZERO
		p.facing = (m.ball2() - p.pos).normalized() if (m.ball2() - p.pos).length() > 0.1 else p.facing


func take_set_piece(p: PlayerSim, kind: String) -> void:
	match kind:
		"kickoff":
			var mate := _nearest_mate(p, Vector2(-_ad(), 0))
			m._take_set_piece(p, "pass", 0.3, (mate.pos - p.pos).normalized() if mate else Vector2(-_ad(), 0))
		"corner":
			var target := Vector2(m.goal_x(t) - _ad() * m.rng.randf_range(6.0, 11.0), m.rng.randf_range(-5.0, 5.0))
			m._take_set_piece(p, "cross", 0.6, (target - p.pos).normalized())
		"goal_kick":
			if m.rng.randf() < 0.5:
				m._take_set_piece(p, "clear", 0.95, Vector2(_ad(), 0).rotated(m.rng.randf_range(-0.5, 0.5)))
			else:
				var mate2 := _nearest_mate(p, Vector2(_ad(), 0))
				m._take_set_piece(p, "pass", 0.5, (mate2.pos - p.pos).normalized() if mate2 else Vector2(_ad(), 0))
		"penalty":
			m._take_set_piece(p, "shot", m.rng.randf_range(0.6, 0.95), Vector2(_ad(), m.rng.randf_range(-1.0, 1.0)).normalized())
		"free_kick":
			var goal := Vector2(m.goal_x(t), 0)
			if p.pos.distance_to(goal) < 27.0 and absf(p.pos.y) < 14.0 and m.rng.randf() < 0.6:
				m._take_set_piece(p, "shot", 0.75, (goal - p.pos).normalized())
			else:
				var mate3 := _nearest_mate(p, Vector2(_ad(), 0))
				m._take_set_piece(p, "pass", 0.5, (mate3.pos - p.pos).normalized() if mate3 else Vector2(_ad(), 0))
		_:
			var mate4 := _nearest_mate(p, Vector2(_ad(), 0))
			m._take_set_piece(p, "pass", 0.4, (mate4.pos - p.pos).normalized() if mate4 else p.facing)


func _nearest_mate(p: PlayerSim, prefer: Vector2) -> PlayerSim:
	var best: PlayerSim = null
	var bs := 1e9
	for q in m.team_players(t):
		if q == p or q.role == "GK":
			continue
		var d := q.pos.distance_to(p.pos)
		var s := d - (q.pos - p.pos).normalized().dot(prefer) * 4.0 + (40.0 if d < 4.0 else 0.0) - m._openness(q, p) * 6.0
		if s < bs:
			bs = s
			best = q
	return best


# ------------------------------------------------------------------ celebrations

func celebrate(scorer: int) -> void:
	celebrating = scorer


func _update_celebration(_dt: float) -> void:
	for p in m.team_players(t):
		if p.human >= 0 and m.phase != "goal":
			continue
		p.style = PlayerSim.Style.NORMAL
		if celebrating >= 0:
			var s := m.players[celebrating]
			if p.id == celebrating:
				var corner := Vector2(m.goal_x(t) * 0.92, signf(s.pos.y + 0.01) * m.pitch.half_w() * 0.85)
				_go(p, corner, 0.7 if m.phase_t < 2.2 else 0.0)
				if m.phase_t > 2.2:
					p.move = Vector2.ZERO
			else:
				_go(p, s.pos + (p.pos - s.pos).normalized() * 1.2, 0.5 if p.role != "GK" else 0.0)
				if p.role == "GK":
					p.move = Vector2.ZERO
		else:
			_go(p, kickoff_spot(p), 0.0)
			p.move *= 0.5
