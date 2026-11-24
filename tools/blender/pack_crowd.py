#!/usr/bin/env python3
"""Pack the fan renders of make_crowd.py into one atlas: column = fan, row 0 calm, row 1 cheering.

  python3 tools/blender/pack_crowd.py <render dir> assets/stadium/crowd_atlas.png
"""
import glob
import os
import sys

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
calm = sorted(glob.glob(os.path.join(src, "fan_*_0.png")))
n = len(calm)
w, h = Image.open(calm[0]).size
atlas = Image.new("RGBA", (w * n, h * 2), (0, 0, 0, 0))
for i, f in enumerate(calm):
    atlas.paste(Image.open(f), (i * w, 0))
    atlas.paste(Image.open(f.replace("_0.png", "_1.png")), (i * w, h))
atlas.save(out)
print(out, atlas.size, n, "fans")
