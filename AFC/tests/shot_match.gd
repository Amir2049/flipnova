extends SceneTree
# Play a match with a scripted human and save screenshots: kickoff, play, goal area.
var mv: MatchView
var frames := 0
var shots := [5, 30, 90]
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/"

func _initialize():
	mv = MatchView.new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 1, "human_team": int(OS.get_environment("HUMAN")) if OS.get_environment("HUMAN") != "" else 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": OS.get_environment("CAM") if OS.get_environment("CAM") != "" else "broadcast"})

func _process(_dt) -> bool:
	frames += 1
	if frames % 10 == 0: print("f", frames, " ", Time.get_ticks_msec())
	# a simple scripted human: run at the opponent's goal with the ball, chase it otherwise, pass now and then
	var s := mv.sim
	if not s.humans.is_empty() and s.humans[0]["pid"] >= 0:
		var p: PlayerSim = s.players[s.humans[0]["pid"]]
		if s.phase in ["kickoff", "restart"] and s.restart.get("taker", -1) == p.id and s.phase_t > 1.0:
			s.human_action(0, "pass", 0.4, p.facing)
	if frames in shots:
		var img := get_root().get_texture().get_image()
		img.save_png(out + "m_%d.png" % frames)
		print("shot %d  t=%.1f phase %s score %d-%d owner %d" % [frames, s.time, s.phase, s.teams[0]["score"], s.teams[1]["score"], s.owner])
	return frames > shots.back()
