extends SceneTree
# Close control on the engine: a scripted human gets the ball and dribbles around the pitch (waypoints), against a
# CPU side. Measures how far the ball runs from his feet while he has it, how often he loses it, and his speed.
#   MOVE=walk|sprint|close SECS=300 godot --headless -s tests/dribble_engine.gd
var e
var s := 66
const WAYPOINTS := [Vector2(30, 20), Vector2(30, -20), Vector2(-30, -20), Vector2(-30, 20)]

func _initialize():
	var move := OS.get_environment("MOVE") if OS.get_environment("MOVE") != "" else "walk"
	var secs := float(OS.get_environment("SECS")) if OS.get_environment("SECS") != "" else 300.0
	var lead := float(OS.get_environment("LEAD")) if OS.get_environment("LEAD") != "" else 1.0
	var dir := ProjectSettings.globalize_path("user://gfdata")
	GFData.unpack(dir)
	e = ClassDB.instantiate("GFEngine")
	var opts := {"human": 1, "difficulty_home": 0.6, "difficulty_away": 0.3, "seed": 11, "match_seconds": 5400.0}
	if lead != 1.0:
		opts["dribble_lead"] = lead
	e.start(dir, opts)
	s = e.stride()
	var dists := PackedFloat32Array()
	var speeds := PackedFloat32Array()
	var in_drib := false
	var losses := 0
	var dribs := 0
	var drib_frames := 0
	var far := 0
	var wp := 0
	var prev := Vector2.ZERO
	var last_d := 0.0
	var last_opp := 0.0
	var loss_far := 0
	var loss_tackled := 0
	var t0 := Time.get_ticks_msec()
	for f in int(secs * 100.0):
		var st: Dictionary = e.state()
		var p: PackedFloat32Array = e.poses()
		var ctl: int = st["controlled"]
		var b: Vector3 = st["ball"]
		var ball := Vector2(b.x, b.y)
		var stick := Vector2.ZERO
		var btn := 0
		if ctl >= 0 and st["mode"] == 0:
			var me := Vector2(p[ctl * s], p[ctl * s + 1])
			var mine: bool = st["owner_team"] == 0 and st["owner_player"] == ctl
			if mine and not in_drib:
				in_drib = true
				dribs += 1
			if in_drib:
				if st["owner_team"] == 1 or not st["in_play"]:
					in_drib = false
					if st["owner_team"] == 1:
						losses += 1
						if last_d > 1.8:
							loss_far += 1
						elif last_opp < 1.5:
							loss_tackled += 1
				else:
					var d := me.distance_to(ball)
					dists.append(d)
					last_d = d
					last_opp = 99.0
					for j in range(11, 22):
						last_opp = minf(last_opp, me.distance_to(Vector2(p[j * s], p[j * s + 1])))
					if d > 3.0:
						far += 1
					drib_frames += 1
					if f % 10 == 0 and prev != Vector2.ZERO:
						speeds.append(me.distance_to(prev) * 10.0)
					if f % 10 == 0:
						prev = me
					if me.distance_to(WAYPOINTS[wp]) < 8.0:
						wp = (wp + 1) % WAYPOINTS.size()
					stick = (WAYPOINTS[wp] - me).normalized()
					btn = 16 if move == "sprint" else (32 if move == "close" else 0)
			if not in_drib:
				prev = Vector2.ZERO
				stick = (ball - me).normalized() if me.distance_to(ball) > 0.3 else Vector2.ZERO
				btn = 16 if me.distance_to(ball) > 6.0 else 0
				if st["owner_team"] == 1:
					btn |= 128
		elif ctl >= 0 and st["mode"] > 0 and int(st.get("taker", -1)) == ctl:
			# our set piece: tap pass
			btn = 1 if (f / 40) % 2 == 0 else 0
			stick = Vector2(1, 0)
		e.set_input(stick.x, stick.y, btn)
		e.frames(1)
	dists.sort()
	speeds.sort()
	var n := dists.size()
	if n == 0:
		print("no dribbling")
		quit()
		return
	print("RESULT move=%s lead=%.2f: dribbling %.0f s in %d runs, ball-feet median %.2f m, p90 %.2f m, over 3 m %.0f%%, losses %.1f per minute, speed median %.1f m/s, losses with ball >1.8 m away %d, tackled close %d, other %d (%d ms)" % [
		move, lead, drib_frames / 100.0, dribs, dists[n / 2], dists[int(n * 0.9)], far * 100.0 / n,
		losses / (drib_frames / 6000.0), speeds[speeds.size() / 2] if speeds.size() > 0 else 0.0, loss_far, loss_tackled, losses - loss_far - loss_tackled, Time.get_ticks_msec() - t0])
	quit()
