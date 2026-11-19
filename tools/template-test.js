// Fairness per chunk type: the planning bot plays levels made only of one template.
// usage: node tools/template-test.js [name ...]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const names = process.argv.slice(2);
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html'); await page.waitForTimeout(800);
  const r = await page.evaluate((names) => {
    const out = {};
    for (const name of names) {
      out[name] = { runs: 0, deaths: [] };
      for (let s = 1; s <= 6; s++) for (const d of [0.3, 0.9]) {
        out[name].runs++;
        const L = new FF.Level({ seed: s * 101 + 7, noHints: true, script: Array(8).fill(0).flatMap(() => [name, 'calm']), speed: 105 + d * 60, difficulty: d });
        const p = { x: 0, y: FF.F - 12, vy: 0, grav: 1, grounded: true, speed: 80 };
        let time = 0, k = 0;
        while (p.x < L.finishX && p.x < 20000) {
          L.ensure(p.x + 260); p.speed = L.speedAt(p.x);
          if ((k++ & 1) === 0 && FF.Phys.botShouldFlip(p, L, time)) FF.Phys.flipState(p);
          const res = FF.Phys.step(p, FF.STEP, L, time, true);
          time += FF.STEP;
          if (res) { out[name].deaths.push(res.cause + '@d' + d); break; }
        }
      }
    }
    return out;
  }, names);
  for (const n in r) console.log(n.padEnd(9), 'deaths', r[n].deaths.length + '/' + r[n].runs, r[n].deaths.join(' '));
  if (errs.length) console.log(errs);
  await b.close();
})();
