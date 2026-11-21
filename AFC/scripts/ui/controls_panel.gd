class_name ControlsPanel
extends VBoxContainer
## Controller set-up (used in the main menu and in the pause menu): PES / FIFA presets, remapping every attack,
## defence and general action to any button or trigger, touch options and the keyboard layout.

signal changed

var tab := "attack"
var capturing := ""
var body: VBoxContainer
var capture_label: Label


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	_build()


func _build() -> void:
	for c in get_children():
		c.queue_free()
	var top := UI.hbox(10)
	top.add_child(UI.caption("Gamepad preset"))
	var presets := ["PES", "FIFA"]
	var cur: String = Profile.get_s("pad_preset")
	top.add_child(UI.pills(presets, presets.find(cur), func(i: int):
		Profile.apply_pad_preset(presets[i])
		changed.emit()
		_build()))
	if cur == "Custom":
		top.add_child(UI.label("  Custom layout", 18, UI.ACCENT))
	add_child(top)
	var tabs := ["Attack", "Defence", "General", "Touch", "Keyboard"]
	var keys := ["attack", "defence", "general", "touch", "keys"]
	add_child(UI.pills(tabs, keys.find(tab), func(i: int):
		tab = keys[i]
		capturing = ""
		_fill()))
	capture_label = UI.label("", 18, UI.FLARE)
	add_child(capture_label)
	body = UI.vbox(8)
	add_child(UI.scroll(body))
	_fill()


func _fill() -> void:
	for c in body.get_children():
		c.queue_free()
	capture_label.text = ""
	match tab:
		"attack":
			_actions(Profile.ATTACK_ACTIONS)
		"defence":
			_actions(Profile.DEFENCE_ACTIONS)
		"general":
			_actions(Profile.GENERAL_ACTIONS)
			body.add_child(UI.label("Skill moves use the right stick (see the Skills catalogue). Hold the skill modifier for the advanced ones.", 16, UI.MUTED))
		"touch":
			body.add_child(UI.slider_row("Button size", Profile.get_s("touch_size"), func(v: float): Profile.set_s("touch_size", v); changed.emit(), 0.7, 1.4))
			body.add_child(UI.slider_row("Button opacity", Profile.get_s("touch_opacity"), func(v: float): Profile.set_s("touch_opacity", v); changed.emit(), 0.25, 1.0))
			body.add_child(UI.toggle_row("Sprint by pushing the stick to the edge", Profile.get_s("edge_sprint"), func(v: bool): Profile.set_s("edge_sprint", v); changed.emit()))
			body.add_child(UI.toggle_row("Skill moves by swiping", Profile.get_s("swipe_skills"), func(v: bool): Profile.set_s("swipe_skills", v); changed.emit()))
			body.add_child(UI.toggle_row("Vibration", Profile.get_s("vibration"), func(v: bool): Profile.set_s("vibration", v); changed.emit()))
			body.add_child(UI.toggle_row("Fixed stick (off: it appears under your thumb)", Profile.get_s("touch_fixed"), func(v: bool): Profile.set_s("touch_fixed", v); changed.emit()))
			body.add_child(UI.toggle_row("Left-handed (stick on the right)", Profile.get_s("touch_left"), func(v: bool): Profile.set_s("touch_left", v); changed.emit()))
			body.add_child(UI.label("Flick up off PASS for a lofted pass, off THROUGH for a lofted through ball. Hold SHOOT for power (the ring).", 15, UI.MUTED))
			body.add_child(UI.label("Left half: movement stick. Right side: PASS, SHOOT, LOB, THROUGH — in defence they become PRESS, SLIDE, TACKLE, SWITCH. Swipe on the free right side for skill moves.", 16, UI.MUTED))
		"keys":
			var txt := "Move  W A S D / arrows\nPass  K      Shoot  L      Lob / cross  J      Through ball  I\nSprint  Shift      Close control / jockey  E      Switch  Q\nDefence: K pressure · I standing tackle · L slide · J teammate pressure\nSkill moves  1 – 0      Pause  Esc"
			body.add_child(UI.label(txt, 19))


func _actions(list: Array) -> void:
	for a in list:
		var id: String = a[0]
		var row := UI.hbox(10)
		var t := UI.label(a[1], 20)
		t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(t)
		var code = Profile.data["pad"].get(id, -1)
		var b := UI.button(Profile.button_name(code) if not (code is int and code < 0) else "—", func(): _capture(id), Vector2(170, 48), "accent" if capturing == id else "normal", 20)
		row.add_child(b)
		body.add_child(row)


func _capture(id: String) -> void:
	capturing = id
	_fill()
	capture_label.text = "Press the button or trigger for this action on your controller…"


func _input(event: InputEvent) -> void:
	if capturing == "" or not is_visible_in_tree():
		return
	var code = null
	if (event is InputEventJoypadButton or event is InputEventJoypadMotion) and not Pad.is_real(event.device):
		return
	if event is InputEventJoypadButton and event.pressed:
		code = event.button_index
	elif event is InputEventJoypadMotion and absf(event.axis_value) > 0.6:
		if event.axis == JOY_AXIS_TRIGGER_RIGHT:
			code = "RT"
		elif event.axis == JOY_AXIS_TRIGGER_LEFT:
			code = "LT"
	if code == null:
		return
	get_viewport().set_input_as_handled()
	Profile.set_binding(capturing, code)
	capturing = ""
	changed.emit()
	_build()
