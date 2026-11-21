class_name MatchView
extends Node3D
## A match on screen: world, players, ball, camera, HUD, controls, sound, replays and the practice modes.
## Runs the simulation at 60 Hz.

signal finished(result: Dictionary)
signal quit_to_menu

var sim: MatchSim
var pitch_view: PitchView
var ball_view: BallView
var cam: CameraRig
var views: Array[PlayerView] = []
var hud: Hud
var touch: TouchControls
var input: InputReader
var sfx: Sfx
var sun: DirectionalLight3D
var marker: MeshInstance3D
var ring: MeshInstance3D
var next_marker: MeshInstance3D
var paused := false
var cfg := {}
var opts := {}
var human_team := 0
var team_defs: Array = []
var replay := Replay.new()
var replay_done_for := 0      # goals_log size the last replay was shown for
var challenge: Challenge
var ended := false
var last_offside := -10.0
var replay_angle := 0.0
var appeared: Array = [[], []]
var rain := false
var night := false
var rain_fx: CPUParticles3D
var intro := false
var intro_t := 0.0


func start(config: Dictionary) -> void:
	cfg = config
	opts = config.get("opts", {})
	human_team = config.get("human_team", 0)
	var w: String = opts.get("weather", "auto")
	rain = w == "rain" or (w == "auto" and randf() < 0.2 and config.get("mode", "match") == "match")
	var sc: Dictionary = config.get("scenario", {})
	if not sc.is_empty():
		rain = sc.get("rain", false)
	var tod: String = opts.get("time_of_day", "auto")
	night = tod == "night" or (tod == "auto" and randf() < 0.35)
	if not config.get("scenario", {}).is_empty():
		night = config["scenario"].get("night", false)
	_environment()
	sim = MatchSim.new()
	var home: int = config.get("home", 0)
	var away: int = config.get("away", 1)
	var edits: Dictionary = config.get("edits", {})
	var fh: String = config.get("formation_home", GameData.club_formation(home, edits))
	var fa: String = config.get("formation_away", GameData.club_formation(away, edits))
	var away_kit := _kit_clash(GameData.CLUBS[home]["kit"], GameData.CLUBS[away]["kit"])
	var street: bool = config.get("street", false)
	var a := GameData.street_def(home, false, edits) if street else GameData.team_def(home, fh, false, edits)
	var b := GameData.street_def(away, away_kit, edits) if street else GameData.team_def(away, fa, away_kit, edits)
	team_defs = [a, b]
	if street:
		sim.setup([a, b], [GameData.STREET_FORMATION, GameData.STREET_FORMATION], human_team, "5v5")
		sim.pitch.walls = true
	else:
		sim.setup([a, b], [GameData.FORMATIONS[a["formation"]], GameData.FORMATIONS[b["formation"]]], human_team)
	appeared = [[], []]
	for p in sim.players:
		appeared[p.team].append(p.name)
	sim.half_seconds = config.get("half_minutes", 4.0) * 60.0
	sim.difficulty = config.get("difficulty", 0.5)
	sim.mode = config.get("mode", "match")
	sim.wait_halftime = human_team >= 0 and sim.mode == "match"
	sim.offside_on = opts.get("offside", true) and not street
	sim.apply_style(opts.get("style", "competitive"), {"sprint": opts.get("sl_sprint", 1.0), "accel": opts.get("sl_accel", 1.0),
		"pass_speed": opts.get("sl_pass", 1.0), "shot_error": opts.get("sl_shot_error", 1.0), "grip": 0.88 if rain else 1.0})
	pitch_view = PitchView.new()
	pitch_view.quality = int(opts.get("quality", 1))
	add_child(pitch_view)
	pitch_view.build(sim.pitch)
	pitch_view.set_wet(1.0 if rain else 0.0)
	BallPhysics.surface = 0.8 if rain else 1.0
	if rain:
		_rain()
	for p in sim.players:
		var v := PlayerView.new()
		add_child(v)
		var td: Dictionary = team_defs[p.team]
		v.setup(p, td["kit"], td["gk"], _look_seed(p))
		views.append(v)
	ball_view = BallView.new()
	add_child(ball_view)
	cam = CameraRig.new()
	add_child(cam)
	cam.setup(sim.pitch)
	cam.mode = config.get("camera", "broadcast")
	_markers()
	hud = Hud.new()
	add_child(hud)
	hud.setup(self)
	touch = hud.touch
	touch.configure(opts)
	input = InputReader.new()
	input.setup(sim, cam, touch, config.get("pad", {}), opts)
	sfx = Sfx.new()
	add_child(sfx)
	sfx.set_volumes(opts.get("volume", 0.8), opts.get("crowd", 0.7), opts.get("effects", 0.9))
	sfx.crowd(0.35)
	_quality(int(opts.get("quality", 1)))
	if sim.mode != "match":
		challenge = Challenge.new()
		challenge.setup(self)
	cam.follow(sim.ball, Vector2.ZERO, 1.0, true)
	if not sc.is_empty():
		sim.start_scenario(sc)
		for p in sim.players:
			if p.sent_off:
				views[p.id].visible = false
		hud.banner("%s  ·  %s" % [sc["title"], Scenarios.STAR_TEXT[sc["stars"][1]]], 3.5)
	if sim.mode == "match" and human_team >= 0 and not config.get("no_intro", false):
		intro = true
		hud.show_lineups()


func end_intro() -> void:
	intro = false
	cam.follow(sim.ball, Vector2.ZERO, 1.0, true)
	sfx.whistle(1)


func _look_seed(p: PlayerSim) -> int:
	return absi(hash(p.name)) % 100000 + p.team * 7


func _rain() -> void:
	rain_fx = CPUParticles3D.new()
	rain_fx.amount = 1400
	rain_fx.lifetime = 0.7
	rain_fx.preprocess = 0.7
	rain_fx.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	rain_fx.emission_box_extents = Vector3(30, 1, 22)
	rain_fx.direction = Vector3(0.1, -1, 0.05)
	rain_fx.spread = 4.0
	rain_fx.gravity = Vector3(0, -30, 0)
	rain_fx.initial_velocity_min = 18.0
	rain_fx.initial_velocity_max = 22.0
	var streak := BoxMesh.new()
	streak.size = Vector3(0.015, 0.55, 0.015)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.8, 0.85, 0.95, 0.35)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	streak.material = mat
	rain_fx.mesh = streak
	rain_fx.local_coords = false
	add_child(rain_fx)


func _kit_clash(k1: Dictionary, k2: Dictionary) -> bool:
	var c1 := KitPainter.hex(k1["shirt"])
	var c2 := KitPainter.hex(k2["shirt"])
	return Vector3(c1.r - c2.r, c1.g - c2.g, c1.b - c2.b).length() < 0.45


func _environment() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var psm := ProceduralSkyMaterial.new()
	psm.sky_top_color = Color(0.3, 0.47, 0.72)
	psm.sky_horizon_color = Color(0.76, 0.8, 0.85)
	psm.ground_horizon_color = Color(0.5, 0.55, 0.6)
	if night:
		psm.sky_top_color = Color(0.01, 0.015, 0.04)
		psm.sky_horizon_color = Color(0.06, 0.07, 0.12)
		psm.ground_horizon_color = Color(0.03, 0.03, 0.05)
	elif rain:
		psm.sky_top_color = Color(0.35, 0.38, 0.42)
		psm.sky_horizon_color = Color(0.55, 0.57, 0.6)
	sky.sky_material = psm
	e.sky = sky
	e.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	e.ambient_light_sky_contribution = 0.5
	e.ambient_light_color = Color(0.55, 0.6, 0.7)
	e.ambient_light_energy = 0.42 if not night else 0.35
	# broadcast look: filmic curve, slightly lower saturation, a touch more contrast, haze over the far stands
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 0.86
	e.tonemap_white = 6.0
	e.adjustment_enabled = true
	e.adjustment_saturation = 1.05
	e.adjustment_contrast = 1.12
	e.fog_enabled = not night
	e.fog_mode = Environment.FOG_MODE_EXPONENTIAL
	e.fog_density = 0.0016
	e.fog_light_color = Color(0.74, 0.78, 0.84)
	e.fog_sky_affect = 0.0
	e.glow_enabled = true
	e.glow_intensity = 0.2
	env.environment = e
	add_child(env)
	sun = DirectionalLight3D.new()
	# late afternoon: lower, warmer sun, longer shadows
	sun.rotation_degrees = Vector3(-38, -32, 0)
	sun.light_energy = 1.75
	sun.light_color = Color(1.0, 0.93, 0.82)
	if night:
		# the floodlights: steep, white, a little cool
		sun.rotation_degrees = Vector3(-72, 20, 0)
		sun.light_energy = 1.15
		sun.light_color = Color(0.95, 0.97, 1.0)
		e.glow_intensity = 0.6
		e.glow_bloom = 0.15
	elif rain:
		sun.light_energy = 0.8
		e.ambient_light_energy = 0.9
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 120.0
	sun.shadow_blur = 0.5
	sun.shadow_opacity = 1.0
	add_child(sun)
	# a soft light from the other side so the players read as round shapes, not flat cut-outs
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-25, 145, 0)
	fill.light_energy = 0.22
	fill.light_color = Color(0.75, 0.85, 1.0)
	fill.shadow_enabled = false
	add_child(fill)


## 0 low (no shadows, lower resolution), 1 medium, 2 high (MSAA 4x)
func _quality(q: int) -> void:
	var vp := get_viewport()
	sun.shadow_enabled = q >= 1
	sun.directional_shadow_max_distance = 80.0 if q == 1 else 120.0
	if vp:
		vp.scaling_3d_scale = 0.75 if q == 0 else 1.0
		# MSAA only on High (some mobile GPUs struggle with multisampled targets)
		vp.msaa_3d = Viewport.MSAA_2X if q == 2 else Viewport.MSAA_DISABLED


func apply_options(o: Dictionary) -> void:
	opts = o
	touch.configure(o)
	input.edge_sprint = o.get("edge_sprint", true)
	input.swipe_skills = o.get("swipe_skills", true)
	input.celebration = o.get("celebration", "random")
	sfx.set_volumes(o.get("volume", 0.8), o.get("crowd", 0.7), o.get("effects", 0.9))
	_quality(int(o.get("quality", 1)))
	hud.apply_options(o)


func _markers() -> void:
	var mm := StandardMaterial3D.new()
	mm.albedo_color = Color(0.18, 0.55, 1.0)
	mm.emission_enabled = true
	mm.emission = Color(0.1, 0.35, 0.9)
	mm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	marker = _cone(0.22, 0.38, mm)
	ring = MeshInstance3D.new()
	var tm := TorusMesh.new()
	tm.inner_radius = 0.5
	tm.outer_radius = 0.62
	ring.mesh = tm
	ring.scale = Vector3(1, 0.05, 1)
	ring.material_override = mm
	ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(ring)
	var wm := StandardMaterial3D.new()
	wm.albedo_color = Color(1, 1, 1, 0.85)
	wm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	wm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	next_marker = _cone(0.16, 0.28, wm)


func _cone(r: float, h: float, mat: Material) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.0
	cm.bottom_radius = r
	cm.height = h
	cm.radial_segments = 3
	mi.mesh = cm
	mi.rotation_degrees = Vector3(180, 0, 0)
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	return mi


var speed_acc := 0.0

func _physics_process(dt: float) -> void:
	if sim == null or paused or intro:
		return
	# game speed below 1: some physics ticks pass without a simulation step
	speed_acc += SettingsPanel.game_speed(opts)
	if speed_acc < 1.0:
		return
	speed_acc -= 1.0
	input.tick(sim.DT)
	if input.pause_pressed:
		set_paused(true)
		return
	if input.camera_pressed:
		hud.toast("Camera: " + CameraRig.NAMES.get(cam.cycle(), ""))
	if replay.playing:
		replay.t += sim.DT * 0.6
		if replay.t >= replay.t_end or _any_button():
			replay.stop(sim)
			hud.show_replay(false)
		else:
			replay.apply(sim)
		return
	if human_team >= 0:
		sim.teams[human_team]["ai"].call_presser = input.team_press
	sim.step()
	replay.record(sim, sim.DT)
	if challenge:
		challenge.step(sim.DT)
	_handle_events()
	# replay of the goal once the celebration has had its moment
	if sim.phase == "goal" and sim.phase_t > 3.8 and replay_done_for != sim.goals_log.size() and opts.get("replays", true) and sim.mode == "match":
		replay_done_for = sim.goals_log.size()
		var gt: float = sim.goals_log.back().get("t", sim.time - sim.phase_t)
		if replay.can_play(gt - 5.0):
			replay.start(sim, gt - 4.5, gt + 1.0)
			cam.follow_replay(sim.ball, 0.0, true)
			hud.show_replay(true)


func _any_button() -> bool:
	if touch and touch.visible:
		for n in touch.buttons:
			if touch.held(n):
				return true
	var dev := Pad.device()
	for b in [JOY_BUTTON_A, JOY_BUTTON_B, JOY_BUTTON_X, JOY_BUTTON_Y]:
		if dev >= 0 and Input.is_joy_button_pressed(dev, b):
			return true
	return Input.is_physical_key_pressed(KEY_SPACE) or Input.is_physical_key_pressed(KEY_K)


func _process(dt: float) -> void:
	if sim == null:
		return
	var ctl := -1
	if not sim.humans.is_empty():
		ctl = sim.humans[0]["pid"]
	var t_view := replay.t if replay.playing else sim.time
	for v in views:
		v.visible = not sim.parked.has(v.sim.id)
		if v.visible:
			v.update_view(t_view, sim.owner == v.sim.id)
	ball_view.update_view(sim.ball, dt if not paused else 0.0)
	pitch_view.update_crowd(dt, sim.ball.pos.x)
	if rain_fx:
		rain_fx.global_position = cam.focus + Vector3(0, 16, 0)
	if intro:
		# before kick-off: a slow sweep around the stadium while the team sheets are up
		intro_t += dt
		var a := 0.9 + intro_t * 0.1
		cam.fov = 45.0
		cam.look_at_from_position(Vector3(cos(a) * 62.0, 22.0 + 6.0 * sin(intro_t * 0.3), sin(a) * 46.0), Vector3(0, 2, 0), Vector3.UP)
		marker.visible = false
		ring.visible = false
		next_marker.visible = false
		hud.update_hud(dt)
		return
	if replay.playing:
		var into := (replay.t - replay.t_start) / maxf(replay.t_end - replay.t_start, 0.1)
		var behind := 0.0
		if into > 0.5:
			behind = signf(sim.ball.pos.x) if absf(sim.ball.pos.x) > 1.0 else 1.0
		if behind != replay_angle:
			replay_angle = behind
			cam.follow_replay(sim.ball, dt, true, behind)
		cam.follow_replay(sim.ball, dt, false, behind)
		marker.visible = false
		ring.visible = false
		next_marker.visible = false
		hud.update_hud(dt)
		return
	var extra := Vector2.ZERO
	if ctl >= 0:
		extra = sim.players[ctl].pos
	if sim.phase == "goal" and not sim.goals_log.is_empty():
		var sc: int = sim.goals_log.back()["pid"]
		if sc >= 0:
			var sp := sim.players[sc].pos
			cam.override_target = Vector3(sp.x, 0, sp.y)
	else:
		cam.override_target = null
	cam.lead_dir = sim.attack_dir(sim.possession_team) if sim.possession_team >= 0 and sim.phase == "play" else 0.0
	cam.follow(sim.ball, extra, dt)
	# set-piece cameras
	var spk := ""
	if sim.phase == "restart" and sim.mode == "match":
		var k: String = sim.restart.get("kind", "")
		var sp: Vector2 = sim.restart.get("spot", Vector2.ZERO)
		var gx := sim.goal_x(sim.restart.get("team", 0))
		if k == "penalty" or k == "corner" or k == "goal_kick" or (k == "free_kick" and absf(gx - sp.x) < 35.0):
			spk = k
		cam.set_piece(spk, sim.ball.pos, gx if k != "goal_kick" else -gx, dt, spk != "" and cam.sp_blend == 0.0 and sim.phase_t < 0.1)
	else:
		cam.set_piece("", sim.ball.pos, 0.0, dt)
	if ctl >= 0 and sim.phase != "goal":
		var p := sim.players[ctl]
		marker.visible = true
		ring.visible = true
		marker.position = Vector3(p.pos.x, 2.25 + sin(Time.get_ticks_msec() / 160.0) * 0.05, p.pos.y)
		ring.position = Vector3(p.pos.x, 0.02, p.pos.y)
		# white arrow: who a switch would go to (when defending)
		var nx := sim.next_switch_target(0) if not input.attacking() and sim.phase == "play" else -1
		next_marker.visible = nx >= 0
		if nx >= 0:
			var q := sim.players[nx]
			next_marker.position = Vector3(q.pos.x, 2.2, q.pos.y)
	else:
		marker.visible = false
		ring.visible = false
		next_marker.visible = false
	hud.update_hud(dt)


func _handle_events() -> void:
	for e in sim.events:
		match e["type"]:
			"kick":
				sfx.kick(e["speed"])
			"touch":
				sfx.touch()
			"goal":
				if e.get("practice", false):
					sfx.roar(0.6)
					if challenge:
						challenge.on_goal()
						hud.toast("GOAL!")
					continue
				if not sim.goals_log.is_empty():
					sim.goals_log.back()["t"] = sim.time
				sfx.roar(1.0)
				sfx.whistle(1)
				cam.shake(0.8)
				hud.goal(e)
				pitch_view.set_excitement(1.0)
			"save":
				sfx.roar(0.5)
				if e.get("catch", false):
					hud.toast("Great save!" if randf() < 0.5 else "Safe hands")
			"foul":
				sfx.whistle(1)
				hud.banner("FOUL", 1.5)
			"offside":
				last_offside = sim.time
				hud.banner("OFFSIDE", 1.8)
			"low_shot":
				if sim.players[e["pid"]].human >= 0:
					hud.toast("Low driven")
			"dead":
				sfx.whistle(1)
				var names := {"throw_in": "THROW-IN", "corner": "CORNER", "goal_kick": "GOAL KICK", "free_kick": "FREE KICK", "penalty": "PENALTY"}
				if sim.time - last_offside > 0.2:
					hud.banner(names.get(e["kind"], ""), 1.6)
			"fade_out":
				hud.fade(true)
			"restart":
				hud.fade(false)
				cam.follow(sim.ball, Vector2.ZERO, 0.0, true)
			"kickoff_ready":
				pitch_view.set_excitement(0.2)
				hud.fade(false)
				cam.follow(sim.ball, Vector2.ZERO, 0.0, true)
			"whistle":
				sfx.whistle(1)
			"halftime":
				sfx.whistle(2)
				if sim.wait_halftime:
					hud.show_halftime()
				else:
					hud.banner("HALF TIME", 2.5)
			"second_half":
				hud.banner("SECOND HALF", 1.5)
				hud.fade(false)
			"fulltime":
				sfx.whistle(3)
				if not ended:
					ended = true
					hud.show_result()
			"skill":
				var sp := sim.players[e["pid"]]
				if sp.human >= 0 or sp.team == human_team:
					hud.toast(Skills.info(e["id"]).get("name", ""))
				if challenge:
					challenge.on_skill(e)
			"celebration":
				pass
			"card":
				var cp := sim.players[e["pid"]]
				if e["color"] == "red":
					sfx.roar(0.4)
					hud.banner("RED CARD  ·  %s" % cp.short_name if e.get("why", "") != "second_yellow" else "SECOND YELLOW  ·  %s OFF" % cp.short_name, 2.6)
					views[e["pid"]].visible = false
				else:
					hud.banner("YELLOW CARD  ·  %s" % cp.short_name, 2.0)
			"surge":
				sfx.roar(0.7)
				pitch_view.set_excitement(0.9)
				hud.banner("%s  MOMENTUM!" % sim.teams[e["team"]]["short"], 2.0)
			"sub":
				appeared[e["team"]].append(sim.players[e["pid"]].name)
				var v := views[e["pid"]]
				var td: Dictionary = team_defs[e["team"]]
				v.restyle(td["kit"], td["gk"], _look_seed(sim.players[e["pid"]]))
				hud.toast("%s on for %s" % [e["on"], e["off"]])
			"practice_reset", "practice_out":
				if challenge:
					challenge.on_event(e)
	sim.events.clear()


## Stoppage: the ball is dead and our side can make changes.
func is_stoppage() -> bool:
	return sim.phase in ["dead", "kickoff", "restart", "halftime"] and sim.mode == "match"


func set_paused(p: bool, page: String = "") -> void:
	paused = p
	if touch:
		touch.release_all()
	hud.show_pause(p, page)


func result() -> Dictionary:
	return {"score": [sim.teams[0]["score"], sim.teams[1]["score"]], "goals": sim.goals_log.duplicate(true), "appeared": appeared.duplicate(true),
		"stats": sim.stats.duplicate(true), "home": cfg.get("home", 0), "away": cfg.get("away", 1),
		"scorers": sim.goals_log.map(func(g): return {"team": g["team"], "name": sim.players[g["pid"]].name if g["pid"] >= 0 else "Own goal", "minute": g["minute"]})}
