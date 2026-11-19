#!/usr/bin/env bash
# Packs the computer version: dist/FLIPNOVA.html (one file — double-click to play) and a zip of the folder.
# Works offline; the world board and gift codes need internet.
set -e
cd "$(dirname "$0")/.."
OUT=dist/FLIPNOVA-web.zip
TMP=$(mktemp -d)
mkdir -p "$TMP/FLIPNOVA"
bash tools/build-dist.sh
cp -r build/www/. "$TMP/FLIPNOVA/"
cat > "$TMP/FLIPNOVA/HOW TO PLAY.txt" <<'TXT'
FLIPNOVA — computer version

1. Unzip this folder anywhere.
2. Double-click index.html (it opens in your browser: Chrome, Edge or Firefox).
3. Play: click or press SPACE / UP to flip gravity. ESC or P pauses.
   Press F11 for full screen.

The game works offline. The world leaderboard and gift codes need internet.
TXT
rm -f "$OUT"
(cd "$TMP" && zip -qr - FLIPNOVA) > "$OUT"
rm -rf "$TMP"
node tools/build-single.js
ls -la "$OUT"
