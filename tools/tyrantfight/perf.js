// frames per second of the real fight (the bot plays in real time), with the CPU slowed like a mid phone
// usage: node tools/tyrantfight/perf.js PAGE.html [--throttle=4] [--secs=40] [--w=960] [--h=540]
const { chromium } = require('playwright'), path = require('path');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: +arg('w', 960), height: +arg('h', 540) } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.resolve(process.argv[2])); await page.evaluate(require('./bot.js'));
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +arg('throttle', 4) });
  const SK = arg('skip', '');
  const out = await page.evaluate(async ({ secs, SK }) => {
    FF.TyrantFight.play({ lang: 'en', muted: true }, () => {}); SK.split(',').filter(Boolean).forEach((k) => (FF.TyrantFight._dbg.SKIP[k] = true));
    const D = FF.TyrantFight._dbg, B = window.__bot, fr = []; let last = performance.now(), worst = 0;
    const tick = (now) => { B.step(); fr.push(now - last); worst = Math.max(worst, now - last); last = now; if (fr.length < 100000) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const res = []; const t0 = performance.now(); let i0 = 0;
    // jump through the phases so each world is measured
    const marks = [[secs * 0.33, 67.2], [secs * 0.66, 34.2]];
    while (performance.now() - t0 < secs * 1000) {
      await new Promise((ok) => setTimeout(ok, 5000));
      const el = (performance.now() - t0) / 1000, seg = fr.slice(i0); i0 = fr.length; const avg = seg.reduce((a, b) => a + b, 0) / Math.max(1, seg.length);
      res.push({ t: +el.toFixed(0), q: D.QG.lv, px: document.querySelector('.tyrantFight canvas').width, phase: D.S.phase, mode: D.S.mode, fps: +(1000 / avg).toFixed(1), slow: seg.filter((x) => x > 34).length });
      for (const m of marks) if (!m.done && el > m[0]) { m.done = 1; D.S.hp = m[1]; }
    }
    return res;
  }, { secs: +arg('secs', 40), SK });
  out.forEach((r) => console.log(JSON.stringify(r))); console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : 'no errors');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
