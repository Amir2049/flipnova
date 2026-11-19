// PROTOTYPE (throwaway): THE CRIMSON TYRANT — "send it back".
// One question: is "flip at the last instant to send his attack back into him" fun and clear with ONE tap?
// Tap = flip. A GOLD attack on your side, tapped at the last moment = PARRY (it flies back and wounds him).
// 3 parries in a row = he kneels: 3 rings on his body, tap each = a huge slash. Red attacks can only be dodged.
(function () {
  'use strict';
  const FF = window.FF, HD = FF.HD, ART = FF.HDBoss.art;
  FF.C = 36; FF.F = 156;
  const W = 1920, H = 1080, C = ART.C, F = ART.F, MID = (C + F) / 2;
  const { cl, seg, sm, eo, lerp, hs, rgba, mixc, TAU } = HD;
  const HX = 420, HS = 96;                            // the hero's x and size
  const PHASE_HP = [100, 66, 33], WORLD = ['citadel', 'mirror', 'collapse'];
  const NAMES = [['THE CRIMSON CITADEL', 'PHASE I'], ['MIRROR VOID', 'PHASE II'], ['THE TYRANT UNBOUND', 'PHASE III']], NCOL = ['#ff5a2a', '#7fe8ff', '#ff8a3a'];

  // ------------------------------------------------------------------ sound (synth only: no music, no held notes)
  const AU = {
    ctx: null, out: null, rev: null,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      const c = (this.ctx = new A()), comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.out = c.createGain(); this.out.gain.value = 0.9; this.out.connect(comp).connect(c.destination);
      const n = c.sampleRate * 2.4, b = c.createBuffer(2, n, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
      this.rev = c.createConvolver(); this.rev.buffer = b; const rg = c.createGain(); rg.gain.value = 0.35; this.rev.connect(rg).connect(this.out);
      const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.nb = nb;
    },
    env(node, t, a, peak, d) { const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, d / 4); node.connect(g); g.connect(this.out); const s = this.ctx.createGain(); s.gain.value = 0.5; g.connect(s).connect(this.rev); return g; },
    noise(t, dur, type, f0, f1, q, peak, a, d) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q || 1; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); s.connect(f); this.env(f, t, a || 0.005, peak, d || dur); s.start(t, Math.random(), dur + 0.3); },
    tone(t, type, f0, f1, dur, peak, d) { const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); this.env(o, t, 0.004, peak, d || dur); o.start(t); o.stop(t + dur + 0.5); },
    play(n) {
      if (!this.ctx || muted) return; const t = this.ctx.currentTime;
      if (n === 'flip') this.noise(t, 0.14, 'bandpass', 600, 2400, 1.5, 0.35, 0.01, 0.12);
      else if (n === 'parry' || n === 'perfect') { const big = n === 'perfect'; this.noise(t, 0.08, 'highpass', 3000, 0, 1, 0.9, 0.001, 0.08); [523, 781, 1213, 1877].forEach((f, i) => this.tone(t, 'triangle', f * (big ? 1.05 : 1), 0, 0.5, 0.12 / (i + 1), 0.6)); this.tone(t, 'sine', 160, 50, 0.35, big ? 0.9 : 0.6, 0.3); if (big) this.noise(t, 0.6, 'lowpass', 800, 120, 1, 0.6, 0.002, 0.6); }
      else if (n === 'hitBoss') { this.tone(t, 'sine', 120, 38, 1.2, 1.0, 1.2); this.noise(t, 0.5, 'lowpass', 1600, 200, 1, 0.8, 0.002, 0.45); this.noise(t + 0.02, 0.12, 'bandpass', 2400, 0, 2, 0.5, 0.001, 0.1); }
      else if (n === 'hurt') { this.tone(t, 'sine', 90, 40, 0.5, 0.9, 0.4); this.noise(t, 0.3, 'lowpass', 900, 150, 1, 0.8, 0.002, 0.3); }
      else if (n === 'fire') { this.noise(t, 0.6, 'lowpass', 300, 2600, 0.8, 0.55, 0.05, 0.5); }
      else if (n === 'blade') { this.noise(t, 0.25, 'bandpass', 4000, 700, 2, 0.6, 0.004, 0.22); }
      else if (n === 'charge') { this.noise(t, 0.6, 'bandpass', 200, 1800, 3, 0.3, 0.5, 0.1); }
      else if (n === 'roar' || n === 'bossRoar') { const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(); o.type = o2.type = 'sawtooth'; o.frequency.setValueAtTime(48, t); o.frequency.linearRampToValueAtTime(64, t + 0.5); o.frequency.linearRampToValueAtTime(40, t + 1.3); o2.frequency.setValueAtTime(73, t); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 3; const ws = this.ctx.createWaveShaper(), cu = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; cu[i] = Math.tanh(x * 4); } ws.curve = cu; o.connect(ws); o2.connect(ws); ws.connect(f); const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.7, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 1.4); f.connect(g).connect(this.out); const s = this.ctx.createGain(); s.gain.value = 0.6; g.connect(s).connect(this.rev); o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5); this.noise(t, 1.3, 'bandpass', 700, 400, 1.2, 0.3, 0.2, 1.1); }
      else if (n === 'thunder' || n === 'shatter') { this.noise(t, 0.2, 'highpass', 1500, 0, 1, 0.7, 0.002, 0.2); this.noise(t + 0.05, 2.5, 'lowpass', 300, 80, 1, 0.8, 0.05, 2.4); }
      else if (n === 'slash') { this.noise(t, 0.3, 'bandpass', 5000, 600, 1.5, 0.9, 0.002, 0.25); this.tone(t + 0.05, 'sine', 140, 40, 0.8, 1.0, 0.8); this.noise(t + 0.05, 0.4, 'lowpass', 1200, 150, 1, 0.8, 0.002, 0.4); }
      else if (n === 'stagger') { this.tone(t, 'sine', 70, 28, 2.2, 1.0, 2.0); this.noise(t, 1.5, 'lowpass', 600, 60, 1, 0.6, 0.01, 1.4); }
      else if (n === 'meteor') { this.noise(t, 0.9, 'bandpass', 3000, 300, 3, 0.3, 0.6, 0.2); }
      else if (n === 'impact') { this.tone(t, 'sine', 100, 34, 0.9, 0.9, 0.9); this.noise(t, 0.4, 'lowpass', 2000, 150, 1, 0.7, 0.002, 0.4); }
      else if (n === 'breath') { this.noise(t, 1.2, 'lowpass', 900, 1400, 0.7, 0.5, 0.08, 1.1); }
      else if (n === 'win') { this.tone(t, 'sine', 90, 30, 2.5, 1.0, 2.4); this.noise(t, 2.5, 'lowpass', 2000, 100, 1, 0.8, 0.01, 2.4); }
      else if (n === 'knock') { this.tone(t, 'sine', 210, 150, 0.15, 0.8, 0.12); this.noise(t, 0.04, 'bandpass', 1300, 0, 2, 0.5, 0.001, 0.03); }
    }
  };
  let muted = false;

  // ------------------------------------------------------------------ the fight state
  const S = {};
  const FK = { fxl: [], hz: [], g: { camX: 0, sfx: (n) => AU.play(n) }, shift: null, bossScreen: () => [262 + S.bx, 90 + S.by] };
  function reset(full) {
    Object.assign(S, { t: 0, rt: S.rt || 0, shT: 0, mode: 'title', mt0: 0, lane: 'f', from: 'f', flipT: -9, proj: [], ev: [], fxs: [], chain: 0, inv: 0, hearts: 3, slow: 1, hstop: 0, shake: 0, shT: 0, bx: 0, by: 0, nextPat: 1.2, lastPat: -1, stg: null, hint: '', hintT: -9, worldFrom: null, worldK0: -9, retryT: -9 });
    if (full) Object.assign(S, { phase: 0, parries: 0, perfects: 0, hurt: 0, start: 0, taught: 0, bladeTaught: 0, end: null });
    S.phase = S.phase || 0;
    Object.assign(FK, { t: 0, mode: 'fight', modeT0: 0, introLen: 3.4, phase: S.phase, anim: { kind: 'idle', hits: [] }, hitT: -9, hp: PHASE_HP[S.phase], hpMax: 100 });
  }
  reset(true);
  const heroLane = () => (S.t - S.flipT < 0.07 ? S.from : S.lane);
  const laneY = (l, off) => (l === 'f' ? F - off : C + off);

  // ------------------------------------------------------------------ attacks
  const R0 = 1356; // where his mouth fires from (x)
  function fireball(lane, gold, v) { S.proj.push({ k: 'fire', lane, x: R0 - 60, v: -(v || 1150), gold, st: 'in', t0: S.t }); AU.play('fire'); }
  function blade(lane) { S.proj.push({ k: 'blade', lane, x: 1300, v: -1550, gold: false, st: 'in', t0: S.t }); AU.play('blade'); }
  function meteor(lane) { S.proj.push({ k: 'meteor', lane, x: HX, land: S.t + 0.95, st: 'in', t0: S.t }); AU.play('meteor'); }
  function breath(lane, dur) { S.proj.push({ k: 'breath', lane, x: 0, t1: S.t + dur, st: 'in', t0: S.t }); AU.play('breath'); }
  // queue: { at (launch), tele, anim kind, fn }
  function q(at, tele, kind, fn) { S.ev.push({ at, tele, kind, fn, said: false }); }
  const other = (l) => (l === 'f' ? 'c' : 'f');
  const PATS = [
    [ // phase I: learn it
      (t0) => { const l = heroLane(); q(t0 + 0.9, 0.9, 'beam', () => fireball(l, true)); return 1.9; },
      (t0) => { const l = heroLane(); q(t0 + 0.75, 0.75, 'slash', () => blade(l)); return 1.6; },
      (t0) => { const l = heroLane(); q(t0 + 0.75, 0.75, 'slash', () => blade(l)); q(t0 + 1.4, 0.5, 'beam', () => fireball(other(l), true)); return 2.4; },
      (t0) => { const l = heroLane(); q(t0 + 0.8, 0.8, 'beam', () => fireball(l, true)); q(t0 + 1.5, 0.45, 'beam', () => fireball(other(l), true)); return 2.6; }
    ],
    [ // phase II: faster, meteors, the twin blades
      (t0) => { const l = heroLane(); [0, 1, 2, 3].forEach((i) => q(t0 + 0.6 + i * 0.42, i ? 0.3 : 0.6, 'slash', () => blade(i % 2 ? other(l) : l))); return 2.6; },
      (t0) => { const l = heroLane(); q(t0 + 0.6, 0.6, 'pillar', () => meteor(l)); q(t0 + 1.35, 0.45, 'beam', () => fireball(l, true)); return 2.4; },
      (t0) => { const l = heroLane(); [0, 1, 2].forEach((i) => q(t0 + 0.65 + i * 0.55, i ? 0.4 : 0.65, 'beam', () => fireball(i % 2 ? other(l) : l, true, 1250))); return 2.8; },
      (t0) => { const l = heroLane(); q(t0 + 0.6, 0.6, 'slash', () => blade(l)); q(t0 + 1.1, 0.4, 'pillar', () => meteor(other(l))); q(t0 + 1.7, 0.45, 'beam', () => fireball(l, true, 1250)); return 2.7; }
    ],
    [ // phase III: UNBOUND — fire everywhere
      (t0) => { const l = heroLane(); q(t0 + 0.6, 0.6, 'beam', () => breath(l, 0.9)); q(t0 + 1.7, 0.5, 'beam', () => breath(other(l), 0.9)); q(t0 + 2.6, 0.4, 'beam', () => fireball(l, true, 1350)); return 3.4; },
      (t0) => { const l = heroLane(); [0, 1, 2, 3, 4].forEach((i) => q(t0 + 0.55 + i * 0.36, i ? 0.25 : 0.55, 'slash', () => blade(i % 2 ? other(l) : l))); return 2.7; },
      (t0) => { const l = heroLane(); [0, 1, 2].forEach((i) => q(t0 + 0.55 + i * 0.45, i ? 0.35 : 0.55, 'beam', () => fireball(i % 2 ? other(l) : l, true, 1400))); q(t0 + 2.0, 0.4, 'pillar', () => meteor(l)); return 2.9; },
      (t0) => { const l = heroLane(); q(t0 + 0.5, 0.5, 'pillar', () => meteor(l)); q(t0 + 1.0, 0.35, 'pillar', () => meteor(other(l))); q(t0 + 1.6, 0.4, 'slash', () => blade(l)); q(t0 + 2.1, 0.4, 'beam', () => fireball(other(l), true, 1350)); return 2.9; }
    ]
  ];
  function nextPattern() {
    const P = PATS[S.phase];
    let i = Math.floor(Math.random() * P.length); if (i === S.lastPat) i = (i + 1) % P.length;
    if (S.phase === 0 && !S.taught) i = 0;   // the very first one teaches the parry
    if (S.phase === 0 && S.taught && !S.bladeTaught) i = 1;
    S.lastPat = i; const len = P[i](S.t);
    S.nextPat = S.t + len + (S.phase === 2 ? 0.25 : 0.45);
  }

  // ------------------------------------------------------------------ input
  function tap() {
    AU.init();
    if (S.mode === 'title') { start(); return; }
    if (S.mode === 'won') { if (S.t - S.mt0 > 1.2) { reset(true); start(); } return; }
    if (S.mode === 'stagger') { qteTap(); return; }
    if (S.mode !== 'fight' && S.mode !== 'teach') return;
    // a gold attack right on you: send it back
    const hl = heroLane();
    let best = null, bd = 1e9;
    for (const p of S.proj) if (p.st === 'in' && p.gold && p.lane === hl) { const d = p.x - HX; if (d > -50 && d < 330 && d < bd) { bd = d; best = p; } }
    if (best) { parry(best, bd); return; }
    // otherwise: flip
    S.from = hl; S.lane = other(S.lane); S.flipT = S.t; AU.play('flip');   // (a second tap mid-flip flips back)
  }
  function parry(p, d) {
    const perfect = d < 130;
    p.st = 'back'; p.v = 2900; p.perfect = perfect; p.bt = S.t;
    S.chain++; S.parries++; if (perfect) S.perfects++;
    S.hstop = perfect ? 0.11 : 0.07; S.shake = Math.max(S.shake, perfect ? 22 : 12); S.shT = S.rt;
    S.fxs.push({ k: 'parry', x: HX + 40, y: laneY(p.lane, 60), t: S.rt, perfect });
    AU.play(perfect ? 'perfect' : 'parry');
    say(perfect ? 'PERFECT!' : 'PARRY!', perfect ? '#ffe9a0' : '#9ff0ff');
    if (S.mode === 'teach') { S.mode = 'fight'; S.slow = 1; S.taught = 1; hint(''); }
  }
  function say(txt, col) { S.fxs.push({ k: 'word', txt, col, t: S.rt }); }
  function hint(txt) { S.hint = txt; S.hintT = S.rt; }
  function damage(n, x, y) {
    FK.hp = Math.max(0, FK.hp - n); FK.hitT = FK.t;
    S.shake = Math.max(S.shake, 18); S.shT = S.rt;
    AU.play('hitBoss');
    S.fxs.push({ k: 'num', txt: '-' + n, x, y, t: S.rt });
    const nextHp = PHASE_HP[S.phase + 1];
    if (FK.hp <= 0) { die(); return; }
    if (nextHp !== undefined && FK.hp <= nextHp) trans();
  }
  function hurt(why) {
    if (S.inv > S.t) return;
    (window.__hurts = window.__hurts || []).push(why + '@' + S.t.toFixed(2) + ':' + S.phase);
    S.hearts--; S.hurt++; S.chain = 0; S.inv = S.t + 1.1; S.shake = 26; S.shT = S.rt; S.redT = S.rt; S.hstop = 0.08;
    AU.play('hurt');
    if (S.hearts <= 0) { S.mode = 'retry'; S.mt0 = S.t; S.proj.length = 0; S.ev.length = 0; say('AGAIN!', '#ff5a5a'); }
  }

  // ------------------------------------------------------------------ modes
  function start() {
    S.mode = 'intro'; S.mt0 = 0; S.t = 0; S.start = 0; FK.mode = 'intro'; FK.modeT0 = 0; FK.t = 0; FK.introLen = 3.4; AU.play('thunder');
  }
  function trans() {
    S.mode = 'trans'; S.mt0 = S.t; S.proj.length = 0; S.ev.length = 0; S.chain = 0;
    FK.mode = 'trans'; FK.modeT0 = FK.t; S.transTo = S.phase + 1; S.transSaid = false;
    AU.play('roar'); AU.play('thunder');
  }
  function die() {
    S.mode = 'dying'; S.mt0 = S.t; S.proj.length = 0; S.ev.length = 0; FK.mode = 'dying'; FK.modeT0 = FK.t; AU.play('roar');
  }
  function stagger() {
    S.mode = 'stagger'; S.mt0 = S.t; S.proj.length = 0; S.ev.length = 0; S.chain = 0;
    S.stg = { i: 0, rings: [[0, -262], [0, 130], [470, -300]].map((p, i) => ({ p, t0: S.t + 0.55 + i * 0.8, done: false, res: '' })) };
    AU.play('stagger'); AU.play('roar');
    FK.anim = { kind: 'idle', hits: [] };
  }
  function qteTap() {
    const st = S.stg; if (!st) return;
    const r = st.rings.find((x) => !x.done && S.t >= x.t0 - 0.1); if (!r) return;
    const k = seg(S.t, r.t0, r.t0 + 0.7), rad = lerp(240, 50, k), perfect = rad < 105 && rad > 45;
    r.done = true; r.res = perfect ? 'PERFECT' : 'HIT';
    const P = ringPos(r);
    S.fxs.push({ k: 'slash', x: P[0], y: P[1], t: S.rt, a: hs(S.rt) * TAU, big: perfect });
    S.hstop = 0.13; AU.play('slash');
    damage(perfect ? 5 : 3, P[0], P[1]);
  }
  let TP = { x: 1356, y: 600, sc: 0.6 };
  const ringPos = (r) => [TP.x + r.p[0] * TP.sc, TP.y + r.p[1] * TP.sc];

  // ------------------------------------------------------------------ update
  function update(dt) {
    if (S.hstop > 0) { S.hstop -= dt; return; }
    const sdt = dt * S.slow;
    S.t += sdt; FK.t = S.t; FK.phase = S.phase;
    const t = S.t;
    if (S.mode === 'intro') { if (t >= 3.4) { S.mode = 'fight'; FK.mode = 'fight'; FK.modeT0 = t; S.nextPat = t + 0.6; say('FIGHT!', '#ffd23f'); } return; }
    if (S.mode === 'trans') {
      const el = t - S.mt0;
      if (el >= 0.9 && !S.transSaid) { S.transSaid = true; S.worldFrom = WORLD[S.phase]; S.phase = S.transTo; S.worldK0 = t; FK.phase = S.phase; FF.HDBoss.title(NAMES[S.phase][0], NAMES[S.phase][1], NCOL[S.phase], 2.1); AU.play('thunder'); }
      if (el >= 2.6) { S.mode = 'fight'; FK.mode = 'fight'; FK.modeT0 = t; S.nextPat = t + 0.4; S.worldFrom = null; }
      return;
    }
    if (S.mode === 'dying') { if (t - S.mt0 >= 3.4) { S.mode = 'won'; S.mt0 = t; FK.mode = 'reward'; S.end = { time: t - S.start, parries: S.parries, perfects: S.perfects, hurt: S.hurt }; AU.play('win'); } return; }
    if (S.mode === 'won') return;
    if (S.mode === 'retry') { if (t - S.mt0 > 1.6) { S.hearts = 3; FK.hp = PHASE_HP[S.phase]; S.mode = 'fight'; S.nextPat = t + 0.6; } return; }
    if (S.mode === 'stagger') {
      const el = t - S.mt0; S.slow = 1;
      S.by = lerp(S.by, 16, 0.15);
      if (S.stg.rings.every((r) => r.done || t > r.t0 + 0.75) && el > 3.2) { S.mode = 'fight'; S.stg = null; S.nextPat = t + 0.7; AU.play('roar'); }
      for (const r of S.stg ? S.stg.rings : []) if (!r.done && t > r.t0 + 0.75) { r.done = true; r.res = 'MISS'; }
      return;
    }
    S.by = lerp(S.by, 0, 0.1);
    // the attack queue: announce (his wind-up), then launch
    if (!S.ev.length && t >= S.nextPat && S.mode === 'fight') nextPattern();
    for (const e of S.ev) {
      if (!e.said && t >= e.at - e.tele) { e.said = true; FK.anim = { kind: e.kind, t0: e.at - e.tele, tl: e.at, hits: [e.at] }; if (e.kind === 'beam') AU.play('charge'); }
      if (!e.done && t >= e.at) { e.done = true; e.fn(); }
    }
    S.ev = S.ev.filter((e) => !e.done);
    // projectiles
    const hl = heroLane();
    for (const p of S.proj) {
      if (p.st === 'dead') continue;
      if (p.k === 'fire' || p.k === 'blade') {
        p.x += p.v * sdt;
        if (p.st === 'in') {
          // the first gold one: slow time at the window and show the finger
          if (p.gold && !S.taught && S.mode === 'fight' && p.x - HX < 300 && p.lane === hl) { S.mode = 'teach'; S.slow = 0.18; hint('TAP NOW: SEND IT BACK!'); }
          if (p.k === 'blade' && !S.bladeTaught && p.x - HX < 700) { S.bladeTaught = 1; hint('RED CAN\'T BE SENT BACK: FLIP AWAY!'); }
          if (Math.abs(p.x - HX) < 60) { if (p.lane === hl) { hurt(p.k + (p.gold ? 'G' : '')); p.st = 'dead'; if (S.mode === 'teach') { S.mode = 'fight'; S.slow = 1; } } }
          if (p.x < -200) p.st = 'dead';
          if (S.mode === 'teach' && p.x < HX - 80) { S.mode = 'fight'; S.slow = 1; hint(''); }
        } else if (p.st === 'back') {
          if (p.x >= TP.x - 60) { p.st = 'dead'; damage(p.perfect ? 4 : 3, TP.x, TP.y + 130 * TP.sc); if (S.chain >= 3 && S.mode === 'fight') stagger(); }
        }
      } else if (p.k === 'meteor') {
        if (t >= p.land && p.st === 'in') { p.st = 'boom'; p.bt = t; AU.play('impact'); S.shake = Math.max(S.shake, 14); S.shT = S.rt; if (hl === p.lane) hurt('meteor'); }
        if (p.st === 'boom' && t - p.bt > 0.6) p.st = 'dead';
      } else if (p.k === 'breath') {
        if (t > p.t1) p.st = 'dead'; else if (t > p.t0 + 0.12 && hl === p.lane) hurt('breath');
      }
    }
    S.proj = S.proj.filter((p) => p.st !== 'dead');
  }

  // ------------------------------------------------------------------ drawing
  const cv = document.getElementById('c'), ctx = cv.getContext('2d', { alpha: false });
  let sc = 1, ox = 0, oy = 0;
  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), vw = window.innerWidth, vh = window.innerHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    sc = Math.min(cv.width / W, cv.height / H); ox = (cv.width - W * sc) / 2; oy = (cv.height - H * sc) / 2;
    ART.use(Math.round(W * sc), Math.round(H * sc));
  }
  window.addEventListener('resize', fit); fit();
  // the hero: INFINITY VOID, a dark cube with a window into space and a crown of white flame
  function hero(rt) {
    const G = ctx, el = S.t - S.flipT, k = sm(cl(el / 0.16)), y0 = S.from === 'f' ? F : C, y1 = S.lane === 'f' ? F : C;
    const y = lerp(y0, y1, k), up = lerp(S.from === 'c' ? 1 : 0, S.lane === 'c' ? 1 : 0, k), sq = el < 0.16 ? Math.sin(k * Math.PI) * 0.25 : Math.max(0, 0.18 * (1 - (el - 0.16) / 0.12));
    if (S.inv > S.t && Math.floor(rt * 20) % 2) return;
    G.save(); G.translate(HX, y); G.rotate(up * Math.PI); G.scale(1 + sq * 0.2, 1 - sq * 0.2);
    const s = HS, bx = -s / 2, by = -s * 1.05;
    HD.glow(0, -s / 2, s * 2.2, '#5ae0ff', 0.35); HD.glow(0, -s / 2, s * 1.1, '#9a6aff', 0.25);
    // speed lines behind (he is running)
    for (let i = 0; i < 6; i++) { const yy = -s * 0.1 - hs(i) * s, ll = 80 + hs(i + 3) * 120, xx = -s / 2 - ((rt * 900 + i * 70) % 200); G.fillStyle = 'rgba(160,230,255,0.25)'; G.fillRect(xx - ll, yy, ll, 3); }
    G.fillStyle = '#03040f'; G.beginPath(); G.roundRect(bx - 5, by - 5, s + 10, s + 10, s * 0.18); G.fill();
    const body = new Path2D(); body.roundRect(bx, by, s, s, s * 0.14);
    G.fillStyle = HD.rad(bx + s * 0.4, by + s * 0.4, 0, s, [[0, '#3a2a8a'], [0.5, '#141a4a'], [1, '#05061a']]); G.fill(body);
    G.save(); G.clip(body); for (let i = 0; i < 26; i++) { const sx = bx + hs(i) * s, sy = by + ((hs(i + 3) * s + rt * 14 * (0.5 + hs(i + 5))) % s), tw = 0.5 + 0.5 * Math.sin(rt * 5 + i * 2); G.fillStyle = rgba('#ffffff', 0.4 + 0.6 * tw); G.fillRect(sx, sy, 3, 3); } G.restore();
    const lk = 0.5; [-1, 1].forEach((d) => { const ex = d * s * 0.19 + lk * 6, ey = by + s * 0.42; HD.glow(ex, ey, s * 0.5, '#5ae0ff', 0.6); G.fillStyle = '#dff6ff'; G.beginPath(); G.roundRect(ex - s * 0.085, ey - s * 0.135, s * 0.17, s * 0.27, 4); G.fill(); });
    G.save(); G.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const fx = bx + s * (0.08 + i * 0.14), h0 = s * (0.25 + (i % 2 ? 0.12 : 0.28) + (i === 3 ? 0.18 : 0)) * (0.85 + 0.2 * Math.sin(rt * 12 + i * 2)), w = s * 0.08; const p = new Path2D(); p.moveTo(fx - w, by + 2); p.quadraticCurveTo(fx - w * 0.4, by - h0 * 0.6, fx + Math.sin(rt * 7 + i) * w * 0.6, by - h0); p.quadraticCurveTo(fx + w * 0.4, by - h0 * 0.6, fx + w, by + 2); p.closePath(); G.fillStyle = HD.lin(0, by, 0, by - h0, [[0, 'rgba(255,255,255,0.95)'], [0.6, 'rgba(191,240,255,0.7)'], [1, 'rgba(120,200,255,0)']]); G.fill(p); }
    G.restore();
    G.restore();
  }
  function drawProj(rt) {
    const G = ctx;
    for (const p of S.proj) {
      if (p.k === 'fire') {
        const y = laneY(p.lane, 64), col = p.st === 'back' ? '#bff0ff' : p.gold ? '#ffd27a' : '#ff3a1a', dir = p.st === 'back' ? -1 : 1;
        for (let i = 7; i >= 1; i--) HD.glow(p.x + dir * i * 34, y + Math.sin(rt * 30 + i) * 6, 70 - i * 6, p.st === 'back' ? '#7fe8ff' : '#ff6a1a', 0.45 * (1 - i / 8));
        HD.glow(p.x, y, 190, col, 0.8); HD.glow(p.x, y, 70, '#ffffff', 0.95);
        if (p.gold && p.st === 'in') { // a ring that says "this one can go back"
          const d = p.x - HX, ready = d > -50 && d < 330 && p.lane === heroLane();
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(ready ? '#ffffff' : '#ffd27a', ready ? 0.95 : 0.6); ctx.lineWidth = ready ? 7 : 4; ctx.beginPath(); ctx.arc(p.x, y, 64 + Math.sin(rt * 20) * 6, 0, TAU); ctx.stroke(); ctx.restore();
        }
      } else if (p.k === 'blade') {
        const y0 = p.lane === 'f' ? F - 300 : C, y1 = y0 + 300;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let tr = 3; tr >= 0; tr--) { const ax = p.x + tr * 50; ctx.strokeStyle = rgba(tr ? '#ff3a2a' : '#ffd0c0', tr ? 0.18 * (4 - tr) : 0.95); ctx.lineWidth = tr ? 24 : 12; ctx.beginPath(); ctx.moveTo(ax + 70, y0); ctx.quadraticCurveTo(ax - 40, (y0 + y1) / 2, ax + 70, y1); ctx.stroke(); }
        ctx.restore(); HD.glow(p.x + 20, (y0 + y1) / 2, 220, '#ff3a2a', 0.5);
      } else if (p.k === 'meteor') {
        const surf = p.lane === 'f' ? F : C;
        if (p.st === 'in') {
          const k = seg(S.t, p.t0, p.land), mx = lerp(HX + 900, HX, k * k), my = lerp(p.lane === 'f' ? -200 : H + 200, surf, k * k);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#ff3a2a', 0.5 + 0.5 * Math.sin(rt * 25)); ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(HX, surf, 110 - 40 * k, 26, 0, 0, TAU); ctx.stroke(); ctx.restore();
          for (let i = 6; i >= 0; i--) HD.glow(mx + i * 40 * (900 / 900), my + (p.lane === 'f' ? -1 : 1) * i * 50, 80 - i * 8, '#ff6a1a', 0.5);
          HD.glow(mx, my, 140, '#ffb050', 0.9); ctx.fillStyle = '#2a0e08'; ctx.beginPath(); ctx.arc(mx, my, 34, 0, TAU); ctx.fill();
        } else { const e = S.t - p.bt; HD.glow(HX, surf, 500 * (0.4 + e), '#ff8a3a', 0.9 * (1 - e / 0.6)); for (let i = 0; i < 10; i++) { const a = hs(i) * Math.PI - (p.lane === 'f' ? Math.PI : 0), d = e * 700; HD.glow(HX + Math.cos(a) * d, surf + Math.sin(a) * d * 0.6, 26, '#ffb050', 0.8 * (1 - e / 0.6)); } }
      } else if (p.k === 'breath') {
        const y0 = p.lane === 'f' ? MID + 20 : C, hh = p.lane === 'f' ? F - MID - 20 : MID - 20 - C, q = Math.min(1, (S.t - p.t0) / 0.12) * Math.min(1, (p.t1 - S.t) / 0.1);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = HD.lin(0, y0, 0, y0 + hh, [[0, 'rgba(255,90,20,0)'], [0.5, rgba('#ffd27a', 0.75 * q)], [1, 'rgba(255,90,20,0)']]); ctx.fillRect(0, y0, R0, hh); ctx.restore();
        for (let i = 0; i < 12; i++) HD.glow(R0 * (i / 12) + Math.sin(rt * 30 + i) * 20, y0 + hh / 2 + Math.sin(rt * 17 + i * 3) * hh * 0.3, 140, '#ff6a1a', 0.4 * q);
      }
    }
    // a breath being drawn in: the band glows a warning
    for (const e of S.ev) if (e.said && e.kind === 'beam' && e.fn.toString().indexOf('breath') >= 0) { /* (the mouth glow already warns) */ }
  }
  function drawFx(rt) {
    const G = ctx;
    for (const f of S.fxs) {
      const e = rt - f.t;
      if (f.k === 'parry') { if (e > 0.45) { f.dead = 1; continue; } G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba(f.perfect ? '#ffe9a0' : '#bff0ff', 1 - e / 0.45); G.lineWidth = 16 * (1 - e / 0.45) + 2; G.beginPath(); G.arc(f.x, f.y, 40 + e * 600, 0, TAU); G.stroke(); G.restore(); HD.glow(f.x, f.y, 300 * (1 - e), f.perfect ? '#ffd27a' : '#7fe8ff', 0.9 * (1 - e / 0.45)); for (let i = 0; i < 14; i++) { const a = hs(i + f.t) * TAU, d = e * 900; HD.glow(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 22, '#ffffff', 1 - e / 0.45); } }
      else if (f.k === 'slash') { if (e > 0.5) { f.dead = 1; continue; } const L = 700 * (f.big ? 1.3 : 1), k = eo(cl(e / 0.12)); G.save(); G.translate(f.x, f.y); G.rotate(f.a); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffffff', 1 - e / 0.5); G.lineWidth = 34 * (1 - e / 0.5) + 4; G.beginPath(); G.moveTo(-L / 2, 0); G.lineTo(-L / 2 + L * k, 0); G.stroke(); G.strokeStyle = rgba('#7fe8ff', 0.7 * (1 - e / 0.5)); G.lineWidth = 80 * (1 - e / 0.5); G.stroke(); G.restore(); HD.glow(f.x, f.y, 500, '#bff0ff', 0.8 * (1 - e / 0.5)); }
      else if (f.k === 'num') { if (e > 0.9) { f.dead = 1; continue; } G.save(); G.globalAlpha = 1 - seg(e, 0.6, 0.9); G.font = '900 ' + (e < 0.08 ? 110 : 80) + 'px Cinzel, serif'; G.textAlign = 'center'; G.fillStyle = '#fff2d0'; G.shadowColor = '#ff6a1a'; G.shadowBlur = 20; G.fillText(f.txt, f.x - 140, f.y - 40 - e * 90); G.restore(); }
      else if (f.k === 'word') { if (e > 0.9) { f.dead = 1; continue; } const k = eo(cl(e / 0.12)); G.save(); G.globalAlpha = 1 - seg(e, 0.6, 0.9); G.translate(W * 0.36, H * 0.42); G.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); G.font = '900 96px Cinzel, serif'; G.textAlign = 'center'; G.letterSpacing = '8px'; G.fillStyle = f.col; G.shadowColor = f.col; G.shadowBlur = 30; G.fillText(f.txt, 0, 0); G.restore(); }
    }
    S.fxs = S.fxs.filter((f) => !f.dead);
  }
  function hud(rt) {
    const G = ctx;
    // his health: a long burning bar
    if (S.mode !== 'title' && S.mode !== 'won') {
      const w = 1100, x0 = (W - w) / 2, y0 = 70, k = FK.hp / 100;
      G.fillStyle = 'rgba(0,0,0,0.55)'; G.fillRect(x0 - 6, y0 - 6, w + 12, 30);
      G.fillStyle = HD.lin(x0, 0, x0 + w, 0, [[0, '#ff3a10'], [1, '#ffd27a']]); G.fillRect(x0, y0, w * k, 18);
      G.fillStyle = 'rgba(255,255,255,0.35)'; [0.66, 0.33].forEach((m) => G.fillRect(x0 + w * m, y0 - 4, 3, 26));
      G.font = '700 30px Cinzel, serif'; G.textAlign = 'center'; G.fillStyle = '#f2e2c8'; G.letterSpacing = '6px'; G.fillText('THE CRIMSON TYRANT', W / 2, y0 - 16);
      // your hearts and your chain
      for (let i = 0; i < 3; i++) { const on = i < S.hearts; G.fillStyle = on ? '#ff3a5a' : 'rgba(255,255,255,0.15)'; G.beginPath(); const x = 80 + i * 70, y = 90; G.moveTo(x, y + 18); G.bezierCurveTo(x - 34, y - 6, x - 14, y - 30, x, y - 10); G.bezierCurveTo(x + 14, y - 30, x + 34, y - 6, x, y + 18); G.fill(); }
      for (let i = 0; i < 3; i++) { const on = i < S.chain; G.save(); G.translate(80 + i * 70, 160); G.rotate(Math.PI / 4); G.fillStyle = on ? '#ffd27a' : 'rgba(255,255,255,0.15)'; G.fillRect(-14, -14, 28, 28); G.restore(); if (on) HD.glow(80 + i * 70, 160, 50, '#ffd27a', 0.6); }
    }
    if (S.hint && rt - S.hintT < 3.2) { G.save(); G.globalAlpha = Math.min(1, (rt - S.hintT) * 5) * (1 - seg(rt - S.hintT, 2.6, 3.2)); G.font = '700 50px Cinzel, serif'; G.textAlign = 'center'; G.fillStyle = '#ffffff'; G.shadowColor = '#000'; G.shadowBlur = 16; G.fillText(S.hint, W / 2, H * 0.62); G.restore(); }
    if (S.mode === 'teach') { // the finger
      const p = S.proj.find((x) => x.gold && x.st === 'in'); if (p) { const y = laneY(p.lane, 64); G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffffff', 0.6 + 0.4 * Math.sin(rt * 14)); G.lineWidth = 8; G.beginPath(); G.arc(HX + 80, y, 120 + 20 * Math.sin(rt * 14), 0, TAU); G.stroke(); G.restore(); }
    }
    // the kneeling QTE: three rings closing on his body
    if (S.mode === 'stagger' && S.stg) for (const r of S.stg.rings) {
      const P = ringPos(r);
      if (r.done) { if (S.t - r.t0 < 1.4) { G.save(); G.font = '900 54px Cinzel, serif'; G.textAlign = 'center'; G.fillStyle = r.res === 'MISS' ? '#888' : '#ffe9a0'; G.fillText(r.res, P[0], P[1] - 90); G.restore(); } continue; }
      if (S.t < r.t0 - 0.15) continue;
      const k = seg(S.t, r.t0, r.t0 + 0.7), rad = lerp(240, 50, k);
      G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = 'rgba(255,240,200,0.9)'; G.lineWidth = 8; G.beginPath(); G.arc(P[0], P[1], rad, 0, TAU); G.stroke();
      G.strokeStyle = 'rgba(255,210,122,0.8)'; G.lineWidth = 5; G.beginPath(); G.arc(P[0], P[1], 75, 0, TAU); G.stroke(); G.restore();
      HD.glow(P[0], P[1], 120, '#ffd27a', 0.5);
    }
    if (S.mode === 'stagger') { G.save(); G.font = '900 64px Cinzel, serif'; G.textAlign = 'center'; G.fillStyle = '#ffe9a0'; G.shadowColor = '#ff8a3a'; G.shadowBlur = 24; G.fillText('TAP THE RINGS!', W * 0.36, H * 0.24); G.restore(); }
  }
  function cards(rt) {
    const G = ctx;
    if (S.mode === 'title') {
      G.fillStyle = 'rgba(0,0,0,0.55)'; G.fillRect(0, 0, W, H);
      G.save(); G.textAlign = 'center'; G.font = '900 120px Cinzel, serif'; G.letterSpacing = '12px'; G.fillStyle = '#ff6a2a'; G.shadowColor = '#ff3a10'; G.shadowBlur = 40; G.fillText('THE CRIMSON TYRANT', W / 2, H * 0.38);
      G.shadowBlur = 0; G.font = '700 44px Cinzel, serif'; G.letterSpacing = '6px'; G.fillStyle = '#f2e6cc';
      G.fillText('TAP = FLIP', W / 2, H * 0.56); G.fillStyle = '#ffd27a'; G.fillText('GOLD ATTACK + TAP AT THE LAST MOMENT = SEND IT BACK', W / 2, H * 0.64);
      G.fillStyle = '#ff8a7a'; G.fillText('RED ATTACK = FLIP AWAY', W / 2, H * 0.72);
      G.globalAlpha = 0.6 + 0.4 * Math.sin(rt * 4); G.fillStyle = '#ffffff'; G.fillText('TAP TO START', W / 2, H * 0.86); G.restore();
    }
    if (S.mode === 'won' && S.end) {
      const k = seg(S.t - S.mt0, 0, 0.6);
      G.fillStyle = 'rgba(0,0,0,' + (0.6 * k) + ')'; G.fillRect(0, 0, W, H);
      G.save(); G.globalAlpha = k; G.textAlign = 'center'; G.font = '900 140px Cinzel, serif'; G.letterSpacing = '14px'; G.fillStyle = '#ffd27a'; G.shadowColor = '#ff8a3a'; G.shadowBlur = 40; G.fillText('VICTORY', W / 2, H * 0.34);
      G.shadowBlur = 0; G.font = '700 46px Cinzel, serif'; G.letterSpacing = '4px'; G.fillStyle = '#f2e6cc'; const e = S.end;
      const rank = e.hurt === 0 && e.perfects >= 8 ? 'S' : e.hurt <= 2 ? 'A' : e.hurt <= 5 ? 'B' : 'C';
      [['TIME', e.time.toFixed(1) + 's'], ['PARRIES', e.parries], ['PERFECT', e.perfects], ['HITS TAKEN', e.hurt], ['RANK', rank]].forEach((r, i) => G.fillText(r[0] + '   ' + r[1], W / 2, H * 0.5 + i * 62));
      G.globalAlpha = k * (0.6 + 0.4 * Math.sin(rt * 4)); G.fillText('TAP TO FIGHT AGAIN', W / 2, H * 0.92); G.restore();
    }
    if (S.redT && rt - S.redT < 0.35) { G.fillStyle = 'rgba(255,0,30,' + (0.35 * (1 - (rt - S.redT) / 0.35)) + ')'; G.fillRect(0, 0, W, H); }
    if (S.mode === 'retry') { G.fillStyle = 'rgba(0,0,0,' + Math.min(0.6, (S.t - S.mt0)) + ')'; G.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------------ the loop
  let last = performance.now(), rt = 0, fps = 60, prebaking = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; rt += dt; S.rt = rt; fps = fps * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05;
    if (prebaking) { prebaking = ART.prebake(); }
    if (S.mode !== 'title') update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    const shk = (S.shake || 0) * Math.exp(-(rt - (S.shT || 0)) / 0.12); if (!(shk >= 0.5)) S.shake = 0;
    const sx = shk * Math.sin(rt * 71), sy = shk * Math.cos(rt * 63);
    ctx.setTransform(sc, 0, 0, sc, ox + sx * sc, oy + sy * sc);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    HD.setCtx(ctx); ART.rt(rt);
    const wid = WORLD[S.phase], wk = S.worldFrom ? cl((S.t - S.worldK0) / 1.0) : 1;
    FK.t = S.t;
    const bolt = ART.world(FK, rt, wid, S.worldFrom, wk);
    const pos = ART.tyrant(FK, rt, bolt); if (pos) TP = pos;
    drawProj(rt);
    ART.front(FK, rt, wid, pos);
    if (S.mode !== 'title') hero(rt);
    drawFx(rt);
    hud(rt);
    ART.title(rt);
    cards(rt);
    if (location.hash === '#fps') { ctx.font = '30px monospace'; ctx.fillStyle = '#0f0'; ctx.fillText(fps.toFixed(0) + ' fps', 20, H - 20); }
    ctx.restore();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const go = (e) => { e.preventDefault(); tap(); };
  cv.addEventListener('pointerdown', go);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') go(e); if (e.code === 'KeyM') muted = !muted; });
  window.__P = { S, FK, tap, update, view: () => [sc, ox, oy, cv.width, cv.height] };   // (tests)
})();
