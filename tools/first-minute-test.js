// 🎓 First-minute test (build 33), against tools/mock-supabase.js — the real server is never touched.
// A brand-new player: fewer home buttons, no streak toast before the first run, a tutorial with a checkpoint
// after every obstacle that goes straight into Endless, "YOUR FIRST SCORE" instead of "NEW BEST", one goal line,
// tap anywhere to restart, the streak toast after the first run and a "tomorrow" card after the third.
// Also: leaving the tutorial half way brings it back once. Nothing here changes how hard the game is.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8803;
const out = {};
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch();
  const errs = [];
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(e.message));
    await page.route(/supabase\.co/, (r) => r.abort());
    await page.goto('http://localhost:' + PORT + '/index.html');
    await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
    await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const toasts = (page) => page.evaluate(() => document.querySelector('#toasts').textContent);

  // ---- A: the full first minute
  const { ctx, page } = await fresh();
  out.newbieHome = await page.evaluate(() => document.querySelector('#home').classList.contains('newbie') && getComputedStyle(document.querySelector('#home .mini.maker')).display === 'none' && !document.querySelector('[data-act=legend], [data-act=viral]'));
  out.noStreakBeforePlay = !/Day|يوم/.test(await toasts(page));
  await page.click('[data-act=play]');
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.opts.tutorial);
  out.tutCheckpoints = await page.evaluate(() => FF.UI.game.L.checkpoints.length);
  out.tutNotDoneYet = await page.evaluate(() => !FF.save.tutDone);
  // play it with the game's own bot until it ends
  await page.evaluate(() => { window.__bot = setInterval(() => { const g = FF.UI.game; if (g && g.opts.tutorial && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); }, 4); });
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.mode === 'endless', null, { timeout: 90000 });
  await page.evaluate(() => clearInterval(window.__bot));
  out.tutoToEndless = true;
  out.tutDoneAfter = await page.evaluate(() => FF.save.tutDone === 1);
  // first Endless run: no taps, crash
  await page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 30000 });
  out.firstTitle = await page.textContent('#overTitle');
  out.goal = await page.textContent('#overGoal');
  await page.waitForTimeout(1300);
  out.streakAfterRun = /Day|يوم/.test(await toasts(page));
  // tap anywhere (on the title, not a button) restarts
  await page.waitForTimeout(200);
  const box = await page.locator('#overTitle').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  out.tapRestart = await page.evaluate(() => FF.UI.screen === null && !!FF.UI.game && FF.UI.game.mode === 'endless' && !FF.UI.game.dead);
  // a tap in the first 0.45 s does not count (the crash tap)
  await page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 30000 });
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(100);
  out.earlyTapIgnored = await page.evaluate(() => FF.UI.screen === 'over');
  out.secondTitle = await page.textContent('#overTitle');
  await page.waitForTimeout(500);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => FF.UI.screen === null, null, { timeout: 5000 });
  await page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  out.sessRuns = await page.evaluate(() => FF.UI.sessRuns);
  out.toastsNow = await toasts(page);
  out.tomorrowCard = /Tomorrow|بكرة/.test(out.toastsNow);
  await ctx.close();

  // ---- B: leaving the tutorial half way brings it back once, then it's done
  const B = await fresh();
  await B.page.click('[data-act=play]');
  await B.page.waitForFunction(() => FF.UI.game && FF.UI.game.opts.tutorial);
  await B.page.waitForTimeout(800);
  await B.page.evaluate(() => FF.UI.act('home'));
  await B.page.waitForTimeout(600);
  out.quitNotDone = await B.page.evaluate(() => !FF.save.tutDone);
  await B.page.click('[data-act=play]');
  await B.page.waitForTimeout(500);
  out.tutAgain = await B.page.evaluate(() => !!(FF.UI.game && FF.UI.game.opts.tutorial));
  out.doneAfterSecondTry = await B.page.evaluate(() => FF.save.tutDone === 1);
  await B.ctx.close();

  await b.close(); srv.kill();
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  const ok = out.newbieHome && out.noStreakBeforePlay && out.tutCheckpoints >= 6 && out.tutNotDoneYet && out.tutoToEndless && out.tutDoneAfter &&
    /FIRST|أول/.test(out.firstTitle) && /STAGE|المرحلة/.test(out.goal) && out.streakAfterRun && out.tapRestart && out.earlyTapIgnored &&
    !/FIRST/.test(out.secondTitle) && out.tomorrowCard && out.quitNotDone && out.tutAgain && out.doneAfterSecondTry && !errs.length;
  console.log(ok ? 'FIRST MINUTE TEST PASSED' : 'FIRST MINUTE TEST FAILED');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
