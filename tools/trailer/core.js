// FLIPNOVA story trailer — HD renderer core (1920x1080, deterministic: frame(t) depends only on t).
// Helpers, textures, lighting, post (bloom, grain, vignette, letterbox), titles and subtitles.
(function () {
  'use strict';
  const TR = (window.TR = window.TR || {});
  const W = 1920, H = 1080, BAR = 118;
  TR.W = W; TR.H = H; TR.BAR = BAR;
  const TAU = Math.PI * 2;
  const cl = (x, a, b) => (x < (a === undefined ? 0 : a) ? (a === undefined ? 0 : a) : x > (b === undefined ? 1 : b) ? (b === undefined ? 1 : b) : x);
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const sm = (x) => x * x * (3 - 2 * x);
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const ei = (x) => x * x * x;
  const expo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const hs = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const pulse = (t, t0, dur) => (t < t0 ? 0 : Math.exp(-(t - t0) / dur));
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (h, a) => { const c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + cl(a).toFixed(3) + ')'; };
  const mixc = (h1, h2, k) => { const a = hex(h1), b = hex(h2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], cl(k))).toString(16).padStart(2, '0')).join(''); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  Object.assign(TR, { TAU, cl, seg, sm, eo, ei, expo, lerp, hs, pulse, rgba, mixc, mk, hex });

  let g = null;
  TR.ctx = () => g;
  TR.setCtx = (c) => { g = c; };

  // ---------- drawing helpers (all use the current g)
  TR.glow = function (x, y, r, col, a, op) {
    if (!(a > 0.002) || !(r > 0.5)) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.12, rgba(col, a * 0.7)); gr.addColorStop(0.35, rgba(col, a * 0.25)); gr.addColorStop(0.7, rgba(col, a * 0.06)); gr.addColorStop(1, rgba(col, 0));
    g.save(); g.globalCompositeOperation = op || 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  };
  TR.disc = function (x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); };
  // Catmull-Rom smooth closed/open path through points
  TR.smooth = function (pts, closed, path) {
    const p = path || new Path2D(), n = pts.length;
    if (n < 2) return p;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    p.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k = 1 / 6;
      p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    if (closed) p.closePath();
    return p;
  };
  TR.poly = function (pts, path) { const p = path || new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; };
  TR.mirror = (half) => half.concat(half.slice().reverse().map((q) => [-q[0], q[1]]));
  // cubic bezier sampled
  TR.bez = function (a, b, c, d, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return o; };
  // a tapered ribbon along a polyline: widths w0 -> w1
  TR.taper = function (pts, w0, w1, path) {
    const L = [], R = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1, i / (n - 1)) / 2, nx = -dy / d * w, ny = dx / d * w;
      L.push([pts[i][0] + nx, pts[i][1] + ny]); R.push([pts[i][0] - nx, pts[i][1] - ny]);
    }
    return TR.poly(L.concat(R.reverse()), path);
  };
  // fill a path with a vertical/linear gradient + directional rim light (inner glow along the edge facing the light)
  // rims: [{col, a, ang (radians, direction the light comes FROM), w, blur}]
  TR.lit = function (path, fill, rims, bbox) {
    g.fillStyle = fill; g.fill(path);
    if (!rims || !rims.length) return;
    const b = bbox || [-600, -600, 600, 600];
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, R = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2;
    g.save(); g.clip(path);
    rims.forEach((r) => {
      if (!(r.a > 0.003)) return;
      const lx = Math.cos(r.ang), ly = Math.sin(r.ang);
      const gr = g.createLinearGradient(cx + lx * R, cy + ly * R, cx - lx * R * (r.span || 0.2), cy - ly * R * (r.span || 0.2));
      gr.addColorStop(0, rgba(r.col, r.a)); gr.addColorStop(0.55, rgba(r.col, r.a * 0.5)); gr.addColorStop(1, rgba(r.col, 0));
      g.strokeStyle = gr; g.lineWidth = r.w * 2; g.lineJoin = 'round';
      if (r.blur) { g.shadowColor = rgba(r.col, r.a); g.shadowBlur = r.blur; }
      g.globalCompositeOperation = r.op || 'lighter';
      g.stroke(path);
      g.shadowBlur = 0;
    });
    g.restore();
  };
  // draw into a scratch layer (same transform), then texture it (grunge) and composite back
  let lay = null, layx = null;
  TR.layer = function (draw, grunge) {
    const c = g.canvas;
    if (!lay || lay.width !== c.width || lay.height !== c.height) { lay = mk(c.width, c.height); layx = lay.getContext('2d'); }
    const m = g.getTransform(), outer = g;
    layx.setTransform(1, 0, 0, 1, 0, 0); layx.globalCompositeOperation = 'source-over'; layx.globalAlpha = 1; layx.clearRect(0, 0, lay.width, lay.height);
    layx.setTransform(m);
    g = layx; draw(); g = outer;
    if (grunge) {
      layx.setTransform(1, 0, 0, 1, 0, 0); layx.globalCompositeOperation = 'source-atop';
      const s = c.width / W;
      grunge.forEach((q) => { layx.globalAlpha = q.a; const tt = TR.tint(q.tex, q.col), S = q.tex.width * q.scale * s; for (let y = -((q.oy || 0) % S) - S; y < c.height; y += S) for (let x = -((q.ox || 0) % S) - S; x < c.width; x += S) layx.drawImage(tt, x, y, S + 1, S + 1); });
      layx.globalAlpha = 1; layx.globalCompositeOperation = 'source-over';
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(lay, 0, 0); g.restore();
  };
  TR.mountains = function (G, base, seed, col, amp, heat) {
    const pts = [[-100, H + 50]];
    for (let x = -100; x <= W + 100; x += 90) pts.push([x, base - (hs(Math.floor(x / 90) + seed) * 110 + (hs(Math.floor(x / 270) + seed) > 0.6 ? 150 : 0)) * amp]);
    pts.push([W + 100, H + 50]);
    const p = TR.poly(pts);
    if (heat > 0) { G.save(); G.shadowColor = rgba('#ff4a10', 0.6 * heat); G.shadowBlur = 40; G.fillStyle = col; G.fill(p); G.restore(); }
    G.fillStyle = col; G.fill(p);
  };
  TR.lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; };
  TR.rad = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; };

  // ---------- textures (built once)
  function fbm(size, base, oct, seed, contrast, bias) {
    const c = mk(size, size), x = c.getContext('2d'), id = x.createImageData(size, size), d = id.data;
    const acc = new Float32Array(size * size);
    let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) {
      const f = base << o, grid = new Float32Array(f * f);
      for (let i = 0; i < f * f; i++) grid[i] = hs(i * 1.731 + seed * 97.13 + o * 13.37);
      const cell = size / f;
      for (let y = 0; y < size; y++) {
        const gy = y / cell, y0 = Math.floor(gy), fy = sm(gy - y0), y1 = (y0 + 1) % f;
        for (let xx = 0; xx < size; xx++) {
          const gx = xx / cell, x0 = Math.floor(gx), fx = sm(gx - x0), x1 = (x0 + 1) % f;
          const a = grid[y0 * f + x0], b = grid[y0 * f + x1], c2 = grid[y1 * f + x0], e = grid[y1 * f + x1];
          acc[y * size + xx] += amp * lerp(lerp(a, b, fx), lerp(c2, e, fx), fy);
        }
      }
      tot += amp; amp *= 0.5;
    }
    for (let i = 0; i < size * size; i++) {
      const v = cl((acc[i] / tot - 0.5) * contrast + 0.5 + (bias || 0));
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(v * 255);
    }
    x.putImageData(id, 0, 0);
    return c;
  }
  const tintCache = new Map();
  TR.tint = function (tex, col) {
    const key = tex.__id + col;
    if (tintCache.has(key)) return tintCache.get(key);
    const c = mk(tex.width, tex.height), x = c.getContext('2d');
    x.drawImage(tex, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    tintCache.set(key, c); return c;
  };
  let texId = 0;
  const tag = (c) => { c.__id = 'tx' + texId++ + ':'; return c; };
  TR.tex = {};
  TR.initTex = function () {
    if (TR.tex.fog) return;
    TR.tex.fog = tag(fbm(512, 4, 5, 1, 2.2, -0.05));
    TR.tex.fog2 = tag(fbm(512, 3, 5, 7, 2.6, -0.12));
    TR.tex.wisp = tag(fbm(512, 6, 4, 3, 3.2, -0.2));
    TR.tex.soft = tag(fbm(256, 2, 3, 11, 1.6, 0));
    TR.tex.grain = [0, 1, 2, 3].map((s) => {
      const c = mk(640, 360), x = c.getContext('2d'), id = x.createImageData(640, 360), d = id.data;
      for (let i = 0; i < 640 * 360; i++) { const v = Math.floor(hs(i * 0.913 + s * 7.7) * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
      x.putImageData(id, 0, 0); return c;
    });
  };
  // a scrolling, tiling fog layer across the frame
  TR.fog = function (tex, col, a, ox, oy, scale, op) {
    if (!(a > 0.003)) return;
    const t = TR.tint(tex, col), S = tex.width * scale;
    const x0 = ((ox % S) + S) % S - S, y0 = ((oy % S) + S) % S - S;
    g.save(); g.globalAlpha = a; if (op) g.globalCompositeOperation = op;
    for (let y = y0; y < H + 40; y += S) for (let x = x0; x < W + 40; x += S) g.drawImage(t, x, y, S + 1, S + 1);
    g.restore();
  };
  // fog only inside a horizontal band, with soft top and bottom edges
  TR.fogRect = function (tex, col, a, x, y, w, h, ox, oy, scale) {
    TR.layer(() => {
      TR.fog(tex, col, a, ox, oy, scale);
      g.globalCompositeOperation = 'destination-in';
      const gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, '#000'); gr.addColorStop(0.7, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(-6000, -6000, 12000, 12000); g.globalCompositeOperation = 'source-over';
    });
  };

  // ---------- lightning bolt (seeded), returns list of polylines
  TR.bolt = function (x0, y0, x1, y1, seed, rough, branches) {
    const out = [];
    const walk = (ax, ay, bx, by, s, r, depth) => {
      const n = 18, pts = [];
      for (let i = 0; i <= n; i++) {
        const k = i / n, j = i === 0 || i === n ? 0 : (hs(s + i * 3.1) - 0.5) * r * Math.sin(k * Math.PI) * 2;
        const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
        pts.push([ax + dx * k - dy / L * j, ay + dy * k + dx / L * j]);
      }
      out.push({ pts, w: depth ? 1.5 : 3.2 });
      if (depth < 1) for (let b = 0; b < (branches || 3); b++) {
        const i = 3 + Math.floor(hs(s + b * 9.7) * 12), p = pts[i], ang = Math.atan2(by - ay, bx - ax) + (hs(s + b) - 0.5) * 1.6, L2 = 120 + hs(s + b * 2) * 220;
        walk(p[0], p[1], p[0] + Math.cos(ang) * L2, p[1] + Math.sin(ang) * L2, s + 50 + b * 11, r * 0.5, depth + 1);
      }
    };
    walk(x0, y0, x1, y1, seed, rough || 60, 0);
    return out;
  };
  TR.drawBolt = function (bolt, col, a) {
    if (!(a > 0.01)) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    bolt.forEach((b) => {
      g.beginPath(); b.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.shadowColor = col; g.shadowBlur = 30; g.strokeStyle = rgba(col, a * 0.8); g.lineWidth = b.w * 3; g.stroke();
      g.shadowBlur = 8; g.strokeStyle = rgba('#ffffff', a); g.lineWidth = b.w; g.stroke();
    });
    g.restore();
  };

  // ---------- particles (stateless: position = f(i, t))
  TR.embers = function (t, n, seed, cols, opt) {
    opt = opt || {};
    g.save(); g.globalCompositeOperation = 'lighter';
    const sp = opt.speed || 1, area = opt.area || [-100, -100, W + 100, H + 100];
    for (let i = 0; i < n; i++) {
      const h1 = hs(i + seed), h2 = hs(i * 1.7 + seed + 3), h3 = hs(i * 2.3 + seed + 5);
      const vy = (opt.vy || -1) * (40 + h2 * 120) * sp, vx = (opt.vx || 0) * (0.5 + h3) + Math.sin(t * (0.5 + h1) + i) * 20;
      const AH = area[3] - area[1], AW = area[2] - area[0];
      let y = area[1] + ((h3 * AH + vy * t) % AH + AH) % AH;
      let x = area[0] + ((h1 * AW + vx * t) % AW + AW) % AW;
      const s = (opt.size || 3) * (0.4 + h2 * 1.2), fl = 0.5 + 0.5 * Math.sin(t * (6 + h1 * 10) + i * 3);
      const col = cols[i % cols.length], a = (opt.a || 0.9) * (0.35 + 0.65 * fl);
      if (s > 2.2) TR.glow(x, y, s * 6, col, a * 0.25);
      g.fillStyle = rgba(col, a); g.fillRect(x - s / 2, y - s / 2, s, s);
    }
    g.restore();
  };

  // ---------- post: bloom + vignette + grain + letterbox + flash
  let scene = null, sx = null, bl = null, blx = null, bl2 = null, bl2x = null;
  TR.scene = () => scene;
  function initPost(scale) {
    if (scene && scene.__s === scale) return;
    scene = mk(Math.round(W * scale), Math.round(H * scale)); scene.__s = scale; sx = scene.getContext('2d');
    bl = mk(480, 270); blx = bl.getContext('2d');
    bl2 = mk(240, 135); bl2x = bl2.getContext('2d');
  }
  // events (filled by shots): shakes [t, amp, decay], flashes [t, col, a, decay]
  TR.shakes = []; TR.flashes = [];
  TR.shakeAt = function (t) {
    let x = 0, y = 0;
    TR.shakes.forEach((s) => {
      if (t < s[0] || t > s[0] + s[2] * 6) return;
      const k = s[1] * Math.exp(-(t - s[0]) / s[2]);
      x += k * Math.sin(t * 71 + s[0] * 13); y += k * Math.cos(t * 63 + s[0] * 7);
    });
    return [x, y];
  };

  // titles + subtitles live in TR.TEXT; drawn in post (crisp, over bloom)
  TR.font = (w, px) => w + ' ' + px + 'px Cinzel, "Liberation Serif", serif';
  TR.spaced = function (gg, txt, x, y, sp, mode) {   // letter-spaced text, centred on x
    let tw = 0; const ws = [...txt].map((ch) => { const w = gg.measureText(ch).width; tw += w + sp; return w; }); tw -= sp;
    let cx = x - tw / 2;
    [...txt].forEach((ch, i) => { if (mode === 'stroke') gg.strokeText(ch, cx, y); else gg.fillText(ch, cx, y); cx += ws[i] + sp; });
    return tw;
  };

  TR.frame = function (out, t, opts) {
    opts = opts || {};
    const scale = out.width / W;
    TR.initTex(); initPost(scale);
    g = sx;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const shot = TR.shotAt(t);
    if (shot) { g.save(); shot.draw(t - shot.a, t, shot); g.restore(); }
    // ---- composite
    const o = out.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.filter = 'none';
    o.fillStyle = '#000'; o.fillRect(0, 0, out.width, out.height);
    const sh = TR.shakeAt(t), zs = 1 + Math.min(0.04, (Math.abs(sh[0]) + Math.abs(sh[1])) / 900);
    o.save(); o.translate(out.width / 2 + sh[0] * scale, out.height / 2 + sh[1] * scale); o.scale(zs, zs); o.drawImage(scene, -out.width / 2, -out.height / 2); o.restore();
    // bloom: bright parts, blurred, screened on top
    const bloomAmt = shot && shot.bloom !== undefined ? shot.bloom : 0.55;
    if (bloomAmt > 0 && !opts.fast) {
      blx.filter = 'contrast(2.1) brightness(0.85) blur(5px)'; blx.globalCompositeOperation = 'copy'; blx.drawImage(out, 0, 0, 480, 270); blx.filter = 'none';
      bl2x.filter = 'blur(6px)'; bl2x.globalCompositeOperation = 'copy'; bl2x.drawImage(bl, 0, 0, 240, 135); bl2x.filter = 'none';
      o.save(); o.globalCompositeOperation = 'screen'; o.globalAlpha = bloomAmt; o.drawImage(bl, 0, 0, out.width, out.height); o.globalAlpha = bloomAmt * 0.8; o.drawImage(bl2, 0, 0, out.width, out.height); o.restore();
    }
    o.setTransform(scale, 0, 0, scale, 0, 0);
    // vignette
    const vg = o.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.72)');
    o.fillStyle = vg; o.fillRect(0, 0, W, H);
    // flashes
    TR.flashes.forEach((f) => { if (t >= f[0] && t < f[0] + f[3] * 6) { o.fillStyle = rgba(f[1], f[2] * Math.exp(-(t - f[0]) / f[3])); o.fillRect(0, 0, W, H); } });
    // fades (black)
    const fa = TR.fadeAt(t);
    if (fa > 0) { o.fillStyle = 'rgba(0,0,0,' + fa.toFixed(3) + ')'; o.fillRect(0, 0, W, H); }
    // grain
    if (!opts.fast) { o.save(); o.globalCompositeOperation = 'overlay'; o.globalAlpha = 0.07; o.drawImage(TR.tex.grain[Math.floor(t * 24) % 4], 0, 0, W, H); o.restore(); }
    // titles (inside the picture)
    TR.drawTitles(o, t);
    // letterbox + subtitles
    o.fillStyle = '#000'; o.fillRect(0, 0, W, BAR); o.fillRect(0, H - BAR, W, BAR);
    TR.drawSubs(o, t);
    o.setTransform(1, 0, 0, 1, 0, 0);
  };

  // ---------- timeline plumbing
  TR.SHOTS = [];
  TR.shotAt = (t) => { for (let i = TR.SHOTS.length - 1; i >= 0; i--) if (t >= TR.SHOTS[i].a) return t < TR.SHOTS[i].b ? TR.SHOTS[i] : null; return null; };
  TR.FADES = [];   // [tStart, tEnd, from, to]
  TR.fadeAt = function (t) {
    let a = 0;
    TR.FADES.forEach((f) => { if (t >= f[0] && t <= f[1]) a = Math.max(a, lerp(f[2], f[3], sm(seg(t, f[0], f[1])))); });
    return a;
  };

  // subtitles: [t0, t1, text]
  TR.SUBS = [];
  TR.drawSubs = function (o, t) {
    TR.SUBS.forEach((s) => {
      if (t < s[0] - 0.15 || t > s[1] + 0.3) return;
      const a = Math.min(seg(t, s[0] - 0.15, s[0] + 0.1), 1 - seg(t, s[1], s[1] + 0.3));
      o.save(); o.globalAlpha = a; o.font = '500 31px Inter, "Liberation Sans", sans-serif'; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.fillStyle = '#ece6d8'; o.letterSpacing = '1px';
      o.fillText(s[2], W / 2, H - BAR / 2 + 2); o.restore();
    });
  };
  // titles: {t0, t1, name, sub, col, y, size, glow}
  TR.TITLES = [];
  let tl = null, tlx = null;
  TR.drawTitles = function (o, t) {
    TR.TITLES.forEach((T) => {
      if (t < T.t0 || t > T.t1) return;
      const k = seg(t, T.t0, T.t0 + 0.16), out = 1 - seg(t, T.t1 - 0.45, T.t1);
      const y = T.y || 760, size = T.size || 104, sc = lerp(1.55, 1, eo(k));
      if (!tl) { tl = mk(W, 400); tlx = tl.getContext('2d'); }
      tlx.setTransform(1, 0, 0, 1, 0, 0); tlx.clearRect(0, 0, W, 400); tlx.translate(W / 2, 250);
      tlx.textAlign = 'left'; tlx.textBaseline = 'alphabetic'; tlx.font = TR.font(900, size);
      const gr = tlx.createLinearGradient(0, -size * 0.8, 0, size * 0.1);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, mixc(T.col, '#ffffff', 0.35)); gr.addColorStop(0.55, T.col); gr.addColorStop(1, mixc(T.col, '#000000', 0.45));
      tlx.fillStyle = gr; TR.spaced(tlx, T.name, 0, 0, size * 0.12);
      tlx.lineWidth = 2; tlx.strokeStyle = 'rgba(0,0,0,0.6)'; TR.spaced(tlx, T.name, 0, 0, size * 0.12, 'stroke');
      const sw = seg(t, T.t0 + 0.35, T.t0 + 1.25);
      if (sw > 0 && sw < 1) {
        tlx.globalCompositeOperation = 'source-atop';
        const sx2 = lerp(-900, 900, sw), sg = tlx.createLinearGradient(sx2 - 120, 0, sx2 + 120, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        tlx.fillStyle = sg; tlx.fillRect(-1000, -size, 2000, size * 1.3);
        tlx.globalCompositeOperation = 'source-over';
      }
      o.save(); o.globalAlpha = k * out; o.translate(W / 2, y); o.scale(sc, sc);
      o.textAlign = 'left'; o.textBaseline = 'alphabetic'; o.font = TR.font(900, size);
      if (k < 1) o.filter = 'blur(' + ((1 - k) * 10).toFixed(1) + 'px)';
      o.shadowColor = T.glow || T.col; o.shadowBlur = 40;
      o.fillStyle = rgba(T.glow || T.col, 0.55); TR.spaced(o, T.name, 0, 0, size * 0.12);
      o.shadowBlur = 0;
      o.drawImage(tl, -W / 2, -250);
      o.filter = 'none';
      o.restore();
      // small line under: sub (e.g. COMING SOON)
      if (T.sub) {
        const k2 = seg(t, T.t0 + 0.5, T.t0 + 0.9);
        o.save(); o.globalAlpha = k2 * out; o.textAlign = 'left'; o.textBaseline = 'alphabetic';
        o.font = TR.font(700, 34); o.fillStyle = T.subCol || '#e8e0cc'; o.shadowColor = T.subCol || T.col; o.shadowBlur = 18;
        const w = TR.spaced(o, T.sub, W / 2, y + 66, 13);
        o.shadowBlur = 0; o.fillStyle = rgba(T.subCol || T.col, 0.7);
        o.fillRect(W / 2 - w / 2 - 90, y + 54, 60, 2); o.fillRect(W / 2 + w / 2 + 30, y + 54, 60, 2);
        o.restore();
      }
      if (T.over) {   // small line ABOVE the name
        const k3 = seg(t, T.t0 - 0.3, T.t0 + 0.2);
        o.save(); o.globalAlpha = k3 * out; o.textAlign = 'left'; o.font = TR.font(700, 28); o.fillStyle = '#d8d0bc';
        TR.spaced(o, T.over, W / 2, y - size * 0.95, 11); o.restore();
      }
    });
  };
})();
