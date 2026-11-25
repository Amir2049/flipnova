"""Key art for the menus: the stadium on a derby night, seen from the grass, rendered in Blender (Cycles).

  blender --background --factory-startup --python tools/blender/make_key_art.py -- <assets dir> <out.png> [W H samples]
  python3 tools/key_art_post.py <out.png> assets/menu_key_art.jpg       (bloom, painterly finish, grade)

The picture: a ball on the centre circle in the foreground, the far stand full under four floodlight towers whose
beams cut through the haze, the night sky above. Built from the game's own pieces (assets/stadium/*.glb, the crowd
atlas, the grass texture), so the menus show the stadium the matches are played in.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
ASSETS, OUT = argv[0], argv[1]
W = int(argv[2]) if len(argv) > 2 else 1920
H = int(argv[3]) if len(argv) > 3 else 1080
SAMPLES = int(argv[4]) if len(argv) > 4 else 96
rng = random.Random(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
sc.cycles.volume_bounces = 0
sc.cycles.volume_step_rate = 4.0
sc.render.resolution_x = W
sc.render.resolution_y = H
sc.render.image_settings.file_format = "PNG"
sc.view_settings.view_transform = "AgX"
sc.view_settings.exposure = -0.6


def mat(name, color=(0.5, 0.5, 0.5, 1), rough=0.8, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = strength
    return m


# ---------------------------------------------------------------- sky and haze
world = bpy.data.worlds.new("night")
world.use_nodes = True
sc.world = world
nt = world.node_tree
bg = nt.nodes["Background"]
grad = nt.nodes.new("ShaderNodeTexGradient")
grad.gradient_type = "LINEAR"
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeValToRGB")
nt.links.new(tc.outputs["Generated"], sep.inputs[0])
nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
ramp.color_ramp.elements[0].position = 0.5
ramp.color_ramp.elements[0].color = (0.03, 0.035, 0.09, 1)   # the glow over the city at the horizon
ramp.color_ramp.elements[1].position = 0.75
ramp.color_ramp.elements[1].color = (0.004, 0.006, 0.02, 1)
nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 1.0
# haze: the floodlight beams show in it
vol = nt.nodes.new("ShaderNodeVolumePrincipled")
vol.inputs["Density"].default_value = 0.00045
vol.inputs["Anisotropy"].default_value = 0.55
vol.inputs["Color"].default_value = (0.8, 0.85, 1.0, 1)
nt.links.new(vol.outputs[0], nt.nodes["World Output"].inputs["Volume"])

# ---------------------------------------------------------------- the pitch
bpy.ops.mesh.primitive_plane_add(size=1)
pitch = bpy.context.object
pitch.scale = (150, 120, 1)
grass = bpy.data.materials.new("grass")
grass.use_nodes = True
gn = grass.node_tree
gb = gn.nodes["Principled BSDF"]
gb.inputs["Roughness"].default_value = 0.9
tex = gn.nodes.new("ShaderNodeTexImage")
gimg = os.path.join(ASSETS, "textures", "grass_color.jpg")
if os.path.exists(gimg):
    tex.image = bpy.data.images.load(gimg)
coord = gn.nodes.new("ShaderNodeTexCoord")
mapn = gn.nodes.new("ShaderNodeMapping")
mapn.inputs["Scale"].default_value = (0.5, 0.5, 0.5)
gn.links.new(coord.outputs["Object"], mapn.inputs["Vector"])
gn.links.new(mapn.outputs["Vector"], tex.inputs["Vector"])
# mowing stripes across the pitch (every 5.25 m along x)
sx = gn.nodes.new("ShaderNodeSeparateXYZ")
gn.links.new(coord.outputs["Object"], sx.inputs[0])
stripe = gn.nodes.new("ShaderNodeMath")
stripe.operation = "PINGPONG"
mul = gn.nodes.new("ShaderNodeMath")
mul.operation = "MULTIPLY"
mul.inputs[1].default_value = 150.0 / 10.5
gn.links.new(sx.outputs["X"], mul.inputs[0])
gn.links.new(mul.outputs[0], stripe.inputs[0])
stripe.inputs[1].default_value = 0.5
snap = gn.nodes.new("ShaderNodeMath")
snap.operation = "GREATER_THAN"
snap.inputs[1].default_value = 0.25
gn.links.new(stripe.outputs[0], snap.inputs[0])
mix = gn.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.blend_type = "MULTIPLY"
gn.links.new(snap.outputs[0], mix.inputs["Factor"])
gn.links.new(tex.outputs["Color"], mix.inputs[6])
mix.inputs[7].default_value = (0.72, 0.78, 0.72, 1)
tint = gn.nodes.new("ShaderNodeMix")
tint.data_type = "RGBA"
tint.blend_type = "MULTIPLY"
tint.inputs["Factor"].default_value = 1.0
gn.links.new(mix.outputs[2], tint.inputs[6])
tint.inputs[7].default_value = (0.55, 0.85, 0.55, 1)
gn.links.new(tint.outputs[2], gb.inputs["Base Color"])
bump = gn.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.35
gn.links.new(tex.outputs["Color"], bump.inputs["Height"])
gn.links.new(bump.outputs["Normal"], gb.inputs["Normal"])
pitch.data.materials.append(grass)

chalk = mat("chalk", (0.85, 0.87, 0.85, 1), 0.7)


def strip(x0, y0, x1, y1, w=0.12):
    d = Vector((x1 - x0, y1 - y0, 0))
    n = Vector((-d.y, d.x, 0)).normalized() * w * 0.5
    me = bpy.data.meshes.new("line")
    me.from_pydata([(x0 + n.x, y0 + n.y, 0.004), (x1 + n.x, y1 + n.y, 0.004), (x1 - n.x, y1 - n.y, 0.004), (x0 - n.x, y0 - n.y, 0.004)], [], [(0, 1, 2, 3)])
    ob = bpy.data.objects.new("line", me)
    ob.data.materials.append(chalk)
    sc.collection.objects.link(ob)


def ring(cx, cy, r, w=0.12, a0=0.0, a1=math.tau, n=160):
    me = bpy.data.meshes.new("ring")
    bm = bmesh.new()
    vs = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        vs.append((bm.verts.new((cx + math.cos(a) * (r - w / 2), cy + math.sin(a) * (r - w / 2), 0.004)),
                   bm.verts.new((cx + math.cos(a) * (r + w / 2), cy + math.sin(a) * (r + w / 2), 0.004))))
    for i in range(n):
        bm.faces.new((vs[i][0], vs[i][1], vs[i + 1][1], vs[i + 1][0]))
    bm.to_mesh(me)
    ob = bpy.data.objects.new("ring", me)
    ob.data.materials.append(chalk)
    sc.collection.objects.link(ob)


L, Wd = 52.5, 34.0
strip(0, -Wd, 0, Wd)
strip(-L, Wd, L, Wd)
strip(-L, -Wd, L, -Wd)
strip(-L, -Wd, -L, Wd)
strip(L, -Wd, L, Wd)
ring(0, 0, 9.15)
ring(0, 0, 0.18, 0.36)
for sgn in (-1, 1):
    x = sgn * L
    strip(x, -20.16, x - sgn * 16.5, -20.16)
    strip(x, 20.16, x - sgn * 16.5, 20.16)
    strip(x - sgn * 16.5, -20.16, x - sgn * 16.5, 20.16)
    strip(x, -9.16, x - sgn * 5.5, -9.16)
    strip(x, 9.16, x - sgn * 5.5, 9.16)
    strip(x - sgn * 5.5, -9.16, x - sgn * 5.5, 9.16)

# ---------------------------------------------------------------- the ball
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=48, ring_count=24, location=(-6.95, -6.0, 0.11))
ball = bpy.context.object
bpy.ops.object.shade_smooth()
bm_ = bpy.data.materials.new("ball")
bm_.use_nodes = True
bn = bm_.node_tree
bb = bn.nodes["Principled BSDF"]
bb.inputs["Roughness"].default_value = 0.35
vor = bn.nodes.new("ShaderNodeTexVoronoi")
vor.feature = "DISTANCE_TO_EDGE"
vor.inputs["Scale"].default_value = 3.2
bco = bn.nodes.new("ShaderNodeTexCoord")
bn.links.new(bco.outputs["Object"], vor.inputs["Vector"])
vr = bn.nodes.new("ShaderNodeValToRGB")
vr.color_ramp.elements[0].position = 0.03
vr.color_ramp.elements[0].color = (0.02, 0.02, 0.03, 1)
vr.color_ramp.elements[1].position = 0.06
vr.color_ramp.elements[1].color = (0.9, 0.9, 0.9, 1)
bn.links.new(vor.outputs["Distance"], vr.inputs["Fac"])
cell = bn.nodes.new("ShaderNodeValToRGB")
bn.links.new(vor.outputs["Distance"], cell.inputs["Fac"])
bn.links.new(vr.outputs["Color"], bb.inputs["Base Color"])
ball.data.materials.append(bm_)
ball.rotation_euler = (0.4, 0.2, 0.9)

# ---------------------------------------------------------------- stands, crowd, towers
def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    return roots, new


stand_path = os.path.join(ASSETS, "stadium", "stand_section.glb")
roots, objs = import_glb(stand_path)
proto = bpy.data.objects.new("stand_proto", None)
sc.collection.objects.link(proto)
for r in roots:
    r.parent = proto
# the stand pieces: one collection instanced along each side
coll = bpy.data.collections.new("stand")
for o in objs:
    for c in o.users_collection:
        c.objects.unlink(o)
    coll.objects.link(o)
proto_c = proto
sc.collection.objects.unlink(proto)
coll.objects.link(proto)

atlas = bpy.data.images.load(os.path.join(ASSETS, "stadium", "crowd_atlas.png"))
crowd_m = bpy.data.materials.new("crowd")
crowd_m.use_nodes = True
cn = crowd_m.node_tree
cb = cn.nodes["Principled BSDF"]
cb.inputs["Roughness"].default_value = 0.9
ct = cn.nodes.new("ShaderNodeTexImage")
ct.image = atlas
ct.interpolation = "Linear"
cuv = cn.nodes.new("ShaderNodeUVMap")
cn.links.new(cuv.outputs["UV"], ct.inputs["Vector"])
cn.links.new(ct.outputs["Color"], cb.inputs["Base Color"])
cn.links.new(ct.outputs["Alpha"], cb.inputs["Alpha"])

ROWS, TREAD, RISE, BASE = 26, 0.85, 0.55, 1.3


def crowd_rows(seclen=12.0):
    """One stand section's fans: a card strip standing on every row (calm or cheering, random start in the atlas)."""
    me = bpy.data.meshes.new("crowd")
    verts, faces, uvs = [], [], []
    for r in range(ROWS):
        if rng.random() < 0.06:
            continue
        y = -(r + 0.55) * TREAD          # Blender: away from the pitch is -y in the section's frame
        z = BASE + r * RISE + 0.05
        state = 1 if rng.random() < 0.35 else 0
        u0 = rng.random()
        # two staggered strips a row (the cards have air round each fan): a packed stand, ~0.45 m a person
        for layer in range(2):
            reps = seclen / 0.9 / 16.0
            yy = y + layer * 0.18
            zz = z - layer * 0.06
            uu = u0 + layer * 0.37
            i = len(verts)
            verts += [(-seclen / 2, yy, zz), (seclen / 2, yy, zz), (seclen / 2, yy, zz + 1.05), (-seclen / 2, yy, zz + 1.05)]
            faces.append((i, i + 1, i + 2, i + 3))
            st = state if layer == 0 else (1 if rng.random() < 0.35 else 0)
            v0 = 0.5 if st == 0 else 0.0
            v1 = v0 + 0.5
            uvs += [(uu, v0), (uu + reps, v0), (uu + reps, v1), (uu, v1)]
    me.from_pydata(verts, [], faces)
    uvl = me.uv_layers.new()
    for li, loop in enumerate(me.loops):
        uvl.data[li].uv = uvs[loop.vertex_index]
    ob = bpy.data.objects.new("crowd", me)
    ob.data.materials.append(crowd_m)
    return ob


ct.extension = "REPEAT"
SIDES = [  # (centre of the stand front, facing angle about z: the section's -y must point away from the pitch)
    ((0.0, Wd + 7.0), 0.0, 11),          # far side: away is +y
    ((L + 9.0, 0.0), math.pi / 2, 7),    # right end
    ((-L - 9.0, 0.0), -math.pi / 2, 7),  # left end
]
for (cx, cy), ang, n in SIDES:
    for k in range(n):
        off = (k - (n - 1) / 2) * 12.0
        # section frame: x along the stand, -y away from the pitch; rotate so that -y points away from the centre
        rot = ang + math.pi
        px = cx + math.cos(ang) * off
        py = cy + math.sin(ang) * off
        inst = bpy.data.objects.new("stand", None)
        inst.instance_type = "COLLECTION"
        inst.instance_collection = coll
        inst.location = (px, py, 0)
        inst.rotation_euler = (0, 0, rot)
        sc.collection.objects.link(inst)
        cr = crowd_rows()
        cr.location = (px, py, 0)
        cr.rotation_euler = (0, 0, rot)
        sc.collection.objects.link(cr)

# floodlight towers at the corners, lamp heads aimed at the centre, a strong spot in each
tower_path = os.path.join(ASSETS, "stadium", "floodlight.glb")
t_roots, t_objs = import_glb(tower_path)
tcoll = bpy.data.collections.new("tower")
for o in t_objs:
    for c in o.users_collection:
        c.objects.unlink(o)
    tcoll.objects.link(o)
for o in t_objs:
    for slot in getattr(o, "material_slots", []):
        m = slot.material
        if m and m.use_nodes:
            b = m.node_tree.nodes.get("Principled BSDF")
            if b and b.inputs["Emission Strength"].default_value > 0.0:
                b.inputs["Emission Strength"].default_value = 60.0
                b.inputs["Emission Color"].default_value = (1.0, 0.95, 0.85, 1)
for tx, ty in [(-64, 50), (64, 50), (-64, -50), (64, -50)]:
    inst = bpy.data.objects.new("tower", None)
    inst.instance_type = "COLLECTION"
    inst.instance_collection = tcoll
    inst.location = (tx, ty, 0)
    # the head faces the tower's -y (glTF -z): turn it to the centre spot
    inst.rotation_euler = (0, 0, math.atan2(-tx, ty) + math.pi)
    sc.collection.objects.link(inst)
    sp = bpy.data.lights.new("flood", "SPOT")
    sp.energy = 7.0e5
    sp.color = (1.0, 0.95, 0.86)
    sp.spot_size = math.radians(48)
    sp.spot_blend = 0.6
    sp.shadow_soft_size = 3.0
    so = bpy.data.objects.new("flood", sp)
    so.location = (tx * 0.97, ty * 0.97, 44.0)
    d = Vector((0, 0, 0)) - Vector(so.location)
    so.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(so)

# the lights under the roofs: the crowd lit warm against the night
for x in (-40.0, 0.0, 40.0):
    al = bpy.data.lights.new("roof", "AREA")
    al.shape = "RECTANGLE"
    al.size = 36.0
    al.size_y = 3.0
    al.energy = 30000.0
    al.color = (1.0, 0.86, 0.66)
    ao = bpy.data.objects.new("roof", al)
    ao.location = (x, Wd + 3.0, 24.0)
    ao.rotation_euler = (math.radians(58), 0, 0)    # from over the touchline back into the stand
    sc.collection.objects.link(ao)

# a cool moonlight so the dark sides of the stands keep their shape
moon = bpy.data.lights.new("moon", "SUN")
moon.energy = 0.25
moon.color = (0.55, 0.65, 1.0)
mo = bpy.data.objects.new("moon", moon)
mo.rotation_euler = (math.radians(55), 0, math.radians(200))
sc.collection.objects.link(mo)

# ---------------------------------------------------------------- camera: on the grass, the ball sharp, the stand soft
cam_d = bpy.data.cameras.new("cam")
cam_d.lens = 22
cam_d.dof.use_dof = True
cam_d.dof.aperture_fstop = 2.2
cam = bpy.data.objects.new("cam", cam_d)
cam.location = (-7.6, -8.6, 0.42)
look = Vector((4.0, 40.0, 11.0))
cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.collection.objects.link(cam)
sc.camera = cam
cam_d.dof.focus_distance = (Vector(ball.location) - cam.location).length

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("wrote", OUT)
