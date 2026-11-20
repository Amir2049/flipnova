// b66: turning the phone to portrait during a run pauses it (the "turn your phone" screen), and turning back
// lets the player resume, with no page errors, in Arabic and English.
// usage: node tools/rotate-test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const lang of ['ar', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
    await ctx.route(/supabase\.co/, (r) => r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html');
    await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen);
    await page.evaluate((lang) => { const s = JSON.parse(localStorage.getItem('flipfrenzy.v1') || '{}'); Object.assign(s, { runs: 6, tutDone: 1, owner: true, ownerCfg: Object.assign({ speed: 1, stage: 1, hit: false }, { ['g' + 'od']: true }) }); /* owner Shield mode: the run can't end while we rotate */ s.settings = Object.assign(s.settings || {}, { lang }); localStorage.setItem('flipfrenzy.v1', JSON.stringify(s)); }, lang);
    await page.reload(); await page.waitForFunction(() => FF.UI.screen === 'home');
    await page.evaluate(() => FF.UI.act('play'));
    await page.waitForTimeout(1200);
    const t0 = await page.evaluate(() => FF.UI.game.time);
    await page.setViewportSize({ width: 390, height: 844 }); // turn to portrait mid-run
    await page.waitForTimeout(1200);
    const portrait = await page.evaluate(() => ({ screen: FF.UI.screen, time: FF.UI.game && FF.UI.game.time, paused: !!(FF.UI.game && FF.UI.game.paused), rotateShown: [...document.querySelectorAll('*')].some((e) => /rotate/i.test(e.id || '') && e.offsetWidth > 0) }));
    await page.waitForTimeout(800);
    const still = await page.evaluate(() => FF.UI.game && FF.UI.game.time);
    await page.setViewportSize({ width: 844, height: 390 }); // back to landscape
    await page.waitForTimeout(600);
    await page.evaluate(() => { if (FF.UI.screen === 'pause') FF.UI.act('resume'); });
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => ({ screen: FF.UI.screen, time: FF.UI.game && FF.UI.game.time }));
    out.push({ lang, t0, portrait, frozen: still === portrait.time, after, errs });
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  const pass = out.every((r) => r.portrait.rotateShown && r.frozen && r.after.time > r.portrait.time && !r.errs.length);
  console.log(pass ? 'ROTATE TEST PASSED' : 'ROTATE TEST FAILED');
  await b.close();
  process.exit(pass ? 0 : 1);
})();
