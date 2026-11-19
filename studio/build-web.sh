#!/usr/bin/env bash
# Packs the whole studio into one file: dist/NOVA-STUDIO.html (works offline, double-click to open).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
python3 - <<'PY'
import re
html = open('index.html').read()
html = html.replace('<link rel="stylesheet" href="css/studio.css">', '<style>' + open('css/studio.css').read() + '</style>')
def inline(m):
    return '<script>' + open(m.group(1)).read().replace('</script', '<\\/script') + '</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
open('dist/NOVA-STUDIO.html', 'w').write(html)
PY
ls -la dist/NOVA-STUDIO.html
