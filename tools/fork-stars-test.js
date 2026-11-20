// b66: every Adventure level's 3 stars can be earned in ONE deathless run.
// Fork sections split the lane with a solid slab, so the "all coins" star must accept either lane of each fork.
// Checks, for all 50 levels: plain coins + one lane per fork = all coins (both lane choices), missing one plain coin
// or half a lane is not, and the counts add up to coinTotal. usage: node tools/fork-stars-test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/supabase\.co/, (r) => r.abort());
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html');
  await page.waitForFunction(() => window.FF && FF.CAMPAIGN);
  const r = await page.evaluate(() => {
    const out = { levels: 0, withForks: [], bad: [] };
    for (const def of FF.CAMPAIGN.list) {
      const L = new FF.Level({ campaign: def, noHints: true, seen: {} });
      const sets = L.coinSets || {}, keys = Object.keys(sets), forks = [...new Set(keys.filter(Boolean).map((k) => k.slice(0, -1)))];
      const sum = keys.reduce((a, k) => a + sets[k], 0);
      out.levels++;
      if (forks.length) out.withForks.push(def.id + ':' + forks.length);
      const run = (lane) => { const g = { '': sets[''] || 0 }; forks.forEach((f) => { g[f + lane] = sets[f + lane] || 0; }); return g; };
      const okR = L.allCoins(run('r')), okS = L.allCoins(run('s'));
      const missPlain = (sets[''] || 0) > 0 && L.allCoins(Object.assign(run('s'), { '': sets[''] - 1 }));
      const halfLane = forks.length > 0 && L.allCoins(Object.assign(run('r'), { [forks[0] + 'r']: (sets[forks[0] + 'r'] || 1) - 1 }));
      if (sum !== L.coinTotal || !okR || !okS || missPlain || halfLane) out.bad.push({ id: def.id, sum, total: L.coinTotal, okR, okS, missPlain, halfLane });
    }
    return out;
  });
  console.log(JSON.stringify(r));
  const pass = r.levels === FF_LEVELS(r) && r.withForks.length > 0 && !r.bad.length && !errs.length;
  console.log(pass ? 'FORK STARS TEST PASSED' : 'FORK STARS TEST FAILED', errs);
  await b.close();
  process.exit(pass ? 0 : 1);
  function FF_LEVELS(x) { return x.levels >= 50 ? x.levels : -1; }
})();
