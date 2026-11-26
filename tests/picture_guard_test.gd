extends SceneTree
# The match guard (2.59), under a real renderer (xvfb): a normal match is left alone; a match whose pitch is not
# drawn (BLACK=1: black over the 3D, labels on top - what some phones showed) steps the graphics down and says so.
# Restores the profile and the renderer file afterwards.
var mv
var f := 0
var boot
var keep_q
var keep_override := ""
var pr

func _initialize():
	boot = load("res://scripts/boot.gd")
	pr = get_root().get_node("Profile")
	if not pr.data.has("settings"):
		pr.data["settings"] = {}
	keep_q = pr.get_s("quality")
	if FileAccess.file_exists(boot.RENDER_OVERRIDE):
		keep_override = FileAccess.get_file_as_string(boot.RENDER_OVERRIDE)
	pr.set_s("quality", 1)
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 1}})
	print("marker while loading: ", FileAccess.file_exists(boot.MATCH_PENDING))
	if OS.get_environment("BLACK") == "1":
		var c := ColorRect.new()
		c.color = Color.BLACK
		c.set_anchors_preset(Control.PRESET_FULL_RECT)
		c.mouse_filter = Control.MOUSE_FILTER_IGNORE
		mv.add_child(c)
		mv.move_child(c, 0)

func _process(_dt) -> bool:
	f += 1
	if f == 200:
		var black := OS.get_environment("BLACK") == "1"
		var stepped: bool = int(pr.get_s("quality")) == 0
		print("picture %s  marker gone %s  quality low %s  renderer file %s  banner '%s'" % [mv.picture_stats,
			not FileAccess.file_exists(boot.MATCH_PENDING), stepped, FileAccess.file_exists(boot.RENDER_OVERRIDE),
			mv.warn_lbl.text.replace("\n", " ") if mv.warn_lbl else ""])
		var ok: bool = (stepped == black) and ((mv.warn_lbl != null) == black) and not FileAccess.file_exists(boot.MATCH_PENDING) and mv.picture_stats.x >= 0.0
		print("PASS" if ok else "FAIL")
		pr.set_s("quality", keep_q)
		pr.save()
		if keep_override != "":
			var o := FileAccess.open(boot.RENDER_OVERRIDE, FileAccess.WRITE)
			o.store_string(keep_override)
		elif FileAccess.file_exists(boot.RENDER_OVERRIDE):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(boot.RENDER_OVERRIDE))
		return true
	return false
