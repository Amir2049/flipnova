extends SceneTree
# Team shape and how near the action players stay; the human's player (stick idle) distance to the ball.
func _initialize():
	var m := MatchSim.new()
	m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(3, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], 0)
	m.half_seconds = 200.0
	m.wait_halftime = false
	var acc := {"len": [0.0, 0.0], "wid": [0.0, 0.0], "avgd": [0.0, 0.0], "near15": [0.0, 0.0], "far40": [0.0, 0.0]}
	var n := 0
	var hd := []
	var hist := {}
	var held := 0.0
	while m.time < 200.0:
		# a simple human: chases the ball (stick busy), passes forward after holding it a moment
		var hp0: int = m.humans[0]["pid"]
		if hp0 >= 0 and m.phase == "play":
			var hp := m.players[hp0]
			if m.owner == hp0:
				held += m.DT
				hp.move = Vector2(m.attack_dir(0), 0) * 0.7
				hp.sprint = 0.0
				if held > 1.0:
					m.human_action(0, "pass", 0.5, Vector2(m.attack_dir(0), 0).rotated(randf_range(-1.2, 1.2)))
					held = 0.0
			else:
				held = 0.0
				var to := m.ball2() - hp.pos
				hp.move = to.normalized() if to.length() > 1.0 else Vector2.ZERO
				hp.sprint = 1.0 if to.length() > 6.0 else 0.0
				if to.length() < 1.2 and m.owner >= 0 and m.players[m.owner].team == 1:
					m.request_tackle(hp)
		elif hp0 >= 0 and m.phase in ["kickoff", "restart"] and m.restart.get("taker", -1) == hp0 and m.phase_t > 1.0:
			m.human_action(0, "pass", 0.4, m.players[hp0].facing)
		m.step()
		m.events.clear()
		if m.phase != "play" or int(m.time * 60.0) % 30 != 0:
			continue
		n += 1
		var b := m.ball2()
		for t in 2:
			var xs := []
			var zs := []
			var sd := 0.0
			var c15 := 0
			var c40 := 0
			for p in m.team_players(t):
				if p.role == "GK":
					continue
				xs.append(p.pos.x)
				zs.append(p.pos.y)
				var d := p.pos.distance_to(b)
				sd += d
				if d < 15.0: c15 += 1
				if d > 40.0: c40 += 1
			acc["len"][t] += xs.max() - xs.min()
			acc["wid"][t] += zs.max() - zs.min()
			acc["avgd"][t] += sd / 10.0
			acc["near15"][t] += c15
			acc["far40"][t] += c40
		var hp: int = m.humans[0]["pid"]
		if hp >= 0:
			var dd: float = m.players[hp].pos.distance_to(b)
			hd.append(dd)
			var k := int(dd / 10.0) * 10
			hist[k] = hist.get(k, 0) + 1
	for k in acc:
		print("%s  home %.1f  away %.1f" % [k, acc[k][0] / n, acc[k][1] / n])
	hd.sort()
	print("human player to ball: median %.1f  p90 %.1f  max %.1f  hist %s" % [hd[hd.size() / 2], hd[int(hd.size() * 0.9)], hd.back(), str(hist)])
	print("passes %s shots %s score %d-%d" % [str(m.stats["passes_ok"]), str(m.stats["shots"]), m.teams[0]["score"], m.teams[1]["score"]])
	quit()
