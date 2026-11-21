extends SceneTree
# Script cost of the engine match view per frame: engine step + pull (physics) and the 22 skeletons + HUD (process).
var mv
var n := 0
func _initialize():
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"time_of_day": "day", "quality": 0}})

func _process(dt) -> bool:
	n += 1
	if n == 300:
		var a := Time.get_ticks_usec()
		for i in 300:
			mv._physics_process(1.0 / 60.0)
		var b := Time.get_ticks_usec()
		for i in 300:
			mv._update_views(1.0 / 60.0)
		var c := Time.get_ticks_usec()
		for i in 300:
			mv._update_hud(1.0 / 60.0)
		var d := Time.get_ticks_usec()
		print("per frame: physics (engine + input + pull) %.0f us, views %.0f us, hud %.0f us" % [(b - a) / 300.0, (c - b) / 300.0, (d - c) / 300.0])
		return true
	return false
