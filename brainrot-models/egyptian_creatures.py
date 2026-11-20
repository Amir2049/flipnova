"""Brainrot Heist — the Egyptian creatures, in the same chibi style as the Koshary Dragon.

Run one:  python egyptian_creatures.py <Name> <outdir>
Names: PharaohFalafel MolokhiaKraken NilePhoenix AstroSphinx FulMoon BasbousaCat ShawarmaSultan
Each writes <Name>.fbx (Roblox Studio > Import 3D), <Name>.blend and <Name>_preview.png.
1 Blender unit = 1 stud. Front faces -Y in Blender (exported as Roblox front, -Z).
Every model is one mesh under Roblox's 20,000-triangle MeshPart limit.
"""
import math
import os
import random
import sys

import bpy
import bmesh  # available once bpy is imported
from mathutils import Vector

parts = []


# ---------------------------------------------------------------- helpers
def mat(name, rgb, rough=0.5, emit=0.0, metal=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    col = (*[((c / 255 + 0.055) / 1.055) ** 2.4 for c in rgb], 1)
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = col
        b.inputs["Emission Strength"].default_value = emit
    m.diffuse_color = col
    return m


def finish(o, material, smooth=True):
    o.data.materials.append(material)
    if smooth:
        for poly in o.data.polygons:
            poly.use_smooth = True
    parts.append(o)
    return o


def blob(name, loc, size, material, rot=(0, 0, 0), seg=18, ring=10):
    """Ellipsoid whose full size is exactly `size`."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=loc, rotation=rot, segments=seg, ring_count=ring)
    o = bpy.context.object
    o.name = name
    o.scale = size
    return finish(o, material)


def ball(name, loc, r, material, seg=12, ring=8, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return finish(o, material)


def cone(name, loc, r1, r2, depth, material, rot=(0, 0, 0), verts=12, smooth=True):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    return finish(o, material, smooth)


def cyl(name, loc, r, depth, material, rot=(0, 0, 0), verts=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    return finish(o, material)


def ring_(name, loc, R, r, material, rot=(0, 0, 0), scale=(1, 1, 1), maj=24, mn=8):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=maj, minor_segments=mn,
                                     location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return finish(o, material)


def chain(name, points, radii, material, seg=10, ring=6):
    """Smooth tube made of overlapping balls (tentacles, tails, crescents)."""
    for i, (p, r) in enumerate(zip(points, radii)):
        ball(f"{name}{i}", p, r, material, seg=seg, ring=ring)


def curve_points(p0, p1, p2, n):
    """n points on a quadratic Bezier curve."""
    out = []
    for i in range(n):
        t = i / (n - 1)
        out.append(tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c for a, b, c in zip(p0, p1, p2)))
    return out


def front(center, dims, x, z, side=-1):
    """Y of an ellipsoid's surface (front side=-1, back side=1) at x, z."""
    cx, cy, cz = center
    a, b, c = dims[0] / 2, dims[1] / 2, dims[2] / 2
    t = 1 - ((x - cx) / a) ** 2 - ((z - cz) / c) ** 2
    return cy + side * b * math.sqrt(max(t, 0))


def face(center, dims, eye_z, spread, eye_r=0.34, cheeks=True, mouth=True, cheek_z=None):
    """Big shiny chibi eyes, blush and a little smile on the front of an ellipsoid."""
    dark, white = mat("EyeDark", (25, 20, 30), 0.2), mat("EyeWhite", (255, 255, 255), 0.3)
    for sx in (-1, 1):
        ex = spread * sx
        ey = front(center, dims, ex, eye_z)
        ball(f"EyeWhite{sx}", (ex, ey + 0.06, eye_z), eye_r, white, scale=(1, 0.55, 1.15))
        ball(f"Pupil{sx}", (ex - 0.03 * sx, ey - 0.09, eye_z - 0.04), eye_r * 0.58, dark, scale=(1, 0.45, 1.25))
        ball(f"Shine{sx}", (ex - 0.1 * sx + 0.06, ey - 0.16, eye_z + 0.1), eye_r * 0.2, white)
        if cheeks:
            cz = cheek_z if cheek_z is not None else eye_z - eye_r * 1.6
            cx = ex * 1.5
            ball(f"Cheek{sx}", (cx, front(center, dims, cx, cz) + 0.05, cz), 0.19, mat("Cheek", (255, 135, 135), 0.6),
                 scale=(1, 0.4, 0.7))
    if mouth:
        mz = eye_z - eye_r * 1.9
        my = front(center, dims, 0, mz)
        o = ring_("Smile", (0, my - 0.01, mz + 0.06), 0.16, 0.035, dark, rot=(math.radians(90), 0, 0), maj=16, mn=5,
                  scale=(1, 1, 0.8))
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > 0.02], context="VERTS")
        bm.to_mesh(o.data)
        bm.free()


def scatter(name, center, dims, n, r, material, zmin=-1.0, zmax=1.0, side=-1, seed=1, scale=(1, 1, 1)):
    """Small bits stuck on an ellipsoid's surface (seeds, spots, sprinkles)."""
    rnd = random.Random(seed)
    cx, cy, cz = center
    a, b, c = dims[0] / 2, dims[1] / 2, dims[2] / 2
    for i in range(n):
        th = rnd.uniform(0, 2 * math.pi)
        u = rnd.uniform(zmin, zmax)
        k = math.sqrt(1 - u * u)
        x, y, z = cx + a * k * math.cos(th), cy + b * k * math.sin(th), cz + c * u
        if side and (y - cy) * side < 0 and rnd.random() < 0.6:
            continue
        ball(f"{name}{i}", (x, y, z), r, material, seg=6, ring=4, scale=scale)


# ---------------------------------------------------------------- creatures
GOLD = None
BLUE = None


def common():
    global GOLD, BLUE
    GOLD = mat("Gold", (255, 205, 70), 0.3, metal=0.4)
    BLUE = mat("LapisBlue", (40, 90, 200), 0.4)


def feet(x, y, z, size, material, claws=None):
    for sx in (-1, 1):
        blob(f"Foot{sx}", (x * sx, y, z), size, material)
        if claws:
            for t in (-1, 0, 1):
                cone(f"Toe{sx}{t}", (x * sx + size[0] * 0.28 * t, y - size[1] * 0.48, z - size[2] * 0.15), 0.09, 0.0, 0.25,
                     claws, rot=(math.radians(90), 0, 0), verts=6, smooth=False)


def nemes(head_c, head_d, top_z, drop=1.4, width=None, stripes=4):
    """Pharaoh nemes headdress: striped cap, side lappets and a golden cobra."""
    hx, hy, hz = head_c
    w = width or head_d[0] * 1.08
    blob("NemesCap", (hx, hy + 0.08, top_z), (w, head_d[1] * 1.05, head_d[2] * 0.75), GOLD)
    cap_h = head_d[2] * 0.75 / 2
    for i in range(stripes):
        dz = -0.05 + i * cap_h * 0.2
        rr = (w / 2) * math.sqrt(max(0.0, 1 - (dz / cap_h) ** 2)) + 0.01
        ring_(f"NemesStripe{i}", (hx, hy + 0.08, top_z + dz), rr, 0.05, BLUE,
              scale=(1, head_d[1] * 1.05 / w, 1), maj=28, mn=5)
    for sx in (-1, 1):
        x = (w * 0.5 - 0.1) * sx
        blob(f"Lappet{sx}", (x, hy - 0.25, hz - drop * 0.45), (0.45, 0.5, drop), GOLD)
        for i in range(3):
            blob(f"LappetStripe{sx}{i}", (x, hy - 0.26, hz - drop * 0.15 - i * 0.35), (0.47, 0.52, 0.1), BLUE)
    cy = front(head_c, head_d, 0, top_z - 0.15)
    blob("Cobra", (0, cy - 0.2, top_z), (0.22, 0.2, 0.5), GOLD)
    ball("CobraEye", (0, cy - 0.31, top_z + 0.1), 0.05, mat("Ruby", (230, 30, 50), 0.2))


def pharaoh_falafel():
    common()
    brown = mat("Falafel", (152, 96, 46), 0.75)
    crust = mat("Crust", (110, 62, 28), 0.85)
    sesame = mat("Sesame", (250, 238, 205), 0.5)
    herb = mat("FalafelGreen", (90, 160, 60), 0.7)
    C, D = (0, 0, 2.2), (3.4, 3.2, 3.3)
    blob("Falafel", C, D, brown, seg=24, ring=14)
    scatter("Crumb", C, D, 40, 0.13, crust, zmin=-0.8, zmax=0.6, seed=3, scale=(1, 1, 0.6))
    scatter("Sesame", C, D, 30, 0.06, sesame, zmin=-0.5, zmax=0.5, seed=5, scale=(1.6, 1, 0.8))
    # Green herb flecks (the inside of a real ta'meya peeking through).
    scatter("Herb", C, D, 12, 0.08, herb, zmin=-0.6, zmax=0.4, seed=9, scale=(1.4, 1, 0.6))
    face(C, D, 2.55, 0.6)
    nemes(C, D, 3.35, drop=1.6, width=3.5)
    # Ceremonial beard and golden collar.
    cyl("Beard", (0, front(C, D, 0, 1.25) + 0.05, 1.05), 0.17, 0.75, BLUE, verts=10)
    ring_("Collar", (0, 0, 1.05), 1.35, 0.14, GOLD, scale=(1, 0.95, 1))
    for sx in (-1, 1):
        blob(f"Arm{sx}", (1.65 * sx, -0.3, 1.7), (0.55, 0.55, 1.0), brown, rot=(0, math.radians(25 * sx), 0))
    # Crook held in one hand.
    cyl("Crook", (-1.85, -0.55, 1.75), 0.07, 2.2, BLUE, verts=8)
    ring_("CrookHook", (-1.65, -0.55, 2.85), 0.22, 0.07, GOLD, rot=(math.radians(90), 0, 0), maj=12, mn=5)
    feet(0.75, -0.35, 0.3, (0.8, 1.1, 0.6), crust)


def molokhia_kraken():
    common()
    green = mat("Molokhia", (46, 150, 70), 0.25)
    light = mat("Leaf", (120, 205, 95), 0.5)
    sucker = mat("Sucker", (210, 245, 170), 0.5)
    clay = mat("Clay", (180, 95, 55), 0.6)
    soup = mat("Soup", (60, 130, 40), 0.15)
    # Clay pot full of molokhia soup.
    cyl("Pot", (0, 0, 0.75), 1.9, 1.5, clay, verts=28)
    ring_("PotRim", (0, 0, 1.52), 1.95, 0.16, clay, maj=28)
    cyl("SoupTop", (0, 0, 1.45), 1.8, 0.12, soup, verts=28)
    # Head rising out of the soup.
    C, D = (0, 0.1, 3.0), (2.6, 2.4, 3.0)
    blob("Head", C, D, green, seg=24, ring=14)
    scatter("Leaf", C, D, 14, 0.2, light, zmin=0.1, zmax=0.9, side=0, seed=8, scale=(1.4, 0.5, 1))
    face(C, D, 2.85, 0.55, eye_r=0.38)
    # Eight tentacles spilling over the rim and curling at the tips.
    for i in range(8):
        a = math.radians(-90 + 45 * i + 22.5)
        ca, sa = math.cos(a), math.sin(a)
        p0 = (0.9 * ca, 0.9 * sa, 1.7)
        p1 = (2.3 * ca, 2.3 * sa, 2.0)
        p2 = (2.9 * ca, 2.9 * sa, 0.25)
        pts = curve_points(p0, p1, p2, 20)
        radii = [0.38 - 0.015 * k for k in range(20)]
        chain(f"Tentacle{i}", pts, radii, green, seg=8, ring=5)
        tip = pts[-1]
        ball(f"Curl{i}", (tip[0] + 0.25 * ca, tip[1] + 0.25 * sa, tip[2] + 0.15), 0.12, green, seg=8, ring=6)
        for k in (6, 10, 14):
            x, y, z = pts[k]
            ball(f"Sucker{i}{k}", (x, y, z - radii[k] * 0.85), radii[k] * 0.35, sucker, seg=8, ring=4,
                 scale=(1, 1, 0.5))
    # Golden spoon crown.
    cyl("SpoonHandle", (0.55, 0.25, 4.55), 0.06, 1.0, GOLD, rot=(0, math.radians(-25), 0), verts=8)
    blob("SpoonBowl", (0.85, 0.25, 5.05), (0.45, 0.3, 0.6), GOLD, rot=(0, math.radians(-25), 0))


def nile_phoenix():
    common()
    red = mat("PhoenixRed", (255, 120, 60), 0.4)
    orange = mat("PhoenixOrange", (255, 165, 40), 0.4)
    yellow = mat("PhoenixYellow", (255, 225, 80), 0.4, emit=0.6)
    flame = mat("Flame", (255, 150, 40), 0.3, emit=2.5)
    water = mat("NileWater", (40, 150, 230), 0.1)
    lotus = mat("Lotus", (250, 170, 210), 0.5)
    C, D = (0, 0, 2.3), (2.6, 2.4, 2.9)
    blob("Body", C, D, red, seg=24, ring=14)
    blob("Breast", (0, -0.55, 2.0), (1.8, 1.4, 2.0), orange)
    face(C, D, 2.85, 0.55, mouth=False)
    by = front(C, D, 0, 2.45)
    cone("Beak", (0, by - 0.25, 2.4), 0.24, 0.0, 0.6, GOLD, rot=(math.radians(90), 0, 0), verts=10)
    # Flame crest.
    for i, (x, z, h, rot) in enumerate([(0, 4.05, 1.1, 0), (-0.35, 3.85, 0.8, 25), (0.35, 3.85, 0.8, -25)]):
        cone(f"Crest{i}", (x, 0.1, z), 0.25, 0.0, h, flame, rot=(0, math.radians(rot), 0), verts=10)
    # Wings raised, three feathers each, red -> orange -> yellow.
    for sx in (-1, 1):
        for k, (m, length, ang) in enumerate([(red, 2.0, 20), (orange, 1.8, 45), (yellow, 1.5, 70)]):
            a = math.radians(ang)
            x = sx * (1.2 + 0.85 * math.cos(a) * 0.9)
            z = 2.6 + 0.85 * math.sin(a)
            blob(f"Feather{sx}{k}", (x, 0.35, z), (length, 0.22, 0.55), m,
                 rot=(0, math.radians(-ang * sx), 0))
    # Tail plume fanning up behind.
    for k in range(5):
        a = math.radians(-40 + 20 * k)
        m = (yellow, orange, flame, orange, yellow)[k]
        blob(f"Tail{k}", (1.0 * math.sin(a), 1.6, 1.9 + 0.9 * math.cos(a)), (0.4, 0.25, 1.9), m,
             rot=(math.radians(-35), a, 0))
    feet(0.55, -0.2, 0.55, (0.35, 0.6, 0.6), GOLD, claws=GOLD)
    # Standing on a ring of Nile water with lotus flowers.
    ring_("Nile", (0, 0, 0.12), 1.9, 0.22, water, scale=(1, 1, 0.5), maj=32)
    for i in range(4):
        a = math.radians(45 + 90 * i)
        for k in range(5):
            b = a + math.radians(72 * k)
            blob(f"Lotus{i}{k}", (1.9 * math.cos(a) + 0.18 * math.cos(b), 1.9 * math.sin(a) + 0.18 * math.sin(b), 0.32),
                 (0.3, 0.14, 0.35), lotus, rot=(0, math.radians(30), b))


def astro_sphinx():
    common()
    sand = mat("SphinxSand", (226, 196, 140), 0.65)
    shade = mat("SphinxShade", (195, 160, 105), 0.7)
    suit = mat("SpaceSuit", (245, 245, 250), 0.4)
    visor = mat("Visor", (120, 200, 255), 0.05, emit=0.4)
    star = mat("Star", (255, 225, 90), 0.3, emit=1.5)
    # Lion body lying down.
    B, BD = (0, 0.9, 1.0), (2.9, 4.2, 2.0)
    blob("Body", B, BD, sand, seg=24, ring=14)
    for sx in (-1, 1):
        blob(f"Paw{sx}", (0.75 * sx, -1.25, 0.38), (0.85, 1.9, 0.8), sand)
        for t in (-1, 0, 1):
            ball(f"PawToe{sx}{t}", (0.75 * sx + 0.2 * t, -2.15, 0.35), 0.13, shade)
        blob(f"Haunch{sx}", (1.0 * sx, 2.0, 0.85), (0.9, 1.6, 1.5), sand)
    chain("Tail", curve_points((0, 2.95, 0.8), (0.9, 3.6, 0.6), (1.2, 3.1, 1.6), 9), [0.16] * 8 + [0.26], shade)
    # Head with nemes.
    H, HD = (0, -0.75, 2.75), (2.0, 1.85, 2.0)
    blob("Head", H, HD, sand, seg=24, ring=14)
    face(H, HD, 2.85, 0.48, eye_r=0.3)
    nemes(H, HD, 3.45, drop=1.5, width=2.25)
    ball("Nose", (0, front(H, HD, 0, 2.55) - 0.02, 2.55), 0.1, shade)
    # Space gear: helmet ring, antenna with a star, chest emblem, backpack.
    ring_("HelmetRing", (0, -0.6, 1.8), 0.95, 0.15, suit, scale=(1, 0.9, 0.55))
    cyl("Antenna", (0.55, -0.4, 4.6), 0.04, 1.0, suit, verts=8)
    ball("AntennaStar", (0.55, -0.4, 5.15), 0.17, star)
    blob("Backpack", (0, 1.1, 2.0), (1.4, 0.8, 1.0), suit)
    for sx in (-1, 1):
        cyl(f"Thruster{sx}", (0.45 * sx, 1.45, 1.75), 0.18, 0.5, visor, verts=12)
    blob("Badge", (0, front(B, BD, 0, 1.15) - 0.05, 1.2), (0.5, 0.12, 0.5), visor)


def ful_moon():
    common()
    bean = mat("FulBean", (196, 160, 104), 0.55)
    dark = mat("BeanEye", (120, 85, 50), 0.6)
    moon = mat("MoonGlow", (255, 240, 170), 0.4, emit=1.2)
    oil = mat("OliveOil", (210, 200, 60), 0.05)
    clay = mat("Idra", (170, 90, 50), 0.6)
    cumin = mat("Cumin", (150, 95, 45), 0.8)
    # The bean: a big kidney-shaped body (two overlapping ellipsoids), sitting on a little idra pot.
    cyl("Pot", (0, 0, 0.45), 1.15, 0.9, clay, verts=24)
    ring_("PotRim", (0, 0, 0.92), 1.15, 0.13, clay)
    C, D = (0, 0, 2.6), (2.6, 2.1, 3.2)
    blob("Bean", C, D, bean, seg=24, ring=14)
    blob("BeanBulge", (0, 0.1, 3.6), (2.3, 1.95, 1.6), bean)
    blob("BeanHilum", (1.25, -0.1, 2.5), (0.15, 0.6, 1.1), dark)  # the bean's dark "eye" stripe
    face(C, D, 3.1, 0.52)
    # Olive-oil drip on top and cumin sprinkles.
    blob("Oil", (0, -0.1, 4.33), (0.9, 0.8, 0.25), oil)
    scatter("Cumin", (0, 0, 3.6), (2.3, 1.95, 1.6), 18, 0.05, cumin, zmin=0.4, zmax=0.95, side=0, seed=4)
    for sx in (-1, 1):
        blob(f"Arm{sx}", (1.35 * sx, -0.4, 2.2), (0.45, 0.45, 0.95), bean, rot=(0, math.radians(30 * sx), 0))
    # Glowing crescent moon behind (balls along an arc, thinner at the tips) and three stars.
    pts, radii = [], []
    n = 32
    for i in range(n):
        a = math.radians(-120 + 240 * i / (n - 1))
        pts.append((1.75 * math.sin(a), 1.5, 3.0 + 1.75 * math.cos(a)))
        radii.append(0.08 + 0.38 * math.sin(math.pi * i / (n - 1)))
    chain("Crescent", pts, radii, moon, seg=8, ring=6)
    for i, (x, z, r) in enumerate([(-1.9, 4.6, 0.18), (2.1, 4.2, 0.14), (-2.2, 2.0, 0.12)]):
        for k in range(5):
            a = math.radians(72 * k)
            cone(f"Star{i}{k}", (x + r * math.sin(a), 1.2, z + r * math.cos(a)), r * 0.55, 0, r * 1.6, moon,
                 rot=(0, a, 0), verts=4, smooth=False)


def basbousa_cat():
    common()
    cake = mat("Basbousa", (232, 170, 70), 0.35)
    top = mat("Syrup", (205, 120, 35), 0.1)
    almond = mat("Almond", (250, 235, 205), 0.5)
    pink = mat("EarPink", (255, 160, 160), 0.6)
    # Body and head are two golden basbousa pieces with syrup-glazed tops.
    B, BD = (0, 0.1, 1.35), (2.6, 2.4, 2.3)
    blob("Body", B, BD, cake, seg=24, ring=14)
    H, HD = (0, -0.2, 3.25), (2.6, 2.2, 2.1)
    blob("Head", H, HD, cake, seg=24, ring=14)
    blob("Glaze", (0, -0.2, 3.95), (2.3, 1.9, 0.8), top)
    # Diamond score lines of the cake (thin dark rings at an angle).
    for k in range(3):
        ring_(f"Score{k}", (0, 0.1, 0.9 + 0.45 * k), 1.27 - 0.08 * abs(k - 1), 0.03, top, maj=28, mn=4,
              rot=(math.radians(8 * (k - 1)), 0, 0), scale=(1, 0.93, 1))
    blob("AlmondTop", (0, -0.35, 4.33), (0.42, 0.25, 0.75), almond, rot=(math.radians(-70), 0, 0))
    face(H, HD, 3.3, 0.55)
    ball("CatNose", (0, front(H, HD, 0, 2.95) - 0.01, 2.95), 0.09, pink, scale=(1.3, 0.8, 0.8))
    dark = mat("EyeDark", (25, 20, 30), 0.2)
    for sx in (-1, 1):
        cone(f"Ear{sx}", (0.8 * sx, -0.15, 4.25), 0.5, 0.05, 0.85, cake, rot=(0, math.radians(18 * sx), 0), verts=4)
        cone(f"EarIn{sx}", (0.8 * sx, -0.35, 4.2), 0.3, 0.03, 0.6, pink, rot=(0, math.radians(18 * sx), 0), verts=4)
        for k in (-1, 1):
            cyl(f"Whisker{sx}{k}", (1.25 * sx, front(H, HD, 1.0, 2.95) - 0.05, 2.95 + 0.1 * k), 0.025, 0.9, dark,
                rot=(0, math.radians(90 + 10 * k * sx), 0), verts=5)
        blob(f"Paw{sx}", (0.65 * sx, -1.0, 0.35), (0.7, 0.9, 0.6), cake)
    chain("Tail", curve_points((0, 1.25, 0.6), (1.6, 2.0, 0.6), (1.3, 1.6, 2.4), 12),
          [0.24] * 11 + [0.3], cake)
    # Trophy crown: these creatures only come from the Weekly Trials.
    ring_("Crown", (0, -0.15, 4.45), 0.55, 0.08, GOLD, scale=(1, 0.9, 1), maj=18)
    for k in range(5):
        a = math.radians(72 * k)
        cone(f"CrownPoint{k}", (0.55 * math.sin(a), -0.15 + 0.5 * math.cos(a), 4.7), 0.12, 0.0, 0.4, GOLD, verts=6)


def shawarma_sultan():
    common()
    bread = mat("Saj", (240, 205, 150), 0.7)
    toast = mat("Toasted", (196, 120, 60), 0.7)
    meat = mat("Meat", (140, 75, 40), 0.75)
    lettuce = mat("Lettuce", (120, 200, 70), 0.5)
    tomato = mat("Tomato", (225, 50, 40), 0.35)
    paper = mat("Paper", (250, 250, 245), 0.8)
    turban = mat("Turban", (250, 245, 235), 0.6)
    jewel = mat("Emerald", (30, 200, 120), 0.1, emit=0.5)
    # The wrap: a tall rounded roll, paper wrapper on the bottom half.
    C, D = (0, 0, 2.3), (2.3, 2.1, 3.9)
    blob("Wrap", C, D, bread, seg=24, ring=14)
    scatter("Grill", C, D, 12, 0.14, toast, zmin=-0.3, zmax=0.6, seed=11, scale=(1.5, 1, 0.5))
    cyl("Paper", (0, 0, 1.05), 1.18, 1.9, paper, verts=24)
    ring_("PaperTop", (0, 0, 2.0), 1.18, 0.06, paper)
    # Filling poking out of the top.
    for i in range(10):
        a = math.radians(36 * i)
        blob(f"Meat{i}", (0.55 * math.cos(a), 0.5 * math.sin(a), 4.15), (0.55, 0.3, 0.4), meat, rot=(0, 0, a))
    for i in range(6):
        a = math.radians(60 * i + 20)
        blob(f"Lettuce{i}", (0.6 * math.cos(a), 0.55 * math.sin(a), 4.3), (0.6, 0.12, 0.45), lettuce,
             rot=(math.radians(20), 0, a + 1.57))
    for i in range(3):
        a = math.radians(120 * i)
        cyl(f"Tomato{i}", (0.35 * math.cos(a), 0.3 * math.sin(a), 4.38), 0.22, 0.08, tomato, verts=12,
            rot=(math.radians(30), 0, a))
    face(C, D, 3.0, 0.5)
    # Sultan's turban sitting on the filling, with a jewel and feather.
    blob("Turban", (0, 0.05, 4.65), (2.0, 1.9, 1.0), turban)
    ring_("TurbanWrap", (0, 0.05, 4.55), 0.9, 0.18, turban, scale=(1, 0.95, 1))
    ball("Jewel", (0, -0.9, 4.75), 0.2, jewel, scale=(1, 0.6, 1.2))
    ring_("JewelSetting", (0, -0.85, 4.75), 0.22, 0.05, GOLD, rot=(math.radians(90), 0, 0), maj=14, mn=5)
    blob("Feather", (0.15, -0.6, 5.5), (0.3, 0.15, 1.3), mat("Plume", (230, 60, 80), 0.5), rot=(0, math.radians(15), 0))
    # Arms (one holding a garlic-sauce cup) and shoes with curled tips.
    for sx in (-1, 1):
        blob(f"Arm{sx}", (1.3 * sx, -0.2, 2.5), (0.45, 0.45, 1.0), bread, rot=(0, math.radians(30 * sx), 0))
        blob(f"Shoe{sx}", (0.55 * sx, -0.35, 0.2), (0.6, 1.1, 0.4), GOLD)
        ball(f"ShoeTip{sx}", (0.55 * sx, -0.95, 0.42), 0.12, GOLD)
    cyl("ToumCup", (1.6, -0.55, 1.95), 0.3, 0.5, paper, verts=14)
    cyl("Toum", (1.6, -0.55, 2.2), 0.27, 0.05, mat("Garlic", (255, 255, 240), 0.3), verts=14)


CREATURES = {
    "PharaohFalafel": pharaoh_falafel,
    "MolokhiaKraken": molokhia_kraken,
    "NilePhoenix": nile_phoenix,
    "AstroSphinx": astro_sphinx,
    "FulMoon": ful_moon,
    "BasbousaCat": basbousa_cat,
    "ShawarmaSultan": shawarma_sultan,
}


# ---------------------------------------------------------------- build, render, export
def build(name, out):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    parts.clear()
    CREATURES[name]()
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Stand exactly on the ground.
    low = min(v.co.z for v in obj.data.vertices)
    for v in obj.data.vertices:
        v.co.z -= low
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    print("TRIANGLES", name, tris, "SIZE", [round(x, 2) for x in obj.dimensions])
    assert tris <= 20000, "Roblox MeshPart limit is 20,000 triangles"

    scene = bpy.context.scene
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    bpy.context.object.data.materials.append(mat("Ground", (255, 214, 120), 0.9))
    world = bpy.data.worlds.new("W")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.62, 1.0, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(32), math.radians(8), math.radians(-30)))
    bpy.context.object.data.energy = 3.5
    bpy.context.object.data.angle = math.radians(8)
    size = max(obj.dimensions)
    target = Vector((0, 0, obj.dimensions.z * 0.48))
    bpy.ops.object.camera_add(location=target + Vector((0.5, -0.85, 0.32)).normalized() * size * 3.3)
    cam = bpy.context.object
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 55
    scene.camera = cam
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 1000
    scene.view_settings.view_transform = "Standard"
    scene.render.filepath = os.path.join(out, f"{name}_preview.png")
    bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.fbx(filepath=os.path.join(out, f"{name}.fbx"), use_selection=True, apply_unit_scale=True,
                             global_scale=1.0, axis_forward="-Z", axis_up="Y", mesh_smooth_type="FACE")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f"{name}.blend"))


if __name__ == "__main__":
    which, out = sys.argv[-2], sys.argv[-1]
    os.makedirs(out, exist_ok=True)
    for n in (CREATURES if which == "all" else [which]):
        build(n, out)
    print("DONE")
