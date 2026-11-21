extends SceneTree
# Broadcast camera frames in an 11v11 match at the given resolution (phone 20:9 or 16:9).
var mv
var frames := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/cam/"
var tag := OS.get_environment("TAG")

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast", "no_intro": true,
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 1, "replays": false, "stoppage_menu": false}})

func _process(_dt) -> bool:
	frames += 1
	var s = mv.sim
	if not s.humans.is_empty() and s.humans[0]["pid"] >= 0:
		var p = s.players[s.humans[0]["pid"]]
		if s.phase in ["kickoff", "restart"] and s.restart.get("taker", -1) == p.id and s.phase_t > 0.5:
			s.human_action(0, "pass", 0.4, p.facing)
	if frames in [60, 160, 260]:
		get_root().get_texture().get_image().save_png(out + "%s_%d.png" % [tag, frames])
		print("shot %d ball %s" % [frames, str(s.ball.pos)])
	return frames > 260
