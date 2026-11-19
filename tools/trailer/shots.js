// FLIPNOVA trailer — the cut. Times are seconds from the start; narration line N starts at NARR[N-1].
(function () {
  'use strict';
  const TR = window.TR;
  const { W, H, cl, seg, sm, eo, ei, expo, lerp, hs, rgba, mixc, pulse, TAU } = TR;
  const g = () => TR.ctx();

  // narration start times (lines 1..14) and their texts (subtitles)
  const NARR = [3.6, 10.8, 17.8, 28.9, 34.3, 40.8, 48.2, 55.4, 62.8, 70.0, 77.0, 82.8, 89.3, 94.6];
  const LINES = [
    'Nova. A world that floats on a single light... the Core.',
    'Then the Gray came. And whatever it touched... faded away.',
    'Five went down to save it. A guard. A teacher. A mapmaker. And two brothers.',
    'But the Core broke.',
    'Its shards found them... and twisted their deepest wishes into something else.',
    'The guard who carried everything alone... became the Crimson Tyrant.',
    'The teacher who wanted nothing to ever fall... stopped time itself.',
    'The mapmaker who begged for one more hour... lost every hour she had.',
    'And a brother who only wanted to protect... forgot who he was.',
    'And deep inside the broken Core... something is still waiting.',
    'Only the smallest one was left. Flippo.',
    "The Core's last spark chose him... Infinity Void.",
    'One by one... he will bring them back.',
    'FLIPNOVA... Coming soon.'
  ];
  const SPEECH = [4.6, 4.59, 9.05, 1.4, 4.25, 4.06, 4.04, 4.33, 3.86, 3.76, 3.69, 4.19, 2.52, 3.1];
  TR.NARR = NARR; TR.LINES = LINES; TR.SPEECH = SPEECH;
  TR.SUBS = NARR.slice(0, 13).map((t0, i) => [t0 + 0.1, t0 + SPEECH[i] + 0.25, LINES[i]]);
  TR.DUR = 101;

  const shot = (a, b, draw, o) => TR.SHOTS.push(Object.assign({ a, b, draw }, o || {}));

  // ======================================================================= REVEAL 1: THE CRIMSON TYRANT  (40.0 - 47.4)
  {
    const A = 40.0, B = 47.4, IGN = NARR[5] + 2.55, SLAM = NARR[5] + 4.25;
    const strikes = [A + 0.9, A + 1.15, A + 2.05, IGN - 0.05, SLAM];
    const bolts = strikes.map((s, i) => TR.bolt(300 + hs(i * 3) * 1300, 60, 200 + hs(i * 5) * 1500, 760, 11 + i * 17, 70, 4));
    strikes.forEach((s, i) => TR.flashes.push([s, '#b8c8ff', i === 4 ? 0.0 : 0.16, 0.08]));
    TR.shakes.push([IGN, 9, 0.25], [SLAM, 26, 0.18], [A + 2.05, 6, 0.15]);
    TR.flashes.push([SLAM, '#ff9050', 0.35, 0.12]);
    TR.TITLES.push({ t0: SLAM, t1: B - 0.05, name: 'THE CRIMSON TYRANT', col: '#ff5a2a', glow: '#ff3a10', y: 860, size: 100 });
    TR.FADES.push([A - 0.01, A + 0.6, 1, 0], [B - 0.35, B, 0, 1]);
    shot(A, B, (lt, t) => {
      const G = g();
      const fl = strikes.reduce((s, x) => s + pulse(t, x, 0.09) * (t < x + 0.6 ? 1 : 0), 0);
      const ig = sm(seg(t, IGN, IGN + 0.9));
      // sky
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, mixc('#050103', '#2a3050', fl * 0.6)], [0.55, mixc('#1a0306', '#3a3a60', fl * 0.4)], [1, mixc('#3a0806', '#ff5a20', ig * 0.35)]]);
      G.fillRect(0, 0, W, H);
      // storm clouds
      TR.fog(TR.tex.fog, '#3a0a0e', 0.75, -t * 30, -t * 8, 3.2);
      TR.fog(TR.tex.fog2, mixc('#140306', '#8a90c0', fl * 0.8), 0.6 + fl * 0.2, t * 22, 40, 2.4);
      bolts.forEach((b, i) => { const k = pulse(t, strikes[i], 0.1); if (t >= strikes[i] && t < strikes[i] + 0.5) TR.drawBolt(b, i === 4 ? '#ff7a40' : '#9fb8ff', k); });
      // lava glow from below
      TR.glow(W / 2, H + 120, 1100, '#ff3a08', 0.25 + 0.5 * ig);
      // camera
      const z = lerp(0.98, 1.1, sm(seg(lt, 0, 7.4))) + pulse(t, SLAM, 0.2) * 0.04;
      // mountains with lava light behind
      TR.mountains(G, 800, 11, '#0a0204', 1.0, ig); TR.mountains(G, 880, 23, '#030001', 0.6, ig);
      G.save(); G.translate(W / 2, 720 + lerp(30, -10, sm(seg(lt, 0, 7.4)))); G.scale(z * 0.66, z * 0.66);
      TR.tyrant(t, { flash: cl(fl * 1.2), ign: ig, t });
      G.restore();
      // embers + ash in front
      TR.embers(t, 140, 3, ['#ff7a2a', '#ffb04a', '#ff4a1a'], { size: 4, a: 0.5 + 0.5 * ig, speed: 1 + ig });
      TR.fog(TR.tex.wisp, '#2a0508', 0.5, t * 60, 300, 2.0);
      TR.glow(W / 2, H, 900, '#ff4a10', 0.15 * ig);
    }, { bloom: 0.6 });
  }


  // ======================================================================= REVEAL 2: THE STILL HOUR  (47.4 - 54.6)
  {
    const A = 47.4, B = 54.6, FRZ = NARR[6] + 2.8, SLAM = NARR[6] + 4.25;
    TR.FADES.push([A, A + 0.5, 1, 0], [B - 0.35, B, 0, 1]);
    TR.flashes.push([FRZ, '#dff0ff', 0.55, 0.12], [SLAM, '#ffe6b0', 0.3, 0.12]);
    TR.shakes.push([FRZ, 10, 0.12], [SLAM, 22, 0.18]);
    TR.TITLES.push({ t0: SLAM, t1: B - 0.05, name: 'THE STILL HOUR', sub: 'COMING SOON', col: '#f0c878', glow: '#d89a40', y: 850, size: 104 });
    const tt = (t) => (t < FRZ ? t : FRZ + (t - FRZ) * 0.015);   // time, frozen
    shot(A, B, (lt, t) => {
      const G = g(), frz = sm(seg(t, FRZ, FRZ + 0.25)), T = tt(t), eye = sm(seg(t, FRZ, FRZ + 0.6));
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#02040a'], [0.6, '#08101e'], [1, '#121a28']]); G.fillRect(0, 0, W, H);
      TR.fog(TR.tex.fog, mixc('#1a2a48', '#3a5070', frz), 0.55, -T * 18, 0, 3);
      // the shot: rain, glass and pages falling ... then hanging still
      const z = lerp(1.0, 1.1, sm(seg(lt, 0, 7.2))) + pulse(t, SLAM, 0.2) * 0.03;
      G.save(); G.translate(W / 2, 760); G.scale(z * 0.86, z * 0.86);
      // the ticking hands: they jump each second, sweep, then stop dead
      const tick = Math.floor(T * 2) / 2 + sm(cl((T * 2 % 1) * 6)) * 0.5;
      TR.stillHour(t, { rot: T * 0.12, hA: tick * 0.5, mA: tick * 2.4, sway: T, eye, frz });
      G.restore();
      G.save(); G.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 220; i++) {
        const sp = 700 + hs(i) * 600, x = hs(i + 3) * W, y = ((hs(i + 7) * H + T * sp) % (H + 200)) - 100, L = 30 + hs(i + 1) * 40;
        G.strokeStyle = rgba(frz > 0 ? '#e8f6ff' : '#9fc4ff', 0.25 + 0.35 * frz); G.lineWidth = 2; G.beginPath(); G.moveTo(x, y); G.lineTo(x - 4, y - L * (1 - frz * 0.7)); G.stroke();
        if (frz > 0 && i % 3 === 0) TR.glow(x, y, 14, '#bfe4ff', 0.25 * frz);
      }
      G.restore();
      for (let i = 0; i < 16; i++) {   // glass shards and loose pages
        const sp = 260 + hs(i + 40) * 260, x = 120 + hs(i + 41) * (W - 240), y = ((hs(i + 42) * H + T * sp) % (H + 300)) - 150, r = T * (1 + hs(i) * 3) + i;
        G.save(); G.translate(x, y); G.rotate(r);
        if (i % 3) { G.fillStyle = rgba('#cfe8ff', 0.35); G.beginPath(); G.moveTo(0, -18); G.lineTo(12, 10); G.lineTo(-10, 14); G.closePath(); G.fill(); G.strokeStyle = 'rgba(255,255,255,0.7)'; G.lineWidth = 1.5; G.stroke(); }
        else { G.fillStyle = 'rgba(200,192,170,0.7)'; G.fillRect(-15, -20, 30, 40); G.fillStyle = 'rgba(60,50,40,0.5)'; for (let k = 0; k < 5; k++) G.fillRect(-11, -14 + k * 7, 22 - (k % 2) * 6, 1.5); }
        G.restore();
      }
      // the moment time stops: a ring of still air
      const rk = seg(t, FRZ, FRZ + 1.0);
      if (rk > 0 && rk < 1) { G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#dff0ff', 0.6 * (1 - rk)); G.lineWidth = 30 * (1 - rk) + 2; G.shadowColor = '#bfe4ff'; G.shadowBlur = 30; G.beginPath(); G.arc(W / 2, 520, 80 + rk * 1400, 0, TAU); G.stroke(); G.restore(); }
      if (frz > 0) { G.save(); G.globalCompositeOperation = 'color'; G.fillStyle = rgba('#7a9ac0', 0.35 * frz); G.fillRect(0, 0, W, H); G.restore(); }
      TR.fog(TR.tex.wisp, '#4a6080', 0.12, -T * 40, 400, 1.6);
    }, { bloom: 0.55 });
  }

  // ======================================================================= REVEAL 3: THE HOURLESS  (54.6 - 62.0)
  {
    const A = 54.6, B = 62.0, BURST = NARR[7] + 2.85, SLAM = NARR[7] + 4.5;
    TR.FADES.push([A, A + 0.5, 1, 0], [B - 0.35, B, 0, 1]);
    TR.flashes.push([BURST, '#ffd890', 0.35, 0.1], [SLAM, '#ffcf7a', 0.25, 0.12]);
    TR.shakes.push([BURST, 12, 0.2], [SLAM, 22, 0.18]);
    TR.TITLES.push({ t0: SLAM, t1: B - 0.05, name: 'THE HOURLESS', sub: 'COMING SOON', col: '#e8b868', glow: '#b07020', y: 850, size: 108 });
    const pages = [];
    for (let i = 0; i < 9; i++) pages.push({ y: 160 + hs(i + 60) * 760, sp: 500 + hs(i + 61) * 700, ph: hs(i + 62), sz: 22 + hs(i + 63) * 34 });
    shot(A, B, (lt, t) => {
      const G = g(), br = eo(seg(t, BURST, BURST + 1.4)), eye = sm(seg(t, BURST - 0.3, BURST + 0.4));
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#05090a'], [0.5, '#141410'], [1, '#2e2010']]); G.fillRect(0, 0, W, H);
      // a pale moon behind the storm
      TR.glow(1500, 300, 500, '#e8d0a0', 0.25); TR.disc(1500, 300, 110, 'rgba(230,214,180,0.55)');
      TR.fog(TR.tex.fog, '#5a4428', 0.7, -t * 160, 0, 2.6);
      TR.fog(TR.tex.fog2, '#3a2c18', 0.6, -t * 260, 200, 2.0);
      const z = lerp(1.0, 1.1, sm(seg(lt, 0, 7.4))) + pulse(t, SLAM, 0.2) * 0.03;
      G.save(); G.translate(W / 2, 760); G.scale(z * 0.8, z * 0.8);
      TR.hourless(t, { burst: br, eye, wind: t, t, needle: Math.sin(t * 1.3) * 0.4 + (t > BURST ? (t - BURST) * (t - BURST) * 14 : 0) });
      G.restore();
      // torn map pages and sand on the wind
      pages.forEach((p, i) => {
        const x = ((p.ph * (W + 400) + t * p.sp) % (W + 400)) - 200, y = p.y + Math.sin(t * 2 + i) * 40;
        G.save(); G.translate(x, y); G.rotate(t * (1 + p.ph * 3) + i); G.scale(1, Math.cos(t * 3 + i));
        G.fillStyle = '#c8a870'; G.fillRect(-p.sz / 2, -p.sz * 0.65, p.sz, p.sz * 1.3);
        G.strokeStyle = 'rgba(120,40,30,0.7)'; G.lineWidth = 2; G.setLineDash([4, 4]); G.beginPath(); G.moveTo(-p.sz * 0.4, p.sz * 0.4); G.quadraticCurveTo(0, -p.sz * 0.2, p.sz * 0.4, -p.sz * 0.4); G.stroke(); G.setLineDash([]);
        G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = 'rgba(255,120,40,0.7)'; G.lineWidth = 3; G.beginPath(); G.moveTo(-p.sz / 2, p.sz * 0.65); G.lineTo(p.sz / 2, p.sz * 0.65); G.stroke(); G.restore();
        G.restore();
      });
      TR.embers(t, 260, 21, ['#e8c890', '#c8a060'], { vx: 1, vy: 0.15, speed: 6, size: 2.5, a: 0.5 });
      TR.fog(TR.tex.wisp, '#6a5030', 0.4, -t * 420, 500, 1.5);
    }, { bloom: 0.5 });
  }

  // ======================================================================= REVEAL 4: PALE NIRO  (62.0 - 69.2)
  {
    const A = 62.0, B = 69.2, FORGET = NARR[8] + 2.7, SLAM = NARR[8] + 4.0, KN = [A + 0.25, A + 0.6, A + 1.1];
    TR.KNOCKS_NIRO = KN;
    TR.FADES.push([A, A + 0.3, 1, 0], [B - 0.35, B, 0, 1]);
    TR.flashes.push([FORGET, '#ffffff', 0.5, 0.1], [SLAM, '#bfe8ff', 0.3, 0.12]);
    TR.shakes.push([KN[2], 8, 0.12], [FORGET, 14, 0.2], [SLAM, 22, 0.18]);
    TR.TITLES.push({ t0: SLAM, t1: B - 0.05, name: 'PALE NIRO', col: '#cfeaff', glow: '#5ab8ff', y: 850, size: 116 });
    // a warm memory, broken into mirror shards
    let mem = null;
    const memory = () => {
      if (mem) return mem;
      mem = TR.mk(900, 520); const x = mem.getContext('2d');
      let gr = x.createLinearGradient(0, 0, 0, 520); gr.addColorStop(0, '#ff9a5a'); gr.addColorStop(0.55, '#ffc890'); gr.addColorStop(1, '#ff7a6a'); x.fillStyle = gr; x.fillRect(0, 0, 900, 520);
      x.fillStyle = '#fff2c8'; x.beginPath(); x.arc(620, 300, 90, 0, TAU); x.fill();
      x.fillStyle = '#5a8a4a'; x.beginPath(); x.moveTo(0, 380); x.quadraticCurveTo(450, 300, 900, 390); x.lineTo(900, 520); x.lineTo(0, 520); x.fill();
      const cube = (cx, cy, s, body, band) => { x.fillStyle = '#2a1a10'; x.fillRect(cx - s / 2 - 4, cy - s - 4, s + 8, s + 8); x.fillStyle = body; x.fillRect(cx - s / 2, cy - s, s, s); x.fillStyle = '#fff'; x.fillRect(cx - s * 0.3, cy - s * 0.7, s * 0.18, s * 0.26); x.fillRect(cx + s * 0.12, cy - s * 0.7, s * 0.18, s * 0.26); x.fillStyle = '#2a1a10'; x.fillRect(cx - s * 0.18, cy - s * 0.32, s * 0.36, s * 0.07); if (band) { x.fillStyle = band; x.fillRect(cx - s / 2, cy - s * 0.9, s, s * 0.12); } };
      cube(380, 372, 120, '#e8b890', '#2a9a8a'); cube(500, 380, 80, '#ff5a3c');
      return mem;
    };
    const shards = [];
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU + hs(i) * 0.4, r = 620 + hs(i + 1) * 220; shards.push({ x: W / 2 + Math.cos(a) * r * 1.25, y: 480 + Math.sin(a) * r * 0.62, s: 60 + hs(i + 2) * 60, rot: hs(i + 3) * TAU, ox: hs(i + 4) * 600, oy: hs(i + 5) * 300, n: 3 + (i % 3) }); }
    shot(A, B, (lt, t) => {
      const G = g(), wk = sm(seg(t, FORGET, FORGET + 0.35)), kn = KN.reduce((s2, k) => s2 + pulse(t, k, 0.12), 0), dis = seg(t, FORGET, B);
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#020308'], [1, '#0a1220']]); G.fillRect(0, 0, W, H);
      TR.fog(TR.tex.fog, '#14243a', 0.6, t * 20, 0, 3);
      // mirror shards with the memory in them
      const m = memory();
      shards.forEach((sd, i) => {
        const gone = seg(t, FORGET + hs(i) * 0.3, FORGET + 1.6), drift = t - A;
        const x = sd.x + Math.sin(drift * 0.5 + i) * 20 + (sd.x - W / 2) * gone * 0.4, y = sd.y + Math.cos(drift * 0.4 + i) * 16 + gone * gone * 500;
        G.save(); G.translate(x, y); G.rotate(sd.rot + drift * 0.05 + gone * 2);
        const p = new Path2D(); for (let k = 0; k < sd.n; k++) { const a = k / sd.n * TAU + hs(i + k) * 0.7, r = sd.s * (0.6 + hs(i * 3 + k) * 0.5); k ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath();
        G.save(); G.clip(p); G.globalAlpha = (1 - gone) * 0.6; G.filter = gone > 0 ? 'grayscale(' + gone.toFixed(2) + ') brightness(' + (1 - gone * 0.6).toFixed(2) + ')' : 'none';
        G.drawImage(m, -sd.ox, -sd.oy, 900, 520); G.filter = 'none'; G.restore();
        G.strokeStyle = rgba('#ffffff', 0.7 * (1 - gone)); G.lineWidth = 3; G.stroke(p);
        if (gone > 0 && gone < 0.5) { G.strokeStyle = rgba('#ffffff', 0.8); G.lineWidth = 2; G.beginPath(); G.moveTo(-sd.s * 0.5, -sd.s * 0.2); G.lineTo(sd.s * 0.1, sd.s * 0.1); G.lineTo(sd.s * 0.4, -sd.s * 0.3); G.stroke(); }
        G.restore();
      });
      const z = lerp(1.0, 1.12, sm(seg(lt, 0, 7.2))) + pulse(t, SLAM, 0.2) * 0.03;
      G.save(); G.translate(W / 2, 760); G.scale(z * 0.7, z * 0.7);
      TR.paleNiro(t, { wake: wk, knock: cl(kn), dis, t });
      G.restore();
      TR.fog(TR.tex.wisp, '#2a3a5a', 0.3, t * 30, 500, 1.8);
    }, { bloom: 0.6 });
  }

  // ======================================================================= REVEAL 5: THE GRAY  (69.2 - 76.6)
  {
    const A = 69.2, B = 76.6, OPEN = NARR[9] + 2.4, SLAM = NARR[9] + 3.95;
    TR.FADES.push([A, A + 0.8, 1, 0], [B - 0.5, B, 0, 1]);
    TR.shakes.push([OPEN, 6, 0.5], [SLAM, 26, 0.22]);
    TR.flashes.push([SLAM, '#d8dce0', 0.25, 0.14]);
    TR.TITLES.push({ t0: SLAM, t1: B - 0.1, name: 'THE GRAY', sub: 'COMING SOON', col: '#d8dce2', glow: '#8a9098', subCol: '#c8ccd2', y: 880, size: 120 });
    const small = [];
    for (let i = 0; i < 9; i++) small.push({ x: 160 + hs(i + 80) * 1600, y: 180 + hs(i + 81) * 620, s: 70 + hs(i + 82) * 90, t0: OPEN + 0.5 + hs(i + 83) * 1.6 });
    const crystals = [];
    for (let i = 0; i < 14; i++) { const left = i % 2 === 0, base = left ? -40 : W + 40, y = 60 + (i >> 1) * 150; crystals.push({ base, y, len: 300 + hs(i + 90) * 420, w: 70 + hs(i + 91) * 90, ang: (left ? 0 : Math.PI) + (hs(i + 92) - 0.5) * 0.9 }); }
    shot(A, B, (lt, t) => {
      const G = g(), op = sm(seg(t, OPEN, OPEN + 1.3)), beat = pulse(t % 1.1 + Math.floor(t / 1.1) * 1.1, Math.floor(t / 1.1) * 1.1, 0.25);
      G.fillStyle = '#020203'; G.fillRect(0, 0, W, H);
      TR.glow(W / 2, 520, 900, '#5a6068', 0.18 + 0.08 * beat + 0.15 * op);
      TR.fog(TR.tex.fog, '#3a3e44', 0.55, Math.sin(t * 0.3) * 200, t * 12, 2.8);
      // dead crystal walls of the broken Core
      crystals.forEach((c) => {
        G.save(); G.translate(c.base, c.y); G.rotate(c.ang);
        const p = TR.poly([[0, -c.w / 2], [c.len * 0.8, -c.w * 0.3], [c.len, 0], [c.len * 0.8, c.w * 0.3], [0, c.w / 2]]);
        G.fillStyle = TR.lin(0, 0, c.len, 0, [[0, '#0a0b0e'], [1, '#22262c']]); G.fill(p);
        G.strokeStyle = 'rgba(160,190,200,0.25)'; G.lineWidth = 3; G.stroke(p);
        G.restore();
      });
      const z = lerp(1.0, 1.08, sm(seg(lt, 0, 7.4))) + pulse(t, SLAM, 0.25) * 0.05;
      G.save(); G.translate(W / 2, 520); G.scale(z, z); G.translate(-W / 2, -520);
      small.forEach((e, i) => TR.grayEye(e.x, e.y, e.s, e.s * 0.32, sm(seg(t, e.t0, e.t0 + 0.4)) * (0.85 + 0.15 * Math.sin(t * 3 + i)), [Math.sin(t + i) * 0.3, 0.1], 0.8, t, false, i + 10));
      const dil = lerp(1.35, 0.55, eo(seg(t, SLAM - 0.1, SLAM + 0.3)));
      TR.grayEye(W / 2, 520, 980, 330, op, [Math.sin(t * 0.7) * 0.15 * (1 - seg(t, SLAM - 0.3, SLAM)), 0.05], dil, t, true, 3);
      G.restore();
      G.fillStyle = TR.rad(W / 2, 520, 300, 1150, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.85)']]); G.fillRect(0, 0, W, H);
      TR.fog(TR.tex.wisp, '#4a4e54', 0.35, -t * 25, 300, 1.8);
      TR.embers(t, 90, 31, ['#9aa0a8', '#c8ccd2'], { vy: -0.3, size: 2.5, a: 0.4 });
    }, { bloom: 0.45 });
  }

  // ======================================================================= COLD OPEN: three knocks in the dark (0 - 3.0)
  {
    const K = [0.6, 1.0, 1.6]; TR.KNOCKS_OPEN = K;
    shot(0, 3.0, (lt, t) => {
      const G = g();
      G.fillStyle = '#000'; G.fillRect(0, 0, W, H);
      K.forEach((k, i) => TR.glow(W / 2, 500, 240 + i * 160, '#ffd27a', 0.18 * (i + 1) * TR.pulse(t, k, 0.22)));
      const grow = sm(seg(t, 1.6, 3.0));
      TR.glow(W / 2, 500, 60 + 900 * grow, '#ffd27a', 0.5 * grow); TR.glow(W / 2, 500, 30 + 200 * grow, '#ffffff', 0.7 * grow);
      TR.disc(W / 2, 500, 3 + 30 * grow, rgba('#ffffff', grow));
    });
  }

  // ======================================================================= 1. NOVA (3.0 - 10.4)
  {
    const A = 3.0, B = 10.4, CORE_WORD = NARR[0] + 4.1;
    TR.FADES.push([A, A + 1.2, 1, 0]);
    shot(A, B, (lt, t) => {
      const k = eo(seg(lt, 0, 5.5)), z = lerp(2.4, 1.0, k) + 0.04 * seg(lt, 5.5, 7.4);
      const pw = 1 + 0.7 * TR.pulse(t, CORE_WORD, 0.6);
      TR.world(t, { cam: { x: 0, y: lerp(0, 40, k), z }, power: pw });
      const rk = seg(t, CORE_WORD, CORE_WORD + 1.6);
      if (rk > 0 && rk < 1) { const G = g(); G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffe6b0', 0.5 * (1 - rk)); G.lineWidth = 12 * (1 - rk) + 1; G.shadowColor = '#ffd27a'; G.shadowBlur = 24; G.beginPath(); G.arc(W / 2, 500 - lerp(0, 40, k) * z + 40, 120 + rk * 1100, 0, TAU); G.stroke(); G.restore(); }
    }, { bloom: 0.5 });
  }

  // ======================================================================= 2. THE GRAY COMES (10.4 - 17.4)
  {
    const A = 10.4, B = 17.4;
    TR.FADES.push([B - 0.4, B, 0, 1]);
    shot(A, B, (lt, t) => {
      const G = g(), front = lerp(-500, 1450, sm(seg(lt, 0.6, 6.8))), cg = sm(seg(lt, 3.5, 7.0)) * 0.45;
      const cam = { x: lerp(-160, 120, sm(seg(lt, 0, 7))), y: 30, z: 1.12 };
      TR.world(t, { cam, power: 1 - cg * 0.6, coreGray: cg });
      const bx = (y) => front + 90 * Math.sin(y * 0.008 + t * 0.9) + 60 * Math.sin(y * 0.021 - t * 1.3) + 40 * Math.sin(y * 0.05 + t * 2);
      const mask = new Path2D(); mask.moveTo(-50, -50); for (let y = -50; y <= H + 50; y += 20) mask.lineTo(bx(y), y); mask.lineTo(-50, H + 50); mask.closePath();
      G.save(); G.clip(mask); G.setTransform(1, 0, 0, 1, 0, 0); G.filter = 'grayscale(1) brightness(0.5) contrast(0.85)'; G.drawImage(G.canvas, 0, 0); G.filter = 'none'; G.restore();
      G.save(); G.clip(mask); TR.fog(TR.tex.fog, '#5a5e64', 0.55, -t * 50, t * 10, 2.6); TR.fog(TR.tex.wisp, '#2a2c30', 0.6, -t * 80, 100, 1.8); G.restore();
      // the creeping edge: dark fingers reaching ahead
      G.save(); G.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        const y = 60 + i * 85 + Math.sin(t + i) * 20, x0 = bx(y), L = 120 + hs(i + 50) * 260 + Math.sin(t * 1.5 + i) * 60;
        G.strokeStyle = 'rgba(40,42,48,0.75)'; G.lineWidth = 26 - (i % 4) * 4; G.filter = 'blur(6px)';
        G.beginPath(); G.moveTo(x0 - 40, y); G.bezierCurveTo(x0 + L * 0.3, y - 30, x0 + L * 0.6, y + 30, x0 + L, y + Math.sin(t * 2 + i) * 20); G.stroke();
      }
      G.filter = 'none'; G.restore();
      const edge = new Path2D(); for (let y = -50; y <= H + 50; y += 20) (y === -50 ? edge.moveTo(bx(y), y) : edge.lineTo(bx(y), y));
      G.save(); G.strokeStyle = 'rgba(150,154,160,0.25)'; G.lineWidth = 60; G.filter = 'blur(20px)'; G.stroke(edge); G.restore();
    }, { bloom: 0.45 });
  }

  // ======================================================================= 3. THE FIVE (17.4 - 28.6)
  {
    const A = 17.4, B = 28.6, CX = 1500, CY = 400;
    const NAMED = [[NARR[2] + 2.83, ['guard'], 'THE GUARD'], [NARR[2] + 4.47, ['teacher'], 'THE TEACHER'], [NARR[2] + 6.1, ['map'], 'THE MAPMAKER'], [NARR[2] + 7.98, ['niro', 'flippo'], 'TWO BROTHERS']];
    const FIVE = { guard: [470, 300], teacher: [660, 330], map: [840, 270], niro: [990, 150], flippo: [1085, 0] };
    TR.FADES.push([A, A + 0.8, 1, 0], [B - 0.3, B, 0, 1]);
    shot(A, B, (lt, t) => {
      const G = g();
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#06060c'], [0.5, '#16141f'], [1, '#22202a']]); G.fillRect(0, 0, W, H);
      const z = lerp(1.0, 1.14, sm(seg(lt, 0, 11.2))), px = lerp(-120, 140, sm(seg(lt, 0, 11.2)));
      G.save(); G.translate(W / 2, H / 2); G.scale(z, z); G.translate(-W / 2 - px, -H / 2);
      TR.fog(TR.tex.fog, '#3a3646', 0.5, t * 12, 0, 3);
      TR.core(CX, CY, 70, t, { power: 0.8 + 0.1 * Math.sin(t * 7) * Math.sin(t * 3), gray: 0.25 });
      TR.fog(TR.tex.fog2, '#4a4a54', 0.45, -t * 30, 200, 2.4);
      // the ledge
      const ledge = TR.poly([[-200, 820], [300, 812], [700, 818], [1000, 808], [1230, 820], [1300, 880], [1250, 1100], [-200, 1100]]);
      TR.lit(ledge, '#0a0a0e', [{ col: '#ffd890', a: 0.6, ang: -0.6, w: 4, blur: 6 }], [-200, 800, 1300, 1100]);
      const hlOf = (k) => { let v = 0; NAMED.forEach((n) => { if (n[1].includes(k)) v = Math.max(v, sm(seg(t, n[0] - 0.1, n[0] + 0.3)) * (1 - 0.65 * seg(t, n[0] + 1.6, n[0] + 2.4))); }); return v; };
      ['guard', 'teacher', 'map', 'niro'].forEach((k) => { const f = FIVE[k], hl = hlOf(k); if (hl > 0) TR.glow(f[0], 816 - f[1] * 0.5, f[1] * 1.1, '#ffd890', 0.25 * hl); TR.figure(k, f[0], 818, f[1], { col: '#ffd890', a: 0.75 + 0.25 * hl, ang: -0.35, hl: hl * 0.6, t }); });
      const fh = hlOf('flippo'); if (fh > 0) TR.glow(FIVE.flippo[0], 780, 120, '#ffd890', 0.3 * fh);
      TR.cube(FIVE.flippo[0], 818, 62, { t, look: [0.7, -0.4], rim: { col: '#ffd890', a: 0.7 + 0.3 * fh, ang: -0.4 } });
      // names, under them
      NAMED.forEach((n) => {
        const a = sm(seg(t, n[0], n[0] + 0.35)) * (1 - seg(t, n[0] + 1.5, n[0] + 1.9)); if (a <= 0) return;
        const xs = n[1].map((k) => FIVE[k][0]), x = (Math.min(...xs) + Math.max(...xs)) / 2;
        G.save(); G.globalAlpha = a; G.font = TR.font(700, 30); G.fillStyle = '#f2e2c0'; G.shadowColor = '#ffb050'; G.shadowBlur = 14; TR.spaced(G, n[2], x, 880, 10); G.restore();
      });
      G.restore();
      TR.embers(t, 120, 41, ['#8a8a96', '#b0aab8'], { vx: 1, vy: 0.1, speed: 2.5, size: 2.5, a: 0.4 });
      TR.fog(TR.tex.wisp, '#2a2834', 0.45, -t * 50, 600, 1.6);
    }, { bloom: 0.5 });
  }

  // ======================================================================= 4. THE CORE BREAKS (28.6 - 34.0)
  {
    const A = 28.6, B = 34.0, SHT = 30.6;
    TR.SHATTER = SHT;
    TR.flashes.push([SHT, '#ffffff', 1.0, 0.18]);
    TR.shakes.push([SHT, 46, 0.35], [SHT + 0.9, 10, 0.3]);
    TR.FADES.push([A, A + 0.25, 1, 0], [B - 0.4, B, 0, 1]);
    const cracks = [];
    for (let i = 0; i < 9; i++) { let a = i / 9 * TAU + hs(i + 70) * 0.5, r = 40 + hs(i + 71) * 60; const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; for (let j = 0; j < 9; j++) { a += (hs(i * 9 + j + 72) - 0.5) * 0.5; r += 28 + hs(i + j + 73) * 20; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } cracks.push({ pts, t0: SHT - 1.7 + hs(i + 74) * 1.2 }); }
    const frags = [];
    const RR = [0, 90, 190, 300];
    for (let ri = 0; ri < 3; ri++) { const n = 5 + ri * 5; for (let j = 0; j < n; j++) { const a0 = j / n * TAU + hs(ri * 20 + j) * 0.2, a1 = (j + 1) / n * TAU + hs(ri * 20 + j + 1) * 0.2, r0 = RR[ri], r1 = RR[ri + 1]; const pts = [[Math.cos(a0) * r0, Math.sin(a0) * r0], [Math.cos(a0) * r1, Math.sin(a0) * r1], [Math.cos((a0 + a1) / 2) * (r1 + 10), Math.sin((a0 + a1) / 2) * (r1 + 10)], [Math.cos(a1) * r1, Math.sin(a1) * r1], [Math.cos(a1) * r0, Math.sin(a1) * r0]]; const cx = pts.reduce((s2, p) => s2 + p[0], 0) / 5, cy = pts.reduce((s2, p) => s2 + p[1], 0) / 5; frags.push({ pts: pts.map((p) => [p[0] - cx, p[1] - cy]), cx, cy, sp: 300 + hs(ri * 30 + j) * 900, rot: (hs(ri * 40 + j) - 0.5) * 6 }); } }
    shot(A, B, (lt, t) => {
      const G = g(), pre = seg(t, A, SHT), post = t - SHT, cx = W / 2, cy = 520;
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#05040a'], [1, '#14101a']]); G.fillRect(0, 0, W, H);
      if (post < 0) {
        const sh = pre * pre * 14; const ox = Math.sin(t * 61) * sh, oy = Math.cos(t * 53) * sh;
        TR.fog(TR.tex.fog, '#3a3a42', 0.5, t * 30, 0, 2.6);
        TR.core(cx + ox, cy + oy, 300, t, { power: 1 + 0.25 * pre + 0.2 * Math.sin(t * 40) * pre, gray: 0.2 });
        // the Gray closing in around it
        G.save(); G.globalAlpha = 0.7 * pre; G.fillStyle = TR.rad(cx, cy, 340, 900, [[0, 'rgba(20,20,24,0)'], [0.4, 'rgba(20,20,24,0.8)'], [1, 'rgba(8,8,10,1)']]); G.fillRect(0, 0, W, H); G.restore();
        G.save(); G.translate(cx + ox, cy + oy); G.globalCompositeOperation = 'lighter'; G.lineJoin = 'round';
        cracks.forEach((c) => {
          const k = seg(t, c.t0, c.t0 + 0.5); if (k <= 0) return; const n = Math.max(2, Math.ceil(c.pts.length * k)), pth = new Path2D();
          for (let j = 0; j < n; j++) (j ? pth.lineTo(c.pts[j][0], c.pts[j][1]) : pth.moveTo(c.pts[j][0], c.pts[j][1]));
          G.globalCompositeOperation = 'source-over'; G.shadowBlur = 0; G.strokeStyle = 'rgba(40,16,6,0.9)'; G.lineWidth = 11; G.stroke(pth);
          G.globalCompositeOperation = 'lighter'; G.shadowColor = '#ffffff'; G.shadowBlur = 20; G.strokeStyle = 'rgba(255,255,255,0.95)'; G.lineWidth = 3; G.stroke(pth);
          const e = c.pts[n - 1], a = Math.atan2(e[1], e[0]), L = 500 + 600 * k;
          G.shadowBlur = 0; G.fillStyle = TR.lin(e[0], e[1], e[0] + Math.cos(a) * L, e[1] + Math.sin(a) * L, [[0, 'rgba(255,240,200,0.55)'], [1, 'rgba(255,240,200,0)']]);
          G.beginPath(); G.moveTo(e[0], e[1]); G.lineTo(e[0] + Math.cos(a - 0.05) * L, e[1] + Math.sin(a - 0.05) * L); G.lineTo(e[0] + Math.cos(a + 0.05) * L, e[1] + Math.sin(a + 0.05) * L); G.closePath(); G.fill();
        });
        G.restore();
      } else {
        const k = post;
        TR.glow(cx, cy, 1400 * Math.exp(-k * 0.8), '#ffe0a0', 0.8 * Math.exp(-k * 1.2));
        // shockwave
        G.save(); G.globalCompositeOperation = 'lighter'; [0, 0.15].forEach((d, i) => { const r = (k - d) * 1800; if (r > 0) { G.strokeStyle = rgba(i ? '#7fe8ff' : '#ffffff', 0.7 * Math.exp(-(k - d) * 1.6)); G.lineWidth = 40 * Math.exp(-(k - d) * 1.5) + 2; G.shadowColor = '#ffd27a'; G.shadowBlur = 40; G.beginPath(); G.arc(cx, cy, r, 0, TAU); G.stroke(); } }); G.restore();
        frags.forEach((f, i) => {
          const d = f.sp * (1 - Math.exp(-k * 1.4)) / 1.4, ang = Math.atan2(f.cy, f.cx) || hs(i) * TAU, x = cx + f.cx + Math.cos(ang) * d, y = cy + f.cy + Math.sin(ang) * d + k * k * 30;
          G.save(); G.translate(x, y); G.rotate(f.rot * k); const p = TR.poly(f.pts);
          const heat = Math.exp(-k * 0.9);
          G.fillStyle = TR.lin(-60, -60, 60, 60, [[0, mixc('#2a2630', '#ffd890', heat * 0.75)], [1, mixc('#0c0a10', '#b05a20', heat * 0.75)]]); G.fill(p);
          G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffe6b0', 0.9 * heat + 0.15); G.lineWidth = 3; G.shadowColor = '#ffd27a'; G.shadowBlur = 16; G.stroke(p);
          G.restore();
          if (heat > 0.2) TR.glow(x, y, 60, '#ffd27a', 0.25 * heat);
        });
        TR.embers(t, 160, 51, ['#ffe6b0', '#ffb050', '#ffffff'], { vy: 0.2, speed: 3, size: 3, a: Math.exp(-k * 0.6) });
        TR.fog(TR.tex.fog, '#2a2a30', 0.6 * seg(k, 0.5, 3), -t * 40, 0, 2.4);
      }
    }, { bloom: 0.7 });
  }

  // ======================================================================= 5. THE SHARDS FIND THEM (34.0 - 40.0)
  {
    const A = 34.0, B = 40.0;
    const WHO = [['guard', 'tyrant', 380, 300, '#ff3a20'], ['teacher', 'still', 780, 320, '#ffd27a'], ['map', 'hourless', 1180, 270, '#ffb050'], ['niro', 'niro', 1560, 170, '#cfeaff']];
    const HIT = [35.55, 36.15, 36.8, 37.45];
    HIT.forEach((h, i) => { TR.shakes.push([h, 12 + i * 2, 0.15]); TR.flashes.push([h, WHO[i][4], 0.18, 0.08]); });
    TR.HITS = HIT;
    TR.FADES.push([A, A + 0.6, 1, 0], [B - 0.35, B, 0, 1]);
    shot(A, B, (lt, t) => {
      const G = g();
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#06060c'], [0.6, '#16121e'], [1, '#221c28']]); G.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) { G.fillStyle = rgba('#ffffff', 0.15 + 0.4 * hs(i + 300)); G.fillRect(hs(i + 301) * W, hs(i + 302) * 600, 2, 2); }
      TR.glow(1900, -100, 900, '#ffd27a', 0.18);
      TR.fog(TR.tex.fog, '#2a2632', 0.5, t * 15, 0, 3);
      const z = lerp(1.0, 1.06, seg(lt, 0, 6));
      G.save(); G.translate(W / 2, H / 2); G.scale(z, z); G.translate(-W / 2, -H / 2);
      const ground = TR.poly([[-100, 870], [400, 862], [900, 870], [1400, 858], [2000, 868], [2000, 1100], [-100, 1100]]);
      TR.lit(ground, '#08070a', [{ col: '#8a8296', a: 0.4, ang: -Math.PI / 2, w: 3 }], [-100, 800, 2000, 1100]);
      WHO.forEach((w, i) => {
        const k = sm(seg(t, HIT[i], HIT[i] + 0.7)), x = w[2], y = 866;
        if (k < 1) { G.save(); G.globalAlpha = 1 - k; TR.figure(w[0], x, y, w[3], { col: '#d8cce8', a: 0.85, ang: -Math.PI / 2 + 0.6, t }); G.restore(); }
        if (k > 0) { G.save(); G.globalAlpha = k; const jit = (1 - k) * 14 * Math.sin(t * 90); TR.bossSil(w[1], x + jit, y, w[3] * lerp(1.0, 1.45, k), { col: w[4], eye: k, t }); G.restore(); }
        const b = TR.pulse(t, HIT[i], 0.25); if (b > 0) { TR.glow(x, y - w[3] * 0.6, 500 * b, w[4], 0.8 * b); TR.glow(x, y - w[3] * 0.6, 120, '#ffffff', b); }
        // the comet
        const L0 = HIT[i] - 1.0, u = seg(t, L0, HIT[i]);
        if (u > 0 && u < 1) {
          const P = (q) => { const sx = 1950 - i * 60, sy = -80, mx = (sx + x) / 2 + 200, my = 120; const a = 1 - q; return [a * a * sx + 2 * a * q * mx + q * q * x, a * a * sy + 2 * a * q * my + q * q * (y - w[3] * 0.6)]; };
          for (let j = 14; j >= 0; j--) { const q = Math.max(0, ei(u) - j * 0.025), p = P(q); TR.glow(p[0], p[1], 50 - j * 2.5, w[4], 0.5 * (1 - j / 15)); }
          const p = P(ei(u)); TR.glow(p[0], p[1], 120, w[4], 0.9); TR.disc(p[0], p[1], 8, '#ffffff');
        }
      });
      // Flippo, small, in the dark foreground: not chosen
      TR.cube(150, 940, 64, { t, look: [0.9, -0.5], rim: { col: '#d8cce8', a: 0.5, ang: -0.6 } });
      G.restore();
      TR.fog(TR.tex.wisp, '#1a1820', 0.5, -t * 40, 600, 1.6);
    }, { bloom: 0.6 });
  }

  // ======================================================================= 6. ONLY THE SMALLEST (76.6 - 82.6)
  {
    const A = 76.6, B = 82.6, NAME = NARR[10] + 3.15;
    TR.FADES.push([A, A + 0.9, 1, 0]);
    shot(A, B, (lt, t) => {
      const G = g(), lightK = sm(seg(t, NAME - 0.2, NAME + 0.6));
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#08080a'], [0.6, '#16161a'], [1, '#202024']]); G.fillRect(0, 0, W, H);
      const z = lerp(1.0, 1.35, sm(seg(lt, 0, 6))), fx = W / 2, fy = 830;
      G.save(); G.translate(fx, fy - 120); G.scale(z, z); G.translate(-fx, -(fy - 120));
      // the dead Core, far away
      TR.glow(960, 300, 380, '#8a8e94', 0.15);
      const dc = new Path2D(); dc.arc(960, 300, 130, 0, TAU); G.fillStyle = TR.rad(920, 260, 10, 140, [[0, '#5a5c62'], [1, '#1a1b1e']]); G.fill(dc);
      G.strokeStyle = 'rgba(0,0,0,0.7)'; G.lineWidth = 4; G.beginPath(); G.moveTo(900, 190); G.lineTo(950, 280); G.lineTo(920, 360); G.moveTo(950, 280); G.lineTo(1040, 300); G.lineTo(1060, 380); G.stroke();
      TR.fog(TR.tex.fog, '#3a3a40', 0.6, -t * 10, 0, 3);
      // broken floating rocks
      for (let i = 0; i < 9; i++) { const x = 100 + i * 220 + Math.sin(i * 3) * 60, y = 420 + hs(i + 400) * 300 + Math.sin(t * 0.6 + i) * 10, s = 40 + hs(i + 401) * 90; G.fillStyle = '#0e0e12'; G.beginPath(); G.moveTo(x - s, y); G.lineTo(x - s * 0.4, y - s * 0.3); G.lineTo(x + s * 0.6, y - s * 0.2); G.lineTo(x + s, y + s * 0.1); G.lineTo(x, y + s * 0.9); G.closePath(); G.fill(); }
      // the broken pillar he stands on
      const pil = TR.poly([[fx - 150, fy], [fx - 120, fy - 6], [fx + 130, fy - 2], [fx + 160, fy + 10], [fx + 110, H + 60], [fx - 130, H + 60]]);
      TR.lit(pil, '#0c0c10', [{ col: '#fff2d0', a: 0.3 + 0.6 * lightK, ang: -Math.PI / 2, w: 4, blur: 8 }], [fx - 160, fy - 10, fx + 160, H]);
      // the beam
      if (lightK > 0) { G.save(); G.globalCompositeOperation = 'lighter'; G.fillStyle = TR.lin(0, 0, 0, fy, [[0, rgba('#fff2d0', 0.0)], [0.4, rgba('#fff2d0', 0.12 * lightK)], [1, rgba('#fff2d0', 0.3 * lightK)]]); G.beginPath(); G.moveTo(fx - 260, -100); G.lineTo(fx + 120, -100); G.lineTo(fx + 110, fy); G.lineTo(fx - 110, fy); G.closePath(); G.fill(); G.restore(); TR.glow(fx, fy - 40, 260, '#fff2d0', 0.35 * lightK); }
      const bl = t < NAME + 0.1 ? 1 : 1 - sm(seg(t, NAME + 0.1, NAME + 0.3)), lk = t > NAME + 1.0 ? [0, -1] : [0.2, 0.2];
      TR.cube(fx, fy, 96, { t, blink: bl, look: lk, rim: { col: '#fff2d0', a: 0.4 + 0.6 * lightK, ang: -Math.PI / 2 } });
      G.restore();
      TR.embers(t, 220, 61, ['#9a9aa0', '#c8c8cc', '#6a6a70'], { vy: 0.5, vx: 0.4, speed: 0.9, size: 3, a: 0.45 });
    }, { bloom: 0.5 });
  }

  // ======================================================================= 7. THE LAST SPARK: INFINITY VOID (82.6 - 89.0)
  {
    const A = 82.6, B = 89.0, IN = NARR[11] + 2.0, VOID = NARR[11] + 3.1;
    TR.VOID = VOID;
    TR.flashes.push([IN, '#bff0ff', 0.3, 0.1], [VOID, '#e8f8ff', 0.9, 0.2]);
    TR.shakes.push([IN, 6, 0.2], [VOID, 40, 0.3]);
    TR.TITLES.push({ t0: VOID + 0.1, t1: B - 0.1, name: 'INFINITY VOID', col: '#9ff0ff', glow: '#5a8aff', y: 300, size: 92 });
    shot(A, B, (lt, t) => {
      const G = g(), vk = sm(seg(t, IN + 0.1, VOID - 0.05)), post = t - VOID, fx = W / 2, fy = 960;
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, mixc('#0a0a0c', '#06061a', vk)], [1, mixc('#1c1c20', '#14103a', vk)]]); G.fillRect(0, 0, W, H);
      TR.fog(TR.tex.fog, mixc('#2a2a30', '#2a2a6a', vk), 0.6, -t * 12, 0, 3);
      const z = lerp(1.0, 1.08, seg(lt, 0, 6.4)) + TR.pulse(t, VOID, 0.25) * 0.08;
      G.save(); G.translate(fx, 640); G.scale(z, z); G.translate(-fx, -640);
      TR.glow(fx, 0, 500, '#fff2d0', 0.2 * (1 - vk));
      if (post > 0) {   // the burst
        G.save(); G.globalCompositeOperation = 'lighter'; G.translate(fx, fy - 170);
        for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + post * 0.2, L = 1400 * eo(cl(post * 2)), wv = 0.03; G.fillStyle = TR.lin(0, 0, Math.cos(a) * L, Math.sin(a) * L, [[0, rgba(i % 2 ? '#9a6aff' : '#7fe8ff', 0.35 * Math.exp(-post * 0.5))], [1, 'rgba(0,0,0,0)']]); G.beginPath(); G.moveTo(0, 0); G.lineTo(Math.cos(a - wv) * L, Math.sin(a - wv) * L); G.lineTo(Math.cos(a + wv) * L, Math.sin(a + wv) * L); G.closePath(); G.fill(); }
        [0, 0.12, 0.3].forEach((d, i) => { const r = (post - d) * 1500; if (r > 0) { G.strokeStyle = rgba(i === 1 ? '#9a6aff' : '#9ff0ff', 0.8 * Math.exp(-(post - d) * 1.8)); G.lineWidth = 30 * Math.exp(-(post - d) * 1.5) + 2; G.shadowColor = '#7fe8ff'; G.shadowBlur = 30; G.beginPath(); G.arc(0, 0, r, 0, TAU); G.stroke(); } });
        G.restore();
        for (let i = 0; i < 140; i++) { const a = hs(i + 500) * TAU, d = (200 + hs(i + 501) * 1200) * eo(cl(post * 0.8)), x = fx + Math.cos(a) * d, y = fy - 170 + Math.sin(a) * d * 0.7; const tw = 0.5 + 0.5 * Math.sin(t * 8 + i); G.fillStyle = rgba(i % 3 ? '#ffffff' : '#9ff0ff', (0.4 + 0.6 * tw) * Math.exp(-post * 0.3)); const ss = 2 + hs(i + 502) * 4; G.fillRect(x, y, ss, ss); }
        TR.glow(fx, fy - 170, 900, '#5a8aff', 0.4 * Math.exp(-post * 0.6) + 0.15);
      }
      // the spark coming down
      const sp = seg(t, NARR[11] + 0.2, IN);
      if (t < IN + 0.1) {
        const sx = fx + Math.sin(sp * 5) * 60 * (1 - sp), sy = lerp(-60, fy - 200, ei(sp) * 0.3 + sp * 0.7);
        for (let j = 1; j < 10; j++) { const q = Math.max(0, sp - j * 0.02), yy = lerp(-60, fy - 200, ei(q) * 0.3 + q * 0.7); TR.glow(fx + Math.sin(q * 5) * 60 * (1 - q), yy, 26 - j * 2, '#bff0ff', 0.4 * (1 - j / 10)); }
        TR.glow(sx, sy, 160, '#bff0ff', 0.7); TR.glow(sx, sy, 40, '#ffffff', 1);
        G.save(); G.globalCompositeOperation = 'lighter'; G.translate(sx, sy); G.rotate(t * 2); G.fillStyle = 'rgba(255,255,255,0.8)'; [0, Math.PI / 2].forEach((r) => { G.save(); G.rotate(r); G.beginPath(); G.moveTo(-90, 0); G.lineTo(0, -4); G.lineTo(90, 0); G.lineTo(0, 4); G.closePath(); G.fill(); G.restore(); }); G.restore();
      }
      const tremble = vk > 0 && post < 0 ? Math.sin(t * 80) * 4 * vk : 0;
      TR.cube(fx + tremble, fy, 280, { t, void: vk, look: t < IN ? [0, -1] : [0, 0.1], sq: post > 0 ? 0.25 * Math.exp(-post * 4) : 0, rim: { col: vk > 0.5 ? '#9ff0ff' : '#fff2d0', a: 0.6, ang: -Math.PI / 2 } });
      G.restore();
      TR.embers(t, 120, 71, vk > 0.5 ? ['#9ff0ff', '#9a6aff', '#ffffff'] : ['#9a9aa0', '#c8c8cc'], { vy: vk > 0.5 ? -1.2 : 0.5, speed: 1 + vk, size: 3, a: 0.5 });
    }, { bloom: 0.65 });
  }

  // ======================================================================= 8. ONE BY ONE (89.0 - 92.6)
  {
    const A = 89.0, B = 92.6, IGN = [89.55, 89.85, 90.15, 90.45], GRAY = 90.7, FLIP = 92.0;
    TR.IGN = IGN; TR.GRAYOPEN = GRAY; TR.FLIP = FLIP;
    IGN.forEach((x) => TR.shakes.push([x, 8, 0.12]));
    TR.shakes.push([FLIP, 16, 0.2]);
    TR.FADES.push([A, A + 0.3, 1, 0], [B - 0.35, B, 0, 1]);
    const BOSSES = [['tyrant', 820, 470, '#ff3a20'], ['still', 1110, 480, '#ffd27a'], ['hourless', 1390, 440, '#ffb050'], ['niro', 1640, 330, '#cfeaff']];
    shot(A, B, (lt, t) => {
      const G = g();
      G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#050406'], [0.55, '#1a0e14'], [1, '#2a1a1e']]); G.fillRect(0, 0, W, H);
      TR.fog(TR.tex.fog, '#3a2028', 0.5, t * 20, 0, 3);
      const op = sm(seg(t, GRAY, GRAY + 0.6));
      G.save(); G.globalAlpha = 0.85; TR.grayEye(1240, 340, 1100, 300, op, [-0.5, 0.3], 0.7, t, false, 77); G.restore();
      // the far ridge and the four
      TR.mountains(G, 770, 91, '#060406', 0.7, 0.3);
      BOSSES.forEach((b, i) => TR.bossSil(b[0], b[1], 780, b[2], { col: b[3], eye: sm(seg(t, IGN[i], IGN[i] + 0.2)), t }));
      // Flippo's ledge
      const ledge = TR.poly([[-100, 880], [420, 872], [520, 900], [480, 1100], [-100, 1100]]);
      TR.lit(ledge, '#050407', [{ col: '#9ff0ff', a: 0.4, ang: -Math.PI / 2, w: 3 }], [-100, 860, 520, 1100]);
      const cr = sm(seg(t, 91.5, 91.9)), fl = seg(t, FLIP, FLIP + 0.25);
      if (fl <= 0) TR.cube(360, 876, 86, { kind: 'ivoid', t, look: [1, -0.3], sq: cr * 0.35 });
      else {
        const y = lerp(876, -200, ei(fl));
        G.save(); G.globalCompositeOperation = 'lighter'; G.fillStyle = TR.lin(0, y, 0, 876, [[0, 'rgba(160,240,255,0.8)'], [1, 'rgba(120,200,255,0)']]); G.fillRect(330, y, 60, 876 - y); G.restore();
        TR.cube(360, y, 86, { kind: 'ivoid', t, sq: -0.3 });
      }
      TR.embers(t, 100, 81, ['#ff6a3a', '#9a8a90'], { vy: -0.6, size: 2.5, a: 0.4 });
    }, { bloom: 0.55 });
  }

  // ======================================================================= END: FLIPNOVA · COMING SOON (92.6 - 101)
  {
    const A = 92.6, B = 101, K = [93.2, 93.6, 94.2], SLAM = 94.2, SOON = NARR[13] + 2.2;
    TR.KNOCKS_END = K; TR.LOGO = SLAM; TR.SOON = SOON;
    TR.shakes.push([SLAM, 24, 0.2]); TR.flashes.push([SLAM, '#ffffff', 0.7, 0.14], [SOON, '#ffe6b0', 0.12, 0.2]);
    TR.FADES.push([B - 0.8, B, 0, 1]);
    const GL = { F: '#####|#....|#....|####.|#....|#....|#....', L: '#....|#....|#....|#....|#....|#....|#####', I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', A: '.###.|#...#|#...#|#####|#...#|#...#|#...#' };
    let logo = null;
    const cells = (txt, X, Y, P, fn) => [...txt].forEach((ch, ci) => GL[ch].split('|').forEach((row, ry) => [...row].forEach((c, rx) => { if (c === '#') fn(X + ci * 6 * P + rx * P, Y + ry * P); })));
    const word = (x, txt, X, Y, P, col, hi, lo) => {
      cells(txt, X, Y, P, (px, py) => { x.fillStyle = '#05060d'; x.fillRect(px - P * 0.18, py - P * 0.18, P * 1.36, P * 1.36); });
      cells(txt, X, Y, P, (px, py) => { x.fillStyle = col; x.fillRect(px, py, P, P); x.fillStyle = hi; x.fillRect(px, py, P, P * 0.18); x.fillRect(px, py, P * 0.18, P); x.fillStyle = lo; x.fillRect(px, py + P * 0.82, P, P * 0.18); x.fillRect(px + P * 0.82, py, P * 0.18, P); });
    };
    const makeLogo = () => {
      if (logo) return logo;
      logo = TR.mk(900, 560); const x = logo.getContext('2d');
      const P1 = 26, P2 = 17, w1 = (4 * 6 - 1) * P1, w2 = (4 * 6 - 1) * P2;
      word(x, 'FLIP', 450 - w1 / 2, 40, P1, '#ffffff', '#ffffff', '#b8c4d8');
      word(x, 'NOVA', 450 - w2 / 2, 40 + 7 * P1 + 40, P2, '#ffd23f', '#fff6c2', '#a8740a');
      const by = 40 + 7 * P1 + 40 + 7 * P2 + 26; x.fillStyle = '#27d7ff'; x.fillRect(450 - w1 / 2, by, w1 / 2, 12); x.fillStyle = '#b45cff'; x.fillRect(450, by, w1 / 2, 12);
      return logo;
    };
    shot(A, B, (lt, t) => {
      const G = g();
      G.fillStyle = '#000'; G.fillRect(0, 0, W, H);
      K.forEach((k, i) => TR.glow(W / 2, 470, 200 + i * 120, '#ffd27a', 0.12 * (i + 1) * TR.pulse(t, k, 0.2)));
      if (t < SLAM) return;
      const k = seg(t, SLAM, SLAM + 0.16), post = t - SLAM;
      // space behind the logo
      TR.fog(TR.tex.fog, '#1a1440', 0.6 * seg(post, 0, 1.5), t * 10, 0, 3);
      TR.fog(TR.tex.wisp, '#3a1a5a', 0.35 * seg(post, 0, 1.5), -t * 15, 200, 2.2);
      TR.glow(W / 2, 470, 900, '#5a8aff', 0.18 + 0.4 * Math.exp(-post * 1.5));
      TR.glow(W / 2, 470, 500, '#ffd27a', 0.15 + 0.5 * Math.exp(-post * 2));
      for (let i = 0; i < 120; i++) { const a = hs(i + 600) * TAU, d = 80 + (hs(i + 601) * 900 + post * (30 + hs(i + 602) * 80)), x = W / 2 + Math.cos(a) * d, y = 470 + Math.sin(a) * d * 0.6; G.fillStyle = rgba(i % 4 ? '#ffffff' : '#ffd27a', 0.6 * seg(post, 0, 0.6)); G.fillRect(x, y, 2.5, 2.5); }
      const L = makeLogo(), sc = lerp(1.45, 1, eo(k)) * (1 + 0.02 * seg(post, 0, 6)), y0 = 470 - 40;
      G.save(); G.translate(W / 2, y0); G.scale(sc, sc); G.globalAlpha = k;
      G.shadowColor = 'rgba(255,220,140,0.55)'; G.shadowBlur = 50; G.drawImage(L, -450, -280); G.shadowBlur = 0;
      const sw = seg(post, 0.4, 1.3);
      if (sw > 0 && sw < 1) { G.save(); G.globalCompositeOperation = 'lighter'; G.globalAlpha = 0.6 * Math.sin(sw * Math.PI); G.filter = 'brightness(3)'; G.beginPath(); G.rect(lerp(-500, 400, sw), -280, 120, 560); G.clip(); G.drawImage(L, -450, -280); G.filter = 'none'; G.restore(); }
      G.restore();
      const s1 = sm(seg(t, SLAM + 1.0, SLAM + 1.6));
      G.save(); G.globalAlpha = s1 * 0.85; G.font = TR.font(700, 30); G.fillStyle = '#c8c0d8'; TR.spaced(G, 'THE STORY CONTINUES', W / 2, 760, 14); G.restore();
      const s2 = sm(seg(t, SOON - 0.1, SOON + 0.5));
      if (s2 > 0) { G.save(); G.globalAlpha = s2; G.font = TR.font(900, 76); G.fillStyle = '#f6ecd6'; G.shadowColor = '#ffb050'; G.shadowBlur = 30; TR.spaced(G, 'COMING SOON', W / 2, 870 - 12 * (1 - s2), 26); G.restore(); }
    }, { bloom: 0.5 });
  }

  TR.SHOTS.sort((a, b) => a.a - b.a);
  TR.timelineReady = true;
})();
