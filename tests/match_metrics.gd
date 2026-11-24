extends SceneTree
# Full CPU v CPU matches on the built-in engine: football numbers to compare with real matches.
func _initialize():
	var tot := {"passes": 0, "ok": 0, "shots": 0, "goals": 0, "fouls": 0, "out": 0, "tackles": 0, "kicks": 0}
	var poss_changes := 0
	var N := 4
	for r in N:
		var m := MatchSim.new()
		m.setup([GameData.team_def(r % 8, "4-3-3", false), GameData.team_def((r + 3) % 8, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
		m.apply_style("authentic", {})
		m.half_seconds = 300.0
		m.rng.seed = 100 + r
		var steps := 0
		var last_team := -1
		while m.phase != "fulltime" and steps < 60000:
			m.step()
			steps += 1
			for e in m.events:
				match e["type"]:
					"goal": tot["goals"] += 1
					"foul": tot["fouls"] += 1
					"kick": tot["kicks"] += 1
			m.events.clear()
			if m.owner >= 0 and m.players[m.owner].team != last_team:
				last_team = m.players[m.owner].team
				poss_changes += 1
		tot["passes"] += m.stats["passes"][0] + m.stats["passes"][1]
		tot["ok"] += m.stats["passes_ok"][0] + m.stats["passes_ok"][1]
		tot["shots"] += m.stats["shots"][0] + m.stats["shots"][1]
	print("per 10-minute match: passes %.0f  completed %.0f%%  shots %.1f  goals %.1f  fouls %.1f  possession changes %.0f" % [tot["passes"] / float(N), 100.0 * tot["ok"] / maxf(1, tot["passes"]), tot["shots"] / float(N), tot["goals"] / float(N), tot["fouls"] / float(N), poss_changes / float(N)])
	quit()
