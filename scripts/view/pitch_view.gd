class_name PitchView
extends Node3D
## Pitch (markings drawn by a shader, so they stay sharp), goals with nets, ad boards, stands with a crowd, lights.

var pitch: Pitch
var nets: Array[MeshInstance3D] = []
var net_shake := [0.0, 0.0]

const GRASS_SHADER := """
shader_type spatial;
uniform vec2 size = vec2(105.0, 68.0);
uniform float box_d = 16.5;
uniform float box_w = 40.3;
uniform float six_d = 5.5;
uniform float six_w = 18.32;
uniform float circle_r = 9.15;
uniform float spot_d = 11.0;
// measured against EA FC 27 broadcast frames (grass hue 65-90 deg, saturation 0.66-0.73, luminance spread 20-25):
// a yellower, richer green than before (hue ~101, sat 0.54, spread 17), stripes with more contrast
uniform vec3 grass_a : source_color = vec3(0.13, 0.24, 0.032);
uniform vec3 grass_b : source_color = vec3(0.21, 0.345, 0.045);   // ~8 % darker: FC frames sit at luminance ~127
uniform float wet = 0.0;
// the main stand behind the camera (not drawn) still throws its roof's shadow across the near part of the pitch
uniform vec3 sun_to = vec3(0.0, 1.0, 0.0);   // direction from the ground toward the sun
uniform float stand_z = 41.5;                 // the shadowing stand's front edge (+z side)
uniform float roof_h = 21.0;                  // its roof edge height
uniform float stand_shadow = 0.0;             // 0 = off (night, cloud), 1 = full
// real turf: a CC0 grass photo (ambientCG Grass005) at two scales, as relative detail on top of the mowing colours,
// and its normal map so the blades catch the light
uniform sampler2D grass_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D grass_nrm : hint_normal, filter_linear_mipmap, repeat_enable;
uniform vec3 grass_avg = vec3(0.3978, 0.517, 0.1711);
uniform float detail = 0.0;                   // 0 = no texture (it failed to load), 1 = full
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float ln(float d, float w) { float aa = fwidth(d) * 1.2; return 1.0 - smoothstep(w * 0.5 - aa, w * 0.5 + aa, abs(d)); }
void fragment() {
	vec2 p = wpos.xz;
	float hl = size.x * 0.5;
	float hw = size.y * 0.5;
	float stripes = 18.0;
	float sp = fract((p.x + hl) / size.x * stripes * 0.5);
	float s = smoothstep(0.49, 0.51, sp) - smoothstep(0.99, 1.0, sp);
	// mowed grass leans one way per stripe: which stripe looks light depends on where the camera looks from
	vec3 vdir = normalize(wpos - CAMERA_POSITION_WORLD);
	float lean = mix(1.0, -1.0, s) * clamp(vdir.x * 1.6, -1.0, 1.0);
	vec3 col = mix(grass_a, grass_b, 0.5 + 0.5 * mix(-1.0, 1.0, s) * 0.95 + lean * 0.45);
	col *= 0.93 + 0.12 * noise(p * 0.9) + 0.05 * noise(p * 6.0) + 0.04 * noise(p * 31.0);
	if (detail > 0.0) {
		vec3 d1 = texture(grass_tex, p / 2.2).rgb / grass_avg;
		vec3 d2 = texture(grass_tex, p / 8.5 + vec2(0.37, 0.61)).rgb / grass_avg;
		vec3 dd = mix(vec3(1.0), d1, 0.55) * mix(vec3(1.0), d2, 0.3);
		col *= mix(vec3(1.0), clamp(dd, vec3(0.5), vec3(1.6)), detail);
		NORMAL_MAP = texture(grass_nrm, p / 2.2).rgb;
		NORMAL_MAP_DEPTH = 0.7 * detail;
	}
	// worn turf: goal mouths and the centre spot
	vec2 qq = vec2(abs(p.x), p.y);
	float wear = exp(-pow(length((qq - vec2(hl - 3.0, 0.0)) / vec2(3.5, 4.5)), 2.0)) + 0.5 * exp(-pow(length(p / 3.0), 2.0));
	col = mix(col, vec3(0.33, 0.33, 0.2), clamp(wear, 0.0, 1.0) * 0.35);
	float inside = step(abs(p.x), hl + 0.1) * step(abs(p.y), hw + 0.1);
	col *= mix(0.62, 1.0, inside);
	float lw = 0.12;
	float L = 0.0;
	L = max(L, ln(abs(p.x) - hl, lw) * step(abs(p.y), hw + lw));
	L = max(L, ln(abs(p.y) - hw, lw) * step(abs(p.x), hl + lw));
	L = max(L, ln(p.x, lw) * step(abs(p.y), hw));
	L = max(L, ln(length(p) - circle_r, lw));
	L = max(L, 1.0 - smoothstep(0.16, 0.2, length(p)));
	vec2 q = vec2(abs(p.x), p.y);
	L = max(L, ln(q.x - (hl - box_d), lw) * step(abs(q.y), box_w * 0.5));
	L = max(L, ln(abs(q.y) - box_w * 0.5, lw) * step(hl - box_d, q.x) * step(q.x, hl));
	L = max(L, ln(q.x - (hl - six_d), lw) * step(abs(q.y), six_w * 0.5));
	L = max(L, ln(abs(q.y) - six_w * 0.5, lw) * step(hl - six_d, q.x) * step(q.x, hl));
	L = max(L, 1.0 - smoothstep(0.1, 0.14, length(q - vec2(hl - spot_d, 0.0))));
	L = max(L, ln(length(q - vec2(hl - spot_d, 0.0)) - circle_r, lw) * step(q.x, hl - box_d));
	L = max(L, ln(length(vec2(hl - q.x, hw - abs(q.y))) - 1.0, lw) * step(hl - 1.0, q.x) * step(hw - 1.0, abs(q.y)));
	col = mix(col, vec3(0.86), L * 0.92);
	// roof shadow: follow the ray toward the sun to the stand's front; below the roof edge there = in shade
	if (stand_shadow > 0.0 && sun_to.z > 0.05) {
		float t = (stand_z - p.y) / sun_to.z;
		float h = t * sun_to.y;
		float shade = (1.0 - smoothstep(roof_h - 1.2, roof_h + 1.2, h)) * step(0.0, t);
		col = mix(col, col * vec3(0.5, 0.56, 0.68), shade * stand_shadow);
	}
	ALBEDO = col * (1.0 - 0.18 * wet);
	ROUGHNESS = 0.92 - 0.45 * wet;
	SPECULAR = 0.2;
}
"""




func build(p: Pitch) -> void:
	pitch = p
	_ground()
	for side in [-1.0, 1.0]:
		_goal(side)
	if p.walls:
		_cage()
	else:
		_boards()
	_stands()
	if not p.walls:
		_pitchside()


func _ground() -> void:
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(pitch.length + 24.0, pitch.width + 24.0)
	pm.subdivide_width = 4
	pm.subdivide_depth = 4
	mi.mesh = pm
	var sm := ShaderMaterial.new()
	var sh := Shader.new()
	sh.code = GRASS_SHADER
	sm.shader = sh
	sm.set_shader_parameter("size", Vector2(pitch.length, pitch.width))
	sm.set_shader_parameter("box_d", pitch.box_depth)
	sm.set_shader_parameter("box_w", pitch.box_width)
	sm.set_shader_parameter("six_d", pitch.six_depth)
	sm.set_shader_parameter("six_w", pitch.six_width)
	sm.set_shader_parameter("circle_r", pitch.circle_radius)
	sm.set_shader_parameter("spot_d", pitch.penalty_spot)
	grass_mat = sm
	if ResourceLoader.exists("res://assets/textures/grass_color.jpg") and ResourceLoader.exists("res://assets/textures/grass_normal.jpg"):
		sm.set_shader_parameter("grass_tex", load("res://assets/textures/grass_color.jpg"))
		sm.set_shader_parameter("grass_nrm", load("res://assets/textures/grass_normal.jpg"))
		sm.set_shader_parameter("detail", 1.0)
	_stand_shadow(sm)
	mi.material_override = sm
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


## Day matches: the sun's direction from the view's main light (it exists before the pitch is built) so the stand
## behind the camera shades the near side of the pitch, as on TV.
func _stand_shadow(sm: ShaderMaterial) -> void:
	var sun: DirectionalLight3D = null
	if get_parent():
		for c in get_parent().get_children():
			if c is DirectionalLight3D and (c as DirectionalLight3D).shadow_enabled:
				sun = c
				break
	if sun == null or pitch.walls:
		return
	var to_sun := sun.transform.basis.z.normalized()   # the view sits at the origin; global_transform may not be updated yet
	var night_like := sun.light_color.b > sun.light_color.r or sun.rotation_degrees.x < -60.0
	sm.set_shader_parameter("sun_to", to_sun)
	sm.set_shader_parameter("stand_z", pitch.half_w() + 7.5)
	sm.set_shader_parameter("roof_h", 21.0)
	sm.set_shader_parameter("stand_shadow", 0.0 if night_like else 0.85)


func _goal(side: float) -> void:
	var hl := pitch.half_l()
	var gw := pitch.goal_width
	var gh := pitch.goal_height
	var gd := pitch.goal_depth
	var white := StandardMaterial3D.new()
	white.albedo_color = Color(0.96, 0.96, 0.96)
	white.roughness = 0.35
	var r := pitch.post_radius
	var x := side * (hl + r)
	for z in [-gw * 0.5 - r, gw * 0.5 + r]:
		var post := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = r
		cm.bottom_radius = r
		cm.height = gh + r
		post.mesh = cm
		post.material_override = white
		post.position = Vector3(x, (gh + r) * 0.5, z)
		add_child(post)
	var bar := MeshInstance3D.new()
	var bm := CylinderMesh.new()
	bm.top_radius = r
	bm.bottom_radius = r
	bm.height = gw + 2 * r
	bar.mesh = bm
	bar.material_override = white
	bar.rotation_degrees = Vector3(90, 0, 0)
	bar.position = Vector3(x, gh + r, 0)
	add_child(bar)
	# back frame
	for z in [-gw * 0.5, gw * 0.5]:
		var bp := MeshInstance3D.new()
		var c2 := CylinderMesh.new()
		c2.top_radius = 0.025
		c2.bottom_radius = 0.025
		c2.height = gh * 0.8
		bp.mesh = c2
		bp.material_override = white
		bp.position = Vector3(side * (hl + gd), gh * 0.4, z)
		add_child(bp)
	# net: roof, back, sides
	var net_mat := StandardMaterial3D.new()
	# blended, not alpha-scissored: with mipmaps the thin strands averaged under the scissor and the net vanished at
	# broadcast distance; blended they fade into the white haze a real net makes from the stand
	net_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	net_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	net_mat.albedo_texture = _net_texture()
	net_mat.uv1_triplanar = true
	net_mat.uv1_scale = Vector3(3, 3, 3)
	net_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	net_mat.albedo_color = Color(0.95, 0.95, 0.95)
	var net := MeshInstance3D.new()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var a := Vector3(side * hl, gh, -gw * 0.5)
	var b := Vector3(side * hl, gh, gw * 0.5)
	var c := Vector3(side * (hl + gd), gh * 0.8, gw * 0.5)
	var d := Vector3(side * (hl + gd), gh * 0.8, -gw * 0.5)
	var e := Vector3(side * (hl + gd), 0, gw * 0.5)
	var f := Vector3(side * (hl + gd), 0, -gw * 0.5)
	var g := Vector3(side * hl, 0, gw * 0.5)
	var h := Vector3(side * hl, 0, -gw * 0.5)
	_quad(st, a, b, c, d)      # roof
	_quad(st, d, c, e, f)      # back
	_quad(st, b, g, e, c)      # side
	_quad(st, a, d, f, h)      # side
	st.generate_normals()
	net.mesh = st.commit()
	net.material_override = net_mat
	net.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(net)
	nets.append(net)


func _quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3) -> void:
	for v in [a, b, c, a, c, d]:
		st.add_vertex(v)


func _net_texture() -> ImageTexture:
	var img := Image.create(64, 64, true, Image.FORMAT_RGBA8)
	img.fill(Color(1, 1, 1, 0))
	for i in 64:
		for k in [0, 1, 2, 32, 33, 34]:
			img.set_pixel(i, k, Color(1, 1, 1, 1))
			img.set_pixel(k, i, Color(1, 1, 1, 1))
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


func _boards() -> void:
	var hl := pitch.half_l()
	var hw := pitch.half_w()
	var texts := ["AFC", "PLAY ON", "AFC ARENA", "FAIR PLAY", "GOAL!", "AFC"]
	# LED boards: the light is in the lettering (UI palette: chalk, brass, ticket red, Nile teal)
	var colors := [Color("edefe6"), Color("e0b43a"), Color("ff3b4e"), Color("3fd1c5")]
	var n := 0
	for side in [-1.0, 1.0]:
		var z: float = side * (hw + 4.0)
		var x := -hl
		while x < hl:
			_board(Vector3(x + 5.0, 0.45, z), Vector3(0, 0 if side > 0 else 180, 0), 10.0, texts[n % texts.size()], colors[n % colors.size()])
			x += 10.0
			n += 1
	for side in [-1.0, 1.0]:
		var x2: float = side * (hl + 4.5)
		for z2 in [-hw + 5.0, -hw + 15.0, hw - 15.0, hw - 5.0]:
			_board(Vector3(x2, 0.45, z2), Vector3(0, -90 * side, 0), 10.0, texts[n % texts.size()], colors[n % colors.size()])
			n += 1


## Hara Street: low painted walls all round (the ball plays off them) and a fence above.
func _cage() -> void:
	var hl := pitch.half_l()
	var hw := pitch.half_w()
	var gw := pitch.goal_width * 0.5
	var paint := [Color(0.78, 1.0, 0.24), Color(1.0, 0.42, 0.17), Color(0.2, 0.8, 0.9), Color(0.95, 0.3, 0.6), Color(1.0, 0.85, 0.2)]
	var words := ["HARA", "STREET", "AFC", "NO RULES", "SKILL", "HARA"]
	var n := 0
	var h := 1.1
	# side walls
	for side in [-1.0, 1.0]:
		var x := -hl
		while x < hl - 0.01:
			var w := minf(6.0, hl - x)
			var wh := h if side < 0.0 else 0.7
			_wall(Vector3(x + w * 0.5, wh * 0.5, side * (hw + 0.15)), Vector3(w, wh, 0.3), paint[n % paint.size()], words[n % words.size()] if side < 0.0 else "", side < 0.0)
			x += w
			n += 1
	# end walls either side of the goal
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			var len := hw - gw
			_wall(Vector3(sx * (hl + 0.15), h * 0.5, sz * (gw + len * 0.5)), Vector3(0.3, h, len), paint[n % paint.size()], "", false)
			n += 1
	# chain-link fence above the walls
	var fence := StandardMaterial3D.new()
	fence.albedo_texture = _net_texture()
	fence.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	fence.cull_mode = BaseMaterial3D.CULL_DISABLED
	fence.uv1_scale = Vector3(pitch.length / 2.0, 2.0, 1.0)
	fence.albedo_color = Color(0.75, 0.78, 0.82)
	var fh := 3.2
	var post_mat := StandardMaterial3D.new()
	post_mat.albedo_color = Color(0.25, 0.27, 0.3)
	post_mat.metallic = 0.5
	for side in [-1.0]:   # no fence on the camera side
		var fm := MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(pitch.length + 0.6, fh)
		fm.mesh = q
		fm.material_override = fence
		fm.position = Vector3(0, h + fh * 0.5, side * (hw + 0.15))
		fm.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(fm)
		var x := -hl
		while x <= hl + 0.01:
			var post := MeshInstance3D.new()
			var cm := CylinderMesh.new()
			cm.top_radius = 0.06
			cm.bottom_radius = 0.06
			cm.height = h + fh
			post.mesh = cm
			post.material_override = post_mat
			post.position = Vector3(x, (h + fh) * 0.5, side * (hw + 0.32))
			add_child(post)
			x += 6.0
	for sx in [-1.0, 1.0]:
		var fm2 := MeshInstance3D.new()
		var q2 := QuadMesh.new()
		q2.size = Vector2(pitch.width + 0.6, fh)
		fm2.mesh = q2
		fm2.material_override = fence
		fm2.rotation_degrees = Vector3(0, 90, 0)
		fm2.position = Vector3(sx * (hl + 0.15 + pitch.goal_depth), h + fh * 0.5, 0)
		fm2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(fm2)


func _wall(pos: Vector3, size: Vector3, color: Color, text: String, far: bool) -> void:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color.darkened(0.15)
	mat.roughness = 0.85
	mi.material_override = mat
	mi.position = pos
	add_child(mi)
	if text != "":
		var l := Label3D.new()
		l.text = text
		l.font_size = 96
		l.pixel_size = 0.006
		l.modulate = Color(0.06, 0.07, 0.1)
		l.outline_size = 0
		l.position = pos + Vector3(0, 0, 0.16 if far else -0.16)
		l.rotation_degrees = Vector3(0, 0 if far else 180, 0)
		add_child(l)


func _board(pos: Vector3, rot: Vector3, width: float, text: String, color: Color) -> void:
	var root := Node3D.new()
	root.position = pos
	root.rotation_degrees = rot
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(width, 0.9, 0.12)
	mi.mesh = bm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.03, 0.035, 0.045)
	mat.roughness = 0.35
	mat.emission_enabled = true
	mat.emission = color * 0.06
	mi.material_override = mat
	root.add_child(mi)
	var lb := Label3D.new()
	lb.text = text
	lb.font_size = 72
	lb.pixel_size = 0.006
	lb.position = Vector3(0, 0, -0.07)
	lb.rotation_degrees = Vector3(0, 180, 0)
	lb.modulate = color * 1.15   # unshaded: the LED glow
	lb.outline_size = 0
	root.add_child(lb)
	add_child(root)


const FAN_SHADER := """
shader_type spatial;
uniform float excite = 0.0;
varying vec3 shirt;
varying float part;
varying float skin;
varying float rowh;
void vertex() {
	rowh = MODEL_MATRIX[3].y;
	float id = INSTANCE_CUSTOM.x;
	part = UV.x;
	skin = INSTANCE_CUSTOM.y;
	shirt = COLOR.rgb;
	float e = clamp(excite, 0.0, 1.0);
	// arms go up when the crowd gets going
	if (part > 1.5 && part < 2.5) {
		float sx = sign(VERTEX.x);
		float raise = clamp(e * 1.6 - id * 0.6, 0.0, 1.0) * (0.75 + 0.25 * sin(TIME * 7.0 + id * 31.0));
		raise = max(raise, step(0.93, id) * (0.5 + 0.5 * sin(TIME * 2.0 + id * 9.0)));
		vec2 rel = vec2(VERTEX.x - sx * 0.2, VERTEX.y - 1.33);
		float a = raise * 2.7 * sx;
		rel = vec2(rel.x * cos(a) - rel.y * sin(a), rel.x * sin(a) + rel.y * cos(a));
		VERTEX.x = rel.x + sx * 0.2;
		VERTEX.y = rel.y + 1.33;
	}
	// bouncing: a few always sway, everybody jumps after a goal
	float hop = max(0.0, sin(TIME * (2.2 + 5.0 * e) + id * 40.0));
	VERTEX.y += hop * (0.015 + 0.3 * e * step(0.25, id));
	VERTEX.x += sin(TIME * 1.3 + id * 17.0) * 0.03;
}
void fragment() {
	vec3 sk = mix(vec3(0.33, 0.21, 0.14), vec3(0.86, 0.66, 0.52), skin);
	vec3 c = part > 0.5 && part < 1.5 ? sk : shirt;
	if (part > 2.5) c = vec3(0.1, 0.1, 0.12);
	float g = dot(c, vec3(0.3, 0.59, 0.11));
	c = mix(vec3(g), c, 0.72);
	ALBEDO = c * (1.0 - 0.5 * clamp((rowh - 1.5) / 14.0, 0.0, 1.0));
	ROUGHNESS = 0.9;
}
"""

## Crowd cards: real people rendered in Blender (tools/blender/make_crowd.py) in an atlas, column = fan, row 0 calm,
## row 1 cheering. Cards stand on the terraces facing the pitch, bob a little, and swap to cheering with the game.
const CROWD_ATLAS := "res://assets/stadium/crowd_atlas.png"
const CARD_SHADER := """
shader_type spatial;
render_mode cull_disabled;
uniform sampler2D atlas : source_color, filter_linear_mipmap;
uniform float fans = 16.0;
uniform float excite = 0.0;
varying float id;
varying float rowh;
void vertex() {
	id = INSTANCE_CUSTOM.x;
	rowh = MODEL_MATRIX[3].y;
	float e = clamp(excite, 0.0, 1.0);
	float hop = max(0.0, sin(TIME * (2.2 + 5.0 * e) + id * 40.0));
	VERTEX.y += 1.025 - 0.125 + hop * (0.015 + 0.25 * e * step(0.25, id));
	VERTEX.x += sin(TIME * 1.3 + id * 17.0) * 0.03;
}
void fragment() {
	float e = clamp(excite, 0.0, 1.0);
	float fan = floor(id * fans);
	float cheer = step(0.5, clamp(e * 1.6 - id * 0.6, 0.0, 1.0) * (0.75 + 0.25 * sin(TIME * 7.0 + id * 31.0)) + step(0.95, id) * 0.6);
	vec2 uv = vec2((fan + UV.x) / fans, (cheer + UV.y) * 0.5);
	vec4 t = texture(atlas, uv);
	if (t.a < 0.5) discard;
	// the renders were lit for a portrait: in the stand, under the roof, people read much darker (TV crowds are dark)
	vec3 c = t.rgb * 0.5;
	float g = dot(c, vec3(0.3, 0.59, 0.11));
	c = mix(vec3(g), c, 0.8);
	ALBEDO = c * (1.0 - 0.45 * clamp((rowh - 1.5) / 14.0, 0.0, 1.0));
	ROUGHNESS = 0.95;
	SPECULAR = 0.1;
}
"""

var crowd_mat: ShaderMaterial
var grass_mat: ShaderMaterial
var quality := 1
var crowd_cards := false
var excite := 0.0
var excite_target := 0.15


func _stands() -> void:
	var hl := pitch.half_l()
	var hw := pitch.half_w()
	var sm := ShaderMaterial.new()
	var sh := Shader.new()
	if ResourceLoader.exists(CROWD_ATLAS):
		sh.code = CARD_SHADER
		sm.set_shader_parameter("atlas", load(CROWD_ATLAS))
		crowd_cards = true
	else:
		sh.code = FAN_SHADER
	sm.shader = sh
	crowd_mat = sm
	var concrete := StandardMaterial3D.new()
	concrete.albedo_color = Color(0.3, 0.31, 0.34)
	concrete.roughness = 0.95
	var steps := StandardMaterial3D.new()
	steps.vertex_color_use_as_albedo = true
	steps.roughness = 0.9
	var fan: Mesh = _fan_mesh()
	if crowd_cards:
		var q := QuadMesh.new()
		q.size = Vector2(1.37, 2.05)   # the atlas cell: 128 x 192 px of a 2.05 m orthographic frame
		fan = q
	# the far side and both ends (no stand on the camera side: the broadcast camera sits there)
	_tier(Vector3(0, 0, -hw - 7.5), pitch.length + 34.0, 180.0, steps, concrete, fan, 0)
	_tier(Vector3(hl + 9.0, 0, 0), pitch.width + 24.0, 90.0, steps, concrete, fan, 1)
	_tier(Vector3(-hl - 9.0, 0, 0), pitch.width + 24.0, -90.0, steps, concrete, fan, 2)
	_floodlights()


## A low-poly supporter: shirt body, head, arms that can be raised (UV.x tags the part for the shader).
func _fan_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	_box(st, Vector3(-0.2, 0.8, -0.12), Vector3(0.2, 1.36, 0.12), 0.0, false)
	_box(st, Vector3(-0.1, 1.38, -0.11), Vector3(0.1, 1.62, 0.11), 1.0, false)
	_box(st, Vector3(0.2, 0.9, -0.06), Vector3(0.3, 1.35, 0.06), 2.0, true)
	_box(st, Vector3(-0.3, 0.9, -0.06), Vector3(-0.2, 1.35, 0.06), 2.0, true)
	_box(st, Vector3(-0.18, 0.3, -0.1), Vector3(0.18, 0.8, 0.1), 3.0, true)
	st.generate_normals()
	return st.commit()


func _box(st: SurfaceTool, lo: Vector3, hi: Vector3, part: float, open_ends: bool) -> void:
	var c := [Vector3(lo.x, lo.y, lo.z), Vector3(hi.x, lo.y, lo.z), Vector3(hi.x, hi.y, lo.z), Vector3(lo.x, hi.y, lo.z),
		Vector3(lo.x, lo.y, hi.z), Vector3(hi.x, lo.y, hi.z), Vector3(hi.x, hi.y, hi.z), Vector3(lo.x, hi.y, hi.z)]
	var faces := [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3]]
	if not open_ends:
		faces.append([0, 1, 5, 4])
	for f in faces:
		for k in [0, 1, 2, 0, 2, 3]:
			st.set_uv(Vector2(part, 0))
			st.add_vertex(c[f[k]])


const STAND_SECTION := "res://assets/stadium/stand_section.glb"   # tools/blender/make_stadium.py
const FLOODLIGHT := "res://assets/stadium/floodlight.glb"
const SECTION_LEN := 12.0


## The Blender stand: 12 m sections (terraces, seats, aisle, roof, baked shading) side by side, stretched a little so
## a whole number of them fills `length`. Same rows / tread / rise as the code-built stand below.
func _blender_stand(root: Node3D, length: float) -> bool:
	if not ResourceLoader.exists(STAND_SECTION):
		return false
	var scene: PackedScene = load(STAND_SECTION)
	var n := maxi(1, int(ceil(length / SECTION_LEN)))
	var sx := length / (n * SECTION_LEN)
	for i in n:
		var sec := scene.instantiate() as Node3D
		sec.position = Vector3(-length * 0.5 + (i + 0.5) * SECTION_LEN * sx, 0, 0)
		sec.scale = Vector3(sx, 1, 1)
		root.add_child(sec)
		for mi in sec.find_children("*", "MeshInstance3D", true, false):
			var m3 := mi as MeshInstance3D
			m3.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			m3.material_override = _stand_material(m3)
	return true


var _stand_mat: StandardMaterial3D


## The baked stand texture already holds its shading; under the match sun it washed out to white, so the stand gets
## one shared material: the baked colours a little darker and matt (and one material for all sections).
func _stand_material(mi: MeshInstance3D) -> Material:
	if _stand_mat == null:
		var src := mi.get_active_material(0) as StandardMaterial3D
		_stand_mat = StandardMaterial3D.new()
		if src:
			_stand_mat.albedo_texture = src.albedo_texture
		_stand_mat.albedo_color = Color(0.62, 0.62, 0.62)
		_stand_mat.roughness = 0.95
		_stand_mat.metallic_specular = 0.15
		_stand_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return _stand_mat


func _tier(pos: Vector3, length: float, yaw: float, steps_mat: Material, concrete: Material, fan: Mesh, which: int) -> void:
	var root := Node3D.new()
	root.position = pos
	root.rotation_degrees = Vector3(0, yaw, 0)
	add_child(root)
	var rows := 26
	var tread := 0.85
	var rise := 0.55
	var base := 1.3
	if _blender_stand(root, length):
		_crowd(root, length, rows, tread, rise, base, fan, which)
		return
	# stepped terraces, seats in blocks of colour
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var hl := length * 0.5
	var block_cols := [Color(0.09, 0.16, 0.36), Color(0.12, 0.13, 0.16)]
	for r in rows:
		var z0 := r * tread
		var y0 := base + r * rise
		var col: Color = block_cols[(r / 6) % 2]
		st.set_color(col.darkened(0.25))
		_quad3(st, Vector3(-hl, y0 - rise, z0), Vector3(hl, y0 - rise, z0), Vector3(hl, y0, z0), Vector3(-hl, y0, z0))
		st.set_color(col)
		_quad3(st, Vector3(-hl, y0, z0), Vector3(hl, y0, z0), Vector3(hl, y0, z0 + tread), Vector3(-hl, y0, z0 + tread))
	var depth := rows * tread
	var top := base + rows * rise
	st.set_color(Color(0.18, 0.19, 0.22))
	_quad3(st, Vector3(-hl, top, depth), Vector3(hl, top, depth), Vector3(hl, top + 3.0, depth), Vector3(-hl, top + 3.0, depth))
	st.generate_normals()
	var terr := MeshInstance3D.new()
	terr.mesh = st.commit()
	terr.material_override = steps_mat
	terr.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(terr)
	# front wall
	var wall := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(length, base + 0.2, 0.4)
	wall.mesh = bm
	wall.position = Vector3(0, (base + 0.2) * 0.5 - 0.55, -0.2)
	wall.material_override = concrete
	root.add_child(wall)
	# roof: a thin slab sloping up toward the pitch, a coloured fascia on its front edge
	var roof := MeshInstance3D.new()
	var rm := BoxMesh.new()
	rm.size = Vector3(length + 2.0, 0.35, depth * 0.85)
	roof.mesh = rm
	roof.position = Vector3(0, top + 7.0, depth * 0.55)
	roof.rotation_degrees = Vector3(-6, 0, 0)
	roof.material_override = concrete
	roof.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	root.add_child(roof)
	var fascia := MeshInstance3D.new()
	var fm := BoxMesh.new()
	fm.size = Vector3(length + 2.0, 1.4, 0.3)
	fascia.mesh = fm
	fascia.position = Vector3(0, top + 7.4, depth * 0.55 - depth * 0.425)
	var fmat := StandardMaterial3D.new()
	fmat.albedo_color = Color(0.06, 0.08, 0.16)
	fmat.emission_enabled = true
	fmat.emission = Color(0.78, 1.0, 0.24) * 0.25
	fascia.material_override = fmat
	root.add_child(fascia)
	for x in range(-int(hl), int(hl) + 1, 24):
		var col := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.35
		cm.bottom_radius = 0.35
		cm.height = top + 7.0
		col.mesh = cm
		col.position = Vector3(x, (top + 7.0) * 0.5, depth + 0.3)
		col.material_override = concrete
		root.add_child(col)
	_crowd(root, length, rows, tread, rise, base, fan, which)


## The people on a stand's terraces (one MultiMesh, the crowd shader animates them).
func _crowd(root: Node3D, length: float, rows: int, tread: float, rise: float, base: float, fan: Mesh, which: int) -> void:
	var hl := length * 0.5
	var occupancy: float = ([0.7, 0.9, 0.97] if crowd_cards else [0.45, 0.72, 0.9])[clampi(quality, 0, 2)]   # cards are 2 triangles each: full houses
	var spacing := 0.62
	var per_row := int(length / spacing)
	var rng := RandomNumberGenerator.new()
	rng.seed = 1234 + which
	var xforms: Array[Transform3D] = []
	var cols: Array[Color] = []
	var customs: Array[Color] = []
	var home := Color(0.62, 0.06, 0.1)
	var away := Color(0.06, 0.42, 0.55)
	for r in rows:
		for i in per_row:
			if rng.randf() > occupancy:
				continue
			var x := -hl + (i + 0.5) * spacing + rng.randf_range(-0.12, 0.12)
			var y := base + r * rise
			var z := r * tread + 0.45
			var sc := rng.randf_range(0.9, 1.08)
			var basis := Basis(Vector3.UP, PI + rng.randf_range(-0.25, 0.25)).scaled(Vector3(sc, sc, sc))
			xforms.append(Transform3D(basis, Vector3(x, y - 0.3, z)))
			var away_end := which == 2 and x > -hl * 0.2
			var c := home if not away_end else away
			var roll := rng.randf()
			if roll < 0.45:
				c = Color.from_hsv(rng.randf(), rng.randf_range(0.1, 0.4), rng.randf_range(0.06, 0.3))   # dark everyday clothes
			elif roll < 0.53:
				c = Color(0.92, 0.92, 0.92)
			cols.append(c.darkened(rng.randf_range(0.0, 0.3)))
			customs.append(Color(rng.randf(), rng.randf(), 0, 0))
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = fan
	mm.instance_count = xforms.size()
	for k in xforms.size():
		mm.set_instance_transform(k, xforms[k])
		mm.set_instance_color(k, cols[k])
		mm.set_instance_custom_data(k, customs[k])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = crowd_mat
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mmi)


func _quad3(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3) -> void:
	for v in [a, c, b, a, d, c]:
		st.add_vertex(v)


func _floodlights() -> void:
	var hl := pitch.half_l()
	var hw := pitch.half_w()
	var pole_mat := StandardMaterial3D.new()
	pole_mat.albedo_color = Color(0.55, 0.57, 0.6)
	pole_mat.metallic = 0.6
	pole_mat.roughness = 0.4
	var lamp_mat := StandardMaterial3D.new()
	lamp_mat.albedo_color = Color(1, 1, 0.95)
	lamp_mat.emission_enabled = true
	lamp_mat.emission = Color(1.0, 0.98, 0.9)
	lamp_mat.emission_energy_multiplier = 3.0
	var tower: PackedScene = load(FLOODLIGHT) if ResourceLoader.exists(FLOODLIGHT) else null
	for sx in [-1.0, 1.0]:
		var base := Vector3(sx * (hl + 20.0), 0, -hw - 26.0)
		if tower:
			# the Blender tower: lamp head faces its -z, turned toward the centre spot
			var t := tower.instantiate() as Node3D
			t.position = base
			add_child(t)
			var to_c := (Vector3.ZERO - base)
			t.rotation.y = atan2(to_c.x, to_c.z) + PI
			continue
		var pole := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.45
		cm.bottom_radius = 0.8
		cm.height = 46.0
		pole.mesh = cm
		pole.position = base + Vector3(0, 23.0, 0)
		pole.material_override = pole_mat
		add_child(pole)
		var head := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(8.0, 4.0, 0.6)
		head.mesh = bm
		head.position = base + Vector3(0, 46.0, 0)
		head.look_at_from_position(head.position, Vector3(0, 0, 0), Vector3.UP)
		head.material_override = lamp_mat
		add_child(head)


## Match-day people around the pitch: photographers behind the goal lines, stewards along the far touchline,
## TV cameras on tripods. Same cards as the crowd (Blender renders), one MultiMesh.
func _pitchside() -> void:
	if not crowd_cards or crowd_mat == null:
		return
	var hl := pitch.half_l()
	var hw := pitch.half_w()
	var rng := RandomNumberGenerator.new()
	rng.seed = 77
	var xf: Array[Transform3D] = []
	var cu: Array[Color] = []
	var cam_mat := StandardMaterial3D.new()
	cam_mat.albedo_color = Color(0.05, 0.05, 0.06)
	cam_mat.roughness = 0.5
	for side in [-1.0, 1.0]:
		# photographers: a line behind each goal line, either side of the goal, facing the pitch
		var z := -hw + 3.0
		while z < hw - 3.0:
			if absf(z) > pitch.goal_width * 0.5 + 2.0:
				var pos := Vector3(side * (hl + 2.2 + rng.randf_range(0.0, 0.8)), -0.05, z)
				# a card seen edge-on is a sliver: turned toward the broadcast side (+z), a little across
				var b := Basis(Vector3.UP, -side * 0.45 + rng.randf_range(-0.2, 0.2)).scaled(Vector3.ONE * rng.randf_range(0.82, 0.92))
				xf.append(Transform3D(b, pos))
				cu.append(Color(rng.randf(), 0.0, 0, 0))
				if rng.randf() < 0.4:
					var lens := MeshInstance3D.new()
					var bm := BoxMesh.new()
					bm.size = Vector3(0.35, 0.25, 0.25)
					lens.mesh = bm
					lens.material_override = cam_mat
					lens.position = pos + Vector3(-side * 0.35, 1.45, 0)
					add_child(lens)
			z += rng.randf_range(1.2, 2.6)
	# stewards and staff along the far touchline, in front of the boards, facing the crowd now and then
	var x := -hl + 4.0
	while x < hl - 4.0:
		var pos2 := Vector3(x, -0.05, -hw - 2.3)
		var yaw := rng.randf_range(-0.25, 0.25)
		xf.append(Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3.ONE * rng.randf_range(0.85, 0.95)), pos2))
		cu.append(Color(rng.randf(), 0.0, 0, 0))
		x += rng.randf_range(7.0, 13.0)
	# TV cameras on tripods at the corners of the far side
	for sx in [-1.0, 1.0]:
		var tri := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.03
		cm.bottom_radius = 0.35
		cm.height = 1.4
		tri.mesh = cm
		tri.material_override = cam_mat
		tri.position = Vector3(sx * (hl - 12.0), 0.7, -hw - 3.2)
		add_child(tri)
		var body := MeshInstance3D.new()
		var bm2 := BoxMesh.new()
		bm2.size = Vector3(0.7, 0.45, 0.4)
		body.mesh = bm2
		body.material_override = cam_mat
		body.position = tri.position + Vector3(0, 0.9, 0)
		add_child(body)
	var q := QuadMesh.new()
	q.size = Vector2(1.37, 2.05)
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	mm.mesh = q
	mm.instance_count = xf.size()
	for k in xf.size():
		mm.set_instance_transform(k, xf[k])
		mm.set_instance_custom_data(k, cu[k])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = crowd_mat
	add_child(mmi)


func set_excitement(v: float) -> void:
	excite = maxf(excite, clampf(v, 0.0, 1.0))


## The crowd follows the game: louder and on its feet near the goals, settles down otherwise.
func update_crowd(dt: float, ball_x: float) -> void:
	var near := clampf((absf(ball_x) - pitch.half_l() * 0.45) / (pitch.half_l() * 0.5), 0.0, 1.0)
	excite_target = 0.12 + 0.3 * near
	excite = move_toward(excite, excite_target, dt * (0.25 if excite > excite_target else 0.6))
	if crowd_mat:
		crowd_mat.set_shader_parameter("excite", excite)


func set_wet(v: float) -> void:
	if grass_mat:
		grass_mat.set_shader_parameter("wet", v)
