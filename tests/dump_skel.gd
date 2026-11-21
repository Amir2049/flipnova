extends SceneTree
func _initialize():
	var m = load("res://assets/player.glb").instantiate()
	var sk: Skeleton3D = m.find_children("*", "Skeleton3D", true, false)[0]
	var out := []
	for i in sk.get_bone_count():
		var g := sk.get_bone_global_rest(i)
		var r := sk.get_bone_rest(i)
		out.append({"name": sk.get_bone_name(i), "parent": sk.get_bone_parent(i), "gpos": [g.origin.x, g.origin.y, g.origin.z],
			"gq": [g.basis.get_rotation_quaternion().x, g.basis.get_rotation_quaternion().y, g.basis.get_rotation_quaternion().z, g.basis.get_rotation_quaternion().w],
			"lpos": [r.origin.x, r.origin.y, r.origin.z], "lq": [r.basis.get_rotation_quaternion().x, r.basis.get_rotation_quaternion().y, r.basis.get_rotation_quaternion().z, r.basis.get_rotation_quaternion().w]})
	var f := FileAccess.open("res://assets/skeleton_rest.json", FileAccess.WRITE)
	f.store_string(JSON.stringify(out, " "))
	f.close()
	for b in out:
		print(b["name"], " parent ", b["parent"], " gpos ", b["gpos"], " gq ", b["gq"])
	var ap := m.find_child("AnimationPlayer", true, false) as AnimationPlayer
	print("anims: ", ap.get_animation_list().size())
	quit()
