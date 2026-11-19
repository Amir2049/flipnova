// contact sheet of the run-and-gun Tyrant fight: the bot plays (no real time), frames are painted at chosen moments
// usage: node tools/tyrantfight/look.js PAGE.html OUTDIR
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const PAGE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3] || 'look'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + PAGE); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(require('./bot.js'));
  await page.evaluate(() => { FF.TyrantFight.play({ lang: 'en', muted: true }, () => {}); const D = FF.TyrantFight._dbg; D.hold = true; window.__adv = (sec) => { const D = FF.TyrantFight._dbg; for (let i = 0; i < Math.round(sec * 60); i++) { window.__bot.step(); D.S.rt += 1 / 60; D.update(1 / 60); } D.render(D.S.rt); }; });
  let n = 0; const shot = async (label) => { await page.screenshot({ path: path.join(OUT, String(n++).padStart(2, '0') + '-' + label + '.png') }); };
  const adv = (s) => page.evaluate((s) => window.__adv(s), s), set = (fn) => page.evaluate(fn);
  await adv(1.2); await shot('intro-dark'); await adv(1.2); await shot('intro-title');
  for (const t of [3, 4, 4, 3]) { await adv(t); await shot('p1'); }
  await set(() => { FF.TyrantFight._dbg.S.hp = 67.2; }); await adv(0.5); await shot('trans1-a'); await adv(0.6); await shot('trans1-b'); await adv(0.5); await shot('trans1-c'); await adv(0.7); await shot('trans1-d');
  for (const t of [2.5, 3, 3, 3]) { await adv(t); await shot('p2'); }
  await set(() => { FF.TyrantFight._dbg.S.hp = 34.2; }); await adv(0.6); await shot('trans2-a'); await adv(0.7); await shot('trans2-b'); await adv(0.8); await shot('trans2-c');
  for (const t of [2.5, 3, 3, 3]) { await adv(t); await shot('p3'); }
  await set(() => { FF.TyrantFight._dbg.S.orbs = 3; }); await adv(1.0); await shot('super');
  await set(() => { const S = FF.TyrantFight._dbg.S; S.hearts = 0; S.mode = 'down'; S.mt0 = S.t; }); await adv(1.0); await shot('down');
  await adv(2.0);
  await set(() => { FF.TyrantFight._dbg.S.hp = 5.05; }); await adv(0.5); await shot('clash-a'); await adv(1.6); await shot('clash-b'); await adv(1.2); await shot('clash-c');
  await page.waitForFunction(() => true); for (let i = 0; i < 20 && (await page.evaluate(() => FF.TyrantFight._dbg.S.mode)) === 'clash'; i++) await adv(0.5);
  await adv(0.6); await shot('dying-a'); await adv(1.2); await shot('dying-b'); await adv(1.2); await shot('dying-c'); await adv(1.5); await shot('won');
  console.log('frames', n, errs.length ? 'ERRORS ' + errs.slice(0, 4).join(' | ') : 'no errors');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
