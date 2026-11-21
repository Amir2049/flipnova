extends SceneTree
# The menus as the phone shows them (1602x720 canvas): title, home, kick off, settings, controls.
var n := 0
var out := ""
var m: Node

func _initialize():
	out = OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/menu/"
	DirAccess.make_dir_recursive_absolute(out)
	get_root().add_child(load("res://scenes/main.tscn").instantiate())

func _find_main(node: Node) -> Node:
	if node.has_method("_home") and node.has_method("_kickoff"):
		return node
	for c in node.get_children():
		var f := _find_main(c)
		if f:
			return f
	return null

func _shot(name: String) -> void:
	get_root().get_texture().get_image().save_png(out + name + ".png")

func _process(_dt) -> bool:
	n += 1
	if m == null and n > 30:
		m = _find_main(get_root())
	if n == 150:
		_shot("1_title")
		if m:
			m._go(m._home)
	if n == 190:
		_shot("2_home")
		m._go(m._kickoff)
	if n == 230:
		_shot("3_kickoff")
		m._go(m._play_hub)
	if n == 270:
		_shot("4_play")
		m._go(m._club_hub)
	if n == 310:
		_shot("5_club")
	return n > 312
