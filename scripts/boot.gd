extends Control
## First scene: a light 2D screen that shows at once, then loads the game. On Android it also looks for a crash of
## the previous run in the app's own log and, if there was one, shows it with a COPY button so it can be sent to us.

const MAIN := "res://scenes/main.tscn"
const SEEN := "user://last_crash.txt"

var status: Label


func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.03, 0.05, 0.1)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_CENTER)
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.position = Vector2(-300, -120)
	vb.size = Vector2(600, 240)
	add_child(vb)
	var logo := Label.new()
	logo.text = "AFC"
	logo.add_theme_font_size_override("font_size", 110)
	logo.add_theme_color_override("font_color", Color(0.78, 1.0, 0.24))
	logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(logo)
	status = Label.new()
	status.text = "Loading…"
	status.add_theme_font_size_override("font_size", 24)
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(status)
	var ver := Label.new()
	ver.text = "v" + str(ProjectSettings.get_setting("application/config/version", "2.2")) + \
		("   match engine ON" if ClassDB.class_exists("GFEngine") else "   match engine OFF")
	ver.add_theme_color_override("font_color", Color(1, 1, 1, 0.4))
	ver.position = Vector2(16, 16)
	add_child(ver)
	var crash := _previous_crash()
	if crash != "":
		_show_crash(crash)
		return
	_load_game()


func _load_game() -> void:
	# let this screen draw before the heavy loading starts
	await get_tree().process_frame
	await get_tree().process_frame
	get_tree().change_scene_to_file(MAIN)


## The last crash of this app in its own log (an app may read its own log lines), if it is new.
func _previous_crash() -> String:
	if OS.get_name() != "Android":
		return ""
	var out := []
	var code := OS.execute("logcat", ["-d", "-v", "time", "-t", "1500"], out, true)
	if code != 0 or out.is_empty():
		return ""
	var lines: PackedStringArray = str(out[0]).split("\n")
	var keep := PackedStringArray()
	var crash_at := ""
	for l in lines:
		if l.contains("Fatal signal") or l.contains("FATAL EXCEPTION") or l.contains("AndroidRuntime") or l.contains("F libc") or l.contains("F/libc") \
				or l.contains("godot") or l.contains("E/") or l.contains("F/") or l.contains("DEBUG"):
			keep.append(l)
		if l.contains("Fatal signal") or l.contains("FATAL EXCEPTION"):
			crash_at = l.substr(0, 18)
	if crash_at == "":
		return ""
	var seen := ""
	if FileAccess.file_exists(SEEN):
		seen = FileAccess.get_file_as_string(SEEN)
	if seen == crash_at:
		return ""
	var f := FileAccess.open(SEEN, FileAccess.WRITE)
	if f:
		f.store_string(crash_at)
	var tail := keep.slice(maxi(0, keep.size() - 80))
	return "\n".join(tail)


func _show_crash(text: String) -> void:
	for c in get_children():
		if c is VBoxContainer:
			c.queue_free()
	var vb := VBoxContainer.new()
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 24
	vb.offset_right = -24
	vb.offset_top = 20
	vb.offset_bottom = -20
	vb.add_theme_constant_override("separation", 10)
	add_child(vb)
	var t := Label.new()
	t.text = "The game closed last time. Press COPY and paste it in the chat so it can be fixed."
	t.add_theme_font_size_override("font_size", 22)
	t.autowrap_mode = TextServer.AUTOWRAP_WORD
	vb.add_child(t)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	var copy := Button.new()
	copy.text = "COPY"
	copy.custom_minimum_size = Vector2(200, 64)
	copy.pressed.connect(func():
		DisplayServer.clipboard_set(text)
		copy.text = "COPIED ✓")
	row.add_child(copy)
	var go := Button.new()
	go.text = "CONTINUE"
	go.custom_minimum_size = Vector2(200, 64)
	go.pressed.connect(_load_game)
	row.add_child(go)
	vb.add_child(row)
	var box := TextEdit.new()
	box.text = text
	box.editable = false
	box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	box.add_theme_font_size_override("font_size", 14)
	vb.add_child(box)
