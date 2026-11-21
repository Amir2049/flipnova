extends SceneTree
# A goal celebration on the engine match: forces one after a few seconds and films it (FORCE=1), or waits for a real
# goal. Saves a frame every 6 game frames for 5 seconds.
var mv
var n := 0
var out := ""
var start := -1
var shots := 0

func _initialize():
	out = OS.get_environment("OUT")
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": -1, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"time_of_day": "day", "quality": 1}})

func _process(_dt) -> bool:
	n += 1
	if n == 240 and start < 0:
		mv._celebrate(0, 2)
		start = n
		print("celebrate: cele_t ", mv.cele_t, " mode ", mv.cam.mode, " busy ", mv.pviews[2].busy())
	if start >= 0 and (n - start) % 60 == 0:
		print("t ", (n - start) / 60.0, " cele_t ", mv.cele_t, " mode ", mv.cam.mode, " busy ", mv.pviews[2].busy(), " cam ", mv.cam.global_position)
	if start >= 0 and (n - start) % 6 == 0:
		get_root().get_texture().get_image().save_png(out + "c_%03d.png" % shots)
		shots += 1
	return shots >= 50
