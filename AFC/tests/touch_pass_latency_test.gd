extends SceneTree
# PASS must count on the frame it is touched unless flick-to-loft is on (then it waits COMMIT to tell a flick).
#   godot --headless -s tests/touch_pass_latency_test.gd   (exit code 1 on failure)
var fails := 0
var tc
var frame := 0

func check(ok: bool, what: String) -> void:
	print(("ok   " if ok else "FAIL ") + what)
	if not ok:
		fails += 1

func _press(i: int, pressed: bool) -> void:
	var e := InputEventScreenTouch.new()
	e.index = i
	e.pressed = pressed
	e.position = tc.buttons["pass"]["pos"]
	tc._input(e)

func _initialize():
	tc = load("res://scripts/ui/touch_controls.gd").new()
	get_root().add_child(tc)

func _process(_d) -> bool:
	frame += 1
	if frame == 2:
		tc.configure({"flick_loft": false})
		tc.active = true
		_press(0, true)
		check(tc.held("pass"), "flick-to-loft off: PASS counts at once")
		_press(0, false)
		tc.configure({"flick_loft": true})
		_press(1, true)
		check(not tc.held("pass"), "flick-to-loft on: PASS waits to tell a tap from a flick")
		_press(1, false)
		quit(1 if fails > 0 else 0)
	return false
