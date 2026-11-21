extends SceneTree
# How high do the human's shots go for each length of press? Dribbles to 25-35 m from goal, holds SHOT for HOLD
# engine frames (10 ms each), then records the ball's peak height, its height when it reaches the goal line, and goals.
#   HOLD=10 TRIES=25 godot --headless -s tests/shot_height.gd
func _initialize():
	var hold := int(OS.get_environment("HOLD")) if OS.get_environment("HOLD") != "" else 10
	var tries := int(OS.get_environment("TRIES")) if OS.get_environment("TRIES") != "" else 20
	var cap := int(OS.get_environment("CAP")) if OS.get_environment("CAP") != "" else 0
	var dir := ProjectSettings.globalize_path("user://gfdata")
	GFData.unpack(dir)
	var e = ClassDB.instantiate("GFEngine")
	var o := {"human": 1, "difficulty_away": 0.2, "seed": 21, "match_seconds": 5400.0}
	if cap > 0:
		o["shot_cap_frames"] = cap
	e.start(dir, o)
	var s: int = e.stride()
	var shots := 0
	var peaks := PackedFloat32Array()
	var at_line := PackedFloat32Array()
	var over := 0
	var on_target := 0
	var goals0: int = 0
	var phase := 0          # 0 get ball and dribble, 1 shooting (pressed), 2 watching
	var t := 0
	var peak := 0.0
	var line_z := -1.0
	var f := 0
	while shots < tries and f < 600000:
		f += 1
		var st: Dictionary = e.state()
		var p: PackedFloat32Array = e.poses()
		var ctl: int = st["controlled"]
		var b: Vector3 = st["ball"]
		var stick := Vector2.ZERO
		var btn := 0
		if phase == 0:
			if ctl >= 0 and int(st["mode"]) == 0:
				var me := Vector2(p[ctl * s], p[ctl * s + 1])
				var mine: bool = int(st["owner_team"]) == 0 and int(st["owner_player"]) == ctl
				if mine:
					stick = (Vector2(55, 0) - me).normalized()
					if me.x > 22.0 and me.x < 32.0 and absf(me.y) < 12.0:
						phase = 1
						t = 0
				else:
					stick = (Vector2(b.x, b.y) - me).normalized()
					btn = 16 if me.distance_to(Vector2(b.x, b.y)) > 6 else 0
			elif ctl >= 0 and int(st.get("taker", -1)) == ctl:
				btn = 1 if (f / 30) % 2 == 0 else 0
				stick = Vector2(1, 0)
		elif phase == 1:
			if ctl >= 0:
				var me2 := Vector2(p[ctl * s], p[ctl * s + 1])
				stick = (Vector2(55, 0) - me2).normalized()
			btn = 8 if t < hold else 0
			t += 1
			if t > hold + 60:
				phase = 2
				t = 0
				peak = 0.0
				line_z = -1.0
				goals0 = int(st["goals"].x)
		elif phase == 2:
			t += 1
			peak = maxf(peak, b.z)
			if line_z < 0.0 and b.x > 54.5:
				line_z = b.z
			if t > 250 or int(st["mode"]) != 0:
				if peak > 0.0:
					shots += 1
					peaks.append(peak)
					if line_z >= 0.0:
						at_line.append(line_z)
						if line_z > 2.44:
							over += 1
						elif absf(b.y) < 3.66:
							on_target += 1
				phase = 0
		e.set_input(stick.x, stick.y, btn)
		e.frames(1)
	peaks.sort()
	var goals: int = int(e.state()["goals"].x)
	print("RESULT hold %d ms (cap %d): %d shots, peak height median %.1f m, p90 %.1f m; reached the line %d, over the bar %d, under the bar %d; goals %d" % [
		hold * 10, cap * 10, shots, peaks[peaks.size() / 2] if peaks.size() else 0.0, peaks[int(peaks.size() * 0.9)] if peaks.size() else 0.0,
		at_line.size(), over, on_target, goals])
	quit()
