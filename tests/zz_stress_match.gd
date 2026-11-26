extends SceneTree
# Crash hunt: whole short matches in the real view with a monkey on the controls - random stick, buttons, taps and
# long presses on the pitch, tactics and styles changed, replays forced - until full time. Prints progress.
var mv
var f := 0
var rng := RandomNumberGenerator.new()
var matches := 0

func _initialize():
	rng.seed = int(OS.get_environment("SEED")) if OS.get_environment("SEED") != "" else 7
	var pr = get_root().get_node_or_null("Profile")
	if pr and not pr.data.has("settings"):
		pr.data["settings"] = {}
	_new_match()

func _new_match():
	if mv:
		mv.queue_free()
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": rng.randi() % 8, "away": (rng.randi() % 7 + 1), "human_team": 0, "half_minutes": 0.6, "difficulty": rng.randf(),
		"camera": "broadcast", "opts": {"weather": ["clear", "rain", "auto"][rng.randi() % 3], "time_of_day": "auto", "quality": rng.randi() % 4}})
	matches += 1
	print("match ", matches)

func _process(_dt) -> bool:
	f += 1
	if mv.st.is_empty():
		return false
	if mv.paused and not mv.full_time and mv.half_done and mv.pause_root != null:
		mv.paused = false            # half time: SECOND HALF
		mv._close_overlay()
	var t = mv.touch
	if t and f % 7 == 0:
		t.stick = Vector2(rng.randf_range(-1, 1), rng.randf_range(-1, 1))
	if t and f % 23 == 0:
		var kinds := ["tap", "hold", "double", "swipe", "zigzag", "vee", "circle"]
		t.gestures.append({"kind": kinds[rng.randi() % kinds.size()], "dir": Vector2(rng.randf_range(-60, 60), rng.randf_range(-60, 60)),
			"pos": Vector2(rng.randf_range(100, 1180), rng.randf_range(120, 650))})
	if t and f % 11 == 0:
		var names := ["pass", "shoot", "through", "lob", "sprint"]
		var n: String = names[rng.randi() % names.size()]
		if t.buttons.has(n):
			t.buttons[n]["held"] = rng.randf() < 0.5
			t.buttons[n]["t_down"] = t._now()
			t.buttons[n]["commit"] = true
	if f % 400 == 0 and mv.engine.has_method("set_style"):
		mv.engine.set_style(rng.randi() % 2, rng.randi() % 4)
		mv.engine.set_tactics(rng.randi() % 2, rng.randf_range(-1, 1), rng.randf_range(-1, 1), rng.randf_range(-1, 1))
	if f % 900 == 0 and mv.replay_t < 0.0 and mv.rec.size() > 30:
		mv.replay_buf = mv.rec.duplicate()
		mv._start_replay()
	if f % 600 == 0:
		print("f %d min %.1f score %s" % [f, float(mv.st["minute"]), str(mv.st["goals"])])
	if mv.full_time:
		if matches >= int(OS.get_environment("MATCHES") if OS.get_environment("MATCHES") != "" else "2"):
			print("STRESS OK ", matches, " matches")
			return true
		_new_match()
	return false
