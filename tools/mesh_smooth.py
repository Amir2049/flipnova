"""Smooth the low-poly footballer: PN-triangle subdivision (curved, interpolating: no shrinking, no cracks) over
all body groups at once, then smooth normals, then a face UV for the head so the view can paint a face on it.

Vertices carry: pos (3), uv (2), skin index (4), skin weight (4) and the group they belong to; triangles keep their
group. Seams (the same position in two groups, or a UV seam) share the welded position and normal, so the
curved edges match on both sides.
"""
import math


def _sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _add(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def _mul(a, s):
    return (a[0] * s, a[1] * s, a[2] * s)


def _dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def _cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _norm(a):
    l = math.sqrt(_dot(a, a))
    return _mul(a, 1.0 / l) if l > 1e-12 else (0.0, 0.0, 1.0)


def _key(p):
    return (round(p[0], 4), round(p[1], 4), round(p[2], 4))


def merge_groups(groups, order):
    """-> verts (list of dict), tris (list of (a, b, c, group))"""
    verts, tris = [], []
    for name in order:
        g = groups[name]
        n = len(g["pos"]) // 3
        base = len(verts)
        for i in range(n):
            verts.append({
                "p": tuple(g["pos"][i * 3:i * 3 + 3]),
                "uv": tuple(g["uv"][i * 2:i * 2 + 2]) if g.get("uv") else (0.0, 0.0),
                "si": list(g["skinIndex"][i * 4:i * 4 + 4]),
                "sw": list(g["skinWeight"][i * 4:i * 4 + 4]),
            })
        idx = g["index"]
        for t in range(0, len(idx), 3):
            tris.append((base + idx[t], base + idx[t + 1], base + idx[t + 2], name))
    return verts, tris


def smooth_normals(verts, tris):
    acc = {}
    for a, b, c, _ in tris:
        pa, pb, pc = verts[a]["p"], verts[b]["p"], verts[c]["p"]
        fn = _cross(_sub(pb, pa), _sub(pc, pa))   # area weighted
        for v in (a, b, c):
            k = _key(verts[v]["p"])
            acc[k] = _add(acc.get(k, (0.0, 0.0, 0.0)), fn)
    for v in verts:
        v["n"] = _norm(acc.get(_key(v["p"]), (0.0, 0.0, 1.0)))


def _mix_skin(va, vb):
    w = {}
    for v in (va, vb):
        for j, x in zip(v["si"], v["sw"]):
            if x > 0.0:
                w[j] = w.get(j, 0.0) + x * 0.5
    top = sorted(w.items(), key=lambda kv: -kv[1])[:4]
    s = sum(x for _, x in top) or 1.0
    si = [j for j, _ in top] + [0] * (4 - len(top))
    sw = [x / s for _, x in top] + [0.0] * (4 - len(top))
    return si, sw


def _pn_mid(pa, na, pb, nb):
    # point at t = 1/2 on the PN-triangle cubic edge between a and b
    w_ab = _dot(_sub(pb, pa), na)
    w_ba = _dot(_sub(pa, pb), nb)
    b1 = _mul(_sub(_add(_mul(pa, 2.0), pb), _mul(na, w_ab)), 1.0 / 3.0)
    b2 = _mul(_sub(_add(_mul(pb, 2.0), pa), _mul(nb, w_ba)), 1.0 / 3.0)
    return _mul(_add(_add(pa, pb), _mul(_add(b1, b2), 3.0)), 1.0 / 8.0)


def subdivide(verts, tris):
    """one level: every triangle -> 4, edge points on the PN curve (shared by both sides of an edge)"""
    mids = {}
    out_tris = []

    def mid(a, b):
        k = (min(a, b), max(a, b))
        if k in mids:
            return mids[k]
        va, vb = verts[a], verts[b]
        # the curve depends only on the welded end points, so a seam edge gets the same point on both sides
        ka, kb = _key(va["p"]), _key(vb["p"])
        if kb < ka:
            va_, vb_ = vb, va
        else:
            va_, vb_ = va, vb
        p = _pn_mid(va_["p"], va_["n"], vb_["p"], vb_["n"])
        si, sw = _mix_skin(va, vb)
        verts.append({"p": p, "uv": ((va["uv"][0] + vb["uv"][0]) * 0.5, (va["uv"][1] + vb["uv"][1]) * 0.5),
                      "si": si, "sw": sw, "n": _norm(_add(va["n"], vb["n"]))})
        mids[k] = len(verts) - 1
        return mids[k]

    for a, b, c, g in tris:
        ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
        out_tris += [(a, ab, ca, g), (ab, b, bc, g), (ca, bc, c, g), (ab, bc, ca, g)]
    return verts, out_tris


def split_head(verts, tris, neck_joint, front=(0.0, -1.0, 0.0), centre=(0.0, -0.02, 1.76)):
    """triangles whose vertices mostly hang on the neck joint become the 'head' group, with a face UV:
    the front half projected flat (face texture), the back half on the plain corner of the texture"""
    def dominant(v):
        return v["si"][max(range(4), key=lambda k: v["sw"][k])]
    head_verts = {}
    new_tris = []
    for a, b, c, g in tris:
        if g == "skin" and all(dominant(verts[v]) == neck_joint and verts[v]["p"][2] > 1.6 for v in (a, b, c)):
            ids = []
            for v in (a, b, c):
                if v not in head_verts:
                    src = verts[v]
                    p = src["p"]
                    rel = _sub(p, centre)
                    # face plane: x across, z up; only the front of the head gets the painted face
                    facing = _dot(_norm(rel), front)
                    u = 0.5 + rel[0] / 0.22
                    w = 0.5 - rel[2] / 0.26
                    if facing < 0.15:
                        u, w = 0.03, 0.03
                    nv = dict(src)
                    nv["uv"] = (min(max(u, 0.0), 1.0), min(max(w, 0.0), 1.0))
                    verts.append(nv)
                    head_verts[v] = len(verts) - 1
                ids.append(head_verts[v])
            new_tris.append((ids[0], ids[1], ids[2], "head"))
        else:
            new_tris.append((a, b, c, g))
    return verts, new_tris


def to_group(verts, tris, name):
    used = {}
    pos, nor, uv, si, sw, idx = [], [], [], [], [], []
    for a, b, c, g in tris:
        if g != name:
            continue
        for v in (a, b, c):
            if v not in used:
                used[v] = len(used)
                vv = verts[v]
                pos += list(vv["p"])
                nor += list(vv["n"])
                uv += list(vv["uv"])
                si += vv["si"]
                sw += vv["sw"]
            idx.append(used[v])
    return {"pos": pos, "normal": nor, "uv": uv, "skinIndex": si, "skinWeight": sw, "index": idx}


def smooth_body(groups, order, neck_joint, levels=2):
    verts, tris = merge_groups(groups, order)
    smooth_normals(verts, tris)
    for _ in range(levels):
        verts, tris = subdivide(verts, tris)
        smooth_normals(verts, tris)
    verts, tris = split_head(verts, tris, neck_joint)
    out = {name: to_group(verts, tris, name) for name in list(order) + ["head"]}
    return out
