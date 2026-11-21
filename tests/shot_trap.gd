extends SceneTree
# Close-up of receptions: a chest-high ball, then a knee-high one, then a ground pass from the side.
var mv
var f := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/trap/"
var p
var shots := 0
func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 1, "human_team": -1, "half_minutes": 30.0, "camera": "broadcast", "opts": {"replays": false, "quality": 1}})
func _serve(h: float, side: float) -> void:
	var s = mv.sim
	p = s.team_players(0)[9]
	for q in s.players:
		if q != p:
			s.parked[q.id] = Vector2(-50.0 + q.id * 2.0, 40.0)
	s.phase = "play"
	s.owner = -1
	p.pos = Vector2(0, 0)
	p.vel = Vector2.ZERO
	p.facing = Vector2(1, 0)
	p.action = ""
	p.clip = ""
	var from := Vector2(12, 0) if side == 0.0 else Vector2(0, 12.0 * side)
	s.ball.pos = Vector3(from.x, 0.11 if h < 0.2 else 1.0, from.y)
	var dist := from.length()
	var hspeed := 11.0
	var t := dist / hspeed
	var vy: float = (h - s.ball.pos.y + 4.9 * t * t) / t if h > 0.2 else 0.0
	var d := (-from).normalized()
	s.ball.vel = Vector3(d.x * hspeed, vy, d.y * hspeed)
	s.pass_to = p.id
	s.pass_t = s.time
	s.kick_t = s.time
	s.last_team = 0
func _process(_d) -> bool:
	f += 1
	var s = mv.sim
	if f == 10:
		_serve(1.25, 0.0)
	if f == 70:
		_serve(0.7, 0.0)
	if f == 130:
		_serve(0.0, -1.0)
	if f > 10:
		mv.cam.override_target = Vector3(p.pos.x, 0, p.pos.y) if p else null
	if f > 10 and f % 4 == 0 and f < 190:
		get_root().get_texture().get_image().save_png(out + "t_%03d.png" % f)
		print("f%d clip %s ball (%.2f %.2f) owner %d" % [f, p.clip, Vector2(s.ball.pos.x, s.ball.pos.z).distance_to(p.pos), s.ball.pos.y, s.owner])
	return f >= 190
