// FLIPNOVA — build 47 🎬 the CINEMATIC boss fight: THE CRIMSON TYRANT painted in HD (the trailer's art) on two layers
// around the pixel game: #hdBack (the world + the Tyrant, under the pixel canvas) and #hdFront (embers, flashes, the name).
// The pixel canvas keeps everything you play against (you, the hazards, the telegraphs) and is cleared to see-through.
// The simulation is never touched: this file only READS the fight (boss.js calls FF.HDBoss.frame each frame).
// Perf: the Tyrant, his cracks and each world are baked once per screen size; a frame stamps a few images + sprite glows.
(function (FF) {
  'use strict';
  const HD = FF.HD;
  if (!HD) return;
  const { cl, seg, sm, eo, lerp, hs, pulse, rgba, mixc, TAU } = HD;
  const W = 1920, H = 1080, LX = 6;                 // trailer space: the 320x180 game, 6x
  const C = (FF.C || 36) * LX, F = (FF.F || 156) * LX;
  const BS = 0.6;                                    // the Tyrant's size in trailer space
  const MOUTH = [226 * LX, 64 * LX];                 // where boss.js fires its beam from: his mouth sits there
  const g = () => HD.ctx();

  // ---------------------------------------------------------------- the two layers
  let stage = null, back = null, front = null, bx = null, fx = null, k = 1, cw = 0, ch = 0, shown = false, drawn = false, gen = 0;
  function ensure() {
    if (back && back.isConnected) return true;
    stage = document.getElementById('stage'); const scr = document.getElementById('screen');
    if (!stage || !scr) return false;
    const mkC = (id) => { const c = document.createElement('canvas'); c.id = id; c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none'; return c; };
    back = mkC('hdBack'); front = mkC('hdFront');
    stage.insertBefore(back, scr); scr.after(front);
    try { if (document.fonts) document.fonts.load('900 60px Cinzel'); } catch (e) { /* the title falls back to a serif */ }
    bx = back.getContext('2d', { alpha: false }); fx = front.getContext('2d');
    return true;
  }
  function fit() {
    const r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round(r.width * Math.min(dpr, 1.25)); w = Math.max(320, Math.min(w, Q.level >= 1 ? 640 : 1024)); const h = Math.round(w * 9 / 16); // soft art: a modest backing store keeps phones at 60 fps
    if (w === cw && h === ch) return;
    cw = w; ch = h; back.width = front.width = w; back.height = front.height = h; k = w / W; gen++;   // a new size: everything re-bakes
  }
  let frontShown = false;
  function show(on) { if (shown !== on) { shown = on; back.style.display = on ? 'block' : 'none'; } }
  function showFront(on) { if (frontShown !== on) { frontShown = on; front.style.display = on ? 'block' : 'none'; } }

  // ---------------------------------------------------------------- THE CRIMSON TYRANT (trailer art, split into baked + live)
  const TY = {};
  function build() {
    if (TY.cape) return;
    const { smooth, poly, mirror, taper, bez } = HD;
    TY.cape = smooth([[-660, 600], [-620, 260], [-520, 60], [-330, -50], [0, -80], [330, -50], [520, 60], [620, 260], [660, 600], [0, 640]], true);
    TY.chest = poly([[-250, -50], [-236, 120], [-200, 300], [-130, 560], [130, 560], [200, 300], [236, 120], [250, -50], [140, -86], [0, -100], [-140, -86]]);
    TY.ab = [0, 1, 2].map((i) => poly([[-150 + i * 10, 250 + i * 72], [0, 226 + i * 72], [150 - i * 10, 250 + i * 72], [138 - i * 10, 294 + i * 72], [0, 272 + i * 72], [-138 + i * 10, 294 + i * 72]]));
    TY.neck = poly([[-120, -50], [-104, -160], [104, -160], [120, -50], [0, -24]]);
    const half = [[0, -462], [-34, -436], [-76, -398], [-112, -352], [-152, -306], [-140, -270], [-164, -222], [-196, -150], [-132, -178], [-116, -128], [-74, -88], [-32, -64], [0, -52]];
    TY.helm = poly(mirror(half).slice(0, -1));
    TY.brow = poly([[-158, -306], [-60, -286], [-14, -258], [0, -240], [14, -258], [60, -286], [158, -306], [150, -330], [60, -312], [0, -280], [-60, -312], [-150, -330]]);
    TY.sockL = poly([[-128, -296], [-56, -282], [-22, -254], [-40, -236], [-104, -246], [-132, -268]]);
    TY.sockR = poly([[128, -296], [56, -282], [22, -254], [40, -236], [104, -246], [132, -268]]);
    TY.mouth = poly([[-104, -184], [-52, -168], [0, -162], [52, -168], [104, -184], [86, -134], [44, -112], [0, -106], [-44, -112], [-86, -134]]);
    TY.teeth = [];
    for (let i = 0; i < 9; i++) { const x = -88 + i * 22, top = -180 + Math.abs(x) * 0.14, L = 26 + (i % 2) * 10 + (Math.abs(x) < 30 ? 6 : 0); TY.teeth.push(poly([[x - 9, top - 4], [x + 9, top - 4], [x + 1, top + L]])); }
    for (let i = 0; i < 7; i++) { const x = -66 + i * 22, bot = -114 - Math.abs(x) * 0.18, L = 22 + (i % 2) * 8; TY.teeth.push(poly([[x - 8, bot + 4], [x + 8, bot + 4], [x, bot - L]])); }
    TY.cheekL = poly([[-150, -262], [-108, -232], [-118, -190], [-176, -168]]);
    TY.cheekR = poly([[150, -262], [108, -232], [118, -190], [176, -168]]);
    TY.horns = [-1, 1].map((s) => { const c = bez([s * 104, -364], [s * 330, -400], [s * 430, -600], [s * 250, -790], 44); return { path: taper(c, 84, 3), c, s }; });
    TY.paul = [];
    [-1, 1].forEach((s) => {
      for (let i = 2; i >= 0; i--) {
        const cx = s * (300 + i * 26), cy = -10 + i * 64, hw = 196 - i * 20, P = (dx, dy) => [cx + s * dx, cy + dy];
        TY.paul.push({ path: poly([P(-hw, 34), P(-hw * 0.72, -46), P(-hw * 0.1, -98), P(hw * 0.7, -70), P(hw * 1.12, 6), P(hw * 0.62, 44), P(0, 30), P(-hw * 0.5, 46)]), cx, cy, hw, s, trim: [P(-hw, 34), P(-hw * 0.5, 46), P(0, 30), P(hw * 0.62, 44), P(hw * 1.12, 6)] });
      }
      for (let q = 0; q < 3; q++) { const bxx = s * (220 + q * 74), by = -100 + q * 10; TY.paul.push({ spike: true, path: poly([[bxx - 20, by + 24], [bxx + s * (36 + q * 46), by - 170 + q * 34], [bxx + 20, by + 16]]), bx: bxx, by }); }
    });
    TY.blade = poly([[456, 560], [404, -40], [412, -300], [440, -520], [470, -640], [500, -600], [556, -470], [566, -300], [580, -40], [530, 560]]);
    TY.edge = [[458, 540], [406, -40], [414, -300], [442, -520], [470, -636], [500, -598], [554, -470], [564, -300], [578, -40], [528, 540]];
    TY.notches = [[408, -200], [578, -120], [412, 30], [574, 180], [560, -380]];
    TY.guard = poly([[380, 590], [420, 560], [560, 560], [600, 590], [560, 610], [420, 610]]);
    TY.cracks = [];
    for (let i = 0; i < 14; i++) { let x = 0, y = 130, a = (i / 14) * TAU + hs(i) * 0.4; const pts = [[x, y]], n = 7 + Math.floor(hs(i + 4) * 7); for (let j = 0; j < n; j++) { a += (hs(i * 13 + j) - 0.5) * 0.9; const L = 18 + hs(i * 7 + j) * 26; x += Math.cos(a) * L; y += Math.sin(a) * L * 0.9; pts.push([x, y]); } TY.cracks.push(pts); }
  }
  // three parts, each baked twice (plain + lightning-lit): the BODY, the HEAD (pivots on the neck) and the SWORD
  // (pivots on its guard). fl = the lightning rim.
  const HEAD_PIV = [0, -110], SWORD_PIV = [490, 585];
  const BOUNDS = { body: [-680, -300, 680, 660], head: [-460, -820, 460, -30], sword: [360, -660, 620, 630], paulL: [-660, -320, -40, 150], paulR: [40, -320, 660, 150] };
  const PAUL_PIV = { paulL: [-330, -40], paulR: [330, -40] };
  function paintPart(part, fl) {
    const G = g(), BB = [-660, -800, 660, 640], lit = HD.lit, lin = HD.lin;
    const flashRim = (w) => ({ col: '#c8dcff', a: 0.95 * fl, ang: -Math.PI / 2 - 0.35, w: w || 9, blur: 14, span: 0.5 });
    const lava = (w, a) => ({ col: '#ff4a12', a: (a || 0.9) * 0.92, ang: Math.PI / 2, w: w || 12, blur: 18, span: 0.35 });
    const warm = { col: '#ff8a3a', a: 0.3, ang: Math.PI / 2 + 0.6, w: 26, blur: 30, span: 0.6 };
    if (part === 'sword') {
      lit(TY.blade, lin(430, 0, 552, 0, [[0, '#18161a'], [0.48, '#3a3438'], [0.52, '#121014'], [1, '#08070a']]), [flashRim(6), lava(6, 0.7)], [400, -640, 590, 560]);
      G.fillStyle = '#000'; TY.notches.forEach((n) => { G.beginPath(); G.arc(n[0], n[1], 16, 0, TAU); G.fill(); });
      lit(TY.guard, '#2a0a0c', [lava(4), flashRim(4)], [380, 560, 600, 610]);
      G.save(); G.globalCompositeOperation = 'lighter'; G.lineJoin = 'round'; G.shadowColor = '#ff5a10'; G.shadowBlur = 20 * HD.bakeScale;
      G.strokeStyle = rgba('#ff8a3a', 0.7); G.lineWidth = 4; G.beginPath(); TY.edge.forEach((p, i) => (i ? G.lineTo(p[0], p[1]) : G.moveTo(p[0], p[1]))); G.stroke(); G.restore();
      return;
    }
    if (part === 'body') {
      lit(TY.cape, lin(0, -60, 0, 600, [[0, '#120308'], [1, '#030001']]), [flashRim(12), lava(18, 0.5)], BB);
      lit(TY.chest, lin(0, -90, 0, 560, [[0, '#2e080d'], [0.5, '#170406'], [1, '#060102']]), [flashRim(8), lava(10), warm], BB);
      TY.ab.forEach((p) => lit(p, 'rgba(10,2,3,0.6)', [{ col: '#8a2a22', a: 0.65, ang: -Math.PI / 2, w: 3 }, lava(4, 0.6)], [-160, 220, 160, 460]));
      G.strokeStyle = rgba('#a02a2a', 0.4); G.lineWidth = 4; G.beginPath(); G.moveTo(0, -90); G.lineTo(0, 230); G.stroke();
      lit(TY.neck, '#080103', [lava(5, 0.5)], [-120, -160, 120, -24]);
      return;
    }
    if (part === 'paulL' || part === 'paulR') {
      const side = part === 'paulL' ? -1 : 1;
      TY.paul.forEach((p) => {
        if ((p.spike ? Math.sign(p.bx) : p.s) !== side) return;
        if (p.spike) { lit(p.path, lin(p.bx, p.by, p.bx, p.by - 170, [[0, '#1a0508'], [1, '#d9c49a']]), [flashRim(5), lava(5, 0.5)], [p.bx - 60, p.by - 190, p.bx + 160, p.by + 30]); return; }
        lit(p.path, lin(p.cx, p.cy - 98, p.cx, p.cy + 46, [[0, '#3e0b12'], [0.5, '#1c0508'], [1, '#080103']]), [flashRim(7), lava(8, 0.8), { col: '#ff9a5a', a: 0.14, ang: -Math.PI / 2, w: 5 }], [p.cx - p.hw * 1.1, p.cy - 100, p.cx + p.hw * 1.1, p.cy + 50]);
        G.strokeStyle = rgba('#b07a3a', 0.6); G.lineWidth = 5; G.beginPath(); p.trim.forEach((q, i) => (i ? G.lineTo(q[0], q[1] - 6) : G.moveTo(q[0], q[1] - 6))); G.stroke();
      });
      return;
    }
    // the head
    TY.horns.forEach((h) => {
      const a = h.c[0], b = h.c[h.c.length - 1];
      lit(h.path, lin(a[0], a[1], b[0], b[1], [[0, '#d9c6a0'], [0.45, '#8f7650'], [0.85, '#2a1c10'], [1, '#0a0604']]), [flashRim(8), { col: '#ff6a2a', a: 0.65, ang: Math.PI / 2 + h.s * 0.4, w: 10, blur: 14, span: 0.4 }], [Math.min(a[0], b[0]) - 80, b[1] - 40, Math.max(a[0], b[0]) + 140, a[1] + 60]);
      G.save(); G.clip(h.path); G.strokeStyle = 'rgba(20,12,6,0.6)'; G.lineWidth = 4;
      for (let i = 2; i < h.c.length - 4; i += 3) { const p = h.c[i], q = h.c[i + 1], an = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2; G.beginPath(); G.moveTo(p[0] - Math.cos(an) * 60, p[1] - Math.sin(an) * 60); G.quadraticCurveTo(p[0], p[1] - 10, p[0] + Math.cos(an) * 60, p[1] + Math.sin(an) * 60); G.stroke(); }
      G.restore();
    });
    lit(TY.helm, lin(-160, -462, 160, -52, [[0, '#4a0d14'], [0.5, '#22060a'], [1, '#090203']]), [flashRim(9), lava(7, 0.7), { col: '#ff7a3a', a: 0.22, ang: Math.PI / 2, w: 30, blur: 30, span: 0.8 }], [-196, -462, 196, -52]);
    G.strokeStyle = rgba('#d06060', 0.15 + 0.4 * fl); G.lineWidth = 6; G.beginPath(); G.moveTo(0, -452); G.lineTo(0, -290); G.stroke();
    [TY.cheekL, TY.cheekR].forEach((c) => lit(c, '#1a0408', [flashRim(4), lava(4, 0.6)], [-180, -270, 180, -160]));
    G.fillStyle = '#2a070b'; G.beginPath(); G.moveTo(-10, -250); G.lineTo(10, -250); G.lineTo(16, -196); G.lineTo(0, -184); G.lineTo(-16, -196); G.closePath(); G.fill();
    G.fillStyle = '#030000'; G.fill(TY.mouth);
    TY.teeth.forEach((p) => lit(p, lin(0, -190, 0, -100, [[0, '#d8c8a8'], [1, '#6a5a40']]), [{ col: '#ff7a30', a: 0.7, ang: Math.PI / 2, w: 3 }, flashRim(2)], [-110, -190, 110, -100]));
    lit(TY.brow, lin(0, -330, 0, -240, [[0, '#6a1820'], [1, '#22060a']]), [flashRim(5), { col: '#ff6a2a', a: 0.5, ang: Math.PI / 2, w: 4, blur: 8 }], [-158, -330, 158, -240]);
    G.fillStyle = '#010000'; G.fill(TY.sockL); G.fill(TY.sockR);
  }
  function paintCracks(grow) {
    const G = g();
    G.save(); G.clip(TY.chest); G.lineCap = 'round'; G.lineJoin = 'round'; G.globalCompositeOperation = 'lighter';
    TY.cracks.forEach((c, i) => {
      const gr = cl(grow * 1.6 - hs(i) * 0.4), n = Math.max(2, Math.floor(c.length * gr)); if (gr <= 0) return;
      G.beginPath(); for (let j = 0; j < n; j++) (j ? G.lineTo(c[j][0], c[j][1]) : G.moveTo(c[j][0], c[j][1]));
      G.shadowColor = '#ff5a10'; G.shadowBlur = 22 * HD.bakeScale; G.strokeStyle = 'rgba(255,106,26,0.85)'; G.lineWidth = 7; G.stroke();
      G.shadowBlur = 0; G.strokeStyle = 'rgba(255,224,160,0.9)'; G.lineWidth = 2.2; G.stroke();
    });
    G.restore();
  }
  let TB = null;
  // one bake per call (prebake spreads them over the dark intro); returns TB once complete
  function bakeStep() {
    build(); HD.initTex();
    if (!TB || TB.gen !== gen) TB = { gen, done: false };
    if (TB.done) return false;
    const s = k * BS, grunge = [{ tex: HD.tex.fog, col: '#000000', a: 0.45, scale: 0.9 }, { tex: HD.tex.wisp, col: '#ff6a40', a: 0.12, scale: 0.6, ox: 60 }];
    for (const part of ['body', 'paulL', 'paulR', 'head', 'sword']) {
      const b = BOUNDS[part];
      if (!TB[part]) { TB[part] = HD.bake(b[0], b[1], b[2], b[3], s, () => paintPart(part, 0), grunge); return true; }
      if (!TB[part + 'F']) { TB[part + 'F'] = HD.bake(b[0], b[1], b[2], b[3], s, () => paintPart(part, 1), grunge); return true; }
      if (!TB[part + 'W']) { TB[part + 'W'] = HD.silhouette(TB[part], '#ffffff'); return true; }
    }
    if (!TB.cracks) TB.cracks = [];
    if (TB.cracks.length < 4) { const q = [0.3, 0.55, 0.8, 1][TB.cracks.length]; TB.cracks.push(HD.bake(-260, -110, 260, 570, s, () => paintCracks(q))); return true; }
    if (!TB.whole) { const c = HD.mk((1380) * s, (1480) * s), x = c.getContext('2d'); [['sword'], ['body'], ['paulL'], ['paulR'], ['head']].forEach((q) => { const b = BOUNDS[q[0]]; x.drawImage(TB[q[0]], (b[0] + 680) * s, (b[1] + 820) * s); }); c.__b = [-680, -820, 700, 660]; TB.whole = c; return true; }
    TB.done = true; return false;
  }
  function bakeTyrant() { while (bakeStep()) { /* finish whatever is missing */ } return TB; }

  // ---------------------------------------------------------------- the worlds (one baked backdrop per dimension)
  const PAL = {
    citadel: { sky: ['#12030a', '#5a0a10', '#d8380c'], sun: ['#000000', '#ff6a1a', '#ffd27a'], fog: '#6a1410', fog2: '#2a0608', glow: '#ff3a08', mtn: '#0a0204', mtn2: '#030001', slab: ['#1a0a0c', '#060203'], edge: '#ff6a2a', bolt: '#9fb8ff', emb: ['#ff7a2a', '#ffb04a', '#ff4a1a'], storm: 1 },
    mirror: { sky: ['#040a1e', '#14306a', '#3a8ad8'], sun: ['#dff4ff', '#7fd0ff', '#ffffff'], fog: '#2a4a8a', fog2: '#0e1a3a', glow: '#4a9aff', mtn: '#04060e', mtn2: '#010206', slab: ['#0e1426', '#03050c'], edge: '#7fe8ff', bolt: '#cfeaff', emb: ['#9ff0ff', '#c8e8ff', '#5ab8ff'], storm: 0.6, shards: 1 },
    shatter: { sky: ['#0e0a06', '#4a3410', '#d8a040'], sun: ['#fff2c8', '#ffd27a', '#ffffff'], fog: '#7a6030', fog2: '#3a2a10', glow: '#ffc060', mtn: '#0a0806', mtn2: '#040302', slab: ['#1e180e', '#080604'], edge: '#ffd27a', bolt: '#fff2c8', emb: ['#ffe6b0', '#ffd27a', '#fff6e0'], storm: 0.4, clock: 1 },
    collapse: { sky: ['#140204', '#6a0808', '#ff4a0a'], sun: ['#2a0000', '#ff2a0a', '#ffb050'], fog: '#7a1408', fog2: '#2a0404', glow: '#ff5a10', mtn: '#050000', mtn2: '#020000', slab: ['#1e0806', '#070101'], edge: '#ff8a3a', bolt: '#ffb070', emb: ['#ff8a3a', '#ffd27a', '#ff3a10'], storm: 1.4 }
  };
  const scenes = {};
  function mountains(G, base, seed, col, amp, glowCol) {
    const pts = [[-100, H + 50]];
    for (let x = -100; x <= W + 100; x += 90) pts.push([x, base - (hs(Math.floor(x / 90) + seed) * 110 + (hs(Math.floor(x / 270) + seed) > 0.6 ? 150 : 0)) * amp]);
    pts.push([W + 100, H + 50]);
    const p = HD.poly(pts);
    G.save(); G.shadowColor = rgba(glowCol, 0.55); G.shadowBlur = 40 * HD.bakeScale; G.fillStyle = col; G.fill(p); G.restore();
  }
  function scene(id) {
    const P = PAL[id] || PAL.citadel, key = id + ':' + gen;
    if (scenes[key]) return scenes[key];
    HD.initTex();
    const img = HD.bake(0, 0, W, H, k, () => {
      const G = g();
      G.fillStyle = HD.lin(0, 0, 0, H, [[0, P.sky[0]], [0.55, P.sky[1]], [1, P.sky[2]]]); G.fillRect(0, 0, W, H);
      if (P.clock) { G.save(); G.translate(W * 0.62, H * 0.42); G.strokeStyle = rgba(P.edge, 0.18); for (let r = 220; r < 900; r += 140) { G.lineWidth = 3; G.beginPath(); G.arc(0, 0, r, 0, TAU); G.stroke(); for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; G.lineWidth = i % 5 ? 2 : 5; G.beginPath(); G.moveTo(Math.cos(a) * (r - 18), Math.sin(a) * (r - 18)); G.lineTo(Math.cos(a) * r, Math.sin(a) * r); G.stroke(); } } G.restore(); }
      HD.glow(W * 0.62, H + 120, 1200, P.glow, 0.5, 'source-over');
      // the sun behind him: an eclipse with a corona of fire (or a pale moon / a golden clock sun)
      const sx = 1320, sy = 400, sr = 230;
      HD.glow(sx, sy, sr * 4.2, P.sun[1], 0.55); HD.glow(sx, sy, sr * 2.1, P.sun[2], 0.45);
      G.save(); G.globalCompositeOperation = 'lighter'; G.translate(sx, sy);
      for (let i = 0; i < 64; i++) { const a = i / 64 * TAU + hs(i) * 0.05, L = sr * (1.25 + hs(i + 7) * 0.9), w = 0.025 + hs(i + 3) * 0.03; G.fillStyle = HD.lin(0, 0, Math.cos(a) * L, Math.sin(a) * L, [[0, rgba(P.sun[2], 0.55)], [0.5, rgba(P.sun[1], 0.25)], [1, 'rgba(0,0,0,0)']]); G.beginPath(); G.moveTo(Math.cos(a - w) * sr * 0.95, Math.sin(a - w) * sr * 0.95); G.lineTo(Math.cos(a) * L, Math.sin(a) * L); G.lineTo(Math.cos(a + w) * sr * 0.95, Math.sin(a + w) * sr * 0.95); G.closePath(); G.fill(); }
      G.restore();
      G.fillStyle = HD.rad(sx - sr * 0.3, sy - sr * 0.3, 0, sr * 1.05, [[0, mixc(P.sun[0], '#ffffff', 0.08)], [1, P.sun[0]]]); G.beginPath(); G.arc(sx, sy, sr, 0, TAU); G.fill();
      G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba(P.sun[2], 0.9); G.lineWidth = 6; G.shadowColor = P.sun[1]; G.shadowBlur = 30 * HD.bakeScale; G.beginPath(); G.arc(sx, sy, sr, 0, TAU); G.stroke(); G.restore();
      mountains(G, 820, 11, P.mtn, 1.0, P.glow); mountains(G, 900, 23, P.mtn2, 0.6, P.glow);
      // the lane: a ceiling and a floor of dark stone, their edges catching the light
      [[0, C, -1], [F, H, 1]].forEach((s) => {
        G.fillStyle = HD.lin(0, s[0], 0, s[1], s[2] > 0 ? [[0, P.slab[0]], [1, P.slab[1]]] : [[0, P.slab[1]], [1, P.slab[0]]]); G.fillRect(0, s[0], W, s[1] - s[0]);
        G.strokeStyle = 'rgba(0,0,0,0.35)'; G.lineWidth = 3; for (let x = 0; x < W; x += 120) { G.beginPath(); G.moveTo(x + (s[2] > 0 ? 0 : 60), s[0]); G.lineTo(x + (s[2] > 0 ? 0 : 60), s[1]); G.stroke(); }
        const ey = s[2] > 0 ? s[0] : s[1];
        G.save(); G.shadowColor = P.edge; G.shadowBlur = 18 * HD.bakeScale; G.fillStyle = rgba(P.edge, 0.85); G.fillRect(0, ey - 3, W, 6); G.restore();
      });
      const vg = G.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.08); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); G.fillStyle = vg; G.fillRect(0, 0, W, H);
    }, [{ tex: HD.tex.fog, col: '#000000', a: 0.25, scale: 1.2 }]);
    scenes[key] = img; return img;
  }

  // everything this fight will need, baked one piece per frame during the (dark) intro: no hitch later
  function prebake() {
    if (bakeStep()) return true;
    for (const id of ['citadel', 'mirror', 'shatter', 'collapse']) if (!scenes[id + ':' + gen]) { scene(id); return true; }
    return false;
  }
  // ---------------------------------------------------------------- per-frame painting
  const TITLE = { t0: -9, en: '', ar: '', col: '#ff5a2a' };
  let lastIntro = -1, rtNow = 0;
  function drawWorld(f, rt, id, fromId, wk) {
    const G = g(), P = PAL[id] || PAL.citadel;
    if (SKIP.world) return 0;
    // the backdrop + its drifting storm clouds are composed into one buffer 15 times a second (the clouds are slow),
    // and that buffer is stamped every frame (a touch oversized: a shake never shows an edge)
    const tick = Math.floor(rt * 15), wkey = id + '|' + (fromId || '') + '|' + Math.round(wk * 12) + '|' + gen + '|' + Q.level;
    if (!wbuf || wbuf.width !== cw || wbuf.height !== ch) { wbuf = HD.mk(cw, ch); wbx = wbuf.getContext('2d', { alpha: false }); wTick = -1; }
    if (tick !== wTick || wkey !== wKey) {
      wTick = tick; wKey = wkey;
      wbx.setTransform(cw / W, 0, 0, ch / H, 0, 0); HD.setCtx(wbx);
      wbx.drawImage(scene(id), 0, 0, W, H);
      if (fromId && fromId !== id && wk < 1) { wbx.globalAlpha = 1 - sm(wk); wbx.drawImage(scene(fromId), 0, 0, W, H); wbx.globalAlpha = 1; }
      if (!SKIP.fog && Q.level < 1) {
        if (!atm) { atm = HD.mk(240, 135); atx = atm.getContext('2d'); }
        atx.setTransform(1, 0, 0, 1, 0, 0); atx.clearRect(0, 0, 240, 135); atx.setTransform(240 / W, 0, 0, 135 / H, 0, 0);
        HD.setCtx(atx); HD.fog(HD.tex.fog, P.fog, 0.45, -rt * 30, -rt * 8, 6, W, H); HD.fog(HD.tex.fog2, P.fog2, 0.4, rt * 22, 40, 4.5, W, H);
        wbx.drawImage(atm, 0, 0, W, H);
      }
      HD.setCtx(G);
    }
    G.drawImage(wbuf, -24, -14, W + 48, H + 28);
    // a phase change burns the old world away: the new one is already behind the wall of fire
    if (f.mode === 'trans' && !f.shift) {
      const el = f.t - f.modeT0, wx = lerp(W + 420, -520, sm(seg(el, 0.7, 1.9)));
      if (el > 0.7 && el < 2.0) {
        if (fromId && fromId !== id && wx > -300) { G.save(); G.beginPath(); G.rect(-30, -20, wx + 30, H + 40); G.clip(); G.drawImage(scene(fromId), -24, -14, W + 48, H + 28); G.restore(); }
        G.save(); G.globalCompositeOperation = 'lighter';
        G.fillStyle = HD.lin(wx - 260, 0, wx + 260, 0, [[0, 'rgba(255,60,10,0)'], [0.35, 'rgba(255,90,20,0.55)'], [0.5, 'rgba(255,230,170,0.9)'], [0.65, 'rgba(255,120,30,0.55)'], [1, 'rgba(255,60,10,0)']]); G.fillRect(wx - 260, -20, 520, H + 40);
        for (let i = 0; i < 14; i++) { const yy = (i / 13) * H, j = Math.sin(rtNow * 18 + i * 1.7) * 60; HD.glow(wx + j - 40, yy, 170 + 60 * hs(i), i % 3 ? '#ff6a1a' : '#ffd27a', 0.55); }
        G.restore();
        HD.glow(wx, H / 2, 900, '#ff4a10', 0.35);
      }
    }
    if (P.shards) for (let i = 0; i < 12; i++) { const x = (hs(i + 5) * W * 1.2 - rt * (20 + hs(i) * 40)) % (W + 200), xx = x < -100 ? x + W + 200 : x, y = C + 40 + hs(i + 9) * (F - C - 80), s = 26 + hs(i + 3) * 40; G.save(); G.translate(xx, y); G.rotate(rt * 0.3 + i); G.fillStyle = rgba('#9ff0ff', 0.08); G.strokeStyle = rgba('#cfeaff', 0.3); G.lineWidth = 2; G.beginPath(); G.moveTo(0, -s); G.lineTo(s * 0.6, s * 0.4); G.lineTo(-s * 0.5, s * 0.6); G.closePath(); G.fill(); G.stroke(); G.restore(); }
    // storms: a bolt every few seconds (more in the last phase)
    const per = 3.2 / (P.storm * (1 + f.phase * 0.5)), n = Math.floor(rt / per), at = n * per + hs(n) * per * 0.4, a = pulse(rt, at, 0.1) * (rt - at < 0.5 ? 1 : 0);
    if (a > 0.02 && !reduce) { const sx = 200 + hs(n * 3) * 1500; HD.drawBolt(HD.bolt(sx, -20, sx + (hs(n * 5) - 0.5) * 500, C + 100 + hs(n) * 300, n * 17, 60), P.bolt, a); }
    return a;
  }
  let reduce = false;
  // his state this frame: where he is, how lit, how angry (one object, reused)
  const ST = {}, SKIP = {}, BRK = { paulL: { t: -1 }, paulR: { t: -1 } };
  let unboundSaid = false, curF = null;
  let wbuf = null, wbx = null, wTick = -1, wKey = '';
  // the quality governor: a phone that can't keep up gets a lighter picture, then the pixel fight (never a laggy one)
  const Q = { level: 0, acc: 0, n: 0, last: 0, slow: 0 };
  function tyrantState(f, bolt) {
    const t = f.t, A = f.anim || { kind: 'idle', hits: [] }, mode = f.mode, el = t - (f.modeT0 || 0), bs = f.bossScreen();
    const s = ST; s.dmg = 1 - f.hp / f.hpMax; s.ph = f.phase || 0; s.A = A;
    s.sc = BS * (f.hdScale || 1); s.flipX = !!f.hdFlip; s.x = f.hdX !== undefined ? f.hdX : MOUTH[0] + (bs[0] - 262) * LX; s.y = f.hdY !== undefined ? f.hdY : MOUTH[1] + 140 * BS + (bs[1] - ((FF.C + FF.F) / 2 - 6)) * LX; s.rot = 0; s.alpha = 1; s.lit = 1; s.ign = 1; s.white = 0; s.flash = bolt * 0.7;
    s.tele = A.kind !== 'idle' && A.tl !== undefined && t >= A.t0 && t < A.tl; s.tk = s.tele ? seg(t, A.t0, A.tl) : 0;
    [['paulL', 0.42], ['paulR', 0.7]].forEach((q) => { const br = BRK[q[0]]; if (s.dmg >= q[1] && br.t < 0) { br.t = rtNow; br.fresh = true; } else if (s.dmg < q[1] - 0.02) br.t = -1; });
    // UNBOUND: the last of him is fire
    s.unb = f.hdUnb !== undefined ? f.hdUnb : cl((s.dmg - 0.84) / 0.06);
    if (s.tele) { s.sc *= 1 + 0.03 * s.tk; s.rot = -0.03 * s.tk; }
    if ((A.hits || []).some((h) => t >= h - 0.08 && t < h + 0.25)) { s.sc *= 1.05; s.x -= 50 * (s.flipX ? -1 : 1); s.rot = 0.04; }
    s.white = pulse(t, f.hitT, 0.045) * 0.4; if (t - f.hitT < 0.3) { const q = 1 - (t - f.hitT) / 0.3; s.x += 40 * q; s.rot += 0.05 * q; }
    s.sc *= 1 + Math.sin(rtNow * 2.4) * 0.008;
    if (mode === 'intro') {
      const full = f.introLen > 2, L = f.introLen, d0 = full ? 0.9 : 0.25, s1 = pulse(el, full ? 0.3 : 0.05, 0.1) + pulse(el, full ? 0.55 : 0.12, 0.08);
      s.lit = sm(seg(el, d0, d0 + 0.5)); s.ign = sm(seg(el, d0, d0 + 0.7)); s.flash = Math.max(s.flash, cl(s1 * 1.3)); s.alpha = Math.max(s.lit, cl(s1 * 1.2));
      if (lastIntro !== f.modeT0) { lastIntro = f.modeT0; TITLE.t0 = rtNow + (d0 + 0.35) - el; TITLE.en = 'THE CRIMSON TYRANT'; TITLE.ar = 'الطاغية القرمزي'; TITLE.col = '#ff5a2a'; TITLE.sub = ''; TITLE.size = 104; TITLE.len = full ? L - d0 : 1.0; }
    } else if (mode === 'trans') { s.ign = 1 + 0.6 * Math.sin(seg(el, 0, 1.4) * Math.PI); s.flash = Math.max(s.flash, pulse(el, 0.05, 0.12)); }
    else if (mode === 'dying') { const k2 = seg(el, 0, 3.4); s.x += Math.sin(t * 60) * 12 * Math.min(1, el); s.y += el * el * 60; s.rot += Math.sin(t * 9) * 0.04; s.ign = 1 + k2 * 2; s.white = Math.max(s.white, k2 > 0.55 ? (k2 - 0.55) * 2.2 : 0); s.alpha = 1 - seg(el, 2.4, 3.3); }
    else if (mode === 'reward' || mode === 'won') s.alpha = 0;
    return s;
  }
  // the RIG: how his head and sword move this frame (wind-ups, swings with light trails, slams, roars, the fall)
  const RIG = { hr: 0, hx: 0, hy: 0, sr: 0, sx: 0, sy: 0, front: false, trail: null, sglow: 0, gcol: '#ff3a10', roar: 0 };
  function rig(f, st) {
    const R = RIG, t = f.t, A = st.A, mode = f.mode, el = t - (f.modeT0 || 0), kind = A.kind, hits = A.hits || [];
    R.hr = Math.sin(rtNow * 1.3) * 0.02; R.hx = 0; R.hy = Math.sin(rtNow * 2.4) * 4; R.sr = Math.sin(rtNow * 1.1) * 0.03; R.sx = 0; R.sy = 0; R.front = false; R.trail = null; R.sglow = 0; R.gcol = '#ff3a10'; R.roar = 0;
    if (st.tele) { R.hr += 0.06 * st.tk; R.hy += 12 * st.tk; }
    const hk = t - f.hitT; if (hk >= 0 && hk < 0.35) { const q = 1 - hk / 0.35; R.hr -= 0.12 * q; R.hy -= 10 * q; }
    if (mode === 'trans') R.roar = Math.sin(seg(el, 0, 1.6) * Math.PI);
    if (mode === 'intro') { const d0 = f.introLen > 2 ? 0.9 : 0.25; R.roar = Math.sin(seg(el, d0, d0 + 1.2) * Math.PI); }
    if (R.roar > 0) { R.hr -= 0.16 * R.roar; R.hy -= 26 * R.roar; }
    if (kind === 'beam') {
      if (st.tele) { R.hr -= 0.1 * st.tk; R.hy -= 10 * st.tk; }
      else if (hits.length && t >= hits[0] && t < hits[0] + 1.0) { R.hr += 0.08; R.hy += 14; }
    } else if (kind === 'slash' || kind === 'mirror' || kind === 'cleave' || kind === 'pillar' || kind === 'shard') {
      const big = kind === 'cleave';
      if (st.tele) {
        const u = sm(st.tk);
        if (kind === 'pillar') { R.sy = -90 * u; R.sr = 0.05 * u; }
        else if (kind === 'shard') { R.sr = -0.25 * u; R.sy = -60 * u; R.sglow = u; R.gcol = '#ffd27a'; }
        else { R.sr = (big ? 0.6 : 0.35) * u; R.sglow = big ? u : 0.5 * u; if (kind === 'mirror') R.gcol = '#7fe8ff'; }
      }
      let i = -1; for (let j = 0; j < hits.length; j++) if (t >= hits[j] - 0.07) i = j;
      if (i >= 0) {
        const h = hits[i];
        if (kind === 'pillar') { const u = seg(t, h - 0.07, h + 0.03); R.sy = lerp(-90, 90, eo(u)); R.sr = 0.05; if (t > h + 0.2) R.sy = lerp(90, 0, sm(seg(t, h + 0.2, h + 0.6))); }
        else if (kind === 'shard') { const r = seg(t, h + 0.2, h + 0.6); R.sr = lerp(-0.25, 0, sm(r)); R.sy = lerp(-60, 0, sm(r)); R.sglow = 1 - r; R.gcol = '#ffd27a'; }
        else {
          const lo = big ? -2.4 : -1.9, hi = big ? 0.6 : 0.35, from = i % 2 ? lo : hi, to = i % 2 ? hi : lo, u = seg(t, h - 0.07, h + 0.07);
          R.sr = lerp(from, to, eo(u)); R.front = true;
          if (u > 0 && u < 1) R.trail = [0.2, 0.45, 0.7].map((q) => lerp(from, R.sr, q));
          const next = hits[i + 1];
          if (t > h + 0.07 && !(next !== undefined && t >= next - 0.3)) { R.sr = lerp(to, 0, sm(seg(t, h + 0.15, h + 0.55))); R.front = R.sr < -0.3; }
          R.sglow = Math.max(R.sglow, (1 - seg(t, h, h + 0.4)) * (big ? 1 : 0.6)); if (kind === 'mirror') R.gcol = '#7fe8ff';
        }
      }
    }
    if (mode === 'dying') { const q = seg(el, 0.3, 1.4), hq = seg(el, 1.6, 2.6); R.sr = lerp(0, 1.4, q * q * q); R.sy = 220 * q * q; R.front = false; R.hr = -0.1 + Math.sin(rtNow * 7) * 0.05 * (1 - q) + 0.5 * hq * hq; R.hy = 380 * hq * hq; R.hx = -60 * hq; }
    return R;
  }
  function part(img, piv, rot, dx, dy, a, op) { if (!img || !(a > 0.004)) return; const G = g(); G.save(); G.translate(piv[0] + dx, piv[1] + dy); G.rotate(rot); G.translate(-piv[0], -piv[1]); HD.stamp(img, a, op); G.restore(); }
  // paint him at (x,y) with size sc: the baked parts on the rig, then everything alive on them
  function paintAt(st, x, y, sc, rot, full) {
    const G = g(), T = bakeTyrant(), A = st.A, R = st.R || RIG;
    G.save(); G.translate(x, y); G.rotate(rot); G.scale(st.flipX ? -sc : sc, sc);
    if (full) HD.glow(0, -200, 780, '#ff3a10', (0.22 + 0.12 * st.ph) * st.ign * st.alpha);
    const pa = G.globalAlpha; G.globalAlpha = pa * st.alpha;
    const lit = st.lit < 1 ? Math.max(st.lit, 0) : 1, white = st.white;
    const sword = () => {
      if (R.trail) R.trail.forEach((a2, i) => part(T.swordF, SWORD_PIV, a2, R.sx, R.sy, 0.14 + 0.1 * i, 'lighter'));
      part(T.sword, SWORD_PIV, R.sr, R.sx, R.sy, lit); part(T.swordF, SWORD_PIV, R.sr, R.sx, R.sy, st.flash);
      if (R.sglow > 0.02) { G.save(); G.translate(SWORD_PIV[0] + R.sx, SWORD_PIV[1] + R.sy); G.rotate(R.sr); for (let i = 1; i <= 6; i++) HD.glow(-20 * i / 6, -1200 * i / 6.2, 120, R.gcol, 0.5 * R.sglow); G.restore(); }
      part(T.swordW, SWORD_PIV, R.sr, R.sx, R.sy, white, 'lighter');
    };
    if (!R.front) sword();
    HD.stamp(T.body, lit); HD.stamp(T.bodyF, st.flash);
    // the shoulders: whole, or torn off (flying away, then a molten wound where they were)
    for (const pn of ['paulL', 'paulR']) {
      const br = BRK[pn], pv = PAUL_PIV[pn], sd = pn === 'paulL' ? -1 : 1;
      if (br.t < 0) { HD.stamp(T[pn], lit); HD.stamp(T[pn + 'F'], st.flash); HD.stamp(T[pn + 'W'], white, 'lighter'); continue; }
      const e = rtNow - br.t;
      HD.glow(pv[0], pv[1] + 20, 260, '#ff5a10', 0.55 * (0.85 + 0.15 * Math.sin(rtNow * 8 + sd))); HD.glow(pv[0], pv[1] + 20, 90, '#ffd27a', 0.7);
      if (e < 1.4) {
        const q = e / 1.4, dx = sd * (500 * e + 120 * e * e), dy = -420 * e + 900 * e * e;
        G.save(); G.translate(pv[0] + dx, pv[1] + dy); G.rotate(sd * e * 5); G.translate(-pv[0], -pv[1]); HD.stamp(T[pn], 1 - q); HD.stamp(T[pn + 'W'], Math.max(0, 0.8 - e * 3), 'lighter'); G.restore();
        for (let i = 0; i < 16; i++) { const a = hs(i + (sd > 0 ? 50 : 0)) * TAU, d = e * (300 + hs(i + 3) * 700); HD.glow(pv[0] + Math.cos(a) * d, pv[1] + Math.sin(a) * d + e * e * 400, 30 * (1 - q) + 6, '#ffb050', 0.9 * (1 - q)); }
      }
    }
    const cs = Math.min(3, Math.floor(st.dmg * 4.2) + (st.dying ? 3 : 0));
    if (st.dmg > 0.08 || st.dying) HD.stamp(T.cracks[cs], (0.65 + 0.35 * Math.sin(rtNow * 9)) * cl(st.ign), 'lighter');
    const core = cl(st.ign) * (0.85 + 0.15 * Math.sin(rtNow * 5.5)) * (1 + 0.5 * st.dmg);
    HD.glow(0, 130, 280 * core, '#ff4a10', 0.6 * core); HD.glow(0, 130, 90, '#ffd080', 0.85 * core); HD.disc(0, 130, 22 * cl(core) + 3, rgba('#fff4d0', cl(core)));
    HD.stamp(T.bodyW, white, 'lighter');
    // the head, on its neck
    G.save(); G.translate(HEAD_PIV[0] + R.hx, HEAD_PIV[1] + R.hy); G.rotate(R.hr); G.translate(-HEAD_PIV[0], -HEAD_PIV[1]);
    HD.stamp(T.head, lit); HD.stamp(T.headF, st.flash);
    const fire = cl(st.ign) * (0.55 + 0.45 * st.tk + (A.kind === 'beam' && st.tele ? 0.6 : 0) + R.roar * 0.8) * (0.85 + 0.15 * Math.sin(rtNow * 13));
    G.save(); G.clip(TY.mouth); HD.glow(0, -140, 130, '#ff5a10', 0.9 * cl(fire)); HD.glow(0, -140, 60, '#ffd27a', cl(fire)); G.restore();
    if (fire > 1.05) HD.glow(0, -140, 200 * (fire - 0.6), '#ff6a20', 0.5 * cl(fire - 1));
    const eye = cl(st.ign * 1.2) * (0.85 + 0.15 * Math.sin(rtNow * 23) * Math.sin(rtNow * 7)) * (1 + 0.8 * st.tk + 0.6 * R.roar);
    [-1, 1].forEach((sd) => {
      const ex = sd * 74, ey = -262;
      HD.glow(ex, ey, 260 * Math.min(1.6, eye), st.unb > 0.5 ? '#ffb050' : '#ff3a08', 0.5 * Math.min(1, eye)); HD.glow(ex, ey, 80, st.unb > 0.5 ? '#ffffff' : '#ffb050', 0.95 * Math.min(1, eye));
      G.save(); G.clip(sd < 0 ? TY.sockL : TY.sockR); HD.glow(ex, ey, 70, '#ffffff', Math.min(1, eye)); G.restore();
      if (eye > 0.4) { G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffcf8a', 0.4 * Math.min(1, eye)); G.lineWidth = 3; G.beginPath(); G.moveTo(ex - sd * (170 + 80 * st.tk), ey + 6); G.lineTo(ex + sd * (170 + 80 * st.tk), ey - 10); G.stroke(); G.restore(); }
    });
    if (full) for (let i = 0; i < 14; i++) { const q = ((rtNow * 0.7 + hs(i)) % 1), sx = (hs(i + 2) - 0.5) * 120 + Math.sin(rtNow * 2 + i) * 20 * q, sy = -130 - q * 260; HD.glow(sx, sy, 26 * (1 - q) + 6, '#ff6a20', 0.35 * cl(st.ign) * (1 - q)); }
    const fuel = cl(st.ign, 0, 2) * (1 + 0.25 * st.ph + 0.5 * R.roar);
    G.save(); G.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const fx0 = (i - 4) * 24, base = -440 + Math.abs(i - 4) * 12, h = (120 + hs(i) * 150) * fuel * (0.8 + 0.25 * Math.sin(rtNow * (9 + i) + i * 2)), sway = Math.sin(rtNow * 5 + i) * 18 * fuel, w = 24 + hs(i + 3) * 14;
      if (h < 4) continue;
      const p = new Path2D(); p.moveTo(fx0 - w, base); p.bezierCurveTo(fx0 - w, base - h * 0.4, fx0 + sway - 8, base - h * 0.7, fx0 + sway, base - h); p.bezierCurveTo(fx0 + sway + 8, base - h * 0.7, fx0 + w, base - h * 0.4, fx0 + w, base); p.closePath();
      G.fillStyle = HD.lin(fx0, base, fx0, base - h, [[0, 'rgba(255,216,144,0.3)'], [0.3, 'rgba(255,160,64,0.5)'], [0.65, 'rgba(255,74,16,0.4)'], [1, 'rgba(120,10,0,0)']]); G.fill(p);
    }
    G.restore();
    HD.glow(0, -500, 300 * fuel, '#ff6a20', 0.28 * Math.min(1, fuel));
    HD.stamp(T.headW, white, 'lighter');
    G.restore();
    if (R.front) sword();
    G.globalAlpha = pa; G.restore();
  }
  // the dark doubles: the shadow kings of phase 3 and the glass reflection of the MIRROR VOID
  let shadowS = null;
  function fxLive(f, id) { for (const e of f.fxl || []) if (e.id === id && f.t >= e.t0 && f.t - e.t0 <= e.len) return f.t - e.t0; return -1; }
  function drawTyrant(f, rt, bolt) {
    if (SKIP.tyrant) return null;
    const st = tyrantState(f, bolt); st.dying = f.mode === 'dying';
    if (st.alpha <= 0.01) return null;
    const T = bakeTyrant(), G = g();
    if (!shadowS || shadowS.gen !== gen) { shadowS = { gen, dark: HD.silhouette(T.whole, '#120008'), glass: HD.silhouette(T.whole, '#7fe8ff') }; }
    const sc0 = fxLive(f, 'shadowClones');
    if (sc0 >= 0) [[-1, -340], [1, 300]].forEach((q, i) => { G.save(); G.translate(st.x + q[1] + Math.sin(rtNow * 1.3 + i) * 30, st.y - 40); G.scale(st.sc * 0.78, st.sc * 0.78); HD.stamp(shadowS.dark, 0.85 * cl(sc0 * 2)); HD.glow(-74, -262, 70, '#ff2a2a', 0.8); HD.glow(74, -262, 70, '#ff2a2a', 0.8); G.restore(); });
    const me = fxLive(f, 'mirrorEcho');
    if (me >= 0) { G.save(); G.translate(st.x + 420 + Math.sin(me * 6) * 18, st.y + 20); G.scale(-st.sc, st.sc); HD.stamp(shadowS.glass, 0.35 * cl(me * 3)); HD.stamp(T.whole, 0.25 * cl(me * 3)); G.restore(); }
    st.R = rig(f, st);
    for (const pn of ['paulL', 'paulR']) if (BRK[pn].fresh) { BRK[pn].fresh = false; if (f.g && f.g.sfx) f.g.sfx('shatter'); }
    if (st.unb > 0) {
      st.ign = Math.max(st.ign, 1 + 0.5 * st.unb);
      const G2 = g(); G2.save(); G2.translate(st.x, st.y); G2.scale(st.sc, st.sc);
      for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.05 + 0.9 * (i / 17)), r = 520 + Math.sin(rtNow * 6 + i * 2) * 40, fx2 = Math.cos(a) * r * 1.05, fy2 = -120 + Math.sin(a) * r * 0.95; HD.glow(fx2, fy2, 220 + 80 * Math.sin(rtNow * 9 + i), i % 3 ? '#ff5a10' : '#ffd27a', 0.35 * st.unb); }
      G2.restore();
      if (!unboundSaid && f.hdUnb === undefined && f.mode === 'fight' && st.unb >= 1) { unboundSaid = true; FF.HDBoss.title('THE TYRANT UNBOUND', 'HIS LAST FIRE', '#ff8a3a', 2.2); if (f.g && f.g.sfx) f.g.sfx('bossRoar'); }
    } else if (st.dmg < 0.5) unboundSaid = false;
    paintAt(st, st.x, st.y, st.sc, st.rot, true);
    if (f.mode === 'dying') dyingLight(f, st);
    drawHazards(f);
    return { x: st.x, y: st.y, sc: st.sc };
  }
  function dyingLight(f, st) {
    const G = g(), el = f.t - f.modeT0, k2 = seg(el, 0.2, 2.6);
    G.save(); G.translate(st.x, st.y + 130 * st.sc); G.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const a = hs(i + 7) * TAU, L = (900 + hs(i) * 900) * k2, w = 0.04 + 0.04 * hs(i + 2), on = el > 0.2 + hs(i + 9) * 1.4;
      if (!on) continue;
      G.fillStyle = HD.lin(0, 0, Math.cos(a) * L, Math.sin(a) * L, [[0, 'rgba(255,240,200,0.9)'], [0.4, 'rgba(255,170,60,0.45)'], [1, 'rgba(255,90,20,0)']]);
      G.beginPath(); G.moveTo(0, 0); G.lineTo(Math.cos(a - w) * L, Math.sin(a - w) * L); G.lineTo(Math.cos(a + w) * L, Math.sin(a + w) * L); G.closePath(); G.fill();
    }
    G.restore();
    const boom = seg(el, 2.4, 3.3);
    if (boom > 0) { HD.glow(st.x, st.y, 1400 * boom, '#ffd27a', 0.9 * (1 - boom)); for (let i = 0; i < 40; i++) { const a = hs(i) * TAU, d = boom * (300 + hs(i + 5) * 1400); HD.glow(st.x + Math.cos(a) * d, st.y + Math.sin(a) * d * 0.7, 40 * (1 - boom) + 8, i % 2 ? '#ff6a1a' : '#ffd27a', 0.9 * (1 - boom)); } }
  }
  // every hazard gets light: warnings glow where they will strike; geysers, blades of light, rivers of fire, frost
  function drawHazards(f) {
    const G = g(), t = f.t, cam = Math.round(f.g.camX), MIDY = ((FF.C + FF.F) / 2) * LX;
    G.save(); G.globalCompositeOperation = 'lighter';
    for (const h of f.hz) {
      if (t < h.t0 || h.dead) continue;
      const tele = t < h.tl, k2 = tele ? seg(t, h.t0, h.tl) : 0, blink = 0.75 + 0.25 * Math.sin(rtNow * 30);
      if (h.k === 'pillar') {
        const x = (h.wx - cam + 7) * LX, fl = h.side === 'f', surf = fl ? F : C;
        if (tele) { HD.glow(x, surf, 160 + 140 * k2, '#ff5a10', (0.25 + 0.5 * k2) * blink); G.fillStyle = rgba('#ffb050', 0.5 * k2); G.fillRect(x - 70, surf - 4, 140, 8); continue; }
        const q = t > h.te ? 1 - (t - h.te) / 0.3 : Math.min(1, (t - h.tl) / 0.06); if (q <= 0) continue;
        const hh = 54 * LX * q, y1 = fl ? F - hh : C + hh;
        G.fillStyle = HD.lin(0, surf, 0, y1, [[0, rgba('#ffe0a0', 0.75 * q)], [0.5, rgba('#ff6a1a', 0.5 * q)], [1, 'rgba(255,40,0,0)']]); G.fillRect(x - 70, Math.min(surf, y1), 140, hh);
        for (let i = 0; i < 6; i++) HD.glow(x + Math.sin(rtNow * 20 + i * 2) * 34, surf + (fl ? -1 : 1) * hh * (i / 6), 100, '#ff6a1a', 0.35 * q);
        HD.glow(x, surf, 300, '#ff8a3a', 0.55 * q);
      } else if (h.k === 'cleave') {
        const x = (h.wx - cam + 4) * LX, surf = h.side === 'f' ? F : C;
        if (t < h.tl - 0.1) { G.fillStyle = rgba('#ff3a5a', 0.25 * k2 * blink); G.fillRect(x - 6, C, 12, F - C); HD.glow(x, surf, 120, '#ff3a5a', 0.4 * k2); continue; }
        const q = 1 - seg(t, h.tl + 0.05, h.tl + 0.5); if (q <= 0) continue;
        G.fillStyle = HD.lin(x - 40, 0, x + 40, 0, [[0, 'rgba(255,200,140,0)'], [0.5, rgba('#fff0d0', 0.8 * q)], [1, 'rgba(255,200,140,0)']]); G.fillRect(x - 40, C, 80, F - C);
        HD.glow(x, surf, 380 * q, '#ffd27a', 0.7 * q);
      } else if (h.k === 'wave') {
        const y = h.side === 'f' ? F - 22 * LX : C, col = h.mir ? '#7fe8ff' : '#ff3a2a';
        if (tele) { G.fillStyle = rgba(col, 0.18 * k2 * blink); G.fillRect(0, y, 214 * LX, 22 * LX); continue; }
        const sx = (h.sx0 - h.v * (t - h.tl)) * LX; if (sx < -200 || sx > W + 200) continue;
        for (let tr = 3; tr >= 0; tr--) {
          const ax = sx + tr * 60, a = tr ? 0.16 * (4 - tr) : 0.9;
          G.strokeStyle = rgba(col, a); G.lineWidth = tr ? 26 : 34; G.beginPath(); G.moveTo(ax + 60, y); G.quadraticCurveTo(ax - 20, y + 66, ax + 60, y + 132); G.stroke();
        }
        G.strokeStyle = 'rgba(255,255,255,0.9)'; G.lineWidth = 8; G.beginPath(); G.moveTo(sx + 60, y); G.quadraticCurveTo(sx - 20, y + 66, sx + 60, y + 132); G.stroke();
        HD.glow(sx + 30, y + 66, 200, col, 0.6);
      } else if (h.k === 'shard') {
        const x = (h.wx - cam + 5) * LX, y0 = h.side === 'f' ? F - 40 * LX : C;
        if (tele) { HD.glow(x, y0 + 120, 140 * k2 + 40, '#bfe4ff', 0.35 * k2 * blink); continue; }
        const q = t > h.te ? Math.max(0, 1 - (t - h.te) / 0.3) : 1; if (q <= 0) continue;
        HD.glow(x, y0 + 120, 220, '#bff6ff', 0.45 * q); HD.glow(x, y0 + 120, 60, '#ffffff', 0.6 * q * (t - h.tl < 0.15 ? 1 : 0.4));
      } else if (h.k === 'beam') {
        const y0 = h.side === 'c' ? C : MIDY + 18, hh = h.side === 'c' ? MIDY - 18 - C : F - MIDY - 18;
        if (tele) { G.fillStyle = rgba('#ff8a3a', (0.08 + 0.16 * k2) * blink); G.fillRect(0, y0, MOUTH[0], hh); HD.glow(MOUTH[0] - 40, MOUTH[1] + 30, 140 + 160 * k2, '#ffb050', 0.5 * k2); continue; }
        if (t > h.te + 0.1) continue;
        const q = t > h.te ? 1 - (t - h.te) / 0.1 : Math.min(1, (t - h.tl) / 0.05);
        G.fillStyle = HD.lin(0, y0, 0, y0 + hh, [[0, 'rgba(255,90,20,0)'], [0.5, rgba('#ffd27a', 0.6 * q)], [1, 'rgba(255,90,20,0)']]); G.fillRect(0, y0, MOUTH[0] + 40, hh);
        for (let i = 0; i < 10; i++) HD.glow(MOUTH[0] * (i / 10) + Math.sin(rtNow * 30 + i) * 20, y0 + hh / 2 + Math.sin(rtNow * 17 + i * 3) * hh * 0.3, 120, '#ff6a1a', 0.35 * q);
        HD.glow(MOUTH[0], y0 + hh / 2, 260, '#ffb050', 0.6 * q);
      }
    }
    G.restore();
  }
  // a close-up for the cut-ins: the head (or just the face), cropped into a rectangle of the pixel screen
  const CROP = { head: [-440, -800, 440, -60], face: [-230, -420, 230, -120] };
  function portrait(f, m, x, y, w, h, kind) {
    if (!ensure()) return; fit(); showFront(true);
    const st = tyrantState(f, 0), c = CROP[kind] || CROP.head, G = fx;
    st.R = rig(f, st); st.white = 0; st.alpha = 1; st.lit = 1; st.ign = Math.max(1, st.ign); st.flash = 0;
    const M = new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]), T = new DOMMatrix().scale(cw / 320, ch / 180).multiply(M);
    if (!frontDirty) { G.setTransform(1, 0, 0, 1, 0, 0); G.clearRect(0, 0, cw, ch); } frontUsed = true; frontDirty = true;
    HD.setCtx(G); G.save(); G.setTransform(T); G.beginPath(); G.rect(x, y, w, h); G.clip();
    const sc = Math.min(w / (c[2] - c[0]), h / (c[3] - c[1]));
    paintAt(st, x + w / 2 - (c[0] + c[2]) / 2 * sc, y - c[1] * sc, sc, 0, false);
    G.restore();
  }
  function drawFront(f, rt, id, pos) {
    if (SKIP.front) return;
    const G = g(), P = PAL[id] || PAL.citadel, t = f.t;
    // embers drifting up through everything
    const n = reduce ? 30 : 70;
    G.save(); G.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const h1 = hs(i + 3), h2 = hs(i * 1.7 + 6), h3 = hs(i * 2.3 + 8), vy = -(40 + h2 * 120), y = ((h3 * (H + 200) + vy * rt) % (H + 200) + H + 200) % (H + 200) - 100, x = ((h1 * W + Math.sin(rt * (0.5 + h1) + i) * 30) % W + W) % W;
      const s = 2 + h2 * 4, a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(rt * (6 + h1 * 10) + i * 3)), col = P.emb[i % P.emb.length];
      if (s > 4) HD.glow(x, y, s * 6, col, a * 0.25);
      G.fillStyle = rgba(col, a); G.fillRect(x - s / 2, y - s / 2, s, s);
    }
    G.restore();
    // a hit: a ring of light out of his chest + a burst of sparks
    const hk = t - f.hitT;
    if (pos && hk >= 0 && hk < 0.5) {
      const cx = pos.x, cy = pos.y + 130 * pos.sc;
      G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffd27a', 0.8 * (1 - hk / 0.5)); G.lineWidth = 14 * (1 - hk / 0.5) + 2; G.beginPath(); G.arc(cx, cy, 60 + hk * 900, 0, TAU); G.stroke(); G.restore();
      for (let i = 0; i < 24; i++) { const a = hs(i + Math.floor(f.hitT * 10)) * TAU, d = 40 + hk * (300 + hs(i + 4) * 500); HD.glow(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 18 * (1 - hk * 1.6) + 4, '#ffb050', 0.8 * (1 - hk / 0.5)); }
      HD.glow(cx, cy, 420, '#ff6a20', 0.5 * (1 - hk / 0.5));
    }
  }
  function drawTitle(rt) {
    const G = g();
    // the name, slammed (the trailer's title card)
    const tt = rt - TITLE.t0;
    if (TITLE.en && tt >= 0 && tt < TITLE.len) {
      const kk = seg(tt, 0, 0.16), out = 1 - seg(tt, TITLE.len - 0.35, TITLE.len), size = TITLE.size || 104, ar = !!FF.save && FF.save.settings && FF.save.settings.lang === 'ar';
      const txt = ar ? TITLE.ar : TITLE.en, sc2 = lerp(1.55, 1, eo(kk));
      G.save(); G.globalAlpha = kk * out; G.translate(W / 2, H * 0.8); G.scale(sc2, sc2); G.textAlign = 'center'; G.textBaseline = 'alphabetic';
      G.font = ar ? '900 ' + size + 'px Cairo, sans-serif' : '900 ' + size + 'px Cinzel, "Liberation Serif", serif';
      if (!ar) G.letterSpacing = Math.round(size * 0.12) + 'px';
      G.shadowColor = TITLE.col; G.shadowBlur = 40 * k; G.fillStyle = rgba(TITLE.col, 0.5); G.fillText(txt, 0, 0); G.shadowBlur = 0;
      G.fillStyle = HD.lin(0, -size * 0.8, 0, size * 0.1, [[0, '#ffffff'], [0.45, mixc(TITLE.col, '#ffffff', 0.35)], [0.55, TITLE.col], [1, mixc(TITLE.col, '#000000', 0.45)]]); G.fillText(txt, 0, 0);
      G.lineWidth = 2; G.strokeStyle = 'rgba(0,0,0,0.6)'; G.strokeText(txt, 0, 0);
      if (TITLE.sub && !ar) { const k3 = seg(tt, 0.25, 0.55); G.globalAlpha = kk * out * k3; G.shadowBlur = 0; G.font = '700 34px Cinzel, serif'; G.letterSpacing = '14px'; G.fillStyle = '#f2e6cc'; G.fillText(TITLE.sub, 0, -size * 0.95); G.fillStyle = rgba(TITLE.col, 0.8); G.fillRect(-260, -size * 0.85, 520, 3); }
      G.restore();
    }
  }
  let vig = null, vigGen = -1, inv = false, invOn = false, atm = null, atx = null, frontUsed = false, frontDirty = false;

  // ---------------------------------------------------------------- the API boss.js uses
  FF.HDBoss = {
    // is this fight painted in HD right now? (the Tyrant outside the 3D tunnel; the player can turn it off)
    on(f) { return !!(f && f.def === (FF.BOSSES && FF.BOSSES.tyrant) && Q.level < 2 && !f.tunnelOn() && !(FF.save && FF.save.settings && FF.save.settings.hdBoss === false) && ensure()); },
    // m = the pixel canvas's transform at renderBack (shake, punch-ins, whips) in 320x180 units
    frame(f, m, rt) {
      if (!ensure()) return; fit(); show(true); drawn = true; rtNow = rt;
      if (f !== curF) { curF = f; BRK.paulL.t = BRK.paulR.t = -1; unboundSaid = false; TITLE.en = ''; }   // a new fight starts whole
      const now = performance.now(), dtm = Q.last ? now - Q.last : 16.7; Q.last = now;
      if (dtm < 200) { Q.acc += dtm; Q.n++; if (Q.n >= 45) { const avg = Q.acc / Q.n; Q.acc = 0; Q.n = 0; Q.slow = avg > 24 ? Q.slow + 1 : 0; if (Q.slow >= 2 && f.mode !== 'intro') { Q.level++; Q.slow = 0; if (Q.level === 1) { cw = 0; } } } }
      if (f.mode === 'intro' && prebake(f)) { /* one bake per frame while it is dark */ }
      reduce = !!(f.g && f.g.settings && f.g.settings.reduceFx);
      if (vigGen !== gen) { vig = null; vigGen = gen; }
      const D = FF.BOSS_DIMS, byV = (v) => { for (const d of D) if (d.v === v) return d.id; return null; };
      const id = byV(f.worldV) || 'citadel', from = f.worldFrom >= 0 ? byV(f.worldFrom) : null, wk = f.worldK0 > -9 ? cl((f.t - f.worldK0) / 1.0) : 1;
      const M = new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]), T = new DOMMatrix().scale(cw / 320, ch / 180).multiply(M).scale(1 / LX, 1 / LX);
      HD.setCtx(bx); bx.setTransform(T);
      const bolt = drawWorld(f, rt, id, from, wk);
      const pos = drawTyrant(f, rt, bolt);
      drawFront(f, rt, id, pos);
      // the front layer: only while the name is on screen (or a cut-in face is drawn): otherwise it is hidden and costs nothing
      const tt = rt - TITLE.t0, titleOn = !!TITLE.en && tt >= 0 && tt < TITLE.len;
      if (titleOn || frontDirty) { fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, cw, ch); frontDirty = false; }
      if (titleOn) { HD.setCtx(fx); fx.setTransform(T); drawTitle(rt); frontUsed = true; frontDirty = true; showFront(true); }
    },
    // called by the main loop after every frame: a frame without a HD fight hides the layers
    // the effects that copy the frame (time stop, ripples, cuts) get the WHOLE picture: HD back + pixels + HD front
    compose(pg, w, h, cv) { if (shown) pg.drawImage(back, 0, 0, w, h); pg.drawImage(cv, 0, 0, w, h, 0, 0, w, h); if (frontShown) pg.drawImage(front, 0, 0, w, h); },
    // a title in the trailer's style (the phase / dimension names): boss.js calls it instead of its pixel banner
    title(en, sub, col, len) { TITLE.en = en; TITLE.ar = ''; TITLE.sub = sub || ''; TITLE.col = col || '#ff5a2a'; TITLE.len = len || 2; TITLE.t0 = rtNow; TITLE.size = 92; },
    layersOn: () => shown,
    portrait,
    invert() { inv = true; if (!invOn && stage) { stage.style.filter = 'invert(1)'; invOn = true; } },
    post() { if (!inv && invOn) { stage.style.filter = ''; invOn = false; } inv = false; if (!back) return; if (!drawn && shown) show(false); if (!frontUsed && frontShown) { showFront(false); fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, cw, ch); frontDirty = false; } drawn = false; frontUsed = false; },
    // the painter alone (prototypes, menus): the caller owns the canvas, sets HD's context and the 1920x1080 transform
    art: {
      use(w, h) { if (w !== cw || h !== ch) { cw = w; ch = h; k = w / W; gen++; } },
      rt(r) { rtNow = r; },
      prebake: () => prebake(),
      world: (f, rt, id, from, wk) => drawWorld(f, rt, id, from, wk),
      tyrant: (f, rt, bolt) => drawTyrant(f, rt, bolt),
      front: (f, rt, id, pos) => drawFront(f, rt, id, pos),
      title: (rt) => { const tt = rt - TITLE.t0; if (TITLE.en && tt >= 0 && tt < TITLE.len) drawTitle(rt); },
      W, H, C, F, MOUTH, LX
    },
    _dbg: { Q, SKIP, PAL, bakeTyrant: () => bakeTyrant(), size: () => [cw, ch] }
  };
})(window.FF = window.FF || {});
