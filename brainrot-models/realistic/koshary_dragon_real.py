"""Koshary Dragon — semi-realistic "brainrot" style: a real koshary bowl with a dragon growing out of it.

Run:  python koshary_dragon_real.py <outdir>
Organic shapes are built from metaballs, surface detail (scales, rice, glaze) is procedural and then
baked into a colour + normal texture so it survives the FBX export into Roblox.
Writes KosharyDragonReal.fbx (+ textures), .blend and a preview render. 1 unit = 1 stud.
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[-1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)
NAME = "KosharyDragonReal"
TEX = 1024
MAX_TRIS = 18000
rnd = random.Random(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
objs = []


def lin(rgb):
    return (*[((c / 255 + 0.055) / 1.055) ** 2.4 for c in rgb], 1)


def node_mat(name, base, base2=None, rough=0.5, scale=8.0, bump=0.3, kind="noise", sss=0.0, metal=0.0, coat=0.0):
    """Principled material with procedural colour variation and bump."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.4, 0.2, 0.1)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    if kind == "scales":
        tex = nt.nodes.new("ShaderNodeTexVoronoi")
        tex.feature = "DISTANCE_TO_EDGE"
        tex.inputs["Scale"].default_value = scale
        fac = tex.outputs["Distance"]
    else:
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = scale
        tex.inputs["Detail"].default_value = 8
        fac = tex.outputs["Fac"]
    nt.links.new(coord.outputs["Object"], tex.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = lin(base2 or [c * 0.6 for c in base])
    ramp.color_ramp.elements[1].color = lin(base)
    if kind == "scales":
        ramp.color_ramp.elements[0].position = 0.0
        ramp.color_ramp.elements[1].position = 0.12
    nt.links.new(fac, ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    nt.links.new(fac, bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    m.diffuse_color = lin(base)
    return m


SCALES = node_mat("Scales", (60, 140, 70), (20, 60, 35), rough=0.35, scale=18, bump=0.6, kind="scales", sss=0.05, coat=0.3)
BELLY = node_mat("BellyPlates", (215, 190, 120), (150, 120, 70), rough=0.5, scale=6, bump=0.4)
HORN = node_mat("Horn", (235, 220, 190), (120, 95, 70), rough=0.4, scale=4, bump=0.5)
EYE = node_mat("Eye", (255, 190, 30), (200, 80, 0), rough=0.05, scale=3, bump=0.0, coat=1.0)
PUPIL = node_mat("Pupil", (10, 8, 6), (0, 0, 0), rough=0.05, bump=0.0, coat=1.0)
MEMBRANE = node_mat("Membrane", (120, 60, 40), (60, 30, 25), rough=0.6, scale=5, bump=0.3, sss=0.2)
CLAY = node_mat("Clay", (175, 85, 45), (110, 50, 25), rough=0.45, scale=6, bump=0.25, coat=0.4)
GLAZE = node_mat("BlueGlaze", (30, 80, 160), (15, 40, 90), rough=0.15, scale=10, bump=0.1, coat=1.0)
RICE = node_mat("RiceLentils", (225, 200, 160), (120, 80, 45), rough=0.7, scale=40, bump=0.8)
PASTA = node_mat("Pasta", (240, 190, 100), (200, 140, 60), rough=0.4, scale=12, bump=0.2)
SAUCE = node_mat("Sauce", (190, 30, 15), (110, 10, 5), rough=0.15, scale=6, bump=0.2, coat=0.6)
CHICK = node_mat("Chickpea", (220, 180, 110), (170, 130, 70), rough=0.6, scale=20, bump=0.3)
ONION = node_mat("FriedOnion", (150, 75, 25), (70, 30, 10), rough=0.7, scale=25, bump=0.6)
TEETH = node_mat("Teeth", (245, 240, 220), (200, 190, 160), rough=0.3, scale=5, bump=0.1)
MOUTH = node_mat("Mouth", (150, 40, 50), (80, 15, 25), rough=0.3, scale=5, bump=0.1)


def add(o, m):
    o.data.materials.append(m)
    for p in getattr(o.data, "polygons", []):
        p.use_smooth = True
    objs.append(o)
    return o


# ---------------------------------------------------------------- organic dragon (metaballs)
mb = bpy.data.metaballs.new("DragonMeta")
mb.resolution = 0.09
mb.render_resolution = 0.09
mb.threshold = 0.6
meta_obj = bpy.data.objects.new("DragonMeta", mb)
scene.collection.objects.link(meta_obj)


def el(loc, r, size=(1, 1, 1), rot=None, kind="ELLIPSOID", stiff=2.0):
    e = mb.elements.new()
    e.type = kind
    e.co = loc
    e.radius = r
    e.stiffness = stiff
    if kind == "ELLIPSOID":
        e.size_x, e.size_y, e.size_z = size
    if rot:
        e.rotation = rot
    return e


def along(p0, p1, p2, n, r0, r1):
    for i in range(n):
        t = i / (n - 1)
        p = [(1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c for a, b, c in zip(p0, p1, p2)]
        el(p, r0 + (r1 - r0) * t, kind="BALL")


# Neck rising out of the bowl, curving forward into the head (front = -Y).
along((0, 0.5, 1.6), (0, 0.4, 3.6), (0, -0.6, 4.4), 12, 0.95, 0.62)
# Skull, brow ridges, long snout and lower jaw.
el((0, -0.8, 4.75), 1.3, size=(0.85, 1.0, 0.8))
for sx in (-1, 1):
    el((0.5 * sx, -1.25, 5.15), 0.6, size=(0.6, 1.0, 0.45))
el((0, -1.95, 4.6), 1.1, size=(0.6, 1.2, 0.5))
el((0, -1.85, 4.12), 0.95, size=(0.5, 1.1, 0.32))
el((0, -2.8, 4.55), 0.65, size=(0.6, 0.7, 0.55))  # nose tip
# Shoulders and front legs gripping the bowl rim; back legs at the sides.
for sx in (-1, 1):
    along((0.6 * sx, -0.2, 2.3), (1.3 * sx, -1.9, 2.8), (1.6 * sx, -2.4, 1.6), 9, 0.5, 0.32)
    along((1.3 * sx, 1.0, 2.0), (2.7 * sx, 1.3, 2.3), (2.8 * sx, 1.0, 0.3), 10, 0.55, 0.32)
# Tail coming out the back of the bowl and curling round on the ground.
along((0, 1.3, 1.5), (0, 2.8, 0.9), (1.4, 3.1, 0.3), 12, 0.55, 0.12)

bpy.context.view_layer.objects.active = meta_obj
meta_obj.select_set(True)
bpy.ops.object.convert(target="MESH")
dragon = bpy.context.object
dragon.name = "DragonBody"
add(dragon, SCALES)
# Belly plates: same mesh, faces pointing forward-down get the belly material.
dragon.data.materials.append(BELLY)
for p in dragon.data.polygons:
    n = p.normal
    if n.y < -0.55 and n.z < 0.25 and p.center.z < 4.0 and abs(p.center.x) < 0.7:
        p.material_index = 1


def surf(origin, direction, inset=0.04):
    """First point where a ray hits the dragon body (to stick eyes, horns and spikes onto the skin)."""
    ok, loc, normal, _ = dragon.ray_cast(Vector(origin), Vector(direction).normalized())
    assert ok, f"ray {origin} -> {direction} missed the body"
    return loc - normal * inset, normal


def mound_z(x, y, lift=0.03):
    d = min(math.hypot(x, y), 2.09)
    return 1.75 + 0.63 * math.sqrt(1 - (d / 2.1) ** 2) + lift


def ball(loc, r, m, scale=(1, 1, 1), seg=16, ring=10, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return add(o, m)


def horn(base, direction, length, r, m, segs=6, curl=0.0):
    """Curved tapering horn/claw/spike as a chain of cones."""
    d = Vector(direction).normalized()
    p = Vector(base)
    for i in range(segs):
        t = i / segs
        rr = r * (1 - t)
        step = length / segs
        d = (d + Vector((0, curl, -curl * 0.3))).normalized()
        q = p + d * step
        mid = (p + q) / 2
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=rr, radius2=r * (1 - (i + 1) / segs) + 0.005,
                                        depth=step * 1.05, location=mid)
        o = bpy.context.object
        o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        add(o, m)
        p = q


# Reptile eyes: amber with slit pupils, under the brow ridge.
for sx in (-1, 1):
    p, n = surf((4 * sx, -1.45, 4.95), (-sx, 0.15, 0), inset=0.1)
    ball(tuple(p), 0.24, EYE, scale=(0.75, 1, 0.8))
    ball(tuple(p + n * 0.14), 0.17, PUPIL, scale=(0.3, 0.3, 1.0))
    p, n = surf((0.25 * sx, -6, 4.65), (0, 1, 0))
    ball(tuple(p), 0.08, PUPIL, scale=(1, 0.6, 0.6))  # nostrils
    # Swept-back horns rooted in the skull.
    p, _ = surf((0.45 * sx, -0.7, 9), (0, 0, -1), inset=0.12)
    horn(tuple(p), (0.3 * sx, 1.0, 0.75), 1.8, 0.22, HORN, segs=6, curl=0.08)
    p, _ = surf((4 * sx, -0.4, 4.9), (-sx, 0, 0), inset=0.1)
    horn(tuple(p), (0.8 * sx, 0.8, 0.2), 0.8, 0.12, HORN, segs=4)
    # Teeth hanging from the upper jaw.
    for k in range(4):
        y = -2.7 + 0.3 * k
        p, _ = surf((3 * sx, y, 4.38), (-sx, 0, 0), inset=0.05)
        horn(tuple(p), (0, 0, -1), 0.24, 0.065, TEETH, segs=2)
    # Claws on all four feet (front feet hang over the rim, back feet on the ground).
    # Claws rooted on the tip of each foot (found by casting a ray at the leg's end).
    for end, d in (((1.6 * sx, -2.4, 1.55), (0, -0.4, -1)), ((2.8 * sx, 1.0, 0.3), (0, -1, -0.3))):
        ex, ey, ez = end
        for t in (-1, 0, 1):
            p, _ = surf((ex + 0.14 * t, ey - 4, ez - 0.05), (0, 1, 0), inset=0.06)
            horn(tuple(p), (0.2 * t + d[0], d[1], d[2]), 0.42, 0.075, HORN, segs=3)
# Open mouth sliver.
ball((0, -2.3, 4.32), 0.5, MOUTH, scale=(0.8, 1.35, 0.14))
# Spines down the neck.
for i in range(7):
    t = i / 6
    z = 5.0 - 2.9 * t
    p, _ = surf((0, 8, z), (0, -1, 0), inset=0.08)
    horn(tuple(p), (0, 1, 0.45), 0.6 - 0.25 * t, 0.16 - 0.06 * t, HORN, segs=3)

# Wings: arm bone + fingers + membrane surface between them.
for sx in (-1, 1):
    shoulder = Vector((0.7 * sx, 0.9, 3.0))
    elbow = Vector((2.3 * sx, 1.6, 4.4))
    tips = [Vector((3.9 * sx, 2.2, 5.6)), Vector((4.3 * sx, 2.6, 3.9)), Vector((3.6 * sx, 2.4, 2.4))]
    for a, b in [(shoulder, elbow)] + [(elbow, t) for t in tips]:
        mid = (a + b) / 2
        d = (b - a)
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.09, depth=d.length, location=mid)
        o = bpy.context.object
        o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        add(o, SCALES)
    horn(tuple(tips[0]), tuple((tips[0] - elbow).normalized()), 0.4, 0.09, HORN, segs=2)
    # Membrane: fan of triangles from the elbow/shoulder through the finger tips, slightly billowed.
    verts, faces = [], []
    rows = 6
    # Simple ruled surface between the bone line and the trailing edge.
    lead = [shoulder.lerp(elbow, t / rows) for t in range(rows + 1)] + [elbow.lerp(tips[0], t / rows) for t in range(1, rows + 1)]
    trail = [Vector((1.0 * sx, 1.2, 2.2)).lerp(tips[2], t / rows) for t in range(rows + 1)] + \
            [tips[2].lerp(tips[1], t / rows) for t in range(1, rows + 1)]
    trail = trail[:len(lead)]
    cols = 5
    for i in range(len(lead)):
        for j in range(cols + 1):
            t = j / cols
            p = lead[i].lerp(trail[i], t)
            p.y += 0.25 * math.sin(math.pi * t)  # billow backwards
            verts.append(p)
    w = cols + 1
    for i in range(len(lead) - 1):
        for j in range(cols):
            faces.append((i * w + j, i * w + j + 1, (i + 1) * w + j + 1, (i + 1) * w + j))
    me = bpy.data.meshes.new(f"Membrane{sx}")
    me.from_pydata([tuple(v) for v in verts], [], faces)
    o = bpy.data.objects.new(f"Membrane{sx}", me)
    scene.collection.objects.link(o)
    sol = o.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = 0.04
    add(o, MEMBRANE)

# ---------------------------------------------------------------- the koshary bowl
prof = [(0.0, 0.0), (1.0, 0.0), (1.1, 0.12), (1.6, 0.5), (2.05, 1.15), (2.25, 1.75), (2.32, 1.9), (2.2, 1.92),
        (2.1, 1.75)]
me = bpy.data.meshes.new("BowlProfile")
me.from_pydata([(r, 0, z) for r, z in prof], [(i, i + 1) for i in range(len(prof) - 1)], [])
bowl = bpy.data.objects.new("Bowl", me)
scene.collection.objects.link(bowl)
scr = bowl.modifiers.new("Lathe", "SCREW")
scr.steps = 40
scr.render_steps = 40
scr.use_merge_vertices = True
bpy.context.view_layer.objects.active = bowl
bowl.select_set(True)
bpy.ops.object.modifier_apply(modifier="Lathe")
bowl.data.materials.append(CLAY)
bowl.data.materials.append(GLAZE)
for p in bowl.data.polygons:
    p.use_smooth = True
    if 0.95 < p.center.z < 1.35:  # a blue glazed band, like Egyptian pottery
        p.material_index = 1
objs.append(bowl)

# Koshary filling: domed rice/lentil mound displaced with noise, then toppings.
bpy.ops.mesh.primitive_uv_sphere_add(radius=2.1, location=(0, 0, 1.75), segments=40, ring_count=20)
mound = bpy.context.object
mound.scale = (1, 1, 0.3)
tex = bpy.data.textures.new("Grain", "CLOUDS")
tex.noise_scale = 0.12
disp = mound.modifiers.new("Disp", "DISPLACE")
disp.texture = tex
disp.strength = 0.12
add(mound, RICE)
for i in range(26):
    a, d = rnd.uniform(0, 2 * math.pi), rnd.uniform(0.3, 1.9)
    if abs(math.cos(a) * d) < 0.9 and math.sin(a) * d > -0.2 and math.sin(a) * d < 1.2:
        continue  # keep the neck area clear
    bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.065, major_segments=12, minor_segments=6,
                                     location=(math.cos(a) * d, math.sin(a) * d, mound_z(math.cos(a) * d, math.sin(a) * d)),
                                     rotation=(rnd.uniform(0, 3), rnd.uniform(0, 3), 0))
    o = bpy.context.object
    # Elbow pasta: keep only half of the ring.
    me = o.data
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > 0.02], context="VERTS")
    bm.to_mesh(me)
    bm.free()
    add(o, PASTA)
for i in range(18):
    a, d = rnd.uniform(0, 2 * math.pi), rnd.uniform(0.3, 1.9)
    ball((math.cos(a) * d, math.sin(a) * d, mound_z(math.cos(a) * d, math.sin(a) * d, 0.08)), 0.13, CHICK, seg=10, ring=6)
# Spicy tomato sauce pooled at the front and crispy onions scattered on top.
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.75, location=(-0.75, -1.15, mound_z(-0.75, -1.15, -0.02)), segments=24, ring_count=10)
o = bpy.context.object
o.scale = (1.2, 0.9, 0.12)
add(o, SAUCE)
for i in range(40):
    a, d = rnd.uniform(0, 2 * math.pi), rnd.uniform(0.2, 1.9)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(math.cos(a) * d, math.sin(a) * d, mound_z(math.cos(a) * d, math.sin(a) * d, 0.05)),
                                    rotation=(rnd.uniform(-.4, .4), rnd.uniform(-.4, .4), rnd.uniform(0, 3)))
    o = bpy.context.object
    o.scale = (0.36, 0.08, 0.05)
    add(o, ONION)

# ---------------------------------------------------------------- join, reduce, bake, export
bpy.ops.object.select_all(action="DESELECT")
for o in objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = dragon
bpy.ops.object.convert(target="MESH")
bpy.ops.object.join()
model = bpy.context.object
model.name = NAME
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
print("TRIANGLES", tris, "SIZE", [round(x, 2) for x in model.dimensions])
assert tris <= 20000

# UVs, then bake colour and normal from the procedural materials into two textures.
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
bpy.ops.object.mode_set(mode="OBJECT")
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 8
color_img = bpy.data.images.new(f"{NAME}_Color", TEX, TEX)
normal_img = bpy.data.images.new(f"{NAME}_Normal", TEX, TEX)
normal_img.colorspace_settings.name = "Non-Color"


def set_target(img):
    for m in model.data.materials:
        nt = m.node_tree
        n = nt.nodes.get("BakeTarget") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "BakeTarget"
        n.image = img
        nt.nodes.active = n


set_target(color_img)
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 4
bpy.ops.object.bake(type="DIFFUSE")
color_img.filepath_raw = os.path.join(OUT, f"{NAME}_Color.png")
color_img.file_format = "PNG"
color_img.save()
set_target(normal_img)
bpy.ops.object.bake(type="NORMAL")
normal_img.filepath_raw = os.path.join(OUT, f"{NAME}_Normal.png")
normal_img.file_format = "PNG"
normal_img.save()

# One baked material for Roblox (colour + normal), roughness kept moderate.
baked = bpy.data.materials.new(f"{NAME}_Baked")
baked.use_nodes = True
nt = baked.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs["Roughness"].default_value = 0.45
ci = nt.nodes.new("ShaderNodeTexImage")
ci.image = color_img
nt.links.new(ci.outputs["Color"], b.inputs["Base Color"])
ni = nt.nodes.new("ShaderNodeTexImage")
ni.image = normal_img
nm = nt.nodes.new("ShaderNodeNormalMap")
nt.links.new(ni.outputs["Color"], nm.inputs["Color"])
nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
procedural = list(model.data.materials)
model.data.materials.clear()
model.data.materials.append(baked)

# Preview render of the exported (baked) model.
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
g = bpy.context.object
gm = bpy.data.materials.new("Ground")
gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = lin((200, 170, 120))
g.data.materials.append(gm)
world = bpy.data.worlds.new("W")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = lin((150, 185, 230))
world.node_tree.nodes["Background"].inputs[1].default_value = 0.7
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(38), math.radians(12), math.radians(-40)))
bpy.context.object.data.energy = 4.0
bpy.context.object.data.angle = math.radians(4)
size = max(model.dimensions)
target = Vector((0, 0, model.dimensions.z * 0.45))
bpy.ops.object.camera_add(location=target + Vector((0.55, -0.8, 0.28)).normalized() * size * 2.6)
cam = bpy.context.object
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 55
scene.camera = cam
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 1000
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy"
scene.render.filepath = os.path.join(OUT, f"{NAME}_preview.png")
bpy.ops.render.render(write_still=True)

bpy.ops.object.select_all(action="DESELECT")
model.select_set(True)
bpy.context.view_layer.objects.active = model
bpy.ops.export_scene.fbx(filepath=os.path.join(OUT, f"{NAME}.fbx"), use_selection=True, apply_unit_scale=True,
                         axis_forward="-Z", axis_up="Y", mesh_smooth_type="FACE", path_mode="COPY",
                         embed_textures=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f"{NAME}.blend"))
print("DONE")
