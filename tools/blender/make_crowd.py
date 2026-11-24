"""Crowd sprites: real people for the stands, rendered in Blender from the game's own player model.

  blender --background --factory-startup --python tools/blender/make_crowd.py -- <player.glb> <out dir>
  python3 tools/blender/pack_crowd.py <out dir> assets/stadium/crowd_atlas.png

Renders N_FANS supporters (varied skin, hair, tops) in two states each: calm (standing) and cheering (the
celebration clip). Each is a transparent PNG of the person from the waist up (in a stand the row in front hides
the legs, and the player model's shorts and socks must not show), seen from the pitch. pack_crowd.py lays them out in one atlas: column = fan, row 0 calm, row 1 cheering.
The game draws the crowd as one MultiMesh of cards sampling that atlas (scripts/view/pitch_view.gd).
"""
import math
import os
import random
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
N_FANS = 16
W, H = 128, 192

SKIN = [(0.93, 0.76, 0.62), (0.82, 0.62, 0.47), (0.66, 0.45, 0.31), (0.48, 0.31, 0.2), (0.33, 0.21, 0.14)]
HAIR = [(0.03, 0.025, 0.02), (0.08, 0.05, 0.03), (0.2, 0.12, 0.06), (0.35, 0.3, 0.25)]
# clothes: mostly everyday dark / muted, some home red and away teal shirts, a few whites
CLOTHES = [(0.05, 0.05, 0.06), (0.09, 0.1, 0.13), (0.16, 0.17, 0.2), (0.25, 0.22, 0.18), (0.1, 0.16, 0.25),
           (0.5, 0.03, 0.06), (0.55, 0.05, 0.08), (0.03, 0.3, 0.38), (0.8, 0.8, 0.78), (0.3, 0.32, 0.28)]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 24
sc.render.film_transparent = True
sc.render.resolution_x = W
sc.render.resolution_y = H
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.view_settings.view_transform = "Standard"
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.6, 0.7, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
sc.world = world

bpy.ops.import_scene.gltf(filepath=GLB)
arm = next(o for o in sc.objects if o.type == "ARMATURE")
meshes = [o for o in sc.objects if o.type == "MESH"]
hairs = [o for o in meshes if o.name.startswith("Hair_")]

# light: a sun from the camera side, high
sun_data = bpy.data.lights.new("sun", "SUN")
sun_data.energy = 3.0
sun = bpy.data.objects.new("sun", sun_data)
sun.rotation_euler = (math.radians(50), 0, math.radians(20))
sc.collection.objects.link(sun)

# camera: in front of the fan (the model faces -y in Blender), a little below eye level, orthographic
cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 1.15        # frame height: waist (~0.75 m) to above the head (~1.9 m)
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (0, -6.0, 1.84)   # the imported model stands ~0.5 m above the origin
cam.rotation_euler = (math.radians(86), 0, 0)
sc.collection.objects.link(cam)
sc.camera = cam


def flat(mat_name, rgb):
    m = bpy.data.materials.get(mat_name)
    if not m or not m.use_nodes:
        return
    bs = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bs is None:
        return
    mix = next((n for n in m.node_tree.nodes if n.type == "MIX"), None)
    if mix is not None:
        # skin: base colour x vertex colours (brows, lips): change the base colour, keep the face details
        for inp in mix.inputs:
            if inp.type == "RGBA" and not inp.is_linked:
                inp.default_value = (*rgb, 1)
        return
    for l in list(bs.inputs["Base Color"].links):
        m.node_tree.links.remove(l)
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = 0.85


def pose(action_name, t):
    act = bpy.data.actions.get(action_name)
    if act is None:
        return False
    ad = arm.animation_data or arm.animation_data_create()
    ad.action = act
    if hasattr(ad, "action_slot") and getattr(act, "slots", None):
        ad.action_slot = act.slots[0]
    f0, f1 = act.frame_range
    sc.frame_set(int(f0 + (f1 - f0) * t))
    return True


rng = random.Random(7)
for i in range(N_FANS):
    flat("skin", rng.choice(SKIN))
    flat("kit", rng.choice(CLOTHES))
    flat("shoe", (0.08, 0.08, 0.09))
    flat("sole", (0.5, 0.5, 0.5))
    flat("hair", rng.choice(HAIR))
    keep = rng.choice(hairs) if hairs and rng.random() < 0.85 else None
    for h in hairs:
        h.hide_render = h is not keep
    arm.rotation_euler = (0, 0, math.radians(rng.uniform(-12, 12)))
    for state, (act, t) in enumerate([("idle", rng.uniform(0.1, 0.9)), (rng.choice(["celebrate", "celebrate2"]), rng.uniform(0.35, 0.6))]):
        if not pose(act, t):
            pose("idle", 0.5)
        sc.render.filepath = os.path.join(OUT, "fan_%02d_%d.png" % (i, state))
        bpy.ops.render.render(write_still=True)
print("rendered", N_FANS * 2, "fans into", OUT)
