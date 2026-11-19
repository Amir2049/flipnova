// FLIPNOVA trailer — the sound: synthesized SFX (no music) + the narration, mixed offline.
// TR.renderAudio(narr) -> Promise<AudioBuffer>; narr = array of ArrayBuffers (mp3 lines 1..14) or nulls.
(function () {
  'use strict';
  const TR = window.TR;
  const { hs } = TR;

  TR.renderAudio = async function (narr, only) {
    const SR = 48000, DUR = TR.DUR, C = new OfflineAudioContext(2, Math.ceil(DUR * SR), SR);
    // ---------- buses
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25;
    const master = C.createGain(); master.gain.value = 0.9; comp.connect(master).connect(C.destination);
    const sfx = C.createGain(), duck = C.createGain(); sfx.connect(duck).connect(comp);
    const ir = (dur, decay, dark) => { const n = Math.floor(dur * SR), b = C.createBuffer(2, n, SR); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const k = i / n, a = 1 - Math.min(0.97, dark * k); lp = lp * (1 - a) + (Math.random() * 2 - 1) * a; d[i] = lp * Math.pow(1 - k, decay) * (i < SR * 0.012 ? i / (SR * 0.012) : 1); } } return b; };
    const rev = C.createConvolver(); rev.buffer = ir(3.6, 2.4, 0.9); const revRet = C.createGain(); revRet.gain.value = 0.55; rev.connect(revRet).connect(sfx);
    const hall = C.createConvolver(); hall.buffer = ir(6.0, 2.0, 0.8); const hallRet = C.createGain(); hallRet.gain.value = 0.5; hall.connect(hallRet).connect(sfx);
    // ---------- noise
    const mkNoise = (kind) => { const n = SR * 8, b = C.createBuffer(1, n, SR), d = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (kind === 'white') d[i] = w; else if (kind === 'pink') { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } } return b; };
    const NZ = { white: mkNoise('white'), pink: mkNoise('pink'), brown: mkNoise('brown') };
    let seed = 1; const rnd = () => hs(seed++ * 1.37);
    const noise = (kind, t, dur) => { const s = C.createBufferSource(); s.buffer = NZ[kind]; s.loop = true; s.start(t, rnd() * 6, dur + 0.05); return s; };
    const osc = (type, f, t, dur) => { const o = C.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; };
    const filt = (type, f, q) => { const b = C.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q !== undefined) b.Q.value = q; return b; };
    const shaper = (amt) => { const w = C.createWaveShaper(), n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * amt) / Math.tanh(amt); } w.curve = c; return w; };
    // out: node -> gain(env) -> pan -> sfx (+ sends)
    const out = (node, o) => { const gn = C.createGain(); gn.gain.value = 0; node.connect(gn); const p = C.createStereoPanner(); p.pan.value = o.pan || 0; gn.connect(p); p.connect(sfx); if (o.rev) { const s = C.createGain(); s.gain.value = o.rev; p.connect(s); s.connect(rev); } if (o.hall) { const s = C.createGain(); s.gain.value = o.hall; p.connect(s); s.connect(hall); } return { g: gn.gain, pan: p.pan }; };
    const hit = (param, t, peak, att, dec) => { param.setValueAtTime(0, t); param.linearRampToValueAtTime(peak, t + att); param.setTargetAtTime(0, t + att, dec / 4); };
    const swell = (param, t, dur, peak, rel) => { param.setValueAtTime(0.0001, t); param.exponentialRampToValueAtTime(peak, t + dur); param.setValueAtTime(peak, t + dur); param.linearRampToValueAtTime(0, t + dur + (rel || 0.02)); };
    const bed = (param, t, dur, peak, fin, fout) => { param.setValueAtTime(0, t); param.linearRampToValueAtTime(peak, t + fin); param.setValueAtTime(peak, t + dur - fout); param.linearRampToValueAtTime(0, t + dur); };

    // ---------- the sound library
    const S = {};
    S.boom = (t, g, f0) => { f0 = f0 || 55; const o = osc('sine', f0 * 2.4, t, 3); o.frequency.exponentialRampToValueAtTime(f0, t + 0.12); o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 2.2); const sh = shaper(2.5); o.connect(sh); hit(out(sh, { rev: 0.35 }).g, t, g, 0.004, 2.2);
      const n = noise('brown', t, 2.5), lp = filt('lowpass', 240); n.connect(lp); hit(out(lp, { rev: 0.5 }).g, t, g * 0.9, 0.006, 1.6); };
    S.sub = (t, g) => { const o = osc('sine', 72, t, 3.2); o.frequency.exponentialRampToValueAtTime(22, t + 2.8); hit(out(o, {}).g, t, g, 0.02, 3.0); };
    S.hit = (t, g, pan) => {   // the cinematic impact
      S.boom(t, g, 48); S.sub(t, g * 0.7);
      const n = noise('white', t, 0.3), hp = filt('highpass', 1800); n.connect(hp); hit(out(hp, { rev: 0.6, pan }).g, t, g * 0.55, 0.001, 0.12);
      [173, 251, 389, 611].forEach((f, i) => { const o = osc('triangle', f * (1 + (rnd() - 0.5) * 0.01), t, 2.6); hit(out(o, { rev: 0.7, hall: 0.3 }).g, t, g * 0.08 / (i + 1), 0.002, 2.2); });
      const m = noise('pink', t, 1.6), bp = filt('bandpass', 600, 0.8), sh = shaper(4); m.connect(bp).connect(sh); hit(out(sh, { rev: 0.6 }).g, t, g * 0.35, 0.002, 0.7);
    };
    S.riser = (tEnd, dur, g) => { const t = tEnd - dur, n = noise('white', t, dur), bp = filt('bandpass', 300, 2.5); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(7000, tEnd); n.connect(bp); swell(out(bp, { rev: 0.4 }).g, t, dur, g, 0.03);
      const r = noise('brown', t, dur), lp = filt('lowpass', 120); lp.frequency.exponentialRampToValueAtTime(600, tEnd); r.connect(lp); swell(out(lp, {}).g, t, dur, g * 0.6, 0.03); };
    S.rswell = (tEnd, dur, g) => { const t = tEnd - dur, n = noise('pink', t, dur), lp = filt('lowpass', 300); lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(5000, tEnd); n.connect(lp); swell(out(lp, { hall: 0.5 }).g, t, dur, g, 0.02); };
    S.thunder = (t, g, pan) => {
      const c = noise('white', t, 0.4), hp = filt('highpass', 1200); c.connect(hp); hit(out(hp, { rev: 0.7, pan }).g, t, g * 0.8, 0.002, 0.25);
      const r = noise('brown', t, 4.5), lp = filt('lowpass', 320), o = out(r, {}); r.disconnect(); r.connect(lp); lp.connect(C.createGain()); const gr = C.createGain(); lp.connect(gr); const p = C.createStereoPanner(); p.pan.value = pan || 0; gr.connect(p); p.connect(sfx); const sd = C.createGain(); sd.gain.value = 0.5; p.connect(sd); sd.connect(rev);
      gr.gain.setValueAtTime(0, t); let tt = t + 0.05; gr.gain.linearRampToValueAtTime(g, tt); while (tt < t + 4.2) { tt += 0.12 + rnd() * 0.35; gr.gain.linearRampToValueAtTime(g * (0.3 + 0.7 * rnd()) * Math.max(0, 1 - (tt - t) / 4.4), tt); } gr.gain.linearRampToValueAtTime(0, t + 4.5);
      o.g.value = 0;
    };
    S.knock = (t, g, big) => {   // the signature: tok
      const o = osc('sine', 210, t, 0.4); o.frequency.exponentialRampToValueAtTime(150, t + 0.12); hit(out(o, { rev: 0.4, hall: big ? 0.9 : 0.4 }).g, t, g, 0.002, 0.16);
      const o2 = osc('triangle', 430, t, 0.2); hit(out(o2, { hall: 0.4 }).g, t, g * 0.35, 0.001, 0.06);
      const n = noise('white', t, 0.06), bp = filt('bandpass', 1300, 2); n.connect(bp); hit(out(bp, { hall: 0.5 }).g, t, g * 0.6, 0.001, 0.025);
      const th = osc('sine', 70, t, 0.5); hit(out(th, { hall: big ? 0.6 : 0.2 }).g, t, g * (big ? 0.9 : 0.5), 0.003, 0.3);
    };
    S.heart = (t, g) => [0, 0.26].forEach((d, i) => { const o = osc('sine', 62, t + d, 0.4); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.18); hit(out(o, {}).g, t + d, g * (i ? 0.6 : 1), 0.006, 0.22); });
    S.growl = (t, dur, g, pitch) => {
      pitch = pitch || 1;
      const mixG = C.createGain(); const sh = shaper(3.5); mixG.connect(sh);
      [46, 69, 93].forEach((f, i) => { const o = osc('sawtooth', f * pitch, t, dur + 0.5); const l = osc('sine', 5 + i, t, dur + 0.5), lg = C.createGain(); lg.gain.value = 3 * pitch; l.connect(lg).connect(o.frequency); o.frequency.setValueAtTime(f * pitch * 0.85, t); o.frequency.linearRampToValueAtTime(f * pitch * 1.12, t + dur * 0.4); o.frequency.linearRampToValueAtTime(f * pitch * 0.8, t + dur); o.connect(mixG); });
      const rasp = noise('pink', t, dur + 0.5), bpr = filt('bandpass', 700, 1.2), am = C.createGain(), lfo = osc('square', 31, t, dur + 0.5), lfg = C.createGain(); lfg.gain.value = 0.5; am.gain.value = 0.5; lfo.connect(lfg).connect(am.gain); rasp.connect(bpr).connect(am).connect(mixG);
      const f1 = filt('bandpass', 420, 4), f2 = filt('bandpass', 980, 5), f3 = filt('lowpass', 2600), sum = C.createGain();
      f1.frequency.setValueAtTime(380, t); f1.frequency.linearRampToValueAtTime(620, t + dur * 0.5); f1.frequency.linearRampToValueAtTime(350, t + dur);
      sh.connect(f1).connect(sum); sh.connect(f2).connect(sum); sh.connect(f3); const f3g = C.createGain(); f3g.gain.value = 0.25; f3.connect(f3g).connect(sum);
      const e = out(sum, { rev: 0.5, hall: 0.3 }).g; e.setValueAtTime(0, t); e.linearRampToValueAtTime(g, t + 0.35); e.setValueAtTime(g * 0.9, t + dur - 0.5); e.linearRampToValueAtTime(0, t + dur + 0.4);
    };
    S.tick = (t, g, low) => { const n = noise('white', t, 0.02), hp = filt('highpass', 3000); n.connect(hp); hit(out(hp, { rev: 0.3 }).g, t, g, 0.0005, 0.01); const o = osc('sine', low ? 1500 : 2400, t, 0.12); hit(out(o, { rev: 0.4 }).g, t, g * 0.45, 0.001, 0.05); const o2 = osc('sine', low ? 700 : 1100, t, 0.2); hit(out(o2, { rev: 0.4 }).g, t, g * 0.3, 0.001, 0.09); };
    S.glass = (t, g, n) => { n = n || 40; for (let i = 0; i < n; i++) { const d = rnd() * rnd() * 0.6, o = osc('sine', 2000 + rnd() * 7000, t + d, 0.5); hit(out(o, { rev: 0.5, pan: (rnd() - 0.5) * 1.6 }).g, t + d, g * 0.1 * (0.4 + rnd()), 0.001, 0.05 + rnd() * 0.35); } const w = noise('white', t, 0.8), hp = filt('highpass', 3500); w.connect(hp); hit(out(hp, { rev: 0.6 }).g, t, g * 0.5, 0.001, 0.4); };
    S.crack = (t, g) => { const w = noise('white', t, 0.1), bp = filt('bandpass', 2500, 1.5); w.connect(bp); hit(out(bp, { rev: 0.5, pan: (rnd() - 0.5) }).g, t, g, 0.0005, 0.04); S.glass(t + 0.01, g * 0.4, 8); };
    // the ringing ears after a blast: pitchless (a thin breath of high noise), never a held tone
    S.ring = (t, dur, g) => { const n = noise('white', t, dur), bp = filt('highpass', 7000); n.connect(bp); bed(out(bp, {}).g, t, dur, g * 1.2, 0.05, dur * 0.7); };
    S.whoosh = (t, dur, g, p0, p1) => { const n = noise('pink', t, dur), bp = filt('bandpass', 400, 1.4); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.6); bp.frequency.exponentialRampToValueAtTime(500, t + dur); n.connect(bp); const e = out(bp, { rev: 0.4, pan: p0 || 0 }); e.g.setValueAtTime(0, t); e.g.linearRampToValueAtTime(g, t + dur * 0.6); e.g.linearRampToValueAtTime(0, t + dur); e.pan.setValueAtTime(p0 || -0.7, t); e.pan.linearRampToValueAtTime(p1 === undefined ? 0.7 : p1, t + dur); };
    S.wind = (t, dur, g, f) => { const n = noise('pink', t, dur), bp = filt('bandpass', f || 500, 0.9); let tt = t; bp.frequency.setValueAtTime(f || 500, t); while (tt < t + dur) { tt += 0.6 + rnd(); bp.frequency.linearRampToValueAtTime((f || 500) * (0.6 + rnd() * 0.9), tt); } n.connect(bp); bed(out(bp, { rev: 0.2 }).g, t, dur, g, Math.min(1.2, dur / 3), Math.min(1.2, dur / 3)); };
    S.whispers = (t, dur, g, voices) => {
      for (let v = 0; v < (voices || 6); v++) {
        const n = noise('white', t, dur), bp = filt('bandpass', 1800, 6), bp2 = filt('bandpass', 3200, 5), sum = C.createGain(); n.connect(bp).connect(sum); n.connect(bp2).connect(sum);
        const e = out(sum, { rev: 0.6, hall: 0.4, pan: (rnd() - 0.5) * 1.8 }).g; e.setValueAtTime(0, t);
        let tt = t + rnd() * 0.5; while (tt < t + dur - 0.3) { const syl = 0.08 + rnd() * 0.18, k = Math.min(1, (tt - t) / (dur * 0.6)); bp.frequency.setValueAtTime(900 + rnd() * 2200, tt); bp2.frequency.setValueAtTime(2400 + rnd() * 2500, tt); e.setValueAtTime(0, tt); e.linearRampToValueAtTime(g * (0.4 + 0.6 * k) * (0.5 + rnd() * 0.5), tt + syl * 0.3); e.linearRampToValueAtTime(0, tt + syl); tt += syl + (rnd() < 0.2 ? 0.3 + rnd() * 0.4 : 0.02); }
      }
    };
    S.inhale = (t, dur, g) => { const n = noise('pink', t, dur), bp = filt('bandpass', 700, 1.2); bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2200, t + dur); n.connect(bp); swell(out(bp, { hall: 0.6 }).g, t, dur, g, 0.15); };
    S.sand = (t, dur, g) => { const n = noise('white', t, dur), hp = filt('highpass', 3800), am = C.createGain(); n.connect(hp).connect(am); am.gain.setValueAtTime(0.5, t); for (let tt = t; tt < t + dur; tt += 0.05) am.gain.setValueAtTime(0.3 + rnd() * 0.7, tt); bed(out(am, { rev: 0.3 }).g, t, dur, g, 0.2, Math.min(0.8, dur / 2)); };
    S.paper = (t, dur, g) => { for (let tt = t; tt < t + dur; tt += 0.03 + rnd() * 0.12) { const n = noise('white', tt, 0.04), bp = filt('bandpass', 2500 + rnd() * 2500, 2); n.connect(bp); hit(out(bp, { rev: 0.3, pan: (rnd() - 0.5) * 1.6 }).g, tt, g * (0.3 + rnd() * 0.7), 0.001, 0.02); } };
    // no held tones anywhere (b46: the owner asked for zero music-like sound): the 'drone' is a pitchless rumble of filtered noise
    S.drone = (t, dur, f, g) => { const n = noise('brown', t, dur), lp = filt('lowpass', f * 4), n2 = noise('pink', t, dur), bp = filt('bandpass', 220 + f * 3, 0.7), sum = C.createGain(), g2 = C.createGain(); g2.gain.value = 0.25; n.connect(lp).connect(sum); n2.connect(bp).connect(g2).connect(sum); bed(out(sum, { hall: 0.3 }).g, t, dur, g * 0.55, Math.min(2, dur / 3), Math.min(1.5, dur / 3)); };
    // the 'shimmer' is air and scattered glass glints at random pitches (no chord, no held note)
    S.shimmer = (t, dur, g) => { const n = noise('white', t, dur), hp = filt('highpass', 6000); n.connect(hp); bed(out(hp, { hall: 0.6 }).g, t, dur, g * 0.05, dur * 0.3, dur * 0.5); for (let tt = t + 0.1; tt < t + dur - 0.2; tt += 0.09 + rnd() * 0.25) { const o = osc('sine', 3000 + rnd() * 6000, tt, 0.4); hit(out(o, { hall: 0.7, pan: (rnd() - 0.5) * 1.6 }).g, tt, g * 0.025 * (0.4 + rnd()), 0.002, 0.08 + rnd() * 0.2); } };
    S.clang = (t, g) => { [220, 331, 467, 709, 1013].forEach((f, i) => { const o = osc('square', f, t, 2.5), lp = filt('lowpass', 3000); o.connect(lp); hit(out(lp, { rev: 0.7, hall: 0.4 }).g, t, g * 0.07 / (1 + i * 0.4), 0.001, 1.8 - i * 0.2); }); const n = noise('white', t, 0.1), bp = filt('bandpass', 4000, 1); n.connect(bp); hit(out(bp, { rev: 0.5 }).g, t, g * 0.5, 0.001, 0.05); };
    S.fire = (t, dur, g) => { const n = noise('brown', t, dur), lp = filt('lowpass', 500); n.connect(lp); bed(out(lp, {}).g, t, dur, g, 0.5, 0.5); for (let tt = t; tt < t + dur; tt += 0.02 + rnd() * 0.15) { const c = noise('white', tt, 0.02), bp = filt('bandpass', 1500 + rnd() * 3000, 1); c.connect(bp); hit(out(bp, { pan: (rnd() - 0.5) * 1.4 }).g, tt, g * 0.6 * rnd(), 0.0005, 0.008); } };
    S.creak = (t, dur, g) => { const o = osc('sawtooth', 34, t, dur), bp = filt('bandpass', 500, 3), bp2 = filt('bandpass', 1300, 4), sum = C.createGain(); o.frequency.setValueAtTime(30, t); o.frequency.linearRampToValueAtTime(52, t + dur * 0.5); o.frequency.linearRampToValueAtTime(26, t + dur); o.connect(bp).connect(sum); o.connect(bp2).connect(sum); bp.frequency.linearRampToValueAtTime(800, t + dur); bed(out(sum, { rev: 0.5, hall: 0.4 }).g, t, dur, g, 0.15, 0.3); };
    S.zap = (t, g) => { const o = osc('square', 300, t, 0.3), lp = filt('lowpass', 3000); o.frequency.exponentialRampToValueAtTime(1800, t + 0.16); o.connect(lp); hit(out(lp, { rev: 0.4 }).g, t, g * 0.35, 0.002, 0.18); };
    S.rumble = (t, dur, g, rise) => { const n = noise('brown', t, dur), lp = filt('lowpass', 180); n.connect(lp); const e = out(lp, {}).g; e.setValueAtTime(0.0001, t); if (rise) e.exponentialRampToValueAtTime(g, t + dur); else { e.linearRampToValueAtTime(g, t + 0.5); e.setValueAtTime(g, t + dur - 0.5); } e.linearRampToValueAtTime(0, t + dur + 0.05); };

    // ---------- the cue sheet
    const N = TR.NARR;
    if (only !== 'voice') {
    // cold open: three knocks in the dark
    TR.KNOCKS_OPEN.forEach((k, i) => S.knock(k, 0.55 + i * 0.2, i === 2));
    S.boom(1.6, 0.4, 40); S.rswell(3.0, 1.4, 0.25); S.boom(3.0, 0.35, 50);
    // 1 world
    S.wind(3.0, 7.6, 0.10, 700); S.shimmer(3.4, 6.5, 0.6); S.boom(N[0] + 4.1, 0.35, 60); S.shimmer(N[0] + 4.1, 2.5, 1.0);
    // 2 the Gray
    S.drone(10.4, 7.2, 32.7, 0.9); S.whispers(11.2, 6.0, 0.10, 6); S.wind(10.4, 7.0, 0.16, 350); S.sub(N[1] + 3.9, 0.45); S.inhale(13.0, 1.4, 0.12); S.rswell(17.4, 1.3, 0.22);
    // 3 the five
    S.wind(17.4, 11.2, 0.12, 450); S.drone(17.4, 11.2, 36.7, 0.7);
    for (let t = 18.2; t < 28.2; t += 1.35) S.heart(t, 0.5);
    [2.83, 4.47, 6.1, 7.98].forEach((d) => { S.boom(N[2] + d, 0.28, 70); S.knock(N[2] + d, 0.18, false); });
    // 4 the Core breaks
    S.rumble(28.6, 2.0, 0.5, true); S.drone(28.6, 2.0, 41.2, 1.2); for (let t = 28.7; t < 30.6; t += 0.42 - (t - 28.7) * 0.12) S.heart(t, 0.55);
    for (let i = 0; i < 9; i++) S.crack(TR.SHATTER - 1.7 + hs(i + 74) * 1.2, 0.35);
    S.riser(TR.SHATTER, 1.9, 0.35); S.rswell(TR.SHATTER, 1.0, 0.35);
    S.hit(TR.SHATTER, 1.0); S.glass(TR.SHATTER, 1.0, 70); S.thunder(TR.SHATTER + 0.05, 0.6); S.boom(TR.SHATTER + 0.02, 0.8, 38); S.ring(TR.SHATTER + 0.3, 2.6, 0.035);
    S.wind(31.2, 2.8, 0.12, 400);
    // 5 the shards find them
    TR.HITS.forEach((h, i) => S.whoosh(h - 1.0, 1.05, 0.28, 0.9, (i - 1.5) * 0.5));
    S.hit(TR.HITS[0], 0.55); S.growl(TR.HITS[0] + 0.05, 1.1, 0.35, 1.1);
    S.hit(TR.HITS[1], 0.5); [0, 0.25, 0.5].forEach((d, i) => S.tick(TR.HITS[1] + d, 0.35, i % 2));
    S.hit(TR.HITS[2], 0.5); S.sand(TR.HITS[2], 1.0, 0.25);
    S.hit(TR.HITS[3], 0.5); S.knock(TR.HITS[3] + 0.05, 0.6, true);
    S.drone(34.0, 6.0, 30.9, 0.9); S.whispers(37.6, 2.4, 0.09, 5);
    // 6 THE CRIMSON TYRANT
    S.fire(40.0, 7.4, 0.07); S.rumble(40.0, 7.4, 0.25);
    S.thunder(40.9, 0.75, -0.4); S.thunder(42.05, 0.55, 0.5); S.thunder(N[5] + 2.5, 0.6, 0);
    S.growl(N[5] + 2.55, 2.3, 0.75, 1.0); S.boom(N[5] + 2.55, 0.6, 45); S.clang(N[5] + 3.3, 0.6);
    S.riser(N[5] + 4.25, 1.2, 0.3); S.hit(N[5] + 4.25, 1.0); S.clang(N[5] + 4.25, 0.5); S.thunder(N[5] + 4.27, 0.5, 0);
    // 7 THE STILL HOUR
    { const FRZ = N[6] + 2.8; let k = 0; for (let t = 47.5; t < FRZ; t += 0.5) S.tick(t, 0.22 + 0.25 * (t - 47.5) / (FRZ - 47.5), k++ % 2);
      S.sand(47.4, FRZ - 47.4, 0.06); S.drone(47.4, FRZ - 47.4, 27.5, 0.6);
      S.rswell(FRZ, 0.7, 0.3); S.hit(FRZ, 0.7); S.glass(FRZ, 0.35, 25); S.ring(FRZ + 0.02, 3.5, 0.045); S.sub(FRZ, 0.5);
      S.riser(N[6] + 4.25, 1.0, 0.18); S.hit(N[6] + 4.25, 0.95); S.knock(N[6] + 4.25, 0.8, true); }
    // 8 THE HOURLESS
    { const BR = N[7] + 2.85; S.wind(54.6, 7.4, 0.3, 900); S.sand(54.6, 7.4, 0.12); S.paper(54.6, 7.0, 0.12); S.drone(54.6, 7.4, 34.6, 0.6);
      S.rswell(BR, 0.6, 0.25); S.glass(BR, 0.8, 50); S.boom(BR, 0.6, 50); S.sand(BR, 2.2, 0.45); S.whoosh(BR, 1.4, 0.3, -0.5, 0.8);
      S.riser(N[7] + 4.5, 1.1, 0.2); S.hit(N[7] + 4.5, 0.95); }
    // 9 PALE NIRO
    { TR.KNOCKS_NIRO.forEach((k, i) => S.knock(k, 0.6 + i * 0.15, true)); const FG = N[8] + 2.7;
      S.drone(62.0, 7.2, 41.2, 0.6); S.shimmer(62.3, 3.3, 0.5); S.whispers(63.2, 2.6, 0.06, 4);
      S.rswell(FG, 0.8, 0.3); S.glass(FG, 0.9, 60); S.hit(FG, 0.55); S.ring(FG + 0.05, 2.0, 0.03);
      S.riser(N[8] + 4.0, 0.9, 0.18); S.hit(N[8] + 4.0, 0.95); S.knock(N[8] + 4.0, 0.7, true); }
    // 10 THE GRAY
    { const OP = N[9] + 2.4, SL = N[9] + 3.95;
      for (let k = Math.ceil(69.2 / 1.1); k * 1.1 < 76.4; k++) S.heart(k * 1.1, 0.6);
      S.drone(69.2, 7.4, 27.5, 1.0); S.whispers(69.5, SL - 69.5, 0.12, 8); S.inhale(OP - 1.3, 1.3, 0.2);
      S.creak(OP, 1.4, 0.3); S.sub(OP, 0.5); S.rswell(SL, 1.2, 0.35); S.hit(SL, 1.0); S.boom(SL, 0.6, 36); }
    // 11 Flippo alone
    S.wind(76.6, 6.0, 0.1, 600); S.boom(N[10] + 3.15, 0.22, 70); S.shimmer(N[10] + 3.0, 3.0, 0.9);
    // 12 the spark
    S.shimmer(82.8, 2.2, 1.2); S.whoosh(N[11] + 1.6, 0.6, 0.2, 0, 0); S.boom(N[11] + 2.0, 0.35, 70);
    S.rumble(N[11] + 2.1, 1.0, 0.35, true); S.riser(TR.VOID, 1.1, 0.35); S.rswell(TR.VOID, 1.0, 0.35);
    S.hit(TR.VOID, 1.0); S.glass(TR.VOID, 0.7, 50); S.thunder(TR.VOID + 0.02, 0.45, 0); S.shimmer(TR.VOID, 3.0, 1.4); S.drone(TR.VOID, 3.1, 36.7, 0.6);
    // 13 one by one
    S.hit(TR.IGN[0], 0.5); S.growl(TR.IGN[0], 0.6, 0.3, 1.2);
    S.boom(TR.IGN[1], 0.5, 55); S.tick(TR.IGN[1], 0.5, 0);
    S.boom(TR.IGN[2], 0.5, 55); S.sand(TR.IGN[2], 0.5, 0.25);
    S.boom(TR.IGN[3], 0.5, 55); S.knock(TR.IGN[3], 0.5, true);
    S.creak(TR.GRAYOPEN, 0.7, 0.25); S.inhale(TR.GRAYOPEN - 0.4, 0.5, 0.12); S.drone(89.0, 3.6, 30.9, 0.9);
    S.riser(TR.FLIP, 0.8, 0.2); S.zap(TR.FLIP, 0.8); S.whoosh(TR.FLIP, 0.45, 0.4, 0, 0); S.hit(92.55, 0.8);
    // END
    TR.KNOCKS_END.forEach((k, i) => S.knock(k, 0.6 + i * 0.2, true));
    S.hit(TR.LOGO, 0.95); S.shimmer(TR.LOGO, 5.5, 1.0); S.glass(TR.LOGO, 0.25, 20); S.wind(TR.LOGO, 6.6, 0.07, 800);
    S.boom(TR.SOON, 0.35, 60);
    }

    // ---------- narration
    const vIn = C.createGain(), hp = filt('highpass', 85), ls = filt('lowshelf', 160), pk = filt('peaking', 3000, 0.9), vc = C.createDynamicsCompressor(), vg = C.createGain();
    ls.gain.value = 3; pk.gain.value = 2.5; vc.threshold.value = -22; vc.ratio.value = 3; vc.attack.value = 0.005; vc.release.value = 0.15; vg.gain.value = 2.3;
    vIn.connect(hp).connect(ls).connect(pk).connect(vc).connect(vg).connect(comp);
    const vr = C.createGain(); vr.gain.value = 0.08; vg.connect(vr).connect(rev);
    if (narr) for (let i = 0; i < narr.length; i++) {
      if (!narr[i]) continue;
      const buf = await C.decodeAudioData(narr[i].slice(0));
      const s = C.createBufferSource(); s.buffer = buf; if (only !== 'sfx') s.connect(vIn); s.start(N[i]);
      // duck the effects under the words
      const a = N[i] + 0.15, b = N[i] + TR.SPEECH[i] + 0.15;
      duck.gain.setTargetAtTime(0.3, a - 0.12, 0.05); duck.gain.setTargetAtTime(1, b, 0.12);
    }
    return C.startRendering();
  };
})();
