// FLIPNOVA trailer — Flippo (HD cube), the five as silhouettes, boss silhouettes, the floating world and the Core.
(function () {
  'use strict';
  const TR = window.TR;
  const { W, H, cl, seg, sm, eo, lerp, hs, rgba, mixc, TAU } = TR;
  const g = () => TR.ctx();

  // ======================================================================= FLIPPO: the hero cube. x = centre, y = feet
  // o: { kind 'flippo'|'ivoid', look [-1..1, -1..1], blink 0..1, t, rim {col,a,ang}, sq (squash), void 0..1 (mid-change) }
  const SK = {
    flippo: { b: '#ff5a3c', l: '#ffb199', d: '#c8321c', k: '#5a140c', e: '#ffffff', p: '#1a0b0b' },
    ivoid: { b: '#141a3a', l: '#3a4a9a', d: '#0a0e28', k: '#03040f', e: '#bff0ff', p: '#ffffff' }
  };
  TR.cube = function (x, y, s, o) {
    o = o || {};
    const G = g(), vk = cl(o.void === undefined ? (o.kind === 'ivoid' ? 1 : 0) : o.void), t = o.t || 0;
    const K = {}; Object.keys(SK.flippo).forEach((k) => (K[k] = mixc(SK.flippo[k], SK.ivoid[k], vk)));
    const sq = o.sq || 0, bw = s * (1 + sq * 0.18), bh = s * (1 - sq * 0.2), bx = x - bw / 2, by = y - s * 0.1 - bh;
    G.fillStyle = 'rgba(0,0,0,0.45)'; G.beginPath(); G.ellipse(x, y + 2, bw * 0.55, s * 0.07, 0, 0, TAU); G.fill();
    if (vk > 0) { TR.glow(x, by + bh / 2, s * 2.4, '#5ae0ff', 0.35 * vk); TR.glow(x, by + bh / 2, s * 1.2, '#9a6aff', 0.25 * vk); }
    G.fillStyle = K.k; const fw = s * 0.26, fh = s * 0.13;
    G.beginPath(); G.roundRect(x - s * 0.34, y - fh, fw, fh, s * 0.04); G.roundRect(x + s * 0.08, y - fh, fw, fh, s * 0.04); G.fill();
    const body = new Path2D(); body.roundRect(bx, by, bw, bh, s * 0.14);
    G.fillStyle = K.k; G.beginPath(); G.roundRect(bx - s * 0.05, by - s * 0.05, bw + s * 0.1, bh + s * 0.1, s * 0.18); G.fill();
    G.fillStyle = TR.lin(bx, by, bx + bw, by + bh, [[0, K.l], [0.35, K.b], [1, K.d]]); G.fill(body);
    G.save(); G.clip(body);
    if (vk > 0) {   // the inside of INFINITY VOID: a window into space
      G.globalAlpha = vk;
      G.fillStyle = TR.rad(bx + bw * 0.4, by + bh * 0.4, 0, bw, [[0, '#3a2a8a'], [0.5, '#141a4a'], [1, '#05061a']]); G.fillRect(bx, by, bw, bh);
      for (let i = 0; i < 40; i++) { const sx = bx + hs(i) * bw, sy = by + ((hs(i + 3) * bh + t * 10 * (0.5 + hs(i + 5))) % bh), tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 2); G.fillStyle = rgba('#ffffff', 0.4 + 0.6 * tw); const ss = s * (0.012 + hs(i + 7) * 0.02); G.fillRect(sx, sy, ss, ss); }
      G.globalAlpha = 1;
    }
    G.fillStyle = 'rgba(255,255,255,0.22)'; G.fillRect(bx, by, bw, bh * 0.08);
    G.fillStyle = 'rgba(0,0,0,0.18)'; G.fillRect(bx + bw * 0.88, by, bw * 0.12, bh); G.fillRect(bx, by + bh * 0.9, bw, bh * 0.1);
    if (o.rim && o.rim.a > 0) { const r = o.rim; G.globalCompositeOperation = 'lighter'; G.strokeStyle = TR.lin(x + Math.cos(r.ang) * s, by + bh / 2 + Math.sin(r.ang) * s, x, by + bh / 2, [[0, rgba(r.col, r.a)], [1, rgba(r.col, 0)]]); G.lineWidth = s * 0.12; G.stroke(body); G.globalCompositeOperation = 'source-over'; }
    G.restore();
    G.fillStyle = 'rgba(255,255,255,0.55)'; G.beginPath(); G.roundRect(bx + bw * 0.1, by + bh * 0.1, bw * 0.16, bh * 0.07, s * 0.03); G.fill();
    const lk = o.look || [0, 0], bl = 1 - cl(o.blink || 0) * 0.92, ew = s * 0.17, eh = s * 0.27 * bl;
    [-1, 1].forEach((sd) => {
      const ex = x + sd * s * 0.19 + lk[0] * s * 0.06, ey = by + bh * 0.42 + lk[1] * s * 0.05;
      if (vk > 0.3) TR.glow(ex, ey, s * 0.5, '#5ae0ff', 0.6 * vk);
      G.fillStyle = K.e; G.beginPath(); G.roundRect(ex - ew / 2, ey - eh / 2, ew, Math.max(1, eh), s * 0.04); G.fill();
      if (bl > 0.3) { G.fillStyle = K.p; const pw = ew * 0.5, ph = eh * 0.55; G.fillRect(ex - pw / 2 + lk[0] * ew * 0.22, ey - ph / 2 + lk[1] * eh * 0.2, pw, ph); }
    });
    if (vk > 0.05) {   // INFINITY VOID: crown of white flame
      G.save(); G.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const fx = bx + bw * (0.08 + i * 0.14), h0 = s * (0.25 + (i % 2 ? 0.12 : 0.28) + (i === 3 ? 0.18 : 0)) * vk * (0.85 + 0.2 * Math.sin(t * 12 + i * 2)), w = bw * 0.08;
        const p = new Path2D(); p.moveTo(fx - w, by + 2); p.quadraticCurveTo(fx - w * 0.4, by - h0 * 0.6, fx + Math.sin(t * 7 + i) * w * 0.6, by - h0); p.quadraticCurveTo(fx + w * 0.4, by - h0 * 0.6, fx + w, by + 2); p.closePath();
        G.fillStyle = TR.lin(0, by, 0, by - h0, [[0, rgba('#ffffff', 0.95)], [0.6, rgba('#bff0ff', 0.7)], [1, 'rgba(120,200,255,0)']]); G.fill(p);
      }
      G.restore();
    }
  };

  // ======================================================================= the five, as silhouettes (h = height, y = feet)
  const FIG = {};
  function buildFigs() {
    if (FIG.guard) return;
    const { poly, smooth } = TR;
    const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
    const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
    FIG.guard = [circ(-0.18, -0.62, 0.17), poly([[-0.17, -0.78], [-0.27, -0.08], [-0.22, 0], [0.16, 0], [0.19, -0.1], [0.15, -0.78]]), rr(-0.11, -0.44, 0.09, 0.44, 0.02), rr(0.02, -0.44, 0.09, 0.44, 0.02),
      poly([[-0.2, -0.8], [0.2, -0.8], [0.17, -0.44], [-0.17, -0.44]]), circ(-0.19, -0.78, 0.075), circ(0.19, -0.78, 0.075), rr(-0.08, -0.98, 0.16, 0.17, 0.05), poly([[-0.03, -0.97], [0.01, -1.08], [0.11, -1.03], [0.04, -0.96]]),
      poly([[0.2, -0.8], [0.29, -0.6], [0.26, -0.55], [0.17, -0.72]]), rr(0.265, -1.28, 0.022, 1.28, 0.01), poly([[0.255, -1.28], [0.276, -1.4], [0.297, -1.28]])];
    FIG.teacher = [poly([[-0.12, -0.82], [0.12, -0.82], [0.2, -0.3], [0.28, 0], [-0.28, 0], [-0.2, -0.3]]), circ(0, -0.9, 0.075), poly([[-0.08, -0.92], [-0.12, -0.6], [-0.05, -0.62], [0.0, -0.84]]),
      poly([[0.12, -0.8], [0.3, -0.62], [0.28, -0.56], [0.1, -0.7]]), rr(0.3, -1.14, 0.018, 1.14, 0.008), rr(0.29, -1.12, 0.06, 0.08, 0.01)];
    FIG.lantern = [0.32, -1.04];
    FIG.map = [poly([[-0.25, -0.28], [-0.2, -0.33], [0.17, -0.96], [0.12, -1.0]]), poly([[-0.13, -0.78], [0.13, -0.78], [0.22, 0], [-0.22, 0]]), smooth([[-0.15, -0.8], [-0.1, -0.86], [0.1, -0.86], [0.15, -0.8], [0, -0.74]], true), circ(0, -0.88, 0.075), circ(-0.06, -0.96, 0.04), rr(0.1, -0.52, 0.12, 0.12, 0.02)];
    FIG.kid = [rr(-0.13, -0.6, 0.26, 0.32, 0.04), rr(-0.11, -0.3, 0.09, 0.3, 0.02), rr(0.02, -0.3, 0.09, 0.3, 0.02), rr(-0.2, -1.0, 0.4, 0.4, 0.05)];
  }
  TR.figure = function (kind, x, y, h, o) {
    buildFigs(); o = o || {};
    const G = g(), parts = FIG[kind === 'niro' ? 'kid' : kind];
    G.save(); G.translate(x, y); G.scale(h, h);
    const rims = [{ col: o.col || '#ffd890', a: o.a === undefined ? 0.9 : o.a, ang: o.ang === undefined ? 0 : o.ang, w: 0.012, blur: 0, span: 0.3 }];
    if (o.hl) rims.push({ col: '#fff4d8', a: o.hl, ang: o.ang === undefined ? 0 : o.ang, w: 0.02, span: 0.8 });
    parts.forEach((p) => TR.lit(p, o.fill || '#07080b', rims, [-0.4, -1.4, 0.4, 0.05]));
    if (kind === 'teacher') { const L = FIG.lantern; TR.glow(L[0], L[1], 0.25, '#ffc070', 0.55 + 0.1 * Math.sin((o.t || 0) * 9)); TR.glow(L[0], L[1], 0.06, '#fff0c0', 0.9); }
    if (kind === 'niro') {   // the headband: the one colour he keeps
      G.fillStyle = '#2a9a8a'; G.fillRect(-0.2, -0.9, 0.4, 0.05);
      const t = o.t || 0; G.beginPath(); G.moveTo(-0.2, -0.9); for (let i = 0; i <= 8; i++) { const u = i / 8; G.lineTo(-0.2 - u * 0.3, -0.89 + Math.sin(t * 6 + u * 5) * 0.03 * u + u * 0.04); } G.lineWidth = 0.035; G.strokeStyle = '#2a9a8a'; G.stroke();
    }
    G.restore();
  };

  // ======================================================================= the four, twisted: boss silhouettes with burning eyes
  TR.bossSil = function (kind, x, y, h, o) {
    o = o || {};
    const G = g(), e = cl(o.eye || 0), col = o.col, t = o.t || 0;
    G.save(); G.translate(x, y); G.scale(h, h);
    const rim = [{ col, a: 0.55 + 0.4 * e, ang: -Math.PI / 2, w: 0.012, blur: 0, span: 0.5 }], BB = [-0.6, -1.4, 0.6, 0.05];
    const eyes = (pts, c, r) => pts.forEach((p) => { TR.glow(p[0], p[1], r * 6 * e, c, 0.7 * e); TR.glow(p[0], p[1], r * 1.6, '#ffffff', e); });
    if (kind === 'tyrant') {
      [-1, 1].forEach((s) => { const c = TR.bez([s * 0.08, -0.95], [s * 0.3, -1.0], [s * 0.38, -1.2], [s * 0.22, -1.38], 20); TR.lit(TR.taper(c, 0.08, 0.005), '#08060a', rim, BB); });
      TR.lit(TR.poly([[-0.5, 0], [-0.46, -0.62], [-0.32, -0.8], [-0.12, -0.84], [-0.11, -1.02], [0, -1.08], [0.11, -1.02], [0.12, -0.84], [0.32, -0.8], [0.46, -0.62], [0.5, 0]]), '#08060a', rim, BB);
      for (let k = 0; k < 3; k++) [-1, 1].forEach((s) => TR.lit(TR.poly([[s * (0.24 + k * 0.08), -0.8], [s * (0.3 + k * 0.1), -1.0 + k * 0.05], [s * (0.3 + k * 0.08), -0.78]]), '#08060a', rim, BB));
      eyes([[-0.045, -0.96], [0.045, -0.96]], '#ff5a10', 0.018);
      if (e > 0) TR.glow(0, -0.5, 0.12, '#ff6a10', 0.8 * e);
    } else if (kind === 'still') {
      G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#f0c878', 0.25 + 0.5 * e); G.lineWidth = 0.012; G.beginPath(); G.arc(0, -0.95, 0.3, 0, TAU); G.stroke(); G.lineWidth = 0.005; G.beginPath(); G.arc(0, -0.95, 0.36, 0, TAU); G.stroke(); G.restore();
      TR.lit(TR.poly([[-0.42, 0], [-0.3, -0.5], [-0.16, -0.78], [-0.22, -1.08], [-0.1, -0.86], [0.1, -0.86], [0.22, -1.08], [0.16, -0.78], [0.3, -0.5], [0.42, 0]]), '#08070a', rim, BB);
      TR.lit(TR.smooth([[0, -1.08], [-0.08, -1.02], [-0.085, -0.92], [0, -0.84], [0.085, -0.92], [0.08, -1.02]], true), '#2a2620', rim, BB);
      eyes([[-0.035, -0.97], [0.035, -0.97]], '#ffd27a', 0.01);
    } else if (kind === 'hourless') {
      TR.lit(TR.smooth([[0, -1.18], [-0.12, -1.06], [-0.16, -0.86], [-0.3, -0.7], [-0.46, 0], [0.46, 0], [0.3, -0.7], [0.16, -0.86], [0.12, -1.06]], true), '#0a0806', rim, BB);
      eyes([[-0.035, -0.95], [0.035, -0.95]], '#ffb050', 0.012);
      if (e > 0) { G.save(); G.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const k = (t * 0.8 + hs(i)) % 1, sd = i % 2 ? 1 : -1; G.fillStyle = rgba('#ffcf7a', 0.8 * (1 - k) * e); G.fillRect(sd * 0.035 + (hs(i + 3) - 0.5) * 0.04 * k, -0.94 + k * 0.6, 0.008, 0.008); } G.restore(); }
    } else if (kind === 'niro') {
      TR.lit(TR.poly([[-0.36, 0], [-0.34, -0.5], [-0.14, -0.6], [0.14, -0.6], [0.34, -0.5], [0.36, 0]]), '#08090c', rim, BB);
      const hd = new Path2D(); hd.roundRect(-0.2, -1.02, 0.4, 0.4, 0.03); TR.lit(hd, '#0c0e12', rim, BB);
      G.fillStyle = rgba('#2a9a8a', 0.6 + 0.4 * e); G.fillRect(-0.2, -0.94, 0.4, 0.04);
      [-1, 1].forEach((s) => { G.fillStyle = rgba('#ffffff', 0.2 + 0.8 * e); G.fillRect(s * 0.09 - 0.045, -0.85, 0.09, 0.05); });
      eyes([[-0.09, -0.825], [0.09, -0.825]], '#cfeaff', 0.015);
    }
    G.restore();
  };

  // ======================================================================= NOVA: floating islands and the Core
  const isl = [];
  function makeIsland(w, seed, lightLeft, warm) {
    const c = TR.mk(Math.round(w * 1.3), Math.round(w * 1.25)), x = c.getContext('2d'), ox = w * 0.15, oy = w * 0.3;
    const prev = TR.ctx(); TR.setCtx(x);
    const pts = [[ox, oy]];
    for (let i = 1; i < 12; i++) { const u = i / 12, depth = Math.sin(u * Math.PI) * w * (0.55 + 0.25 * hs(seed + i)) * (0.8 + 0.3 * Math.sin(u * 9 + seed)); pts.push([ox + u * w, oy + 10 + depth]); }
    pts.push([ox + w, oy]);
    const rock = TR.poly(pts), L = lightLeft ? 1 : -1;
    x.fillStyle = TR.lin(ox, oy, ox, oy + w * 0.8, [[0, '#4a3a5a'], [0.5, '#2a2036'], [1, '#120c1a']]); x.fill(rock);
    x.save(); x.clip(rock);
    for (let i = 0; i < 9; i++) { x.strokeStyle = 'rgba(10,6,16,0.45)'; x.lineWidth = 3 + hs(seed + i) * 5; x.beginPath(); const yy = oy + 20 + i * w * 0.07; x.moveTo(ox, yy); x.quadraticCurveTo(ox + w / 2, yy + 14 * Math.sin(i + seed), ox + w, yy + 6); x.stroke(); }
    x.fillStyle = TR.lin(ox, 0, ox + w, 0, L > 0 ? [[0, 'rgba(0,0,0,0.5)'], [0.6, 'rgba(0,0,0,0)'], [1, rgba(warm, 0.5)]] : [[0, rgba(warm, 0.5)], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]);
    x.fillRect(ox, oy, w, w);
    x.restore();
    x.strokeStyle = 'rgba(30,40,30,0.8)'; x.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const rx = ox + w * (0.2 + hs(seed + i * 3) * 0.6), ry = oy + 30 + hs(seed + i) * w * 0.3; x.beginPath(); x.moveTo(rx, ry); x.quadraticCurveTo(rx + 8, ry + 40, rx - 4, ry + 60 + hs(i) * 60); x.stroke(); }
    const top = TR.smooth([[ox - 6, oy + 6], [ox + w * 0.1, oy - 10], [ox + w * 0.5, oy - 18], [ox + w * 0.9, oy - 10], [ox + w + 6, oy + 6], [ox + w * 0.5, oy + 22]], true);
    x.fillStyle = TR.lin(0, oy - 18, 0, oy + 22, [[0, '#5fd0a0'], [0.5, '#2f8a6a'], [1, '#1a4a3a']]); x.fill(top);
    TR.lit(top, 'rgba(0,0,0,0)', [{ col: warm, a: 0.8, ang: L > 0 ? 0 : Math.PI, w: 3, blur: 6 }], [ox, oy - 20, ox + w, oy + 24]);
    const nT = 2 + Math.floor(hs(seed) * 4);
    for (let i = 0; i < nT; i++) { const tx = ox + w * (0.1 + hs(seed + i * 7) * 0.8), th = w * (0.08 + hs(seed + i) * 0.08); x.fillStyle = '#1f5a46'; x.beginPath(); x.arc(tx, oy - 14 - th, th * 0.8, 0, TAU); x.fill(); x.fillStyle = '#2f7a5e'; x.beginPath(); x.arc(tx - th * 0.25, oy - 18 - th * 1.2, th * 0.5, 0, TAU); x.fill(); x.fillStyle = '#2a1a14'; x.fillRect(tx - 2, oy - 16 - th * 0.4, 4, th * 0.5); }
    if (w > 220) for (let i = 0; i < 2; i++) { const hx = ox + w * (0.3 + i * 0.3), hw = w * 0.08; x.fillStyle = '#3a2a3a'; x.fillRect(hx, oy - 14 - hw, hw, hw); x.fillStyle = '#5a2a3a'; x.beginPath(); x.moveTo(hx - 4, oy - 14 - hw); x.lineTo(hx + hw / 2, oy - 14 - hw * 1.7); x.lineTo(hx + hw + 4, oy - 14 - hw); x.fill(); x.fillStyle = '#ffd27a'; x.fillRect(hx + hw * 0.3, oy - 14 - hw * 0.7, hw * 0.3, hw * 0.3); }
    TR.setCtx(prev);
    return { c, ox, oy };
  }
  TR.CORE = [960, 500];
  function buildWorld() {
    if (isl.length) return;
    [[300, 330, 0.55, 1], [1560, 300, 0.5, 2], [600, 660, 0.75, 3], [1340, 700, 0.85, 4], [120, 780, 1.0, 5], [1780, 840, 1.1, 6], [1060, 240, 0.32, 7], [520, 200, 0.28, 8]].forEach((q) => {
      const w = 420 * q[2];
      isl.push(Object.assign(makeIsland(w, q[3] * 11, q[0] < TR.CORE[0], '#ffcf8a'), { x: q[0], y: q[1], d: q[2], w, seed: q[3] }));
    });
    isl.sort((a, b) => a.d - b.d);
  }
  TR.core = function (x, y, r, t, o) {
    o = o || {};
    const G = g(), pw = o.power === undefined ? 1 : o.power, gray = o.gray || 0;
    const C1 = mixc('#ffd27a', '#9aa0a8', gray), C2 = mixc('#7fe8ff', '#6a7078', gray);
    TR.glow(x, y, r * 9, C1, 0.28 * pw); TR.glow(x, y, r * 5, C2, 0.18 * pw); TR.glow(x, y, r * 2.4, '#ffffff', 0.12 * pw);
    G.save(); G.globalCompositeOperation = 'lighter'; G.translate(x, y);
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + t * 0.03 + hs(i) * 0.2, L = r * (5 + hs(i + 1) * 6), wv = 0.02 + hs(i + 2) * 0.03; G.fillStyle = TR.lin(0, 0, Math.cos(a) * L, Math.sin(a) * L, [[0, rgba(C1, 0.11 * pw * (0.6 + 0.4 * Math.sin(t * 0.8 + i)))], [1, 'rgba(0,0,0,0)']]); G.beginPath(); G.moveTo(0, 0); G.lineTo(Math.cos(a - wv) * L, Math.sin(a - wv) * L); G.lineTo(Math.cos(a + wv) * L, Math.sin(a + wv) * L); G.closePath(); G.fill(); }
    G.restore();
    const sph = new Path2D(); sph.arc(x, y, r, 0, TAU);
    G.fillStyle = TR.rad(x - r * 0.25, y - r * 0.25, r * 0.1, r * 1.05, [[0, '#fffaf0'], [0.35, mixc('#ffe6a0', '#c8ccd2', gray)], [0.75, mixc('#ffb050', '#7a8088', gray)], [1, mixc('#e8702a', '#4a4e54', gray)]]);
    G.globalAlpha = 0.4 + 0.6 * pw; G.fill(sph); G.globalAlpha = 1;
    G.save(); G.clip(sph); G.globalCompositeOperation = 'lighter';
    G.translate(x, y); G.rotate(t * 0.15); G.globalAlpha = 0.32 * Math.min(1, pw); G.drawImage(TR.tint(TR.tex.wisp, C2), -r * 1.5, -r * 1.5, r * 3, r * 3); G.rotate(-t * 0.35); G.drawImage(TR.tint(TR.tex.fog, '#ffffff'), -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
    G.globalCompositeOperation = 'multiply'; G.globalAlpha = 0.45; G.rotate(t * 0.1); G.drawImage(TR.tint(TR.tex.fog2, mixc('#c86a20', '#5a5e64', gray)), -r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
    G.restore();
    G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba(C2, 0.6 * pw); G.lineWidth = r * 0.04; G.shadowColor = C2; G.shadowBlur = r * 0.3; G.stroke(sph); G.restore();
  };
  // the vista; cam: {x, y, z}
  TR.world = function (t, o) {
    buildWorld(); o = o || {};
    const G = g(), cam = o.cam || { x: 0, y: 0, z: 1 }, pw = o.power === undefined ? 1 : o.power;
    G.fillStyle = TR.lin(0, 0, 0, H, [[0, '#04061a'], [0.45, '#1a1440'], [0.75, '#4a2a5a'], [1, '#2a1a3a']]); G.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { const tw = 0.5 + 0.5 * Math.sin(t * (1 + hs(i) * 3) + i), sx = hs(i * 2.1) * W, sy = hs(i * 3.7) * H * 0.7; G.fillStyle = rgba('#ffffff', (0.2 + 0.6 * tw) * hs(i + 9)); const ss = 1 + hs(i + 4) * 2; G.fillRect(sx, sy, ss, ss); }
    G.save(); G.translate(W / 2, H / 2); G.scale(cam.z, cam.z); G.translate(-W / 2 - cam.x, -H / 2 - cam.y);
    TR.fogRect(TR.tex.fog, '#6a4a8a', 0.35, -400, 300, W + 800, 700, t * 8, 0, 3.4);
    TR.core(TR.CORE[0], TR.CORE[1], 110, t, { power: pw, gray: o.coreGray || 0 });
    isl.forEach((s) => {
      const par = 0.4 + s.d * 0.8, bob = Math.sin(t * 0.5 + s.seed) * 10 * s.d;
      const x = s.x - s.ox - s.w / 2 + cam.x * (1 - par), y = s.y - s.oy + bob + cam.y * (1 - par);
      G.drawImage(s.c, x, y);
      if (s.w > 220) TR.glow(s.x, s.y - 30 + bob, 60 * s.d, '#ffb050', 0.25 * pw);
    });
    for (let i = 0; i < 14; i++) { const x = (hs(i + 30) * W + t * (10 + hs(i) * 20)) % (W + 100) - 50, y = 200 + hs(i + 31) * 700 + Math.sin(t + i) * 12, s = 6 + hs(i + 32) * 16; G.fillStyle = '#2a2036'; G.beginPath(); G.moveTo(x - s, y); G.lineTo(x, y - s * 0.6); G.lineTo(x + s, y); G.lineTo(x, y + s * 0.9); G.closePath(); G.fill(); }
    G.strokeStyle = 'rgba(20,12,30,0.8)'; G.lineWidth = 2.5;
    for (let i = 0; i < 7; i++) { const x = 300 + (t * 70 + i * 40) % 1600, y = 380 + Math.sin(i * 2) * 50 + Math.sin(t * 2 + i) * 6, f = Math.sin(t * 9 + i) * 6; G.beginPath(); G.moveTo(x - 10, y - f); G.lineTo(x, y); G.lineTo(x + 10, y - f); G.stroke(); }
    TR.fogRect(TR.tex.fog2, '#8a5a8a', 0.55, -400, 760, W + 800, 600, -t * 14, 0, 2.6);
    G.restore();
  };
})();
