extends SceneTree
# Presentation screenshots: line-ups intro, night + rain match, a corner camera, a penalty camera, career tabs.
var main
var f := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/pres/"
var steps := []
var i := 0
func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	main = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(main)
	var prof = get_root().get_node("Profile")
	steps = [
		["a_lineups", func():
			prof.data["settings"]["weather"] = "rain"
			prof.data["settings"]["time_of_day"] = "night"
			main._play(main._match_config(2, 5, 0), {"type": "friendly"})],
		["b_night_rain", func(): main.match_view.hud.lineup_root.queue_free(); main.match_view.hud.lineup_root = null; main.match_view.end_intro()],
		["c_corner", func():
			var s = main.match_view.sim
			s._setup_restart("corner", 0, Vector2(s.goal_x(0), s.pitch.half_w()))],
		["d_penalty", func():
			var s = main.match_view.sim
			s._setup_restart("penalty", 0, Vector2(s.goal_x(0) - signf(s.goal_x(0)) * 11.0, 0))],
		["e_day", func():
			prof.data["settings"]["weather"] = "clear"
			prof.data["settings"]["time_of_day"] = "day"
			var cfg = main._match_config(0, 3, 0)
			cfg["no_intro"] = true
			main._play(cfg, {"type": "friendly"})],
		["f_career_squad", func():
			prof.data["career"] = Career.new_career(1)
			main.career_tab = "squad"
			main._start_demo()
			main._go(main._career)],
		["g_career_market", func(): main.career_tab = "transfers"; main._career()],
		["h_career_inbox", func(): main.career_tab = "inbox"; main._career()],
	]

func _process(_d) -> bool:
	f += 1
	if f % 9 == 0 and i < steps.size():
		if i > 0:
			get_root().get_texture().get_image().save_png(out + steps[i - 1][0] + ".png")
			print("saved ", steps[i - 1][0])
		steps[i][1].call()
		i += 1
	elif f % 9 == 0 and i == steps.size():
		get_root().get_texture().get_image().save_png(out + steps[i - 1][0] + ".png")
		print("saved ", steps[i - 1][0])
		return true
	return false
