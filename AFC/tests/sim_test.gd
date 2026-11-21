extends SceneTree
# Headless CPU v CPU match: stability, tempo and goals.
func _initialize():
	var halfs := float(OS.get_environment("HALF")) if OS.get_environment("HALF") != "" else 120.0
	var m := MatchSim.new()
	var a := GameData.team_def(0, "4-3-3", false)
	var b := GameData.team_def(1, "4-4-2", true)
	m.setup([a, b], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
	m.half_seconds = halfs
	m.difficulty = 0.6
	var counts := {}
	var t0 := Time.get_ticks_msec()
	var steps := 0
	while m.phase != "fulltime" and steps < int(halfs * 2.4 * 60):
		m.step()
		steps += 1
		for e in m.events:
			counts[e["type"]] = counts.get(e["type"], 0) + 1
		m.events.clear()
	var ms := Time.get_ticks_msec() - t0
	print("steps %d in %d ms (%.3f ms/step)  phase %s  minute %.0f" % [steps, ms, float(ms) / steps, m.phase, m.minute()])
	print("score %d - %d  stats %s" % [m.teams[0]["score"], m.teams[1]["score"], str(m.stats)])
	print("events ", counts)
	print("goals ", m.goals_log)
	quit()
