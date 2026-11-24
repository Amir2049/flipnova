extends SceneTree
# Auto graphics: slow frames step the picture down one level at a time (render scale, shadows, 30 fps); fast frames
# step it back up.   godot --headless -s tests/frame_governor_test.gd   (exit 1 on failure)
var fails := 0

func check(ok: bool, what: String) -> void:
	print(("ok   " if ok else "FAIL ") + what)
	if not ok:
		fails += 1

func feed(g, dt: float, seconds: float) -> void:
	var t := 0.0
	while t < seconds:
		g._process(dt)
		t += dt

var frame := 0

func _process(_d) -> bool:
	# from the first frames on (autoloads and the class cache are ready then)
	frame += 1
	if frame == 2:
		run()
	return false

func run():
	var mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	mv.sun = DirectionalLight3D.new()
	mv.sun.shadow_enabled = true
	mv.add_child(mv.sun)
	var g = load("res://scripts/view/frame_governor.gd").new()
	mv.add_child(g)
	g.setup(mv)
	check(g.level == 0 and is_equal_approx(mv.get_viewport().scaling_3d_scale, 1.0), "starts at the full picture")
	feed(g, 1.0 / 40.0, 6.0)   # the first decision comes after the start-up cooldown
	check(g.level == 1 and is_equal_approx(mv.get_viewport().scaling_3d_scale, 0.85), "40 fps: render scale down to 85 %")
	feed(g, 1.0 / 40.0, 2.0)
	check(g.level == 1, "waits before the next change")
	for i in 6:
		feed(g, 1.0 / 20.0, 7.0)
	check(g.level == 5 and not mv.sun.shadow_enabled and Engine.max_fps == 30, "20 fps: all the way down (blob shadows, 30 fps)")
	g.level = 3
	g._apply()
	feed(g, 1.0 / 60.0, 7.0)
	check(g.level == 2, "60 fps again: one step back up")
	Engine.max_fps = 0
	quit(1 if fails > 0 else 0)
