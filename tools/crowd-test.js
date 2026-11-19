// "Crowd test": a crowd of simulated players with different skill levels plays Endless, and you get a report:
// how far people get, which stage stops them, and which obstacles kill the most (too hard? never seen?).
// Each player has their own timing error (a bell curve, ±J typical), tap speed (GAP), reaction time and now-and-then slips, and only sees the screen.
// usage: node tools/crowd-test.js [--players 60] [--len 66000]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  let N = 60, LEN = 66000;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--players') N = parseInt(args[++i], 10);
    else if (args[i] === '--len') LEN = parseInt(args[++i], 10);
  }
  const b = await chromium.launch(); const page = await b.newPage();
  await page.route('**/*supabase.co/**', (r) => r.abort());
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html'); await page.waitForTimeout(800);
  const res = await page.evaluate(({ N, LEN }) => {
    const rnd = FF.mulberry32(4242);
    // skill groups: a few pros, many regular players, some beginners
    // [name, timing error ±s, fastest double tap s, reaction s, chance per tap of a bad slip]
    const kinds = [['pro', 0.02, 0.25, 0.2, 0.01], ['good', 0.035, 0.3, 0.25, 0.03], ['casual', 0.05, 0.33, 0.3, 0.06], ['beginner', 0.07, 0.38, 0.35, 0.12]];
    const out = [];
    for (let i = 0; i < N; i++) {
      const [kind, J, GAP, react, slip] = kinds[i < N * 0.1 ? 0 : i < N * 0.4 ? 1 : i < N * 0.8 ? 2 : 3];
      const seed = 1 + Math.floor(rnd() * 1e6);
      const L = new FF.Level({ seed, noHints: true, seen: {}, noRift: true });
      L.finishX = LEN;
      L.chunkLog = []; const add = L.addChunk.bind(L);
      L.addChunk = (n) => { L.chunkLog.push([L.genX, n]); add(n); };
      const r = FF.Fair.run(L, { seed: 77 + i, endless: true, to: LEN, J: J * (0.8 + 0.4 * rnd()), GAP, sight: FF.W - FF.PLAYER_X, react, slip, gauss: true,
        scaleAt: (x) => FF.Game.modeSpeedAt('endless', x, L) });
      // what killed them: the obstacle chunk that was running where they died
      let chunk = '?';
      if (!r.ok) for (const c of L.chunkLog || []) if (c[0] <= r.x) chunk = c[1];
      out.push({ kind, ok: r.ok, x: Math.round(r.x), stage: L.stageAt(r.x), cause: r.ok ? '' : r.cause, chunk, speed: FF.Game.modeSpeedAt('endless', r.x) });
    }
    return out;
  }, { N, LEN });
  const pct = (a, n) => Math.round((100 * a) / n) + '%';
  const stages = res.map((r) => r.stage).sort((a, c) => a - c);
  console.log('== ' + res.length + ' players, Endless up to ' + LEN / 10 + 'm');
  console.log('median stage reached: ' + stages[Math.floor(stages.length / 2)] + '   finished all 22: ' + res.filter((r) => r.ok).length);
  for (const k of ['pro', 'good', 'casual', 'beginner']) {
    const g = res.filter((r) => r.kind === k); if (!g.length) continue;
    const s = g.map((r) => r.stage).sort((a, c) => a - c);
    console.log('  ' + k.padEnd(9) + ' ' + String(g.length).padStart(3) + ' players  median stage ' + s[Math.floor(s.length / 2)] + '  best ' + s[s.length - 1] + '  avg ' + Math.round(g.reduce((a, r) => a + r.x, 0) / g.length / 10) + 'm');
  }
  console.log('reached stage:');
  for (const st of [2, 4, 6, 8, 10, 12, 15, 18, 22]) console.log('  ' + String(st).padStart(2) + ': ' + pct(res.filter((r) => r.stage >= st).length, res.length));
  const killers = {};
  for (const r of res) if (!r.ok) killers[r.chunk] = (killers[r.chunk] || 0) + 1;
  console.log('deadliest obstacles:');
  Object.entries(killers).sort((a, c) => c[1] - a[1]).slice(0, 10).forEach(([k, n]) => console.log('  ' + k.padEnd(11) + n));
  const byStage = {};
  for (const r of res) if (!r.ok) byStage[r.stage] = (byStage[r.stage] || 0) + 1;
  console.log('deaths per stage: ' + Object.entries(byStage).map(([s, n]) => s + ':' + n).join(' '));
  console.log(errs.length ? errs : 'no page errors');
  await b.close();
})();
