// Endless/Daily proofs: a recorded run must replay to the identical score; a tampered one must not verify.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html'); await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const out = [];
    for (const [mode, seed] of [['endless', 12345], ['endless', 987], ['daily', FF.hashStr('daily-' + FF.todayKey())]]) {
      const g = new FF.Game({ mode, seed, silent: true, settings: {}, callbacks: {}, seen: {} });
      let n = 0;
      // play well for a while, then stop tapping so the run ends
      while (!g.dead && n++ < 120 * 90) { if ((n & 1) === 0 && !g.pendingFlip && n < 120 * 60 && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
      const res = { mode, seed, date: mode === 'daily' ? FF.todayKey() : '', score: g.score, dist: Math.floor(g.p.x / 10), stage: g.maxStage, inputs: g.inputs };
      const code = FF.Online.encodeRun(res);
      const row = { board: mode === 'daily' ? 'daily-' + FF.todayKey() : 'endless', score: res.score, dist: res.dist, proof: code };
      const t0 = performance.now();
      const ok = FF.Online.verifyEntry(row);
      const ms = Math.round(performance.now() - t0);
      const fake = FF.Online.verifyEntry(Object.assign({}, row, { score: row.score + 500 }));
      const pr = FF.Online.decodeRun(code); pr.inputs[3] += 20;
      const tampered = FF.Online.verifyEntry(Object.assign({}, row, { proof: FF.Online.encodeRun(Object.assign({}, res, { inputs: pr.inputs })) }));
      out.push({ mode, score: res.score, dist: res.dist, flips: res.inputs.length, proofLen: code.length, verified: ok, ms, fakeScore: fake, tamperedInputs: tampered });
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1), errs);
  await b.close();
})();
