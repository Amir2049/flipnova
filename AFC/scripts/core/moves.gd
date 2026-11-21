class_name Moves
extends RefCounted
## Picks the animation clip for what a player is doing, from the motion library (player_clips.json):
## kicks by direction and running speed, receptions by ball height and where it comes from (foot, knee, thigh,
## chest, head), turns with and without the ball, starts, stops and falls. Base clips turn / play to the player's
## right; the "_m" twin is the mirror (left).

const PASS := ["pass_idle", "pass_walk", "pass_run", "pass_sprint", "pass_45", "pass_90", "pass_135", "pass_180",
	"pass_sprint_45", "pass_sprint_90", "pass_idle_90", "pass_back"]
const SHOT := ["shot_idle", "shot_walk", "shot_sprint", "shot_close", "shot_left", "shot_idle_90", "shot_side", "shot_turn"]
const LOB := ["lob_idle", "lob_long", "lob_walk", "lob_90", "lob_turn", "lob_dribble", "cross"]


static func speed_class(info: Dictionary) -> float:
	## the running speed a clip was made for
	var src: String = info.get("src", "")
	if src.contains("/sprint/"):
		return 7.0
	if src.contains("/dribble/"):
		return 3.5
	if src.contains("/walk/"):
		return 3.5
	return 0.5


## Direction d (world) in the player's own frame, as the clips store it: x to his left, z forward.
static func local_dir(p: PlayerSim, d: Vector2) -> Vector2:
	var f := p.facing
	var left := f.orthogonal()
	var v := d.normalized()
	return Vector2(v.dot(left), v.dot(f))


static func _best(m: MatchSim, names: Array, want_local: Vector2, spd: float, dir_weight: float = 2.0) -> String:
	var best := ""
	var bs := -1e9
	for n in names:
		for suffix in ["", "_m"]:
			var name: String = n + suffix
			var info: Dictionary = m.clips.get(name, {})
			if info.is_empty():
				continue
			var bd: Array = info.get("ball_dir", [0.0, 0.0, 1.0])
			var cd := Vector2(bd[0], bd[2])
			if cd.length() < 0.1:
				cd = Vector2(0, 1)
			var s := cd.normalized().dot(want_local) * dir_weight
			s -= absf(speed_class(info) - spd) * 0.18
			if suffix == "_m":
				s -= 0.001
			if s > bs:
				bs = s
				best = name
	return best


static func kick(m: MatchSim, p: PlayerSim, kind: String, spd: float, dir: Vector2) -> String:
	var want := local_dir(p, dir if dir.length() > 0.1 else p.facing)
	match kind:
		"shot":
			return _best(m, SHOT, want, spd, 1.5)
		"lob", "cross", "clear":
			return _best(m, LOB, want, spd, 1.5)
	return _best(m, PASS, want, spd, 2.0)


## Reception: by the height of the ball where it meets the player, his speed and where the ball comes from.
static func trap(m: MatchSim, p: PlayerSim, h: float, ball_vel: Vector2, spd: float) -> String:
	var from := -ball_vel.normalized() if ball_vel.length() > 0.5 else p.facing
	var loc := local_dir(p, from)               # where the ball comes from, in his frame
	var right := loc.x < 0.0
	var behind := loc.y < -0.4
	var side := absf(loc.x) > 0.7 and not behind
	var name := ""
	if h > 1.35:
		name = "trap_chest_jump" if spd < 3.0 else "trap_high_walk"
	elif h > 0.95:
		if behind:
			name = "trap_chest_back" if spd > 1.5 else "trap_chest_turn"
		elif spd > 5.0:
			name = "trap_chest_run"
		elif spd > 1.5:
			name = "trap_chest_walk"
		else:
			name = "trap_chest" if ball_vel.length() < 14.0 else "trap_chest_above"
	elif h > 0.6:
		name = "trap_knee_run" if spd > 5.0 else ("trap_knee_walk" if spd > 1.5 else "trap_thigh")
	elif h > 0.3:
		name = "trap_knee_run" if spd > 5.0 else "trap_knee"
	else:
		if spd > 5.0:
			name = "trap_run"
		elif behind:
			name = "trap_walk_back" if spd > 1.5 else "trap_idle_back"
		elif side:
			name = "trap_turn" if spd > 1.5 else "trap_idle_side"
		elif spd > 1.5:
			name = "trap" if randf() < 0.6 else "trap_walk_45"
		else:
			name = "trap_idle"
	if not m.clips.has(name):
		name = "trap"
	return name if right else name + "_m"


## A touch that turns with the ball: by the angle of the turn (degrees) and his speed.
static func ball_turn(m: MatchSim, angle_deg: float, to_right: bool, spd: float) -> String:
	var a := absf(angle_deg)
	var step := "45" if a < 67.0 else ("90" if a < 112.0 else ("135" if a < 157.0 else "180"))
	var pace := "sprint" if spd > 5.0 else ("walk" if spd > 1.5 else "idle")
	var name := "bc_%s_%s" % [pace, step]
	if not m.clips.has(name):
		name = "bc_walk_" + step
	return name if to_right else name + "_m"


## Setting off / turning without the ball.
static func move_turn(m: MatchSim, angle_deg: float, to_right: bool, spd: float) -> String:
	var a := absf(angle_deg)
	var name := ""
	if spd < 0.8:
		name = "mv_start" if a < 25.0 else ("mv_start_45" if a < 67.0 else ("mv_start_90" if a < 112.0 else ("mv_start_135" if a < 160.0 else "turn180")))
	elif spd < 5.0:
		if a < 60.0:
			return ""
		name = "mv_walk_90" if a < 115.0 else "mv_walk_135"
	else:
		if a < 110.0:
			return ""
		name = "mv_sprint_135"
	if not m.clips.has(name):
		return ""
	return name if to_right else name + "_m"


static func fall(rng: RandomNumberGenerator, spd: float) -> String:
	var opts := ["fall", "fall_side", "fall_front2", "fall_hard"] if spd > 3.0 else ["fall_back", "fall_side", "stumble2", "fall"]
	return opts[rng.randi() % opts.size()]
