#!/usr/bin/env python3
"""Build the AFC player (2.9+): the CC0 MakeHuman body as a footballer, skinned to the Gameplay Football
skeleton so every existing animation clip (and its timing data) keeps working.

  python3 tools/make_mh_player.py <makehuman/data> <gfootball data/media/animations> assets/player.glb

What it does
- shapes the MakeHuman base mesh into a young athletic man (macro targets) and scales him so his legs are
  as long as the animation skeleton's legs (feet stay on the ground in every clip);
- maps MakeHuman's 139 weighted bones onto the 14 animation bones;
- binds the mesh in its own A-pose: each bone's bind rotation turns the skeleton's rest direction onto the
  MakeHuman bone, so the animations (authored for arms-down) drive the A-pose mesh correctly;
- cuts the body into kit (shirt, sleeves, shorts, socks), skin, boots and soles, puffs the cloth out
  (looser at the hems), adds hem walls so collars, cuffs and hems have a real edge, and lays out the kit UVs
  for KitPainter (shirt front/back, sleeves, shorts, socks);
- grows hair styles from the scalp, adds eyeballs, and colours brows, lips and eyelids in the skin's
  vertex colours (the view multiplies them by the player's skin tone).
Surfaces: kit, skin, shoe, sole, eyes. Meshes Hair_<style> are skinned too.
"""
import json
import math
import struct
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_player_glb as gf  # noqa: E402  (clips, .anim reader, glTF writer)
from mh_body import load_body  # noqa: E402

NAMES = gf.NAMES
GF_OFF = {n: np.array(gf.g_vec(o), float) for n, _, o in gf.SKELETON}   # rest offsets, Godot axes
PARENT = {n: p for n, p, _ in gf.SKELETON}


def nrm(v):
    v = np.asarray(v, float)
    l = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(l, 1e-12)


def q_from_to(a, b):
    """shortest rotation taking direction a onto direction b, quaternion (x, y, z, w)"""
    a, b = nrm(a), nrm(b)
    c = float(np.dot(a, b))
    if c < -0.9999:
        ax = nrm(np.cross(a, [1, 0, 0]) if abs(a[0]) < 0.9 else np.cross(a, [0, 1, 0]))
        return np.array([ax[0], ax[1], ax[2], 0.0])
    x = np.cross(a, b)
    q = np.array([x[0], x[1], x[2], 1 + c])
    return q / np.linalg.norm(q)


def q_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def seg_t(p, a, b):
    """parameter of the projection of points p on segment a->b (0 at a, 1 at b)"""
    ab = b - a
    return ((p - a) @ ab) / float(ab @ ab)


# MakeHuman bone -> animation bone (".L" / ".R" become left_ / right_)
def gf_bone(mh):
    side = "left_" if mh.endswith(".L") else "right_" if mh.endswith(".R") else ""
    base = mh[:-2] if side else mh
    if base in ("root", "pelvis", "spine05"):
        return "body"
    if base in ("spine04", "spine03", "spine02", "spine01", "breast", "clavicle"):
        return "middle"
    if base == "shoulder01":
        return "split_" + side            # torso / upper arm by how far out the vertex is
    if base.startswith("upperarm"):
        return side + "shoulder"
    if base.startswith(("lowerarm", "wrist", "finger", "metacarpal")):
        return side + "elbow"
    if base.startswith("upperleg"):
        return side + "thigh"
    if base.startswith("lowerleg"):
        return side + "knee"
    if base.startswith(("foot", "toe")):
        return side + "ankle"
    return "neck"   # neck, head, jaw, eyes, face, tongue


# A footballer's build on top of the young athletic macros (2.41): the V of the back and the chest that broadcast
# players read with, strong thighs and calves, a sturdier neck. MakeHuman modifiers (CC0).
ATHLETE = {
    "torso/torso-vshape-incr": 0.6,
    "torso/torso-muscle-pectoral-incr": 0.5,
    "torso/torso-muscle-dorsi-incr": 0.45,
    "armslegs/l-upperarm-shoulder-muscle-incr": 0.5, "armslegs/r-upperarm-shoulder-muscle-incr": 0.5,
    "armslegs/l-upperarm-muscle-incr": 0.3, "armslegs/r-upperarm-muscle-incr": 0.3,
    "armslegs/l-upperleg-muscle-incr": 0.6, "armslegs/r-upperleg-muscle-incr": 0.6,
    "armslegs/l-lowerleg-muscle-incr": 0.65, "armslegs/r-lowerleg-muscle-incr": 0.65,
    "neck/neck-scale-horiz-incr": 0.35,
}


def build(mh_data, anim_dir, out_glb, verbose=True):
    body = load_body(mh_data, muscle=0.8, weight=0.35, height=0.5, proportions=0.6, extra=ATHLETE)
    B = body["bones"]
    H = lambda b: np.array(B[b]["head"], float)  # noqa: E731
    pos0 = body["pos"].copy()
    # ---------------------------------------------------------------- scale and place
    leg = np.linalg.norm(H("lowerleg01.L") - H("upperleg01.L")) + np.linalg.norm(H("foot.L") - H("lowerleg01.L"))
    s = 0.944 / (leg + H("foot.L")[1])
    hip_c = (H("upperleg01.L") + H("upperleg01.R")) * 0.5 * s
    shift = np.array([0.0, 0.95 - hip_c[1], -hip_c[2]])
    P = pos0 * s + shift
    J = lambda b: np.array(B[b]["head"], float) * s + shift  # noqa: E731
    JT = lambda b: np.array(B[b]["tail"], float) * s + shift  # noqa: E731

    # joints of the animation skeleton where the MakeHuman body has them (bind pose)
    bindp = {"player": np.zeros(3), "body": np.array([0, 0.96, 0.0]), "middle": J("spine04") * [0, 1, 1], "neck": J("neck01") * [0, 1, 1]}
    for side, S in (("left_", ".L"), ("right_", ".R")):
        bindp[side + "shoulder"] = J("upperarm01" + S)
        bindp[side + "elbow"] = J("lowerarm01" + S)
        bindp[side + "thigh"] = J("upperleg01" + S)
        bindp[side + "knee"] = J("lowerleg01" + S)
        bindp[side + "ankle"] = J("foot" + S)
    wrist = {"left_": J("wrist.L"), "right_": J("wrist.R")}

    # rest skeleton: animation-skeleton directions, MakeHuman lengths
    rest_off = {}
    bind_q = {n: np.array([0, 0, 0, 1.0]) for n in NAMES}
    for n in NAMES:
        p = PARENT[n]
        if p is None:
            rest_off[n] = np.zeros(3)
            continue
        if n.endswith(("elbow", "knee", "ankle")):
            L = np.linalg.norm(bindp[n] - bindp[p])
            rest_off[n] = nrm(GF_OFF[n]) * L
        else:
            rest_off[n] = bindp[n] - bindp[p]
    for side in ("left_", "right_"):
        down_arm = nrm(GF_OFF[side + "elbow"])
        bind_q[side + "shoulder"] = q_from_to(down_arm, bindp[side + "elbow"] - bindp[side + "shoulder"])
        bind_q[side + "elbow"] = q_from_to(down_arm, wrist[side] - bindp[side + "elbow"])
        bind_q[side + "thigh"] = q_from_to(nrm(GF_OFF[side + "knee"]), bindp[side + "knee"] - bindp[side + "thigh"])
        bind_q[side + "knee"] = q_from_to(nrm(GF_OFF[side + "ankle"]), bindp[side + "ankle"] - bindp[side + "knee"])

    # ---------------------------------------------------------------- weights
    nv = len(P)
    W = np.zeros((nv, len(NAMES)))
    for mh, lst in body["weights"].items():
        tgt = gf_bone(mh)
        idx = np.array([a for a, _ in lst], int)
        w = np.array([b for _, b in lst], float)
        if tgt.startswith("split_"):
            side = tgt[6:]
            sx = abs(bindp[side + "shoulder"][0])
            a = np.clip((np.abs(P[idx, 0]) - (sx - 0.07)) / 0.07, 0, 1)
            np.add.at(W, (idx, NAMES.index(side + "shoulder")), w * a)
            np.add.at(W, (idx, NAMES.index("middle")), w * (1 - a))
        else:
            np.add.at(W, (idx, NAMES.index(tgt)), w)

    # relaxed hands: MakeHuman's hand is flat and spread; curl the fingers a little (skinned with its own bones)
    mhw = {}
    for mh, lst in body["weights"].items():
        for v, w in lst:
            mhw.setdefault(mh, {})[v] = w
    def rot(axis, ang):
        axis = nrm(axis)
        return q_mat(np.array([*(axis * math.sin(ang / 2)), math.cos(ang / 2)]))
    move = np.zeros_like(P)
    for S in (".L", ".R"):
        Wr, M, I, K = J("wrist" + S), J("finger3-1" + S), J("finger2-1" + S), J("finger5-1" + S)
        palm = nrm(np.cross(M - Wr, I - K)) * (1 if S == ".L" else -1)
        for k, angs in ((1, (8, 18, 18)), (2, (28, 42, 28)), (3, (34, 48, 30)), (4, (40, 52, 30)), (5, (46, 55, 30))):
            G = (np.eye(3), np.zeros(3))
            for seg in (1, 2, 3):
                b = f"finger{k}-{seg}{S}"
                h, t = J(b), JT(b)
                R = rot(np.cross(nrm(t - h), palm), math.radians(angs[seg - 1]))
                G = (G[0] @ R, G[0] @ (h - R @ h) + G[1])
                if b in mhw:
                    idx = np.array(list(mhw[b].keys()), int)
                    w = np.array(list(mhw[b].values()))
                    move[idx] += ((P[idx] @ G[0].T + G[1]) - P[idx]) * w[:, None]
    P = P + move

    # ---------------------------------------------------------------- the body mesh (quads)
    bfaces = np.array([f[0] for f, g in zip(body["faces"], body["groups"]) if g == "body"], int)
    used = np.unique(bfaces)
    # smooth vertex normals of the whole body (directions for the cloth offsets)
    def vnormals(pts, quads):
        n = np.zeros_like(pts)
        for a, b, c in ((0, 1, 2), (0, 2, 3)):
            fn = np.cross(pts[quads[:, b]] - pts[quads[:, a]], pts[quads[:, c]] - pts[quads[:, a]])
            for k in (a, b, c):
                np.add.at(n, quads[:, k], fn)
        return nrm(n)
    N0 = vnormals(P, bfaces)

    # landmarks
    hip_y = 0.95
    neck = bindp["neck"]
    knee = {s_: bindp[s_ + "knee"] for s_ in ("left_", "right_")}
    ankle = {s_: bindp[s_ + "ankle"] for s_ in ("left_", "right_")}
    thigh = {s_: bindp[s_ + "thigh"] for s_ in ("left_", "right_")}
    sho = {s_: bindp[s_ + "shoulder"] for s_ in ("left_", "right_")}
    elb = {s_: bindp[s_ + "elbow"] for s_ in ("left_", "right_")}
    shirt_hem = hip_y - 0.055
    shorts_t = 0.64          # shorts end a hand above the knee
    sleeve_t = 0.52          # sleeves end halfway down the upper arm
    sock_top_t = 0.16        # socks start just under the knee
    chest_y = sho["left_"][1] - 0.12

    def side_of(x):
        return np.where(x >= 0, "left_", "right_")

    # region of a point (vectorised over points with their bone weights)
    def region(p, w):
        n = len(p)
        reg = np.array(["skin"] * n, dtype=object)
        arm = w[:, [NAMES.index("left_shoulder"), NAMES.index("left_elbow"), NAMES.index("right_shoulder"), NAMES.index("right_elbow")]].sum(1)
        legw = w[:, [NAMES.index(x) for x in ("left_thigh", "left_knee", "left_ankle", "right_thigh", "right_knee", "right_ankle")]].sum(1)
        headw = w[:, NAMES.index("neck")]
        sd = side_of(p[:, 0])
        t_arm = np.array([seg_t(p[i], sho[sd[i]], elb[sd[i]]) for i in range(n)])
        t_thigh = np.array([seg_t(p[i], thigh[sd[i]], knee[sd[i]]) for i in range(n)])
        t_shin = np.array([seg_t(p[i], knee[sd[i]], ankle[sd[i]]) for i in range(n)])
        ank_y = np.array([ankle[sd[i]][1] for i in range(n)])
        # neckline: lower at the front (a crew collar)
        zrel = p[:, 2] - neck[2]
        collar_y = neck[1] - 0.012 - 0.03 * smoothstep(-0.02, 0.07, zrel)
        r_neck = np.hypot(p[:, 0], zrel)
        is_neck = (headw > 0.5) | ((p[:, 1] > collar_y) & (r_neck < 0.085))
        torso = (arm < 0.5) & (legw < 0.5) & ~is_neck
        reg[torso & (p[:, 1] >= shirt_hem)] = "shirt"
        reg[torso & (p[:, 1] < shirt_hem)] = "shorts"
        # arms: sleeve to halfway down the upper arm
        reg[(arm >= 0.5) & (t_arm < sleeve_t)] = "sleeve"
        # legs
        L = (legw >= 0.5) & ~is_neck
        reg[L & (p[:, 1] >= shirt_hem)] = "shirt"
        reg[L & (p[:, 1] < shirt_hem) & (t_thigh < shorts_t) & (t_shin < 0)] = "shorts"
        reg[L & (t_shin >= sock_top_t) & (p[:, 1] >= ank_y - 0.012)] = "socks"
        reg[L & (p[:, 1] < ank_y - 0.012)] = "shoe"
        return reg, t_arm, t_thigh, t_shin

    # per face: region from the face centre
    fc = P[bfaces].mean(1)
    fw = W[bfaces].mean(1)
    freg, _, _, _ = region(fc, fw)
    # soles: shoe faces at the bottom facing down
    fnorm = nrm(np.cross(P[bfaces[:, 2]] - P[bfaces[:, 0]], P[bfaces[:, 3]] - P[bfaces[:, 1]]))
    sole = (freg == "shoe") & (fc[:, 1] < 0.02) & (fnorm[:, 1] < -0.5)
    freg[sole] = "sole"
    vreg, v_tarm, v_tthigh, v_tshin = region(P, W)

    # boots: a boot has no toes. Smoothing cannot do it (it shrinks each toe onto itself and keeps the gaps), so the
    # front of each foot is wrapped onto a boot: sliced along its length, every slice becomes a rounded box
    # (superellipse) as wide and as tall as the foot is there, the toe end rounded off. The heel stays as modelled.
    shoe_v = np.unique(bfaces[np.isin(freg, ["shoe", "sole"])])
    nb = [[] for _ in range(nv)]
    for q in bfaces:
        for k in range(4):
            nb[q[k]].append(q[(k + 1) % 4])
            nb[q[k]].append(q[(k + 3) % 4])
    Ps = P.copy()
    sides = side_of(P[shoe_v, 0])
    wrapped = []
    hulls = {}
    for sd in ("left_", "right_"):
        fv = shoe_v[sides == sd]
        if len(fv) == 0:
            continue
        az = ankle[sd][2]
        zs = P[fv, 2]
        tip = zs.max()
        start = az + 0.02                       # where the wrap begins (fades in over 3 cm)
        nbins = 28
        edges = np.linspace(start, tip + 1e-6, nbins + 1)
        prof = np.zeros((nbins, 4))             # xmin, xmax, ymin, ymax
        for b_ in range(nbins):
            sel = fv[(zs >= edges[b_]) & (zs < edges[b_ + 1])]
            prof[b_] = [P[sel, 0].min(), P[sel, 0].max(), P[sel, 1].min(), P[sel, 1].max()] if len(sel) else np.nan
        ok = ~np.isnan(prof[:, 0])
        for c in range(4):
            prof[:, c] = np.interp(np.arange(nbins), np.where(ok)[0], prof[ok, c])
            prof[:, c] = np.convolve(np.pad(prof[:, c], 2, mode="edge"), np.ones(5) / 5, "valid")
        hulls[sd] = (start, tip, nbins, prof)
        wrapped += [v for v in fv if P[v, 2] >= start]

    def hull(sd, p):
        """the point of the boot surface in the direction of p from the slice's centre (same z)"""
        start, tip, nbins, prof = hulls[sd]
        z = float(np.clip(p[2], start, tip))
        b_ = min(int((z - start) / (tip - start + 1e-6) * nbins), nbins - 1)
        x0, x1, y0, y1 = prof[b_]
        cx, cy = (x0 + x1) * 0.5, (y0 + y1) * 0.5
        a, bb = (x1 - x0) * 0.5 + 0.002, (y1 - y0) * 0.5
        u = float(np.clip((z - (tip - 0.04)) / 0.04, 0.0, 1.0))   # the rounded toe end, last 4 cm
        a *= math.sqrt(max(1.0 - u * u, 0.0)) * 0.7 + 0.3 * (1.0 - u)
        bb *= 1.0 - 0.35 * u
        th = math.atan2(p[1] - cy, p[0] - cx)
        ct, st_ = math.cos(th), math.sin(th)
        ex, ey = abs(ct) ** (2 / 2.6), abs(st_) ** (2 / 2.6)
        return np.array([cx + a * math.copysign(ex, ct), cy + bb * math.copysign(ey, st_), p[2]])

    wside = {v: side_of(P[v:v + 1, 0])[0] for v in wrapped}
    for v in wrapped:
        Ps[v] = hull(wside[v], P[v])
    # the wrap folds the surface where the gaps between the toes were: smooth along the boot, projecting back onto
    # it after every pass (plain smoothing would pull every toe back onto its own axis)
    for _ in range(30):
        new_ = Ps.copy()
        for v in wrapped:
            new_[v] = hull(wside[v], Ps[v] * 0.4 + Ps[nb[v]].mean(0) * 0.6)
        Ps = new_
    for v in wrapped:
        w_ = float(smoothstep(hulls[wside[v]][0], hulls[wside[v]][0] + 0.03, P[v, 2]))
        Ps[v] = P[v] * (1 - w_) + Ps[v] * w_
    Ps[shoe_v, 1] = np.maximum(Ps[shoe_v, 1], np.where(P[shoe_v, 1] < 0.006, P[shoe_v, 1], Ps[shoe_v, 1]))
    if verbose:
        print("  boots: %d verts wrapped onto a boot shape" % len(shoe_v))

    # the shirt is cloth over the chest, not paint on it: smooth the torso's muscle relief under the shirt (its
    # borders with the sleeves, collar and hem stay put, so the seams still meet)
    shirt_set = set(np.where(vreg == "shirt")[0].tolist())
    inner = [v for v in shirt_set if nb[v] and all(u in shirt_set for u in nb[v])]
    Pk = P.copy()
    for _ in range(10):
        new = Pk.copy()
        for v in inner:
            new[v] = Pk[v] * 0.5 + Pk[nb[v]].mean(0) * 0.5
        Pk = new

    # the shirt hangs from the chest: below it, it does not follow the waist in
    armw_all = W[:, [NAMES.index(x) for x in ("left_shoulder", "left_elbow", "right_shoulder", "right_elbow")]].sum(1)
    ring = used[(np.abs(P[used, 1] - chest_y) < 0.02) & (armw_all[used] < 0.3) & (W[used, NAMES.index("neck")] < 0.5)]
    zc = float(P[ring, 2].mean())
    nbin = 48
    rad = np.full(nbin, np.nan)
    ph = np.arctan2(P[ring, 0], P[ring, 2] - zc)
    rr = np.hypot(P[ring, 0], P[ring, 2] - zc)
    bi = ((ph + math.pi) / (2 * math.pi) * nbin).astype(int) % nbin
    for b_, r_ in zip(bi, rr):
        rad[b_] = r_ if np.isnan(rad[b_]) else max(rad[b_], r_)
    ok = ~np.isnan(rad)
    xs = np.arange(nbin)
    rad = np.interp(xs, np.concatenate([xs[ok] - nbin, xs[ok], xs[ok] + nbin]), np.tile(rad[ok], 3))
    rad = np.convolve(np.concatenate([rad[-2:], rad, rad[:2]]), np.ones(5) / 5, "valid")

    def drape(p):
        """radial size the shirt keeps below the chest at this height and angle (0 = no drape)"""
        k = float(smoothstep(chest_y, chest_y - 0.22, p[1])) * float(smoothstep(shirt_hem - 0.01, shirt_hem + 0.04, p[1]) * 0.6 + 0.4)
        a = math.atan2(p[0], p[2] - zc)
        b_ = int((a + math.pi) / (2 * math.pi) * nbin) % nbin
        return k, rad[b_] * 0.955 + 0.010

    # cloth offsets along the normals (looser towards the hems)
    def offset(reg, v):
        p = P[v]
        if reg == "shirt":
            return 0.010 + 0.014 * float(smoothstep(chest_y, shirt_hem, p[1]))
        if reg == "sleeve":
            return 0.009 + 0.012 * float(np.clip(v_tarm[v] / sleeve_t, 0, 1))
        if reg == "shorts":
            return 0.014 + 0.026 * float(np.clip(v_tthigh[v] / shorts_t, 0, 1)) ** 1.5 if p[1] < hip_y - 0.03 else 0.014
        if reg == "socks":
            return 0.004
        if reg == "shoe":
            return 0.009   # a boot is a little fuller than the foot
        if reg == "sole":
            return 0.008
        return 0.0

    shirt_torso = set(np.where(armw_all < 0.5)[0].tolist())
    # ---------------------------------------------------------------- kit UVs (KitPainter layout, 1024 units)
    def ang_front(p, cz=0.0):
        return np.degrees(np.arctan2(p[0], p[2] - cz))      # 0 = front, +90 = the player's left

    def kit_uv(reg, p, v, panel_ang):
        if reg in ("shirt", "shorts"):
            a = ang_front(p)
            if panel_ang is not None and abs(panel_ang) > 90:   # back panel
                a = a if a >= 0 else a + 360
                u = 620 + (a - 90) / 180 * 296
            else:
                u = 108 + (a + 90) / 180 * 296
            if reg == "shirt":
                vv = (neck[1] - p[1]) / (neck[1] - shirt_hem) * 420
            else:
                vv = 420 + np.clip((shirt_hem + 0.08 - p[1]) / 0.32, 0, 1) * 162
            return u, vv
        if reg == "sleeve":
            sd = "left_" if p[0] >= 0 else "right_"
            ax = nrm(elb[sd] - sho[sd])
            fwd = nrm(np.array([0, 0, 1.0]) - ax * ax[2])
            rel = p - sho[sd]
            rel = rel - ax * (rel @ ax)
            a = math.degrees(math.atan2(float(rel @ np.cross(ax, fwd)), float(rel @ fwd)))
            front = (panel_ang if panel_ang is not None else a) > -90 and (panel_ang if panel_ang is not None else a) < 90
            base = {("right_", True): 0, ("right_", False): 916, ("left_", True): 404, ("left_", False): 512}[(sd, front)]
            frac = ((a + 90) / 180) if front else (((a if a >= 0 else a + 360) - 90) / 180)
            vv = np.clip((v_tarm[v] + 0.15) / (sleeve_t + 0.15), 0, 1) * 166
            return base + np.clip(frac, -0.2, 1.2) * 108, vv
        if reg == "socks":
            sd = "left_" if p[0] >= 0 else "right_"
            a = math.degrees(math.atan2(p[0] - ankle[sd][0], p[2] - ankle[sd][2]))
            if panel_ang is not None and panel_ang < -150 and a > 150:
                a -= 360
            elif panel_ang is not None and panel_ang > 150 and a < -150:
                a += 360
            u = (a + 180) / 360 * 560
            top = knee[sd][1] - sock_top_t * (knee[sd][1] - ankle[sd][1])
            vv = 582 + np.clip((top - p[1]) / (top - ankle[sd][1]), 0, 1) * 192
            return u, vv
        return 0.0, 0.0

    # ---------------------------------------------------------------- face colours (skin vertex colours)
    eyeL, eyeR = J("eye.L"), J("eye.R")
    eye_fwd = {k: nrm(JT("eye" + k) - J("eye" + k)) for k in (".L", ".R")}
    mouth = (J("oris05") + J("oris01")) * 0.5
    col = np.ones((nv, 3))
    front_face = (N0[:, 2] > 0.2) & (W[:, NAMES.index("neck")] > 0.5)
    for E in (eyeL, eyeR):
        d = P - E
        # eyelids / sockets slightly darker
        r = np.linalg.norm(d * [1, 1.3, 0.6], axis=1)
        col *= (1 - 0.18 * (1 - smoothstep(0.012, 0.024, r)) * front_face)[:, None]
        # brows: an arch above the eye
        xr = (d[:, 0] * np.sign(E[0]) + 0.001) / 0.024
        y0 = 0.0135 + 0.003 * (1 - xr ** 2)
        thick = 0.0062 * (1 - 0.6 * np.clip(xr, 0, 1))
        brow = (xr > -0.8) & (xr < 1) & (d[:, 1] > y0 - 0.0005) & (d[:, 1] < y0 + thick) & front_face & (d[:, 2] > -0.012)
        col[brow] *= [0.45, 0.39, 0.36]
    dm = (P - mouth)
    lip = ((dm[:, 0] / 0.024) ** 2 + (dm[:, 1] / 0.0105) ** 2 < 1) & front_face & (dm[:, 2] > -0.02)
    col[lip] *= [0.88, 0.70, 0.66]

    # straighten the region borders (collar, cuffs, hems follow quad edges and zig-zag): smooth each border
    # vertex along its border, keeping it on the surface
    def reg_key(r):
        return (SURF_[r], r if r in ("sole",) else SURF_[r])
    SURF_ = {"shirt": "kit", "sleeve": "kit", "shorts": "kit", "socks": "kit", "skin": "skin", "shoe": "shoe", "sole": "sole"}
    efaces = {}
    for fi, q in enumerate(bfaces):
        for k in range(4):
            a, b_ = q[k], q[(k + 1) % 4]
            efaces.setdefault((min(a, b_), max(a, b_)), []).append(fi)
    bnb = {}
    for (a, b_), fl in efaces.items():
        if len(fl) == 2 and freg[fl[0]] != freg[fl[1]] and {freg[fl[0]], freg[fl[1]]} not in ({"shirt", "sleeve"},):
            bnb.setdefault(a, []).append(b_)
            bnb.setdefault(b_, []).append(a)
    loop_v = [v for v, l in bnb.items() if len(l) == 2]
    P_orig = P.copy()
    for _ in range(6):
        Pn = P.copy()
        for v in loop_v:
            a, b_ = bnb[v]
            Pn[v] = 0.5 * P[v] + 0.25 * (P[a] + P[b_])
        P = Pn
    lv = np.array(loop_v, int)
    P[lv] += N0[lv] * ((P_orig[lv] - P[lv]) * N0[lv]).sum(1)[:, None]
    same = lv[np.all(np.abs(Ps[lv] - P_orig[lv]) < 1e-9, axis=1)]
    Ps[same] = P[same]

    # ---------------------------------------------------------------- split into surfaces
    SURF = {"shirt": "kit", "sleeve": "kit", "shorts": "kit", "socks": "kit", "skin": "skin", "shoe": "shoe", "sole": "sole"}
    surfaces = {k: {"key": {}, "pos": [], "nor_src": [], "uv": [], "w": [], "col": [], "orig": [], "tri": []} for k in ("kit", "skin", "shoe", "sole")}
    disp = {}   # (vertex, region) -> displaced position

    def dpos(v, reg):
        k = (v, reg)
        if k not in disp:
            base = Ps[v] if reg in ("shoe", "sole") else (Pk[v] if reg == "shirt" else P[v])
            off = offset(reg, v)
            q = base + N0[v] * off
            if reg == "shirt" and v in shirt_torso:
                k, rt = drape(P[v])
                r0 = math.hypot(q[0], q[2] - zc)
                if k > 0 and rt > r0 > 1e-6:
                    f = (r0 + min(rt - r0, 0.025) * k) / r0
                    q = np.array([q[0] * f, q[1], zc + (q[2] - zc) * f])
            if reg == "sole":
                q = base + np.array([0, -0.006, 0]) + N0[v] * 0.004
            disp[k] = q
        return disp[k]

    # the shirt hangs from the hips: its hem follows the thighs only a little (no bulging seat when sprinting)
    legcols = [NAMES.index(x) for x in ("left_thigh", "left_knee", "left_ankle", "right_thigh", "right_knee", "right_ankle")]
    W_shirt = W.copy()
    moved = W_shirt[:, legcols].sum(1) * 0.65
    W_shirt[:, legcols] *= 0.35
    W_shirt[:, NAMES.index("body")] += moved

    def vert(surf, v, reg, uv):
        S = surfaces[surf]
        key = (v, reg, round(uv[0], 1), round(uv[1], 1))
        if key in S["key"]:
            return S["key"][key]
        S["key"][key] = len(S["pos"])
        S.setdefault("first", {}).setdefault((v, reg), len(S["pos"]))
        S["pos"].append(dpos(v, reg))
        S["uv"].append((uv[0] / 1024.0, uv[1] / 1024.0))
        S["w"].append(W_shirt[v] if reg == "shirt" else W[v])
        S["col"].append(col[v] if surf == "skin" else (1, 1, 1))
        S["orig"].append((v, reg))
        return S["key"][key]

    face_of_edge = {}
    for fi, q in enumerate(bfaces):
        reg = freg[fi]
        surf = SURF[reg]
        pa = None
        if reg in ("shirt", "shorts", "sleeve"):
            if reg == "sleeve":
                sd = "left_" if fc[fi][0] >= 0 else "right_"
                ax = nrm(elb[sd] - sho[sd])
                fwd = nrm(np.array([0, 0, 1.0]) - ax * ax[2])
                rel = fc[fi] - sho[sd]
                rel = rel - ax * (rel @ ax)
                pa = math.degrees(math.atan2(float(rel @ np.cross(ax, fwd)), float(rel @ fwd)))
            else:
                pa = float(ang_front(fc[fi]))
        elif reg == "socks":
            sd = "left_" if fc[fi][0] >= 0 else "right_"
            pa = math.degrees(math.atan2(fc[fi][0] - ankle[sd][0], fc[fi][2] - ankle[sd][2]))
        ids = []
        for v in q:
            uv = kit_uv(reg, P[v], v, pa) if surf == "kit" else (0.0, 0.0)
            ids.append(vert(surf, v, reg, uv))
        surfaces[surf]["tri"] += [ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]]
        for k in range(4):
            a, b = q[k], q[(k + 1) % 4]
            face_of_edge.setdefault((min(a, b), max(a, b)), []).append((fi, a, b, ids[k], ids[(k + 1) % 4]))

    # hem walls between regions with different offsets: a strip from the outer copy to the inner copy
    walls = 0
    for (a, b), lst in face_of_edge.items():
        if len(lst) != 2:
            continue
        (f1, a1, b1, i1a, i1b), (f2, a2, b2, i2a, i2b) = lst
        r1, r2 = freg[f1], freg[f2]
        if r1 == r2 or SURF[r1] == SURF[r2] and offset(r1, a) == offset(r2, a):
            continue
        o1 = offset(r1, a) + offset(r1, b)
        o2 = offset(r2, a) + offset(r2, b)
        if r1 == "sole" or r2 == "sole":
            outer, inner, fo, fi_ = (r1, r2, f1, f2) if r1 == "sole" else (r2, r1, f2, f1)
        else:
            outer, inner, fo, fi_ = (r1, r2, f1, f2) if o1 >= o2 else (r2, r1, f2, f1)
        if abs(o1 - o2) < 1e-4 and outer != "sole":
            continue
        surf = SURF[outer]
        S = surfaces[surf]
        oa, ob = dpos(a, outer), dpos(b, outer)
        ia, ib = dpos(a, inner), dpos(b, inner)
        cin = P[bfaces[fi_]].mean(0)
        mid = (oa + ob) * 0.5
        # wall vertices (own copies so the wall gets a flat normal); the uv of the outer copy
        def add(pt, v, reg):
            S["pos"].append(pt)
            src = S.get("first", {}).get((v, outer))
            S["uv"].append(S["uv"][src] if src is not None else (0, 0))
            S["w"].append(W_shirt[v] if reg == "shirt" else W[v])
            S["col"].append((1, 1, 1))
            S["orig"].append((v, "wall"))
            return len(S["pos"]) - 1
        k0 = add(oa, a, outer); k1 = add(ob, b, outer); k2 = add(ib, b, inner); k3 = add(ia, a, inner)
        n = np.cross(ob - oa, ia - oa)
        if np.dot(n, cin - mid) > 0:
            S["tri"] += [k0, k1, k2, k0, k2, k3]
        else:
            S["tri"] += [k0, k2, k1, k0, k3, k2]
        walls += 1

    # normals per surface (shared by every copy of an original vertex in that surface, walls flat)
    for name, S in surfaces.items():
        pos = np.array(S["pos"])
        tri = np.array(S["tri"], int).reshape(-1, 3)
        fn = np.cross(pos[tri[:, 1]] - pos[tri[:, 0]], pos[tri[:, 2]] - pos[tri[:, 0]])
        acc = {}
        for t, f in zip(tri, fn):
            for k in t:
                o = S["orig"][k]
                key = o if o[1] != "wall" else ("w", k)
                acc[key] = acc.get(key, 0) + f
        S["nor"] = nrm(np.array([acc[S["orig"][k] if S["orig"][k][1] != "wall" else ("w", k)] for k in range(len(pos))]))
        S["pos"] = pos
        S["tri"] = tri.reshape(-1)

    # ---------------------------------------------------------------- hair (grown from the scalp)
    headw = W[:, NAMES.index("neck")]
    hc = J("head") + np.array([0, 0.03, 0])         # skull centre (roughly)
    rel = P - hc
    phi = np.degrees(np.arctan2(rel[:, 0], rel[:, 2]))   # 0 = front
    elev = rel[:, 1]
    # hairline height above the skull centre: high at the forehead, lower at the sides, low at the nape
    c = np.cos(np.radians(phi))
    aphi = np.abs(phi)
    line = np.where(c > 0, 0.012 + 0.068 * np.clip(c, 0, 1) ** 2, 0.012 + 0.08 * c)
    line += 0.010 * np.exp(-((aphi - 42) / 12) ** 2)          # temples
    line -= 0.032 * np.exp(-((aphi - 80) / 7) ** 2)           # sideburns
    ears = (np.abs(rel[:, 0]) > 0.064) & (elev < 0.035) & (rel[:, 2] > -0.045)
    scalp_v = (headw > 0.9) & (elev > line) & ~ears & (P[:, 1] > J("neck03")[1])
    scalp_f = bfaces[scalp_v[bfaces].all(1)]
    # thickness by height above the hairline (d) and above the skull centre (e): thin at the edge, fuller on top
    styles = {
        "buzz": lambda e, d: 0.0015 + 0.0015 * smoothstep(0, 0.02, d),
        "short": lambda e, d: 0.002 + 0.010 * smoothstep(0.0, 0.035, d) * (0.6 + 0.4 * smoothstep(0.02, 0.09, e)),
        "crop": lambda e, d: 0.0015 + 0.013 * smoothstep(0.02, 0.05, d) * smoothstep(0.05, 0.095, e),
        "curly": lambda e, d: 0.003 + 0.026 * smoothstep(0.0, 0.04, d) * (0.5 + 0.5 * smoothstep(0.0, 0.08, e)),
        "twists": lambda e, d: 0.003 + 0.018 * smoothstep(0.0, 0.03, d) * (0.4 + 0.6 * smoothstep(0.0, 0.08, e)),
    }
    hair = {}
    hv = np.unique(scalp_f)
    # smooth the hairline (the scalp border follows quad edges)
    ecount = {}
    for q in scalp_f:
        for k in range(4):
            a, b_ = q[k], q[(k + 1) % 4]
            ecount[(min(a, b_), max(a, b_))] = ecount.get((min(a, b_), max(a, b_)), 0) + 1
    hnb = {}
    for (a, b_), cnt_ in ecount.items():
        if cnt_ == 1:
            hnb.setdefault(a, []).append(b_)
            hnb.setdefault(b_, []).append(a)
    PH = P.copy()
    for _ in range(8):
        Pn = PH.copy()
        for v, l in hnb.items():
            if len(l) == 2:
                Pn[v] = 0.5 * PH[v] + 0.25 * (PH[l[0]] + PH[l[1]])
        PH = Pn
    hb = np.array(list(hnb.keys()), int)
    PH[hb] += N0[hb] * ((P[hb] - PH[hb]) * N0[hb]).sum(1)[:, None]
    for style, fn in styles.items():
        idx = {v: i for i, v in enumerate(hv)}
        outer = np.array([PH[v] + N0[v] * float(fn(elev[v], elev[v] - line[v])) for v in hv])
        inner = np.array([PH[v] + N0[v] * 0.0015 for v in hv])
        if style in ("curly", "twists"):   # lumps
            rng = np.random.default_rng(3)
            outer += N0[hv] * rng.uniform(-0.004, 0.004, (len(hv), 1)) * smoothstep(0.0, 0.03, (elev - line)[hv])[:, None]
        pos, tri = list(outer), []
        for q in scalp_f:
            a, b_, c2, d = (idx[v] for v in q)
            tri += [a, b_, c2, a, c2, d]
        # edge walls
        cnt = {}
        for q in scalp_f:
            for k in range(4):
                e = (q[k], q[(k + 1) % 4])
                cnt[(min(e), max(e))] = cnt.get((min(e), max(e)), 0) + 1
        for q in scalp_f:
            for k in range(4):
                a, b_ = q[k], q[(k + 1) % 4]
                if cnt[(min(a, b_), max(a, b_))] == 1:
                    i0, i1 = idx[a], idx[b_]
                    n0 = len(pos)
                    pos += [inner[i1], inner[i0]]
                    tri += [i0, i1, n0, i0, n0, n0 + 1]   # outer a, outer b, inner b / outer a, inner b, inner a
        pos = np.array(pos)
        tri = np.array(tri, int)
        t3 = tri.reshape(-1, 3)
        fnn = np.cross(pos[t3[:, 1]] - pos[t3[:, 0]], pos[t3[:, 2]] - pos[t3[:, 0]])
        nor = np.zeros_like(pos)
        for k in range(3):
            np.add.at(nor, t3[:, k], fnn)
        w = np.zeros((len(pos), len(NAMES)))
        w[:, NAMES.index("neck")] = 1
        hair[style] = {"pos": pos, "nor": nrm(nor), "tri": tri, "w": w}

    # ---------------------------------------------------------------- eyes
    def eyeball(cen, fwd, r=0.0122, seg=16, rings=10):
        up = np.array([0, 1.0, 0])
        x = nrm(np.cross(up, fwd))
        y = np.cross(fwd, x)
        pos, nor, colr, tri = [], [], [], []
        for i in range(rings + 1):
            th = math.pi * i / rings
            for j in range(seg):
                ph = 2 * math.pi * j / seg
                d = fwd * math.cos(th) + (x * math.cos(ph) + y * math.sin(ph)) * math.sin(th)
                pos.append(cen + d * r)
                nor.append(d)
                ang = math.degrees(th)
                colr.append((0.04, 0.03, 0.03) if ang < 13 else (0.22, 0.14, 0.08) if ang < 30 else (0.86, 0.84, 0.80))
        for i in range(rings):
            for j in range(seg):
                a, b_ = i * seg + j, i * seg + (j + 1) % seg
                c2, d = a + seg, b_ + seg
                tri += [a, c2, b_, b_, c2, d]
        return pos, nor, colr, tri
    ep, en, ec, et = [], [], [], []
    for cen, f in ((eyeL, eye_fwd[".L"]), (eyeR, eye_fwd[".R"])):
        p_, n_, c_, t_ = eyeball(cen - f * 0.002, f)
        base = len(ep)
        ep += p_; en += n_; ec += c_; et += [k + base for k in t_]
    eyes = {"pos": np.array(ep), "nor": np.array(en), "col": np.array(ec), "tri": np.array(et, int),
            "w": np.tile(np.eye(len(NAMES))[NAMES.index("neck")], (len(ep), 1))}

    # ---------------------------------------------------------------- write the glTF
    g = gf.Glb()
    nodes = [{"name": "AFCPlayer", "children": []}]
    for n in NAMES:
        nodes.append({"name": n, "translation": [float(c_) for c_ in rest_off[n]]})
    for i, n in enumerate(NAMES):
        if PARENT[n]:
            nodes[NAMES.index(PARENT[n]) + 1].setdefault("children", []).append(i + 1)
    nodes[0]["children"].append(1)
    ibm = []
    for n in NAMES:
        M = np.eye(4)
        M[:3, :3] = q_mat(bind_q[n])
        M[:3, 3] = bindp[n]
        inv = np.linalg.inv(M)
        ibm += [float(x) for x in inv.T.reshape(-1)]    # column-major
    ibm_acc = g.add(ibm, "f", len(NAMES), 5126, "MAT4")
    skins = [{"joints": list(range(1, len(NAMES) + 1)), "inverseBindMatrices": ibm_acc, "skeleton": 1}]

    mats = []

    def material(name, color, rough, vcol=False):
        m = {"name": name, "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.0, "roughnessFactor": rough}}
        mats.append(m)
        return len(mats) - 1

    def top4(w):
        order = np.argsort(-w, axis=1)[:, :4]
        ww = np.take_along_axis(w, order, 1)
        ww = ww / np.maximum(ww.sum(1, keepdims=True), 1e-9)
        return order, ww

    def prim(pos, nor, tri, w, mat, uv=None, colr=None):
        pos = np.asarray(pos, float); nor = np.asarray(nor, float)
        n = len(pos)
        a = {"POSITION": g.add(pos.reshape(-1).tolist(), "f", n, 5126, "VEC3", 34962, (pos.min(0).tolist(), pos.max(0).tolist())),
             "NORMAL": g.add(nrm(nor).reshape(-1).tolist(), "f", n, 5126, "VEC3", 34962)}
        if uv is not None:
            a["TEXCOORD_0"] = g.add(np.asarray(uv, float).reshape(-1).tolist(), "f", n, 5126, "VEC2", 34962)
        if colr is not None:
            c4 = np.concatenate([np.asarray(colr, float), np.ones((n, 1))], 1)
            a["COLOR_0"] = g.add(c4.reshape(-1).tolist(), "f", n, 5126, "VEC4", 34962)
        jo, ww = top4(np.asarray(w, float))
        a["JOINTS_0"] = g.add(jo.reshape(-1).astype(int).tolist(), "H", n, 5123, "VEC4", 34962)
        a["WEIGHTS_0"] = g.add(ww.reshape(-1).tolist(), "f", n, 5126, "VEC4", 34962)
        return {"attributes": a, "indices": g.add([int(x) for x in tri], "I", len(tri), 5125, "SCALAR", 34963), "material": mat}

    colors = {"kit": ([1, 1, 1, 1], 0.8), "skin": ([0.85, 0.62, 0.45, 1], 0.6), "shoe": ([0.05, 0.05, 0.05, 1], 0.4), "sole": ([0.85, 0.85, 0.85, 1], 0.6)}
    prims = []
    for name in ("kit", "skin", "shoe", "sole"):
        S = surfaces[name]
        prims.append(prim(S["pos"], S["nor"], S["tri"], S["w"], material(name, *colors[name]), uv=S["uv"],
                          colr=S["col"] if name == "skin" else None))
    prims.append(prim(eyes["pos"], eyes["nor"], eyes["tri"], eyes["w"], material("eyes", [1, 1, 1, 1], 0.25), colr=eyes["col"]))
    meshes = [{"name": "Body", "primitives": prims}]
    nodes.append({"name": "Body", "mesh": 0, "skin": 0})
    nodes[0]["children"].append(len(nodes) - 1)
    hair_mat = material("hair", [0.1, 0.08, 0.06, 1], 0.85)
    for style, h in hair.items():
        meshes.append({"name": "Hair_" + style, "primitives": [prim(h["pos"], h["nor"], h["tri"], h["w"], hair_mat)]})
        nodes.append({"name": "Hair_" + style, "mesh": len(meshes) - 1, "skin": 0})
        nodes[0]["children"].append(len(nodes) - 1)

    anims, side = gf_animations(g, anim_dir)
    gltf = {
        "asset": {"version": "2.0", "generator": "AFC make_mh_player.py (MakeHuman CC0 body)"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": nodes, "meshes": meshes, "skins": skins,
        "materials": mats, "animations": anims, "accessors": g.accessors, "bufferViews": g.views,
        "buffers": [{"byteLength": len(g.bin)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    binc = bytes(g.bin) + b"\0" * (-len(g.bin) % 4)
    out = Path(out_glb)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binc)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(binc), 0x004E4942) + binc)
    (out.parent / "player_clips.json").write_text(json.dumps(side, indent=1))
    if verbose:
        top = P[used][:, 1].max()
        print(f"{out} {out.stat().st_size / 1e6:.2f} MB, {len(anims)} clips, height {top:.3f} m, scale {s:.3f}")
        for name, S in surfaces.items():
            print(f"  {name}: {len(S['pos'])} verts {len(S['tri']) // 3} tris")
        print(f"  walls {walls}, eyes {len(eyes['pos'])} verts, hair verts {len(hv)}")


def gf_animations(g, anim_dir):
    """the football clips, written exactly as make_player_glb does (same names and sidecar data)"""
    anims, side = [], {}
    adir = Path(anim_dir)
    for clip, (src, kind) in gf.CLIPS.items():
        tracks, ext, meta = gf.load_anim(adir / src)
        if clip == "idle":
            tracks = gf.straighten(tracks, 0.45)
            for b_ in ("body", "middle", "neck"):   # chest up, eyes up
                if b_ in tracks:
                    tracks[b_] = [(f, list(gf._qslerp_id(tuple(q), 0.35))) for f, q in tracks[b_]]
        if clip == "sprint":
            # a sprinter's shape: chest forward, eyes up, bigger arm drive, elbows bent
            def pitch(deg):
                a = math.radians(deg) * 0.5
                return (math.sin(a), 0.0, 0.0, math.cos(a))
            for b_, deg in (("middle", 9.0), ("neck", -7.0)):
                if b_ in tracks:
                    tracks[b_] = [(f, list(gf._qmul(pitch(deg), tuple(q)))) for f, q in tracks[b_]]
            for b_, k in (("left_shoulder", 1.3), ("right_shoulder", 1.3), ("left_elbow", 1.25), ("right_elbow", 1.25)):
                if b_ in tracks:
                    tracks[b_] = [(f, list(gf._qslerp_id(tuple(q), k))) for f, q in tracks[b_]]
        variants = [(clip, tracks, ext, False), (clip + "_m", gf.mirror_tracks(tracks), ext, True)]
        if kind == "loop":
            n = gf.frames_of(tracks)
            m = gf.mirror_tracks(tracks)
            joined = {}
            for name in NAMES:
                a, b = tracks.get(name, []), m.get(name, [])
                joined[name] = a + [(f + n, v) for f, v in b if f > 0]
            variants = [(clip, joined, None, False)]
        for name, tr, ext, mirrored in variants:
            nf = gf.frames_of(tr)
            samplers, channels = [], []
            for bname in NAMES:
                keys = tr.get(bname)
                if not keys:
                    continue
                times = [f / gf.FPS for f, _ in keys]
                tin = g.add(times, "f", len(times), 5126, "SCALAR", None, ([min(times)], [max(times)]))
                node = NAMES.index(bname) + 1
                if bname == "player":
                    vals = []
                    for _, v in keys:
                        vals += [0.0, v[2], 0.0]
                    tout = g.add(vals, "f", len(keys), 5126, "VEC3")
                    path = "translation"
                else:
                    vals, prev = [], None
                    for _, v in keys:
                        q = gf.g_quat(v)
                        if prev and sum(q[i] * prev[i] for i in range(4)) < 0:
                            q = [-c for c in q]
                        vals += q
                        prev = q
                    tout = g.add(vals, "f", len(keys), 5126, "VEC4")
                    path = "rotation"
                samplers.append({"input": tin, "output": tout, "interpolation": "LINEAR"})
                channels.append({"sampler": len(samplers) - 1, "target": {"node": node, "path": path}})
            anims.append({"name": name, "samplers": samplers, "channels": channels})
            root = tr.get("player", [(0, [0, 0, 0])])
            info = {"dur": nf / gf.FPS, "loop": kind == "loop", "mirror": mirrored, "src": src,
                    "root_end": gf.g_vec(root[-1][1][:2] + [0])}
            if kind != "loop":
                info["root"] = [[round(f / gf.FPS, 3), round(v[0], 4), round(-v[1], 4)] for f, v in root]
            if ext:
                fr, bp = ext
                bp = [-bp[0], bp[1], bp[2]] if mirrored else bp
                info["touch"] = fr / gf.FPS
                info["ball"] = gf.g_vec(bp)
                rp = root[0][1]
                for f, v in root:
                    if f <= fr:
                        rp = v
                rp = [-rp[0], rp[1], rp[2]] if mirrored else rp
                info["root_at_touch"] = gf.g_vec([rp[0], rp[1], 0])
            if "balldirection" in meta:
                bd = [float(x) for x in meta["balldirection"].split(",")]
                info["ball_dir"] = gf.g_vec([-bd[0] if mirrored else bd[0], bd[1], bd[2]])
            side[name] = info
    return anims, side


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2], sys.argv[3])
