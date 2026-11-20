"""Koshary Dragon (تنين الكشري) — stylized low-poly model for Roblox.

Run:  bl/bin/python models/koshary_dragon.py <outdir>
Writes KosharyDragon.fbx (import in Studio with the 3D Importer), KosharyDragon.blend and a preview render.
Units: 1 Blender unit = 1 Roblox stud (the model is about 6 studs tall).
"""
import math
import sys
import os
import random
import bpy
from mathutils import Vector

OUT = sys.argv[-1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, rgb, rough=0.5, emit=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    col = (*[((c / 255 + 0.055) / 1.055) ** 2.4 for c in rgb], 1)
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = col
        b.inputs["Emission Strength"].default_value = emit
    m.diffuse_color = col
    return m


GREEN = mat("DragonGreen", (64, 190, 96), 0.45)
BELLY = mat("Belly", (250, 226, 160), 0.6)
DARK = mat("EyeDark", (25, 20, 30), 0.2)
WHITE = mat("EyeWhite", (255, 255, 255), 0.3)
HORN = mat("Horn", (255, 214, 90), 0.35)
WING = mat("Wing", (40, 150, 80), 0.5)
BOWL = mat("Bowl", (196, 70, 40), 0.4)
BOWL_RIM = mat("BowlRim", (240, 200, 90), 0.3)
RICE = mat("Rice", (205, 160, 100), 0.8)
LENTIL = mat("Lentil", (110, 70, 40), 0.8)
PASTA = mat("Pasta", (245, 190, 90), 0.6)
SAUCE = mat("Sauce", (200, 40, 25), 0.35)
CHICK = mat("Chickpea", (225, 185, 110), 0.7)
ONION = mat("Onion", (150, 80, 30), 0.8)
FIRE = mat("Fire", (255, 120, 30), 0.3, emit=3.0)

parts = []


def finish(obj, material, subdiv=2, smooth=True):
    obj.data.materials.append(material)
    if subdiv:
        mod = obj.modifiers.new("Sub", "SUBSURF")
        mod.levels = subdiv
        mod.render_levels = subdiv
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    parts.append(obj)
    return obj


def blob(name, loc, scale, material, rot=(0, 0, 0), subdiv=0, seg=18, ring=10):
    """Ellipsoid whose full size is exactly `scale` (smooth, no subdivision needed)."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=loc, rotation=rot, segments=seg, ring_count=ring)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return finish(o, material, 0)


def front(center, dims, x, z, side=-1):
    """Y of the ellipsoid surface (front side=-1, back side=1) at the given x, z."""
    cx, cy, cz = center
    a, b, c = dims[0] / 2, dims[1] / 2, dims[2] / 2
    t = 1 - ((x - cx) / a) ** 2 - ((z - cz) / c) ** 2
    return cy + side * b * math.sqrt(max(t, 0))


def ball(name, loc, r, material, seg=12, ring=8, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return finish(o, material, 0)


def cone(name, loc, r1, r2, depth, material, rot=(0, 0, 0), verts=12, subdiv=1):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    return finish(o, material, subdiv)


# --- Body: a chubby chibi dragon sitting upright. Front faces -Y (Roblox front = -Z after export).
BODY_C, BODY_D = (0, 0, 1.75), (2.4, 2.1, 2.6)
HEAD_C, HEAD_D = (0, -0.25, 3.95), (2.3, 2.0, 1.85)
SNOUT_C, SNOUT_D = (0, -1.05, 3.62), (1.45, 0.95, 0.95)
blob("Body", BODY_C, BODY_D, GREEN)
blob("Belly", (0, -0.62, 1.6), (1.65, 1.0, 2.0), BELLY)
blob("Head", HEAD_C, HEAD_D, GREEN)
blob("Snout", SNOUT_C, SNOUT_D, BELLY)
for sx in (-1, 1):
    ball(f"Nostril{sx}", (0.26 * sx, front(SNOUT_C, SNOUT_D, 0.26, 3.82) + 0.03, 3.82), 0.08, DARK)
    # Big friendly eyes sitting on the face.
    ex, ez = 0.55 * sx, 4.3
    ey = front(HEAD_C, HEAD_D, ex, ez)
    ball(f"EyeWhite{sx}", (ex, ey + 0.08, ez), 0.36, WHITE, scale=(1, 0.55, 1.15))
    ball(f"Pupil{sx}", (ex - 0.03 * sx, ey - 0.08, ez - 0.04), 0.2, DARK, scale=(1, 0.45, 1.25))
    ball(f"Shine{sx}", (ex - 0.1 * sx + 0.06, ey - 0.15, ez + 0.1), 0.065, WHITE)
    # Cheeks.
    ball(f"Cheek{sx}", (0.85 * sx, front(HEAD_C, HEAD_D, 0.85, 3.75) + 0.05, 3.75), 0.2, mat("Cheek", (255, 140, 140), 0.6), scale=(1, 0.4, 0.7))
    # Golden horns.
    cone(f"Horn{sx}", (0.6 * sx, -0.05, 4.95), 0.25, 0.04, 0.9, HORN, rot=(math.radians(-22), math.radians(20 * sx), 0))
    # Ears/frills.
    blob(f"Frill{sx}", (1.15 * sx, 0.1, 4.15), (0.35, 0.6, 0.9), WING, rot=(0, math.radians(-25 * sx), 0))
    # Arms hugging the bowl, feet planted.
    blob(f"Arm{sx}", (1.0 * sx, -0.85, 2.0), (0.6, 1.3, 0.6), GREEN, rot=(math.radians(20), 0, math.radians(-25 * sx)))
    blob(f"Foot{sx}", (0.72 * sx, -0.55, 0.32), (0.85, 1.2, 0.64), GREEN)
    for t in (-1, 0, 1):
        cone(f"Claw{sx}{t}", (0.72 * sx + 0.24 * t, -1.18, 0.22), 0.1, 0.0, 0.28, HORN, rot=(math.radians(90), 0, 0), verts=6, subdiv=0)
    # Wings: thin rounded slabs from the shoulders.
    blob(f"Wing{sx}", (1.35 * sx, 0.95, 2.85), (1.7, 0.16, 1.25), WING,
         rot=(math.radians(10), math.radians(-30 * sx), math.radians(28 * sx)))
    blob(f"WingBone{sx}", (1.35 * sx, 0.9, 3.35), (1.7, 0.2, 0.22), HORN,
         rot=(math.radians(10), math.radians(-30 * sx), math.radians(28 * sx)))

# Back spikes along the spine (on the surface of the head and body).
for i, z in enumerate((4.6, 4.15)):
    y = front(HEAD_C, HEAD_D, 0, z, side=1)
    cone(f"HeadSpike{i}", (0, y, z), 0.2, 0.02, 0.5, HORN, rot=(math.radians(-70), 0, 0), verts=8, subdiv=0)
for i, z in enumerate((2.6, 2.0, 1.4)):
    y = front(BODY_C, BODY_D, 0, z, side=1)
    cone(f"Spike{i}", (0, y, z), 0.24, 0.02, 0.55, HORN, rot=(math.radians(-90), 0, 0), verts=8, subdiv=0)
blob("Tail", (0, 1.55, 0.5), (0.75, 1.9, 0.6), GREEN, rot=(math.radians(-12), 0, 0))
cone("TailTip", (0, 2.6, 0.72), 0.35, 0.0, 0.7, HORN, rot=(math.radians(-80), 0, 0), verts=8, subdiv=0)

# --- The koshary bowl the dragon hugs (its signature item).
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=1.05, depth=0.75, location=(0, -1.45, 1.45))
bowl = bpy.context.object
bowl.name = "Bowl"
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.object.mode_set(mode="OBJECT")
for v in bowl.data.vertices:
    if v.co.z < 0:
        v.co.x *= 0.68
        v.co.y *= 0.68
finish(bowl, BOWL, subdiv=1)
bpy.ops.mesh.primitive_torus_add(major_radius=1.05, minor_radius=0.09, location=(0, -1.45, 1.83))
finish(bpy.context.object, BOWL_RIM, subdiv=0)
bpy.context.object.name = "BowlRim"
# Rice + lentil mound, then elbow pasta, chickpeas, tomato sauce and crispy onions on top.
ball("RiceMound", (0, -1.45, 1.86), 0.98, RICE, seg=20, ring=10, scale=(1, 1, 0.38))
for i in range(14):
    a = random.uniform(0, 2 * math.pi)
    d = random.uniform(0.1, 0.75)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.05, major_segments=8, minor_segments=5,
                                     location=(math.cos(a) * d, -1.5 + math.sin(a) * d, 2.05 + 0.12 * (1 - d)),
                                     rotation=(random.uniform(0, 3), random.uniform(0, 3), 0))
    o = bpy.context.object
    o.name = f"Pasta{i}"
    finish(o, PASTA, subdiv=0)
ball("Sauce", (0.05, -1.5, 2.2), 0.45, SAUCE, seg=16, ring=8, scale=(1, 1, 0.3))
for i in range(9):
    a = random.uniform(0, 2 * math.pi)
    d = random.uniform(0.2, 0.8)
    ball(f"Chickpea{i}", (math.cos(a) * d, -1.5 + math.sin(a) * d, 2.12), 0.09, CHICK, seg=8, ring=6)
for i in range(16):
    a = random.uniform(0, 2 * math.pi)
    d = random.uniform(0, 0.45)
    blob(f"Onion{i}", (math.cos(a) * d, -1.55 + math.sin(a) * d, 2.33), (0.18, 0.06, 0.04), ONION,
         rot=(0, 0, random.uniform(0, 3)), seg=6, ring=4)

for i in range(18):
    a = random.uniform(0, 2 * math.pi)
    d = random.uniform(0.3, 0.9)
    ball(f"Lentil{i}", (math.cos(a) * d, -1.45 + math.sin(a) * d, 1.86 + 0.37 * math.sqrt(max(0, 1 - (d / 0.98) ** 2))), 0.06, LENTIL, seg=6, ring=4)

# --- Join every part into one mesh per material (fewer MeshParts in Roblox), apply modifiers.
bpy.ops.object.select_all(action="DESELECT")
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.convert(target="MESH")
bpy.ops.object.join()
dragon = bpy.context.object
dragon.name = "KosharyDragon"
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
tris = sum(len(p.vertices) - 2 for p in dragon.data.polygons)
print("TRIANGLES", tris)
assert tris <= 20000, "Roblox MeshPart limit is 20,000 triangles"

# --- Preview render (Cycles CPU, works headless).
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
ground = bpy.context.object
ground.data.materials.append(mat("Ground", (255, 214, 120), 0.9))
world = bpy.data.worlds.new("W")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.62, 1.0, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(50), math.radians(10), math.radians(-35)))
bpy.context.object.data.energy = 3.5
bpy.context.object.data.angle = math.radians(8)
bpy.ops.object.camera_add(location=(7.5, -12.5, 5.5))
cam = bpy.context.object
direction = Vector((0, -0.6, 2.6)) - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 55
scene.camera = cam
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.view_settings.view_transform = "Standard"
scene.render.filepath = os.path.join(OUT, "KosharyDragon_preview.png")
bpy.ops.render.render(write_still=True)

# --- Export for Roblox: only the dragon, Y-forward / Z-up converted to Roblox's -Z forward / Y up.
bpy.ops.object.select_all(action="DESELECT")
dragon.select_set(True)
bpy.context.view_layer.objects.active = dragon
bpy.ops.export_scene.fbx(filepath=os.path.join(OUT, "KosharyDragon.fbx"), use_selection=True,
                         apply_unit_scale=True, global_scale=1.0, axis_forward="-Z", axis_up="Y",
                         mesh_smooth_type="FACE", use_mesh_modifiers=True, path_mode="COPY", embed_textures=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "KosharyDragon.blend"))
print("DONE")
