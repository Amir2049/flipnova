extends Node
## Autoload "Profile": everything kept between sessions — settings, controller mapping, squad edits,
## career and cup saves, practice records. Stored as JSON in user://profile.json.

const PATH := "user://profile.json"
const TMP := "user://profile.json.tmp"
const BAK := "user://profile.json.bak"
const VERSION := 6

const ATTACK_ACTIONS := [["pass", "Short pass"], ["shoot", "Shoot"], ["lob", "Lob / cross"], ["through", "Through ball"],
	["sprint", "Sprint"], ["close", "Close control"], ["skill_mod", "Skill modifier"], ["stepover", "Step over"]]
const DEFENCE_ACTIONS := [["d_press", "Pressure (hold)"], ["d_tackle", "Standing tackle"], ["d_slide", "Slide tackle"],
	["d_team", "Teammate pressure (hold)"], ["d_switch", "Switch player"], ["d_jockey", "Jockey"], ["d_sprint", "Sprint"]]
const GENERAL_ACTIONS := [["pause", "Pause / team menu"], ["camera", "Change camera"]]

# Xbox-style names; on a PlayStation pad A=✕ B=○ X=□ Y=△ LB=L1 RB=R1 LT=L2 RT=R2
const PAD_PRESETS := {
	"PES": {"pass": JOY_BUTTON_A, "shoot": JOY_BUTTON_X, "lob": JOY_BUTTON_B, "through": JOY_BUTTON_Y,
		"sprint": JOY_BUTTON_RIGHT_SHOULDER, "close": "RT", "skill_mod": JOY_BUTTON_LEFT_SHOULDER, "stepover": JOY_BUTTON_RIGHT_STICK,
		"d_press": JOY_BUTTON_A, "d_tackle": JOY_BUTTON_Y, "d_slide": JOY_BUTTON_B, "d_team": JOY_BUTTON_X,
		"d_switch": JOY_BUTTON_LEFT_SHOULDER, "d_jockey": "RT", "d_sprint": JOY_BUTTON_RIGHT_SHOULDER,
		"pause": JOY_BUTTON_START, "camera": JOY_BUTTON_BACK},
	"FIFA": {"pass": JOY_BUTTON_A, "shoot": JOY_BUTTON_B, "lob": JOY_BUTTON_X, "through": JOY_BUTTON_Y,
		"sprint": "RT", "close": "LT", "skill_mod": JOY_BUTTON_LEFT_SHOULDER, "stepover": JOY_BUTTON_RIGHT_STICK,
		"d_press": JOY_BUTTON_A, "d_tackle": JOY_BUTTON_B, "d_slide": JOY_BUTTON_X, "d_team": JOY_BUTTON_RIGHT_SHOULDER,
		"d_switch": JOY_BUTTON_LEFT_SHOULDER, "d_jockey": "LT", "d_sprint": "RT",
		"pause": JOY_BUTTON_START, "camera": JOY_BUTTON_BACK},
}

const DEFAULT_SETTINGS := {
	"difficulty": 1, "half": 1, "camera": 0, "volume": 0.8, "crowd": 0.7, "effects": 0.9, "quality": 1,
	"radar": true, "names": true, "replays": true, "vibration": true, "stoppage_menu": false,
	"celebration": "random", "touch_size": 1.0, "touch_opacity": 0.75, "swipe_skills": true, "edge_sprint": false,
	"touch_fixed": false, "touch_left": false,
	"pad_preset": "PES", "home": 0, "away": 1, "side": 0,
	"style": "authentic", "game_speed": 1, "offside": true, "sl_sprint": 1.0, "sl_accel": 1.0, "sl_pass": 1.0, "sl_shot_error": 1.0,
	"weather": "auto", "time_of_day": "auto",
}

var data := {}
var _save_pending := false


func _ready() -> void:
	load_profile()


func load_profile() -> void:
	data = {"version": VERSION, "settings": DEFAULT_SETTINGS.duplicate(true), "pad": PAD_PRESETS["PES"].duplicate(true),
		"squads": {}, "career": {}, "cup": {}, "records": {}}
	# the main file, else the copy kept from the save before it (a save cut off half way leaves broken JSON)
	var d = _read_json(PATH)
	if not d is Dictionary:
		d = _read_json(BAK)
		if d is Dictionary:
			push_warning("Profile: profile.json was unreadable, restored the backup")
	if not d is Dictionary:
		return
	for k in ["squads", "career", "cup", "records"]:
		if d.get(k) is Dictionary:
			data[k] = d[k]
	if d.get("settings") is Dictionary:
		for k in d["settings"]:
			data["settings"][k] = d["settings"][k]
	if int(d.get("version", 0)) < 3:
		# 2.8: the new FC-style cameras start on Broadcast, and the team menu no longer pops up at every free kick
		data["settings"]["camera"] = 0
		data["settings"]["stoppage_menu"] = false
	if int(d.get("version", 0)) < 4:
		# 2.10: back to the Broadcast camera once (the old Wide view made players 4-5 % of the screen)
		data["settings"]["camera"] = 0
	if int(d.get("version", 0)) < 5:
		# 2.13: a real SPRINT button by default (pushing the small stick to its edge made players sprint all the time)
		data["settings"]["edge_sprint"] = false
		data["settings"]["touch_size"] = maxf(float(data["settings"].get("touch_size", 1.0)), 1.0)
	if int(d.get("version", 0)) < 6:
		# 2.18: "the players are very fast" - realistic tempo and the Normal game speed once
		data["settings"]["style"] = "authentic"
		data["settings"]["game_speed"] = 1
	if d.get("pad") is Dictionary:
		for k in d["pad"]:
			var v = d["pad"][k]
			data["pad"][k] = int(v) if (v is float or v is int) else str(v)


func _read_json(path: String):
	if not FileAccess.file_exists(path):
		return null
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return null
	return JSON.parse_string(f.get_as_text())


## Writes the profile safely: into a temporary file first, then swaps it in, keeping the previous save as a backup.
## A crash or a killed app in the middle of a save can then never leave the only copy broken.
func save() -> void:
	_save_pending = false
	var f := FileAccess.open(TMP, FileAccess.WRITE)
	if f == null:
		push_error("Profile: cannot write " + TMP)
		return
	f.store_string(JSON.stringify(data))
	f.flush()
	var err := f.get_error()
	f.close()
	if err != OK:
		push_error("Profile: write failed (%d), the old save is kept" % err)
		return
	var tmp_abs := ProjectSettings.globalize_path(TMP)
	var abs := ProjectSettings.globalize_path(PATH)
	if FileAccess.file_exists(PATH):
		DirAccess.copy_absolute(abs, ProjectSettings.globalize_path(BAK))
	if DirAccess.rename_absolute(tmp_abs, abs) != OK:
		# some file systems refuse to rename over a file: remove it first (the backup holds it)
		DirAccess.remove_absolute(abs)
		DirAccess.rename_absolute(tmp_abs, abs)


## Many small changes in a row (a slider being dragged) become one write a moment later.
func save_soon() -> void:
	if _save_pending:
		return
	_save_pending = true
	if not is_inside_tree():
		save()
		return
	get_tree().create_timer(0.6, true, false, true).timeout.connect(func():
		if _save_pending:
			save())


## Writes now if a save is waiting (the app going to the background, closing).
func flush() -> void:
	if _save_pending:
		save()


func _notification(what: int) -> void:
	if what in [NOTIFICATION_APPLICATION_PAUSED, NOTIFICATION_APPLICATION_FOCUS_OUT, NOTIFICATION_WM_CLOSE_REQUEST, NOTIFICATION_PREDELETE]:
		flush()


func _exit_tree() -> void:
	flush()


func get_s(key: String):
	return data["settings"].get(key, DEFAULT_SETTINGS.get(key))


func set_s(key: String, value) -> void:
	var old = data["settings"].get(key)
	if typeof(old) == typeof(value) and old == value:
		return
	data["settings"][key] = value
	save_soon()


func squads() -> Dictionary:
	return data["squads"]


func club_edits(club_index: int) -> Dictionary:
	var id: String = GameData.CLUBS[club_index]["id"]
	if not data["squads"].has(id):
		data["squads"][id] = {}
	return data["squads"][id]


func apply_pad_preset(name: String) -> void:
	data["pad"] = PAD_PRESETS[name].duplicate(true)
	data["settings"]["pad_preset"] = name
	save()


func set_binding(action: String, code) -> void:
	data["pad"][action] = code
	data["settings"]["pad_preset"] = "Custom"
	save()


static func button_name(code) -> String:
	if code is String:
		return code
	match int(code):
		JOY_BUTTON_A: return "A"
		JOY_BUTTON_B: return "B"
		JOY_BUTTON_X: return "X"
		JOY_BUTTON_Y: return "Y"
		JOY_BUTTON_LEFT_SHOULDER: return "LB"
		JOY_BUTTON_RIGHT_SHOULDER: return "RB"
		JOY_BUTTON_LEFT_STICK: return "L3"
		JOY_BUTTON_RIGHT_STICK: return "R3"
		JOY_BUTTON_START: return "Start"
		JOY_BUTTON_BACK: return "Back"
		JOY_BUTTON_DPAD_UP: return "D-pad ↑"
		JOY_BUTTON_DPAD_DOWN: return "D-pad ↓"
		JOY_BUTTON_DPAD_LEFT: return "D-pad ←"
		JOY_BUTTON_DPAD_RIGHT: return "D-pad →"
	return "Button %d" % int(code)


func record(key: String) -> int:
	return int(data["records"].get(key, 0))


func set_record(key: String, v: int) -> bool:
	if v > record(key):
		data["records"][key] = v
		save()
		return true
	return false
