class_name Hud
extends CanvasLayer
## In-match HUD: scoreboard, banners and toasts, the controlled player's name and power bar, radar, the stoppage
## bar (team menu at dead balls), celebration prompt, replay overlay, the pause menu (team, controls, settings)
## and the result screens.

var force_touch := false
var mv: MatchView
var root: Control
var touch: TouchControls
var board: PanelContainer
var lbl_score: Label
var lbl_clock: Label
var banner_lbl: Label
var banner_t := 0.0
var toast_lbl: Label
var toast_t := 0.0
var name_tag: Label
var power: ProgressBar
var radar: RadarView
var pause_root: Control
var pause_body: Control
var pause_tabs: HBoxContainer
var result_root: Control
var pause_btn: Button
var cam_btn: Button
var team_btn: Button
var celebrate_lbl: Label
var replay_root: Control
var challenge_panel: PanelContainer
var challenge_lbl: Label
var prompt_lbl: Label
var prompt_how: Label
var fade_rect: ColorRect
var fade_target := 0.0
var halftime_root: Control
var lineup_root: Control
var stamina_bar: Control
var stamina_v := 1.0
var show_names := true
var stoppage_auto := true
var last_stoppage_key := ""
var added_lbl: Label
var mom_bar: Control
var cards_lbl: Array = []

const ACCENT := UI.ACCENT
const INK := UI.INK


static func panel_style(bg: Color, border: Color = Color(0, 0, 0, 0), radius: int = 6) -> StyleBoxFlat:
	return UI.style(bg, border, radius, 12)


func setup(view: MatchView) -> void:
	mv = view
	layer = 5
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_scoreboard()
	# banner + toast
	banner_lbl = _big_label(64, ACCENT)
	banner_lbl.set_anchors_preset(Control.PRESET_CENTER_TOP)
	banner_lbl.position = Vector2(-450, 90)
	banner_lbl.size = Vector2(900, 90)
	root.add_child(banner_lbl)
	toast_lbl = _big_label(26, Color(1, 1, 1))
	toast_lbl.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	toast_lbl.position = Vector2(-400, -200)
	toast_lbl.size = Vector2(800, 40)
	root.add_child(toast_lbl)
	celebrate_lbl = _big_label(24, Color(1, 1, 1))
	celebrate_lbl.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	celebrate_lbl.position = Vector2(-400, -250)
	celebrate_lbl.size = Vector2(800, 40)
	celebrate_lbl.text = "TAP ANY BUTTON TO CELEBRATE"
	celebrate_lbl.visible = false
	root.add_child(celebrate_lbl)
	# name tag + power bar
	name_tag = UI.label("", 18)
	name_tag.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	name_tag.add_theme_constant_override("outline_size", 6)
	root.add_child(name_tag)
	power = ProgressBar.new()
	power.show_percentage = false
	power.size = Vector2(90, 10)
	var bg := UI.style(Color(0, 0, 0, 0.65), Color(1, 1, 1, 0.3), 3, 0)
	power.add_theme_stylebox_override("background", bg)
	power.add_theme_stylebox_override("fill", UI.style(Color(1.0, 0.75, 0.2), Color(0, 0, 0, 0), 3, 0))
	power.visible = false
	power.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(power)
	stamina_bar = Control.new()
	stamina_bar.size = Vector2(70, 6)
	stamina_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stamina_bar.draw.connect(func():
		stamina_bar.draw_rect(Rect2(Vector2.ZERO, stamina_bar.size), Color(0, 0, 0, 0.55))
		var c := UI.ACCENT if stamina_v > 0.5 else (UI.FLARE if stamina_v > 0.25 else UI.BAD)
		stamina_bar.draw_rect(Rect2(Vector2(1, 1), Vector2((stamina_bar.size.x - 2) * clampf(stamina_v, 0.0, 1.0), stamina_bar.size.y - 2)), c))
	root.add_child(stamina_bar)
	# radar
	radar = RadarView.new()
	radar.sim = mv.sim
	radar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	radar.size = Vector2(210, 130)
	radar.position = Vector2(-105, -142)
	root.add_child(radar)
	# buttons
	pause_btn = _small_button("II", func(): mv.set_paused(not mv.paused))
	pause_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	pause_btn.position = Vector2(-74, 12)
	root.add_child(pause_btn)
	cam_btn = _small_button("CAM", func(): toast("Camera: " + CameraRig.NAMES.get(mv.cam.cycle(), "")))
	cam_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	cam_btn.position = Vector2(-160, 12)
	root.add_child(cam_btn)
	team_btn = _small_button("TEAM", func(): mv.set_paused(true, "team"))
	team_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	team_btn.position = Vector2(-276, 12)
	team_btn.custom_minimum_size = Vector2(104, 50)
	team_btn.add_theme_stylebox_override("normal", UI.style(UI.FLARE, UI.FLARE))
	team_btn.add_theme_color_override("font_color", INK)
	team_btn.visible = false
	root.add_child(team_btn)
	# touch controls
	touch = TouchControls.new()
	root.add_child(touch)
	touch.visible = DisplayServer.is_touchscreen_available() or OS.has_feature("mobile") or force_touch
	# practice modes
	if mv.sim.mode != "match":
		_challenge_ui()
	_replay_ui()
	fade_rect = ColorRect.new()
	fade_rect.color = Color(0.0, 0.0, 0.0, 0.0)
	fade_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(fade_rect)
	apply_options(mv.opts)


func apply_options(o: Dictionary) -> void:
	radar.visible = o.get("radar", true)
	show_names = o.get("names", true)
	stoppage_auto = o.get("stoppage_menu", true)


func _scoreboard() -> void:
	board = PanelContainer.new()
	board.add_theme_stylebox_override("panel", UI.style(Color(0.03, 0.05, 0.1, 0.85), Color(0, 0, 0, 0), 6, 12))
	board.position = Vector2(16, 14)
	board.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# which match engine is running, so any screenshot tells
	var tag := Label.new()
	tag.text = "v%s  CLASSIC%s" % [str(ProjectSettings.get_setting("application/config/version", "")), "" if EngineMatchView.available() else "  (engine off: " + EngineMatchView.load_error() + ")"]
	tag.add_theme_font_size_override("font_size", 14)
	tag.add_theme_color_override("font_color", Color(1, 1, 1, 0.45))
	tag.position = Vector2(18, 62)
	tag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(tag)
	var hb := UI.hbox(10)
	board.add_child(hb)
	var t0: Dictionary = mv.sim.teams[0]
	var t1: Dictionary = mv.sim.teams[1]
	hb.add_child(UI.chip(KitPainter.hex(t0["kit"].get("shirt", 0xffffff)), 8, 28))
	hb.add_child(UI.label(t0["short"], 22))
	lbl_score = UI.label("0 - 0", 24, INK)
	var sc := PanelContainer.new()
	sc.add_theme_stylebox_override("panel", UI.style(ACCENT, Color(0, 0, 0, 0), 4, 10))
	sc.add_child(lbl_score)
	hb.add_child(sc)
	hb.add_child(UI.label(t1["short"], 22))
	hb.add_child(UI.chip(KitPainter.hex(t1["kit"].get("shirt", 0xffffff)), 8, 28))
	lbl_clock = UI.label("00:00", 22)
	hb.add_child(lbl_clock)
	added_lbl = UI.label("+0", 18, INK)
	var ad := PanelContainer.new()
	ad.add_theme_stylebox_override("panel", UI.style(Color(0.95, 0.75, 0.2), Color(0, 0, 0, 0), 4, 6))
	ad.add_child(added_lbl)
	ad.visible = false
	hb.add_child(ad)
	# momentum: our signature meter under the scoreboard (fills with good play; full = a 20 s surge)
	var vb := UI.vbox(4)
	board.remove_child(hb)
	vb.add_child(hb)
	mom_bar = Control.new()
	mom_bar.custom_minimum_size = Vector2(0, 10)
	mom_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mom_bar.draw.connect(_draw_momentum)
	vb.add_child(mom_bar)
	board.add_child(vb)
	root.add_child(board)
	board.visible = mv.sim.mode == "match" or mv.sim.mode == "training"


func _draw_momentum() -> void:
	var s := mv.sim
	var w := mom_bar.size.x
	var half := w * 0.5 - 3.0
	var h := mom_bar.size.y
	for t in 2:
		var col: Color = KitPainter.hex(s.teams[t]["kit"].get("shirt", 0xffffff))
		if col.get_luminance() < 0.25:
			col = col.lightened(0.4)
		var x0 := 0.0 if t == 0 else w * 0.5 + 3.0
		mom_bar.draw_rect(Rect2(x0, 0, half, h), Color(1, 1, 1, 0.12))
		var f: float = 1.0 if s.surging(t) else s.momentum[t]
		var fw := half * f
		var rx := x0 + half - fw if t == 0 else x0
		var pulse := 0.65 + 0.35 * sin(s.time * 8.0) if s.surging(t) else 1.0
		mom_bar.draw_rect(Rect2(rx, 0, fw, h), Color(col, pulse))
	mom_bar.draw_rect(Rect2(w * 0.5 - 1.0, -2, 2, h + 4), Color(1, 1, 1, 0.8))


func _challenge_ui() -> void:
	challenge_panel = UI.panel(Color(0.03, 0.05, 0.1, 0.88), ACCENT, 10, 14)
	challenge_panel.set_anchors_preset(Control.PRESET_CENTER_TOP)
	challenge_panel.position = Vector2(-230, 12)
	challenge_panel.custom_minimum_size = Vector2(460, 0)
	challenge_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var vb := UI.vbox(4)
	challenge_lbl = UI.label("", 24)
	challenge_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(challenge_lbl)
	prompt_lbl = UI.label("", 34, ACCENT)
	prompt_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_how = UI.label("", 18, UI.MUTED)
	prompt_how.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if mv.sim.mode == "skills":
		vb.add_child(prompt_lbl)
		vb.add_child(prompt_how)
	challenge_panel.add_child(vb)
	root.add_child(challenge_panel)


func _replay_ui() -> void:
	replay_root = Control.new()
	replay_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	replay_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for top in [true, false]:
		var bar := ColorRect.new()
		bar.color = Color(0, 0, 0, 0.85)
		bar.set_anchors_preset(Control.PRESET_TOP_WIDE if top else Control.PRESET_BOTTOM_WIDE)
		bar.custom_minimum_size = Vector2(0, 64)
		bar.size = Vector2(0, 64)
		if not top:
			bar.position.y = -64
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		replay_root.add_child(bar)
	var tag := UI.panel(UI.FLARE, UI.FLARE, 4, 14)
	tag.position = Vector2(24, 80)
	tag.add_child(UI.label("REPLAY", 26, INK))
	replay_root.add_child(tag)
	var skip := UI.label("Any button to skip", 18, Color(1, 1, 1, 0.75))
	skip.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	skip.position = Vector2(-230, -48)
	replay_root.add_child(skip)
	replay_root.visible = false
	root.add_child(replay_root)


func show_replay(on: bool) -> void:
	replay_root.visible = on
	board.visible = not on and (mv.sim.mode == "match" or mv.sim.mode == "training")
	if touch:
		touch.visible = not on and (DisplayServer.is_touchscreen_available() or OS.has_feature("mobile") or force_touch)
		touch.active = not on


func _big_label(size: int, color: Color) -> Label:
	var l := UI.label("", size, color)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	l.add_theme_constant_override("outline_size", 10 if size > 40 else 6)
	return l


func _small_button(text: String, cb: Callable) -> Button:
	var b := UI.button(text, cb, Vector2(70, 50), "normal", 20)
	b.add_theme_stylebox_override("normal", UI.style(Color(0.03, 0.05, 0.1, 0.8), Color(1, 1, 1, 0.25)))
	b.focus_mode = Control.FOCUS_NONE
	return b


## Scene cut for restarts: fade to black, then back in on the new picture.
func fade(out: bool) -> void:
	fade_target = 1.0 if out else 0.0


func show_lineups() -> void:
	if lineup_root:
		lineup_root.queue_free()
	lineup_root = Control.new()
	lineup_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	var shade := ColorRect.new()
	shade.color = Color(0, 0, 0, 0.35)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	lineup_root.add_child(shade)
	var hb := UI.hbox(30)
	hb.set_anchors_preset(Control.PRESET_FULL_RECT)
	hb.offset_left = 40
	hb.offset_right = -40
	hb.offset_top = 30
	hb.offset_bottom = -110
	lineup_root.add_child(hb)
	var s := mv.sim
	for t in 2:
		var p := UI.panel(Color(0.03, 0.05, 0.1, 0.88), KitPainter.hex(s.teams[t]["kit"].get("shirt", 0xffffff)), 12, 18)
		p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var vb := UI.vbox(4)
		p.add_child(vb)
		var head := UI.hbox(12)
		var club: int = s.teams[t].get("club", -1)
		if club >= 0:
			head.add_child(UI.crest(club, 46))
		var tv := UI.vbox(0)
		tv.add_child(UI.label(s.teams[t]["name"], 28))
		tv.add_child(UI.label("%s  ·  %s" % ["HOME" if t == 0 else "AWAY", s.teams[t]["formation"]], 16, UI.MUTED))
		head.add_child(tv)
		vb.add_child(head)
		for q in s.team_players(t):
			var row := UI.hbox(10)
			var r := UI.label(q.role, 15, UI.role_color(q.role))
			r.custom_minimum_size = Vector2(40, 0)
			row.add_child(r)
			var nl := UI.label("%d  %s" % [q.number, q.name], 19, UI.ACCENT if q.human >= 0 else Color(1, 1, 1))
			nl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			row.add_child(nl)
			row.add_child(UI.label(str(int(q.info.get("ovr", 0))), 17, UI.MUTED))
			vb.add_child(row)
		hb.add_child(p)
	var go := UI.button("KICK OFF  ▶", func():
		lineup_root.queue_free()
		lineup_root = null
		mv.end_intro(), Vector2(300, 66), "accent", 26)
	go.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	go.position = Vector2(-150, -94)
	lineup_root.add_child(go)
	var tm := UI.button("TEAM", func(): mv.set_paused(true, "team"), Vector2(160, 66))
	tm.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	tm.position = Vector2(170, -94)
	lineup_root.add_child(tm)
	root.add_child(lineup_root)
	root.move_child(fade_rect, root.get_child_count() - 1)


func show_halftime() -> void:
	if halftime_root:
		halftime_root.queue_free()
	var o := UI.overlay(760, 520)
	halftime_root = o[0]
	var vb := UI.vbox(16)
	o[1].add_child(vb)
	vb.add_child(UI.caption("Half time"))
	var s := mv.sim
	var line := UI.hbox(18)
	line.alignment = BoxContainer.ALIGNMENT_CENTER
	line.add_child(UI.label(s.teams[0]["name"], 28))
	var sc := UI.panel(ACCENT, ACCENT, 6, 16)
	sc.add_child(UI.label("%d - %d" % [s.teams[0]["score"], s.teams[1]["score"]], 36, INK))
	line.add_child(sc)
	line.add_child(UI.label(s.teams[1]["name"], 28))
	vb.add_child(line)
	vb.add_child(_stats_block())
	var row := UI.hbox(12)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_child(UI.button("TEAM", func(): mv.set_paused(true, "team"), Vector2(200, 60)))
	row.add_child(UI.button("SECOND HALF  ▶", func():
		halftime_root.queue_free()
		halftime_root = null
		fade(true)
		mv.sim.halftime_go = true, Vector2(280, 60), "accent"))
	vb.add_child(row)
	root.add_child(halftime_root)
	root.move_child(fade_rect, root.get_child_count() - 1)


func banner(text: String, secs: float) -> void:
	banner_lbl.text = text
	banner_t = secs
	banner_lbl.modulate.a = 1.0


func toast(text: String, secs: float = 1.6) -> void:
	toast_lbl.text = text
	toast_t = secs
	toast_lbl.modulate.a = 1.0


func goal(e: Dictionary) -> void:
	var who := ""
	if e["pid"] >= 0:
		who = mv.sim.players[e["pid"]].short_name
	banner("GOAL!  " + who, 3.5)


# ------------------------------------------------------------------ pause menu

func show_pause(p: bool, page: String = "") -> void:
	if pause_root:
		pause_root.queue_free()
		pause_root = null
	if not p:
		return
	var o := UI.overlay(980, 600)
	pause_root = o[0]
	var pnl: PanelContainer = o[1]
	var vb := UI.vbox(14)
	pnl.add_child(vb)
	var top := UI.hbox(10)
	var s := mv.sim
	var title := UI.label("%s  %d - %d  %s     %s" % [s.teams[0]["short"], s.teams[0]["score"], s.teams[1]["score"], s.teams[1]["short"], lbl_clock.text], 26)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(title)
	top.add_child(UI.button("RESUME  ▶", func(): mv.set_paused(false), Vector2(190, 56), "accent"))
	vb.add_child(top)
	var pages := ["Team", "Controls", "Settings", "Match"]
	var keys := ["team", "controls", "settings", "match"]
	if mv.human_team < 0 or s.mode != "match":
		pages.erase("Team")
		keys.erase("team")
	if page == "" or not keys.has(page):
		page = keys[0]
	pause_tabs = UI.pills(pages, keys.find(page), func(i: int): _pause_page(keys[i]))
	vb.add_child(pause_tabs)
	pause_body = UI.vbox(10)
	pause_body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(pause_body)
	root.add_child(pause_root)
	_pause_page(page)


func _pause_page(key: String) -> void:
	for c in pause_body.get_children():
		c.queue_free()
	match key:
		"team":
			var tp := TeamPanel.new()
			tp.setup(mv.sim, mv.human_team)
			pause_body.add_child(tp)
		"controls":
			var cp := ControlsPanel.new()
			cp.changed.connect(func(): mv.input.pad = Profile.data["pad"].duplicate(); mv.apply_options(Profile.data["settings"]))
			pause_body.add_child(cp)
		"settings":
			var sp := SettingsPanel.new()
			sp.in_match = true
			sp.changed.connect(func(): mv.apply_options(Profile.data["settings"]))
			pause_body.add_child(sp)
		"match":
			var col := UI.vbox(12)
			col.add_child(_stats_block())
			var row := UI.hbox(12)
			row.add_child(UI.button("CAMERA: " + CameraRig.NAMES.get(mv.cam.mode, ""), func(): mv.cam.cycle(); _pause_page("match"), Vector2(280, 56)))
			if mv.sim.mode == "match" and not mv.cfg.get("competition", false):
				row.add_child(UI.button("RESTART MATCH", func(): mv.finished.emit({"restart": true}), Vector2(240, 56)))
			row.add_child(UI.button("QUIT TO MENU", func(): mv.quit_to_menu.emit(), Vector2(240, 56), "danger"))
			col.add_child(row)
			if mv.cfg.get("competition", false):
				col.add_child(UI.label("Quitting a competition match counts it as a 3-0 defeat.", 16, UI.MUTED))
			pause_body.add_child(col)


func _stats_block() -> Control:
	var s := mv.sim
	var g := GridContainer.new()
	g.columns = 3
	g.add_theme_constant_override("h_separation", 40)
	g.add_theme_constant_override("v_separation", 6)
	var tot: float = s.stats["poss"][0] + s.stats["poss"][1] + 0.001
	var rows := [["Possession", "%d%%" % int(100 * s.stats["poss"][0] / tot), "%d%%" % int(100 * s.stats["poss"][1] / tot)],
		["Shots", str(s.stats["shots"][0]), str(s.stats["shots"][1])],
		["On target", str(s.stats["on_target"][0]), str(s.stats["on_target"][1])],
		["Passes", "%d / %d" % [s.stats["passes_ok"][0], s.stats["passes"][0]], "%d / %d" % [s.stats["passes_ok"][1], s.stats["passes"][1]]]]
	for h in ["", s.teams[0]["short"], s.teams[1]["short"]]:
		g.add_child(UI.caption(h))
	for r in rows:
		g.add_child(UI.label(r[0], 20, UI.MUTED))
		g.add_child(UI.label(r[1], 22))
		g.add_child(UI.label(r[2], 22))
	return g


# ------------------------------------------------------------------ results

func show_result() -> void:
	if result_root:
		result_root.queue_free()
	var o := UI.overlay(760, 540)
	result_root = o[0]
	var vb := UI.vbox(14)
	o[1].add_child(vb)
	var s := mv.sim
	vb.add_child(UI.caption("Full time"))
	var line := UI.hbox(18)
	line.alignment = BoxContainer.ALIGNMENT_CENTER
	line.add_child(UI.label(s.teams[0]["name"], 28))
	var sc := UI.panel(ACCENT, ACCENT, 6, 16)
	sc.add_child(UI.label("%d - %d" % [s.teams[0]["score"], s.teams[1]["score"]], 36, INK))
	line.add_child(sc)
	line.add_child(UI.label(s.teams[1]["name"], 28))
	vb.add_child(line)
	var scorers := ""
	for g in s.goals_log:
		var n: String = s.players[g["pid"]].short_name if g["pid"] >= 0 else "OG"
		scorers += "%s%s %d'   " % ["◀ " if g["team"] == 0 else "▶ ", n, g["minute"]]
	if scorers != "":
		var sl := UI.label(scorers, 18, UI.MUTED)
		sl.autowrap_mode = TextServer.AUTOWRAP_WORD
		vb.add_child(sl)
	vb.add_child(_stats_block())
	var row := UI.hbox(12)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	if mv.cfg.get("competition", false):
		row.add_child(UI.button("CONTINUE  ▶", func(): mv.finished.emit(mv.result()), Vector2(260, 60), "accent"))
	else:
		row.add_child(UI.button("PLAY AGAIN", func(): mv.finished.emit({"restart": true}), Vector2(220, 60), "accent"))
		row.add_child(UI.button("MENU", func(): mv.quit_to_menu.emit(), Vector2(180, 60)))
	vb.add_child(row)
	root.add_child(result_root)
	if touch:
		touch.visible = false
		touch.active = false


func show_challenge_result(mode: String, score: int, attempts: int, best: bool) -> void:
	if result_root:
		result_root.queue_free()
	var o := UI.overlay(620, 420)
	result_root = o[0]
	var vb := UI.vbox(16)
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	o[1].add_child(vb)
	vb.add_child(UI.caption("Shooting challenge" if mode == "shooting" else "Skills challenge"))
	var big := UI.label("%d %s" % [score, "goals" if mode == "shooting" else "skills"], 54, ACCENT)
	big.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(big)
	if mode == "shooting":
		vb.add_child(UI.label("from %d attempts" % attempts, 20, UI.MUTED))
	var rec := Profile.record(mode)
	vb.add_child(UI.label("NEW RECORD!" if best else "Best: %d" % rec, 26, UI.FLARE if best else Color(1, 1, 1)))
	var row := UI.hbox(12)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_child(UI.button("TRY AGAIN", func(): mv.finished.emit({"restart": true}), Vector2(220, 60), "accent"))
	row.add_child(UI.button("MENU", func(): mv.quit_to_menu.emit(), Vector2(180, 60)))
	vb.add_child(row)
	root.add_child(result_root)
	if touch:
		touch.visible = false
		touch.active = false


# ------------------------------------------------------------------ per frame

func update_hud(dt: float) -> void:
	var s := mv.sim
	lbl_score.text = "%d - %d" % [s.teams[0]["score"], s.teams[1]["score"]]
	var mnt := s.minute()
	lbl_clock.text = "%02d:%02d" % [int(mnt), int(fmod(mnt, 1.0) * 60.0)] if s.mode == "match" else "TRAINING"
	var lim := 45.0 * s.half
	var show_added: bool = s.mode == "match" and mnt >= lim - 1.0 and s.phase != "halftime"
	added_lbl.get_parent().visible = show_added
	if show_added:
		added_lbl.text = "+%d" % s.added[s.half - 1]
	mom_bar.visible = s.mode == "match"
	mom_bar.queue_redraw()
	if banner_t > 0.0:
		banner_t -= dt
		banner_lbl.modulate.a = clampf(banner_t * 2.0, 0.0, 1.0)
	if toast_t > 0.0:
		toast_t -= dt
		toast_lbl.modulate.a = clampf(toast_t * 3.0, 0.0, 1.0)
	var fa := fade_rect.color.a
	fade_rect.color.a = move_toward(fa, fade_target, dt / (0.25 if fade_target > fa else 0.4))
	# celebration prompt
	var ours_scored: bool = s.phase == "goal" and not s.goals_log.is_empty() and s.goals_log.back()["team"] == mv.human_team and s.celebrated_goal != s.goals_log.size() and s.goals_log.back()["pid"] >= 0
	celebrate_lbl.visible = ours_scored and not mv.replay.playing
	if ours_scored:
		celebrate_lbl.text = "TAP ANY BUTTON TO CELEBRATE"
	elif s.phase in ["kickoff", "restart"] and not s.humans.is_empty() and s.restart.get("taker", -1) == s.humans[0]["pid"] and s.phase_t > 1.2 and not mv.paused:
		celebrate_lbl.visible = true
		var k: String = s.restart.get("kind", "")
		celebrate_lbl.text = "PASS to kick off" if k == "kickoff" else ("SHOOT to take the penalty" if k == "penalty" else "PASS / LOB / SHOOT to take it")
	# stoppage: the team button (and the team menu itself once per stoppage if the setting is on)
	var stop := mv.is_stoppage() and mv.human_team >= 0 and not mv.paused and not mv.replay.playing
	team_btn.visible = stop
	if stop and stoppage_auto and s.phase_t > 0.35:
		var key := "%s:%d:%.0f" % [s.phase, s.goals_log.size(), s.time - s.phase_t]
		if key != last_stoppage_key and s.restart.get("kind", "") in ["free_kick", "penalty", "kickoff"] and s.phase_t < 1.0:
			last_stoppage_key = key
			if (s.restart.get("kind", "") != "kickoff" or s.half_t > 1.0) and s.time > 3.0:   # not at the start of a half or a challenge
				mv.set_paused(true, "team")
	# practice modes
	if challenge_panel and mv.challenge:
		var c := mv.challenge
		if c.mode == "training":
			challenge_lbl.text = "TRAINING  ·  your team v the keeper"
		else:
			challenge_lbl.text = "%s   %02d s   ·   %d" % ["SHOOTING" if c.mode == "shooting" else "SKILLS", int(ceil(c.time_left)), c.score]
		if c.mode == "skills":
			var pt: Array = c.prompt_text()
			prompt_lbl.text = pt[0]
			prompt_how.text = pt[1]
	# name tag + power bar over the controlled player
	var pid: int = s.humans[0]["pid"] if not s.humans.is_empty() else -1
	if pid >= 0 and s.phase != "goal" and not mv.replay.playing:
		var p := s.players[pid]
		var head := Vector3(p.pos.x, 2.6, p.pos.y)
		if not mv.cam.is_position_behind(head):
			var sp := mv.cam.unproject_position(head)
			name_tag.visible = show_names
			name_tag.text = "%d  %s" % [p.number, p.short_name]
			name_tag.position = sp - Vector2(name_tag.size.x * 0.5, 34)
			stamina_bar.visible = show_names
			stamina_bar.position = sp - Vector2(35, 8)
			if absf(stamina_v - p.stamina) > 0.01:
				stamina_v = p.stamina
				stamina_bar.queue_redraw()
			var g := mv.input.gauge_name != ""
			power.visible = g
			if g:
				power.value = mv.input.gauge * 100.0
				power.position = sp + Vector2(-45, 78)
		else:
			name_tag.visible = false
			stamina_bar.visible = false
	else:
		name_tag.visible = false
		stamina_bar.visible = false
		power.visible = false
	var touch_ok := (DisplayServer.is_touchscreen_available() or OS.has_feature("mobile") or force_touch) and not mv.paused and not mv.replay.playing and result_root == null and halftime_root == null and lineup_root == null
	touch.active = touch_ok
	# the controls stay on screen unless a real pad (one a button was pressed on) is being played with
	touch.visible = touch_ok and touch.should_show()
	radar.queue_redraw()
