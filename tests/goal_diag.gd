extends SceneTree
# How goals happen: shot distance/speed, keeper's distance from the crossing point, whether he dove.
func _initialize():
	var tally := {"shots": 0, "goals": 0, "dove": 0, "saves": 0}
	for run in 3:
		var m := MatchSim.new()
		m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
		m.half_seconds = 150.0
		var last_shot := {}
		var steps := 0
		while m.phase != "fulltime" and steps < 25000:
			m.step()
			steps += 1
			for e in m.events:
				match e["type"]:
					"kick":
						if e["kind"] == "shot":
							var p: PlayerSim = m.players[e["pid"]]
							var gk := m.keeper_of(1 - p.team)
							last_shot = {"d": p.pos.distance_to(Vector2(m.goal_x(p.team), 0)), "v": e["speed"], "gk_off": gk.pos.distance_to(Vector2(m.goal_x(p.team), 0)), "t": m.time, "dove": false}
							tally["shots"] += 1
						else:
							last_shot = {}
					"gk_skip":
						if not last_shot.is_empty():
							last_shot["skip"] = e
					"save":
						tally["saves"] += 1
					"goal":
						tally["goals"] += 1
						if last_shot.is_empty():
							print("goal without a shot (pid %d)" % e["pid"])
						else:
							print("goal: shot d %.0f v %.0f, gk %.1f m off his line, %.2fs after the kick, keeper state %s" % [last_shot["d"], last_shot["v"], last_shot["gk_off"], m.time - last_shot["t"], m.keeper_of(1 - e["team"]).action], last_shot.get("skip", ""), " ball", m.ball.pos)
			m.events.clear()
			for t in 2:
				var gk := m.keeper_of(t)
				if gk.action == "gk_dive" and not last_shot.is_empty() and not last_shot["dove"]:
					last_shot["dove"] = true
					tally["dove"] += 1
	print(tally)
	quit()
