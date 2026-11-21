extends SceneTree
# What happens to passes: completed, intercepted, out, missed by the receiver.
func _initialize():
	var m := MatchSim.new()
	m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
	m.half_seconds = 150.0
	m.difficulty = 0.6
	var pending := {}
	var out := {"complete": 0, "intercepted": 0, "out": 0, "own_other": 0, "nobody": 0}
	var samples := []
	var steps := 0
	while m.phase != "fulltime" and steps < 25000:
		m.step()
		steps += 1
		for e in m.events:
			match e["type"]:
				"kick":
					if e["kind"] in ["pass", "through", "lob"]:
						var p: PlayerSim = m.players[e["pid"]]
						var r: int = e["receiver"]
						var opp := {}
						for o in m.team_players(1 - p.team):
							opp[o.id] = o.pos
						pending = {"pid": e["pid"], "team": p.team, "rec": r, "t": m.time, "speed": e["speed"], "kind": e["kind"], "from": p.pos, "to": m.players[r].pos if r >= 0 else p.pos, "opp": opp,
							"dist": p.pos.distance_to(m.players[r].pos) if r >= 0 else -1.0}
					else:
						pending = {}
				"control", "miscontrol", "header":
					if not pending.is_empty() and e["pid"] != pending["pid"]:
						var q: PlayerSim = m.players[e["pid"]]
						var k := "complete" if q.id == pending["rec"] else ("own_other" if q.team == pending["team"] else "intercepted")
						out[k] += 1
						var extra := ""
						if k == "intercepted" and pending["opp"].has(q.id):
							var a: Vector2 = pending["from"]
							var ab: Vector2 = pending["to"] - a
							var op: Vector2 = pending["opp"][q.id]
							var al := (op - a).dot(ab.normalized())
							var lane := absf((op - a).cross(ab.normalized()))
							extra = "  interceptor at kick: along %.1f lane %.1f, recv-dist %.1f" % [al, lane, op.distance_to(pending["to"])]
						if samples.size() < 30:
							samples.append("%s %s d=%.0f v=%.1f -> %s after %.2fs%s" % [pending["kind"], k, pending["dist"], pending["speed"], e["type"], m.time - pending["t"], extra])
						pending = {}
				"restart", "goal":
					if not pending.is_empty():
						out["out"] += 1
						if samples.size() < 14:
							samples.append("%s OUT d=%.0f v=%.1f (%s)" % [pending["kind"], pending["dist"], pending["speed"], e.get("kind", "goal")])
						pending = {}
		m.events.clear()
	print(out)
	for s in samples.filter(func(x): return "intercepted" in x or "OUT" in x):
		print("  ", s)
	quit()
