// QA click-through of Flippo on several screen sizes, AR + EN: screenshots every menu, plays ~6 s of Endless,
// and lists buttons that fall off-screen or are smaller than 28px. Usage: node tools/qa-click-through.js . <outDir>
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [root, out] = process.argv.slice(2);
const VIEWS = [['phone-small', 640, 360], ['phone', 844, 390], ['phone-tall', 932, 430], ['tablet', 1024, 768], ['portrait', 390, 844]];
const SCREENS = ['home', 'settings', 'skins', 'camp', 'board', 'levels', 'missionsBox', 'howto'];
(async () => {
  const b = await chromium.launch();
  const report = [];
  for (const lang of ['en', 'ar']) for (const [name, w, h] of VIEWS) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.route(/supabase\.co/, (r) => r.abort());
    await page.goto('file://' + path.resolve(root, 'index.html'));
    await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen, null, { timeout: 20000 });
    // skip the first-run tutorial: a played save
    await page.evaluate((lang) => { const s = JSON.parse(localStorage.getItem('flipfrenzy.v1') || '{}'); Object.assign(s, { runs: 5, tutDone: 1, best: 3000 }); s.settings = Object.assign(s.settings || {}, { lang }); localStorage.setItem('flipfrenzy.v1', JSON.stringify(s)); }, lang);
    await page.reload();
    await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home', null, { timeout: 20000 });
    await page.waitForTimeout(2500);
    for (const sc of SCREENS) {
      try {
        await page.evaluate((sc) => { FF.UI.act('home'); if (sc !== 'home') FF.UI.act(sc); }, sc);
        await page.waitForTimeout(700);
        // anything clipped out of the viewport (visible buttons only)
        const clip = await page.evaluate(() => {
          const W = innerWidth, H = innerHeight, bad = [];
          for (const el of document.querySelectorAll('button, .btn, [data-act]')) {
            const r = el.getBoundingClientRect(), st = getComputedStyle(el);
            if (!r.width || !r.height || st.visibility === 'hidden' || st.display === 'none') continue;
            let p = el, hid = false; while (p) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) { hid = true; break; } p = p.parentElement; }
            if (hid) continue;
            if (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1) bad.push((el.dataset.act || el.id || el.className || el.textContent.trim()).toString().slice(0, 30) + ` [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
            else if (r.height < 28 || r.width < 28) bad.push('SMALL ' + (el.dataset.act || el.id || el.textContent.trim()).toString().slice(0, 20) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          return { screen: FF.UI.screen, bad: bad.slice(0, 8) };
        });
        await page.screenshot({ path: path.join(out, `${lang}-${name}-${sc}.png`) });
        report.push({ lang, view: name, sc, screen: clip.screen, bad: clip.bad });
      } catch (e) { report.push({ lang, view: name, sc, error: e.message.slice(0, 160) }); }
    }
    // play endless ~6 s with taps
    try {
      await page.evaluate(() => { FF.UI.act('home'); FF.UI.act('play'); });
      for (let i = 0; i < 12; i++) { await page.mouse.click(w / 2, h / 2); await page.waitForTimeout(450); }
      await page.screenshot({ path: path.join(out, `${lang}-${name}-play.png`) });
      report.push({ lang, view: name, sc: 'play', screen: await page.evaluate(() => FF.UI.screen) });
    } catch (e) { report.push({ lang, view: name, sc: 'play', error: e.message.slice(0, 160) }); }
    report.push({ lang, view: name, errors: errs.slice(0, 10) });
    await ctx.close();
  }
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report.filter((r) => (r.bad && r.bad.length) || r.error || (r.errors && r.errors.length)), null, 1));
  await b.close();
})();
