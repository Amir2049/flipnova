// FLIPNOVA — boot, scaling, main loop and input.
(function (FF) {
  'use strict';
  const UI = FF.UI;
  const stage = document.getElementById('stage');
  const screen = document.getElementById('screen');
  screen.width = FF.W;
  screen.height = FF.H;
  const ctx = screen.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  FF.prepareWorlds();

  function fit() {
    const s = Math.min(window.innerWidth / FF.W, window.innerHeight / FF.H);
    stage.style.width = Math.floor(FF.W * s) + 'px';
    stage.style.height = Math.floor(FF.H * s) + 'px';
    document.documentElement.style.setProperty('--u', s + 'px');
  }
  window.addEventListener('resize', fit);
  fit();

  // pixel logo
  (function drawLogo() {
    const c = document.getElementById('logo');
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    // b59: the game is FLIPPO now (the hero's name): FLIP in white, PO in gold, one word
    const x0 = Math.round(60 - FF.font.width('FLIPPO', 3) / 2);
    // (FLIP white + PO gold, each with its outline; PO starts one full letter-advance after FLIP)
    FF.font.draw(g, 'FLIP', x0, 12, { scale: 3, color: '#ffffff', outline: '#05060d' });
    FF.font.draw(g, 'PO', x0 + 4 * 6 * 3, 12, { scale: 3, color: FF.COLORS.coin, outline: '#05060d' });
    g.fillStyle = FF.COLORS.blue;
    g.fillRect(14, 39, 46, 2);
    g.fillStyle = FF.COLORS.purple;
    g.fillRect(60, 39, 46, 2);
  })();

  // attract-mode demo behind the menus: a bot plays for real using the same physics
  function newDemo() {
    return new FF.Game({ mode: 'demo', settings: { reduceFx: true }, skin: FF.save.skin, trail: FF.save.trail, seed: Math.floor(Math.random() * 1e9) });
  }
  UI.demo = newDemo();

  UI.init();

  // ---------------- pixel wipe between screens (diagonal sweep of blocks)
  const wipeCv = document.getElementById('wipe');
  const wctx = wipeCv.getContext('2d');
  let wipe = null;
  const WT = 0.2;
  FF.wipe = function (fn) {
    if (wipe) { fn(); return; }
    wipe = { t: 0, fn, done: false };
  };
  function drawWipe(dt) {
    if (!wipe) return;
    wipe.t += dt;
    let p;
    if (wipe.t < WT) p = wipe.t / WT;
    else {
      if (!wipe.done) { wipe.done = true; try { wipe.fn(); } catch (e) { console.error(e); } }
      p = 1 - (wipe.t - WT) / WT;
    }
    wctx.clearRect(0, 0, FF.W, FF.H);
    if (wipe.t >= WT * 2) { wipe = null; return; }
    const B = 16, cols = FF.W / B, rows = Math.ceil(FF.H / B);
    for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
      const r = (bx + by * 0.6) / (cols + rows * 0.6);
      const cover = p * 1.25 - r;
      if (cover <= 0) continue;
      const sz = Math.min(B, Math.ceil(cover * 5 * B));
      const o = (B - sz) >> 1;
      wctx.fillStyle = cover < 0.12 ? ((bx + by) & 1 ? FF.COLORS.blue : FF.COLORS.purple) : '#05060d';
      wctx.fillRect(bx * B + o, by * B + o, sz, sz);
    }
  }

  let last = performance.now();
  function frame(now) {
    if (FF.HDBoss) FF.HDBoss.post(); // 🎬 b47: the HD boss layers hide when the last frame had no HD fight
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    drawWipe(dt);
    if (FF.Editor.active) {
      FF.Editor.render(ctx, dt);
      requestAnimationFrame(frame);
      return;
    }
    // b46: a full-screen film or the boss level covers everything: draw nothing underneath (no lag)
    if (UI.film || (FF.BossLevel && FF.BossLevel.active())) { requestAnimationFrame(frame); return; }
    // build 36: with no run on, the menus sit on the living background (FF.HomeBg) instead of the bot demo
    if (!UI.game && FF.HomeBg && !FF.MAKER_APP) {
      FF.HomeBg.render(ctx, dt);
      requestAnimationFrame(frame);
      return;
    }
    const g = UI.game || UI.demo;
    if (UI.game) {
      UI.game.update(dt);
    } else {
      if (UI.demo.opts.skin !== FF.save.skin) UI.demo.opts.skin = FF.save.skin;
      UI.demo.update(dt);
    }
    g.render(ctx);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------------- input: one finger, whole screen
  function tryFlip() {
    if (UI.game && !UI.screen) UI.game.flip();
  }
  function logical(e) {
    const r = screen.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * FF.W, ((e.clientY - r.top) / r.height) * FF.H];
  }
  stage.addEventListener('pointerdown', (e) => {
    FF.audio.init();
    if (UI.screen === 'over' && !e.target.closest('button, a, input, textarea, .miniBoard') && UI.overAt && performance.now() - UI.overAt > 300) { e.preventDefault(); UI.act('again'); return; }
    if (e.target.closest('button, input, textarea, .card, .item, .screen, .edTop, .edTools, .edArrow')) return;
    if (FF.Editor.active) {
      const [x, y] = logical(e);
      FF.Editor.pointerDown(x, y);
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      e.preventDefault();
      return;
    }
    e.preventDefault();
    // ⚔️ b42: the boss duel's ULT button (bottom-left), or keep a tap held down to unleash the ultimate
    const G = UI.game;
    if (G && !UI.screen && G.boss) {
      const [x, y] = logical(e);
      if (G.boss.ultHit(x, y)) { G.ultAct(); return; }
      if (G.boss.ultReady()) UI.holdAt = performance.now();
    }
    tryFlip();
  }, { passive: false });
  const endHold = () => { UI.holdAt = 0; };
  stage.addEventListener('pointerup', endHold); stage.addEventListener('pointercancel', endHold);
  setInterval(() => { const G = UI.game; if (UI.holdAt && G && G.boss && !UI.screen && performance.now() - UI.holdAt > 450) { UI.holdAt = 0; G.ultAct(); } }, 50);
  stage.addEventListener('pointermove', (e) => { if (FF.Editor.active && FF.Editor.drag) { const [x, y] = logical(e); FF.Editor.pointerMove(x, y); } });
  stage.addEventListener('pointerup', (e) => {
    if (FF.Editor.active && FF.Editor.drag) { const [x, y] = logical(e); FF.Editor.pointerUp(x, y); }
    if (UI.game) UI.game.release();
  });
  window.addEventListener('keyup', (e) => {
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && UI.game) UI.game.release();
  });
  stage.addEventListener('pointercancel', () => { FF.Editor.drag = null; if (UI.game) UI.game.release(); });
  stage.addEventListener('wheel', (e) => { if (FF.Editor.active) { FF.Editor.scroll((e.deltaY + e.deltaX) * 0.5); e.preventDefault(); } }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (FF.Editor.active) {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') FF.Editor.scroll(32);
      if (e.key === 'ArrowLeft') FF.Editor.scroll(-32);
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) FF.Editor.undoLast();
      return;
    }
    if (e.repeat) return;
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W') {
      e.preventDefault();
      FF.audio.init();
      if (UI.screen === 'over') UI.act('again');
      else if (UI.screen === 'home' && k === ' ') UI.act('play');
      else tryFlip();
    } else if ((k === 'e' || k === 'E' || k === 'Shift') && UI.game && UI.game.boss && !UI.screen) { // ⚔️ b42: the ultimate
      e.preventDefault(); UI.game.ultAct();
    } else if (k === 'Escape' || k === 'p' || k === 'P') {
      if (UI.screen === 'pause') UI.act('resume');
      else UI.pause();
    } else if (k === 'Enter' && UI.screen === 'over') UI.act('again');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { UI.pause(); if (UI.film) UI.film.video.pause(); } else if (UI.film) UI.film.video.play().catch(() => {}); });
  window.addEventListener('blur', () => UI.pause());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // offline / installable (only over http(s))
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0 && navigator.userAgent.indexOf('FlipFrenzyApp') < 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})(window.FF);
