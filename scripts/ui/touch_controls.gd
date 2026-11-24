class_name TouchControls
extends Control
## On-screen controls in the FC Mobile layout.
## - Stick side (left, or right when left-handed): a floating stick that appears under the thumb (or a fixed one, in
##   the settings). Its size is fixed in screen units (about 10 mm on a phone), so half a push is half a push; the
##   base follows the thumb only when it goes well past the edge.
## - Button side: SHOOT (big, in the corner, with a power ring while held), PASS, THROUGH, LOB and SPRINT. When
##   defending they become SLIDE, PRESS, SWITCH, TEAM PRESS / TACKLE and SPRINT, in another colour.
## - With the "flick to loft" setting on, PASS and THROUGH take a swipe: flick up off PASS for a lofted pass, up off
##   THROUGH for a lofted through ball (FC Mobile's gestures); such a button then waits COMMIT (80 ms) to see which
##   it is. Off (the default) they act on the touch, and LOB lofts.
## - A quick tap stays "down" for at least MIN_HOLD, so a tap between two game frames is never lost.
## - Swipes on the free part of the button side are skill gestures (swipe, double tap, zig-zag, V, circle).

const STICK_R := 92.0              # canvas units (the canvas is 720 high)
const KNOB_R := 40.0
const FOLLOW := 1.5                # the base follows the thumb past this many radii
const MIN_HOLD := 0.1              # seconds a tapped button stays down
const COMMIT := 0.08               # seconds a swipeable button waits to tell a tap from a flick
const FLICK := 34.0                # canvas units up that make a flick
const POWER_FULL := 0.5            # the engine shoots at the latest after half a second held
const STICK_ZONE := 0.45           # the stick lives on this share of the screen width
const TOP_SAFE := 90.0             # the score bar and pause button
const SWIPEABLE := ["pass", "through"]

var stick := Vector2.ZERO          # x right, y up, length 0..1
var stick_touch := -1
var stick_origin := Vector2.ZERO
var stick_pos := Vector2.ZERO
var stick_home := Vector2.ZERO
var buttons := {}                  # name -> {pos, r, held, touch, t_down, start, variant, commit}
var defending := false
var labels_attack := {"pass": "PASS", "shoot": "SHOOT", "through": "THROUGH", "lob": "LOB", "sprint": "SPRINT"}
var labels_defend := {"pass": "PRESS", "shoot": "SLIDE", "through": "SWITCH", "lob": "TACKLE", "sprint": "SPRINT"}
var font: Font
var size_k := 1.0
var opacity := 0.75
var fixed_stick := false
var left_handed := false
var flick_loft := false             # flick up off PASS / THROUGH lofts it; off: those buttons act on the touch, no wait
var sprint_button := true          # always shown now (edge sprint is an option in the game settings)
var vibrate := true
var swipes := {}                   # touch index -> {start, t0, path}
var gestures: Array = []           # [{kind, dir}] waiting for the input reader
var last_tap := {"t": -10.0, "pos": Vector2.ZERO}
var hint := ""
var hint_t := 0.0
var any_touch := false             # the screen was touched (input source goes back to touch)
var last_touch_t := -100.0
var active := true                 # set by the HUD: off under menus, pauses and replays (visible is only the look)
var u := 1.0


func configure(opts: Dictionary) -> void:
	size_k = clampf(float(opts.get("touch_size", 1.0)), 0.7, 1.4)
	opacity = clampf(float(opts.get("touch_opacity", 0.75)), 0.25, 1.0)
	vibrate = opts.get("vibration", true)
	fixed_stick = bool(opts.get("touch_fixed", false))
	left_handed = bool(opts.get("touch_left", false))
	flick_loft = bool(opts.get("flick_loft", false))
	if is_inside_tree():
		_layout()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_preset(Control.PRESET_FULL_RECT)
	font = get_theme_default_font()
	_layout()
	get_viewport().size_changed.connect(_layout)


func _process(_dt: float) -> void:
	var now := _now()
	var redraw := false
	for name in buttons:
		var b: Dictionary = buttons[name]
		# a swipeable button that was not flicked in time is a plain press
		if b["held"] and not b["commit"] and now - b["t_down"] >= COMMIT:
			b["commit"] = true
			redraw = true
		# taps shorter than MIN_HOLD: redraw when they end
		if not b["held"] and b["t_down"] > 0.0 and now - b["t_down"] >= MIN_HOLD + COMMIT:
			b["t_down"] = 0.0
			redraw = true
		if b["held"] and name == "shoot":
			redraw = true   # the power ring
	if redraw:
		queue_redraw()


## Game time from physics ticks (= real time on a phone): a tap lasts long enough in game frames even when frames
## come slowly.
func _now() -> float:
	return Engine.get_physics_frames() / float(Engine.physics_ticks_per_second)


func _side(v: Vector2) -> Vector2:
	# left-handed: everything mirrored across the screen
	return Vector2(get_viewport_rect().size.x - v.x, v.y) if left_handed else v


func _layout() -> void:
	var s := get_viewport_rect().size
	u = clampf(s.y / 720.0, 0.6, 1.6) * size_k
	var a := Vector2(s.x - 135.0 * u, s.y - 125.0 * u)
	_btn("shoot", _side(a + Vector2(0, -10) * u), 72.0 * u)
	_btn("pass", _side(a + Vector2(-168, 38) * u), 62.0 * u)
	_btn("through", _side(a + Vector2(-152, -150) * u), 52.0 * u)
	_btn("lob", _side(a + Vector2(0, -190) * u), 48.0 * u)
	_btn("sprint", _side(a + Vector2(-315, 58) * u), 54.0 * u)
	stick_home = _side(Vector2(200.0 * u, s.y - 180.0 * u))
	if stick_touch < 0:
		stick_origin = stick_home
		stick_pos = stick_home
	queue_redraw()


func _btn(name: String, pos: Vector2, r: float) -> void:
	var b: Dictionary = buttons.get(name, {"held": false, "touch": -1, "t_down": 0.0, "start": Vector2.ZERO,
		"variant": "", "commit": true})
	b["pos"] = pos
	b["r"] = r
	buttons[name] = b


## Down right now (a tap counts for MIN_HOLD). A swipeable button counts only once it knows tap from flick.
func held(name: String) -> bool:
	if not buttons.has(name):
		return false
	var b: Dictionary = buttons[name]
	if b["held"]:
		return b["commit"]
	return b["t_down"] > 0.0 and _now() - b["t_down"] < MIN_HOLD + COMMIT


## "up" when the press was a flick up (lofted pass / through ball), else "".
func variant(name: String) -> String:
	return buttons[name]["variant"] if buttons.has(name) else ""


## How long SHOOT has been held, 0..1 of a full-power shot.
func shot_power() -> float:
	var b: Dictionary = buttons.get("shoot", {})
	if b.is_empty() or not b["held"]:
		return 0.0
	return clampf((_now() - b["t_down"]) / POWER_FULL, 0.0, 1.0)


func take_gestures() -> Array:
	var g := gestures
	gestures = []
	return g


func release_all() -> void:
	for name in buttons:
		buttons[name]["held"] = false
		buttons[name]["touch"] = -1
		buttons[name]["t_down"] = 0.0
		buttons[name]["variant"] = ""
		buttons[name]["commit"] = true
	stick_touch = -1
	stick = Vector2.ZERO
	swipes.clear()
	_layout()


## The button under a finger: the nearest one within 1.3 radii.
func _on_button(pos: Vector2) -> String:
	var best := ""
	var best_d := INF
	for name in buttons:
		var b: Dictionary = buttons[name]
		var d: float = pos.distance_to(b["pos"]) / b["r"]
		if d < 1.3 and d < best_d:
			best = name
			best_d = d
	return best


func _in_stick_zone(p: Vector2) -> bool:
	var w := get_viewport_rect().size.x
	var x := w - p.x if left_handed else p.x
	return x < w * STICK_ZONE and p.y > TOP_SAFE


func _input(event: InputEvent) -> void:
	if not active:
		return
	# a touch always works and always brings the controls back, whatever the game thought was plugged in
	if event is InputEventScreenTouch and event.pressed and not visible:
		visible = true
	if event is InputEventScreenTouch:
		var e := event as InputEventScreenTouch
		if e.pressed and not e.canceled:
			any_touch = true
			last_touch_t = _now()
			var name := _on_button(e.position)
			if name != "":
				var b: Dictionary = buttons[name]
				if b["touch"] == -1:
					b["touch"] = e.index
					b["held"] = true
					b["t_down"] = _now()
					b["start"] = e.position
					b["variant"] = ""
					# only a button that can still become a flick waits COMMIT (80 ms) before it counts
					b["commit"] = not (flick_loft and name in SWIPEABLE and not defending)
					if vibrate and OS.has_feature("mobile"):
						Input.vibrate_handheld(12)
					queue_redraw()
				get_viewport().set_input_as_handled()
				return
			if _in_stick_zone(e.position) and stick_touch == -1:
				stick_touch = e.index
				stick_origin = stick_home if fixed_stick else e.position
				stick_pos = e.position if not fixed_stick else stick_home
				stick = Vector2.ZERO
				if fixed_stick:
					_move_stick(e.position)
				queue_redraw()
				get_viewport().set_input_as_handled()
			elif not _in_stick_zone(e.position) and e.position.y > TOP_SAFE:
				swipes[e.index] = {"start": e.position, "t0": _now(), "path": [e.position]}
		else:
			for name in buttons:
				var b: Dictionary = buttons[name]
				if b["touch"] == e.index:
					b["touch"] = -1
					b["held"] = false
					if not b["commit"]:
						# released before it knew: a tap (stays down MIN_HOLD from now)
						b["commit"] = true
						b["t_down"] = _now() - COMMIT
					queue_redraw()
			if e.index == stick_touch:
				stick_touch = -1
				stick = Vector2.ZERO
				stick_origin = stick_home
				stick_pos = stick_home
				queue_redraw()
			if swipes.has(e.index):
				if not e.canceled:
					_finish_swipe(swipes[e.index], e.position)
				swipes.erase(e.index)
	elif event is InputEventScreenDrag:
		var d := event as InputEventScreenDrag
		if d.index == stick_touch:
			_move_stick(d.position)
			get_viewport().set_input_as_handled()
			return
		for name in buttons:
			var b: Dictionary = buttons[name]
			if flick_loft and b["touch"] == d.index and b["held"] and name in SWIPEABLE and b["variant"] == "":
				var mv: Vector2 = d.position - b["start"]
				if -mv.y > FLICK * u and absf(mv.x) < -mv.y * 1.2:
					b["variant"] = "up"
					b["commit"] = true
					if vibrate and OS.has_feature("mobile"):
						Input.vibrate_handheld(8)
					queue_redraw()
				get_viewport().set_input_as_handled()
				return
		if swipes.has(d.index):
			var path: Array = swipes[d.index]["path"]
			if path.back().distance_to(d.position) > 10.0:
				path.append(d.position)


func _move_stick(p: Vector2) -> void:
	var r := STICK_R * u
	var v := p - stick_origin
	if not fixed_stick and v.length() > r * FOLLOW:
		stick_origin += v.normalized() * (v.length() - r * FOLLOW)
		v = p - stick_origin
	var k := v.limit_length(r)
	stick_pos = stick_origin + k
	stick = Vector2(k.x, -k.y) / r
	queue_redraw()


func _finish_swipe(sw: Dictionary, end: Vector2) -> void:
	var now := _now()
	var dur: float = now - sw["t0"]
	var start: Vector2 = sw["start"]
	var path: Array = sw["path"]
	path.append(end)
	var total := end - start
	var travelled := 0.0
	for i in range(1, path.size()):
		travelled += (path[i] - path[i - 1]).length()
	if travelled < 22.0 and dur < 0.3:
		# a tap: two quick taps make a double tap
		if now - last_tap["t"] < 0.33 and end.distance_to(last_tap["pos"]) < 90.0:
			_gesture("double", Vector2.ZERO)
			last_tap["t"] = -10.0
		else:
			last_tap = {"t": now, "pos": end}
		return
	if dur > 0.9 or travelled < 50.0:
		return
	# how much the path turns: a circle turns all the way round
	var turn := 0.0
	for i in range(2, path.size()):
		var a: Vector2 = path[i - 1] - path[i - 2]
		var b: Vector2 = path[i] - path[i - 1]
		if a.length() > 4.0 and b.length() > 4.0:
			turn += a.angle_to(b)
	if absf(turn) > PI * 1.5:
		_gesture("circle", Vector2.ZERO)
		return
	# out and back along one axis: zig-zag (sideways) or V (back then forward)
	var minx := start.x
	var maxx := start.x
	var miny := start.y
	var maxy := start.y
	for q in path:
		minx = minf(minx, q.x)
		maxx = maxf(maxx, q.x)
		miny = minf(miny, q.y)
		maxy = maxf(maxy, q.y)
	var out_x := maxf(maxx - start.x, start.x - minx)
	var back_x := maxf(maxx - end.x, end.x - minx)
	var out_y := maxf(maxy - start.y, start.y - miny)
	var back_y := maxf(maxy - end.y, end.y - miny)
	if out_x > 45.0 and back_x > 45.0 and absf(total.x) < out_x * 0.6 and out_x > out_y:
		var first := 1.0 if maxx - start.x > start.x - minx else -1.0
		_gesture("zigzag", Vector2(first, 0))
		return
	if out_y > 45.0 and back_y > 45.0 and absf(total.y) < out_y * 0.6:
		_gesture("vee", Vector2.ZERO)
		return
	_gesture("swipe", Vector2(total.x, -total.y))


func _gesture(kind: String, dir: Vector2) -> void:
	gestures.append({"kind": kind, "dir": dir})
	if vibrate and OS.has_feature("mobile"):
		Input.vibrate_handheld(18)


func _draw() -> void:
	var a := opacity
	var r := STICK_R * u
	var on := stick_touch >= 0
	# stick: base ring with direction ticks, and the knob (dimmed at its resting place when no thumb is on it)
	draw_circle(stick_origin, r, Color(0.02, 0.04, 0.08, (0.34 if on else 0.2) * a))
	draw_arc(stick_origin, r, 0, TAU, 64, Color(1, 1, 1, (0.55 if on else 0.3) * a), 3.0 * u, true)
	for k in 8:
		var dv := Vector2.from_angle(k * PI / 4.0)
		draw_line(stick_origin + dv * r * 0.86, stick_origin + dv * r * 0.97, Color(1, 1, 1, 0.22 * a), 2.0 * u, true)
	if on and stick.length() > 0.05:
		draw_line(stick_origin, stick_pos, Color(0.78, 1.0, 0.24, 0.35 * a), 6.0 * u, true)
	draw_circle(stick_pos, KNOB_R * u, Color(0.78, 1.0, 0.24, (0.92 if on else 0.42) * a))
	draw_circle(stick_pos, KNOB_R * u * 0.55, Color(1, 1, 1, 0.18 * a))
	draw_arc(stick_pos, KNOB_R * u, 0, TAU, 40, Color(0, 0, 0, 0.35 * a), 2.0 * u, true)
	# buttons
	var labels := labels_defend if defending else labels_attack
	for name in buttons:
		var b: Dictionary = buttons[name]
		var col := Color(1.0, 0.45, 0.2) if defending else Color(0.78, 1.0, 0.24)
		if name == "sprint":
			col = Color(0.35, 0.8, 1.0)
		var down: bool = held(name) or bool(b["held"])
		var rr: float = b["r"] * (1.06 if down else 1.0)
		var pos: Vector2 = b["pos"]
		# glass body, rim, inner shine
		draw_circle(pos, rr, Color(col.r, col.g, col.b, 0.92) if down else Color(0.03, 0.05, 0.1, 0.55 * a))
		draw_circle(pos + Vector2(0, -rr * 0.35), rr * 0.55, Color(1, 1, 1, (0.0 if down else 0.05) * a))
		draw_arc(pos, rr, 0, TAU, 56, Color(col.r, col.g, col.b, 0.95 * a), 3.0 * u, true)
		# SHOOT: power ring while held, the sweet spot marked
		if name == "shoot" and not defending:
			draw_arc(pos, rr + 7 * u, -PI * 0.5 + TAU * 0.5, -PI * 0.5 + TAU * 0.8, 24, Color(1, 1, 1, 0.18 * a), 3.0 * u, true)
			var pw := shot_power()
			if pw > 0.0:
				var pc := Color(0.78, 1.0, 0.24) if pw < 0.8 else Color(1.0, 0.55, 0.2)
				draw_arc(pos, rr + 7 * u, -PI * 0.5, -PI * 0.5 + TAU * pw, 48, pc, 6.0 * u, true)
		# PASS / THROUGH: a small chevron says "flick up"
		if flick_loft and name in SWIPEABLE and not defending:
			var cy := pos.y - rr * 0.62
			var cc := Color(0.04, 0.04, 0.04) if down else Color(1, 1, 1, 0.55 * a)
			if b["variant"] == "up":
				cc = Color(0.04, 0.04, 0.04)
			draw_polyline(PackedVector2Array([pos + Vector2(-9, 5) * u - Vector2(0, pos.y - cy), pos + Vector2(0, -3) * u - Vector2(0, pos.y - cy),
				pos + Vector2(9, 5) * u - Vector2(0, pos.y - cy)]), cc, 2.5 * u, true)
		var txt: String = labels.get(name, name.to_upper())
		if b["variant"] == "up" and down:
			txt = "LOB PASS" if name == "pass" else "LOB THRU"
		var fs := int(clampf(rr * 0.3, 14.0, 26.0 * u))
		var w := font.get_string_size(txt, HORIZONTAL_ALIGNMENT_CENTER, -1, fs).x
		draw_string(font, pos + Vector2(-w * 0.5, fs * 0.38), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs,
			Color(0.04, 0.04, 0.04) if down else Color(1, 1, 1, maxf(a, 0.6)))


func set_defending(d: bool) -> void:
	if d != defending:
		defending = d
		queue_redraw()


## Always on screen during play (the user kept losing them: phone parts that report themselves as game pads).
## Only the "hide with a controller" setting hides them, while a real pad is in use and the screen is untouched.
var hide_with_pad := false

func should_show() -> bool:
	return not (hide_with_pad and Pad.in_use(10.0) and _now() - last_touch_t > 10.0)
