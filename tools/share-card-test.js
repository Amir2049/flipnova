// ⚔️ Near-miss share card test (build 34), against tools/mock-supabase.js — the real server is never touched.
// A run that dies at 90%+ of your best (or sets a new best) shows "So close! Challenge a friend" on the results.
// The button shares a 1080x1920 pixel card + the same-road ?vs= link (navigator.share with files, then text, then copy).
// A friend who opens the link sees who challenged them, plays the same road from stage 1 (a normal, counted run),
// and gets "N more to beat X" + "Challenge them back". Old 3-part links keep working. Shares are counted locally only.
// Screenshots: node tools/share-card-test.js <dir>  → <dir>/b34-results.png, b34-card.png, b34-friend-home.png, b34-friend-result.png
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const PORT = 8806;
const SHOTS = process.argv[2] || '';
const out = {};
const base = 'http://localhost:' + PORT;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch();
  const errs = [];
  const supa = [];
  // share: 'files' | 'text' | 'none' — what the fake navigator.share supports
  const open = async (query, share, saveObj) => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    await ctx.addInitScript(([mode, sv]) => {
      if (sv && !localStorage.getItem('flipfrenzy.v1')) localStorage.setItem('flipfrenzy.v1', JSON.stringify(sv));
      window.__shared = [];
      if (mode === 'none') { navigator.share = undefined; navigator.canShare = undefined; return; }
      navigator.canShare = (d) => mode === 'files' || !(d && d.files);
      navigator.share = async (d) => { window.__shared.push({ text: d.text, url: d.url, files: (d.files || []).map((f) => ({ name: f.name, type: f.type, size: f.size })) }); };
    }, [share, saveObj || null]);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('request', (r) => { if (/supabase\.co/.test(r.url()) && r.method() !== 'GET') supa.push(r.url()); });
    await page.route(/supabase\.co/, (r) => r.abort());
    await page.goto(base + '/index.html' + (query || ''));
    await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
    await page.waitForTimeout(1600);
    return { ctx, page };
  };
  const veteran = { best: 1000, runs: 12, tutDone: 1, tutTries: 1, bestStage: 4, name: 'Amir', enV1: 1, settings: { sfx: 0, ui: 0, muted: true, vibration: false, reduceFx: true, guides: false, lang: 'en', hand: 'right' } };
  // play one run: the bot plays for `botSec` seconds, then lets the runner crash. ratio: set the best so the run ends at that share of it.
  const run = (page, mode, extra, botSec, ratio) => page.evaluate(async ([mode, extra, botSec, ratio]) => {
    if (FF.UI.screen !== null || !FF.UI.game) FF.UI.startGame(mode, extra);
    while (!FF.UI.game || FF.UI.game.mode !== mode || FF.UI.game.dead) await new Promise((ok) => setTimeout(ok, 30));
    const g = FF.UI.game;
    let n = 0;
    while (!g.dead && n++ < 120 * 120) { if ((n & 1) === 0 && !g.pendingFlip && g.time < botSec && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
    if (ratio) {
      const best = Math.max(1, Math.floor(g.score / ratio));
      if (mode === 'daily') FF.save.daily = { date: FF.todayKey(), best, ghost: null }; else FF.save.best = best;
    }
    while (!g.ended) await new Promise((ok) => setTimeout(ok, 30));
    while (FF.UI.screen !== 'over') await new Promise((ok) => setTimeout(ok, 30));
    await new Promise((ok) => setTimeout(ok, 150));
    const vb = document.querySelector('#overVs');
    return { score: g.score, seed: g.seed, stage: g.maxStage, assist: !!FF.UI.lastRes.assist, card: FF.UI.lastRes.card || '', btn: !vb.classList.contains('hidden') && vb.offsetHeight > 0, btnText: vb.textContent, goal: document.querySelector('#overGoal').textContent };
  }, [mode, extra || {}, botSec, ratio || 0]);
  const tapVs = (page) => page.click('#overVs', { timeout: 3000 }).catch(() => { out.missingButton = (out.missingButton || 0) + 1; });
  const shot = async (page, name, sel) => { if (SHOTS) await (sel ? page.locator(sel) : page).screenshot({ path: path.join(SHOTS, name) }); };

  // ---- A: a veteran dies at ~95% of the best → the button; tap it → the card + the link go to the share sheet
  const A = await open('', 'files', veteran);
  const a1 = await run(A.page, 'endless', {}, 6, 0.95);
  out.nearMiss = a1;
  if (SHOTS) await A.page.waitForFunction(() => !document.querySelector('#toasts').textContent.trim(), null, { timeout: 15000 }).catch(() => {});
  await shot(A.page, 'b34-results.png');
  await A.page.waitForTimeout(500); // past the 0.45 s "tap anywhere" guard: tapping the button must not restart
  await tapVs(A.page);
  await A.page.waitForTimeout(800);
  const sh = await A.page.evaluate(() => ({ shared: window.__shared, shares: FF.save.shares, cards: FF.save.vsCards, screen: FF.UI.screen }));
  out.shareA = sh;
  const s0 = sh.shared[0] || { files: [] };
  const link = ((s0.text || '').match(/https?:\/\/\S+/) || [''])[0];
  out.link = link;
  out.cardSize = await A.page.evaluate(() => { const c = FF.UI.vsCardCanvas(FF.UI.lastRes); return c.width + 'x' + c.height; });
  if (SHOTS) {
    const png = await A.page.evaluate(() => FF.UI.vsCardCanvas(FF.UI.lastRes).toDataURL('image/png'));
    fs.writeFileSync(path.join(SHOTS, 'b34-card.png'), Buffer.from(png.split(',')[1], 'base64'));
  }
  // B: right after, another near miss — not again within 3 runs (never spammy); a run far below the best — never
  const a2 = await run(A.page, 'endless', {}, 6, 0.95);
  out.cooldownHidden = !a2.btn;
  const a3 = await run(A.page, 'endless', {}, 2, 0.5);
  out.lowHidden = !a3.btn;
  // C: a new best always shows it (gold)
  await A.page.evaluate(() => { FF.save.best = 1; });
  const a4 = await run(A.page, 'endless', {}, 4, 0);
  out.newBest = a4;
  // D: owner powers (assist) — never
  await A.page.evaluate(() => { FF.save.owner = 1; FF.save.ownerCfg = { god: false, speed: 2 }; FF.save.best = 1000000; });
  const a5 = await run(A.page, 'endless', {}, 2, 0.95);
  out.assistHidden = a5.assist && !a5.btn;
  await A.page.evaluate(() => { FF.save.owner = 0; FF.save.ownerCfg = null; });
  await A.ctx.close();

  // ---- E: no file sharing and no share sheet at all → the link is copied
  const E = await open('', 'none', veteran);
  const e1 = await run(E.page, 'endless', {}, 4, 0.92);
  await E.page.waitForTimeout(500);
  await tapVs(E.page);
  await E.page.waitForTimeout(800);
  out.copyFallback = await E.page.evaluate(async () => ({ via: FF.UI.lastShare && FF.UI.lastShare.via, clip: await navigator.clipboard.readText().catch(() => ''), toast: document.querySelector('#toasts').textContent }));
  out.copyOk = e1.btn && /\?vs=/.test(out.copyFallback.clip) && /copied|اتنسخ/.test(out.copyFallback.toast);
  // daily near miss → the link carries &vm=d
  await E.page.evaluate(() => { FF.save.vsCardRun = 0; }); // (the 3-run pause is checked in B)
  const e2 = await run(E.page, 'daily', {}, 4, 0.93);
  await E.page.waitForTimeout(500);
  await tapVs(E.page);
  await E.page.waitForTimeout(800);
  out.dailyClip = await E.page.evaluate(async () => navigator.clipboard.readText().catch(() => ''));
  out.daily = e2;
  await E.ctx.close();

  // ---- F: the friend opens the link: sees who challenged them, plays the same road from stage 1 (counted: no assist)
  // (if the share above broke, carry on with a hand-made link so every other check still reports)
  const q = link ? link.slice(link.indexOf('?')) : '?vs=' + a1.seed.toString(36) + '.' + a1.score.toString(36) + '.Amir&src=card';
  const F = await open(q, 'text', { tutDone: 1, tutTries: 1, runs: 3, best: 50, name: 'Friend', enV1: 1, settings: veteran.settings });
  out.banner = await F.page.evaluate(() => { const el = document.querySelector('#vsBanner'); return !el.classList.contains('hidden') && el.offsetHeight > 0 ? el.textContent : ''; });
  await shot(F.page, 'b34-friend-home.png');
  await F.page.click('#vsBanner');
  await F.page.waitForFunction(() => FF.UI.game && FF.UI.game.mode === 'endless');
  out.friendRoad = await F.page.evaluate(() => ({ seed: FF.UI.game.seed, vs: FF.UI.vs && FF.UI.vs.seed, startX: FF.UI.game.opts.startX || 0 }));
  const f1 = await run(F.page, 'endless', {}, 1, 0);
  out.friend = f1;
  await shot(F.page, 'b34-friend-result.png');
  await F.page.waitForTimeout(500);
  await tapVs(F.page);
  await F.page.waitForTimeout(800);
  out.friendBack = await F.page.evaluate(() => window.__shared[0] || null);
  await F.ctx.close();

  // ---- G: an old build-32 link (seed.score.name, nothing else) still works exactly as before
  const G = await open('?vs=' + (12345).toString(36) + '.' + (777).toString(36) + '.Old', 'text', { tutDone: 1, runs: 3, enV1: 1, settings: veteran.settings });
  out.oldLink = await G.page.evaluate(() => FF.UI.vs);
  await G.page.click('[data-act=play]');
  await G.page.waitForFunction(() => FF.UI.game && FF.UI.game.mode === 'endless');
  out.oldSeed = await G.page.evaluate(() => FF.UI.game.seed);
  // broken links are ignored without an error
  await G.page.goto(base + '/index.html?vs=%%%..');
  await G.page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
  out.badIgnored = await G.page.evaluate(() => FF.UI.vs === null && document.querySelector('#vsBanner').classList.contains('hidden'));
  await G.ctx.close();

  // ---- H: a friend's Daily road from another day: plays that road, records nothing (no daily best, nothing sent)
  const H = await open('?vs=' + (987654).toString(36) + '.' + (300).toString(36) + '.Amir&vm=d', 'text', { tutDone: 1, runs: 3, enV1: 1, settings: veteran.settings });
  const rowsBefore = (await (await fetch(base + '/__rows')).json()).length;
  await H.page.evaluate((url) => { FF.save.onlineOverride = { url, key: 'test-key' }; FF.Online.MIN_SHOW.endless = 0; }, base);
  await H.page.click('#vsBanner');
  await H.page.waitForFunction(() => FF.UI.game && FF.UI.game.mode === 'daily');
  out.pastDailySeed = await H.page.evaluate(() => FF.UI.game.seed);
  const h1 = await run(H.page, 'daily', {}, 3, 0);
  await H.page.waitForTimeout(2500);
  out.pastDaily = Object.assign(h1, await H.page.evaluate(() => ({ dailyBest: FF.save.daily.best, today: (FF.save.todayScores.list || []).length, pending: (FF.save.pendingScores || []).length })));
  out.rowsAdded = (await (await fetch(base + '/__rows')).json()).length - rowsBefore;
  await H.ctx.close();

  await b.close(); srv.kill();
  out.supabaseWrites = supa;
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  const checks = {
    nearMissButton: a1.btn && a1.card === 'close' && /So close|قرّبت/.test(a1.btnText),
    sharedFileAndLink: s0.files.length === 1 && s0.files[0].type === 'image/png' && s0.files[0].size > 2000 && /\?vs=[0-9a-z]+\.[0-9a-z]+\.Amir/.test(link) && /src=card/.test(link) && link.indexOf('?vs=' + a1.seed.toString(36) + '.' + a1.score.toString(36) + '.') > 0,
    noRestartOnTap: sh.screen === 'over',
    countedLocally: sh.shares === 1 && sh.cards >= 1,
    card1080x1920: out.cardSize === '1080x1920',
    cooldown: out.cooldownHidden,
    lowScoreHidden: out.lowHidden,
    newBestGold: a4.btn && a4.card === 'best' && /New best|رقم جديد/.test(a4.btnText),
    assistHidden: out.assistHidden,
    copyFallback: out.copyOk,
    dailyLink: out.daily.btn && /&vm=d/.test(out.dailyClip),
    friendBanner: /Amir/.test(out.banner) && out.banner.indexOf(String(a1.score)) >= 0,
    friendSameRoad: out.friendRoad.seed === a1.seed && out.friendRoad.vs === a1.seed && out.friendRoad.startX === 0 && !f1.assist,
    friendResult: f1.btn && f1.card === 'back' && /more to beat Amir|beat Amir/.test(f1.goal),
    friendChallengesBack: !!out.friendBack && /\?vs=/.test(out.friendBack.url || out.friendBack.text || '') && /Friend/.test(out.friendBack.url || ''),
    oldLinkWorks: out.oldLink && out.oldLink.seed === 12345 && out.oldLink.score === 777 && out.oldLink.name === 'Old' && out.oldLink.mode === 'endless' && out.oldSeed === 12345,
    badLinkIgnored: out.badIgnored,
    pastDailyNotCounted: out.pastDailySeed === 987654 && out.pastDaily.dailyBest === 0 && out.pastDaily.today === 0 && out.pastDaily.pending === 0 && out.rowsAdded === 0 && out.pastDaily.btn,
    neverTouchesSupabase: !supa.length,
    noErrors: !errs.length
  };
  console.log(checks);
  const ok = Object.values(checks).every(Boolean);
  console.log(ok ? 'SHARE CARD TEST PASSED' : 'SHARE CARD TEST FAILED');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
