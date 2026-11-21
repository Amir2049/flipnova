extends SceneTree
# The native engine crashes the app when a data file is missing, so GFData must never report ready data that is not.
#   godot --headless -s tests/gf_data_test.gd   (exit code 1 on failure; needs assets/gfdata.zip)
var fails := 0

func check(ok: bool, what: String) -> void:
	print(("ok   " if ok else "FAIL ") + what)
	if not ok:
		fails += 1

func _initialize():
	if not FileAccess.file_exists(GFData.ZIP):
		check(not GFData.prepare(OS.get_user_data_dir() + "/gfdata_test"), "no zip in the game: not ready")
		quit(1 if fails > 0 else 0)
		return
	var dir := OS.get_user_data_dir() + "/gfdata_test"
	check(GFData.prepare(dir), "unpacks and is complete")
	check(GFData.unpack(dir) == 0, "a second start does not unpack again")
	# a file the engine needs disappears (cleaner app, earlier unpack cut off): must unpack again
	var lines := FileAccess.get_file_as_string(dir + "/.version").split("\n", false)
	DirAccess.remove_absolute(dir + "/" + lines[lines.size() - 1])
	check(not GFData.complete(dir), "a missing file is noticed")
	check(GFData.prepare(dir) and FileAccess.file_exists(dir + "/" + lines[lines.size() - 1]), "and put back")
	# the 2.18 stamp (version only) with files missing must not count as ready
	var sf := FileAccess.open(dir + "/.version", FileAccess.WRITE)
	sf.store_string(lines[0])
	sf.close()
	check(not GFData.complete(dir), "an old version-only stamp is not trusted")
	check(GFData.prepare(dir), "and the data is unpacked again")
	quit(1 if fails > 0 else 0)
