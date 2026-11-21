#!/usr/bin/env python3
"""Make the download page files for a build that is too big to send in chat.

  python3 tools/release/make_release.py AFC-2.17.apk 2.17 OUTDIR news.txt

OUTDIR gets index.html (from afc-download.html) and build/afc-<version>.partN.txt: the APK zipped as
AFC-<version>.zip, then base64 in parts of 10,400,000 characters (published files have a size cap and only text and
media types are served). The page joins and decodes the parts and offers the zip for saving. news.txt: one line
per item for "what's new". Publish OUTDIR/index.html with the parts as files, and remove the old version's parts.
"""
import base64
import html
import json
import os
import sys
import zipfile

PART = 10_400_000


def main(apk, version, out, news_path):
    os.makedirs(os.path.join(out, 'build'), exist_ok=True)
    zname = 'AFC-%s.zip' % version
    zpath = os.path.join(out, zname)
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_STORED) as z:
        z.write(apk, 'AFC-%s.apk' % version)
    data = open(zpath, 'rb').read()
    text = base64.b64encode(data).decode()
    parts = []
    for i in range(0, len(text), PART):
        name = 'build/afc-%s.part%d.txt' % (version, len(parts))
        with open(os.path.join(out, name), 'w') as f:
            f.write(text[i:i + PART])
        parts.append(name)
    build = {'version': version, 'zip': zname, 'apk': 'AFC-%s.apk' % version, 'size': len(data),
             'textSize': len(text), 'parts': parts}
    news = [l.strip() for l in open(news_path, encoding='utf-8') if l.strip()]
    here = os.path.dirname(os.path.abspath(__file__))
    page = open(os.path.join(here, 'afc-download.html'), encoding='utf-8').read()
    page = page.replace('{{VERSION}}', version).replace('{{SIZE_MB}}', '%.1f' % (len(data) / 1048576))
    page = page.replace('{{NEWS}}', '\n'.join('      <li>%s</li>' % html.escape(n) for n in news))
    page = page.replace('{{BUILD}}', json.dumps(build, indent=2, ensure_ascii=False))
    with open(os.path.join(out, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page)
    os.remove(zpath)
    print('%s: %d bytes zipped, %d parts' % (out, len(data), len(parts)))
    for p in parts:
        print('  ' + p)


if __name__ == '__main__':
    main(*sys.argv[1:5])
