#!/usr/bin/env bash
# Builds dist/FLIPNOVA-Windows.zip: the single-file game (dist/FLIPNOVA.html, or $1) inside a portable Electron app.
# Unzip anywhere and double-click Flippo.exe. Needs curl, unzip, zip and internet (downloads Electron once).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="${1:-$ROOT/dist/FLIPNOVA.html}"
EV=33.4.11
CACHE="$ROOT/build/electron-v$EV-win32-x64.zip"
OUT="$ROOT/build/windows/FLIPNOVA"
mkdir -p "$ROOT/build"
[ -f "$CACHE" ] || curl -sSL -o "$CACHE" "https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-win32-x64.zip"
rm -rf "$OUT" && mkdir -p "$OUT" && unzip -q "$CACHE" -d "$OUT"
mv "$OUT/electron.exe" "$OUT/Flippo.exe"
rm -f "$OUT/LICENSES.chromium.html" "$OUT/resources/default_app.asar"
(cd "$OUT/locales" && ls | grep -v -E '^(en-US|ar)\.pak$' | xargs rm -f)
mkdir -p "$OUT/resources/app"
cp "$HTML" "$OUT/resources/app/index.html"
cp "$ROOT/desktop/main.js" "$ROOT/desktop/package.json" "$OUT/resources/app/"
cp "$ROOT/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" "$OUT/resources/app/icon.png"
cp "$ROOT/desktop/README.txt" "$OUT/README.txt"
mkdir -p "$ROOT/dist" && rm -f "$ROOT/dist/FLIPNOVA-Windows.zip"
(cd "$ROOT/build/windows" && zip -qr -9 "$ROOT/dist/FLIPNOVA-Windows.zip" FLIPNOVA)
ls -la "$ROOT/dist/FLIPNOVA-Windows.zip"
