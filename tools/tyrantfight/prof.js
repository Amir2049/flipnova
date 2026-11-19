// where the frame time goes: a CPU profile of 6 s of the fight (bot playing, CPU throttled), self time per function
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('file://' + path.resolve(process.argv[2])); await page.evaluate(require('./bot.js'));
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => { FF.TyrantFight.play({ lang: 'en', muted: true }, () => {}); const B = window.__bot; const tick = () => { B.step(); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await page.waitForTimeout(5000);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await page.waitForTimeout(6000);
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(), byId = new Map(profile.nodes.map((n) => [n.id, n])); const dt = profile.timeDeltas; const cnt = new Map();
  profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dt[i] || 0)));
  for (const [id, us] of cnt) { const n = byId.get(id), f = n.callFrame, k = (f.functionName || '(anon)') + ' ' + (f.url ? path.basename(f.url) : '') + ':' + f.lineNumber; self.set(k, (self.get(k) || 0) + us); }
  const tot = [...self.values()].reduce((a, b) => a + b, 0);
  [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 28).forEach(([k, v]) => console.log((v / tot * 100).toFixed(1).padStart(5) + '%  ' + k));
  await b.close();
})();
