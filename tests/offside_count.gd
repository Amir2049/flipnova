extends SceneTree
func _initialize():
	var tot := {"offside": 0, "goal": 0, "kick": 0}
	for r in 2:
		var m := MatchSim.new()
		m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
		m.apply_style("competitive", {})
		m.half_seconds = 150.0
		var steps := 0
		while m.phase != "fulltime" and steps < 25000:
			m.step()
			steps += 1
			for e in m.events:
				if tot.has(e["type"]):
					tot[e["type"]] += 1
			m.events.clear()
		print("score %d-%d passes %s ok %s shots %s" % [m.teams[0]["score"], m.teams[1]["score"], m.stats["passes"], m.stats["passes_ok"], m.stats["shots"]])
	print(tot)
	quit()
