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
	var t0 := Time.get_ticks_msec()
	check(GFData.prepare(dir), "unpacks and is complete")
	print("     (unpacked in %d ms)" % (Time.get_ticks_msec() - t0))
	check(not FileAccess.file_exists(dir.get_base_dir() + "/gfdata_unpack.zip"), "the one-pass copy of the zip is removed")
	check(GFData.unpack(dir) == 0, "a second start does not unpack again")
	GFData._ready_dir = ""
	# a file the engine needs disappears (cleaner app, earlier unpack cut off): must unpack again
	var lines := FileAccess.get_file_as_string(dir + "/.version").split("\n", false)
	DirAccess.remove_absolute(dir + "/" + lines[lines.size() - 1])
	check(not GFData.complete(dir), "a missing file is noticed")
	check(GFData.prepare(dir) and FileAccess.file_exists(dir + "/" + lines[lines.size() - 1]), "and put back")
	# the 2.18 stamp (version only) with files missing must not count as ready
	var sf := FileAccess.open(dir + "/.version", FileAccess.WRITE)
	sf.store_string(lines[0])
	sf.close()
	GFData._ready_dir = ""
	check(not GFData.complete(dir), "an old version-only stamp is not trusted")
	check(GFData.prepare(dir), "and the data is unpacked again")
	# a re-unpack cut off half way (app killed): the stamp must already be gone while files are rewritten
	DirAccess.remove_absolute(dir + "/" + lines[1])
	GFData._ready_dir = ""
	check(not GFData.complete(dir), "a file missing again is noticed")
	_rmdir(dir)
	quit(1 if fails > 0 else 0)


func _rmdir(path: String) -> void:
	var d := DirAccess.open(path)
	if d == null:
		return
	d.include_hidden = true
	for f in d.get_files():
		d.remove(f)
	for sd in d.get_directories():
		_rmdir(path + "/" + sd)
	DirAccess.remove_absolute(path)
