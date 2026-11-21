extends SceneTree
# Hara Street: 5v5 in the cage, CPU v CPU. Goals, passes, ball stays in, players stay in.
func _initialize():
	var m := MatchSim.new()
	var a := GameData.street_def(0, false)
	var b := GameData.street_def(3, true)
	m.setup([a, b], [GameData.STREET_FORMATION, GameData.STREET_FORMATION], -1, "5v5")
	m.pitch.walls = true
	m.offside_on = false
	m.half_seconds = 90.0
	m.wait_halftime = false
	var counts := {}
	var out_of_cage := 0
	var t0 := Time.get_ticks_msec()
	while m.phase != "fulltime" and m.time < 200.0:
		m.step()
		if int(m.time * 60.0) % 300 == 0:
			var o: String = "-" if m.owner < 0 else "%d(%s,t%d)" % [m.owner, m.players[m.owner].role, m.players[m.owner].team]
			print("t %.0f %s ball (%.1f, %.1f) owner %s act %s" % [m.time, m.phase, m.ball.pos.x, m.ball.pos.z, o, m.players[m.owner].action if m.owner >= 0 else ""])
		for e in m.events:
			if e["type"] in ["goal", "dead", "halftime", "restart", "kickoff_ready"]:
				print("   EV %s %s score %d-%d" % [e["type"], str(e), m.teams[0]["score"], m.teams[1]["score"]])
			counts[e["type"]] = counts.get(e["type"], 0) + 1
			if e["type"] == "dead":
				counts["dead_" + e.get("kind", "?")] = counts.get("dead_" + e.get("kind", "?"), 0) + 1
		m.events.clear()
		for p in m.players:
			if absf(p.pos.y) > m.pitch.half_w() + 0.5:
				out_of_cage += 1
	var keep := ["goal", "kick", "foul", "save", "tackle_won", "surge", "card"]
	var show := {}
	for k in counts:
		if k in keep or k.begins_with("dead_"):
			show[k] = counts[k]
	print("street: %s score %d-%d passes %s shots %s out-of-cage frames %d  %d ms" % [str(show), m.teams[0]["score"], m.teams[1]["score"],
		str(m.stats["passes_ok"]), str(m.stats["shots"]), out_of_cage, Time.get_ticks_msec() - t0])
	quit()
