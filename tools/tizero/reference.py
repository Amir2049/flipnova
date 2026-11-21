#!/usr/bin/env python3
"""Check AFC's C++ TiZero port against TiZero's own Python feature code and a numpy copy of its network.

  python3 tools/tizero/reference.py <TiZero>/submission/tizero assets/tizero.bin dump.jsonl obs.txt   # write inputs
  tztest assets/tizero.bin obs.txt > cpp.txt
  python3 tools/tizero/reference.py <TiZero>/submission/tizero assets/tizero.bin dump.jsonl obs.txt cpp.txt

dump.jsonl comes from `gftest <data> <frames> assets/tizero.bin <difficulty> 0 dump.jsonl` (raw observations of the
right team, already turned to its own point of view). Sticky actions are random so every branch gets exercised.
"""
import copy
import json
import struct
import sys

import numpy as np


def load_bin(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'TZ01'
    n = struct.unpack('<I', d[4:8])[0]
    p = 8
    out = []
    for _ in range(n):
        k = struct.unpack('<I', d[p:p + 4])[0]
        p += 4
        out.append(np.frombuffer(d[p:p + 2 * k], dtype='<f2').astype(np.float32))
        p += 2 * k
    return out


class Net:
    def __init__(self, path):
        t = iter(load_bin(path))

        def lin(i, o):
            return next(t).reshape(o, i), next(t)

        def blk(i, o):
            w, b = lin(i, o)
            return w, b, next(t), next(t)

        ins, outs = [87, 57, 88, 88, 9], [64, 64, 64, 64, 9]
        self.enc = [(blk(ins[e], outs[e]), blk(outs[e], outs[e])) for e in range(5)]
        self.embed = blk(265, 256)
        self.w_ih = next(t).reshape(1024, 256)
        self.w_hh = next(t).reshape(1024, 256)
        self.b_ih, self.b_hh = next(t), next(t)
        self.norm = next(t), next(t)
        self.after = blk(256, 256)
        self.idemb = blk(11, 11)
        self.before = blk(267, 256), blk(256, 256)
        self.act = lin(256, 20)
        self.state = [np.zeros(512, np.float32) for _ in range(11)]

    @staticmethod
    def ln(x, w, b):
        m = x.mean()
        v = ((x - m) ** 2).mean()
        return (x - m) / np.sqrt(v + 1e-5) * w + b

    def block(self, p, x):
        w, b, nw, nb = p
        return self.ln(np.maximum(w @ x + b, 0), nw, nb)

    def forward(self, obs, avail):
        active = int(obs[0])
        x = obs[1:]
        ins = [87, 57, 88, 88, 9]
        parts, at = [], 0
        for e in range(5):
            parts.append(self.block(self.enc[e][1], self.block(self.enc[e][0], x[at:at + ins[e]])))
            at += ins[e]
        x = self.block(self.embed, np.concatenate(parts))
        h, c = self.state[active][:256], self.state[active][256:]
        g = self.w_ih @ x + self.b_ih + self.w_hh @ h + self.b_hh
        sig = lambda z: 1 / (1 + np.exp(-z))
        i, f, gg, o = sig(g[:256]), sig(g[256:512]), np.tanh(g[512:768]), sig(g[768:])
        c = f * c + i * gg
        h = o * np.tanh(c)
        self.state[active] = np.concatenate([h, c])
        y = self.block(self.after, self.ln(h, *self.norm))
        idv = self.block(self.idemb, np.eye(11, dtype=np.float32)[active])
        z = self.block(self.before[1], self.block(self.before[0], np.concatenate([idv, y])))
        logits = self.act[0] @ z + self.act[1]
        av = np.zeros(20)
        av[:19] = avail
        logits[av == 0] = -1e10
        return int(np.argmax(logits))


def to_obs(d):
    o = {k: (np.array(v, dtype=np.float64) if isinstance(v, list) else v) for k, v in d.items()}
    o['left_team'] = o['left_team'].reshape(11, 2)
    o['right_team'] = o['right_team'].reshape(11, 2)
    o['left_team_direction'] = o['left_team_direction'].reshape(11, 2)
    o['right_team_direction'] = o['right_team_direction'].reshape(11, 2)
    o['left_team_active'] = np.array(d['left_team_active'], dtype=bool)
    o['right_team_active'] = np.array(d['right_team_active'], dtype=bool)
    o['left_team_yellow_card'] = np.array(d['left_team_yellow_card'], dtype=np.float64)
    o['right_team_yellow_card'] = np.array(d['right_team_yellow_card'], dtype=np.float64)
    o['left_team_roles'] = [0] * 11
    o['right_team_roles'] = [0] * 11
    return o


def flat(d, sticky):
    v = []
    for k in ('ball', 'ball_direction', 'ball_rotation', 'left_team', 'left_team_direction', 'left_team_tired_factor'):
        v += d[k]
    v += [int(b) for b in d['left_team_yellow_card']] + [int(b) for b in d['left_team_active']]
    for k in ('right_team', 'right_team_direction', 'right_team_tired_factor'):
        v += d[k]
    v += [int(b) for b in d['right_team_yellow_card']] + [int(b) for b in d['right_team_active']]
    v += [d['ball_owned_team'], d['ball_owned_player'], d['game_mode'], d['score'][0], d['score'][1], d['steps_left']]
    for s in sticky:
        v += list(s)
    return ' '.join('%.9g' % x if isinstance(x, float) else str(x) for x in v)


def random_sticky(rng):
    s = [0] * 10
    if rng.random() < 0.7:
        s[rng.integers(8)] = 1
    s[8] = int(rng.random() < 0.5)
    s[9] = int(rng.random() < 0.3)
    return s


def main():
    tiz, binp, dump, obs_txt = sys.argv[1:5]
    cpp = sys.argv[5] if len(sys.argv) > 5 else None
    sys.path.insert(0, tiz)
    from openrl_utils import openrl_obs_deal
    from goal_keeper import agent_get_action
    rng = np.random.default_rng(7)
    lines = [json.loads(l) for l in open(dump)]
    stickies = [[random_sticky(rng) for _ in range(11)] for _ in lines]
    if not cpp:
        with open(obs_txt, 'w') as f:
            for d, s in zip(lines, stickies):
                f.write(flat(d, s) + '\n')
        print('wrote', len(lines), 'observations')
        return
    net = Net(binp)
    out = open(cpp).read().split('\n')
    r = 0
    worst = 0.0
    bad_avail = bad_act = bad_gk = n = 0
    for d, s in zip(lines, stickies):
        for p in range(1, 11):
            o = to_obs(d)
            o['active'] = p
            o['sticky_actions'] = np.array(s[p])
            ref = openrl_obs_deal(o)
            vals = out[r].split()
            r += 1
            f = np.array([float(x) for x in vals[:330]])
            a = np.array([int(x) for x in vals[330:349]])
            act = int(vals[349])
            worst = max(worst, float(np.max(np.abs(f - ref['obs']) / (1 + np.abs(ref['obs'])))))
            if not np.array_equal(a, ref['available_action'].astype(int)):
                bad_avail += 1
                if bad_avail < 4:
                    print('avail differ frame', d['frame'], 'player', p, a, ref['available_action'].astype(int))
            ra = net.forward(ref['obs'].astype(np.float32), ref['available_action'])
            if ra == 17 and s[p][8] == 1:
                ra = 15
            if ra != act:
                bad_act += 1
            n += 1
        gk = out[r].split()
        r += 1
        if d['game_mode'] != 6:
            o = to_obs(d)
            o['active'] = 0
            o['sticky_actions'] = np.array(s[0])
            o['designated'] = 0
            ref_gk = agent_get_action(copy.deepcopy(o))[0]
            if ref_gk != int(gk[1]):
                bad_gk += 1
                if bad_gk < 4:
                    print('GK differ frame', d['frame'], 'cpp', gk[1], 'ref', ref_gk, 'sticky', s[0])
    print('players checked %d: worst feature error %.2e, available differ %d, action differ %d; keeper differ %d'
          % (n, worst, bad_avail, bad_act, bad_gk))


if __name__ == '__main__':
    main()
