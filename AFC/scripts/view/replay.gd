class_name Replay
extends RefCounted
## Instant replay: keeps the last seconds of the match (30 snapshots a second) and plays them back by writing the
## recorded state into the players and the ball for the views; the real state is put back afterwards.

const RATE := 30.0
const KEEP := 9.0

var frames: Array = []     # [{t, ball: [x,y,z,vx,vy,vz], p: [[x, z, fx, fz, vx, vz, spin, lean, clip, clip_t0, clip_speed], ...]}]
var acc := 0.0
var saved := {}
var playing := false
var t := 0.0
var t_end := 0.0
var t_start := 0.0


func record(m: MatchSim, dt: float) -> void:
	acc += dt
	if acc < 1.0 / RATE:
		return
	acc = fmod(acc, 1.0 / RATE)
	var ps := []
	for p in m.players:
		ps.append([p.pos.x, p.pos.y, p.facing.x, p.facing.y, p.vel.x, p.vel.y, p.pose_spin, p.pose_lean, p.clip, p.clip_t0, p.clip_speed, p.steps, p.gait])
	var b := m.ball
	frames.append({"t": m.time, "ball": [b.pos.x, b.pos.y, b.pos.z, b.vel.x, b.vel.y, b.vel.z], "p": ps})
	while frames.size() > int(KEEP * RATE):
		frames.pop_front()


func can_play(from_t: float) -> bool:
	return frames.size() > 10 and frames[0]["t"] <= from_t + 2.0


func start(m: MatchSim, from_t: float, to_t: float) -> void:
	saved = {"ball": [m.ball.pos, m.ball.vel, m.ball.spin], "p": []}
	for p in m.players:
		saved["p"].append([p.pos, p.facing, p.vel, p.pose_spin, p.pose_lean, p.clip, p.clip_t0, p.clip_speed, p.steps, p.gait])
	t = maxf(from_t, frames[0]["t"])
	t_start = t
	t_end = minf(to_t, frames.back()["t"])
	playing = true
	apply(m)


## Writes the state at replay time `t` into the simulation objects (views read them as usual).
func apply(m: MatchSim) -> void:
	var i := 0
	while i < frames.size() - 2 and frames[i + 1]["t"] < t:
		i += 1
	var a: Dictionary = frames[i]
	var b: Dictionary = frames[mini(i + 1, frames.size() - 1)]
	var span: float = maxf(b["t"] - a["t"], 0.0001)
	var k := clampf((t - a["t"]) / span, 0.0, 1.0)
	for j in m.players.size():
		var pa: Array = a["p"][j]
		var pb: Array = b["p"][j]
		var p := m.players[j]
		p.pos = Vector2(lerpf(pa[0], pb[0], k), lerpf(pa[1], pb[1], k))
		p.facing = Vector2(lerpf(pa[2], pb[2], k), lerpf(pa[3], pb[3], k)).normalized()
		p.vel = Vector2(lerpf(pa[4], pb[4], k), lerpf(pa[5], pb[5], k))
		p.pose_spin = pa[6]
		p.pose_lean = lerpf(pa[7], pb[7], k)
		p.clip = pa[8]
		p.clip_t0 = pa[9]
		p.clip_speed = pa[10]
		p.steps = pa[11]
		p.gait = pa[12]
	var ba: Array = a["ball"]
	var bb: Array = b["ball"]
	m.ball.pos = Vector3(lerpf(ba[0], bb[0], k), lerpf(ba[1], bb[1], k), lerpf(ba[2], bb[2], k))
	m.ball.vel = Vector3(lerpf(ba[3], bb[3], k), lerpf(ba[4], bb[4], k), lerpf(ba[5], bb[5], k))


func stop(m: MatchSim) -> void:
	if not playing:
		return
	playing = false
	m.ball.pos = saved["ball"][0]
	m.ball.vel = saved["ball"][1]
	m.ball.spin = saved["ball"][2]
	for j in m.players.size():
		var s: Array = saved["p"][j]
		var p := m.players[j]
		p.pos = s[0]
		p.facing = s[1]
		p.vel = s[2]
		p.pose_spin = s[3]
		p.pose_lean = s[4]
		p.clip = s[5]
		p.clip_t0 = s[6]
		p.clip_speed = s[7]
		p.steps = s[8]
		p.gait = s[9]
