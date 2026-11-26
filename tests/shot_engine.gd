extends SceneTree
# The engine match on screen: broadcast frames and close-ups of the engine-driven players.
var mv
var frames := 0
var out := OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/eng/"

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	var pr = get_root().get_node_or_null("Profile")
	if pr and not pr.data.has("settings"):
		pr.data["settings"] = {}
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": OS.get_environment("CAM") if OS.get_environment("CAM") != "" else "pro",
		"opts": {"weather": OS.get_environment("WEATHER") if OS.get_environment("WEATHER") != "" else "clear", "time_of_day": OS.get_environment("TOD") if OS.get_environment("TOD") != "" else "day", "quality": int(OS.get_environment("QUALITY")) if OS.get_environment("QUALITY") != "" else 1}})

func _process(_dt) -> bool:
	frames += 1
	if frames in [30, 120, 240]:
		get_root().get_texture().get_image().save_png(out + "b_%d.png" % frames)
		var s: Dictionary = mv.st
		print("frame %d minute %.2f ball %s mode %d ctl %d owner %d" % [frames, s["minute"], str(s["ball"]), s["mode"], s["controlled"], s["owner_team"]])
	if frames == 250:
		mv.cam.external = true
		var o: int = 8 * mv.stride
		var c := Vector3(mv.poses[o], 0, -mv.poses[o + 1])
		mv.cam.look_at_from_position(c + Vector3(-3.0, 2.0, 5.0), c + Vector3(0, 0.9, 0), Vector3.UP)
		mv.cam.fov = 40.0
	if frames in [252, 270, 290]:
		get_root().get_texture().get_image().save_png(out + "c_%d.png" % frames)
	return frames > 290
