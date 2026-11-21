extends SceneTree
func _initialize():
	var edits := {}
	var c := Career.new_career(1)
	var life := CareerLife.ensure(c)
	print("budget ", life["budget"], " objective ", life["objective"])
	var rng := RandomNumberGenerator.new()
	for w in 8:
		var me := CareerLife.match_edits(c, edits)
		var lineup: Array = me[GameData.CLUBS[1]["id"]]["lineup"]
		CareerLife.after_match(c, edits, lineup, ["Noah Eriksen"], [1, 0, -1][w % 3])
		var fx := Career.next_fixture(c)
		Career.complete_round(c, [1, 1], [], edits)
	var sq := GameData.squad(1, edits)
	var inj := 0
	for i in sq.size():
		if int(CareerLife.pstate(c, i)["injury"]) > 0:
			inj += 1
	print("injured now ", inj, " dyn deltas ", range(sq.size()).map(func(i): return CareerLife.dyn_delta(c, i)))
	var m := CareerLife.market(c, edits, "FWD")
	print("market top ", m[0]["p"]["name"], " ovr ", m[0]["p"]["ovr"], " value ", m[0]["value"], " club ", m[0]["club"])
	var cheap: Dictionary = m[m.size() - 1]
	var r := CareerLife.bid(c, edits, int(cheap["club"]), int(cheap["idx"]), float(cheap["value"]) * 1.3, 17)
	print("bid: ", r)
	print("my squad idx 17 now: ", GameData.squad(1, edits)[17]["name"], " / their idx: ", GameData.squad(int(cheap["club"]), edits)[int(cheap["idx"])]["name"])
	print("inbox: ", life["inbox"].slice(0, 4).map(func(x): return x["title"]))
	quit()
