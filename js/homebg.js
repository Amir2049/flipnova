// FLIPNOVA — build 36: the living menu background (drawn on the game canvas while no run is on).
// Layers, back to front: the world's sky + far skyline, a time-of-day light (dawn / day / dusk / night: it starts at
// the player's real hour and moves on with every world), stars and a moon or sun, the mid skyline, the world's
// weather, neon motes drifting at three depths, the corridor rails and a little Flippo running and flipping gravity.
// Every 11 s the scene cross-fades to the next world. Pure drawing: no game state, no input, no sound.
// With "reduce effects" (or the system's reduced-motion) it slows right down and drops the particles.
(function (FF) {
  'use strict';
  const W = FF.W, H = FF.H;
  const HOLD = 11, FADE = 1.4;
  const TODS = ['dawn', 'day', 'dusk', 'night'];
  const hour = new Date().getHours();
  const tod0 = hour >= 5 && hour < 8 ? 0 : hour >= 8 && hour < 17 ? 1 : hour >= 17 && hour < 20 ? 2 : 3;
  const day = Math.floor(Date.now() / 86400000);
  const st = { t: 0, scroll: 0, wi: day % 9, n: 0, fade: 0, runner: { y: FF.F - 12, grav: 1, vy: 0, next: 1.6, spin: 0 } };
  const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const wrap = (v, m) => ((v % m) + m) % m;
  let reduced = false;
  try { reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { /* old browser */ }

  function tiled(ctx, img, offset, y) {
    if (!img) return;
    const iw = img.width;
    for (let x = -wrap(offset, iw); x < W; x += iw) ctx.drawImage(img, Math.round(x), y);
  }
  function worldAt(i) { return FF.WORLDS[wrap(i, FF.WORLDS.length)]; }
  function todAt(n) { return TODS[(tod0 + n) % 4]; }

  // the light of the hour: a wash over the sky and the far skyline
  function light(ctx, tod, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (tod === 'dawn') { g.addColorStop(0, 'rgba(255,120,90,0.30)'); g.addColorStop(0.6, 'rgba(255,190,120,0.12)'); g.addColorStop(1, 'rgba(40,10,60,0.10)'); }
    else if (tod === 'day') { g.addColorStop(0, 'rgba(140,220,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0.02)'); }
    else if (tod === 'dusk') { g.addColorStop(0, 'rgba(120,40,170,0.34)'); g.addColorStop(0.55, 'rgba(255,90,120,0.16)'); g.addColorStop(1, 'rgba(20,6,40,0.22)'); }
    else { g.addColorStop(0, 'rgba(4,6,30,0.55)'); g.addColorStop(1, 'rgba(4,6,24,0.30)'); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // the sky body: a pixel sun (day / dawn) or moon (dusk / night), drifting slowly
    const bx = Math.round(236 - (t % 120) * 0.15), by = tod === 'day' ? 50 : tod === 'night' ? 46 : 64;
    if (tod === 'night' || tod === 'dusk') {
      // b66: a full pixel disc with craters. The old crescent was cut with dark rectangles, which only matched a
      // near-black sky: on the desert / nebula / jungle skies it showed as a tan square with a navy notch.
      ctx.fillStyle = 'rgba(255,246,214,0.85)';
      [4, 8, 10, 10, 10, 10, 8, 4].forEach((w, r) => ctx.fillRect(bx - w / 2, by - 4 + r, w, 1));
      ctx.fillStyle = 'rgba(205,190,150,0.75)';
      ctx.fillRect(bx - 3, by - 2, 2, 2); ctx.fillRect(bx + 1, by + 1, 3, 2); ctx.fillRect(bx - 1, by + 3, 1, 1);
    } else {
      ctx.fillStyle = tod === 'dawn' ? 'rgba(255,170,90,0.8)' : 'rgba(255,240,170,0.8)';
      ctx.fillRect(bx - 5, by - 7, 10, 14); ctx.fillRect(bx - 7, by - 5, 14, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(bx - 3, by - 5, 3, 3);
    }
    if (tod === 'night' || tod === 'dusk') {
      const n = tod === 'night' ? 44 : 18;
      for (let i = 0; i < n; i++) {
        const a = 0.25 + 0.6 * Math.max(0, Math.sin(t * (1 + hash(i + 3) * 2) + i * 2.1));
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fillRect(Math.round(wrap(hash(i) * W - st.scroll * 0.03, W)), Math.round(hash(i + 90) * 70), 1, 1);
      }
      // now and then a shooting star
      const k = t % 9;
      if (tod === 'night' && k < 0.7) {
        const sx = 60 + hash(Math.floor(t / 9)) * 200 - k * 140, sy = 12 + k * 40;
        for (let j = 0; j < 8; j++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.8 - j * 0.1).toFixed(2) + ')'; ctx.fillRect(Math.round(sx + j * 3), Math.round(sy - j), 2, 1); }
      }
    }
  }

  function scene(ctx, w, tod, t, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    tiled(ctx, w.far, st.scroll * 0.12, FF.MID - 160);
    light(ctx, tod, t);
    tiled(ctx, w.mid, st.scroll * 0.35, FF.MID - 160);
    if (!reduced) FF.drawWeather(ctx, w, st.scroll, t);
    // the corridor: a faint ceiling, a solid floor and their neon edges
    ctx.globalAlpha = alpha * 0.55;
    tiled(ctx, w.ceilTile, st.scroll, FF.C - 60);
    ctx.globalAlpha = alpha;
    tiled(ctx, w.floorTile, st.scroll, FF.F);
    ctx.fillStyle = w.edge;
    ctx.fillRect(0, FF.C - 1, W, 1);
    ctx.fillRect(0, FF.F, W, 1);
    ctx.restore();
  }

  // neon motes at three depths: far ones are small and slow, near ones big and quick
  function motes(ctx, w, t) {
    const cols = [w.edge, FF.COLORS.blue, FF.COLORS.purple, FF.COLORS.coin];
    for (let i = 0; i < 34; i++) {
      const d = 1 + (i % 3);
      const x = wrap(hash(i) * W - st.scroll * 0.25 * d + Math.sin(t * 0.7 + i) * 4, W);
      const y = wrap(hash(i + 40) * H - t * (5 + d * 6), H);
      ctx.globalAlpha = (0.25 + 0.2 * d) * (0.6 + 0.4 * Math.sin(t * 3 + i));
      ctx.fillStyle = cols[i % 4];
      ctx.fillRect(Math.round(x), Math.round(y), d === 3 ? 2 : 1, d === 3 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }

  // a Flippo who runs along the corridor and flips gravity every couple of seconds
  function runner(ctx, dt, t) {
    const r = st.runner;
    r.next -= dt;
    if (r.next <= 0 && Math.abs(r.vy) < 1) { r.grav = -r.grav; r.vy = -r.grav * 40; r.next = 1.8 + hash(Math.floor(t)) * 1.6; r.spin = 0.25; }
    r.vy += r.grav * 900 * dt;
    r.y += r.vy * dt;
    const top = FF.C, bot = FF.F - 12;
    if (r.y > bot) { r.y = bot; r.vy = 0; }
    if (r.y < top) { r.y = top; r.vy = 0; }
    r.spin = Math.max(0, r.spin - dt);
    const x = 30 + Math.sin(t * 0.4) * 6;
    const air = r.y > top && r.y < bot;
    const skin = (FF.save && FF.save.skin) || 'flippo';
    // a short trail behind it
    for (let j = 1; j <= 4; j++) {
      ctx.globalAlpha = 0.18 * (5 - j) / 4;
      ctx.fillStyle = FF.COLORS.blue;
      ctx.fillRect(Math.round(x - j * 4), Math.round(r.y + 4), 3, 4);
    }
    ctx.globalAlpha = 1;
    FF.drawFlippo(ctx, x, r.y, { skin, face: air ? 'focus' : 'run', foot: air ? -1 : Math.floor(t * 10) & 1, flipY: r.grav < 0, sy: r.spin > 0 ? 0.8 : 1, sx: r.spin > 0 ? 1.2 : 1 });
  }

  FF.HomeBg = {
    state: st,
    world: () => worldAt(st.wi).id,
    tod: () => todAt(st.n),
    render(ctx, dt) {
      const lite = reduced || !!(FF.save && FF.save.settings && FF.save.settings.reduceFx);
      st.t += dt;
      st.scroll += dt * (lite ? 6 : 24);
      st.fade += dt;
      if (st.fade >= HOLD + FADE) { st.fade = 0; st.wi++; st.n++; }
      const t = st.t, cur = worldAt(st.wi);
      ctx.fillStyle = '#05060d';
      ctx.fillRect(0, 0, W, H);
      scene(ctx, cur, todAt(st.n), t, 1);
      if (st.fade > HOLD) scene(ctx, worldAt(st.wi + 1), todAt(st.n + 1), t, lite ? 1 : (st.fade - HOLD) / FADE);
      if (!lite) motes(ctx, cur, t);
      runner(ctx, dt, t);
    }
  };
})(window.FF = window.FF || {});
