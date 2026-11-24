extends Control
## First scene: a light 2D screen that shows at once, then loads the game. On Android it also looks for a crash of
## the previous run in the app's own log and, if there was one, shows it with a COPY button so it can be sent to us.

const MAIN := "res://scenes/main.tscn"
const SEEN := "user://last_crash.txt"
const RUNNING := "user://running.flag"     # there while the game runs; gone after a clean pause / exit
const NATIVE := "res://native/afcgf.gdextension"
const NATIVE_STATE := "user://native_state.cfg"
static var native_note := ""               # why the match engine is off, for the title screen

var status: Label


func _ready() -> void:
	_load_native()
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
	# the log is read only when the last run did not end cleanly (reading it costs seconds on some phones)
	var crash := _previous_crash() if FileAccess.file_exists(RUNNING) else ""
	mark_running(true)
	if crash != "":
		_show_crash(crash)
		return
	_load_game()


## The run flag: set while playing, cleared when the app is paused or closed normally (Profile does this).
static func mark_running(on: bool) -> void:
	if on:
		var f := FileAccess.open(RUNNING, FileAccess.WRITE)
		if f:
			f.store_string("1")
	elif FileAccess.file_exists(RUNNING):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(RUNNING))


## The native match engine (a GDExtension) is not in the build's auto-load list (tools/build_android.sh takes it out):
## it is loaded here, behind a guard. Before loading, this version's state is written as "trying"; once the title has
## run a few seconds main.gd marks it "ok". If the library takes the app down, the next start finds "trying", marks
## the version "failed" and the game runs on its built-in engine instead: it always opens, at worst on the second try.
static func _load_native() -> void:
	if ClassDB.class_exists("GFEngine") or not FileAccess.file_exists(NATIVE):
		return
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	var cfg := ConfigFile.new()
	cfg.load(NATIVE_STATE)
	var state := str(cfg.get_value("native", ver, ""))
	if state == "trying":
		cfg.set_value("native", ver, "failed")
		cfg.save(NATIVE_STATE)
		native_note = "it closed the game last time: playing on the built-in engine"
		# keep the evidence: the system log of that crash (this app's own lines) for Settings > Engine info
		_save_crash_log()
		return
	if state == "failed":
		native_note = "it failed on this phone: playing on the built-in engine"
		return
	cfg.set_value("native", ver, "trying")
	cfg.save(NATIVE_STATE)
	var st := GDExtensionManager.load_extension(NATIVE)
	if st != GDExtensionManager.LOAD_STATUS_OK and st != GDExtensionManager.LOAD_STATUS_ALREADY_LOADED:
		cfg.set_value("native", ver, "failed")
		cfg.save(NATIVE_STATE)
		native_note = "it could not be loaded (%d)" % st


const NATIVE_CRASH := "user://native_crash.txt"


static func _save_crash_log() -> void:
	if OS.get_name() != "Android":
		return
	var out := []
	if OS.execute("logcat", ["-d", "-v", "time", "-t", "3000"], out, true) != 0 or out.is_empty():
		return
	var keep := PackedStringArray()
	for l in str(out[0]).split("\n"):
		if l.contains("afcgf") or l.contains("dlopen") or l.contains("Fatal signal") or l.contains("F DEBUG") \
				or l.contains("F/DEBUG") or l.contains("backtrace") or l.contains("#0") or l.contains("abort") \
				or l.contains("godot") or l.contains("linker") or l.contains("GDExtension"):
			keep.append(l)
	var f := FileAccess.open(NATIVE_CRASH, FileAccess.WRITE)
	if f:
		f.store_string("\n".join(keep.slice(maxi(0, keep.size() - 120))))


## Everything known about the native engine on this phone, for Settings > Engine info (and to send to us).
static func native_report() -> String:
	var lines := PackedStringArray()
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	lines.append("Version %s   %s %s   %s" % [ver, OS.get_name(), OS.get_version(), OS.get_model_name()])
	lines.append("CPU: %s (%d cores)   arm64: %s" % [OS.get_processor_name(), OS.get_processor_count(), OS.has_feature("arm64")])
	lines.append("Match engine: " + ("ON" if ClassDB.class_exists("GFEngine") else "OFF"))
	var cfg := ConfigFile.new()
	cfg.load(NATIVE_STATE)
	if cfg.has_section("native"):
		for k in cfg.get_section_keys("native"):
			lines.append("  state %s: %s" % [k, cfg.get_value("native", k)])
	if native_note != "":
		lines.append("Note: " + native_note)
	var log := FileAccess.open("user://logs/godot.log", FileAccess.READ)
	if log:
		lines.append("--- godot.log")
		while not log.eof_reached():
			var l := log.get_line()
			if "afcgf" in l or "GDExtension" in l or "dynamic library" in l or "dlopen" in l or "ERROR" in l:
				lines.append(l.strip_edges())
	if FileAccess.file_exists(NATIVE_CRASH):
		lines.append("--- crash log")
		lines.append(FileAccess.get_file_as_string(NATIVE_CRASH))
	return "\n".join(lines)


## The game has been up a few seconds with the native engine loaded: this version is good on this phone.
static func confirm_native() -> void:
	if not ClassDB.class_exists("GFEngine"):
		return
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	var cfg := ConfigFile.new()
	cfg.load(NATIVE_STATE)
	if str(cfg.get_value("native", ver, "")) == "trying":
		cfg.set_value("native", ver, "ok")
		cfg.save(NATIVE_STATE)


func _load_game() -> void:
	# let this screen draw before the heavy loading starts, then load the game on a thread with a live percentage
	await get_tree().process_frame
	await get_tree().process_frame
	ResourceLoader.load_threaded_request(MAIN)
	var progress := []
	while ResourceLoader.load_threaded_get_status(MAIN, progress) == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
		status.text = "Loading… %d%%" % int(100.0 * float(progress[0]) if progress.size() > 0 else 0.0)
		await get_tree().process_frame
	# unpack the match engine's data here, behind "Loading", not when PLAY is pressed (first run / new version)
	if EngineMatchView.available():
		status.text = "Preparing the match engine…"
		await get_tree().process_frame
		await get_tree().process_frame
		GFData.prepare(EngineMatchView.data_dir())
	var scene := ResourceLoader.load_threaded_get(MAIN) as PackedScene
	if scene:
		get_tree().change_scene_to_packed(scene)
	else:
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
