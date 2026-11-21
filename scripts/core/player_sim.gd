class_name PlayerSim
extends RefCounted
## One footballer in the simulation: attributes, the physical numbers derived from them, movement and actions.
## Ground positions are Vector2(x, z).

enum Style { NORMAL, CLOSE, JOCKEY }

var id := 0
var team := 0
var idx := 0              # index in the team (0 = keeper)
var role := "MID"         # GK, DEF, MID, FWD
var slot := Vector2.ZERO  # formation: x = depth 0 (back line) .. 1 (front), y = side -1 (left) .. 1 (right)
var name := ""
var short_name := ""
var number := 1

# attributes 30..99
var pace := 70.0
var accel := 70.0
var agility := 70.0
var dribbling := 70.0
var control := 70.0
var short_pass := 70.0
var long_pass := 70.0
var power := 70.0
var finishing := 70.0
var curve := 70.0
var tackling := 60.0
var strength := 70.0
var stamina_attr := 75.0
var gk_diving := 40.0
var gk_handling := 40.0
var gk_reflex := 40.0
var left_footed := false
var skill_moves := 2      # 1..5 stars: which skill moves he can do and how cleanly
var ps := {}              # PlayStyles he has (id -> true)
var cards := 0            # yellow cards this match
var sent_off := false
var boost := 1.0          # momentum surge: a little extra speed
var info := {}            # the squad entry he was made from
var fooled := 0.0         # seconds a defender is wrong-footed by a skill move (frozen / leaning the wrong way)
var fooled_dir := Vector2.ZERO
var shielding := false    # holding the ball up with the body (close control near an opponent)
var anim_cd := 0.0        # no new start / turn clip until this runs out
var planned_trap := -10.0 # match time an anticipated reception clip meets the ball
var control_t := -10.0    # match time of the last controlled reception (a ball at chest height is still his)
var pose_spin := 0.0      # view-only extras driven by skill moves: spin around the body, side lean (radians)
var pose_lean := 0.0

# derived
var top_speed := 8.0
var tau := 0.6
var brake := 9.0
var lateral := 9.0
var turn_rate := 11.0

# state
var pos := Vector2.ZERO
var vel := Vector2.ZERO
var facing := Vector2(1, 0)
var stamina := 1.0

# intent (AI or human)
var move := Vector2.ZERO       # stick: direction * intensity (0..1)
var sprint := 0.0
var cap := INF                 # speed limit for this tick (arriving at a loose ball), reset after each move
var style := Style.NORMAL
var face_to := Vector2.ZERO    # optional facing target direction (jockey / strafing)

# action
var action := ""          # "", kick, trap, tackle, slide, fallen, gk_dive, gk_hold, celebrate, throw
var act_t := 0.0
var act_dur := 0.0
var act := {}             # action data
var human := -1           # controlling human slot, -1 = AI
var immune := 0.0         # can't touch the ball again for a moment (after a kick / a failed control)
var gait := 0.0           # step phase 0..1
var with_ball := false    # set by the match each tick (the dribble loop has a shorter stride)
var steps := 0            # steps taken (left/right foot alternate)
var clip := ""            # one-shot clip the view should play now ("" = locomotion)
var clip_t0 := 0.0        # match time the clip's frame 0 is at
var clip_speed := 1.0


func apply_info(d: Dictionary) -> void:
	info = d
	name = d.get("name", name)
	short_name = d.get("short", name)
	number = int(d.get("number", number))
	for k in GameData.ATTRS:
		if d.has(k):
			set(k, float(d[k]))
	left_footed = d.get("left", false)
	skill_moves = int(d.get("skill", 2))
	ps = {}
	for k in d.get("ps", []):
		ps[k] = true
	derive()


func has_ps(id: String) -> bool:
	return ps.has(id)


func derive() -> void:
	top_speed = 6.0 + 3.6 * pow(clampf((pace - 30.0) / 69.0, 0.0, 1.0), 1.6)
	# game tuning: quicker off the mark and sharper on the turn than real tracking data, like console football
	tau = 0.28 + 0.3 * pow(clampf((99.0 - accel) / 69.0, 0.0, 1.0), 1.2)
	var ag := clampf((agility - 30.0) / 69.0, 0.0, 1.0)
	brake = 10.0 + 4.0 * ag
	lateral = 12.0 + 6.0 * ag
	turn_rate = 10.0 + 6.0 * ag
	if has_ps("rapid"):
		top_speed *= 1.03
	if has_ps("quick_step"):
		tau *= 0.85


static func q(a: float) -> float:
	return clampf((a - 30.0) / 69.0, 0.0, 1.0)


func busy() -> bool:
	return action != "" and action != "celebrate"


func speed() -> float:
	return vel.length()


func target_speed(has_ball: bool) -> float:
	var intensity := clampf(move.length(), 0.0, 1.0)
	if intensity < 0.08:
		return 0.0
	var top := top_speed * (0.82 + 0.18 * stamina) * boost
	match style:
		Style.CLOSE:
			return top * 0.32 * intensity
		Style.JOCKEY:
			return top * 0.36 * intensity
	var jog := top * (0.58 if has_ball else 0.62)
	var full := top * (0.90 if has_ball else 1.0)
	var s := jog * pow(intensity, 0.7)
	if sprint > 0.0:
		s = lerpf(s, full, sprint * maxf(intensity, 0.5))
	return s


## Speed follows v = v_target (1 - exp(-t / tau)); turning is limited by grip, big cuts at speed brake first.
func update_movement(dt: float, has_ball: bool) -> void:
	var tau0 := tau
	var lat0 := lateral
	if human >= 0:
		tau *= 0.8
		lateral *= 1.2
	_update_movement(dt, has_ball)
	tau = tau0
	lateral = lat0


func _update_movement(dt: float, has_ball: bool) -> void:
	var target := minf(target_speed(has_ball), cap) if move.length() >= 0.08 else 0.0
	var spd := vel.length()
	var heading := vel / spd if spd > 0.2 else facing
	var wish := move.normalized() if move.length() > 0.08 else heading
	var ball_turn := 1.0
	if has_ball:
		ball_turn = 0.85 + 0.15 * q(dribbling)
		if style == Style.CLOSE:
			ball_turn *= 1.6
	var lateral_style := style == Style.JOCKEY
	if target <= 0.0:
		spd = maxf(0.0, spd - brake * dt)
		vel = heading * spd
	elif lateral_style:
		var dv := wish * target - vel
		var max_dv := brake * 0.9 * dt
		if dv.length() > max_dv:
			dv = dv.normalized() * max_dv
		vel += dv
	else:
		var turn_limit := minf(turn_rate, lateral / maxf(spd, 0.6)) * ball_turn
		var delta := absf(heading.angle_to(wish))
		if delta > deg_to_rad(70.0) and spd > 3.0:
			spd = maxf(0.0, spd - brake * dt)  # plant and cut
			heading = _rotate_towards(heading, wish, turn_limit * 1.4 * dt)
		else:
			heading = _rotate_towards(heading, wish, turn_limit * dt)
			if spd < target:
				spd = target + (spd - target) * exp(-dt / tau)
			else:
				spd = maxf(target, spd - brake * 0.55 * dt)
		vel = heading * spd
	# facing
	spd = vel.length()
	var face_rate := turn_rate * (1.2 if has_ball else 1.6)
	var ft := facing
	if lateral_style and face_to.length() > 0.1:
		ft = face_to.normalized()
	elif spd > 0.6:
		ft = vel / spd
	elif face_to.length() > 0.1:
		ft = face_to.normalized()
	elif move.length() > 0.08:
		ft = wish
	facing = _rotate_towards(facing, ft, face_rate * dt)
	# stamina
	if sprint > 0.3 and spd > 0.75 * top_speed:
		stamina = maxf(0.0, stamina - dt / (40.0 + 0.6 * stamina_attr))
	elif spd < 0.5 * top_speed:
		stamina = minf(1.0, stamina + dt / 60.0 * (1.0 if spd < 2.0 else 0.4))
	advance_gait(dt)


## The running loops of the body (the view plays the same one): stride per step (m) and root speed at 1x (m/s).
const STRIDE := {"dribble": 0.86, "jog": 1.26, "sprint": 1.68}
const LOOP_SPEED := {"idle": 0.0, "dribble": 3.58, "jog": 5.25, "sprint": 7.0}


static func loco_for(s: float, has_ball: bool) -> String:
	if s <= 0.35:
		return "idle"
	if has_ball:
		return "dribble" if s < 6.0 else "sprint"
	if s <= 2.4:
		return "dribble"
	return "jog" if s < 6.2 else "sprint"


## Steps per second: the feet land where the body goes (no skating), the view plays its loop on this beat.
func step_rate() -> float:
	var s := vel.length()
	var c := loco_for(s, with_ball)
	if c == "idle":
		return 0.0
	return s / float(STRIDE[c])


func advance_gait(dt: float) -> void:
	var rate := step_rate()
	if rate <= 0.0:
		return
	gait += rate * dt
	while gait >= 1.0:
		gait -= 1.0
		steps += 1


static func _rotate_towards(from: Vector2, to: Vector2, max_angle: float) -> Vector2:
	var a := from.angle_to(to)
	if absf(a) <= max_angle:
		return to.normalized()
	return from.rotated(signf(a) * max_angle).normalized()


func start_action(kind: String, dur: float, data: Dictionary = {}) -> void:
	action = kind
	act_t = 0.0
	act_dur = dur
	act = data


func play_clip(name: String, t0: float, speed: float = 1.0) -> void:
	clip = name
	clip_t0 = t0
	clip_speed = speed


## Approach a ball at `target`: the fastest speed from which he can still take it. He must be able to slow down to
## a stride-taking speed by the time he gets there, and to bend his run onto it (a run aimed past the side of the
## ball has to be slow enough to turn inside the circle that reaches it) - otherwise he circles round the ball.
func arrival_cap(target: Vector2, end_speed: float = 2.6) -> float:
	var to := target - pos
	var d := to.length()
	if d < 0.05:
		return end_speed
	var v_stop := sqrt(end_speed * end_speed + 2.0 * brake * 0.75 * maxf(d - 0.35, 0.0))
	var spd := vel.length()
	var heading := vel / spd if spd > 0.3 else facing
	var delta := absf(heading.angle_to(to))
	if delta < deg_to_rad(15.0):
		return v_stop
	# the circle that leaves along the heading and passes through the target: r = d / (2 sin delta)
	var r := d / (2.0 * maxf(sin(minf(delta, PI * 0.5)), 0.2))
	var v_turn := sqrt(lateral * 0.85 * r)
	if delta > PI * 0.5:
		v_turn = minf(v_turn, 3.0)   # it is behind him: stop, turn, go
	return maxf(minf(v_stop, v_turn), 1.6)


## Where the kicking foot meets the ball: a little ahead, on the side of the strong foot.
func foot_point(dist: float = 0.45) -> Vector2:
	var side := facing.orthogonal() * (0.1 if left_footed else -0.1)
	return pos + facing * dist + side
