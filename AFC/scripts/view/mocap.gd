class_name Mocap
extends RefCounted
## Motion-capture clips from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu, free for any use),
## retargeted onto the footballer's 14 bones by tools/cmu_retarget.py into assets/mocap.json: goal celebrations,
## disappointment, kicks, walks and jogs. Each frame: root offset (x, y, z) and a local rotation per bone.

const PATH := "res://assets/mocap.json"
const CELEBRATIONS := ["cele_backflip", "cele_cartwheel", "cele_jump", "cele_very_happy", "cele_jacks"]
const JOIN_IN := ["cele_happy", "cele_very_happy", "cele_jump", "cele_jacks"]
const DOWN := ["sad", "frustrated"]

static var _clips: Dictionary = {}


static func clips() -> Dictionary:
	if _clips.is_empty() and FileAccess.file_exists(PATH):
		var d = JSON.parse_string(FileAccess.get_file_as_string(PATH))
		if d is Dictionary:
			_clips = d
	return _clips


static func get_clip(name: String) -> Dictionary:
	return clips().get(name, {})


static func length(c: Dictionary) -> float:
	return (int(c.get("frames", 1)) - 1) / float(c.get("fps", 30.0))


## The pose at time t (seconds): {"root": Vector3, "rot": {bone: Quaternion}}, frames interpolated.
static func sample(c: Dictionary, t: float, loop: bool = false) -> Dictionary:
	var n: int = int(c["frames"])
	var f := t * float(c["fps"])
	if loop:
		f = fmod(f, float(n - 1))
	f = clampf(f, 0.0, float(n - 1))
	var i0 := int(f)
	var i1 := mini(i0 + 1, n - 1)
	var a := f - i0
	var r0: Array = c["root"][i0]
	var r1: Array = c["root"][i1]
	var root := Vector3(r0[0], r0[1], r0[2]).lerp(Vector3(r1[0], r1[1], r1[2]), a)
	var rot := {}
	for b in c["rot"]:
		var q0: Array = c["rot"][b][i0]
		var q1: Array = c["rot"][b][i1]
		rot[b] = Quaternion(q0[0], q0[1], q0[2], q0[3]).normalized().slerp(Quaternion(q1[0], q1[1], q1[2], q1[3]).normalized(), a)
	return {"root": root, "rot": rot}
