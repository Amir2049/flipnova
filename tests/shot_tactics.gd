extends SceneTree
# The tactics page in an engine match: before and after a change (the board's dots move).
var mv
var frames := 0
var out := OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/tac/"

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	var pr = get_root().get_node_or_null("Profile")
	if pr and not pr.data.has("settings"):
		pr.data["settings"] = {}
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 1}})

func _process(_dt) -> bool:
	frames += 1
	if frames == 60:
		mv.set_paused(true)
		mv._tactics_page(mv._pause_menu)
	if frames == 70:
		get_root().get_texture().get_image().save_png(out + "tac_a.png")
		get_root().get_node("Profile").set_s("tac_mentality", 4)
		get_root().get_node("Profile").set_s("tac_width", 2)
		get_root().get_node("Profile").set_s("tac_press", 2)
		mv._tactics_page(mv._pause_menu)
	if frames == 75:
		get_root().get_texture().get_image().save_png(out + "tac_b.png")
		get_root().get_node("Profile").set_s("tac_mentality", 2)
		get_root().get_node("Profile").set_s("tac_width", 1)
		get_root().get_node("Profile").set_s("tac_press", 1)
		return true
	return false
