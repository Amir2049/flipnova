// End-to-end world leaderboard test against tools/mock-supabase.js:
// a real run is auto-submitted, then the board must show it verified and hide a fake, a tampered and a copied entry.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8799;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'inherit' });
  await new Promise((ok) => setTimeout(ok, 600));
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const base = 'http://localhost:' + PORT;
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.persist && FF.save && FF.UI.screen === 'home');
  await page.waitForTimeout(800);
  // 0) names: one that's already someone else's is refused, a fresh one is claimed
  await fetch(base + '/__players', { method: 'POST', body: JSON.stringify({ name: 'Taken1', device: 'otherdev' }) });
  const names = await page.evaluate(async (url) => {
    FF.save.onlineOverride = { url, key: 'test-key' };
    FF.Online.MIN_SHOW.endless = 0;
    return { taken: await FF.Online.claimName('taken 1'), reserved: await FF.Online.claimName('Flippo'), mine: await FF.Online.claimName('Tester'), named: FF.Online.named() || (FF.save.name = 'Tester', FF.Online.named()) };
  }, base);
  console.log('names', names);
  // 1) play a real endless run through the UI (bot taps), so onEnd → submitOnline runs for real
  const run = await page.evaluate(async (url) => {
    FF.save.onlineOverride = { url, key: 'test-key' };
    FF.save.best = 9999999; // an old local record must not block the first world submission
    FF.UI.startGame('endless');
    while (!FF.UI.game || FF.UI.game.mode !== 'endless') await new Promise((ok) => setTimeout(ok, 50));
    const g = FF.UI.game;
    let n = 0;
    while (!g.dead && n++ < 120 * 120) { if ((n & 1) === 0 && !g.pendingFlip && n < 120 * 40 && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
    while (!g.ended) await new Promise((ok) => setTimeout(ok, 50));
    await new Promise((ok) => setTimeout(ok, 1500));
    return { score: g.score, ended: g.ended, pending: (FF.save.pendingScores || []).length };
  }, base);
  const rows = await (await fetch(base + '/__rows')).json();
  const real = rows[0];
  console.log('run', run, 'rows on server:', rows.length);
  // 2) cheaters: a fake score, tampered inputs, and someone re-posting the real proof under their own name
  const post = (e) => fetch(base + '/rest/v1/ff_scores', { method: 'POST', headers: { apikey: 'test-key', 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
  await post(Object.assign({}, real, { id: undefined, created_at: undefined, name: 'HACKER', score: real.score * 10 + 999, device: 'evil1' }));
  await post({ board: 'endless', name: 'NOPROOF', score: 999999, dist: 5000, proof: 'FFRUN:abc', device: 'evil2' });
  await post(Object.assign({}, real, { id: undefined, created_at: undefined, name: 'COPYCAT', device: 'evil3' }));
  await post({ board: 'legend', name: 'FAKELEGEND', score: 600, proof: 'FFLEGEND:eyJ2IjoxfQ==', device: 'evil4' });
  // 3) open the world board and let it verify
  await page.evaluate(() => { FF.UI.act('board'); });
  await page.waitForFunction(() => /✓/.test(document.querySelector('#boardStatus').textContent), null, { timeout: 20000 });
  const board = await page.evaluate(() => ({
    status: document.querySelector('#boardStatus').textContent,
    rows: [...document.querySelectorAll('#boardList .brow')].map((r) => r.querySelector('.nm').firstChild.textContent + ' ' + r.querySelector('b').textContent + (r.classList.contains('me') ? ' (me)' : ''))
  }));
  console.log('world board', board);
  // build 36: the Legend board is gone — no tab for it, and a posted 'legend' row never shows on the world board
  const legend = await page.evaluate(() => ({ tab: !!document.querySelector('[data-btab="worldLegend"]'), fake: /FAKELEGEND/.test(document.querySelector('#boardList').textContent) }));
  console.log('legend board gone', legend);
  await page.screenshot({ path: path.join(require('os').tmpdir(), 'world-board.png') });
  // 4) rename: the same player's old score now shows under the new name
  const renamed = await page.evaluate(async () => { const r = await FF.Online.claimName('Tester Two'); FF.save.name = 'Tester Two'; FF.UI.act('board'); return r; });
  await page.click('[data-btab="world"]', { force: true });
  await page.waitForFunction(() => /✓/.test(document.querySelector('#boardStatus').textContent) && document.querySelectorAll('#boardList .brow').length, null, { timeout: 20000 });
  const afterRename = await page.evaluate(() => [...document.querySelectorAll('#boardList .brow')].map((r) => r.querySelector('.nm').firstChild.textContent));
  console.log('after rename:', renamed, afterRename);
  // 5) the minimum score: raise it above the run and the board empties
  await page.evaluate(() => { FF.Online.MIN_SHOW.endless = 1e9; FF.UI.act('board'); });
  await page.click('[data-btab="world"]', { force: true });
  await page.waitForFunction(() => /✓/.test(document.querySelector('#boardStatus').textContent), null, { timeout: 20000 });
  const minRows = await page.evaluate(() => document.querySelectorAll('#boardList .brow').length);
  console.log('rows above a huge minimum:', minRows);
  const pass = renamed === 'ok' && afterRename.length === 1 && /Tester Two/.test(afterRename[0]) && names.taken === 'taken' && names.reserved === 'taken' && names.mine === 'ok' && names.named && real.name === 'Tester' && minRows === 0 && run.pending === 0 && rows.length === 1 && real.score === run.score && board.rows.length === 1 && /\(me\)/.test(board.rows[0]) && /3/.test(board.status) && !legend.tab && !legend.fake && !errs.length;
  console.log(pass ? 'ONLINE TEST PASSED' : 'ONLINE TEST FAILED', errs);
  await b.close();
  srv.kill();
  process.exit(pass ? 0 : 1);
})();
