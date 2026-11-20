// Stage Maker → publish → every player gets the new stages (against tools/mock-supabase.js)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8798;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'inherit' });
  await new Promise((ok) => setTimeout(ok, 600));
  const base = 'http://localhost:' + PORT;
  const b = await chromium.launch();
  const errs = [];
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(base + '/index.html');
    await p.waitForTimeout(600);
    await p.evaluate((url) => { FF.save.onlineOverride = { url, key: 'test-key' }; }, base);
    return p;
  };
  // the owner edits stage 2 and publishes
  const owner = await open();
  const builtIn = await owner.evaluate(() => FF.BOOK.id);
  const r = await owner.evaluate(async () => {
    FF.save.owner = true;
    FF.StageMaker.open();
    FF.save.stageDraft.stages[1].speed = 140;
    FF.save.stageDraft.stages[1].name = 'MY STAGE';
    const ownerOk = await FF.Online.ownerCheck('test-code'), ownerBad = await FF.Online.ownerCheck('AMIR-KING-0000');
    const wrong = await FF.Online.publishBook('nope', FF.save.stageDraft);
    // b66: like the real Publish button (stagemaker.js), the book carries a `stamp` — unstamped books are ignored (online.js BOOK_MIN_STAMP)
    const ok = await FF.Online.publishBook('test-code', Object.assign(JSON.parse(JSON.stringify(FF.save.stageDraft)), { stamp: Date.now() }));
    return { ownerOk, ownerBad, wrong, ok, id: FF.BOOK.id, name: FF.BOOK.stages[1].name };
  });
  // a friend opens the game: the new book arrives without any update
  const friend = await open();
  const f = await friend.evaluate(async () => { await FF.Online.loadBook(); const L = new FF.Level({ seed: 3, noHints: true, seen: {} }); return { id: FF.BOOK.id, name: L.stageDef(3500).name, speed: Math.round(L.bookSpeed(2)) }; });
  console.log({ builtIn, r, f });
  const pass = r.ownerOk === true && r.ownerBad === false && r.wrong === 'denied' && r.ok === 'ok' && r.id !== builtIn && f.id === r.id && f.name === 'MY STAGE' && f.speed === 140 && !errs.length;
  console.log(pass ? 'BOOK PUBLISH TEST PASSED' : 'BOOK PUBLISH TEST FAILED', errs);
  await b.close();
  srv.kill();
  process.exit(pass ? 0 : 1);
})();
