#!/usr/bin/env python3
"""Retarget CMU Graphics Lab motion capture (BVH, free for any use: mocap.cs.cmu.edu) onto AFC's 14-bone footballer.

  python3 tools/cmu_retarget.py <cmu-mocap>/data clips.txt assets/mocap.json

clips.txt lines:  name  file  start_s  end_s  [loop|once]  [source]   e.g.  celebrate_jump  013/13_39.bvh  0.5  3.0

file can be .bvh or .fbx (CMU FBX, Mixamo, any humanoid rig: tools/blender/fbx_joints.py names the bones; set
BLENDER=/path/to/blender). Every clip is stood on its feet (ground(): lowest ankle at AFC's rest ankle height).

  python3 tools/cmu_retarget.py --ground assets/mocap.json     # fix an existing file in place
  python3 tools/cmu_retarget.py - packs/rohr assets/mocap.json  # a whole folder of FBX: one clip per file

How: forward kinematics on the BVH, then for every frame each AFC bone gets a world orientation built from the mocap
joint positions (pelvis and chest from hip / shoulder lines and the spine, limbs from the bone direction plus the
knee / elbow hinge plane), turned into parent-relative rotations. AFC's rest pose has every bone axis-aligned
(left +x, up +y, facing +z), so a rest frame is the identity. Root motion: hips relative to the first frame, facing
turned so the clip starts looking along +z. Output is 30 fps.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np

AFC_HIP_H = 0.96          # AFC body bone height
AFC_LEG = 0.95 - 0.0806   # hip to ankle
FPS = 30.0


def parse_bvh(path):
    tokens = Path(path).read_text().split()
    i = 0
    joints = []  # dict(name, parent, offset, channels)
    stack = []
    while tokens[i] != "MOTION":
        t = tokens[i]
        if t in ("ROOT", "JOINT"):
            joints.append({"name": tokens[i + 1], "parent": stack[-1] if stack else -1, "offset": None, "channels": []})
            i += 2
        elif t == "End":
            joints.append({"name": joints[stack[-1]]["name"] + "_end", "parent": stack[-1], "offset": None, "channels": []})
            i += 2
        elif t == "{":
            stack.append(len(joints) - 1)
            i += 1
        elif t == "}":
            stack.pop()
            i += 1
        elif t == "OFFSET":
            joints[stack[-1]]["offset"] = np.array([float(tokens[i + 1]), float(tokens[i + 2]), float(tokens[i + 3])])
            i += 4
        elif t == "CHANNELS":
            n = int(tokens[i + 1])
            joints[stack[-1]]["channels"] = tokens[i + 2:i + 2 + n]
            i += 2 + n
        else:
            i += 1
    nframes = int(tokens[i + 2])
    ftime = float(tokens[i + 5])
    vals = np.array(tokens[i + 6:], dtype=float)
    nch = sum(len(j["channels"]) for j in joints)
    motion = vals[:nframes * nch].reshape(nframes, nch)
    return joints, motion, ftime


def rot(axis, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    if axis == "X":
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if axis == "Y":
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def fk(joints, frame):
    """World positions of every joint for one frame."""
    pos = [None] * len(joints)
    mats = [None] * len(joints)
    k = 0
    for j, jt in enumerate(joints):
        R = np.eye(3)
        t = jt["offset"].copy()
        for ch in jt["channels"]:
            v = frame[k]
            k += 1
            if ch.endswith("position"):
                t[{"X": 0, "Y": 1, "Z": 2}[ch[0]]] = v
            else:
                R = R @ rot(ch[0], v)
        if jt["parent"] < 0:
            mats[j] = R
            pos[j] = t
        else:
            p = jt["parent"]
            pos[j] = pos[p] + mats[p] @ t
            mats[j] = mats[p] @ R
    return pos


def frame_from(x_hint, y_axis):
    y = y_axis / (np.linalg.norm(y_axis) + 1e-9)
    x = x_hint - np.dot(x_hint, y) * y
    x = x / (np.linalg.norm(x) + 1e-9)
    z = np.cross(x, y)
    return np.stack([x, y, z], axis=1)  # columns


def frame_zx(z_axis, x_hint):
    z = z_axis / (np.linalg.norm(z_axis) + 1e-9)
    x = x_hint - np.dot(x_hint, z) * z
    x = x / (np.linalg.norm(x) + 1e-9)
    y = np.cross(z, x)
    return np.stack([x, y, z], axis=1)


def hinge(a, b, fallback):
    """Axis of the joint between segment a (upper) and b (lower): their cross product, else the fallback."""
    h = np.cross(a, b)
    n = np.linalg.norm(h)
    if n < 0.15 * np.linalg.norm(a) * np.linalg.norm(b):
        return fallback
    h = h / n
    return h if np.dot(h, fallback) > -0.2 else -h


def quat(m):
    tr = m[0, 0] + m[1, 1] + m[2, 2]
    if tr > 0:
        s = math.sqrt(tr + 1.0) * 2
        w, x, y, z = 0.25 * s, (m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = math.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2]) * 2
        w, x, y, z = (m[2, 1] - m[1, 2]) / s, 0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = math.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2]) * 2
        w, x, y, z = (m[0, 2] - m[2, 0]) / s, (m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s
    else:
        s = math.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1]) * 2
        w, x, y, z = (m[1, 0] - m[0, 1]) / s, (m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s
    q = np.array([x, y, z, w])
    return q / np.linalg.norm(q)


PARENT = {"body": None, "middle": "body", "neck": "middle", "left_shoulder": "middle", "left_elbow": "left_shoulder",
          "right_shoulder": "middle", "right_elbow": "right_shoulder", "left_thigh": "body", "left_knee": "left_thigh",
          "left_ankle": "left_knee", "right_thigh": "body", "right_knee": "right_thigh", "right_ankle": "right_knee"}


def bvh_positions(path):
    """BVH -> (list of {joint: world position}, seconds per frame, leg length) via forward kinematics."""
    joints, motion, ftime = parse_bvh(path)
    idx = {j["name"]: n for n, j in enumerate(joints)}
    leg = np.linalg.norm(joints[idx["LeftLeg"]]["offset"]) + np.linalg.norm(joints[idx["LeftFoot"]]["offset"])
    return (lambda f: {n: fk_cache(joints, motion, f)[i] for n, i in idx.items()}), len(motion), ftime, leg


_fk = {}


def fk_cache(joints, motion, f):
    key = (id(motion), f)
    if key not in _fk:
        _fk.clear()
        _fk[key] = fk(joints, motion[f])
    return _fk[key]


def fbx_positions(path):
    """FBX -> the same, through Blender (tools/blender/fbx_joints.py; BLENDER= the binary, default `blender`).
    The joint JSON is cached next to the FBX as <name>.joints.json."""
    import os
    import subprocess
    cache = Path(path).with_suffix(".joints.json")
    if not cache.exists() or cache.stat().st_mtime < Path(path).stat().st_mtime:
        script = Path(__file__).parent / "blender" / "fbx_joints.py"
        subprocess.run([os.environ.get("BLENDER", "blender"), "-b", "--factory-startup", "-P", str(script), "--",
                        str(path), str(cache)], check=True, stdout=subprocess.DEVNULL)
    d = json.loads(cache.read_text())
    J = {n: np.array(v) for n, v in d["joints"].items()}
    leg = float(np.linalg.norm(J["LeftLeg"][0] - J["LeftUpLeg"][0]) + np.linalg.norm(J["LeftFoot"][0] - J["LeftLeg"][0]))
    return (lambda f: {n: J[n][f] for n in J}), d["frames"], 1.0 / d["fps"], leg


def retarget(path, start_s, end_s):
    pos_at, n_frames, ftime, leg = (fbx_positions if str(path).lower().endswith(".fbx") else bvh_positions)(path)
    scale = AFC_LEG / leg
    f0 = int(start_s / ftime)
    f1 = min(n_frames, int(end_s / ftime)) if end_s > 0 else n_frames
    step = (1.0 / FPS) / ftime
    frames = [int(round(f0 + k * step)) for k in range(int((f1 - f0) / step))]
    P = lambda pos, n: pos[n] * scale
    names = list(pos_at(frames[0]).keys())
    # facing and origin from the first frame
    pos0 = pos_at(frames[0])
    left0 = P(pos0, "LeftUpLeg") - P(pos0, "RightUpLeg")
    fwd0 = np.cross(left0, np.array([0.0, 1.0, 0.0]))
    yaw = math.atan2(fwd0[0], fwd0[2])          # turn so the clip starts facing +z
    Ry = rot("Y", -math.degrees(yaw))
    hip0 = Ry @ P(pos0, "Hips")
    out_root, out_rot = [], {b: [] for b in PARENT}
    for f in frames:
        raw = pos_at(f)
        p = {n: Ry @ P(raw, n) for n in names}
        lft = p["LeftUpLeg"] - p["RightUpLeg"]
        G = {}
        G["body"] = frame_from(lft, p["Spine1"] - p["Hips"])
        G["middle"] = frame_from(p["LeftArm"] - p["RightArm"], p["Neck"] - p["Spine1"])
        G["neck"] = frame_from(G["middle"][:, 0], p["Head"] - p["Neck"])
        for side, S in (("left", "Left"), ("right", "Right")):
            up = p[S + "ForeArm"] - p[S + "Arm"]
            lo = p[S + "Hand"] - p[S + "ForeArm"]
            hx = hinge(up, lo, G["middle"][:, 0])
            G[side + "_shoulder"] = frame_from(hx, -up)
            G[side + "_elbow"] = frame_from(hx, -lo)
            th = p[S + "Leg"] - p[S + "UpLeg"]
            sh = p[S + "Foot"] - p[S + "Leg"]
            kx = hinge(th, sh, G["body"][:, 0])
            G[side + "_thigh"] = frame_from(kx, -th)
            G[side + "_knee"] = frame_from(kx, -sh)
            G[side + "_ankle"] = frame_zx(p[S + "ToeBase"] - p[S + "Foot"], kx)
        for b, par in PARENT.items():
            L = G[b] if par is None else G[par].T @ G[b]
            out_rot[b].append([round(float(v), 3) for v in quat(L)])
        h = p["Hips"]
        out_root.append([round(float(h[0] - hip0[0]), 3), round(float(h[1] - AFC_HIP_H), 3), round(float(h[2] - hip0[2]), 3)])
    return ground({"fps": FPS, "frames": len(frames), "root": out_root, "rot": out_rot})


def _qm(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def ground(c):
    """Stand a clip on the grass: forward kinematics on AFC's own skeleton (assets/skeleton_rest.json), then the root
    raised or lowered so the lowest ankle of the clip (2nd percentile, so one odd frame does not decide) is at the
    rest ankle height. Mocap hip joints sit at different heights per rig (the CMU BVH hip is ~10 cm above the thighs),
    which left the first clips floating ~6 cm."""
    sk = {b["name"]: b for b in json.loads((Path(__file__).parent.parent / "assets" / "skeleton_rest.json").read_text())}
    chain = [("body", None), ("left_thigh", "body"), ("left_knee", "left_thigh"), ("left_ankle", "left_knee"),
             ("right_thigh", "body"), ("right_knee", "right_thigh"), ("right_ankle", "right_knee")]
    low = []
    for f in range(c["frames"]):
        G = {}
        for b, par in chain:
            lp, R = np.array(sk[b]["lpos"]), _qm(c["rot"][b][f])
            G[b] = (R, lp + np.array(c["root"][f])) if par is None else (G[par][0] @ R, G[par][1] + G[par][0] @ lp)
        low.append(min(G["left_ankle"][1][1], G["right_ankle"][1][1]))
    lift = sk["left_ankle"]["gpos"][1] - float(np.percentile(low, 2))
    for r in c["root"]:
        r[1] = round(r[1] + lift, 3)
    c["grounded"] = round(lift, 3)
    return c


def main(data_dir, list_file, out):
    # clips already in `out` are kept unless the list names them again (one file holds BVH, CMU FBX and pack clips)
    clips = json.loads(Path(out).read_text()) if Path(out).exists() else {}
    if Path(list_file).is_dir():
        # a whole pack: every FBX/BVH in the folder becomes a clip named after its file, start to end
        entries = [(q.stem.lower().replace(" ", "_").replace("-", "_"), q, 0.0, 0.0, False, Path(list_file).name)
                   for q in sorted(Path(list_file).rglob("*")) if q.suffix.lower() in (".fbx", ".bvh")]
    else:
        entries = []
        for line in Path(list_file).read_text().splitlines():
            if not line.strip() or line.startswith("#"):
                continue
            parts = line.split()
            entries.append((parts[0], Path(data_dir) / parts[1], float(parts[2]), float(parts[3]),
                            len(parts) > 4 and parts[4] == "loop", parts[5] if len(parts) > 5 else "CMU"))
    for name, f, a, b, loop, source in entries:
        c = retarget(f, a, b)
        c["loop"] = loop
        c["source"] = source + " " + Path(f).stem
        clips[name] = c
        print(f"{name}: {c['frames']} frames from {f}")
    Path(out).write_text(json.dumps(clips, separators=(",", ":")))
    print(out, Path(out).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    if sys.argv[1] == "--ground":   # stand the clips of an existing mocap.json on the grass, in place
        d = json.loads(Path(sys.argv[2]).read_text())
        for k, c in d.items():
            if "grounded" not in c:
                ground(c)
                print(f"{k}: root moved {c['grounded']:+.3f} m")
        Path(sys.argv[2]).write_text(json.dumps(d, separators=(",", ":")))
    else:
        main(*sys.argv[1:4])
