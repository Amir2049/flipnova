class_name Career
extends RefCounted
## Career mode (a league season of the 8 clubs, home and away = 14 matchdays) and the Cup (8-club knockout).
## The state lives in Profile.data["career"] / ["cup"] as plain dictionaries so it saves as JSON.

const N := 8


static func new_career(club: int, season: int = 1, history: Array = []) -> Dictionary:
	var rounds := _round_robin(N)
	var second := []
	for r in rounds:
		var rr := []
		for m in r:
			rr.append([m[1], m[0]])
		second.append(rr)
	var fixtures: Array = rounds + second
	var results := []
	for r in fixtures:
		var rr := []
		for m in r:
			rr.append(null)
		results.append(rr)
	return {"club": club, "season": season, "round": 0, "fixtures": fixtures, "results": results, "scorers": {}, "history": history}


static func _round_robin(n: int) -> Array:
	# circle method: team 0 fixed, the others rotate
	var teams := range(n)
	var rounds := []
	for r in n - 1:
		var pairs := []
		for i in n / 2:
			var a: int = teams[i]
			var b: int = teams[n - 1 - i]
			pairs.append([a, b] if (r + i) % 2 == 0 else [b, a])
		rounds.append(pairs)
		var last: int = teams.pop_back()
		teams.insert(1, last)
	return rounds


static func rounds(state: Dictionary) -> int:
	return state["fixtures"].size()


static func finished(state: Dictionary) -> bool:
	return int(state["round"]) >= rounds(state)


## [home, away] of the user's club in the current round, or [] at the end of the season.
static func next_fixture(state: Dictionary) -> Array:
	if finished(state):
		return []
	for m in state["fixtures"][int(state["round"])]:
		if int(m[0]) == int(state["club"]) or int(m[1]) == int(state["club"]):
			return [int(m[0]), int(m[1])]
	return []


static func table(state: Dictionary) -> Array:
	var rows := {}
	for c in N:
		rows[c] = {"club": c, "p": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "pts": 0, "form": []}
	for r in state["fixtures"].size():
		for i in state["fixtures"][r].size():
			var res = state["results"][r][i]
			if res == null:
				continue
			var h := int(state["fixtures"][r][i][0])
			var a := int(state["fixtures"][r][i][1])
			var hg := int(res[0])
			var ag := int(res[1])
			_add(rows[h], hg, ag)
			_add(rows[a], ag, hg)
	var out := rows.values()
	out.sort_custom(func(x, y):
		if x["pts"] != y["pts"]:
			return x["pts"] > y["pts"]
		var gx: int = x["gf"] - x["ga"]
		var gy: int = y["gf"] - y["ga"]
		if gx != gy:
			return gx > gy
		return x["gf"] > y["gf"])
	return out


static func _add(row: Dictionary, f: int, a: int) -> void:
	row["p"] += 1
	row["gf"] += f
	row["ga"] += a
	if f > a:
		row["w"] += 1
		row["pts"] += 3
		row["form"].append("W")
	elif f == a:
		row["d"] += 1
		row["pts"] += 1
		row["form"].append("D")
	else:
		row["l"] += 1
		row["form"].append("L")


## A quick result between two clubs from their team ratings (Poisson goals), with scorers.
static func sim_result(home: int, away: int, edits: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var rh := GameData.team_rating(home, edits)
	var ra := GameData.team_rating(away, edits)
	var lh := clampf(1.45 * exp((rh - ra) * 0.055) + 0.12, 0.3, 4.0)
	var la := clampf(1.2 * exp((ra - rh) * 0.055), 0.25, 3.6)
	var hg := _poisson(lh, rng)
	var ag := _poisson(la, rng)
	return {"score": [hg, ag], "scorers": _scorers(home, hg, edits, rng) + _scorers(away, ag, edits, rng)}


static func _poisson(l: float, rng: RandomNumberGenerator) -> int:
	var L := exp(-l)
	var k := 0
	var p := 1.0
	while true:
		p *= rng.randf()
		if p <= L:
			return k
		k += 1
	return k


static func _scorers(club: int, goals: int, edits: Dictionary, rng: RandomNumberGenerator) -> Array:
	var td := GameData.team_def(club, GameData.club_formation(club, edits), false, edits)
	var weights := []
	var total := 0.0
	for p in td["players"]:
		var w: float = {"GK": 0.0, "DEF": 0.5, "MID": 2.0, "FWD": 5.0}.get(p["pos"], 1.0) * float(p["finishing"]) / 70.0
		weights.append(w)
		total += w
	var out := []
	for g in goals:
		var x := rng.randf() * total
		for i in weights.size():
			x -= weights[i]
			if x <= 0.0:
				out.append({"club": club, "name": td["players"][i]["name"]})
				break
	return out


static func add_scorers(state: Dictionary, scorers: Array) -> void:
	for s in scorers:
		var key := "%s|%d" % [s["name"], int(s["club"])]
		state["scorers"][key] = int(state["scorers"].get(key, 0)) + 1


## The user's match is done: store it, play the rest of the round, move on.
static func complete_round(state: Dictionary, user_score: Array, user_scorers: Array, edits: Dictionary) -> void:
	var r := int(state["round"])
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for i in state["fixtures"][r].size():
		var m: Array = state["fixtures"][r][i]
		if int(m[0]) == int(state["club"]) or int(m[1]) == int(state["club"]):
			state["results"][r][i] = user_score
			add_scorers(state, user_scorers)
		else:
			var res := sim_result(int(m[0]), int(m[1]), edits, rng)
			state["results"][r][i] = res["score"]
			add_scorers(state, res["scorers"])
	state["round"] = r + 1


static func top_scorers(state: Dictionary, n: int = 10) -> Array:
	var out := []
	for k in state["scorers"]:
		var parts: PackedStringArray = k.split("|")
		out.append({"name": parts[0], "club": int(parts[1]), "goals": int(state["scorers"][k])})
	out.sort_custom(func(a, b): return a["goals"] > b["goals"])
	return out.slice(0, n)


## End of season: record it, players develop (young ones grow, old ones decline), a new fixture list.
static func next_season(state: Dictionary, edits: Dictionary) -> Dictionary:
	var tbl := table(state)
	var pos := 0
	for i in tbl.size():
		if int(tbl[i]["club"]) == int(state["club"]):
			pos = i + 1
	var hist: Array = state.get("history", [])
	hist.append({"season": int(state["season"]), "pos": pos, "champion": int(tbl[0]["club"])})
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for c in N:
		var sq := GameData.squad(c, edits)
		var id: String = GameData.CLUBS[c]["id"]
		if not edits.has(id):
			edits[id] = {}
		if not edits[id].has("players"):
			edits[id]["players"] = {}
		for i in sq.size():
			var p: Dictionary = sq[i]
			var age := int(p.get("age", 25))
			var delta := 0.0
			if age < 22:
				delta = rng.randf_range(1.0, 4.0)
			elif age < 26:
				delta = rng.randf_range(0.0, 2.5)
			elif age > 31:
				delta = -rng.randf_range(0.5, 3.0)
			var e: Dictionary = edits[id]["players"].get(str(i), {})
			for k in GameData.ATTRS:
				if k.begins_with("gk_") and p["pos"] != "GK":
					continue
				e[k] = clampf(float(p[k]) + delta + rng.randf_range(-0.6, 0.6), 30.0, 97.0)
			e["age"] = age + 1
			edits[id]["players"][str(i)] = e
	return new_career(int(state["club"]), int(state["season"]) + 1, hist)


# ------------------------------------------------------------------ cup

static func new_cup(club: int) -> Dictionary:
	var teams := range(N)
	teams.shuffle()
	var qf := []
	for i in 4:
		qf.append([teams[i * 2], teams[i * 2 + 1]])
	return {"club": club, "stages": [qf], "results": [[null, null, null, null]], "stage": 0, "champion": -1, "out": false}


const STAGE_NAMES := ["Quarter-final", "Semi-final", "Final"]


## The user's tie in the current stage, or [] if knocked out / finished.
static func cup_tie(cup: Dictionary) -> Array:
	if int(cup["champion"]) >= 0 or cup.get("out", false):
		return []
	var st: Array = cup["stages"][int(cup["stage"])]
	for m in st:
		if int(m[0]) == int(cup["club"]) or int(m[1]) == int(cup["club"]):
			return [int(m[0]), int(m[1])]
	return []


## Record the user's result (penalties settle a draw), play the other ties, build the next stage.
static func cup_complete(cup: Dictionary, user_score: Array, edits: Dictionary) -> Dictionary:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var s := int(cup["stage"])
	var st: Array = cup["stages"][s]
	var winners := []
	var pens_note := {}
	for i in st.size():
		var m: Array = st[i]
		var h := int(m[0])
		var a := int(m[1])
		var score: Array
		if h == int(cup["club"]) or a == int(cup["club"]):
			score = user_score.duplicate()
		else:
			score = sim_result(h, a, edits, rng)["score"]
		var w := h if score[0] > score[1] else a
		if score[0] == score[1]:
			# penalties: a little better than a coin toss for the stronger keeper and takers
			var edge := (GameData.team_rating(h, edits) - GameData.team_rating(a, edits)) * 0.02
			w = h if rng.randf() < 0.5 + edge else a
			var pw := 4 + rng.randi() % 2
			var pl := pw - 1 - rng.randi() % 2
			score.append([pw, pl] if w == h else [pl, pw])
			pens_note[i] = true
		cup["results"][s][i] = score
		winners.append(w)
		if (h == int(cup["club"]) or a == int(cup["club"])) and w != int(cup["club"]):
			cup["out"] = true
	if winners.size() == 1:
		cup["champion"] = winners[0]
	else:
		var nxt := []
		for i in winners.size() / 2:
			nxt.append([winners[i * 2], winners[i * 2 + 1]])
		cup["stages"].append(nxt)
		var nr := []
		for i in nxt.size():
			nr.append(null)
		cup["results"].append(nr)
		cup["stage"] = s + 1
		# knocked out: the rest of the cup is played out at once
		if cup["out"]:
			return cup_complete(cup, [0, 0], edits) if cup_tie_any(cup) else cup
	return cup


static func cup_tie_any(cup: Dictionary) -> bool:
	return int(cup["champion"]) < 0


static func cup_winner_of(cup: Dictionary, stage: int, i: int) -> int:
	var res = cup["results"][stage][i]
	if res == null:
		return -1
	var m: Array = cup["stages"][stage][i]
	if res.size() > 2:
		return int(m[0]) if res[2][0] > res[2][1] else int(m[1])
	return int(m[0]) if res[0] > res[1] else int(m[1])
