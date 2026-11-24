#!/usr/bin/env python3
"""The kit's shading layer: Blender-baked ambient occlusion (bake_player_ao.py) made a little stronger, times a
fine knit pattern so the shirt reads as cloth. The game multiplies it over the painted kit (material detail layer,
multiply, in the kit's UV layout).

  python3 tools/blender/make_kit_shade.py <player_kit_ao.png> assets/kit_shade.png
"""
import sys

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
N = 1024
ao = Image.open(src).convert("L").resize((N, N), Image.BILINEAR)
a = ao.load()
img = Image.new("L", (N, N))
p = img.load()
for y in range(N):
    for x in range(N):
        v = a[x, y] / 255.0
        if v < 0.02:          # outside the UV islands: nothing to darken
            v = 1.0
        if 420 <= y < 600:    # shorts and sock tops (KitPainter rows 420..600): their UV islands overlap, the bake
            v = 1.0           # there is garbage; they keep the knit only
        v = v ** 1.6          # the bake is soft: stronger folds and armpits read at broadcast distance
        knit = 1.0 - 0.07 * (((x + y) // 2) % 2) - 0.03 * (((x - y) // 3) % 2)
        p[x, y] = max(0, min(255, int(255 * v * knit)))
img.save(out)
print(out, img.size)
