class_name Motion
extends RefCounted
## The menus' motion, in one place: the broadcast stinger between screens, plates sliding in one after another,
## buttons that give under the thumb. Everything moves through the Control offset transform (Godot 4.7), which
## containers leave alone, so the layout never jumps.

const NAVY := Color("0b1638")


## A button sinks under the thumb and springs back.
static func press(b: Control) -> void:
	b.offset_transform_enabled = true
	b.offset_transform_pivot_ratio = Vector2(0.5, 0.5)
	var bd := func():
		var tw := b.create_tween()
		tw.tween_property(b, "offset_transform_scale", Vector2(0.94, 0.94), 0.07).set_ease(Tween.EASE_OUT)
	var bu := func():
		var tw := b.create_tween()
		tw.tween_property(b, "offset_transform_scale", Vector2.ONE, 0.32).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	b.button_down.connect(bd)
	b.button_up.connect(bu)


## The screen's buttons slide in from the right one after another (top-left first), fading up.
static func reveal(root: Control) -> void:
	var items: Array[Control] = []
	_collect(root, items)
	items.sort_custom(func(p: Control, q: Control) -> bool:
		var a := p.global_position
		var c := q.global_position
		return a.y * 3.0 + a.x < c.y * 3.0 + c.x)
	var i := 0
	for c in items:
		c.offset_transform_enabled = true
		c.offset_transform_position = Vector2(90, 0)
		c.modulate.a = 0.0
		var d := minf(i * 0.035, 0.4)
		var tw := c.create_tween().set_parallel(true)
		tw.tween_property(c, "offset_transform_position", Vector2.ZERO, 0.55).set_delay(d).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_OUT)
		tw.tween_property(c, "modulate:a", 1.0, 0.3).set_delay(d)
		i += 1


static func _collect(n: Node, out: Array[Control]) -> void:
	for ch in n.get_children():
		if ch is Button and (ch as Control).visible:
			out.append(ch)
		elif ch is Control:
			_collect(ch, out)


## The broadcast stinger: three slanted bars (navy, gold, red) that cover the screen and race off to the left,
## revealing the new screen behind them.
static func stinger(host: Node) -> void:
	var vp := host.get_viewport()
	if vp == null:
		return
	var sz := vp.get_visible_rect().size
	var layer := CanvasLayer.new()
	layer.layer = 30
	host.add_child(layer)
	var bars := [[NAVY, 1.0, 0.0], [UI.BRASS, 0.05, 0.05], [UI.TICKET, 0.09, 0.08]]   # colour, width (of screen), delay
	var x := 0.0
	for spec in bars:
		var col: Color = spec[0]
		var bw: float = sz.x * float(spec[1]) + sz.y * 0.35
		var p := Polygon2D.new()
		var lean := sz.y * 0.35
		p.polygon = PackedVector2Array([Vector2(lean, 0), Vector2(lean + bw, 0), Vector2(bw, sz.y), Vector2(0, sz.y)])
		p.color = col
		p.position = Vector2(x - lean, 0)
		layer.add_child(p)
		var tw := p.create_tween()
		tw.tween_interval(float(spec[2]))
		tw.tween_property(p, "position:x", -bw - 40.0, 0.34).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN)
		x += bw - lean * 0.6
	var done := layer.create_tween()
	done.tween_interval(0.5)
	done.tween_callback(layer.queue_free)


const SHEEN := """shader_type canvas_item;
// a band of light sweeping across a slanted plate every few seconds, kept inside the plate's lean
uniform vec2 px = vec2(400.0, 200.0);
uniform float skew = -0.16;
uniform float period = 5.0;
uniform float phase = 0.0;
void fragment() {
	vec2 p = UV * px;
	float lean = -skew * (p.y - px.y * 0.5);          // StyleBoxFlat.skew moves each row by skew * (row - middle)
	float x = p.x - lean;
	float inside = step(0.0, x) * step(x, px.x);
	float t = fract((TIME + phase) / period) * 2.2 - 0.6;    // across in the first part of the period, then rest
	float band = (x / px.x) + (p.y / px.y) * 0.35 - t * 1.4;
	float a = exp(-band * band * 90.0) * 0.16 + exp(-band * band * 900.0) * 0.12;
	COLOR = vec4(1.0, 0.97, 0.88, a * inside);
}
"""
static var _sheen_shader: Shader


## A sweep of light across a plate now and then (the big Kick off plate, Start), like a foil card catching light.
static func sheen(plate: Control, phase: float = 0.0) -> void:
	if _sheen_shader == null:
		_sheen_shader = Shader.new()
		_sheen_shader.code = SHEEN
	var r := ColorRect.new()
	r.set_anchors_preset(Control.PRESET_FULL_RECT)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = _sheen_shader
	m.set_shader_parameter("skew", UI.SKEW)
	m.set_shader_parameter("phase", phase)
	r.material = m
	r.resized.connect(func(): m.set_shader_parameter("px", r.size))
	plate.add_child(r)
