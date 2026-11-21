extends SceneTree
# A friendly played with fingers, the way the phone plays it: the real touch controls get real screen-touch events
# (a thumb on the stick pushed only part way, quick taps on PASS / SHOOT, SPRINT held), through the match view into
# the engine. Prints what happened and can record the screen.
#   xvfb-run -a -s "-screen 0 1602x720x24" godot --rendering-driver opengl3 --resolution 1602x720 --fixed-fps 30 \
#     [--write-movie /tmp/x/f.png] -s tests/phone_session.gd       (SECS=40 PUSH=0.6)
var mv
var frame := 0
var secs := 40.0
var push := 0.6
var fps := 30.0
var stick_down := false
var taps := {}                 # button -> frames left down
var sprint_down := false
var stats := {"pass_taps": 0, "passes": 0, "shoot_taps": 0, "shots": 0, "moving": 0, "pushing": 0, "own": 0, "frames": 0}
var watch := {}                # what a tap should cause: {kind, ctl, until}
var last_owner := Vector2i(-1, -1)
var next_pass := 0.0
var t_have := 0.0
var prev_p := Vector2.INF
var sp_wait := 0.0
var longest_sp := 0.0

func _initialize():
	if OS.get_environment("SECS") != "":
		secs = float(OS.get_environment("SECS"))
	if OS.get_environment("PUSH") != "":
		push = float(OS.get_environment("PUSH"))
	mv = load("res://scripts/view/engine_match_view.gd").new()
	mv.force_touch = true
	mv.menus = false
	get_root().add_child(mv)
	var opts: Dictionary = Profile.DEFAULT_SETTINGS.duplicate(true)
	opts["quality"] = int(OS.get_environment("QUALITY")) if OS.get_environment("QUALITY") != "" else 1
	mv.start({"seed": int(OS.get_environment("SEED")) if OS.get_environment("SEED") != "" else 7, "home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast", "opts": opts})


func _touch(index: int, pos: Vector2, pressed: bool) -> void:
	var e := InputEventScreenTouch.new()
	e.index = index
	e.position = pos
	e.pressed = pressed
	Input.parse_input_event(e)


func _drag(index: int, pos: Vector2) -> void:
	var e := InputEventScreenDrag.new()
	e.index = index
	e.position = pos
	Input.parse_input_event(e)


## pitch direction (Godot x, z) -> stick (x right, y up) through the camera
func _to_stick(w: Vector2) -> Vector2:
	var b: Basis = mv.cam.global_transform.basis
	var r := Vector2(b.x.x, b.x.z).normalized()
	var f := Vector2(-b.z.x, -b.z.z).normalized()
	return Vector2(w.dot(r), w.dot(f))


func _process(_dt) -> bool:
	frame += 1
	var t := frame / fps
	var st: Dictionary = mv.st
	var tc: TouchControls = mv.touch
	if st.is_empty() or tc == null:
		return false
	# release finished taps
	for k in taps.keys():
		taps[k] -= 1
		if taps[k] <= 0:
			_touch(3 if k == "pass" else 4, tc.buttons[k]["pos"], false)
			taps.erase(k)
	var ctl: int = st["controlled"]
	var want := Vector2.ZERO
	var sprint := false
	if ctl >= 0 and int(st["mode"]) == 0:
		var o: int = ctl * mv.stride
		var me := Vector2(mv.poses[o], -mv.poses[o + 1])
		var b: Vector3 = st["ball"]
		var ball := Vector2(b.x, -b.y)
		var mine: bool = int(st["owner_team"]) == 0 and int(st["owner_player"]) == ctl
		if mine:
			stats["own"] += 1
			t_have += 1.0 / fps
			var to_goal := Vector2(55, 0) - me
			want = to_goal.normalized()
			if me.x > 33.0 and not taps.has("shoot") and not watch.has("kind"):
				taps["shoot"] = 2      # a 66 ms tap
				_touch(4, tc.buttons["shoot"]["pos"], true)
				stats["shoot_taps"] += 1
				watch = {"kind": "shot", "ctl": ctl, "until": t + 1.5}
			elif t_have > 2.5 and t > next_pass and not taps.has("pass") and not watch.has("kind"):
				taps["pass"] = 2
				_touch(3, tc.buttons["pass"]["pos"], true)
				stats["pass_taps"] += 1
				next_pass = t + 4.0
				watch = {"kind": "pass", "ctl": ctl, "until": t + 1.5}
		else:
			t_have = 0.0
			want = (ball - me).normalized() if me.distance_to(ball) > 0.5 else Vector2.ZERO
			sprint = me.distance_to(ball) > 10.0
	if ctl >= 0 and int(st["mode"]) > 0 and int(st.get("taker", -1)) == ctl:
		sp_wait += 1.0 / fps
		longest_sp = maxf(longest_sp, sp_wait)
	else:
		sp_wait = 0.0
	if ctl >= 0 and int(st["mode"]) > 0 and int(st.get("taker", -1)) == ctl and not taps.has("pass") and int(frame) % 45 == 0:
		taps["pass"] = 2
		_touch(3, tc.buttons["pass"]["pos"], true)
		if OS.get_environment("DEBUG") != "":
			print("set piece tap: mode %d taker %d ctl %d" % [st["mode"], st.get("taker", -1), ctl])
	if OS.get_environment("DEBUG") != "" and taps.has("pass"):
		print("  frame %d pass held %s commit %s buttons %d attacking %s active %s" % [frame, str(tc.held("pass")), str(tc.buttons["pass"]["commit"]), mv.last_buttons, str(mv._attacking()), str(tc.active)])
	# the thumb on the stick: pushed `push` of the way
	var sv := _to_stick(want) * push if want != Vector2.ZERO else Vector2.ZERO
	if sv.length() > 0.01:
		if not stick_down:
			_touch(0, tc.stick_home, true)
			stick_down = true
		var r: float = TouchControls.STICK_R * tc.u
		_drag(0, tc.stick_origin + Vector2(sv.x, -sv.y) * r)
		stats["pushing"] += 1
		if ctl >= 0:
			# is he actually moving? (engine speed over the last frame of play)
			var o2: int = ctl * mv.stride
			var p := Vector2(mv.poses[o2], mv.poses[o2 + 1])
			if prev_p != Vector2.INF and p.distance_to(prev_p) * fps > 2.0:
				stats["moving"] += 1
			prev_p = p
	elif stick_down:
		_touch(0, tc.stick_origin, false)
		stick_down = false
	if sprint != sprint_down:
		_touch(5, tc.buttons["sprint"]["pos"], sprint)
		sprint_down = sprint
	# did the tap do its job?
	if watch.has("kind"):
		var ot := int(st["owner_team"])
		var op := int(st["owner_player"])
		var bv: Vector3 = st["ball_vel"]
		if watch["kind"] == "pass" and ot == 0 and op != watch["ctl"] and op >= 0:
			stats["passes"] += 1
			watch = {}
		elif watch["kind"] == "shot" and bv.length() > 12.0:
			stats["shots"] += 1
			watch = {}
		elif t > watch["until"]:
			watch = {}
	stats["frames"] += 1
	if OS.get_environment("REC") != "" and frame % int(OS.get_environment("REC_EVERY") if OS.get_environment("REC_EVERY") != "" else "15") == 0:
		get_root().get_texture().get_image().save_png(OS.get_environment("REC") + "/p%05d.png" % frame)
	if frame % int(fps * 5) == 0:
		print("t %.0f s  min %.1f  score %s  mode %d  ctl %d  owner %d/%d  stick %.2f  sprint %s" % [t, st["minute"], str(st["goals"]), st["mode"], ctl, st["owner_team"], st["owner_player"], tc.stick.length(), str(tc.held("sprint"))])
	if t >= secs:
		print("RESULT push %.1f: moving while pushing %.0f%% | PASS taps %d -> passes %d | SHOOT taps %d -> shots %d | had the ball %.0f%% of the time | longest wait at our set piece %.1f s" % [
			push, stats["moving"] * 100.0 / maxf(stats["pushing"], 1.0), stats["pass_taps"], stats["passes"], stats["shoot_taps"], stats["shots"], stats["own"] * 100.0 / maxf(stats["frames"], 1.0), longest_sp])
		return true
	return false
