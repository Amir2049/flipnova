extends SceneTree
# A career match goes through the engine and its result comes back into the career (score order, scorers, players).
var m: Node
var n := 0
var before := {}
var prof: Node

func _initialize():
	m = load("res://scenes/main.tscn").instantiate()
	get_root().add_child(m)

func _process(_dt) -> bool:
	n += 1
	if n == 4:
		prof = get_root().get_node("Profile")
	if n == 5:
		if prof.data["career"].is_empty():
			print("no career saved; starting one")
			prof.data["career"] = Career.new_career(1)
		before = prof.data["career"].duplicate(true)
		m._career_play()
		print("view: ", m.match_view.get_script().resource_path, " swapped=", m.context.get("swapped"))
	if n == 400:
		var mv = m.match_view
		mv.scorers.append({"team": 0, "name": "Test Scorer", "minute": 10})
		mv.st["goals"] = Vector2i(1, 0)
		mv._full_time()
		# press CONTINUE
		var g: Vector2i = mv.st["goals"]
		print("engine score ", g)
	if n == 410:
		var btns = m.match_view.result_root.find_children("*", "Button", true, false)
		for b in btns:
			if b.text == "CONTINUE":
				b.emit_signal("pressed")
		print("buttons: ", btns.map(func(b): return b.text))
	if n == 430:
		var c: Dictionary = prof.data["career"]
		print("career round before ", before.get("round"), " after ", c.get("round"))
		var r0: int = int(before.get("round", 0))
		print("round %d results: %s" % [r0, str(c["results"][r0])])
		print("fixtures: %s" % str(c["fixtures"][r0]))
		print("scorers table: %s" % str(c.get("scorers", {})).left(200))
		return true
	return false
