class_name RadarView
extends Control
## Mini map of the pitch with both teams and the ball.

var sim: MatchSim


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	if sim == null:
		return
	var r := Rect2(Vector2.ZERO, size)
	draw_rect(r, Color(0.02, 0.1, 0.04, 0.55))
	draw_rect(r, Color(1, 1, 1, 0.35), false, 1.5)
	draw_line(Vector2(size.x * 0.5, 0), Vector2(size.x * 0.5, size.y), Color(1, 1, 1, 0.3), 1.0)
	var hl := sim.pitch.half_l()
	var hw := sim.pitch.half_w()
	var to := func(x: float, z: float) -> Vector2: return Vector2((x / hl * 0.5 + 0.5) * size.x, (z / hw * 0.5 + 0.5) * size.y)
	var c0 := KitPainter.hex(sim.teams[0]["kit"].get("shirt", 0xffffff))
	var c1 := KitPainter.hex(sim.teams[1]["kit"].get("shirt", 0xffffff))
	if c0.get_luminance() > 0.85:
		c0 = Color(0.85, 0.85, 0.85)
	for p in sim.players:
		if sim.parked.has(p.id):
			continue
		var c := c0 if p.team == 0 else c1
		var pt: Vector2 = to.call(p.pos.x, p.pos.y)
		draw_circle(pt, 4.0 if p.human < 0 else 5.5, c)
		if p.human >= 0:
			draw_arc(pt, 7.0, 0, TAU, 16, Color(0.2, 0.6, 1.0), 2.0)
	draw_circle(to.call(sim.ball.pos.x, sim.ball.pos.z), 3.0, Color(1, 1, 1))
