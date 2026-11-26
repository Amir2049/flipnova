extends SceneTree
# The squad editor pages: squads (with CLUB and PATCH), the club editor, the patch page.
var n := 0
var out := ""
var m: Node

func _initialize():
	out = OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/editor/"
	DirAccess.make_dir_recursive_absolute(out)
	get_root().add_child(load("res://scenes/main.tscn").instantiate())

func _find_main(node: Node) -> Node:
	if node.has_method("_home") and node.has_method("_club_edit"):
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
	if n == 150 and m:
		m._go(m._squads)
	if n == 190:
		_shot("ed_1_squads")
		m._go(m._club_edit)
	if n == 230:
		_shot("ed_2_club")
		m._go(m._patch_page)
	if n == 270:
		_shot("ed_3_patch")
		return true
	return false
