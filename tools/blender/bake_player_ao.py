"""Bake the player's ambient occlusion (folds, armpits, neck, hems, body creases) into textures, in Blender.

  blender --background --factory-startup --python tools/blender/bake_player_ao.py -- assets/player.glb assets/

Writes player_kit_ao.png (in the kit's UV layout, which KitPainter paints into) and player_skin_ao.png (in the
skin's UV layout). The game multiplies them into the kit colours and the skin tone: the player reads as a solid,
lit shape instead of flat paint, at no cost on the phone (the shading is in the texture).
"""
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = argv[0], argv[1]
SIZE = 512

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 64
w = bpy.data.worlds.new("w")
w.use_nodes = True
sc.world = w
bpy.ops.import_scene.gltf(filepath=GLB)
body = next(o for o in sc.objects if o.type == "MESH" and o.name.startswith("Body"))
for o in sc.objects:
    o.select_set(False)
body.select_set(True)
bpy.context.view_layer.objects.active = body
# the other meshes (hair styles) would shade the scalp; keep them out of the bake
for o in sc.objects:
    if o.type == "MESH" and o is not body:
        o.hide_render = True

images = {}
for slot in body.material_slots:
    m = slot.material
    if m is None or m.name not in ("kit", "skin"):
        continue
    img = bpy.data.images.new("player_%s_ao" % m.name, SIZE, SIZE)
    img.generated_color = (1, 1, 1, 1)
    node = m.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = img
    m.node_tree.nodes.active = node
    images[m.name] = img
# every other material must not receive the bake: give them an inactive dummy target
dummy = bpy.data.images.new("dummy", 8, 8)
for slot in body.material_slots:
    m = slot.material
    if m and m.name not in images and m.use_nodes:
        n = m.node_tree.nodes.new("ShaderNodeTexImage")
        n.image = dummy
        m.node_tree.nodes.active = n

sc.render.bake.margin = 6
bpy.ops.object.bake(type="AO")
for name, img in images.items():
    path = os.path.join(OUT, "player_%s_ao.png" % name)
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    print("wrote", path)
