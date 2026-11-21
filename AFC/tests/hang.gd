extends SceneTree
func _initialize():
	var m := MatchSim.new()
	m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
	m.half_seconds = 150.0
	var t0 := Time.get_ticks_msec()
	for i in 20000:
		var ts := Time.get_ticks_usec()
		m.step()
		var us := Time.get_ticks_usec() - ts
		if us > 50000:
			print("slow step %d: %d us phase %s owner %d ball %s v %s" % [i, us, m.phase, m.owner, str(m.ball.pos), str(m.ball.vel)])
		if i % 1200 == 0:
			print("step %d t=%.0f ms phase %s score %d-%d" % [i, Time.get_ticks_msec() - t0, m.phase, m.teams[0]["score"], m.teams[1]["score"]])
		m.events.clear()
		if m.phase == "fulltime":
			break
	print("done ", m.stats)
	quit()
