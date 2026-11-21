class_name Showcase
extends SubViewportContainer
## A small live 3D scene for menu cards (transparent background): a gold trophy, the match ball, or a footballer in a
## club kit. Studio lighting: warm key, cool rim, a sky for reflections, and a slow turn.

var vp: SubViewport
var pivot: Node3D
var cam: Camera3D
var t := 0.0
var turn_speed := 0.35
var sway := 0.0
var base_yaw := 0.0


static func trophy(px: Vector2i) -> Showcase:
	var s := Showcase.new()
	s._stage(px, Vector3(0, 0.62, 2.9), Vector3(0, 0.55, 0), 30.0)
	s.pivot.add_child(_trophy_model())
	s.turn_speed = 0.45
	return s


static func ball(px: Vector2i) -> Showcase:
	var s := Showcase.new()
	s._stage(px, Vector3(0, 0.45, 3.1), Vector3(0, 0.0, 0), 22.0)
	var b := BallView.new()
	b.scale = Vector3.ONE * 3.2
	s.pivot.add_child(b)
	s.turn_speed = 0.9
	return s


static func footballer(kit: Dictionary, number: int, px: Vector2i, facing_deg: float = -24.0, seed_n: int = 7, clip: String = "idle") -> Showcase:
	var s := Showcase.new()
	s._stage(px, Vector3(0.0, 1.05, 4.1), Vector3(0.0, 0.92, 0.0), 30.0)
	var model: Node3D = PlayerView.PLAYER_SCENE.instantiate()
	s.pivot.add_child(model)
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_n
	PlayerView.dress(model, kit, number, false, rng)
	var ap := model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if ap:
		var c := clip if ap.has_animation(clip) else "idle"
		if ap.has_animation(c):
			ap.get_animation(c).loop_mode = Animation.LOOP_LINEAR
			ap.play(c)
	s.turn_speed = 0.0
	s.sway = 7.0
	s.base_yaw = facing_deg
	s.pivot.rotation_degrees.y = facing_deg
	return s


## A footballer performing a motion-capture clip (Mocap, CMU database) in place, looping.
static func mocap(kit: Dictionary, number: int, px: Vector2i, clip_name: String, facing_deg: float = -24.0, seed_n: int = 7) -> Showcase:
	var s := Showcase.new()
	s._stage(px, Vector3(0.0, 1.05, 4.4), Vector3(0.0, 0.92, 0.0), 30.0)
	var model: Node3D = PlayerView.PLAYER_SCENE.instantiate()
	s.pivot.add_child(model)
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_n
	PlayerView.dress(model, kit, number, false, rng)
	var ap := model.find_child("AnimationPlayer", true, false)
	if ap:
		ap.queue_free()
	s.mskel = model.find_children("*", "Skeleton3D", true, false)[0]
	s.mclip = Mocap.get_clip(clip_name)
	s.turn_speed = 0.0
	s.sway = 0.0
	s.pivot.rotation_degrees.y = facing_deg
	return s


var mskel: Skeleton3D
var mclip: Dictionary = {}


func _stage(px: Vector2i, cam_pos: Vector3, look: Vector3, fov: float) -> void:
	stretch = true
	custom_minimum_size = Vector2(px)
	size = Vector2(px)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	vp = SubViewport.new()
	vp.transparent_bg = true
	vp.own_world_3d = true
	vp.msaa_3d = Viewport.MSAA_2X
	vp.size = px
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(vp)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	var sky := Sky.new()
	var psm := ProceduralSkyMaterial.new()
	psm.sky_top_color = Color(0.12, 0.2, 0.42)
	psm.sky_horizon_color = Color(0.9, 0.75, 0.5)
	psm.ground_bottom_color = Color(0.05, 0.06, 0.1)
	psm.ground_horizon_color = Color(0.5, 0.45, 0.4)
	sky.sky_material = psm
	e.sky = sky
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.32, 0.38, 0.55)
	e.ambient_light_energy = 0.55
	e.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 1.05
	e.adjustment_enabled = true
	e.adjustment_contrast = 1.1
	e.adjustment_saturation = 1.1
	env.environment = e
	vp.add_child(env)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-28, -38, 0)
	key.light_energy = 2.1
	key.light_color = Color(1.0, 0.93, 0.84)
	vp.add_child(key)
	var rim := DirectionalLight3D.new()
	rim.rotation_degrees = Vector3(-12, 160, 0)
	rim.light_energy = 2.6
	rim.light_color = Color(0.45, 0.85, 1.0)
	vp.add_child(rim)
	var rim2 := DirectionalLight3D.new()
	rim2.rotation_degrees = Vector3(-20, -150, 0)
	rim2.light_energy = 1.4
	rim2.light_color = Color(0.85, 1.0, 0.45)
	vp.add_child(rim2)
	pivot = Node3D.new()
	vp.add_child(pivot)
	cam = Camera3D.new()
	cam.fov = fov
	vp.add_child(cam)
	cam.look_at_from_position(cam_pos, look, Vector3.UP)


static func _gold() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.76, 0.28)
	m.metallic = 0.85
	m.roughness = 0.22
	m.metallic_specular = 0.8
	return m


## A cup: dark plinth, gold ring, stem, bowl with a lip, two handles.
static func _trophy_model() -> Node3D:
	var root := Node3D.new()
	var gold := _gold()
	var dark := StandardMaterial3D.new()
	dark.albedo_color = Color(0.06, 0.07, 0.1)
	dark.roughness = 0.35
	var plinth := CSGCylinder3D.new()
	plinth.radius = 0.3
	plinth.height = 0.2
	plinth.sides = 40
	plinth.position.y = 0.1
	plinth.material = dark
	root.add_child(plinth)
	var ring := CSGCylinder3D.new()
	ring.radius = 0.24
	ring.height = 0.07
	ring.sides = 40
	ring.position.y = 0.235
	ring.material = gold
	root.add_child(ring)
	var stem := CSGCylinder3D.new()
	stem.radius = 0.05
	stem.height = 0.36
	stem.cone = false
	stem.sides = 24
	stem.position.y = 0.45
	stem.material = gold
	root.add_child(stem)
	var knot := CSGSphere3D.new()
	knot.radius = 0.085
	knot.radial_segments = 24
	knot.rings = 12
	knot.position.y = 0.48
	knot.material = gold
	root.add_child(knot)
	var bowl := CSGSphere3D.new()
	bowl.radius = 0.3
	bowl.radial_segments = 40
	bowl.rings = 20
	bowl.scale = Vector3(1, 0.95, 1)
	bowl.position.y = 0.86
	bowl.material = gold
	var hollow := CSGSphere3D.new()
	hollow.radius = 0.27
	hollow.radial_segments = 40
	hollow.rings = 20
	hollow.operation = CSGShape3D.OPERATION_SUBTRACTION
	bowl.add_child(hollow)
	var lid_cut := CSGBox3D.new()
	lid_cut.size = Vector3(1.0, 0.5, 1.0)
	lid_cut.position.y = 0.3
	lid_cut.operation = CSGShape3D.OPERATION_SUBTRACTION
	bowl.add_child(lid_cut)
	root.add_child(bowl)
	for side in [-1.0, 1.0]:
		var h := CSGTorus3D.new()
		h.inner_radius = 0.1
		h.outer_radius = 0.15
		h.sides = 24
		h.ring_sides = 10
		h.rotation_degrees = Vector3(90, 0, 0)
		h.position = Vector3(0.3 * side, 0.9, 0)
		h.material = gold
		root.add_child(h)
	return root


func _process(dt: float) -> void:
	t += dt
	if mskel and not mclip.is_empty():
		var pose := Mocap.sample(mclip, t, true)
		mskel.set_bone_pose_position(mskel.find_bone("player"), Vector3(0.0, pose["root"].y, 0.0))
		for b in pose["rot"]:
			mskel.set_bone_pose_rotation(mskel.find_bone(b), pose["rot"][b])
	if pivot:
		if turn_speed != 0.0:
			pivot.rotation.y += turn_speed * dt
		elif sway != 0.0:
			pivot.rotation_degrees.y = base_yaw + sin(t * 0.5) * sway
