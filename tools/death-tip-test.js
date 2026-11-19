// b66: every death gets the right tip.
// Before b66 the ground "looks" added in b59 (block, mace, crystal, ember: t 'hblock' with a look) reported the cause
// 'hblock', so dying on one in Endless showed the FLIGHT TUNNEL tip ("hold to rise, release to fall").
// This plays many Endless runs with random taps, and checks:
//   1. a death on a ground look reports look_floor / look_ceil, never hblock
//   2. every cause seen has a tip in Arabic AND English
// usage: node tools/death-tip-test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/supabase\.co/, (r) => r.abort());
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen);
  const r = await page.evaluate(() => {
    const out = { runs: 0, causes: {}, lookDeaths: 0, wrong: [], missingTip: [] };
    for (let seed = 1; seed <= 400; seed++) {
      const g = new FF.Game({ mode: 'endless', seed, silent: true, settings: {}, callbacks: {}, seen: {} });
      const rng = FF.mulberry32(seed * 7 + 1);
      for (let i = 0; i < 120 * 60 && !g.dead; i++) {
        if (rng() < 0.012) g.pendingFlip = true;
        g.tick(FF.STEP);
      }
      if (!g.dead) continue;
      out.runs++;
      const c = g.dead.cause, o = g.dead.obj || {};
      out.causes[c] = (out.causes[c] || 0) + 1;
      if (o.t === 'hblock' && o.look) { out.lookDeaths++; if (!/^look_(floor|ceil)$/.test(c)) out.wrong.push(seed + ':' + c); }
    }
    for (const c of Object.keys(out.causes)) for (const L of ['ar', 'en']) if (!FF.UI.whyText(L, c)) out.missingTip.push(L + ':' + c);
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  const pass = r.runs > 100 && r.lookDeaths > 0 && !r.wrong.length && !r.missingTip.length && !errs.length;
  console.log(pass ? 'DEATH TIP TEST PASSED' : 'DEATH TIP TEST FAILED', errs);
  await b.close();
  process.exit(pass ? 0 : 1);
})();
