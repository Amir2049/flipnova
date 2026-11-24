class_name EngineMatchView
extends MatchView
## A match played by Google Research Football's engine (native, through the GFEngine extension). The engine runs
## the football - players, ball, AI, referee - at its own 100 Hz; this view draws it with AFC's players, pitch,
## lighting and camera, turns touch / pad input into the engine's stick and buttons, and adds what a football game
## needs around it: scoreboard, name and stamina over your man, radar, match facts, substitutions, half time,
## goal replays, set-piece cameras and the crowd.
## The opponent is the engine's own AI (Amateur, Pro, World Class) or TiZero, the strongest open football AI
## (Legendary, Ultimate), running on the phone (native/src/tizero.cpp).

const FRAME := 0.01
# GFEngine button bits (native/src/gf_api.h)
const B_SHORT := 1
const B_LONG := 2
const B_HIGH := 4
const B_SHOT := 8
const B_SPRINT := 16
const B_DRIBBLE := 32
const B_SLIDE := 64
const B_PRESS := 128
const B_TEAM_PRESS := 256
const B_SWITCH := 512
const MODE_NAMES := ["", "KICK OFF", "GOAL KICK", "FREE KICK", "CORNER", "THROW-IN", "PENALTY"]
var force_touch := false                 # tests: show and use the touch controls without a touchscreen
const STICK_DEAD := 0.18                 # touch / pad stick deadzone (the engine's own is 0.75, see _input_to_engine)
const ASSIST_RANGE := 12.0               # metres: loose-ball assist reach
const ASSIST_COS := 0.57                 # stick within ~55 degrees of the ball
const SETPIECE_HINTS := {
	1: "KICK OFF - press PASS",
	2: "GOAL KICK - PASS short, THROUGH / LOB long",
	3: "FREE KICK - PASS, LOB or SHOOT",
	4: "CORNER - LOB to cross, PASS short",
	5: "THROW-IN - aim and press PASS",
	6: "PENALTY - aim and SHOOT",
}
const LEVELS := ["AMATEUR", "PRO", "WORLD CLASS", "LEGENDARY", "ULTIMATE"]
const AWAY_DIFF := [0.3, 0.6, 0.95, 1.0, 1.0]   # the engine's AI level (Legendary / Ultimate fall back to it without TiZero)
const BRAIN_TEMP := [0.0, 0.0, 0.0, 0.5, 0.0]   # TiZero: 0 = its best move every time
const MAX_SUBS := 5
const REC_EVERY := 2                     # physics ticks between frames kept for replays
const REC_FRAMES := 220                  # about 7 seconds
const GOAL_X := 54.4
const CELE_LEN := 6.0                    # seconds of goal celebration before the replay
# the celebration setting (shared with the classic match) -> motion-captured clip
const CELE_FOR := {"fist": "cele_happy", "arms": "cele_very_happy", "knee_slide": "cele_very_happy", "leap": "cele_jump",
	"spin": "cele_cartwheel", "flip": "cele_backflip", "salute": "cele_jacks"}

var engine = null              # GFEngine
var pviews: Array = []         # EnginePlayerView x 22 (0..10 home, 11..21 away)
var ball_proxy := BallPhysics.new()
var pitch := Pitch.new()
var acc := 0.0
var st := {}
var poses := PackedFloat32Array()
var stride := 66
var match_seconds := 480.0
var last_goals := Vector2i.ZERO
var roster := []                  # [team][engine index] -> squad player
var bench := [[], []]             # who can still come on
var subs_used := [0, 0]
var scorers := []                 # [{team, name, minute}]
var stats := EngineStats.new()
var level := 1
var brain := false                # TiZero is playing the other side
var cele_t := 0.0                 # seconds of goal celebration left
var cele_focus := -1              # the scorer (camera target)
var cele_angle := 0.0
var cele_fov := 22.0
var last_mode := -1
var full_time := false
var half_done := false
var reader: InputReader
var ui: CanvasLayer
var score_lbl: Label
var clock_lbl: Label
var level_lbl: Label
var banner_lbl: Label
var banner_t := 0.0
var hint_lbl: Label
var name_lbl: Label
var stamina_bar: Control
var stamina_v := 1.0
var radar: Control
var pause_root: Control
var result_root: Control
var held_was := {}
var test_input := Callable()     # tests: returns [stick in pitch axes (Godot x, z), engine buttons]
var last_buttons := 0            # what went to the engine last (tests)
var menus := true                # tests: false = no half-time stop
# replays
var rec: Array = []               # [poses, ball, ball_vel] every REC_EVERY physics ticks
var rec_tick := 0
var replay_buf: Array = []
var replay_cut := -1.0            # seconds until the goal's replay is cut from the recording
var replay_t := -1.0              # >= 0 while a replay plays
var replay_root: Control
var last_speed := 0.0
var crowd_v := 0.35
var cpu_sub_minutes := [58.0, 69.0, 79.0]


static func available() -> bool:
	return ClassDB.class_exists("GFEngine")


static func data_dir() -> String:
	return OS.get_user_data_dir() + "/gfdata"


## The library is loaded AND every data file it reads is on disk. Starting the engine without its data crashes
## the app the moment PLAY is pressed, so matches use the built-in engine (MatchView) when this is false.
static func can_play() -> bool:
	return available() and GFData.prepare(data_dir())


## Why the engine is missing (from Godot's log: the extension or dlopen error), for the screen.
static func load_error() -> String:
	if available():
		return "" if GFData.prepare(data_dir()) else "its data could not be unpacked (storage full?)"
	var note: String = load("res://scripts/boot.gd").native_note
	var f := FileAccess.open("user://logs/godot.log", FileAccess.READ)
	if f == null:
		return "native library not loaded"
	var found := ""
	while not f.eof_reached():
		var line := f.get_line()
		if "afcgf" in line or "GDExtension" in line or "dynamic library" in line or "dlopen" in line:
			found = line.strip_edges()
	# the log line (the real reason) first, then what the start-up guard decided
	if found != "":
		return found + ("   (" + note + ")" if note != "" else "")
	return note if note != "" else "native library not loaded"


## TiZero's weights as a real file (the native code reads files; inside the APK res:// is not one).
static func brain_file() -> String:
	var src := "res://assets/tizero.bin"
	if not FileAccess.file_exists(src):
		return ""
	var dst := "user://tizero.bin"
	var data := FileAccess.get_file_as_bytes(src)
	var have := FileAccess.get_file_as_bytes(dst) if FileAccess.file_exists(dst) else PackedByteArray()
	if have.size() != data.size():
		var f := FileAccess.open(dst, FileAccess.WRITE)
		if f == null:
			return ""
		f.store_buffer(data)
		f.close()
	return ProjectSettings.globalize_path(dst)


## AFC formation slots ([depth 0..1, width -1..1, role]) as the engine's line-up: x -1..1 from the own goal,
## y -0.42..0.42 (negative = the left side), and gfootball's player roles.
static func formation_entries(form: String) -> PackedFloat32Array:
	var slots: Array = GameData.FORMATIONS.get(form, GameData.FORMATIONS["4-3-3"])
	var out := PackedFloat32Array()
	for s in slots:
		var depth: float = s[0]
		var width: float = s[1]
		var role: String = s[2]
		var r := 0
		var x := -1.0
		var y := 0.0
		if role != "GK":
			x = -0.5 + depth * 0.5
			y = width * 0.24
			match role:
				"DEF":
					r = 2 if width < -0.6 else (3 if width > 0.6 else 1)
				"MID":
					if depth < 0.35:
						r = 4
					elif width < -0.6:
						r = 6
					elif width > 0.6:
						r = 7
					elif depth >= 0.6:
						r = 8
					else:
						r = 5
				_:
					r = 6 if width < -0.6 else (7 if width > 0.6 else 9)
		out.append_array([x, y, r])
	return out


static func level_of(difficulty: float) -> int:
	var best := 0
	for i in SettingsPanel.DIFF_VALUES.size():
		if absf(SettingsPanel.DIFF_VALUES[i] - difficulty) < absf(SettingsPanel.DIFF_VALUES[best] - difficulty):
			best = i
	return best


func start(config: Dictionary) -> void:
	cfg = config
	opts = config.get("opts", {})
	human_team = 0 if int(config.get("human_team", 0)) >= 0 else -1
	var tod: String = opts.get("time_of_day", "auto")
	night = tod == "night" or (tod == "auto" and randf() < 0.3)
	rain = false
	_environment()
	# the engine's pitch: 110 x 72 m
	pitch.length = 110.0
	pitch.width = 72.0
	pitch_view = PitchView.new()
	pitch_view.quality = int(opts.get("quality", 1))
	add_child(pitch_view)
	pitch_view.build(pitch)
	var home: int = config.get("home", 0)
	var away: int = config.get("away", 1)
	var edits: Dictionary = config.get("edits", {})
	var away_kit := _kit_clash(GameData.CLUBS[home]["kit"], GameData.CLUBS[away]["kit"])
	team_defs = [GameData.team_def(home, GameData.club_formation(home, edits), false, edits),
		GameData.team_def(away, GameData.club_formation(away, edits), away_kit, edits)]
	appeared = [[], []]               # names of everyone who played, for the career
	level = clampi(int(config.get("level", level_of(float(config.get("difficulty", 0.5))))), 0, LEVELS.size() - 1)
	for t in 2:
		# the line-up in formation order: the engine plays the same shape
		roster.append((team_defs[t]["players"] as Array).duplicate())
		while roster[t].size() < 11:
			roster[t].append({"name": "Player %d" % (roster[t].size() + 1), "number": roster[t].size() + 1, "pos": "MID"})
		bench[t] = (team_defs[t].get("bench", []) as Array).duplicate()
		for p in roster[t]:
			appeared[t].append(str(p.get("name", "")))
	for i in 22:
		var t := i / 11
		var td: Dictionary = team_defs[t]
		var pl: Dictionary = roster[t][i % 11]
		var num: int = int(pl.get("number", i % 11 + 1))
		var v := EnginePlayerView.new()
		add_child(v)
		var gk := i % 11 == 0
		v.setup(td["gk"] if gk else td["kit"], num, gk, absi(hash(str(td["name"]) + str(i))) % 100000)
		pviews.append(v)
	ball_view = BallView.new()
	add_child(ball_view)
	cam = CameraRig.new()
	add_child(cam)
	cam.setup(pitch)
	cam.mode = config.get("camera", "broadcast")
	_markers()
	_ui()
	sfx = Sfx.new()
	add_child(sfx)
	sfx.set_volumes(opts.get("volume", 0.8), opts.get("crowd", 0.7), opts.get("effects", 0.9))
	sfx.crowd(crowd_v)
	_quality(int(opts.get("quality", 1)))
	reader = InputReader.new()
	reader.pad = config.get("pad", {}) if not config.get("pad", {}).is_empty() else Profile.PAD_PRESETS["PES"].duplicate()
	# the engine
	var dir := data_dir()
	if not GFData.prepare(dir):
		push_error("EngineMatchView: the engine's data is not ready in " + dir)
	engine = ClassDB.instantiate("GFEngine")
	match_seconds = float(config.get("half_minutes", 4.0)) * 120.0
	# The engine scales every stat of a side by 0.3 + 0.7 * difficulty (Player::GetStat), its AI too. The human's
	# side used to be fixed at 0.95, so on Legendary and Ultimate (1.0) the CPU was ~3.6 % better at everything and the
	# player's team-mates reacted slower: the human's side now plays at full level (a watched match: both alike).
	var eo := {"human": 1 if human_team >= 0 else 0, "difficulty_home": 1.0 if human_team >= 0 else AWAY_DIFF[level],
		"difficulty_away": AWAY_DIFF[level],
		"seed": int(config.get("seed", randi() % 100000)), "match_seconds": match_seconds, "offsides": opts.get("offside", true),
		"home_formation": formation_entries(team_defs[0]["formation"]),
		"away_formation": formation_entries(team_defs[1]["formation"])}
	if level >= 3:
		var bp := brain_file()
		if bp != "":
			eo["brain"] = 1
			eo["brain_path"] = bp
			eo["brain_temperature"] = BRAIN_TEMP[level]
	engine.start(dir, eo)
	stride = engine.stride()
	_pull()
	brain = bool(st.get("brain", false))
	level_lbl.text = LEVELS[level] + ("  ·  TiZero AI" if brain else "")
	if is_inside_tree():
		_first_frame()
	else:
		ready.connect(_first_frame, CONNECT_ONE_SHOT)


func _first_frame() -> void:
	_update_views(0.0)
	cam.follow(ball_proxy, Vector2.ZERO, 1.0, true)
	sfx.whistle(1)
	_banner("%s  v  %s" % [team_defs[0]["name"], team_defs[1]["name"]], 2.6)


# ------------------------------------------------------------------ input -> engine

func _input_to_engine() -> void:
	if human_team < 0:
		return
	if test_input.is_valid():
		# a scripted player: [direction on the pitch (Godot x, z; any length up to 1), buttons], same deadzone and assist
		var r: Array = test_input.call()
		var tw: Vector2 = r[0]
		tw = _steady(_ball_assist(tw.normalized())) if tw.length() > STICK_DEAD else _steady(Vector2.ZERO)
		engine.set_input(tw.x, -tw.y, _carry_buttons(int(r[1])))
		return
	var stick := Vector2.ZERO
	if touch and touch.active:
		stick = touch.stick
	var dev := Pad.device()
	if dev >= 0 and Pad.confirmed():
		var ls := Vector2(Input.get_joy_axis(dev, JOY_AXIS_LEFT_X), -Input.get_joy_axis(dev, JOY_AXIS_LEFT_Y))
		if ls.length() > 0.2:
			stick = ls.limit_length(1.0)
	var kx := float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT)) - float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT))
	var ky := float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP)) - float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN))
	if kx != 0.0 or ky != 0.0:
		stick = Vector2(kx, ky).normalized()
	# the engine ignores a stick shorter than 0.75 (its deadzone), and speed comes from the buttons (walk / sprint /
	# close control), so any push past a small deadzone is sent as a full-length direction
	var w := Vector2.ZERO
	if stick.length() > STICK_DEAD:
		w = _ball_assist(cam.screen_to_world(stick.normalized()).normalized())
	w = _steady(w)
	var atk := _attacking()
	if touch:
		touch.set_defending(not atk)
	var b := 0
	var on := func(n: String, pad_name: String) -> bool:
		return (touch != null and touch.active and touch.held(n)) or reader._pad(pad_name)
	if atk:
		# a flick up off PASS / THROUGH lofts it (FC Mobile)
		if on.call("pass", "pass"): b |= B_HIGH if _flick("pass") else B_SHORT
		if on.call("shoot", "shoot"): b |= B_SHOT
		if on.call("through", "through"): b |= B_HIGH if _flick("through") else B_LONG
		if on.call("lob", "lob"): b |= B_HIGH
		if reader._pad("close"): b |= B_DRIBBLE
		if Input.is_physical_key_pressed(KEY_K): b |= B_SHORT
		if Input.is_physical_key_pressed(KEY_L): b |= B_SHOT
		if Input.is_physical_key_pressed(KEY_I): b |= B_LONG
		if Input.is_physical_key_pressed(KEY_J): b |= B_HIGH
	else:
		if on.call("pass", "d_press"): b |= B_PRESS
		if on.call("shoot", "d_slide"): b |= B_SLIDE
		if on.call("through", "d_switch"): b |= B_SWITCH
		if on.call("lob", "d_tackle"): b |= B_TEAM_PRESS
		if Input.is_physical_key_pressed(KEY_K): b |= B_PRESS
		if Input.is_physical_key_pressed(KEY_L): b |= B_SLIDE
		if Input.is_physical_key_pressed(KEY_Q): b |= B_SWITCH
	var sprint: bool = on.call("sprint", "sprint") or (touch != null and touch.active and touch.stick.length() > 0.97 and opts.get("edge_sprint", false)) or Input.is_physical_key_pressed(KEY_SHIFT)
	if sprint:
		b |= B_SPRINT
	elif stick.length() > STICK_DEAD and stick.length() < 0.6:
		b |= B_DRIBBLE   # the stick pushed part way: a controlled jog (3.5 m/s) instead of the 5 m/s run
	# pitch axes: Godot (x, z) -> engine (x, -z)
	last_buttons = _carry_buttons(b)
	engine.set_input(w.x, -w.y, last_buttons)


func _flick(n: String) -> bool:
	return touch != null and touch.active and touch.variant(n) == "up"


## A steady stick: the direction snaps to the nearest of 8 and stays there until the thumb is clearly in another
## sector, so a wobbling thumb does not make the player weave.
var steady_on := true
var steady_sector := -1
const STEADY_KEEP := 0.5236

func _steady(w: Vector2) -> Vector2:
	if w.length() < 0.01:
		steady_sector = -1
		return Vector2.ZERO
	if not steady_on:
		return w
	var a := w.angle()
	if steady_sector >= 0 and absf(angle_difference(a, steady_sector * PI / 4.0)) < STEADY_KEEP:
		return Vector2.from_angle(steady_sector * PI / 4.0)
	steady_sector = posmod(int(roundf(a / (PI / 4.0))), 8)
	return Vector2.from_angle(steady_sector * PI / 4.0)


## Close control while carrying the ball without sprinting: small touches, the ball stays at his feet.
var close_carry := true

func _carry_buttons(b: int) -> int:
	if close_carry and not st.is_empty() and int(st["owner_team"]) == 0 and int(st["owner_player"]) == int(st["controlled"]) \
			and (b & B_SPRINT) == 0:
		b |= B_DRIBBLE
	return b


## Going for a loose ball (or the man who has it): when the stick points roughly at the ball, run straight at
## where it will be, so he gets onto it instead of running past or around it.
func _ball_assist(w: Vector2) -> Vector2:
	if st.is_empty():
		return w
	var ctl: int = st["controlled"]
	if ctl < 0 or int(st["owner_team"]) == 0 or int(st["mode"]) != 0:
		return w
	var o := ctl * stride
	var me := Vector2(poses[o], -poses[o + 1])
	var b: Vector3 = st["ball"]
	var bv: Vector3 = st["ball_vel"]
	var ball := Vector2(b.x, -b.y)
	var d := me.distance_to(ball)
	if d > ASSIST_RANGE or d < 0.4:
		return w
	var aim := ball + Vector2(bv.x, -bv.y) * clampf(d / 7.0, 0.0, 1.0)
	var to := (aim - me).normalized()
	if w.dot(to) > ASSIST_COS:
		return to
	return w


func _attacking() -> bool:
	if st.is_empty():
		return true
	var tk: int = st.get("taker", -1)
	if tk >= 0:
		return tk < 11
	var ot: int = st["owner_team"]
	if ot >= 0:
		return ot == 0
	return true


# ------------------------------------------------------------------ the loop

func _physics_process(dt: float) -> void:
	if engine == null or paused or full_time or replay_t >= 0.0:
		return
	_input_to_engine()
	acc += dt * SettingsPanel.game_speed(opts)
	var n := int(acc / FRAME)
	if n > 0:
		acc -= n * FRAME
		engine.frames(mini(n, 6))
		_pull()
		stats.feed(st, n * FRAME)
		_record()
		_sounds()
		_cpu_subs()
	if reader._pad("pause") and not held_was.get("pause", false):
		set_paused(true)
	held_was["pause"] = reader._pad("pause")


func _pull() -> void:
	st = engine.state()
	poses = engine.poses()


func _record() -> void:
	rec_tick += 1
	if rec_tick % REC_EVERY != 0:
		return
	rec.append([poses, st["ball"], st["ball_vel"]])
	if rec.size() > REC_FRAMES:
		rec.pop_front()


func _process(dt: float) -> void:
	if engine == null or st.is_empty():
		return
	if replay_t >= 0.0:
		_replay_step(dt)
		return
	_update_views(dt)
	if not paused and not full_time:
		var ctl: int = st["controlled"]
		var extra := Vector2.ZERO
		if ctl >= 0 and ctl < 11:
			extra = Vector2(poses[ctl * stride], -poses[ctl * stride + 1])
		if cele_t > 0.0:
			# the celebration: a TV close-up that slowly circles the scorer, then the replay
			cele_t -= dt
			if cele_focus >= 0:
				cam.external = true
				var c: Vector3 = pviews[cele_focus].position + Vector3(0, 1.0, 0)
				var a := cele_angle + (CELE_LEN - cele_t) * 0.25
				cam.fov = 36.0
				cam.look_at_from_position(c + Vector3(sin(a) * 7.0, 1.6, cos(a) * 7.0), c, Vector3.UP)
			if cele_t <= 0.0:
				cam.external = false
				cam.fov = cele_fov
				cam.follow(ball_proxy, extra, 1.0, true)
				if not replay_buf.is_empty() and opts.get("replays", true):
					_start_replay()
					return
		cam.follow(ball_proxy, extra, dt)
		_set_piece_camera(dt)
	if replay_cut >= 0.0:
		replay_cut -= dt
		if replay_cut < 0.0:
			replay_buf = rec.duplicate()
	_update_hud(dt)


## Corners, penalties and free kicks near goal get their own camera (behind the taker, above the flag).
func _set_piece_camera(dt: float) -> void:
	if cele_t > 0.0:
		return
	var mode: int = st["mode"]
	var tk: int = st.get("taker", -1)
	var kind := ""
	var gx := GOAL_X
	if tk >= 0 and mode >= 3:
		gx = GOAL_X if tk < 11 else -GOAL_X
		var b := ball_proxy.pos
		if mode == 6:
			kind = "penalty"
		elif mode == 4:
			kind = "corner"
		elif mode == 3 and absf(gx - b.x) < 32.0:
			kind = "free_kick"
	cam.set_piece(kind, ball_proxy.pos, gx, dt)


## A goal: the scorer runs into a motion-captured celebration (backflip, cartwheel, jump...), the nearest team-mates
## join in, and the nearest of the other side drop their heads.
func _celebrate(team: int, scorer: int) -> void:
	if Mocap.clips().is_empty():
		return
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var at: Vector3 = pviews[scorer].position if scorer >= 0 else ball_proxy.pos
	if scorer >= 0:
		var own := scorer / 11 != team
		var pick: Array = Mocap.DOWN if own else Mocap.CELEBRATIONS
		var name: String = pick[rng.randi() % pick.size()]
		# your own scorer does the celebration picked in the settings
		var mine: String = CELE_FOR.get(str(opts.get("celebration", "random")), "")
		if not own and scorer / 11 == human_team and mine != "":
			name = mine
		pviews[scorer].play_clip(Mocap.get_clip(name), 0.15, CELE_LEN - 0.3)
	var mates := []
	var others := []
	for i in 22:
		if i == scorer:
			continue
		var d: float = pviews[i].position.distance_to(at)
		if i / 11 == team and d < 24.0:
			mates.append([d, i])
		elif i / 11 != team and d < 28.0:
			others.append([d, i])
	mates.sort()
	others.sort()
	for k in mini(3, mates.size()):
		pviews[mates[k][1]].play_clip(Mocap.get_clip(Mocap.JOIN_IN[rng.randi() % Mocap.JOIN_IN.size()]), 0.5 + k * 0.35)
	for k in mini(3, others.size()):
		pviews[others[k][1]].play_clip(Mocap.get_clip(Mocap.DOWN[rng.randi() % Mocap.DOWN.size()]), 0.7 + k * 0.4, 3.8)
	if cele_t <= 0.0:
		cele_fov = cam.fov
	cele_t = CELE_LEN
	cele_focus = scorer
	# start the close-up from the side the TV camera is on, a little in front of him
	cele_angle = 0.6 if rng.randf() < 0.5 else -0.6


func _update_views(dt: float) -> void:
	_draw_frame(poses, st["ball"], st["ball_vel"], dt)
	# the human's player: ring under him
	var ctl: int = st["controlled"]
	if ring and ctl >= 0 and human_team >= 0:
		ring.visible = true
		var o := ctl * stride
		ring.position = Vector3(poses[o], 0.02, -poses[o + 1])
		marker.visible = true
		marker.position = ring.position + Vector3(0, 2.35, 0)
	elif ring:
		ring.visible = false
		marker.visible = false
	if next_marker:
		next_marker.visible = false


func _draw_frame(p: PackedFloat32Array, b: Vector3, bv: Vector3, dt: float) -> void:
	for i in 22:
		pviews[i].apply(p, i * stride, dt)
	ball_proxy.pos = Vector3(b.x, b.z, -b.y)
	ball_proxy.vel = Vector3(bv.x, bv.z, -bv.y)
	ball_view.update_view(ball_proxy, dt)


# ------------------------------------------------------------------ sound

func _sounds() -> void:
	var bv: Vector3 = st["ball_vel"]
	var sp := bv.length()
	if sp - last_speed > 5.0 and float((st["ball"] as Vector3).z) < 1.6:
		sfx.kick(sp)
	elif last_speed - sp > 4.0 and sp < 3.0:
		sfx.touch()
	last_speed = sp
	# the crowd rises as the ball nears a goal
	var b: Vector3 = st["ball"]
	var near := clampf((absf(b.x) - 30.0) / 22.0, 0.0, 1.0)
	var want := 0.3 + 0.35 * near
	crowd_v = lerpf(crowd_v, want, 0.02)
	sfx.crowd(crowd_v)


# ------------------------------------------------------------------ substitutions

## Bring bench player k on for team t's player i (fresh legs in the engine, new face and number on the pitch).
func substitute(t: int, i: int, k: int) -> void:
	if k < 0 or k >= bench[t].size() or subs_used[t] >= MAX_SUBS:
		return
	var incoming: Dictionary = bench[t][k]
	var outgoing: Dictionary = roster[t][i]
	roster[t][i] = incoming
	bench[t].remove_at(k)
	subs_used[t] += 1
	appeared[t].append(str(incoming.get("name", "")))
	engine.substitute(t, i)
	var td: Dictionary = team_defs[t]
	var gk := i == 0
	pviews[t * 11 + i].redress(td["gk"] if gk else td["kit"], int(incoming.get("number", 12)), gk,
		absi(hash(str(incoming.get("name", "")))) % 100000)
	_banner("SUB  %s  ▶  %s" % [str(outgoing.get("name", "")), str(incoming.get("name", ""))], 2.4)


## The side the computer plays changes its most tired players after the hour.
func _cpu_subs() -> void:
	var minute: float = st["minute"]
	for t in 2:
		if t == human_team or bench[t].is_empty() or subs_used[t] >= 3:
			continue
		if subs_used[t] >= cpu_sub_minutes.size() or minute < cpu_sub_minutes[subs_used[t]]:
			continue
		if int(st["mode"]) == 0:
			continue   # at a stoppage, like a real match
		var worst := -1
		var wt := 0.3
		for i in range(1, 11):
			var tired := poses[(t * 11 + i) * stride + 7]
			if tired > wt:
				wt = tired
				worst = i
		if worst < 0:
			continue
		var want: String = str(roster[t][worst].get("pos", "MID"))
		var pick := -1
		for k in bench[t].size():
			var pos: String = str(bench[t][k].get("pos", ""))
			if pos == "GK":
				continue
			if pick < 0 or pos == want:
				pick = k
				if pos == want:
					break
		if pick >= 0:
			substitute(t, worst, pick)


# ------------------------------------------------------------------ replays

func _start_replay() -> void:
	replay_t = 0.0
	for v in pviews:
		v.clip = {}
	touch.release_all()
	touch.active = false
	touch.visible = false
	name_lbl.visible = false
	stamina_bar.visible = false
	hint_lbl.visible = false
	replay_root = Control.new()
	replay_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	replay_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(replay_root)
	var tag := UI.label("  REPLAY  ", 26, UI.INK)
	var sb := StyleBoxFlat.new()
	sb.bg_color = UI.ACCENT
	sb.set_corner_radius_all(4)
	tag.add_theme_stylebox_override("normal", sb)
	tag.position = Vector2(24, 96)
	replay_root.add_child(tag)
	var skip := UI.button("SKIP  ▶", func(): _end_replay(), Vector2(150, 56), "normal", 20)
	skip.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	skip.position = Vector2(-180, -90)
	replay_root.add_child(skip)


func _replay_step(dt: float) -> void:
	replay_t += dt
	var idx := int(replay_t * 60.0 / REC_EVERY)
	if idx >= replay_buf.size():
		_end_replay()
		return
	var fr: Array = replay_buf[idx]
	_draw_frame(fr[0], fr[1], fr[2], dt)
	ring.visible = false
	marker.visible = false
	cam.external = false
	cam.follow_replay(ball_proxy, dt, idx == 0, 0.0)


func _end_replay() -> void:
	if replay_t < 0.0:
		return
	replay_t = -1.0
	replay_buf = []
	if replay_root:
		replay_root.queue_free()
		replay_root = null
	cam.fov = cele_fov
	_update_views(0.0)
	cam.follow(ball_proxy, Vector2.ZERO, 1.0, true)


# ------------------------------------------------------------------ HUD

func _ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	# broadcast vignette: corners a little darker, eyes go to the middle of the pitch
	var vig := ColorRect.new()
	vig.set_anchors_preset(Control.PRESET_FULL_RECT)
	vig.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var vm := ShaderMaterial.new()
	var vs := Shader.new()
	vs.code = "shader_type canvas_item;\nvoid fragment() {\n\tvec2 q = UV - 0.5;\n\tq.x *= 1.7;\n\tCOLOR = vec4(0.0, 0.0, 0.02, smoothstep(0.42, 1.0, length(q)) * 0.38);\n}\n"
	vm.shader = vs
	vig.material = vm
	root.add_child(vig)
	# scoreboard: club colours, score in a volt box, the clock
	var board := PanelContainer.new()
	board.position = Vector2(16, 12)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.05, 0.1, 0.86)
	sb.set_corner_radius_all(6)
	sb.content_margin_left = 10
	sb.content_margin_right = 14
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	board.add_theme_stylebox_override("panel", sb)
	board.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(board)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	board.add_child(row)
	row.add_child(UI.chip(KitPainter.hex(team_defs[0]["kit"]["shirt"]), 6, 30))
	score_lbl = Label.new()
	score_lbl.add_theme_font_size_override("font_size", 26)
	row.add_child(score_lbl)
	row.add_child(UI.chip(KitPainter.hex(team_defs[1]["kit"]["shirt"]), 6, 30))
	clock_lbl = Label.new()
	clock_lbl.add_theme_font_size_override("font_size", 26)
	clock_lbl.add_theme_color_override("font_color", UI.ACCENT)
	row.add_child(clock_lbl)
	level_lbl = UI.label("", 14, Color(1, 1, 1, 0.6))
	level_lbl.position = Vector2(20, 60)
	root.add_child(level_lbl)
	banner_lbl = Label.new()
	banner_lbl.set_anchors_preset(Control.PRESET_CENTER_TOP)
	banner_lbl.position = Vector2(-400, 90)
	banner_lbl.size = Vector2(800, 60)
	banner_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner_lbl.add_theme_font_size_override("font_size", 40)
	banner_lbl.add_theme_color_override("font_outline_color", Color(0, 0, 0))
	banner_lbl.add_theme_constant_override("outline_size", 8)
	banner_lbl.visible = false
	root.add_child(banner_lbl)
	hint_lbl = Label.new()
	hint_lbl.text = "PASS / LOB / SHOOT to take it"
	hint_lbl.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	hint_lbl.position = Vector2(-260, -150)
	hint_lbl.size = Vector2(520, 40)
	hint_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_lbl.add_theme_font_size_override("font_size", 24)
	hint_lbl.add_theme_color_override("font_outline_color", Color(0, 0, 0))
	hint_lbl.add_theme_constant_override("outline_size", 6)
	hint_lbl.visible = false
	root.add_child(hint_lbl)
	# your man: name and stamina over his head
	name_lbl = Label.new()
	name_lbl.add_theme_font_size_override("font_size", 17)
	name_lbl.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	name_lbl.add_theme_constant_override("outline_size", 5)
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.size = Vector2(200, 24)
	name_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(name_lbl)
	stamina_bar = Control.new()
	stamina_bar.size = Vector2(54, 5)
	stamina_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stamina_bar.draw.connect(func():
		stamina_bar.draw_rect(Rect2(Vector2.ZERO, stamina_bar.size), Color(0, 0, 0, 0.55))
		var c := UI.ACCENT if stamina_v > 0.5 else (UI.FLARE if stamina_v > 0.25 else UI.BAD)
		stamina_bar.draw_rect(Rect2(Vector2(1, 1), Vector2((stamina_bar.size.x - 2) * stamina_v, stamina_bar.size.y - 2)), c))
	root.add_child(stamina_bar)
	# radar
	radar = Control.new()
	radar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	radar.size = Vector2(198, 128)
	radar.position = Vector2(-99, -140)
	radar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	radar.draw.connect(_draw_radar)
	radar.visible = opts.get("radar", true)
	root.add_child(radar)
	var pause_btn := Button.new()
	pause_btn.text = "II"
	pause_btn.custom_minimum_size = Vector2(64, 50)
	pause_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	pause_btn.position = Vector2(-80, 12)
	pause_btn.pressed.connect(func(): set_paused(true))
	root.add_child(pause_btn)
	touch = TouchControls.new()
	root.add_child(touch)
	touch.configure(opts)
	touch.labels_defend["lob"] = "TEAM PRESS"
	touch.visible = DisplayServer.is_touchscreen_available() or OS.has_feature("mobile") or force_touch
	# which match engine is running, so any screenshot tells
	var tag := Label.new()
	tag.text = "v%s  ENGINE" % str(ProjectSettings.get_setting("application/config/version", ""))
	tag.add_theme_font_size_override("font_size", 12)
	tag.add_theme_color_override("font_color", Color(1, 1, 1, 0.35))
	tag.position = Vector2(20, 80)
	root.add_child(tag)


func _draw_radar() -> void:
	if st.is_empty() or poses.is_empty():
		return
	var s := radar.size
	radar.draw_rect(Rect2(Vector2.ZERO, s), Color(0.02, 0.06, 0.03, 0.55))
	radar.draw_rect(Rect2(Vector2.ZERO, s), Color(1, 1, 1, 0.35), false, 1.5)
	radar.draw_line(Vector2(s.x * 0.5, 0), Vector2(s.x * 0.5, s.y), Color(1, 1, 1, 0.25), 1.0)
	radar.draw_rect(Rect2(Vector2(0, s.y * 0.3), Vector2(s.x * 0.12, s.y * 0.4)), Color(1, 1, 1, 0.25), false, 1.0)
	radar.draw_rect(Rect2(Vector2(s.x * 0.88, s.y * 0.3), Vector2(s.x * 0.12, s.y * 0.4)), Color(1, 1, 1, 0.25), false, 1.0)
	var to := func(x: float, y: float) -> Vector2:
		return Vector2((x / 110.0 + 0.5) * s.x, (0.5 - y / 72.0) * s.y)
	var cols := [KitPainter.hex(team_defs[0]["kit"]["shirt"]), KitPainter.hex(team_defs[1]["kit"]["shirt"])]
	var ctl: int = st["controlled"]
	for i in 22:
		var o := i * stride
		if poses[o + 9] < 0.5:
			continue
		var c: Color = cols[i / 11]
		var pt: Vector2 = to.call(poses[o], poses[o + 1])
		radar.draw_circle(pt, 3.6, Color(0, 0, 0, 0.7))
		radar.draw_circle(pt, 2.8, c)
		if i == ctl and human_team >= 0:
			radar.draw_arc(pt, 6.0, 0, TAU, 16, UI.CYAN, 1.5)
	var b: Vector3 = st["ball"]
	radar.draw_circle(to.call(b.x, b.y), 2.6, Color(1, 1, 1))


func _update_hud(dt: float) -> void:
	var g: Vector2i = st["goals"]
	score_lbl.text = "%s  %d - %d  %s" % [team_defs[0]["short"], g.x, g.y, team_defs[1]["short"]]
	var minute: float = st["minute"]
	clock_lbl.text = "%02d:%02d" % [int(minute), int(fmod(minute * 60.0, 60.0))]
	if g != last_goals:
		var t := 0 if g.x > last_goals.x else 1
		last_goals = g
		var who := "Own goal"
		var sc: int = st.get("scorer", -1)
		var own: bool = st.get("own_goal", false)
		if sc >= 0 and not own:
			who = str(roster[sc / 11][sc % 11].get("name", ""))
		stats.goal(t, sc, own)
		scorers.append({"team": t, "name": who, "minute": int(st["minute"]) + 1})
		_celebrate(t, sc)
		_banner("GOAL!  " + (who if who != "Own goal" else str(team_defs[t]["name"])), 3.0)
		if sfx.has_method("goal"):
			sfx.goal()
		sfx.roar(1.0)
		cam.shake(0.4)
		replay_cut = 1.0   # keep a second after the ball goes in, then cut the replay
	var mode: int = st["mode"]
	var ctl: int = st["controlled"]
	# our set piece and our man is the taker: the engine waits for the human to pass, cross or shoot
	var waiting: bool = human_team >= 0 and mode > 1 and ctl >= 0 and int(st.get("taker", -1)) == ctl
	if waiting:
		hint_lbl.text = SETPIECE_HINTS.get(mode, "Press PASS to restart")
	hint_lbl.visible = waiting
	if mode != last_mode:
		if mode > 0 and mode < MODE_NAMES.size() and mode != 1:
			_banner(MODE_NAMES[mode], 1.4)
		last_mode = mode
	if banner_t > 0.0:
		banner_t -= dt
		banner_lbl.visible = banner_t > 0.0
	var touch_ok := (DisplayServer.is_touchscreen_available() or OS.has_feature("mobile") or force_touch) and not paused and not full_time and human_team >= 0
	touch.active = touch_ok
	touch.visible = touch_ok and touch.should_show()
	# name and stamina over your man
	var show_tag: bool = ctl >= 0 and human_team >= 0 and opts.get("names", true) and cele_t <= 0.0
	name_lbl.visible = show_tag
	stamina_bar.visible = show_tag
	if show_tag:
		var head: Vector3 = pviews[ctl].position + Vector3(0, 2.75, 0)
		if cam.is_position_behind(head):
			name_lbl.visible = false
			stamina_bar.visible = false
		else:
			var sp := cam.unproject_position(head)
			var pl: Dictionary = roster[0][ctl]
			name_lbl.text = "%d  %s" % [int(pl.get("number", ctl + 1)), str(pl.get("name", "")).to_upper()]
			name_lbl.position = sp - Vector2(100, 34)
			stamina_v = clampf(1.0 - poses[ctl * stride + 7], 0.0, 1.0)
			stamina_bar.position = sp - Vector2(27, 8)
			stamina_bar.queue_redraw()
	if radar.visible:
		radar.queue_redraw()
	# half time: the engine restarts for the second half at 45:00 - stop there for the team talk
	if not half_done and minute >= 45.0 and minute < 60.0 and (not bool(st["in_play"]) or mode == 1):
		half_done = true
		if menus:
			_half_time()
		else:
			_banner("HALF TIME", 2.0)
	if not full_time and minute >= 90.0 and (not bool(st["in_play"]) or minute >= 93.0):
		_full_time()


func _banner(text: String, t: float) -> void:
	banner_lbl.text = text
	banner_lbl.visible = true
	banner_t = t


# ------------------------------------------------------------------ menus: pause, half time, full time

func set_paused(p: bool, _page: String = "") -> void:
	if p == paused or full_time:
		return
	paused = p
	if p:
		touch.release_all()
		touch.active = false
		_pause_menu()
	elif pause_root:
		pause_root.queue_free()
		pause_root = null


func _close_overlay() -> void:
	if pause_root:
		pause_root.queue_free()
		pause_root = null


func _overlay(title: String, w: float = 820.0, h: float = 600.0) -> VBoxContainer:
	_close_overlay()
	banner_lbl.visible = false
	banner_t = 0.0
	var o := UI.overlay(w, h)
	pause_root = o[0]
	ui.add_child(pause_root)
	var vb := UI.vbox(12)
	(o[1] as PanelContainer).add_child(vb)
	var head := UI.hbox(14)
	head.add_child(UI.label(title, 30, UI.ACCENT))
	head.add_child(UI.spacer(0, 0, true))
	var g: Vector2i = st.get("goals", Vector2i.ZERO)
	head.add_child(UI.label("%s  %d - %d  %s" % [team_defs[0]["short"], g.x, g.y, team_defs[1]["short"]], 24))
	vb.add_child(head)
	return vb


func _pause_menu() -> void:
	var vb := _overlay("PAUSED")
	var row := UI.hbox(24)
	vb.add_child(row)
	var col := UI.vbox(10)
	col.custom_minimum_size = Vector2(300, 0)
	row.add_child(col)
	col.add_child(UI.button("RESUME", func(): set_paused(false), Vector2(300, 60), "accent", 24))
	col.add_child(UI.button("MATCH FACTS", func(): _facts_page(_pause_menu), Vector2(300, 56)))
	if human_team >= 0:
		col.add_child(UI.button("SUBSTITUTIONS", func(): _subs_page(_pause_menu), Vector2(300, 56)))
	col.add_child(UI.button("CAMERA:  " + CameraRig.NAMES.get(cam.mode, cam.mode), func():
		cam.cycle()
		_pause_menu(), Vector2(300, 56)))
	if not cfg.get("competition", false):
		col.add_child(UI.button("RESTART", func(): finished.emit({"restart": true}), Vector2(300, 56)))
	col.add_child(UI.button("QUIT", func(): quit_to_menu.emit(), Vector2(300, 56)))
	row.add_child(_facts_table(true))


func _facts_table(compact: bool = false) -> Control:
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 22)
	grid.add_theme_constant_override("v_separation", 6 if compact else 9)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var fs := 18 if compact else 21
	var cell := func(text: String, align: int, col: Color) -> Label:
		var l := UI.label(text, fs, col)
		l.horizontal_alignment = align
		l.custom_minimum_size = Vector2(90 if align != HORIZONTAL_ALIGNMENT_CENTER else 170, 0)
		return l
	grid.add_child(cell.call(str(team_defs[0]["short"]), HORIZONTAL_ALIGNMENT_RIGHT, UI.ACCENT))
	grid.add_child(cell.call("", HORIZONTAL_ALIGNMENT_CENTER, UI.MUTED))
	grid.add_child(cell.call(str(team_defs[1]["short"]), HORIZONTAL_ALIGNMENT_LEFT, UI.CYAN))
	for r in stats.rows():
		grid.add_child(cell.call(r[1], HORIZONTAL_ALIGNMENT_RIGHT, Color(1, 1, 1)))
		grid.add_child(cell.call(r[0], HORIZONTAL_ALIGNMENT_CENTER, UI.MUTED))
		grid.add_child(cell.call(r[2], HORIZONTAL_ALIGNMENT_LEFT, Color(1, 1, 1)))
	return grid


func _facts_page(back: Callable) -> void:
	var vb := _overlay("MATCH FACTS")
	vb.add_child(_facts_table())
	vb.add_child(UI.spacer(0, 0, true))
	vb.add_child(UI.button("BACK", back, Vector2(220, 56)))


var sub_out := -1

func _subs_page(back: Callable) -> void:
	var t := human_team
	var vb := _overlay("SUBSTITUTIONS", 900, 620)
	vb.add_child(UI.label("%d of %d left.  Pick a player on the pitch, then who comes on." % [MAX_SUBS - subs_used[t], MAX_SUBS], 17, UI.MUTED))
	var row := UI.hbox(24)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(row)
	var left := UI.vbox(4)
	left.custom_minimum_size = Vector2(420, 0)
	var right := UI.vbox(4)
	right.custom_minimum_size = Vector2(380, 0)
	row.add_child(UI.scroll(left))
	row.add_child(UI.scroll(right))
	left.add_child(UI.caption("ON THE PITCH"))
	for i in 11:
		var p: Dictionary = roster[t][i]
		var line := UI.hbox(10)
		var tired: float = poses[(t * 11 + i) * stride + 7] if poses.size() > 0 else 0.0
		var b := UI.button("%2d  %s  %s" % [int(p.get("number", 0)), str(p.get("pos", "")), str(p.get("name", ""))], func():
			sub_out = i
			_subs_page(back), Vector2(300, 42), "accent" if sub_out == i else "normal", 17)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		line.add_child(b)
		var bar := UI.bar(1.0 - tired, 80, 8)
		bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		line.add_child(bar)
		left.add_child(line)
	right.add_child(UI.caption("BENCH"))
	for k in bench[t].size():
		var p: Dictionary = bench[t][k]
		var ok: bool = sub_out >= 0 and subs_used[t] < MAX_SUBS and ((sub_out == 0) == (str(p.get("pos", "")) == "GK"))
		var b := UI.button("%2d  %s  %s" % [int(p.get("number", 0)), str(p.get("pos", "")), str(p.get("name", ""))], func():
			if sub_out >= 0:
				substitute(t, sub_out, k)
				sub_out = -1
				_subs_page(back), Vector2(340, 42), "normal", 17)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.disabled = not ok
		right.add_child(b)
	vb.add_child(UI.button("DONE", func():
		sub_out = -1
		back.call(), Vector2(220, 56), "accent"))


func _half_time() -> void:
	sfx.whistle(2)
	paused = true
	touch.release_all()
	touch.active = false
	_half_menu()


func _half_menu() -> void:
	var vb := _overlay("HALF TIME")
	vb.add_child(_facts_table(true))
	var row := UI.hbox(16)
	row.add_child(UI.button("SECOND HALF  ▶", func():
		paused = false
		_close_overlay(), Vector2(280, 60), "accent", 22))
	if human_team >= 0:
		row.add_child(UI.button("SUBSTITUTIONS", func(): _subs_page(_half_menu), Vector2(260, 60)))
	vb.add_child(row)


func _full_time() -> void:
	full_time = true
	sfx.whistle(3)
	var g: Vector2i = st["goals"]
	# winners celebrate, losers drop their heads (mocap); a draw: nothing
	if g.x != g.y and not Mocap.clips().is_empty():
		var win := 0 if g.x > g.y else 1
		for i in 22:
			var pick: Array = Mocap.JOIN_IN if i / 11 == win else Mocap.DOWN
			pviews[i].play_clip(Mocap.get_clip(pick[(i * 7) % pick.size()]), randf() * 0.8, 6.0)
	var r := {"score": [g.x, g.y], "home": cfg.get("home", 0), "away": cfg.get("away", 1), "scorers": scorers.duplicate(),
		"appeared": appeared.duplicate(true)}
	_close_overlay()
	var vb := _overlay("FULL TIME", 900, 620)
	var row := UI.hbox(30)
	vb.add_child(row)
	row.add_child(_facts_table(true))
	# ratings: the best three, and the man of the match
	var rated := []
	for i in 22:
		var p: Dictionary = roster[i / 11][i % 11]
		rated.append([stats.rating(i, g, str(p.get("pos", "MID"))), i])
	rated.sort()
	rated.reverse()
	var best := UI.vbox(6)
	best.add_child(UI.caption("PLAYER RATINGS"))
	for k in mini(5, rated.size()):
		var i: int = rated[k][1]
		var p: Dictionary = roster[i / 11][i % 11]
		var l := UI.label("%.1f   %s  (%s)%s" % [rated[k][0], str(p.get("name", "")), str(team_defs[i / 11]["short"]),
			"   ★ MAN OF THE MATCH" if k == 0 else ""], 18, UI.ACCENT if k == 0 else Color(1, 1, 1))
		best.add_child(l)
	row.add_child(best)
	vb.add_child(UI.spacer(0, 0, true))
	var buttons := UI.hbox(16)
	buttons.add_child(UI.button("CONTINUE", func(): finished.emit(r), Vector2(240, 60), "accent", 22))
	if not cfg.get("competition", false):
		buttons.add_child(UI.button("PLAY AGAIN", func(): finished.emit({"restart": true}), Vector2(240, 60)))
	vb.add_child(buttons)
	result_root = pause_root
