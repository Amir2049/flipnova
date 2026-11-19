// plays the fight many times, fast (no painting), with the bot: how long it lasts, where you get hit, can it be won
// usage: node tools/tyrantfight/sim.js PAGE.html [--runs=6] [--react=0.32] [--miss=0.05]
const { chromium } = require('playwright'), path = require('path');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PAGE = path.resolve(process.argv[2]), RUNS = +arg('runs', 6), REACT = +arg('react', 0.32), MISS = +arg('miss', 0.05);
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + PAGE);
  await page.evaluate(require('./bot.js'));
  for (let r = 0; r < RUNS; r++) {
    const res = await page.evaluate(({ REACT, MISS }) => {
      FF.TyrantFight.play({ lang: 'en', muted: true }, () => {}); const D = FF.TyrantFight._dbg; D.hold = true;
      window.__maxC = 0; window.__clashLost = 0; const B = window.__bot; B.react = REACT; B.miss = MISS; B.cool = 0; B.flips = 0;
      const out = { hits: 0, hitBy: {}, phaseAt: [], downs: [], acts: {} }; let hearts = 3, ph = 0, n = 0;
      const S0 = () => D.S;
      while (n++ < 60 * 600) {
        B.step(); const S = S0(), before = S.hearts, inv = S.inv; window.__maxC = Math.max(window.__maxC || 0, S.combo); if (S.clash) window.__clashLost = S.clash.lost;
        D.update(1 / 60);
        if (S.hearts < before || (S.mode === 'down' && before > 0 && S.hearts <= 0)) {
          out.hits++;
          const what = S.phase + ':' + S.why + (Math.abs(S.p.vy) > 1 ? '~' : '');
          out.hitBy[what] = (out.hitBy[what] || 0) + 1;
        }
        if (S.phase !== ph) { out.phaseAt.push(+S.t.toFixed(1)); ph = S.phase; }
        if (S.mode === 'down' && !out._d) { out._d = 1; out.downs.push([S.phase, +S.hp.toFixed(1), +S.t.toFixed(1)]); } else if (S.mode !== 'down') out._d = 0;
        if (S.mode === 'won') break;
      }
      const S = S0(); out.win = S.mode === 'won'; out.t = +S.t.toFixed(1); out.hp = +S.hp.toFixed(1); out.flips = B.flips; out.deaths = S.deaths; out.maxCombo = window.__maxC; out.clashLost = window.__clashLost; delete out._d;
      D.hold = false; document.querySelector('.tyrantFight button').click();
      return out;
    }, { REACT, MISS });
    console.log(JSON.stringify(res));
  }
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
