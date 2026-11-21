class_name InputReader
extends RefCounted
## Gamepad (remappable, PES or FIFA preset), keyboard and touch -> the human player's movement, kicks, skills,
## defending and celebrations. Kicks charge while held (power bar) and fire on release.

const KICKS := ["pass", "shoot", "lob", "through"]
const KEY_SKILLS := [["feint", -1.0], ["feint", 1.0], ["burst", 1.0], ["dragback", 1.0], ["roll", 1.0],
	["stepover", 1.0], ["cruyff", 1.0], ["roulette", 1.0], ["elastico", 1.0], ["rainbow", 1.0]]
const KEY_CODES := [KEY_1, KEY_2, KEY_3, KEY_4, KEY_5, KEY_6, KEY_7, KEY_8, KEY_9, KEY_0]

var m: MatchSim
var cam: CameraRig
var touch: TouchControls
var slot := 0
var pad := {}                 # action -> joy button index, or "LT" / "RT"
var edge_sprint := true
var swipe_skills := true
var celebration := "random"
var held_t := {}
var was := {}                 # held state last tick, by name
var source := "touch"         # touch, pad, keys (the HUD hides the touch controls for pad / keys)
var gauge_name := ""
var gauge := 0.0
var team_press := false
var pause_pressed := false
var camera_pressed := false
var rs_armed := true
var world := Vector2.ZERO


func setup(match_sim: MatchSim, camera: CameraRig, tc: TouchControls, bindings: Dictionary = {}, opts: Dictionary = {}) -> void:
	m = match_sim
	cam = camera
	touch = tc
	pad = bindings if not bindings.is_empty() else Profile.PAD_PRESETS["PES"].duplicate()
	edge_sprint = opts.get("edge_sprint", true)
	swipe_skills = opts.get("swipe_skills", true)
	celebration = opts.get("celebration", "random")


func _pad(action: String) -> bool:
	var dev := Pad.device()
	if dev < 0:
		return false
	var code = pad.get(action, -1)
	if code is String:
		if not Pad.confirmed():
			return false
		if code == "RT":
			return Input.get_joy_axis(dev, JOY_AXIS_TRIGGER_RIGHT) > 0.45
		if code == "LT":
			return Input.get_joy_axis(dev, JOY_AXIS_TRIGGER_LEFT) > 0.45
		return false
	var on := int(code) >= 0 and Input.is_joy_button_pressed(dev, int(code))
	if on:
		Pad.confirm(dev)
	return on


func _key(action: String) -> bool:
	match action:
		"pass", "d_press":
			return Input.is_physical_key_pressed(KEY_K)
		"shoot", "d_slide":
			return Input.is_physical_key_pressed(KEY_L)
		"lob", "d_team":
			return Input.is_physical_key_pressed(KEY_J)
		"through", "d_tackle":
			return Input.is_physical_key_pressed(KEY_I)
		"sprint", "d_sprint":
			return Input.is_physical_key_pressed(KEY_SHIFT)
		"close", "d_jockey":
			return Input.is_physical_key_pressed(KEY_E)
		"d_switch":
			return Input.is_physical_key_pressed(KEY_Q)
		"skill_mod":
			return Input.is_physical_key_pressed(KEY_CTRL)
	return false


# touch: the four round buttons carry different jobs in attack and defence
func _touch(action: String) -> bool:
	if touch == null or not touch.active:
		return false
	match action:
		"pass", "shoot", "lob", "through":
			return touch.held(action)
		"d_press":
			return touch.held("pass")
		"d_slide":
			return touch.held("shoot")
		"d_tackle":
			return touch.held("lob")
		"d_switch":
			return touch.held("through")
		"sprint", "d_sprint":
			return touch.held("sprint") or (edge_sprint and touch.stick.length() > 0.93)
	return false


func _on(action: String) -> bool:
	var p := _pad(action)
	var k := _key(action)
	if p:
		source = "pad"
	elif k:
		source = "keys"
	return p or k or _touch(action)


func _edge(name: String, on: bool) -> bool:
	var e: bool = on and not was.get(name, false)
	was[name] = on
	return e


func attacking() -> bool:
	var t: int = m.humans[slot]["team"]
	if m.phase in ["kickoff", "restart"]:
		return m.restart.get("team", -1) == t
	if m.owner >= 0:
		return m.players[m.owner].team == t
	return m.possession_team == t and m.time - m.kick_t < 2.5


func tick(dt: float) -> void:
	pause_pressed = _edge("pause", _pad("pause"))
	camera_pressed = _edge("camera", _pad("camera"))
	if m.humans.is_empty():
		return
	var h: Dictionary = m.humans[slot]
	if h["pid"] < 0:
		return
	var p: PlayerSim = m.players[h["pid"]]
	# movement
	var stick := Vector2.ZERO
	var dev := Pad.device()
	var ls := Vector2(Input.get_joy_axis(dev, JOY_AXIS_LEFT_X), -Input.get_joy_axis(dev, JOY_AXIS_LEFT_Y)) if dev >= 0 and Pad.confirmed() else Vector2.ZERO
	if ls.length() > 0.2:
		stick = ls.normalized() * clampf((ls.length() - 0.2) / 0.8, 0.0, 1.0)
		source = "pad"
	var kx := float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT)) - float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT))
	var ky := float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP)) - float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN))
	if kx != 0.0 or ky != 0.0:
		stick = Vector2(kx, ky).normalized()
		source = "keys"
	if touch and touch.stick.length() > 0.12:
		stick = touch.stick.limit_length(1.0)
		source = "touch"
	if touch and touch.any_touch:
		source = "touch"
		touch.any_touch = false
	world = cam.screen_to_world(stick) if stick.length() > 0.0 else Vector2.ZERO
	var atk := attacking()
	if touch:
		touch.set_defending(not atk)
	p.move = world
	p.style = PlayerSim.Style.NORMAL
	gauge_name = ""
	team_press = false
	# a goal: any button picks the celebration
	if m.phase == "goal":
		var any := false
		for k in KICKS:
			any = _edge("c_" + k, _on(k)) or any
		if any:
			m.human_celebrate(slot, celebration)
		return
	if atk:
		p.sprint = 1.0 if _on("sprint") else 0.0
		if _on("close"):
			p.style = PlayerSim.Style.CLOSE
		_attack(p, dt)
	else:
		p.sprint = 1.0 if _on("d_sprint") else 0.0
		_defend(p, dt)
	for k in KICKS:
		was[k] = _on(k)


func _attack(p: PlayerSim, dt: float) -> void:
	var now := {}
	for k in KICKS:
		now[k] = _on(k)
	# fake shot: shoot is charging and pass is pressed
	if held_t.get("shoot", 0.0) > 0.0 and now["pass"] and not was.get("pass", false) and m.owner == p.id:
		var side := 1.0 if _side_of(p, world) >= 0.0 else -1.0
		if m.human_skill(slot, "fakeshot", side):
			held_t["shoot"] = -99.0
			held_t["pass"] = -99.0
	# double tap on shoot: the shot on its way becomes a low driven one
	if now["shoot"] and not was.get("shoot", false) and m.human_low_shot(slot):
		held_t["shoot"] = -99.0
	for k in KICKS:
		if now[k]:
			if held_t.get(k, 0.0) < 0.0:
				continue   # consumed (fake shot / low driven)
			held_t[k] = held_t.get(k, 0.0) + dt
			if k == "shoot" or k == "lob" or held_t[k] > 0.12:
				gauge_name = k
				gauge = clampf(held_t[k] / (0.9 if k == "shoot" else 0.7), 0.0, 1.0)
			if held_t[k] > (1.0 if k == "shoot" else 0.85):
				_fire(k, 1.0, world)
				held_t[k] = -99.0
		else:
			if was.get(k, false):
				var ht: float = held_t.get(k, 0.0)
				if ht >= 0.0:
					var power := clampf(ht / (0.9 if k == "shoot" else 0.7), 0.0, 1.0)
					if k == "pass" or k == "through":
						power = maxf(power, 0.35)
					if k == "shoot":
						power = maxf(power, 0.2)
					_fire(k, power, world)
			held_t[k] = 0.0
	_skills(p)


func _skills(p: PlayerSim) -> void:
	if m.owner != p.id:
		_drain_gestures()
		return
	var mod := _on("skill_mod")
	# right stick flicks
	var dev := Pad.device()
	var rs := Vector2(Input.get_joy_axis(dev, JOY_AXIS_RIGHT_X), -Input.get_joy_axis(dev, JOY_AXIS_RIGHT_Y)) if dev >= 0 and Pad.confirmed() else Vector2.ZERO
	if rs.length() < 0.3:
		rs_armed = true
	elif rs.length() > 0.75 and rs_armed:
		rs_armed = false
		source = "pad"
		_skill_dir(p, cam.screen_to_world(rs.normalized()), mod)
	if _edge("stepover", _pad("stepover")):
		m.human_skill(slot, "stepover", 1.0 if _side_of(p, world) >= 0.0 else -1.0)
	# keyboard 1..0
	for i in KEY_CODES.size():
		if _edge("key%d" % i, Input.is_physical_key_pressed(KEY_CODES[i])):
			source = "keys"
			var ks: Array = KEY_SKILLS[i]
			var side: float = ks[1] if ks[0] == "feint" else (1.0 if _side_of(p, world) >= 0.0 else -1.0)
			m.human_skill(slot, ks[0], side)
	# touch gestures on the free right side of the screen
	if touch and swipe_skills:
		for g in touch.take_gestures():
			var d: Vector2 = g.get("dir", Vector2.ZERO)
			var wd := cam.screen_to_world(d.normalized()) if d.length() > 0.0 else Vector2.ZERO
			match g["kind"]:
				"swipe":
					_skill_dir(p, wd, false)
				"double":
					m.human_skill(slot, "stepover", 1.0 if _side_of(p, world) >= 0.0 else -1.0)
				"zigzag":
					m.human_skill(slot, "elastico", 1.0 if _side_of(p, wd) >= 0.0 else -1.0)
				"vee":
					m.human_skill(slot, "cruyff", 1.0 if _side_of(p, world) >= 0.0 else -1.0)
				"circle":
					m.human_skill(slot, "rainbow", 1.0)
	elif touch:
		_drain_gestures()


func _drain_gestures() -> void:
	if touch:
		touch.take_gestures()


## + when `d` points to the dribbler's right, - to his left
func _side_of(p: PlayerSim, d: Vector2) -> float:
	var f := p.vel.normalized() if p.vel.length() > 0.8 else p.facing
	return d.dot(-f.orthogonal())


func _skill_dir(p: PlayerSim, wd: Vector2, mod: bool) -> void:
	if wd.length() < 0.1:
		return
	var f := p.vel.normalized() if p.vel.length() > 0.8 else p.facing
	var rel := Vector2(wd.dot(f), wd.dot(-f.orthogonal()))
	var pick := Skills.from_direction(rel, mod)
	m.human_skill(slot, pick[0], pick[1])


func _defend(p: PlayerSim, dt: float) -> void:
	for k in KICKS:
		held_t[k] = 0.0
	if _on("d_jockey"):
		p.style = PlayerSim.Style.JOCKEY
		if m.owner >= 0:
			p.face_to = (m.players[m.owner].pos - p.pos).normalized()
	if _on("d_press"):
		m.human_press(slot, dt)
	if _edge("d_tackle", _on("d_tackle")):
		m.request_tackle(p)
	if _edge("d_slide", _on("d_slide")):
		m.request_slide(p)
	team_press = _on("d_team")
	if _edge("d_switch", _on("d_switch")):
		m.human_switch(slot, world)
	_drain_gestures()


func _fire(name: String, power: float, dir: Vector2) -> void:
	var kind: String = {"pass": "pass", "shoot": "shot", "lob": "lob", "through": "through"}[name]
	if (kind == "pass" or kind == "through") and _on("skill_mod"):
		m.human_give_and_go(slot)
	# a lob from wide near the box is a cross
	if kind == "lob" and m.humans[slot]["pid"] >= 0:
		var p: PlayerSim = m.players[m.humans[slot]["pid"]]
		var fx := (p.pos.x * m.attack_dir(p.team) + m.pitch.half_l()) / m.pitch.length
		if fx > 0.72 and absf(p.pos.y) > m.pitch.box_width * 0.4:
			kind = "cross"
	m.human_action(slot, kind, power, dir)
