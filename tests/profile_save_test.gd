extends SceneTree
# The profile must survive a save that was cut off half way, and a dragged slider must not write the file each step.
#   godot --headless -s tests/profile_save_test.gd   (exit code 1 on failure)
var fails := 0

func check(ok: bool, what: String) -> void:
	print(("ok   " if ok else "FAIL ") + what)
	if not ok:
		fails += 1

var frame := 0

func _process(_d) -> bool:
	# from the first frame on, as in the game (the autoload is in the tree)
	frame += 1
	if frame == 2:
		run()
	return false

func run():
	var prof = get_root().get_node("Profile")
	check(prof.is_inside_tree(), "Profile autoload is in the tree")
	prof.data["career"] = {"club": 3, "season": 7}
	prof.save()
	prof.data["career"] = {"club": 3, "season": 8}
	prof.save()
	check(FileAccess.file_exists(prof.BAK), "a backup of the previous save is kept")
	check(not FileAccess.file_exists(prof.TMP), "no temporary file is left behind")
	# a save cut off half way: broken JSON in the main file
	var f := FileAccess.open(prof.PATH, FileAccess.WRITE)
	f.store_string('{"version": 6, "career": {"club": 3, "sea')
	f.close()
	prof.load_profile()
	check(int(prof.data["career"].get("season", 0)) == 7, "a broken profile.json falls back to the backup (season %s)" % prof.data["career"].get("season"))
	# 50 slider steps -> no write until the timer, then one
	prof.save()
	var before := FileAccess.get_modified_time(ProjectSettings.globalize_path(prof.PATH))
	var t0 := Time.get_ticks_usec()
	for i in 50:
		prof.set_s("volume", i / 50.0)
	check(prof._save_pending, "slider changes wait for one save")
	prof.flush()
	check(not prof._save_pending, "flush writes the waiting save")
	var d = JSON.parse_string(FileAccess.get_file_as_string(prof.PATH))
	check(d is Dictionary and absf(float(d["settings"]["volume"]) - 49 / 50.0) < 0.001, "the last value is on disk")
	print("50 slider steps took %d us" % (Time.get_ticks_usec() - t0))
	quit(1 if fails > 0 else 0)
