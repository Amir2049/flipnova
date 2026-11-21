extends SceneTree
## The engine's players must be drawn where it plays them: each team's ball carrier within ~1 m of the ball, and
## running players facing the way they run (both teams).
func _qrot(p: PackedFloat32Array, k: int, v: Vector3) -> Vector3:
	var q := Quaternion(p[k], p[k + 1], p[k + 2], p[k + 3]).normalized()
	return q * v

func _init():
	var dir := OS.get_user_data_dir() + "/gfdata"
	GFData.unpack(dir)
	var e = ClassDB.instantiate("GFEngine")
	e.start(dir, {"human": 0, "seed": 3, "match_seconds": 480.0, "brain": int(OS.get_environment("BRAIN")), "brain_path": ProjectSettings.globalize_path("res://assets/tizero.bin")})
	var near := [[], []]
	var face := [[], []]
	var prev := PackedFloat32Array()
	for k in 600:
		e.frames(10)
		var st: Dictionary = e.state()
		var p: PackedFloat32Array = e.poses()
		if prev.size() == p.size():
			for i in 22:
				var v := Vector2(p[i * 66] - prev[i * 66], p[i * 66 + 1] - prev[i * 66 + 1]) / 0.1
				if v.length() > 3.0:
					# the body joint's forward (engine -y local axis) against the run direction
					var root := Quaternion(p[i * 66 + 10], p[i * 66 + 11], p[i * 66 + 12], p[i * 66 + 13]).normalized()
					var f3 := root * _qrot(p, i * 66 + 10 + 4, Vector3(0, -1, 0))
					var f := Vector2(f3.x, f3.y)
					face[i / 11].append(rad_to_deg(absf(f.angle_to(v))))
		prev = p
		var t: int = st["owner_team"]
		if t < 0:
			continue
		var i: int = t * 11 + int(st["owner_player"])
		var b: Vector3 = st["ball"]
		near[t].append(Vector2(p[i * 66], p[i * 66 + 1]).distance_to(Vector2(b.x, b.y)))
	for t in 2:
		var a: Array = near[t]
		a.sort()
		var f: Array = face[t]
		f.sort()
		print("team %d: carrier to ball median %.2f m (n=%d); facing vs running median %.0f deg (n=%d)" % [t,
			a[a.size() / 2] if a.size() > 0 else -1.0, a.size(), f[f.size() / 2] if f.size() > 0 else -1.0, f.size()])
	print("brain: ", e.state()["brain"], "  score: ", e.state()["goals"])
	quit()
