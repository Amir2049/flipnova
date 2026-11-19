// End-to-end Adventure check: map, play a level with the bot, results/stars, next level, death + checkpoint respawn.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html');
  await page.waitForTimeout(1200);
  if (out) await page.screenshot({ path: out + '/home-adv.png' });
  await page.click('[data-act=camp]');
  await page.waitForTimeout(800);
  if (out) await page.screenshot({ path: out + '/camp-map.png' });
  await page.click('.tile.next', { force: true });
  await page.waitForTimeout(600);
  await page.evaluate(() => { window.__bot = setInterval(() => { const g = FF.UI.game; if (g && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); }, 8); });
  await page.waitForTimeout(6000);
  if (out) await page.screenshot({ path: out + '/camp-play.png' });
  await page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 120000 });
  await page.waitForTimeout(700);
  if (out) await page.screenshot({ path: out + '/camp-done.png' });
  console.log('level 1:', await page.evaluate(() => [document.querySelector('#overTitle').textContent, document.querySelector('#over [data-act=again]').textContent, JSON.stringify(FF.save.camp), FF.save.coins]));
  await page.evaluate(() => clearInterval(window.__bot));
  await page.click('#over [data-act=again]', { force: true }); // NEXT
  await page.waitForTimeout(600);
  console.log('next level:', await page.evaluate(() => FF.UI.game.opts.level.id));
  // no bot: die, respawn at a checkpoint
  await page.evaluate(() => { const g = FF.UI.game; const cp = g.L.checkpoints[1]; g.p.x = cp + 10; g.camX = g.p.x - 64; });
  await page.waitForTimeout(9000);
  console.log('deaths/checkpoint/screen:', await page.evaluate(() => [FF.UI.game.deaths, FF.UI.game.checkpoint, FF.UI.screen]));
  if (out) await page.screenshot({ path: out + '/camp-respawn.png' });
  console.log('errors:', errors);
  await b.close();
})();
