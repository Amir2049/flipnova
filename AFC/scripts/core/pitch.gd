class_name Pitch
extends RefCounted
## Pitch geometry (metres). Length along x (goals at x = +/- length / 2), width along z.

var length := 105.0
var width := 68.0
var goal_width := 7.32
var goal_height := 2.44
var goal_depth := 2.0
var post_radius := 0.06
var box_depth := 16.5
var box_width := 40.3
var six_depth := 5.5
var six_width := 18.32
var penalty_spot := 11.0
var circle_radius := 9.15
var walls := false


func half_l() -> float:
	return length * 0.5


func half_w() -> float:
	return width * 0.5


## Small-sided pitches keep the proportions of the markings.
static func make(kind: String) -> Pitch:
	var p := Pitch.new()
	match kind:
		"5v5":
			p.length = 42.0
			p.width = 26.0
			p.goal_width = 5.0
			p.goal_height = 2.0
			p.box_depth = 9.0
			p.box_width = 18.0
			p.six_depth = 3.0
			p.six_width = 9.0
			p.penalty_spot = 7.0
			p.circle_radius = 4.0
		"7v7":
			p.length = 64.0
			p.width = 40.0
			p.goal_width = 6.0
			p.goal_height = 2.2
			p.box_depth = 12.0
			p.box_width = 28.0
			p.six_depth = 4.0
			p.six_width = 12.0
			p.penalty_spot = 9.0
			p.circle_radius = 6.0
	return p


func in_box(x: float, z: float, end_sign: float) -> bool:
	return x * end_sign > half_l() - box_depth and absf(z) < box_width * 0.5
