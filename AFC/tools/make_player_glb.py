#!/usr/bin/env python3
"""Build the AFC player for Godot: one GLB with the skinned body, the hair styles and the football animation clips.

  python3 Tools/afc/godot/make_player_glb.py <gfootball data/media/animations> Godot/AFC/assets/player.glb

Body and skeleton come from Tools/afc/model/afc_model.json (the Gameplay Football player, Apache-2.0 / public domain);
the clips are Gameplay Football's .anim files. Axes: engine (x right, y back, z up; the player faces -y) become
Godot (x, z, -y): y up and the player faces +z. Every clip is written in place (no root motion); what the root
did (distance, height) and where the foot meets the ball go to a JSON sidecar (player_clips.json).
"""
import json
import math
import re
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mesh_smooth import smooth_body  # noqa: E402

HERE = Path(__file__).resolve().parent
MODEL = HERE.parent / "model" / "afc_model.json"
FPS = 100.0

# skeleton (Gameplay Football player.object): name -> (parent, local offset in engine axes)
SKELETON = [
    ("player", None, (0, 0, 0)),
    ("body", "player", (0, 0, 0.96)),
    ("middle", "body", (0, 0, 0.15)),
    ("neck", "middle", (0, -0.03, 0.5)),
    ("left_shoulder", "middle", (0.16, -0.01, 0.48)),
    ("left_elbow", "left_shoulder", (-0.01, 0.0, -0.33)),
    ("right_shoulder", "middle", (-0.16, -0.01, 0.48)),
    ("right_elbow", "right_shoulder", (0.01, 0.0, -0.33)),
    ("left_thigh", "body", (0.087, 0, -0.01)),
    ("left_knee", "left_thigh", (0, 0, -0.42)),
    ("left_ankle", "left_knee", (0, -0.04, -0.44)),
    ("right_thigh", "body", (-0.087, 0, -0.01)),
    ("right_knee", "right_thigh", (0, 0, -0.42)),
    ("right_ankle", "right_knee", (0, -0.04, -0.44)),
]
NAMES = [s[0] for s in SKELETON]

# clips: name -> (source, kind). kind "loop" = the step + its mirror, played on repeat.
CLIPS = {
    "idle": ("templates/idleD000.anim", "loop"),
    "dribble": ("templates/dribbleD000.anim", "loop"),
    "jog": ("templates/walkD000.anim", "loop"),
    "sprint": ("templates/sprintD000.anim", "loop"),
    "jog_d45": ("templates/walkD045.anim", "loop"),
    "dribble_d45": ("templates/dribbleD045.anim", "loop"),
    "dribble_d135": ("templates/dribbleD135.anim", "loop"),
    "pass_idle": ("pass/idle/000.anim", "shot"),
    "pass_walk": ("pass/walk/000_short.anim", "shot"),
    "pass_run": ("pass/walk/000.anim", "shot"),
    "pass_sprint": ("pass/sprint/000.anim", "shot"),
    "pass_side": ("pass/walk/090_short.anim", "shot"),
    "pass_back": ("pass/idle/180.anim", "shot"),
    "lob_walk": ("highpass/walk/000.anim", "shot"),
    "lob_long": ("highpass/walk/000_long.anim", "shot"),
    "lob_idle": ("highpass/idle/000_long.anim", "shot"),
    "cross": ("highpass/sprint/090.anim", "shot"),
    "shot_idle": ("shot/idle/020.anim", "shot"),
    "shot_walk": ("shot/walk/010_short_bit_longer.anim", "shot"),
    "shot_sprint": ("shot/sprint/030.anim", "shot"),
    "shot_close": ("shot/sprint/010_close.anim", "shot"),
    "shot_side": ("shot/walk/090_2step.anim", "shot"),
    "bicycle": ("shot/idle/180_bicycle.anim", "shot"),
    "header": ("pass/idle/nonbase/000_header.anim", "shot"),
    "header_jump": ("interfere/idle/000_header_jump.anim", "shot"),
    "header_dive": ("shot/sprint/000_headerdive.anim", "shot"),
    "volley_side": ("pass/idle/nonbase/090_kneeheight.anim", "shot"),
    "trap": ("trap/walk/000_D000_IB000_short.anim", "shot"),
    "trap_turn": ("trap/walk/000_D000_IB090.anim", "shot"),
    "touch_walk": ("ballcontrol/walk/000.anim", "shot"),
    "touch_sprint": ("ballcontrol/sprint/000.anim", "shot"),
    "touch_close": ("ballcontrol/sprint/000_close.anim", "shot"),
    "turn90_ball": ("ballcontrol/walk/090_decel_decel.anim", "shot"),
    "turn180_ball": ("ballcontrol/walk/180_decel.anim", "shot"),
    "turn180": ("movement/idle/180_accel.anim", "shot"),
    "tackle": ("interfere/walk/000_stretch.anim", "shot"),
    "tackle_front": ("interfere/idle/000_front.anim", "shot"),
    "slide": ("sliding/sprint/000.anim", "shot"),
    "slide_walk": ("sliding/walk/000.anim", "shot"),
    "fall": ("trip/trip_t3/sprint/000.anim", "shot"),
    "stumble": ("trip/trip_t1/sprint/000_decel.anim", "shot"),
    "getup_front": ("movement_special/idle/special/000_stand_up_from_front.anim", "shot"),
    "getup_back": ("movement_special/idle/special/000_stand_up_from_back.anim", "shot"),
    "gk_dive_low": ("deflect/idle/090_ground_deflect_far.anim", "shot"),
    "gk_dive_mid": ("deflect/idle/090_midheight_deflect_far.anim", "shot"),
    "gk_dive_high": ("deflect/idle/090_high_deflect_far.anim", "shot"),
    "gk_catch_high": ("deflect/idle/000_high_holdball.anim", "shot"),
    "gk_catch_chest": ("deflect/idle/000_trunk_holdball.anim", "shot"),
    "gk_catch_low": ("deflect/idle/000_ground_holdball.anim", "shot"),
    "gk_catch_knee": ("deflect/idle/000_kneeheight_holdball.anim", "shot"),
    "gk_punch": ("deflect/idle/000_high_deflect_close.anim", "shot"),
    "gk_rush": ("deflect/sprint/000_ground_holdball.anim", "shot"),
    "gk_throw": ("highpass/idle/special/000_throw.anim", "shot"),
    "throw_in": ("pass/idle/special/000_throw.anim", "shot"),
    "trap_chest": ("trap/idle/highballs/000_chest.anim", "shot"),
    "trap_chest_jump": ("trap/idle/highballs/000_chest_jump.anim", "shot"),
    "trap_thigh": ("trap/idle/highballs/000_crotch.anim", "shot"),
    "trap_knee": ("trap/idle/highballs/000_knee.anim", "shot"),
    "trap_chest_above": ("trap/idle/highballs/020_chest_fromabove.anim", "shot"),
    "trap_chest_turn": ("trap/idle/highballs/135_chest.anim", "shot"),
    "trap_chest_run": ("trap/sprint/highballs/000_chest.anim", "shot"),
    "trap_knee_run": ("trap/sprint/highballs/000_fromside_kneeheight.anim", "shot"),
    "trap_chest_walk": ("trap/walk/highballs/D045_chest.anim", "shot"),
    "trap_knee_walk": ("trap/walk/highballs/000_knee.anim", "shot"),
    "trap_high_walk": ("trap/walk/highballs/000_control_highball_decel.anim", "shot"),
    "trap_chest_back": ("trap/walk/highballs/135_chest.anim", "shot"),
    "trap_idle": ("trap/idle/000_IB000.anim", "shot"),
    "trap_idle_side": ("trap/idle/090_IB000_accel_optional.anim", "shot"),
    "trap_idle_back": ("trap/idle/135_IB000.anim", "shot"),
    "trap_run": ("trap/sprint/000_D000_IB090_decel.anim", "shot"),
    "trap_walk_45": ("trap/walk/000_D045_IB090.anim", "shot"),
    "trap_walk_back": ("trap/walk/135_D000_IB000_decel_decel.anim", "shot"),
    "trap_stretch": ("trap/walk/lastditch/000_D000_IB090_decel_short_lastditch.anim", "shot"),
    "trap_stretch_run": ("trap/sprint/lastditch/000_decel_decel_stretch.anim", "shot"),
    "bc_idle_0": ("ballcontrol/idle/000_accel.anim", "shot"),
    "bc_idle_45": ("ballcontrol/idle/045_accel.anim", "shot"),
    "bc_idle_90": ("ballcontrol/idle/090_accel.anim", "shot"),
    "bc_idle_135": ("ballcontrol/idle/135_accel.anim", "shot"),
    "bc_idle_180": ("ballcontrol/idle/180_accel.anim", "shot"),
    "bc_walk_45": ("ballcontrol/walk/045_accel_2step.anim", "shot"),
    "bc_walk_90": ("ballcontrol/walk/090_strongfoot.anim", "shot"),
    "bc_walk_135": ("ballcontrol/walk/135_decel_decel.anim", "shot"),
    "bc_walk_180": ("ballcontrol/walk/180_decel_decel.anim", "shot"),
    "bc_sprint_45": ("ballcontrol/sprint/045_decel.anim", "shot"),
    "bc_sprint_90": ("ballcontrol/sprint/090_decel_decel.anim", "shot"),
    "bc_sprint_135": ("ballcontrol/sprint/135_decel_decel_decel.anim", "shot"),
    "bc_sprint_180": ("ballcontrol/sprint/180_decel_decel_decel.anim", "shot"),
    "bc_stop": ("ballcontrol/sprint/000_decel.anim", "shot"),
    "mv_start": ("movement/idle/000_accel.anim", "shot"),
    "mv_start_45": ("movement/idle/045_accel.anim", "shot"),
    "mv_start_90": ("movement/idle/090_accel.anim", "shot"),
    "mv_start_135": ("movement/idle/135_accel.anim", "shot"),
    "mv_walk_45": ("movement/walk/045_accel.anim", "shot"),
    "mv_walk_90": ("movement/walk/090_left_decel.anim", "shot"),
    "mv_walk_135": ("movement/walk/135_decel.anim", "shot"),
    "mv_sprint_135": ("movement/sprint/135_decel_decel_decel.anim", "shot"),
    "mv_stop": ("movement/sprint/000_decel_decel_decel_todo.anim", "shot"),
    "shield": ("movement_special/dribble/special/000_holdball.anim", "shot"),
    "shield_idle": ("movement_special/idle/special/000_holdball.anim", "shot"),
    "pass_45": ("pass/walk/045.anim", "shot"),
    "pass_90": ("pass/walk/090.anim", "shot"),
    "pass_135": ("pass/walk/135.anim", "shot"),
    "pass_sprint_45": ("pass/sprint/045.anim", "shot"),
    "pass_sprint_90": ("pass/sprint/090.anim", "shot"),
    "pass_180": ("pass/sprint/180.anim", "shot"),
    "pass_reach": ("pass/walk/lastditch/040_reach.anim", "shot"),
    "pass_idle_90": ("pass/idle/090.anim", "shot"),
    "lob_90": ("highpass/walk/090_long.anim", "shot"),
    "lob_turn": ("highpass/walk/180_turn.anim", "shot"),
    "lob_dribble": ("highpass/dribble/000.anim", "shot"),
    "shot_turn": ("shot/walk/180_turn.anim", "shot"),
    "shot_left": ("shot/sprint/020_left.anim", "shot"),
    "shot_idle_90": ("shot/idle/090.anim", "shot"),
    "shot_dribble_90": ("shot/dribble/090_zidane.anim", "shot"),
    "header_side": ("pass/idle/nonbase/090_header.anim", "shot"),
    "header_back": ("pass/idle/nonbase/000_header_jump_backwards.anim", "shot"),
    "header_fwd": ("pass/idle/nonbase/000_header_jump_forwards.anim", "shot"),
    "header_run": ("pass/sprint/nonbase/000_header_jump.anim", "shot"),
    "volley_knee": ("pass/walk/nonbase/000_kneeheight.anim", "shot"),
    "block_side": ("interfere/idle/000_side.anim", "shot"),
    "reach": ("interfere/sprint/000_reach.anim", "shot"),
    "tackle_run": ("interfere/sprint/000_header_jump.anim", "shot"),
    "slide_ballside": ("sliding/sprint/000_ballside.anim", "shot"),
    "slide_idle": ("sliding/idle/000.anim", "shot"),
    "fall_side": ("trip/trip_t1/sprint/000_sidebump.anim", "shot"),
    "fall_back": ("trip/trip_t2/idle/000_180.anim", "shot"),
    "fall_front2": ("trip/trip_t2/dribble/000_accel.anim", "shot"),
    "fall_hard": ("trip/trip_t3/sprint/045.anim", "shot"),
    "stumble2": ("trip/trip_t1/sprint/045_decel.anim", "shot"),
    "throw_in_45": ("pass/idle/special/045_throw.anim", "shot"),
    "celebrate": ("celebration/happy_extreme/000_decel_decel.anim", "shot"),
    "celebrate2": ("celebration/happy_normal/000.anim", "shot"),
    "sad": ("celebration/sad_normal/000.anim", "shot"),
}


# ------------------------------------------------------------------ .anim files
def load_anim(path):
    txt = Path(path).read_text()
    head = txt.split("\n<", 1)[0]
    tracks, ext = {}, None
    for line in head.splitlines():
        parts = line.strip().split(",")
        if len(parts) < 2:
            continue
        name = parts[0]
        if name == "extension":
            if parts[1] == "football":
                ext = (int(parts[2]), [float(x) for x in parts[3:6]])
            continue
        n = 3 if name == "player" else 4
        vals, keys, i = parts[1:], [], 0
        while i + n < len(vals) + 0 and i < len(vals):
            keys.append((int(vals[i]), [float(x) for x in vals[i + 1:i + 1 + n]]))
            i += 1 + n
        tracks[name] = keys
    meta = {m.group(1): m.group(2).strip() for m in re.finditer(r"<(\w+)>\s*(.*?)\s*</\1>", txt, re.S)}
    return tracks, ext, meta


def _qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)


def _qrot(q, v):
    x, y, z, w = q
    vx, vy, vz = v
    # v' = q v q*
    tx, ty, tz = 2 * (y * vz - z * vy), 2 * (z * vx - x * vz), 2 * (x * vy - y * vx)
    return (vx + w * tx + y * tz - z * ty, vy + w * ty + z * tx - x * tz, vz + w * tz + x * ty - y * tx)


def _qslerp_id(q, k):
    """rotation q scaled toward identity: k = 1 keeps it, 0 removes it"""
    x, y, z, w = q
    if w < 0:
        x, y, z, w = -x, -y, -z, -w
    ang = 2 * math.acos(max(-1.0, min(1.0, w)))
    s = math.sqrt(max(1e-12, 1 - w * w))
    if ang < 1e-6:
        return (0.0, 0.0, 0.0, 1.0)
    a2 = ang * k * 0.5
    return (x / s * math.sin(a2), y / s * math.sin(a2), z / s * math.sin(a2), math.cos(a2))


def _sample(keys, f):
    """value of a track at frame f (linear, quaternions normalised)"""
    if not keys:
        return None
    if f <= keys[0][0]:
        return keys[0][1]
    for i in range(1, len(keys)):
        if keys[i][0] >= f:
            f0, v0 = keys[i - 1]
            f1, v1 = keys[i]
            t = (f - f0) / max(1, f1 - f0)
            if len(v0) == 4 and sum(a * b for a, b in zip(v0, v1)) < 0:
                v1 = [-c for c in v1]
            v = [a + (b - a) * t for a, b in zip(v0, v1)]
            if len(v) == 4:
                l = math.sqrt(sum(c * c for c in v)) or 1.0
                v = [c / l for c in v]
            return v
    return keys[-1][1]


def _lowest_ankle(rots, root_z):
    """engine-axes forward kinematics of the legs: the lower ankle's height"""
    off = {n: o for n, _, o in SKELETON}
    par = {n: p for n, p, _ in SKELETON}
    world = {"player": ((0.0, 0.0, root_z), (0.0, 0.0, 0.0, 1.0))}
    for name, parent, o in SKELETON[1:]:
        pp, pq = world[parent]
        q = rots.get(name, (0.0, 0.0, 0.0, 1.0))
        p = tuple(a + b for a, b in zip(pp, _qrot(pq, o)))
        world[name] = (p, _qmul(pq, q))
    return min(world["left_ankle"][0][2], world["right_ankle"][0][2])


def straighten(tracks, k):
    """a more upright stance: the leg bends scaled by k, the root lowered/raised so the feet stay on the ground"""
    legs = ["left_thigh", "left_knee", "left_ankle", "right_thigh", "right_knee", "right_ankle"]
    out = {n: list(v) for n, v in tracks.items()}
    root = tracks.get("player", [])
    new_root = []
    for f, v in root:
        rots = {n: tuple(_sample(tracks.get(n), f)) for n in NAMES if n != "player" and tracks.get(n)}
        before = _lowest_ankle(rots, v[2])
        rots2 = dict(rots)
        for n in legs:
            if n in rots2:
                rots2[n] = _qslerp_id(rots2[n], k)
        after = _lowest_ankle(rots2, v[2])
        new_root.append((f, [v[0], v[1], v[2] + (before - after)]))
    out["player"] = new_root
    for n in legs:
        if n in tracks:
            out[n] = [(f, list(_qslerp_id(tuple(q), k))) for f, q in tracks[n]]
    return out


def mirror_tracks(tracks):
    out = {}
    for name, keys in tracks.items():
        mn = name.replace("left_", "@").replace("right_", "left_").replace("@", "right_")
        if name == "player":
            out[mn] = [(f, [-v[0], v[1], v[2]]) for f, v in keys]
        else:
            out[mn] = [(f, [v[0], -v[1], -v[2], v[3]]) for f, v in keys]
    return out


def g_vec(v):  # engine -> Godot axes
    return [v[0], v[2], -v[1]]


def g_quat(q):
    x, y, z, w = q
    l = math.sqrt(x * x + y * y + z * z + w * w) or 1.0
    return [x / l, z / l, -y / l, w / l]


def frames_of(tracks):
    return max(k[-1][0] for k in tracks.values())


# ------------------------------------------------------------------ glTF writer
class Glb:
    def __init__(self):
        self.bin = bytearray()
        self.views, self.accessors = [], []

    def add(self, data, fmt, count, comp, typ, target=None, minmax=None):
        while len(self.bin) % 4:
            self.bin.append(0)
        off = len(self.bin)
        self.bin += struct.pack("<" + fmt * (len(data)), *data) if data else b""
        view = {"buffer": 0, "byteOffset": off, "byteLength": len(self.bin) - off}
        if target:
            view["target"] = target
        self.views.append(view)
        acc = {"bufferView": len(self.views) - 1, "componentType": comp, "count": count, "type": typ}
        if minmax:
            acc["min"], acc["max"] = minmax
        self.accessors.append(acc)
        return len(self.accessors) - 1


def build(anim_dir, out_glb):
    model = json.loads(MODEL.read_text())
    world = {}
    for name, parent, off in SKELETON:
        base = world[parent] if parent else (0, 0, 0)
        world[name] = tuple(base[i] + off[i] for i in range(3))
    # model joints (body part order) -> skin joint index
    mj = [NAMES.index(j["name"]) for j in model["joints"]]
    for j in model["joints"]:
        w = world[j["name"]]
        assert all(abs(w[i] - j["origPos"][i]) < 0.02 for i in range(3)), (j["name"], w, j["origPos"])

    g = Glb()
    nodes = [{"name": "AFCPlayer", "children": []}]
    for name, parent, off in SKELETON:
        nodes.append({"name": name, "translation": g_vec(off)})
    for i, (name, parent, off) in enumerate(SKELETON):
        if parent:
            nodes[NAMES.index(parent) + 1].setdefault("children", []).append(i + 1)
    nodes[0]["children"].append(1)
    ibm = []
    for name in NAMES:
        p = g_vec(world[name])
        ibm += [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p[0], -p[1], -p[2], 1]
    ibm_acc = g.add(ibm, "f", len(NAMES), 5126, "MAT4")
    skins = [{"joints": list(range(1, len(NAMES) + 1)), "inverseBindMatrices": ibm_acc, "skeleton": 1}]

    mats = []
    def material(name, color, rough):
        mats.append({"name": name, "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.0, "roughnessFactor": rough}})
        return len(mats) - 1

    def prim(pos, nor, uv, si, sw, idx, mat):
        n = len(pos) // 3
        P = []
        for i in range(n):
            P += g_vec(pos[i * 3:i * 3 + 3])
        N = []
        for i in range(n):
            N += g_vec(nor[i * 3:i * 3 + 3])
        mn = [min(P[k::3]) for k in range(3)]
        mx = [max(P[k::3]) for k in range(3)]
        a = {"POSITION": g.add(P, "f", n, 5126, "VEC3", 34962, (mn, mx)), "NORMAL": g.add(N, "f", n, 5126, "VEC3", 34962)}
        if uv:
            a["TEXCOORD_0"] = g.add(uv, "f", n, 5126, "VEC2", 34962)
        J = [mj[j] for j in si]
        a["JOINTS_0"] = g.add(J, "H", n, 5123, "VEC4", 34962)
        a["WEIGHTS_0"] = g.add(sw, "f", n, 5126, "VEC4", 34962)
        return {"attributes": a, "indices": g.add(idx, "I", len(idx), 5125, "SCALAR", 34963), "material": mat}

    colors = {"kit": ([1, 1, 1, 1], 0.78), "skin": ([0.85, 0.62, 0.45, 1], 0.62), "shoe": ([0.05, 0.05, 0.05, 1], 0.45), "sole": ([0.8, 0.8, 0.8, 1], 0.6),
              "head": ([0.85, 0.62, 0.45, 1], 0.6)}
    prims = []
    # the source body is very low-poly: two levels of curved (PN-triangle) subdivision round it off, and the head
    # becomes its own part with a face UV (the view paints the face)
    neck_j = next(i for i, j in enumerate(model["joints"]) if j["name"] == "neck")
    body = smooth_body(model["groups"], ["kit", "skin", "shoe", "sole"], neck_j, levels=2)
    for name in ["kit", "skin", "shoe", "sole", "head"]:
        gr = body[name]
        prims.append(prim(gr["pos"], gr["normal"], gr["uv"], gr["skinIndex"], gr["skinWeight"], gr["index"], material(name, *colors[name])))
    meshes = [{"name": "Body", "primitives": prims}]
    nodes.append({"name": "Body", "mesh": 0, "skin": 0})
    nodes[0]["children"].append(len(nodes) - 1)
    hair_mat = material("hair", [0.1, 0.08, 0.06, 1], 0.8)
    neck_model_index = next(i for i, j in enumerate(model["joints"]) if j["name"] == "neck")
    neck = model["joints"][neck_model_index]["origPos"]
    for style, h in model["hair"].items():
        n = len(h["pos"]) // 3
        pos = []
        for i in range(n):
            pos += [h["pos"][i * 3] + neck[0], h["pos"][i * 3 + 1] + neck[1], h["pos"][i * 3 + 2] + neck[2]]
        idx = h.get("index") or list(range(n))
        hg = smooth_body({"hair": {"pos": pos, "normal": h["normal"], "skinIndex": [neck_model_index, 0, 0, 0] * n,
                                   "skinWeight": [1, 0, 0, 0] * n, "index": idx}}, ["hair"], -1, levels=1)["hair"]
        meshes.append({"name": "Hair_" + style, "primitives": [prim(hg["pos"], hg["normal"], None, hg["skinIndex"], hg["skinWeight"], hg["index"], hair_mat)]})
        nodes.append({"name": "Hair_" + style, "mesh": len(meshes) - 1, "skin": 0})
        nodes[0]["children"].append(len(nodes) - 1)

    # animations
    anims, side = [], {}
    adir = Path(anim_dir)
    for clip, (src, kind) in CLIPS.items():
        tracks, ext, meta = load_anim(adir / src)
        if clip == "idle":
            tracks = straighten(tracks, 0.45)   # the source stance is a deep crouch; stand up like a footballer
        variants = [(clip, tracks, ext, False), (clip + "_m", mirror_tracks(tracks), ext, True)]
        if kind == "loop":
            n = frames_of(tracks)
            m = mirror_tracks(tracks)
            joined = {}
            for name in NAMES:
                a, b = tracks.get(name, []), m.get(name, [])
                joined[name] = a + [(f + n, v) for f, v in b if f > 0]
            variants = [(clip, joined, None, False)]
        for name, tr, ext, mirrored in variants:
            nf = frames_of(tr)
            samplers, channels = [], []
            for bname in NAMES:
                keys = tr.get(bname)
                if not keys:
                    continue
                times = [f / FPS for f, _ in keys]
                tin = g.add(times, "f", len(times), 5126, "SCALAR", None, ([min(times)], [max(times)]))
                node = NAMES.index(bname) + 1
                if bname == "player":
                    # in place: keep only the height of the root
                    vals = []
                    for _, v in keys:
                        vals += [0.0, v[2], 0.0]
                    tout = g.add(vals, "f", len(keys), 5126, "VEC3")
                    path = "translation"
                else:
                    vals, prev = [], None
                    for _, v in keys:
                        q = g_quat(v)
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
            info = {"dur": nf / FPS, "loop": kind == "loop", "mirror": mirrored, "src": src,
                    "root_end": g_vec(root[-1][1][:2] + [0])}
            if kind != "loop":
                # root path on the ground (Godot x, z) so gameplay can move the player the way the clip does
                info["root"] = [[round(f / FPS, 3), round(v[0], 4), round(-v[1], 4)] for f, v in root]
            if ext:
                fr, bp = ext
                bp = [-bp[0], bp[1], bp[2]] if mirrored else bp
                info["touch"] = fr / FPS
                info["ball"] = g_vec(bp)
                # where the root is at the touch (so the ball offset can be taken relative to the body)
                rp = root[0][1]
                for f, v in root:
                    if f <= fr:
                        rp = v
                rp = [-rp[0], rp[1], rp[2]] if mirrored else rp
                info["root_at_touch"] = g_vec([rp[0], rp[1], 0])
            if "balldirection" in meta:
                bd = [float(x) for x in meta["balldirection"].split(",")]
                info["ball_dir"] = g_vec([-bd[0] if mirrored else bd[0], bd[1], bd[2]])
            side[name] = info

    gltf = {
        "asset": {"version": "2.0", "generator": "AFC make_player_glb.py"},
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
    print(out, f"{out.stat().st_size / 1e6:.2f} MB", len(anims), "clips")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
