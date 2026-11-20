"""Brainrot Heist — Egyptian creatures in the "Roblox brainrot" style (see brainrot_lib.py).

Run:  python creatures_real.py <Name|all> <outdir>
Front faces -Y in Blender (Roblox front after export). 1 unit = 1 stud.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brainrot_lib as L  # noqa: E402
from brainrot_lib import Meta, ball, cyl, horn, lathe, mat, nemes, real_eye, sneakers, stick, sunglasses, surf, torus  # noqa: E402
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

GOLD = lambda: mat("Gold", (255, 205, 70), (225, 165, 40), rough=0.25, metal=0.6, bump=0.02)  # noqa: E731
BLUE = lambda: mat("Lapis", (35, 95, 215), (25, 70, 175), rough=0.35, bump=0.02)  # noqa: E731


def membrane(lead, trail, m, cols=5, billow=0.25):
    verts, faces = [], []
    for i in range(len(lead)):
        for j in range(cols + 1):
            t = j / cols
            p = lead[i].lerp(trail[i], t)
            p.y += billow * math.sin(math.pi * t)
            verts.append(p)
    w = cols + 1
    for i in range(len(lead) - 1):
        for j in range(cols):
            faces.append((i * w + j, i * w + j + 1, (i + 1) * w + j + 1, (i + 1) * w + j))
    me = bpy.data.meshes.new("Membrane")
    me.from_pydata([tuple(v) for v in verts], [], faces)
    o = bpy.data.objects.new("Membrane", me)
    bpy.context.scene.collection.objects.link(o)
    o.modifiers.new("Thick", "SOLIDIFY").thickness = 0.04
    return L.add(o, m)


def bowl_mound_z(x, y, lift=0.03, center=1.75, r=2.1, h=0.63):
    d = min(math.hypot(x, y), r - 0.01)
    return center + h * math.sqrt(1 - (d / r) ** 2) + lift


# ---------------------------------------------------------------- 1. Koshary Dragon
def koshary_dragon():
    rnd = random.Random(11)
    skin = mat("DragonScales", (75, 205, 85), (40, 145, 62), rough=0.4, scale=11, bump=0.18, kind="scales", coat=0.3)
    belly = mat("DragonBelly", (255, 228, 150), (230, 190, 115), bump=0.08)
    hornm = mat("Horn", (255, 240, 205), (210, 180, 125), rough=0.35, bump=0.05)
    wing = mat("Wing", (245, 110, 60), (205, 75, 45), rough=0.55, bump=0.03, sss=0.2)
    clay = mat("Clay", (235, 115, 50), (205, 88, 38), rough=0.35, bump=0.04, coat=0.6)
    glaze = mat("Glaze", (40, 120, 240), (28, 90, 205), rough=0.15, bump=0.02, coat=1.0)
    rice = mat("RiceLentils", (245, 222, 175), (175, 125, 70), rough=0.7, scale=30, bump=0.2)
    pasta = mat("Pasta", (245, 195, 100), (215, 155, 70), rough=0.4, bump=0.03)
    sauce = mat("Sauce", (205, 35, 20), (160, 20, 10), rough=0.15, bump=0.02, coat=0.6)
    chick = mat("Chickpea", (230, 190, 115), (190, 145, 80), rough=0.6, bump=0.05)
    onion = mat("FriedOnion", (160, 80, 30), (110, 50, 18), rough=0.7, bump=0.1)
    mouth = mat("Mouth", (160, 45, 55), rough=0.3, bump=0)

    body = Meta("Dragon")
    body.curve((0, 0.5, 1.6), (0, 0.4, 3.6), (0, -0.6, 4.4), 12, 0.95, 0.62)
    body.el((0, -0.8, 4.75), 1.3, size=(0.85, 1.0, 0.8))
    body.el((0, -1.95, 4.6), 1.1, size=(0.6, 1.2, 0.5))
    body.el((0, -1.85, 4.12), 0.95, size=(0.5, 1.1, 0.32))
    body.el((0, -2.8, 4.55), 0.65, size=(0.6, 0.7, 0.55))
    for sx in (-1, 1):
        body.curve((0.6 * sx, -0.2, 2.3), (1.3 * sx, -1.9, 2.8), (1.6 * sx, -2.4, 1.6), 9, 0.5, 0.32)
        body.curve((1.3 * sx, 1.0, 2.0), (2.7 * sx, 1.3, 2.3), (2.8 * sx, 1.0, 0.75), 10, 0.55, 0.36)
    body.curve((0, 1.3, 1.5), (0, 2.8, 0.9), (1.4, 3.1, 0.3), 12, 0.55, 0.12)
    d = body.mesh(skin)
    d.data.materials.append(belly)
    for p in d.data.polygons:
        if p.normal.y < -0.55 and p.normal.z < 0.25 and p.center.z < 4.0 and abs(p.center.x) < 0.7:
            p.material_index = 1

    for sx in (-1, 1):
        real_eye(d, (4 * sx, -1.45, 4.95), (-sx, 0.15, 0), 0.24, iris_rgb=(240, 170, 20))
        p, _ = surf(d, (0.45 * sx, -0.7, 9), (0, 0, -1), inset=0.12)
        horn(p, (0.3 * sx, 1.0, 0.75), 1.8, 0.22, hornm, segs=6, curl=0.08)
        for k in range(2):
            p, _ = surf(d, (3 * sx, -2.55 + 0.45 * k, 4.38), (-sx, 0, 0), inset=0.05)
            horn(p, (0, 0, -1), 0.26, 0.07, hornm, segs=2)
        for t in (-1, 0, 1):
            p, _ = surf(d, (1.6 * sx + 0.14 * t, -6.4, 1.5), (0, 1, 0), inset=0.06)
            horn(p, (0.2 * t, -0.4, -1), 0.42, 0.075, hornm, segs=3)
    ball((0, -2.3, 4.32), 0.5, mouth, scale=(0.8, 1.35, 0.14))
    for i in range(4):
        z = 5.0 - 2.6 * i / 3
        p, _ = surf(d, (0, 8, z), (0, -1, 0), inset=0.08)
        horn(p, (0, 1, 0.45), 0.6 - 0.1 * i, 0.16 - 0.02 * i, hornm, segs=3)
    for sx in (-1, 1):
        shoulder, elbow = Vector((0.7 * sx, 0.9, 3.0)), Vector((2.3 * sx, 1.6, 4.4))
        tips = [Vector((3.9 * sx, 2.2, 5.6)), Vector((4.3 * sx, 2.6, 3.9)), Vector((3.6 * sx, 2.4, 2.4))]
        for a, b in [(shoulder, elbow)] + [(elbow, t) for t in tips]:
            stick(a, b, 0.09, skin, verts=8)
        rows = 6
        lead = [shoulder.lerp(elbow, t / rows) for t in range(rows + 1)] + [elbow.lerp(tips[0], t / rows) for t in range(1, rows + 1)]
        root = Vector((1.0 * sx, 1.2, 2.2))
        trail = ([root.lerp(tips[2], t / rows) for t in range(rows + 1)] + [tips[2].lerp(tips[1], t / rows) for t in range(1, rows + 1)])
        membrane(lead, trail[:len(lead)], wing)
    sneakers([(2.8 * sx, 0.85, 0.0) for sx in (-1, 1)], size=1.0)
    # The bowl and a simpler koshary topping.
    lathe([(0.0, 0.0), (1.0, 0.0), (1.1, 0.12), (1.6, 0.5), (2.05, 1.15), (2.25, 1.75), (2.32, 1.9), (2.2, 1.92), (2.1, 1.75)],
          clay, bands=[(0.95, 1.35, glaze)])
    mound = ball((0, 0, 1.75), 2.1, rice, scale=(1, 1, 0.3), seg=40, ring=20)
    disp = mound.modifiers.new("Disp", "DISPLACE")
    tex = bpy.data.textures.new("Grain", "CLOUDS")
    tex.noise_scale = 0.15
    disp.texture = tex
    disp.strength = 0.06
    spots = []
    while len(spots) < 30:
        a, r = rnd.uniform(0, 2 * math.pi), rnd.uniform(0.3, 1.85)
        x, y = math.cos(a) * r, math.sin(a) * r
        if abs(x) < 1.0 and -0.4 < y < 1.4:
            continue
        spots.append((x, y))
    for x, y in spots[:8]:
        o = torus((x, y, bowl_mound_z(x, y)), 0.17, 0.065, pasta, rot=(rnd.uniform(0, 3), rnd.uniform(0, 3), 0), maj=12, mn=6)
        bm = L.bmesh.new()
        bm.from_mesh(o.data)
        L.bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > 0.02], context="VERTS")
        bm.to_mesh(o.data)
        bm.free()
    for x, y in spots[8:16]:
        ball((x, y, bowl_mound_z(x, y, 0.08)), 0.13, chick, seg=10, ring=6)
    for x, y in spots[16:]:
        ball((x, y, bowl_mound_z(x, y, 0.05)), 0.2, onion, scale=(1.6, 0.4, 0.25), rot=(0, 0, rnd.uniform(0, 3)), seg=8, ring=4)
    ball((-0.75, -1.15, bowl_mound_z(-0.75, -1.15, -0.02)), 0.75, sauce, scale=(1.2, 0.9, 0.12), seg=24, ring=10)


# ---------------------------------------------------------------- 2. Pharaoh Falafel
def pharaoh_falafel():
    crust = mat("FalafelCrust", (165, 95, 40), (115, 60, 22), rough=0.75, scale=7, bump=0.25)
    gold, blue = GOLD(), BLUE()
    body = ball((0, 0, 2.5), 1.6, crust, seg=32, ring=20)
    disp = body.modifiers.new("Crunch", "DISPLACE")
    tex = bpy.data.textures.new("Crunch", "CLOUDS")
    tex.noise_scale = 0.35
    disp.texture = tex
    disp.strength = 0.12
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier="Crunch")
    limbs = Meta("FalafelLimbs")
    for sx in (-1, 1):
        limbs.curve((0.6 * sx, 0.0, 1.3), (0.65 * sx, -0.1, 0.8), (0.7 * sx, -0.2, 0.55), 6, 0.33, 0.28)
        limbs.curve((1.35 * sx, 0.0, 2.6), (2.1 * sx, -0.5, 2.3), (2.0 * sx, -0.9, 1.75), 7, 0.3, 0.24)
    limbs.mesh(crust)
    for sx in (-1, 1):
        real_eye(body, (0.55 * sx, -6, 2.85), (0, 1, 0), 0.27, iris_rgb=(110, 70, 30))
    nemes((0, 0.05, 3.7), 3.25, 3.15, 1.35, gold, blue)
    p, _ = surf(body, (0, -6, 3.55), (0, 1, 0), 0.0)
    ball(p + Vector((0, -0.12, 0.25)), 0.16, gold, scale=(1, 0.9, 1.8))  # cobra
    cyl((0, -1.42, 1.45), 0.14, 0.6, gold, verts=12)
    for k in range(2):
        torus((0, -1.42, 1.3 + 0.25 * k), 0.15, 0.03, blue, maj=14, mn=4)
    stick((-2.05, -1.0, 0.9), (-2.05, -1.0, 3.2), 0.07, blue)
    torus((-1.85, -1.0, 3.25), 0.22, 0.07, gold, rot=(math.radians(90), 0, 0), maj=14, mn=6)
    sneakers([(0.72 * sx, -0.35, 0.0) for sx in (-1, 1)], size=0.75)


# ---------------------------------------------------------------- 3. Molokhia Kraken
def molokhia_kraken():
    skin = mat("KrakenSkin", (70, 175, 80), (40, 130, 60), rough=0.3, scale=5, bump=0.06, coat=0.5)
    clay = mat("Clay", (235, 115, 50), (205, 88, 38), rough=0.35, bump=0.04, coat=0.6)
    glaze = mat("Glaze", (40, 120, 240), (28, 90, 205), rough=0.15, bump=0.02, coat=1.0)
    soup = mat("MolokhiaSoup", (60, 140, 40), (40, 105, 30), rough=0.1, scale=12, bump=0.05, coat=1.0)
    lathe([(0, 0), (1.4, 0), (1.8, 0.6), (2.0, 1.3), (1.9, 1.7), (2.02, 1.85), (1.86, 1.9), (1.8, 1.75)], clay,
          bands=[(0.85, 1.2, glaze)])
    cyl((0, 0, 1.68), 1.82, 0.1, soup, verts=32)
    body = Meta("Kraken")
    body.el((0, 0.1, 3.2), 1.6, size=(0.85, 0.85, 1.0))
    body.el((0, 0.55, 4.0), 1.25, size=(0.8, 0.9, 1.0))
    for i in range(8):
        a = math.radians(-90 + 45 * i + 22.5)
        ca, sa = math.cos(a), math.sin(a)
        body.curve((0.8 * ca, 0.8 * sa, 2.1), (2.3 * ca, 2.3 * sa, 2.4), (2.9 * ca, 2.9 * sa, 0.3), 22, 0.45, 0.24)
    k = body.mesh(skin)
    for sx in (-1, 1):
        real_eye(k, (0.6 * sx, -6, 3.25), (0, 1, 0), 0.3, iris_rgb=(215, 175, 40))
    p, _ = surf(k, (0, -6, 4.05), (0, 1, 0), 0.0)
    sunglasses((0, p.y - 0.1, p.z), 1.9)


# ---------------------------------------------------------------- 4. Nile Phoenix
def nile_phoenix():
    red = mat("PhoenixRed", (245, 85, 35), (205, 50, 25), rough=0.5, scale=14, bump=0.06)
    orange = mat("PhoenixOrange", (255, 150, 35), (230, 110, 25), rough=0.5, bump=0.04)
    yellow = mat("PhoenixYellow", (255, 215, 70), (240, 180, 40), rough=0.5, bump=0.03)
    flame = mat("PhoenixFlame", (255, 140, 30), rough=0.3, bump=0, emit=2.0)
    gold = GOLD()
    body = Meta("Phoenix")
    body.el((0, 0.2, 2.3), 2.0, size=(0.8, 1.0, 0.9))
    body.el((0, -0.6, 3.6), 1.45, size=(0.9, 0.9, 0.9))
    b = body.mesh(red)
    p, _ = surf(b, (0, -6, 3.45), (0, 1, 0), 0.05)
    horn(p, (0, -1, -0.45), 0.75, 0.22, yellow, segs=4)
    for sx in (-1, 1):
        real_eye(b, (0.42 * sx, -6, 3.75), (0, 1, 0), 0.17, iris_rgb=(255, 170, 0))
    for i, (dx, h, tilt) in enumerate([(0, 1.0, 0), (-0.3, 0.75, 25), (0.3, 0.75, -25)]):
        p, _ = surf(b, (dx, -0.4, 8), (0, 0, -1), 0.1)
        horn(p, (math.sin(math.radians(-tilt)), 0.3, 1), h, 0.2, flame, segs=4)
    for sx in (-1, 1):
        shoulder = Vector((0.85 * sx, 0.45, 2.8))
        for j, (m, length, ang) in enumerate([(red, 2.1, 15), (red, 1.95, 32), (orange, 1.8, 49), (orange, 1.6, 66), (yellow, 1.35, 83)]):
            a = math.radians(ang)
            c = shoulder + Vector((sx * math.cos(a), 0.05 * j, math.sin(a))) * length / 2
            ball(c, 0.5, m, scale=(length, 0.14, 0.42), rot=(0, -a * sx, 0), seg=16, ring=8)
    for k in range(5):
        a = math.radians(-24 + 12 * k)
        m = (yellow, orange, red, orange, yellow)[k]
        ball((0.8 * math.sin(a), 1.55, 2.0), 0.5, m, scale=(0.32, 0.12, 1.8), rot=(math.radians(-40), a, 0), seg=14, ring=8)
    torus((0, -0.35, 2.95), 0.72, 0.07, gold, rot=(math.radians(25), 0, 0), maj=32, mn=6)
    ball((0, -1.05, 2.55), 0.16, gold)
    for sx in (-1, 1):
        stick((0.45 * sx, 0.1, 1.6), (0.5 * sx, -0.05, 0.12), 0.11, gold)
        for t in (-1, 0, 1):
            horn((0.5 * sx, -0.05, 0.1), (0.4 * t, -1, -0.05), 0.4, 0.07, gold, segs=2)


# ---------------------------------------------------------------- 5. Astro Sphinx
def astro_sphinx():
    stone = mat("SphinxStone", (232, 198, 140), (205, 165, 105), rough=0.65, scale=6, bump=0.08)
    suit = mat("SpaceSuit", (245, 245, 250), (220, 222, 230), rough=0.4, bump=0.02)
    glow = mat("Thruster", (90, 190, 255), rough=0.1, bump=0, emit=1.5)
    star = mat("StarGlow", (255, 225, 90), rough=0.3, bump=0, emit=2.0)
    nose = mat("SphinxNose", (175, 130, 85), bump=0.02)
    gold, blue = GOLD(), BLUE()
    body = Meta("Sphinx")
    body.el((0, 0.8, 1.05), 2.3, size=(0.85, 1.3, 0.6))
    body.el((0, -0.55, 1.5), 1.8, size=(0.8, 0.8, 0.8))
    for sx in (-1, 1):
        body.curve((0.75 * sx, -0.8, 0.6), (0.8 * sx, -1.7, 0.4), (0.8 * sx, -2.3, 0.4), 8, 0.62, 0.55)
        body.el((1.0 * sx, 1.7, 0.85), 1.3, size=(0.6, 0.9, 0.8))
    body.el((0, -0.9, 2.8), 1.5, size=(0.85, 0.9, 0.95))
    body.el((0, -1.6, 2.5), 0.8, size=(0.8, 0.7, 0.6))
    body.curve((0, 2.6, 0.8), (0.9, 3.4, 0.5), (1.2, 3.0, 1.4), 9, 0.18, 0.15)
    s = body.mesh(stone)
    ball((1.2, 3.0, 1.5), 0.28, stone)
    for sx in (-1, 1):
        real_eye(s, (0.4 * sx, -6, 2.9), (0, 1, 0), 0.17, iris_rgb=(60, 140, 220))
    p, _ = surf(s, (0, -6, 2.55), (0, 1, 0), 0.02)
    ball(p, 0.11, nose, scale=(1.3, 0.8, 0.8))
    nemes((0, -0.8, 3.3), 2.25, 2.05, 1.1, gold, blue)
    torus((0, -0.75, 2.0), 0.92, 0.14, suit, scale=(1, 0.95, 0.6))
    stick((0.55, -0.7, 3.75), (0.65, -0.7, 4.55), 0.04, suit)
    ball((0.65, -0.7, 4.62), 0.15, star)
    ball((0, 0.55, 1.95), 0.5, suit, scale=(1.4, 0.75, 0.95))
    for sx in (-1, 1):
        cyl((0.38 * sx, 0.95, 1.7), 0.17, 0.45, glow, rot=(math.radians(90), 0, 0), verts=12)


# ---------------------------------------------------------------- 6. Ful Moon
def ful_moon():
    bean = mat("FulBean", (205, 160, 100), (175, 130, 78), rough=0.35, scale=4, bump=0.04, coat=0.3)
    hilum = mat("BeanHilum", (115, 80, 45), bump=0.02)
    moon = mat("MoonGlow", (255, 245, 200), (245, 225, 160), rough=0.4, scale=3, bump=0.15, emit=0.8)
    bread = mat("AishBaladi", (215, 160, 95), (185, 125, 70), rough=0.7, scale=10, bump=0.15)
    body = Meta("Bean")
    body.el((-0.5, 0, 2.3), 1.8, size=(0.85, 0.62, 0.8))
    body.el((0.5, 0, 2.3), 1.8, size=(0.85, 0.62, 0.8))
    for sx in (-1, 1):
        body.curve((0.6 * sx, 0, 1.3), (0.65 * sx, -0.1, 0.7), (0.7 * sx, -0.2, 0.4), 6, 0.3, 0.27)
        body.curve((1.5 * sx, 0, 2.4), (2.1 * sx, -0.4, 2.3), (2.05 * sx, -0.85, 2.0), 7, 0.24, 0.2)
    b = body.mesh(bean)
    p, n = surf(b, (0, 0, 8), (0, 0, -1), 0.05)
    ball(p, 0.5, hilum, scale=(1.6, 0.35, 0.18))  # the bean's dark seam on top
    for sx in (-1, 1):
        ball((0.7 * sx, -0.35, 0.18), 0.3, bean, scale=(1, 1.4, 0.7))
    p, _ = surf(b, (0, -6, 2.65), (0, 1, 0), 0.0)
    sunglasses((0, p.y - 0.08, p.z), 1.45)
    ball((2.1, -1.15, 2.05), 0.5, bread, scale=(1, 0.3, 1), seg=20, ring=10)  # aish baladi in hand
    crescent = Meta("Crescent", resolution=0.08)
    n = 40
    for i in range(n):
        a = math.radians(-120 + 240 * i / (n - 1))
        crescent.ball((1.05 * math.sin(a), 1.2, 4.0 + 1.05 * math.cos(a)), 0.16 + 0.3 * math.sin(math.pi * i / (n - 1)))
    crescent.mesh(moon)


# ---------------------------------------------------------------- 7. Basbousa Cat
def basbousa_cat():
    cake = mat("Basbousa", (238, 168, 62), (205, 125, 38), rough=0.3, scale=5, bump=0.1, coat=0.5)
    almond = mat("Almond", (250, 235, 205), (230, 205, 165), bump=0.03)
    score = mat("ScoreLine", (180, 105, 30), bump=0)
    pink = mat("CatPink", (255, 160, 165), bump=0)
    dark = mat("Whisker", (40, 30, 25), bump=0)
    gold = GOLD()
    ruby = mat("Ruby", (220, 30, 50), rough=0.1, bump=0, coat=1.0)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.35, 1.05))
    slab = bpy.context.object
    slab.scale = (2.3, 2.0, 1.05)
    bev = slab.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.25
    bev.segments = 3
    L.add(slab, cake)
    for k in (-1, 1):
        stick((-1.0, 0.35 - 0.8 * k, 1.585), (1.0, 0.35 + 0.8 * k, 1.585), 0.025, score, verts=6)
    for x, y in ((-0.6, 0.6), (0.6, 0.6), (0, 1.0)):
        ball((x, y, 1.62), 0.2, almond, scale=(0.7, 1.4, 0.45))
    body = Meta("Cat")
    body.el((0, -0.95, 2.25), 1.2, size=(0.9, 0.8, 0.85))
    body.el((0, -1.55, 2.0), 0.5, size=(0.85, 0.6, 0.55))
    for sx in (-1, 1):
        for y in (-0.4, 1.1):
            body.curve((0.75 * sx, y, 0.7), (0.78 * sx, y - 0.05, 0.4), (0.8 * sx, y - 0.15, 0.2), 5, 0.3, 0.28)
    body.curve((0, 1.3, 1.1), (1.4, 2.0, 1.2), (1.2, 1.7, 2.6), 12, 0.22, 0.2)
    c = body.mesh(cake)
    for sx in (-1, 1):
        real_eye(c, (0.45 * sx, -6, 2.5), (0, 1, 0), 0.2, iris_rgb=(110, 200, 80))
        p, _ = surf(c, (0.55 * sx, -0.9, 6), (0, 0, -1), 0.12)
        horn(p, (0.25 * sx, -0.1, 1), 0.75, 0.32, cake, segs=3)
        horn(p + Vector((0, -0.1, 0.05)), (0.25 * sx, -0.1, 1), 0.55, 0.2, pink, segs=3)
        for k in (-1, 1):
            p, _ = surf(c, (0.45 * sx, -6, 2.0 + 0.08 * k), (0, 1, 0), 0.0)
            stick(p, p + Vector((0.8 * sx, -0.1, 0.12 * k)), 0.018, dark, verts=5)
    p, _ = surf(c, (0, -6, 2.15), (0, 1, 0), 0.02)
    ball(p, 0.08, pink, scale=(1.3, 0.8, 0.8))
    p, _ = surf(c, (0, -0.9, 6), (0, 0, -1), 0.05)
    torus((0, p.y, p.z + 0.08), 0.55, 0.08, gold, maj=24, mn=6)
    for k in range(5):
        a = math.radians(72 * k)
        horn((0.55 * math.sin(a), p.y + 0.55 * math.cos(a), p.z + 0.1), (0, 0, 1), 0.42, 0.13, gold, segs=2)
        ball((0.55 * math.sin(a), p.y + 0.55 * math.cos(a), p.z + 0.55), 0.06, ruby)


# ---------------------------------------------------------------- 8. Shawarma Sultan
def shawarma_sultan():
    bread = mat("Saj", (238, 205, 150), (205, 160, 100), rough=0.7, scale=3, bump=0.06)
    paper = mat("Wrapper", (250, 248, 240), (232, 228, 218), rough=0.8, scale=20, bump=0.04)
    meat = mat("Shawarma", (150, 80, 40), (110, 55, 25), rough=0.7, scale=12, bump=0.15)
    lettuce = mat("Lettuce", (120, 200, 70), bump=0.02)
    turban = mat("Turban", (252, 248, 238), (230, 224, 210), rough=0.6, scale=6, bump=0.05)
    emerald = mat("Emerald", (30, 200, 120), rough=0.05, bump=0, coat=1.0)
    plume = mat("Plume", (230, 55, 80), bump=0.02)
    tash = mat("Mustache", (60, 35, 20), bump=0.02)
    gold = GOLD()
    w = ball((0, 0, 2.8), 1.0, bread, scale=(1.05, 1.0, 2.0), seg=28, ring=18)
    cyl((0, 0, 1.55), 1.0, 1.4, paper, verts=28)
    limbs = Meta("SultanLimbs")
    for sx in (-1, 1):
        limbs.curve((0.45 * sx, 0, 1.0), (0.5 * sx, -0.05, 0.65), (0.5 * sx, -0.1, 0.45), 5, 0.22, 0.2)
        limbs.curve((1.0 * sx, 0, 2.9), (1.6 * sx, -0.4, 2.6), (1.55 * sx, -0.75, 2.1), 7, 0.22, 0.18)
    limbs.mesh(bread)
    for sx in (-1, 1):
        real_eye(w, (0.38 * sx, -6, 3.45), (0, 1, 0), 0.21, iris_rgb=(90, 55, 25))
        p, _ = surf(w, (0.3 * sx, -6, 3.05), (0, 1, 0), 0.0)
        ball(p + Vector((0.12 * sx, -0.05, 0)), 0.5, tash, scale=(0.75, 0.22, 0.2), rot=(0, math.radians(-15 * sx), 0))
    for i in range(10):
        a = math.radians(36 * i)
        ball((0.75 * math.cos(a), 0.7 * math.sin(a), 4.55), 0.5, meat if i % 3 else lettuce, scale=(0.6, 0.28, 0.45), rot=(0, 0, a))
    ball((0, 0.02, 5.0), 0.5, turban, scale=(2.1, 2.0, 1.1), seg=24, ring=14)
    torus((0, 0.02, 4.85), 0.95, 0.2, turban, scale=(1, 0.95, 1))
    ball((0, -0.98, 5.0), 0.2, emerald, scale=(1, 0.6, 1.2))
    torus((0, -0.93, 5.0), 0.22, 0.05, gold, rot=(math.radians(90), 0, 0), maj=14, mn=5)
    ball((0.15, -0.65, 5.75), 0.5, plume, scale=(0.3, 0.15, 1.3), rot=(0, math.radians(15), 0))
    sneakers([(0.5 * sx, -0.25, 0.0) for sx in (-1, 1)], size=0.7)


CREATURES = {
    "KosharyDragon": koshary_dragon,
    "PharaohFalafel": pharaoh_falafel,
    "MolokhiaKraken": molokhia_kraken,
    "NilePhoenix": nile_phoenix,
    "AstroSphinx": astro_sphinx,
    "FulMoon": ful_moon,
    "BasbousaCat": basbousa_cat,
    "ShawarmaSultan": shawarma_sultan,
}

if __name__ == "__main__":
    which, out = sys.argv[-2], sys.argv[-1]
    os.makedirs(out, exist_ok=True)
    for name in (CREATURES if which == "all" else which.split(",")):
        L.reset()
        CREATURES[name]()
        L.finalize(name, out)
    print("DONE")
