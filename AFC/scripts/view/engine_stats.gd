class_name EngineStats
extends RefCounted
## Match facts read from the football engine as it plays: possession, shots and shots on target, passes, ball won,
## corners, fouls, cards and saves - per team, and per player for the ratings at full time.

const GOAL_X := 54.4          # the engine's goal lines are at x = +-54.4 m
const POST_Y := 3.7           # half the goal's width
const BAR_Z := 2.44

var poss := [0.0, 0.0]
var shots := [0, 0]
var on_target := [0, 0]
var passes := [0, 0]
var pass_tries := [0, 0]
var won := [0, 0]
var corners := [0, 0]
var fouls := [0, 0]           # free kicks / penalties given away
var yellows := [0, 0]
var reds := [0, 0]
var saves := [0, 0]
var goals := [0, 0]
var player: Array = []        # 22 x {goals, assists, shots, on_target, passes, won, saves}
var last_owner := -1          # 0..21, who had the ball last
var passer := -1              # who passed to the man on the ball (assists)
var loose_t := 0.0            # seconds the ball has been nobody's
var shot := {}                # the shot in the air: {team, player}
var last_mode := 0
var cards_prev := PackedInt32Array()


func _init() -> void:
	for i in 22:
		player.append({"goals": 0, "assists": 0, "shots": 0, "on_target": 0, "passes": 0, "won": 0, "saves": 0, "card": 0})


func feed(st: Dictionary, dt: float) -> void:
	var ot: int = st["owner_team"]
	var mode: int = st["mode"]
	var was_loose := loose_t
	if ot >= 0:
		poss[ot] += dt
		loose_t = 0.0
	else:
		loose_t += dt
	var owner := ot * 11 + int(st["owner_player"]) if ot >= 0 else -1
	if owner >= 0 and owner != last_owner:
		if last_owner >= 0:
			var lt := last_owner / 11
			if lt == ot:
				passes[lt] += 1
				pass_tries[lt] += 1
				player[last_owner]["passes"] += 1
				passer = last_owner
			else:
				won[ot] += 1
				player[owner]["won"] += 1
				if was_loose > 0.15 and shot.is_empty():
					pass_tries[lt] += 1   # a pass that went to the other side
				passer = -1
		# the keeper gathers a shot on target: a save
		if not shot.is_empty() and owner % 11 == 0 and ot != int(shot["team"]):
			saves[ot] += 1
			player[owner]["saves"] += 1
		shot = {}
		last_owner = owner
	# a shot: the ball leaves its man fast, heading for the goal his side attacks
	if ot < 0 and last_owner >= 0 and shot.is_empty() and mode == 0:
		var b: Vector3 = st["ball"]
		var v: Vector3 = st["ball_vel"]
		var team := last_owner / 11
		var gx := GOAL_X if team == 0 else -GOAL_X
		var vx := v.x if team == 0 else -v.x
		if v.length() > 12.0 and vx > 4.0 and absf(gx - b.x) < 36.0:
			var t := absf(gx - b.x) / absf(v.x)
			var y := b.y + v.y * t
			if t < 2.5 and absf(y) < 10.0:
				shots[team] += 1
				player[last_owner]["shots"] += 1
				var z := b.z + v.z * t - 4.9 * t * t
				var on := absf(y) < POST_Y and z < BAR_Z + 0.4
				if on:
					on_target[team] += 1
					player[last_owner]["on_target"] += 1
				shot = {"team": team, "player": last_owner, "on": on}
	# set pieces: who was given a corner / a free kick
	if mode != last_mode:
		var taker: int = st.get("taker", -1)
		if taker >= 0:
			var tt := taker / 11
			if mode == 4:
				corners[tt] += 1
			elif mode == 3 or mode == 6:
				fouls[1 - tt] += 1
		last_mode = mode
	# cards
	var cards: PackedInt32Array = st.get("cards", PackedInt32Array())
	if cards.size() == 22:
		if cards_prev.size() == 22:
			for i in 22:
				if cards[i] > cards_prev[i]:
					if cards[i] == 2:
						reds[i / 11] += 1
					else:
						yellows[i / 11] += 1
					player[i]["card"] = cards[i]
		cards_prev = cards


## A goal: the scorer and the man who passed to him.
func goal(team: int, scorer: int, own: bool) -> void:
	goals[team] += 1
	if scorer >= 0 and not own:
		player[scorer]["goals"] += 1
		if not shot.is_empty() and int(shot["player"]) == scorer and not shot["on"]:
			on_target[team] += 1   # it went in after all
			player[scorer]["on_target"] += 1
		if passer >= 0 and passer != scorer and passer / 11 == scorer / 11:
			player[passer]["assists"] += 1
	shot = {}


func possession(team: int) -> int:
	var t: float = poss[0] + poss[1]
	return int(round(100.0 * poss[team] / t)) if t > 0.0 else 50


## The rows shown in the match facts: [label, home, away].
func rows() -> Array:
	var acc := func(t: int) -> String:
		return "%d%%" % int(round(100.0 * passes[t] / pass_tries[t])) if pass_tries[t] > 0 else "-"
	return [
		["Possession", "%d%%" % possession(0), "%d%%" % possession(1)],
		["Shots", str(shots[0]), str(shots[1])],
		["On target", str(on_target[0]), str(on_target[1])],
		["Passes", str(passes[0]), str(passes[1])],
		["Pass accuracy", acc.call(0), acc.call(1)],
		["Ball won", str(won[0]), str(won[1])],
		["Corners", str(corners[0]), str(corners[1])],
		["Fouls", str(fouls[0]), str(fouls[1])],
		["Yellow cards", str(yellows[0]), str(yellows[1])],
		["Saves", str(saves[0]), str(saves[1])],
	]


## Ratings out of 10 for one player (0..21) given the final score.
func rating(i: int, score: Vector2i, role: String) -> float:
	var p: Dictionary = player[i]
	var t := i / 11
	var mine := score.x if t == 0 else score.y
	var theirs := score.y if t == 0 else score.x
	var r := 6.0
	r += 1.2 * p["goals"] + 0.8 * p["assists"] + 0.2 * p["on_target"] + 0.05 * p["shots"]
	r += minf(1.0, 0.04 * p["passes"]) + minf(1.0, 0.15 * p["won"]) + 0.5 * p["saves"]
	r += 0.4 if mine > theirs else (-0.3 if mine < theirs else 0.0)
	if role == "GK" or role == "DEF":
		r -= 0.25 * theirs
		if theirs == 0:
			r += 0.5
	if int(p["card"]) == 1:
		r -= 0.3
	elif int(p["card"]) == 2:
		r -= 1.5
	return clampf(r, 3.0, 10.0)
