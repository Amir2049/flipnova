"""Brainrot Heist — the other 12 creatures, same "Roblox brainrot" style as creatures_real.py.

Run:  python creatures_classic.py <Name|all|Name,Name> <outdir>
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brainrot_lib as L  # noqa: E402
from brainrot_lib import Meta, ball, cyl, horn, lathe, mat, real_eye, sneakers, stick, surf, torus  # noqa: E402
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

GOLD = lambda: mat("Gold", (255, 205, 70), (225, 165, 40), rough=0.25, bump=0.02)  # noqa: E731


def keep_half(o, test):
    """Delete the vertices of a primitive for which test(local co) is False (half rings, arches)."""
    bm = L.bmesh.new()
    bm.from_mesh(o.data)
    L.bmesh.ops.delete(bm, geom=[v for v in bm.verts if not test(v.co)], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    return o


def rounded_box(loc, size, m, bevel=0.15):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.scale = size
    b = o.modifiers.new("Bevel", "BEVEL")
    b.width = bevel
    b.segments = 3
    b.affect = "EDGES"
    return L.add(o, m)


def flame_cone(loc, r, depth, direction=(0, 0, -1)):
    fire = mat("RocketFlame", (255, 150, 30), rough=0.3, bump=0, emit=2.5)
    d = Vector(direction).normalized()
    bpy.ops.mesh.primitive_cone_add(vertices=14, radius1=r, radius2=0.0, depth=depth, location=loc)
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return L.add(o, fire)


# ---------------------------------------------------------------- 1. Banana Rocket
def banana_rocket():
    peel = mat("BananaPeel", (255, 216, 61), (240, 185, 35), rough=0.4, scale=4, bump=0.03, coat=0.2)
    tip = mat("BananaTip", (95, 70, 35), bump=0.02)
    fin = mat("RocketRed", (230, 45, 45), (195, 30, 30), rough=0.35, bump=0.01, coat=0.5)
    steel = mat("Steel", (200, 205, 215), (160, 165, 175), rough=0.3, bump=0.01)
    body = Meta("Banana")
    body.curve((0, 0, 1.0), (0.55, 0, 2.6), (0, 0, 4.3), 16, 1.15, 0.7)
    for sx in (-1, 1):
        body.curve((0.55 * sx, 0, 2.5), (1.15 * sx, -0.3, 2.7), (1.25 * sx, -0.4, 3.2), 6, 0.36, 0.3)
    b = body.mesh(peel)
    ball((0, 0, 4.62), 0.17, tip, scale=(1, 1, 2.0))
    ball((0, 0, 0.62), 0.2, tip, scale=(1, 1, 0.6))
    for sx in (-1, 1):
        real_eye(b, (0.3 * sx, -6, 3.0), (0, 1, 0), 0.19, iris_rgb=(110, 70, 30))
    for k in range(3):
        a = math.radians(90 + 120 * k)
        ball((0.75 * math.cos(a), 0.75 * math.sin(a), 1.05), 0.5, fin, scale=(1.2, 0.14, 1.5), rot=(0, 0, a))
    cyl((0, 0, 0.5), 0.36, 0.35, steel, verts=16)
    flame_cone((0, 0, 0.12), 0.3, 0.5)


# ---------------------------------------------------------------- 2. Toast Penguin
def toast_penguin():
    feathers = mat("PenguinBlack", (40, 45, 60), (25, 28, 40), rough=0.45, scale=12, bump=0.04)
    crust = mat("ToastCrust", (195, 120, 50), (160, 90, 35), rough=0.7, scale=8, bump=0.1)
    crumb = mat("ToastCrumb", (248, 210, 145), (225, 175, 110), rough=0.8, scale=25, bump=0.15)
    orange = mat("BeakOrange", (255, 150, 30), (235, 120, 20), bump=0.01)
    butter = mat("Butter", (255, 235, 130), rough=0.2, bump=0, coat=0.6)
    body = Meta("Penguin")
    body.el((0, 0, 1.75), 2.2, size=(0.75, 0.7, 1.0))
    body.el((0, -0.1, 3.35), 1.5, size=(0.85, 0.85, 0.85))
    for sx in (-1, 1):
        body.el((1.05 * sx, 0.05, 2.0), 0.9, size=(0.25, 0.5, 1.0))
    p = body.mesh(feathers)
    front, _ = surf(p, (0, -6, 1.75), (0, 1, 0), 0.0)
    rounded_box((0, front.y + 0.05, 1.75), (1.45, 0.2, 1.7), crust, bevel=0.22)
    rounded_box((0, front.y - 0.03, 1.75), (1.2, 0.08, 1.45), crumb, bevel=0.15)
    for sx in (-1, 1):
        real_eye(p, (0.32 * sx, -6, 3.55), (0, 1, 0), 0.15, iris_rgb=(60, 40, 25))
        ball((0.42 * sx, -0.45, 0.12), 0.32, orange, scale=(1, 1.5, 0.4))
    q, _ = surf(p, (0, -6, 3.3), (0, 1, 0), 0.05)
    horn(q, (0, -1, -0.25), 0.55, 0.17, orange, segs=3)
    top, _ = surf(p, (0, -0.1, 8), (0, 0, -1), 0.05)
    rounded_box((0.05, top.y, top.z + 0.1), (0.55, 0.55, 0.16), butter, bevel=0.05)


# ---------------------------------------------------------------- 3. Cactus DJ
def cactus_dj():
    green = mat("CactusGreen", (74, 200, 120), (45, 155, 85), rough=0.5, scale=9, bump=0.06)
    spine = mat("CactusSpine", (250, 245, 220), bump=0)
    clay = mat("Clay", (235, 115, 50), (205, 88, 38), rough=0.35, bump=0.04, coat=0.6)
    black = mat("HeadphoneBlack", (30, 30, 35), rough=0.3, bump=0)
    pink = mat("HeadphonePink", (255, 80, 170), rough=0.3, bump=0)
    flower = mat("CactusFlower", (255, 110, 160), bump=0.02)
    gold = GOLD()
    lathe([(0, 0), (0.9, 0), (1.1, 0.9), (1.22, 1.0), (1.1, 1.05), (1.0, 0.95)], clay)
    body = Meta("Cactus")
    body.curve((0, 0, 0.9), (0, 0, 2.5), (0, 0, 4.1), 14, 1.35, 1.25)
    body.curve((0.7, 0, 2.3), (1.55, 0, 2.3), (1.55, 0, 3.35), 8, 0.7, 0.62)
    body.curve((-0.7, 0, 1.9), (-1.45, 0, 1.9), (-1.45, 0, 2.75), 8, 0.65, 0.58)
    c = body.mesh(green)
    rnd = random.Random(5)
    for _ in range(16):
        a, z = rnd.uniform(0, 2 * math.pi), rnd.uniform(1.3, 4.0)
        p, n = surf(c, (6 * math.cos(a), 6 * math.sin(a), z), (-math.cos(a), -math.sin(a), 0), 0.02)
        horn(p, n, 0.22, 0.03, spine, segs=1)
    for sx in (-1, 1):
        real_eye(c, (0.3 * sx, -6, 3.4), (0, 1, 0), 0.17, iris_rgb=(70, 45, 25))
    top, _ = surf(c, (0, 0, 8), (0, 0, -1), 0.0)
    o = torus((0, 0, top.z - 0.35), 0.86, 0.08, black, rot=(0, math.radians(90), 0), maj=32, mn=6)
    keep_half(o, lambda co: co.x < 0.05)  # arch over the head (local x becomes world z after rotation)
    for sx in (-1, 1):
        cyl((0.86 * sx, 0, top.z - 0.4), 0.33, 0.28, black, rot=(0, math.radians(90), 0), verts=20)
        torus((0.99 * sx, 0, top.z - 0.4), 0.26, 0.05, pink, rot=(0, math.radians(90), 0), maj=20, mn=5)
    ball((0.1, 0, top.z + 0.05), 0.22, flower, scale=(1, 1, 0.6))
    torus((0, -0.1, 2.85), 0.85, 0.06, gold, rot=(math.radians(18), 0, 0), scale=(1, 0.9, 1), maj=32, mn=6)


# ---------------------------------------------------------------- 4. Disco Dumpling
def disco_dumpling():
    dough = mat("Dumpling", (255, 205, 228), (240, 175, 205), rough=0.45, scale=5, bump=0.03, sss=0.2)
    mirror = mat("DiscoMirror", (225, 225, 240), (140, 140, 165), rough=0.1, scale=18, bump=0.2, kind="scales", emit=0.15)
    body = Meta("Dumpling")
    body.el((0, 0, 1.25), 2.6, size=(0.8, 0.7, 0.5))
    for i in range(9):
        x = -1.2 + 0.3 * i
        body.ball((x, 0, 1.8 + 0.08 * math.sin(i * 2.1)), 0.55)
    for sx in (-1, 1):
        body.curve((0.55 * sx, -0.15, 0.7), (0.65 * sx, -0.25, 0.35), (0.7 * sx, -0.4, 0.22), 5, 0.34, 0.3)
        body.curve((1.1 * sx, 0, 1.3), (1.6 * sx, -0.2, 1.8), (1.7 * sx, -0.3, 2.4), 7, 0.34, 0.3)
    d = body.mesh(dough)
    for sx in (-1, 1):
        real_eye(d, (0.38 * sx, -6, 1.42), (0, 1, 0), 0.18, iris_rgb=(80, 50, 30))
    top, _ = surf(d, (0, 0, 8), (0, 0, -1), 0.0)
    ball((0, 0, top.z + 0.55), 0.58, mirror, seg=18, ring=12)
    stick((0, 0, top.z + 1.1), (0, 0, top.z + 1.5), 0.03, mat("Chain", (90, 90, 95), bump=0))


# ---------------------------------------------------------------- 5. Cosmic Kettle
def cosmic_kettle():
    enamel = mat("KettleEnamel", (136, 111, 255), (105, 80, 225), rough=0.2, scale=4, bump=0.01, coat=0.8)
    gold = GOLD()
    steam = mat("Steam", (250, 250, 255), rough=0.8, scale=4, bump=0.05)
    star = mat("KettleStar", (255, 230, 100), rough=0.3, bump=0, emit=1.5)
    z0 = 0.9
    k = lathe([(0, z0), (1.1, z0), (1.35, z0 + 0.4), (1.45, z0 + 1.2), (1.3, z0 + 1.9), (0.9, z0 + 2.3), (0.55, z0 + 2.45),
               (0.5, z0 + 2.5), (0, z0 + 2.5)], enamel, bands=[(z0 - 0.01, z0 + 0.3, gold)])
    ball((0, 0, z0 + 2.65), 0.2, gold)
    o = torus((0, 0.0, z0 + 2.4), 1.0, 0.09, gold, rot=(math.radians(90), 0, 0), maj=32, mn=6)
    keep_half(o, lambda co: co.y > 0.25)
    spout = Meta("Spout")
    spout.curve((1.0, -0.5, z0 + 1.0), (1.75, -1.0, z0 + 1.6), (2.05, -1.2, z0 + 2.3), 9, 0.6, 0.38)
    for sx in (-1, 1):
        spout.curve((0.55 * sx, 0, z0 + 0.3), (0.6 * sx, -0.1, 0.65), (0.6 * sx, -0.15, 0.5), 5, 0.36, 0.32)
    spout.mesh(enamel)
    for i, r in enumerate((0.2, 0.28, 0.36)):
        ball((2.1 + 0.08 * i, -1.25, z0 + 2.65 + 0.42 * i), r, steam)
    rnd = random.Random(4)
    for _ in range(9):
        a, z = rnd.uniform(-2.8, -0.3), rnd.uniform(z0 + 0.5, z0 + 1.9)
        p, _ = surf(k, (6 * math.cos(a), 6 * math.sin(a), z), (-math.cos(a), -math.sin(a), 0), -0.02)
        ball(p, 0.08, star, seg=8, ring=5)
    for sx in (-1, 1):
        real_eye(k, (0.42 * sx, -6, z0 + 1.45), (0, 1, 0), 0.22, iris_rgb=(90, 60, 200))
    sneakers([(0.6 * sx, -0.3, 0.0) for sx in (-1, 1)], size=0.68)


# ---------------------------------------------------------------- 6. Turbo Turtle
def turbo_turtle():
    skin = mat("TurtleSkin", (125, 195, 95), (90, 155, 70), rough=0.5, scale=10, bump=0.05)
    shell = mat("TurtleShell", (55, 214, 239), (25, 130, 170), rough=0.3, scale=2.6, bump=0.25, kind="scales", coat=0.6)
    rim = mat("ShellRim", (30, 150, 185), rough=0.35, bump=0.02)
    steel = mat("Steel", (200, 205, 215), (160, 165, 175), rough=0.3, bump=0.01)
    strap = mat("GoggleStrap", (35, 35, 40), bump=0)
    lens = mat("GoggleLens", (255, 160, 40), rough=0.05, bump=0, coat=1.0)
    body = Meta("Turtle")
    body.el((0, 0.2, 0.8), 2.4, size=(0.75, 0.9, 0.35))
    body.curve((0, -1.2, 0.9), (0, -1.9, 1.3), (0, -2.2, 1.5), 6, 0.6, 0.55)
    body.el((0, -2.45, 1.6), 1.05, size=(0.8, 1.0, 0.75))
    for sx in (-1, 1):
        for sy in (-1, 1):
            body.curve((1.2 * sx, 0.2 + 0.9 * sy, 0.65), (1.6 * sx, 0.2 + 1.1 * sy, 0.35), (1.65 * sx, 0.2 + 1.1 * sy, 0.15), 5, 0.52, 0.48)
    body.curve((0, 1.7, 0.7), (0, 2.3, 0.5), (0.2, 2.6, 0.4), 5, 0.3, 0.15)
    t = body.mesh(skin)
    ball((0, 0.2, 1.1), 1.6, shell, scale=(1, 1.2, 0.72), seg=28, ring=16)
    torus((0, 0.2, 0.82), 1.56, 0.12, rim, scale=(1, 1.2, 1), maj=36, mn=6)
    for sx in (-1, 1):
        real_eye(t, (0.35 * sx, -6, 1.62), (0, 1, 0), 0.17, iris_rgb=(60, 40, 20))
        cyl((0.48 * sx, 1.55, 1.45), 0.3, 1.0, steel, rot=(math.radians(90), 0, 0), verts=18)
        flame_cone((0.48 * sx, 2.35, 1.45), 0.24, 0.6, direction=(0, 1, 0))
    head, _ = surf(t, (0, -2.45, 8), (0, 0, -1), 0.0)
    torus((0, -2.45, head.z - 0.22), 0.58, 0.05, strap, scale=(1, 1.05, 1), maj=32, mn=5)
    for sx in (-1, 1):
        p, _ = surf(t, (0.3 * sx, -6, head.z - 0.22), (0, 1, 0), 0.0)
        cyl(p + Vector((0, -0.05, 0)), 0.17, 0.12, lens, rot=(math.radians(90), 0, 0), verts=16)
        torus(p + Vector((0, -0.08, 0)), 0.17, 0.04, strap, rot=(math.radians(90), 0, 0), maj=16, mn=5)


# ---------------------------------------------------------------- 7. Moon Mango
def moon_mango():
    skin = mat("MangoSkin", (255, 153, 53), (240, 85, 45), rough=0.3, scale=1.4, bump=0.02, coat=0.3)
    stem = mat("MangoStem", (100, 70, 35), bump=0.01)
    leaf = mat("MangoLeaf", (70, 170, 60), (45, 130, 45), bump=0.02)
    red = mat("BowTie", (210, 30, 45), rough=0.4, bump=0.01)
    body = Meta("Mango")
    body.el((0, 0, 1.95), 2.6, size=(0.65, 0.55, 0.8))
    for sx in (-1, 1):
        body.curve((0.45 * sx, 0, 0.95), (0.5 * sx, -0.1, 0.55), (0.55 * sx, -0.2, 0.35), 5, 0.3, 0.27)
        body.curve((1.0 * sx, 0, 1.9), (1.5 * sx, -0.3, 1.7), (1.55 * sx, -0.6, 1.35), 6, 0.28, 0.24)
    m = body.mesh(skin)
    for sx in (-1, 1):
        ball((0.55 * sx, -0.35, 0.18), 0.3, skin, scale=(1, 1.4, 0.7))
        real_eye(m, (0.36 * sx, -6, 2.25), (0, 1, 0), 0.2, iris_rgb=(110, 70, 30))
    top, _ = surf(m, (0, 0, 8), (0, 0, -1), 0.0)
    stick(top, top + Vector((0.08, 0.05, 0.35)), 0.06, stem, verts=8)
    ball(top + Vector((0.45, 0.05, 0.32)), 0.5, leaf, scale=(0.9, 0.12, 0.35), rot=(0, math.radians(-20), 0))
    p, _ = surf(m, (0, -6, 1.35), (0, 1, 0), 0.0)
    for sx in (-1, 1):
        ball(p + Vector((0.22 * sx, -0.05, 0)), 0.5, red, scale=(0.36, 0.12, 0.26))
    ball(p + Vector((0, -0.08, 0)), 0.09, red)


# ---------------------------------------------------------------- 8. Royal Noodle
def royal_noodle():
    cup = mat("NoodleCup", (250, 248, 240), (230, 226, 215), rough=0.6, scale=12, bump=0.02)
    band = mat("CupRed", (225, 40, 40), (195, 30, 30), rough=0.5, bump=0.01)
    noodle = mat("Noodle", (255, 235, 145), (240, 210, 110), rough=0.4, scale=8, bump=0.02)
    wood = mat("Chopstick", (205, 160, 95), (175, 125, 70), rough=0.6, scale=15, bump=0.05)
    ruby = mat("Ruby", (220, 30, 50), rough=0.1, bump=0, coat=1.0)
    gold = GOLD()
    c = lathe([(0, 0), (0.95, 0), (1.25, 2.4), (1.32, 2.45), (1.24, 2.5), (1.15, 2.42)], cup, bands=[(0.95, 1.55, band)])
    nood = Meta("Noodles", resolution=0.07)
    for i in range(7):
        a0 = i * 2 * math.pi / 7
        pts = 24
        for k in range(pts):
            t = k / (pts - 1)
            a = a0 + t * 2.2
            r = 0.95 - 0.55 * t
            nood.ball((r * math.cos(a), r * math.sin(a), 2.35 + 1.1 * t + 0.12 * math.sin(t * 12)), 0.3)
    nood.mesh(noodle)
    for sx in (-1, 1):
        real_eye(c, (0.36 * sx, -6, 1.95), (0, 1, 0), 0.2, iris_rgb=(80, 50, 25))
    stick((0.25, 0.25, 2.6), (1.0, 0.7, 4.3), 0.06, wood, verts=8)
    stick((0.4, 0.15, 2.6), (1.2, 0.5, 4.2), 0.06, wood, verts=8)
    torus((0, 0, 3.55), 0.5, 0.08, gold, maj=24, mn=6)
    for k in range(5):
        a = math.radians(72 * k)
        horn((0.5 * math.sin(a), 0.5 * math.cos(a), 3.6), (0, 0, 1), 0.4, 0.12, gold, segs=2)
        ball((0.5 * math.sin(a), 0.5 * math.cos(a), 4.03), 0.06, ruby)


# ---------------------------------------------------------------- 9. Pizza Shark
def pizza_shark():
    skin = mat("SharkSkin", (112, 152, 204), (85, 120, 170), rough=0.35, scale=6, bump=0.04, coat=0.3)
    belly = mat("SharkBelly", (240, 242, 248), (220, 224, 232), rough=0.4, bump=0.02)
    cheese = mat("PizzaCheese", (255, 200, 70), (240, 160, 40), rough=0.4, scale=6, bump=0.08)
    crust = mat("PizzaCrust", (215, 155, 80), (185, 120, 55), rough=0.7, scale=10, bump=0.1)
    pepperoni = mat("Pepperoni", (195, 40, 30), (160, 25, 20), rough=0.4, bump=0.03)
    tooth = mat("Tooth", (250, 250, 245), bump=0)
    mouth = mat("SharkMouth", (90, 30, 40), bump=0)
    body = Meta("Shark")
    body.curve((0, -2.0, 2.1), (0, 0.2, 2.35), (0, 2.6, 2.1), 16, 2.3, 0.8)
    body.el((0, -2.7, 2.05), 1.5, size=(0.75, 1.0, 0.65))
    for sx in (-1, 1):
        body.curve((0.6 * sx, -0.3, 1.5), (0.7 * sx, -0.4, 0.8), (0.75 * sx, -0.5, 0.45), 6, 0.6, 0.5)
        body.el((1.15 * sx, -0.9, 1.8), 1.0, size=(0.8, 0.5, 0.12))
    s = body.mesh(skin)
    s.data.materials.append(belly)
    for p in s.data.polygons:
        if p.normal.z < -0.25 and p.center.z > 1.0:
            p.material_index = 1
    for sx in (-1, 1):
        ball((0.75 * sx, -0.65, 0.16), 0.32, skin, scale=(1, 1.5, 0.6))
    for sz in (1, -1):
        ball((0, 3.0, 2.15 + 0.55 * sz), 0.5, skin, scale=(0.14, 1.0, 1.6), rot=(math.radians(-38 * sz), 0, 0))
    # Dorsal fin = a pizza slice, tip up.
    top, _ = surf(s, (0, 0.1, 8), (0, 0, -1), 0.1)
    me = bpy.data.meshes.new("Slice")
    me.from_pydata([(0, -0.7, 0), (0, 0.8, 0), (0, 0.45, 1.6)], [], [(0, 1, 2)])
    sl = bpy.data.objects.new("Slice", me)
    bpy.context.scene.collection.objects.link(sl)
    sl.location = top
    sl.modifiers.new("Thick", "SOLIDIFY").thickness = 0.16
    L.add(sl, cheese, smooth=False)
    stick(top + Vector((0, -0.75, 0.02)), top + Vector((0, 0.85, 0.02)), 0.14, crust)
    for x in (-0.09, 0.09):
        for (y, z) in ((0.0, 0.4), (0.35, 0.85), (0.15, 0.25)):
            cyl(top + Vector((x, y, z)), 0.13, 0.04, pepperoni, rot=(0, math.radians(90), 0), verts=14)
    for sx in (-1, 1):
        real_eye(s, (4 * sx, -2.55, 2.35), (-sx, 0, 0), 0.15, iris_rgb=(30, 30, 35))
        for k in range(3):
            p, _ = surf(s, (4 * sx, -3.15 + 0.3 * k, 1.75), (-sx, 0, 0), 0.03)
            horn(p, (0, 0, -1), 0.18, 0.06, tooth, segs=2)
    p, _ = surf(s, (0, -6, 1.75), (0, 1, 0), 0.08)
    ball(p, 0.5, mouth, scale=(1.3, 0.3, 0.16))


# ---------------------------------------------------------------- 10. Thunder Sloth
def thunder_sloth():
    fur = mat("SlothFur", (150, 118, 88), (115, 88, 62), rough=0.8, scale=22, bump=0.15)
    mask = mat("SlothMask", (228, 205, 170), (205, 180, 145), rough=0.7, scale=10, bump=0.05)
    patch = mat("SlothPatch", (80, 55, 35), bump=0.02)
    claw = mat("SlothClaw", (235, 225, 200), bump=0.02)
    cloud = mat("StormCloud", (120, 125, 140), (95, 100, 115), rough=0.8, scale=3, bump=0.05)
    bolt = mat("Lightning", (255, 230, 60), rough=0.3, bump=0, emit=2.5)
    body = Meta("Sloth")
    body.el((0, 0.2, 1.6), 2.2, size=(0.7, 0.65, 0.85))
    body.el((0, -0.35, 3.05), 1.6, size=(0.8, 0.75, 0.75))
    for sx in (-1, 1):
        body.curve((0.9 * sx, -0.2, 2.2), (1.6 * sx, -0.8, 2.6), (1.55 * sx, -1.0, 3.3), 9, 0.5, 0.42)
        body.curve((0.55 * sx, -0.2, 0.9), (0.65 * sx, -0.4, 0.4), (0.7 * sx, -0.6, 0.25), 5, 0.48, 0.42)
    s = body.mesh(fur)
    face, n = surf(s, (0, -6, 3.0), (0, 1, 0), 0.12)
    ball(face, 0.5, mask, scale=(1.6, 0.5, 1.2))
    for sx in (-1, 1):
        ball(face + Vector((0.32 * sx, -0.08, 0.1)), 0.5, patch, scale=(0.5, 0.35, 0.28), rot=(0, math.radians(25 * sx), 0))
        real_eye(s, (0.32 * sx, -6, 3.12), (0, 1, 0), 0.12, iris_rgb=(40, 25, 15))
        for t in (-1, 0, 1):
            horn((1.55 * sx + 0.12 * t, -1.1, 3.55), (0.1 * t, -0.6, 1), 0.5, 0.06, claw, segs=3, curl=0.0)
    ball(face + Vector((0, -0.25, -0.15)), 0.12, patch, scale=(1.3, 0.8, 0.8))
    for x, y, z, r in ((0, -0.3, 4.65, 0.55), (-0.6, -0.2, 4.55, 0.42), (0.6, -0.25, 4.55, 0.45), (0.25, 0.05, 4.95, 0.42), (-0.3, 0.0, 4.9, 0.38)):
        ball((x, y, z), r, cloud, seg=14, ring=8)
    pts = [Vector(p) for p in ((1.6, -1.15, 3.4), (1.95, -1.2, 4.2), (1.65, -1.2, 4.25), (2.1, -1.3, 5.2))]
    for a, b in zip(pts, pts[1:]):
        stick(a, b, 0.1, bolt, verts=6)


# ---------------------------------------------------------------- 11. Crystal Croissant
def crystal_croissant():
    pastry = mat("Croissant", (228, 168, 82), (190, 115, 45), rough=0.35, scale=7, bump=0.12, coat=0.3)
    crystal = mat("Crystal", (130, 235, 255), (80, 190, 240), rough=0.05, bump=0, coat=1.0, emit=0.6)
    body = Meta("Croissant")
    n = 21
    for i in range(n):
        t = i / (n - 1)
        a = math.radians(-115 + 230 * t)
        r = 0.55 + 0.75 * math.sin(math.pi * t) + (0.1 if i % 3 == 0 else 0)
        body.ball((1.7 * math.sin(a), 0.4 - 1.1 * math.cos(a), 1.1), r * 1.6)
    for sx in (-1, 1):
        body.curve((0.5 * sx, -0.5, 0.6), (0.55 * sx, -0.6, 0.35), (0.6 * sx, -0.7, 0.2), 4, 0.42, 0.38)
    c = body.mesh(pastry)
    for sx in (-1, 1):
        real_eye(c, (0.35 * sx, -6, 1.3), (0, 1, 0), 0.19, iris_rgb=(90, 55, 25))
    for i, (x, h) in enumerate(((-1.2, 0.8), (-0.6, 1.1), (0.0, 1.35), (0.6, 1.05), (1.2, 0.85))):
        p, nrm = surf(c, (x, 0.6, 8), (0, 0, -1), 0.15)
        d = Vector((x * 0.25, 0.15, 1)).normalized()
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.24, radius2=0.0, depth=h, location=tuple(p + d * h / 2))
        o = bpy.context.object
        o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        L.add(o, crystal, smooth=False)


# ---------------------------------------------------------------- 12. Galaxy Jellyfish
def galaxy_jellyfish():
    bell = mat("GalaxyBell", (150, 92, 255), (55, 30, 140), rough=0.2, scale=3, bump=0.02, coat=0.6, emit=0.25, sss=0.2)
    arm = mat("JellyArm", (220, 150, 255), (180, 110, 240), rough=0.3, bump=0.02, emit=0.2)
    star = mat("JellyStar", (255, 255, 230), rough=0.3, bump=0, emit=3.0)
    body = Meta("Jelly")
    body.el((0, 0, 3.7), 2.7, size=(0.85, 0.85, 0.55))
    b = body.mesh(bell)
    tent = Meta("Tentacles", resolution=0.07)
    for i in range(8):
        a = math.radians(22.5 + 45 * i)
        ca, sa = math.cos(a), math.sin(a)
        side = Vector((-sa, ca, 0)) * 0.5
        tent.curve((0.95 * ca, 0.95 * sa, 3.2), (1.15 * ca + side.x, 1.15 * sa + side.y, 1.7), (1.0 * ca, 1.0 * sa, 0.15), 16, 0.3, 0.16)
    for i in range(4):
        a = math.radians(90 * i)
        tent.curve((0.3 * math.cos(a), 0.3 * math.sin(a), 3.1), (0.6 * math.cos(a), 0.6 * math.sin(a), 2.0), (0.4 * math.cos(a), 0.4 * math.sin(a), 0.6), 12, 0.45, 0.3)
    tent.mesh(arm)
    rnd = random.Random(7)
    for _ in range(22):
        a, u = rnd.uniform(0, 2 * math.pi), rnd.uniform(0.1, 0.95)
        k = math.sqrt(1 - u * u)
        p, _ = surf(b, (6 * k * math.cos(a), 6 * k * math.sin(a), 3.7 + 6 * u), (-k * math.cos(a), -k * math.sin(a), -u), -0.01)
        ball(p, rnd.uniform(0.04, 0.08), star, seg=8, ring=5)
    for sx in (-1, 1):
        real_eye(b, (0.48 * sx, -6, 3.65), (0, 1, 0), 0.22, iris_rgb=(120, 60, 220))


CREATURES = {
    "BananaRocket": banana_rocket,
    "ToastPenguin": toast_penguin,
    "CactusDJ": cactus_dj,
    "DiscoDumpling": disco_dumpling,
    "CosmicKettle": cosmic_kettle,
    "TurboTurtle": turbo_turtle,
    "MoonMango": moon_mango,
    "RoyalNoodle": royal_noodle,
    "PizzaShark": pizza_shark,
    "ThunderSloth": thunder_sloth,
    "CrystalCroissant": crystal_croissant,
    "GalaxyJellyfish": galaxy_jellyfish,
}

if __name__ == "__main__":
    which, out = sys.argv[-2], sys.argv[-1]
    os.makedirs(out, exist_ok=True)
    for name in (CREATURES if which == "all" else which.split(",")):
        L.reset()
        CREATURES[name]()
        L.finalize(name, out)
    print("DONE")
