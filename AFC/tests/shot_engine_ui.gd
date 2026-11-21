extends SceneTree
## Screenshots of the engine match's screens: the HUD in play (scoreboard, name and stamina, radar, touch
## controls), the pause menu, substitutions, match facts at half time and full time.
##   xvfb-run -a -s "-screen 0 1602x720x24" godot --rendering-driver opengl3 --resolution 1602x720 \
##     --fixed-fps 30 -s tests/shot_engine_ui.gd        (OUT=dir, LEVEL=0..4)
var mv
var frame := 0
var out := "/tmp/afc-ui"


func _initialize():
	if OS.get_environment("OUT") != "":
		out = OS.get_environment("OUT")
	DirAccess.make_dir_recursive_absolute(out)
	mv = load("res://scripts/view/engine_match_view.gd").new()
	mv.force_touch = true
	get_root().add_child(mv)
	var opts: Dictionary = get_root().get_node("Profile").DEFAULT_SETTINGS.duplicate(true)
	opts["quality"] = 1
	opts["time_of_day"] = "day"
	var lv := int(OS.get_environment("LEVEL")) if OS.get_environment("LEVEL") != "" else 4
	mv.start({"seed": 11, "home": 0, "away": 3, "human_team": 0, "half_minutes": 4.0, "level": lv, "camera": "broadcast", "opts": opts})


func _shot(name: String) -> void:
	get_root().get_texture().get_image().save_png(out + "/" + name + ".png")
	print("saved ", name)


func _process(_dt) -> bool:
	frame += 1
	match frame:
		150:
			_shot("1_play")
		160:
			mv.set_paused(true)
		166:
			_shot("2_pause")
		170:
			mv._subs_page(mv._pause_menu)
		172:
			mv.sub_out = 9
			mv._subs_page(mv._pause_menu)
		176:
			_shot("3_subs")
		180:
			mv.substitute(0, 9, 0)
			mv.set_paused(false)
		200:
			mv._half_time()
		206:
			_shot("4_half")
		210:
			mv.paused = false
			mv._close_overlay()
			mv._full_time()
		218:
			_shot("5_full")
			print("brain: ", mv.brain, "  level: ", mv.level_lbl.text)
			return true
	return false
