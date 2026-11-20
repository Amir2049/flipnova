// b66: the web game works OFFLINE after one online visit, and a new sw.js drops the old cache.
// Serves the repo on localhost (service workers need http), loads once, waits for the service worker,
// then goes offline and reloads: the game must boot to the home screen and start a run with no page errors.
// usage: node tools/offline-test.js
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = 8811;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(PORT);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:' + PORT + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen, null, { timeout: 20000 });
  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; const keys = await caches.keys(); const c = await caches.open(keys[0]); return { active: !!r.active, keys, n: (await c.keys()).length }; });
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen, null, { timeout: 20000 });
  await page.evaluate(() => { FF.save.tutDone = 1; FF.save.runs = 3; FF.UI.act('play'); });
  await page.waitForTimeout(1500); // (the screen wipe starts the run a moment later)
  const off = await page.evaluate(() => ({ screen: FF.UI.screen, game: !!FF.UI.game }));
  const alive = await page.evaluate(() => !!(FF.UI.game && FF.UI.game.time > 0.5));
  console.log({ sw, off, alive, errs });
  const pass = sw.active && sw.keys.length === 1 && sw.n >= 30 && off.game && alive && !errs.length;
  console.log(pass ? 'OFFLINE TEST PASSED' : 'OFFLINE TEST FAILED');
  await b.close(); srv.close();
  process.exit(pass ? 0 : 1);
})();
