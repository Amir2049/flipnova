import sys, struct, zipfile, hashlib, zlib
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
apk = sys.argv[1]
raw = open(apk, 'rb').read()
# --- stored entries aligned?
z = zipfile.ZipFile(apk)
for i in z.infolist():
    nlen, elen = struct.unpack('<HH', raw[i.header_offset + 26:i.header_offset + 30])
    doff = i.header_offset + 30 + nlen + elen
    if i.compress_type == 0: print('stored', i.filename, 'data offset %4 =', doff % 4)
    assert z.read(i.filename) is not None
# --- v2 block
eocd = raw.rfind(b'PK\x05\x06')
cd_size, cd_off = struct.unpack('<II', raw[eocd + 12:eocd + 20])
assert raw[cd_off - 16:cd_off] == b'APK Sig Block 42'
size = struct.unpack('<Q', raw[cd_off - 24:cd_off - 16])[0]
bstart = cd_off - size - 8
assert struct.unpack('<Q', raw[bstart:bstart + 8])[0] == size
p = bstart + 8
pairs = {}
while p < cd_off - 24:
    l = struct.unpack('<Q', raw[p:p + 8])[0]; idv = struct.unpack('<I', raw[p + 8:p + 12])[0]; pairs[idv] = raw[p + 12:p + 8 + l]; p += 8 + l
v2 = pairs[0x7109871A]
def lp(b, o): n = struct.unpack('<I', b[o:o + 4])[0]; return b[o + 4:o + 4 + n], o + 4 + n
signers, _ = lp(v2, 0); signer, _ = lp(signers, 0)
sd, o = lp(signer, 0); sigs, o = lp(signer, o); pub, o = lp(signer, o)
digs, o2 = lp(sd, 0); certs, o2 = lp(sd, o2)
d1, _ = lp(digs, 0); alg = struct.unpack('<I', d1[:4])[0]; dig, _ = lp(d1, 4)
s1, _ = lp(sigs, 0); sig, _ = lp(s1, 4)
key = serialization.load_der_public_key(pub)
key.verify(sig, sd, padding.PKCS1v15(), hashes.SHA256())
cert, _ = lp(certs, 0); c = x509.load_der_x509_certificate(cert)
assert c.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) == pub
# recompute digest with the block removed and the EoCD offset pointing at the block start
sec1 = raw[:bstart]; sec2 = raw[cd_off:eocd]; sec3 = bytearray(raw[eocd:]); struct.pack_into('<I', sec3, 16, bstart)
ch = lambda b: [b[i:i + 1048576] for i in range(0, len(b), 1048576)]
cs = ch(sec1) + ch(sec2) + ch(bytes(sec3))
top = hashlib.sha256(b'\x5a' + struct.pack('<I', len(cs)) + b''.join(hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest() for c in cs)).digest()
import hashlib
print('v2: alg 0x%x, signature ok, digest match' % alg, top == dig, 'cert', c.subject.rfc4514_string(), 'sha256', hashlib.sha256(cert).hexdigest()[:16])
# --- DEX parse + disassembly
dex = z.read('classes.dex')
assert dex[:8] == b'dex\n035\x00'
assert struct.unpack('<I', dex[8:12])[0] == zlib.adler32(dex[12:]) & 0xffffffff
assert dex[12:32] == hashlib.sha1(dex[32:]).digest()
h = struct.unpack('<IIIIIIIIIIIIIIIIIIII', dex[32:112])
fsize, hsize, endian, lsz, loff, mapoff, ns, soff, nt, toff, npr, poff, nf, foff, nm, moff, nc, coff, dsz, doff = h
assert fsize == len(dex) and hsize == 0x70 and endian == 0x12345678 and doff + dsz == fsize
def uleb(b, o):
    r = s = 0
    while True:
        x = b[o]; o += 1; r |= (x & 0x7f) << s; s += 7
        if x < 0x80: return r, o
S = []
for i in range(ns):
    so = struct.unpack('<I', dex[soff + 4 * i:soff + 4 * i + 4])[0]; n, o = uleb(dex, so); e = dex.index(b'\0', o); S.append(dex[o:e].decode())
assert S == sorted(S, key=lambda s: s.encode('utf-16-be')), 'strings not sorted'
T = [S[struct.unpack('<I', dex[toff + 4 * i:toff + 4 * i + 4])[0]] for i in range(nt)]
assert T == sorted(T, key=lambda t: S.index(t))
def tl(off):
    if not off: return []
    n = struct.unpack('<I', dex[off:off + 4])[0]; return [T[struct.unpack('<H', dex[off + 4 + 2 * k:off + 6 + 2 * k])[0]] for k in range(n)]
P = []
for i in range(npr):
    sh, rt, po = struct.unpack('<III', dex[poff + 12 * i:poff + 12 * i + 12]); P.append((S[sh], T[rt], tl(po)))
for sh, rt, ps in P:
    exp = ('L' if rt[0] in 'L[' else rt) + ''.join('L' if x[0] in 'L[' else x for x in ps); assert sh == exp, (sh, exp)
Mth = []
for i in range(nm):
    c, pr, nmx = struct.unpack('<HHI', dex[moff + 8 * i:moff + 8 * i + 8]); Mth.append((T[c], S[nmx], P[pr]))
keys = [(struct.unpack('<HHI', dex[moff + 8 * i:moff + 8 * i + 8])) for i in range(nm)]
assert [ (k[0], k[2], k[1]) for k in keys] == sorted((k[0], k[2], k[1]) for k in keys), 'methods not sorted'
cls, acc, sup, itf, src, ann, cdo, sv = struct.unpack('<IIIIIIII', dex[coff:coff + 32])
print('class', T[cls], 'extends', T[sup], 'access', hex(acc))
o = cdo; sf, o = uleb(dex, o); inf, o = uleb(dex, o); dm, o = uleb(dex, o); vm, o = uleb(dex, o)
NAMES = {0x6e: 'invoke-virtual', 0x6f: 'invoke-super', 0x70: 'invoke-direct', 0x22: 'new-instance', 0x0c: 'move-result-object', 0x12: 'const/4', 0x13: 'const/16', 0x1a: 'const-string', 0x0e: 'return-void'}
for kind, count in (('direct', dm), ('virtual', vm)):
    idx = 0
    for k in range(count):
        d, o = uleb(dex, o); idx += d; af, o = uleb(dex, o); co, o = uleb(dex, o)
        regs, ins, outs, tries, dbg, isz = struct.unpack('<HHHHII', dex[co:co + 16])
        print(f' {kind} {Mth[idx][0]}->{Mth[idx][1]}{Mth[idx][2][2]}{Mth[idx][2][1]} access={hex(af)} regs={regs} ins={ins} outs={outs}')
        u = [struct.unpack('<H', dex[co + 16 + 2 * j:co + 18 + 2 * j])[0] for j in range(isz)]
        j = 0
        while j < len(u):
            op = u[j] & 0xff
            if op in (0x6e, 0x6f, 0x70):
                a = u[j] >> 12; g = (u[j] >> 8) & 0xf; m = u[j + 1]; w = u[j + 2]; regsl = [w & 0xf, (w >> 4) & 0xf, (w >> 8) & 0xf, (w >> 12) & 0xf, g][:a]
                mm = Mth[m]; print(f'   {NAMES[op]} {{{", ".join("v%d" % r for r in regsl)}}}, {mm[0]}->{mm[1]}({"".join(mm[2][2])}){mm[2][1]}')
                assert a == len(mm[2][2]) + (0 if False else 1), 'arg count'
                j += 3
            elif op == 0x22: print(f'   new-instance v{u[j] >> 8}, {T[u[j + 1]]}'); j += 2
            elif op == 0x1a: print(f'   const-string v{u[j] >> 8}, "{S[u[j + 1]]}"'); j += 2
            elif op == 0x13: print(f'   const/16 v{u[j] >> 8}, {hex(u[j + 1])}'); j += 2
            elif op == 0x12: print(f'   const/4 v{(u[j] >> 8) & 0xf}, {u[j] >> 12}'); j += 1
            elif op == 0x0c: print(f'   move-result-object v{u[j] >> 8}'); j += 1
            elif op == 0x0e: print('   return-void'); j += 1
            else: raise SystemExit('unknown op %x' % op)
# map list
n = struct.unpack('<I', dex[mapoff:mapoff + 4])[0]
ents = [struct.unpack('<HHII', dex[mapoff + 4 + 12 * k:mapoff + 16 + 12 * k]) for k in range(n)]
assert [e[3] for e in ents] == sorted(e[3] for e in ents)
print('map', [(hex(e[0]), e[2], e[3]) for e in ents])
print('DEX OK', len(dex), 'bytes')
