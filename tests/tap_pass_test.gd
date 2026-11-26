extends SceneTree
# Tap passing in a real engine match: a tap on open grass ahead of the dribbler sends the ball there (touch ->
# screen point -> pitch spot -> engine), a long press lofts it. Prints how close the ball came to each spot.
var mv
var f := 0
var spot := Vector2.ZERO
var watching := -1
var best := 1e9
var results := []
var kind := "tap"

func _initialize():
	var pr = get_root().get_node_or_null("Profile")
	if pr and not pr.data.has("settings"):
		pr.data["settings"] = {}
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 1}})

var k_down := false

func _key_k(down: bool) -> void:
	var ev := InputEventKey.new()
	ev.physical_keycode = KEY_K
	ev.keycode = KEY_K
	ev.pressed = down
	Input.parse_input_event(ev)
	k_down = down

func _process(_dt) -> bool:
	f += 1
	if mv.st.is_empty():
		return false
	if watching >= 0:
		watching += 1
		var b: Vector3 = mv.st["ball"]
		if kind == "hold" and watching in [1, 20, 40, 60, 80, 120, 160]:
			print("  w%d ball (%.1f %.1f %.1f) spot (%.1f %.1f) mode %s owner %s" % [watching, b.x, b.y, b.z, spot.x, spot.y, mv.st["mode"], mv.st["owner_team"]])
		if watching > 15 and b.z < 0.6:
			best = minf(best, Vector2(b.x, b.y).distance_to(spot))
		if watching >= 200:
			results.append([kind, best])
			print("%s pass: closest %.1f m to the spot" % [kind, best])
			watching = -1
			kind = "hold" if kind == "tap" else "tap"
	elif int(mv.st["mode"]) != 0 or int(mv.st["owner_team"]) == -1:
		# restarts wait for the human: take them (the K key is a pass)
		_key_k((f % 60) < 4)
	elif k_down:
		_key_k(false)   # never leave the pass key held into open play
	elif mv._on_ball() and f > 200 and int(mv.st["controlled"]) != 0:
		var o: int = int(mv.st["controlled"]) * int(mv.stride)
		var me := Vector2(float(mv.poses[o]), float(mv.poses[o + 1]))
		spot = Vector2(minf(me.x + (14.0 if kind == "tap" else 26.0), 45.0), clampf(me.y + 6.0, -28.0, 28.0))
		var sp: Vector2 = mv.cam.unproject_position(Vector3(spot.x, 0.0, -spot.y))
		mv.touch.gestures.append({"kind": kind, "dir": Vector2.ZERO, "pos": sp})
		watching = 0
		best = 1e9
		print("tap at me (%.1f %.1f) -> spot (%.1f %.1f) screen %s pitch %s" % [me.x, me.y, spot.x, spot.y, sp, mv._pitch_point(sp)])
	if f % 300 == 0:
		print("frame %d on_ball %s owner %s ctl %s" % [f, mv._on_ball(), mv.st["owner_team"], mv.st["controlled"]])
	if results.size() >= 6 or f > 2500:
		var ok := 0
		for r in results:
			if r[1] < 4.0:
				ok += 1
		print("TAP PASS RESULT %d of %d within 4 m" % [ok, results.size()])
		return true
	return false
