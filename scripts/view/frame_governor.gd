class_name FrameGovernor
extends Node
## Keeps a match smooth on any phone ("Auto" graphics): watches the frame time and steps the picture down when the
## device cannot keep up (render scale, then real shadows -> blob shadows, then a 30 fps cap), and back up when it has
## room to spare. Godot has no dynamic resolution of its own in the Compatibility renderer, so this is ours.
## Cheap: it reads one number a frame and acts at most every few seconds.

signal changed(level: int)

const SCALES := [1.0, 0.85, 0.72, 0.6]
const WINDOW := 2.5          # seconds of frames averaged before a decision
const COOLDOWN := 4.0        # seconds after a change before the next one

var view: MatchView
var target_fps := 60.0
var level := 0               # 0 = full picture ... 5 = everything traded for speed
var max_level := 5
var _acc := 0.0
var _n := 0
var _t := 0.0
var _cool := 0.0


func setup(v: MatchView, start_level: int = 0) -> void:
	view = v
	level = clampi(start_level, 0, max_level)
	_apply()


func _process(dt: float) -> void:
	if view == null or view.paused:
		return
	_acc += dt
	_n += 1
	_t += dt
	_cool = maxf(0.0, _cool - dt)
	if _t < WINDOW:
		return
	var avg := _acc / maxf(1.0, _n)
	_acc = 0.0
	_n = 0
	_t = 0.0
	if _cool > 0.0:
		return
	var fps := 1.0 / maxf(avg, 0.0001)
	if fps < target_fps * 0.85 and level < max_level:
		level += 1
		_apply()
	elif fps > target_fps * 0.98 and level > 0 and Engine.max_fps != 30:
		level -= 1
		_apply()


## 0-3: render scale 100 / 85 / 72 / 60 %; 4: and blob shadows instead of the sun's; 5: and 30 fps.
func _apply() -> void:
	_cool = COOLDOWN
	var vp := view.get_viewport()
	if vp:
		vp.scaling_3d_scale = SCALES[mini(level, SCALES.size() - 1)]
		FrameGovernor.upscaler(vp)
	view.set_sun_shadows(level < 4)
	Engine.max_fps = 30 if level >= 5 else 0
	target_fps = 30.0 if level >= 5 else 60.0
	changed.emit(level)


## Below full resolution on Vulkan, AMD FSR 1.0 brings the picture back up (edge-aware upscale + sharpening, one
## cheap pass) instead of a plain bilinear stretch: 72-85 % then looks close to native on a phone screen. The
## Compatibility (OpenGL) renderer has only bilinear.
static func upscaler(vp: Viewport) -> void:
	var vulkan := RenderingServer.get_current_rendering_method() != "gl_compatibility"
	if vulkan and vp.scaling_3d_scale < 0.99:
		vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_FSR
		vp.fsr_sharpness = 0.35   # 0 = sharpest; a little softer so grass does not shimmer
	else:
		vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_BILINEAR
