"""Blender (headless): an FBX animation -> per-frame world positions of the joints AFC's retargeter reads.

  blender -b --factory-startup -P tools/blender/fbx_joints.py -- in.fbx out.json

Works on any humanoid rig whose bones it can name: CMU FBX (hip / lThigh / lShin ...), Mixamo (mixamorig:LeftUpLeg ...),
Rokoko (LeftThigh / LeftShin, Spine1-4: Anderson Rohr's packs),
Unreal / Rokoko style (thigh_l / calf_l ...) and plain "LeftUpLeg" BVH-style names. Missing toes fall back to the
tip of the foot bone. Output is Y-up metres, `{"fps", "frames", "source_bones", "joints": {name: [[x, y, z], ...]}}`,
with the names cmu_retarget.py expects (Hips, Spine1, Neck, Head, Left/Right Arm, ForeArm, Hand, UpLeg, Leg, Foot,
ToeBase).
"""
import json
import sys

import bpy

# canonical joint -> bone names to try (lower case, rig prefix like "mixamorig:" stripped), best first
ALIASES = {
    "Hips": ["hips", "hip", "pelvis", "root_hips"],
    "Spine1": ["chest", "spine4", "spine3", "spine2", "spine_03", "spine1", "spine_02", "upperchest", "spine"],   # the upper back (Rokoko: Spine4, Mixamo: Spine2)
    "Neck": ["neck", "neck1", "neck_01"],
    "Head": ["head"],
}
SIDES = {
    "Arm": (["{L}shldr", "{Side}arm", "upperarm_{l}", "{side}upperarm", "{side}_upperarm", "upper_arm.{l}"]),
    "ForeArm": (["{L}forearm", "{Side}forearm", "lowerarm_{l}", "{side}lowerarm", "{side}_lowerarm", "forearm.{l}"]),
    "Hand": (["{L}hand", "{Side}hand", "hand_{l}", "{side}_hand", "hand.{l}"]),
    "UpLeg": (["{L}thigh", "{Side}upleg", "{Side}thigh", "thigh_{l}", "{side}upperleg", "{side}_upperleg", "thigh.{l}"]),
    "Leg": (["{L}shin", "{Side}leg", "{Side}shin", "calf_{l}", "{side}lowerleg", "{side}_lowerleg", "shin.{l}"]),
    "Foot": (["{L}foot", "{Side}foot", "foot_{l}", "{side}_foot", "foot.{l}"]),
    "ToeBase": (["{L}toe", "{Side}toebase", "{Side}toe", "ball_{l}", "{side}toes", "{side}_toes", "toe.{l}"]),
}
for S, s, L, l in (("Left", "left", "l", "l"), ("Right", "right", "r", "r")):
    for part, pats in SIDES.items():
        ALIASES[S + part] = [p.format(Side=s, side=s, L=L, l=l) for p in pats]


def clean(name):
    return name.split(":")[-1].lower()


def main(src, out):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=src)
    arm = max((o for o in bpy.data.objects if o.type == "ARMATURE"), key=lambda o: len(o.data.bones))
    by_name = {clean(b.name): b.name for b in arm.pose.bones}
    pick = {}
    for joint, names in ALIASES.items():
        for n in names:
            if n in by_name:
                pick[joint] = (by_name[n], "head")
                break
    for S in ("Left", "Right"):
        if S + "ToeBase" not in pick and S + "Foot" in pick:
            pick[S + "ToeBase"] = (pick[S + "Foot"][0], "tail")
    missing = [j for j in ALIASES if j not in pick]
    if missing:
        raise SystemExit(f"fbx_joints: cannot name {missing} among {sorted(by_name)}")
    act = arm.animation_data.action if arm.animation_data else None
    f0, f1 = (int(act.frame_range[0]), int(act.frame_range[1])) if act else (1, 1)
    scene = bpy.context.scene
    joints = {j: [] for j in pick}
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        M = arm.matrix_world
        for j, (bone, end) in pick.items():
            pb = arm.pose.bones[bone]
            p = M @ (pb.head if end == "head" else pb.tail)
            joints[j].append([round(p.x, 4), round(p.z, 4), round(-p.y, 4)])   # Blender Z-up -> Y-up
    fps = scene.render.fps / scene.render.fps_base
    json.dump({"fps": fps, "frames": f1 - f0 + 1, "source_bones": {j: b for j, (b, _) in pick.items()}, "joints": joints},
              open(out, "w"), separators=(",", ":"))
    print(f"fbx_joints: {src} -> {out}, {f1 - f0 + 1} frames at {fps:g} fps")


if __name__ == "__main__":
    a = sys.argv[sys.argv.index("--") + 1:]
    main(a[0], a[1])
