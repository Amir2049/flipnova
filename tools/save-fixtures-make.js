// Makes the frozen build-21 saves that tools/save-compat-test.js loads into every new build.
// Run it ONLY against a checkout of build 21 itself (commit dc71ebe), never against a newer build:
//   git worktree add /tmp/w21base dc71ebe && node tools/save-fixtures-make.js /tmp/w21base
// It plays real runs with the game's own bot, so every field is what build 21 really writes.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || '');
const OUT = path.join(__dirname, 'fixtures', 'saves-b21');
if (!fs.existsSync(path.join(root, 'index.html'))) { console.error('usage: node tools/save-fixtures-make.js <build-21 checkout>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

async function make(name, steps) {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/supabase\.co/, (r) => r.abort());
  await page.goto('file://' + root + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    // one helper: start a mode, let the bot play (it stops tapping after `botFor` ticks), wait for the results screen
    window.__play = async (mode, extra, botFor, maxTicks) => {
      FF.UI.startGame(mode, extra || {});
      let w = 0;
      while ((!FF.UI.game || FF.UI.game.mode !== mode) && w++ < 200) await new Promise((ok) => setTimeout(ok, 50));
      const g = FF.UI.game;
      let n = 0;
      while (!g.dead && !g.finished && !g.ended && n++ < maxTicks) {
        if ((n & 1) === 0 && !g.pendingFlip && n < botFor && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct();
        g.tick(FF.STEP);
      }
      w = 0;
      while (!g.ended && !g.dead && w++ < 40) await new Promise((ok) => setTimeout(ok, 50));
      if (g.dead && !g.ended) g.end(); // the same call the game makes 0.95 s after a crash
      w = 0;
      while (!g.ended && w++ < 200) await new Promise((ok) => setTimeout(ok, 50));
      await new Promise((ok) => setTimeout(ok, 400));
      FF.UI.act('home');
      return { mode, score: g.score, finished: !!g.finished, ended: !!g.ended };
    };
  });
  const log = [];
  for (const s of steps) {
    log.push(await page.evaluate(async (s) => {
      if (s.set) { Object.assign(FF.save.settings, s.set.settings || {}); if (s.set.name) FF.save.name = s.set.name; FF.UI.persist(); return 'set'; }
      const extra = s.camp !== undefined ? { level: FF.CAMPAIGN.list[s.camp] } : {};
      return window.__play(s.mode, extra, s.bot, s.max);
    }, s));
  }
  await page.waitForTimeout(300);
  const raw = await page.evaluate(() => localStorage.getItem('flipfrenzy.v1'));
  await b.close();
  if (errs.length) throw new Error(name + ': page errors ' + errs.join(' | '));
  const save = JSON.parse(raw);
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(save, null, 1) + '\n');
  console.log(name, JSON.stringify(log), 'runs', save.runs, 'coins', save.coins, 'best', save.best, 'camp', Object.keys(save.camp || {}).length, 'tower', Object.keys(save.tower || {}).length, 'legend', save.legend ? save.legend.attempts : 0);
}

(async () => {
  const endless = (bot) => ({ mode: 'endless', bot, max: 120 * 1500 });
  const camp = (i) => ({ mode: 'campaign', camp: i, bot: 1e9, max: 120 * 300 });
  // 1) a brand-new player: first launch, one short Endless run
  await make('new-player', [endless(120 * 6)]);
  // 2) in the middle of world 1: a few Endless runs, the first Adventure levels cleared, Arabic and a name chosen
  await make('mid-world1', [endless(120 * 20), endless(120 * 40), camp(0), camp(1), camp(2), { set: { settings: { lang: 'ar' }, name: 'Mona' } }]);
  // 3) further in: Adventure and Daily Remix. (The frozen build-21 file also holds Legend attempts and Tower stars t1/t2:
  //    the Tower was removed in build 35 and the Legend in build 36, so re-making it on a newer build can no longer
  //    add them — keep the frozen file.)
  await make('legend-tower', [endless(120 * 60), camp(0), camp(1), camp(2), camp(3),
    { mode: 'daily', bot: 120 * 30, max: 120 * 1500 }]);
})().catch((e) => { console.error(e); process.exit(1); });
