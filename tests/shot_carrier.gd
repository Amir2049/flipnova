extends SceneTree
# Close-up film of whoever has the ball in an engine match: a side-on camera that follows the carrier, one frame every
# 2 game frames, to check the legs really run (no skating) and where the ball sits.
var mv
var n := 0
var out := ""
var shots := 0

func _initialize():
	out = OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/carrier/"
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/engine_match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": -1, "half_minutes": 4.0, "difficulty": 0.5, "camera": "broadcast",
		"opts": {"time_of_day": "day", "quality": 1}})

func _process(_dt) -> bool:
	n += 1
	var st: Dictionary = mv.st
	if st.is_empty() or n < 200:
		return false
	var ot: int = st["owner_team"]
	var op: int = st["owner_player"]
	if ot < 0 or op < 0:
		return false
	var i: int = ot * 11 + op
	var o: int = i * mv.stride
	var c := Vector3(mv.poses[o], 0, -mv.poses[o + 1])
	mv.cam.external = true
	mv.cam.fov = 35.0
	mv.cam.look_at_from_position(c + Vector3(0.0, 1.6, 6.5), c + Vector3(0, 0.8, 0), Vector3.UP)
	if n % 2 == 0:
		get_root().get_texture().get_image().save_png(out + "k_%04d.png" % shots)
		shots += 1
	return shots >= 48
