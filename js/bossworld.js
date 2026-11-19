// FLIPNOVA — BOSS WORLDS. Every boss fights in a world drawn only for it: its own palette, tileset, sky, props
// and weather, with one variant per phase and a dramatic transition between variants (shatter / wipe).
// Reusable: a future boss registers its own world with FF.BossWorld.register({...}) and the fight draws it.
// Everything here is DRAWING ONLY (no game state is read or written except what the caller passes in), so a
// world can never change a run: replays and proofs stay exact.
(function (FF) {
  'use strict';
  const W = FF.W, H = FF.H, C = FF.C, F = FF.F;
  const BW = { defs: {}, cache: {} };
  FF.BossWorld = BW;

  // ---------- kit shared by every boss world
  const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  BW.hash = hash;
  BW.layer = function (key, w, h, paint) {
    let c = BW.cache[key];
    if (!c) { c = BW.cache[key] = FF.makeCanvas(w, h); paint(c.getContext('2d'), w, h, FF.mulberry32(FF.hashStr(key))); }
    return c;
  };
  // a horizontally tiling layer, scrolled
  // top: skip the layer's rows above it (build 38 perf: the skyline and arch layers are empty up there)
  BW.tile = function (ctx, img, scroll, y, top) {
    const w = img.width, t = top || 0, h = img.height - t;
    let x = -(((Math.round(scroll) % w) + w) % w);
    for (; x < W; x += w) { const sw = Math.min(w, W - x); if (t || sw < w) ctx.drawImage(img, 0, t, sw, h, x, y + t, sw, h); else ctx.drawImage(img, x, y); }
  };
  const vgrad = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s)); return gr; };
  BW.vgrad = vgrad;
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  BW.rect = rect;
  // a jagged crack (polyline of 1px steps) — used by worlds and by the boss sprite
  BW.crack = function (g, x, y, ang, len, col, r, branch) {
    let a = ang;
    for (let i = 0; i < len; i++) {
      a += (r() - 0.5) * 0.7;
      x += Math.cos(a); y += Math.sin(a);
      rect(g, x, y, 1, 1, col);
      if (branch && r() < 0.05) BW.crack(g, x, y, a + (r() < 0.5 ? 0.9 : -0.9), len * 0.4, col, r, false);
    }
  };

  // the drama vignette: clear inside the middle box, darker toward the edges (painted once)
  BW.vignette = () => BW.layer('citadel:vignette2', W, H, (g, w, h) => {
    const im = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = Math.max(0, 72 - x, x - (w - 72)) / 72, dy = Math.max(0, 40 - y, y - (h - 40)) / 40, d = Math.min(1, Math.hypot(dx, dy));
      im.data[(y * w + x) * 4 + 3] = Math.round(255 * 0.55 * Math.pow(d, 1.4));
    }
    g.putImageData(im, 0, 0);
  });
  BW.register = function (def) { BW.defs[def.id] = def; return def; };
  BW.get = (id) => BW.defs[id];

  // st: { v: variant index, from: previous variant (or -1), k: 0..1 transition progress, quake, flash, t }
  BW.draw = function (ctx, id, cam, t, st) {
    const def = BW.defs[id];
    if (!def) return;
    if (st.from >= 0 && st.from !== st.v && st.k < 1) {
      def.drawVariant(ctx, st.v, cam, t, st);
      // build 38 perf: the world being torn away is painted ONCE when the tear starts (it hangs frozen while it rips),
      // instead of a second full world every frame of the transition
      const buf = BW._buf || (BW._buf = FF.makeCanvas(W, H)), key = st.from + '>' + st.v + '@' + (st.ripKey || 0);
      if (BW._bufKey !== key) {
        BW._bufKey = key;
        const bg = buf.getContext('2d');
        bg.clearRect(0, 0, W, H);
        def.drawVariant(bg, st.from, cam, t, st);
      }
      const sty = st.style || def.transition;
      if (sty !== 'none') (sty === 'wipe' ? BW.wipe : sty === 'rip' ? BW.rip : BW.shatter)(ctx, buf, st.k, def.seam || '#ffb14a');
    } else def.drawVariant(ctx, st.v, cam, t, st);
  };
  // the old world breaks into shards that fall and spin away, glowing at the seams
  BW.shatter = function (ctx, buf, k, seam) {
    const S = 20, cols = Math.ceil(W / S), rows = Math.ceil(H / S);
    for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
      const i = by * cols + bx, d = Math.abs(bx - cols * 0.75) / cols * 0.5 + hash(i) * 0.3; // breaks outward from the boss side
      const q = FF.clamp((k - d) / 0.45, 0, 1);
      const x = bx * S, y = by * S;
      if (q <= 0) { ctx.drawImage(buf, x, y, S, S, x, y, S, S); continue; }
      if (q >= 1) continue;
      const fall = q * q * 160, drift = (hash(i + 9) - 0.5) * 60 * q, rot = (hash(i + 3) - 0.5) * 3 * q, sc = 1 - q * 0.5;
      ctx.save();
      ctx.globalAlpha = 1 - q;
      ctx.translate(x + S / 2 + drift, y + S / 2 + fall);
      ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.drawImage(buf, x, y, S, S, -S / 2, -S / 2, S, S);
      ctx.strokeStyle = seam; ctx.strokeRect(-S / 2 + 0.5, -S / 2 + 0.5, S - 1, S - 1);
      ctx.restore();
    }
  };
  BW.wipe = function (ctx, buf, k, seam) {
    const x = Math.round(W * k);
    ctx.drawImage(buf, x, 0, W - x, H, x, 0, W - x, H);
    rect(ctx, x - 2, 0, 3, H, seam);
  };

  // ---------- weather, stateless (a hash of the particle index and time): costs nothing, never drifts
  BW.embers = function (ctx, cam, t, n, cols, rise) {
    for (let i = 0; i < n; i++) {
      const sp = 14 + hash(i) * 30 * (rise || 1), span = H + 30;
      const y = H + 10 - ((t * sp + hash(i + 50) * span) % span);
      const x = ((hash(i + 7) * W * 2 - cam * (0.3 + hash(i + 3) * 0.5) + Math.sin(t * 1.3 + i) * 6) % W + W) % W;
      const tw = (Math.floor(t * 8 + i) % 5) === 0;
      rect(ctx, x, y, tw ? 2 : 1, tw ? 2 : 1, cols[i % cols.length]);
    }
  };
  BW.rain = function (ctx, cam, t, n, col) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const sp = 260 + hash(i) * 120, y = ((t * sp + hash(i + 5) * H) % (H + 20)) - 10;
      const x = ((hash(i + 11) * W * 1.3 - cam * 0.9 - y * 0.35) % W + W) % W;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
      ctx.fillRect(Math.round(x - 1), Math.round(y + 4), 1, 2);
    }
  };
  BW.debris = function (ctx, cam, t, n, cols) {
    for (let i = 0; i < n; i++) {
      const sp = 40 + hash(i) * 90, y = ((t * sp + hash(i + 2) * H) % (H + 20)) - 10;
      const x = ((hash(i + 4) * W * 1.7 - cam * (0.5 + hash(i + 1) * 0.6) + Math.sin(t * 2 + i) * 3) % W + W) % W;
      const s = 1 + Math.floor(hash(i + 8) * 3);
      rect(ctx, x, y, s, s, cols[i % cols.length]);
      if (s > 2) rect(ctx, x, y, 1, 1, '#ffb14a');
    }
  };
  // a forked strike from the sky down to one point (x1, y1), its fork pattern seeded by the strike: drawing only
  BW.strike = function (ctx, seed, x0, x1, y1, core, glow) {
    const r = FF.mulberry32(seed);
    const pts = [[x0, -4]];
    const n = 14;
    for (let i = 1; i <= n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + (i < n ? (r() - 0.5) * 18 : 0), -4 + (y1 + 4) * u]); }
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? core : glow;
      const w = pass ? 2 : 4;
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        for (let s = 0; s < 5; s++) ctx.fillRect(Math.round(ax + (bx - ax) * s / 5 - w / 2), Math.round(ay + (by - ay) * s / 5), w, 3);
        if (pass && i % 4 === 2) { let fx = bx, fy = by; const d = r() < 0.5 ? -1 : 1; for (let j = 0; j < 7; j++) { fx += d * (1 + r() * 3); fy += 2 + r() * 2; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 2); } }
      }
    }
  };
  // a forked lightning bolt from the sky, seeded by its own strike number
  BW.bolt = function (ctx, seed, x0, col) {
    const r = FF.mulberry32(seed);
    let x = x0, y = 0;
    ctx.fillStyle = col;
    while (y < C + 26) {
      const nx = x + (r() - 0.5) * 10, ny = y + 3 + r() * 5;
      for (let s = 0; s < 4; s++) ctx.fillRect(Math.round(x + (nx - x) * s / 4), Math.round(y + (ny - y) * s / 4), 2, 2);
      if (r() < 0.12) { let bx = x, by = y; for (let j = 0; j < 6; j++) { bx += (r() - 0.2) * 6; by += 3; ctx.fillRect(Math.round(bx), Math.round(by), 1, 2); } }
      x = nx; y = ny;
    }
  };

  // =====================================================================================================
  // 🌌 BUILD 37 — THE OTHER DIMENSIONS the duel is torn into (variants 3–5 of the Tyrant's world). Own palettes,
  // skies, tiles and particles; drawing only, like everything here.
  //   3 MIRROR VOID — indigo glass, a horizon mirror through the lane, glass spires and their reflections
  //   4 STARFALL COSMOS — nebulae, a ringed planet, a spiral galaxy, asteroid-rock tiles
  //   5 SHATTERED TIME — teal and sepia, a cracked giant clock, broken gears, frozen debris to run across
  // =====================================================================================================
  const DPAL = {
    3: { lane: 'rgba(127,232,255,0.05)', seam: '#7fe8ff', seamHi: '#ffffff', tile: '#0a0818', tileHi: '#2a2050', mote: ['#7fe8ff', '#ffb0c0', '#ffffff'] },
    4: { lane: 'rgba(184,166,255,0.05)', seam: '#e8d8ff', seamHi: '#ffffff', tile: '#1a1430', tileHi: '#4a3a7a', mote: ['#e8d8ff', '#7fe8ff', '#ffe9a0'] },
    5: { lane: 'rgba(191,246,255,0.05)', seam: '#bff6ff', seamHi: '#ffd27a', tile: '#162224', tileHi: '#3a5a5a', mote: ['#bff6ff', '#ffd27a', '#ffffff'] }
  };
  function paintDimSky(g, w, h, r, v) {
    if (v === 3) {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#04020c'); gr.addColorStop(0.45, '#1a0c36'); gr.addColorStop(0.53, '#3a1458'); gr.addColorStop(0.6, '#1a0c36'); gr.addColorStop(1, '#04020c');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const vx = w / 2, vy = FF.MID;
      g.fillStyle = 'rgba(127,232,255,0.16)';
      for (let i = -12; i <= 12; i++) for (const s of [-1, 1]) for (let k = 0; k < 90; k += 2) g.fillRect(Math.round(vx + i * k * 0.9), Math.round(vy + s * k), 1, 1);
      for (let k = 4; k < 90; k = k * 1.35) for (const s of [-1, 1]) g.fillRect(0, Math.round(vy + s * k), w, 1);
      for (let i = 0; i < 26; i++) { // glass spires on the horizon and their reflections hanging below it
        const x = r() * w, sw = 3 + r() * 7, sh = 12 + r() * 38;
        for (let y = 0; y < sh; y++) { const half = sw * (1 - y / sh) / 2 + 0.5; rect(g, x - half, vy - y, half * 2, 1, y % 5 ? '#1e1446' : '#2e2466'); rect(g, x - half, vy + y, half * 2, 1, 'rgba(30,20,70,0.6)'); }
        rect(g, x, vy - sh, 1, sh, 'rgba(127,232,255,0.5)');
      }
      rect(g, 0, vy, w, 1, '#7fe8ff');
      for (let i = 0; i < 60; i++) rect(g, r() * w, r() * h, 1, 1, r() < 0.5 ? '#7fe8ff' : '#ffffff');
    } else if (v === 4) {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#02010a'); gr.addColorStop(0.5, '#0c0630'); gr.addColorStop(1, '#1a0a3a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { // nebula clouds
        g.fillStyle = ['rgba(255,60,200,0.06)', 'rgba(60,200,255,0.06)', 'rgba(140,80,255,0.07)'][i % 3];
        g.beginPath(); g.ellipse(r() * w, 30 + r() * 120, 20 + r() * 50, 8 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill();
      }
      for (let i = 0; i < 260; i++) rect(g, r() * w, r() * h, 1, 1, r() < 0.15 ? '#ffffff' : r() < 0.5 ? '#8a7ab8' : '#4a3a7a');
      g.fillStyle = '#3a2a6a'; g.beginPath(); g.arc(244, 62, 18, 0, Math.PI * 2); g.fill(); // the ringed planet
      g.fillStyle = '#6a5aa8'; g.beginPath(); g.arc(239, 57, 13, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#e8d8ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(244, 62, 32, 7, -0.3, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
      for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 70; i++) { const u = i / 70, a = u * 8 + arm * Math.PI; rect(g, 64 + Math.cos(a) * u * 26, 128 + Math.sin(a) * u * 10, 1, 1, u < 0.3 ? '#ffffff' : '#b8a6ff'); }
    } else {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#081014'); gr.addColorStop(0.55, '#1a2a2c'); gr.addColorStop(1, '#3a3428');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const cx = 170, cy = 84, R = 62; // the giant cracked clock, its hands stopped
      g.fillStyle = 'rgba(200,168,120,0.10)'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,210,122,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, l = i % 5 ? 2 : 6; for (let k = 0; k < l; k++) rect(g, cx + Math.cos(a) * (R - 3 - k), cy + Math.sin(a) * (R - 3 - k), 1, 1, i % 5 ? 'rgba(255,210,122,0.4)' : '#ffd27a'); }
      for (let i = 0; i < 6; i++) BW.crack(g, cx + (r() - 0.5) * 40, cy + (r() - 0.5) * 40, r() * Math.PI * 2, 40 + r() * 30, 'rgba(255,255,255,0.45)', r, true);
      for (let i = 0; i < 18; i++) { // shards of the clock glass, frozen in the air
        const x = r() * w, y = 20 + r() * 120, s = 3 + r() * 8;
        g.fillStyle = 'rgba(191,246,255,0.18)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s * 0.3); g.lineTo(x + s * 0.4, y + s); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.4)'; g.stroke();
      }
      for (let i = 0; i < 5; i++) { // broken gears on the horizon
        const gx = 20 + i * 70 + r() * 20, gy = FF.F - 6, gr2 = 14 + r() * 16;
        g.fillStyle = '#122022'; g.beginPath(); g.arc(gx, gy, gr2, Math.PI, 0); g.fill();
        for (let t = 0; t < 10; t++) { const a = Math.PI + t / 9 * Math.PI; rect(g, gx + Math.cos(a) * (gr2 + 2) - 2, gy + Math.sin(a) * (gr2 + 2) - 2, 4, 4, '#122022'); }
        rect(g, gx - 2, gy - 2, 4, 4, '#3a5a5a');
      }
    }
  }
  function paintDimTile(g, w, h, r, v) {
    const P = DPAL[v];
    if (v === 3) { // black glass with a cyan seam and reflected streaks
      rect(g, 0, 0, w, h, P.tile);
      for (let x = 0; x < w; x += 16) rect(g, x, 0, 1, h, '#18143a');
      for (let i = 0; i < 6; i++) rect(g, r() * w, 2 + r() * (h - 4), 6 + r() * 10, 1, 'rgba(127,232,255,0.25)');
    } else if (v === 4) { // asteroid rock with craters and star-dust edges
      rect(g, 0, 0, w, h, P.tile);
      for (let i = 0; i < 10; i++) { const x = r() * w, y = 3 + r() * (h - 6), s = 2 + r() * 4; g.fillStyle = '#100c22'; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); rect(g, x - s, y - s, s, 1, P.tileHi); }
      for (let i = 0; i < 12; i++) rect(g, r() * w, r() * h, 1, 1, '#e8d8ff');
    } else { // frozen debris chunks with void gaps showing through and frost on their edges
      rect(g, 0, 0, w, h, '#081014');
      let x = 0;
      while (x < w) { const cw = 8 + Math.floor(r() * 12), top = Math.floor(r() * 3); rect(g, x, top, cw - 2, h - top, P.tile); rect(g, x, top, cw - 2, 1, P.seam); rect(g, x, top + 1, 1, h, P.tileHi); x += cw; }
    }
  }
  function dimLayers(v) {
    const k = 'dim:' + v;
    return {
      sky: BW.layer(k + ':sky3', W, H, (g, w, h, r) => { paintDimSky(g, w, h, r, v); g.fillStyle = DPAL[v].lane; g.fillRect(0, C, w, F - C); g.drawImage(BW.vignette(), 0, 0); }), // (b38: lane tint + vignette baked in)
      floor: BW.layer(k + ':floor', 64, H - F, (g, w, h, r) => paintDimTile(g, w, h, r, v)),
      ceil: BW.layer(k + ':ceil', 64, C, (g, w, h, r) => { g.save(); g.translate(0, h); g.scale(1, -1); paintDimTile(g, w, h, r, v); g.restore(); })
    };
  }
  BW.drawDim = function (ctx, v, cam, t, st) {
    const L = dimLayers(v), P = DPAL[v];
    ctx.drawImage(L.sky, 0, 0);
    if (st.sky) st.sky(ctx, v);
    if (v === 3) { // mirror shards drifting and turning, glints sweeping the horizon, the reflection rippling
      for (let i = 0; i < 9; i++) {
        const x = ((hash(i + 900) * 500 - cam * (0.15 + hash(i + 901) * 0.3) - t * 8) % (W + 40) + W + 40) % (W + 40) - 20, y = 44 + hash(i + 902) * 100 + Math.sin(t + i) * 4;
        ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(t * (hash(i + 903) - 0.5) * 2);
        ctx.fillStyle = 'rgba(127,232,255,0.22)'; ctx.fillRect(-4, -6, 8, 12); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-4, -6, 1, 12);
        ctx.restore();
      }
      const gx = ((t * 90) % (W + 80)) - 40;
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(Math.round(gx), FF.MID - 1, 26, 1); ctx.fillRect(Math.round(gx + 6), FF.MID + 1, 14, 1);
      for (let y = FF.MID + 4; y < F; y += 7) { ctx.fillStyle = 'rgba(127,232,255,0.06)'; ctx.fillRect(Math.round(Math.sin(y * 0.3 + t * 3) * 6), y, W, 1); }
    } else if (v === 4) { // three parallax layers of twinkling stars
      for (let i = 0; i < 54; i++) {
        const d = i % 3, x = ((hash(i + 950) * 900 - cam * (0.04 + d * 0.1)) % W + W) % W, y = hash(i + 951) * H;
        const tw = (Math.floor(t * 6) + i) % 9 === 0;
        rect(ctx, x, y, tw || d === 2 ? 2 : 1, tw || d === 2 ? 2 : 1, tw ? '#ffffff' : P.mote[d]);
      }
    } else { // the stopped clock's hands glitch a tick back and forth; frozen motes shimmer in place
      const cx = 170, cy = 84, tick = Math.floor(t * 2) % 2 ? 0.1 : 0;
      for (const [len, a, w] of [[48, -1.1 + tick, 3], [32, 0.6 - tick, 4]]) for (let s = 0; s < len; s += 2) rect(ctx, cx + Math.cos(a) * s, cy + Math.sin(a) * s, w, w, 'rgba(255,210,122,0.55)');
      for (let i = 0; i < 40; i++) { const x = ((hash(i + 980) * 640 - cam * 0.3) % W + W) % W, y = C + hash(i + 981) * (F - C); rect(ctx, x, y, 1, 1, (Math.floor(t * 4) + i) % 5 ? 'rgba(191,246,255,0.5)' : '#ffffff'); }
    }
    if (st.between) st.between(ctx, v);
    BW.embers(ctx, cam, t, 24, P.mote, v === 5 ? 0.15 : 0.7); // light motes rise (crawl, in stopped time)
    BW.tile(ctx, L.ceil, cam, 0);
    BW.tile(ctx, L.floor, cam, F);
    const pu = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = FF.rgba(P.seamHi, 0.3 + 0.35 * pu); ctx.fillRect(0, F, W, 1); ctx.fillRect(0, C - 1, W, 1);
  };
  // 🌌 build 38: the STARFALL TUNNEL's backdrop (the fight draws the tube itself). Both painted once, then only stamped:
  // a 400² square of deep space (it turns with the camera roll, so it must cover the screen at any angle) and the glow
  // at the far end of the tube.
  BW.tunnelSky = () => BW.layer('tunnel:sky', 400, 400, (g, w, h, r) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.62);
    gr.addColorStop(0, '#2a1458'); gr.addColorStop(0.35, '#120830'); gr.addColorStop(1, '#02010a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { // nebula clouds
      g.fillStyle = ['rgba(255,60,200,0.07)', 'rgba(60,200,255,0.07)', 'rgba(140,80,255,0.08)'][i % 3];
      g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 8 + r() * 26, r() * 3, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 420; i++) rect(g, r() * w, r() * h, 1, 1, r() < 0.15 ? '#ffffff' : r() < 0.5 ? '#8a7ab8' : '#4a3a7a');
    for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h; rect(g, x - 1, y, 3, 1, '#e8d8ff'); rect(g, x, y - 1, 1, 3, '#e8d8ff'); }
    g.fillStyle = '#3a2a6a'; g.beginPath(); g.arc(320, 92, 22, 0, Math.PI * 2); g.fill(); // the ringed planet
    g.fillStyle = '#6a5aa8'; g.beginPath(); g.arc(314, 86, 16, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e8d8ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(320, 92, 40, 9, -0.3, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
    for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 90; i++) { const u = i / 90, a = u * 8 + arm * Math.PI; rect(g, 80 + Math.cos(a) * u * 34, 300 + Math.sin(a) * u * 13, 1, 1, u < 0.3 ? '#ffffff' : '#b8a6ff'); }
  });
  BW.tunnelSky180 = () => BW.layer('tunnel:sky180', 400, 400, (g, w, h) => { g.translate(w, h); g.rotate(Math.PI); g.drawImage(BW.tunnelSky(), 0, 0); });
  BW.tunnelGlow = () => BW.layer('tunnel:glow', 200, 200, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,240,255,0.55)'); gr.addColorStop(0.18, 'rgba(232,180,255,0.28)'); gr.addColorStop(0.5, 'rgba(140,80,255,0.12)'); gr.addColorStop(1, 'rgba(60,20,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  // the tear between dimensions: a jagged ring that grows from the Tyrant's side across the whole screen
  BW.tearPts = function (k) {
    const pts = [], cx = W * 0.6, cy = FF.MID, R = k * k * 380;
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, rr = R * (0.7 + 0.6 * hash(i + 41)); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.75]); }
    return pts;
  };
  BW.rip = function (ctx, buf, k, seam) {
    const pts = BW.tearPts(k);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H);
    ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
    ctx.clip('evenodd'); ctx.drawImage(buf, 0, 0); ctx.restore();
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(184,166,255,0.8)'; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  };

  // =====================================================================================================
  // 🏰 THE CRIMSON CITADEL — the Crimson Tyrant's own world. Obsidian, molten gold and blood-red skies.
  // Variant 0 EMBER DUSK (phase 1) · 1 BLOOD STORM (phase 2) · 2 HELLSCAPE (phase 3, after the arena collapses)
  // =====================================================================================================
  const PAL = [
    { sky: ['#0c0208', '#2a0612', '#6a1220', '#c2381e', '#ff8a3a'], spire: '#2e0a18', spireRim: '#6a1a2a', win: '#ff7a2a', mid: '#25080f', midRim: '#5a1626', stone: '#170b12', stoneHi: '#3a1a22', seam: '#ff5a1a', seamHi: '#ffd27a', fog: 'rgba(255,90,40,0.10)' },
    { sky: ['#05020c', '#170620', '#3a0c34', '#7a1438', '#c2283a'], spire: '#1e0a26', spireRim: '#4a1858', win: '#ff3a5a', mid: '#1a0818', midRim: '#4a1640', stone: '#120a14', stoneHi: '#33182e', seam: '#ff2a4a', seamHi: '#ffb0c0', fog: 'rgba(160,40,120,0.12)' },
    { sky: ['#000000', '#1a0002', '#4a0404', '#a01404', '#ff4a00'], spire: '#1a0404', spireRim: '#7a1806', win: '#ffd23f', mid: '#140404', midRim: '#7a1a04', stone: '#0e0606', stoneHi: '#3a1208', seam: '#ff8a00', seamHi: '#fff2a0', fog: 'rgba(255,60,0,0.16)' }
  ];

  function paintSky(g, w, h, r, v) {
    const P = PAL[v];
    g.fillStyle = vgrad(g, 0, F, P.sky); g.fillRect(0, 0, w, h);
    // dithered bands between the colours (pixel-art gradient)
    for (let y = 0; y < F; y += 2) for (let x = (y >> 1) & 1; x < w; x += 2) if (r() < 0.18) rect(g, x, y, 1, 1, 'rgba(0,0,0,0.25)');
    if (v === 0) {
      // the burning eclipse: a black sun with a living corona
      const cx = 92, cy = 70;
      for (let a = 0; a < 360; a += 3) {
        const rr = 26 + r() * 9, ra = a * Math.PI / 180;
        for (let k = 22; k < rr; k++) rect(g, cx + Math.cos(ra) * k, cy + Math.sin(ra) * k * 0.95, 1, 1, k > rr - 3 ? '#ffd27a' : k > 25 ? '#ff8a3a' : '#ff5a1a');
      }
      g.fillStyle = '#ff5a1a'; g.beginPath(); g.arc(cx, cy, 23, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#050104'; g.beginPath(); g.arc(cx + 1, cy, 21, 0, Math.PI * 2); g.fill();
      // long cloud streaks
      for (let i = 0; i < 9; i++) { const y = 30 + r() * 80, x = r() * w, l = 40 + r() * 90; rect(g, x, y, l, 1, 'rgba(255,170,90,0.35)'); rect(g, x + 8, y + 1, l * 0.6, 1, 'rgba(90,10,30,0.5)'); }
    } else if (v === 1) {
      // storm wall: heavy rolling cloud banks
      for (let i = 0; i < 70; i++) {
        const x = r() * w, y = 8 + r() * 70, rw = 20 + r() * 50, rh = 6 + r() * 10;
        g.fillStyle = i % 3 ? 'rgba(20,6,30,0.7)' : 'rgba(90,20,70,0.45)';
        g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = 'rgba(255,40,80,0.5)'; g.beginPath(); g.arc(250, 48, 11, 0, Math.PI * 2); g.fill(); // a blood moon behind the storm
      g.fillStyle = 'rgba(20,6,30,0.6)'; g.fillRect(200, 44, 100, 5);
    } else {
      // the sky itself is breaking: fissures of white-hot light and a ring of floating rubble
      for (let i = 0; i < 9; i++) BW.crack(g, r() * w, r() * 60, Math.PI / 2 + (r() - 0.5), 60 + r() * 60, i % 2 ? '#ffd23f' : '#ffffff', r, true);
      for (let i = 0; i < 28; i++) { const x = r() * w, y = 20 + r() * 70, s = 2 + r() * 7; rect(g, x, y, s, s * 0.7, '#120404'); rect(g, x, y + s * 0.7 - 1, s, 1, '#ff6a00'); }
      g.fillStyle = 'rgba(255,200,60,0.65)'; g.beginPath(); g.arc(160, 150, 70, Math.PI, 0); g.fill();
      g.fillStyle = 'rgba(255,80,0,0.4)'; g.beginPath(); g.arc(160, 150, 100, Math.PI, 0); g.fill();
    }
  }
  function paintFar(g, w, h, r, v) {
    const P = PAL[v];
    // the citadel skyline: needle spires, buttresses and lit windows; in HELLSCAPE the spires are broken and tilted
    let x = 0;
    while (x < w) {
      const sw = 8 + r() * 18, sh = 34 + r() * 56, base = F + 2;
      const lean = v === 2 ? (r() - 0.5) * 0.5 : 0, broken = v === 2 && r() < 0.6;
      const top = base - sh * (broken ? 0.6 : 1);
      for (let y = Math.round(top); y < base; y++) {
        const k = (y - top) / (base - top), half = sw / 2 * (0.25 + 0.75 * Math.min(1, k * 2.2));
        const cx = x + sw / 2 + (base - y) * lean;
        rect(g, cx - half, y, half * 2, 1, P.spire);
        if (half > 3) rect(g, cx + half - 1, y, 1, 1, P.spireRim);
      }
      if (!broken) for (let k = 0; k < 6; k++) { const yy = top - 3 - k * 3; rect(g, x + sw / 2 - 0.5, yy, 1, 3, P.spire); } // needle tip
      else for (let k = 0; k < 4; k++) rect(g, x + sw / 2 + (r() - 0.5) * sw, top + r() * 4, 2, 2, P.win); // burning break
      for (let k = 0; k < 6; k++) if (r() < 0.7) rect(g, x + sw / 2 - 1 + (r() - 0.5) * sw * 0.5, top + 10 + r() * (base - top - 14), 1, 2, P.win);
      // a flying buttress to the next spire
      if (r() < 0.5) for (let k = 0; k < 14; k++) rect(g, x + sw + k, base - 34 + Math.sin(k / 14 * Math.PI) * -8, 1, 2, P.spire);
      x += sw + 4 + r() * 18;
    }
    g.fillStyle = vgrad(g, F - 30, F, ['rgba(0,0,0,0)', P.fog.replace(/[\d.]+\)$/, '0.4)')]);
    g.fillRect(0, F - 30, w, 30);
  }
  function paintMid(g, w, h, r, v) {
    const P = PAL[v];
    // colossal ruined arches and toppled statues of horned kings, with hanging chains
    for (let i = 0; i < 4; i++) {
      const ax = i * (w / 4) + r() * 30, aw = 60 + r() * 30, top = 58 + r() * 20;
      const broke = v === 2 || r() < 0.3;
      for (const side of [0, 1]) {
        const px = ax + side * (aw - 12);
        rect(g, px, top, 12, F - top, P.mid);
        rect(g, px + (side ? 0 : 11), top, 1, F - top, P.midRim);
        for (let y = top + 6; y < F; y += 9) rect(g, px + 1, y, 10, 1, 'rgba(0,0,0,0.35)');
      }
      // the arch itself
      for (let a = 0; a <= 40; a++) {
        if (broke && a > 18 && a < 28) continue;
        const an = Math.PI + (a / 40) * Math.PI, ex = ax + aw / 2 + Math.cos(an) * (aw / 2 - 6), ey = top + 4 + Math.sin(an) * 24;
        rect(g, ex - 4, ey, 9, 6, P.mid);
        rect(g, ex - 4, ey, 9, 1, P.midRim);
      }
      // a horned stone head on a plinth between arches
      const sx = ax + aw + 12, sy = F - 46;
      rect(g, sx, sy + 26, 22, 20, P.mid);
      rect(g, sx + 3, sy + 6, 16, 18, P.mid);
      for (let k = 0; k < 8; k++) { rect(g, sx + 2 - k * 0.6, sy + 6 - k, 2, 1, P.mid); rect(g, sx + 18 + k * 0.6, sy + 6 - k, 2, 1, P.mid); }
      rect(g, sx + 6, sy + 13, 3, 2, v === 2 ? '#ffd23f' : P.win); rect(g, sx + 13, sy + 13, 3, 2, v === 2 ? '#ffd23f' : P.win);
      rect(g, sx + 3, sy + 6, 1, 18, P.midRim);
      // chains hanging from the dark above
      for (let c = 0; c < 2; c++) {
        const cx = ax + 14 + r() * (aw - 28), len = 18 + r() * 30;
        for (let y = C; y < C + len; y += 3) rect(g, cx + ((y / 3) & 1), y, 2, 2, (y / 3) & 1 ? P.midRim : '#0a0306');
        rect(g, cx - 2, C + len, 6, 4, P.midRim); // a hook
      }
    }
    // braziers (their flames are animated live by the world)
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(0, F - 4, w, 4);
  }
  // the tileset: obsidian bricks with molten seams on the floor; on the ceiling, inverted teeth of black rock
  function paintFloor(g, w, h, r, v) {
    const P = PAL[v];
    rect(g, 0, 0, w, h, P.stone);
    for (let row = 0; row < 3; row++) {
      const y = row * 8, off = row % 2 ? 8 : 0;
      for (let x = -off; x < w; x += 16) {
        rect(g, x + 1, y + 1, 14, 6, row ? P.stone : P.stoneHi);
        rect(g, x + 1, y + 1, 14, 1, P.stoneHi);
        rect(g, x, y, 1, 8, '#050205');
        if (r() < 0.35) rect(g, x + 3 + r() * 8, y + 3, 2 + r() * 3, 1, P.seam);
      }
      rect(g, 0, y, w, 1, '#050205');
    }
    // the molten seam along the running surface
    for (let x = 0; x < w; x++) rect(g, x, 0, 1, 1, (x % 9) < 6 ? P.seam : P.seamHi);
  }
  function paintCeil(g, w, h, r, v) {
    const P = PAL[v];
    rect(g, 0, 0, w, h, '#070306');
    for (let x = 0; x < w; x += 4) {
      const d = 4 + Math.floor(r() * 8);
      rect(g, x, h - d, 4, d, P.stone);
      rect(g, x, h - d, 1, d, P.stoneHi);
    }
    for (let i = 0; i < 3; i++) { // stalactite teeth
      const x = r() * (w - 6), l = 6 + r() * 10;
      for (let k = 0; k < l; k++) rect(g, x + k * 0.25, h - 4 + k * 0, Math.max(1, 5 - k * 0.4), 1, P.stone);
    }
    for (let x = 0; x < w; x++) rect(g, x, h - 1, 1, 1, (x % 7) < 4 ? P.seam : '#5a0a10');
  }

  BW.register({
    id: 'citadel',
    name: 'THE CRIMSON CITADEL', nameAr: 'قلعة الجمر',
    variants: ['EMBER DUSK', 'BLOOD STORM', 'HELLSCAPE', 'MIRROR VOID', 'STARFALL COSMOS', 'SHATTERED TIME'],
    transition: 'shatter',
    seam: '#ffb14a',
    layers(v) {
      const k = 'citadel:' + v;
      return {
        sky: BW.layer(k + ':sky', W, H, (g, w, h, r) => paintSky(g, w, h, r, v)),
        far: BW.layer(k + ':far', 640, H, (g, w, h, r) => paintFar(g, w, h, r, v)),
        mid: BW.layer(k + ':mid2', 560, H, (g, w, h, r) => { paintMid(g, w, h, r, v); g.fillStyle = v === 2 ? 'rgba(255,60,0,0.07)' : v === 1 ? 'rgba(140,20,90,0.06)' : 'rgba(255,80,30,0.05)'; g.fillRect(0, C, w, F - C); }), // (b38: haze baked in)
        floor: BW.layer(k + ':floor', 64, H - F, (g, w, h, r) => paintFloor(g, w, h, r, v)),
        ceil: BW.layer(k + ':ceil', 64, C, (g, w, h, r) => paintCeil(g, w, h, r, v))
      };
    },
    drawVariant(ctx, v, cam, t, st) {
      if (v === 4 && st.tunnel) return st.tunnel(ctx); // build 38: the STARFALL COSMOS is drawn as the fight's 3D tunnel
      if (v >= 3) return BW.drawDim(ctx, v, cam, t, st);
      const L = this.layers(v), P = PAL[v];
      const qx = st.quake ? Math.round(Math.sin(t * 53) * st.quake) : 0;
      ctx.drawImage(L.sky, 0, 0);
      if (st.sky) st.sky(ctx, v); // build 37: the fight paints live sky events here (crimson moon, aurora)
      if (v === 0) { // the corona breathes
        const p = 0.5 + 0.5 * Math.sin(t * 2);
        ctx.fillStyle = 'rgba(255,140,60,' + (0.06 + p * 0.06).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(92, 70, 38 + p * 4, 0, Math.PI * 2); ctx.fill();
      }
      // lightning in the storm (and in the hellscape, red)
      if (v >= 1) {
        const per = v === 1 ? 2.3 : 1.7, n = Math.floor(t / per), ph = t - n * per;
        if (ph < 0.22 && hash(n) < 0.8) {
          if (ph < 0.06 || (ph > 0.11 && ph < 0.15)) { ctx.fillStyle = v === 1 ? 'rgba(230,200,255,0.22)' : 'rgba(255,120,60,0.2)'; ctx.fillRect(0, 0, W, H); }
          BW.bolt(ctx, n * 7 + 1, 30 + hash(n + 1) * 260, v === 1 ? '#f2e6ff' : '#ffd27a');
        }
      }
      BW.tile(ctx, L.far, cam * 0.12 + qx, 0, 44);
      // a slow wall of drifting fog between far and mid
      ctx.fillStyle = P.fog;
      for (let i = 0; i < 6; i++) { const fx = ((i * 97 - cam * 0.22 - t * 6) % 420 + 420) % 420 - 60; ctx.fillRect(Math.round(fx), F - 40 - (i % 3) * 8, 90, 10); }
      if (st.between) st.between(ctx, v); // build 37: far-distance events (lava geysers) sit behind the arches
      BW.tile(ctx, L.mid, cam * 0.4 + qx, 0, 32);
      // living braziers on the mid layer
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 187 + 60 - cam * 0.4) % 560 + 560) % 560;
        if (bx > W + 10) continue;
        rect(ctx, bx - 4, F - 12, 9, 3, P.midRim); rect(ctx, bx - 1, F - 9, 3, 9, P.mid);
        for (let k = 0; k < 6; k++) {
          const fh = (Math.sin(t * 13 + k * 1.7 + i) * 0.5 + 0.5) * 6 + 3;
          rect(ctx, bx - 3 + k, F - 12 - fh, 1, fh, k % 2 ? P.seam : P.seamHi);
        }
      }
      // weather
      if (v === 0) BW.embers(ctx, cam, t, 46, ['#ff8a3a', '#ffd27a', '#ff4a1a']);
      if (v === 1) { BW.rain(ctx, cam, t, 70, 'rgba(255,170,200,0.35)'); BW.embers(ctx, cam, t, 20, ['#ff3a5a', '#ffb0c0']); }
      if (v === 2) { BW.debris(ctx, cam, t, 22, ['#2a0a06', '#120404', '#3a1208']); BW.embers(ctx, cam, t, 44, ['#ffd23f', '#ff8a00', '#ffffff'], 1.8); } // (b37: lighter — the fight adds its own falling debris here)
      // the corridor glow (heat haze over the running lane)
      // (the corridor's heat haze is baked into the mid layer: build 38 perf)
      BW.tile(ctx, L.ceil, cam + qx, 0);
      BW.tile(ctx, L.floor, cam + qx, F);
      // molten seams pulse
      const pu = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.fillStyle = FF.rgba(P.seamHi, 0.25 + 0.35 * pu);
      ctx.fillRect(0, F, W, 1); ctx.fillRect(0, C - 1, W, 1);
      if (v === 2) { // lava drips from the broken ceiling
        for (let i = 0; i < 7; i++) {
          const dx = ((i * 53 + 20 - cam) % 360 + 360) % 360, dy = ((t * 70 + hash(i) * 120) % 120);
          if (dx < W) { rect(ctx, dx, C + dy * 0.3, 1, 2, '#ff8a00'); rect(ctx, dx, C, 1, 2, '#ffd23f'); }
        }
      }
    },
    // foreground: fast silhouettes outside the running lane (above the ceiling / below the floor) for depth
    drawFront(ctx, v, cam, t, st) {
      for (let i = 0; i < 4 && v < 3; i++) {
        const x = ((i * 157 - cam * 1.6) % 640 + 640) % 640 - 60;
        if (x > W) continue;
        // hanging chain bundles above the lane
        for (let y = 0; y < C - 6; y += 3) rect(ctx, x + ((y / 3) & 1), y, 3, 2, '#050104');
        rect(ctx, x - 3, C - 8, 9, 4, '#050104');
        // jagged rubble below the lane
        for (let k = 0; k < 18; k++) rect(ctx, x + 40 + k * 2, F + 12 + Math.abs(Math.sin(k * 1.3)) * 8, 2, H, '#050104');
      }
      if (v >= 3) return; // (the dimensions have their vignette baked into the sky: build 38 perf)
      // a vignette sells the drama; in the arena collapse it also carries the red tint and the cracks. build 38 perf: it is
      // clear in the middle, so only its four edge bands are stamped (they used to be three full-screen blends)
      const L = v === 2 ? BW.layer('citadel:collapseEdge', W, H, (g, w, h, r) => {
        g.fillStyle = 'rgba(255,20,0,0.075)'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 6; i++) BW.crack(g, r() < 0.5 ? 0 : w, r() * h, r() * Math.PI * 2, 90, 'rgba(255,200,80,0.3)', r, true);
        g.drawImage(BW.vignette(), 0, 0);
      }) : BW.vignette();
      if (v === 2) ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 3.1);
      ctx.drawImage(L, 0, 0, W, 40, 0, 0, W, 40); ctx.drawImage(L, 0, H - 40, W, 40, 0, H - 40, W, 40);
      ctx.drawImage(L, 0, 40, 72, H - 80, 0, 40, 72, H - 80); ctx.drawImage(L, W - 72, 40, 72, H - 80, W - 72, 40, 72, H - 80);
      ctx.globalAlpha = 1;
    }
  });
})(window.FF);
