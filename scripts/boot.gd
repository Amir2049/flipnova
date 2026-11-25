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
## it is loaded here, behind a guard, and every step is written down first (NATIVE_STEP), so a death is never a guess:
## - the library itself catches its own crashes and writes where (NATIVE_TRACE, native/src/crash_guard.cpp);
## - a run that died while loading the library or in a match's first 15 s, with no crash written, counts as
##   unexplained (the phone may have killed it): the engine is only switched off after two of those in a row.
## Switched off, the game runs on its built-in engine; Settings > Engine info / the title can try it again.
static func _load_native() -> void:
	if ClassDB.class_exists("GFEngine") or not FileAccess.file_exists(NATIVE):
		if ClassDB.class_exists("GFEngine"):
			_arm_crash_guard()
		return
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	var cfg := ConfigFile.new()
	cfg.load(NATIVE_STATE)
	var state := str(cfg.get_value("native", ver, ""))
	var died_in_match := str(cfg.get_value("native_match", ver, "")) == "trying"
	var trace := _new_trace()
	if state == "trying" or died_in_match:
		var step := FileAccess.get_file_as_string(NATIVE_STEP).strip_edges() if FileAccess.file_exists(NATIVE_STEP) else "?"
		_save_crash_log()
		if trace != "":
			cfg.set_value("native", ver, "failed")
			cfg.set_value("native_match", ver, "failed")
			cfg.save(NATIVE_STATE)
			native_note = "it crashed (" + trace + ")"
			return
		var n := int(cfg.get_value("unexplained", ver, 0)) + 1
		cfg.set_value("unexplained", ver, n)
		cfg.set_value("native_match", ver, "")
		if n >= 2:
			cfg.set_value("native", ver, "failed")
			cfg.save(NATIVE_STATE)
			native_note = "the game closed twice while: " + step
			return
		cfg.save(NATIVE_STATE)
	elif state == "failed":
		native_note = "it failed on this phone before: " + str(cfg.get_value("reason", ver, "see Engine info"))
		return
	cfg.set_value("native", ver, "trying")
	cfg.save(NATIVE_STATE)
	step("loading the engine library")
	var st := GDExtensionManager.load_extension(NATIVE)
	if st != GDExtensionManager.LOAD_STATUS_OK and st != GDExtensionManager.LOAD_STATUS_ALREADY_LOADED:
		cfg.set_value("native", ver, "failed")
		native_note = "the library did not load (status %d): %s" % [st, _log_reason()]
		cfg.set_value("reason", ver, native_note)
		cfg.save(NATIVE_STATE)
		return
	_arm_crash_guard()
	step("library loaded")
	cfg.set_value("native", ver, "ok")
	cfg.set_value("unexplained", ver, 0)
	cfg.save(NATIVE_STATE)


const NATIVE_STEP := "user://native_step.txt"       # what the game was doing with the engine (written before it)
const NATIVE_TRACE := "user://native_trace.txt"     # crash reports written by the engine itself
const NATIVE_TRACE_SEEN := "user://native_trace_seen.txt"


## Note what is about to happen with the engine (flushed to disk: it must survive a crash right after).
static func step(what: String) -> void:
	var f := FileAccess.open(NATIVE_STEP, FileAccess.WRITE)
	if f:
		f.store_string("%s  (%s)" % [what, Time.get_datetime_string_from_system()])
		f.flush()


## From now on the engine writes its own crash reports.
static func _arm_crash_guard() -> void:
	var e = ClassDB.instantiate("GFEngine")
	if e and e.has_method("set_crash_file"):
		e.set_crash_file(ProjectSettings.globalize_path(NATIVE_TRACE))


## A crash report the engine wrote since the last start: its first lines (signal, step, top frame) for the title, the
## whole report kept for Engine info.
static func _new_trace() -> String:
	if not FileAccess.file_exists(NATIVE_TRACE):
		return ""
	var t := FileAccess.get_file_as_string(NATIVE_TRACE)
	var f := FileAccess.open(NATIVE_TRACE_SEEN, FileAccess.WRITE)
	if f:
		f.store_string(t)
	DirAccess.remove_absolute(ProjectSettings.globalize_path(NATIVE_TRACE))
	var lines := t.split("\n", false)
	var short := PackedStringArray()
	for l in lines:
		if l.begins_with("=== ") or l.begins_with("step:") or l.contains("#0"):
			short.append(l.replace("=== native crash: ", "").strip_edges())
		if short.size() >= 3:
			break
	return "; ".join(short)


## The reason Godot gave for a library that would not load (its log: "Can't open dynamic library ... dlopen ...").
static func _log_reason() -> String:
	var f := FileAccess.open("user://logs/godot.log", FileAccess.READ)
	if f == null:
		return "no log"
	var found := ""
	while not f.eof_reached():
		var l := f.get_line()
		if "afcgf" in l or "dynamic library" in l or "dlopen" in l or "GDExtension" in l:
			found = l.strip_edges()
	return found if found != "" else "no reason in the log"


## Around the start of a native-engine match: a crash in there switches the engine off for the next start.
static func native_match_guard(on: bool) -> void:
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	var cfg := ConfigFile.new()
	cfg.load(NATIVE_STATE)
	cfg.set_value("native_match", ver, "trying" if on else "ok")
	cfg.save(NATIVE_STATE)


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
	if FileAccess.file_exists(NATIVE_STEP):
		lines.append("Last engine step: " + FileAccess.get_file_as_string(NATIVE_STEP).strip_edges())
	if FileAccess.file_exists(NATIVE_TRACE_SEEN):
		lines.append("--- the engine's own crash report")
		lines.append(FileAccess.get_file_as_string(NATIVE_TRACE_SEEN).strip_edges())
	var prev := _previous_log()
	if prev != "":
		lines.append("--- end of the previous run's log")
		lines.append(prev)
	if FileAccess.file_exists(NATIVE_CRASH):
		lines.append("--- system log")
		lines.append(FileAccess.get_file_as_string(NATIVE_CRASH))
	return "\n".join(lines)


## The last lines of the run before this one (Godot keeps old logs as user://logs/godot<date>.log).
static func _previous_log() -> String:
	var d := DirAccess.open("user://logs")
	if d == null:
		return ""
	var files := Array(d.get_files()).filter(func(n: String) -> bool: return n.begins_with("godot") and n != "godot.log")
	if files.is_empty():
		return ""
	files.sort()
	var t := FileAccess.get_file_as_string("user://logs/" + str(files[-1]))
	var ls := t.split("\n", false)
	return "\n".join(ls.slice(maxi(0, ls.size() - 25)))


## A link that opens a new issue on the game's GitHub with the report filled in (the phone's browser, one tap).
static func report_url() -> String:
	var body := native_report()
	if body.length() > 5500:
		body = body.substr(0, 5500) + "\n..."
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	return "https://github.com/Amir2049/flipnova/issues/new?title=%s&body=%s" % [
		("Engine report " + ver + " " + OS.get_model_name()).uri_encode(), ("```\n" + body + "\n```").uri_encode()]


## Settings > Engine info > Try again: forget this version's failure, the next start loads the engine again.
static func retry_native() -> void:
	var ver := str(ProjectSettings.get_setting("application/config/version", ""))
	var cfg := ConfigFile.new()
	cfg.load(NATIVE_STATE)
	cfg.set_value("native", ver, "")
	cfg.set_value("native_match", ver, "")
	cfg.set_value("unexplained", ver, 0)
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
		step("unpacking the engine data")
		GFData.prepare(EngineMatchView.data_dir())
		step("engine data ready")
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
