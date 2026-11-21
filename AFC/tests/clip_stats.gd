extends SceneTree
# Which clips get played in a CPU match (are the new ones used?).
func _initialize():
	var m := MatchSim.new()
	m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], -1)
	m.half_seconds = 120.0
	var count := {}
	var last := {}
	var steps := 0
	while m.phase != "fulltime" and steps < 20000:
		m.step()
		m.events.clear()
		steps += 1
		for p in m.players:
			if p.clip != "" and (last.get(p.id, "") != p.clip + str(p.clip_t0)):
				last[p.id] = p.clip + str(p.clip_t0)
				var k := p.clip.trim_suffix("_m")
				count[k] = count.get(k, 0) + 1
	var keys := count.keys()
	keys.sort_custom(func(a, b): return count[a] > count[b])
	for k in keys:
		printraw("%s %d, " % [k, count[k]])
	print("")
	quit()
