"""Brainrot Heist store art: 3 thumbnails (1920x1080) and the icon (512x512), rendered from the real game models.

Run:  python make_thumbnails.py <models_dir> <outdir>
<models_dir> holds the <Name>.blend files made by realistic/creatures_*.py.
Text is drawn afterwards with Pillow using the OFL fonts in ./fonts.
"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "realistic"))
import brainrot_lib as L  # noqa: E402
from brainrot_lib import Meta, ball, cyl, mat  # noqa: E402
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

MODELS, OUT = sys.argv[-2], sys.argv[-1]
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(HERE, "fonts", "TitanOne-Regular.ttf")
FONT2 = os.path.join(HERE, "fonts", "LilitaOne-Regular.ttf")


# ---------------------------------------------------------------- scene pieces
def creature(name, loc, yaw=0.0, scale=1.0):
    path = os.path.join(MODELS, f"{name}.blend")
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = [name]
    o = dst.objects[0]
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (0, 0, math.radians(yaw))
    o.scale = (scale, scale, scale)
    return o


def desert(sky_low=(255, 170, 90), sky_high=(70, 110, 220)):
    sand = mat("Sand", (240, 200, 130), (215, 165, 95), rough=0.9, scale=0.6, bump=0.15)
    bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 60, 0))
    g = bpy.context.object
    sub = g.modifiers.new("Sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 6
    d = g.modifiers.new("Dunes", "DISPLACE")
    t = bpy.data.textures.new("Dunes", "CLOUDS")
    t.noise_scale = 18
    d.texture = t
    d.strength = 2.5
    g.data.materials.append(sand)
    # Sky dome: emissive gradient from warm horizon to blue top.
    bpy.ops.mesh.primitive_uv_sphere_add(radius=300, location=(0, 0, 0), segments=48, ring_count=24)
    sky = bpy.context.object
    m = bpy.data.materials.new("Sky")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.0
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mapr = nt.nodes.new("ShaderNodeMapRange")
    mapr.inputs["From Min"].default_value = -10
    mapr.inputs["From Max"].default_value = 160
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = L.lin(sky_low)
    ramp.color_ramp.elements[1].color = L.lin(sky_high)
    nt.links.new(geo.outputs["Position"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], mapr.inputs["Value"])
    nt.links.new(mapr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    sky.data.materials.append(m)
    sky.visible_shadow = False
    world = bpy.data.worlds.new("W")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = L.lin((200, 170, 150))
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.6


def pyramid(loc, size, color=(235, 190, 115)):
    stone = mat(f"Pyramid{color}", color, [c * 0.82 for c in color], rough=0.85, scale=1.5, bump=0.3)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=size, radius2=0, depth=size * 0.95, location=(loc[0], loc[1], size * 0.47),
                                    rotation=(0, 0, math.radians(45)))
    bpy.context.object.data.materials.append(stone)


def sun(angle_x=62, angle_z=-35, energy=3.5, color=(255, 225, 180)):
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(angle_x), 0, math.radians(angle_z)))
    s = bpy.context.object.data
    s.energy = energy
    s.color = L.lin(color)[:3]
    s.angle = math.radians(3)


def sarcophagus(loc, yaw=0):
    gold = mat("SarcGold", (255, 200, 60), (215, 150, 30), rough=0.25, scale=3, bump=0.1, coat=0.8)
    blue = mat("SarcBlue", (35, 90, 210), rough=0.3, bump=0.02)
    glow = mat("TreasureGlow", (255, 230, 140), rough=0.3, bump=0, emit=6.0)
    x, y, z = loc
    parts = []
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + 0.8))
    box = bpy.context.object
    box.scale = (2.6, 4.6, 1.6)
    box.modifiers.new("B", "BEVEL").width = 0.25
    box.data.materials.append(gold)
    parts.append(box)
    for k in range(4):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y - 1.6 + 1.05 * k, z + 0.8))
        o = bpy.context.object
        o.scale = (2.65, 0.18, 1.62)
        o.data.materials.append(blue)
        parts.append(o)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + 1.62))
    o = bpy.context.object
    o.scale = (2.2, 4.1, 0.05)
    o.data.materials.append(glow)
    parts.append(o)
    # Lid knocked off, leaning on the side.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x + 2.3, y + 0.3, z + 0.9), rotation=(0, math.radians(62), math.radians(8)))
    lid = bpy.context.object
    lid.scale = (2.7, 4.7, 0.35)
    lid.modifiers.new("B", "BEVEL").width = 0.12
    lid.data.materials.append(gold)
    parts.append(lid)
    # Light pouring out of the open sarcophagus.
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=1.4, radius2=3.5, depth=9, location=(x, y, z + 6.0))
    beam = bpy.context.object
    bm = bpy.data.materials.new("Beam")
    bm.use_nodes = True
    nt = bm.node_tree
    nt.nodes.clear()
    o_ = nt.nodes.new("ShaderNodeOutputMaterial")
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.22
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = L.lin((255, 230, 150))
    em.inputs["Strength"].default_value = 3
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], o_.inputs["Surface"])
    beam.data.materials.append(bm)
    beam.visible_shadow = False
    for p in parts:
        p.rotation_euler.z += math.radians(yaw)


def mummy(loc, yaw=0, s=1.0):
    wrap = mat("Bandage", (235, 225, 195), (175, 160, 125), rough=0.9, scale=14, bump=0.45, kind="scales")
    eye = mat("MummyEye", (255, 60, 40), rough=0.3, bump=0, emit=6.0)
    L.objs.clear()
    m = Meta("Mummy")
    m.el((0, 0, 3.0), 2.0, size=(0.7, 0.5, 1.0))
    m.el((0, -0.1, 4.6), 1.3, size=(0.8, 0.8, 0.9))
    for sx in (-1, 1):
        m.curve((0.75 * sx, -0.1, 3.7), (0.8 * sx, -1.4, 3.8), (0.7 * sx, -2.4, 3.7), 9, 0.45, 0.38)
        m.curve((0.4 * sx, 0, 2.0), (0.45 * sx, -0.2, 1.0), (0.45 * sx, -0.5, 0.3), 7, 0.5, 0.45)
    body = m.mesh(wrap)
    for sx in (-1, 1):
        p, n = L.surf(body, (0.3 * sx, -6, 4.75), (0, 1, 0), 0.02)
        ball(p, 0.13, eye, scale=(1.3, 0.6, 0.7))
    # Loose bandage ends flapping.
    for k in range(3):
        ball((0.6 - 0.5 * k, 0.55, 3.8 - 0.6 * k), 0.5, wrap, scale=(0.5, 0.05, 0.15), rot=(0.3, 0.4 * k, 0.6))
    objs = list(L.objs)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    mo = bpy.context.object
    mo.location = loc
    mo.rotation_euler = (0, 0, math.radians(yaw))
    mo.scale = (s, s, s)
    L.objs.clear()
    return mo


def coins(center, n, spread, seed=1):
    gold = mat("Coin", (255, 205, 60), (220, 160, 30), rough=0.25, bump=0.02, coat=0.8)
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = center[0] + rnd.uniform(-spread, spread), center[1] + rnd.uniform(-spread * 0.6, spread * 0.6)
        cyl((x, y, 0.08 + rnd.uniform(0, 0.25)), 0.32, 0.09, gold, rot=(rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), 0), verts=18)
    L.objs.clear()


def camera(loc, target, lens=35):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
    bpy.context.scene.camera = cam


def render(path, w, h, samples=48):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------- text overlay (Pillow)
def caption(path, lines):
    """lines: list of (text, font, size, fill, (x, y) as fraction or 'center', anchor)."""
    from PIL import Image, ImageDraw, ImageFont
    im = Image.open(path).convert("RGB")
    d = ImageDraw.Draw(im)
    W, H = im.size
    for text, font, size, fill, (fx, fy), anchor in lines:
        f = ImageFont.truetype(font, size)
        stroke = max(4, size // 9)
        # soft drop shadow, then thick outline, then fill
        d.text((fx * W + stroke * 0.6, fy * H + stroke * 0.9), text, font=f, fill=(20, 10, 40), anchor=anchor,
               stroke_width=stroke, stroke_fill=(20, 10, 40))
        d.text((fx * W, fy * H), text, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(30, 15, 50))
    im.save(path)


# ---------------------------------------------------------------- shots
def thumb_tomb():
    L.reset()
    desert()
    sun()
    pyramid((-38, 120), 55)
    pyramid((30, 160), 40, (225, 180, 105))
    pyramid((75, 110), 22, (230, 185, 110))
    sarcophagus((0.5, 7.5, 0))
    creature("KosharyDragon", (-0.5, -0.5, 0), yaw=12, scale=1.1)
    mummy((8.2, -1.0, 0), yaw=-62, s=1.05)
    creature("PharaohFalafel", (-8.0, -1.5, 0), yaw=25, scale=1.0)
    coins((0, -4.5), 26, 6.5, seed=3)
    camera((2.0, -21.0, 5.2), (0.5, 0, 3.4), lens=32)
    p = os.path.join(OUT, "thumbnail_1_tomb_raid.png")
    render(p, 1920, 1080)
    caption(p, [("BRAINROT HEIST", FONT, 150, (255, 214, 60), (0.5, 0.11), "mm"),
                ("TOMB RAID!", FONT, 110, (255, 255, 255), (0.5, 0.86), "mm"),
                ("NEW", FONT2, 90, (255, 70, 70), (0.08, 0.27), "mm")])


def thumb_egyptian():
    L.reset()
    desert((255, 150, 80), (60, 70, 170))
    sun(62, -20, 4.5, (255, 215, 170))
    pyramid((0, 140), 70)
    names = ["MolokhiaKraken", "AstroSphinx", "KosharyDragon", "NilePhoenix", "ShawarmaSultan",
             "FulMoon", "BasbousaCat", "PharaohFalafel"]
    spots = [((i - 3.5) * 7.0, 3.0 - 0.25 * ((i - 3.5) * 1.6) ** 2, -(i - 3.5) * 8) for i in range(8)]
    for n, (x, y, yaw) in zip(names, spots):
        creature(n, (x, y, 0), yaw=yaw)
    camera((0, -33, 9), (0, 2, 2.6), lens=32)
    p = os.path.join(OUT, "thumbnail_2_egyptian_brainrots.png")
    render(p, 1920, 1080)
    caption(p, [("EGYPTIAN BRAINROTS", FONT, 120, (255, 214, 60), (0.5, 0.1), "mm"),
                ("STEAL THEM ALL!", FONT, 96, (255, 255, 255), (0.5, 0.9), "mm")])


def thumb_all20():
    L.reset()
    desert((150, 210, 255), (70, 120, 230))
    sun(52, -30, 4.5)
    names = ["BananaRocket", "ToastPenguin", "CactusDJ", "DiscoDumpling", "CosmicKettle", "TurboTurtle", "MoonMango",
             "RoyalNoodle", "PizzaShark", "ThunderSloth", "CrystalCroissant", "GalaxyJellyfish",
             "PharaohFalafel", "MolokhiaKraken", "NilePhoenix", "AstroSphinx", "FulMoon", "BasbousaCat",
             "ShawarmaSultan", "KosharyDragon"]
    rows = [names[0:10], names[10:20]]
    for r, row in enumerate(rows):
        y = 9 - 10 * r
        for i, n in enumerate(row):
            x = (i - (len(row) - 1) / 2) * (6.6 if r == 0 else 7.2) + (1.5 if r == 1 else 0)
            creature(n, (x, y, 0), yaw=-x * 1.2, scale=1.0)
    camera((0, -34, 12), (0, 3, 2.0), lens=27)
    p = os.path.join(OUT, "thumbnail_3_collect_all_20.png")
    render(p, 1920, 1080)
    caption(p, [("COLLECT ALL 20!", FONT, 130, (255, 214, 60), (0.5, 0.1), "mm")])


def icon():
    L.reset()
    desert((255, 160, 80), (90, 60, 200))
    sun(60, -40, 3.6)
    pyramid((-12, 60), 30)
    pyramid((14, 70), 22, (225, 180, 105))
    creature("KosharyDragon", (0, 0, 0), yaw=15)
    coins((0, -2.5), 14, 3.5, seed=8)
    camera((2.5, -11.5, 4.2), (0.2, 0, 3.0), lens=35)
    p = os.path.join(OUT, "icon.png")
    render(p, 512, 512, samples=128)
    caption(p, [("HEIST", FONT, 92, (255, 214, 60), (0.5, 0.88), "mm")])


SHOTS = {"tomb": thumb_tomb, "egyptian": thumb_egyptian, "all20": thumb_all20, "icon": icon}
if __name__ == "__main__":
    which = sys.argv[-3]
    for k in (SHOTS if which == "all" else which.split(",")):
        SHOTS[k]()
    print("DONE")
