extends SceneTree
# How tall the players are on screen with each match camera (FC 27: about 8-10 % of the screen height for players
# near the middle of the view). Projects head and feet of every on-screen player; prints median and nearest.
#   xvfb-run godot --rendering-driver opengl3 --resolution 1602x720 -s tests/size_test.gd
var mv
var frames := 0
var cams := ["broadcast", "tele", "wide", "close"]
var ci := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/size/"

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": cams[0], "no_intro": true,
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 1, "replays": false, "stoppage_menu": false}})

func _process(_dt) -> bool:
	frames += 1
	var s = mv.sim
	if not s.humans.is_empty() and s.humans[0]["pid"] >= 0:
		var p = s.players[s.humans[0]["pid"]]
		if s.phase in ["kickoff", "restart"] and s.restart.get("taker", -1) == p.id and s.phase_t > 0.5:
			s.human_action(0, "pass", 0.4, p.facing)
	if frames % 90 == 0:
		var cam: Camera3D = mv.cam
		var vs: Vector2 = get_root().get_visible_rect().size
		var hs := []
		for pv in mv.views:
			var q: PlayerSim = pv.sim
			var feet := Vector3(q.pos.x, 0.0, q.pos.y)
			if cam.is_position_behind(feet):
				continue
			var a := cam.unproject_position(feet)
			var b := cam.unproject_position(feet + Vector3(0, 1.82 * pv.height, 0))
			if a.x < 0 or a.x > vs.x or a.y < 0 or a.y > vs.y:
				continue
			hs.append((a.y - b.y) / vs.y * 100.0)
		hs.sort()
		var med: float = hs[hs.size() / 2] if hs.size() > 0 else 0.0
		print("SIZE %s: %d on screen, median %.1f %%, largest %.1f %%, smallest %.1f %%" % [cams[ci], hs.size(), med, hs.back() if hs.size() else 0.0, hs[0] if hs.size() else 0.0])
		get_root().get_texture().get_image().save_png(out + "%s.png" % cams[ci])
		ci += 1
		if ci >= cams.size():
			return true
		mv.cam.mode = cams[ci]
	return false
