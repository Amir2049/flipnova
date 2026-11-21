class_name TeamPanel
extends VBoxContainer
## In-match team management: formation, who is on the pitch (with stamina), the bench and substitutions,
## and swapping two players' positions.

var sim: MatchSim
var team := 0
var pick_on := -1        # pid on the pitch selected
var pick_bench := -1     # bench index selected
var body: HBoxContainer
var info: Label


func setup(m: MatchSim, t: int) -> void:
	sim = m
	team = t


func _ready() -> void:
	add_theme_constant_override("separation", 10)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	_build()


func _build() -> void:
	for c in get_children():
		c.queue_free()
	var top := UI.hbox(10)
	top.add_child(UI.caption("Formation"))
	var forms := GameData.FORMATIONS.keys()
	top.add_child(UI.pills(forms, forms.find(sim.teams[team]["formation"]), func(i: int):
		sim.set_formation(team, forms[i])
		_build()))
	add_child(top)
	info = UI.label("", 18, UI.ACCENT)
	add_child(info)
	body = UI.hbox(16)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(body)
	# on the pitch
	var left := UI.vbox(6)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.add_child(UI.caption("On the pitch"))
	for p in sim.team_players(team):
		left.add_child(_row_on(p))
	body.add_child(UI.scroll(left))
	# bench
	var right := UI.vbox(6)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_child(UI.caption("Bench  ·  %d substitutions left" % sim.teams[team]["subs_left"]))
	var bench: Array = sim.teams[team]["bench"]
	for i in bench.size():
		right.add_child(_row_bench(bench[i], i))
	body.add_child(UI.scroll(right))
	_update_info()


func _row_on(p: PlayerSim) -> Control:
	var sel := pick_on == p.id
	var b := UI.button("", func():
		if pick_on >= 0 and pick_on != p.id and pick_bench < 0:
			sim.swap_positions(team, pick_on, p.id)
			pick_on = -1
		else:
			pick_on = -1 if pick_on == p.id else p.id
		_build(), Vector2(0, 46), "accent" if sel else "normal", 17)
	var h := UI.hbox(8)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.set_anchors_preset(Control.PRESET_FULL_RECT)
	h.offset_left = 10
	h.offset_right = -10
	var role := UI.label(p.role, 15, UI.role_color(p.role))
	role.custom_minimum_size = Vector2(40, 0)
	h.add_child(role)
	var n := UI.label("%d  %s" % [p.number, p.name], 18, UI.INK if sel else Color(1, 1, 1))
	n.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	n.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	h.add_child(n)
	var st := UI.bar(p.stamina, 70, 8)
	st.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	h.add_child(st)
	b.add_child(h)
	return b


func _row_bench(d: Dictionary, i: int) -> Control:
	var off: bool = d.get("off", false)
	var sel := pick_bench == i
	var b := UI.button("", func():
		pick_bench = -1 if pick_bench == i else i
		_build(), Vector2(0, 46), "accent" if sel else "normal", 17)
	b.disabled = off
	var h := UI.hbox(8)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.set_anchors_preset(Control.PRESET_FULL_RECT)
	h.offset_left = 10
	h.offset_right = -10
	var pos: String = d.get("pos", "")
	var role := UI.label(pos, 15, UI.role_color(pos))
	role.custom_minimum_size = Vector2(40, 0)
	h.add_child(role)
	var n := UI.label("%d  %s%s" % [int(d.get("number", 0)), d.get("name", ""), "  (subbed off)" if off else ""], 18, UI.INK if sel else Color(1, 1, 1))
	n.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	n.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	h.add_child(n)
	h.add_child(UI.label(str(d.get("ovr", "")), 18, UI.ACCENT if not sel else UI.INK))
	b.add_child(h)
	return b


func _update_info() -> void:
	if pick_on >= 0 and pick_bench >= 0:
		var off_name := sim.players[pick_on].short_name
		var on_name: String = sim.teams[team]["bench"][pick_bench].get("short", "")
		if sim.substitute(team, pick_on, pick_bench):
			info.text = "%s comes on for %s" % [on_name, off_name]
		else:
			info.text = "That change isn't possible now"
		pick_on = -1
		pick_bench = -1
		call_deferred("_build_keep", info.text)
	elif pick_on >= 0:
		info.text = "Pick a bench player to bring on, or another player to swap positions with"
	elif pick_bench >= 0:
		info.text = "Pick the player to take off"
	else:
		info.text = "Tap a player on the pitch, then a bench player to make a substitution"


func _build_keep(msg: String) -> void:
	_build()
	info.text = msg
