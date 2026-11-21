#!/usr/bin/env python3
"""Turn Godot 4.7 binary-token GDScript (.gdc, tokenizer version 101) back into source text.

Used once to recover AFC 2.16 scripts from the shipped APK after the workspace was lost. Comments are not
stored in .gdc files, so `merge` keeps the older source's lines (with their comments) wherever the tokens are
unchanged and only writes decoded lines where the code changed.

  python3 tools/gdc_decode.py decode file.gdc.raw                 # print source (raw = zstd payload already inflated)
  python3 tools/gdc_decode.py merge old.gd old.gdc.raw new.gdc.raw > new.gd

The .raw payload is the .gdc minus its 12-byte header, zstd-inflated (Godot can do it:
PackedByteArray.decompress(size, FileAccess.COMPRESSION_ZSTD)).
"""
import difflib
import struct
import sys

NAMES = {
    4: '<', 5: '<=', 6: '>', 7: '>=', 8: '==', 9: '!=', 10: 'and', 11: 'or', 12: 'not', 13: '&&', 14: '||', 15: '!',
    16: '&', 17: '|', 18: '~', 19: '^', 20: '<<', 21: '>>', 22: '+', 23: '-', 24: '*', 25: '**', 26: '/', 27: '%',
    28: '=', 29: '+=', 30: '-=', 31: '*=', 32: '**=', 33: '/=', 34: '%=', 35: '<<=', 36: '>>=', 37: '&=', 38: '|=',
    39: '^=', 40: 'if', 41: 'elif', 42: 'else', 43: 'for', 44: 'while', 45: 'break', 46: 'continue', 47: 'pass',
    48: 'return', 49: 'match', 50: 'when', 51: 'as', 52: 'assert', 53: 'await', 54: 'breakpoint', 55: 'class',
    56: 'class_name', 57: 'const', 58: 'enum', 59: 'extends', 60: 'func', 61: 'in', 62: 'is', 63: 'namespace',
    64: 'preload', 65: 'self', 66: 'signal', 67: 'static', 68: 'super', 69: 'trait', 70: 'var', 71: 'void',
    72: 'yield', 73: '[', 74: ']', 75: '{', 76: '}', 77: '(', 78: ')', 79: ',', 80: ';', 81: '.', 82: '..',
    83: '...', 84: ':', 85: '$', 86: '->', 87: '_', 91: 'PI', 92: 'TAU', 93: 'INF', 94: 'NAN', 96: '`', 97: '?',
}
BINOPS = {'<', '<=', '>', '>=', '==', '!=', 'and', 'or', '&&', '||', '&', '|', '^', '<<', '>>', '+', '-', '*', '**',
          '/', '%', '=', '+=', '-=', '*=', '**=', '/=', '%=', '<<=', '>>=', '&=', '|=', '^=', 'in', 'is', 'as', ':=',
          '->', 'not', '!', '~'}
UNARY_AFTER = BINOPS | {None, '(', '[', '{', ',', ':', 'return', 'if', 'elif', 'while', 'when', 'assert', 'await',
                        'for', 'match', 'else'}
CALLERS = {'preload', 'assert', 'super', 'func', 'self', ')', ']', '"'}


def _gd_str(s):
    out = []
    for ch in s:
        if ch == '\\':
            out.append('\\\\')
        elif ch == '"':
            out.append('\\"')
        elif ch == '\n':
            out.append('\\n')
        elif ch == '\t':
            out.append('\\t')
        elif ch == '\r':
            out.append('\\r')
        else:
            out.append(ch)
    return '"' + ''.join(out) + '"'


def _float(v):
    if v != v:
        return 'NAN'
    if v in (float('inf'), float('-inf')):
        return 'INF' if v > 0 else '-INF'
    r = repr(v)
    if 'e' in r and '.' not in r.split('e')[0]:
        m, e = r.split('e')
        r = m + '.0e' + e
    return r


def read(path):
    d = open(path, 'rb').read()
    ni, nc, nl, nt = struct.unpack('<4I', d[:16])
    p = 16
    ids = []
    for _ in range(ni):
        n = struct.unpack('<I', d[p:p + 4])[0]
        p += 4
        ids.append(''.join(chr(struct.unpack('<I', bytes(b ^ 0xb6 for b in d[p + 4 * k:p + 4 * k + 4]))[0])
                           for k in range(n)))
        p += 4 * n
    consts = []
    for _ in range(nc):
        h = struct.unpack('<I', d[p:p + 4])[0]
        p += 4
        t, f64 = h & 0xff, h & (1 << 16)
        if t == 0:
            v = 'null'
        elif t == 1:
            v = 'true' if struct.unpack('<I', d[p:p + 4])[0] else 'false'
            p += 4
        elif t == 2:
            if f64:
                v = str(struct.unpack('<q', d[p:p + 8])[0])
                p += 8
            else:
                v = str(struct.unpack('<i', d[p:p + 4])[0])
                p += 4
        elif t == 3:
            if f64:
                v = _float(struct.unpack('<d', d[p:p + 8])[0])
                p += 8
            else:
                v = _float(struct.unpack('<f', d[p:p + 4])[0])
                p += 4
        elif t in (4, 21, 22):
            if t == 22:
                raise SystemExit('NodePath constants are not supported')
            n = struct.unpack('<I', d[p:p + 4])[0]
            p += 4
            s = d[p:p + n].decode()
            p += n + ((-n) % 4)
            v = ('&' if t == 21 else '') + _gd_str(s)
        else:
            raise SystemExit('constant type %d not supported' % t)
        consts.append(v)
    starts = {}
    for i in range(nl):
        tok, line = struct.unpack('<II', d[p + 8 * i:p + 8 * i + 8])
    p += 8 * nl
    cols = {}
    for i in range(nl):
        tok, col = struct.unpack('<II', d[p + 8 * i:p + 8 * i + 8])
        cols[tok] = col
    p += 8 * nl
    toks = []
    for i in range(nt):
        t, line = struct.unpack('<II', d[p:p + 8])
        p += 8
        typ, idx = t & 0x7f, t >> 8
        if typ in (1, 2):
            s = ids[idx]
            kind = 'id'
        elif typ in (3, 98):
            s = consts[idx]
            kind = 'lit'
        elif typ in NAMES:
            s = NAMES[typ]
            kind = 'kw' if s.isalpha() or s == '_' else 'op'
        else:
            raise SystemExit('unknown token type %d at %d' % (typ, i))
        toks.append({'s': s, 'k': kind, 'line': line, 'col': cols.get(i)})
    assert p == len(d), (p, len(d))
    return toks


def lines_of(toks):
    """{line: [tokens]} with ':' '=' fused into ':='."""
    out = {}
    for t in toks:
        out.setdefault(t['line'], []).append(t)
    for ln, ts in out.items():
        fused = []
        for t in ts:
            if fused and t['s'] == '=' and fused[-1]['s'] == ':' and fused[-1]['k'] == 'op':
                fused[-1] = dict(fused[-1], s=':=')
            else:
                fused.append(t)
        out[ln] = fused
    return out


def render(ts):
    s = ''
    prev = None
    unary = False
    for i, t in enumerate(ts):
        c = t['s']
        p = prev['s'] if prev else None
        if prev is None:
            sep = ''
        elif unary:
            sep = ''
        elif c in (',', ')', ']', '}', ';', '.', ':') or p in ('.', '(', '[', '{', '$', '@'):
            sep = ''
        elif c == '(' and (prev['k'] in ('id', 'lit') or p in CALLERS):
            sep = ''
        elif c == '[' and (prev['k'] in ('id', 'lit') or p in (')', ']', '}', 'self')):
            sep = ''
        else:
            sep = ' '
        s += sep + c
        unary = c in ('-', '+', '!', '~') and (p in UNARY_AFTER or (prev and prev['k'] == 'kw' and p not in
                                                                    ('self', 'PI', 'TAU', 'INF', 'NAN', 'super')))
        if c == '!' or c == '$':
            unary = True
        prev = t
    return s


def source_lines(toks):
    by = lines_of(toks)
    n = max(by) if by else 0
    out = []
    indent = 0
    for ln in range(1, n + 1):
        ts = by.get(ln)
        if not ts:
            out.append('')
            continue
        col = ts[0]['col']
        if col is not None or not any(out):
            indent = col - 1 if col is not None else 0
            out.append('\t' * indent + render(ts))
        else:   # no column entry: the line continues the previous one with a backslash
            out[-1] += ' \\'
            out.append('\t' * (indent + 2) + render(ts))
    return out


def norm_lines(toks, n):
    by = lines_of(toks)
    return ['\x01'.join(t['s'] for t in by.get(ln, [])) for ln in range(1, n + 1)]


def merge(old_src, old_raw, new_raw):
    src = open(old_src).read().split('\n')
    a_t, b_t = read(old_raw), read(new_raw)
    na = len(src)
    a = norm_lines(a_t, na)
    b_src = source_lines(b_t)
    b = norm_lines(b_t, len(b_src))
    out = []
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            out.extend(src[i1:i2])
        else:
            out.extend(b_src[j1:j2])
    # keep the old file's trailing comment-only tail
    while out and out[-1] == '' and len(out) > len(b_src):
        out.pop()
    text = '\n'.join(out)
    if not text.endswith('\n'):
        text += '\n'
    return text


if __name__ == '__main__':
    if sys.argv[1] == 'decode':
        print('\n'.join(source_lines(read(sys.argv[2]))))
    elif sys.argv[1] == 'merge':
        sys.stdout.write(merge(sys.argv[2], sys.argv[3], sys.argv[4]))
