// plays the prototype like a decent player (parries gold, dodges red), screenshots along the way
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/FLIPNOVA-tyrant-prototype.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const P = window.__P; P.tap();
    setInterval(() => { const S = P.S; if (S.mode === 'stagger' && S.stg) { const r = S.stg.rings.find((x) => !x.done && S.t > x.t0 + 0.45); if (r) P.tap(); return; }
      if (S.mode !== 'fight' && S.mode !== 'teach') return;
      if (S.t - S.flipT < 0.14) return;   // a human thumb: not every frame
      const hl = S.t - S.flipT < 0.07 ? S.from : S.lane;
      for (const q of S.proj) { if (q.st !== 'in') continue; const d = q.x - 420;
        if (q.gold && q.lane === hl && d > 0 && d < 110) { P.tap(); return; }
        if (!q.gold && (q.k === 'blade' || q.k === 'fire') && q.lane === hl && d > 0 && d < 260) { P.tap(); return; }
        if (q.k === 'meteor' && q.lane === hl && q.land - S.t < 0.3) { P.tap(); return; }
        if (q.k === 'breath' && q.lane === hl) { P.tap(); return; } }
      for (const e of S.ev) if (e.said && !e.done && e.kind === 'beam' && e.at - S.t < 0.15 && e.fn.toString().indexOf('breath') >= 0) { /* breath: handled when it appears */ }
    }, 16); });
  const shots = [];
  for (let i = 0; i < 16; i++) { await p.waitForTimeout(i < 2 ? 2500 : 4500); const f = __dirname + '/s' + String(i).padStart(2, '0') + '.png'; await p.screenshot({ path: f }); shots.push(f);
    const st = await p.evaluate(() => { const S = window.__P.S, F = window.__P.FK; return { mode: S.mode, phase: S.phase, hp: F.hp, hearts: S.hearts, parries: S.parries, perfects: S.perfects, hurt: S.hurt }; }); console.log(i, JSON.stringify(st)); if (st.mode === 'won') break; }
  console.log('hurts', await p.evaluate(() => (window.__hurts || []).join(' ')));
  console.log('errors', errs.slice(0, 5));
  require('child_process').execFileSync('python3', ['-c', 'from PIL import Image\nimport sys\nfs=sys.argv[2:]\nims=[Image.open(f).convert("RGB").resize((640,360)) for f in fs]\nS=Image.new("RGB",(3*640,((len(ims)+2)//3)*360))\nfor i,im in enumerate(ims): S.paste(im,((i%3)*640,(i//3)*360))\nS.save(sys.argv[1],quality=82)', __dirname + '/sheet.jpg', ...shots]);
  await b.close();
})();
