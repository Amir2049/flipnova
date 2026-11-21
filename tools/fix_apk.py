"""Post-export fixes for a Godot (non-Gradle) Android APK, then re-align and sign it.

Godot 4.7's template-APK export writes "<package>.fileprovider" into the authorities of every <provider>, so the
androidx.startup InitializationProvider ends up with the same authority as the FileProvider. This gives it back
its own authority ("<package>.androidx-startup") by editing the binary AndroidManifest.xml.

usage: python3 tools/fix_apk.py exported-unsigned.apk out.apk [key.pem]
"""
import struct, sys, zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_apk as b


def _strings(data, pos):
    hsize, size = struct.unpack_from("<HI", data, pos + 2)
    sc, stc, flags, sstart, ststart = struct.unpack_from("<IIIII", data, pos + 8)
    utf8 = bool(flags & 0x100)
    offs = struct.unpack_from("<%dI" % sc, data, pos + hsize)
    out = []
    for o in offs:
        p = pos + sstart + o
        if utf8:
            n = data[p]; p += 1
            if n & 0x80: p += 1
            n2 = data[p]; p += 1
            if n2 & 0x80:
                n2 = ((n2 & 0x7F) << 8) | data[p]; p += 1
            out.append(data[p:p + n2].decode("utf8"))
        else:
            n = struct.unpack_from("<H", data, p)[0]; p += 2
            if n & 0x8000:
                n = ((n & 0x7FFF) << 16) | struct.unpack_from("<H", data, p)[0]; p += 2
            out.append(data[p:p + n * 2].decode("utf-16-le"))
    return out, utf8, sc, stc, flags, sstart, ststart, hsize, size


def add_string(data, s):
    """Append a string to the manifest's string pool; returns (new data, index of the string)."""
    pos = 8
    assert struct.unpack_from("<H", data, pos)[0] == 0x0001
    strs, utf8, sc, stc, flags, sstart, ststart, hsize, size = _strings(data, pos)
    if s in strs:
        return data, strs.index(s)
    offs = list(struct.unpack_from("<%dI" % sc, data, pos + hsize))
    soffs = list(struct.unpack_from("<%dI" % stc, data, pos + hsize + sc * 4)) if stc else []
    send = pos + (ststart if stc else size)
    sdata = bytearray(data[pos + sstart:send])
    while sdata and len(sdata) % 4 == 0 and sdata[-4:] == b"\x00\x00\x00\x00" and False:
        pass
    new_off = len(sdata)
    if utf8:
        enc = s.encode("utf8")
        sdata += bytes([len(s), len(enc)]) + enc + b"\x00"
    else:
        sdata += struct.pack("<H", len(s)) + s.encode("utf-16-le") + b"\x00\x00"
    while len(sdata) % 4:
        sdata += b"\x00"
    offs.append(new_off)
    styles = data[pos + ststart:pos + size] if stc else b""
    nsc = sc + 1
    new_sstart = hsize + nsc * 4 + stc * 4
    new_ststart = new_sstart + len(sdata) if stc else 0
    body = struct.pack("<%dI" % nsc, *offs) + (struct.pack("<%dI" % stc, *soffs) if stc else b"") + bytes(sdata) + bytes(styles)
    new_size = hsize + len(body)
    head = struct.pack("<HHIIIIII", 0x0001, hsize, new_size, nsc, stc, flags, new_sstart, new_ststart)
    head += data[pos + 28:pos + hsize]   # any extra header bytes
    pool = head + body
    rest = data[pos + size:]
    total = 8 + len(pool) + len(rest)
    out = bytearray(struct.pack("<HHI", 0x0003, 8, total) + pool + rest)
    return out, nsc - 1


def fix_providers(data, package):
    data, idx = add_string(bytearray(data), package + ".androidx-startup")
    strs = _strings(data, 8)[0]
    pos = 8 + struct.unpack_from("<I", data, 12)[0]
    fixed = 0
    while pos < len(data):
        typ, hsize, size = struct.unpack_from("<HHI", data, pos)
        if typ == 0x0102:
            ns, name, a_start, a_size, a_count = struct.unpack_from("<IIHHH", data, pos + 16)
            if strs[name] == "provider":
                attrs = {}
                for i in range(a_count):
                    ap = pos + 16 + a_start + i * a_size
                    an, = struct.unpack_from("<I", data, ap + 4)
                    attrs[strs[an]] = ap
                ap = attrs.get("name")
                pname = strs[struct.unpack_from("<I", data, ap + 8)[0]] if ap else ""
                if pname == "androidx.startup.InitializationProvider" and "authorities" in attrs:
                    aa = attrs["authorities"]
                    struct.pack_into("<I", data, aa + 8, idx)          # raw value
                    struct.pack_into("<I", data, aa + 16, idx)         # typed value (string)
                    fixed += 1
        pos += size
    return bytes(data), fixed


def main():
    src, dst = sys.argv[1], sys.argv[2]
    keyfile = sys.argv[3] if len(sys.argv) > 3 else str(Path(__file__).resolve().parent.parent / "signing" / "hara-lab-key.pem")
    zin = zipfile.ZipFile(src)
    man = zin.read("AndroidManifest.xml")
    # the package name is the manifest's "package" attribute
    strs = _strings(bytearray(man), 8)[0]
    package = next(s for s in strs if s.count(".") >= 2 and s.endswith(".fileprovider")).rsplit(".", 1)[0]
    new_man, n = fix_providers(man, package)
    print("package", package, "providers fixed:", n)
    tmp = dst + ".tmp"
    import io
    with open(tmp, "wb") as fp:
        zout = zipfile.ZipFile(fp, "w")
        for info in zin.infolist():
            data = new_man if info.filename == "AndroidManifest.xml" else zin.read(info.filename)
            zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            # native libraries keep Godot's compression (the installer extracts them; stored ones are 16 KB aligned so
            # they also map on 16 KB page devices)
            is_so = info.filename.startswith("lib/") and info.filename.endswith(".so")
            zi.compress_type = info.compress_type
            zi.external_attr = info.external_attr
            if zi.compress_type == zipfile.ZIP_STORED:
                align = 16384 if is_so else 4
                pos = fp.tell() + 30 + len(zi.filename.encode())
                pad = (-(pos + 6)) % align
                zi.extra = struct.pack("<HHH", 0xD935, 2 + pad, align) + b"\x00" * pad
            zout.writestr(zi, data)
        zout.close()
    from cryptography.hazmat.primitives import serialization
    key, cert = b.make_key(str(Path(keyfile).parent))
    Path(dst).write_bytes(Path(tmp).read_bytes())
    Path(tmp).unlink()
    b.v2_sign(dst, key, cert)
    print("signed", dst)


if __name__ == "__main__":
    main()
