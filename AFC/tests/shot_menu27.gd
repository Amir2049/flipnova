extends SceneTree
# 2.7 menus: home, challenges, playstyles catalogue, squads with tags, a challenge result.
var main: Node
var f := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/menu/"
var steps := []
var i := 0

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	if FileAccess.file_exists("user://profile.json"):
		DirAccess.remove_absolute(ProjectSettings.globalize_path("user://profile.json"))
	main = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(main)
	steps = [
		["a_title", func(): pass],
		["b_home", func(): main._go(main._home)],
		["c_challenges", func(): main._go(main._challenges)],
		["d_squads", func(): main.sel_club = 0; main._go(main._squads)],
		["e_catalogue", func(): main._go(main._catalogue); var sc = main.screen.find_children("*", "ScrollContainer", true, false); if sc: sc[0].scroll_vertical = 4000],
		["f_street", func(): main._go(main._street)],
		["g_result", func(): main.context = {"type": "scenario", "id": "late_drama"}; main._scenario_result({"score": [2, 1]})],
	]

func _process(_d) -> bool:
	f += 1
	if f % 9 == 0 and i < steps.size():
		get_root().get_texture().get_image().save_png(out + steps[i][0] + ".png")
		print("step ", steps[i][0])
		i += 1
		if i < steps.size():
			steps[i][1].call()
	return i >= steps.size()
