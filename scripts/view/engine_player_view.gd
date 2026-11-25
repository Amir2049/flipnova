class_name EnginePlayerView
extends Node3D
## A footballer moved by the football engine: every frame the engine's joint rotations go straight onto the
## model's skeleton (the engine and the model share the same 14 joints), so the body moves exactly the way the
## engine animates it - runs, turns, touches, kicks, tackles, saves.

const PLAYER_SCENE := preload("res://assets/player.glb")
const JOINTS := ["player", "body", "middle", "neck", "left_shoulder", "left_elbow", "right_shoulder", "right_elbow",
	"left_thigh", "left_knee", "left_ankle", "right_thigh", "right_knee", "right_ankle"]

var model: Node3D
var skel: Skeleton3D
var bones := PackedInt32Array()
var height := 1.0
var blob: MeshInstance3D


func setup(kit: Dictionary, number: int, is_gk: bool, seed: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed
	model = PLAYER_SCENE.instantiate()
	add_child(model)
	height = rng.randf_range(0.99, 1.07)
	model.scale = Vector3(1.07, 1.0, 1.07) * height   # athletic: shoulders and chest a little broader than the stock body
	var ap := model.find_child("AnimationPlayer", true, false)
	if ap:
		ap.queue_free()   # the engine poses the skeleton itself
	skel = model.find_children("*", "Skeleton3D", true, false)[0] as Skeleton3D
	for j in JOINTS:
		bones.append(skel.find_bone(j))
	PlayerView.dress(model, kit, number, is_gk, rng)
	if PlayerView.blob_mat == null:
		PlayerView.blob_mat = ShaderMaterial.new()
		var sh := Shader.new()
		sh.code = PlayerView.BLOB_SHADER
		PlayerView.blob_mat.shader = sh
	blob = MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.9, 1.1)
	blob.mesh = q
	blob.material_override = PlayerView.blob_mat
	blob.rotation_degrees = Vector3(-90, 0, 0)
	blob.position = Vector3(0, 0.012, 0)
	blob.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(blob)


## A substitute comes on in this player's place: another face, hair and number.
func redress(kit: Dictionary, number: int, is_gk: bool, seed: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed
	PlayerView.dress(model, kit, number, is_gk, rng)


## A mocap clip (Mocap) playing over the engine's pose: goal celebrations and the like. Blended in and out.
var clip: Dictionary = {}
var clip_t := 0.0
var clip_len := 0.0
var clip_origin := Vector3.ZERO
var clip_yaw := Quaternion.IDENTITY


func play_clip(c: Dictionary, delay: float = 0.0, max_len: float = 4.5) -> void:
	if c.is_empty() or skel == null:
		return
	clip = c
	clip_t = -delay
	clip_len = minf(Mocap.length(c), max_len)
	clip_origin = position
	# the clip starts facing +z: turn it to where the engine has him facing (the body bone carries the facing)
	var fwd := skel.get_bone_pose_rotation(bones[1]) * Vector3(0, 0, 1)
	clip_yaw = Quaternion(Vector3.UP, atan2(fwd.x, fwd.z))


func busy() -> bool:
	return not clip.is_empty()


## One player's pose from GFEngine.poses(): engine axes (x along the pitch, y across, z up) become Godot axes
## (x, z up, -y) - the same conversion the model's clips were built with. A playing mocap clip is blended over it.
func apply(p: PackedFloat32Array, o: int, dt: float = 0.0) -> void:
	var epos := Vector3(p[o], 0.0, -p[o + 1])
	visible = p[o + 9] > 0.5
	var eroot := Vector3(0.0, p[o + 2], 0.0)
	var w := 0.0
	var pose := {}
	if not clip.is_empty():
		clip_t += dt
		if clip_t >= clip_len:
			clip = {}
		elif clip_t > 0.0:
			w = clampf(minf(clip_t / 0.25, (clip_len - clip_t) / 0.35), 0.0, 1.0)
			pose = Mocap.sample(clip, clip_t)
	if w <= 0.0:
		position = epos
		skel.set_bone_pose_position(bones[0], eroot)
		for j in JOINTS.size():
			var k := o + 10 + j * 4
			skel.set_bone_pose_rotation(bones[j], Quaternion(p[k], p[k + 2], -p[k + 1], p[k + 3]).normalized())
	else:
		var r: Vector3 = pose["root"]
		var cpos := clip_origin + clip_yaw * Vector3(r.x, 0.0, r.z) * height
		position = epos.lerp(cpos, w)
		skel.set_bone_pose_position(bones[0], eroot.lerp(Vector3(0.0, r.y, 0.0), w))
		var rot: Dictionary = pose["rot"]
		for j in JOINTS.size():
			var k := o + 10 + j * 4
			var eq := Quaternion(p[k], p[k + 2], -p[k + 1], p[k + 3]).normalized()
			var cq: Quaternion = rot.get(JOINTS[j], Quaternion.IDENTITY)
			if j == 1:
				cq = clip_yaw * cq
			skel.set_bone_pose_rotation(bones[j], eq.slerp(cq, w))
	# the contact shadow stays under the feet (the body can be off the root during a clip)
	var hips := skel.get_bone_global_pose(bones[1]).origin * height
	blob.position = Vector3(hips.x, 0.012, hips.z)
