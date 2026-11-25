class_name SettingsPanel
extends VBoxContainer
## Game settings (main menu and pause menu): gameplay, display, sound.

signal changed

const DIFFS := ["Amateur", "Pro", "World Class", "Legendary", "Ultimate"]
const DIFF_VALUES := [0.25, 0.5, 0.72, 0.92, 1.0]
const DIFF_NOTES := ["", "", "", "TiZero AI", "TiZero AI, full strength"]
const SPEEDS := ["Slow", "Normal", "Fast"]
const SPEED_VALUES := [0.95, 1.1, 1.25]   # x real time; mobile football plays a little faster than life


static func game_speed(o: Dictionary) -> float:
	return SPEED_VALUES[clampi(int(o.get("game_speed", 1)), 0, SPEED_VALUES.size() - 1)]
const HALVES := ["2 min", "4 min", "6 min", "8 min", "10 min"]
const HALF_VALUES := [2.0, 4.0, 6.0, 8.0, 10.0]
const CAMS := ["broadcast", "tele", "close", "wide"]
const QUALITY := ["Low (fast)", "Medium", "High", "Auto (any phone)"]
const CELEBS := ["random", "fist", "arms", "knee_slide", "leap", "spin", "flip", "salute"]
const CELEB_NAMES := ["Random", "Fist pump", "Arms out", "Knee slide", "Leap", "Spin", "Flip", "Salute"]

var in_match := false


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	var body := UI.vbox(10)
	add_child(UI.scroll(body))
	body.add_child(UI.caption("Gameplay"))
	body.add_child(UI.choice_row("Difficulty", DIFFS, int(Profile.get_s("difficulty")), func(i: int): _apply("difficulty", i)))
	body.add_child(UI.choice_row("Half length", HALVES, int(Profile.get_s("half")), func(i: int): _apply("half", i)))
	body.add_child(UI.choice_row("Camera", CAMS.map(func(c): return CameraRig.NAMES[c]), int(Profile.get_s("camera")), func(i: int): _apply("camera", i)))
	body.add_child(UI.choice_row("Game speed", SPEEDS, int(Profile.get_s("game_speed")), func(i: int): _apply("game_speed", i)))
	var styles := ["competitive", "authentic"]
	body.add_child(UI.choice_row("Gameplay style", ["Competitive (fast)", "Authentic (realistic)"], maxi(0, styles.find(Profile.get_s("style"))), func(i: int): _apply("style", styles[i])))
	body.add_child(UI.toggle_row("Offside", Profile.get_s("offside"), func(v: bool): _apply("offside", v)))
	body.add_child(UI.toggle_row("Team menu at every stoppage", Profile.get_s("stoppage_menu"), func(v: bool): _apply("stoppage_menu", v)))
	body.add_child(UI.toggle_row("Goal replays", Profile.get_s("replays"), func(v: bool): _apply("replays", v)))
	body.add_child(UI.choice_row("Goal celebration", CELEB_NAMES, maxi(0, CELEBS.find(Profile.get_s("celebration"))), func(i: int): _apply("celebration", CELEBS[i])))
	body.add_child(UI.caption("Sliders"))
	body.add_child(UI.slider_row("Sprint speed", Profile.get_s("sl_sprint"), func(v: float): _apply("sl_sprint", v), 0.8, 1.2))
	body.add_child(UI.slider_row("Acceleration", Profile.get_s("sl_accel"), func(v: float): _apply("sl_accel", v), 0.7, 1.3))
	body.add_child(UI.slider_row("Pass speed", Profile.get_s("sl_pass"), func(v: float): _apply("sl_pass", v), 0.8, 1.2))
	body.add_child(UI.slider_row("Shot error", Profile.get_s("sl_shot_error"), func(v: float): _apply("sl_shot_error", v), 0.5, 1.5))
	var weathers := ["auto", "clear", "rain"]
	body.add_child(UI.choice_row("Weather", ["Random", "Clear", "Rain"], maxi(0, weathers.find(Profile.get_s("weather"))), func(i: int): _apply("weather", weathers[i])))
	var times := ["auto", "day", "night"]
	body.add_child(UI.choice_row("Time of day", ["Random", "Day", "Night"], maxi(0, times.find(Profile.get_s("time_of_day"))), func(i: int): _apply("time_of_day", times[i])))
	body.add_child(UI.caption("Display"))
	body.add_child(UI.choice_row("Graphics", QUALITY, int(Profile.get_s("quality")), func(i: int): _apply("quality", i)))
	body.add_child(UI.toggle_row("Radar", Profile.get_s("radar"), func(v: bool): _apply("radar", v)))
	body.add_child(UI.toggle_row("Player names", Profile.get_s("names"), func(v: bool): _apply("names", v)))
	body.add_child(UI.caption("Sound"))
	body.add_child(UI.slider_row("Master volume", Profile.get_s("volume"), func(v: float): _apply("volume", v)))
	body.add_child(UI.slider_row("Crowd", Profile.get_s("crowd"), func(v: float): _apply("crowd", v)))
	body.add_child(UI.slider_row("Effects", Profile.get_s("effects"), func(v: float): _apply("effects", v)))
	if in_match:
		body.add_child(UI.label("Difficulty, half length and camera apply from the next match (the camera can be changed now with CAM).", 15, UI.MUTED))


func _apply(key: String, v) -> void:
	Profile.set_s(key, v)
	changed.emit()
