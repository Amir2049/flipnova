extends SceneTree
# Skill moves on the football engine (scripts/view/engine_skills.gd): every move is played by a scripted dribbler,
# many times; for each move: how often he still has the ball 1.2 s later, how far he turned, how far he moved
# sideways. Needs the native engine (prints SKIP without it).
#   godot --path . --fixed-fps 60 -s tests/engine_skills_test.gd
const MOVES := ["burst", "feint", "roll", "dragback", "roulette", "stepover", "elastico", "cruyff"]
var main: Node
var mv
var f := 0
var phase := 0
var k := 0
var t0 := 0
var yaw0 := 0.0
var pos0 := Vector2.ZERO
var res := {}
var hold := 0

func _initialize():
	main = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(main)

func _stick() -> Array:
	var st: Dictionary = mv.st
	var b := 0
	if not st.is_empty() and int(st["mode"]) != 0 and f % 90 == 0:
		b = 1   # take set pieces with a pass
	return [Vector2(1, 0), b]

func _process(_d) -> bool:
	f += 1
	if f == 5:
		if not ClassDB.class_exists("GFEngine"):
			print("SKIP: no native engine")
			quit(0)
			return false
		var cfg = main._match_config(0, 1, 0)
		cfg["half_minutes"] = 10.0
		main._play(cfg, {"type": "friendly"})
		mv = main.match_view
		mv.menus = false
		mv.test_input = _stick
	if mv == null or mv.st.is_empty():
		return false
	var on: bool = mv._on_ball()
	var ctl: int = mv.st["controlled"]
	match phase:
		0:
			hold = hold + 1 if on else 0
			if hold == 40:
				var name: String = MOVES[k % MOVES.size()]
				var f0: Vector2 = mv.facing_of(mv.poses, ctl * mv.stride)
				yaw0 = f0.angle()
				pos0 = Vector2(mv.poses[ctl * mv.stride], -mv.poses[ctl * mv.stride + 1])   # Godot pitch axes (x, z)
				if mv.request_skill(name, 1.0):
					phase = 1
					t0 = f
		1:
			if f - t0 == 72:
				var name: String = MOVES[k % MOVES.size()]
				var o: int = ctl * mv.stride
				var f1: Vector2 = mv.facing_of(mv.poses, o)
				var turn := absf(rad_to_deg(angle_difference(yaw0, f1.angle())))
				var fwd := Vector2(cos(yaw0), sin(yaw0))
				var dp := Vector2(mv.poses[o], -mv.poses[o + 1]) - pos0
				var side := absf(dp.dot(Vector2(-fwd.y, fwd.x)))
				var r: Array = res.get(name, [0, 0, 0.0, 0.0])
				res[name] = [r[0] + 1, r[1] + (1 if on else 0), r[2] + turn, r[3] + side]
				k += 1
				phase = 0
				hold = 0
	if f > 60 * 60 * 6 or k >= MOVES.size() * 6:
		for n in MOVES:
			var r: Array = res.get(n, [0, 0, 0.0, 0.0])
			if r[0] > 0:
				print("%-9s tries %d  kept the ball %3d%%  turned %4.0f deg  sideways %.1f m" % [n, r[0], 100 * r[1] / r[0], r[2] / r[0], r[3] / r[0]])
			else:
				print("%-9s never started" % n)
		quit(0)
	return false
