extends SceneTree
# The goal replay's three cuts (TV, behind the goal at half speed, the scorer close up): the recording of the first
# seconds of a match replayed as if it were a goal, a screenshot in each cut.
var mv
var f := 0
var out := OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/replay/"
var shot_cut := -1

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
	f += 1
	if f == 420:
		mv.replay_buf = mv.rec.duplicate()
		mv._start_replay()
		print("cuts: ", mv.replay_cuts.size(), " shooter ", mv.replay_shooter)
	if f > 420 and mv.replay_t >= 0.0 and mv.replay_cut_i != shot_cut and mv.replay_t > 0.6:
		shot_cut = mv.replay_cut_i
		get_root().get_texture().get_image().save_png(out + "replay_cut%d.png" % shot_cut)
		print("saved cut ", shot_cut)
	if f > 420 and mv.replay_t < 0.0:
		print("replay over at frame ", f)
		return true
	return f > 2400
