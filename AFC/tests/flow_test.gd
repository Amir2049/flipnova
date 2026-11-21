extends SceneTree
# Headless run of the real game flow: friendly with a forced goal (celebration, replay), a sub, a skill,
# full time; then a career match to the result and back to the hub; a cup match. Prints what happened.
var main: Node
var f := 0
var stage := 0
var t0 := 0

func _initialize():
	if FileAccess.file_exists("user://profile.json"):
		DirAccess.remove_absolute(ProjectSettings.globalize_path("user://profile.json"))
	main = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(main)

func log_(s: String) -> void:
	print("[%d] %s" % [f, s])

func _process(_d) -> bool:
	f += 1
	var mv = main.match_view
	if mv and mv.sim and mv.sim.phase == "halftime" and mv.sim.wait_halftime:
		mv.sim.halftime_go = true
	if mv and mv.paused and stage >= 4:
		log_("auto team menu was open (%s) - closing" % mv.sim.restart.get("kind", ""))
		mv.set_paused(false)
	match stage:
		0:
			if f == 5:
				var cfg: Dictionary = main._match_config(0, 1, 0)
				cfg["half_minutes"] = 0.5
				cfg["no_intro"] = true
				main._play(cfg, {"type": "friendly"})
				stage = 1
		1:
			if mv.sim.phase == "play" and mv.sim.time > 3.0:
				# score: ball into the far net
				var gx: float = mv.sim.goal_x(0)
				mv.sim.ball.pos = Vector3(gx - signf(gx) * 1.5, 0.5, 0.0)
				mv.sim.ball.vel = Vector3(signf(gx) * 15.0, 0, 0)
				mv.sim.last_touch = mv.sim.team_players(0)[9].id
				log_("forced shot")
				stage = 2
		2:
			if mv.sim.phase == "goal":
				log_("GOAL phase, score %d-%d" % [mv.sim.teams[0]["score"], mv.sim.teams[1]["score"]])
				mv.sim.human_celebrate(0, "random")
				stage = 3
		3:
			if mv.replay.playing:
				log_("replay playing")
				stage = 4
			elif mv.sim.phase == "kickoff":
				log_("NO replay?")
				stage = 4
		4:
			if mv.sim.phase in ["kickoff", "play"] and not mv.replay.playing:
				log_("after goal: phase %s" % mv.sim.phase)
				var ok = mv.sim.substitute(0, mv.sim.team_players(0)[10].id, 0)
				log_("sub %s" % ok)
				stage = 5
		5:
			if mv.sim.phase == "play":
				var p = mv.sim.team_players(0)[9]
				mv.sim.give_ball(p)
				log_("skill %s" % mv.sim.human_skill(0, "roulette", 1.0))
				stage = 6
		6:
			if mv.sim.phase == "fulltime" or mv.ended:
				log_("full time %d-%d, result shown %s" % [mv.sim.teams[0]["score"], mv.sim.teams[1]["score"], mv.hud.result_root != null])
				get_root().get_node("Profile").data["career"] = Career.new_career(0)
				main._career_play()
				var mv2 = main.match_view
				mv2.end_intro()
				mv2.sim.half_seconds = 10.0
				stage = 7
		7:
			if mv.ended:
				log_("career match over %d-%d" % [mv.sim.teams[0]["score"], mv.sim.teams[1]["score"]])
				mv.finished.emit(mv.result())
				var c: Dictionary = get_root().get_node("Profile").data["career"]
				log_("career round now %d, table top %s" % [int(c["round"]), GameData.CLUBS[int(Career.table(c)[0]["club"])]["name"]])
				get_root().get_node("Profile").data["cup"] = Career.new_cup(0)
				main._cup_play()
				main.match_view.end_intro()
				main.match_view.sim.half_seconds = 8.0
				stage = 8
		8:
			if mv.ended:
				mv.finished.emit(mv.result())
				var cup: Dictionary = get_root().get_node("Profile").data["cup"]
				log_("cup stage %d out %s champion %d" % [int(cup["stage"]), cup.get("out", false), int(cup["champion"])])
				main._practice("shooting")
				stage = 9
				t0 = f
		9:
			if f - t0 > 400:
				log_("shooting: time left %.1f score %d attempts %d" % [mv.challenge.time_left, mv.challenge.score, mv.challenge.attempts])
				return true
	return f > 30000
