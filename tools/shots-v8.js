// Screenshots of the v8 features (rifts, pistons/jaws/geysers, speedometer, owner code).
// usage: node tools/shots-v8.js [outDir]   (default: concept/)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const out = process.argv[2] || path.join(root, 'concept');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + root + '/index.html');
  await page.waitForTimeout(2000);
  const shot = (n) => page.screenshot({ path: path.join(out, n + '.png') });
  await page.evaluate(() => {
    FF.save.runs = 9; // no beginner guides in the pictures
    window.__bot = setInterval(() => {
      const g = FF.UI.game;
      if (g && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct();
    }, 8);
  });
  const start = async (seed) => {
    await page.evaluate((seed) => FF.UI.startGame('endless', { seed }), seed);
    await page.waitForFunction(() => FF.UI.game && FF.UI.game.mode === 'endless');
    await page.waitForTimeout(300);
  };
  // jump to just before the first object matching `kind`, keeping everything in between out of the way
  const jumpTo = (test, before) => page.evaluate(([test, before]) => {
    const g = FF.UI.game, L = g.L;
    L.ensure(60000);
    const f = new Function('o', 'return ' + test);
    const o = L.objs.find((q) => q.x > 2500 && f(q));
    const x = o.x - before;
    L.objs = L.objs.filter((q) => q.x > x + 40 || q.x + q.w < x - 400 || q.t === 'coin');
    Object.assign(g.p, { x, y: FF.F - 12, vy: 0, grav: 1, grounded: true, fly: false });
    g.camX = x - FF.PLAYER_X;
    g.world = L.worldAt(x);
    g.worldPrev = null;
    g.stage = L.stageAt(x);
    g.invuln = 1.5;
    return o.x;
  }, [test, before]);

  await start(11);
  await jumpTo("o.t === 'piston' && o.style === 'steel'", 150);
  await page.waitForTimeout(900);
  await shot('v8-pistons');

  await start(12);
  await jumpTo("o.t === 'piston' && o.style === 'jaw'", 150);
  await page.waitForTimeout(800);
  await shot('v8-jaws');

  await start(13);
  await jumpTo("o.t === 'piston' && o.style === 'fire'", 190);
  await page.waitForTimeout(500);
  await page.waitForFunction(() => { const g = FF.UI.game; return g.L.near(g.camX + 60, g.camX + 300).some((o) => o.style === 'fire' && FF.Phys.pistonExt(o, g.time) > 0.9); }, null, { timeout: 5000 }).catch(() => {});
  await shot('v8-geysers');

  await start(14);
  await page.evaluate(() => { clearInterval(window.__bot); });
  await jumpTo("o.t === 'rift'", 210);
  await page.waitForTimeout(250);
  await page.evaluate(() => FF.UI.game.flip());
  await page.waitForTimeout(900);
  await shot('v8-rift-portal');

  // inside each rift world
  await page.evaluate(() => {
    window.__bot = setInterval(() => {
      const g = FF.UI.game;
      if (g && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct();
    }, 8);
  });
  for (const [kind, wait, name] of [[0, 3400, 'v8-rift-cosmos'], [1, 2600, 'v8-rift-vault'], [2, 2400, 'v8-rift-aurora']]) {
    await start(20 + kind);
    await page.evaluate((kind) => { const g = FF.UI.game; g.enterRift({ kind, n: 1, x: 2000, retX: 3000 }); }, kind);
    await page.waitForTimeout(wait);
    if (kind === 0) { await page.waitForFunction(() => FF.UI.game.p.fly, null, { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(1200); }
    await shot(name);
  }

  // late in a run: speedometer and speed streaks
  await start(30);
  await page.evaluate(() => {
    const g = FF.UI.game, x = 24200;
    g.L.ensure(x + 600);
    g.L.objs = g.L.objs.filter((q) => q.x > x + 200 || q.x + q.w < x - 400);
    Object.assign(g.p, { x, y: FF.F - 12, vy: 0, grav: 1, grounded: true });
    g.camX = x - FF.PLAYER_X; g.world = g.L.worldAt(x); g.worldPrev = null; g.stage = g.L.stageAt(x) - 1; g.invuln = 2;
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => { const g = FF.UI.game; g.p.x = 24010; });
  await page.waitForTimeout(450);
  await shot('v8-speed');
  await page.evaluate(() => { clearInterval(window.__bot); FF.UI.game.paused = true; });

  // the owner's gift code (kept out of the repo: pass it as FF_OWNER_CODE to take these two pictures)
  if (!process.env.FF_OWNER_CODE) { console.log('errors:', errors); await browser.close(); return; }
  await page.evaluate(() => { FF.UI.game = null; FF.UI.act('settings'); });
  await page.waitForTimeout(300);
  await page.click('#settings [data-act=redeem]');
  await page.fill('#codeText', process.env.FF_OWNER_CODE);
  await page.click('#codeOk');
  await page.waitForTimeout(500);
  await page.evaluate(() => FF.UI.act('skins'));
  await page.waitForTimeout(400);
  await shot('v8-owner-skins');
  const owner = await page.evaluate(() => ({ owner: !!FF.save.owner, skins: FF.SKINS.every((s) => FF.isUnlocked(s)), coins: FF.save.coins }));
  console.log('owner:', owner, 'errors:', errors);
  await browser.close();
})();
