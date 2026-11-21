extends SceneTree
## Hara Street (the classic match), computer v computer: do the legs run when the body moves?
## Skating = the slower foot's ground speed over the body's speed while moving faster than 2 m/s: a real run keeps
## one foot planted (near 0), legs frozen in a standing clip slide with the body (near 1).
##   godot --headless --fixed-fps 30 -s tests/street_legs.gd      (SECS=60)
var mv
var frame := 0
var secs := 60.0
var samples := 0
var skate_sum := 0.0
var carry_n := 0
var carry_skate := 0.0
var oneshot_moving := 0
var by_clip := {}
var prev := {}


func _initialize():
	if OS.get_environment("SECS") != "":
		secs = float(OS.get_environment("SECS"))
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	var opts: Dictionary = get_root().get_node("Profile").DEFAULT_SETTINGS.duplicate(true)
	opts["replays"] = false
	mv.start({"home": 0, "away": 3, "human_team": -1, "half_minutes": 3.0, "difficulty": 0.7, "camera": "broadcast",
		"street": true, "no_intro": true, "opts": opts})


func _feet(v) -> Array:
	var sk: Skeleton3D = v.model.find_children("*", "Skeleton3D", true, false)[0]
	var out := []
	for b in ["left_ankle", "right_ankle"]:
		var i := sk.find_bone(b)
		var g: Vector3 = sk.global_transform * sk.get_bone_global_pose(i).origin
		out.append(Vector2(g.x, g.z))
	return out


func _process(dt) -> bool:
	frame += 1
	if mv.sim == null:
		return false
	var step := 1.0 / 30.0
	for v in mv.views:
		var p = v.sim
		var spd: float = p.vel.length()
		var feet := _feet(v)
		var key: int = p.id
		if prev.has(key) and spd > 2.0:
			var lf: float = (feet[0] - prev[key][0]).length() / step
			var rf: float = (feet[1] - prev[key][1]).length() / step
			var sk := clampf(minf(lf, rf) / spd, 0.0, 1.5)
			samples += 1
			skate_sum += sk
			if mv.sim.owner == p.id:
				carry_n += 1
				carry_skate += sk
			if v.oneshot != "":
				oneshot_moving += 1
				by_clip[v.oneshot] = by_clip.get(v.oneshot, 0) + 1
		prev[key] = feet
	if frame * step >= secs:
		var top := []
		for k in by_clip:
			top.append([by_clip[k], k])
		top.sort()
		top.reverse()
		print("skating (0 = feet planted, 1 = sliding): all moving %.2f (n=%d), carrying the ball %.2f (n=%d); in a one-shot clip %.1f%%" % [
			skate_sum / maxf(samples, 1), samples, carry_skate / maxf(carry_n, 1), carry_n, 100.0 * oneshot_moving / maxf(samples, 1)])
		print("clips while moving: ", top.slice(0, 8))
		return true
	return false
