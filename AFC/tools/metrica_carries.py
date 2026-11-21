#!/usr/bin/env python3
"""Real-football reference numbers from Metrica Sports' open tracking data (github.com/metrica-sports/sample-data):
when a player carries the ball (from receiving a pass to his next action), how far is the ball from him and how fast
does he go?   python3 tools/metrica_carries.py <sample-data>/data
"""
import csv, math, sys
from pathlib import Path

L, W = 105.0, 68.0


def tracking(path):
    rows = list(csv.reader(open(path)))
    head = rows[2]
    cols = {}
    for i, h in enumerate(head):
        if h.startswith("Player") or h == "Ball":
            cols[h] = i
    data = {}
    for r in rows[3:]:
        f = int(r[1])
        d = {}
        for name, i in cols.items():
            try:
                x, y = float(r[i]), float(r[i + 1])
            except ValueError:
                continue
            if not (math.isnan(x) or math.isnan(y)):
                d[name] = (x * L, y * W)
        data[f] = d
    return data


def main(root):
    dists, speeds, durs = [], [], []
    for g in ("Sample_Game_1", "Sample_Game_2"):
        base = Path(root) / g
        home = tracking(base / f"{g}_RawTrackingData_Home_Team.csv")
        away = tracking(base / f"{g}_RawTrackingData_Away_Team.csv")
        ev = list(csv.DictReader(open(base / f"{g}_RawEventsData.csv")))
        for i in range(1, len(ev)):
            a, b = ev[i - 1], ev[i]
            if a["Type"] != "PASS" or not a["To"] or b["From"] != a["To"]:
                continue
            r, s = int(a["End Frame"]), int(b["Start Frame"])
            if s - r < 50 or s - r > 400:      # carries of 2 to 16 s
                continue
            p = b["From"]
            tr = home if p in home.get(r, {}) else away
            pts = []
            for f in range(r + 12, s - 6):
                d = tr.get(f, {})
                bb = home.get(f, {}).get("Ball")
                if p in d and bb:
                    pts.append((d[p], bb))
            if len(pts) < 25:
                continue
            durs.append((s - r) / 25.0)
            for k, (pp, bb) in enumerate(pts):
                dists.append(math.dist(pp, bb))
                if k >= 5:
                    speeds.append(math.dist(pp, pts[k - 5][0]) * 5.0)
    dists.sort(); speeds.sort(); durs.sort()
    q = lambda v, x: v[int(len(v) * x)]
    print(f"{len(durs)} carries of 2-16 s (median {q(durs, 0.5):.1f} s)")
    print(f"ball to carrier: median {q(dists, 0.5):.2f} m, p75 {q(dists, 0.75):.2f}, p90 {q(dists, 0.9):.2f}, over 3 m {sum(d > 3 for d in dists) / len(dists) * 100:.0f}%")
    print(f"carrier speed: median {q(speeds, 0.5):.1f} m/s, p90 {q(speeds, 0.9):.1f}")
    fast = [d for d, s in zip(dists[5:], speeds) if s > 5.5]


if __name__ == "__main__":
    main(sys.argv[1])
