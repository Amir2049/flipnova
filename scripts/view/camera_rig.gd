class_name CameraRig
extends Camera3D
## Broadcast camera: from the stand on the +z side, follows the play with look-ahead and smoothing.

var mode := "pro"           # pro, broadcast, tele, close, wide
var focus := Vector3.ZERO
var pitch: Pitch
var shake_t := 0.0
var override_target = null  # Vector3 to look at instead (celebrations, replays)

## The FC-style match cameras: on a rail above the near touchline, panning with the play.
## height / back: camera height and horizontal distance to the point it looks at (tilt = atan(height / back));
## fov: vertical lens angle (fixed, so the pitch keeps its real size on screen); follow_z: how far the view follows
## the ball across the pitch. broadcast ~23 degrees down with the far stand in view, players about 8-9 % of the screen height like FC.
const MODES := {
	# TV framing (broadcast standard: high on the halfway line, long lens, ~15 degrees down): the far stand fills the
	# top of the picture, which is what makes it read as a stadium
	"broadcast": {"height": 15.0, "back": 55.0, "fov": 21.0, "follow_z": 0.45},
	"tele": {"height": 22.0, "back": 46.0, "fov": 24.0, "follow_z": 0.6},
	"close": {"height": 11.0, "back": 24.0, "fov": 32.0, "follow_z": 0.85},
	"wide": {"height": 24.0, "back": 42.0, "fov": 30.0, "follow_z": 0.5},
	# 2.59 "Pro" (the default; the owner asked for the feel of PES 2021's Wide camera): higher (~22 degrees down, less
	# stand, players read), it stays nearer the halfway line and turns toward the play instead of sliding with it
	# (truck 0.62: near a box the goal is seen on the diagonal, with depth), follows the ball further across the pitch,
	# a longer lens for bigger players, the lens kept so they do not shrink as the turn takes it further away, and a
	# little closer in the last third
	"pro": {"height": 17.0, "back": 57.0, "fov": 17.0, "follow_z": 0.6, "truck": 0.62, "keep_size": true, "box_zoom": 0.1},
}
const NAMES := {"pro": "Pro", "broadcast": "Broadcast", "tele": "Tele", "close": "Close", "wide": "Wide"}

var replay_pos := Vector3.ZERO
var replay_look := Vector3.ZERO
var sp_blend := 0.0          # 0 broadcast .. 1 set-piece camera
var sp_pos := Vector3.ZERO
var sp_look := Vector3.ZERO
var lead_dir := 0.0          # attacking direction of the team on the ball (the view leads the play)
var lead := 0.0
var zoom := 1.0
var external := false        # someone else drives the camera (tools, photo shots)


func setup(p: Pitch) -> void:
	pitch = p
	current = true
	near = 0.3
	far = 600.0


func cycle() -> String:
	var keys := MODES.keys()
	mode = keys[(keys.find(mode) + 1) % keys.size()]
	return mode


func shake(t: float) -> void:
	shake_t = maxf(shake_t, t)


func follow(ball: BallPhysics, extra: Vector2, dt: float, snap: bool = false) -> void:
	if external:
		return
	var cfg: Dictionary = MODES[mode]
	var k := 1.0 if snap else 1.0 - exp(-dt * 3.0)
	# the play: the ball, a little ahead of it in the attacking direction, pulled slightly toward our player
	lead = lerpf(lead, lead_dir * 5.0, 1.0 if snap else 1.0 - exp(-dt * 0.8))
	var target := Vector3(ball.pos.x + lead, 0.0, ball.pos.z)
	target += Vector3(clampf(ball.vel.x * 0.3, -6, 6), 0, clampf(ball.vel.z * 0.15, -3, 3))
	target = target.lerp(Vector3(extra.x, 0, extra.y), 0.15)
	if override_target != null:
		target = override_target
	var hl := pitch.half_l()
	var hw := pitch.half_w()
	target.x = clampf(target.x, -hl + 14.0, hl - 14.0)
	target.z = clampf(target.z, -hw + 4.0, hw - 4.0)
	focus = focus.lerp(target, k)
	# a touch wider on fast long balls, a touch tighter around the boxes
	var bs := Vector2(ball.vel.x, ball.vel.z).length()
	var near_goal := clampf((absf(focus.x) - (hl - 30.0)) / 14.0, 0.0, 1.0)
	var want_zoom := 1.0 + clampf((bs - 14.0) / 20.0, 0.0, 0.1) - float(cfg.get("box_zoom", 0.07)) * near_goal
	zoom = lerpf(zoom, want_zoom, 1.0 if snap else 1.0 - exp(-dt * 1.2))
	var look := Vector3(focus.x, 0.0, focus.z * float(cfg["follow_z"]))
	var cam := Vector3(focus.x * float(cfg.get("truck", 0.92)), float(cfg["height"]), look.z + float(cfg["back"]))
	# small pitches (the street cage): come in closer so the play fills the screen
	var scale := clampf(pitch.length / 105.0, 0.55, 1.0)
	if scale < 1.0:
		cam = look + (cam - look) * (0.45 + 0.55 * scale)
	fov = float(cfg["fov"]) * zoom
	if cfg.get("keep_size", false):
		# turned toward the play the camera is further from it: narrow the lens by as much, same player size
		var d0 := Vector2(float(cfg["height"]), float(cfg["back"])).length()
		fov *= d0 / maxf(d0, cam.distance_to(look))
	if shake_t > 0.0:
		shake_t -= dt
		cam += Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * 0.25 * shake_t
	look_at_from_position(cam, look, Vector3.UP)


## Set pieces: the camera goes behind the taker (penalties, free kicks near goal), above the corner flag (corners)
## or behind the keeper (goal kicks); `kind` = "" eases back to the match camera.
func set_piece(kind: String, ball_pos: Vector3, goal_x: float, dt: float, snap: bool = false) -> void:
	if external:
		return
	var to_goal := Vector3(goal_x, 0, 0) - Vector3(ball_pos.x, 0, ball_pos.z)
	var dirn := to_goal.normalized() if to_goal.length() > 0.1 else Vector3(1, 0, 0)
	var want_pos := sp_pos
	var want_look := sp_look
	match kind:
		"penalty":
			want_pos = ball_pos - dirn * 4.5 + Vector3(0, 1.9, 0)
			want_look = Vector3(goal_x, 1.0, 0)
		"free_kick":
			want_pos = ball_pos - dirn * 7.0 + Vector3(0, 2.8, 0)
			want_look = Vector3(goal_x, 0.8, ball_pos.z * 0.3)
		"corner":
			var out := Vector3(signf(ball_pos.x) * 8.0, 0, signf(ball_pos.z) * 9.0)
			want_pos = ball_pos + out + Vector3(0, 9.0, 0)
			want_look = Vector3(goal_x - signf(goal_x) * 9.0, 0, 0)
		"goal_kick":
			want_pos = Vector3(ball_pos.x + signf(ball_pos.x) * 16.0, 9.0, ball_pos.z * 0.5)
			want_look = Vector3(ball_pos.x - signf(ball_pos.x) * 30.0, 0, 0)
	var on := kind != ""
	sp_blend = 1.0 if (snap and on) else move_toward(sp_blend, 1.0 if on else 0.0, dt / (0.35 if on else 0.8))
	if on:
		var k := 1.0 if snap or sp_blend < 0.05 else 1.0 - exp(-dt * 5.0)
		sp_pos = sp_pos.lerp(want_pos, k)
		sp_look = sp_look.lerp(want_look, k)
	if sp_blend <= 0.0:
		return
	var base := global_transform
	var t := Transform3D().looking_at(sp_look - sp_pos, Vector3.UP)
	t.origin = sp_pos
	var e := sp_blend * sp_blend * (3.0 - 2.0 * sp_blend)
	global_transform = base.interpolate_with(t, e)
	fov = lerpf(fov, 50.0 if kind == "corner" else 42.0, e)


## Replays: a low camera on the near touchline that tracks the ball closely.
func follow_replay(ball: BallPhysics, dt: float, snap: bool = false, behind_goal: float = 0.0) -> void:
	var b := ball.pos
	var side := -1.0 if b.x > 0.0 else 1.0
	var want_pos := Vector3(b.x + side * 9.0, 3.2 + b.y * 0.4, b.z + 12.0)
	var want_look := Vector3(b.x, 0.6 + b.y * 0.7, b.z)
	if behind_goal != 0.0:
		# angle two: from behind the net the ball is flying into
		want_pos = Vector3(behind_goal * 60.0, 2.6, b.z * 0.4)
		want_look = Vector3(b.x, 0.8 + b.y * 0.5, b.z)
	var k := 1.0 if snap else 1.0 - exp(-dt * 4.0)
	replay_pos = replay_pos.lerp(want_pos, k)
	replay_look = replay_look.lerp(want_look, 1.0 if snap else 1.0 - exp(-dt * 7.0))
	fov = lerpf(fov, 34.0, 1.0 if snap else 1.0 - exp(-dt * 3.0))
	look_at_from_position(replay_pos, replay_look, Vector3.UP)


## Stick (screen: x right, y up) to pitch direction (x, z) for this camera.
func screen_to_world(stick: Vector2) -> Vector2:
	var right := global_transform.basis.x
	var fwd := -global_transform.basis.z
	var r := Vector2(right.x, right.z).normalized()
	var f := Vector2(fwd.x, fwd.z).normalized()
	return r * stick.x + f * stick.y
