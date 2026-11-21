extends SceneTree
# Human holds "right" (toward the opponent goal) and shoots near the box; saves a frame every few frames.
var mv
var frames := 0
var out := "/tmp/claude-0/-home-claude/680b6e50-c7a1-5275-93ee-2e36b27d4015/scratchpad/drib/"
var first := int(OS.get_environment("FIRST")) if OS.get_environment("FIRST") != "" else 30
var every := int(OS.get_environment("EVERY")) if OS.get_environment("EVERY") != "" else 4
var count := int(OS.get_environment("COUNT")) if OS.get_environment("COUNT") != "" else 16
var shot_sent := false

func _key(k: Key, on: bool) -> void:
	var e := InputEventKey.new()
	e.physical_keycode = k
	e.keycode = k
	e.pressed = on
	Input.parse_input_event(e)

func _initialize():
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/match_view.gd").new()
	get_root().add_child(mv)
	mv.start({"home": 0, "away": 1, "human_team": 0, "half_minutes": 4.0, "difficulty": 0.3, "camera": OS.get_environment("CAM") if OS.get_environment("CAM") != "" else "broadcast"})

func _process(_dt) -> bool:
	frames += 1
	var s = mv.sim
	var dir: String = "right" if s.attack_dir(0) > 0 else "left"
	_key(KEY_D if dir == "right" else KEY_A, frames > 3)
	if s.owner >= 0 and s.players[s.owner].team == 0 and absf(s.players[s.owner].pos.x) > 30.0 and not shot_sent:
		_key(KEY_L, true)
		shot_sent = true
	elif shot_sent:
		_key(KEY_L, false)
	if s.phase in ["kickoff", "restart"] and s.restart.get("team", -1) == 0 and s.phase_t > 0.8 and s.humans[0]["pid"] >= 0:
		s.human_action(0, "pass", 0.4, s.players[s.humans[0]["pid"]].facing)
	var k: int = frames - first
	if k >= 0 and k % every == 0 and k / every < count:
		get_root().get_texture().get_image().save_png(out + "d_%02d.png" % (k / every))
		var c = s.owner
		var info := ""
		if not s.humans.is_empty() and s.humans[0]["pid"] >= 0:
			var p = s.players[s.humans[0]["pid"]]
			info = "human %d pos (%.1f,%.1f) v %.1f  ball d %.2f h %.2f" % [p.id, p.pos.x, p.pos.y, p.vel.length(), Vector2(s.ball.pos.x, s.ball.pos.z).distance_to(p.pos), s.ball.pos.y]
		print("f%d t=%.2f %s owner %d %s" % [frames, s.time, s.phase, c, info])
	return frames >= first + every * count
