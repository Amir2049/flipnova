// FLIPNOVA — synthesized sound effects. Design rule: NO music, no melodies, no tonal jingles.
// Everything is air, clicks, digital pulses, crackle and noise — generated live with Web Audio.
(function (FF) {
  'use strict';
  const A = {
    ctx: null, master: null, sfxBus: null, uiBus: null, noise: null, crush: null,
    vol: { sfx: 0.8, ui: 0.6, muted: false }
  };
  FF.audio = A;

  A.init = function () {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.build(new AC());
    setTimeout(() => { try { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); A.play('sig'); } catch (e) { /* */ } }, 180); // b44: the game opens with its signature
  };
  // build 39: the mix. sfx / ui → master → a punch compressor → make-up gain → a brick-wall limiter, so the boss fight
  // is LOUD and clean; heavy blows also feed a waveshaper (saturation) and a short generated reverb gives them a room.
  // Works on any context, so tools can render the very same sounds offline (OfflineAudioContext).
  A.build = function (ctx) {
    A.ctx = ctx; A.tOff = 0;
    A.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 6; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.12;
    const makeup = ctx.createGain(); makeup.gain.value = 1.5;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    const out = ctx.createGain(); out.gain.value = 0.86; // (true-peak headroom under the limiter)
    A.master.connect(comp).connect(makeup).connect(lim).connect(out).connect(ctx.destination);
    A.sfxBus = ctx.createGain();
    A.uiBus = ctx.createGain();
    A.sfxBus.connect(A.master);
    A.uiBus.connect(A.master);
    // saturation for heavy blows (a tanh curve)
    A.dist = ctx.createWaveShaper();
    const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; cv[i] = Math.tanh(x * 4) / Math.tanh(4); }
    A.dist.curve = cv; A.dist.oversample = '2x';
    const dg = ctx.createGain(); dg.gain.value = 0.55; A.dist.connect(dg).connect(A.sfxBus);
    // a generated stereo room (1.8 s), fed by sends
    const sr = ctx.sampleRate, rl = Math.floor(sr * 1.8), ir = ctx.createBuffer(2, rl, sr);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3.2); }
    A.verb = ctx.createConvolver(); A.verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.32; A.verb.connect(vg).connect(A.sfxBus);
    A.apply();
    // white noise buffer
    const len = ctx.sampleRate * 1.0;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = b;
    // bit-crushed noise (sample & hold) for the pixel crunch
    const cb = ctx.createBuffer(1, len * 0.4, ctx.sampleRate);
    const cd = cb.getChannelData(0);
    let hold = 0;
    for (let i = 0; i < cd.length; i++) {
      if (i % 22 === 0) hold = Math.round((Math.random() * 2 - 1) * 4) / 4;
      cd[i] = hold;
    }
    A.crush = cb;
    // crackle: sparse impulses
    const kb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const kd = kb.getChannelData(0);
    for (let i = 0; i < kd.length; i++) kd[i] = Math.random() < 0.012 ? Math.random() * 2 - 1 : 0;
    A.crackle = kb;
    return A;
  };
  const now = () => A.ctx.currentTime + (A.tOff || 0);
  const PV = () => A.pv || 1; // per-play pitch variation (repeats never sound the same)

  A.setVolumes = function (v) {
    Object.assign(A.vol, v);
    A.apply();
  };
  A.apply = function () {
    if (!A.ctx) return;
    A.master.gain.value = A.vol.muted ? 0 : 1;
    A.sfxBus.gain.value = A.vol.sfx;
    A.uiBus.gain.value = A.vol.ui;
  };

  // ---- primitives
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function noise(bus, o) {
    const ctx = A.ctx, t = now() + (o.delay || 0), pv = PV();
    const src = ctx.createBufferSource();
    src.buffer = o.buf || A.noise;
    src.playbackRate.value = (o.rate || 1) * pv;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime((o.f0 || 1000) * pv, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1 * pv, t + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    env(g, t, o.a || 0.004, o.gain || 0.5, o.dur);
    let node = src.connect(f).connect(g);
    if (o.pan !== undefined && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = o.pan;
      node = node.connect(p);
    }
    node.connect(bus);
    src.start(t, Math.random() * 0.3);
    src.stop(t + o.dur + 0.05);
  }
  // A pitch-*dropping* thump / pulse: percussive body, never a note sequence.
  function thump(bus, o) {
    const ctx = A.ctx, t = now() + (o.delay || 0), pv = PV();
    const osc = ctx.createOscillator();
    osc.type = o.wave || 'sine';
    osc.frequency.setValueAtTime(o.f0 * pv, t);
    osc.frequency.exponentialRampToValueAtTime(o.f1 * pv, t + o.dur);
    const g = ctx.createGain();
    env(g, t, o.a || 0.002, o.gain || 0.4, o.dur);
    let n = osc.connect(g);
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      n = n.connect(f);
    }
    n.connect(bus);
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }
  function click(bus, o) {
    noise(bus, { type: 'highpass', f0: o.f || 3500, q: 0.7, dur: o.dur || 0.02, gain: o.gain || 0.5, delay: o.delay, pan: o.pan });
  }
  // ---- build 39 layers (still no music: sweeps, hits, booms and metal — never a melody)
  // a layered hit: sub-bass thump + body + noise crack + a pitched transient (heavy: the sub is also saturated)
  function hit(bus, o) {
    const g = o.gain || 1, d = o.delay || 0, low = o.low || 1;
    thump(bus, { f0: 90 * low, f1: 32 * low, dur: 0.32 * (o.len || 1), gain: 0.9 * g, delay: d });
    thump(bus, { f0: 240 * low, f1: 70 * low, dur: 0.11, gain: 0.5 * g, wave: 'triangle', delay: d });
    noise(bus, { type: 'highpass', f0: 2400, q: 0.7, dur: 0.07, gain: 0.9 * g, delay: d });
    noise(bus, { buf: A.crush, type: 'lowpass', f0: 5000, f1: 500, dur: 0.16, gain: 0.6 * g, delay: d });
    thump(bus, { f0: 1800, f1: 380, dur: 0.028, gain: 0.32 * g, wave: 'square', lp: 4000, delay: d });
    if (o.heavy) { thump(A.dist, { f0: 110 * low, f1: 30 * low, dur: 0.45, gain: 1.0 * g, wave: 'sawtooth', lp: 700, delay: d }); noise(A.verb, { buf: A.crush, type: 'lowpass', f0: 3000, f1: 300, dur: 0.3, gain: 0.7 * g, delay: d }); }
  }
  // a riser: filtered noise and a saw that climb into the moment (an attack's telegraph, a charge, a shift)
  function riser(bus, o) {
    const len = o.len || 0.5, g = o.gain || 0.5, d = o.delay || 0;
    noise(bus, { f0: o.f0 || 300, f1: o.f1 || 6000, q: 2.2, dur: len, gain: g, a: len * 0.9, delay: d });
    thump(bus, { f0: o.p0 || 70, f1: o.p1 || 420, dur: len, gain: g * 0.28, wave: 'sawtooth', lp: 1600, a: len * 0.85, delay: d });
  }
  // a reverse swell: a dark breath that sucks in and cuts off (lands right on a boom)
  function swell(bus, o) { noise(bus, { type: 'lowpass', f0: 300, f1: 7000, q: 0.8, dur: o.len || 0.6, gain: o.gain || 0.6, a: (o.len || 0.6) * 0.96, delay: o.delay }); }
  // a deep boom: a long sub drop, saturated, with a rumble tail in the room
  function boom(bus, o) {
    const g = o.gain || 1, d = o.delay || 0, L = o.len || 1.4;
    thump(bus, { f0: 62, f1: 24, dur: L, gain: 1.0 * g, delay: d });
    thump(A.dist, { f0: 80, f1: 28, dur: L * 0.6, gain: 0.8 * g, wave: 'sawtooth', lp: 380, delay: d });
    noise(bus, { type: 'lowpass', f0: 1200, f1: 60, dur: L, gain: 0.7 * g, delay: d });
    noise(A.verb, { type: 'lowpass', f0: 2000, f1: 120, dur: 0.6, gain: 0.8 * g, delay: d });
  }
  // a metallic clang: inharmonic partials that ring and decay (parry clashes, stingers)
  function clang(bus, o) {
    const f = o.f || 1200, g = o.gain || 0.5, d = o.delay || 0;
    [[1, 1, 0.9], [2.76, 0.55, 0.6], [5.4, 0.35, 0.4], [8.93, 0.2, 0.25]].forEach(([r, a, L]) => {
      thump(bus, { f0: f * r, f1: f * r * 0.985, dur: L * (o.len || 1), gain: g * a, delay: d });
      thump(A.verb, { f0: f * r, f1: f * r * 0.98, dur: L * 0.5, gain: g * a * 0.5, delay: d });
    });
    click(bus, { f: 6000, gain: g, dur: 0.012, delay: d });
  }

  const S = {
    flip(b, o) {
      const up = o && o.up;
      noise(b, { f0: up ? 700 : 2600, f1: up ? 2600 : 700, q: 1.4, dur: 0.11, gain: 0.45, a: 0.01 });
      thump(b, { f0: 140, f1: 55, dur: 0.07, gain: 0.35 });
      thump(b, { f0: 90, f1: 60, dur: 0.04, gain: 0.12, wave: 'square', lp: 600 });
    },
    // b66: the tap grades answer by ear too (noise and clicks only, quieter than PERFECT)
    good(b) { click(b, { f: 2400, gain: 0.18, dur: 0.012 }); },
    great(b) {
      click(b, { f: 3000, gain: 0.3, dur: 0.014 });
      click(b, { f: 4200, gain: 0.22, dur: 0.012, delay: 0.035 });
      noise(b, { f0: 3500, f1: 6500, q: 2, dur: 0.06, gain: 0.18 });
    },
    // b66: each NERVE tier sounds bigger than the last (was 'frenzy' for tiers 1-2 and 'record' for 3-4)
    nerveTier(b, o) {
      const n = Math.max(0, Math.min(3, (o && o.tier) || 0));
      thump(b, { f0: 140 - n * 15, f1: 45, dur: 0.16 + n * 0.04, gain: 0.35 + n * 0.08 });
      noise(b, { f0: 900, f1: 5000 + n * 1500, q: 1.3, dur: 0.18 + n * 0.05, gain: 0.3 + n * 0.06, a: 0.02 });
      for (let i = 0; i <= n; i++) click(b, { f: 2600 + i * 500, gain: 0.25, dur: 0.012, delay: 0.06 + i * 0.05 });
      if (n >= 2) noise(b, { buf: A.crackle, type: 'highpass', f0: 2500, dur: 0.25, gain: 0.3, delay: 0.08 });
    },
    perfect(b) {
      click(b, { f: 5000, gain: 0.7, dur: 0.015 });
      noise(b, { type: 'highpass', f0: 7000, q: 0.5, dur: 0.14, gain: 0.35, delay: 0.01 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 3000, dur: 0.12, gain: 0.8, delay: 0.015 });
      thump(b, { f0: 180, f1: 70, dur: 0.06, gain: 0.25 });
    },
    near(b) {
      noise(b, { f0: 400, f1: 3500, q: 2, dur: 0.18, gain: 0.5, a: 0.06, pan: -0.4 });
      noise(b, { f0: 3500, f1: 900, q: 2, dur: 0.14, gain: 0.25, delay: 0.12, pan: 0.4 });
    },
    coin(b) {
      noise(b, { f0: 3200 + Math.random() * 1600, q: 9, dur: 0.035, gain: 0.55 });
      click(b, { f: 6000, gain: 0.2, dur: 0.01 });
    },
    gem(b) {
      for (let i = 0; i < 3; i++) noise(b, { f0: 2500 + i * 900 + Math.random() * 300, q: 10, dur: 0.04, gain: 0.5, delay: i * 0.03 });
      noise(b, { type: 'highpass', f0: 8000, dur: 0.2, gain: 0.25, delay: 0.05 });
    },
    line(b) {
      for (let i = 0; i < 4; i++) click(b, { f: 3000 + Math.random() * 3000, gain: 0.45, dur: 0.018, delay: i * 0.035 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 2000, dur: 0.2, gain: 0.7, delay: 0.1 });
    },
    combo(b, o) {
      const lv = (o && o.level) || 2;
      thump(b, { f0: 220, f1: 60, dur: 0.1, gain: 0.45 });
      click(b, { f: 2000, gain: 0.6, dur: 0.02 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 1500, dur: 0.12 + lv * 0.08, gain: 0.6 + lv * 0.2, delay: 0.02 });
    },
    frenzy(b) {
      noise(b, { f0: 300, f1: 4000, q: 1.2, dur: 0.8, gain: 0.45, a: 0.35 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 2500, dur: 0.6, gain: 1, delay: 0.2 });
      thump(b, { f0: 160, f1: 40, dur: 0.3, gain: 0.35, delay: 0.3 });
    },
    world(b) {
      S.knock2(b);
      thump(b, { f0: 80, f1: 35, dur: 0.35, gain: 0.4, wave: 'square', lp: 400 });
      noise(b, { type: 'lowpass', f0: 3000, f1: 200, dur: 0.6, gain: 0.35, a: 0.1 });
    },
    crash(b) {
      noise(b, { buf: A.crush, type: 'lowpass', f0: 5000, f1: 400, dur: 0.28, gain: 0.8 });
      thump(b, { f0: 110, f1: 35, dur: 0.22, gain: 0.55 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 1200, dur: 0.25, gain: 0.8, delay: 0.04 });
      noise(b, { f0: 260, q: 12, dur: 0.1, gain: 1.5, delay: 0.3 }); thump(b, { f0: 130, f1: 60, dur: 0.14, gain: 0.4, delay: 0.3 }); noise(A.verb, { f0: 500, q: 3, dur: 0.25, gain: 0.5, delay: 0.3 }); // b44: the signature's last knock, low
    },
    // b44 🔊 THE SIGNATURE: tok · tok · TOK. The game opens with it, a new record starts with it, a new world answers
    // with two, and a crash ends on one low knock. Stone and pixel crackle only: it never holds a note.
    sig(b) {
      [0, 0.2, 0.44].forEach((d, i) => { const k = i === 2 ? 1.3 : 0.75; noise(b, { f0: 310, q: 12, dur: 0.09, gain: 1.9 * k, delay: d }); noise(b, { f0: 820, q: 10, dur: 0.06, gain: 1.3 * k, delay: d }); noise(b, { f0: 1650, q: 8, dur: 0.035, gain: 0.7 * k, delay: d }); thump(b, { f0: 170, f1: 95, dur: 0.09, gain: 0.4 * k, delay: d }); });
      noise(A.verb, { f0: 600, q: 3, dur: 0.3, gain: 0.7, delay: 0.44 }); thump(b, { f0: 90, f1: 36, dur: 0.4, gain: 0.55, delay: 0.44 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 2500, dur: 0.35, gain: 0.7, delay: 0.5 }); noise(b, { type: 'highpass', f0: 6000, dur: 0.4, gain: 0.15, a: 0.05, delay: 0.5 });
    },
    knockMe(b, o) { // MINO knocks back: brighter than his brother's, and the third one lands
      const n = (o && o.n) || 1, k = 0.8 + n * 0.15;
      noise(b, { f0: 430, q: 12, dur: 0.08, gain: 1.9 * k }); noise(b, { f0: 1150, q: 10, dur: 0.05, gain: 1.3 * k }); click(b, { f: 3800, gain: 0.35 * k, dur: 0.01 }); thump(b, { f0: 230, f1: 120, dur: 0.08, gain: 0.45 * k });
      noise(A.verb, { f0: 800, q: 3, dur: 0.2, gain: 0.4 * k });
      if (n >= 3) { thump(b, { f0: 110, f1: 40, dur: 0.3, gain: 0.6 }); noise(b, { buf: A.crackle, type: 'highpass', f0: 2500, dur: 0.25, gain: 0.8, delay: 0.02 }); }
    },
    // b45 PALE NIRO's set pieces
    fistSlam(b) { swell(b, { len: 0.18, gain: 0.5 }); hit(b, { gain: 1.25, heavy: true, low: 0.8, len: 1.3, delay: 0.16 }); boom(b, { gain: 0.8, len: 1.2, delay: 0.16 }); for (let i = 0; i < 7; i++) noise(b, { f0: 400 + Math.random() * 1500, q: 2.5, dur: 0.07, gain: 0.55, delay: 0.2 + Math.random() * 0.5, pan: Math.random() * 2 - 1 }); },
    quakeRun(b) { noise(b, { buf: A.crush, type: 'lowpass', f0: 600, f1: 2400, dur: 0.9, gain: 0.9, a: 0.05 }); for (let i = 0; i < 9; i++) { noise(b, { f0: 700 + i * 90, q: 6, dur: 0.05, gain: 0.7, delay: i * 0.09, pan: 0.8 - i * 0.18 }); thump(b, { f0: 120, f1: 50, dur: 0.08, gain: 0.35, delay: i * 0.09 }); } },
    dashTrio(b) { [0.8, 0, -0.8].forEach((p, i) => { noise(b, { f0: 500, f1: 5200, q: 1.4, dur: 0.22, gain: 0.6, a: 0.16, delay: i * 0.18, pan: p }); noise(b, { buf: A.crackle, type: 'highpass', f0: 3500, dur: 0.18, gain: 0.8, delay: 0.16 + i * 0.18, pan: -p }); }); },
    cubeStrike(b) { riser(b, { len: 0.3, gain: 0.55, f0: 600, f1: 7000 }); hit(b, { gain: 1.4, heavy: true, len: 1.6, delay: 0.3 }); boom(b, { gain: 1.0, len: 1.6, delay: 0.3 }); noise(b, { buf: A.crackle, type: 'highpass', f0: 1800, dur: 0.9, gain: 1.2, delay: 0.32 }); for (let i = 0; i < 24; i++) click(b, { f: 3000 + Math.random() * 7000, gain: 0.3, dur: 0.012, delay: 0.34 + i * 0.03, pan: Math.random() * 2 - 1 }); },
    comboUp(b, o) { const n = Math.min(5, Math.floor(((o && o.n) || 5) / 5)); for (let i = 0; i < 3 + n; i++) click(b, { f: 2200 + i * 650, gain: 0.45, dur: 0.014, delay: i * 0.035 }); noise(b, { f0: 800, f1: 4000 + n * 900, q: 1.5, dur: 0.22, gain: 0.45, a: 0.12 }); thump(b, { f0: 150, f1: 70, dur: 0.12, gain: 0.45, delay: 0.1 }); },
    knock2(b) { [0, 0.13].forEach((d, i) => { noise(b, { f0: 330, q: 12, dur: 0.08, gain: 1.4 + i * 0.4, delay: d }); noise(b, { f0: 860, q: 10, dur: 0.05, gain: 1.0 + i * 0.3, delay: d }); thump(b, { f0: 170, f1: 95, dur: 0.08, gain: 0.3, delay: d }); }); },
    record(b) {
      [0, 0.11, 0.22].forEach((d, i) => { const k = 0.7 + i * 0.3; noise(b, { f0: 310, q: 12, dur: 0.08, gain: 1.6 * k, delay: d }); noise(b, { f0: 820, q: 10, dur: 0.05, gain: 1.1 * k, delay: d }); thump(b, { f0: 170, f1: 95, dur: 0.08, gain: 0.35 * k, delay: d }); });
      for (let i = 0; i < 18; i++) click(b, { f: 2500 + Math.random() * 5000, gain: 0.35, dur: 0.012, delay: Math.random() * 0.5, pan: Math.random() * 2 - 1 });
      noise(b, { type: 'highpass', f0: 6000, dur: 0.5, gain: 0.2, a: 0.05 });
    },
    pad(b) {
      thump(b, { f0: 70, f1: 320, dur: 0.12, gain: 0.35, wave: 'square', lp: 900 });
      noise(b, { f0: 600, f1: 4000, q: 1.5, dur: 0.12, gain: 0.35 });
    },
    // b66: the b61 worlds' zones get a voice when you enter them (noise, clicks and thumps only — no tones)
    windTail(b) { // rushing in, with the grit of sand
      noise(b, { f0: 500, f1: 3600, q: 1.2, dur: 0.4, gain: 0.4, a: 0.25, pan: -0.3 });
      noise(b, { buf: A.crackle, type: 'highpass', f0: 3000, dur: 0.3, gain: 0.5, delay: 0.15 });
    },
    windHead(b) { // pushed back, muffled
      noise(b, { type: 'lowpass', f0: 2600, f1: 260, q: 0.9, dur: 0.5, gain: 0.4, a: 0.05 });
      noise(b, { buf: A.crush, type: 'lowpass', f0: 900, f1: 200, dur: 0.4, gain: 0.3, delay: 0.05 });
    },
    fieldFloat(b) { // soft air and three unpitched bubble ticks
      noise(b, { type: 'lowpass', f0: 1800, f1: 500, dur: 0.35, gain: 0.3, a: 0.08 });
      for (let i = 0; i < 3; i++) noise(b, { f0: 1800 + i * 350, q: 14, dur: 0.03, gain: 0.35, delay: 0.08 + i * 0.07, pan: i % 2 ? 0.5 : -0.5 });
    },
    fieldHeavy(b) { // pressed down
      thump(b, { f0: 100, f1: 34, dur: 0.28, gain: 0.4 });
      noise(b, { buf: A.crush, type: 'lowpass', f0: 1800, f1: 200, dur: 0.3, gain: 0.35 });
      click(b, { f: 1200, gain: 0.3, dur: 0.02 });
    },
    totem(b) { // a stone knock: the jungle totem is carved stone, not a spring pad
      noise(b, { f0: 310, q: 12, dur: 0.09, gain: 1.4 });
      noise(b, { f0: 820, q: 10, dur: 0.06, gain: 1.0 });
      thump(b, { f0: 150, f1: 60, dur: 0.1, gain: 0.4 });
      noise(b, { f0: 600, f1: 2400, q: 1.4, dur: 0.1, gain: 0.3, a: 0.02 });
    },
    lock(b) {
      thump(b, { f0: 120, f1: 80, dur: 0.05, gain: 0.3, wave: 'square', lp: 500 });
      click(b, { f: 1500, gain: 0.3, dur: 0.015 });
    },
    glitch(b) {
      for (let i = 0; i < 6; i++) noise(b, { buf: A.crush, type: 'bandpass', f0: 500 + Math.random() * 4000, q: 3, dur: 0.05, gain: 0.6, delay: i * 0.06 });
    },
    ui(b) { noise(b, { type: 'lowpass', f0: 2500, dur: 0.025, gain: 0.5 }); click(b, { f: 3000, gain: 0.15, dur: 0.01 }); },
    uiBack(b) { noise(b, { type: 'lowpass', f0: 1200, dur: 0.03, gain: 0.5 }); },
    // ⚔️ boss fight — build 39: rebuilt from layers (no music, no notes: hits, sweeps, booms, metal, noise)
    bossWarn(b) { riser(b, { len: 0.42, gain: 0.42, f0: 500, f1: 5200 }); noise(b, { f0: 3000, f1: 700, q: 1.6, dur: 0.16, gain: 0.35, delay: 0.38, pan: 0.5 }); click(b, { f: 3000, gain: 0.35, dur: 0.015, delay: 0.4 }); },
    bossCharge(b) { riser(b, { len: 0.75, gain: 0.55, f0: 150, f1: 4500, p0: 50, p1: 300 }); noise(b, { buf: A.crackle, type: 'highpass', f0: 1500, dur: 0.75, gain: 0.8, a: 0.6 }); },
    bossRoar(b) {
      noise(A.dist, { buf: A.crush, type: 'lowpass', f0: 1800, f1: 160, dur: 1.0, gain: 1.0, a: 0.05 });
      thump(b, { f0: 70, f1: 26, dur: 1.0, gain: 0.8, wave: 'sawtooth', lp: 320 });
      noise(A.verb, { buf: A.crush, type: 'bandpass', f0: 600, dur: 0.9, gain: 0.7 });
      noise(b, { buf: A.crackle, type: 'bandpass', f0: 800, dur: 0.8, gain: 0.9, delay: 0.1 });
    },
    bossHit(b) { hit(b, { gain: 0.85 }); },
    bossHurt(b) { hit(b, { gain: 1.1, heavy: true, low: 0.8, len: 1.4 }); noise(b, { buf: A.crush, type: 'lowpass', f0: 5000, f1: 300, dur: 0.3, gain: 0.8 }); },
    heart(b, o) { const f = o && o.fast; thump(b, { f0: 70, f1: 38, dur: 0.14, gain: f ? 0.85 : 0.5 }); thump(b, { f0: 60, f1: 34, dur: 0.16, gain: f ? 0.7 : 0.4, delay: 0.17 }); },
    sealFire(b) { thump(b, { f0: 700, f1: 3200, dur: 0.09, gain: 0.25, wave: 'square', lp: 5000 }); noise(b, { f0: 1200, f1: 8000, q: 3, dur: 0.2, gain: 0.5, a: 0.01 }); click(b, { f: 6000, gain: 0.35, dur: 0.01 }); },
    impact(b) { hit(b, { gain: 1.2, heavy: true, len: 1.5 }); boom(b, { gain: 0.6, len: 0.9 }); },
    cutIn(b) { noise(b, { f0: 300, f1: 7000, q: 1.2, dur: 0.22, gain: 0.6, a: 0.12, pan: -0.6 }); noise(b, { f0: 7000, f1: 700, q: 1.2, dur: 0.2, gain: 0.4, delay: 0.16, pan: 0.6 }); thump(b, { f0: 180, f1: 60, dur: 0.12, gain: 0.5, delay: 0.2 }); },
    shatter(b) { for (let i = 0; i < 12; i++) noise(b, { f0: 2500 + Math.random() * 6000, q: 9, dur: 0.07, gain: 0.5, delay: i * 0.035 + Math.random() * 0.02, pan: Math.random() * 2 - 1 }); boom(b, { gain: 0.7, len: 0.9 }); },
    bossFall(b) { swell(b, { len: 0.4, gain: 0.5 }); boom(b, { gain: 1.1, len: 2.0, delay: 0.4 }); noise(b, { buf: A.crackle, type: 'highpass', f0: 1200, dur: 1.4, gain: 1, delay: 0.4 }); },
    unlock(b) { for (let i = 0; i < 24; i++) click(b, { f: 3000 + Math.random() * 6000, gain: 0.3, dur: 0.012, delay: i * 0.04, pan: Math.random() * 2 - 1 }); noise(b, { type: 'highpass', f0: 5000, dur: 1.0, gain: 0.25, a: 0.3 }); },
    thunder(b) { noise(b, { type: 'highpass', f0: 3000, dur: 0.05, gain: 1 }); noise(b, { buf: A.crush, type: 'lowpass', f0: 6000, f1: 300, dur: 0.6, gain: 0.9 }); boom(b, { gain: 0.7, len: 1.1, delay: 0.04 }); },
    freeze(b) { swell(b, { len: 0.18, gain: 0.4 }); noise(b, { f0: 7000, f1: 300, q: 2, dur: 0.45, gain: 0.45, a: 0.02, delay: 0.18 }); clang(b, { f: 2600, gain: 0.25, len: 0.6, delay: 0.18 }); },
    voidCut(b) { noise(b, { f0: 9000, f1: 1000, q: 4, dur: 0.14, gain: 0.6 }); hit(b, { gain: 0.6, delay: 0.03 }); },
    quake(b) { boom(b, { gain: 0.9, len: 1.6 }); noise(b, { type: 'lowpass', f0: 500, f1: 70, dur: 1.6, gain: 0.6, a: 0.25 }); },
    uiGo(b) { click(b, { f: 2500, gain: 0.4, dur: 0.015 }); click(b, { f: 4000, gain: 0.35, dur: 0.015, delay: 0.05 }); thump(b, { f0: 160, f1: 70, dur: 0.06, gain: 0.25 }); },
    // b43 📖 a knuckle on stone (PALE NIRO's rhythm): three short resonances and a small thump, the cave answers. The strike
    // (third knock) is heavier. Percussive only: it never holds a note.
    knock(b, o) {
      const k = o && o.strike ? 1.35 : 0.85;
      noise(b, { f0: 310, q: 12, dur: 0.09, gain: 2.0 * k }); noise(b, { f0: 820, q: 10, dur: 0.06, gain: 1.4 * k }); noise(b, { f0: 1650, q: 8, dur: 0.035, gain: 0.8 * k });
      click(b, { f: 3000, gain: 0.3 * k, dur: 0.01 }); thump(b, { f0: 170, f1: 95, dur: 0.09, gain: 0.45 * k });
      noise(A.verb, { f0: 600, q: 3, dur: 0.25, gain: 0.5 * k });
      if (o && o.strike) thump(b, { f0: 90, f1: 40, dur: 0.22, gain: 0.5 });
    },
    // b44 📖 PALE NIRO's own voice: breath, stone and knocks (the Tyrant's roars, chains and thunder are not his)
    niroWarn(b) { noise(b, { f0: 2200, f1: 500, q: 2.5, dur: 0.34, gain: 0.5, a: 0.2 }); S.knock(A.verb, { strike: false }); noise(b, { f0: 300, q: 10, dur: 0.07, gain: 0.9, delay: 0.3 }); },
    niroCharge(b) { noise(b, { type: 'lowpass', f0: 250, f1: 4200, q: 1, dur: 0.75, gain: 0.55, a: 0.7 }); noise(b, { f0: 2800, q: 1.6, dur: 0.12, gain: 0.3, delay: 0.2, pan: -0.7 }); noise(b, { f0: 3200, q: 1.6, dur: 0.12, gain: 0.3, delay: 0.45, pan: 0.7 }); thump(b, { f0: 40, f1: 90, dur: 0.75, gain: 0.35, a: 0.7 }); },
    niroBreath(b) { // a hollow breath out of the Void, whispers riding on it
      noise(b, { f0: 520, f1: 180, q: 3, dur: 1.0, gain: 1.1, a: 0.12 }); noise(A.verb, { f0: 900, f1: 300, q: 2, dur: 0.9, gain: 0.9, a: 0.1 });
      thump(b, { f0: 80, f1: 30, dur: 0.9, gain: 0.6 });
      for (let i = 0; i < 4; i++) noise(A.verb, { f0: 2600 + i * 250, q: 1.6, dur: 0.11, gain: 0.5, a: 0.04, delay: 0.15 + i * 0.16, pan: i % 2 ? 0.8 : -0.8 });
    },
    niroShift(b) { // the world changes: an in-breath, three knocks in the dark, then the ground gives
      swell(b, { len: 0.5, gain: 0.6 });
      [0.5, 0.68, 0.86].forEach((d, i) => { noise(b, { f0: 310, q: 12, dur: 0.09, gain: 1.6 + i * 0.5, delay: d }); noise(b, { f0: 820, q: 10, dur: 0.06, gain: 1.1 + i * 0.3, delay: d }); thump(b, { f0: 170, f1: 90, dur: 0.09, gain: 0.4 + i * 0.15, delay: d }); });
      boom(b, { gain: 1.0, len: 1.7, delay: 0.88 }); noise(A.verb, { buf: A.crush, type: 'lowpass', f0: 2600, f1: 200, dur: 0.6, gain: 0.8, delay: 0.88 });
    },
    niroCrack(b) { for (let i = 0; i < 6; i++) click(b, { f: 2200 + Math.random() * 2600, gain: 0.6, dur: 0.02, delay: i * 0.03 + Math.random() * 0.02, pan: Math.random() * 2 - 1 }); noise(b, { buf: A.crush, type: 'lowpass', f0: 4000, f1: 300, dur: 0.5, gain: 0.8 }); thump(b, { f0: 120, f1: 40, dur: 0.3, gain: 0.5 }); },
    niroChip(b) { noise(b, { f0: 1800, q: 8, dur: 0.05, gain: 1.3 }); noise(b, { f0: 3400, q: 10, dur: 0.035, gain: 0.8, delay: 0.012 }); click(b, { f: 5000, gain: 0.5, dur: 0.012 }); thump(b, { f0: 200, f1: 70, dur: 0.12, gain: 0.6 }); noise(b, { buf: A.crush, type: 'lowpass', f0: 3000, f1: 500, dur: 0.12, gain: 0.45 }); },
    niroVS(b) { swell(b, { len: 0.55, gain: 0.7 }); S.niroShift(b); hit(b, { gain: 1.0, heavy: true, delay: 1.45, len: 1.4 }); },
    niroFree(b) { // the third knock is answered: stone lets go, light comes back
      [0, 0.22, 0.44].forEach((d, i) => { noise(b, { f0: 310, q: 12, dur: 0.09, gain: 1.4 + i * 0.5, delay: d }); noise(b, { f0: 820, q: 10, dur: 0.06, gain: 1.0 + i * 0.3, delay: d }); thump(b, { f0: 170, f1: 90, dur: 0.09, gain: 0.4 + i * 0.15, delay: d }); });
      boom(b, { gain: 1.0, len: 2.0, delay: 0.46 });
      noise(b, { type: 'highpass', f0: 1500, f1: 11000, q: 0.7, dur: 1.8, gain: 0.45, a: 1.0, delay: 0.5 });
      for (let i = 0; i < 30; i++) click(b, { f: 3500 + Math.random() * 7000, gain: 0.3, dur: 0.012, delay: 0.7 + i * 0.05, pan: Math.random() * 2 - 1 });
    },
    lightsOut(b) { noise(b, { f0: 3200, f1: 180, q: 1.6, dur: 0.6, gain: 0.7, a: 0.02 }); thump(b, { f0: 70, f1: 28, dur: 0.5, gain: 0.6, delay: 0.5 }); for (let i = 0; i < 4; i++) noise(b, { type: 'highpass', f0: 5000, dur: 0.05, gain: 0.3, delay: i * 0.13, pan: i % 2 ? 0.7 : -0.7 }); },
    echoSplit(b) { [-0.8, 0, 0.8].forEach((p, i) => { noise(b, { f0: 600, f1: 4200, q: 1.6, dur: 0.14, gain: 0.5, a: 0.09, delay: i * 0.09, pan: p }); click(b, { f: 4500, gain: 0.3, dur: 0.012, delay: i * 0.09 + 0.13, pan: p }); }); },
    pitCrack(b) { noise(b, { buf: A.crush, type: 'lowpass', f0: 3500, f1: 250, dur: 0.4, gain: 0.9 }); thump(b, { f0: 110, f1: 34, dur: 0.35, gain: 0.7 }); for (let i = 0; i < 5; i++) noise(b, { f0: 500 + Math.random() * 1500, q: 2.5, dur: 0.06, gain: 0.5, delay: 0.1 + Math.random() * 0.4, pan: Math.random() * 2 - 1 }); },
    gaze(b) { noise(b, { type: 'highpass', f0: 2000, f1: 7000, q: 0.8, dur: 0.6, gain: 0.5 }); noise(A.dist, { f0: 900, q: 6, dur: 0.6, gain: 0.5 }); thump(b, { f0: 140, f1: 60, dur: 0.6, gain: 0.5 }); },
    styleUp(b, o) { const r = (o && o.rank) || 1; for (let i = 0; i < 2 + r; i++) click(b, { f: 2500 + i * 700, gain: 0.35, dur: 0.012, delay: i * 0.03 }); noise(b, { f0: 600, f1: 3000 + r * 600, q: 1.5, dur: 0.16, gain: 0.35, a: 0.08 }); },
    whoosh(b) { const p = Math.random() < 0.5 ? -0.6 : 0.6; noise(b, { f0: 300, f1: 4200, q: 1.3, dur: 0.18, gain: 0.5, a: 0.12, pan: p }); noise(b, { f0: 4200, f1: 600, q: 1.3, dur: 0.14, gain: 0.3, delay: 0.16, pan: -p }); },
    // the hyperspace roar into / out of the tunnel: a long climb, a saturated drone, then the boom on the flash
    warp(b) {
      riser(b, { len: 1.1, gain: 0.7, f0: 120, f1: 9000, p0: 40, p1: 520 });
      thump(A.dist, { f0: 38, f1: 95, dur: 1.1, gain: 0.7, wave: 'sawtooth', lp: 500, a: 0.9 });
      noise(A.verb, { buf: A.crush, type: 'bandpass', f0: 400, f1: 3000, dur: 1.1, gain: 0.6, a: 0.9 });
      boom(b, { gain: 1.0, len: 1.6, delay: 1.1 }); noise(b, { type: 'highpass', f0: 2500, dur: 0.25, gain: 0.9, delay: 1.1 });
    },
    shiftBoom(b) { swell(b, { len: 0.7, gain: 0.7 }); boom(b, { gain: 1.1, len: 1.8, delay: 0.7 }); hit(b, { gain: 0.8, heavy: true, delay: 0.7 }); },
    clash(b) { clang(b, { f: 1180, gain: 0.55 }); clang(b, { f: 1730, gain: 0.35, delay: 0.006 }); hit(b, { gain: 0.6 }); noise(b, { buf: A.crackle, type: 'highpass', f0: 4000, dur: 0.25, gain: 0.9 }); },
    glassCrack(b) { for (let i = 0; i < 8; i++) click(b, { f: 4000 + i * 700, gain: 0.4, dur: 0.012, delay: i * 0.016, pan: i % 2 ? 0.5 : -0.5 }); noise(b, { f0: 3000, f1: 900, q: 3, dur: 0.3, gain: 0.4 }); noise(A.verb, { f0: 5000, q: 6, dur: 0.2, gain: 0.5 }); },
    tryAgain(b) { hit(b, { gain: 1.0, heavy: true }); clang(b, { f: 320, gain: 0.45, len: 1.4 }); },
    // cinematic stingers
    stingVS(b) { swell(b, { len: 0.55, gain: 0.7 }); hit(b, { gain: 1.2, heavy: true, delay: 0.55, len: 1.5 }); boom(b, { gain: 1.0, len: 1.8, delay: 0.55 }); clang(b, { f: 620, gain: 0.5, len: 1.6, delay: 0.55 }); },
    stingDefeat(b) { hit(b, { gain: 1.3, heavy: true, low: 0.7, len: 1.6 }); boom(b, { gain: 1.1, len: 2.2, delay: 0.05 }); noise(b, { type: 'lowpass', f0: 6000, f1: 150, q: 2, dur: 1.4, gain: 0.6, delay: 0.1 }); clang(b, { f: 170, gain: 0.5, len: 2.0, delay: 0.3 }); },
    // ---- b42: the clash (a hush, then a huge metal clash), counter-QTEs, the ultimate per skin
    clashIn(b) { A.duckAmb(0.02, 1.6); swell(b, { len: 1.2, gain: 0.35 }); thump(b, { f0: 50, f1: 30, dur: 1.4, gain: 0.35, a: 1.0 }); },
    clashWin(b) { A.duckAmb(0.05, 0.6); clang(b, { f: 980, gain: 0.7, len: 1.6 }); clang(b, { f: 1460, gain: 0.5, len: 1.4, delay: 0.004 }); clang(b, { f: 640, gain: 0.45, len: 1.8, delay: 0.01 }); hit(b, { gain: 1.3, heavy: true, len: 1.5 }); boom(b, { gain: 0.9, len: 1.6 }); noise(b, { buf: A.crackle, type: 'highpass', f0: 3500, dur: 0.5, gain: 1 }); },
    clashLose(b) { hit(b, { gain: 1.0, heavy: true, low: 0.7 }); clang(b, { f: 260, gain: 0.45, len: 1.2 }); },
    ultReady(b) { for (let i = 0; i < 14; i++) click(b, { f: 3000 + i * 400, gain: 0.3, dur: 0.012, delay: i * 0.03, pan: (i % 2 ? 0.5 : -0.5) }); riser(b, { len: 0.5, gain: 0.35, f0: 1500, f1: 9000 }); },
    ultStart(b, o) {
      const sk = (o && o.skin) || 'generic';
      A.duckAmb(0.15, 3.0);
      riser(b, { len: 1.6, gain: 0.6, f0: 150, f1: 8000, p0: 45, p1: 380 });
      if (sk === 'wshinobi') for (let i = 0; i < 4; i++) noise(b, { f0: 300 + i * 200, f1: 3000, q: 1.2, dur: 0.5, gain: 0.5, a: 0.2, delay: i * 0.35, pan: i % 2 ? 0.7 : -0.7 }); // the tornado winds up
      else if (sk === 'bwarden') for (let i = 0; i < 40; i++) noise(b, { f0: 500 + Math.random() * 900, q: 9, dur: 0.05, gain: 0.35, delay: 0.3 + i * 0.03, pan: Math.random() * 2 - 1 }); // blood rain on stone
      else if (sk === 'ctyrant') { noise(b, { buf: A.crackle, type: 'highpass', f0: 900, dur: 1.6, gain: 1.2, a: 1.2 }); noise(A.dist, { buf: A.crush, type: 'lowpass', f0: 400, f1: 2400, dur: 1.6, gain: 0.7, a: 1.3 }); } // the fire climbs
      else if (sk === 'jackpot') for (let r = 0; r < 3; r++) { for (let i = 0; i < 10; i++) click(b, { f: 2500, gain: 0.25, dur: 0.01, delay: r * 0.3 + i * 0.025 }); clang(b, { f: 1800 + r * 300, gain: 0.4, len: 0.5, delay: 0.6 + r * 0.3 }); } // reels spin and lock: 7 · 7 · 7
      else { thump(b, { f0: 30, f1: 70, dur: 1.6, gain: 0.6, a: 1.4 }); noise(b, { type: 'highpass', f0: 4000, f1: 12000, dur: 1.6, gain: 0.3, a: 1.4 }); } // a galaxy forms
    },
    ultHit(b, o) {
      const sk = (o && o.skin) || 'generic';
      hit(b, { gain: 1.4, heavy: true, len: 1.6 }); boom(b, { gain: 1.2, len: 2.2 });
      if (sk === 'jackpot') for (let i = 0; i < 36; i++) click(b, { f: 4000 + Math.random() * 6000, gain: 0.35, dur: 0.015, delay: 0.05 + i * 0.03, pan: Math.random() * 2 - 1 }); // the coin shower
      else if (sk === 'wshinobi') noise(b, { f0: 200, f1: 5000, q: 1, dur: 1.2, gain: 0.7 });
      else if (sk === 'ctyrant') noise(b, { buf: A.crackle, type: 'highpass', f0: 800, dur: 1.4, gain: 1.4 });
      else if (sk === 'bwarden') noise(b, { type: 'lowpass', f0: 1200, f1: 200, dur: 1.2, gain: 0.8 });
      else clang(b, { f: 1480, gain: 0.4, len: 1.6, delay: 0.1 });
    },
    stingVictory(b) {
      hit(b, { gain: 1.2, heavy: true, len: 1.4 }); boom(b, { gain: 1.0, len: 2.0 });
      noise(b, { type: 'highpass', f0: 1500, f1: 12000, q: 0.7, dur: 1.6, gain: 0.45, a: 0.9, delay: 0.1 });
      for (let i = 0; i < 28; i++) click(b, { f: 4000 + Math.random() * 7000, gain: 0.3, dur: 0.012, delay: 0.3 + i * 0.05, pan: Math.random() * 2 - 1 });
      clang(b, { f: 1480, gain: 0.45, len: 1.8, delay: 0.1 }); clang(b, { f: 2210, gain: 0.3, len: 1.6, delay: 0.35 });
    }
  };

  // =====================================================================================================
  // 🌬 b42: the duel's AMBIENCE — no music, no instruments, no melody: only natural / cinematic sound design.
  // Loops of wind, fire crackle, a low thunder rumble, a void echo and a cosmic hiss, mixed per dimension, plus a
  // heartbeat-like low pulse (faster with each phase, racing at 1 heart), the Tyrant's footsteps, distant thunder and
  // metal clanks. Its own bus and its own setting (Ambience), separate from the sound effects.
  const AMB = { st: null, last: 0, next: {}, beatT: 0 };
  A.duckAmb = function (to, len) { // a hush (silence before a clash), then back
    if (!AMB.bus) return;
    const t = now(), g = AMB.duck.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + 0.06); g.setTargetAtTime(1, t + len, 0.35);
  };
  function loop(buf, type, f, q, dest) {
    const ctx = A.ctx, src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(fl).connect(g).connect(dest); src.start();
    return { g, fl };
  }
  function ambBuild() {
    const ctx = A.ctx;
    AMB.bus = ctx.createGain(); AMB.duck = ctx.createGain();
    AMB.bus.connect(AMB.duck).connect(A.master);
    AMB.wind = loop(A.noise, 'bandpass', 420, 0.9, AMB.bus);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 260; lfo.connect(lg).connect(AMB.wind.fl.frequency); lfo.start(); // the wind howls up and down
    AMB.fire = loop(A.crackle, 'highpass', 1100, 0.7, AMB.bus);
    AMB.rumble = loop(A.noise, 'lowpass', 85, 0.7, AMB.bus);
    const dl = ctx.createDelay(1); dl.delayTime.value = 0.37; const fb = ctx.createGain(); fb.gain.value = 0.55; dl.connect(fb).connect(dl); dl.connect(AMB.bus);
    AMB.voidE = loop(A.noise, 'bandpass', 900, 9, dl); // the void: a narrow whisper fed into an echo
    AMB.hiss = loop(A.noise, 'highpass', 5200, 0.7, AMB.bus);
    const l2 = ctx.createOscillator(), g2 = ctx.createGain(); l2.frequency.value = 0.07; g2.gain.value = 2400; l2.connect(g2).connect(AMB.hiss.fl.frequency); l2.start();
  }
  // per world variant: wind, fire, rumble, void echo, cosmic hiss
  const NMIX = { 0: [0.16, 0.1, 0.18, 0, 0], 1: [0.06, 0, 0.24, 0, 0], 2: [0.08, 0, 0.12, 0, 0], 3: [0.08, 0.3, 0.1, 0, 0], 4: [0.22, 0, 0.26, 0, 0], 5: [0.2, 0, 0.3, 0, 0] }; // b45: no whistling echo, no hiss // b44: PALE NIRO's mines
  const AMIX = { 0: [0.22, 0.32, 0.18, 0, 0], 1: [0.32, 0.18, 0.26, 0, 0], 2: [0.3, 0.5, 0.42, 0, 0], 3: [0.12, 0, 0.1, 0.5, 0.05], 4: [0.05, 0, 0.26, 0.15, 0.32], 5: [0.18, 0.08, 0.2, 0.35, 0.05] };
  A.ambience = function (st) { // called every rendered frame by the boss duel (st = null to stop)
    AMB.st = st; AMB.last = performance.now();
    if (!A.ctx || A.ctx.state !== 'running') return;
    const on = !!st && st.on && !A.vol.muted;
    if (on && !AMB.bus) ambBuild();
    if (!AMB.bus) return;
    const niro = on && st.set === 'niro', t = now(), mx = on ? (niro ? NMIX[st.v] : AMIX[st.v]) || AMIX[0] : [0, 0, 0, 0, 0], lv = on ? 0.9 : 0;
    [AMB.wind, AMB.fire, AMB.rumble, AMB.voidE, AMB.hiss].forEach((L, i) => L.g.gain.setTargetAtTime(mx[i] * lv, t, 0.8));
    if (!on) return;
    // the heartbeat-like pulse: slow in phase 1, faster each phase, racing on the last heart
    const per = st.hearts === 1 ? 0.46 : [1.15, 0.9, 0.7][st.phase] || 0.9;
    if (t >= AMB.beatT) { AMB.beatT = t + per; thump(AMB.bus, { f0: 58, f1: 34, dur: 0.16, gain: 0.55 }); thump(AMB.bus, { f0: 50, f1: 30, dur: 0.18, gain: 0.4, delay: 0.17 }); }
    const ev = (k, gap, fn) => { if (t >= (AMB.next[k] || 0)) { if (AMB.next[k]) fn(); AMB.next[k] = t + gap * (0.7 + Math.random() * 0.6); } };
    if (niro) { // the mines: water drips, a knock far away, whispers in the dark and among the echoes
      if (st.v !== 4) ev('drip', 2.6, () => { noise(AMB.bus, { f0: 2400 + Math.random() * 1800, q: 14, dur: 0.05, gain: 0.5, pan: Math.random() * 2 - 1 }); noise(A.verb, { f0: 1800, q: 8, dur: 0.12, gain: 0.25 }); });
      ev('farKnock', 5.5, () => { for (let i = 0; i < 3; i++) { noise(A.verb, { f0: 310, q: 12, dur: 0.09, gain: 0.5 + i * 0.1, delay: i * 0.3 }); noise(A.verb, { f0: 820, q: 10, dur: 0.06, gain: 0.3, delay: i * 0.3 }); } });
      if (st.v === 1 || st.v === 2) ev('whisper', 3.4, () => { const p = Math.random() < 0.5 ? -0.8 : 0.8; for (let i = 0; i < 3; i++) noise(A.verb, { f0: 2600 + Math.random() * 800, q: 1.6, dur: 0.12, gain: 0.4, a: 0.05, delay: i * 0.15, pan: p }); });
      return;
    }
    if (st.v !== 4) ev('step', 1.8, () => { thump(AMB.bus, { f0: 70, f1: 28, dur: 0.35, gain: 0.5 }); noise(AMB.bus, { buf: A.crush, type: 'lowpass', f0: 500, f1: 80, dur: 0.3, gain: 0.35 }); }); // the Tyrant's footsteps
    if (st.v === 1 || st.v === 2) ev('thunder', 6, () => { noise(AMB.bus, { buf: A.crush, type: 'lowpass', f0: 900, f1: 60, dur: 2.2, gain: 0.5, a: 0.3 }); });
    if (st.v === 0 || st.v === 2 || st.v === 5) ev('clank', 4.5, () => { noise(AMB.bus, { f0: 1700 + Math.random() * 900, q: 14, dur: 0.6, gain: 0.12, pan: Math.random() * 2 - 1 }); }); // chains and armour, far off
    if (st.v === 4) ev('rush', 3.2, () => { noise(AMB.bus, { f0: 300, f1: 4000, q: 1.2, dur: 1.4, gain: 0.25, a: 1.0, pan: Math.random() * 2 - 1 }); }); // the tube roars past
  };
  setInterval(() => { if (AMB.bus && AMB.st && performance.now() - AMB.last > 400) A.ambience(null); }, 250); // the duel ended: fade out

  A.play = function (name, o) {
    if (A.tap) A.tap(name, o); // (tools: logs what plays, e.g. to render a video's soundtrack)
    if (!A.ctx || A.vol.muted || A.ctx.state !== 'running') return;
    const fn = S[name];
    if (!fn) return;
    const bus = name.indexOf('ui') === 0 ? A.uiBus : A.sfxBus;
    A.pv = name.indexOf('ui') === 0 ? 1 : 1 + (Math.random() - 0.5) * 0.1; // ±5% pitch on every play
    try { fn(bus, o); } catch (e) { /* never let audio break the game */ }
    A.pv = 1;
  };
  // tools: render a list of [time s, name, opts] into a stereo buffer offline (the same synthesis as the game)
  A.renderOffline = async function (events, seconds, rate) {
    const keep = { ctx: A.ctx, master: A.master, sfxBus: A.sfxBus, uiBus: A.uiBus, dist: A.dist, verb: A.verb, noise: A.noise, crush: A.crush, crackle: A.crackle, vol: Object.assign({}, A.vol) };
    const oc = new OfflineAudioContext(2, Math.ceil((rate || 44100) * seconds), rate || 44100);
    A.vol.muted = false; A.build(oc);
    for (const [t, name, o] of events) { const fn = S[name]; if (!fn) continue; A.tOff = t; A.pv = name.indexOf('ui') === 0 ? 1 : 1 + (Math.random() - 0.5) * 0.1; try { fn(name.indexOf('ui') === 0 ? A.uiBus : A.sfxBus, o); } catch (e) { /* skip */ } }
    A.tOff = 0; A.pv = 1;
    const buf = await oc.startRendering();
    Object.assign(A, keep); A.tOff = 0;
    return buf;
  };
})(window.FF);
