extends SceneTree
## Touch controls on their own: a thumb on the stick, a tap on PASS, a flick up off PASS.
var tc: TouchControls
var f := 0
func _initialize():
	tc = TouchControls.new()
	get_root().add_child(tc)

func _ev(i: int, p: Vector2, down: bool) -> void:
	var e := InputEventScreenTouch.new()
	e.index = i
	e.position = p
	e.pressed = down
	Input.parse_input_event(e)

func _drag(i: int, p: Vector2) -> void:
	var e := InputEventScreenDrag.new()
	e.index = i
	e.position = p
	Input.parse_input_event(e)

func _process(_d) -> bool:
	f += 1
	match f:
		2:
			print("viewport ", tc.get_viewport_rect().size, " stick home ", tc.stick_home, " pass at ", tc.buttons["pass"]["pos"])
			_ev(0, tc.stick_home, true)
		3:
			_drag(0, tc.stick_home + Vector2(50, -20))
		5:
			print("stick ", tc.stick, " touch ", tc.stick_touch)
			_ev(3, tc.buttons["pass"]["pos"], true)
		6:
			print("pass held right after press: ", tc.held("pass"))
			_ev(3, tc.buttons["pass"]["pos"], false)
		7:
			print("pass held after a quick tap: ", tc.held("pass"), " variant '", tc.variant("pass"), "'")
		20:
			_ev(3, tc.buttons["pass"]["pos"], true)
		21:
			_drag(3, tc.buttons["pass"]["pos"] + Vector2(0, -60))
		22:
			print("after flick: held ", tc.held("pass"), " variant '", tc.variant("pass"), "'")
			_ev(3, tc.buttons["pass"]["pos"] + Vector2(0, -60), false)
		30:
			return true
	return false
