class_name Skills
extends RefCounted
## Skill moves: what each one does to the ball and the dribbler, how it is input, and how it fools defenders.
## Directions are relative to the dribbler: "forward" is where he is running.

const LIST := [
	{"id": "feint", "name": "Body Feint", "stars": 1, "dur": 0.55,
		"desc": "Drop the shoulder one way and go the other.",
		"pad": "Right stick to the side", "touch": "Swipe to the side", "keys": "1 (left) / 2 (right)"},
	{"id": "burst", "name": "Knock-On", "stars": 1, "dur": 0.3,
		"desc": "Push the ball into space and race after it.",
		"pad": "Right stick forward", "touch": "Swipe forward", "keys": "3"},
	{"id": "dragback", "name": "Drag Back", "stars": 2, "dur": 0.62,
		"desc": "Pull the ball back under the sole and turn away from pressure.",
		"pad": "Right stick back", "touch": "Swipe back", "keys": "4"},
	{"id": "fakeshot", "name": "Fake Shot", "stars": 2, "dur": 0.55,
		"desc": "Shape to shoot, then cut the ball away instead.",
		"pad": "Hold Shoot, then press Pass", "touch": "Hold SHOOT, then tap PASS", "keys": "Hold L, then K"},
	{"id": "roll", "name": "Ball Roll", "stars": 2, "dur": 0.55,
		"desc": "Roll the ball across the body with the sole.",
		"pad": "Right stick diagonally forward", "touch": "Swipe diagonally forward", "keys": "5"},
	{"id": "stepover", "name": "Step Over", "stars": 3, "dur": 0.7,
		"desc": "Circle the feet over the ball to freeze the defender.",
		"pad": "Click the right stick", "touch": "Double tap the empty right side", "keys": "6"},
	{"id": "cruyff", "name": "Cruyff Turn", "stars": 3, "dur": 0.62,
		"desc": "Fake a pass, then drag the ball behind the standing leg.",
		"pad": "LB + right stick back", "touch": "Swipe back, then forward (V)", "keys": "7"},
	{"id": "roulette", "name": "Roulette", "stars": 4, "dur": 0.78,
		"desc": "Spin over the ball, shielding it with the body.",
		"pad": "Right stick diagonally back", "touch": "Swipe diagonally back", "keys": "8"},
	{"id": "elastico", "name": "Elastico", "stars": 5, "dur": 0.48,
		"desc": "Flick the ball out with the outside of the foot and snap it back in.",
		"pad": "LB + right stick to the side", "touch": "Zig-zag swipe sideways", "keys": "9"},
	{"id": "rainbow", "name": "Rainbow Flick", "stars": 5, "dur": 0.7,
		"desc": "Flick the ball up over your own head and the defender's.",
		"pad": "LB + right stick forward", "touch": "Draw a circle", "keys": "0"},
]


static func info(id: String) -> Dictionary:
	for s in LIST:
		if s["id"] == id:
			return s
	return {}


## Which skill a direction asks for. rel: the input direction in the dribbler's frame
## (x forward, y to his right), mod: the skill modifier (LB) is held.
static func from_direction(rel: Vector2, mod: bool) -> Array:
	var a := rad_to_deg(atan2(rel.y, rel.x))   # 0 forward, +90 right, -90 left, 180 back
	var side := 1.0 if a >= 0.0 else -1.0
	var aa := absf(a)
	if mod:
		if aa < 45.0:
			return ["rainbow", side]
		if aa > 135.0:
			return ["cruyff", side]
		return ["elastico", side]
	if aa < 22.5:
		return ["burst", side]
	if aa < 67.5:
		return ["roll", side]
	if aa < 112.5:
		return ["feint", side]
	if aa < 157.5:
		return ["roulette", side]
	return ["dragback", side]


## A skill move in progress (action "skill"): moves the dribbler, drives the ball, poses the body.
## u: 0..1 through the move. R: the dribbler's right at the start. side: +1 right, -1 left.
static func step(m: MatchSim, p: PlayerSim, dt: float) -> void:
	var a := p.act
	var id: String = a["id"]
	var u := clampf(p.act_t / maxf(p.act_dur, 0.01), 0.0, 1.0)
	var F: Vector2 = a["f0"]
	var R := -F.orthogonal()
	var side: float = a["side"]
	var spd0: float = a["spd0"]
	var cruise := clampf(spd0, 1.5, 4.0)
	var want := F * cruise
	var ball_local := Vector2(0.42, 0.0)   # (forward, right) from the body
	var glue := true
	p.pose_lean = 0.0
	p.pose_spin = 0.0
	match id:
		"feint":
			# lean toward the fake side, then step out the other way
			p.pose_lean = side * 0.32 * sin(clampf(u / 0.55, 0.0, 1.0) * PI)
			if u < 0.45:
				want = F * cruise * 0.75 + R * side * 0.8
			else:
				want = F * cruise + R * (-side) * 3.2
			ball_local = Vector2(0.42, lerpf(0.0, -side * 0.25, smoothstep(0.4, 1.0, u)))
		"burst":
			glue = false
			if not a.get("kicked", false) and u > 0.15:
				a["kicked"] = true
				var bs := maxf(spd0 + 5.0, 8.5)
				m.ball.vel = Vector3(F.x * bs, 0.0, F.y * bs)
				m.release_ball(p, 0.22)
			want = F * maxf(spd0 + 1.5, p.top_speed * 0.9)
			p.sprint = 1.0
		"dragback":
			# stop, sole the ball back, turn and go the other way
			var turn := smoothstep(0.15, 0.85, u)
			p.facing = F.rotated(side * PI * turn).normalized()
			want = F * cruise * (1.0 - smoothstep(0.0, 0.35, u)) - F * 2.2 * smoothstep(0.55, 1.0, u)
			ball_local = Vector2(lerpf(0.42, -0.55, smoothstep(0.1, 0.6, u)), 0.0)
		"fakeshot":
			# plant to shoot, the leg swings, then the ball is cut across (the shot clip is cut short)
			if u > 0.42 and p.clip.begins_with("shot"):
				p.clip = ""
			want = F * cruise * (1.0 - smoothstep(0.0, 0.4, u)) + R * side * 3.0 * smoothstep(0.55, 1.0, u)
			ball_local = Vector2(0.45, side * 0.5 * smoothstep(0.5, 1.0, u))
		"roll":
			want = F * cruise * 0.5 + R * side * 2.4
			ball_local = Vector2(0.25, side * lerpf(-0.15, 0.35, u))
			p.pose_lean = -side * 0.12 * sin(u * PI)
		"stepover":
			p.pose_lean = 0.3 * sin(u * TAU * 2.0)
			want = F * minf(cruise, 2.8)
			ball_local = Vector2(0.45, 0.0)
			if u > 0.75:
				want += R * (-side) * 2.8
				ball_local.y = -side * 0.2 * smoothstep(0.75, 1.0, u)
		"cruyff":
			var t2 := smoothstep(0.35, 0.9, u)
			p.facing = F.rotated(side * PI * 0.62 * t2).normalized()
			want = F * cruise * (1.0 - smoothstep(0.0, 0.3, u)) + F.rotated(side * PI * 0.62) * 2.5 * smoothstep(0.6, 1.0, u)
			ball_local = Vector2(lerpf(0.42, -0.1, smoothstep(0.3, 0.7, u)), side * 0.35 * smoothstep(0.3, 0.8, u))
		"roulette":
			p.pose_spin = side * TAU * smoothstep(0.05, 0.95, u)
			want = F * cruise * 0.5 + R * side * 2.6
			ball_local = Vector2(0.2, side * 0.2)
		"elastico":
			want = F * cruise * 0.8 + R * side * 3.4 * smoothstep(0.35, 1.0, u)
			var out := -side * 0.35 * smoothstep(0.0, 0.3, u)
			ball_local = Vector2(0.4, lerpf(out, side * 0.55, smoothstep(0.3, 1.0, u)))
			p.pose_lean = -side * 0.2 * sin(clampf(u / 0.4, 0.0, 1.0) * PI)
		"rainbow":
			want = F * maxf(cruise, 3.5)
			if u < 0.3:
				ball_local = Vector2(lerpf(0.42, -0.15, u / 0.3), 0.0)
			else:
				glue = false
				if not a.get("kicked", false):
					a["kicked"] = true
					var fs := maxf(spd0, 3.5) + 1.2
					m.ball.vel = Vector3(F.x * fs, 6.8, F.y * fs)
					m.ball.spin = Vector3.ZERO
					m.release_ball(p, 0.45)
	p.vel = p.vel.move_toward(want, 26.0 * dt)
	if id not in ["dragback", "cruyff"]:
		p.facing = PlayerSim._rotate_towards(p.facing, F, 8.0 * dt)
	if glue and m.owner == p.id:
		var wp: Vector2 = p.pos + p.vel * dt + F * ball_local.x + R * ball_local.y
		var bp := m.ball2()
		var v := (wp - bp) / dt
		if v.length() > 14.0:
			v = v.normalized() * 14.0
		m.ball.vel = Vector3(v.x, 0.0, v.y)
		m.ball.spin = Vector3.ZERO
	p.advance_gait(dt)


## The move is over: hand the ball back to normal dribbling with a push the way the move went.
static func finish(m: MatchSim, p: PlayerSim) -> void:
	p.pose_lean = 0.0
	p.pose_spin = 0.0
	var a := p.act
	if m.owner != p.id:
		return
	var id: String = a.get("id", "")
	var F: Vector2 = a["f0"]
	var R := -F.orthogonal()
	var side: float = a["side"]
	var dir := F
	match id:
		"feint", "stepover":
			dir = (F + R * (-side) * 0.5).normalized()
		"fakeshot", "roll", "roulette", "elastico":
			dir = (F * 0.8 + R * side * 0.8).normalized()
		"dragback":
			dir = -F
		"cruyff":
			dir = F.rotated(side * PI * 0.62)
	var s := maxf(p.vel.length(), 2.0) * 0.9 + 0.7
	p.vel = dir * maxf(p.vel.length(), 2.0)
	# a move beyond his level can go wrong
	if a.get("botch", false):
		dir = dir.rotated(m.rng.randf_range(-1.2, 1.2))
		s += 3.5
		m.emit("heavy_touch", {"pid": p.id})
	m.ball.vel = Vector3(dir.x * s, 0.0, dir.y * s)
	p.facing = dir if id not in ["roulette"] else p.facing
	p.immune = 0.12


## Defenders close in front may bite: they lean / step the wrong way for a moment.
static func fool_defenders(m: MatchSim, p: PlayerSim, id: String, side: float) -> int:
	var inf := info(id)
	var stars: int = inf.get("stars", 1)
	var F: Vector2 = p.facing
	var R := -F.orthogonal()
	var n := 0
	for o in m.team_players(1 - p.team):
		if o.role == "GK" and id != "fakeshot":
			continue
		var rel := o.pos - p.pos
		var d := rel.length()
		if d > 4.0 or d < 0.1:
			continue
		if absf(F.angle_to(rel)) > deg_to_rad(80.0):
			continue
		var skill := (p.dribbling - o.agility) * 0.006 + (p.skill_moves - stars) * 0.06 + (0.12 if p.has_ps("technical") else 0.0)
		var chance := clampf(0.42 + 0.07 * stars + skill - (d - 1.5) * 0.06, 0.1, 0.9)
		if o.human >= 0:
			continue   # a human defender is never frozen by the game
		if m.rng.randf() < chance:
			o.fooled = 0.35 + 0.08 * stars
			var fake_side := side if id in ["feint", "stepover", "elastico", "fakeshot"] else -side
			o.fooled_dir = (R * fake_side * 0.8 + F * 0.3).normalized() if id != "dragback" else F
			if id == "fakeshot":
				o.fooled_dir = Vector2.ZERO   # he stops to block the shot
			n += 1
	return n
