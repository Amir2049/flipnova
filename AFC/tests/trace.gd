extends SceneTree
func _initialize():
	var m := MatchSim.new()
	m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
	m.half_seconds = 150.0
	var last_owner := -2
	var steps := 0
	var lines := 0
	while steps < 60 * 70 and lines < 80:
		var prev_ball := m.ball.pos
		m.step()
		steps += 1
		if m.owner != last_owner:
			var who := "loose"
			if m.owner >= 0:
				var p: PlayerSim = m.players[m.owner]
				who = "%d(%s t%d)" % [p.id, p.role, p.team]
			print("t=%5.2f owner %s ball (%.1f, %.1f, h%.1f) v=%.1f phase %s" % [m.time, who, m.ball.pos.x, m.ball.pos.z, m.ball.pos.y, m.ball.vel.length(), m.phase])
			last_owner = m.owner
			lines += 1
		for e in m.events:
			if e["type"] in ["kick", "restart", "tackle_won", "miscontrol", "heavy_touch", "bump"]:
				print("      ", e)
				lines += 1
		m.events.clear()
	quit()
