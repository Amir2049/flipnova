extends SceneTree
## A goal replay forced after 6 seconds of play: it must play the kept frames, then hand back to the match.
var mv
var f := 0
var started := -1
func _initialize():
	mv = load("res://scripts/view/engine_match_view.gd").new()
	mv.force_touch = true
	mv.menus = false
	get_root().add_child(mv)
	mv.start({"seed": 5, "home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "level": 1, "opts": {"time_of_day": "day", "quality": 0}})

func _process(_d) -> bool:
	f += 1
	if f == 360:
		print("kept frames: ", mv.rec.size())
		mv.replay_buf = mv.rec.duplicate()
		mv._start_replay()
		started = f
	if started > 0 and mv.replay_t < 0.0:
		print("replay over after %d frames, match frame now %d" % [f - started, int(mv.st["frame"])])
		return true
	if f > 2000:
		print("replay never ended")
		return true
	return false
