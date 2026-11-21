extends SceneTree
func _initialize():
	var edits := {}
	var c := Career.new_career(3)
	var seen := {}
	for r in Career.rounds(c):
		for m in c["fixtures"][r]:
			seen["%d-%d" % [m[0], m[1]]] = true
	print("rounds ", Career.rounds(c), " unique fixtures ", seen.size(), " (expect 56)")
	while not Career.finished(c):
		var fx := Career.next_fixture(c)
		Career.complete_round(c, [2, 1], [{"club": fx[0], "name": "Test Striker"}], edits)
	var t := Career.table(c)
	print("table: ", t.map(func(r): return "%s %d" % [GameData.CLUBS[r["club"]]["short"], r["pts"]]))
	print("top scorers: ", Career.top_scorers(c, 3))
	var c2 := Career.next_season(c, edits)
	print("season ", c2["season"], " history ", c2["history"], " edited clubs ", edits.keys().size())
	for k in 3:
		var cup := Career.new_cup(k)
		var guard := 0
		while int(cup["champion"]) < 0 and guard < 5:
			cup = Career.cup_complete(cup, [1, 1], edits)
			guard += 1
		print("cup %d: champion %s out %s stages %d" % [k, GameData.CLUBS[int(cup["champion"])]["short"], cup["out"], cup["stages"].size()])
	quit()
