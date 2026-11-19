// ⚔️ WEEKLY BOSS frame-time check (build 37): plays the whole duel (planning bot) in the real requestAnimationFrame loop
// with Chrome's CPU throttled 4x, timing each frame's work (simulation ticks + the full render), and reports
// p50/p95/p99/max per dimension (the test bot's own look-ahead is excluded: a player's thumb costs nothing). Pass = whole-fight p95 under 16.7 ms (60 fps)
// and (build 38) every dimension's p95 under 16.7 ms too, the STARFALL TUNNEL included.
// usage: node tools/boss-perf.js [rate=4]   (BOSS_PORT overrides the mock-server port, default 8813)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = +process.env.BOSS_PORT || 8813;
const FF_DIMS = ['citadel', 'mirror', 'cosmos', 'shatter', 'collapse'];
const RATE = +process.argv[2] || 4;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:' + PORT + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.evaluate(() => { FF.save.tutDone = 1; FF.save.runs = 12; FF.UI.persist(); FF.UI.act('boss'); });
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.boss);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const res = await page.evaluate(() => new Promise((done) => {
    const g = FF.UI.game, B = g.boss, DIMS = FF.BOSS_DIMS;
    B.botLate = true;
    const samples = [];
    let n = 0, f = 0, t0 = 0, bot = 0;
    // the planning bot stands in for the player's thumb: its look-ahead is not part of the game's frame, so it is timed apart
    const tick = () => { const b0 = performance.now(); const want = !g.dead && (n & 1) === 0 && !g.pendingFlip && B.botShouldFlip(); bot += performance.now() - b0; if (want) g.botAct(); g.tick(FF.STEP); n++; };
    const origRender = g.render.bind(g);
    g.update = function () { t0 = performance.now(); bot = 0; const k = f++ & 1 ? 3 : 2; for (let i = 0; i < k && !g.ended && !g.dead; i++) tick(); };
    g.render = function (c) {
      origRender(c);
      if (t0) samples.push([performance.now() - t0 - bot, B.mode === 'intro' ? 'intro' : B.mode === 'dying' || B.mode === 'reward' || B.mode === 'won' ? 'finale' : DIMS[B.dim].id]);
      t0 = 0;
      if (g.ended || g.dead || samples.length > 60 * 150) { g.update = () => {}; done({ samples, won: B.won, dims: B.dims.join('>'), fx: Object.keys(B.fxDrawn).length }); }
    };
  }));
  const stat = (arr) => { const a = arr.slice().sort((x, y) => x - y), q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))]; return { n: a.length, p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), p99: +q(0.99).toFixed(2), max: +a[a.length - 1].toFixed(2) }; };
  const all = stat(res.samples.map((s) => s[0]));
  const per = {};
  for (const k of [...new Set(res.samples.map((s) => s[1]))]) per[k] = stat(res.samples.filter((s) => s[1] === k).map((s) => s[0]));
  console.log('CPU throttle', RATE + 'x', { won: res.won, dims: res.dims, fxDrawn: res.fx });
  console.log('all frames', all);
  console.table(per);
  // build 38: every DIMENSION must hold 60 fps at p95 too (not just the whole fight)
  const dimsOk = FF_DIMS.every((k) => !per[k] || per[k].p95 < 16.7);
  const pass = all.p95 < 16.7 && dimsOk && !errs.length;
  const over = Object.entries(per).filter(([, st]) => st.p95 >= 16.7).map(([k, st]) => k + ' ' + st.p95 + ' ms');
  if (over.length) console.log('WARNING: dimensions over 16.7 ms at p95:', over.join(', '));
  console.log(pass ? 'BOSS PERF PASSED (whole fight p95 ' + all.p95 + ' ms, every dimension < 16.7 ms)' : 'BOSS PERF FAILED', errs);
  await b.close(); srv.kill();
  process.exit(pass ? 0 : 1);
})();
