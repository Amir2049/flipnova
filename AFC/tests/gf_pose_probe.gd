extends SceneTree
# Where is a player really? Prints the humanoid node position (pose 0..2) and the "player" joint position (4..6).
func _initialize():
	var dir := ProjectSettings.globalize_path("user://gfdata")
	GFData.unpack(dir)
	var e = ClassDB.instantiate("GFEngine")
	e.start(dir, {"human": 0, "match_seconds": 600.0, "seed": 5})
	var s: int = e.stride()
	for f in 1200:
		e.frames(1)
		if f % 100 == 0:
			var p: PackedFloat32Array = e.poses()
			for i in [2, 8]:
				var o: int = i * s
				print("f %d p%d pos (%.2f, %.2f, %.2f) root (%.2f, %.2f, %.2f) ball %s" % [f, i, p[o], p[o + 1], p[o + 2], p[o + 4], p[o + 5], p[o + 6], str(e.state()["ball"])])
	quit()
