class_name EngineSkills
extends RefCounted
## Skill moves for matches on the football engine. The engine has no "skill" command, but it has the pieces: close
## control (the DRIBBLE button) picks its tight ball-control animations, a sharp stick change turns the ball with the
## foot, SPRINT + DRIBBLE together is its knock-on, and SHOT then PASS is its fake shot. A move here is a short,
## timed script of stick directions (in the dribbler's own frame: x forward, y to his right) and buttons, played
## into the engine instead of the thumb for a fraction of a second - the same gestures as the built-in engine
## (Skills.from_direction): swipe forward / side / back, double tap, zig-zag, V, circle.
##
## Risk and reward (FC Mobile): a move started within CHAIN s of the last one runs 30 % slower, so chaining moves
## costs time against a defender closing in.

const B_SHORT := 1
const B_SHOT := 8
const B_SPRINT := 16
const B_DRIBBLE := 32
const CHAIN := 1.4

## name -> steps [seconds, forward, right, buttons]; right is multiplied by the side (+1 right, -1 left)
const MOVES := {
	# knock it past him and go
	"burst": [[0.18, 1.0, 0.0, B_SPRINT | B_DRIBBLE]],
	# drop the shoulder one way, go the other
	"feint": [[0.13, 0.15, -1.0, B_DRIBBLE], [0.22, 0.75, 0.65, B_DRIBBLE]],
	# roll it across the body with the sole
	"roll": [[0.32, 0.0, 1.0, B_DRIBBLE], [0.12, 0.8, 0.6, B_DRIBBLE]],
	# stop it under the sole and turn back
	"dragback": [[0.6, -1.0, 0.0, B_DRIBBLE]],   # the engine's 180 turn with the ball needs ~0.5 s
	# drag back and spin away on the other side
	"roulette": [[0.3, -0.7, 0.7, B_DRIBBLE], [0.3, 0.2, 1.0, B_DRIBBLE]],
	# step over it one way, take it the other
	"stepover": [[0.11, 0.3, 1.0, B_DRIBBLE], [0.11, 0.3, -1.0, B_DRIBBLE], [0.18, 1.0, -0.4, B_DRIBBLE | B_SPRINT]],
	# outside of the foot out, inside back in, burst
	"elastico": [[0.08, 0.2, 1.0, B_DRIBBLE], [0.12, 0.4, -1.0, B_DRIBBLE], [0.16, 1.0, -0.5, B_SPRINT | B_DRIBBLE]],
	# shape to shoot, cut it back behind the standing leg
	"cruyff": [[0.07, 1.0, 0.0, B_SHOT], [0.06, 1.0, 0.0, B_SHOT | B_SHORT], [0.26, -0.6, 0.8, B_DRIBBLE]],
	# the flick over the head needs a clip the engine does not have: the closest is a lifted knock-on
	"rainbow": [[0.2, 1.0, 0.0, B_SPRINT | B_DRIBBLE]],
}

var steps: Array = []
var t := 0.0
var idx := 0
var side := 1.0
var fwd := Vector2.RIGHT          # pitch axes (Godot x, z) of the dribbler's forward at the start
var slow := 1.0
var last_start := -100.0
var now := 0.0
var name := ""


func busy() -> bool:
	return idx < steps.size()


## Start a move for a dribbler facing `facing` (pitch axes, Godot x/z). False when unknown or already playing one.
func start(move: String, s: float, facing: Vector2) -> bool:
	if not MOVES.has(move) or busy():
		return false
	steps = MOVES[move]
	name = move
	side = 1.0 if s >= 0.0 else -1.0
	fwd = facing.normalized() if facing.length() > 0.01 else Vector2.RIGHT
	slow = 1.3 if now - last_start < CHAIN else 1.0
	last_start = now
	idx = 0
	t = 0.0
	return true


func cancel() -> void:
	idx = steps.size()


## Advance by dt; returns [stick in pitch axes (Godot x, z), buttons] while a move plays, else [] .
func tick(dt: float) -> Array:
	now += dt
	if not busy():
		return []
	var s: Array = steps[idx]
	t += dt
	if t >= float(s[0]) * slow:
		t = 0.0
		idx += 1
		if not busy():
			return []
		s = steps[idx]
	var right := Vector2(-fwd.y, fwd.x)   # the dribbler's right in Godot pitch axes (x, z): z points to his right
	var d := fwd * float(s[1]) + right * float(s[2]) * side
	return [d.normalized() if d.length() > 0.01 else fwd, int(s[3])]
