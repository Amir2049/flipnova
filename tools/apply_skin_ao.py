#!/usr/bin/env python3
"""Multiply baked skin occlusion (tools/blender/bake_skin_ao.py) into the player GLB's skin vertex colours.

  python3 tools/apply_skin_ao.py assets/player.glb skin_ao.json assets/player.glb [strength]

Matches vertices by rest position (nearest within 1 mm). Colours are modulated as colour * (1 - s + s * ao^1.4);
the view multiplies them by the player's skin tone, so faces, necks and knees get their shading for free.
"""
import json
import struct
import sys

import numpy as np

src, ao_path, dst = sys.argv[1], sys.argv[2], sys.argv[3]
strength = float(sys.argv[4]) if len(sys.argv) > 4 else 0.85
raw = bytearray(open(src, "rb").read())
jlen = struct.unpack_from("<I", raw, 12)[0]
gl = json.loads(raw[20:20 + jlen])
bin_off = 20 + jlen + 8
ao = np.array(json.load(open(ao_path)), float)
mat_skin = next(i for i, m in enumerate(gl["materials"]) if m["name"] == "skin")
COMP = {5126: ("f", 4), 5123: ("H", 2), 5121: ("B", 1)}
NCOMP = {"VEC3": 3, "VEC4": 4}


def view(acc_i):
    a = gl["accessors"][acc_i]
    bv = gl["bufferViews"][a["bufferView"]]
    fmt, size = COMP[a["componentType"]]
    n = NCOMP[a["type"]]
    start = bin_off + bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = bv.get("byteStride", size * n)
    return a, fmt, size, n, start, stride


done = 0
for mesh in gl["meshes"]:
    for prim in mesh["primitives"]:
        if prim.get("material") != mat_skin or "COLOR_0" not in prim["attributes"]:
            continue
        pa, pfmt, psz, pn, pst, pstride = view(prim["attributes"]["POSITION"])
        ca, cfmt, csz, cn, cst, cstride = view(prim["attributes"]["COLOR_0"])
        cnt = pa["count"]
        pos = np.array([struct.unpack_from("<3f", raw, pst + i * pstride) for i in range(cnt)])
        # nearest baked vertex for each GLB vertex
        occ = np.ones(cnt)
        for i in range(cnt):
            d = np.sum((ao[:, :3] - pos[i]) ** 2, axis=1)
            j = int(np.argmin(d))
            if d[j] < 1e-6:
                occ[i] = ao[j, 3]
        # Cycles' AO sees a whole body as partly occluded: open skin (cheeks, forearms) is the 90th percentile and
        # becomes 1, so only real creases (eyes, under the jaw, ears, knees, fingers) get darker
        ref = float(np.percentile(occ[occ < 1.0], 90)) if np.any(occ < 1.0) else 1.0
        occ = np.clip(occ / max(ref, 0.05), 0.0, 1.0)
        f = 1.0 - strength + strength * occ ** 1.4
        norm = ca.get("normalized", False)
        mx = {"H": 65535.0, "B": 255.0}.get(cfmt, 1.0)
        for i in range(cnt):
            o = cst + i * cstride
            vals = list(struct.unpack_from("<%d%s" % (cn, cfmt), raw, o))
            for k in range(3):
                if cfmt == "f":
                    vals[k] = vals[k] * f[i]
                else:
                    vals[k] = int(round(min(mx, vals[k] * f[i])))
            struct.pack_into("<%d%s" % (cn, cfmt), raw, o, *vals)
        matched = int(np.sum(occ < 1.0))
        done += cnt
        print("skin primitive:", cnt, "vertices,", matched, "shaded, mean factor %.3f" % float(np.mean(f)))
open(dst, "wb").write(raw)
print("wrote", dst, "vertices", done)
