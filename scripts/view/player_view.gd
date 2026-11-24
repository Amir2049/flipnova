class_name PlayerView
extends Node3D
## One footballer on screen: the skinned model with the club kit, locomotion clips blended by speed and the
## one-shot clips (kicks, traps, tackles, keeper saves, celebrations) the simulation asks for.

const PLAYER_SCENE := preload("res://assets/player.glb")
const KIT_NORMAL := preload("res://assets/kit_normal.png")
## Blender-baked shading of the kit (folds, armpits, hems) times a knit pattern, in the kit UV layout
## (tools/blender/bake_player_ao.py + make_kit_shade.py); multiplied over the painted kit
const KIT_SHADE_PATH := "res://assets/kit_shade.png"
static var kit_shade: Texture2D
const SKIN_TONES := [Color8(241, 201, 165), Color8(217, 164, 122), Color8(176, 122, 79), Color8(125, 81, 53), Color8(90, 58, 38)]
const HAIR := [Color8(27, 22, 18), Color8(59, 39, 22), Color8(107, 74, 43), Color8(181, 138, 82), Color8(138, 59, 29)]
const BOOTS := [Color8(17, 17, 17), Color8(242, 242, 242), Color8(198, 255, 61), Color8(255, 106, 43), Color8(45, 108, 223)]
const LOOP_SPEED := PlayerSim.LOOP_SPEED   # root speed of each locomotion loop (m/s)

var sim: PlayerSim
var model: Node3D
var ap: AnimationPlayer
var loco := ""
var oneshot := ""
var oneshot_t0 := 0.0
var height := 1.0
var base_rot := Vector3.ZERO
var last_t := -1.0
var last_face := Vector2(1, 0)
var last_speed := 0.0
var lean := 0.0
var tilt := 0.0
var blob: MeshInstance3D
static var blob_mat: ShaderMaterial

const BLOB_SHADER := """
shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, cull_disabled, shadows_disabled;
void fragment() {
	float d = length((UV - 0.5) * 2.0);
	ALBEDO = vec3(0.0);
	ALPHA = (1.0 - smoothstep(0.15, 1.0, d)) * 0.42;
}
"""


func setup(p: PlayerSim, kit: Dictionary, gk_kit: Dictionary, seed: int) -> void:
	sim = p
	var rng := RandomNumberGenerator.new()
	rng.seed = seed
	model = PLAYER_SCENE.instantiate()
	add_child(model)
	# contact shadow: the dark patch right under the feet that the sun's shadow alone does not give
	if blob == null:
		if blob_mat == null:
			blob_mat = ShaderMaterial.new()
			var sh := Shader.new()
			sh.code = BLOB_SHADER
			blob_mat.shader = sh
		blob = MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(0.9, 1.1)
		blob.mesh = q
		blob.material_override = blob_mat
		blob.rotation_degrees = Vector3(-90, 0, 0)
		blob.position = Vector3(0, 0.012, 0)
		blob.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(blob)
	base_rot = model.rotation
	height = rng.randf_range(0.99, 1.07)   # the body is 1.77 m: 1.75 to 1.90 m players
	model.scale = Vector3.ONE * height
	ap = model.find_child("AnimationPlayer", true, false)
	_loop_clips(ap)
	PlayerView.dress(model, gk_kit if p.role == "GK" else kit, p.number, p.role == "GK", rng)
	_play_loco("idle", 0.0, 1.0)
	ap.seek(rng.randf() * 0.4, true)


## Kit, skin, boots and hair on a player model (shared by the engine-driven players).
static func dress(model: Node3D, k: Dictionary, number: int, is_gk: bool, rng: RandomNumberGenerator) -> void:
	var kit_mat := StandardMaterial3D.new()
	kit_mat.albedo_texture = KitPainter.paint(k, number)
	kit_mat.roughness = 0.8
	# the painted kit was lit up to pastel (red read as pink) under the bright sun: a cloth-like albedo keeps colours deep
	kit_mat.albedo_color = Color(0.8, 0.8, 0.8)
	kit_mat.metallic_specular = 0.25
	var skin := StandardMaterial3D.new()
	skin.albedo_color = SKIN_TONES[rng.randi() % SKIN_TONES.size()]
	skin.vertex_color_use_as_albedo = true   # brows, lips and eyelids are vertex colours on the skin
	skin.roughness = 0.55
	var boots := StandardMaterial3D.new()
	boots.albedo_color = BOOTS[rng.randi() % (2 if is_gk else BOOTS.size())]
	boots.roughness = 0.45
	var sole := StandardMaterial3D.new()
	sole.albedo_color = Color(0.9, 0.9, 0.9)
	var hair := StandardMaterial3D.new()
	hair.albedo_color = HAIR[rng.randi() % HAIR.size()]
	hair.roughness = 0.85
	# cloth folds on the kit
	kit_mat.normal_enabled = true
	kit_mat.normal_texture = KIT_NORMAL
	if kit_shade == null and ResourceLoader.exists(KIT_SHADE_PATH):
		kit_shade = load(KIT_SHADE_PATH)
	if kit_shade:
		kit_mat.detail_enabled = true
		kit_mat.detail_blend_mode = BaseMaterial3D.BLEND_MODE_MUL
		kit_mat.detail_uv_layout = BaseMaterial3D.DETAIL_UV_1
		kit_mat.detail_albedo = kit_shade
	kit_mat.normal_scale = 0.5
	var hair_meshes: Array[MeshInstance3D] = []
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		if m.name.begins_with("Hair"):
			hair_meshes.append(m)
			m.material_override = hair
			m.visible = false
		else:
			for s in m.mesh.get_surface_count():
				var mname := m.mesh.surface_get_material(s).resource_name if m.mesh.surface_get_material(s) else ""
				match mname:
					"kit":
						m.set_surface_override_material(s, kit_mat)
					"skin":
						m.set_surface_override_material(s, skin)
					"shoe":
						m.set_surface_override_material(s, boots)
					"sole":
						m.set_surface_override_material(s, sole)
	# hair: one of the styles, or a shaved head now and then
	if hair_meshes.size() > 0 and rng.randf() > 0.08:
		hair_meshes[rng.randi() % hair_meshes.size()].visible = true


static var _clips := {}

static func _clip_info(n: String) -> Dictionary:
	if _clips.is_empty():
		var f := FileAccess.open("res://assets/player_clips.json", FileAccess.READ)
		if f:
			var d = JSON.parse_string(f.get_as_text())
			if d is Dictionary:
				_clips = d
	return _clips.get(n, {})


static func _cuttable(n: String) -> bool:
	for k in ["pass", "shot", "trap", "touch", "lob", "cross", "mv_", "header", "clear", "volley"]:
		if n.begins_with(k):
			return true
	return false


## The run cycles must loop: the model's clips come in as one-shots, and a cycle that reached its last frame stood
## still - the "legs not moving while he runs" of Hara Street.
static func _loop_clips(player: AnimationPlayer) -> void:
	for n in LOOP_SPEED:
		if player.has_animation(n):
			var a := player.get_animation(n)
			if a.loop_mode != Animation.LOOP_LINEAR:
				a.loop_mode = Animation.LOOP_LINEAR


func _play_loco(name: String, blend: float, speed: float) -> void:
	if loco != name or oneshot != "" or not ap.is_playing() or ap.current_animation != name:
		ap.play(name, blend)
		loco = name
		oneshot = ""
	ap.speed_scale = speed


## A substitute comes on: new kit number and a new look.
func restyle(kit: Dictionary, gk_kit: Dictionary, seed: int) -> void:
	if model:
		model.queue_free()
		model = null
	loco = ""
	oneshot = ""
	setup(sim, kit, gk_kit, seed)


func update_view(sim_time: float, has_ball: bool) -> void:
	var p := sim
	position = Vector3(p.pos.x, 0, p.pos.y)
	rotation.y = atan2(p.facing.x, p.facing.y)
	# body language: lean into turns, tilt forward when accelerating / sprinting, back when braking
	var dt := clampf(sim_time - last_t, 0.0, 0.1) if last_t >= 0.0 else 0.0
	last_t = sim_time
	var spd := p.vel.length()
	if dt > 0.0:
		var turn := last_face.angle_to(p.facing) / dt
		var want_lean := clampf(-turn * spd * 0.022, -0.32, 0.32) if p.action == "" else 0.0
		var acc := (spd - last_speed) / dt
		var want_tilt := clampf(acc * 0.012 + maxf(0.0, spd - 5.5) * 0.025, -0.12, 0.16) if p.action == "" else 0.0
		lean = lerpf(lean, want_lean, 1.0 - exp(-dt * 10.0))
		tilt = lerpf(tilt, want_tilt, 1.0 - exp(-dt * 8.0))
	last_face = p.facing
	last_speed = spd
	model.rotation = base_rot + Vector3(tilt, p.pose_spin, p.pose_lean + lean)
	# the simulation cut a one-shot short (a fake shot, a restart)
	if oneshot != "" and p.clip == "" and sim_time - oneshot_t0 > 0.05 and p.action not in ["fallen", "gk_hold"] and sim_time - oneshot_t0 < ap.current_animation_length - 0.08:
		oneshot = ""
		_choose_loco(has_ball, 0.12)
	# one-shot clip requested by the simulation
	if p.clip != "" and (p.clip != oneshot or absf(p.clip_t0 - oneshot_t0) > 0.01):
		var into := sim_time - p.clip_t0
		if into >= -0.001 and ap.has_animation(p.clip):
			oneshot = p.clip
			oneshot_t0 = p.clip_t0
			ap.play(p.clip, 0.08)
			ap.speed_scale = p.clip_speed
			if into > 0.02:
				ap.seek(into, true)
			loco = ""
	if oneshot != "":
		var len := ap.current_animation_length if ap.current_animation == oneshot else 0.0
		var done := sim_time - oneshot_t0 > len - 0.02
		var held := p.action in ["fallen", "gk_hold"] and sim_time - oneshot_t0 < len + 5.0
		# once the ball has been struck or taken, a player running on faster than the clip moves goes back to his
		# run cycle - a standing kick or trap would leave his legs still while the body slides along
		if not done and not held and _cuttable(oneshot):
			var info := _clip_info(oneshot)
			var re: Array = info.get("root_end", [0, 0, 0])
			var clip_speed := Vector2(float(re[0]), float(re[2])).length() / maxf(float(info.get("dur", 1.0)), 0.1)
			if spd > clip_speed + 1.4 and sim_time - oneshot_t0 > float(info.get("touch", 0.0)) + 0.08:
				done = true
		if done and not held:
			if p.clip == oneshot:
				p.clip = ""
			oneshot = ""
			_choose_loco(has_ball, 0.18)
		return
	_choose_loco(has_ball, 0.2)


func _choose_loco(has_ball: bool, blend: float) -> void:
	var s := sim.vel.length()
	# moving backwards (jockeying, backing off): the run cycle played in reverse
	if s > 0.35 and s < 4.5 and sim.vel.dot(sim.facing) < -0.5 * s:
		_play_loco("dribble", blend, -maxf(s / LOOP_SPEED["dribble"], 0.3))
		return
	var name := PlayerSim.loco_for(s, has_ball)
	if name == "idle":
		_play_loco("idle", blend, 1.0)
		return
	# the loop runs on the simulation's step beat: feet land where the body goes, touches land on a foot
	_play_loco(name, blend, maxf(s / float(LOOP_SPEED[name]), 0.2))
	var L := ap.current_animation_length
	if L > 0.0 and ap.current_animation == name:
		var want := fposmod((float(sim.steps) + sim.gait) * 0.5, 1.0) * L
		var err := want - ap.current_animation_position
		err -= L * roundf(err / L)
		if absf(err) > 0.025:
			ap.seek(want, true)
