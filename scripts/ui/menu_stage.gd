class_name MenuStage
extends CanvasLayer
## Behind the menus: the key art (a painted night at our stadium, tools/blender/make_key_art.py) brought to life -
## the camera drifts, the floodlight breathes and throws its beams through the haze, camera flashes pop in the
## stands, dust floats in the light. One full-screen shader and a few dozen particles: cheap on any phone.

const ART := "res://assets/menu_key_art.jpg"
const LAMP := Vector2(0.92, 0.085)         # the floodlight head in the key art (tools/blender/make_key_art.py)

const SHADER := """shader_type canvas_item;
uniform sampler2D art : source_color, filter_linear;
uniform float rect_aspect = 1.7778;
uniform float art_aspect = 1.7778;
uniform vec2 lamp = vec2(0.9, 0.1);
uniform float intensity = 1.0;      // 0.0 while a match loads, so nothing moves behind the cover

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void fragment() {
	float t = TIME;
	// cover the screen with the picture (crop, never stretch), then a slow drift: a camera on a long lens breathing
	vec2 uv = UV;
	vec2 sc = vec2(1.0);
	if (rect_aspect > art_aspect) { sc.y = art_aspect / rect_aspect; } else { sc.x = rect_aspect / art_aspect; }
	float zoom = 1.06 + 0.025 * sin(t * 0.07);
	vec2 pan = vec2(sin(t * 0.05) * 0.018, cos(t * 0.043) * 0.01);
	vec2 a = (uv - 0.5) * sc / zoom + 0.5 + pan;
	vec3 c = texture(art, a).rgb;

	// the floodlight breathes (mains flicker, a slow swell) and throws a soft glow and a horizontal flare
	vec2 d = (a - lamp) * vec2(art_aspect, 1.0);
	float breathe = 0.85 + 0.15 * sin(t * 1.3) + 0.04 * sin(t * 23.0);
	float glow = exp(-dot(d, d) * 18.0) * 0.55 * breathe;
	float flare = exp(-abs(d.y) * 90.0) * exp(-abs(d.x) * 2.2) * 0.35 * breathe;
	// beams through the haze: rays from the lamp, slowly turning
	float ang = atan(d.y, d.x);
	float rays = pow(max(0.0, sin(ang * 9.0 + t * 0.12) * 0.5 + 0.5), 6.0) + pow(max(0.0, sin(ang * 5.0 - t * 0.09 + 1.7) * 0.5 + 0.5), 8.0);
	float fall = exp(-length(d) * 1.6);
	vec3 light = vec3(1.0, 0.93, 0.8) * (glow + flare + rays * fall * 0.11 * breathe);

	// camera flashes in the stands: a few cells blink white for a frame or two
	vec2 cell = floor(a * vec2(220.0, 120.0));
	float slot = floor(t * 7.0);
	float in_stand = smoothstep(0.42, 0.48, a.y) * (1.0 - smoothstep(0.66, 0.72, a.y));
	float flash = step(0.9986, hash(cell + slot * 1.37)) * in_stand;
	vec2 fc = fract(a * vec2(220.0, 120.0)) - 0.5;
	flash *= exp(-dot(fc, fc) * 10.0);

	// the film: a touch of moving grain
	float grain = (hash(UV * 900.0 + fract(t) * 37.0) - 0.5) * 0.035;
	c = c + (light + vec3(flash) * 1.6) * intensity + grain;
	COLOR = vec4(c, 1.0);
}
"""

var rect: ColorRect
var mat: ShaderMaterial
var dust: CPUParticles2D


func _ready() -> void:
	layer = -1
	rect = ColorRect.new()
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mat = ShaderMaterial.new()
	var sh := Shader.new()
	sh.code = SHADER
	mat.shader = sh
	var tex: Texture2D = load(ART)
	mat.set_shader_parameter("art", tex)
	mat.set_shader_parameter("art_aspect", float(tex.get_width()) / float(tex.get_height()))
	mat.set_shader_parameter("lamp", LAMP)
	rect.material = mat
	add_child(rect)
	rect.resized.connect(_fit)
	_dust()
	_fit()


func _fit() -> void:
	var s := rect.size
	if s.y > 0.0:
		mat.set_shader_parameter("rect_aspect", s.x / s.y)
	if dust:
		dust.position = Vector2(s.x * 0.62, s.y * 0.35)
		dust.emission_rect_extents = Vector2(s.x * 0.42, s.y * 0.35)


## Motes drifting in the floodlight: soft, additive, slow.
func _dust() -> void:
	dust = CPUParticles2D.new()
	dust.amount = 46
	dust.lifetime = 9.0
	dust.preprocess = 9.0
	dust.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	dust.direction = Vector2(-0.4, -1.0)
	dust.spread = 40.0
	dust.gravity = Vector2(0, -2)
	dust.initial_velocity_min = 6.0
	dust.initial_velocity_max = 18.0
	dust.scale_amount_min = 0.25
	dust.scale_amount_max = 0.9
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 0))
	g.add_point(0.2, Color(1, 0.95, 0.85, 0.55))
	g.add_point(0.8, Color(1, 0.95, 0.85, 0.4))
	g.set_color(g.get_point_count() - 1, Color(1, 1, 1, 0))
	dust.color_ramp = g
	var dot := GradientTexture2D.new()
	dot.fill = GradientTexture2D.FILL_RADIAL
	dot.fill_from = Vector2(0.5, 0.5)
	dot.fill_to = Vector2(0.5, 0.0)
	dot.width = 32
	dot.height = 32
	var dg := Gradient.new()
	dg.set_color(0, Color(1, 1, 1, 1))
	dg.set_color(1, Color(1, 1, 1, 0))
	dot.gradient = dg
	dust.texture = dot
	var cm := CanvasItemMaterial.new()
	cm.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	dust.material = cm
	add_child(dust)


## A camera-flash burst over the whole stand (a goal, a title landing).
func burst() -> void:
	var f := ColorRect.new()
	f.set_anchors_preset(Control.PRESET_FULL_RECT)
	f.mouse_filter = Control.MOUSE_FILTER_IGNORE
	f.color = Color(1, 0.97, 0.9, 0.45)
	add_child(f)
	var tw := f.create_tween()
	tw.tween_property(f, "color:a", 0.0, 0.5).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_OUT)
	tw.tween_callback(f.queue_free)
