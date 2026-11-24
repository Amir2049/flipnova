"""Bake ambient occlusion onto the player's skin vertices (the skin has no UVs: it is coloured per vertex) and dump
it as JSON (glTF-space positions + occlusion) for tools/apply_skin_ao.py to multiply into the GLB's vertex colours.

  blender --background --factory-startup --python tools/blender/bake_skin_ao.py -- assets/player.glb skin_ao.json
"""
import json
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = argv[0], argv[1]

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
    if o.type == "MESH" and o is not body:
        o.hide_render = True
body.select_set(True)
bpy.context.view_layer.objects.active = body
me = body.data
attr = me.color_attributes.new("ao_bake", "FLOAT_COLOR", "POINT")
me.color_attributes.active_color = attr
sc.render.bake.target = "VERTEX_COLORS"
bpy.ops.object.bake(type="AO")
skin_slots = {i for i, s in enumerate(body.material_slots) if s.material and s.material.name == "skin"}
skin_verts = set()
for poly in me.polygons:
    if poly.material_index in skin_slots:
        skin_verts.update(poly.vertices)
out = []
for i in sorted(skin_verts):
    co = me.vertices[i].co
    ao = attr.data[i].color[0]
    out.append([round(co.x, 5), round(co.z, 5), round(-co.y, 5), round(ao, 4)])   # Blender -> glTF axes
json.dump(out, open(OUT, "w"))
print("skin vertices", len(out))
