// FLIPNOVA Maker app (index.html?maker=1): opens straight into the Stage Maker; undo/redo, surprise, export/import,
// test-all and the speed graph work; a test play comes back to the Maker.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.route('**/*supabase.co/**', (r) => r.abort());
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..') + '/index.html?maker=1'); await p.waitForTimeout(1200);
  const shot = (n) => p.screenshot({ path: path.join(__dirname, '..', 'build', n) });
  const r = await p.evaluate(async () => {
    const out = { app: FF.MAKER_APP, screen: FF.UI.screen, graph: !!document.querySelector('.smGraph canvas') };
    const btn = (label) => [...document.querySelectorAll('#smSideBtns button')].find((x) => x.textContent.indexOf(label) >= 0);
    const s0 = FF.save.stageDraft.stages[0].name;
    btn('🎲').click();
    out.surprised = FF.save.stageDraft.stages[0].name !== s0;
    btn('↶').click();
    out.undone = FF.save.stageDraft.stages[0].name === s0;
    btn('↷').click();
    out.redone = FF.save.stageDraft.stages[0].name !== s0;
    const code = FF.StageMaker.toCode(FF.save.stageDraft);
    btn('📥').click();
    document.querySelector('.smCodeTa').value = code;
    [...document.querySelectorAll('#smPublish button')][0].click();
    out.imported = FF.compileBook(FF.save.stageDraft).id === FF.compileBook(FF.StageMaker.fromCode(code)).id;
    out.back = FF.UI.back(); // no box open: the app may close
    return out;
  });
  await shot('maker-app.png');
  // test-all on a 3-stage book
  const t = await p.evaluate(async () => {
    FF.save.stageDraft.stages = FF.save.stageDraft.stages.slice(0, 3);
    FF.StageMaker.open();
    [...document.querySelectorAll('#smSideBtns button')].find((x) => x.textContent.indexOf('🤖') >= 0).click();
    for (let i = 0; i < 600 && !/✓|✗|⚠/.test(document.querySelector('#smResult').textContent.split(':')[0] + (document.querySelector('#smResult').textContent.indexOf('—') >= 0 ? '✓' : '')); i++) await new Promise((ok) => setTimeout(ok, 100));
    return { msg: document.querySelector('#smResult').textContent, badges: [...document.querySelectorAll('#smList small')].map((x) => x.textContent) };
  });
  await shot('maker-testall.png');
  // ▶ play a stage → back in the Maker after the run
  const pl = await p.evaluate(async () => {
    [...document.querySelectorAll('#smMain .smTop button')][0].click();
    await new Promise((ok) => setTimeout(ok, 900));
    const g = FF.UI.game; let n = 0;
    while (!g.dead && n++ < 120 * 20) g.tick(FF.STEP);
    g.dead = g.dead || { cause: 'test' }; g.end();
    await new Promise((ok) => setTimeout(ok, 1500));
    return FF.UI.screen;
  });
  console.log(JSON.stringify({ r, t, pl }), errs);
  const pass = r.app && r.screen === 'stageMaker' && r.graph && r.surprised && r.undone && r.redone && r.imported && r.back === false && t.badges.every((x) => /^[✓⚠✗]/.test(x)) && pl === 'stageMaker' && !errs.length;
  console.log(pass ? 'MAKER APP TEST PASSED' : 'MAKER APP TEST FAILED');
  await b.close();
})();
