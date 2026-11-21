#!/usr/bin/env python3
"""Package a self-contained web page (AFC, or the browser lab) as an Android APK that runs offline.

No Android SDK needed: the app is one Activity holding a full-screen WebView that opens
assets/index.html (the lab page with three.js and the WebAssembly core inlined). The tiny
classes.dex is written here byte by byte, aapt2 (prebuilt, from the Apktool repository) builds
the manifest and resources, and the APK is aligned and signed (APK Signature Scheme v2) here.

  python3 Tools/android/build_apk.py --aapt2 <aapt2> --framework <android-framework.jar> \
      --page Tools/web/build/hara_lab.html --three <three.min.js> --out HaraLab.apk
  python3 Tools/android/build_apk.py --aapt2 <aapt2> --framework <android-framework.jar> \
      --page afc_apk.html --full-page --package com.afc.game --label AFC --icon afc --out AFC.apk

The final game is built from Unreal (Android target); this APK is for trying the gameplay.
"""
import argparse
import datetime
import hashlib
import io
import os
import shutil
import struct
import subprocess
import tempfile
import zipfile
import zlib
from pathlib import Path

PKG = "com.hara.lab"
ACT = "Lcom/hara/lab/MainActivity;"


def set_package(pkg):
    global PKG, ACT
    PKG = pkg
    ACT = "L" + pkg.replace(".", "/") + "/MainActivity;"

# ----------------------------------------------------------------------------------- DEX writer


def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def shorty_char(t):
    return "L" if t[0] in "L[" else t


def build_dex():
    # Methods we call: (class, name, return, params)
    M = {
        "act_init": ("Landroid/app/Activity;", "<init>", "V", ()),
        "act_onCreate": ("Landroid/app/Activity;", "onCreate", "V", ("Landroid/os/Bundle;",)),
        "act_setContentView": ("Landroid/app/Activity;", "setContentView", "V", ("Landroid/view/View;",)),
        "act_getWindow": ("Landroid/app/Activity;", "getWindow", "Landroid/view/Window;", ()),
        "win_addFlags": ("Landroid/view/Window;", "addFlags", "V", ("I",)),
        "win_getDecorView": ("Landroid/view/Window;", "getDecorView", "Landroid/view/View;", ()),
        "view_setSUI": ("Landroid/view/View;", "setSystemUiVisibility", "V", ("I",)),
        "wv_init": ("Landroid/webkit/WebView;", "<init>", "V", ("Landroid/content/Context;",)),
        "wv_getSettings": ("Landroid/webkit/WebView;", "getSettings", "Landroid/webkit/WebSettings;", ()),
        "wv_loadUrl": ("Landroid/webkit/WebView;", "loadUrl", "V", ("Ljava/lang/String;",)),
        "ws_js": ("Landroid/webkit/WebSettings;", "setJavaScriptEnabled", "V", ("Z",)),
        "ws_dom": ("Landroid/webkit/WebSettings;", "setDomStorageEnabled", "V", ("Z",)),
        "ws_media": ("Landroid/webkit/WebSettings;", "setMediaPlaybackRequiresUserGesture", "V", ("Z",)),
        "my_init": (ACT, "<init>", "V", ()),
        "my_onCreate": (ACT, "onCreate", "V", ("Landroid/os/Bundle;",)),
    }
    URL = "file:///android_asset/index.html"
    types = set()
    strings = {URL}
    protos = set()
    for cls, name, ret, params in M.values():
        types.add(cls)
        types.add(ret)
        types.update(params)
        strings.add(name)
        protos.add((ret, params))
    for t in types:
        strings.add(t)
    proto_shorty = {p: shorty_char(p[0]) + "".join(shorty_char(x) for x in p[1]) for p in protos}
    strings.update(proto_shorty.values())

    def key16(s):  # DEX orders strings by UTF-16 code units
        return s.encode("utf-16-be")

    str_list = sorted(strings, key=key16)
    sidx = {s: i for i, s in enumerate(str_list)}
    type_list = sorted(types, key=lambda t: sidx[t])
    tidx = {t: i for i, t in enumerate(type_list)}
    proto_list = sorted(protos, key=lambda p: (tidx[p[0]], [tidx[x] for x in p[1]]))
    pidx = {p: i for i, p in enumerate(proto_list)}
    meth_keys = sorted(M.keys(), key=lambda k: (tidx[M[k][0]], sidx[M[k][1]], pidx[(M[k][2], M[k][3])]))
    midx = {k: i for i, k in enumerate(meth_keys)}

    # --- code
    def invoke(op, m, regs):
        a = len(regs)
        r = list(regs) + [0] * (5 - a)
        return [(a << 12) | (r[4] << 8) | op, midx[m], (r[3] << 12) | (r[2] << 8) | (r[1] << 4) | r[0]]

    INV_VIRTUAL, INV_SUPER, INV_DIRECT = 0x6E, 0x6F, 0x70

    def move_obj(a):
        return [(a << 8) | 0x0C]

    def const4(a, v):
        return [((v & 0xF) << 12) | (a << 8) | 0x12]

    def const16(a, v):
        return [(a << 8) | 0x13, v & 0xFFFF]

    init_code = invoke(INV_DIRECT, "act_init", [0]) + [0x000E]
    this, bundle = 6, 7
    oc = []
    oc += invoke(INV_SUPER, "act_onCreate", [this, bundle])
    oc += invoke(INV_VIRTUAL, "act_getWindow", [this]) + move_obj(4)
    oc += const16(5, 0x80) + invoke(INV_VIRTUAL, "win_addFlags", [4, 5])           # keep screen on
    oc += invoke(INV_VIRTUAL, "win_getDecorView", [4]) + move_obj(4)
    oc += const16(5, 0x1706) + invoke(INV_VIRTUAL, "view_setSUI", [4, 5])           # immersive full screen
    oc += [(0 << 8) | 0x22, tidx["Landroid/webkit/WebView;"]]                      # new-instance v0
    oc += invoke(INV_DIRECT, "wv_init", [0, this])
    oc += invoke(INV_VIRTUAL, "wv_getSettings", [0]) + move_obj(1)
    oc += const4(2, 1)
    oc += invoke(INV_VIRTUAL, "ws_js", [1, 2]) + invoke(INV_VIRTUAL, "ws_dom", [1, 2])
    oc += const4(3, 0) + invoke(INV_VIRTUAL, "ws_media", [1, 3])
    oc += invoke(INV_VIRTUAL, "act_setContentView", [this, 0])
    oc += [(3 << 8) | 0x1A, sidx[URL]]                                               # const-string v3
    oc += invoke(INV_VIRTUAL, "wv_loadUrl", [0, 3])
    oc += [0x000E]
    codes = [("my_init", 1, 1, 1, init_code, 0x10001), ("my_onCreate", 8, 2, 2, oc, 0x0001)]

    # --- layout
    n_s, n_t, n_p, n_m = len(str_list), len(type_list), len(proto_list), len(meth_keys)
    off = 0x70
    string_ids_off = off; off += 4 * n_s
    type_ids_off = off; off += 4 * n_t
    proto_ids_off = off; off += 12 * n_p
    method_ids_off = off; off += 8 * n_m
    class_defs_off = off; off += 32
    data_off = off

    data = bytearray()

    def here():
        return data_off + len(data)

    def align4():
        while here() % 4:
            data.append(0)

    # type lists
    align4()
    typelist_off = {}
    tl_start = here()
    for p in proto_list:
        params = p[1]
        if not params or params in typelist_off:
            continue
        align4()
        typelist_off[params] = here()
        data.extend(struct.pack("<I", len(params)))
        for t in params:
            data.extend(struct.pack("<H", tidx[t]))
    n_tl = len(typelist_off)
    # code items
    align4()
    code_start = here()
    code_off = {}
    for key, regs, ins, outs, insns, _ in codes:
        align4()
        code_off[key] = here()
        data.extend(struct.pack("<HHHHII", regs, ins, outs, 0, 0, len(insns)))
        for u in insns:
            data.extend(struct.pack("<H", u))
    # string data
    sd_start = here()
    str_off = []
    for s in str_list:
        str_off.append(here())
        b = s.encode("utf-8")
        data.extend(uleb(len(s)) + b + b"\x00")
    # class data
    cd_off = here()
    cdata = bytearray()
    cdata += uleb(0) + uleb(0) + uleb(1) + uleb(1)
    cdata += uleb(midx["my_init"]) + uleb(0x10001) + uleb(code_off["my_init"])
    cdata += uleb(midx["my_onCreate"]) + uleb(0x0001) + uleb(code_off["my_onCreate"])
    data.extend(cdata)
    # map list
    align4()
    map_off = here()
    entries = [
        (0x0000, 1, 0), (0x0001, n_s, string_ids_off), (0x0002, n_t, type_ids_off), (0x0003, n_p, proto_ids_off),
        (0x0005, n_m, method_ids_off), (0x0006, 1, class_defs_off),
    ]
    if n_tl:
        entries.append((0x1001, n_tl, min(typelist_off.values())))
    entries += [(0x2001, len(codes), code_start), (0x2002, n_s, sd_start), (0x2000, 1, cd_off), (0x1000, 1, map_off)]
    entries.sort(key=lambda e: e[2])
    data.extend(struct.pack("<I", len(entries)))
    for t, n, o in entries:
        data.extend(struct.pack("<HHII", t, 0, n, o))
    align4()
    file_size = data_off + len(data)

    out = bytearray(data_off)
    # ids
    for i, o in enumerate(str_off):
        struct.pack_into("<I", out, string_ids_off + 4 * i, o)
    for i, t in enumerate(type_list):
        struct.pack_into("<I", out, type_ids_off + 4 * i, sidx[t])
    for i, p in enumerate(proto_list):
        struct.pack_into("<III", out, proto_ids_off + 12 * i, sidx[proto_shorty[p]], tidx[p[0]], typelist_off.get(p[1], 0))
    for i, k in enumerate(meth_keys):
        cls, name, ret, params = M[k]
        struct.pack_into("<HHI", out, method_ids_off + 8 * i, tidx[cls], pidx[(ret, params)], sidx[name])
    struct.pack_into("<IIIIIIII", out, class_defs_off, tidx[ACT], 0x0001, tidx["Landroid/app/Activity;"], 0, 0xFFFFFFFF, 0, cd_off, 0)
    # header
    hdr = struct.pack(
        "<8sI20sIIIIIIIIIIIIIIIIIIII", b"dex\n035\x00", 0, b"\x00" * 20, file_size, 0x70, 0x12345678, 0, 0, map_off,
        n_s, string_ids_off, n_t, type_ids_off, n_p, proto_ids_off, 0, 0, n_m, method_ids_off, 1, class_defs_off,
        file_size - data_off, data_off)
    out[0:0x70] = hdr
    dex = bytearray(out + data)
    assert len(dex) == file_size
    dex[12:32] = hashlib.sha1(bytes(dex[32:])).digest()
    struct.pack_into("<I", dex, 8, zlib.adler32(bytes(dex[12:])) & 0xFFFFFFFF)
    return bytes(dex)


# ----------------------------------------------------------------------------------- resources

MANIFEST_T = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="__PKG__">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <application android:label="@string/app_name" android:icon="@mipmap/ic_launcher" android:hardwareAccelerated="true"
        android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true" android:screenOrientation="sensorLandscape"
            android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout|keyboard|keyboardHidden|navigation|uiMode"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen" android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
"""


def make_icon_afc(size):
    """AFC launcher icon: ink circle, volt slab, AFC knocked out, flare streak."""
    from PIL import Image, ImageDraw, ImageFont
    S = size * 4
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([0, 0, S - 1, S - 1], fill=(7, 11, 22, 255))
    k = S / 460
    ox, oy = S * 0.08, S * 0.30
    slab = [(ox + 46 * k * 0.84, oy), (ox + 456 * k * 0.84, oy), (ox + 414 * k * 0.84, oy + 136 * k * 0.84), (ox + 4 * k * 0.84, oy + 136 * k * 0.84)]
    d.polygon(slab, fill=(198, 255, 61, 255))
    font_path = Path(__file__).resolve().parent.parent / "afc/fonts/Changa-AFC.ttf"
    try:
        font = ImageFont.truetype(str(font_path), int(S * 0.27))
        try:
            font.set_variation_by_axes([800])
        except Exception:
            pass
    except Exception:
        font = ImageFont.load_default()
    txt = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt)
    td.text((S * 0.5, oy + 70 * k * 0.84), "AFC", font=font, fill=(7, 11, 22, 255), anchor="mm")
    txt = txt.transform((S, S), Image.AFFINE, (1, 0.21, -0.21 * (oy + 70 * k * 0.84), 0, 1, 0), resample=Image.BICUBIC)
    im.alpha_composite(txt)
    d.polygon([(S * 0.2, S * 0.70), (S * 0.66, S * 0.70), (S * 0.645, S * 0.735), (S * 0.185, S * 0.735)], fill=(255, 106, 43, 255))
    return im.resize((size, size), Image.LANCZOS)


def make_icon(size):
    from PIL import Image, ImageDraw
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = size // 2
    d.ellipse([0, 0, size - 1, size - 1], fill=(16, 26, 20, 255))
    # pitch
    m = size * 0.18
    d.rounded_rectangle([m, size * 0.28, size - m, size * 0.72], radius=size * 0.04, fill=(53, 122, 45, 255), outline=(236, 242, 234, 255),
                        width=max(1, size // 48))
    d.line([r, size * 0.28, r, size * 0.72], fill=(236, 242, 234, 255), width=max(1, size // 48))
    d.ellipse([r - size * 0.09, r - size * 0.09, r + size * 0.09, r + size * 0.09], outline=(236, 242, 234, 255), width=max(1, size // 48))
    # gold ball
    br = size * 0.1
    d.ellipse([r + size * 0.12 - br, r + size * 0.1 - br, r + size * 0.12 + br, r + size * 0.1 + br], fill=(242, 194, 48, 255),
              outline=(26, 20, 5, 255), width=max(1, size // 64))
    return im


# ----------------------------------------------------------------------------------- zip align + v2 signing


def align_zip(src, dst, dex):
    """Rewrite the APK: classes.dex added, stored entries 4-byte aligned (resources.arsc must be stored)."""
    zin = zipfile.ZipFile(src)
    items = [(i, zin.read(i.filename)) for i in zin.infolist()]
    items.append((zipfile.ZipInfo("classes.dex", date_time=(2026, 10, 10, 0, 0, 0)), dex))
    with open(dst, "wb") as fp:
        zout = zipfile.ZipFile(fp, "w")
        for info, data in items:
            zi = zipfile.ZipInfo(info.filename, date_time=(2026, 10, 10, 0, 0, 0))
            stored = info.filename == "resources.arsc" or info.filename.endswith(".png") or info.compress_type == zipfile.ZIP_STORED
            zi.compress_type = zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            if stored:
                pos = fp.tell() + 30 + len(zi.filename.encode())
                pad = (-(pos + 6)) % 4
                zi.extra = struct.pack("<HHH", 0xD935, 2 + pad, 4) + b"\x00" * pad
            zout.writestr(zi, data)
        zout.close()


def v2_sign(apk_path, key, cert_der):
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    raw = Path(apk_path).read_bytes()
    eocd = raw.rfind(b"PK\x05\x06")
    cd_size, cd_off = struct.unpack("<II", raw[eocd + 12:eocd + 20])
    sec1, sec2, sec3 = raw[:cd_off], raw[cd_off:cd_off + cd_size], raw[eocd:]

    def chunks(b):
        return [b[i:i + 1048576] for i in range(0, len(b), 1048576)] if b else []

    all_chunks = chunks(sec1) + chunks(sec2) + chunks(sec3)
    digests = b"".join(hashlib.sha256(b"\xa5" + struct.pack("<I", len(c)) + c).digest() for c in all_chunks)
    top = hashlib.sha256(b"\x5a" + struct.pack("<I", len(all_chunks)) + digests).digest()

    def lp(b):
        return struct.pack("<I", len(b)) + b

    ALG = 0x0103  # RSASSA-PKCS1-v1_5 with SHA2-256
    digests_seq = lp(lp(struct.pack("<I", ALG) + lp(top)))
    certs_seq = lp(lp(cert_der))
    signed_data = digests_seq + certs_seq + lp(b"")
    sig = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    sigs_seq = lp(lp(struct.pack("<I", ALG) + lp(sig)))
    pub = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    signer = lp(signed_data) + sigs_seq + lp(pub)
    value = lp(lp(signer))
    pair = struct.pack("<Q", 4 + len(value)) + struct.pack("<I", 0x7109871A) + value
    size = len(pair) + 8 + 16
    block = struct.pack("<Q", size) + pair + struct.pack("<Q", size) + b"APK Sig Block 42"
    new_eocd = bytearray(sec3)
    struct.pack_into("<I", new_eocd, 16, cd_off + len(block))
    Path(apk_path).write_bytes(sec1 + block + sec2 + bytes(new_eocd))


def make_key(keydir):
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID
    kp = Path(keydir) / "hara-lab-key.pem"
    if kp.exists():
        key = serialization.load_pem_private_key(kp.read_bytes(), None)
    else:
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        kp.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Hara Football Lab")])
    now = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key()).serial_number(20261010)
            .not_valid_before(now).not_valid_after(now + datetime.timedelta(days=365 * 30)).sign(key, hashes.SHA256()))
    return key, cert.public_bytes(serialization.Encoding.DER)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aapt2", required=True)
    ap.add_argument("--framework", required=True)
    ap.add_argument("--page", required=True)
    ap.add_argument("--three", help="three.min.js to inline (lab pages)")
    ap.add_argument("--full-page", action="store_true", help="the page is a complete HTML document with everything inlined")
    ap.add_argument("--package", default="com.hara.lab")
    ap.add_argument("--label", default="كورة الحارة")
    ap.add_argument("--icon", choices=["hara", "afc"], default="hara")
    ap.add_argument("--out", required=True)
    ap.add_argument("--version-code", default="2")
    ap.add_argument("--version-name", default="0.2")
    ap.add_argument("--keydir", default=str(Path(__file__).resolve().parent))
    a = ap.parse_args()
    set_package(a.package)
    from xml.sax.saxutils import escape
    work = Path(tempfile.mkdtemp())
    res = work / "res"
    (res / "values").mkdir(parents=True)
    (res / "values" / "strings.xml").write_text(
        f'<?xml version="1.0" encoding="utf-8"?>\n<resources><string name="app_name">{escape(a.label)}</string></resources>\n', encoding="utf-8")
    for dens, px in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
        d = res / f"mipmap-{dens}"
        d.mkdir()
        (make_icon_afc if a.icon == "afc" else make_icon)(px).save(d / "ic_launcher.png")
    (work / "AndroidManifest.xml").write_text(MANIFEST_T.replace("__PKG__", PKG), encoding="utf-8")
    assets = work / "assets"
    assets.mkdir()
    page = Path(a.page).read_text(encoding="utf-8")
    if a.full_page:
        html = page
    else:
        three = Path(a.three).read_text(encoding="utf-8")
        tag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
        assert tag in page, "three.js tag not found"
        page = page.replace(tag, "<script>" + three.replace("</script>", "<\\/script>") + "</script>")
        html = ('<!doctype html><html lang="ar"><head><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">'
                '<style>[hidden]{display:none!important}html,body{margin:0;height:100%}</style></head><body>' + page + "</body></html>")
    (assets / "index.html").write_text(html, encoding="utf-8")
    aapt2 = a.aapt2
    subprocess.run([aapt2, "compile", "--dir", str(res), "-o", str(work / "res.zip")], check=True)
    subprocess.run([aapt2, "link", "-o", str(work / "base.apk"), "-I", a.framework, "--manifest", str(work / "AndroidManifest.xml"),
                    "--min-sdk-version", "24", "--target-sdk-version", "34", "--version-code", a.version_code, "--version-name",
                    a.version_name, "-A", str(assets), str(work / "res.zip")], check=True)
    dex = build_dex()
    (work / "classes.dex").write_bytes(dex)
    align_zip(work / "base.apk", a.out, dex)
    key, cert = make_key(a.keydir)
    v2_sign(a.out, key, cert)
    print("wrote", a.out, os.path.getsize(a.out), "bytes; dex", len(dex), "bytes; work", work)


if __name__ == "__main__":
    main()
