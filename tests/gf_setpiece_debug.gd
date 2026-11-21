extends SceneTree
# Finds a set piece of the human's team and shows who is controlled, where the ball is, and whether pressing
# pass (held 0.3 s, then released) takes it.
func _initialize():
	var dir := ProjectSettings.globalize_path("user://gfdata")
	GFData.unpack(dir)
	var e = ClassDB.instantiate("GFEngine")
	e.start(dir, {"human": 1, "difficulty_home": 0.6, "difficulty_away": 0.6, "seed": 7, "match_seconds": 600})
	var waiting := -1
	var press_from := -1
	for f in 200000:
		var st: Dictionary = e.state()
		var mode: int = st["mode"]
		var ours := false
		if mode > 1:
			# whose set piece: the team nearest to the ball when it is still
			var p: PackedFloat32Array = e.poses()
			var b: Vector3 = st["ball"]
			var best := 1e9
			var bi := -1
			for i in 22:
				var o: int = i * e.stride()
				var d := Vector2(p[o] - b.x, p[o + 1] - b.y).length()
				if d < best:
					best = d
					bi = i
			ours = bi < 11
			if waiting < 0:
				waiting = f
				print("frame %d mode %d ball %s vel %.2f nearest %d (%.2f m) controlled %d owner %d/%d" % [f, mode, str(b), (st["ball_vel"] as Vector3).length(), bi, best, st["controlled"], st["owner_team"], st["owner_player"]])
			if ours and f - waiting > 300 and press_from < 0:
				press_from = f
				var c: int = st["controlled"]
				var o2: int = maxi(c, 0) * e.stride()
				print("  -> pressing pass. controlled %d at (%.1f, %.1f) ball (%.1f, %.1f)" % [c, p[o2], p[o2 + 1], b.x, b.y])
			if press_from > 0:
				var held := f - press_from
				e.set_input(1.0, 0.0, 1 if held < 30 else 0)
		else:
			if waiting >= 0:
				print("  set piece over after %d frames (pressed: %s)" % [f - waiting, str(press_from > 0)])
				if press_from > 0:
					quit()
					return
			waiting = -1
			press_from = -1
			e.set_input(0.0, 0.0, 0)
		e.frames(1)
		if waiting >= 0 and f - waiting > 3000:
			print("  STUCK: mode %d for 30 s, controlled %d" % [mode, st["controlled"]])
			quit()
			return
	quit()
