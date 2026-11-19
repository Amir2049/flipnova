// a full fight with the bot (real time): how long does it last, how often is a good player hit?
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/FLIPNOVA-tyrant-prototype.html'); await p.waitForTimeout(800);
  const r = await p.evaluate(async (react) => { const P = window.__P, S = P.S; P.tap();
    setInterval(() => { if (S.mode === 'stagger' && S.stg) { const r = S.stg.rings.find((x) => !x.done && S.t > x.t0 + 0.45); if (r) P.tap(); return; }
      if (S.mode !== 'fight' && S.mode !== 'teach') return; if (S.t - S.flipT < 0.14) return; const hl = S.t - S.flipT < 0.07 ? S.from : S.lane;
      for (const q of S.proj) { if (q.st !== 'in') continue; const d = q.x - 420;
        if (q.gold && q.lane === hl && d > 0 && d < react) { P.tap(); return; }
        if (!q.gold && q.lane === hl && d > 0 && d < 260 && q.k === 'blade') { P.tap(); return; }
        if (q.k === 'meteor' && q.lane === hl && q.land - S.t < 0.3) { P.tap(); return; }
        if (q.k === 'breath' && q.lane === hl) { P.tap(); return; } } }, 16);
    const t0 = performance.now(); await new Promise((ok) => { const c = () => { if (S.mode === 'won' || performance.now() - t0 > 240000) ok(); else setTimeout(c, 500); }; c(); });
    return { mode: S.mode, time: S.end && +S.end.time.toFixed(1), hurt: S.hurt, parries: S.parries, perfects: S.perfects, hurts: (window.__hurts || []).join(' ') }; }, +process.argv[2] || 110);
  console.log(JSON.stringify(r), errs.slice(0, 3)); await b.close(); })();
