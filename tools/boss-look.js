// Look at a boss fight as a player sees it: the bot plays (real time), screenshots every N seconds -> one contact sheet,
// and (with --video) a clip of the fight. usage: node tools/boss-look.js OUTDIR [--secs=60] [--every=5] [--video] [--story=tyrant]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const OUT = path.resolve(process.argv[2] || '.'), SECS = +arg('secs', 60), EVERY = +arg('every', 5), VIDEO = process.argv.includes('--video'), PORT = +arg('port', 8890);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, recordVideo: VIDEO ? { dir: OUT, size: { width: 960, height: 540 } } : undefined });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:' + PORT + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.evaluate(() => { FF.save.tutDone = 1; FF.save.runs = 12; FF.save.settings.lang = 'en'; FF.UI.persist(); FF.UI.act('boss'); });
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.boss);
  // the bot's thumb: flips when the boss's own planner says so (it never touches the frame timing)
  await page.evaluate(() => { const g = FF.UI.game, B = g.boss; B.botLate = true; const up = g.update.bind(g); let n = 0; g.update = function (dt) { if (!g.dead && !g.ended && (n++ & 1) === 0 && !g.pendingFlip && B.botShouldFlip && B.botShouldFlip()) g.botAct(); up(dt); }; });
  const shots = [];
  for (let s = 0; s * EVERY < SECS; s++) {
    await page.waitForTimeout(EVERY * 1000);
    const f = path.join(OUT, 'look-' + String(s).padStart(2, '0') + '.png'); await page.screenshot({ path: f }); shots.push(f);
    const st = await page.evaluate(() => { const g = FF.UI.game; return g ? { mode: g.boss && g.boss.mode, dim: g.boss && FF.BOSS_DIMS[g.boss.dim] && FF.BOSS_DIMS[g.boss.dim].id, hp: g.boss && +(g.boss.hp || 0).toFixed(2), dead: g.dead, ended: g.ended } : { none: true, screen: FF.UI.screen }; });
    console.log(s * EVERY + EVERY + 's', JSON.stringify(st));
    if (st.none) break;
  }
  await ctx.close(); await b.close(); srv.kill();
  // contact sheet (3 per row, half size)
  const py = 'from PIL import Image\nimport sys\nfs=sys.argv[2:]\nims=[Image.open(f).convert("RGB").resize((960,540)) for f in fs]\nc=3;r=(len(ims)+c-1)//c\nS=Image.new("RGB",(c*960,r*540))\nfor i,im in enumerate(ims): S.paste(im,((i%c)*960,(i//c)*540))\nS.save(sys.argv[1],quality=85)';
  execFileSync('python3', ['-c', py, path.join(OUT, 'look-sheet.jpg'), ...shots]);
  console.log('sheet', path.join(OUT, 'look-sheet.jpg'), 'errors:', errs.length ? errs.slice(0, 3) : 'none');
})();
