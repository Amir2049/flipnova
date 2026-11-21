extends SceneTree
# Match clock check: with match_seconds = S the engine's 90 minutes should take S seconds of play (100 frames each).
func _initialize():
	var dir := ProjectSettings.globalize_path("user://gfdata")
	GFData.unpack(dir)
	var e = ClassDB.instantiate("GFEngine")
	for secs in [120.0, 480.0]:
		e.start(dir, {"human": 0, "match_seconds": secs, "seed": 3})
		var played := 0
		var f := 0
		while f < 3000:
			e.frames(1)
			f += 1
			if e.state()["in_play"]:
				played += 1
		var m: float = e.state()["minute"]
		print("match_seconds %d: %d frames (%d in play) -> minute %.2f; expected %.2f" % [secs, f, played, m, played * 0.01 / secs * 90.0])
	quit()
