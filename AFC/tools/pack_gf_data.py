#!/usr/bin/env python3
"""Pack the data Google Research Football's engine reads when it runs headless (inside AFC) into one zip.

  python3 tools/pack_gf_data.py <football>/third_party/gfootball_engine/data assets/gfdata.zip

What goes in: every animation (.anim, the players' movement library), the .util files, the models and object
descriptions the engine builds its scene from (players, ball, goals, pitch, officials, hair). Images are only drawn
by the engine's own renderer, which AFC does not use, so each is a 1x1 placeholder under the same name. The two
team kit images get neutral names (see native/patches). The game unzips this into user:// on first run.
"""
import struct
import sys
import zipfile
from pathlib import Path

KEEP_DIRS = ["media/animations", "media/objects/players", "media/objects/balls", "media/objects/stadiums/goals.object",
             "media/objects/stadiums/goals.ase", "media/objects/stadiums/test", "media/objects/officials",
             "media/objects/lighting", "media/objects/menu", "media/textures/pitch"]
IMAGE_EXT = {".bmp", ".png", ".jpg", ".jpeg", ".tga"}
# images the engine opens by name (from a trace of a headless match) besides those under the folders above
EXTRA_IMAGES = ["media/menu/main/loading01.bmp", "media/menu/radar/radar.bmp", "media/menu/scoreboard_bg.bmp",
                "media/menu/league.bmp", "databases/default/images_teams/afc/home_kit_01.bmp",
                "databases/default/images_teams/afc/home_kit_02.bmp", "databases/default/images_teams/afc/away_kit_01.bmp",
                "databases/default/images_teams/afc/away_kit_02.bmp", "databases/default/images_teams/afc/home_logo.png",
                "databases/default/images_teams/afc/away_logo.png", "databases/default/images_teams/afc/home_logo.bmp",
                "databases/default/images_teams/afc/away_logo.bmp"]


def tiny_bmp():
    # 1x1 24-bit BMP, white
    pixel = b"\xff\xff\xff\x00"
    header = b"BM" + struct.pack("<IHHI", 14 + 40 + len(pixel), 0, 0, 54)
    info = struct.pack("<IiiHHIIiiII", 40, 1, 1, 1, 24, 0, len(pixel), 2835, 2835, 0, 0)
    return header + info + pixel


def main(src, out):
    src = Path(src)
    blank = tiny_bmp()
    n = 0
    raw = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for d in KEEP_DIRS:
            p = src / d
            files = [p] if p.is_file() else sorted(x for x in p.rglob("*") if x.is_file())
            for f in files:
                rel = f.relative_to(src).as_posix()
                if f.suffix.lower() in IMAGE_EXT:
                    z.writestr(rel, blank)
                else:
                    z.write(f, rel)
                    raw += f.stat().st_size
                n += 1
        for rel in EXTRA_IMAGES:
            z.writestr(rel, blank)
            n += 1
        # the engine lists the team image folders and the stadium folder
        for d in ["databases/default/images_teams/afc/", "media/menu/main/", "media/menu/radar/"]:
            z.writestr(d + ".keep", b"")
    print(f"{out}: {n} files, {raw / 1e6:.1f} MB of data, zip {Path(out).stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
