class_name CareerLife
extends RefCounted
## The living side of Career mode: each player of your club has form, morale and fitness that move his match
## rating (dynamic OVR) from week to week; fatigue can lead to injuries; a budget and a transfer market (bids,
## counter-offers, offers for your players); an inbox with news; board objectives.
## Everything lives in the career dictionary under "life".

const OBJECTIVES := {5: [1, "Win the league"], 4: [3, "Finish in the top three"], 3: [5, "Finish in the top half"]}


static func ensure(state: Dictionary) -> Dictionary:
	if not state.has("life"):
		var club := int(state["club"])
		var stars := int(GameData.CLUBS[club]["stars"])
		state["life"] = {"budget": [0, 0, 0, 14.0, 30.0, 55.0][stars], "players": {}, "inbox": [], "offers": [],
			"objective": OBJECTIVES.get(stars, [5, "Finish in the top half"])}
		_mail(state, "Welcome", "The board expects you to %s. Transfer budget: €%.0fM." % [state["life"]["objective"][1].to_lower(), state["life"]["budget"]])
	return state["life"]


static func pstate(state: Dictionary, idx: int) -> Dictionary:
	var life := ensure(state)
	var k := str(idx)
	if not life["players"].has(k):
		life["players"][k] = {"form": 0.55, "morale": 0.6, "fit": 1.0, "injury": 0, "apps": 0, "goals": 0, "bench": 0}
	return life["players"][k]


## How far a player's match rating is off his base OVR right now (form, morale, fitness).
static func dyn_delta(state: Dictionary, idx: int) -> int:
	var ps := pstate(state, idx)
	var d := (float(ps["form"]) - 0.5) * 10.0 + (float(ps["morale"]) - 0.5) * 4.0 - maxf(0.0, 0.75 - float(ps["fit"])) * 12.0
	return clampi(int(roundf(d)), -7, 6)


## The edits used for a career match: your players' attributes moved by their dynamic OVR, injured players
## swapped out of the eleven for the best fit on the bench.
static func match_edits(state: Dictionary, edits: Dictionary) -> Dictionary:
	var out := edits.duplicate(true)
	var club := int(state["club"])
	var id: String = GameData.CLUBS[club]["id"]
	if not out.has(id):
		out[id] = {}
	var ce: Dictionary = out[id]
	if not ce.has("players"):
		ce["players"] = {}
	var sq := GameData.squad(club, edits)
	for i in sq.size():
		var dd := dyn_delta(state, i)
		if dd == 0:
			continue
		var e: Dictionary = ce["players"].get(str(i), {})
		for k in GameData.ATTRS:
			if k.begins_with("gk_") and sq[i]["pos"] != "GK":
				continue
			e[k] = clampf(float(sq[i][k]) + dd, 30.0, 99.0)
		ce["players"][str(i)] = e
	var form := GameData.club_formation(club, edits)
	var lineup: Array = ce.get("lineup", [])
	if not GameData.valid_lineup(sq, lineup):
		lineup = GameData.auto_lineup(sq, form)
	lineup = lineup.map(func(x): return int(x))
	for slot in lineup.size():
		var i: int = lineup[slot]
		if int(pstate(state, i)["injury"]) > 0:
			var best := -1
			var bv := -1e9
			for j in sq.size():
				if lineup.has(j) or int(pstate(state, j)["injury"]) > 0:
					continue
				var v := float(sq[j]["ovr"]) + dyn_delta(state, j) + (30.0 if sq[j]["pos"] == sq[i]["pos"] else 0.0)
				if v > bv:
					bv = v
					best = j
			if best >= 0:
				lineup[slot] = best
	ce["lineup"] = lineup
	return out


## After your match: form from the result and goals, fitness drained for those who played, recovery for the
## rest, morale for regulars left out, injuries for the tired.
static func after_match(state: Dictionary, edits: Dictionary, played: Array, scorers: Array, won: int) -> void:
	var life := ensure(state)
	var club := int(state["club"])
	var sq := GameData.squad(club, edits)
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var goals := {}
	for s in scorers:
		goals[s] = goals.get(s, 0) + 1
	for i in sq.size():
		var ps := pstate(state, i)
		var name: String = sq[i]["name"]
		if int(ps["injury"]) > 0:
			ps["injury"] = int(ps["injury"]) - 1
			if int(ps["injury"]) == 0:
				_mail(state, "Back in training", "%s is fit again." % name)
			continue
		if played.has(i):
			ps["apps"] = int(ps["apps"]) + 1
			ps["bench"] = 0
			var g: int = goals.get(name, 0)
			ps["goals"] = int(ps["goals"]) + g
			var perf := 0.5 + 0.15 * won + 0.18 * g + rng.randf_range(-0.15, 0.15)
			ps["form"] = clampf(lerpf(float(ps["form"]), perf, 0.45), 0.0, 1.0)
			ps["morale"] = clampf(float(ps["morale"]) + 0.05 * won + 0.04 * g, 0.0, 1.0)
			ps["fit"] = clampf(float(ps["fit"]) - rng.randf_range(0.18, 0.32) * (1.3 - float(sq[i]["stamina_attr"]) / 100.0), 0.0, 1.0)
			# a tired body breaks: the lower the fitness, the likelier
			if rng.randf() < maxf(0.0, 0.55 - float(ps["fit"])) * 0.25:
				var weeks := 1 + rng.randi() % 5
				ps["injury"] = weeks
				_mail(state, "Injury", "%s is out for %d week%s." % [name, weeks, "s" if weeks > 1 else ""])
		else:
			ps["bench"] = int(ps["bench"]) + 1
			ps["form"] = lerpf(float(ps["form"]), 0.45, 0.15)
			if float(sq[i]["ovr"]) >= 80.0 and int(ps["bench"]) >= 3:
				ps["morale"] = clampf(float(ps["morale"]) - 0.08, 0.0, 1.0)
				if int(ps["bench"]) == 3:
					_mail(state, "Unhappy player", "%s wants more minutes. His morale is dropping." % name)
		ps["fit"] = clampf(float(ps["fit"]) + 0.16, 0.0, 1.0)
	_market_week(state, edits, rng)


# ------------------------------------------------------------------ transfer market

static func value(p: Dictionary) -> float:
	## € millions, from OVR and age
	var ovr := float(p.get("ovr", 70))
	var age := float(p.get("age", 26))
	var base := pow(maxf(0.0, ovr - 55.0), 2.0) * 0.055
	var age_k := 1.35 if age < 22 else (1.15 if age < 25 else (1.0 if age < 29 else (0.7 if age < 32 else 0.4)))
	return snappedf(maxf(0.3, base * age_k), 0.1)


static func market(state: Dictionary, edits: Dictionary, pos: String = "") -> Array:
	var out := []
	for c in GameData.CLUBS.size():
		if c == int(state["club"]):
			continue
		var sq := GameData.squad(c, edits)
		for i in sq.size():
			var p: Dictionary = sq[i]
			if pos != "" and p["pos"] != pos:
				continue
			out.append({"club": c, "idx": i, "p": p, "value": value(p)})
	out.sort_custom(func(a, b): return a["p"]["ovr"] > b["p"]["ovr"])
	return out


## Your bid for a player: accepted, refused, or a counter-offer the next time you try.
static func bid(state: Dictionary, edits: Dictionary, club: int, idx: int, fee: float, leaving_idx: int) -> Dictionary:
	var life := ensure(state)
	var sq := GameData.squad(club, edits)
	var p: Dictionary = sq[idx]
	var v := value(p)
	if fee > float(life["budget"]):
		return {"ok": false, "msg": "Not enough budget (€%.1fM available)." % life["budget"]}
	# key players cost more: a regular in their eleven needs a premium
	var lineup := GameData.auto_lineup(sq, GameData.club_formation(club, edits))
	var need := v * (1.25 if lineup.has(idx) else 1.0)
	if fee < need * 0.85:
		return {"ok": false, "msg": "%s reject the bid. They want around €%.1fM." % [GameData.CLUBS[club]["name"], need]}
	if fee < need:
		if randf() < 0.5:
			return {"ok": false, "msg": "%s counter: €%.1fM." % [GameData.CLUBS[club]["name"], snappedf(need, 0.1)]}
	_swap_players(state, edits, club, idx, leaving_idx)
	life["budget"] = snappedf(float(life["budget"]) - fee, 0.1)
	_mail(state, "Transfer done", "%s joins for €%.1fM." % [p["name"], fee])
	return {"ok": true, "msg": "%s signs for you!" % p["name"]}


## Both clubs keep 18 players: the signing takes the leaving player's place in your squad and he goes the other way.
static func _swap_players(state: Dictionary, edits: Dictionary, club: int, idx: int, leaving_idx: int) -> void:
	var mine := int(state["club"])
	var in_p: Dictionary = GameData.squad(club, edits)[idx].duplicate(true)
	var out_p: Dictionary = GameData.squad(mine, edits)[leaving_idx].duplicate(true)
	for d in [in_p, out_p]:
		d.erase("idx")
	var a: String = GameData.CLUBS[mine]["id"]
	var b: String = GameData.CLUBS[club]["id"]
	for id in [a, b]:
		if not edits.has(id):
			edits[id] = {}
		if not edits[id].has("players"):
			edits[id]["players"] = {}
	edits[a]["players"][str(leaving_idx)] = in_p
	edits[b]["players"][str(idx)] = out_p
	edits[a].erase("lineup")
	edits[b].erase("lineup")
	var life := ensure(state)
	life["players"].erase(str(leaving_idx))


## Once a week other clubs may make an offer for one of your players.
static func _market_week(state: Dictionary, edits: Dictionary, rng: RandomNumberGenerator) -> void:
	var life := ensure(state)
	life["offers"] = []
	if rng.randf() > 0.35:
		return
	var mine := int(state["club"])
	var sq := GameData.squad(mine, edits)
	var i := rng.randi() % sq.size()
	var buyer := rng.randi() % GameData.CLUBS.size()
	if buyer == mine:
		return
	var fee := snappedf(value(sq[i]) * rng.randf_range(0.85, 1.3), 0.1)
	life["offers"].append({"club": buyer, "idx": i, "fee": fee})
	_mail(state, "Offer received", "%s offer €%.1fM for %s." % [GameData.CLUBS[buyer]["name"], fee, sq[i]["name"]])


## Accept an offer: the player leaves for the buyer's weakest player in his position plus the fee.
static func accept_offer(state: Dictionary, edits: Dictionary, k: int) -> String:
	var life := ensure(state)
	if k < 0 or k >= life["offers"].size():
		return ""
	var o: Dictionary = life["offers"][k]
	var buyer := int(o["club"])
	var mine_sq := GameData.squad(int(state["club"]), edits)
	var leaving: Dictionary = mine_sq[int(o["idx"])]
	var bsq := GameData.squad(buyer, edits)
	var worst := -1
	var wv := 1e9
	for j in bsq.size():
		if bsq[j]["pos"] == leaving["pos"] and float(bsq[j]["ovr"]) < wv:
			wv = float(bsq[j]["ovr"])
			worst = j
	if worst < 0:
		worst = bsq.size() - 1
	_swap_players(state, edits, buyer, worst, int(o["idx"]))
	life["budget"] = snappedf(float(life["budget"]) + float(o["fee"]), 0.1)
	life["offers"].remove_at(k)
	_mail(state, "Player sold", "%s leaves for €%.1fM; %s comes the other way." % [leaving["name"], o["fee"], bsq[worst]["name"]])
	return leaving["name"]


static func _mail(state: Dictionary, title: String, body: String) -> void:
	var life: Dictionary = state.get("life", {})
	if life.is_empty():
		return
	var inbox: Array = life["inbox"]
	inbox.push_front({"title": title, "body": body, "round": int(state.get("round", 0)) + 1})
	while inbox.size() > 30:
		inbox.pop_back()


## End of season verdict from the board.
static func board_verdict(state: Dictionary, pos: int) -> String:
	var life := ensure(state)
	var target := int(life["objective"][0])
	if pos <= target:
		life["budget"] = snappedf(float(life["budget"]) + 15.0, 0.1)
		return "Objective met (%s). The board adds €15M to the budget." % life["objective"][1].to_lower()
	life["budget"] = snappedf(float(life["budget"]) + 5.0, 0.1)
	return "Objective missed (%s). The board is disappointed." % life["objective"][1].to_lower()
