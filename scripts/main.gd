extends Node
## AFC: title, menus (kick off, career, cup, skill games, squads, skills catalogue, controls, settings) and matches.
## A CPU v CPU match plays behind the menus.

var match_view: MatchView
var ui: CanvasLayer
var screen: Control
var nav: Array[Callable] = []          # back stack of screen builders
var current: Callable
var context := {}                       # what the running match is: {type: friendly / career / cup / practice, config}
var sel_club := 0                       # club shown in the squad screen
var squad_pick := -1                    # squad screen: selected squad index
var career_tab := "table"


func _ready() -> void:
	ui = CanvasLayer.new()
	ui.layer = 10
	add_child(ui)
	_start_demo()
	_go(_title, false)


# ------------------------------------------------------------------ navigation

func _go(builder: Callable, push: bool = true) -> void:
	if push and current.is_valid():
		nav.append(current)
	current = builder
	builder.call()


func _back() -> void:
	if nav.is_empty():
		_go(_home, false)
		return
	var b: Callable = nav.pop_back()
	current = b
	b.call()


func _home_reset() -> void:
	nav.clear()
	_go(_home, false)


func _set_screen(c: Control) -> void:
	if screen:
		screen.queue_free()
	screen = c
	if c:
		ui.add_child(c)


const STREAKS := """shader_type canvas_item;
void fragment() {
	float d = UV.x * 0.9 - UV.y * 0.55;
	float b1 = smoothstep(0.09, 0.0, abs(d - 0.6)) * 0.09;
	float b2 = smoothstep(0.025, 0.0, abs(d - 0.69)) * 0.1;
	float b3 = smoothstep(0.16, 0.0, abs(d - 0.95)) * 0.06;
	vec3 c = vec3(0.2, 0.86, 0.95) * (b1 + b3) + vec3(0.78, 1.0, 0.24) * b2;
	float a = b1 + b2 + b3;
	COLOR = vec4(c / max(a, 0.001), a);
}
"""
static var _streak_mat: ShaderMaterial


## Every menu sits on the live match behind it: a night-blue wash (darker top-left) and two soft light streaks.
func _base(dim: float = 0.55) -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	var wash := UI.gradient_rect(Color(0.01, 0.02, 0.06, minf(dim + 0.3, 0.96)), Color(0.02, 0.07, 0.13, dim * 0.75), 30.0)
	wash.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(wash)
	if _streak_mat == null:
		_streak_mat = ShaderMaterial.new()
		var sh := Shader.new()
		sh.code = STREAKS
		_streak_mat.shader = sh
	var streak := ColorRect.new()
	streak.set_anchors_preset(Control.PRESET_FULL_RECT)
	streak.mouse_filter = Control.MOUSE_FILTER_IGNORE
	streak.material = _streak_mat
	root.add_child(streak)
	return root


## Standard page: header + content area with margins.
func _page(title: String, right: Control = null) -> Array:
	var root := _base(0.72)
	var vb := UI.vbox(14)
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 36
	vb.offset_right = -36
	vb.offset_top = 22
	vb.offset_bottom = -18
	vb.add_child(UI.header(title, _back, right))
	root.add_child(vb)
	return [root, vb]


func _opts() -> Dictionary:
	return Profile.data["settings"].duplicate(true)


# ------------------------------------------------------------------ matches

func _clear_match() -> void:
	if match_view:
		match_view.queue_free()
		match_view = null


func _start_demo() -> void:
	_clear_match()
	match_view = MatchView.new()
	add_child(match_view)
	var h := randi() % GameData.CLUBS.size()
	var a := (h + 1 + randi() % (GameData.CLUBS.size() - 1)) % GameData.CLUBS.size()
	var o := _opts()
	o["replays"] = false
	match_view.start({"home": h, "away": a, "human_team": -1, "half_minutes": 20.0, "difficulty": 0.7, "camera": "tele",
		"edits": Profile.squads(), "opts": o})
	match_view.hud.visible = false
	match_view.sfx.crowd(0.15)


func _match_config(home: int, away: int, human: int) -> Dictionary:
	var s: Dictionary = Profile.data["settings"]
	return {"home": home, "away": away, "human_team": human,
		"half_minutes": SettingsPanel.HALF_VALUES[clampi(int(s["half"]), 0, SettingsPanel.HALF_VALUES.size() - 1)],
		"difficulty": SettingsPanel.DIFF_VALUES[clampi(int(s["difficulty"]), 0, SettingsPanel.DIFF_VALUES.size() - 1)],
		"level": clampi(int(s["difficulty"]), 0, SettingsPanel.DIFF_VALUES.size() - 1),
		"camera": SettingsPanel.CAMS[clampi(int(s["camera"]), 0, SettingsPanel.CAMS.size() - 1)],
		"edits": Profile.squads(), "pad": Profile.data["pad"].duplicate(), "opts": _opts()}


func _play(config: Dictionary, ctx: Dictionary) -> void:
	context = ctx
	context["config"] = config
	_clear_match()
	_set_screen(null)
	# 11-a-side matches (kick off, career, cup) are played by the football engine (Google Research Football, native)
	context["swapped"] = false
	if ["friendly", "career", "cup"].has(ctx.get("type", "friendly")) and not config.get("street", false) and EngineMatchView.can_play():
		var ec := config.duplicate()
		if int(ec.get("human_team", 0)) == 1:
			# the engine's human always plays on its first team: swap the clubs round (and the result back after)
			ec["home"] = config["away"]
			ec["away"] = config["home"]
			ec["human_team"] = 0
			context["swapped"] = true
		match_view = EngineMatchView.new()
		add_child(match_view)
		match_view.start(ec)
	else:
		match_view = MatchView.new()
		add_child(match_view)
		match_view.start(config)
	match_view.finished.connect(_on_match_finished)
	match_view.quit_to_menu.connect(_on_match_quit)


func _on_match_finished(r: Dictionary) -> void:
	if r.get("restart", false):
		_play(context["config"], context)
		return
	if context.get("swapped", false) and r.has("score"):
		# back to the fixture's home / away order
		r = r.duplicate(true)
		r["score"] = [r["score"][1], r["score"][0]]
		for sc in r.get("scorers", []):
			sc["team"] = 1 - int(sc["team"])
		if r.has("appeared"):
			r["appeared"] = [r["appeared"][1], r["appeared"][0]]
		var h = r.get("home")
		r["home"] = r.get("away")
		r["away"] = h
	var t: String = context.get("type", "friendly")
	match t:
		"career":
			_career_result(r)
		"cup":
			_cup_result(r)
		"scenario":
			_scenario_result(r)
		_:
			_start_demo()
			_home_reset()


## The match has ended (or, with `or_break`, is at a half-time / full-time screen where a pause menu does not belong).
## The native engine's view has no `sim`: it keeps its own full_time flag.
func _match_over(or_break: bool = false) -> bool:
	if match_view == null or not is_instance_valid(match_view):
		return true
	if match_view is EngineMatchView:
		return match_view.full_time   # its half-time screen already sets paused
	if match_view.ended or match_view.sim.phase == "fulltime":
		return true
	return or_break and match_view.sim.phase == "halftime"


func _on_match_quit() -> void:
	var t: String = context.get("type", "friendly")
	var forfeit: Array = [0, 3] if context["config"]["human_team"] == 0 else [3, 0]
	if t == "career" and match_view and not _match_over():
		_career_result({"score": forfeit, "scorers": []})
		return
	if t == "cup" and match_view and not _match_over():
		_cup_result({"score": forfeit})
		return
	if t == "career":
		_career_result(match_view.result())
		return
	if t == "cup":
		_cup_result(match_view.result())
		return
	if t == "scenario":
		_start_demo()
		nav.clear()
		nav.append(_home)
		_go(_challenges, false)
		return
	_start_demo()
	_home_reset()


# ------------------------------------------------------------------ title + home

func _logo(size: int) -> Control:
	var hb := HBoxContainer.new()
	hb.alignment = BoxContainer.ALIGNMENT_CENTER
	# the badge is a ticket stub: red, chalk letters, a brass rule under the name
	var p := PanelContainer.new()
	var st := UI.style(UI.TICKET, Color(0, 0, 0, 0), 6, int(size * 0.3))
	st.border_color = UI.BRASS
	st.border_width_bottom = maxi(3, int(size * 0.06))
	p.add_theme_stylebox_override("panel", st)
	p.add_child(UI.label("AFC", size, UI.CHALK))
	hb.add_child(p)
	return hb


func _title() -> void:
	var root := _base(0.35)
	# the title is a match ticket: the name and the night's fixture on the left, START is the stub you tear off
	const TW := 820.0
	const TH := 300.0
	const STUB := 250.0
	var ticket := PanelContainer.new()
	var ts := UI.style(Color(UI.PITCH.r, UI.PITCH.g, UI.PITCH.b, 0.96), Color(0, 0, 0, 0), 10, 0)
	ts.border_color = UI.TICKET
	ts.border_width_left = 14
	ticket.add_theme_stylebox_override("panel", ts)
	ticket.anchor_left = 0.0
	ticket.anchor_right = 0.0
	ticket.anchor_top = 0.5
	ticket.anchor_bottom = 0.5
	ticket.offset_left = 70
	ticket.offset_right = 70 + TW
	ticket.offset_top = -TH * 0.5
	ticket.offset_bottom = TH * 0.5
	root.add_child(ticket)
	var inner := Control.new()
	inner.custom_minimum_size = Vector2(TW, TH)
	ticket.add_child(inner)
	inner.add_child(UI.ticket_art(STUB, Color(0.02, 0.1, 0.07, 1.0)))
	var left := UI.vbox(14)
	left.position = Vector2(46, 0)
	left.size = Vector2(TW - STUB - 80, TH)
	left.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.add_child(left)
	var name_l := UI.label("AFC", 96, UI.CHALK)
	left.add_child(name_l)
	var rule := ColorRect.new()
	rule.color = UI.BRASS
	rule.custom_minimum_size = Vector2(120, 6)
	rule.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	left.add_child(rule)
	left.add_child(UI.label("Football in your hands. No internet needed.", 22, UI.MUTED))
	var start := UI.button("Start", func(): _go(_home), Vector2(STUB - 60, 120), "accent", 34)
	start.position = Vector2(TW - STUB + 30, (TH - 120) * 0.5)
	start.size = Vector2(STUB - 60, 120)
	inner.add_child(start)
	# the user's club in the hero shot
	var hc: Dictionary = Profile.data["career"]
	var club_i := int(hc.get("club", 0)) if not hc.is_empty() else 0
	var hero := HeroPlayer.new().setup(GameData.CLUBS[club_i]["kit"], 10, Vector2i(380, 560), -28.0)
	hero.anchor_left = 1.0
	hero.anchor_right = 1.0
	hero.anchor_top = 0.5
	hero.anchor_bottom = 0.5
	hero.offset_left = -470
	hero.offset_right = -90
	hero.offset_top = -300
	hero.offset_bottom = 260
	root.add_child(hero)
	var credit := UI.label("v%s   match engine %s" % [str(ProjectSettings.get_setting("application/config/version", "")), "ON" if EngineMatchView.can_play() else "OFF:  " + EngineMatchView.load_error()], 14, Color(1, 1, 1, 0.5) if EngineMatchView.can_play() else Color(1, 0.4, 0.35))
	credit.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	credit.position = Vector2(16, -34)
	root.add_child(credit)
	_set_screen(root)
	start.grab_focus()


func _tile(title: String, sub: String, cb: Callable, size: Vector2, accent: bool = false) -> Button:
	var b := UI.button("", cb, size, "accent" if accent else "normal")
	var bg := UI.PANEL_2 if accent else UI.PITCH
	var edge := UI.BRASS if accent else UI.NILE
	b.add_theme_stylebox_override("normal", UI.card(bg, edge))
	b.add_theme_stylebox_override("hover", UI.card(bg.lightened(0.08), UI.ACCENT))
	b.add_theme_stylebox_override("pressed", UI.card(bg.darkened(0.15), UI.ACCENT))
	var fs := UI.card(Color(0, 0, 0, 0), UI.ACCENT)
	fs.border_width_top = 2
	fs.border_width_bottom = 2
	fs.border_width_right = 2
	fs.shadow_size = 0
	b.add_theme_stylebox_override("focus", fs)
	var vb := UI.vbox(2)
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 18
	vb.offset_top = 12
	vb.offset_right = -14
	vb.offset_bottom = -10
	vb.alignment = BoxContainer.ALIGNMENT_END
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var t := UI.label(UI.sentence(title), 28 if size.y > 150 else 24, UI.CHALK)
	vb.add_child(t)
	var s := UI.label(sub, 16, UI.MUTED)
	s.autowrap_mode = TextServer.AUTOWRAP_WORD
	vb.add_child(s)
	b.add_child(vb)
	return b


# ------------------------------------------------------------------ home: FC-style hub

const TABS := [["HOME", "_home"], ["PLAY", "_play_hub"], ["CAREER", "_career"], ["CLUB", "_club_hub"], ["SETTINGS", "_settings"]]   # keys; shown in sentence case


## The top bar of the hub screens: logo, tabs (the active one underlined), engine status.
func _topbar(active: String) -> Control:
	var bar := UI.hbox(6)
	bar.custom_minimum_size = Vector2(0, 58)
	bar.add_child(_logo(30))
	bar.add_child(UI.spacer(26))
	for tb in TABS:
		var name: String = tb[0]
		var fn := Callable(self, tb[1])
		var on := name == active
		var b := Button.new()
		b.text = UI.sentence(name)
		b.focus_mode = Control.FOCUS_ALL
		b.custom_minimum_size = Vector2(128, 54)
		b.add_theme_font_size_override("font_size", 23)
		b.add_theme_color_override("font_color", UI.CHALK if on else UI.MUTED)
		for k in ["font_hover_color", "font_focus_color", "font_pressed_color"]:
			b.add_theme_color_override(k, UI.BRASS)
		for st_name in ["normal", "hover", "pressed", "focus"]:
			var sb := StyleBoxFlat.new()
			sb.bg_color = Color(1, 1, 1, 0.06) if st_name == "hover" else Color(0, 0, 0, 0)
			sb.border_color = UI.ACCENT if (on or st_name == "focus") else Color(0, 0, 0, 0)
			sb.border_width_bottom = 4
			sb.set_corner_radius_all(4)
			b.add_theme_stylebox_override(st_name, sb)
		b.pressed.connect(func():
			nav.clear()
			if name != "HOME":
				nav.append(_home)
			_go(fn, false))
		bar.add_child(b)
	bar.add_child(UI.spacer(0, 0, true))
	var ok := EngineMatchView.can_play()
	var pill := UI.panel(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 4)
	pill.add_child(UI.label(("Engine on" if ok else "Engine off") + ", v" + str(ProjectSettings.get_setting("application/config/version", "")), 15, UI.MUTED if ok else UI.BAD))
	var pv := VBoxContainer.new()
	pv.alignment = BoxContainer.ALIGNMENT_CENTER
	pv.add_child(pill)
	bar.add_child(pv)
	return bar


## A hub card: dark rounded panel, a diagonal wash of its colour, live 3D art on the right, big title bottom-left.
func _card(title: String, sub: String, cb: Callable, col: Color, art: Control = null, big: bool = false, cta: String = "Play  ▶") -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_ALL
	b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	b.size_flags_vertical = Control.SIZE_EXPAND_FILL
	b.clip_contents = true
	# a match ticket: pitch-green card, the mode's colour as the band down the left edge, a perforated tear line
	# with notches in front of the stub that holds the 3D art
	var bg := UI.PITCH
	for st_name in ["normal", "hover", "pressed", "focus"]:
		var sb := StyleBoxFlat.new()
		sb.bg_color = bg.lightened(0.05) if st_name == "hover" else (bg.darkened(0.15) if st_name == "pressed" else bg)
		sb.set_corner_radius_all(8)
		sb.border_color = col
		sb.border_width_left = 10
		if st_name in ["hover", "focus"]:
			sb.border_color = UI.BRASS
			sb.set_border_width_all(3)
			sb.border_width_left = 10
		if st_name == "focus":
			sb.bg_color = Color(0, 0, 0, 0)
		b.add_theme_stylebox_override(st_name, sb)
	b.pressed.connect(cb)
	var stub: float = (art.custom_minimum_size.x + 24.0) if art else 0.0
	b.add_child(UI.ticket_art(stub, Color(0.02, 0.1, 0.07, 0.95)))
	if art:
		# bottom-right at its own size (a stretched viewport would distort it)
		var w: float = art.custom_minimum_size.x
		var h: float = art.custom_minimum_size.y
		art.anchor_left = 1.0
		art.anchor_right = 1.0
		art.anchor_top = 1.0
		art.anchor_bottom = 1.0
		art.offset_left = -w - 8
		art.offset_right = -8
		art.offset_top = -h
		art.offset_bottom = 0
		b.add_child(art)
	var vb := UI.vbox(2)
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 26
	vb.offset_top = 16
	vb.offset_right = -16
	vb.offset_bottom = -18
	vb.alignment = BoxContainer.ALIGNMENT_END
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var t := UI.label(UI.sentence(title), 50 if big else 30, UI.CHALK)
	vb.add_child(t)
	var sl := UI.label(sub, 19 if big else 16, UI.MUTED)
	sl.autowrap_mode = TextServer.AUTOWRAP_WORD
	sl.custom_minimum_size = Vector2(220, 0)
	vb.add_child(sl)
	if big:
		vb.add_child(UI.spacer(0, 10))
		var go := UI.panel(UI.TICKET, UI.TICKET, 6, 28)
		go.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		go.mouse_filter = Control.MOUSE_FILTER_IGNORE
		go.add_child(UI.label(cta, 26, UI.CHALK))
		vb.add_child(go)
	b.add_child(vb)
	return b


func _hub_page(active: String) -> Array:
	var root := _base(0.5)
	var vb := UI.vbox(14)
	vb.set_anchors_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 30
	vb.offset_right = -30
	vb.offset_top = 14
	vb.offset_bottom = -22
	vb.add_child(_topbar(active))
	root.add_child(vb)
	return [root, vb]


func _my_club() -> int:
	var c: Dictionary = Profile.data["career"]
	return int(c.get("club", 0)) if not c.is_empty() else int(Profile.get_s("home"))


func _home() -> void:
	var pg := _hub_page("HOME")
	var vb: VBoxContainer = pg[1]
	var row := UI.hbox(16)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(row)
	var club := _my_club()
	var kit: Dictionary = GameData.CLUBS[club]["kit"]
	var hero := Showcase.footballer(kit, 10, Vector2i(300, 420), -26.0, 11)
	var nxt := "%s  v  %s" % [GameData.CLUBS[int(Profile.get_s("home"))]["name"], GameData.CLUBS[int(Profile.get_s("away"))]["name"]]
	var ko := _card("KICK OFF", "Play a match now\n" + nxt, func(): _go(_kickoff), KitPainter.hex(kit["shirt"]), hero, true)
	ko.size_flags_stretch_ratio = 1.35
	row.add_child(ko)
	var right := UI.vbox(16)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.size_flags_vertical = Control.SIZE_EXPAND_FILL
	row.add_child(right)
	var c: Dictionary = Profile.data["career"]
	var csub: String = "Start a league season" if c.is_empty() else "%s · season %d · matchday %d" % [GameData.CLUBS[int(c["club"])]["name"], int(c["season"]), mini(int(c["round"]) + 1, 14)]
	right.add_child(_card("CAREER", csub, func(): _go(_career), UI.NILE,
		Showcase.mocap(GameData.CLUBS[club]["away"], 7, Vector2i(170, 210), "cele_very_happy", 20.0, 5)))
	var cup: Dictionary = Profile.data["cup"]
	var tsub: String = "8-club knockout cup" if cup.is_empty() or int(cup.get("champion", -1)) >= 0 else "In progress · " + Career.STAGE_NAMES[mini(int(cup["stage"]), 2)]
	right.add_child(_card("TOURNAMENT", tsub, func(): _go(_cup), UI.BRASS, Showcase.trophy(Vector2i(170, 210))))
	var low := UI.hbox(16)
	low.custom_minimum_size = Vector2(0, 150)
	vb.add_child(low)
	low.add_child(_card("HARA STREET", "5-a-side in the cage", func(): _go(_street), UI.FLARE, Showcase.ball(Vector2i(140, 140))))
	low.add_child(_card("CHALLENGES", "Big moments, ★ %d of %d" % [_scenario_stars(), Scenarios.LIST.size() * 3], func(): _go(_challenges), UI.TICKET,
		Showcase.trophy(Vector2i(120, 140))))
	low.add_child(_card("SKILL GAMES", "Training, shooting, skills", func(): _go(_skill_games), UI.CHALK,
		Showcase.mocap(GameData.CLUBS[(club + 3) % GameData.CLUBS.size()]["kit"], 11, Vector2i(110, 150), "kick", 60.0, 21)))
	_set_screen(pg[0])
	ko.grab_focus()


func _play_hub() -> void:
	var pg := _hub_page("PLAY")
	var vb: VBoxContainer = pg[1]
	var row := UI.hbox(16)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(row)
	var club := _my_club()
	var ko := _card("KICK OFF", "Pick two clubs and play", func(): _go(_kickoff), KitPainter.hex(GameData.CLUBS[club]["kit"]["shirt"]),
		Showcase.footballer(GameData.CLUBS[club]["kit"], 9, Vector2i(240, 380), -20.0, 3), true)
	row.add_child(ko)
	row.add_child(_card("TOURNAMENT", "8-club knockout cup", func(): _go(_cup), UI.BRASS, Showcase.trophy(Vector2i(240, 300)), true))
	var low := UI.hbox(16)
	low.custom_minimum_size = Vector2(0, 170)
	vb.add_child(low)
	low.add_child(_card("HARA STREET", "5-a-side in the cage", func(): _go(_street), UI.FLARE, Showcase.ball(Vector2i(150, 150))))
	low.add_child(_card("CHALLENGES", "Big moments to turn round", func(): _go(_challenges), UI.TICKET))
	low.add_child(_card("SKILL GAMES", "Training, shooting, skills", func(): _go(_skill_games), UI.CHALK))
	_set_screen(pg[0])
	ko.grab_focus()


func _club_hub() -> void:
	var pg := _hub_page("CLUB")
	var vb: VBoxContainer = pg[1]
	var row := UI.hbox(16)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(row)
	var club := _my_club()
	var sq := _card("SQUADS", "Line-ups, formations, names", func(): _go(_squads), KitPainter.hex(GameData.CLUBS[club]["kit"]["shirt"]),
		Showcase.footballer(GameData.CLUBS[club]["kit"], 4, Vector2i(220, 380), 20.0, 8), true, "Edit squads  ▶")
	row.add_child(sq)
	row.add_child(_card("SKILLS", "Skill moves and PlayStyles", func(): _go(_catalogue), UI.NILE,
		Showcase.mocap(GameData.CLUBS[(club + 2) % GameData.CLUBS.size()]["kit"], 7, Vector2i(220, 380), "kick", 50.0, 4), true, "See skills  ▶"))
	row.add_child(_card("CONTROLS", "Touch, pad presets, remap", func(): _go(_controls), UI.TICKET, null, true, "Set controls  ▶"))
	_set_screen(pg[0])
	sq.grab_focus()


# ------------------------------------------------------------------ kick off

func _club_card(key: String, title: String) -> Control:
	var vb := UI.vbox(8)
	vb.add_child(UI.caption(title))
	var p := UI.panel(UI.PANEL, Color(1, 1, 1, 0.12), 12, 16)
	var hb := UI.hbox(14)
	var ci: int = int(Profile.get_s(key))
	hb.add_child(UI.crest(ci, 70))
	var info := UI.vbox(2)
	info.custom_minimum_size = Vector2(250, 0)
	var c: Dictionary = GameData.CLUBS[ci]
	info.add_child(UI.label(c["name"], 28))
	info.add_child(UI.stars(int(c["stars"])))
	info.add_child(UI.label("Rating %d, plays %s" % [int(roundf(GameData.team_rating(ci, Profile.squads()))), GameData.club_formation(ci, Profile.squads())], 17, UI.MUTED))
	hb.add_child(info)
	var arrows := UI.vbox(6)
	for d in [-1, 1]:
		arrows.add_child(UI.button("▲" if d < 0 else "▼", func():
			var n := GameData.CLUBS.size()
			var other: String = "away" if key == "home" else "home"
			var v: int = (int(Profile.get_s(key)) + d + n) % n
			if v == int(Profile.get_s(other)):
				v = (v + d + n) % n
			Profile.set_s(key, v)
			_kickoff(), Vector2(56, 44), "ghost", 18))
	hb.add_child(arrows)
	p.add_child(hb)
	vb.add_child(p)
	vb.add_child(UI.button("TEAM SHEET", func(): sel_club = int(Profile.get_s(key)); _go(_squads), Vector2(0, 46), "ghost", 18))
	return vb


func _kickoff() -> void:
	var play := UI.button("PLAY  ▶", func():
		var side := int(Profile.get_s("side"))
		_play(_match_config(int(Profile.get_s("home")), int(Profile.get_s("away")), side if side < 2 else -1), {"type": "friendly"}),
		Vector2(220, 64), "accent", 26)
	var pg := _page("KICK OFF", play)
	var vb: VBoxContainer = pg[1]
	var clubs := UI.hbox(30)
	clubs.add_child(_club_card("home", "Home"))
	clubs.add_child(_club_card("away", "Away"))
	vb.add_child(clubs)
	var row := UI.hbox(30)
	var c1 := UI.vbox(6)
	c1.add_child(UI.caption("You play"))
	c1.add_child(UI.pills(["Home", "Away", "Watch"], int(Profile.get_s("side")), func(i: int): Profile.set_s("side", i)))
	row.add_child(c1)
	var c2 := UI.vbox(6)
	c2.add_child(UI.caption("Difficulty (Legendary and Ultimate use the TiZero AI)"))
	c2.add_child(UI.pills(SettingsPanel.DIFFS, int(Profile.get_s("difficulty")), func(i: int): Profile.set_s("difficulty", i)))
	row.add_child(c2)
	vb.add_child(row)
	var row2 := UI.hbox(30)
	var c3 := UI.vbox(6)
	c3.add_child(UI.caption("Half length"))
	c3.add_child(UI.pills(SettingsPanel.HALVES, int(Profile.get_s("half")), func(i: int): Profile.set_s("half", i)))
	row2.add_child(c3)
	var c4 := UI.vbox(6)
	c4.add_child(UI.caption("Camera"))
	c4.add_child(UI.pills(SettingsPanel.CAMS.map(func(c): return CameraRig.NAMES[c]), int(Profile.get_s("camera")), func(i: int): Profile.set_s("camera", i)))
	row2.add_child(c4)
	vb.add_child(row2)
	_set_screen(pg[0])
	play.grab_focus()


# ------------------------------------------------------------------ squads

func _squads() -> void:
	var edits := Profile.club_edits(sel_club)
	var sq := GameData.squad(sel_club, Profile.squads())
	var form := GameData.club_formation(sel_club, Profile.squads())
	var lineup: Array = edits.get("lineup", [])
	if not GameData.valid_lineup(sq, lineup):
		lineup = GameData.auto_lineup(sq, form)
	var clubs := UI.hbox(6)
	clubs.add_child(UI.button("◀", func(): sel_club = (sel_club + 7) % 8; squad_pick = -1; _squads(), Vector2(52, 52), "ghost"))
	clubs.add_child(UI.crest(sel_club, 40))
	var cn := UI.label(GameData.CLUBS[sel_club]["name"], 24)
	cn.custom_minimum_size = Vector2(240, 0)
	cn.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	clubs.add_child(cn)
	clubs.add_child(UI.button("▶", func(): sel_club = (sel_club + 1) % 8; squad_pick = -1; _squads(), Vector2(52, 52), "ghost"))
	var pg := _page("SQUADS", clubs)
	var vb: VBoxContainer = pg[1]
	var tools := UI.hbox(10)
	tools.add_child(UI.caption("Formation"))
	var forms := GameData.FORMATIONS.keys()
	tools.add_child(UI.pills(forms, forms.find(form), func(i: int):
		edits["formation"] = forms[i]
		edits.erase("lineup")
		Profile.save()
		_squads()))
	tools.add_child(UI.spacer(0, 0, true))
	tools.add_child(UI.button("BEST XI", func(): edits.erase("lineup"); Profile.save(); squad_pick = -1; _squads(), Vector2(140, 48), "ghost", 18))
	tools.add_child(UI.button("RESET CLUB", func(): Profile.data["squads"].erase(GameData.CLUBS[sel_club]["id"]); Profile.save(); squad_pick = -1; _squads(), Vector2(160, 48), "danger", 18))
	vb.add_child(tools)
	var hint := UI.label("Tap a player, then another to swap them (starter ↔ bench, or two positions). EDIT changes the name and number.", 16, UI.MUTED)
	vb.add_child(hint)
	var cols := UI.hbox(18)
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var slots: Array = GameData.FORMATIONS[form]
	var l := UI.vbox(5)
	l.add_child(UI.caption("Starting eleven"))
	for i in 11:
		l.add_child(_squad_row(sq, lineup, int(lineup[i]), slots[i][2], edits))
	cols.add_child(UI.scroll(l))
	var r := UI.vbox(5)
	r.add_child(UI.caption("Substitutes"))
	for i in sq.size():
		if not lineup.has(i) and not lineup.has(float(i)):
			r.add_child(_squad_row(sq, lineup, i, "SUB", edits))
	if squad_pick >= 0:
		r.add_child(UI.spacer(0, 8))
		r.add_child(_edit_box(sq[squad_pick], squad_pick, edits))
	cols.add_child(UI.scroll(r))
	vb.add_child(cols)
	_set_screen(pg[0])


func _squad_row(sq: Array, lineup: Array, idx: int, slot_role: String, edits: Dictionary) -> Control:
	var p: Dictionary = sq[idx]
	var sel := squad_pick == idx
	var b := UI.button("", func():
		if squad_pick < 0:
			squad_pick = idx
		elif squad_pick == idx:
			squad_pick = -1
		else:
			_swap_in_lineup(lineup, squad_pick, idx, edits)
			squad_pick = -1
		_squads(), Vector2(0, 46), "accent" if sel else "normal", 17)
	var h := UI.hbox(8)
	h.set_anchors_preset(Control.PRESET_FULL_RECT)
	h.offset_left = 10
	h.offset_right = -10
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var rl := UI.label(slot_role, 15, UI.role_color(slot_role if slot_role != "SUB" else p["pos"]))
	rl.custom_minimum_size = Vector2(44, 0)
	h.add_child(rl)
	var nm := UI.label("%d  %s" % [int(p["number"]), p["name"]], 18, UI.INK if sel else Color(1, 1, 1))
	nm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(nm)
	var tags: Array = (p.get("ps", []) as Array).map(func(id): return GameData.PS_TAG.get(id, ""))
	if not tags.is_empty():
		h.add_child(UI.label(" ".join(tags), 13, UI.INK if sel else Color(0.95, 0.75, 0.3)))
	var pos := UI.label(p["pos"], 14, UI.INK if sel else UI.MUTED)
	h.add_child(pos)
	h.add_child(UI.label("★%d" % int(p.get("skill", 2)), 14, UI.INK if sel else UI.MUTED))
	var ov := UI.label(str(int(p["ovr"])), 20, UI.INK if sel else UI.ACCENT)
	ov.custom_minimum_size = Vector2(36, 0)
	h.add_child(ov)
	b.add_child(h)
	return b


func _swap_in_lineup(lineup: Array, a: int, b: int, edits: Dictionary) -> void:
	var lu: Array = lineup.map(func(x): return int(x))
	var ia := lu.find(a)
	var ib := lu.find(b)
	if ia >= 0 and ib >= 0:
		lu[ia] = b
		lu[ib] = a
	elif ia >= 0:
		lu[ia] = b
	elif ib >= 0:
		lu[ib] = a
	else:
		return
	edits["lineup"] = lu
	Profile.save()


func _edit_box(p: Dictionary, idx: int, edits: Dictionary) -> Control:
	var box := UI.panel(UI.PANEL_2, UI.ACCENT, 10, 14)
	var vb := UI.vbox(8)
	box.add_child(vb)
	vb.add_child(UI.caption("Edit player"))
	var name_e := LineEdit.new()
	name_e.text = p["name"]
	name_e.placeholder_text = "Full name"
	name_e.custom_minimum_size = Vector2(0, 46)
	name_e.add_theme_font_size_override("font_size", 20)
	vb.add_child(name_e)
	var row := UI.hbox(8)
	var short_e := LineEdit.new()
	short_e.text = p["short"]
	short_e.placeholder_text = "Shirt name"
	short_e.custom_minimum_size = Vector2(200, 46)
	short_e.add_theme_font_size_override("font_size", 20)
	short_e.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(short_e)
	var num := SpinBox.new()
	num.min_value = 1
	num.max_value = 99
	num.value = int(p["number"])
	num.custom_minimum_size = Vector2(120, 46)
	row.add_child(num)
	vb.add_child(row)
	vb.add_child(UI.button("SAVE", func():
		if not edits.has("players"):
			edits["players"] = {}
		var e: Dictionary = edits["players"].get(str(idx), {})
		e["name"] = name_e.text.strip_edges() if name_e.text.strip_edges() != "" else p["name"]
		e["short"] = short_e.text.strip_edges() if short_e.text.strip_edges() != "" else e["name"].get_slice(" ", e["name"].get_slice_count(" ") - 1)
		e["number"] = int(num.value)
		edits["players"][str(idx)] = e
		Profile.save()
		squad_pick = -1
		_squads(), Vector2(0, 50), "accent"))
	return box


# ------------------------------------------------------------------ catalogue, controls, settings

func _catalogue() -> void:
	var practice := UI.button("PRACTISE  ▶", func(): _practice("skills"), Vector2(200, 56), "accent")
	var pg := _page("SKILLS & PLAYSTYLES", practice)
	var vb: VBoxContainer = pg[1]
	var src := "touch"
	if Pad.connected():
		src = "pad"
	vb.add_child(UI.label("Directions are from the player's point of view: forward is where he is running. Players can do moves up to their skill stars; harder moves are riskier for them.", 16, UI.MUTED))
	var list := UI.vbox(8)
	for s in Skills.LIST:
		var card := UI.panel(UI.PANEL, Color(1, 1, 1, 0.1), 10, 14)
		var h := UI.hbox(16)
		var left := UI.vbox(2)
		left.custom_minimum_size = Vector2(300, 0)
		left.add_child(UI.label(s["name"], 24))
		left.add_child(UI.stars(int(s["stars"])))
		h.add_child(left)
		var mid := UI.label(s["desc"], 17, UI.MUTED)
		mid.autowrap_mode = TextServer.AUTOWRAP_WORD
		mid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		mid.custom_minimum_size = Vector2(260, 0)
		h.add_child(mid)
		var how := UI.vbox(2)
		how.custom_minimum_size = Vector2(330, 0)
		how.add_child(UI.label("🎮  " + s["pad"], 16, UI.ACCENT if src == "pad" else Color(1, 1, 1)))
		how.add_child(UI.label("👆  " + s["touch"], 16, UI.ACCENT if src == "touch" else Color(1, 1, 1)))
		how.add_child(UI.label("⌨  " + s["keys"], 15, UI.MUTED))
		h.add_child(how)
		card.add_child(h)
		list.add_child(card)
	# PlayStyles: the special traits players carry (shown as tags in the squad screens)
	list.add_child(UI.spacer(0, 10))
	list.add_child(UI.label("PLAYSTYLES", 26, UI.ACCENT))
	list.add_child(UI.label("Players earn up to three from their attributes. Each one changes how they play in a match.", 16, UI.MUTED))
	for id in GameData.PLAYSTYLES:
		var row := UI.hbox(14)
		var tag := UI.label(GameData.PS_TAG[id], 18, UI.INK)
		var chip := PanelContainer.new()
		chip.add_theme_stylebox_override("panel", UI.style(Color(0.95, 0.75, 0.3), Color(0, 0, 0, 0), 4, 8))
		chip.custom_minimum_size = Vector2(64, 0)
		chip.add_child(tag)
		row.add_child(chip)
		var nm := UI.label(GameData.PLAYSTYLES[id][0], 20)
		nm.custom_minimum_size = Vector2(220, 0)
		row.add_child(nm)
		row.add_child(UI.label(GameData.PLAYSTYLES[id][1], 17, UI.MUTED))
		list.add_child(row)
	vb.add_child(UI.scroll(list))
	_set_screen(pg[0])


func _controls() -> void:
	var pg := _page("CONTROLS")
	var cp := ControlsPanel.new()
	pg[1].add_child(cp)
	_set_screen(pg[0])


func _settings() -> void:
	var pg := _page("SETTINGS")
	var sp := SettingsPanel.new()
	pg[1].add_child(sp)
	_set_screen(pg[0])


# ------------------------------------------------------------------ skill games

func _skill_games() -> void:
	var pg := _page("SKILL GAMES")
	var vb: VBoxContainer = pg[1]
	var row := UI.hbox(18)
	row.add_child(_tile("TRAINING", "Your team against a keeper. Practise anything, no clock.", func(): _practice("training"), Vector2(330, 220)))
	row.add_child(_tile("SHOOTING", "60 seconds, shots from around the box.  Best: %d" % Profile.record("shooting"), func(): _practice("shooting"), Vector2(330, 220), true))
	row.add_child(_tile("SKILLS", "60 seconds, do the move shown.  Best: %d" % Profile.record("skills"), func(): _practice("skills"), Vector2(330, 220)))
	vb.add_child(row)
	_set_screen(pg[0])


func _street() -> void:
	_club_choice("HARA STREET", "Pick your crew. Five a side in the cage: the ball plays off the walls, skill moves fill your momentum twice as fast.", func(i):
		var opp: int = (i + 1 + randi() % (GameData.CLUBS.size() - 1)) % GameData.CLUBS.size()
		var cfg := _match_config(i, opp, 0)
		cfg["street"] = true
		cfg["no_intro"] = true
		cfg["half_minutes"] = 3.0
		cfg["camera"] = "broadcast"
		_play(cfg, {"type": "friendly"}))


func _scenario_stars() -> int:
	var n := 0
	for s in Scenarios.LIST:
		n += Profile.record("sc_" + s["id"])
	return n


func _challenges() -> void:
	var pg := _page("CHALLENGES", UI.label("★ %d / %d" % [_scenario_stars(), Scenarios.LIST.size() * 3], 24, UI.ACCENT))
	var vb: VBoxContainer = pg[1]
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	var first: Button = null
	for sc in Scenarios.LIST:
		var got := Profile.record("sc_" + sc["id"])
		var stars := "★".repeat(got) + "☆".repeat(3 - got)
		var sub := "%s\n%s v %s  ·  %d-%d  ·  %d'\n%s" % [sc["story"], GameData.CLUBS[sc["home"]]["short"], GameData.CLUBS[sc["away"]]["short"],
			sc["score"][0], sc["score"][1], sc["minute"], stars]
		var id: String = sc["id"]
		var b := _tile(sc["title"], sub, func(): _scenario_brief(id), Vector2(250, 222))
		grid.add_child(b)
		if first == null:
			first = b
	vb.add_child(grid)
	_set_screen(pg[0])
	first.grab_focus()


func _scenario_brief(id: String) -> void:
	var sc := Scenarios.by_id(id)
	var lines := "%s\n\n" % sc["story"]
	for c in sc["stars"]:
		lines += "★  %s\n" % Scenarios.STAR_TEXT[c]
	_confirm(lines + "\nPlay it?", func(): _scenario_play(id))


func _scenario_play(id: String) -> void:
	var sc := Scenarios.by_id(id)
	var cfg := _match_config(int(sc["home"]), int(sc["away"]), 0)
	cfg["scenario"] = sc
	cfg["no_intro"] = true
	cfg["half_minutes"] = 6.0
	_play(cfg, {"type": "scenario", "id": id})


func _scenario_result(r: Dictionary) -> void:
	var sc := Scenarios.by_id(context.get("id", ""))
	var got := Scenarios.stars(sc, r["score"])
	var best := Profile.set_record("sc_" + sc["id"], got)
	var txt := "%s   %d - %d\n" % [sc["title"], r["score"][0], r["score"][1]]
	for c in sc["stars"]:
		txt += ("★  " if Scenarios.met(c, sc, r["score"]) else "☆  ") + Scenarios.STAR_TEXT[c] + "\n"
	if best:
		txt += "NEW BEST!"
	_start_demo()
	nav.clear()
	nav.append(_home)
	_result_card(txt, func(): _go(_challenges, false))


func _practice(mode: String) -> void:
	var cfg := _match_config(int(Profile.get_s("home")), int(Profile.get_s("away")), 0)
	cfg["mode"] = mode
	cfg["half_minutes"] = 999.0
	_play(cfg, {"type": "practice"})


# ------------------------------------------------------------------ career

func _career() -> void:
	var c: Dictionary = Profile.data["career"]
	if c.is_empty():
		_club_choice("NEW CAREER", "Pick your club. You play every league match; the rest of the round is played out around you.", func(i: int):
			Profile.data["career"] = Career.new_career(i)
			Profile.save()
			_go(_career, false))
		return
	if Career.finished(c):
		_career_end()
		return
	var club := int(c["club"])
	var fx := Career.next_fixture(c)
	var play := UI.button("PLAY MATCH  ▶", func(): _career_play(), Vector2(240, 60), "accent", 22)
	var pg := _page("CAREER  ·  SEASON %d" % int(c["season"]), play)
	var vb: VBoxContainer = pg[1]
	var top := UI.hbox(18)
	var card := UI.panel(UI.PANEL, UI.ACCENT, 12, 18)
	var ch := UI.hbox(18)
	ch.add_child(UI.crest(int(fx[0]), 64))
	var mid := UI.vbox(4)
	mid.add_child(UI.caption("Matchday %d of %d" % [int(c["round"]) + 1, Career.rounds(c)]))
	mid.add_child(UI.label("%s  v  %s" % [GameData.CLUBS[int(fx[0])]["name"], GameData.CLUBS[int(fx[1])]["name"]], 26))
	mid.add_child(UI.label("HOME" if int(fx[0]) == club else "AWAY", 18, UI.ACCENT))
	ch.add_child(mid)
	ch.add_child(UI.crest(int(fx[1]), 64))
	card.add_child(ch)
	top.add_child(card)
	var life := CareerLife.ensure(c)
	var info := UI.vbox(4)
	info.add_child(UI.caption("Budget"))
	info.add_child(UI.label("€%.1fM" % float(life["budget"]), 26, UI.ACCENT))
	info.add_child(UI.caption("Board"))
	info.add_child(UI.label(life["objective"][1], 18))
	top.add_child(info)
	var btns := UI.vbox(8)
	btns.add_child(UI.button("SIMULATE MATCH", func(): _career_sim(), Vector2(230, 50), "normal", 18))
	btns.add_child(UI.button("TEAM SHEET", func(): sel_club = club; _go(_squads), Vector2(230, 50), "normal", 18))
	top.add_child(btns)
	vb.add_child(top)
	var tabs := ["Table", "Squad", "Transfers", "Inbox", "Fixtures", "Top scorers", "History"]
	var keys := ["table", "squad", "transfers", "inbox", "fixtures", "scorers", "history"]
	vb.add_child(UI.pills(tabs, keys.find(career_tab), func(i: int): career_tab = keys[i]; _career()))
	var body := UI.vbox(4)
	match career_tab:
		"table":
			body.add_child(_table_view(c))
		"squad":
			body.add_child(_career_squad_view(c))
		"transfers":
			body.add_child(_career_market_view(c))
		"inbox":
			body.add_child(_career_inbox_view(c))
		"fixtures":
			body.add_child(_fixtures_view(c))
		"scorers":
			body.add_child(_scorers_view(c))
		"history":
			var hist: Array = c.get("history", [])
			if hist.is_empty():
				body.add_child(UI.label("Your first season.", 20, UI.MUTED))
			for h in hist:
				body.add_child(UI.label("Season %d:  finished %s   ·   champions %s" % [int(h["season"]), _ordinal(int(h["pos"])), GameData.CLUBS[int(h["champion"])]["name"]], 20))
	vb.add_child(UI.scroll(body))
	vb.add_child(UI.button("ABANDON CAREER", func(): _confirm("Abandon this career? It can't be undone.", func(): Profile.data["career"] = {}; Profile.save(); _home_reset()), Vector2(220, 44), "danger", 16))
	_set_screen(pg[0])
	play.grab_focus()


func _ordinal(n: int) -> String:
	var suf := "th"
	if n % 10 == 1 and n != 11:
		suf = "st"
	elif n % 10 == 2 and n != 12:
		suf = "nd"
	elif n % 10 == 3 and n != 13:
		suf = "rd"
	return "%d%s" % [n, suf]


func _table_view(c: Dictionary) -> Control:
	var g := GridContainer.new()
	g.columns = 10
	g.add_theme_constant_override("h_separation", 22)
	g.add_theme_constant_override("v_separation", 6)
	for h in ["#", "", "Club", "P", "W", "D", "L", "GD", "Pts", "Form"]:
		g.add_child(UI.caption(h))
	var tbl := Career.table(c)
	for i in tbl.size():
		var r: Dictionary = tbl[i]
		var mine := int(r["club"]) == int(c["club"])
		var col := UI.ACCENT if mine else Color(1, 1, 1)
		g.add_child(UI.label(str(i + 1), 20, col))
		g.add_child(UI.chip(UI.kit_color(int(r["club"])), 10, 24))
		g.add_child(UI.label(GameData.CLUBS[int(r["club"])]["name"], 20, col))
		for k in ["p", "w", "d", "l"]:
			g.add_child(UI.label(str(r[k]), 20, col))
		g.add_child(UI.label("%+d" % (int(r["gf"]) - int(r["ga"])), 20, col))
		g.add_child(UI.label(str(r["pts"]), 22, col))
		var form: Array = r["form"]
		g.add_child(UI.label(" ".join(form.slice(maxi(0, form.size() - 5))), 16, UI.MUTED))
	return g


var market_pos := ""
var market_pick := {}


func _career_squad_view(c: Dictionary) -> Control:
	var club := int(c["club"])
	var sq := GameData.squad(club, Profile.squads())
	var g := GridContainer.new()
	g.columns = 8
	g.add_theme_constant_override("h_separation", 18)
	g.add_theme_constant_override("v_separation", 6)
	for h in ["Pos", "Player", "OVR", "Now", "Form", "Morale", "Fitness", "Status"]:
		g.add_child(UI.caption(h))
	for i in sq.size():
		var p: Dictionary = sq[i]
		var ps := CareerLife.pstate(c, i)
		var dd := CareerLife.dyn_delta(c, i)
		g.add_child(UI.label(p["pos"], 16, UI.role_color(p["pos"])))
		g.add_child(UI.label("%d  %s" % [int(p["number"]), p["name"]], 18))
		g.add_child(UI.label(str(int(p["ovr"])), 18, UI.MUTED))
		g.add_child(UI.label("%d %s" % [int(p["ovr"]) + dd, "▲" if dd > 0 else ("▼" if dd < 0 else "")], 18, UI.GOOD if dd > 0 else (UI.BAD if dd < 0 else Color(1, 1, 1))))
		for k in ["form", "morale", "fit"]:
			var b := UI.bar(float(ps[k]), 80, 9)
			b.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			g.add_child(b)
		var st := "Injured (%d wk)" % int(ps["injury"]) if int(ps["injury"]) > 0 else ("%d apps · %d goals" % [int(ps["apps"]), int(ps["goals"])])
		g.add_child(UI.label(st, 16, UI.BAD if int(ps["injury"]) > 0 else UI.MUTED))
	return g


func _career_market_view(c: Dictionary) -> Control:
	var vb := UI.vbox(8)
	var life := CareerLife.ensure(c)
	var poss := ["", "GK", "DEF", "MID", "FWD"]
	var row := UI.hbox(10)
	row.add_child(UI.caption("Position"))
	row.add_child(UI.pills(["All", "GK", "DEF", "MID", "FWD"], poss.find(market_pos), func(i: int): market_pos = poss[i]; market_pick = {}; _career()))
	row.add_child(UI.spacer(0, 0, true))
	row.add_child(UI.label("Budget €%.1fM" % float(life["budget"]), 20, UI.ACCENT))
	vb.add_child(row)
	if not market_pick.is_empty():
		vb.add_child(_bid_box(c))
	var list := CareerLife.market(c, Profile.squads(), market_pos)
	for k in mini(list.size(), 40):
		var it: Dictionary = list[k]
		var p: Dictionary = it["p"]
		var b := UI.button("", func(): market_pick = it; _career(), Vector2(0, 46), "normal", 16)
		var h := UI.hbox(10)
		h.set_anchors_preset(Control.PRESET_FULL_RECT)
		h.offset_left = 10
		h.offset_right = -10
		h.mouse_filter = Control.MOUSE_FILTER_IGNORE
		h.add_child(UI.label(p["pos"], 15, UI.role_color(p["pos"])))
		var nl := UI.label("%s  ·  %s  ·  age %d" % [p["name"], GameData.CLUBS[int(it["club"])]["short"], int(p.get("age", 25))], 17)
		nl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(nl)
		h.add_child(UI.label(str(int(p["ovr"])), 18, UI.ACCENT))
		h.add_child(UI.label("€%.1fM" % float(it["value"]), 17))
		b.add_child(h)
		vb.add_child(b)
	return vb


func _bid_box(c: Dictionary) -> Control:
	var it: Dictionary = market_pick
	var p: Dictionary = it["p"]
	var box := UI.panel(UI.PANEL_2, UI.ACCENT, 10, 14)
	var vb := UI.vbox(8)
	box.add_child(vb)
	vb.add_child(UI.label("Bid for %s (%s, OVR %d) — value €%.1fM" % [p["name"], GameData.CLUBS[int(it["club"])]["name"], int(p["ovr"]), float(it["value"])], 19))
	var fee := [snappedf(float(it["value"]), 0.1)]
	var fee_lbl := UI.label("Offer: €%.1fM" % fee[0], 20, UI.ACCENT)
	vb.add_child(fee_lbl)
	var sl := HSlider.new()
	sl.min_value = float(it["value"]) * 0.6
	sl.max_value = float(it["value"]) * 1.6
	sl.step = 0.1
	sl.value = fee[0]
	sl.custom_minimum_size = Vector2(400, 36)
	sl.value_changed.connect(func(v: float): fee[0] = v; fee_lbl.text = "Offer: €%.1fM" % v)
	vb.add_child(sl)
	# who makes room: same position, weakest first
	var sq := GameData.squad(int(c["club"]), Profile.squads())
	var cands := []
	for i in sq.size():
		if sq[i]["pos"] == p["pos"]:
			cands.append(i)
	cands.sort_custom(func(a, b): return sq[a]["ovr"] < sq[b]["ovr"])
	var leave := [cands[0] if not cands.is_empty() else sq.size() - 1]
	vb.add_child(UI.caption("Goes the other way"))
	vb.add_child(UI.pills(cands.map(func(i): return "%s %d" % [sq[i]["short"], int(sq[i]["ovr"])]), 0, func(k: int): leave[0] = cands[k], 15))
	var msg := UI.label("", 18, UI.FLARE)
	msg.autowrap_mode = TextServer.AUTOWRAP_WORD
	vb.add_child(msg)
	var row := UI.hbox(10)
	row.add_child(UI.button("MAKE OFFER", func():
		var res := CareerLife.bid(c, Profile.squads(), int(it["club"]), int(it["idx"]), fee[0], int(leave[0]))
		Profile.save()
		if res["ok"]:
			market_pick = {}
			_result_card(res["msg"], _career)
		else:
			msg.text = res["msg"], Vector2(200, 52), "accent"))
	row.add_child(UI.button("CANCEL", func(): market_pick = {}; _career(), Vector2(160, 52)))
	vb.add_child(row)
	return box


func _career_inbox_view(c: Dictionary) -> Control:
	var vb := UI.vbox(8)
	var life := CareerLife.ensure(c)
	var offers: Array = life["offers"]
	for k in offers.size():
		var o: Dictionary = offers[k]
		var sq := GameData.squad(int(c["club"]), Profile.squads())
		var card := UI.panel(UI.PANEL_2, UI.FLARE, 10, 14)
		var h := UI.hbox(10)
		var l := UI.label("%s offer €%.1fM for %s" % [GameData.CLUBS[int(o["club"])]["name"], float(o["fee"]), sq[int(o["idx"])]["name"]], 19)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(l)
		h.add_child(UI.button("ACCEPT", func(): CareerLife.accept_offer(c, Profile.squads(), k); Profile.save(); _career(), Vector2(130, 46), "accent", 17))
		h.add_child(UI.button("REJECT", func(): offers.remove_at(k); Profile.save(); _career(), Vector2(130, 46), "normal", 17))
		card.add_child(h)
		vb.add_child(card)
	for m in life["inbox"]:
		var card := UI.panel(UI.PANEL, Color(1, 1, 1, 0.08), 10, 14)
		var v := UI.vbox(2)
		v.add_child(UI.label("%s  ·  matchday %d" % [m["title"], int(m["round"])], 18, UI.ACCENT))
		var b := UI.label(m["body"], 17)
		b.autowrap_mode = TextServer.AUTOWRAP_WORD
		v.add_child(b)
		card.add_child(v)
		vb.add_child(card)
	return vb


func _fixtures_view(c: Dictionary) -> Control:
	var vb := UI.vbox(4)
	for r in Career.rounds(c):
		var line := ""
		for i in c["fixtures"][r].size():
			var m: Array = c["fixtures"][r][i]
			if int(m[0]) != int(c["club"]) and int(m[1]) != int(c["club"]):
				continue
			var res = c["results"][r][i]
			var score: String = "v" if res == null else "%d - %d" % [int(res[0]), int(res[1])]
			line = "MD %2d    %s  %s  %s" % [r + 1, GameData.CLUBS[int(m[0])]["short"], score, GameData.CLUBS[int(m[1])]["short"]]
		vb.add_child(UI.label(line, 20, UI.ACCENT if r == int(c["round"]) else (Color(1, 1, 1) if r < int(c["round"]) else UI.MUTED)))
	return vb


func _scorers_view(c: Dictionary) -> Control:
	var vb := UI.vbox(4)
	var top := Career.top_scorers(c, 12)
	if top.is_empty():
		vb.add_child(UI.label("No goals yet.", 20, UI.MUTED))
	for i in top.size():
		var s: Dictionary = top[i]
		vb.add_child(UI.label("%2d.  %s  (%s)   %d" % [i + 1, s["name"], GameData.CLUBS[int(s["club"])]["short"], int(s["goals"])], 20, UI.ACCENT if int(s["club"]) == int(c["club"]) else Color(1, 1, 1)))
	return vb


func _career_play() -> void:
	var c: Dictionary = Profile.data["career"]
	var fx := Career.next_fixture(c)
	var human := 0 if int(fx[0]) == int(c["club"]) else 1
	var cfg := _match_config(int(fx[0]), int(fx[1]), human)
	cfg["competition"] = true
	cfg["edits"] = CareerLife.match_edits(c, Profile.squads())
	_play(cfg, {"type": "career"})


func _career_sim() -> void:
	var c: Dictionary = Profile.data["career"]
	var fx := Career.next_fixture(c)
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var me := CareerLife.match_edits(c, Profile.squads())
	var r := Career.sim_result(int(fx[0]), int(fx[1]), me, rng)
	var club := int(c["club"])
	var lineup: Array = me[GameData.CLUBS[club]["id"]]["lineup"]
	var my_scorers := []
	for s in r["scorers"]:
		if int(s["club"]) == club:
			my_scorers.append(s["name"])
	_after_career_match(c, fx, r["score"], lineup, my_scorers)
	Career.complete_round(c, r["score"], r["scorers"], Profile.squads())
	Profile.save()
	_result_card("%s %d - %d %s" % [GameData.CLUBS[int(fx[0])]["name"], r["score"][0], r["score"][1], GameData.CLUBS[int(fx[1])]["name"]], _career)


func _after_career_match(c: Dictionary, fx: Array, score: Array, played_idx: Array, my_scorers: Array) -> void:
	var club := int(c["club"])
	var mine := 0 if int(fx[0]) == club else 1
	var gf: int = score[mine]
	var ga: int = score[1 - mine]
	var won := 1 if gf > ga else (0 if gf == ga else -1)
	CareerLife.after_match(c, Profile.squads(), played_idx.map(func(x): return int(x)), my_scorers, won)


func _career_result(r: Dictionary) -> void:
	var c: Dictionary = Profile.data["career"]
	var fx := Career.next_fixture(c)
	var club := int(c["club"])
	var mine := 0 if int(fx[0]) == club else 1
	var scorers := []
	var my_scorers := []
	for s in r.get("scorers", []):
		if s["name"] != "Own goal":
			scorers.append({"club": int(fx[0]) if int(s["team"]) == 0 else int(fx[1]), "name": s["name"]})
			if int(s["team"]) == mine:
				my_scorers.append(s["name"])
	# who played: names on the pitch for our side -> squad indices
	var sq := GameData.squad(club, Profile.squads())
	var names: Array = r.get("appeared", [[], []])[mine]
	var played := []
	for i in sq.size():
		if names.has(sq[i]["name"]):
			played.append(i)
	_after_career_match(c, fx, r["score"], played, my_scorers)
	Career.complete_round(c, r["score"], scorers, Profile.squads())
	Profile.save()
	_start_demo()
	nav.clear()
	nav.append(_home)
	_go(_career, false)


func _career_end() -> void:
	var c: Dictionary = Profile.data["career"]
	var pg := _page("SEASON %d  ·  FINAL TABLE" % int(c["season"]))
	var vb: VBoxContainer = pg[1]
	var tbl := Career.table(c)
	var champ := int(tbl[0]["club"])
	var pos := 0
	for i in tbl.size():
		if int(tbl[i]["club"]) == int(c["club"]):
			pos = i + 1
	var msg := "CHAMPIONS!" if champ == int(c["club"]) else "You finished %s. Champions: %s" % [_ordinal(pos), GameData.CLUBS[champ]["name"]]
	vb.add_child(UI.label(msg, 34, UI.ACCENT))
	if not c.has("verdict"):
		c["verdict"] = CareerLife.board_verdict(c, pos)
		Profile.save()
	vb.add_child(UI.label(c["verdict"], 20))
	vb.add_child(UI.scroll(_table_view(c)))
	vb.add_child(UI.button("NEXT SEASON  ▶", func():
		var life: Dictionary = c.get("life", {})
		var nc := Career.next_season(c, Profile.squads())
		if not life.is_empty():
			for k in life["players"]:
				life["players"][k]["apps"] = 0
				life["players"][k]["goals"] = 0
				life["players"][k]["fit"] = 1.0
				life["players"][k]["injury"] = 0
			nc["life"] = life
		Profile.data["career"] = nc
		Profile.save()
		_go(_career, false), Vector2(280, 60), "accent"))
	_set_screen(pg[0])


# ------------------------------------------------------------------ cup

func _cup() -> void:
	var cup: Dictionary = Profile.data["cup"]
	if cup.is_empty():
		_club_choice("NEW TOURNAMENT", "Pick your club for the knockout cup: quarter-final, semi-final, final. Draws go to penalties.", func(i: int):
			Profile.data["cup"] = Career.new_cup(i)
			Profile.save()
			_go(_cup, false))
		return
	var tie := Career.cup_tie(cup)
	var right: Control = null
	if not tie.is_empty():
		right = UI.button("PLAY  ▶", func(): _cup_play(), Vector2(200, 60), "accent", 22)
	var pg := _page("TOURNAMENT", right)
	var vb: VBoxContainer = pg[1]
	if int(cup["champion"]) >= 0:
		var won := int(cup["champion"]) == int(cup["club"])
		vb.add_child(UI.label("YOU WON THE CUP!" if won else "Winners: " + GameData.CLUBS[int(cup["champion"])]["name"], 32, UI.ACCENT))
	elif cup.get("out", false):
		vb.add_child(UI.label("Knocked out.", 28, UI.FLARE))
	else:
		vb.add_child(UI.label("%s: %s v %s" % [Career.STAGE_NAMES[int(cup["stage"])], GameData.CLUBS[int(tie[0])]["name"], GameData.CLUBS[int(tie[1])]["name"]], 26))
		vb.add_child(UI.button("SIMULATE", func(): _cup_sim(), Vector2(200, 48), "normal", 18))
	vb.add_child(_bracket(cup))
	vb.add_child(UI.spacer(0, 0, true))
	vb.add_child(UI.button("NEW TOURNAMENT", func(): _confirm("Start a new tournament?", func(): Profile.data["cup"] = {}; Profile.save(); _go(_cup, false)), Vector2(240, 46), "danger", 16))
	_set_screen(pg[0])
	if right:
		right.grab_focus()


func _bracket(cup: Dictionary) -> Control:
	var hb := UI.hbox(30)
	for s in 3:
		var col := UI.vbox(14)
		col.add_child(UI.caption(Career.STAGE_NAMES[s]))
		var n: int = [4, 2, 1][s]
		for i in n:
			var box := UI.panel(UI.PANEL, Color(1, 1, 1, 0.1), 8, 12)
			box.custom_minimum_size = Vector2(300, 0)
			var lines := UI.vbox(2)
			if s < cup["stages"].size():
				var m: Array = cup["stages"][s][i]
				var res = cup["results"][s][i]
				var w := Career.cup_winner_of(cup, s, i)
				for k in 2:
					var club := int(m[k])
					var txt: String = GameData.CLUBS[club]["name"]
					if res != null:
						txt += "   %d" % int(res[k])
						if res.size() > 2:
							txt += " (%d)" % int(res[2][k])
					var col_c := UI.ACCENT if club == int(cup["club"]) else (Color(1, 1, 1) if w < 0 or w == club else UI.MUTED)
					lines.add_child(UI.label(txt, 18, col_c))
			else:
				lines.add_child(UI.label("—", 18, UI.MUTED))
				lines.add_child(UI.label("—", 18, UI.MUTED))
			box.add_child(lines)
			col.add_child(box)
		hb.add_child(col)
	return hb


func _cup_play() -> void:
	var cup: Dictionary = Profile.data["cup"]
	var tie := Career.cup_tie(cup)
	var human := 0 if int(tie[0]) == int(cup["club"]) else 1
	var cfg := _match_config(int(tie[0]), int(tie[1]), human)
	cfg["competition"] = true
	_play(cfg, {"type": "cup"})


func _cup_sim() -> void:
	var cup: Dictionary = Profile.data["cup"]
	var tie := Career.cup_tie(cup)
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var r := Career.sim_result(int(tie[0]), int(tie[1]), Profile.squads(), rng)
	Profile.data["cup"] = Career.cup_complete(cup, r["score"], Profile.squads())
	Profile.save()
	_go(_cup, false)


func _cup_result(r: Dictionary) -> void:
	var cup: Dictionary = Profile.data["cup"]
	Profile.data["cup"] = Career.cup_complete(cup, r["score"], Profile.squads())
	Profile.save()
	_start_demo()
	nav.clear()
	nav.append(_home)
	_go(_cup, false)


# ------------------------------------------------------------------ shared pickers / dialogs

func _club_choice(title: String, sub: String, cb: Callable) -> void:
	var pg := _page(title)
	var vb: VBoxContainer = pg[1]
	vb.add_child(UI.label(sub, 18, UI.MUTED))
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	for i in GameData.CLUBS.size():
		var c: Dictionary = GameData.CLUBS[i]
		var b := UI.button("", func(): cb.call(i), Vector2(280, 150), "normal")
		var h := UI.hbox(12)
		h.set_anchors_preset(Control.PRESET_FULL_RECT)
		h.offset_left = 14
		h.offset_right = -10
		h.mouse_filter = Control.MOUSE_FILTER_IGNORE
		h.add_child(UI.crest(i, 64))
		var info := UI.vbox(2)
		info.alignment = BoxContainer.ALIGNMENT_CENTER
		info.add_child(UI.label(c["name"], 21))
		info.add_child(UI.stars(int(c["stars"]), 5, 16))
		info.add_child(UI.label("Rating %d" % int(roundf(GameData.team_rating(i, Profile.squads()))), 16, UI.MUTED))
		h.add_child(info)
		b.add_child(h)
		grid.add_child(b)
	vb.add_child(UI.scroll(grid))
	_set_screen(pg[0])


func _confirm(text: String, yes: Callable) -> void:
	var o := UI.overlay(560, 260)
	var vb := UI.vbox(20)
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	o[1].add_child(vb)
	var l := UI.label(text, 24)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD
	vb.add_child(l)
	var row := UI.hbox(12)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	var root: Control = o[0]
	row.add_child(UI.button("YES", func(): root.queue_free(); yes.call(), Vector2(160, 56), "danger"))
	row.add_child(UI.button("NO", func(): root.queue_free(), Vector2(160, 56)))
	vb.add_child(row)
	ui.add_child(root)


func _result_card(text: String, then: Callable) -> void:
	var o := UI.overlay(640, 260)
	var vb := UI.vbox(20)
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	o[1].add_child(vb)
	vb.add_child(UI.caption("Result"))
	var l := UI.label(text, 30, UI.ACCENT)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD
	vb.add_child(l)
	var root: Control = o[0]
	vb.add_child(UI.button("CONTINUE", func(): root.queue_free(); _go(then, false), Vector2(240, 56), "accent"))
	ui.add_child(root)


# ------------------------------------------------------------------ input

func _unhandled_input(event: InputEvent) -> void:
	var in_match := match_view != null and (match_view is EngineMatchView or match_view.hud.visible)
	if in_match:
		if event.is_action_pressed("ui_cancel"):
			match_view.set_paused(not match_view.paused)
		return
	if event.is_action_pressed("ui_cancel") or (event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_B and Pad.is_real(event.device)):
		if current != _title:
			_back()


func _notification(what: int) -> void:
	# a call, the home button or the screen turning off: stop the match (it kept running in the background)
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		if match_view and is_instance_valid(match_view) and (match_view is EngineMatchView or match_view.hud.visible) \
				and not match_view.paused and not _match_over(true):
			match_view.set_paused(true)
		Profile.flush()
		return
	# Android back: pause / resume a match, otherwise the previous screen
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		if match_view and (match_view is EngineMatchView or match_view.hud.visible):
			match_view.set_paused(not match_view.paused)
		elif current != _title:
			_back()
