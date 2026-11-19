// Takes gameplay screenshots in a phone-sized viewport. usage: node tools/shots.js <outDir>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const out = process.argv[2] || path.join(root, 'concept');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + root + '/index.html');
  await page.waitForTimeout(2500);
  const shot = (n) => page.screenshot({ path: path.join(out, n + '.png') });
  await shot('home');
  const bot = () => page.evaluate(() => {
    window.__bot = setInterval(() => {
      const g = FF.UI.game;
      if (g && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct();
    }, 8);
  });
  await page.click('[data-act=play]');
  await page.waitForTimeout(500);
  await bot();
  await page.waitForTimeout(5200);
  await shot('play-1');
  for (const [x, n] of [[5150, 'play-clock'], [10150, 'play-mirror'], [15150, 'play-candy'], [20150, 'play-glitch']]) {
    await page.evaluate((x) => { const g = FF.UI.game; if (g) { g.p.x = x; g.p.y = FF.F - 12; g.p.grav = 1; g.p.vy = 0; g.camX = x - 40; g.L.objs = g.L.objs.filter(o => o.x > x + 60 || o.x + o.w < x - 300); } }, x);
    await page.waitForTimeout(3500);
    await shot(n);
  }
  await page.evaluate(() => { clearInterval(window.__bot); });
  await page.waitForTimeout(6000);
  await shot('results');
  await page.click('#over [data-act=home]');
  await page.waitForTimeout(700);
  await shot('home-after');
  for (const [act, name] of [['skins', 'skins'], ['board', 'board'], ['missionsBox', 'missions']]) {
    await page.click('#home [data-act=' + act + ']');
    await page.waitForTimeout(350);
    await shot(name);
    await page.click('#' + (act === 'missionsBox' ? 'missionsBox' : act) + ' [data-act=home]');
    await page.waitForTimeout(300);
  }
  console.log('errors:', errors);
  await browser.close();
})();
