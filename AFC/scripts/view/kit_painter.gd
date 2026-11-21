class_name KitPainter
extends RefCounted
## Paints a kit texture for the player model's UV layout (shirt body front/back, sleeves, shorts, socks)
## with the club pattern and the shirt number. Layout in 1024 units, drawn at `size`.

static var _cache := {}


static func hex(c) -> Color:
	var v := int(c)
	return Color8((v >> 16) & 255, (v >> 8) & 255, v & 255)


static func paint(kit: Dictionary, number: int, size: int = 512) -> ImageTexture:
	var key := "%s|%d|%d" % [str(kit), number, size]
	if _cache.has(key):
		return _cache[key]
	var s := size / 1024.0
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var shirt := hex(kit.get("shirt", 0xffffff))
	var shirt2 := hex(kit.get("shirt2", kit.get("shirt", 0xffffff)))
	var shorts := hex(kit.get("shorts", 0xffffff))
	var socks := hex(kit.get("socks", 0xffffff))
	var trim := hex(kit.get("trim", kit.get("shirt2", 0x111111))) if kit.has("trim") else (shirt2 if shirt2 != shirt else shirt.darkened(0.35))
	var R := func(x: float, y: float, w: float, h: float, c: Color) -> void:
		img.fill_rect(Rect2i(int(x * s), int(y * s), maxi(1, int(ceil(w * s))), maxi(1, int(ceil(h * s)))), c)
	img.fill(shirt)
	var bodies := [[108.0, 296.0], [620.0, 296.0]]
	match kit.get("pattern", "solid"):
		"stripes":
			for b in bodies:
				for k in range(0, 7, 2):
					R.call(b[0] + k * 42.3, 0, 42.3, 420, shirt2)
		"pin":
			for b in bodies:
				for k in range(1, 12):
					R.call(b[0] + k * 24.7 - 3, 0, 6, 420, shirt2)
		"hoops":
			for y in range(40, 420, 92):
				R.call(0, y, 1024, 46, shirt2)
		"halves":
			R.call(256, 0, 256, 420, shirt2)
			R.call(512, 0, 256, 420, shirt2)
		"sash":
			for b in bodies:
				for y in range(0, 420, 4):
					var t := y / 420.0
					var x0: float = b[0] + b[1] * lerpf(0.92, -0.25, t)
					R.call(x0, y, b[1] * 0.33, 4, shirt2)
		"fade":
			for y in range(120, 420, 6):
				var a := (y - 120) / 300.0
				for b in bodies:
					R.call(b[0], y, b[1], 6, shirt.lerp(shirt2, a))
		"chevron":
			for b in bodies:
				for y in range(120, 270, 3):
					var off: float = float(y - 120) if y < 210 else float(300 - y)
					var w := 60.0
					R.call(b[0] + b[1] * 0.5 - off - w * 0.5, y, w * 0.5, 3, shirt2)
					R.call(b[0] + b[1] * 0.5 + off, y, w * 0.5, 3, shirt2)
	if kit.has("sleeves"):
		for x in [0, 404, 512, 916]:
			R.call(x, 0, 108, 168, hex(kit["sleeves"]))
	# collar and cuffs
	R.call(206, 0, 100, 14, trim)
	R.call(722, 0, 92, 14, trim)
	for x in [0, 404, 512, 916]:
		R.call(x, 150, 108, 16, trim)
	R.call(0, 420, 1024, 162, shorts)
	for x in [108, 392, 620, 904]:
		R.call(x, 420, 12, 162, trim)
	R.call(0, 582, 560, 192, socks)
	R.call(0, 600, 560, 16, trim)
	R.call(0, 624, 560, 6, trim)
	# shirt number on the back and a small one on the front
	var ink := Color(0.08, 0.08, 0.1) if shirt.get_luminance() > 0.55 else Color(1, 1, 1)
	_number(img, number, 768 * s, 200 * s, 150 * s, ink)
	_number(img, number, 196 * s, 112 * s, 52 * s, ink)
	img.generate_mipmaps()
	var tex := ImageTexture.create_from_image(img)
	_cache[key] = tex
	return tex


# 7-segment style block digits (a sports-font look without a font)
const SEG := {0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcfgd"}


static func _number(img: Image, n: int, cx: float, cy: float, h: float, ink: Color) -> void:
	var digits := str(n)
	var w := h * 0.55
	var gap := h * 0.12
	var total := digits.length() * w + (digits.length() - 1) * gap
	var x := cx - total * 0.5
	for ch in digits:
		_digit(img, int(ch), x, cy - h * 0.5, w, h, ink)
		x += w + gap


static func _digit(img: Image, d: int, x: float, y: float, w: float, h: float, ink: Color) -> void:
	var t := maxf(2.0, h * 0.16)
	var segs: String = SEG.get(d, "")
	var rects := {
		"a": Rect2(x, y, w, t), "g": Rect2(x, y + h * 0.5 - t * 0.5, w, t), "d": Rect2(x, y + h - t, w, t),
		"f": Rect2(x, y, t, h * 0.5), "b": Rect2(x + w - t, y, t, h * 0.5),
		"e": Rect2(x, y + h * 0.5, t, h * 0.5), "c": Rect2(x + w - t, y + h * 0.5, t, h * 0.5),
	}
	for sname in segs:
		var r: Rect2 = rects[sname]
		img.fill_rect(Rect2i(int(r.position.x), int(r.position.y), int(ceil(r.size.x)), int(ceil(r.size.y))), ink)
