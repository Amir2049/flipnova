// Automated checks: no JS errors, the fairness bot survives generated levels, and screenshots.
// usage: node tools/test.js [--shots]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + root + '/index.html');
  await page.waitForTimeout(1500);

  // Fairness: a planning bot must be able to clear every chunk type at all difficulties.
  const report = await page.evaluate(() => {
    const out = { runs: [], deaths: {} };
    const runOne = (opts, maxX) => {
      const L = new FF.Level(opts);
      const p = { x: 0, y: FF.F - 12, vy: 0, grav: 1, grounded: true, speed: 80 };
      let time = 0, k = 0;
      while (p.x < maxX) {
        L.ensure(p.x + 220);
        p.speed = L.speedAt(p.x);
        if ((k++ & 1) === 0 && FF.Phys.botShouldFlip(p, L, time)) FF.Phys.flipState(p);
        const r = FF.Phys.step(p, FF.STEP, L, time);
        time += FF.STEP;
        if (r) {
          const near = L.objs.filter(o => o.x < p.x + 60 && o.x + o.w > p.x - 120).map(o => o.t + (o.kind ? ':' + o.kind : '') + (o.phase ? ':' + o.phase : ''));
          return { x: Math.round(p.x), cause: r.cause, near: [...new Set(near)].join(',') };
        }
        if (k % 600 === 0) L.prune(p.x - 40);
      }
      return { x: Math.round(p.x), cause: null };
    };
    for (let s = 1; s <= 20; s++) {
      const r = runOne({ seed: s * 7919, noHints: true }, 45000);
      r.stage = Math.floor(r.x / 4000) + 1;
      out.runs.push(r);
      if (r.cause) out.deaths[r.cause] = (out.deaths[r.cause] || 0) + 1;
    }
    return out;
  });
  console.log(JSON.stringify(report, null, 1));
  console.log('errors:', errors);
  await browser.close();
})();
