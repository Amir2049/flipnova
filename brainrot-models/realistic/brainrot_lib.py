"""Shared toolkit for the Brainrot Heist "Roblox brainrot" style models.

Style rules (kept simple on purpose):
- one smooth organic body made of metaballs, normal proportions, real (not cartoon) eyes;
- bright, clean materials with only light procedural texture, baked to colour + normal maps;
- one funny real-world gag per creature (sneakers, sunglasses, a crown...);
- one mesh per creature, under Roblox's 20,000-triangle MeshPart limit.
"""
import math
import os

import bpy
import bmesh  # noqa: F401  (available once bpy is imported; used by creature scripts)
from mathutils import Vector

TEX = 1024
MAX_TRIS = 18000
objs = []
_metas = []


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    objs.clear()
    _metas.clear()


def lin(rgb):
    return (*[((c / 255 + 0.055) / 1.055) ** 2.4 for c in rgb], 1)


def mat(name, base, base2=None, rough=0.45, scale=8.0, bump=0.12, kind="noise", coat=0.0, metal=0.0, emit=0.0, sss=0.0):
    """Principled material with gentle procedural colour variation (noise or scale-like voronoi)."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = 0.0  # a colour bake drops metallic parts to dark brown
    b.inputs["Coat Weight"].default_value = coat
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
    if emit:
        b.inputs["Emission Color"].default_value = lin(base)
        b.inputs["Emission Strength"].default_value = emit
    coord = nt.nodes.new("ShaderNodeTexCoord")
    if kind == "scales":
        tex = nt.nodes.new("ShaderNodeTexVoronoi")
        tex.feature = "DISTANCE_TO_EDGE"
        fac = tex.outputs["Distance"]
    else:
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Detail"].default_value = 6
        fac = tex.outputs["Fac"]
    tex.inputs["Scale"].default_value = scale
    nt.links.new(coord.outputs["Object"], tex.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = lin(base2 or [c * 0.85 for c in base])
    ramp.color_ramp.elements[1].color = lin(base)
    if kind == "scales":
        ramp.color_ramp.elements[1].position = 0.12
    nt.links.new(fac, ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    if bump:
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = bump
        nt.links.new(fac, bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    m.diffuse_color = lin(base)
    return m


def add(o, m, smooth=True):
    o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    objs.append(o)
    return o


# ---------------------------------------------------------------- organic bodies
class Meta:
    """A metaball body. Add ellipsoids/balls/curves, then .mesh(material) converts it."""

    def __init__(self, name, resolution=0.09):
        self.mb = bpy.data.metaballs.new(name)
        self.mb.resolution = resolution
        self.mb.render_resolution = resolution
        self.mb.threshold = 0.6
        self.obj = bpy.data.objects.new(name, self.mb)
        bpy.context.scene.collection.objects.link(self.obj)
        self.name = name

    def el(self, loc, r, size=(1, 1, 1), stiff=2.0):
        e = self.mb.elements.new()
        e.type = "ELLIPSOID"
        e.co = loc
        e.radius = r
        e.stiffness = stiff
        e.size_x, e.size_y, e.size_z = size
        return e

    def ball(self, loc, r):
        e = self.mb.elements.new()
        e.type = "BALL"
        e.co = loc
        e.radius = r
        return e

    def curve(self, p0, p1, p2, n, r0, r1):
        for p in bezier(p0, p1, p2, n):
            t = bezier.last_t
            self.ball(p, r0 + (r1 - r0) * t)

    def mesh(self, material):
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = self.obj
        self.obj.select_set(True)
        bpy.ops.object.convert(target="MESH")
        o = bpy.context.object
        o.name = self.name
        _metas.append(o)
        return add(o, material)


def bezier(p0, p1, p2, n):
    for i in range(n):
        t = i / (n - 1)
        bezier.last_t = t
        yield tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c for a, b, c in zip(p0, p1, p2))


def surf(body, origin, direction, inset=0.04):
    """Where a ray first hits `body` (for sticking eyes, horns and accessories onto skin)."""
    bpy.context.view_layer.update()
    mw = body.matrix_world
    inv = mw.inverted()
    ok, loc, normal, _ = body.ray_cast(inv @ Vector(origin), (inv.to_3x3() @ Vector(direction)).normalized())
    if not ok:
        print("WARN ray missed", body.name, origin, direction)
        return Vector(origin), -Vector(direction).normalized()
    loc = mw @ loc
    normal = (inv.transposed().to_3x3() @ normal).normalized()
    return loc - normal * inset, normal


# ---------------------------------------------------------------- primitives
def ball(loc, r, m, scale=(1, 1, 1), seg=16, ring=10, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=tuple(loc), segments=seg, ring_count=ring, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return add(o, m)


def cyl(loc, r, depth, m, rot=(0, 0, 0), verts=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=tuple(loc), rotation=rot)
    return add(bpy.context.object, m)


def torus(loc, R, r, m, rot=(0, 0, 0), scale=(1, 1, 1), maj=28, mn=8):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=maj, minor_segments=mn,
                                     location=tuple(loc), rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return add(o, m)


def stick(a, b, r, m, verts=10):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=tuple((a + b) / 2))
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return add(o, m)


def horn(base, direction, length, r, m, segs=5, curl=0.0):
    """Curved tapering horn/claw/spike."""
    d = Vector(direction).normalized()
    p = Vector(base)
    for i in range(segs):
        rr = r * (1 - i / segs)
        step = length / segs
        d = (d + Vector((0, curl, -curl * 0.3))).normalized()
        q = p + d * step
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=rr, radius2=r * (1 - (i + 1) / segs) + 0.005,
                                        depth=step * 1.05, location=tuple((p + q) / 2))
        o = bpy.context.object
        o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        add(o, m)
        p = q


def lathe(profile, m, steps=40, bands=None):
    """Round object from an (r, z) profile, e.g. bowls and pots. bands=[(z0, z1, material)]."""
    me = bpy.data.meshes.new("Lathe")
    me.from_pydata([(r, 0, z) for r, z in profile], [(i, i + 1) for i in range(len(profile) - 1)], [])
    o = bpy.data.objects.new("Lathe", me)
    bpy.context.scene.collection.objects.link(o)
    s = o.modifiers.new("Screw", "SCREW")
    s.steps = s.render_steps = steps
    s.use_merge_vertices = True
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.modifier_apply(modifier="Screw")
    o.data.materials.append(m)
    for i, (z0, z1, bm_) in enumerate(bands or []):
        o.data.materials.append(bm_)
        for p in o.data.polygons:
            if z0 < p.center.z < z1:
                p.material_index = i + 1
    for p in o.data.polygons:
        p.use_smooth = True
    objs.append(o)
    return o


# ---------------------------------------------------------------- shared accessories
def real_eye(body, origin, direction, size, iris_rgb=(120, 80, 40)):
    """White eyeball, coloured iris and pupil, set into the skin. No cartoon shine."""
    sclera = mat("Sclera", (255, 255, 255), (235, 232, 228), rough=0.1, bump=0, coat=1.0)
    iris = mat(f"Iris{iris_rgb}", iris_rgb, [c * 0.6 for c in iris_rgb], rough=0.05, bump=0, coat=1.0)
    pupil = mat("Pupil", (12, 10, 8), (0, 0, 0), rough=0.05, bump=0, coat=1.0)
    p, n = surf(body, origin, direction, inset=size * 0.55)
    look = Vector(n)
    face = look.to_track_quat("Z", "Y").to_euler()
    ball(p, size, sclera)
    # Iris and pupil are thin discs lying on the eyeball, so the eye reads as real, not googly.
    ball(p + look * size * 0.9, size * 0.55, iris, scale=(1, 1, 0.3), rot=face)
    ball(p + look * size * 1.0, size * 0.26, pupil, scale=(1, 1, 0.3), rot=face)
    return p, n


def sneakers(feet, size=1.0, stripe=(30, 110, 235)):
    """The brainrot gag: clean white sneakers. feet = [(x, y, z_ground)], toes point -Y."""
    shoe = mat("Sneaker", (250, 250, 250), (228, 228, 232), rough=0.45, bump=0.03)
    sole = mat("Sole", (238, 238, 242), (210, 210, 215), rough=0.6, bump=0)
    band = mat(f"Stripe{stripe}", stripe, rough=0.4, bump=0)
    heel = mat("HeelTab", (230, 40, 40), rough=0.4, bump=0)
    for x, y, z in feet:
        s = size
        ball((x, y - 0.1 * s, z + 0.3 * s), 0.5 * s, shoe, scale=(0.85, 1.45, 0.6), seg=20, ring=12)
        ball((x, y - 0.12 * s, z + 0.07 * s), 0.5 * s, sole, scale=(0.9, 1.55, 0.18), seg=20, ring=8)
        ball((x, y + 0.32 * s, z + 0.55 * s), 0.3 * s, shoe, scale=(0.9, 0.7, 0.7))
        side = 1 if x >= 0 else -1
        ball((x + 0.37 * s * side, y - 0.1 * s, z + 0.3 * s), 0.5 * s, band, scale=(0.06, 0.9, 0.28))
        ball((x, y + 0.6 * s, z + 0.5 * s), 0.16 * s, heel, scale=(0.8, 0.4, 1.0))


def sunglasses(center, width, facing_y=-1):
    lens = mat("SunLens", (20, 20, 30), (5, 5, 10), rough=0.05, bump=0, coat=1.0, metal=0.3)
    frame = mat("SunFrame", (25, 25, 25), rough=0.3, bump=0)
    cx, cy, cz = center
    for sx in (-1, 1):
        ball((cx + width * 0.27 * sx, cy, cz), width * 0.22, lens, scale=(1, 0.3, 0.75))
    stick((cx - width * 0.06, cy, cz + 0.05), (cx + width * 0.06, cy, cz + 0.05), 0.04, frame)
    for sx in (-1, 1):
        stick((cx + width * 0.49 * sx, cy, cz + 0.05), (cx + width * 0.5 * sx, cy - facing_y * width * 0.55, cz + 0.08),
              0.04, frame)


def nemes(center, width, depth, height, gold, blue):
    """Pharaoh headdress: smooth gold cap with blue bands and side lappets."""
    cx, cy, cz = center
    ball((cx, cy, cz), 0.5, gold, scale=(width, depth, height), seg=24, ring=14)
    for i in range(3):
        dz = -height * 0.08 + i * height * 0.14
        k = math.sqrt(max(0.0, 1 - (dz / (height / 2)) ** 2))
        torus((cx, cy, cz + dz), width / 2 * k + 0.01, 0.045, blue, scale=(1, depth / width, 1), maj=32, mn=5)
    for sx in (-1, 1):
        ball((cx + width * 0.45 * sx, cy - depth * 0.1, cz - height * 0.75), 0.5, gold,
             scale=(width * 0.18, depth * 0.3, height * 1.1))
        for k in range(2):
            ball((cx + width * 0.45 * sx, cy - depth * 0.1, cz - height * (0.55 + 0.35 * k)), 0.5, blue,
                 scale=(width * 0.19, depth * 0.31, height * 0.08))


# ---------------------------------------------------------------- finish: join, bake, render, export
def finalize(name, out, ground_rgb=(110, 185, 90)):
    scene = bpy.context.scene
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    model = bpy.context.object
    model.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    low = min(v.co.z for v in model.data.vertices)
    for v in model.data.vertices:
        v.co.z -= low
    tris = sum(len(p.vertices) - 2 for p in model.data.polygons)
    if tris > MAX_TRIS:
        d = model.modifiers.new("Dec", "DECIMATE")
        d.ratio = MAX_TRIS / tris * 0.98
        bpy.ops.object.modifier_apply(modifier="Dec")
    tris = sum(len(p.vertices) - 2 for p in model.data.polygons)
    print("TRIANGLES", name, tris, "SIZE", [round(x, 2) for x in model.dimensions])
    assert tris <= 20000, "Roblox MeshPart limit is 20,000 triangles"

    # Bake the procedural look into one colour map and one normal map.
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
    bpy.ops.object.mode_set(mode="OBJECT")
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8
    images = {}
    for kind, colorspace in (("Color", "sRGB"), ("Normal", "Non-Color")):
        img = bpy.data.images.new(f"{name}_{kind}", TEX, TEX)
        img.colorspace_settings.name = colorspace
        for m in model.data.materials:
            nt = m.node_tree
            n = nt.nodes.get("BakeTarget") or nt.nodes.new("ShaderNodeTexImage")
            n.name = "BakeTarget"
            n.image = img
            nt.nodes.active = n
        scene.render.bake.use_pass_direct = False
        scene.render.bake.use_pass_indirect = False
        scene.render.bake.use_pass_color = True
        scene.render.bake.margin = 4
        bpy.ops.object.bake(type="DIFFUSE" if kind == "Color" else "NORMAL")
        img.filepath_raw = os.path.join(out, f"{name}_{kind}.png")
        img.file_format = "PNG"
        img.save()
        images[kind] = img
    emissive = any(m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value > 0
                   for m in model.data.materials)
    baked = bpy.data.materials.new(f"{name}_Baked")
    baked.use_nodes = True
    nt = baked.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.45
    ci = nt.nodes.new("ShaderNodeTexImage")
    ci.image = images["Color"]
    nt.links.new(ci.outputs["Color"], b.inputs["Base Color"])
    ni = nt.nodes.new("ShaderNodeTexImage")
    ni.image = images["Normal"]
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(ni.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    model.data.materials.clear()
    model.data.materials.append(baked)
    print("EMISSIVE PARTS (set Material=Neon in Studio if wanted):", emissive)

    # Preview of the exported (baked) model in a Roblox-like setting.
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
    g = bpy.context.object
    gm = bpy.data.materials.new("Ground")
    gm.use_nodes = True
    gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = lin(ground_rgb)
    g.data.materials.append(gm)
    world = bpy.data.worlds.new("W")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = lin((120, 180, 255))
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.7
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(38), math.radians(12), math.radians(-40)))
    bpy.context.object.data.energy = 3.2
    bpy.context.object.data.angle = math.radians(4)
    dims = model.dimensions
    radius = 0.5 * dims.length
    target = Vector((0, 0, dims.z * 0.45))
    bpy.ops.object.camera_add(location=target + Vector((0.55, -0.8, 0.28)).normalized() * radius * 3.1)
    cam = bpy.context.object
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 55
    scene.camera = cam
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 1000
    scene.view_settings.view_transform = "Standard"
    scene.render.filepath = os.path.join(out, f"{name}_preview.png")
    bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="DESELECT")
    model.select_set(True)
    bpy.context.view_layer.objects.active = model
    bpy.ops.export_scene.fbx(filepath=os.path.join(out, f"{name}.fbx"), use_selection=True, apply_unit_scale=True,
                             axis_forward="-Z", axis_up="Y", mesh_smooth_type="FACE", path_mode="COPY",
                             embed_textures=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f"{name}.blend"))
    return model
