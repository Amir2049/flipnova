// ⭐ Player reviews: two players rate the game through the real screens, the owner reads them (against tools/mock-supabase.js)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8799;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'inherit' });
  await new Promise((ok) => setTimeout(ok, 600));
  const base = 'http://localhost:' + PORT;
  const b = await chromium.launch();
  const errs = [];
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(base + '/index.html');
    await p.waitForTimeout(600);
    await p.evaluate((url) => { FF.save.onlineOverride = { url, key: 'test-key' }; FF.save.name = 'TESTER'; }, base);
    return p;
  };
  const rate = async (p, stars, text) => {
    await p.click('[data-act="review"]');
    await p.click('#rvStars button:nth-child(' + stars + ')');
    await p.fill('#rvText', text);
    await p.click('[data-act="rvSend"]');
    await p.waitForTimeout(400);
    return p.evaluate(() => ({ screen: FF.UI.screen, reviewed: FF.save.reviewed, build: FF.Online.BUILD }));
  };
  const a = await open(), c = await open();
  const ra = await rate(a, 5, 'Love it, but stage 8 is hard'), rc = await rate(c, 2, 'Too hard');
  const again = await rate(c, 4, 'OK now'); // the same device again: updates instead of adding
  const own = await open();
  const shown = await own.evaluate(async () => {
    FF.save.owner = true;
    FF.UI.openOwnerReviews('settings');
    document.querySelector('#rvCode').value = 'nope';
    const bad = await FF.Online.ownerReviews('nope');
    document.querySelector('#rvCode').value = 'test-code';
    document.querySelector('[data-act="rvLoad"]').click();
    await new Promise((ok) => setTimeout(ok, 500));
    return { bad: bad && bad.length, cards: document.querySelectorAll('#rvList .rvCard').length, sum: document.querySelector('#rvSum').textContent, first: document.querySelector('#rvList .rvCard p').textContent };
  });
  await own.screenshot({ path: path.join(__dirname, '..', 'build', 'review-owner.png') });
  console.log({ ra, rc, again, shown });
  const pass = ra.reviewed === ra.build && ra.screen === 'home' && shown.bad === 0 && shown.cards === 2 && /★ 4\.5 \(2\)/.test(shown.sum) && shown.first === 'OK now' && !errs.length;
  console.log(pass ? 'REVIEW TEST PASSED' : 'REVIEW TEST FAILED', errs);
  await b.close();
  srv.kill();
})();
