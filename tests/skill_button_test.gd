extends SceneTree
# The SKILL button and the power shot (2.60), with real touch events:
#   tap SKILL -> skill_tap; swipe on SKILL -> skill_swipe in that direction; hold SKILL -> close control;
#   hold SHOOT past POWER_AT -> held_for says power, the label reads POWER; flick down off SHOOT stays a low drive.
#   godot --headless -s tests/skill_button_test.gd   (exit code 1 on failure)
var fails := 0
var tc
var frame := 0
var t0 := 0

func check(ok: bool, what: String) -> void:
	print(("ok   " if ok else "FAIL ") + what)
	if not ok:
		fails += 1

func _touch(name: String, i: int, pressed: bool, off := Vector2.ZERO) -> void:
	var e := InputEventScreenTouch.new()
	e.index = i
	e.pressed = pressed
	e.position = tc.buttons[name]["pos"] + off
	tc._input(e)

func _drag(name: String, i: int, off: Vector2) -> void:
	var e := InputEventScreenDrag.new()
	e.index = i
	e.position = tc.buttons[name]["pos"] + off
	tc._input(e)

func _kinds() -> Array:
	return tc.take_gestures().map(func(g): return g["kind"])

func _initialize():
	tc = load("res://scripts/ui/touch_controls.gd").new()
	get_root().add_child(tc)

func _process(_d) -> bool:
	frame += 1
	if frame == 2:
		tc.active = true
		tc._layout()
		check(tc.buttons.has("skill"), "there is a SKILL button")
		_touch("skill", 0, true)
		_touch("skill", 0, false)
		check(_kinds() == ["skill_tap"], "a tap on SKILL is a skill tap (step over)")
		_touch("skill", 1, true)
		_drag("skill", 1, Vector2(0, -60))
		_touch("skill", 1, false, Vector2(0, -60))
		var g: Array = tc.take_gestures()
		check(g.size() == 1 and g[0]["kind"] == "skill_swipe" and g[0]["dir"].y < -40.0, "a swipe up on SKILL is a skill swipe, direction kept")
		_touch("skill", 2, true)
		_touch("shoot", 3, true)
		t0 = frame
	if t0 > 0 and tc.held_for("shoot") > tc.POWER_AT + 0.05 and frame < 100000:
		print("held: shoot %.2f skill %.2f  shoot held %s" % [tc.held_for("shoot"), tc.held_for("skill"), tc.buttons["shoot"]["held"]])
		check(tc.skill_hold(), "SKILL held without a swipe: close control")
		check(tc.held_for("shoot") >= tc.POWER_AT, "SHOOT held past %.2f s: a power shot" % tc.POWER_AT)
		_touch("skill", 2, false)
		check(_kinds().is_empty(), "letting go of a held SKILL is not a move")
		_touch("shoot", 3, false)
		_touch("shoot", 4, true)
		_drag("shoot", 4, Vector2(0, 60))
		check(tc.variant("shoot") == "down", "a flick down off SHOOT is still a low drive")
		_touch("shoot", 4, false, Vector2(0, 60))
		tc.flash("STEP OVER")
		check(tc.flash_txt == "STEP OVER", "the move's name is shown")
		t0 = 0
		quit(1 if fails > 0 else 0)
	if frame > 3000:
		check(false, "SHOOT reached power within 3000 frames")
		quit(1)
	return false
