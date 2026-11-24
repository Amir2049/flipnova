"""AFC stadium pieces, built and lit in Blender (headless), exported as GLB for Godot.

  blender --background --factory-startup --python tools/blender/make_stadium.py -- <out dir>

Writes
  stand_section.glb   one 12 m section of a stand: 26 stepped terrace rows with seats (red lower tier, a white
                      band, green upper tier), an aisle with steps and handrails in the middle, the front wall,
                      the back wall with two exits, a roof on a cantilever truss and a fascia with a red stripe.
                      Godot tiles it along each side (scripts/view/pitch_view.gd). Its local frame matches the
                      game's stand code: x along the stand (-6..6), y up, z away from the pitch (front at z = 0),
                      rows 0.85 m deep and 0.55 m high above a 1.3 m base.
  floodlight.glb      a lattice floodlight tower, 46 m, with an emissive lamp head facing -z.

Lighting: every surface's colour is baked together with the shade the geometry casts on itself (Cycles, a white
sky, no lamps), so the stands look solid on the cheapest renderer while the game's own sun / floodlights still
light them (day and night both work). One 1024 px texture per piece.
"""
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "."
os.makedirs(OUT, exist_ok=True)

# the game's stand geometry (pitch_view.gd _tier): keep these in step
ROWS = 26
TREAD = 0.85
RISE = 0.55
BASE = 1.3
SEC = 12.0          # section length
AISLE = 0.7         # half-width of the stair aisle at x = 0

PAL = {
    "concrete": (0.30, 0.31, 0.32, 1),
    "riser": (0.30, 0.31, 0.32, 1),
    "red": (0.16, 0.02, 0.03, 1),       # seats read much lighter under the match sun (they were pink): deep maroon
    "white": (0.36, 0.37, 0.37, 1),
    "green": (0.03, 0.15, 0.11, 1),
    "rail": (0.75, 0.76, 0.78, 1),
    "steel": (0.20, 0.22, 0.25, 1),
    "roof": (0.36, 0.38, 0.40, 1),
    "fascia": (0.04, 0.16, 0.11, 1),
    "stripe": (0.70, 0.05, 0.12, 1),
    "exit": (0.02, 0.02, 0.025, 1),
    "lamp": (1.0, 0.98, 0.9, 1),
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 24
    w = bpy.data.worlds.new("sky")
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0
    sc.world = w


def material(name):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = PAL[name]
    bsdf.inputs["Roughness"].default_value = 0.9
    return m


class Builder:
    """Collects quads / boxes per material into one mesh."""

    def __init__(self, name):
        self.bm = bmesh.new()
        self.name = name
        self.mats = []

    def mat_index(self, name):
        if name not in self.mats:
            self.mats.append(name)
        return self.mats.index(name)

    def quad(self, a, b, c, d, mat):
        vs = [self.bm.verts.new(Vector(p)) for p in (a, b, c, d)]
        f = self.bm.faces.new(vs)
        f.material_index = self.mat_index(mat)
        return f

    def box(self, lo, hi, mat, skip=()):
        x0, y0, z0 = lo
        x1, y1, z1 = hi
        faces = {
            "-z": ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)),
            "+z": ((x1, y0, z1), (x0, y0, z1), (x0, y1, z1), (x1, y1, z1)),
            "-x": ((x0, y0, z1), (x0, y0, z0), (x0, y1, z0), (x0, y1, z1)),
            "+x": ((x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)),
            "+y": ((x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)),
            "-y": ((x0, y0, z1), (x1, y0, z1), (x1, y0, z0), (x0, y0, z0)),
        }
        for k, q in faces.items():
            if k not in skip:
                self.quad(*q, mat)

    def beam(self, p, q, r, mat):
        """a square beam of half-width r from p to q"""
        p, q = Vector(p), Vector(q)
        d = (q - p).normalized()
        up = Vector((0, 1, 0)) if abs(d.y) < 0.9 else Vector((1, 0, 0))
        s = d.cross(up).normalized() * r
        u = s.cross(d).normalized() * r
        ring = lambda c: [c + s + u, c - s + u, c - s - u, c + s - u]
        a, b = ring(p), ring(q)
        for i in range(4):
            j = (i + 1) % 4
            self.quad(a[i], a[j], b[j], b[i], mat)

    def object(self):
        # Godot is y-up like our coordinates; Blender is z-up: build in game axes, convert (x, y, z) -> (x, -z, y)
        for v in self.bm.verts:
            x, y, z = v.co
            v.co = Vector((x, -z, y))
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        for n in self.mats:
            me.materials.append(material(n))
        return ob


def seat_colour(r):
    return "red" if r < 12 else ("white" if r < 14 else "green")


def stand_section():
    b = Builder("stand_section")
    h = SEC * 0.5
    for r in range(ROWS):
        z0, z1 = r * TREAD, (r + 1) * TREAD
        y = BASE + r * RISE
        # riser and tread across the whole section
        b.quad((-h, y - RISE, z0), (h, y - RISE, z0), (h, y, z0), (-h, y, z0), "riser")
        b.quad((-h, y, z0), (h, y, z0), (h, y, z1), (-h, y, z1), "concrete")
        # seats: one moulded bench (pan + back) per row on each side of the aisle. Cheap on purpose: 22 of these
        # sections line a pitch, and on a phone the camera is far enough that the row is what reads, not the seat
        col = seat_colour(r)
        pz = z0 + 0.18
        for xa, xb in ((-h, -AISLE), (AISLE, h)):
            b.quad((xa, y + 0.46, pz), (xb, y + 0.46, pz), (xb, y + 0.46, pz + 0.38), (xa, y + 0.46, pz + 0.38), col)
            b.quad((xa, y + 0.30, pz), (xb, y + 0.30, pz), (xb, y + 0.46, pz), (xa, y + 0.46, pz), col)
            b.quad((xa, y + 0.46, pz + 0.38), (xb, y + 0.46, pz + 0.38), (xb, y + 0.88, pz + 0.42), (xa, y + 0.88, pz + 0.42), col)
            b.quad((xa, y + 0.88, pz + 0.42), (xb, y + 0.88, pz + 0.42), (xb, y + 0.88, pz + 0.50), (xa, y + 0.88, pz + 0.50), col)
            b.quad((xa, y + 0.30, pz + 0.50), (xb, y + 0.30, pz + 0.50), (xb, y + 0.88, pz + 0.50), (xa, y + 0.88, pz + 0.50), col)
        # aisle: two half steps per row and a handrail post every other row
        hr = RISE * 0.5
        b.box((-AISLE + 0.05, y, z0), (AISLE - 0.05, y + hr, z0 + TREAD * 0.5), "concrete", skip=("-y",))
        if r % 2 == 0:
            for sx in (-AISLE, AISLE):
                b.beam((sx, y, z0 + 0.4), (sx, y + 1.0, z0 + 0.4), 0.025, "rail")
    top = BASE + ROWS * RISE
    depth = ROWS * TREAD
    # handrails along the aisle, following the rake
    for sx in (-AISLE, AISLE):
        b.beam((sx, BASE + 1.0, 0.4), (sx, top - RISE + 1.0, depth - TREAD + 0.4), 0.03, "rail")
    # front wall (behind the advertising boards)
    b.box((-h, -0.55, -0.4), (h, BASE + 0.15, 0.0), "concrete", skip=("-y",))
    # back wall with two exits
    b.quad((-h, top, depth), (h, top, depth), (h, top + 4.0, depth), (-h, top + 4.0, depth), "concrete")
    for ex in (-3.5, 3.5):
        b.quad((ex - 1.0, top, depth - 0.02), (ex + 1.0, top, depth - 0.02), (ex + 1.0, top + 2.4, depth - 0.02),
               (ex - 1.0, top + 2.4, depth - 0.02), "exit")
    # roof: a cantilever truss at the section's left edge (tiling gives one every 12 m), a sheet, a fascia
    roof_back = top + 9.0
    roof_front = top + 7.0
    zf = depth * 0.12
    tx = -h + 0.3
    b.beam((tx, top + 4.0, depth + 0.3), (tx, roof_back, depth + 0.3), 0.3, "steel")
    b.beam((tx, roof_back, depth + 0.3), (tx, roof_front, zf), 0.22, "steel")
    b.beam((tx, top + 4.0, depth + 0.3), (tx, roof_front - 0.3, zf + depth * 0.45), 0.15, "steel")
    b.quad((-h, roof_front, zf), (h, roof_front, zf), (h, roof_back, depth + 0.6), (-h, roof_back, depth + 0.6), "roof")
    b.quad((h, roof_front - 0.15, zf), (-h, roof_front - 0.15, zf), (-h, roof_back - 0.15, depth + 0.6),
           (h, roof_back - 0.15, depth + 0.6), "steel")
    b.box((-h, roof_front - 1.1, zf - 0.3), (h, roof_front + 0.3, zf), "fascia")
    b.box((-h, roof_front - 0.75, zf - 0.32), (h, roof_front - 0.45, zf - 0.30), "stripe")
    return b.object()


def floodlight():
    b = Builder("floodlight")
    hgt = 46.0
    legs = [(-1.6, -1.6), (1.6, -1.6), (1.6, 1.6), (-1.6, 1.6)]
    top_w = 0.6
    pts = lambda t: [(x * (1 - t) + x / 1.6 * top_w * t, hgt * t, z * (1 - t) + z / 1.6 * top_w * t) for x, z in legs]
    lv = 9
    for i in range(4):
        b.beam(pts(0)[i], pts(1)[i], 0.12, "steel")
    for k in range(lv):
        t0, t1 = k / lv, (k + 1) / lv
        a, c = pts(t0), pts(t1)
        for i in range(4):
            j = (i + 1) % 4
            b.beam(a[i], c[j], 0.05, "steel")
            b.beam(a[i], a[j], 0.05, "steel")
    # the head: a frame facing -z (the pitch) with 4 x 6 lamps
    hw, hh = 4.5, 2.4
    cy = hgt + 1.8
    b.box((-hw, cy - hh, 0.2), (hw, cy + hh, 0.7), "steel")
    for r in range(4):
        for c in range(6):
            x0 = -hw + 0.4 + c * (2 * hw - 0.8) / 6
            y0 = cy - hh + 0.35 + r * (2 * hh - 0.7) / 4
            b.box((x0 + 0.08, y0 + 0.08, 0.0), (x0 + (2 * hw - 0.8) / 6 - 0.08, y0 + (2 * hh - 0.7) / 4 - 0.08, 0.2), "lamp")
    ob = b.object()
    n = bpy.data.materials["lamp"].node_tree.nodes.get("Principled BSDF")
    n.inputs["Emission Color"].default_value = (1, 0.97, 0.88, 1)
    n.inputs["Emission Strength"].default_value = 4.0
    return ob


def bake_to_texture(ob, size=1024):
    """Unwrap, bake colour + self-shadowing from a white sky into one image, and give the mesh a single material
    using it (what the GLB carries). The lamp material, if any, stays as it is (emissive)."""
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
    bpy.ops.object.mode_set(mode="OBJECT")
    img = bpy.data.images.new(ob.name + "_baked", size, size)
    for m in ob.data.materials:
        if m.name == "lamp":
            continue
        node = m.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = img
        m.node_tree.nodes.active = node
    sc = bpy.context.scene
    sc.render.bake.use_pass_direct = True
    sc.render.bake.use_pass_indirect = True
    sc.render.bake.margin = 4
    bpy.ops.object.bake(type="COMBINED")
    # one material on everything but the lamps: the baked image as base colour
    baked = bpy.data.materials.new(ob.name + "_mat")
    baked.use_nodes = True
    bs = baked.node_tree.nodes.get("Principled BSDF")
    tex = baked.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    baked.node_tree.links.new(tex.outputs["Color"], bs.inputs["Base Color"])
    bs.inputs["Roughness"].default_value = 0.92
    for i, m in enumerate(ob.data.materials):
        if m.name != "lamp":
            ob.data.materials[i] = baked
    img.file_format = "PNG"
    img.pack()
    return img


def export(ob, path):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True,
                              export_yup=True, export_image_format="JPEG", export_jpeg_quality=88)
    print("wrote", path, os.path.getsize(path) // 1024, "KB", len(ob.data.polygons), "faces")


reset()
s = stand_section()
bake_to_texture(s, 1024)
export(s, os.path.join(OUT, "stand_section.glb"))
reset()
f = floodlight()
bake_to_texture(f, 512)
export(f, os.path.join(OUT, "floodlight.glb"))
