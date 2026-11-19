// FLIPNOVA trailer — the five boss portraits (HD, lit, animated). Each draws around (0,0) = chest centre; head near y=-260.
(function () {
  'use strict';
  const TR = window.TR;
  const { cl, seg, sm, eo, lerp, hs, rgba, mixc, TAU } = TR;
  const g = () => TR.ctx();

  // ======================================================================= THE CRIMSON TYRANT
  // L: { flash 0..1 (lightning), ign 0..1 (eyes + lava wake), t }
  const TY = {};
  function buildTyrant() {
    if (TY.cape) return;
    const { smooth, poly, mirror, taper, bez } = TR;
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
    TY.horns = [-1, 1].map((s) => {
      const c = bez([s * 104, -364], [s * 330, -400], [s * 430, -600], [s * 250, -790], 44);
      return { path: taper(c, 84, 3), c, s };
    });
    TY.paul = [];
    [-1, 1].forEach((s) => {
      for (let i = 2; i >= 0; i--) {
        const cx = s * (300 + i * 26), cy = -10 + i * 64, hw = 196 - i * 20;
        const P = (dx, dy) => [cx + s * dx, cy + dy];
        const pts = [P(-hw, 34), P(-hw * 0.72, -46), P(-hw * 0.1, -98), P(hw * 0.7, -70), P(hw * 1.12, 6), P(hw * 0.62, 44), P(0, 30), P(-hw * 0.5, 46)];
        TY.paul.push({ path: poly(pts), cx, cy, hw, i, s, trim: [P(-hw, 34), P(-hw * 0.5, 46), P(0, 30), P(hw * 0.62, 44), P(hw * 1.12, 6)] });
      }
      for (let k = 0; k < 3; k++) {
        const bx = s * (220 + k * 74), by = -100 + k * 10, tipx = bx + s * (36 + k * 46), tipy = by - 170 + k * 34;
        TY.paul.push({ spike: true, path: poly([[bx - 20, by + 24], [tipx, tipy], [bx + 20, by + 16]]), s, bx, by });
      }
    });
    // the greatsword (right side), blade up past the shoulder
    TY.blade = poly([[456, 560], [404, -40], [412, -300], [440, -520], [470, -640], [500, -600], [556, -470], [566, -300], [580, -40], [530, 560]]);
    TY.notches = [[408, -200], [578, -120], [412, 30], [574, 180], [560, -380]];
    TY.guard = poly([[380, 590], [420, 560], [560, 560], [600, 590], [560, 610], [420, 610]]);
    TY.cracks = [];
    for (let i = 0; i < 14; i++) {
      let x = 0, y = 130, a = (i / 14) * TAU + hs(i) * 0.4; const pts = [[x, y]];
      const n = 7 + Math.floor(hs(i + 4) * 7);
      for (let j = 0; j < n; j++) { a += (hs(i * 13 + j) - 0.5) * 0.9; const L = 18 + hs(i * 7 + j) * 26; x += Math.cos(a) * L; y += Math.sin(a) * L * 0.9; pts.push([x, y]); }
      TY.cracks.push(pts);
    }
  }
  function tyrant(t, L) {
    buildTyrant();
    const fl = cl(L.flash), ig = cl(L.ign);
    const BB = [-660, -800, 660, 640];
    const flashRim = (w) => ({ col: '#c8dcff', a: 0.95 * fl, ang: -Math.PI / 2 - 0.35, w: w || 9, blur: 14, span: 0.5 });
    const lava = (w, a) => ({ col: '#ff4a12', a: (a || 0.9) * (0.06 + 0.94 * ig) * (0.85 + 0.15 * Math.sin(t * 7)), ang: Math.PI / 2, w: w || 12, blur: 18, span: 0.35 });
    const warm = { col: '#ff8a3a', a: 0.3 * ig, ang: Math.PI / 2 + 0.6, w: 26, blur: 30, span: 0.6 };
    TR.glow(0, -200, 760, '#ff3a10', 0.2 * ig + 0.04 * fl);
    TR.layer(() => {
      const G = g();
      TR.lit(TY.cape, TR.lin(0, -60, 0, 600, [[0, '#120308'], [1, '#030001']]), [flashRim(12), lava(18, 0.5)], BB);
      // greatsword behind the right pauldron
      TR.lit(TY.blade, TR.lin(430, 0, 552, 0, [[0, '#18161a'], [0.48, '#3a3438'], [0.52, '#121014'], [1, '#08070a']]), [flashRim(6), lava(6, 0.7)], [400, -640, 590, 560]);
      G.fillStyle = '#000'; TY.notches.forEach((n) => { G.beginPath(); G.arc(n[0], n[1], 16, 0, TAU); G.fill(); });
      TR.lit(TY.guard, '#2a0a0c', [lava(4), flashRim(4)], [380, 560, 600, 610]);
      TY.horns.forEach((h) => {
        const a = h.c[0], b = h.c[h.c.length - 1];
        TR.lit(h.path, TR.lin(a[0], a[1], b[0], b[1], [[0, mixc('#2a1c10', '#d9c6a0', 0.25 + 0.75 * Math.max(ig, fl))], [0.45, mixc('#1a120a', '#8f7650', 0.3 + 0.7 * Math.max(ig, fl))], [0.85, '#2a1c10'], [1, '#0a0604']]), [flashRim(8), { col: '#ff6a2a', a: 0.65 * ig, ang: Math.PI / 2 + h.s * 0.4, w: 10, blur: 14, span: 0.4 }], [Math.min(a[0], b[0]) - 80, b[1] - 40, Math.max(a[0], b[0]) + 140, a[1] + 60]);
        G.save(); G.clip(h.path); G.strokeStyle = 'rgba(20,12,6,0.6)'; G.lineWidth = 4;
        for (let i = 2; i < h.c.length - 4; i += 3) { const p = h.c[i], q = h.c[i + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2; G.beginPath(); G.moveTo(p[0] - Math.cos(ang) * 60, p[1] - Math.sin(ang) * 60); G.quadraticCurveTo(p[0], p[1] - 10, p[0] + Math.cos(ang) * 60, p[1] + Math.sin(ang) * 60); G.stroke(); }
        G.restore();
      });
      TR.lit(TY.chest, TR.lin(0, -90, 0, 560, [[0, '#2e080d'], [0.5, '#170406'], [1, '#060102']]), [flashRim(8), lava(10), warm], BB);
      TY.ab.forEach((p) => TR.lit(p, 'rgba(10,2,3,0.6)', [{ col: '#8a2a22', a: 0.25 + 0.4 * ig, ang: -Math.PI / 2, w: 3 }, lava(4, 0.6)], [-160, 220, 160, 460]));
      G.strokeStyle = rgba('#a02a2a', 0.15 + 0.25 * ig); G.lineWidth = 4; G.beginPath(); G.moveTo(0, -90); G.lineTo(0, 230); G.stroke();
      TY.paul.forEach((p) => {
        if (p.spike) { TR.lit(p.path, TR.lin(p.bx, p.by, p.bx, p.by - 170, [[0, '#1a0508'], [1, mixc('#3a2a20', '#d9c49a', Math.max(ig, fl))]]), [flashRim(5), lava(5, 0.5)], [p.bx - 60, p.by - 190, p.bx + 160, p.by + 30]); return; }
        TR.lit(p.path, TR.lin(p.cx, p.cy - 98, p.cx, p.cy + 46, [[0, '#3e0b12'], [0.5, '#1c0508'], [1, '#080103']]), [flashRim(7), lava(8, 0.8), { col: '#ff9a5a', a: 0.14 * ig, ang: -Math.PI / 2, w: 5 }], [p.cx - p.hw * 1.1, p.cy - 100, p.cx + p.hw * 1.1, p.cy + 50]);
        G.strokeStyle = rgba('#b07a3a', 0.18 + 0.5 * Math.max(ig * 0.8, fl)); G.lineWidth = 5; G.beginPath(); p.trim.forEach((q, i) => (i ? G.lineTo(q[0], q[1] - 6) : G.moveTo(q[0], q[1] - 6))); G.stroke();
      });
      TR.lit(TY.neck, '#080103', [lava(5, 0.5)], [-120, -160, 120, -24]);
      TR.lit(TY.helm, TR.lin(-160, -462, 160, -52, [[0, '#4a0d14'], [0.5, '#22060a'], [1, '#090203']]), [flashRim(9), lava(7, 0.7), { col: '#ff7a3a', a: 0.22 * ig, ang: Math.PI / 2, w: 30, blur: 30, span: 0.8 }], [-196, -462, 196, -52]);
      G.strokeStyle = rgba('#d06060', 0.15 + 0.4 * fl); G.lineWidth = 6; G.beginPath(); G.moveTo(0, -452); G.lineTo(0, -290); G.stroke();
      [TY.cheekL, TY.cheekR].forEach((c) => TR.lit(c, '#1a0408', [flashRim(4), lava(4, 0.6)], [-180, -270, 180, -160]));
      // nose ridge
      G.fillStyle = '#2a070b'; G.beginPath(); G.moveTo(-10, -250); G.lineTo(10, -250); G.lineTo(16, -196); G.lineTo(0, -184); G.lineTo(-16, -196); G.closePath(); G.fill();
      // mouth: black, fire inside, teeth
      G.fillStyle = '#030000'; G.fill(TY.mouth);
      G.save(); G.clip(TY.mouth); G.globalCompositeOperation = 'lighter';
      G.fillStyle = TR.rad(0, -140, 0, 110, [[0, rgba('#ffd27a', 0.9 * ig)], [0.4, rgba('#ff5a10', 0.7 * ig)], [1, 'rgba(80,0,0,0)']]); G.fillRect(-110, -190, 220, 90); G.restore();
      TY.teeth.forEach((p) => TR.lit(p, TR.lin(0, -190, 0, -100, [[0, '#d8c8a8'], [1, '#6a5a40']]), [{ col: '#ff7a30', a: 0.7 * ig, ang: Math.PI / 2, w: 3 }, flashRim(2)], [-110, -190, 110, -100]));
      TR.lit(TY.brow, TR.lin(0, -330, 0, -240, [[0, '#6a1820'], [1, '#22060a']]), [flashRim(5), { col: '#ff6a2a', a: 0.5 * ig, ang: Math.PI / 2, w: 4, blur: 8 }], [-158, -330, 158, -240]);
      G.fillStyle = '#010000'; G.fill(TY.sockL); G.fill(TY.sockR);
    }, [{ tex: TR.tex.fog, col: '#000000', a: 0.45, scale: 0.9 }, { tex: TR.tex.wisp, col: '#ff6a40', a: 0.05 + 0.08 * ig, scale: 0.6, ox: 200 }]);
    const G = g();
    // glowing cracks + core
    G.save(); G.clip(TY.chest); G.globalCompositeOperation = 'lighter'; G.lineCap = 'round'; G.lineJoin = 'round';
    TY.cracks.forEach((c, i) => {
      const grow = cl(ig * 1.6 - hs(i) * 0.4), n = Math.max(2, Math.floor(c.length * grow));
      if (grow <= 0) return;
      G.beginPath(); for (let j = 0; j < n; j++) (j ? G.lineTo(c[j][0], c[j][1]) : G.moveTo(c[j][0], c[j][1]));
      const f2 = 0.7 + 0.3 * Math.sin(t * 9 + i);
      G.shadowColor = '#ff5a10'; G.shadowBlur = 22; G.strokeStyle = rgba('#ff6a1a', 0.85 * f2); G.lineWidth = 7; G.stroke();
      G.shadowBlur = 0; G.strokeStyle = rgba('#ffe0a0', 0.9 * f2); G.lineWidth = 2.2; G.stroke();
    });
    G.restore();
    const core = 0.1 + 0.9 * ig, beat = 0.85 + 0.15 * Math.sin(t * 5.5);
    TR.glow(0, 130, 280 * core, '#ff4a10', 0.65 * core * beat); TR.glow(0, 130, 90, '#ffd080', 0.9 * core * beat);
    TR.disc(0, 130, 24 * core + 3, rgba('#fff4d0', core));
    // molten sword edge
    G.save(); G.globalCompositeOperation = 'lighter'; G.lineJoin = 'round'; G.shadowColor = '#ff5a10'; G.shadowBlur = 20;
    G.strokeStyle = rgba('#ff8a3a', 0.75 * ig); G.lineWidth = 4; G.beginPath(); G.moveTo(458, 540); G.lineTo(406, -40); G.lineTo(414, -300); G.lineTo(442, -520); G.lineTo(470, -636); G.lineTo(500, -598); G.lineTo(554, -470); G.lineTo(564, -300); G.lineTo(578, -40); G.lineTo(528, 540); G.stroke(); G.restore();
    // eyes
    const eye = cl(0.06 + ig) * (ig > 0.05 ? 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7) : 1);
    [-1, 1].forEach((s) => {
      const ex = s * 74, ey = -262;
      TR.glow(ex, ey, 260 * eye, '#ff3a08', 0.5 * eye); TR.glow(ex, ey, 80, '#ffb050', 0.95 * eye);
      G.save(); G.clip(s < 0 ? TY.sockL : TY.sockR); G.globalCompositeOperation = 'lighter';
      G.fillStyle = TR.rad(ex, ey, 0, 54, [[0, rgba('#ffffff', eye)], [0.3, rgba('#ffd27a', eye)], [1, rgba('#ff4a10', 0)]]); G.fillRect(ex - 70, ey - 50, 140, 100); G.restore();
      if (eye > 0.4) { G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba('#ffcf8a', 0.45 * eye); G.lineWidth = 2; G.beginPath(); G.moveTo(ex - s * 170, ey + 6); G.lineTo(ex + s * 170, ey - 10); G.stroke(); G.restore(); }
    });
    // smoke / embers out of the mouth
    G.save(); G.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) { const k = ((t * 0.7 + hs(i)) % 1), x = (hs(i + 2) - 0.5) * 120 + Math.sin(t * 2 + i) * 20 * k, y = -130 - k * 260; TR.glow(x, y, 26 * (1 - k) + 6, '#ff6a20', 0.35 * ig * (1 - k)); }
    G.restore();
    // crown of fire
    const fuel = 0.08 + 0.92 * ig;
    G.save(); G.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 24, base = -440 + Math.abs(i - 4) * 12, h = (120 + hs(i) * 150) * fuel * (0.8 + 0.25 * Math.sin(t * (9 + i) + i * 2));
      const sway = Math.sin(t * 5 + i) * 18 * fuel, w = 24 + hs(i + 3) * 14;
      const p = new Path2D(); p.moveTo(x - w, base); p.bezierCurveTo(x - w, base - h * 0.4, x + sway - 8, base - h * 0.7, x + sway, base - h); p.bezierCurveTo(x + sway + 8, base - h * 0.7, x + w, base - h * 0.4, x + w, base); p.closePath();
      G.fillStyle = TR.lin(x, base, x, base - h, [[0, rgba('#ffd890', 0.32 * fuel)], [0.3, rgba('#ffa040', 0.5 * fuel)], [0.65, rgba('#ff4a10', 0.4 * fuel)], [1, 'rgba(120,10,0,0)']]);
      G.fill(p);
    }
    G.restore();
    TR.glow(0, -500, 300 * fuel, '#ff6a20', 0.3 * fuel);
  }
  TR.tyrant = tyrant;

  // ======================================================================= THE STILL HOUR (the teacher who stopped time)
  // L: { rot (halo rotation), hA, mA (hand angles), sway, eye 0..1, frz 0..1, t }
  const SH = {};
  function buildStill() {
    if (SH.robe) return;
    const { smooth, poly, mirror, taper, bez } = TR;
    SH.robe = smooth([[-170, -70], [-250, 40], [-330, 240], [-440, 620], [440, 620], [330, 240], [250, 40], [170, -70], [80, -110], [0, -116], [-80, -110]], true);
    SH.collar = [-1, 1].map((s) => poly([[s * 70, -110], [s * 170, -80], [s * 250, -260], [s * 230, -470], [s * 150, -330], [s * 110, -180]]));
    SH.mask = smooth([[0, -400], [-70, -388], [-104, -330], [-112, -262], [-100, -190], [-64, -128], [0, -104], [64, -128], [100, -190], [112, -262], [104, -330], [70, -388]], true);
    SH.eyeL = smooth([[-88, -258], [-54, -288], [-14, -270], [-50, -244]], true);
    SH.smile = [[-70, -168], [-40, -150], [0, -146], [40, -150], [70, -168]];
    SH.eyeR = smooth([[88, -258], [54, -288], [14, -270], [50, -244]], true);
    SH.crack1 = [[-58, -392], [-50, -360], [-64, -330], [-44, -300], [-52, -278]];
    SH.crack2 = [[50, -250], [62, -220], [48, -196], [66, -160], [52, -130]];
    SH.hair = [];
    for (let i = 0; i < 18; i++) {
      const s = i % 2 ? 1 : -1, k = (i >> 1) / 9, x0 = s * (40 + k * 60), y0 = -380 + k * 40;
      SH.hair.push({ s, k, x0, y0, len: 330 + hs(i) * 160, w: 10 + hs(i + 3) * 8 });
    }
    SH.hands = [-1, 1].map((s) => {
      const wx = s * 270, wy = 90;
      const fingers = [-2, -1, 0, 1, 2].map((f) => { const a = -Math.PI / 2 + s * (0.55 + f * 0.17) + (f === -2 ? -s * 0.5 : 0), L = f === -2 ? 120 : 180 + (2 - Math.abs(f)) * 30; return { a, L }; });
      return { s, wx, wy, fingers };
    });
    SH.sleeves = [-1, 1].map((s) => smooth([[s * 200, -40], [s * 290, 20], [s * 330, 140], [s * 280, 190], [s * 230, 150], [s * 180, 60]], true));
  }
  function stillHour(t, L) {
    buildStill();
    const G = g(), eye = cl(L.eye), frz = cl(L.frz);
    const gold = '#f0c878', ice = '#bfe4ff';
    // halo: rings, numerals, gears, the two great hands
    G.save(); G.translate(0, -250);
    TR.glow(0, 0, 620, '#e8b860', 0.22 + 0.15 * eye); TR.glow(0, 0, 300, '#ffe6b0', 0.12 + 0.2 * frz);
    G.globalCompositeOperation = 'lighter'; G.lineCap = 'round';
    const ring = (r, w, a) => { G.strokeStyle = rgba(gold, a); G.lineWidth = w; G.beginPath(); G.arc(0, 0, r, 0, TAU); G.stroke(); };
    G.shadowColor = gold; G.shadowBlur = 16;
    ring(300, 3, 0.55); ring(330, 1.5, 0.4); ring(392, 2, 0.5); ring(470, 4, 0.5); ring(486, 1.5, 0.35);
    G.save(); G.rotate(L.rot);
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = i % 5 ? 452 : 436; G.strokeStyle = rgba(gold, i % 5 ? 0.35 : 0.7); G.lineWidth = i % 5 ? 2 : 5; G.beginPath(); G.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); G.lineTo(Math.cos(a) * 466, Math.sin(a) * 466); G.stroke(); }
    G.font = TR.font(700, 44); G.textAlign = 'center'; G.textBaseline = 'middle'; G.fillStyle = rgba(gold, 0.75);
    ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = i / 12 * TAU - Math.PI / 2; G.save(); G.translate(Math.cos(a) * 361, Math.sin(a) * 361); G.rotate(a + Math.PI / 2); G.fillText(n, 0, 0); G.restore(); });
    G.restore();
    // gears turning the other way
    [[-430, 250, 120, 18], [460, 200, 95, 14], [380, -380, 80, 12]].forEach((q, j) => {
      G.save(); G.translate(q[0], q[1]); G.rotate(-L.rot * (3 + j)); G.strokeStyle = rgba(gold, 0.28); G.lineWidth = 3; G.beginPath();
      for (let i = 0; i <= q[3] * 2; i++) { const a = i / (q[3] * 2) * TAU, r = i % 2 ? q[2] : q[2] * 0.86; i ? G.lineTo(Math.cos(a) * r, Math.sin(a) * r) : G.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      G.closePath(); G.stroke(); G.beginPath(); G.arc(0, 0, q[2] * 0.4, 0, TAU); G.stroke(); G.restore();
    });
    const hand = (a, L2, w) => { G.save(); G.rotate(a); const p = new Path2D(); p.moveTo(-w, 30); p.lineTo(-w * 0.6, -L2 * 0.7); p.lineTo(-w * 2.2, -L2 * 0.78); p.lineTo(0, -L2); p.lineTo(w * 2.2, -L2 * 0.78); p.lineTo(w * 0.6, -L2 * 0.7); p.lineTo(w, 30); p.closePath(); G.fillStyle = rgba(gold, 0.55); G.fill(p); G.restore(); };
    hand(L.hA, 300, 9); hand(L.mA, 460, 6);
    G.shadowBlur = 0; G.restore();
    // hair behind the shoulders
    G.save(); G.lineCap = 'round';
    SH.hair.forEach((h, i) => {
      const sw = Math.sin(L.sway * 1.3 + i) * 18, c = TR.bez([h.x0, h.y0], [h.x0 + h.s * 90, h.y0 + 80], [h.x0 + h.s * (120 + sw), h.y0 + h.len * 0.6], [h.x0 + h.s * (90 + sw * 1.5), h.y0 + h.len], 14);
      G.fillStyle = TR.lin(0, h.y0, 0, h.y0 + h.len, [[0, 'rgba(220,226,240,0.9)'], [1, 'rgba(120,130,160,0)']]); G.fill(TR.taper(c, h.w, 1));
    });
    G.restore();
    TR.layer(() => {
      const G2 = g();
      const back = { col: gold, a: 0.6, ang: -Math.PI / 2, w: 16, blur: 26, span: 0.4 }, cold = { col: ice, a: 0.35 + 0.3 * frz, ang: Math.PI * 1.15, w: 6, blur: 8, span: 0.6 };
      SH.collar.forEach((c) => TR.lit(c, TR.lin(0, -470, 0, -80, [[0, '#1a2440'], [1, '#070a14']]), [back, cold], [-260, -480, 260, -70]));
      TR.lit(SH.robe, TR.lin(0, -120, 0, 620, [[0, '#121a30'], [0.6, '#080c18'], [1, '#03050a']]), [back, cold], [-440, -120, 440, 620]);
      // gold trim: the robe's opening and hem embroidery
      G2.strokeStyle = rgba(gold, 0.7); G2.lineWidth = 6; G2.beginPath(); G2.moveTo(-70, -108); G2.lineTo(-16, 160); G2.lineTo(-30, 620); G2.moveTo(70, -108); G2.lineTo(16, 160); G2.lineTo(30, 620); G2.stroke();
      G2.lineWidth = 2; G2.strokeStyle = rgba(gold, 0.4);
      for (let i = 0; i < 6; i++) { const y = 200 + i * 70; G2.beginPath(); G2.arc(0, y, 14, 0, TAU); G2.stroke(); G2.beginPath(); G2.moveTo(0, y); G2.lineTo(Math.cos(i) * 12, y + Math.sin(i) * 12); G2.stroke(); }
      SH.sleeves.forEach((sl) => TR.lit(sl, '#0b1122', [back, cold], [-340, -50, 340, 200]));
      // the mask
      TR.lit(SH.mask, TR.rad(-30, -300, 10, 230, [[0, '#e6dece'], [0.45, '#b4aa96'], [0.8, '#6a6252'], [1, '#2e2a22']]), [{ col: '#ffffff', a: 0.25, ang: -Math.PI * 0.7, w: 8, blur: 10 }, { col: gold, a: 0.6, ang: -Math.PI / 2, w: 6, blur: 12 }], [-112, -400, 112, -104]);
      G2.save(); G2.clip(SH.mask);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, rx = 92, ry = 132; G2.strokeStyle = 'rgba(60,50,40,0.55)'; G2.lineWidth = i % 3 ? 3 : 6; G2.beginPath(); G2.moveTo(Math.cos(a) * rx * 0.86, -252 + Math.sin(a) * ry * 0.86); G2.lineTo(Math.cos(a) * rx, -252 + Math.sin(a) * ry); G2.stroke(); }
      G2.fillStyle = 'rgba(40,30,20,0.1)'; G2.fillRect(-112, -150, 224, 60);
      G2.restore();
      G2.fillStyle = '#020204'; G2.fill(SH.eyeL); G2.fill(SH.eyeR);
      G2.strokeStyle = 'rgba(20,10,8,0.8)'; G2.lineWidth = 4; G2.beginPath(); SH.smile.forEach((p, i) => (i ? G2.lineTo(p[0], p[1]) : G2.moveTo(p[0], p[1]))); G2.stroke();
      for (let k = -3; k <= 3; k++) { G2.beginPath(); G2.moveTo(k * 18, -152 + Math.abs(k) * 2); G2.lineTo(k * 18, -138 + Math.abs(k) * 2); G2.stroke(); }
      G2.strokeStyle = 'rgba(30,22,14,0.85)'; G2.lineWidth = 3; G2.lineJoin = 'round';
      [SH.crack1, SH.crack2].forEach((c) => { G2.beginPath(); c.forEach((p, i) => (i ? G2.lineTo(p[0], p[1]) : G2.moveTo(p[0], p[1]))); G2.stroke(); });
    }, [{ tex: TR.tex.fog, col: '#000000', a: 0.3, scale: 0.7 }]);
    // light through the cracks + the pinpoint eyes
    G.save(); G.globalCompositeOperation = 'lighter'; G.shadowColor = gold; G.shadowBlur = 16; G.strokeStyle = rgba('#ffe2a0', 0.25 + 0.7 * eye); G.lineWidth = 2; G.lineJoin = 'round';
    [SH.crack1, SH.crack2].forEach((c) => { G.beginPath(); c.forEach((p, i) => (i ? G.lineTo(p[0], p[1]) : G.moveTo(p[0], p[1]))); G.stroke(); });
    G.restore();
    [-1, 1].forEach((s) => { const ex = s * 48, ey = -265; TR.glow(ex, ey, 130 * eye, '#ffd27a', 0.6 * eye); TR.glow(ex, ey, 26, '#ffffff', eye); TR.disc(ex, ey, 3 + 2 * eye, rgba('#fffbe8', 0.3 + 0.7 * eye)); });
    // a gold tear from the left eye
    if (eye > 0.2) { G.save(); G.globalCompositeOperation = 'lighter'; G.strokeStyle = rgba(gold, 0.6 * eye); G.lineWidth = 3; G.beginPath(); G.moveTo(-50, -252); G.quadraticCurveTo(-56, -210, -46, -170 + 30 * (1 - eye)); G.stroke(); G.restore(); }
    // hands: long pale fingers
    SH.hands.forEach((h) => {
      G.save(); G.translate(h.wx, h.wy);
      const skin = TR.lin(0, 0, 0, -260, [[0, '#5a6278'], [1, '#c6ccdc']]);
      G.fillStyle = skin; G.beginPath(); G.ellipse(0, -10, 32, 44, h.s * 0.3, 0, TAU); G.fill();
      h.fingers.forEach((f, i) => {
        const tw = Math.sin(L.sway * 2 + i) * 0.06, a1 = f.a + tw, a2 = a1 - h.s * 0.18, a3 = a2 - h.s * 0.22;
        const LL = f.L * 1.2, p0 = [Math.cos(f.a) * 24, -10 + Math.sin(f.a) * 24], p1 = [p0[0] + Math.cos(a1) * LL * 0.45, p0[1] + Math.sin(a1) * LL * 0.45], p2 = [p1[0] + Math.cos(a2) * LL * 0.33, p1[1] + Math.sin(a2) * LL * 0.33], p3 = [p2[0] + Math.cos(a3) * LL * 0.26, p2[1] + Math.sin(a3) * LL * 0.26];
        G.fillStyle = skin; G.fill(TR.taper([p0, p1, p2, p3], 13, 5));
        G.fillStyle = 'rgba(20,20,40,0.6)'; [p1, p2].forEach((q) => { G.beginPath(); G.arc(q[0], q[1], 4.5, 0, TAU); G.fill(); });
        const na = a3, tip = [p3[0] + Math.cos(na) * 16, p3[1] + Math.sin(na) * 16]; G.fillStyle = '#0a080e'; G.beginPath(); G.moveTo(p3[0] + Math.cos(na + 1.57) * 4, p3[1] + Math.sin(na + 1.57) * 4); G.lineTo(tip[0], tip[1]); G.lineTo(p3[0] + Math.cos(na - 1.57) * 4, p3[1] + Math.sin(na - 1.57) * 4); G.fill();
      });
      G.restore();
      TR.glow(h.wx, h.wy - 150, 160, gold, 0.12 + 0.2 * eye);
    });
  }
  TR.stillHour = stillHour;

  // ======================================================================= THE HOURLESS (the mapmaker with no hours left)
  // L: { needle, burst 0..1, eye 0..1, wind (time), t }
  const HL = {};
  function mapTex() {
    const c = TR.mk(512, 512), x = c.getContext('2d');
    x.fillStyle = '#3a2c1a'; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(150,110,60,0.55)'; x.lineWidth = 2;
    for (let k = 0; k < 9; k++) { x.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, r = 30 + k * 24 + Math.sin(a * 3 + k) * 10 + Math.sin(a * 7) * 5; const px = 180 + Math.cos(a) * r, py = 220 + Math.sin(a) * r * 0.8; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    x.setLineDash([6, 8]); x.strokeStyle = 'rgba(160,40,30,0.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(20, 480); x.bezierCurveTo(140, 380, 300, 470, 420, 300); x.bezierCurveTo(470, 220, 380, 120, 470, 40); x.stroke(); x.setLineDash([]);
    x.strokeStyle = 'rgba(160,40,30,0.8)'; x.lineWidth = 4; x.beginPath(); x.moveTo(455, 30); x.lineTo(485, 60); x.moveTo(485, 30); x.lineTo(455, 60); x.stroke();
    x.strokeStyle = 'rgba(120,90,50,0.4)'; x.lineWidth = 1; for (let i = 0; i < 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
    return c;
  }
  function buildHourless() {
    if (HL.cloak) return;
    const { smooth, poly } = TR;
    HL.map = mapTex();
    HL.cloak = smooth([[0, -480], [-70, -450], [-150, -360], [-196, -230], [-230, -90], [-300, 20], [-400, 200], [-480, 620], [480, 620], [400, 200], [300, 20], [230, -90], [196, -230], [150, -360], [70, -450]], true);
    HL.void = smooth([[0, -390], [-82, -350], [-104, -260], [-90, -170], [-50, -116], [0, -100], [50, -116], [90, -170], [104, -260], [82, -350]], true);
    HL.rim = smooth([[0, -420], [-104, -370], [-130, -260], [-112, -150], [-60, -90], [0, -76], [60, -90], [112, -150], [130, -260], [104, -370]], true);
    HL.strips = [];
    for (let i = 0; i < 14; i++) HL.strips.push({ y: -40 + i * 46, side: i % 2 ? 1 : -1, len: 140 + hs(i) * 180, w: 26 + hs(i + 2) * 22 });
  }
  function hourless(t, L) {
    buildHourless();
    const G = g(), eye = cl(L.eye), br = cl(L.burst);
    const gold = '#e8b868', sand = '#ffcf7a';
    // the compass rose halo
    G.save(); G.translate(0, -260); G.globalCompositeOperation = 'lighter';
    TR.glow(0, 0, 640, '#d89a50', 0.2 + 0.15 * br);
    G.shadowColor = gold; G.shadowBlur = 14; G.lineCap = 'round';
    G.strokeStyle = rgba(gold, 0.5); G.lineWidth = 3; G.beginPath(); G.arc(0, 0, 400, 0, TAU); G.stroke(); G.lineWidth = 1.5; G.beginPath(); G.arc(0, 0, 420, 0, TAU); G.stroke();
    for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, r0 = i % 9 ? 404 : 392; G.strokeStyle = rgba(gold, i % 9 ? 0.3 : 0.6); G.lineWidth = i % 9 ? 1.5 : 3; G.beginPath(); G.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); G.lineTo(Math.cos(a) * 418, Math.sin(a) * 418); G.stroke(); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, r = i % 4 === 0 ? 380 : i % 2 ? 200 : 300, w = i % 4 === 0 ? 30 : 16; G.fillStyle = rgba(gold, i % 2 ? 0.18 : 0.32); G.beginPath(); G.moveTo(Math.cos(a) * r, Math.sin(a) * r); G.lineTo(Math.cos(a + Math.PI / 2) * w, Math.sin(a + Math.PI / 2) * w); G.lineTo(Math.cos(a - Math.PI / 2) * w, Math.sin(a - Math.PI / 2) * w); G.closePath(); G.fill(); }
    G.save(); G.rotate(L.needle || 0); G.shadowColor = '#ff6a3a'; G.shadowBlur = 20; G.fillStyle = rgba('#ff5a3a', 0.6); G.beginPath(); G.moveTo(0, -470); G.lineTo(22, 0); G.lineTo(-22, 0); G.closePath(); G.fill(); G.fillStyle = rgba('#e8d8b0', 0.35); G.beginPath(); G.moveTo(0, 470); G.lineTo(22, 0); G.lineTo(-22, 0); G.closePath(); G.fill(); G.restore();
    G.font = TR.font(900, 56); G.textAlign = 'center'; G.textBaseline = 'middle'; G.fillStyle = rgba(gold, 0.75);
    ['N', 'E', 'S', 'W'].forEach((n, i) => { const a = i / 4 * TAU - Math.PI / 2; G.fillText(n, Math.cos(a) * 460, Math.sin(a) * 460); });
    G.restore();
    // the cloak, made of old maps
    TR.layer(() => {
      const G2 = g();
      const back = { col: gold, a: 0.85, ang: -Math.PI / 2, w: 9, blur: 14, span: 0.4 };
      // strips torn by the wind
      HL.strips.forEach((s2, i) => {
        const x0 = s2.side * (240 + i * 14), y0 = s2.y, pts = [];
        for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([x0 + s2.side * u * s2.len + (s2.side > 0 ? u * 60 : -u * 20), y0 + Math.sin(L.wind * 7 + i + u * 5) * 22 * u + u * 30]); }
        TR.lit(TR.taper(pts, s2.w, 4), '#3a2a18', [back], [-700, -100, 700, 700]);
      });
      TR.lit(HL.cloak, '#2c2014', [back, { col: '#ffb060', a: 0.3 * br, ang: Math.PI / 2, w: 20, blur: 20 }], [-480, -480, 480, 620]);
      G2.save(); G2.clip(HL.cloak); G2.globalAlpha = 0.55; G2.globalCompositeOperation = 'screen';
      for (let y = -500; y < 640; y += 400) for (let x = -520; x < 520; x += 400) { G2.save(); G2.translate(x + 200, y + 200); G2.rotate(hs(x + y) - 0.5); G2.drawImage(HL.map, -210, -210, 420, 420); G2.restore(); }
      G2.globalAlpha = 1; G2.globalCompositeOperation = 'source-over';
      // stitches between the map pieces
      G2.strokeStyle = 'rgba(20,12,6,0.7)'; G2.lineWidth = 4; G2.setLineDash([10, 9]);
      [[[-300, 60], [-120, 200], [-80, 620]], [[260, -40], [160, 300], [220, 620]], [[-170, -300], [-60, -60], [40, 140]]].forEach((l) => { G2.beginPath(); l.forEach((p, i) => (i ? G2.lineTo(p[0], p[1]) : G2.moveTo(p[0], p[1]))); G2.stroke(); });
      G2.setLineDash([]);
      G2.restore();
      TR.lit(HL.rim, 'rgba(0,0,0,0)', [{ col: gold, a: 0.6, ang: -Math.PI / 2, w: 6, blur: 8 }], [-130, -420, 130, -76]);
      G2.fillStyle = '#010101'; G2.fill(HL.void);
    }, [{ tex: TR.tex.fog, col: '#000000', a: 0.4, scale: 0.8 }, { tex: TR.tex.wisp, col: '#000000', a: 0.35, scale: 0.5, ox: 120 }]);
    // hollow eyes: dim gold, and sand falling out of them
    [-1, 1].forEach((s) => {
      const ex = s * 38, ey = -262;
      TR.glow(ex, ey, 70 + 60 * eye, '#ffb050', 0.35 + 0.5 * eye); TR.disc(ex, ey, 6 + 3 * eye, rgba('#fff0c0', 0.4 + 0.6 * eye));
      G.save(); G.globalCompositeOperation = 'lighter';
      const n = 70 + Math.floor(120 * br);
      for (let i = 0; i < n; i++) { const k = ((t * (0.9 + hs(i) * 0.6) + hs(i + s * 7)) % 1), spread = (hs(i * 3 + s) - 0.5) * (14 + 70 * k * k) * (1 + br), x = ex + spread, y = ey + k * k * 760; G.fillStyle = rgba(sand, (0.85 - k * 0.6) * (0.6 + 0.4 * eye)); G.fillRect(x, y, 3, 3); }
      G.restore();
    });
    // the hourglass, held by bone fingers
    const hx = 0, hy = 170;
    G.save(); G.translate(hx, hy); G.scale(1.25, 1.25);
    TR.glow(0, 0, 260, '#ffb050', 0.18 + 0.4 * br);
    G.fillStyle = TR.lin(-110, 0, 110, 0, [[0, '#3a2410'], [0.5, '#8a6230'], [1, '#2a1808']]); G.fillRect(-110, -170, 220, 26); G.fillRect(-110, 144, 220, 26);
    G.fillStyle = '#4a3016'; [-92, 84].forEach((x) => G.fillRect(x, -146, 10, 292));
    const glass = new Path2D(); glass.moveTo(-74, -144); glass.bezierCurveTo(-80, -40, -10, -20, -8, 0); glass.bezierCurveTo(-10, 20, -80, 40, -74, 144); glass.lineTo(74, 144); glass.bezierCurveTo(80, 40, 10, 20, 8, 0); glass.bezierCurveTo(10, -20, 80, -40, 74, -144); glass.closePath();
    G.fillStyle = 'rgba(160,200,210,0.08)'; G.fill(glass);
    G.save(); G.clip(glass); G.fillStyle = TR.lin(0, 80, 0, 144, [[0, '#ffd890'], [1, '#a8701c']]); G.beginPath(); G.moveTo(-76, 144); G.quadraticCurveTo(0, 96 - 10 * (1 - br), 76, 144); G.closePath(); G.fill(); G.restore();
    G.strokeStyle = 'rgba(220,240,255,0.55)'; G.lineWidth = 3; G.stroke(glass);
    if (br > 0) { G.strokeStyle = rgba('#ffffff', 0.85); G.lineWidth = 2; G.beginPath(); G.moveTo(-40, -120); G.lineTo(-20, -70); G.lineTo(-44, -40); G.moveTo(-20, -70); G.lineTo(10, -60); G.moveTo(30, 60); G.lineTo(52, 110); G.lineTo(36, 130); G.stroke(); }
    G.restore();
    // sand bursting out of the broken glass
    if (br > 0) {
      G.save(); G.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 220; i++) { const a = hs(i) * TAU, sp = 200 + hs(i + 9) * 700, k = br, x = hx + Math.cos(a) * sp * k, y = hy + Math.sin(a) * sp * k * 0.7 + 300 * k * k; G.fillStyle = rgba(sand, 0.9 * (1 - k * 0.7)); G.fillRect(x, y, 4, 4); }
      G.restore();
    }
  }
  TR.hourless = hourless;

  // ======================================================================= PALE NIRO (the brother who forgot)
  // L: { wake 0..1 (eyes white), knock (0..1 pulse), dis (dissolve), t }
  const PN = {};
  function buildNiro() {
    if (PN.head) return;
    const { smooth, poly } = TR;
    const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
    PN.head = rr(-180, -430, 360, 340, 26);
    PN.hair = poly([[-196, -330], [-200, -440], [-170, -478], [-140, -530], [-110, -480], [-70, -520], [-30, -470], [10, -540], [40, -470], [90, -520], [120, -470], [170, -500], [200, -440], [200, -330], [160, -330], [160, -372], [120, -372], [120, -352], [60, -352], [60, -372], [-20, -372], [-20, -346], [-80, -346], [-80, -372], [-150, -372], [-150, -330]]);
    PN.band = poly([[-190, -404], [190, -404], [190, -372], [-190, -372]]);
    PN.body = poly([[-330, 620], [-330, 60], [-280, -40], [-120, -90], [120, -90], [280, -40], [330, 60], [330, 620]]);
    PN.collar = poly([[-120, -90], [0, -20], [120, -90], [90, -110], [0, -60], [-90, -110]]);
    PN.cracks = [[[-120, -430], [-100, -380], [-130, -330], [-96, -290], [-120, -220], [-100, -160]], [[110, -240], [140, -200], [118, -150], [150, -110]], [[30, -430], [40, -404]], [[-40, -150], [-10, -124], [-30, -96]]];
  }
  function paleNiro(t, L) {
    buildNiro();
    const G = g(), wk = cl(L.wake), kn = cl(L.knock || 0);
    const steel = { col: '#bfe8ff', a: 0.35 + 0.35 * wk, ang: -Math.PI * 0.75, w: 8, blur: 12, span: 0.5 };
    const teal = { col: '#3affd8', a: 0.35 + 0.4 * wk, ang: Math.PI / 2, w: 10, blur: 16, span: 0.4 };
    TR.glow(0, -250, 760, '#3a78c0', 0.08 + 0.12 * wk + 0.12 * kn);
    TR.layer(() => {
      const G2 = g();
      G2.save(); G2.beginPath(); G2.rect(-400, -200, 800, 700 - L.dis * 180); G2.clip();
      TR.lit(PN.body, TR.lin(0, -90, 0, 620, [[0, '#2a3242'], [1, '#0a0d14']]), [steel, teal], [-330, -100, 330, 620]);
      // the hoodie's strings and seam
      G2.strokeStyle = 'rgba(140,170,200,0.25)'; G2.lineWidth = 4; G2.beginPath(); G2.moveTo(-50, -40); G2.lineTo(-56, 140); G2.moveTo(50, -40); G2.lineTo(56, 140); G2.moveTo(-330, 300); G2.lineTo(330, 300); G2.stroke();
      G2.restore();
      TR.lit(PN.collar, '#1a212e', [steel], [-120, -110, 120, -20]);
      // neck
      G2.fillStyle = '#7c8794'; G2.fillRect(-70, -110, 140, 40);
      TR.lit(PN.head, TR.lin(-180, -430, 180, -90, [[0, '#a6b2bc'], [0.55, '#6c7884'], [1, '#3a434e']]), [steel, { col: '#ffffff', a: 0.15, ang: -Math.PI / 2, w: 5 }], [-180, -430, 180, -90]);
      // side shading of the block
      G2.fillStyle = 'rgba(30,40,60,0.28)'; G2.fillRect(130, -430, 50, 340); G2.fillStyle = 'rgba(30,40,60,0.18)'; G2.fillRect(-180, -130, 360, 40);
      TR.lit(PN.hair, '#0c0e16', [steel], [-200, -540, 200, -330]);
      TR.lit(PN.band, '#2a9a8a', [{ col: '#9affee', a: 0.6, ang: -Math.PI / 2, w: 4 }], [-190, -404, 190, -372]);
      // band tails, torn, in the wind
      [0, 1].forEach((k) => { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([186 + u * (260 - k * 50), -390 + k * 14 + Math.sin(t * 6 + u * 6 + k) * 24 * u + u * 40]); } G2.fillStyle = k ? '#1f7a6e' : '#2a9a8a'; G2.fill(TR.taper(pts, 30 - k * 6, 6)); });
      // eye sockets (blocky)
      G2.fillStyle = '#20262e'; G2.fillRect(-124, -292, 88, 54); G2.fillRect(36, -292, 88, 54);
      G2.fillStyle = '#10141c'; G2.beginPath(); G2.moveTo(-136, -318); G2.lineTo(-30, -300); G2.lineTo(-34, -284); G2.lineTo(-134, -298); G2.fill(); G2.beginPath(); G2.moveTo(136, -318); G2.lineTo(30, -300); G2.lineTo(34, -284); G2.lineTo(134, -298); G2.fill();
      // mouth: flat line
      G2.fillStyle = '#2a3038'; G2.fillRect(-46, -166, 92, 10);
      // cracks
      G2.strokeStyle = '#1a1e26'; G2.lineWidth = 5; G2.lineJoin = 'miter';
      PN.cracks.forEach((c) => { G2.beginPath(); c.forEach((p, i) => (i ? G2.lineTo(p[0], p[1]) : G2.moveTo(p[0], p[1]))); G2.stroke(); });
    }, [{ tex: TR.tex.fog, col: '#1a2030', a: 0.35, scale: 0.6 }]);
    // light from the cracks
    G.save(); G.globalCompositeOperation = 'lighter'; G.shadowColor = '#ffffff'; G.shadowBlur = 14; G.strokeStyle = rgba('#e8f6ff', 0.15 + 0.6 * wk); G.lineWidth = 2;
    PN.cracks.forEach((c) => { G.beginPath(); c.forEach((p, i) => (i ? G.lineTo(p[0], p[1]) : G.moveTo(p[0], p[1]))); G.stroke(); });
    G.restore();
    // the eyes: blank, white, light pouring out
    const e = 0.12 + 0.88 * wk + kn * 0.4;
    [-1, 1].forEach((s) => {
      const ex = s * 80, ey = -265;
      TR.glow(ex, ey, 260 * e, '#cfeaff', 0.4 * e); TR.glow(ex, ey, 70, '#ffffff', 0.8 * e);
      G.fillStyle = rgba('#e8f4ff', cl(0.35 + e)); G.fillRect(ex - 40, ey - 22, 80, 44); G.fillStyle = rgba('#ffffff', cl(e)); G.fillRect(ex - 30, ey - 14, 60, 28);
      if (wk > 0.1) {
        G.save(); G.globalCompositeOperation = 'lighter';
        G.fillStyle = TR.lin(0, ey, 0, ey - 420, [[0, rgba('#ffffff', 0.5 * wk)], [1, 'rgba(255,255,255,0)']]); G.fillRect(ex - 30, ey - 420, 60, 420);
        G.fillStyle = TR.lin(0, ey, 0, ey + 260, [[0, rgba('#dff4ff', 0.6 * wk)], [1, 'rgba(255,255,255,0)']]); G.fillRect(ex - 6 + s * 10, ey + 20, 10, 240);
        G.restore();
      }
    });
    // dissolving into cubes
    G.save();
    const n = 90;
    for (let i = 0; i < n; i++) {
      const k = ((t * (0.12 + hs(i) * 0.18) + hs(i + 5)) % 1), sz = 14 + hs(i + 2) * 34;
      const x0 = (hs(i * 3) - 0.5) * 680, y0 = 520 - L.dis * 180 + (hs(i + 7) - 0.5) * 120;
      const x = x0 + (x0 > 0 ? 1 : -1) * k * 260 + Math.sin(t + i) * 20, y = y0 - k * 760;
      const a = (1 - k) * (0.5 + 0.5 * L.dis + 0.3);
      G.save(); G.translate(x, y); G.rotate(k * 3 + i);
      G.fillStyle = rgba('#2a3242', a); G.fillRect(-sz / 2, -sz / 2, sz, sz);
      G.strokeStyle = rgba('#7fe8ff', a * 0.9); G.lineWidth = 2; G.strokeRect(-sz / 2, -sz / 2, sz, sz);
      G.restore();
    }
    G.restore();
  }
  TR.paleNiro = paleNiro;

  // ======================================================================= THE GRAY: an eye
  // cx,cy centre, w,h size, open 0..1, look [x,y], dil (pupil size), t, refl (draw Flippo in it)
  TR.grayEye = function (cx, cy, w, h, open, look, dil, t, refl, seed) {
    const G = g();
    if (open <= 0.01) return;
    const oh = h * open;
    const lid = new Path2D(); lid.moveTo(cx - w / 2, cy); lid.bezierCurveTo(cx - w * 0.2, cy - oh * 1.25, cx + w * 0.2, cy - oh * 1.25, cx + w / 2, cy); lid.bezierCurveTo(cx + w * 0.2, cy + oh * 1.05, cx - w * 0.2, cy + oh * 1.05, cx - w / 2, cy); lid.closePath();
    // swollen dark lids around it
    G.save(); G.globalAlpha = 0.85; G.lineWidth = h * 0.22; G.strokeStyle = '#0c0d10'; G.shadowColor = '#000'; G.shadowBlur = h * 0.3; G.stroke(lid); G.restore();
    G.save(); G.clip(lid);
    G.fillStyle = TR.rad(cx, cy, 0, w * 0.55, [[0, '#a9acb0'], [0.45, '#6e7176'], [0.8, '#2e3034'], [1, '#121315']]); G.fillRect(cx - w / 2, cy - h, w, h * 2);
    // veins
    G.strokeStyle = 'rgba(120,30,30,0.45)'; G.lineWidth = Math.max(1, w / 360);
    for (let i = 0; i < 40; i++) { const s = i % 2 ? 1 : -1, y = cy + (hs(i + seed) - 0.5) * h; G.beginPath(); G.moveTo(cx + s * w / 2, y); G.quadraticCurveTo(cx + s * w * 0.35, y + (hs(i + 3) - 0.5) * h * 0.5, cx + s * w * (0.18 + hs(i) * 0.1), y + (hs(i + 5) - 0.5) * h * 0.3); G.stroke(); }
    const ir = h * 0.62, ix = cx + look[0] * w * 0.18, iy = cy + look[1] * h * 0.2;
    G.fillStyle = TR.rad(ix, iy, ir * 0.2, ir, [[0, '#e9ecef'], [0.45, '#8c939a'], [0.85, '#40464c'], [1, '#141618']]); G.beginPath(); G.arc(ix, iy, ir, 0, TAU); G.fill();
    G.lineWidth = Math.max(1, ir / 90);
    for (let i = 0; i < 160; i++) { const a = hs(i + seed * 3) * TAU, r0 = ir * (0.3 + hs(i + 1) * 0.15), r1 = ir * (0.75 + hs(i + 2) * 0.25), v = Math.floor(60 + hs(i + 4) * 160); G.strokeStyle = 'rgba(' + v + ',' + v + ',' + (v + 6) + ',0.35)'; G.beginPath(); G.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0); G.lineTo(ix + Math.cos(a + 0.05) * r1, iy + Math.sin(a + 0.05) * r1); G.stroke(); }
    const pr = ir * 0.36 * dil;
    G.fillStyle = TR.rad(ix, iy, pr * 0.7, pr * 1.15, [[0, '#000000'], [1, 'rgba(0,0,0,0)']]); G.beginPath(); G.arc(ix, iy, pr * 1.15, 0, TAU); G.fill();
    if (refl) { const s = pr * 0.22, rx = ix + pr * 0.25, ry = iy + pr * 0.18; G.fillStyle = 'rgba(255,90,60,0.9)'; G.fillRect(rx - s / 2, ry - s / 2, s, s); G.fillStyle = '#fff'; G.fillRect(rx - s * 0.3, ry - s * 0.18, s * 0.18, s * 0.26); G.fillRect(rx + s * 0.1, ry - s * 0.18, s * 0.18, s * 0.26); }
    G.fillStyle = 'rgba(255,255,255,0.85)'; G.beginPath(); G.ellipse(ix - ir * 0.32, iy - ir * 0.36, ir * 0.16, ir * 0.09, -0.6, 0, TAU); G.fill();
    // lid shadow inside
    G.fillStyle = TR.lin(cx, cy - oh, cx, cy, [[0, 'rgba(0,0,0,0.75)'], [0.45, 'rgba(0,0,0,0)']]); G.fillRect(cx - w / 2, cy - oh * 1.3, w, oh * 1.3);
    G.restore();
  };
})();
