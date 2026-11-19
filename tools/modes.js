// Plays each mode with the bot over a local http server and checks the outcome.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
}).listen(8765);
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8765/index.html');
  await page.waitForTimeout(1500);
  const bot = (on) => page.evaluate((on) => {
    clearInterval(window.__bot);
    if (on) window.__bot = setInterval(() => { const g = FF.UI.game; if (g && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); }, 8);
  }, on);
  // zen: no bot -> should respawn, never show results
  await page.evaluate(() => FF.UI.startGame('zen'));
  await bot(false);
  await page.waitForTimeout(9000);
  console.log('zen:', await page.evaluate(() => ({ screen: FF.UI.screen, respawns: FF.UI.game.respawns })));
  // daily: bot for a while, then die -> ghost saved
  await page.evaluate(() => FF.UI.startGame('daily'));
  await bot(true);
  await page.waitForTimeout(6000);
  await bot(false);
  await page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 30000 });
  console.log('daily:', await page.evaluate(() => ({ best: FF.save.daily.best, ghostLen: (FF.save.daily.ghost || []).length })));
  // second daily run shows the ghost
  await page.evaluate(() => FF.UI.startGame('daily'));
  await page.waitForTimeout(2500);
  if (out) await page.screenshot({ path: out + '/daily-ghost.png' });
  console.log('sw:', await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())));
  console.log('errors:', errors);
  await b.close();
  srv.close();
})();
