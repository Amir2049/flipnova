// FLIPNOVA — HD art kit (build 47): the trailer's painting tools, made light enough for a phone.
// Used by js/hdboss.js to paint the bosses in HD on two layers around the pixel game (it never touches the simulation).
// Heavy painting (paths, rim lights, texture) happens ONCE into baked images; a frame only stamps images and sprite glows.
(function (FF) {
  'use strict';
  const HD = (FF.HD = FF.HD || {});
  const TAU = Math.PI * 2;
  const cl = (x, a, b) => { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; };
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const sm = (x) => x * x * (3 - 2 * x);
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  const hs = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const pulse = (t, t0, dur) => (t < t0 ? 0 : Math.exp(-(t - t0) / dur));
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (h, a) => { const c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + cl(a).toFixed(3) + ')'; };
  const mixc = (h1, h2, k) => { const a = hex(h1), b = hex(h2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], cl(k))).toString(16).padStart(2, '0')).join(''); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  Object.assign(HD, { TAU, cl, seg, sm, eo, lerp, hs, pulse, rgba, mixc, mk });

  let g = null;
  HD.ctx = () => g;
  HD.setCtx = (c) => { g = c; };

  // ---- glows are pre-made sprites (one per colour): a frame never builds a gradient for a glow
  const glows = new Map();
  const glowSpr = (col) => {
    let s = glows.get(col); if (s) return s;
    s = mk(128, 128); const x = s.getContext('2d'), c = hex(col), f = (a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, f(1)); gr.addColorStop(0.12, f(0.7)); gr.addColorStop(0.35, f(0.25)); gr.addColorStop(0.7, f(0.06)); gr.addColorStop(1, f(0));
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); glows.set(col, s); return s;
  };
  HD.glow = function (x, y, r, col, a, op) {
    if (!(a > 0.004) || !(r > 0.5)) return;
    const pa = g.globalAlpha, po = g.globalCompositeOperation;
    g.globalCompositeOperation = op || 'lighter'; g.globalAlpha = pa * cl(a);
    g.drawImage(glowSpr(col), x - r, y - r, 2 * r, 2 * r);
    g.globalAlpha = pa; g.globalCompositeOperation = po;
  };
  HD.disc = function (x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); };
  HD.smooth = function (pts, closed) {
    const p = new Path2D(), n = pts.length, P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k = 1 / 6; p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]); }
    if (closed) p.closePath();
    return p;
  };
  HD.poly = function (pts) { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; };
  HD.mirror = (half) => half.concat(half.slice().reverse().map((q) => [-q[0], q[1]]));
  HD.bez = function (a, b, c, d, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return o; };
  HD.taper = function (pts, w0, w1) {
    const L = [], R = [], n = pts.length;
    for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 2; L.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]); R.push([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]); }
    return HD.poly(L.concat(R.reverse()));
  };
  HD.lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; };
  HD.rad = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; };
  // fill + directional rim light (bake time only: it uses clip and shadowBlur)
  HD.lit = function (path, fill, rims, b) {
    g.fillStyle = fill; g.fill(path);
    if (!rims || !rims.length) return;
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, R = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2;
    g.save(); g.clip(path);
    rims.forEach((r) => {
      if (!(r.a > 0.003)) return;
      const lx = Math.cos(r.ang), ly = Math.sin(r.ang), gr = g.createLinearGradient(cx + lx * R, cy + ly * R, cx - lx * R * (r.span || 0.2), cy - ly * R * (r.span || 0.2));
      gr.addColorStop(0, rgba(r.col, r.a)); gr.addColorStop(0.55, rgba(r.col, r.a * 0.5)); gr.addColorStop(1, rgba(r.col, 0));
      g.strokeStyle = gr; g.lineWidth = r.w * 2; g.lineJoin = 'round';
      if (r.blur) { g.shadowColor = rgba(r.col, r.a); g.shadowBlur = r.blur * HD.bakeScale; }
      g.globalCompositeOperation = r.op || 'lighter'; g.stroke(path); g.shadowBlur = 0;
    });
    g.restore();
  };
  HD.bakeScale = 1;

  // ---- soft noise textures (made once, small: they are always drawn blurred and large)
  function fbm(size, base, oct, seed, contrast, bias) {
    const c = mk(size, size), x = c.getContext('2d'), id = x.createImageData(size, size), d = id.data, acc = new Float32Array(size * size);
    let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) {
      const f = base << o, grid = new Float32Array(f * f), cell = size / f;
      for (let i = 0; i < f * f; i++) grid[i] = hs(i * 1.731 + seed * 97.13 + o * 13.37);
      for (let y = 0; y < size; y++) {
        const gy = y / cell, y0 = Math.floor(gy), fy = sm(gy - y0), y1 = (y0 + 1) % f;
        for (let xx = 0; xx < size; xx++) { const gx = xx / cell, x0 = Math.floor(gx), fx = sm(gx - x0), x1 = (x0 + 1) % f; acc[y * size + xx] += amp * lerp(lerp(grid[y0 * f + x0], grid[y0 * f + x1], fx), lerp(grid[y1 * f + x0], grid[y1 * f + x1], fx), fy); }
      }
      tot += amp; amp *= 0.5;
    }
    for (let i = 0; i < size * size; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(cl((acc[i] / tot - 0.5) * contrast + 0.5 + (bias || 0)) * 255); }
    x.putImageData(id, 0, 0); return c;
  }
  let tid = 0; const tag = (c) => { c.__id = 't' + tid++ + ':'; return c; };
  HD.tex = null;
  HD.initTex = function () {
    if (HD.tex) return;
    HD.tex = { fog: tag(fbm(256, 4, 4, 1, 2.2, -0.05)), fog2: tag(fbm(256, 3, 4, 7, 2.6, -0.12)), wisp: tag(fbm(256, 6, 3, 3, 3.2, -0.2)) };
  };
  const tints = new Map();
  HD.tint = function (tex, col) { const k = tex.__id + col; let c = tints.get(k); if (c) return c; c = mk(tex.width, tex.height); const x = c.getContext('2d'); x.drawImage(tex, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); tints.set(k, c); return c; };
  // a tiled, drifting fog layer over the rect [0,0,W,H] of the current space
  HD.fog = function (tex, col, a, ox, oy, scale, W, H, op) {
    if (!(a > 0.004)) return;
    const t = HD.tint(tex, col), S = tex.width * scale, x0 = ((ox % S) + S) % S - S, y0 = ((oy % S) + S) % S - S;
    const pa = g.globalAlpha, po = g.globalCompositeOperation; g.globalAlpha = pa * a; if (op) g.globalCompositeOperation = op;
    for (let y = y0; y < H + 2; y += S) for (let x = x0; x < W + 2; x += S) g.drawImage(t, x, y, S + 1, S + 1);
    g.globalAlpha = pa; g.globalCompositeOperation = po;
  };
  // bake: paint once into a new image; space (bx0,by0)-(bx1,by1) at `scale` device px per unit
  HD.bake = function (bx0, by0, bx1, by1, scale, paint, grunge) {
    const c = mk((bx1 - bx0) * scale, (by1 - by0) * scale), x = c.getContext('2d'), prev = g, pbs = HD.bakeScale;
    x.setTransform(scale, 0, 0, scale, -bx0 * scale, -by0 * scale); g = x; HD.bakeScale = scale;
    try { paint(x); } finally { g = prev; HD.bakeScale = pbs; }
    if (grunge) {   // mottled surface: texture only where the paint is
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
      grunge.forEach((q) => { x.globalAlpha = q.a; const tt = HD.tint(q.tex, q.col), S = q.tex.width * q.scale * scale * 3.5; for (let yy = -((q.oy || 0) % S); yy < c.height; yy += S) for (let xx = -((q.ox || 0) % S); xx < c.width; xx += S) x.drawImage(tt, xx, yy, S + 1, S + 1); });
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
    c.__b = [bx0, by0, bx1, by1];
    return c;
  };
  HD.stamp = function (c, a, op) {   // draw a baked image back in the space it was baked in
    if (!c || !(a > 0.004)) return;
    const b = c.__b, pa = g.globalAlpha, po = g.globalCompositeOperation;
    g.globalAlpha = pa * cl(a); if (op) g.globalCompositeOperation = op;
    g.drawImage(c, b[0], b[1], b[2] - b[0], b[3] - b[1]);
    g.globalAlpha = pa; g.globalCompositeOperation = po;
  };
  // a silhouette of a baked image in one colour (hit flashes)
  HD.silhouette = function (c, col) { const s = mk(c.width, c.height), x = s.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, s.width, s.height); s.__b = c.__b; return s; };
  // a jagged lightning bolt (seeded), drawn cheaply (no shadow blur)
  HD.bolt = function (x0, y0, x1, y1, seed, rough) {
    const out = [], walk = (ax, ay, bx, by, s, r, depth) => {
      const n = 14, pts = []; for (let i = 0; i <= n; i++) { const k = i / n, j = i === 0 || i === n ? 0 : (hs(s + i * 3.1) - 0.5) * r * Math.sin(k * Math.PI) * 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1; pts.push([ax + dx * k - dy / L * j, ay + dy * k + dx / L * j]); }
      out.push({ pts, w: depth ? 1.6 : 3.4 });
      if (depth < 1) for (let b = 0; b < 3; b++) { const i = 3 + Math.floor(hs(s + b * 9.7) * 9), p = pts[i], ang = Math.atan2(by - ay, bx - ax) + (hs(s + b) - 0.5) * 1.6, L2 = 100 + hs(s + b * 2) * 200; walk(p[0], p[1], p[0] + Math.cos(ang) * L2, p[1] + Math.sin(ang) * L2, s + 50 + b * 11, r * 0.5, depth + 1); }
    };
    walk(x0, y0, x1, y1, seed, rough || 60, 0); return out;
  };
  HD.drawBolt = function (bolt, col, a) {
    if (!(a > 0.01)) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    bolt.forEach((b) => { g.beginPath(); b.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.strokeStyle = rgba(col, a * 0.25); g.lineWidth = b.w * 7; g.stroke(); g.strokeStyle = rgba(col, a * 0.6); g.lineWidth = b.w * 2.5; g.stroke(); g.strokeStyle = rgba('#ffffff', a); g.lineWidth = b.w; g.stroke(); });
    g.restore();
  };
})(window.FF = window.FF || {});
