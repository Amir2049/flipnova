class_name Challenge
extends RefCounted
## Practice modes on the match pitch: Training (your team against a keeper), Shooting (60 s, score as many as you
## can from spots around the box), Skills (60 s, do the skill move shown).

const LENGTH := 60.0

var mv: MatchView
var sim: MatchSim
var mode := "training"
var time_left := LENGTH
var score := 0
var attempts := 0
var prompt := ""
var hold_t := 0.0
var idle_t := 0.0
var player: PlayerSim
var done := false
var started := false


func setup(view: MatchView) -> void:
	mv = view
	sim = view.sim
	mode = sim.mode
	sim.half_seconds = 1.0e9
	var t := mv.human_team if mv.human_team >= 0 else 0
	var opp := 1 - t
	var k := 0
	match mode:
		"training":
			time_left = INF
			for p in sim.team_players(opp):
				if p.role != "GK":
					_park(p, k)
					k += 1
		"shooting":
			player = _best(t, "finishing")
			for p in sim.players:
				if p != player and not (p.team == opp and p.role == "GK"):
					_park(p, k)
					k += 1
			_reset_shot()
		"skills":
			player = _best(t, "dribbling")
			player.skill_moves = 5
			for p in sim.players:
				if p != player:
					_park(p, k)
					k += 1
			_reset_skills()
			_new_prompt()
	started = true


func _park(p: PlayerSim, k: int) -> void:
	sim.parked[p.id] = Vector2(-50.0 + k * 3.0, -sim.pitch.half_w() - 20.0)
	p.pos = sim.parked[p.id]


func _best(t: int, attr: String) -> PlayerSim:
	var best: PlayerSim = null
	for p in sim.team_players(t):
		if p.role != "GK" and (best == null or float(p.get(attr)) > float(best.get(attr))):
			best = p
	return best


func _reset_shot() -> void:
	var ad := sim.attack_dir(player.team)
	var gx := ad * sim.pitch.half_l()
	var dist := randf_range(13.0, 26.0)
	var ang := randf_range(-0.65, 0.65)
	var pos := Vector2(gx - ad * dist * cos(ang), dist * sin(ang))
	player.pos = pos
	player.vel = Vector2.ZERO
	player.action = ""
	player.facing = (Vector2(gx, 0) - pos).normalized()
	var gk := sim.keeper_of(1 - player.team)
	gk.pos = Vector2(gx - ad * 1.2, 0)
	gk.vel = Vector2.ZERO
	gk.action = ""
	gk.clip = ""
	gk.facing = Vector2(-ad, 0)
	sim.in_hands = false
	sim.give_ball(player)
	hold_t = 0.0
	idle_t = 0.0
	attempts += 1


func _reset_skills() -> void:
	player.pos = Vector2(-10.0 * sim.attack_dir(player.team), 0)
	player.vel = Vector2.ZERO
	player.action = ""
	player.facing = Vector2(sim.attack_dir(player.team), 0)
	sim.give_ball(player)


func _new_prompt() -> void:
	var pool := []
	for s in Skills.LIST:
		if s["id"] != prompt:
			pool.append(s["id"])
	prompt = pool[randi() % pool.size()]


func prompt_text() -> Array:
	## [name, how to do it with the controls in use]
	var inf := Skills.info(prompt)
	var src := mv.input.source if mv.input else "touch"
	var how: String = inf.get("pad", "") if src == "pad" else (inf.get("keys", "") if src == "keys" else inf.get("touch", ""))
	return [inf.get("name", ""), how]


func step(dt: float) -> void:
	if done or not started:
		return
	if mode != "training":
		time_left -= dt
		if time_left <= 0.0:
			time_left = 0.0
			done = true
			var key := "shooting" if mode == "shooting" else "skills"
			var best := Profile.set_record(key, score) if Engine.get_main_loop().root.has_node("Profile") else false
			mv.hud.show_challenge_result(mode, score, attempts, best)
			return
	match mode:
		"shooting":
			if sim.in_hands:
				hold_t += dt
				if hold_t > 0.9:
					_reset_shot()
			elif sim.owner != player.id and sim.practice_reset <= 0.0:
				var bv := Vector2(sim.ball.vel.x, sim.ball.vel.z).length()
				if bv < 0.8 and sim.ball2().distance_to(player.pos) > 2.5:
					idle_t += dt
					if idle_t > 0.8:
						_reset_shot()
				else:
					idle_t = 0.0
		"skills":
			if sim.owner < 0 and sim.practice_reset <= 0.0 and sim.ball2().distance_to(player.pos) > 6.0:
				idle_t += dt
				if idle_t > 1.5:
					_reset_skills()
					idle_t = 0.0
			else:
				idle_t = 0.0


func on_event(e: Dictionary) -> void:
	if done:
		return
	match e["type"]:
		"practice_reset":
			if mode == "shooting":
				_reset_shot()
			elif mode == "skills":
				_reset_skills()


func on_goal() -> void:
	if mode == "shooting" and not done:
		score += 1


func on_skill(e: Dictionary) -> void:
	if mode != "skills" or done or player == null or e["pid"] != player.id:
		return
	if e["id"] == prompt:
		score += 1
		mv.hud.toast("✓  " + Skills.info(prompt)["name"])
		_new_prompt()
