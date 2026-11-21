class_name Pad
extends RefCounted
## Which connected joypad is a real game controller. Android reports some phone parts as joypads (fingerprint
## readers such as "uinput-fpc" / "gf_input", sensors, styluses); those send phantom presses, so they are ignored.

const IGNORE := ["uinput", "fpc", "fingerprint", "goodix", "gf_", "silead", "sensor", "stylus", "pen", "virtual", "touch", "gpio", "keys", "button-jack", "headset", "hall"]

static var _dev := -1
static var _checked := -10.0
static var last_press := -100.0
static var _confirmed := -1   # the pad a button was really pressed on (a phantom device never presses buttons)


static func device() -> int:
	var now := Time.get_ticks_msec() / 1000.0
	if now - _checked < 1.0:
		return _dev
	_checked = now
	_dev = -1
	for d in Input.get_connected_joypads():
		if is_real(d):
			_dev = d
			break
	return _dev


static func is_real(d: int) -> bool:
	var n := Input.get_joy_name(d).to_lower()
	for bad in IGNORE:
		if n.contains(bad):
			return false
	return true


static func connected() -> bool:
	return device() >= 0


## Sticks and triggers only count once a button has been pressed on this pad: some phones report sensors as
## joypads with a stick or trigger stuck off-centre, which used to switch the game to pad mode and hide the
## touch controls.
static func confirm(dev: int) -> void:
	last_press = Time.get_ticks_msec() / 1000.0
	_confirmed = dev


static func confirmed() -> bool:
	return _confirmed >= 0 and _confirmed == device()



static func in_use(secs: float = 10.0) -> bool:
	return confirmed() and Time.get_ticks_msec() / 1000.0 - last_press < secs
