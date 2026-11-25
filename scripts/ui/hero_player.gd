class_name HeroPlayer
extends SubViewportContainer
## A footballer in a club's kit, rendered live for the menus (FC-style card art): stadium key light, a cool rim light
## from behind, idle animation, transparent background so it sits on a card's gradient.

var vp: SubViewport
var model: Node3D
var cam: Camera3D
var t := 0.0
var spin := 0.0


func setup(kit: Dictionary, number: int, px: Vector2i, facing_deg: float = -24.0, seed_n: int = 7, full_body: bool = true) -> HeroPlayer:
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
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.32, 0.38, 0.55)
	e.ambient_light_energy = 0.55
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 1.05
	# Vulkan (2.46) lights in linear HDR: about half as bright as the OpenGL path this was tuned on
	if RenderingServer.get_current_rendering_method() != "gl_compatibility":
		e.tonemap_exposure *= 2.4
		e.ambient_light_energy *= 1.25
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
	rim2.light_color = Color(1.0, 0.82, 0.45)
	vp.add_child(rim2)
	model = PlayerView.PLAYER_SCENE.instantiate()
	vp.add_child(model)
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_n
	PlayerView.dress(model, kit, number, false, rng)
	model.rotation_degrees.y = facing_deg
	spin = facing_deg
	var ap := model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if ap and ap.has_animation("idle"):
		ap.get_animation("idle").loop_mode = Animation.LOOP_LINEAR
		ap.play("idle")
	cam = Camera3D.new()
	vp.add_child(cam)
	if full_body:
		cam.fov = 30.0
		cam.look_at_from_position(Vector3(0.0, 1.05, 4.1), Vector3(0.0, 0.92, 0.0), Vector3.UP)
	else:
		cam.fov = 28.0
		cam.look_at_from_position(Vector3(0.0, 1.45, 2.3), Vector3(0.0, 1.32, 0.0), Vector3.UP)
	return self


func _process(dt: float) -> void:
	# a slow breathing turn so the card feels alive
	t += dt
	if model:
		model.rotation_degrees.y = spin + sin(t * 0.5) * 7.0
