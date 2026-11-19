// Build 36: The Legend (and the 1% challenges) are retired. This used to check the Legend's tick-exact replay proof;
// now it checks that a player who played them loses nothing: an old save with Legend + 1% progress loads,
// keeps save.legend / save.viral untouched, keeps the ♛ chip and the ♛ next to their name, keeps the LEGEND skin
// and gold trail and the old achievements — and that no screen or button for either mode is left to reach.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/supabase\.co/, (r) => r.abort());
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
  // write an old player's save (a cleared Legend + every 1% challenge) and reload
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('flipfrenzy.v1'));
    Object.assign(s, { runs: 80, best: 30000, tutDone: 1, skin: 'legend', trail: 'legend',
      legend: { attempts: 41, best: 1, bins: new Array(50).fill(1), done: true, date: '2026-05-01', time: 312.5, winAttempts: 41, proof: 'FFLEGEND:abc', hall: [{ hash: 'AB12', name: 'ME' }], ms: {}, layout: 4 },
      viral: { v1: { tries: 12, best: 1, done: 1, clearTry: 12 }, v2: { tries: 3, best: 0.4, done: 0, clearTry: 0 } } });
    s.ach = Object.assign(s.ach || {}, { legend: 1, legend25: 1, legend50: 1, legend75: 1, master: 1 });
    localStorage.setItem('flipfrenzy.v1', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
  await page.waitForTimeout(3500); // past the start-up achievement re-check
  const r = await page.evaluate(() => {
    const s = FF.save, vis = (el) => !!(el && el.offsetWidth);
    FF.UI.act('board');
    const tabs = [...document.querySelectorAll('#boardTabs .tab')].map((x) => x.dataset.btab);
    FF.UI.act('home');
    return {
      legendKept: s.legend && s.legend.attempts === 41 && s.legend.done === true && s.legend.hall.length === 1 && s.legend.proof === 'FFLEGEND:abc',
      viralKept: s.viral && s.viral.v1.tries === 12 && s.viral.v1.done === 1 && s.viral.v2.best === 0.4,
      achKept: ['legend', 'legend25', 'legend50', 'legend75', 'master'].every((k) => !!s.ach[k]),
      skin: s.skin === 'legend' && FF.isUnlocked(FF.SKINS.find((x) => x.id === 'legend')) === !!(s.ach.legend && Object.values(s.camp).reduce((a, c) => a + (c.stars || 0), 0) >= FF.CAMPAIGN.list.length * 3),
      trail: s.trail === 'legend' && FF.isUnlocked(FF.TRAILS.find((x) => x.id === 'legend')),
      chip: vis(document.querySelector('.legendChip')), crown: document.querySelector('#home').classList.contains('legendary'),
      noEntry: !document.querySelector('[data-act=legend], [data-act=viral], #legend, #viral, #hall, #legendWin') && tabs.indexOf('worldLegend') < 0,
      noData: typeof FF.LEGEND === 'undefined' && typeof FF.VIRAL === 'undefined'
    };
  });
  console.log(JSON.stringify(r, null, 1), errs);
  const pass = Object.values(r).every(Boolean) && !errs.length;
  console.log(pass ? 'LEGEND TEST PASSED' : 'LEGEND TEST FAILED');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
