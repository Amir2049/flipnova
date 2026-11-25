extends SceneTree
# Smoothness on a 120 Hz screen: run with --fixed-fps 120. Each displayed frame, how far every visible player and the
# ball moved; for a smooth picture the step from one frame to the next changes little. Prints the mean relative
# jerk |step_t - step_t-1| / mean step over moving players (lower = smoother) and the share of frames where the
# picture did not move at all while the ball was moving (frozen frames).
var main: Node
var f := 0
var last := {}
var prev_step := {}
var jerk := 0.0
var jn := 0
var frozen := 0
var moving := 0
func _initialize():
	main = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(main)
func _process(_d) -> bool:
	f += 1
	if f == 5:
		var cfg = main._match_config(0, 1, -1)
		main._play(cfg, {"type": "friendly"})
	if f > 400 and main.match_view and main.match_view.get("pviews"):
		var mv = main.match_view
		var any_move := false
		for i in 22:
			var p: Vector3 = mv.pviews[i].global_position
			if last.has(i):
				var s: float = (p - last[i]).length()
				if prev_step.has(i) and s > 0.002 and prev_step[i] > 0.002:
					jerk += absf(s - prev_step[i]) / maxf((s + prev_step[i]) * 0.5, 0.001)
					jn += 1
				prev_step[i] = s
				if s > 0.0005:
					any_move = true
			last[i] = p
		moving += 1
		if not any_move:
			frozen += 1
	if f >= 1600:
		print("SMOOTH relative_jerk %.3f  frozen_frames %.1f%%  (%d samples)" % [jerk / maxf(jn, 1), 100.0 * frozen / maxf(moving, 1), jn])
		quit()
	return false
