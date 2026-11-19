// 🗓 Weekly challenge test (against tools/mock-supabase.js, never the real server):
// the week changes at Friday 20:00 Cairo, a weekly run uses the week's seed, the Week board shows only
// this week's verified runs on that seed, and the player just above you becomes the 🎯 rival flag.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8801;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'inherit' });
  await new Promise((ok) => setTimeout(ok, 600));
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/supabase\.co/, (r) => r.abort()); // the real server is never touched
  const base = 'http://localhost:' + PORT;
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.waitForTimeout(600);

  // 1) the week boundary: Friday 19:59 / 20:00 Cairo, in winter (UTC+2) and summer (UTC+3)
  const weeks = await page.evaluate(() => {
    const k = (iso) => FF.weekInfo(Date.parse(iso)).key;
    return {
      winterBefore: k('2026-11-06T17:59:00Z'), winterAfter: k('2026-11-06T18:00:00Z'), tue: k('2026-11-03T10:00:00Z'),
      summerBefore: k('2026-07-03T16:59:00Z'), summerAfter: k('2026-07-03T17:00:00Z'),
      sameSeed: FF.weekInfo(Date.parse('2026-11-01T00:00:00Z')).seed === FF.weekInfo(Date.parse('2026-11-05T23:00:00Z')).seed,
      homeText: document.querySelector('#weekStat').textContent
    };
  });
  console.log('weeks', weeks);
  const weekOk = weeks.winterBefore === '2026-10-30' && weeks.winterAfter === '2026-11-06' && weeks.tue === '2026-10-30' &&
    weeks.summerBefore === '2026-06-26' && weeks.summerAfter === '2026-07-03' && weeks.sameSeed && /\d/.test(weeks.homeText);

  // 2) a rival's real run on this week's road (a stronger bot), posted under another name
  const rival = await page.evaluate(async () => {
    const w = FF.weekInfo();
    let res = null;
    const g = new FF.Game({ mode: 'endless', seed: w.seed, silent: true, settings: {}, seen: {}, callbacks: { onEnd: (r) => (res = r), onEvent: () => {} } });
    let n = 0;
    while (!g.dead && n++ < 120 * 90) { if ((n & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
    while (!g.dead && n++ < 120 * 200) g.tick(FF.STEP);
    g.end();
    return res && { score: res.score, dist: res.dist, stage: res.stage, proof: FF.Online.encodeRun(res) };
  });
  // and an ordinary Endless run (other seed) + an old run from last week: neither may show on the Week board
  const other = await page.evaluate(async () => {
    let res = null;
    const g = new FF.Game({ mode: 'endless', seed: 12345, silent: true, settings: {}, seen: {}, callbacks: { onEnd: (r) => (res = r), onEvent: () => {} } });
    let n = 0;
    while (!g.dead && n++ < 120 * 60) { if ((n & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
    while (!g.dead && n++ < 120 * 200) g.tick(FF.STEP);
    g.end();
    return { score: res.score, dist: res.dist, stage: res.stage, proof: FF.Online.encodeRun(res) };
  });
  const post = (e) => fetch(base + '/rest/v1/ff_scores', { method: 'POST', headers: { apikey: 'test-key', 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
  await post({ board: 'endless', name: 'Rival1', score: rival.score, dist: rival.dist, stage: rival.stage, proof: rival.proof, device: 'rivaldev1' });
  await post({ board: 'endless', name: 'OtherSeed', score: other.score, dist: other.dist, stage: other.stage, proof: other.proof, device: 'otherdev1' });
  await post({ board: 'endless', name: 'LastWeek', score: rival.score + 1, dist: rival.dist, stage: rival.stage, proof: rival.proof, device: 'oldweekdev', created_at: '2020-01-01T00:00:00.000Z' });
  await post({ board: 'endless', name: 'FAKE', score: rival.score * 5, dist: rival.dist, stage: rival.stage, proof: rival.proof, device: 'fakedev1' });

  // 3) my own weekly run through the UI (a weaker bot): it must be saved as this week's best
  const mine = await page.evaluate(async (url) => {
    FF.save.onlineOverride = { url, key: 'test-key' };
    FF.save.tutDone = 1;
    FF.save.name = 'Tester';
    FF.UI.act('weekly');
    while (!FF.UI.game || FF.UI.game.mode !== 'endless') await new Promise((ok) => setTimeout(ok, 50));
    const g = FF.UI.game;
    let n = 0;
    while (!g.dead && n++ < 120 * 120) { if ((n & 1) === 0 && !g.pendingFlip && n < 120 * 12 && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
    while (!g.ended) await new Promise((ok) => setTimeout(ok, 50));
    await new Promise((ok) => setTimeout(ok, 800));
    return { seed: g.seed, week: FF.weekInfo().seed, score: g.score, ws: Object.assign({}, FF.save.weekly) };
  }, base);
  console.log('my weekly run', { seed: mine.seed, week: mine.week, score: mine.score, best: mine.ws.best, tries: mine.ws.tries }, 'rival', rival.score, 'other', other.score);

  // 4) the Week board
  await page.evaluate(() => FF.UI.act('board'));
  await page.click('[data-btab="worldWeek"]', { force: true });
  await page.waitForFunction(() => /🎯|👑|✓/.test(document.querySelector('#boardStatus').textContent), null, { timeout: 30000 });
  const board = await page.evaluate(() => ({
    status: document.querySelector('#boardStatus').textContent,
    rows: [...document.querySelectorAll('#boardList .brow')].map((r) => r.querySelector('.nm').firstChild.textContent + ' ' + r.querySelector('b').textContent + (r.classList.contains('me') ? ' (me)' : '')),
    rival: FF.save.weekly.rival
  }));
  console.log('week board', board);
  await page.screenshot({ path: path.join(require('os').tmpdir(), 'week-board.png') });

  // 5) the next weekly run carries the rival's flag; 'again' keeps the weekly road
  const next = await page.evaluate(async () => {
    FF.UI.act('home');
    await new Promise((ok) => setTimeout(ok, 300));
    FF.UI.act('weekly');
    await new Promise((ok) => setTimeout(ok, 900));
    const g = FF.UI.game;
    return { seed: g.seed, rival: g.opts.rival, bestX: g.opts.bestX, weekly: !!g.opts.weekly };
  });
  console.log('next run', next);
  await page.evaluate(() => { const g = FF.UI.game; g.p.x = g.opts.rival ? g.opts.rival.x - 60 : 0; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(require('os').tmpdir(), 'week-rival-flag.png') });

  const boardOk = board.rows.length === 2 && /Rival1/.test(board.rows[0]) && /\(me\)/.test(board.rows[1]) && !board.rows.some((r) => /OtherSeed|LastWeek|FAKE/.test(r)) && board.rival && board.rival.name === 'Rival1' && /Rival1/.test(board.status);
  const runOk = mine.seed === mine.week && mine.ws.best === mine.score && mine.ws.tries === 1 && mine.score < rival.score;
  const nextOk = next.seed === mine.week && next.weekly && next.rival && next.rival.name === 'Rival1' && next.bestX === mine.ws.x;
  const pass = weekOk && boardOk && runOk && nextOk && !errs.length;
  console.log(pass ? 'WEEKLY TEST PASSED' : 'WEEKLY TEST FAILED', { weekOk, boardOk, runOk, nextOk }, errs);
  await b.close();
  srv.kill();
  process.exit(pass ? 0 : 1);
})();
