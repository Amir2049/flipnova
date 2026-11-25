class_name TacticsBoard
extends Control
## The tactics screen's picture: a pitch seen from above with the eleven as dots, drawn from the formation and moved
## the way the engine moves them - mentality pushes the block up or drops it, width spreads or squeezes it, and the
## pressing shows as the arrows from the front men. Changing a setting glides the dots to the new shape.

var slots: Array = []                 # GameData formation slots: [depth 0..1, width -1..1, role]
var shirt := Color(0.9, 0.1, 0.2)
var target := Vector3.ZERO            # mentality, width, pressing (-1..1)
var shown := Vector3.ZERO


func setup(formation_slots: Array, kit: Color, tac: Vector3) -> void:
	slots = formation_slots
	shirt = kit
	target = tac
	shown = tac
	custom_minimum_size = Vector2(300, 220)
	queue_redraw()


func set_tactic(tac: Vector3) -> void:
	target = tac
	var tw := create_tween()
	tw.tween_method(func(v: Vector3):
		shown = v
		queue_redraw(), shown, target, 0.35).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)


func _draw() -> void:
	var r := Rect2(Vector2.ZERO, size)
	var grass := Color("2f8f3e")
	draw_rect(r, grass)
	for i in 6:   # mowing stripes
		if i % 2 == 0:
			draw_rect(Rect2(r.position + Vector2(r.size.x * i / 6.0, 0), Vector2(r.size.x / 6.0, r.size.y)), Color(1, 1, 1, 0.05))
	var line := Color(1, 1, 1, 0.75)
	var m := 8.0
	var p := Rect2(r.position + Vector2(m, m), r.size - Vector2(m, m) * 2.0)
	draw_rect(p, line, false, 2.0)
	draw_line(Vector2(p.get_center().x, p.position.y), Vector2(p.get_center().x, p.end.y), line, 2.0)
	draw_arc(p.get_center(), p.size.y * 0.15, 0, TAU, 32, line, 2.0)
	var box := Vector2(p.size.x * 0.16, p.size.y * 0.55)
	draw_rect(Rect2(Vector2(p.position.x, p.get_center().y - box.y / 2), box), line, false, 2.0)
	draw_rect(Rect2(Vector2(p.end.x - box.x, p.get_center().y - box.y / 2), box), line, false, 2.0)
	# the eleven: own goal on the left, attacking to the right
	var depth_shift := shown.x * 0.08               # the engine moves the block 7 m; drawn a little larger to read
	for s in slots:
		var d := float(s[0])
		var w := float(s[1])
		var gk := str(s[2]) == "GK"
		var x := 0.05 if gk else 0.13 + d * 0.5 + depth_shift
		var y := w * (1.0 if gk else 1.0 + shown.y * 0.22) * 0.42
		var pt := Vector2(p.position.x + p.size.x * clampf(x, 0.03, 0.97), p.get_center().y + p.size.y * clampf(y, -0.48, 0.48))
		if not gk and str(s[2]) == "FWD" and shown.z > 0.05:
			# the press: the front men go at the ball
			draw_line(pt, pt + Vector2(p.size.x * 0.09 * shown.z, 0), Color(1, 0.85, 0.2, 0.9), 3.0)
		draw_circle(pt + Vector2(1.5, 2), 8.5, Color(0, 0, 0, 0.35))
		draw_circle(pt, 8.5, Color("ffc72c") if gk else shirt)
		draw_arc(pt, 8.5, 0, TAU, 20, Color(1, 1, 1, 0.9), 1.5)
	if shown.z < -0.05:
		# a low block: a band across the own half
		var bx := p.position.x + p.size.x * (0.30 + depth_shift)
		draw_line(Vector2(bx, p.position.y + 6), Vector2(bx, p.end.y - 6), Color(0.6, 0.85, 1, 0.6), 3.0)
