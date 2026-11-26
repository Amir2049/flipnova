# Mocap → AFC footballer

One tool, any source: `tools/cmu_retarget.py` turns motion capture into clips for AFC's 14-bone player
(`assets/mocap.json`, played by `scripts/view/mocap.gd`).

| Source | How it is read |
|---|---|
| CMU BVH (`clips.txt`) | parsed directly (forward kinematics) |
| CMU FBX, Mixamo, Unreal/Rokoko-style rigs, any humanoid FBX | Blender headless, `tools/blender/fbx_joints.py` names the bones (mixamorig:LeftUpLeg, lThigh, thigh_l, ...) |

Every clip is then stood on the grass (`ground()`: AFC's own skeleton, lowest ankle at the rest ankle height) and
faced along +z. Clips already in the output file are kept; a clip with the same name is replaced.

```sh
export BLENDER=/path/to/blender            # 4.x / 5.x
# a list (name file start_s end_s [loop|once] [source])
python3 tools/cmu_retarget.py <dir-with-files> tools/mocap/clips_fbx.txt assets/mocap.json
# a whole pack: one clip per FBX, named after the file (e.g. "Volley Right.fbx" -> volley_right)
python3 tools/cmu_retarget.py - tools/mocap/packs/<pack> assets/mocap.json
# look at them: 8 poses per clip
MOCAP=assets/mocap.json OUT=/tmp/shots/ godot --path . -s tests/shot_mocap.gd
```

Packs from other people (Mixamo, the Anderson Rohr soccer pack, ...) go in `tools/mocap/packs/`, which git ignores:
their licences let us ship the motion inside the game, not the raw files.
