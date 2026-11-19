// FLIPNOVA — build 47 ⚔️ THE CRIMSON TYRANT, the run-and-gun boss fight (Cuphead x Geometry Dash, one tap).
// You run fast through spikes, saws and walls (tap = flip floor <-> ceiling). INFINITY VOID shoots by himself, all the
// time, at the Tyrant, who MOVES and attacks: phase 1 he looms ahead (fans of fire, aimed shots, sword waves, ground
// shocks, meteors); phase 2 he leaps BEHIND you and chases (stabs along your lane, fire breath, boulders thrown ahead);
// phase 3 UNBOUND he flies around the arena (dashes across the screen, fire spirals, meteor rain). Blue orbs fill a
// SUPER: a beam that tears him apart. 3 hearts; out of hearts = the phase again (with how close you were).
//   FF.TyrantFight.play({ lang, muted }, onDone)  -> full-screen overlay; onDone({ win, quit, time, deaths, rank }) once
//   FF.TyrantFight.active()
// Painted with the trailer's art (js/hdart.js + js/hdboss.js). No music: every sound is an effect.
(function (FF) {
  'use strict';
  const HD = FF.HD;
  if (!HD || !FF.HDBoss) return;
  const ART = FF.HDBoss.art;
  const W = 1920, H = 1080, C = 216, F = 936, MIDY = (C + F) / 2;
  const { cl, seg, sm, eo, lerp, hs, rgba, mixc, TAU } = HD;
  const G = 15600, MAXV = 2760, KICK = 380, PR = 38;                // FLIPNOVA's own flip, 6x
  const SPEED = [980, 1150, 1320], PHASE_HP = [100, 67, 34], WORLD = ['citadel', 'mirror', 'collapse'];
  const TITLES = [['THE CRIMSON TYRANT', ''], ['THE CHASE', 'PHASE II'], ['THE TYRANT UNBOUND', 'PHASE III']], TCOL = ['#ff5a2a', '#7fe8ff', '#ff8a3a'];
  const SUPER_DMG = 7;
  // FURY: dodge without getting hit and your fire grows (one stream, faster, then two streams); a hit takes it all away
  const FURY = [{ at: 0, dt: 0.11, dmg: 0.09, n: 1, col: '#7fe8ff', name: '' }, { at: 8, dt: 0.085, dmg: 0.1, n: 1, col: '#9ff6ff', name: 'FURY x2' }, { at: 20, dt: 0.085, dmg: 0.068, n: 2, col: '#d9a6ff', name: 'FURY x3' }];
  const furyLv = () => (S.combo >= FURY[2].at ? 2 : S.combo >= FURY[1].at ? 1 : 0);

  // ------------------------------------------------------------------ sound: synthesized effects only
  const AU = {
    ctx: null, out: null, rev: null, nb: null, muted: false,
    init(ctx) {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const A = window.AudioContext || window.webkitAudioContext; if (!A && !ctx) return;
      const c = (this.ctx = ctx || new A()), comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.out = c.createGain(); this.out.gain.value = 0.85; this.out.connect(comp).connect(c.destination);
      const n = Math.floor(c.sampleRate * 2.2), b = c.createBuffer(2, n, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
      this.rev = c.createConvolver(); this.rev.buffer = b; const rg = c.createGain(); rg.gain.value = 0.3; this.rev.connect(rg).connect(this.out);
      const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.nb = nb;
      if (c.state === 'suspended') c.resume();
    },
    env(node, t, a, peak, d, wet) { const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, d / 4); node.connect(g); g.connect(this.out); if (wet !== 0) { const s = this.ctx.createGain(); s.gain.value = wet || 0.45; g.connect(s).connect(this.rev); } },
    noise(t, dur, type, f0, f1, q, peak, a, d, wet) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q || 1; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); s.connect(f); this.env(f, t, a || 0.005, peak, d || dur, wet); s.start(t, Math.random(), dur + 0.3); },
    tone(t, type, f0, f1, dur, peak, d) { const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); this.env(o, t, 0.004, peak, d || dur); o.start(t); o.stop(t + dur + 0.5); },
    play(n) {
      if (!this.ctx || this.muted) return; const t = this.ctx.currentTime;
      switch (n) {
        case 'flip': this.noise(t, 0.12, 'bandpass', 700, 2600, 1.5, 0.3, 0.008, 0.1); break;
        case 'shot': this.noise(t, 0.03, 'highpass', 5000, 0, 1, 0.05, 0.001, 0.025, 0); break;
        case 'hit': this.noise(t, 0.05, 'bandpass', 1800, 0, 2, 0.12, 0.001, 0.05, 0); break;
        case 'chunk': this.tone(t, 'sine', 120, 40, 0.5, 0.6, 0.45); this.noise(t, 0.25, 'lowpass', 1600, 200, 1, 0.5, 0.002, 0.22); break;
        case 'hurt': this.tone(t, 'sine', 90, 38, 0.5, 0.9, 0.4); this.noise(t, 0.35, 'lowpass', 1000, 150, 1, 0.8, 0.002, 0.3); this.noise(t, 0.08, 'highpass', 2500, 0, 1, 0.5, 0.001, 0.06); break;
        case 'fire': this.noise(t, 0.45, 'lowpass', 300, 2400, 0.8, 0.4, 0.04, 0.4); break;
        case 'blade': this.noise(t, 0.25, 'bandpass', 4200, 700, 2, 0.5, 0.004, 0.22); break;
        case 'charge': this.noise(t, 0.6, 'bandpass', 200, 1900, 3, 0.25, 0.5, 0.1); break;
        case 'pound': this.tone(t, 'sine', 80, 30, 0.9, 1.0, 0.9); this.noise(t, 0.6, 'lowpass', 900, 80, 1, 0.8, 0.003, 0.6); break;
        case 'meteor': this.noise(t, 0.8, 'bandpass', 3000, 300, 3, 0.25, 0.6, 0.15); break;
        case 'impact': this.tone(t, 'sine', 100, 34, 0.8, 0.8, 0.8); this.noise(t, 0.35, 'lowpass', 2000, 150, 1, 0.6, 0.002, 0.35); break;
        case 'breath': this.noise(t, 1.1, 'lowpass', 800, 1500, 0.7, 0.45, 0.08, 1.0); break;
        case 'lunge': this.noise(t, 0.5, 'bandpass', 500, 3000, 1.2, 0.6, 0.02, 0.45); this.tone(t + 0.3, 'sine', 90, 35, 0.6, 0.7, 0.5); break;
        case 'fury': this.noise(t, 0.5, 'bandpass', 400, 5000, 2, 0.45, 0.02, 0.45); this.tone(t, 'sine', 70, 140, 0.4, 0.5, 0.35); break;
        case 'close': this.noise(t, 0.18, 'bandpass', 6000, 2500, 3, 0.35, 0.002, 0.16); break;
        case 'push': this.noise(t, 0.08, 'bandpass', 1200, 3000, 2, 0.3, 0.002, 0.07, 0); this.tone(t, 'sine', 70, 45, 0.15, 0.4, 0.12); break;
        case 'lost': this.noise(t, 0.4, 'highpass', 3000, 900, 1, 0.4, 0.002, 0.35); break;
        case 'orb': this.noise(t, 0.12, 'bandpass', 3500, 6000, 4, 0.25, 0.003, 0.1); break;
        case 'super': this.noise(t, 1.4, 'bandpass', 300, 4000, 1, 0.7, 0.05, 1.3); this.tone(t, 'sine', 60, 30, 1.6, 1.0, 1.5); break;
        case 'roar': { const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(); o.type = o2.type = 'sawtooth'; o.frequency.setValueAtTime(48, t); o.frequency.linearRampToValueAtTime(64, t + 0.5); o.frequency.linearRampToValueAtTime(40, t + 1.3); o2.frequency.setValueAtTime(73, t); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 3; const ws = c.createWaveShaper(), cu = new Float32Array(1024); for (let i = 0; i < 1024; i++) cu[i] = Math.tanh((i / 511.5 - 1) * 4); ws.curve = cu; o.connect(ws); o2.connect(ws); ws.connect(f); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.65, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 1.4); f.connect(g).connect(this.out); const s = c.createGain(); s.gain.value = 0.6; g.connect(s).connect(this.rev); o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5); this.noise(t, 1.3, 'bandpass', 700, 400, 1.2, 0.25, 0.2, 1.1); break; }
        case 'thunder': case 'shatter': this.noise(t, 0.2, 'highpass', 1500, 0, 1, 0.6, 0.002, 0.2); this.noise(t + 0.05, 2.2, 'lowpass', 300, 80, 1, 0.7, 0.05, 2.1); break;
        case 'win': this.tone(t, 'sine', 90, 30, 2.5, 1.0, 2.4); this.noise(t, 2.5, 'lowpass', 2000, 100, 1, 0.8, 0.01, 2.4); break;
        case 'down': this.tone(t, 'sine', 140, 40, 1.2, 0.8, 1.1); this.noise(t, 0.9, 'lowpass', 600, 80, 1, 0.6, 0.01, 0.9); break;
        default: break;
      }
    }
  };

  // ------------------------------------------------------------------ the fight
  let S = null, root = null, cv = null, cx = null, raf = 0, doneCb = null, finished = true, sc = 1, ox = 0, oy = 0, last = 0, L = 0;
  const FK = { fxl: [], hz: [], g: { camX: 0, sfx: (n) => AU.play(n === 'bossRoar' ? 'roar' : n) }, shift: null, bossScreen: () => [262, 90] };
  const lanePY = (g) => (g > 0 ? F - 40 : C + 40);   // the hero's centre on a surface (g>0: floor)
  function newState() {
    return { t: 0, rt: 0, mode: 'intro', mt0: 0, phase: 0, hp: 100, hearts: 3, inv: 0, deaths: 0, start: 0,
      p: { y: F - 40, vy: 0, g: 1, x: 420 }, dist: 0, speed: 0, obs: [], genX: 1600, foes: [], shots: [], fireT: 0, sparks: [], words: [],
      orbs: 0, superT: -9, superOn: false, superReady: -1, boss: { x: 1450, y: 640, sc: 1, flip: false, px: 1450, py: 640, nextAct: 2.2, act: null, hitN: 0 },
      combo: 0, closeT: -9, hurtT: -9, clash: null, clashDone: false, trail: [], shake: 0, shT: 0, redT: -9, hstop: 0, worldFrom: null, worldK0: -9, trans: null, best: 0, taught: false };
  }
  const bossTarget = () => [S.boss.x, S.boss.y + 130 * S.boss.sc * 0.6];   // his chest, where the shots land
  const say = (txt, col, big, at) => S.words.push({ txt, col, t: S.rt, big: !!big, at });
  function shake(a) { const cur = S.shake * Math.exp(-(S.rt - S.shT) / 0.12); S.shake = Math.max(cur, a); S.shT = S.rt; }

  // ------------------------------------------------------------------ the level: chunks of obstacles (fair at each speed)
  const CH = [
    (x, sp) => [{ k: 'spk', wx: x, side: 'f', n: 2 }],
    (x, sp) => [{ k: 'spk', wx: x, side: 'c', n: 2 }],
    (x, sp) => [{ k: 'spk', wx: x, side: 'f', n: 2 }, { k: 'spk', wx: x + sp * 0.62, side: 'c', n: 2 }],
    (x, sp) => [{ k: 'wall', wx: x, side: 'c' }, { k: 'orb', wx: x + sp * 0.35, y: F - 40 }],
    (x, sp) => [{ k: 'wall', wx: x, side: 'f' }, { k: 'orb', wx: x + sp * 0.35, y: C + 40 }],
    (x, sp) => [{ k: 'saw', wx: x, y: MIDY, amp: 0, r: 80 }, { k: 'spk', wx: x + sp * 0.55, side: 'f', n: 1 }],
    (x, sp) => [{ k: 'saw', wx: x, y: F - 40, amp: 0, r: 70 }],
    (x, sp) => [{ k: 'saw', wx: x, y: C + 40, amp: 0, r: 70 }],
    (x, sp) => [{ k: 'wall', wx: x, side: 'c' }, { k: 'wall', wx: x + sp * 0.62, side: 'f' }, { k: 'wall', wx: x + sp * 1.24, side: 'c' }],
    (x, sp) => [{ k: 'saw', wx: x, y: MIDY, amp: 220, r: 70, ph: 0 }, { k: 'orb', wx: x + sp * 0.3, y: MIDY }]
  ];
  const POOL = [[0, 1, 2, 3, 4, 6, 7, 5], [0, 1, 2, 3, 4, 5, 6, 7, 8], [2, 5, 6, 7, 8, 9, 3, 4]];
  function genLevel() {
    const sp = SPEED[S.phase], gap = [0.95, 0.8, 0.72][S.phase] * sp;
    while (S.genX < S.dist + 2600) {
      const pool = POOL[S.phase], i = pool[Math.floor(Math.random() * pool.length)], list = CH[i](S.genX, sp);
      let end = S.genX; for (const o of list) { S.obs.push(o); end = Math.max(end, o.wx + (o.k === 'spk' ? o.n * 80 : 90)); }
      S.genX = end + gap * (0.85 + Math.random() * 0.5);
    }
    S.obs = S.obs.filter((o) => o.wx - S.dist > -600 && !o.gone);
  }
  const sx = (wx) => wx - S.dist + S.p.x;   // world x -> screen x

  // ------------------------------------------------------------------ his attacks
  function fireball(x, y, vx, vy, big) { S.foes.push({ k: 'ball', x, y, vx, vy, r: big ? 58 : 44, t0: S.t }); }
  function mouth() { const b = S.boss; return [b.x + (b.flip ? 1 : -1) * 10 * b.sc, b.y - 140 * 0.6 * b.sc]; }
  const ACTS = {
    fan(b) { const m = mouth(), n = S.phase === 2 ? 7 : 5, base = Math.atan2(S.p.y - m[1], S.p.x - m[0]); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.16; fireball(m[0], m[1], Math.cos(a) * 900, Math.sin(a) * 900); } AU.play('fire'); },
    aim(b) { const m = mouth(); for (let i = 0; i < 3; i++) setLater(i * 0.18, () => { const a = Math.atan2(S.p.y - m[1], S.p.x - m[0]); fireball(m[0], m[1], Math.cos(a) * 1250, Math.sin(a) * 1250, false); AU.play('fire'); }); },
    wave(b) { const lane = S.p.g > 0 ? 'f' : 'c', x = b.x - 160 * b.sc, ta = (x - S.p.x) / 1650; clearLane(other(lane), ta - 0.45, ta + 0.4); S.foes.push({ k: 'wave', lane, x, v: -1650, t0: S.t }); AU.play('blade'); },
    wave2(b) { const lane = S.p.g > 0 ? 'f' : 'c', ta = (b.x - 160 * b.sc - S.p.x) / 1700; clearLane('both', ta - 0.45, ta + 0.85); S.foes.push({ k: 'wave', lane, x: b.x - 160 * b.sc, v: -1700, t0: S.t }); setLater(0.42, () => { S.foes.push({ k: 'wave', lane: lane === 'f' ? 'c' : 'f', x: S.boss.x - 160 * S.boss.sc, v: -1700, t0: S.t }); AU.play('blade'); }); AU.play('blade'); },
    pound(b) { const lane = S.p.g > 0 ? 'f' : 'c', ta = (b.x - 120 - S.p.x) / 1350; clearLane(other(lane), ta - 0.45, ta + 0.4); S.foes.push({ k: 'shock', lane, x: b.x - 120, v: -1350, t0: S.t }); AU.play('pound'); shake(18); },
    meteors(b) { const n = S.phase === 2 ? 4 : 3; clearLane('both', 0.5, 1.0 + n * 0.52); for (let i = 0; i < n; i++) { const lane = (i + (S.p.g > 0 ? 0 : 1)) % 2 ? 'c' : 'f', at = 0.95 + i * 0.52; S.foes.push({ k: 'meteor', lane, wx: S.dist + SPEED[S.phase] * at, land: S.t + at, t0: S.t }); } AU.play('meteor'); },
    lunge(b) { const lane = S.p.g > 0 ? 'f' : 'c'; clearLane(other(lane), 0.1, 1.0); S.foes.push({ k: 'lunge', lane, t0: S.t, t1: S.t + 0.75, from: b.flip ? -300 : W + 300, to: b.flip ? W + 300 : -300 }); },
    breath(b) { const lane = S.p.g > 0 ? 'f' : 'c'; clearLane(other(lane), 0.15, 1.75); S.foes.push({ k: 'breath', lane, t0: S.t + 0.55, t1: S.t + 1.6, warn: S.t }); setLater(0.55, () => AU.play('breath')); },
    boulder(b) { const lane = Math.random() < 0.5 ? 'f' : 'c'; S.foes.push({ k: 'boulder', lane, x0: b.x, y0: b.y - 200, t0: S.t, land: S.t + 0.8, wx: S.dist + 1250 + SPEED[S.phase] * 0.8 }); AU.play('blade'); },
    spiral(b) {   // two rings of fire; each leaves a hole for one lane (the first: the lane you are NOT on, so you must move)
      const first = S.p.g > 0 ? 'c' : 'f';
      for (let ring = 0; ring < 2; ring++) setLater(ring * 0.6, () => {
        const safe = ring ? other(first) : first, n = 12, ox = S.boss.x, oy = S.boss.y - 60, sa = Math.atan2(lanePY(safe === 'f' ? 1 : -1) - oy, S.p.x - ox), o = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = o + i / n * TAU, d = Math.atan2(Math.sin(a - sa), Math.cos(a - sa)); if (Math.abs(d) < 0.3) continue; fireball(ox, oy, Math.cos(a) * 640, Math.sin(a) * 640); }
        AU.play('fire');
      });
    },
    dash(b) { const lane = S.p.g > 0 ? 'f' : 'c'; clearLane(other(lane), 0.3, 1.2); S.foes.push({ k: 'dash', lane, t0: S.t, hitT: S.t + 0.8, t1: S.t + 1.3 }); }
  };
  const ACT_TELE = { fan: ['beam', 0.55], aim: ['beam', 0.45], wave: ['slash', 0.5], wave2: ['slash', 0.5], pound: ['pillar', 0.55], meteors: ['pillar', 0.5], lunge: ['cleave', 0.7], breath: ['beam', 0.3], boulder: ['slash', 0.4], spiral: ['beam', 0.55], dash: ['slash', 0.2] };
  const ACT_DUR = { fan: 1.0, aim: 1.1, wave: 0.7, wave2: 1.1, pound: 0.9, meteors: 1.6, lunge: 1.2, breath: 1.7, boulder: 0.9, spiral: 1.9, dash: 1.3 };   // how long each one stays dangerous
  const PHASE_ACTS = [['fan', 'aim', 'wave', 'pound', 'meteors', 'fan', 'wave'], ['lunge', 'breath', 'boulder', 'aim', 'lunge', 'breath'], ['dash', 'spiral', 'meteors', 'wave2', 'fan', 'dash', 'spiral']];
  // fair lanes: when he commits to a lane attack, the lane you must run to is cleared for that moment (his fire burns
  // the obstacles away, you see them go). lanes: 'f' | 'c' | 'both'; t0..t1 = seconds from now when you'd meet them
  function clearLane(lane, t0, t1) {
    const sp = Math.max(300, SPEED[S.phase]);
    for (const o of S.obs) {
      if (o.gone || o.k === 'orb') continue;
      const side = o.k === 'saw' ? (o.amp || Math.abs(o.y - MIDY) < 10 ? 'mid' : o.y > MIDY ? 'f' : 'c') : o.side;
      if (side === 'mid' || (lane !== 'both' && side !== lane)) continue;
      const x = sx(o.wx), w = o.k === 'spk' ? o.n * 80 : 140, tA = (x - 140 - S.p.x - 60) / sp, tB = (x + w - S.p.x + 60) / sp;
      if (tB < t0 || tA > t1) continue;
      o.gone = true;
      if (x > -100 && x < W + 100) { const y = side === 'f' ? F - 60 : C + 60; for (let i = 0; i < 8; i++) S.sparks.push({ x: x + 40, y, a: Math.random() * TAU, v: 200 + Math.random() * 500, t: S.rt, c: '#ff8a3a' }); }
    }
  }
  const other = (l) => (l === 'f' ? 'c' : 'f');
  const later = [];
  function setLater(dt, fn) { later.push({ at: S.t + dt, fn }); }
  function bossThink() {
    const b = S.boss;
    if (b.act && S.t >= b.act.at) { const a = b.act; b.act = null; ACTS[a.name](b); }
    if (!b.act && S.t >= b.nextAct) {
      const list = PHASE_ACTS[S.phase]; let name = list[Math.floor(Math.random() * list.length)]; if (name === b.last) name = list[(list.indexOf(name) + 1) % list.length];
      b.last = name; const tl = ACT_TELE[name];
      b.act = { name, at: S.t + tl[1] }; FK.anim = { kind: tl[0], t0: S.t, tl: S.t + tl[1], hits: [S.t + tl[1]] };
      if (tl[0] === 'beam') AU.play('charge');
      const hpK = cl(1 - (S.hp - (PHASE_HP[S.phase + 1] || 0)) / (PHASE_HP[S.phase] - (PHASE_HP[S.phase + 1] || 0)));   // later in a phase = faster
      b.nextAct = S.t + tl[1] + ACT_DUR[name] + [0.8, 0.55, 0.4][S.phase] - 0.2 * hpK;
    }
  }
  // where he stands / flies, per phase
  function bossMove(dt) {
    const b = S.boss, t = S.t;
    if (S.mode === 'trans' && S.trans) { const k = sm(seg(t, S.trans.t0 + 0.6, S.trans.t0 + 1.7)), A = S.trans.a, B = S.trans.b; b.x = lerp(A[0], B[0], k); b.y = lerp(A[1], B[1], k) - Math.sin(k * Math.PI) * 420; b.sc = lerp(A[2], B[2], k); b.flip = k > 0.5 ? B[3] : A[3]; return; }
    if (S.mode === 'clash') { const q = 1 - Math.pow(0.05, dt); b.x = lerp(b.x, 1430, q); b.y = lerp(b.y, 640, q); b.sc = lerp(b.sc, 0.9, q); b.flip = false; return; }
    if (S.phase === 0) { b.x = 1450 + Math.sin(t * 0.7) * 40; b.y = 660 + Math.sin(t * 1.3) * 18; b.sc = 1; b.flip = false; }
    else if (S.phase === 1) { const lunge = S.foes.some((f) => f.k === 'lunge' && t < f.t1); b.x = 300 + Math.sin(t * 1.1) * 40 + (lunge ? 60 : 0); b.y = 760 + Math.sin(t * 2.2) * 14; b.sc = 0.78; b.flip = true; }
    else {
      const d = S.foes.find((f) => f.k === 'dash' && t < f.t1);
      if (d) { const k = seg(t, d.hitT - 0.15, d.hitT + 0.35), ly = d.lane === 'f' ? F - 200 : C + 260; if (k <= 0) { b.x = lerp(b.x, 1700, 0.08); b.y = lerp(b.y, ly, 0.1); } else { b.x = lerp(1700, -500, eo(k)); b.y = ly; } b.sc = 0.62; b.flip = false; if (k >= 1) { b.x = W + 400; } }
      else { const tx = 1380 + Math.sin(t * 0.9) * 260, ty = 560 + Math.sin(t * 1.4) * 200; b.x = lerp(b.x, tx, 1 - Math.pow(0.02, dt)); b.y = lerp(b.y, ty, 1 - Math.pow(0.02, dt)); b.sc = 0.72; b.flip = false; }
    }
  }

  // ------------------------------------------------------------------ combo / near misses
  function addCombo(n) {
    const lv0 = furyLv(); S.combo += n; S.comboT = S.rt; const lv = furyLv();
    if (lv > lv0) { say(FURY[lv].name, FURY[lv].col, true); AU.play('fury'); for (let i = 0; i < 16; i++) S.sparks.push({ x: S.p.x, y: S.p.y, a: Math.random() * TAU, v: 300 + Math.random() * 700, t: S.rt, c: FURY[lv].col }); }
  }
  function close() {   // a near miss: the SUPER fills faster (risk pays)
    if (S.t - S.closeT < 0.45) return; S.closeT = S.t;
    S.orbs = Math.min(3, S.orbs + 0.4); AU.play('close'); say(L ? 'قريبة!' : 'CLOSE!', '#ffffff', false, [S.p.x + 40, S.p.y + (S.p.g > 0 ? -110 : 130)]); addCombo(1);
  }
  // ------------------------------------------------------------------ input
  function press() {
    AU.init();
    if (S.mode === 'won') { if (S.t - S.mt0 > 1.5) finish(true); return; }
    if (S.mode === 'down' || S.mode === 'intro' || S.mode === 'dying') return;
    if (S.mode === 'clash') { if (S.t - S.clash.t0 > 1.2) { S.clash.k = Math.min(1, S.clash.k + 0.055); S.clash.push = S.rt; AU.play('push'); shake(8); } return; }
    S.p.g = -S.p.g; S.p.vy = S.p.g * KICK; AU.play('flip');
  }

  // ------------------------------------------------------------------ damage
  function hurt(why) {
    if (S.inv > S.t || S.superOn) return;
    S.why = why; S.hurtT = S.t;
    if (S.combo >= FURY[1].at) { say(L ? 'ضاع الكومبو' : 'COMBO LOST', '#ff5a5a'); AU.play('lost'); } S.combo = 0;
    S.hearts--; S.inv = S.t + 1.25; S.redT = S.rt; shake(26); S.hstop = 0.07; AU.play('hurt');
    if (S.hearts <= 0) { S.mode = 'down'; S.mt0 = S.t; S.deaths++; S.foes.length = 0; AU.play('down'); S.best = Math.max(S.best, 100 - S.hp); }
  }
  function hitBoss(n, x, y) {
    if (S.mode !== 'fight') return;
    S.hp = Math.max(0, S.hp - n); FK.hp = S.hp;
    S.boss.hitN += n;
    if (S.boss.hitN >= 1.6) { S.boss.hitN = 0; FK.hitT = S.t; AU.play('chunk'); }
    else AU.play('hit');
    for (let i = 0; i < 3; i++) S.sparks.push({ x, y, a: Math.random() * TAU, v: 300 + Math.random() * 500, t: S.rt });
    if (S.phase === 2 && S.hp <= 5 && !S.clashDone) { startClash(); return; }
    if (S.hp <= 0) { die(); return; }
    const next = PHASE_HP[S.phase + 1];
    if (next !== undefined && S.hp <= next) trans();
  }
  function trans() {
    const from = [S.boss.x, S.boss.y, S.boss.sc, S.boss.flip], to = S.phase === 0 ? [300, 760, 0.78, true] : [1380, 560, 0.72, false];
    S.mode = 'trans'; S.mt0 = S.t; S.trans = { t0: S.t, a: from, b: to }; S.foes.length = 0; S.boss.act = null; later.length = 0;
    FK.mode = 'trans'; FK.modeT0 = S.t; AU.play('roar'); AU.play('thunder'); shake(30);
  }
  // FINAL CLASH: his beam against yours, meeting in the middle: tap tap tap to drive yours into him
  function startClash() {
    S.mode = 'clash'; S.clash = { t0: S.t, k: 0.5, push: -9, lost: 0 }; S.foes.length = 0; later.length = 0; S.boss.act = null; S.superOn = false;
    clearLane('both', -1, 12); S.shots.length = 0;
    FF.HDBoss.title('FINAL CLASH', L ? 'اضغط بسرعة!' : 'TAP! TAP! TAP!', '#ffd27a', 1.6); AU.play('roar'); AU.play('charge'); shake(30);
  }
  function die() { S.mode = 'dying'; S.mt0 = S.t; S.foes.length = 0; later.length = 0; FK.mode = 'dying'; FK.modeT0 = S.t; AU.play('roar'); shake(40); }

  // ------------------------------------------------------------------ the step
  function update(dt) {
    if (S.hstop > 0) { S.hstop -= dt; return; }
    S.t += dt; const t = S.t; FK.t = t; FK.phase = S.phase;
    for (let i = later.length - 1; i >= 0; i--) if (t >= later[i].at) { const f = later[i].fn; later.splice(i, 1); f(); }
    // the run never stops (except when you are down)
    const target = S.mode === 'down' ? 0 : S.mode === 'intro' ? SPEED[0] * 0.5 : S.mode === 'clash' ? 260 : SPEED[S.phase];
    S.speed = lerp(S.speed, target, 1 - Math.pow(0.05, dt));
    S.dist += S.speed * dt;
    // the hero
    const P = S.p;
    if (S.mode === 'clash') { P.y = lerp(P.y, MIDY, 1 - Math.pow(0.02, dt)); P.vy = 0; }
    else if (S.mode !== 'down') {
      P.vy = cl(P.vy + G * P.g * dt, -MAXV, MAXV); P.y += P.vy * dt;
      if (P.y > F - 40) { P.y = F - 40; P.vy = 0; } if (P.y < C + 40) { P.y = C + 40; P.vy = 0; }
    }
    const px = S.mode === 'fight' && S.phase === 1 ? 860 : S.mode === 'trans' && S.trans && S.phase === 0 ? lerp(420, 860, sm(seg(t, S.trans.t0 + 0.6, S.trans.t0 + 1.7))) : S.mode === 'trans' && S.phase === 1 ? lerp(860, 420, sm(seg(t, S.trans.t0 + 0.6, S.trans.t0 + 1.7))) : 420;
    P.x = lerp(P.x, px, 1 - Math.pow(0.001, dt));
    S.trailAcc = (S.trailAcc || 0) + dt; if (S.trailAcc >= 1 / 60) { S.trailAcc = 0; S.trail.unshift(P.y); if (S.trail.length > 10) S.trail.length = 10; }
    bossMove(dt);
    if (S.mode === 'intro') { if (t >= 3.4) { S.mode = 'fight'; FK.mode = 'fight'; FK.modeT0 = t; S.start = t; say('RUN AND GUN!', '#ffd23f', true); } return; }
    if (S.mode === 'trans') {
      const el = t - S.mt0;
      if (el >= 0.9 && !S.trans.said) { S.trans.said = 1; S.worldFrom = WORLD[S.phase]; S.worldK0 = t; S.phase++; FK.phase = S.phase; FF.HDBoss.title(TITLES[S.phase][0], TITLES[S.phase][1], TCOL[S.phase], 2.0); AU.play('thunder'); S.obs = S.obs.filter((o) => sx(o.wx) > W + 200); S.genX = Math.max(S.genX, S.dist + 2200); }
      if (el >= 2.5) { S.mode = 'fight'; FK.mode = 'fight'; FK.modeT0 = t; S.boss.nextAct = t + 0.6; S.worldFrom = null; S.hearts = Math.min(3, S.hearts + 1); }
      return;
    }
    if (S.mode === 'dying') { if (t - S.mt0 >= 3.4) { S.mode = 'won'; S.mt0 = t; FK.mode = 'reward'; AU.play('win'); } return; }
    if (S.mode === 'won') return;
    if (S.mode === 'clash') {
      const c = S.clash, el = t - c.t0;
      FK.anim = { kind: 'beam', t0: t - 0.5, tl: t + 0.5, hits: [t + 0.5] };
      if (el > 1.2) {
        if (c.k < 1) c.k -= (0.15 + 0.02 * Math.min(4, el - 1.2)) * dt;
        if (Math.random() < dt * 14) shake(6);
        if (c.k >= 1) { S.clashDone = true; S.hp = 0; FK.hp = 0; FK.anim = { kind: 'idle', hits: [] }; for (let i = 0; i < 40; i++) S.sparks.push({ x: mouth()[0], y: mouth()[1], a: Math.random() * TAU, v: 400 + Math.random() * 1200, t: S.rt, c: i % 2 ? '#9ff0ff' : '#ffd27a' }); die(); return; }
        if (c.k <= 0) {
          c.k = 0.42; c.lost++; S.hearts--; S.redT = S.rt; shake(30); AU.play('hurt'); S.hurtT = t;
          if (S.hearts <= 0) { S.mode = 'down'; S.mt0 = t; S.deaths++; S.clash = null; AU.play('down'); }
        }
      }
      return;
    }
    if (S.mode === 'down') {
      if (t - S.mt0 > 2.4) { // the phase again
        S.mode = 'fight'; S.hearts = 3; S.combo = 0; S.clash = null; S.hp = PHASE_HP[S.phase]; FK.hp = S.hp; S.obs.length = 0; S.genX = S.dist + 1400; S.foes.length = 0; later.length = 0; S.boss.act = null; S.boss.nextAct = t + 1.2; S.inv = t + 1.2; FK.mode = 'fight';
      }
      return;
    }
    genLevel(); bossThink();
    // shooting, by himself
    S.fireT -= dt;
    const FY = FURY[furyLv()];
    if (S.fireT <= 0 && S.boss.x > -200 && S.boss.x < W + 200) { S.fireT = FY.dt; const tg = bossTarget(); const a = Math.atan2(tg[1] - P.y, tg[0] - P.x); for (let i = 0; i < FY.n; i++) { const sp = FY.n > 1 ? (i ? 0.22 : -0.22) : 0; S.shots.push({ x: P.x + Math.cos(a) * 50, y: P.y + Math.sin(a) * 50, a: a + sp, t: t, lv: furyLv(), dmg: FY.dmg }); } if (Math.random() < 0.4) AU.play('shot'); }
    const tg = bossTarget();
    for (const s of S.shots) { const a = Math.atan2(tg[1] - s.y, tg[0] - s.x); s.a += Math.atan2(Math.sin(a - s.a), Math.cos(a - s.a)) * Math.min(1, dt * 20); const d0 = Math.hypot(tg[0] - s.x, tg[1] - s.y), step = 2900 * dt; if (d0 < Math.max(90, 170 * S.boss.sc) || d0 < step) { s.dead = 1; S.orbs = Math.min(3, S.orbs + 0.0025); hitBoss(s.dmg, tg[0] + (Math.random() - 0.5) * 80, tg[1] + (Math.random() - 0.5) * 80); if (S.mode !== 'fight') break; } else { s.x += Math.cos(s.a) * step; s.y += Math.sin(s.a) * step; } if (t - s.t > 1.2) s.dead = 1; }
    S.shots = S.shots.filter((s) => !s.dead);
    // the SUPER
    if (S.orbs >= 2.999 && S.superReady < 0) { S.superReady = t + 0.5; say('SUPER!', '#9ff0ff', true); }
    if (S.superReady > 0 && t >= S.superReady && !S.superOn) { S.superOn = true; S.superT = t; S.orbs = 0; S.superReady = -1; AU.play('super'); shake(30); }
    if (S.superOn) { const e = t - S.superT; if (e > 1.3) S.superOn = false; else if (Math.floor(e * 10) !== Math.floor((e - dt) * 10)) { hitBoss(SUPER_DMG / 13, tg[0], tg[1]); shake(14); } }
    // obstacles
    const hx = P.x, hy = P.y;
    for (const o of S.obs) {
      const x = sx(o.wx);
      if (x < -300 || x > W + 300) continue;
      const wO = o.k === 'spk' ? o.n * 80 : o.k === 'wall' ? 90 : o.k === 'orb' ? 0 : 70;
      if (o.k !== 'orb' && !o.passed) {
        const xa = o.k === 'saw' || o.k === 'rock' ? x - wO : x, xb = x + wO;
        if (hx + PR > xa && hx - PR < xb) {
          const gap = o.k === 'spk' ? (o.side === 'f' ? (F - 76) - (hy + PR) : (hy - PR) - (C + 76)) : o.k === 'wall' ? (o.side === 'c' ? (hy - PR) - (C + 470) : (F - 470) - (hy + PR)) : o.k === 'saw' ? Math.hypot(hx - x, hy - (o.y + (o.amp ? Math.sin(t * 2.4 + (o.ph || 0)) * o.amp : 0))) - o.r - PR : Math.hypot(hx - x, hy - (o.side === 'f' ? F - 70 : C + 70)) - 70 - PR;
          o.gap = Math.min(o.gap === undefined ? 1e9 : o.gap, gap);
        } else if (hx - PR >= xb) { o.passed = true; if (S.hurtT < t - 0.3) { addCombo(1); if (o.gap !== undefined && o.gap < 60) close(); } }
      }
      if (o.k === 'spk') { const top = o.side === 'f' ? F - 76 : C, bot = o.side === 'f' ? F : C + 76; if (hx + PR - 10 > x + 10 && hx - PR + 10 < x + o.n * 80 - 10 && hy + PR - 8 > top && hy - PR + 8 < bot) hurt('spk'); }
      else if (o.k === 'wall') { const y0 = o.side === 'c' ? C : F - 470, y1 = o.side === 'c' ? C + 470 : F; if (hx + PR - 6 > x && hx - PR + 6 < x + 90 && hy + PR - 6 > y0 && hy - PR + 6 < y1) hurt('wall'); }
      else if (o.k === 'saw') { const y = o.y + (o.amp ? Math.sin(t * 2.4 + (o.ph || 0)) * o.amp : 0); if (Math.hypot(hx - x, hy - y) < o.r + PR - 14) hurt('saw'); }
      else if (o.k === 'orb') { if (!o.got && Math.hypot(hx - x, hy - o.y) < 80) { o.got = true; o.gone = true; S.orbs = Math.min(3, S.orbs + 1); AU.play('orb'); say('+1', '#9ff0ff', false, [hx + 40, hy + (S.p.g > 0 ? -110 : 130)]); } }
      else if (o.k === 'rock') { const y = o.side === 'f' ? F - 70 : C + 70; if (Math.hypot(hx - x, hy - y) < 70 + PR - 12) hurt('rock'); }
    }
    // his attacks
    for (const f of S.foes) {
      if (f.k === 'ball') { f.x += f.vx * dt; f.y += f.vy * dt; const dB = Math.hypot(hx - f.x, hy - f.y) - f.r - PR; f.md = Math.min(f.md === undefined ? 1e9 : f.md, dB); if (dB < -10) { hurt('ball'); f.dead = 1; } else if (!f.cl && f.md < 45 && dB > 120) { f.cl = 1; close(); } if (f.x < -200 || f.x > W + 200 || f.y < -200 || f.y > H + 200) f.dead = 1; }
      else if (f.k === 'wave' || f.k === 'shock') { f.x += f.v * dt; const y0 = f.lane === 'f' ? F - (f.k === 'wave' ? 300 : 150) : C, y1 = f.lane === 'f' ? F : C + (f.k === 'wave' ? 300 : 150); if (Math.abs(hx - f.x) < 60 && hy > y0 && hy < y1) hurt('wave'); if (f.x < -300) f.dead = 1; }
      else if (f.k === 'meteor') { const x = sx(f.wx); if (t >= f.land && !f.boom) { f.boom = t; AU.play('impact'); shake(12); const y = f.lane === 'f' ? F - 40 : C + 40; if (Math.abs(hx - x) < 110 && Math.abs(hy - y) < 90) hurt('meteor'); } if (f.boom && t - f.boom > 0.7) f.dead = 1; }
      else if (f.k === 'lunge') { const k = seg(t, f.t0 + 0.5, f.t1); if (k > 0 && !f.snd) { f.snd = 1; AU.play('lunge'); shake(16); } const x = lerp(f.from, f.to, eo(k)), y0 = f.lane === 'f' ? MIDY + 40 : C, y1 = f.lane === 'f' ? F : MIDY - 40; if (k > 0 && k < 1 && (S.boss.flip ? hx < x : hx > x) && Math.abs(hx - x) < 900 && hy > y0 && hy < y1) hurt('lunge'); f.x = x; if (t > f.t1 + 0.2) f.dead = 1; }
      else if (f.k === 'breath') { const y0 = f.lane === 'f' ? MIDY + 40 : C, y1 = f.lane === 'f' ? F : MIDY - 40; if (t >= f.t0 && t <= f.t1 && hy > y0 && hy < y1) hurt('breath'); if (t > f.t1 + 0.1) f.dead = 1; }
      else if (f.k === 'boulder') { if (t >= f.land && !f.done) { f.done = 1; f.dead = 1; S.obs.push({ k: 'rock', wx: f.wx, side: f.lane }); AU.play('impact'); shake(10); } }
      else if (f.k === 'dash') { if (t >= f.hitT && !f.snd) { f.snd = 1; AU.play('lunge'); shake(24); } const y0 = f.lane === 'f' ? MIDY + 40 : C, y1 = f.lane === 'f' ? F : MIDY - 40; if (t >= f.hitT && t < f.hitT + 0.35 && Math.abs(hx - S.boss.x) < 380 && hy > y0 && hy < y1) hurt('dash'); if (t > f.t1) f.dead = 1; }
    }
    for (const f of S.foes) if (f.dead && f.k !== 'ball' && f.k !== 'boulder' && S.hurtT < (f.t0 || t) - 0.2) addCombo(2);
    S.foes = S.foes.filter((f) => !f.dead);
  }

  // ------------------------------------------------------------------ painting
  const EDGE = ['#ff6a2a', '#7fe8ff', '#ff8a3a'], GRADE = ['rgba(22,4,30,0.5)', 'rgba(2,6,22,0.32)', 'rgba(26,2,14,0.5)'];
  // far ruins: broken columns that slide by slower than you (depth), dark so they never read as obstacles
  function drawRuins() {
    const g = cx, e = EDGE[S.phase], pd = S.dist * 0.38, slot = 430, i0 = Math.floor(pd / slot) - 1;
    for (let i = i0; i < i0 + 7; i++) {
      const x = i * slot - pd + hs(i) * 160, top = hs(i + 11) < 0.45, h = 120 + hs(i + 3) * 170, w = 54 + hs(i + 7) * 40, y0 = top ? C : F - h, end = top ? y0 + h : y0;
      g.fillStyle = 'rgba(10,4,8,0.62)';
      g.beginPath(); g.moveTo(x, top ? C : F); g.lineTo(x, end + (top ? -14 : 14)); g.lineTo(x + w * 0.3, end); g.lineTo(x + w * 0.55, end + (top ? -22 : 22)); g.lineTo(x + w * 0.8, end + (top ? 4 : -4)); g.lineTo(x + w, end + (top ? -18 : 18)); g.lineTo(x + w, top ? C : F); g.closePath(); g.fill();
      g.fillRect(x - 12, top ? C : F - 26, w + 24, 26);
      g.fillStyle = rgba(e, 0.22); g.fillRect(x + w - 4, Math.min(y0, end), 4, h);
    }
  }
  function drawSlab(fl, rt) {   // fl: the floor (else the ceiling): solid, scrolling at your speed
    const g = cx, e = EDGE[S.phase], off = -(S.dist % 180), y0 = fl ? F : 0, y1 = fl ? H : C;
    g.fillStyle = HD.lin(0, fl ? F : C, 0, fl ? H : 0, [[0, '#24101a'], [0.35, '#12070c'], [1, '#040203']]); g.fillRect(0, y0, W, y1 - y0);
    g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 5;
    for (let x = off; x < W + 120; x += 180) { g.beginPath(); g.moveTo(x, fl ? F + 6 : C - 6); g.lineTo(x - 70, fl ? H : 0); g.stroke(); }
    g.strokeStyle = rgba(e, 0.12); g.lineWidth = 2;
    for (let x = off; x < W + 120; x += 180) { g.beginPath(); g.moveTo(x + 4, fl ? F + 6 : C - 6); g.lineTo(x - 66, fl ? H : 0); g.stroke(); }
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = rgba(e, 0.22); g.fillRect(0, fl ? F : C - 22, W, 22);
    g.fillStyle = rgba(e, 0.95); g.fillRect(0, fl ? F - 2 : C - 2, W, 5);
    g.restore();
    for (let x = off; x < W + 180; x += 180) HD.glow(x + 90, fl ? F + 20 : C - 20, 22, e, 0.75);
  }
  function drawStreaks(rt) {
    const g = cx, sp = S.speed; if (sp < 200) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const L = 160 + hs(i + 2) * 260, x = W + 400 - ((rt * sp * 1.7 + hs(i) * 4000) % (W + 900)), y = C + 50 + hs(i + 5) * (F - C - 100); g.fillStyle = rgba('#ffe6d0', 0.07 + 0.06 * hs(i + 9)); g.fillRect(x, y, L, 3); }
    g.restore();
  }
  function drawObstacles(rt) {
    const g = cx;
    for (const o of S.obs) {
      const x = sx(o.wx); if (x < -200 || x > W + 200 || o.gone) continue;
      if (o.k === 'spk') {
        const fl = o.side === 'f', base = fl ? F : C, tip = fl ? F - 92 : C + 92;
        HD.glow(x + o.n * 40, fl ? F - 40 : C + 40, 70 + o.n * 40, '#ff2a5a', 0.5);
        const p = new Path2D(); for (let i = 0; i < o.n; i++) { const bx = x + i * 80; p.moveTo(bx, base); p.lineTo(bx + 40, tip); p.lineTo(bx + 80, base); p.closePath(); }
        g.fillStyle = HD.lin(0, base, 0, tip, [[0, '#020104'], [1, '#1a0a14']]); g.fill(p);
        g.save(); g.lineJoin = 'round'; g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,40,90,0.5)'; g.lineWidth = 14; g.stroke(p); g.restore(); g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke(p);
      } else if (o.k === 'wall') {
        const y0 = o.side === 'c' ? C : F - 470, h = 470, cap = o.side === 'c' ? y0 + h : y0;
        HD.glow(x + 45, cap, 170, '#ff2a5a', 0.6);
        g.fillStyle = HD.lin(x, 0, x + 90, 0, [[0, '#1a0c16'], [0.5, '#07040a'], [1, '#020103']]); g.fillRect(x, y0, 90, h);
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 3; for (let yy = y0 + 60; yy < y0 + h; yy += 70) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 90, yy); g.stroke(); }
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,40,90,0.45)'; g.lineWidth = 14; g.strokeRect(x + 2, y0, 86, h); g.restore(); g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(x + 2, y0, 86, h);
        for (let i = 0; i < 3; i++) { const yy = o.side === 'c' ? cap - 34 - i * 30 : cap + 34 + i * 30, d = o.side === 'c' ? 1 : -1; g.strokeStyle = rgba('#ff2a5a', 0.9 - i * 0.25); g.lineWidth = 6; g.beginPath(); g.moveTo(x + 20, yy - d * 12); g.lineTo(x + 45, yy + d * 6); g.lineTo(x + 70, yy - d * 12); g.stroke(); }
      } else if (o.k === 'saw') {
        const y = o.y + (o.amp ? Math.sin(S.t * 2.4 + (o.ph || 0)) * o.amp : 0);
        HD.glow(x, y, o.r * 2.4, '#ff2a5a', 0.45);
        g.save(); g.translate(x, y); g.rotate(-rt * 14); g.fillStyle = '#0a070d';
        g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? o.r : o.r * 0.8; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
        g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.stroke();
        g.fillStyle = '#120a0c'; g.beginPath(); g.arc(0, 0, o.r * 0.34, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,120,70,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, o.r * 0.55, 0.3, 2.2); g.stroke(); g.restore();
      } else if (o.k === 'orb') {
        HD.glow(x, o.y, 120, '#5ae0ff', 0.6 + 0.2 * Math.sin(rt * 8)); HD.glow(x, o.y, 40, '#ffffff', 0.9);
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(160,240,255,0.8)'; g.lineWidth = 4; g.beginPath(); g.arc(x, o.y, 44 + Math.sin(rt * 6) * 4, 0, TAU); g.stroke(); g.restore();
      } else if (o.k === 'rock') {
        const y = o.side === 'f' ? F - 66 : C + 66;
        g.fillStyle = HD.rad(x - 20, y - 20, 10, 80, [[0, '#5a3a30'], [1, '#1a0e0a']]); g.beginPath(); g.arc(x, y, 72, 0, TAU); g.fill();
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,120,40,0.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 40, y - 10); g.lineTo(x - 5, y + 10); g.lineTo(x + 30, y - 20); g.stroke(); g.restore();
        HD.glow(x, y, 160, '#ff5a1a', 0.3);
      }
    }
  }
  function drawFoes(rt) {
    const g = cx, t = S.t;
    // the warnings first: lanes that are about to burn
    for (const f of S.foes) {
      const y0 = f.lane === 'f' ? MIDY + 40 : C, y1 = f.lane === 'f' ? F : MIDY - 40, blink = 0.6 + 0.4 * Math.sin(rt * 30);
      if (f.k === 'lunge' && t < f.t0 + 0.5) { g.fillStyle = rgba('#ff2a2a', 0.18 * blink); g.fillRect(0, y0, W, y1 - y0); }
      if (f.k === 'breath' && t < f.t0) { g.fillStyle = rgba('#ff8a2a', 0.16 * blink); g.fillRect(0, y0, W, y1 - y0); }
      if (f.k === 'dash' && t < f.hitT) { g.fillStyle = rgba('#ff2a2a', 0.2 * blink); g.fillRect(0, y0, W, y1 - y0); }
      if (f.k === 'meteor' && !f.boom) { const x = sx(f.wx), sy = f.lane === 'f' ? F : C, k = seg(t, f.t0, f.land); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba('#ff3a2a', 0.5 + 0.5 * blink); g.lineWidth = 6; g.beginPath(); g.ellipse(x, sy, 120 - 40 * k, 26, 0, 0, TAU); g.stroke(); g.restore(); }
    }
    for (const f of S.foes) {
      if (f.k === 'ball') { for (let i = 4; i >= 1; i--) HD.glow(f.x - f.vx * 0.012 * i, f.y - f.vy * 0.012 * i, f.r * (1.6 - i * 0.2), '#ff6a1a', 0.35); HD.glow(f.x, f.y, f.r * 2.6, '#ff3a10', 0.55); HD.glow(f.x, f.y, f.r * 0.9, '#ffe0a0', 0.95); }
      else if (f.k === 'wave') { const y0 = f.lane === 'f' ? F - 300 : C, y1 = y0 + 300; g.save(); g.globalCompositeOperation = 'lighter'; for (let tr = 3; tr >= 0; tr--) { const ax = f.x + tr * 50; g.strokeStyle = rgba(tr ? '#ff3a2a' : '#ffe0d0', tr ? 0.18 * (4 - tr) : 0.95); g.lineWidth = tr ? 24 : 12; g.beginPath(); g.moveTo(ax + 70, y0); g.quadraticCurveTo(ax - 40, (y0 + y1) / 2, ax + 70, y1); g.stroke(); } g.restore(); HD.glow(f.x + 20, (y0 + y1) / 2, 220, '#ff3a2a', 0.5); }
      else if (f.k === 'shock') { const fl = f.lane === 'f', base = fl ? F : C; for (let i = 0; i < 5; i++) { const x = f.x + i * 46, h = (150 - i * 22) * (0.8 + 0.2 * Math.sin(rt * 30 + i)); g.fillStyle = HD.lin(0, base, 0, fl ? base - h : base + h, [[0, '#ffd27a'], [1, 'rgba(255,60,20,0)']]); g.beginPath(); g.moveTo(x - 26, base); g.lineTo(x, fl ? base - h : base + h); g.lineTo(x + 26, base); g.fill(); } HD.glow(f.x + 60, fl ? F - 60 : C + 60, 200, '#ff6a1a', 0.6); }
      else if (f.k === 'meteor') { const x = sx(f.wx), surf = f.lane === 'f' ? F : C; if (!f.boom) { const k = seg(t, f.t0, f.land), mx = lerp(x + 700, x, k * k), my = lerp(f.lane === 'f' ? -150 : H + 150, surf, k * k); for (let i = 5; i >= 0; i--) HD.glow(mx + i * 34, my + (f.lane === 'f' ? -1 : 1) * i * 44, 80 - i * 9, '#ff6a1a', 0.5); HD.glow(mx, my, 130, '#ffb050', 0.9); g.fillStyle = '#2a0e08'; g.beginPath(); g.arc(mx, my, 32, 0, TAU); g.fill(); } else { const e = t - f.boom; HD.glow(x, surf, 460 * (0.4 + e), '#ff8a3a', 0.9 * (1 - e / 0.7)); } }
      else if (f.k === 'lunge') { if (t >= f.t0 + 0.5) { const y0 = f.lane === 'f' ? MIDY + 40 : C, y1 = f.lane === 'f' ? F : MIDY - 40, ym = (y0 + y1) / 2, dir = f.to > f.from ? 1 : -1; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = HD.lin(f.x - dir * 900, 0, f.x, 0, [[0, 'rgba(255,60,30,0)'], [1, 'rgba(255,220,180,0.85)']]); g.beginPath(); g.moveTo(f.x + dir * 120, ym); g.lineTo(f.x - dir * 900, y0 + 20); g.lineTo(f.x - dir * 900, y1 - 20); g.closePath(); g.fill(); g.restore(); HD.glow(f.x, ym, 260, '#ffd27a', 0.8); } }
      else if (f.k === 'breath') { if (t >= f.t0 && t <= f.t1) { const y0 = f.lane === 'f' ? MIDY + 40 : C, y1 = f.lane === 'f' ? F : MIDY - 40, q = Math.min(1, (t - f.t0) / 0.1) * Math.min(1, (f.t1 - t) / 0.1); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = HD.lin(0, y0, 0, y1, [[0, 'rgba(255,90,20,0)'], [0.5, rgba('#ffd27a', 0.75 * q)], [1, 'rgba(255,90,20,0)']]); g.fillRect(0, y0, W, y1 - y0); g.restore(); for (let i = 0; i < 12; i++) HD.glow(W * (i / 12) + Math.sin(rt * 30 + i) * 30, (y0 + y1) / 2 + Math.sin(rt * 17 + i * 3) * (y1 - y0) * 0.3, 150, '#ff6a1a', 0.4 * q); } }
      else if (f.k === 'boulder') { const k = seg(t, f.t0, f.land), x = lerp(f.x0, sx(f.wx), k), y = lerp(f.y0, f.lane === 'f' ? F - 66 : C + 66, k) - Math.sin(k * Math.PI) * 360; g.fillStyle = '#3a2418'; g.beginPath(); g.arc(x, y, 64, 0, TAU); g.fill(); HD.glow(x, y, 160, '#ff5a1a', 0.5); }
    }
  }
  function drawShots(rt) {
    const g = cx; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const s of S.shots) { const col = FURY[s.lv || 0].col, L2 = 60 + 20 * (s.lv || 0); g.strokeStyle = rgba(col, 0.35); g.lineWidth = 18 + 6 * (s.lv || 0); g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - Math.cos(s.a) * L2, s.y - Math.sin(s.a) * L2); g.stroke(); }
    g.restore();
    for (const s of S.shots) { const col = FURY[s.lv || 0].col; HD.glow(s.x, s.y, 34 + 8 * (s.lv || 0), col, 0.9); HD.glow(s.x, s.y, 12, '#ffffff', 1); }
    for (const s of S.sparks) { const e = rt - s.t; if (e > 0.3) { s.dead = 1; continue; } HD.glow(s.x + Math.cos(s.a) * s.v * e, s.y + Math.sin(s.a) * s.v * e, 30 * (1 - e / 0.3) + 6, s.c || '#bff0ff', 0.9 * (1 - e / 0.3)); }
    S.sparks = S.sparks.filter((s) => !s.dead);
    if (S.superOn) { const tg = bossTarget(), e = S.t - S.superT, w = 90 * Math.sin(Math.min(1, e / 1.3) * Math.PI) + 20; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = 'rgba(127,232,255,0.5)'; g.lineWidth = w * 1.6; g.beginPath(); g.moveTo(S.p.x, S.p.y); g.lineTo(tg[0], tg[1]); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = w * 0.45; g.stroke(); g.restore(); HD.glow(tg[0], tg[1], 420, '#9ff0ff', 0.7); HD.glow(S.p.x, S.p.y, 260, '#9ff0ff', 0.8); }
  }
  function drawHero(rt) {
    const g = cx, P = S.p, s = 104;
    if (S.mode === 'down') return;
    if (S.inv > S.t && Math.floor(rt * 20) % 2) return;
    const fc = FURY[furyLv()].col;
    for (let i = 2; i < S.trail.length; i += 2) { const a = 0.32 * (1 - i / 10), q = s * (1 - i * 0.04); g.fillStyle = rgba(fc, a); g.beginPath(); g.roundRect(P.x - i * 22 - q / 2, S.trail[i] - q / 2, q, q, q * 0.16); g.fill(); }
    const up = P.g < 0 ? 1 : 0, rot = P.vy !== 0 ? cl(P.vy / MAXV, -1, 1) * 0.25 : 0, sq = cl(Math.abs(P.vy) / MAXV) * 0.18;
    g.save(); g.translate(P.x, P.y); g.rotate(rot); if (up) g.scale(1, -1); g.scale(1 - sq * 0.4, 1 + sq * 0.4);
    const bx = -s / 2, by = -s / 2;
    HD.glow(0, 0, s * 2.4, fc, 0.42); HD.glow(0, 0, s * 1.1, '#9a6aff', 0.3);
    for (let i = 0; i < 6; i++) { const yy = -s * 0.4 + hs(i) * s * 0.8, ll = 80 + hs(i + 3) * 140, xx = -s / 2 - ((rt * 1000 + i * 70) % 220); g.fillStyle = 'rgba(160,230,255,0.25)'; g.fillRect(xx - ll, yy, ll, 3); }
    g.fillStyle = '#03040f'; g.beginPath(); g.roundRect(bx - 5, by - 5, s + 10, s + 10, s * 0.18); g.fill();
    const body = new Path2D(); body.roundRect(bx, by, s, s, s * 0.14);
    g.fillStyle = HD.rad(bx + s * 0.4, by + s * 0.4, 0, s, [[0, '#5a46c8'], [0.5, '#22307a'], [1, '#0a0c2a']]); g.fill(body);
    g.save(); g.clip(body); for (let i = 0; i < 22; i++) { const xx = bx + hs(i) * s, yy = by + ((hs(i + 3) * s + rt * 14 * (0.5 + hs(i + 5))) % s); g.fillStyle = rgba('#ffffff', 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(rt * 5 + i * 2))); g.fillRect(xx, yy, 3, 3); } g.restore();
    [-1, 1].forEach((d) => { const ex = d * s * 0.19 + 6, ey = by + s * 0.42; HD.glow(ex, ey, s * 0.5, '#5ae0ff', 0.6); g.fillStyle = '#dff6ff'; g.beginPath(); g.roundRect(ex - s * 0.085, ey - s * 0.135, s * 0.17, s * 0.27, 4); g.fill(); });
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const fx = bx + s * (0.08 + i * 0.14), h0 = s * (0.25 + (i % 2 ? 0.12 : 0.28) + (i === 3 ? 0.18 : 0)) * (0.85 + 0.2 * Math.sin(rt * 12 + i * 2)), w = s * 0.08, p = new Path2D(); p.moveTo(fx - w, by + 2); p.quadraticCurveTo(fx - w * 0.4, by - h0 * 0.6, fx + Math.sin(rt * 7 + i) * w * 0.6, by - h0); p.quadraticCurveTo(fx + w * 0.4, by - h0 * 0.6, fx + w, by + 2); p.closePath(); g.fillStyle = HD.lin(0, by, 0, by - h0, [[0, 'rgba(255,255,255,0.95)'], [0.6, 'rgba(191,240,255,0.7)'], [1, 'rgba(120,200,255,0)']]); g.fill(p); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(fc, 0.9); g.lineWidth = 5; g.beginPath(); g.roundRect(bx - 2, by - 2, s + 4, s + 4, s * 0.16); g.stroke(); g.restore();
    g.restore();
  }
  function drawClash(rt) {
    const c = S.clash; if (S.mode !== 'clash' || !c) return;
    const g = cx, el = S.t - c.t0, m = mouth(), h = [S.p.x + 50, S.p.y], on = seg(el, 0.6, 1.2);
    if (on <= 0) { HD.glow(m[0], m[1], 260 * seg(el, 0, 0.6), '#ffd27a', 0.9); HD.glow(h[0], h[1], 200 * seg(el, 0, 0.6), '#9ff0ff', 0.9); return; }
    const k = c.k, M = [lerp(h[0], m[0], k), lerp(h[1], m[1], k)], wob = Math.sin(rt * 40) * 6, push = Math.max(0, 1 - (S.rt - c.push) / 0.12);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    [[h, '#7fe8ff', 1 + push * 0.4], [m, '#ff7a2a', 1]].forEach((b) => { const w = (70 + wob) * on * b[2]; g.strokeStyle = rgba(b[1], 0.45); g.lineWidth = w * 2.2; g.beginPath(); g.moveTo(b[0][0], b[0][1]); g.lineTo(M[0], M[1]); g.stroke(); g.strokeStyle = rgba(b[1], 0.9); g.lineWidth = w; g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = w * 0.35; g.stroke(); });
    g.restore();
    HD.glow(M[0], M[1], (380 + 60 * Math.sin(rt * 30)) * on, '#ffffff', 0.9); HD.glow(M[0], M[1], 700 * on, '#ffb060', 0.5);
    for (let i = 0; i < 3; i++) { const a = rt * 13 + i * 2.1, L2 = 220 + 140 * Math.sin(rt * 21 + i); HD.drawBolt(HD.bolt(M[0], M[1], M[0] + Math.cos(a) * L2, M[1] + Math.sin(a) * L2, Math.floor(rt * 30) + i * 7, 30), i % 2 ? '#bff0ff' : '#ffd27a', 0.9 * on); }
    if (Math.random() < 0.6) S.sparks.push({ x: M[0], y: M[1], a: Math.random() * TAU, v: 300 + Math.random() * 900, t: S.rt, c: Math.random() < 0.5 ? '#9ff0ff' : '#ffd27a' });
    if (el > 1.2) { const a2 = 0.7 + 0.3 * Math.sin(rt * 18); cx.save(); cx.textAlign = 'center'; cx.font = '900 84px Cinzel, serif'; cx.fillStyle = rgba('#ffffff', a2); cx.shadowColor = '#7fe8ff'; cx.shadowBlur = 30; cx.fillText(L ? 'اضغط! اضغط! اضغط!' : 'TAP! TAP! TAP!', W / 2, H * 0.86); cx.restore(); }
  }
  function hud(rt) {
    const g = cx;
    if (S.mode !== 'won' && S.mode !== 'intro') {
      const w = 1100, x0 = (W - w) / 2, y0 = 70, k = S.hp / 100;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x0 - 6, y0 - 6, w + 12, 30);
      g.fillStyle = HD.lin(x0, 0, x0 + w, 0, [[0, '#ff3a10'], [1, '#ffd27a']]); g.fillRect(x0, y0, w * k, 18);
      g.fillStyle = 'rgba(255,255,255,0.4)'; [0.67, 0.34].forEach((m) => g.fillRect(x0 + w * m, y0 - 4, 3, 26));
      g.font = '900 30px Cinzel, serif'; g.textAlign = 'center'; g.fillStyle = '#f2e2c8'; g.fillText(L ? 'الطاغية القرمزي' : 'THE CRIMSON TYRANT', W / 2, y0 - 16);
      for (let i = 0; i < 3; i++) { const on = i < S.hearts, x = 80 + i * 70, y = 90; g.fillStyle = on ? '#ff3a5a' : 'rgba(255,255,255,0.15)'; g.beginPath(); g.moveTo(x, y + 18); g.bezierCurveTo(x - 34, y - 6, x - 14, y - 30, x, y - 10); g.bezierCurveTo(x + 14, y - 30, x + 34, y - 6, x, y + 18); g.fill(); }
      for (let i = 0; i < 3; i++) { const q = S.superReady > 0 ? 1 : cl(S.orbs - i), x = 80 + i * 70; g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(x, 160, 18, 0, TAU); g.fill(); if (q > 0) { g.fillStyle = '#9ff0ff'; g.beginPath(); g.moveTo(x, 160); g.arc(x, 160, 18, -Math.PI / 2, -Math.PI / 2 + q * TAU); g.closePath(); g.fill(); if (q >= 1) HD.glow(x, 160, 54, '#5ae0ff', 0.6); } }
      if (S.combo >= 3) { const lv = furyLv(), col = FURY[lv].col, pop = 1 + 0.25 * Math.max(0, 1 - (S.rt - (S.comboT || -9)) / 0.15); g.save(); g.translate(300, 120); g.scale(pop, pop); g.textAlign = 'left'; g.font = '900 54px Cinzel, serif'; g.fillStyle = col; g.fillText('x' + S.combo, 0, 0); if (lv) { g.font = '700 26px Cinzel, serif'; g.fillText(FURY[lv].name, 0, 34); } g.restore(); }
    }
    for (const w of S.words) {
      const e = rt - w.t; if (e > 1.0) { w.dead = 1; continue; } const k = eo(cl(e / 0.12));
      g.save(); g.globalAlpha = 1 - seg(e, 0.7, 1.0); if (w.at) g.translate(w.at[0], w.at[1] - e * 60); else g.translate(W * 0.5, H * (w.big ? 0.42 : 0.3)); g.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); g.font = '900 ' + (w.big ? 110 : w.at ? 50 : 70) + 'px Cinzel, serif'; g.textAlign = 'center'; g.fillStyle = w.col; if (w.at) { g.lineWidth = 8; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,0.65)'; g.strokeText(w.txt, 0, 0); } else { g.shadowColor = w.col; g.shadowBlur = 30; } g.fillText(w.txt, 0, 0); g.restore();
    }
    S.words = S.words.filter((w) => !w.dead);
    if (S.mode === 'intro') { const a = seg(S.t, 0.5, 1.0) * (1 - seg(S.t, 3.0, 3.4)); g.save(); g.globalAlpha = a; g.font = '700 46px Cinzel, serif'; g.textAlign = 'center'; g.fillStyle = '#f2e6cc'; g.shadowColor = '#000'; g.shadowBlur = 12; g.fillText(L ? 'اضغط = اقلب · بتضرب لوحدك · اتفادى كل حاجة' : 'TAP = FLIP · YOU SHOOT BY YOURSELF · DODGE EVERYTHING', W / 2, H * 0.93); g.restore(); }
    if (S.redT > -9 && S.rt - S.redT < 0.3) { g.fillStyle = 'rgba(255,0,30,' + (0.35 * (1 - (S.rt - S.redT) / 0.3)) + ')'; g.fillRect(0, 0, W, H); }
    if (S.mode === 'down') {
      const e = S.t - S.mt0; g.fillStyle = 'rgba(0,0,0,' + Math.min(0.65, e) + ')'; g.fillRect(0, 0, W, H);
      g.save(); g.textAlign = 'center'; g.globalAlpha = seg(e, 0.2, 0.6); g.font = '900 120px Cinzel, serif'; g.fillStyle = '#ff5a5a'; g.shadowColor = '#ff2a2a'; g.shadowBlur = 30; g.fillText(L ? 'تاني!' : 'AGAIN!', W / 2, H * 0.42);
      g.shadowBlur = 0; const pct = Math.round(100 - S.hp), w = 900; g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect((W - w) / 2, H * 0.55, w, 20); g.fillStyle = '#ffd27a'; g.fillRect((W - w) / 2, H * 0.55, w * pct / 100, 20);
      g.font = '700 44px Cinzel, serif'; g.fillStyle = '#f2e6cc'; g.fillText((L ? 'كسرته ' : 'YOU BROKE ') + pct + '%', W / 2, H * 0.66); g.restore();
    }
    if (S.mode === 'won') {
      const k = seg(S.t - S.mt0, 0, 0.6), time = S.mt0 - S.start, rank = S.deaths === 0 && time < 140 ? 'S' : S.deaths <= 1 ? 'A' : S.deaths <= 3 ? 'B' : 'C';
      g.fillStyle = 'rgba(0,0,0,' + (0.6 * k) + ')'; g.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha = k; g.textAlign = 'center'; g.font = '900 140px Cinzel, serif'; g.fillStyle = '#ffd27a'; g.shadowColor = '#ff8a3a'; g.shadowBlur = 40; g.fillText(L ? 'انتصار' : 'VICTORY', W / 2, H * 0.34);
      g.shadowBlur = 0; g.font = '700 50px Cinzel, serif'; g.fillStyle = '#f2e6cc';
      [[L ? 'الوقت' : 'TIME', time.toFixed(1) + 's'], [L ? 'مرات الوقوع' : 'FALLS', S.deaths], [L ? 'التقييم' : 'RANK', rank]].forEach((r, i) => g.fillText(r[0] + '   ' + r[1], W / 2, H * 0.52 + i * 70));
      g.globalAlpha = k * (0.6 + 0.4 * Math.sin(S.rt * 4)); g.fillText(L ? 'اضغط للمتابعة' : 'TAP TO CONTINUE', W / 2, H * 0.9); g.restore();
      S.rank = rank;
    }
  }
  function render(rt) {
    const g = cx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    const shk = S.shake * Math.exp(-(rt - S.shT) / 0.12), ssx = shk * Math.sin(rt * 71), ssy = shk * Math.cos(rt * 63);
    g.setTransform(sc, 0, 0, sc, ox + ssx * sc, oy + ssy * sc);
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    HD.setCtx(g); ART.rt(rt);
    FK.hdX = S.boss.x; FK.hdY = S.boss.y; FK.hdScale = S.boss.sc; FK.hdFlip = S.boss.flip; FK.hdUnb = S.phase === 2 ? cl(S.mode === 'trans' ? (S.t - S.trans.t0 - 0.9) / 0.8 : 1) : 0; FK.t = S.t; FK.hp = S.hp;
    const wid = WORLD[S.phase], wk = S.worldFrom ? cl((S.t - S.worldK0) / 1.0) : 1;
    const K = SKIP;
    const bolt = K.world ? 0 : ART.world(FK, rt, wid, S.worldFrom, wk);
    if (!K.grade) { g.fillStyle = GRADE[S.phase]; g.fillRect(0, 0, W, H); }
    if (!K.slabs) drawSlab(false, rt);
    const pos = K.tyrant ? null : ART.tyrant(FK, rt, bolt);
    if (!K.slabs) drawSlab(true, rt); if (!K.streaks) drawStreaks(rt);
    if (!K.obs) drawObstacles(rt);
    if (!K.foes) drawFoes(rt);
    if (!K.shots) drawShots(rt);
    drawClash(rt);
    if (!K.front) ART.front(FK, rt, wid, pos);
    drawHero(rt);
    if (!K.hud) hud(rt);
    ART.title(rt);
    g.restore();
  }

  // ------------------------------------------------------------------ the overlay
  function fit() {
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), vw = window.innerWidth * dpr, vh = window.innerHeight * dpr, k = Math.min(1, 1280 / vw, 720 / vh) * QG.rs[QG.lv];
    cv.width = Math.max(320, Math.round(vw * k)); cv.height = Math.max(180, Math.round(vh * k));
    sc = Math.min(cv.width / W, cv.height / H); ox = (cv.width - W * sc) / 2; oy = (cv.height - H * sc) / 2;
    ART.use(Math.round(W * sc), Math.round(H * sc));
  }
  // the quality governor: a phone that can't hold ~50 fps gets a smaller picture (twice at most), never a laggy fight
  const QG = { lv: 0, rs: [1, 0.75, 0.58], acc: 0, n: 0 };
  function govern(ms) {
    if (S.t < 1.2 || QG.lv >= 2) return;
    QG.acc += ms; QG.n++;
    if (QG.acc < 1500) return;
    const avg = QG.acc / QG.n; QG.acc = 0; QG.n = 0;
    if (avg > 21) { QG.lv++; fit(); if (QG.lv === 2 && FF.HDBoss._dbg) FF.HDBoss._dbg.Q.level = 1; }
  }
  const onDown = (e) => { e.preventDefault(); if (e.target === qbtn) return; press(); };
  const onKey = (e) => { if (e.repeat) return; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Enter') { e.preventDefault(); press(); } if (e.code === 'Escape') finish(false, true); };
  const onVis = () => { if (document.hidden) { paused = true; if (AU.ctx) AU.ctx.suspend(); } else { paused = false; last = performance.now(); if (AU.ctx) AU.ctx.resume(); } };
  let paused = false, qbtn = null; const SKIP = {};
  function frame(now) {
    if (finished) return;
    const ms = now - last, dt = Math.min(0.05, ms / 1000); last = now;
    if (!paused) { govern(ms); S.rt += dt; ART.prebake(); update(dt); render(S.rt); }
    raf = requestAnimationFrame(frame);
  }
  function play(opts, onDone) {
    opts = opts || {};
    if (!finished) finish(false, true);
    finished = false; doneCb = onDone; L = opts.lang === 'ar' ? 1 : 0; AU.muted = !!opts.muted;
    S = newState(); later.length = 0; QG.lv = 0; QG.acc = 0; QG.n = 0; const hq = FF.HDBoss._dbg && FF.HDBoss._dbg.Q; QG.hq0 = hq ? hq.level : 0;
    Object.assign(FK, { t: 0, mode: 'intro', modeT0: 0, introLen: 3.4, phase: 0, anim: { kind: 'idle', hits: [] }, hitT: -9, hp: 100, hpMax: 100 });
    root = document.createElement('div'); root.className = 'tyrantFight';
    root.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#000;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent';
    cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    cx = cv.getContext('2d', { alpha: false });
    qbtn = document.createElement('button'); qbtn.type = 'button'; qbtn.textContent = '✕'; qbtn.setAttribute('aria-label', L ? 'خروج' : 'Quit');
    qbtn.style.cssText = 'position:absolute;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));width:40px;height:40px;font:bold 18px sans-serif;color:#fff;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.4);border-radius:10px;z-index:2';
    qbtn.addEventListener('click', (e) => { e.stopPropagation(); finish(false, true); });
    root.appendChild(cv); root.appendChild(qbtn); document.body.appendChild(root);
    root.addEventListener('pointerdown', onDown, { passive: false });
    window.addEventListener('keydown', onKey); window.addEventListener('resize', fit); document.addEventListener('visibilitychange', onVis);
    fit(); AU.init(opts.ctx || (FF.audio && FF.audio.ctx) || null);
    try { if (document.fonts) { document.fonts.load('900 60px Cinzel'); document.fonts.load('700 40px Cinzel'); } } catch (e) { /* a serif then */ }
    last = performance.now(); raf = requestAnimationFrame(frame);
    AU.play('thunder');
    return { quit: () => finish(false, true) };
  }
  function finish(win, quit) {
    if (finished) return; finished = true;
    if (FF.HDBoss._dbg) FF.HDBoss._dbg.Q.level = QG.hq0 || 0;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', onVis);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null; cv = null; cx = null;
    const res = { win: !!win && !quit, quit: !!quit, time: S ? Math.round((S.mt0 - S.start) * 10) / 10 : 0, deaths: S ? S.deaths : 0, rank: S && win ? S.rank || 'C' : '' };
    const cb = doneCb; doneCb = null; if (typeof cb === 'function') { try { cb(res); } catch (e) { setTimeout(() => { throw e; }, 0); } }
  }
  FF.TyrantFight = { play, active: () => !finished, _dbg: { SKIP, QG, get S() { return S; }, press, update, FK, sx: (wx) => sx(wx), set hold(v) { paused = !!v; }, render: (rt) => render(rt), C, F, MIDY, PR, G, KICK, MAXV } };
})(window.FF = window.FF || {});
