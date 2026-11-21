class_name Sfx
extends Node
## Synthesised sounds (no audio files): crowd bed, kicks, touches, whistle, goal roar.

const RATE := 22050
const PAD := 256   # silent samples after every sound: the mixer reads a little past the end (interpolation, loop wrap)
var players: Array[AudioStreamPlayer] = []
var crowd_player: AudioStreamPlayer
var kick_s: AudioStreamWAV
var touch_s: AudioStreamWAV
var whistle_s: AudioStreamWAV
var roar_s: AudioStreamWAV
var vol_fx := 0.8
var vol_crowd := 0.6
var crowd_level := 0.35


func _ready() -> void:
	_build()


func _build() -> void:
	if crowd_player:
		return
	kick_s = _make(0.12, func(t: float) -> float: return sin(TAU * (170.0 * exp(-t * 22.0) + 45.0) * t) * exp(-t * 28.0))
	touch_s = _make(0.06, func(t: float) -> float: return (randf() * 2.0 - 1.0) * exp(-t * 70.0) * 0.4 + sin(TAU * 120.0 * t) * exp(-t * 50.0) * 0.5)
	whistle_s = _make(0.32, func(t: float) -> float: return sin(TAU * (2850.0 + 220.0 * sin(TAU * 38.0 * t)) * t) * minf(1.0, t * 40.0) * minf(1.0, (0.32 - t) * 30.0) * 0.5)
	roar_s = _noise(3.5, 0.9, true)
	crowd_player = AudioStreamPlayer.new()
	var c := _noise(4.0, 0.5, false)
	c.loop_mode = AudioStreamWAV.LOOP_FORWARD
	c.loop_begin = 0
	c.loop_end = int(4.0 * RATE) - 8   # well inside the buffer (the padding stays after it)
	crowd_player.stream = c
	crowd_player.volume_db = -18.0
	add_child(crowd_player)
	for i in 6:
		var ap := AudioStreamPlayer.new()
		add_child(ap)
		players.append(ap)


func _make(dur: float, f: Callable) -> AudioStreamWAV:
	var n := int(dur * RATE)
	var data := PackedByteArray()
	data.resize((n + PAD) * 2)
	data.fill(0)
	for i in n:
		var v := clampf(f.call(i / float(RATE)), -1.0, 1.0)
		data.encode_s16(i * 2, int(v * 30000.0))
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = RATE
	s.data = data
	return s


func _noise(dur: float, level: float, swell: bool) -> AudioStreamWAV:
	var n := int(dur * RATE)
	var data := PackedByteArray()
	data.resize((n + PAD) * 2)
	data.fill(0)
	var b := 0.0
	var b2 := 0.0
	for i in n:
		b = (b + 0.05 * (randf() * 2.0 - 1.0)) / 1.05
		b2 = b2 * 0.98 + b * 0.02
		var t := i / float(RATE)
		var env := 1.0
		if swell:
			env = minf(1.0, t * 4.0) * exp(-maxf(0.0, t - 0.6) * 0.9)
		var v := clampf((b - b2) * 6.0 * level * env, -1.0, 1.0)
		data.encode_s16(i * 2, int(v * 30000.0))
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = RATE
	s.data = data
	return s


func _play(s: AudioStream, db: float, pitch: float = 1.0) -> void:
	_build()
	for ap in players:
		if not ap.playing:
			ap.stream = s
			ap.volume_db = db + linear_to_db(maxf(0.001, vol_fx))
			ap.pitch_scale = pitch
			ap.play()
			return


func set_volumes(master: float, crowd_v: float, effects: float) -> void:
	vol_fx = master * effects
	vol_crowd = master * crowd_v
	if crowd_player:
		crowd(crowd_level)


func crowd(level: float) -> void:
	_build()
	if not crowd_player.is_inside_tree():
		return
	if not crowd_player.playing:
		crowd_player.play()
	crowd_level = level
	crowd_player.volume_db = linear_to_db(maxf(0.001, level * vol_crowd)) - 8.0


func kick(speed: float) -> void:
	_play(kick_s, clampf(-14.0 + speed * 0.4, -14.0, -2.0), randf_range(0.9, 1.1))


func touch() -> void:
	_play(touch_s, -20.0, randf_range(0.9, 1.15))


func whistle(n: int) -> void:
	for i in n:
		get_tree().create_timer(i * 0.4).timeout.connect(func(): _play(whistle_s, -8.0))


func roar(level: float) -> void:
	_play(roar_s, linear_to_db(level) - 4.0)
