extends SceneTree
# 2.7: a CPU v CPU match (cards, momentum surges, one-twos, stoppage time) and a challenge scenario start.
func _initialize():
	for run in 2:
		var m := MatchSim.new()
		var a := GameData.team_def(run, "4-3-3", false)
		var b := GameData.team_def(run + 3, "4-4-2", true)
		m.setup([a, b], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
		m.half_seconds = 160.0
		m.wait_halftime = false
		var counts := {}
		var gg := 0
		var t0 := Time.get_ticks_msec()
		while m.phase != "fulltime" and m.time < 900.0:
			m.step()
			if int(m.time * 60.0) % 600 == 0:
				print("t %.1f phase %s" % [m.time, m.phase])
			if not m.give_and_go.is_empty():
				gg += 1
			for e in m.events:
				if e["type"] in ["card", "surge", "foul", "goal", "offside"]:
					var k: String = e["type"] + ("_" + e["color"] if e["type"] == "card" else "")
					counts[k] = counts.get(k, 0) + 1
			m.events.clear()
		var ps := 0
		for p in m.players:
			ps += p.ps.size()
		print("run %d: %s  score %d-%d  end min %.1f (added %s)  gg frames %d  playstyles %d  passes %s  %d ms" % [run, str(counts),
			m.teams[0]["score"], m.teams[1]["score"], m.minute(), str(m.added), gg, ps, str(m.stats.get("passes_ok", [])), Time.get_ticks_msec() - t0])
	# scenario
	var sc := Scenarios.by_id("hold_line")
	var m2 := MatchSim.new()
	m2.setup([GameData.team_def(sc["home"], "4-3-3", false), GameData.team_def(sc["away"], "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], 0)
	m2.half_seconds = 360.0
	m2.start_scenario(sc)
	var off := 0
	for p in m2.players:
		if p.sent_off:
			off += 1
	print("scenario: half %d minute %.1f score %d-%d sent off %d phase %s human pid %d" % [m2.half, m2.minute(), m2.teams[0]["score"], m2.teams[1]["score"], off, m2.phase, m2.humans[0]["pid"]])
	for i in 1200:
		m2.step()
	print("scenario +20s: minute %.1f phase %s score %d-%d" % [m2.minute(), m2.phase, m2.teams[0]["score"], m2.teams[1]["score"]])
	print("stars for 1-0: %d, 1-1: %d, 2-0: %d" % [Scenarios.stars(sc, [1, 0]), Scenarios.stars(sc, [1, 1]), Scenarios.stars(sc, [2, 0])])
	quit()
