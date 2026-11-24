class_name UI
extends RefCounted
## Shared look for every menu: colours, panels, buttons, rows (toggle / choice / slider), headers, lists.

## "Matchday ticket": a night pitch under floodlights, chalk lines, the red of a ticket stub, the brass of a trophy.
const PITCH := Color("0f3d2e")               # night pitch green: panels and cards
const TURF := Color("072619")                # the deep stripe: wells, notches, text on light fills
const CHALK := Color("edefe6")               # touchline chalk: text
const TICKET := Color("c8102e")              # ticket red: the one action on a screen (Play, Start)
const BRASS := Color("e0b43a")               # trophy brass: what is selected or focused, stars, values
const NILE := Color("2fa39a")                # river teal: a second colour for the career / info
const ACCENT := BRASS
const CYAN := NILE
const FLARE := Color("e8742c")               # warning / tired
const INK := TURF
const PANEL := Color(PITCH.r, PITCH.g, PITCH.b, 0.93)
const PANEL_2 := Color("15513d")
const MUTED := Color("a9c2b3")
const GOOD := Color(0.35, 0.9, 0.5)
const BAD := Color(1.0, 0.35, 0.35)

static var _font: Font


static func font() -> Font:
	if _font == null:
		_font = load("res://assets/fonts/Changa-AFC.ttf")
	return _font


static func style(bg: Color, border: Color = Color(0, 0, 0, 0), radius: int = 8, pad: int = 12) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(2 if border.a > 0 else 0)
	s.set_corner_radius_all(radius)
	s.content_margin_left = pad
	s.content_margin_right = pad
	s.content_margin_top = pad * 0.5
	s.content_margin_bottom = pad * 0.5
	if bg.a > 0.5:
		s.shadow_color = Color(0, 0, 0, 0.35)
		s.shadow_size = 6
		s.shadow_offset = Vector2(0, 3)
	return s


## A slanted card (the FC menu look): skewed panel, optional coloured edge on the left.
static func card(bg: Color, edge: Color = Color(0, 0, 0, 0), skew: float = 0.0, radius: int = 8) -> StyleBoxFlat:
	var s := style(bg, Color(1, 1, 1, 0.08), radius, 16)
	s.skew = Vector2(skew, 0)
	if edge.a > 0:
		s.border_color = edge
		s.border_width_left = 6
		s.border_width_top = 0
		s.border_width_right = 0
		s.border_width_bottom = 0
	return s


## The ticket: a card with a perforated tear line `stub` px from its right edge, half-circle notches where the line
## meets the top and bottom edges (cut in `notch` colour, the page behind), and corner notches like a printed stub.
static func ticket_art(stub: float, notch: Color = TURF, line: Color = Color(CHALK.r, CHALK.g, CHALK.b, 0.35)) -> Control:
	var c := Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.draw.connect(func():
		var w := c.size.x
		var h := c.size.y
		if stub > 0.0 and w - stub >= 320.0:   # a narrow card has no room for a stub: no tear line
			var x := w - stub
			var y := 16.0
			while y < h - 16.0:
				c.draw_line(Vector2(x, y), Vector2(x, minf(y + 7.0, h - 16.0)), line, 2.0)
				y += 13.0
			c.draw_circle(Vector2(x, 0.0), 11.0, notch)
			c.draw_circle(Vector2(x, h), 11.0, notch))
	return c


## A vertical gradient strip as a texture (for backgrounds and card fills).
static func gradient_rect(top: Color, bottom: Color, angle_deg: float = 90.0) -> TextureRect:
	var g := Gradient.new()
	g.set_color(0, top)
	g.set_color(1, bottom)
	var gt := GradientTexture2D.new()
	gt.gradient = g
	gt.width = 64
	gt.height = 64
	var a := deg_to_rad(angle_deg)
	gt.fill_from = Vector2(0.5 - cos(a) * 0.5, 0.5 - sin(a) * 0.5)
	gt.fill_to = Vector2(0.5 + cos(a) * 0.5, 0.5 + sin(a) * 0.5)
	var r := TextureRect.new()
	r.texture = gt
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_SCALE
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r


static func label(text: String, size: int = 20, color: Color = Color(1, 1, 1)) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


## "KICK OFF" -> "Kick off": headings in sentence case (shouting capitals read as a template).
static func sentence(text: String) -> String:
	if text != text.to_upper() or text.strip_edges().length() <= 3:
		return text   # already mixed case, or an abbreviation (GK, OK, 4-3-3)
	var s := text.to_lower()
	return s.substr(0, 1).to_upper() + s.substr(1)


static func caption(text: String) -> Label:
	var l := label(text, 16, MUTED)
	return l


static func button(text: String, cb: Callable, min_size: Vector2 = Vector2(0, 56), kind: String = "normal", font_size: int = 22) -> Button:
	var b := Button.new()
	b.text = sentence(text)
	b.custom_minimum_size = min_size
	b.add_theme_font_size_override("font_size", font_size)
	b.focus_mode = Control.FOCUS_ALL
	var bg := PANEL_2
	var fg := CHALK
	var border := Color(CHALK.r, CHALK.g, CHALK.b, 0.18)
	match kind:
		"accent":
			bg = TICKET
			fg = CHALK
			border = TICKET
		"flare":
			bg = FLARE
			fg = INK
			border = FLARE
		"ghost":
			bg = Color(0, 0, 0, 0.25)
			border = Color(1, 1, 1, 0.12)
		"danger":
			bg = Color(0.35, 0.08, 0.1, 0.95)
			border = BAD
	b.add_theme_stylebox_override("normal", style(bg, border))
	b.add_theme_stylebox_override("hover", style(bg.lightened(0.1), BRASS))
	b.add_theme_stylebox_override("pressed", style(bg.darkened(0.2), BRASS))
	b.add_theme_stylebox_override("focus", style(Color(0, 0, 0, 0), BRASS))
	b.add_theme_stylebox_override("disabled", style(Color(bg.r, bg.g, bg.b, 0.35), Color(1, 1, 1, 0.06)))
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(k, fg)
	b.add_theme_color_override("font_disabled_color", Color(fg.r, fg.g, fg.b, 0.4))
	b.pressed.connect(cb)
	return b


static func panel(bg: Color = PANEL, border: Color = Color(1, 1, 1, 0.1), radius: int = 12, pad: int = 16) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", style(bg, border, radius, pad))
	return p


static func vbox(sep: int = 10) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	return v


static func hbox(sep: int = 10) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	return h


static func spacer(w: float = 0.0, h: float = 0.0, expand: bool = false) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(w, h)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if expand:
		c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return c


static func scroll(child: Control) -> ScrollContainer:
	var s := ScrollContainer.new()
	s.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	s.size_flags_vertical = Control.SIZE_EXPAND_FILL
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	child.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.add_child(child)
	return s


static func chip(c: Color, w: float = 10.0, h: float = 30.0) -> ColorRect:
	var r := ColorRect.new()
	r.color = c
	r.custom_minimum_size = Vector2(w, h)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r


static func stars(n: int, of: int = 5, size: int = 18) -> Label:
	return label("★".repeat(n) + "☆".repeat(maxi(0, of - n)), size, ACCENT)


## A screen header: back button, title, optional right-hand widget.
static func header(title: String, back: Callable, right: Control = null) -> HBoxContainer:
	var h := hbox(16)
	if back.is_valid():
		h.add_child(button("◀  Back", back, Vector2(150, 54), "ghost", 20))
	var t := label(sentence(title), 36, CHALK)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	t.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	h.add_child(t)
	if right:
		h.add_child(right)
	return h


## "Name ........ [◀ value ▶]" — cycles through `items`; on_change(index).
static func choice_row(title: String, items: Array, index: int, on_change: Callable) -> HBoxContainer:
	var h := hbox(10)
	var t := label(title, 20)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(t)
	var val := label(str(items[index]), 20, ACCENT)
	val.custom_minimum_size = Vector2(190, 0)
	val.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var state := [index]
	var step := func(d: int) -> void:
		state[0] = (state[0] + d + items.size()) % items.size()
		val.text = str(items[state[0]])
		on_change.call(state[0])
	h.add_child(button("◀", func(): step.call(-1), Vector2(52, 48), "ghost", 18))
	h.add_child(val)
	h.add_child(button("▶", func(): step.call(1), Vector2(52, 48), "ghost", 18))
	return h


static func toggle_row(title: String, on: bool, on_change: Callable) -> HBoxContainer:
	var h := hbox(10)
	var t := label(title, 20)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(t)
	var b := Button.new()
	b.toggle_mode = true
	b.button_pressed = on
	b.custom_minimum_size = Vector2(110, 46)
	b.add_theme_font_size_override("font_size", 18)
	b.focus_mode = Control.FOCUS_ALL
	var paint := func(v: bool) -> void:
		b.text = "On" if v else "Off"
		var bg := BRASS if v else PANEL_2
		b.add_theme_stylebox_override("normal", style(bg, Color(1, 1, 1, 0.16)))
		b.add_theme_stylebox_override("pressed", style(bg, ACCENT))
		b.add_theme_stylebox_override("hover", style(bg.lightened(0.1), ACCENT))
		b.add_theme_stylebox_override("hover_pressed", style(bg.lightened(0.1), ACCENT))
		b.add_theme_stylebox_override("focus", style(Color(0, 0, 0, 0), ACCENT))
		for k in ["font_color", "font_pressed_color", "font_hover_color", "font_hover_pressed_color", "font_focus_color"]:
			b.add_theme_color_override(k, INK if v else Color(1, 1, 1))
	paint.call(on)
	b.toggled.connect(func(v: bool): paint.call(v); on_change.call(v))
	h.add_child(b)
	return h


static func slider_row(title: String, value: float, on_change: Callable, lo: float = 0.0, hi: float = 1.0) -> HBoxContainer:
	var h := hbox(10)
	var t := label(title, 20)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(t)
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = (hi - lo) / 20.0
	s.value = value
	s.custom_minimum_size = Vector2(300, 40)
	s.value_changed.connect(on_change)
	h.add_child(s)
	return h


## A horizontal row of mutually exclusive pills; on_pick(index).
static func pills(items: Array, index: int, on_pick: Callable, font_size: int = 18) -> HBoxContainer:
	var h := hbox(6)
	var btns: Array[Button] = []
	for i in items.size():
		var b := button(str(items[i]), func(): pass, Vector2(0, 48), "normal", font_size)
		if i == index:
			b.add_theme_stylebox_override("normal", style(BRASS, BRASS))
			for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
				b.add_theme_color_override(k, INK)
		btns.append(b)
		h.add_child(b)
	for i in btns.size():
		btns[i].pressed.connect(func():
			for j in btns.size():
				var on := j == i
				var bg := BRASS if on else PANEL_2
				btns[j].add_theme_stylebox_override("normal", style(bg, BRASS if on else Color(CHALK.r, CHALK.g, CHALK.b, 0.18)))
				for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
					btns[j].add_theme_color_override(k, INK if on else CHALK)
			on_pick.call(i))
	return h


## A filled bar (stamina, ratings).
static func bar(v: float, w: float = 90.0, h: float = 8.0, col: Color = ACCENT) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(w, h)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.draw.connect(func():
		c.draw_rect(Rect2(Vector2.ZERO, c.size), Color(1, 1, 1, 0.12))
		var cc := col if v > 0.45 else (FLARE if v > 0.25 else BAD)
		c.draw_rect(Rect2(Vector2.ZERO, Vector2(c.size.x * clampf(v, 0.0, 1.0), c.size.y)), cc))
	return c


## Full-screen dimmer + centred panel for overlays.
static func overlay(width: float = 760.0, height: float = 560.0) -> Array:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.55)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(dim)
	var p := panel(Color(PITCH.r, PITCH.g, PITCH.b, 0.98), Color(CHALK.r, CHALK.g, CHALK.b, 0.35), 10, 20)
	p.set_anchors_preset(Control.PRESET_CENTER)
	p.custom_minimum_size = Vector2(width, height)
	p.position = Vector2(-width * 0.5, -height * 0.5)
	p.size = Vector2(width, height)
	root.add_child(p)
	return [root, p]


static func role_color(role: String) -> Color:
	match role:
		"GK":
			return Color(1.0, 0.75, 0.2)
		"DEF":
			return Color(0.3, 0.7, 1.0)
		"MID":
			return Color(0.4, 0.9, 0.45)
	return Color(1.0, 0.4, 0.35)


static func kit_color(club_index: int) -> Color:
	return KitPainter.hex(GameData.CLUBS[club_index]["kit"]["shirt"])


## A club crest: shield shape in the club colours with the short name.
static func crest(club_index: int, size: float = 64.0) -> Control:
	var c: Dictionary = GameData.CLUBS[club_index]
	var col := KitPainter.hex(c["kit"]["shirt"])
	var col2 := KitPainter.hex(c["kit"].get("shirt2", c["kit"]["shirt"]))
	if col2 == col:
		col2 = KitPainter.hex(c["kit"].get("shorts", 0xffffff))
	var ctl := Control.new()
	ctl.custom_minimum_size = Vector2(size, size * 1.15)
	ctl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var short: String = c["short"]
	ctl.draw.connect(func():
		var w := ctl.size.x
		var h := ctl.size.y
		var pts := PackedVector2Array([Vector2(w * 0.06, h * 0.05), Vector2(w * 0.94, h * 0.05), Vector2(w * 0.94, h * 0.55),
			Vector2(w * 0.5, h * 0.97), Vector2(w * 0.06, h * 0.55)])
		ctl.draw_colored_polygon(pts, col2)
		var inner := PackedVector2Array()
		for q in pts:
			inner.append(Vector2(w * 0.5, h * 0.5) + (q - Vector2(w * 0.5, h * 0.5)) * 0.84)
		ctl.draw_colored_polygon(inner, col)
		var f := font()
		var fs := int(w * 0.26)
		var tw := f.get_string_size(short, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
		var ink := Color(0.05, 0.05, 0.08) if col.get_luminance() > 0.55 else Color(1, 1, 1)
		ctl.draw_string(f, Vector2((w - tw) * 0.5, h * 0.52), short, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, ink))
	return ctl
