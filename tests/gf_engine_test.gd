extends SceneTree
# The native engine (GDExtension) inside Godot: unpack the data, play CPU v CPU for a while, print the state.
func _initialize():
	if not ClassDB.class_exists("GFEngine"):
		print("GFEngine missing")
		quit(1)
		return
	var dir := OS.get_user_data_dir() + "/gfdata"
	var t0 := Time.get_ticks_msec()
	var n := GFData.unpack(dir)
	print("unpacked %d files in %d ms" % [n, Time.get_ticks_msec() - t0])
	var e = ClassDB.instantiate("GFEngine")
	t0 = Time.get_ticks_msec()
	var ok: bool = e.start(dir, {"human": 0, "match_seconds": 300.0})
	print("start ", ok, " in ", Time.get_ticks_msec() - t0, " ms")
	t0 = Time.get_ticks_msec()
	for i in 60:
		e.frames(100)
		if i % 10 == 0:
			var s: Dictionary = e.state()
			print("min %.1f mode %d goals %s ball %s owner %d/%d" % [s["minute"], s["mode"], str(s["goals"]), str(s["ball"]), s["owner_team"], s["owner_player"]])
	print("6000 frames in ", Time.get_ticks_msec() - t0, " ms")
	var p: PackedFloat32Array = e.poses()
	print("poses ", p.size(), " stride ", e.stride(), " p0 ", p.slice(0, 14))
	quit()
