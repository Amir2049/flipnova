#!/usr/bin/env python3
"""Skin detail maps for the players from MakeHuman's CC0 skins (makehuman_system_assets, skins/young_*_male).

  python3 tools/make_skin_detail.py <young_lightskinned_male_diffuse.png> <young_darkskinned_male_diffuse.png> assets/

The game colours every player's skin with his own tone; these maps carry what a flat tone lacks - the face (eyes,
brows, lips, the shading of nose and cheeks), the hands and knees, pores. Each map is the skin texture divided by
its own typical skin colour, so it is ~1.0 on plain skin and darker / redder on features, then stored x STORE so
it fits a texture; the material multiplies the tone by 1 / STORE. Two maps: features drawn on light and on dark
skin read differently, the game picks by tone.
"""
import sys

import numpy as np
from PIL import Image

STORE = 0.78
light, dark, out = sys.argv[1], sys.argv[2], sys.argv[3]
for src, name in ((light, "skin_detail_light.jpg"), (dark, "skin_detail_dark.jpg")):
    im = np.asarray(Image.open(src).convert("RGB"), np.float32) / 255.0
    lum = im @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    # typical skin: the median of the texels that are skin (not the black background of the atlas)
    mask = lum > 0.05
    ref = np.median(im[mask], axis=0)
    d = im / np.maximum(ref, 1e-3)
    # keep the features, tame the extremes (hair stubble, the atlas' black borders)
    d = np.clip(d, 0.35, 1.25)
    d[~mask] = 1.0
    small = Image.fromarray(np.clip(d * STORE * 255.0, 0, 255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS)
    small.save(out.rstrip("/") + "/" + name, quality=88)
    print("wrote", name, "ref", np.round(ref, 3))
