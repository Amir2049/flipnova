extends SceneTree
# Look at retargeted mocap clips on the footballer: 8 poses per clip, side-on.
#   MOCAP=assets/mocap.json OUT=dir godot -s tests/shot_mocap.gd (under xvfb, 480x480)
var model: Node3D
var skel: Skeleton3D
var cam: Camera3D
var clips: Dictionary
var names: Array
var ci := 0
var k := 0
var wait := 0
var out := ""

func _initialize():
	out = OS.get_environment("OUT")
	clips = JSON.parse_string(FileAccess.get_file_as_string(OS.get_environment("MOCAP")))
	names = clips.keys()
	var root := Node3D.new()
	get_root().add_child(root)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.2, 0.3, 0.25)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.6, 0.6, 0.65)
	env.environment = e
	root.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-40, -30, 0)
	root.add_child(sun)
	var floor_m := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(20, 20)
	floor_m.mesh = pm
	root.add_child(floor_m)
	model = PlayerView.PLAYER_SCENE.instantiate()
	root.add_child(model)
	var ap := model.find_child("AnimationPlayer", true, false)
	if ap:
		ap.queue_free()
	var rng := RandomNumberGenerator.new()
	PlayerView.dress(model, GameData.CLUBS[0]["kit"], 10, false, rng)
	skel = model.find_children("*", "Skeleton3D", true, false)[0]
	cam = Camera3D.new()
	cam.fov = 40
	root.add_child(cam)

func _pose(c: Dictionary, f: int) -> void:
	var r: Array = c["root"][f]
	skel.set_bone_pose_position(skel.find_bone("player"), Vector3(r[0], r[1], r[2]))
	for b in c["rot"]:
		var q: Array = c["rot"][b][f]
		skel.set_bone_pose_rotation(skel.find_bone(b), Quaternion(q[0], q[1], q[2], q[3]))
	var hip := Vector3(r[0], 0.9 + r[1], r[2])
	cam.look_at_from_position(hip + Vector3(3.2, 0.3, 1.8), hip, Vector3.UP)

func _process(_dt) -> bool:
	if ci >= names.size():
		return true
	var c: Dictionary = clips[names[ci]]
	if wait == 0:
		var f := int(float(k) / 8.0 * (int(c["frames"]) - 1))
		_pose(c, f)
		wait = 2
		return false
	wait -= 1
	if wait == 0:
		get_root().get_texture().get_image().save_png(out + "%s_%d.png" % [names[ci], k])
		k += 1
		if k >= 8:
			k = 0
			ci += 1
	return false
