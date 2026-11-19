#!/usr/bin/env bash
# Makes build/www: the game as it ships (APK + computer version). JavaScript is minified and every
# comment is stripped, so the shipped files don't explain how the game or its private tools work.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/build/www"
rm -rf "$OUT" && mkdir -p "$OUT/js" "$OUT/css"
cp -r "$ROOT/fonts" "$ROOT/icons" "$ROOT/manifest.webmanifest" "$OUT/"
TERSER="npx -y terser@5.31.6"
for f in "$ROOT"/js/*.js; do
  $TERSER "$f" --compress --mangle --comments false -o "$OUT/js/$(basename "$f")" 2>/dev/null
done
# CSS and HTML: drop comments only
python3 - "$ROOT" "$OUT" <<'PY'
import re, sys
root, out = sys.argv[1], sys.argv[2]
css = open(root + '/css/style.css', encoding='utf-8').read()
open(out + '/css/style.css', 'w', encoding='utf-8').write(re.sub(r'/\*.*?\*/', '', css, flags=re.S))
fc = open(root + '/fonts/cairo.css', encoding='utf-8').read()
open(out + '/fonts/cairo.css', 'w', encoding='utf-8').write(re.sub(r'/\*.*?\*/', '', fc, flags=re.S))
html = open(root + '/index.html', encoding='utf-8').read()
open(out + '/index.html', 'w', encoding='utf-8').write(re.sub(r'<!--.*?-->', '', html, flags=re.S))
PY
echo "build/www ready ($(du -sh "$OUT" | cut -f1))"
