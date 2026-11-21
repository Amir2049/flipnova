extends SceneTree
# The engine match with a scripted player (no rendering): dribble at goal, shoot near the box, chase and press
# when the other team has it, take our set pieces. Prints goals, possession, set-piece waits and speed.
#   SECONDS=240 godot --headless -s tests/engine_play_test.gd
var mv
var t0 := 0
var frames := 0
var seconds := 240.0
var stats := {"own": 0, "theirs": 0, "loose": 0, "wait": 0.0, "longest_wait": 0.0}
var wait_t := 0.0
var shoot_t := 0.0

func _initialize():
	if OS.get_environment("SECONDS") != "":
		seconds = float(OS.get_environment("SECONDS"))
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": seconds / 120.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"time_of_day": "day", "quality": 0}})
	mv.test_input = Callable(self, "_bot")
	mv.menus = false
	t0 = Time.get_ticks_msec()

var partial := float(OS.get_environment("PARTIAL")) if OS.get_environment("PARTIAL") != "" else 1.0

func _bot() -> Array:
	var r := _bot_full()
	return [r[0] * partial, r[1]]

func _bot_full() -> Array:
	var st: Dictionary = mv.st
	if st.is_empty():
		return [Vector2.ZERO, 0]
	var ctl: int = st["controlled"]
	if ctl < 0:
		return [Vector2.ZERO, 0]
	var o: int = ctl * mv.stride
	var me := Vector2(mv.poses[o], -mv.poses[o + 1])          # Godot x, z
	var b: Vector3 = st["ball"]
	var ball := Vector2(b.x, -b.y)
	var dt := 1.0 / 60.0
	# a set piece of ours waiting for us
	if mv.hint_lbl.visible:
		wait_t += dt
		if wait_t > 0.6 and wait_t < 0.9:
			return [Vector2(1, 0), mv.B_SHORT]
		return [Vector2(1, 0), 0]
	elif wait_t > 0.0:
		stats["wait"] += wait_t
		stats["longest_wait"] = maxf(stats["longest_wait"], wait_t)
		wait_t = 0.0
	if st["owner_team"] == 0 and st["owner_player"] == ctl:
		var to_goal := Vector2(55, 0) - me
		if me.x > 30.0:
			shoot_t += dt
			return [to_goal.normalized(), mv.B_SHOT if shoot_t < 0.25 else 0]
		shoot_t = 0.0
		return [to_goal.normalized(), mv.B_SPRINT if me.x < 10.0 else 0]
	var to_ball := ball - me
	var press: int = mv.B_PRESS if st["owner_team"] == 1 else 0
	return [to_ball.normalized() if to_ball.length() > 0.3 else Vector2.ZERO, press | (mv.B_SPRINT if to_ball.length() > 8.0 else 0)]

func _process(_dt) -> bool:
	frames += 1
	var st: Dictionary = mv.st
	if not st.is_empty():
		match int(st["owner_team"]):
			0: stats["own"] += 1
			1: stats["theirs"] += 1
			_: stats["loose"] += 1
	if frames % 600 == 0:
		var b: Vector3 = st["ball"]
		var best := 1e9
		var bi := -1
		for i in 22:
			var o: int = i * mv.stride
			var d := Vector2(mv.poses[o] - b.x, mv.poses[o + 1] - b.y).length()
			if d < best:
				best = d
				bi = i
		print("min %.1f score %s mode %d in_play %s ball (%.1f, %.1f) nearest %d (%.1f m) controlled %d taker %d hint %s" % [st["minute"], str(st["goals"]), st["mode"], str(st["in_play"]), b.x, b.y, bi, best, st["controlled"], st.get("taker", -1), str(mv.hint_lbl.visible)])
	if mv.full_time or frames > int(seconds * 60.0) + 2400:
		var tot := float(stats["own"] + stats["theirs"] + stats["loose"])
		print("RESULT score %s minute %.1f possession %.0f%% / %.0f%% (loose %.0f%%), set-piece waits %.1f s (longest %.1f s), %d frames in %d ms" % [
			str(st["goals"]), st["minute"], stats["own"] / tot * 100.0, stats["theirs"] / tot * 100.0, stats["loose"] / tot * 100.0,
			stats["wait"], stats["longest_wait"], frames, Time.get_ticks_msec() - t0])
		print("subs used ", mv.subs_used, "  facts ", mv.stats.rows())
		return true
	return false
