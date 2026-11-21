extends SceneTree
# Each skill move from a jog with a defender in front: ball distance during/after, fooled count, ball kept?
func _initialize():
	var results := []
	for sk in Skills.LIST:
		var id: String = sk["id"]
		if id == "fakeshot":
			pass
		var m := MatchSim.new()
		m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], 0)
		var p: PlayerSim = m.team_players(0)[9]
		p.skill_moves = 5
		for q in m.players:
			if q != p:
				m.parked[q.id] = Vector2(-50.0 + 2.0 * q.id, 45.0)
		var d: PlayerSim = m.team_players(1)[3]
		m.parked.erase(d.id)
		p.pos = Vector2(0, 0)
		p.facing = Vector2(1, 0)
		d.pos = Vector2(4.0, 0.2)
		m.give_ball(p)
		var maxd := 0.0
		var fooled := -1
		var kept := true
		var t := 0.0
		var started := false
		while t < 3.0:
			p.move = Vector2(1, 0) * 0.7
			if t > 0.6 and not started:
				started = m.request_skill(p, id, 1.0)
			m.step()
			t += m.DT
			for e in m.events:
				if e["type"] == "skill":
					fooled = e["fooled"]
			m.events.clear()
			if started and p.action == "skill":
				maxd = maxf(maxd, Vector2(m.ball.pos.x, m.ball.pos.z).distance_to(p.pos))
		var end_d := Vector2(m.ball.pos.x, m.ball.pos.z).distance_to(p.pos)
		results.append("%-10s started %s  max ball dist in move %.2f  after 3s: owner %s d %.1f  fooled %d" % [id, started, maxd, "him" if m.owner == p.id else ("loose" if m.owner < 0 else "OPP" if m.players[m.owner].team == 1 else "team"), end_d, fooled])
	for r in results:
		print(r)
	# subs + formation
	var m2 := MatchSim.new()
	var td := GameData.team_def(2, "4-3-3", false)
	m2.setup([td, GameData.team_def(3, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], 0)
	var before: String = m2.team_players(0)[9].name
	var ok := m2.substitute(0, m2.team_players(0)[9].id, 6)
	print("bench %d, sub ok %s: %s -> %s, subs left %d" % [td["bench"].size(), ok, before, m2.team_players(0)[9].name, m2.teams[0]["subs_left"]])
	m2.set_formation(0, "3-5-2")
	print("formation now ", m2.teams[0]["formation"], " roles ", m2.team_players(0).map(func(x): return x.role))
	print("ratings: ", range(8).map(func(i): return snappedf(GameData.team_rating(i), 0.1)))
	quit()
