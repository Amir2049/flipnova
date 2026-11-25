#!/usr/bin/env python3
"""Finish the Blender key art (tools/blender/make_key_art.py) as a painted poster for the menus.

  python3 tools/key_art_post.py <render.png> assets/menu_key_art.jpg

Steps: a painterly pass (edge-preserving smoothing, so the crowd and the stand read as brush work and the noise
goes), bloom round the floodlights, a split-tone grade in the menus' colours (night navy in the shadows,
floodlight gold in the highlights), the sky pulled down to night, a vignette. The floodlight's glow and beams are not baked in:
scripts/ui/menu_stage.gd animates them (its LAMP is where the lamp head sits in the picture).
"""
import sys

import cv2
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
img = cv2.imread(src, cv2.IMREAD_COLOR).astype(np.float32) / 255.0
h, w = img.shape[:2]

# 1. painted: an edge-preserving stylisation blended in (the picture stays a photo of our stadium, painted over)
u8 = (img * 255).astype(np.uint8)
paint = cv2.stylization(u8, sigma_s=45, sigma_r=0.22).astype(np.float32) / 255.0
oil = cv2.xphoto.oilPainting(u8, 5, 1).astype(np.float32) / 255.0
img = img * 0.35 + paint * 0.4 + oil * 0.25

# 2. the night: darken the sky band towards the top
yy = np.linspace(0, 1, h)[:, None, None]
img *= 0.55 + 0.45 * np.clip(yy / 0.45, 0, 1) ** 0.8

# 3. bloom from what is bright (lamps, chalk in the light)
lum = img @ np.array([0.0722, 0.7152, 0.2126], np.float32)   # BGR
bright = img * np.clip((lum - 0.62) / 0.38, 0, 1)[..., None]
bloom = cv2.GaussianBlur(bright, (0, 0), w * 0.012) * 0.9 + cv2.GaussianBlur(bright, (0, 0), w * 0.05) * 0.8
img = img + bloom * np.array([0.85, 0.93, 1.0], np.float32)   # warm (BGR)

# 4. split tone: shadows to night navy, highlights to floodlight gold
lum = img @ np.array([0.0722, 0.7152, 0.2126], np.float32)
navy = np.array([0.30, 0.10, 0.03], np.float32)   # BGR of a deep blue
gold = np.array([0.55, 0.82, 1.0], np.float32)
t = np.clip(lum, 0, 1)[..., None]
img = img * (0.78 + 0.22 * t) + navy * (1 - t) ** 2 * 0.22 + gold * t ** 3 * 0.12
# a little more colour in the grass and the seats
grey = (img @ np.array([0.0722, 0.7152, 0.2126], np.float32))[..., None]
img = grey + (img - grey) * 1.18

# 5. vignette
xx = np.linspace(-1, 1, w)[None, :]
yv = np.linspace(-1, 1, h)[:, None]
v = 1.0 - 0.42 * np.clip((xx ** 2 * 0.8 + yv ** 2) - 0.25, 0, 1)
img *= v[..., None]

out = np.clip(img, 0, 1)
cv2.imwrite(dst, (out * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 86])
print("wrote", dst, "%dx%d" % (w, h))
