#!/usr/bin/env python3
"""MakeHuman body for AFC: the CC0 MakeHuman base mesh shaped into a young athletic footballer.

  from mh_body import load_body
  body = load_body(<makehuman/data>, muscle=0.8, weight=0.35, height=0.6, proportions=1.0)

The MakeHuman system assets (base mesh, targets, default rig and its weights) are CC0
(github.com/makehumancommunity/makehuman, LICENSE.ASSETS.md). Units: MakeHuman works in decimetres with
y up and the body facing +z; everything returned here is in metres in the same axes.
"""
import json
from pathlib import Path

import numpy as np


def _load_obj(path):
    v, vt, faces, groups = [], [], [], []
    group = ""
    with open(path) as f:
        for line in f:
            if line.startswith("v "):
                v.append([float(x) for x in line.split()[1:4]])
            elif line.startswith("vt "):
                vt.append([float(x) for x in line.split()[1:3]])
            elif line.startswith("g "):
                group = line.split()[1]
            elif line.startswith("f "):
                vi, ti = [], []
                for p in line.split()[1:]:
                    s = p.split("/")
                    vi.append(int(s[0]) - 1)
                    ti.append(int(s[1]) - 1 if len(s) > 1 and s[1] else -1)
                faces.append((vi, ti))
                groups.append(group)
    return np.array(v), np.array(vt), faces, groups


def _load_target(path, n):
    d = np.zeros((n, 3))
    for line in open(path):
        if line.startswith("#") or not line.strip():
            continue
        s = line.split()
        d[int(s[0])] = [float(s[1]), float(s[2]), float(s[3])]
    return d


def _pair(val, lo, mid, hi):
    """MakeHuman macro slider (0..1, 0.5 = average) -> {target suffix: weight}"""
    if val < 0.5:
        return {lo: 1 - 2 * val, mid: 2 * val}
    return {mid: 2 * (1 - val), hi: 2 * (val - 0.5)}


def load_body(data, muscle=0.8, weight=0.35, height=0.6, proportions=1.0, race=None, extra=None):
    """extra: {target path under data/targets (no .target): weight} - MakeHuman's per-part modifiers (torso
    v-shape, pectorals, calves...) on top of the macro sliders."""
    data = Path(data)
    v, vt, faces, groups = _load_obj(data / "3dobjs/base.obj")
    n = len(v)
    race = race or {"african": 1 / 3, "asian": 1 / 3, "caucasian": 1 / 3}
    T = data / "targets/macrodetails"
    off = np.zeros_like(v)
    for r, w in race.items():
        if w:
            off += w * _load_target(T / f"{r}-male-young.target", n)
    mw = {k: w for k, w in _pair(muscle, "minmuscle", "averagemuscle", "maxmuscle").items() if w > 1e-6}
    ww = {k: w for k, w in _pair(weight, "minweight", "averageweight", "maxweight").items() if w > 1e-6}
    for m, a in mw.items():
        for wt, b in ww.items():
            off += a * b * _load_target(T / f"universal-male-young-{m}-{wt}.target", n)
            if height > 0.5:
                off += a * b * 2 * (height - 0.5) * _load_target(T / f"height/male-young-{m}-{wt}-maxheight.target", n)
            elif height < 0.5:
                off += a * b * (1 - 2 * height) * _load_target(T / f"height/male-young-{m}-{wt}-minheight.target", n)
            if proportions > 0.5:
                off += a * b * 2 * (proportions - 0.5) * _load_target(T / f"proportions/male-young-{m}-{wt}-idealproportions.target", n)
            elif proportions < 0.5:
                off += a * b * (1 - 2 * proportions) * _load_target(T / f"proportions/male-young-{m}-{wt}-uncommonproportions.target", n)
    for t, w in (extra or {}).items():
        if w:
            off += w * _load_target(data / "targets" / (t + ".target"), n)
    pos = (v + off) * 0.1   # dm -> m

    skel = json.loads((data / "rigs/default.mhskel").read_text())
    joints = {name: pos[idx].mean(axis=0) for name, idx in skel["joints"].items()}
    bones = {}
    for name, b in skel["bones"].items():
        bones[name] = {"parent": b["parent"], "head": joints[b["head"]], "tail": joints[b["tail"]]}
    wts = json.loads((data / "rigs/default_weights.mhw").read_text())["weights"]
    # the floor: the lowest point of the body (soles)
    body_v = sorted({i for (vi, _), g in zip(faces, groups) if g == "body" for i in vi})
    floor = pos[body_v][:, 1].min()
    pos[:, 1] -= floor
    for b in bones.values():
        b["head"] = b["head"] - [0, floor, 0]
        b["tail"] = b["tail"] - [0, floor, 0]
    return {"pos": pos, "uv": vt, "faces": faces, "groups": groups, "bones": bones, "weights": wts, "body_verts": body_v}


if __name__ == "__main__":
    import sys
    b = load_body(sys.argv[1])
    B = b["bones"]
    top = b["pos"][b["body_verts"]][:, 1].max()
    print("height %.3f m" % top)
    for name in ["root", "spine05", "spine03", "spine01", "neck01", "head", "clavicle.L", "shoulder01.L", "upperarm01.L", "lowerarm01.L",
                 "wrist.L", "upperleg01.L", "lowerleg01.L", "foot.L", "toe1-1.L"]:
        h, t = B[name]["head"], B[name]["tail"]
        print(f"{name:14s} head {np.round(h, 3)} tail {np.round(t, 3)} len {np.linalg.norm(t - h):.3f}")
