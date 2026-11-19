// Plays every Adventure level with the planning bot. A level only ships if the bot clears it with no deaths.
// usage: node tools/campaign-test.js [levelId ...]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html'); await page.waitForTimeout(800);
  const res = await page.evaluate((only) => {
    const out = [];
    for (const def of FF.CAMPAIGN.list) {
      if (only.length && !only.includes(def.id)) continue;
      const L = new FF.Level({ campaign: def, noHints: true, seen: {} });
      const p = { x: 0, y: FF.F - 12, vy: 0, grav: 1, grounded: true, speed: def.speed };
      let time = 0, k = 0, death = null;
      while (p.x < L.finishX && time < 200) {
        p.speed = L.speedAt(p.x);
        if ((k++ & 1) === 0 && FF.Phys.botShouldFlip(p, L, time)) FF.Phys.flipState(p);
        const r = FF.Phys.step(p, FF.STEP, L, time, true);
        time += FF.STEP;
        if (r) { death = r.cause + '@' + Math.round(p.x); break; }
      }
      out.push({ id: def.id, name: def.en, len: L.finishX, secs: Math.round(L.finishX / def.speed), cps: L.checkpoints.length - 1, coins: L.coinTotal, death });
    }
    return out;
  }, only);
  let bad = 0;
  for (const r of res) { if (r.death) bad++; console.log(r.id.padEnd(6), r.name.padEnd(16), String(r.len).padStart(5) + 'px', String(r.secs).padStart(3) + 's', 'cp' + r.cps, 'coins' + r.coins, r.death ? 'DIED ' + r.death : 'ok'); }
  console.log(bad ? bad + ' level(s) failed' : 'ALL LEVELS CLEARED', errs);
  await b.close();
})();
