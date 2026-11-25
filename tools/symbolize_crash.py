#!/usr/bin/env python3
"""Name the frames of a native crash report from a phone (written by native/src/crash_guard.cpp, shown in
Settings > Engine info) with the link map of the library that phone ran (native/symbols/*.map.gz, git history for
older versions).

  python3 tools/symbolize_crash.py report.txt [native/symbols/libafcgf.android.arm64.map.gz]

Every "libafcgf... +0x<offset>" in the report gets the function that contains that offset.
"""
import bisect
import gzip
import re
import sys

report = open(sys.argv[1], encoding="utf-8", errors="replace").read()
mp = sys.argv[2] if len(sys.argv) > 2 else "native/symbols/libafcgf.android.arm64.map.gz"
opener = gzip.open if mp.endswith(".gz") else open
syms = []
# lld map: "VMA LMA Size Align Out In Symbol"; symbol lines have only the address columns and a demangled name
line_re = re.compile(r"^\s+([0-9a-f]+)\s+[0-9a-f]+\s+([0-9a-f]+)\s+(\d+)\s+(.*)$")
with opener(mp, "rt", encoding="utf-8", errors="replace") as f:
    for line in f:
        m = line_re.match(line)
        if not m:
            continue
        addr, size, align, rest = int(m.group(1), 16), int(m.group(2), 16), int(m.group(3)), m.group(4)
        name = rest.strip()
        # input sections look like "lib.a(file.o):(.text.x)", output sections like ".text": keep plain symbols
        if not name or name.startswith(".") or ":(" in name or addr == 0:
            continue
        syms.append((addr, name))
syms.sort()
addrs = [a for a, _ in syms]


def name_of(off: int) -> str:
    i = bisect.bisect_right(addrs, off) - 1
    if i < 0:
        return "?"
    a, n = syms[i]
    return "%s +0x%x" % (n, off - a)


def sub(m: re.Match) -> str:
    off = int(m.group(2), 16)
    return "%s +0x%x  <- %s" % (m.group(1), off, name_of(off))


print(re.sub(r"(libafcgf[^\s]*) \+0x([0-9a-f]+)", sub, report))
