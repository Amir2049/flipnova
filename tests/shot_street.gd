extends SceneTree
# Screenshots: Hara Street (cage + HUD momentum bar) and a challenge start.
var mv
var frames := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/"
var which := OS.get_environment("WHICH")

func _initialize():
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	var cfg := {"home": 0, "away": 3, "human_team": 0, "half_minutes": 3.0, "difficulty": 0.5, "camera": "broadcast", "no_intro": true,
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 1, "replays": false}}
	if which == "street":
		cfg["street"] = true
	else:
		cfg["scenario"] = Scenarios.by_id("ten_men")
		cfg["home"] = 5
		cfg["away"] = 4
		cfg["half_minutes"] = 6.0
	mv.start(cfg)

func _process(_dt) -> bool:
	frames += 1
	var s = mv.sim
	if not s.humans.is_empty() and s.humans[0]["pid"] >= 0:
		var p: PlayerSim = s.players[s.humans[0]["pid"]]
		if s.phase in ["kickoff", "restart"] and s.restart.get("taker", -1) == p.id and s.phase_t > 0.5:
			s.human_action(0, "pass", 0.4, p.facing)
	if frames == 40:
		s.momentum[0] = 0.7
		s.momentum[1] = 0.35
	if frames in [20, 70]:
		get_root().get_texture().get_image().save_png(out + "%s_%d.png" % [which, frames])
		print("shot %d t=%.1f phase %s min %.1f" % [frames, s.time, s.phase, s.minute()])
	return frames > 70
