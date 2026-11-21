extends SceneTree
# Render the player GLB playing a clip; saves PNGs for review.
func _initialize():
	var clip: String = OS.get_environment("CLIP") if OS.get_environment("CLIP") != "" else "sprint"
	var root3d := Node3D.new()
	get_root().add_child(root3d)
	var env := WorldEnvironment.new(); env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR; env.environment.background_color = Color(0.45, 0.6, 0.8)
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.environment.ambient_light_color = Color(0.6, 0.6, 0.65)
	root3d.add_child(env)
	var l := DirectionalLight3D.new(); l.rotation_degrees = Vector3(-50, 40, 0); root3d.add_child(l)
	var ground := MeshInstance3D.new(); var pm := PlaneMesh.new(); pm.size = Vector2(20, 20); ground.mesh = pm
	var gm := StandardMaterial3D.new(); gm.albedo_color = Color(0.2, 0.5, 0.25); ground.material_override = gm; root3d.add_child(ground)
	var ps: PackedScene = load("res://assets/player.glb")
	var p := ps.instantiate(); root3d.add_child(p)
	var ap: AnimationPlayer = p.find_child("AnimationPlayer", true, false)
	print("clips: ", ap.get_animation_list().size())
	ap.play(clip)
	var cam := Camera3D.new(); root3d.add_child(cam)
	cam.look_at_from_position(Vector3(2.2, 1.4, 2.6), Vector3(0, 0.9, 0))
	for i in range(4):
		for k in range(int(ap.current_animation_length * 60 / 4)): await process_frame
		get_root().get_texture().get_image().save_png("/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/gp_%s_%d.png" % [clip, i])
	quit()
