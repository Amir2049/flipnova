extends SceneTree
# Engine cost per 10 ms frame (mean, p99, worst) and the cost of reading state + poses, CPU v CPU.
func _initialize():
	var dir := ProjectSettings.globalize_path("user://gfdata")
	GFData.unpack(dir)
	var e = ClassDB.instantiate("GFEngine")
	e.start(dir, {"human": 1, "match_seconds": 600.0, "seed": 9})
	var ts := PackedInt32Array()
	var rs := PackedInt32Array()
	for f in 30000:
		var a := Time.get_ticks_usec()
		e.frames(1)
		var m := Time.get_ticks_usec()
		var st: Dictionary = e.state()
		var p: PackedFloat32Array = e.poses()
		var z := Time.get_ticks_usec()
		ts.append(m - a)
		rs.append(z - m)
		if f % 50 == 0:
			e.set_input(randf_range(-1, 1), randf_range(-1, 1), 16 if randf() < 0.3 else 0)
	var total := 0
	for t in ts:
		total += t
	var tr := 0
	for t in rs:
		tr += t
	ts.sort()
	rs.sort()
	print("engine frame: mean %.0f us, p50 %d, p99 %d, p99.9 %d, worst %d; state+poses mean %.0f us, p99 %d" % [
		total / float(ts.size()), ts[ts.size() / 2], ts[int(ts.size() * 0.99)], ts[int(ts.size() * 0.999)], ts[-1], tr / float(rs.size()), rs[int(rs.size() * 0.99)]])
	quit()
