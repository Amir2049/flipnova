extends SceneTree
# Ball out of play: dead phase (whistle, pause, fade) then the restart; half-time waits for the player.
var main
var f := 0
var seen := {}
func _initialize():
	main = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(main)
func _process(_d) -> bool:
	f += 1
	if f == 5:
		var cfg = main._match_config(0, 1, 0)
		cfg["half_minutes"] = 0.4
		cfg["opts"]["stoppage_menu"] = false
		main._play(cfg, {"type": "friendly"})
	var mv = main.match_view
	if f > 5 and mv and mv.sim:
		var s = mv.sim
		if s.phase == "play" and s.time > 2.0 and not seen.has("kick"):
			seen["kick"] = true
			s.ball.pos = Vector3(10, 0.2, 30)
			s.ball.vel = Vector3(0, 0, 12)
			s.owner = -1
			print("ball sent out at t=%.2f" % s.time)
		if not seen.has(s.phase):
			seen[s.phase] = true
			print("phase %s at t=%.2f fade %.2f" % [s.phase, s.time, mv.hud.fade_rect.color.a])
		if s.phase == "halftime" and mv.hud.halftime_root != null and not seen.has("ht"):
			seen["ht"] = true
			print("half-time screen shown; waiting")
		if seen.has("ht") and not seen.has("go") and s.phase_t > 3.0:
			seen["go"] = true
			print("still half time after 3 s: %s" % (s.phase == "halftime"))
			s.halftime_go = true
		if s.half == 2 and not seen.has("h2"):
			seen["h2"] = true
			print("second half started")
			return true
	return f > 20000
