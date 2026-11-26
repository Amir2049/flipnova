class_name GameData
extends RefCounted
## Clubs, kits, formations and generated squads. Every club and player name is original to AFC.

## The clubs as shipped; CLUBS is this with the player's own edits on top (name, short name, kits - Squads > CLUB,
## or an imported patch), rebuilt by apply_club_edits.
const CLUBS_BASE := [
	{"id": "HRA", "name": "Al-Hara FC", "short": "HRA", "stars": 4,
		"kit": {"shirt": 0xd7263d, "shirt2": 0xffffff, "pattern": "pin", "shorts": 0xffffff, "socks": 0xd7263d},
		"away": {"shirt": 0xf4f1de, "shirt2": 0xd7263d, "pattern": "solid", "shorts": 0xd7263d, "socks": 0xf4f1de},
		"gk": {"shirt": 0x2fbf71, "shorts": 0x111111, "socks": 0x2fbf71}},
	{"id": "DST", "name": "Delta Storm", "short": "DST", "stars": 4,
		"kit": {"shirt": 0x0fa3b1, "shirt2": 0xc6ff3d, "pattern": "sash", "shorts": 0x15203b, "socks": 0x0fa3b1},
		"away": {"shirt": 0x15203b, "shirt2": 0x0fa3b1, "pattern": "sash", "shorts": 0x15203b, "socks": 0x15203b},
		"gk": {"shirt": 0xff6a2b, "shorts": 0x111111, "socks": 0xff6a2b}},
	{"id": "PSH", "name": "Port Sharks", "short": "PSH", "stars": 3,
		"kit": {"shirt": 0x1b2a49, "shirt2": 0xffffff, "pattern": "stripes", "shorts": 0x1b2a49, "socks": 0x1b2a49},
		"away": {"shirt": 0x9ad1f5, "shirt2": 0x1b2a49, "pattern": "solid", "shorts": 0xffffff, "socks": 0x9ad1f5},
		"gk": {"shirt": 0xf2c230, "shorts": 0x111111, "socks": 0xf2c230}},
	{"id": "DKG", "name": "Desert Kings", "short": "DKG", "stars": 5,
		"kit": {"shirt": 0xe9b44c, "shirt2": 0xe9b44c, "pattern": "solid", "shorts": 0x111111, "socks": 0xe9b44c},
		"away": {"shirt": 0x111111, "shirt2": 0xe9b44c, "pattern": "pin", "shorts": 0x111111, "socks": 0x111111},
		"gk": {"shirt": 0x6c63ff, "shorts": 0x111111, "socks": 0x6c63ff}},
	{"id": "NRA", "name": "Northern Rovers", "short": "NRA", "stars": 4,
		"kit": {"shirt": 0xffffff, "shirt2": 0x111111, "pattern": "hoops", "shorts": 0x111111, "socks": 0xffffff},
		"away": {"shirt": 0x2b2d42, "shirt2": 0xffffff, "pattern": "solid", "shorts": 0x2b2d42, "socks": 0x2b2d42},
		"gk": {"shirt": 0xf2c230, "shorts": 0x111111, "socks": 0xf2c230}},
	{"id": "RVC", "name": "Riverside City", "short": "RVC", "stars": 5,
		"kit": {"shirt": 0x6cabdd, "shirt2": 0x6cabdd, "pattern": "solid", "shorts": 0xffffff, "socks": 0x1c2c5b},
		"away": {"shirt": 0x1c2c5b, "shirt2": 0x6cabdd, "pattern": "solid", "shorts": 0x1c2c5b, "socks": 0x1c2c5b},
		"gk": {"shirt": 0x2fbf71, "shorts": 0x2fbf71, "socks": 0x2fbf71}},
	{"id": "OAS", "name": "Oasis United", "short": "OAS", "stars": 3,
		"kit": {"shirt": 0x2e7d32, "shirt2": 0xffffff, "pattern": "halves", "shorts": 0xffffff, "socks": 0x2e7d32},
		"away": {"shirt": 0xfff3d6, "shirt2": 0x2e7d32, "pattern": "solid", "shorts": 0x2e7d32, "socks": 0xfff3d6},
		"gk": {"shirt": 0x222222, "shorts": 0x222222, "socks": 0x222222}},
	{"id": "NFA", "name": "Nightfall Athletic", "short": "NFA", "stars": 4,
		"kit": {"shirt": 0x15151a, "shirt2": 0xff6a2b, "pattern": "hoops", "shorts": 0x15151a, "socks": 0xff6a2b},
		"away": {"shirt": 0xff6a2b, "shirt2": 0x15151a, "pattern": "solid", "shorts": 0x15151a, "socks": 0xff6a2b},
		"gk": {"shirt": 0x9ad1f5, "shorts": 0x15151a, "socks": 0x9ad1f5}},
]
static var CLUBS: Array = CLUBS_BASE.duplicate(true)
const KIT_PATTERNS := ["solid", "stripes", "pin", "hoops", "sash"]


## The player's edits on the clubs (squads[id]["club"] = {name, short, kit: {...}, away: {...}}) over the shipped
## ones. Called when the profile loads and after every club edit or patch import.
static func apply_club_edits(squads: Dictionary) -> void:
	CLUBS = CLUBS_BASE.duplicate(true)
	for c in CLUBS:
		var ce = squads.get(c["id"], {})
		if not ce is Dictionary or not ce.get("club") is Dictionary:
			continue
		var cl: Dictionary = ce["club"]
		if str(cl.get("name", "")).strip_edges() != "":
			c["name"] = str(cl["name"]).strip_edges().left(28)
		if str(cl.get("short", "")).strip_edges() != "":
			c["short"] = str(cl["short"]).strip_edges().to_upper().left(4)
		for which in ["kit", "away"]:
			if cl.get(which) is Dictionary:
				for k in ["shirt", "shirt2", "shorts", "socks"]:
					if cl[which].has(k):
						c[which][k] = int(cl[which][k])
				if KIT_PATTERNS.has(str(cl[which].get("pattern", ""))):
					c[which]["pattern"] = str(cl[which]["pattern"])

# [depth 0 back .. 1 front, side -1 left .. 1 right, role]
const FORMATIONS := {
	"4-3-3": [[0.0, 0.0, "GK"], [0.05, -0.85, "DEF"], [0.0, -0.3, "DEF"], [0.0, 0.3, "DEF"], [0.05, 0.85, "DEF"],
		[0.42, -0.45, "MID"], [0.32, 0.0, "MID"], [0.42, 0.45, "MID"], [0.88, -0.78, "FWD"], [1.0, 0.0, "FWD"], [0.88, 0.78, "FWD"]],
	"4-4-2": [[0.0, 0.0, "GK"], [0.05, -0.85, "DEF"], [0.0, -0.3, "DEF"], [0.0, 0.3, "DEF"], [0.05, 0.85, "DEF"],
		[0.5, -0.85, "MID"], [0.4, -0.28, "MID"], [0.4, 0.28, "MID"], [0.5, 0.85, "MID"], [1.0, -0.22, "FWD"], [1.0, 0.22, "FWD"]],
	"4-2-3-1": [[0.0, 0.0, "GK"], [0.05, -0.85, "DEF"], [0.0, -0.3, "DEF"], [0.0, 0.3, "DEF"], [0.05, 0.85, "DEF"],
		[0.3, -0.25, "MID"], [0.3, 0.25, "MID"], [0.7, -0.75, "MID"], [0.68, 0.0, "MID"], [0.7, 0.75, "MID"], [1.0, 0.0, "FWD"]],
	"3-5-2": [[0.0, 0.0, "GK"], [0.0, -0.55, "DEF"], [0.0, 0.0, "DEF"], [0.0, 0.55, "DEF"], [0.5, -0.9, "MID"],
		[0.4, -0.35, "MID"], [0.3, 0.0, "MID"], [0.4, 0.35, "MID"], [0.5, 0.9, "MID"], [1.0, -0.22, "FWD"], [1.0, 0.22, "FWD"]],
}

const FIRST := ["Adrian", "Bruno", "Carlos", "Dario", "Elias", "Felix", "Gabriel", "Hugo", "Ivan", "Jonas", "Karim", "Leon",
	"Marco", "Nico", "Omar", "Pablo", "Rafael", "Samir", "Tomas", "Victor", "Yusuf", "Zane", "Malik", "Theo", "Andre",
	"Luca", "Mateo", "Noah", "Oscar", "Rui", "Sami", "Tariq", "Youssef", "Kenji", "Diego", "Emil", "Hamza", "Iker", "Joel", "Kofi"]
const LAST := ["Alvarez", "Berger", "Costa", "Duran", "Eriksen", "Ferro", "Garnier", "Holm", "Ibsen", "Jansen", "Kovac",
	"Lindqvist", "Moreau", "Novak", "Okafor", "Petrov", "Quintana", "Rossi", "Santos", "Tanaka", "Ulrich", "Varga", "Weber",
	"Xavier", "Yilmaz", "Zoric", "Mansour", "Haddad", "Silva", "Brandt", "Castillo", "Dimitrov", "Fontaine", "Hale",
	"Marin", "Nakamura", "Ortega", "Radu", "Sorensen", "Vidal"]


# an 18-man squad: 2 keepers, 6 defenders, 6 midfielders, 4 forwards (first of each line are the regulars)
const SQUAD_POS := ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD",
	"GK", "DEF", "DEF", "MID", "MID", "MID", "FWD"]
const SQUAD_NUM := [1, 2, 4, 5, 3, 8, 6, 10, 11, 9, 7, 12, 15, 22, 14, 16, 18, 19]
const ATTRS := ["pace", "accel", "agility", "dribbling", "control", "short_pass", "long_pass", "power", "finishing",
	"curve", "tackling", "strength", "stamina_attr", "gk_diving", "gk_handling", "gk_reflex"]


static func base_squad(club_index: int) -> Array:
	var c: Dictionary = CLUBS[club_index]
	var rng := RandomNumberGenerator.new()
	rng.seed = 7919 * (club_index + 3)
	var used := {}
	var out := []
	var base := 58.0 + float(c["stars"]) * 5.0
	for i in SQUAD_POS.size():
		var role: String = SQUAD_POS[i]
		var f: String
		var l: String
		while true:
			f = FIRST[rng.randi() % FIRST.size()]
			l = LAST[rng.randi() % LAST.size()]
			if not used.has(l):
				break
		used[l] = true
		var b := base - (5.0 if i >= 11 else 0.0)
		var r := func(spread: float, bias: float) -> float: return roundf(clampf(b + bias + rng.randf_range(-spread, spread), 35.0, 95.0))
		var p := {"name": f + " " + l, "short": l, "number": SQUAD_NUM[i], "pos": role, "idx": i,
			"pace": r.call(8, 0), "accel": r.call(8, 0), "agility": r.call(8, 0), "dribbling": r.call(8, 0), "control": r.call(7, 2),
			"short_pass": r.call(7, 0), "long_pass": r.call(8, -2), "power": r.call(8, 0), "finishing": r.call(8, -4),
			"curve": r.call(8, -3), "tackling": r.call(8, -8), "strength": r.call(8, 0), "stamina_attr": r.call(8, 2),
			"gk_diving": 40.0, "gk_handling": 40.0, "gk_reflex": 40.0, "left": rng.randf() < 0.22,
			"skill": 1 + rng.randi() % 3, "age": 18 + rng.randi() % 16}
		match role:
			"GK":
				p["gk_diving"] = r.call(6, 4)
				p["gk_handling"] = r.call(6, 2)
				p["gk_reflex"] = r.call(6, 4)
				p["pace"] = r.call(6, -15)
				p["dribbling"] = r.call(6, -20)
				p["finishing"] = 30.0
				p["skill"] = 1
			"DEF":
				p["tackling"] = r.call(6, 6)
				p["strength"] = r.call(6, 4)
				p["finishing"] = r.call(6, -18)
				p["dribbling"] = r.call(6, -8)
				p["skill"] = 1 + rng.randi() % 2
			"MID":
				p["short_pass"] = r.call(6, 5)
				p["long_pass"] = r.call(6, 3)
				p["tackling"] = r.call(6, -2)
				p["skill"] = 2 + rng.randi() % 3
			"FWD":
				p["finishing"] = r.call(6, 8)
				p["pace"] = r.call(6, 4)
				p["dribbling"] = r.call(6, 5)
				p["tackling"] = r.call(6, -20)
				p["skill"] = 3 + rng.randi() % 3
		p["ovr"] = ovr(p)
		out.append(p)
	return out


static func ovr(p: Dictionary) -> int:
	var g := func(k: String) -> float: return float(p.get(k, 50.0))
	match p.get("pos", "MID"):
		"GK":
			return int(roundf(g.call("gk_diving") * 0.34 + g.call("gk_reflex") * 0.36 + g.call("gk_handling") * 0.3))
		"DEF":
			return int(roundf(g.call("tackling") * 0.35 + g.call("strength") * 0.2 + g.call("pace") * 0.15 + g.call("short_pass") * 0.15 + g.call("control") * 0.15))
		"FWD":
			return int(roundf(g.call("finishing") * 0.32 + g.call("pace") * 0.2 + g.call("dribbling") * 0.2 + g.call("control") * 0.14 + g.call("power") * 0.14))
	return int(roundf(g.call("short_pass") * 0.28 + g.call("long_pass") * 0.14 + g.call("control") * 0.2 + g.call("dribbling") * 0.18 + g.call("stamina_attr") * 0.1 + g.call("tackling") * 0.1))


# PlayStyles: special traits from a player's best attributes (up to three), each with an effect in the match
const PS_TAG := {"finesse": "FIN", "power_shot": "PWR", "incisive": "INC", "rapid": "RAP", "quick_step": "QS",
	"first_touch": "1T", "press_proven": "PRS", "intercept": "INT", "aerial": "AIR", "technical": "TEC", "far_reach": "REA"}

const PLAYSTYLES := {
	"finesse": ["Finesse Shot", "Curled shots are more accurate"],
	"power_shot": ["Power Shot", "Harder shots"],
	"incisive": ["Incisive Pass", "Sharper passes and through balls"],
	"rapid": ["Rapid", "Faster at full sprint"],
	"quick_step": ["Quick Step", "Explosive acceleration"],
	"first_touch": ["First Touch", "Controls difficult balls cleanly"],
	"press_proven": ["Press Proven", "Hard to knock off the ball"],
	"intercept": ["Intercept", "Longer reach for tackles and interceptions"],
	"aerial": ["Aerial", "Wins headers, heads them on target"],
	"technical": ["Technical", "Skill moves fool defenders more often"],
	"far_reach": ["Far Reach", "Keeper: reaches further for saves"],
}


static func playstyles(p: Dictionary) -> Array:
	var g := func(k: String) -> float: return float(p.get(k, 50.0))
	var cand := []
	if p.get("pos", "") == "GK":
		if g.call("gk_diving") >= 82.0:
			cand.append(["far_reach", g.call("gk_diving")])
		return cand.map(func(c): return c[0])
	if g.call("curve") >= 80.0 and g.call("finishing") >= 74.0:
		cand.append(["finesse", g.call("curve")])
	if g.call("power") >= 84.0:
		cand.append(["power_shot", g.call("power")])
	if maxf(g.call("short_pass"), g.call("long_pass")) >= 84.0:
		cand.append(["incisive", maxf(g.call("short_pass"), g.call("long_pass"))])
	if g.call("pace") >= 86.0:
		cand.append(["rapid", g.call("pace")])
	if g.call("accel") >= 86.0:
		cand.append(["quick_step", g.call("accel")])
	if g.call("control") >= 85.0:
		cand.append(["first_touch", g.call("control")])
	if g.call("dribbling") >= 82.0 and g.call("strength") >= 76.0:
		cand.append(["press_proven", g.call("strength")])
	if g.call("tackling") >= 83.0:
		cand.append(["intercept", g.call("tackling")])
	if g.call("strength") >= 85.0 and p.get("pos", "") != "MID":
		cand.append(["aerial", g.call("strength")])
	if g.call("dribbling") >= 86.0:
		cand.append(["technical", g.call("dribbling")])
	cand.sort_custom(func(a, b): return a[1] > b[1])
	return cand.slice(0, 3).map(func(c): return c[0])


## The squad with the user's edits (names, numbers, attribute changes) and career growth applied.
static func squad(club_index: int, edits: Dictionary = {}) -> Array:
	var sq := base_squad(club_index)
	var ce: Dictionary = edits.get(CLUBS[club_index]["id"], {})
	var pe: Dictionary = ce.get("players", {})
	for i in sq.size():
		var e: Dictionary = pe.get(str(i), {})
		for k in e:
			sq[i][k] = e[k]
		sq[i]["ovr"] = ovr(sq[i])
		sq[i]["ps"] = playstyles(sq[i])
	return sq


## Best eleven for a formation: indices into the squad, in the formation's slot order.
static func auto_lineup(sq: Array, formation: String) -> Array:
	var slots: Array = FORMATIONS[formation]
	var taken := {}
	var out := []
	for s in slots:
		var role: String = s[2]
		var best := -1
		var bv := -1e9
		for i in sq.size():
			if taken.has(i):
				continue
			var v := float(sq[i]["ovr"]) + (40.0 if sq[i]["pos"] == role else (-60.0 if sq[i]["pos"] == "GK" or role == "GK" else -12.0))
			if v > bv:
				bv = v
				best = i
		taken[best] = true
		out.append(best)
	return out


## Hara Street: five-a-side in a walled cage. Keeper, two at the back, one in the middle, one up top.
const STREET_FORMATION := [[0.0, 0.0, "GK"], [0.18, -0.5, "DEF"], [0.18, 0.5, "DEF"], [0.55, 0.0, "MID"], [0.95, 0.0, "FWD"]]


static func street_def(club_index: int, away_kit: bool, edits: Dictionary = {}) -> Dictionary:
	var c: Dictionary = CLUBS[club_index]
	var sq := squad(club_index, edits)
	var taken := {}
	var five := []
	for s in STREET_FORMATION:
		var best := -1
		var bv := -1e9
		for i in sq.size():
			if taken.has(i):
				continue
			var v := float(sq[i]["ovr"]) + (40.0 if sq[i]["pos"] == s[2] else (-60.0 if sq[i]["pos"] == "GK" or s[2] == "GK" else -12.0))
			if v > bv:
				bv = v
				best = i
		taken[best] = true
		five.append(sq[best])
	var bench := []
	for i in sq.size():
		if not taken.has(i) and bench.size() < 3 and sq[i]["pos"] != "GK":
			bench.append(sq[i])
	return {"name": c["name"], "short": c["short"], "kit": c["away"] if away_kit else c["kit"], "gk": c["gk"],
		"players": five, "bench": bench, "formation": "street", "club": club_index}


static func valid_lineup(sq: Array, lineup: Array) -> bool:
	if lineup.size() != 11:
		return false
	var seen := {}
	for i in lineup:
		if typeof(i) != TYPE_INT and typeof(i) != TYPE_FLOAT:
			return false
		var k := int(i)
		if k < 0 or k >= sq.size() or seen.has(k):
			return false
		seen[k] = true
	return true


## Everything a match needs for one side: the eleven in slot order, the bench, kit and formation.
static func team_def(club_index: int, formation: String, away_kit: bool, edits: Dictionary = {}) -> Dictionary:
	var c: Dictionary = CLUBS[club_index]
	var ce: Dictionary = edits.get(c["id"], {})
	var form: String = ce.get("formation", formation) if formation == "" else formation
	if not FORMATIONS.has(form):
		form = "4-3-3"
	var sq := squad(club_index, edits)
	var lineup: Array = ce.get("lineup", [])
	if not valid_lineup(sq, lineup):
		lineup = auto_lineup(sq, form)
	var eleven := []
	var bench := []
	for i in lineup:
		eleven.append(sq[int(i)])
	for i in sq.size():
		if not lineup.has(i) and not lineup.has(float(i)):
			bench.append(sq[i])
	return {"name": c["name"], "short": c["short"], "kit": c["away"] if away_kit else c["kit"], "gk": c["gk"],
		"players": eleven, "bench": bench, "formation": form, "club": club_index}


static func club_formation(club_index: int, edits: Dictionary) -> String:
	var ce: Dictionary = edits.get(CLUBS[club_index]["id"], {})
	var f: String = ce.get("formation", ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2"][club_index % 4])
	return f if FORMATIONS.has(f) else "4-3-3"


static func team_rating(club_index: int, edits: Dictionary = {}) -> float:
	var td := team_def(club_index, club_formation(club_index, edits), false, edits)
	var s := 0.0
	for p in td["players"]:
		s += float(p["ovr"])
	return s / 11.0
