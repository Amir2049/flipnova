extends SceneTree
# Close-up of players running / dribbling to judge the body and the feet (sliding).
var mv
var frames := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/body/"

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.5, "camera": "close", "no_intro": true,
		"opts": {"weather": "clear", "time_of_day": "day", "quality": 2, "replays": false, "stoppage_menu": false}})
	mv.hud.visible = false

func _process(_dt) -> bool:
	frames += 1
	var s = mv.sim
	if not s.humans.is_empty() and s.humans[0]["pid"] >= 0:
		var p = s.players[s.humans[0]["pid"]]
		if s.phase in ["kickoff", "restart"] and s.restart.get("taker", -1) == p.id and s.phase_t > 0.5:
			s.human_action(0, "pass", 0.4, p.facing)
		if s.owner == p.id:
			p.move = Vector2(s.attack_dir(0), 0.3).normalized()
			p.sprint = 1.0 if frames > 150 else 0.0
	if frames == 42:
		get_root().get_texture().get_image().save_png(out + "face.png")
		mv.cam.external = false
	if frames == 40:
		# face to face with a player at kick-off
		var q = s.players[3]
		var c0 := Vector3(q.pos.x, 0, q.pos.y)
		var f0 := Vector3(q.facing.x, 0, q.facing.y)
		mv.cam.external = true
		mv.cam.look_at_from_position(c0 + f0 * 2.2 + Vector3(0, 1.7, 0.6), c0 + Vector3(0, 1.3, 0), Vector3.UP)
		mv.cam.fov = 40.0
	if frames >= 100 and frames % 3 == 0 and frames <= 196:
		var hp = s.players[s.humans[0]["pid"]]
		var c := Vector3(hp.pos.x, 0, hp.pos.y)
		mv.cam.external = true
		mv.cam.look_at_from_position(c + Vector3(-2.5, 2.2, 6.0), c + Vector3(0.5, 0.9, 0), Vector3.UP)
		mv.cam.fov = 40.0
		get_root().get_texture().get_image().save_png(out + "b_%03d.png" % frames)
	return frames > 196
