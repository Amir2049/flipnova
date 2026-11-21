class_name Scenarios
extends RefCounted
## Challenges: jump into a match at a dramatic moment and earn up to three stars.
## Every club and player is fictional. You always play the home side (team 0).

const LIST := [
	{"id": "late_drama", "title": "LATE DRAMA", "story": "One down to the champions with 12 minutes left. Turn it around.",
		"home": 0, "away": 3, "score": [0, 1], "minute": 78, "stars": ["draw", "win", "win_no_concede"]},
	{"id": "ten_men", "title": "TEN MEN", "story": "A red card on the hour. Protect the lead with ten.",
		"home": 5, "away": 4, "score": [1, 0], "minute": 60, "down": 1, "stars": ["no_lose", "win", "no_concede"]},
	{"id": "comeback", "title": "COMEBACK", "story": "Two down at home. The crowd still believes.",
		"home": 6, "away": 1, "score": [0, 2], "minute": 62, "stars": ["score", "draw", "win"]},
	{"id": "derby_night", "title": "DERBY NIGHT", "story": "2-2 under the lights. Five minutes to win the derby.",
		"home": 2, "away": 7, "score": [2, 2], "minute": 84, "night": true, "stars": ["score", "win", "win_no_concede"]},
	{"id": "hold_line", "title": "HOLD THE LINE", "story": "Down to nine against the best team in the land. Survive.",
		"home": 3, "away": 5, "score": [1, 0], "minute": 72, "down": 2, "stars": ["no_lose", "win", "no_concede"]},
	{"id": "hat_trick", "title": "HAT-TRICK HERO", "story": "Goalless on the hour. The fans want goals. Give them three.",
		"home": 4, "away": 6, "score": [0, 0], "minute": 60, "stars": ["score", "score_2", "score_3"]},
	{"id": "storm", "title": "THE STORM", "story": "Pouring rain, a man up, one goal behind. Make it count.",
		"home": 7, "away": 0, "score": [0, 1], "minute": 70, "rain": true, "their_down": 1, "stars": ["draw", "win", "win_by_2"]},
	{"id": "keep_cool", "title": "KEEP COOL", "story": "3-2 up, 80 minutes gone, they keep coming. Kill the game.",
		"home": 1, "away": 3, "score": [3, 2], "minute": 80, "stars": ["no_lose", "win", "score"]},
]

const STAR_TEXT := {
	"score": "Score a goal", "score_2": "Score 2 goals", "score_3": "Score 3 goals",
	"draw": "Draw or better", "no_lose": "Don't lose", "win": "Win the match",
	"win_by_2": "Win by 2 or more", "no_concede": "Don't concede", "win_no_concede": "Win without conceding",
}


static func by_id(id: String) -> Dictionary:
	for s in LIST:
		if s["id"] == id:
			return s
	return {}


static func met(cond: String, sc: Dictionary, score: Array) -> bool:
	var gf: int = score[0]
	var ga: int = score[1]
	var add_f: int = gf - int(sc["score"][0])
	var add_a: int = ga - int(sc["score"][1])
	match cond:
		"score": return add_f >= 1
		"score_2": return add_f >= 2
		"score_3": return add_f >= 3
		"draw", "no_lose": return gf >= ga
		"win": return gf > ga
		"win_by_2": return gf - ga >= 2
		"no_concede": return add_a == 0
		"win_no_concede": return gf > ga and add_a == 0
	return false


static func stars(sc: Dictionary, score: Array) -> int:
	var n := 0
	for c in sc["stars"]:
		if met(c, sc, score):
			n += 1
	return n

