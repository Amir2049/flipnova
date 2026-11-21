extends SceneTree
# Render the player model (kit painted like in a match) from four sides at one moment of a clip.
#   CLIP=sprint T=0.3 godot -s tests/shot_model.gd    -> scratchpad/model/<clip>_<view>.png
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/model/"

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	var clip: String = OS.get_environment("CLIP") if OS.get_environment("CLIP") != "" else "idle"
	var t: float = float(OS.get_environment("T")) if OS.get_environment("T") != "" else 0.0
	var hair_style: String = OS.get_environment("HAIR") if OS.get_environment("HAIR") != "" else "short"
	var root3d := Node3D.new()
	get_root().add_child(root3d)
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color(0.55, 0.62, 0.7)
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.environment.ambient_light_color = Color(0.55, 0.57, 0.62)
	env.environment.tonemap_mode = Environment.TONE_MAPPER_ACES
	root3d.add_child(env)
	var l := DirectionalLight3D.new()
	l.rotation_degrees = Vector3(-45, 30, 0)
	l.shadow_enabled = true
	root3d.add_child(l)
	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(20, 20)
	ground.mesh = pm
	var gm := StandardMaterial3D.new()
	gm.albedo_color = Color(0.22, 0.42, 0.2)
	ground.material_override = gm
	root3d.add_child(ground)
	var p: Node3D = load("res://assets/player.glb").instantiate()
	root3d.add_child(p)
	var kit := {"shirt": 0xd12a3a, "shirt2": 0xffffff, "shorts": 0xffffff, "socks": 0xd12a3a, "pattern": OS.get_environment("PATTERN") if OS.get_environment("PATTERN") != "" else "solid"}
	var kit_mat := StandardMaterial3D.new()
	kit_mat.albedo_texture = KitPainter.paint(kit, 10)
	kit_mat.roughness = 0.8
	var skin := StandardMaterial3D.new()
	skin.albedo_color = Color8(176, 122, 79)
	skin.vertex_color_use_as_albedo = true
	skin.roughness = 0.55
	var boots := StandardMaterial3D.new()
	boots.albedo_color = Color8(198, 255, 61)
	boots.roughness = 0.35
	var hair := StandardMaterial3D.new()
	hair.albedo_color = Color8(27, 22, 18)
	hair.roughness = 0.85
	for mi in p.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		if m.name.begins_with("Hair"):
			m.material_override = hair
			m.visible = m.name == "Hair_" + hair_style
			continue
		for s in m.mesh.get_surface_count():
			var mname := m.mesh.surface_get_material(s).resource_name if m.mesh.surface_get_material(s) else ""
			match mname:
				"kit": m.set_surface_override_material(s, kit_mat)
				"skin": m.set_surface_override_material(s, skin)
				"shoe": m.set_surface_override_material(s, boots)
	var ap: AnimationPlayer = p.find_child("AnimationPlayer", true, false)
	ap.play(clip)
	ap.seek(t, true)
	ap.pause()
	var cam := Camera3D.new()
	cam.fov = 30
	root3d.add_child(cam)
	var views := {"front": Vector3(0, 1.2, 5.2), "side": Vector3(5.2, 1.2, 0.3), "back": Vector3(-0.3, 1.2, -5.2), "q": Vector3(3.2, 1.6, 3.8)}
	for vname in views:
		cam.look_at_from_position(views[vname], Vector3(0, 0.95, 0))
		cam.fov = 30
		for k in range(3):
			await process_frame
		get_root().get_texture().get_image().save_png(out + "%s_%s.png" % [clip, vname])
	# close-up of the face
	cam.look_at_from_position(Vector3(0.35, 1.68, 1.1), Vector3(0, 1.6, 0))
	cam.fov = 25
	for k in range(3):
		await process_frame
	get_root().get_texture().get_image().save_png(out + "%s_face.png" % clip)
	quit()
