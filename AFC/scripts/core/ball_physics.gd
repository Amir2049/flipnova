class_name BallPhysics
extends RefCounted
## The ball: gravity, air drag with the drag crisis, Magnus (curl), bounces, rolling on grass, goal frame and nets.
## Godot axes: y up, the pitch is the x/z plane, goals at x = +/- length / 2.

const RADIUS := 0.11
const MASS := 0.43
const AIR_DENSITY := 1.2
const CD_LOW := 0.40        # slow balls (below the drag crisis)
const CD_HIGH := 0.22       # fast balls
const CRISIS_LOW := 7.0
const CRISIS_HIGH := 13.0
const LIFT_SLOPE := 1.1     # lift coefficient = slope * spin parameter, capped
const LIFT_MAX := 0.35
const RESTITUTION := 0.62   # vertical, grass
const BOUNCE_FRICTION := 0.22
const ROLL_RESISTANCE := 0.065   # deceleration = this * g when rolling
static var surface := 1.0        # rolling resistance multiplier: a wet pitch (rain) is quicker
const SPIN_DECAY_AIR := 4.0      # s
const SPIN_DECAY_GROUND := 0.5   # s
const SETTLE_SPEED := 0.9        # vertical speed below which the ball stops bouncing
const FRAME_RESTITUTION := 0.6
const NET_DAMPING := 7.0
const G := 9.81
const K_AIR := 0.5 * AIR_DENSITY * PI * RADIUS * RADIUS / MASS

var pos := Vector3(0, RADIUS, 0)
var vel := Vector3.ZERO
var spin := Vector3.ZERO   # angular velocity, rad/s

# events of the last step (cleared by the caller)
var ev_goal := 0          # +1 / -1: the end (x sign) where the whole ball crossed under the bar between the posts
var ev_out := 0           # 1 touch line, 2 goal line
var ev_out_pos := Vector2.ZERO
var ev_frame := false
var ev_bounce := false


static func drag_coefficient(speed: float) -> float:
	if speed <= CRISIS_LOW:
		return CD_LOW
	if speed >= CRISIS_HIGH:
		return CD_HIGH
	var t := (speed - CRISIS_LOW) / (CRISIS_HIGH - CRISIS_LOW)
	return lerpf(CD_LOW, CD_HIGH, t * t * (3.0 - 2.0 * t))


static func air_accel(v: Vector3, w: Vector3) -> Vector3:
	var a := Vector3(0, -G, 0)
	var speed := v.length()
	if speed < 1e-6:
		return a
	a += v * (-K_AIR * drag_coefficient(speed) * speed)
	var wl := w.length()
	if wl > 1e-3:
		var cl := minf(LIFT_MAX, LIFT_SLOPE * RADIUS * wl / speed)
		a += w.cross(v).normalized() * (K_AIR * cl * speed * speed)
	return a


static func roll_decel(speed: float) -> float:
	return ROLL_RESISTANCE * surface * G + K_AIR * drag_coefficient(speed) * speed * speed


func is_rolling() -> bool:
	return pos.y <= RADIUS + 1e-4 and absf(vel.y) < 1e-4


func clear_events() -> void:
	ev_goal = 0
	ev_out = 0
	ev_frame = false
	ev_bounce = false


func step(dt: float, pitch: Pitch) -> void:
	var travel := vel.length() * dt
	var n := clampi(int(ceil(travel / 0.08)), 1, 16)
	var h := dt / n
	for i in n:
		_substep(h, pitch)


func _substep(dt: float, pitch: Pitch) -> void:
	var prev := pos
	if not is_rolling():
		vel += air_accel(vel, spin) * dt
		pos += vel * dt
		spin *= exp(-dt / SPIN_DECAY_AIR)
		if pos.y < RADIUS:
			pos.y = RADIUS
			if vel.y < -SETTLE_SPEED:
				var vin := -vel.y
				vel.y = vin * RESTITUTION
				var f := BOUNCE_FRICTION * minf(1.0, vin / 6.0)
				vel.x *= 1.0 - f
				vel.z *= 1.0 - f
				spin *= 0.6
				ev_bounce = true
			else:
				vel.y = 0.0
	else:
		var vh := Vector2(vel.x, vel.z)
		var speed := vh.length()
		if speed > 0.0:
			var ns := speed - roll_decel(speed) * dt
			if ns < 0.03:
				ns = 0.0
			vh *= ns / speed
			vel = Vector3(vh.x, 0, vh.y)
			pos += vel * dt
		pos.y = RADIUS
		spin *= exp(-dt / SPIN_DECAY_GROUND)
	if pitch.walls:
		_walls(pitch)
	_frame(pitch)
	# goal line: the whole ball over it
	var hl := pitch.half_l()
	var line_x := hl + RADIUS
	if absf(prev.x) < line_x and absf(pos.x) >= line_x and ev_goal == 0 and ev_out == 0:
		var denom := absf(pos.x) - absf(prev.x)
		var t := (line_x - absf(prev.x)) / denom if denom > 1e-9 else 1.0
		var c := prev.lerp(pos, t)
		if absf(c.z) < pitch.goal_width * 0.5 and c.y < pitch.goal_height:
			ev_goal = 1 if pos.x > 0.0 else -1
		elif not pitch.walls:
			ev_out = 2
			ev_out_pos = Vector2(signf(pos.x) * hl, c.z)
	# inside the net: absorb
	if absf(pos.x) > hl and absf(pos.z) < pitch.goal_width * 0.5 and pos.y < pitch.goal_height:
		vel *= exp(-NET_DAMPING * dt)
		var max_x := hl + pitch.goal_depth - RADIUS
		if absf(pos.x) > max_x:
			pos.x = signf(pos.x) * max_x
			vel.x = 0.0
		if pos.y > pitch.goal_height - RADIUS and absf(prev.x) > hl:
			pos.y = pitch.goal_height - RADIUS
			vel.y = minf(vel.y, 0.0)
	if not pitch.walls and absf(pos.z) >= pitch.half_w() + RADIUS and ev_out == 0 and ev_goal == 0:
		ev_out = 1
		ev_out_pos = Vector2(pos.x, signf(pos.z) * pitch.half_w())


func _walls(pitch: Pitch) -> void:
	var hw := pitch.half_w()
	if absf(pos.z) + RADIUS > hw:
		pos.z = signf(pos.z) * (hw - RADIUS)
		if vel.z * signf(pos.z) > 0.0:
			vel.z = -vel.z * 0.55
			vel.x *= 0.92
			spin *= 0.5
	var hl := pitch.half_l()
	if absf(pos.x) + RADIUS > hl and absf(pos.z) > pitch.goal_width * 0.5:
		pos.x = signf(pos.x) * (hl - RADIUS)
		if vel.x * signf(pos.x) > 0.0:
			vel.x = -vel.x * 0.55
			spin *= 0.5


func _frame(pitch: Pitch) -> void:
	var hl := pitch.half_l()
	if absf(absf(pos.x) - hl) > 1.0:
		return
	var sx := -1.0 if pos.x < 0.0 else 1.0
	var gx := sx * (hl + pitch.post_radius)
	var hw := pitch.goal_width * 0.5 + pitch.post_radius
	var h := pitch.goal_height + pitch.post_radius
	_segment(Vector3(gx, 0, -hw), Vector3(gx, h, -hw), pitch.post_radius)
	_segment(Vector3(gx, 0, hw), Vector3(gx, h, hw), pitch.post_radius)
	_segment(Vector3(gx, h, -hw), Vector3(gx, h, hw), pitch.post_radius)


func _segment(a: Vector3, c: Vector3, r: float) -> void:
	var ac := c - a
	var l2 := ac.length_squared()
	var t := clampf((pos - a).dot(ac) / l2, 0.0, 1.0) if l2 > 1e-9 else 0.0
	var q := a + ac * t
	var d := pos - q
	var dist := d.length()
	var min_dist := r + RADIUS
	if dist >= min_dist or dist < 1e-9:
		return
	var nrm := d / dist
	pos = q + nrm * (min_dist + 1e-4)
	var vn := vel.dot(nrm)
	if vn < 0.0:
		vel -= nrm * ((1.0 + FRAME_RESTITUTION) * vn)
		spin *= 0.5
		ev_frame = true


# ------------------------------------------------------------------ solvers (no pitch, ground and air only)

## Time for a rolling ball launched at v0 to cover d metres (-1 if it stops short). arrive[0] gets the speed there.
static func roll_time(v0: float, d: float, arrive: Array = []) -> float:
	var s := v0
	var x := 0.0
	var t := 0.0
	var dt := 1.0 / 120.0
	while x < d:
		s -= roll_decel(s) * dt
		if s <= 0.03:
			return -1.0
		x += s * dt
		t += dt
		if t > 15.0:
			return -1.0
	if arrive.size() > 0:
		arrive[0] = s
	return t


## How far a rolling ball launched at v0 goes before it stops.
static func roll_distance(v0: float) -> float:
	var s := v0
	var x := 0.0
	var dt := 1.0 / 60.0
	while s > 0.03:
		s -= roll_decel(s) * dt
		x += maxf(s, 0.0) * dt
	return x


## Launch speed so a ground ball covers d in time T.
static func solve_roll_speed(d: float, T: float) -> float:
	var lo := 0.5
	var hi := 40.0
	if roll_time(hi, d) > T:
		return hi
	for i in 22:
		var mid := 0.5 * (lo + hi)
		var t := roll_time(mid, d)
		if t < 0.0 or t > T:
			lo = mid
		else:
			hi = mid
	return hi


## Height of a lofted ball when it has travelled d metres horizontally (negative = lands short by that much).
static func loft_height_at(from: Vector3, dir: Vector2, d: float, speed: float, angle: float, w: Vector3, out_t: Array) -> float:
	var p := from
	var v := Vector3(dir.x * speed * cos(angle), speed * sin(angle), dir.y * speed * cos(angle))
	var dt := 1.0 / 120.0
	var t := 0.0
	var start := Vector2(from.x, from.z)
	while t < 8.0:
		v += air_accel(v, w) * dt
		p += v * dt
		t += dt
		var h := (Vector2(p.x, p.z) - start).dot(dir)
		if h >= d:
			out_t[0] = t
			return p.y
		if p.y < RADIUS and v.y < 0.0:
			out_t[0] = t
			return -(d - h)
	out_t[0] = t
	return -d


## Launch speed for a lofted ball at a given angle that passes target (x, z) at target_h on the way down.
static func solve_lofted_speed(from: Vector3, target: Vector2, target_h: float, angle: float, w: Vector3, out_t: Array) -> float:
	var delta := target - Vector2(from.x, from.z)
	var d := delta.length()
	var dir := delta / d if d > 1e-6 else Vector2(1, 0)
	var lo := 2.0
	var hi := 40.0
	var tt := [0.0]
	for i in 22:
		var mid := 0.5 * (lo + hi)
		if loft_height_at(from, dir, d, mid, angle, w, tt) < target_h:
			lo = mid
		else:
			hi = mid
	var v := 0.5 * (lo + hi)
	loft_height_at(from, dir, d, v, angle, w, tt)
	out_t[0] = tt[0]
	return v


## Velocity of a given speed (and spin) that passes through `aim` (shots). Iterates on the launch direction.
static func solve_aim(from: Vector3, aim: Vector3, speed: float, w: Vector3) -> Vector3:
	var dir := (aim - from).normalized()
	for it in 6:
		var p := from
		var v := dir * speed
		var dt := 1.0 / 120.0
		var t := 0.0
		var target_d := Vector2(aim.x - from.x, aim.z - from.z).length()
		var start := Vector2(from.x, from.z)
		while t < 4.0:
			v += air_accel(v, w) * dt
			p += v * dt
			t += dt
			if (Vector2(p.x, p.z) - start).length() >= target_d:
				break
			if p.y < RADIUS:
				p.y = RADIUS
				v.y = absf(v.y) * RESTITUTION
		var miss := aim - p
		if miss.length() < 0.05:
			break
		dir = (dir * speed + miss / maxf(t, 0.05) * 0.9).normalized()
	return dir * speed


## Ball positions every dt for n steps (ground bounces included, no frame or walls). For AI and keepers.
func predict(dt: float, n: int) -> PackedVector3Array:
	var out := PackedVector3Array()
	out.resize(n)
	var p := pos
	var v := vel
	var w := spin
	for i in n:
		if p.y <= RADIUS + 1e-4 and absf(v.y) < 1e-4:
			var vh := Vector2(v.x, v.z)
			var s := vh.length()
			if s > 0.0:
				var ns := maxf(0.0, s - roll_decel(s) * dt)
				vh *= ns / s
				v = Vector3(vh.x, 0, vh.y)
				p += v * dt
		else:
			v += air_accel(v, w) * dt
			p += v * dt
			if p.y < RADIUS:
				p.y = RADIUS
				if v.y < -SETTLE_SPEED:
					v.y = -v.y * RESTITUTION
					v.x *= 0.85
					v.z *= 0.85
				else:
					v.y = 0.0
		out[i] = p
	return out
