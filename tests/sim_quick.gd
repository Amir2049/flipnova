extends SceneTree
func _initialize():
	var m := MatchSim.new()
	print("setup...")
	var a := GameData.team_def(0, "4-3-3", false)
	var b := GameData.team_def(1, "4-4-2", true)
	print("teams ok")
	m.setup([a, b], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
	print("setup ok phase ", m.phase)
	var t0 := Time.get_ticks_msec()
	for i in 600:
		m.step()
		if i % 60 == 0:
			print("t=%.1f phase %s owner %d ball %s  %d ms" % [m.time, m.phase, m.owner, str(m.ball.pos), Time.get_ticks_msec() - t0])
	quit()
