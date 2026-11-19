// 🗓 Build 35 test: the weekly TWIST, the #1 ghost, rank / rewards / countdown / last-week card, and the real Daily REMIX.
// Runs against tools/mock-supabase.js (the real server is blocked). The clock is moved to Saturday 7 Nov 2026
// (week 2026-11-06 = the first twist week, Daily 2026-11-07 = a remix day).
// usage: node tools/weekly2-test.js [shotDir]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8809;
const SHOTS = process.argv[2] || require('os').tmpdir();
const NOW = '2026-11-07T12:00:00Z';
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'inherit' });
  await new Promise((ok) => setTimeout(ok, 600));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.route(/supabase\.co/, (r) => r.abort()); // never the real server
  await ctx.addInitScript((iso) => { // a fixed "now" for the whole page (Date.now and new Date())
    const OFF = Date.parse(iso) - Date.now(); const RD = Date; const now = RD.now.bind(RD);
    class D extends RD { constructor(...a) { if (!a.length) super(now() + OFF); else super(...a); } static now() { return now() + OFF; } }
    window.Date = D;
  }, NOW);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const base = 'http://localhost:' + PORT;
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, 'b35b-' + n + '.png') });
  const ok = {};
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.evaluate((url) => { FF.save.onlineOverride = { url, key: 'test-key' }; FF.save.tutDone = 1; FF.save.runs = 20; FF.save.bestStage = 5; FF.save.name = 'Tester'; FF.UI.persist(); }, base);

  // 1) rules: one twist per week, in turn, versioned by date; a Daily remix distinct from the weekly twists
  const rules = await page.evaluate(() => {
    const k = (d) => FF.weekInfo(Date.parse(d)).key;
    const weeks = ['2026-11-07', '2026-11-14', '2026-11-21', '2026-11-28', '2026-12-05', '2026-12-12'].map((d) => FF.weekTwistOf(k(d + 'T12:00:00Z')));
    const day = (d) => FF.dailyRemix(FF.hashStr('daily-' + d));
    const days = ['2026-11-07', '2026-11-08', '2026-11-09'].map(day);
    const lv = (opts) => new FF.Level(Object.assign({ seed: 1, seen: {} }, opts));
    // the world order really changes: stage worlds on two remix days vs the plain book
    const worlds = (L) => [1, 2, 3, 4, 5].map((st) => L.worldAt((st - 1) * FF.Level.STAGE_LEN + 10).id).join(',');
    const plainW = worlds(lv({ seed: FF.hashStr('daily-2026-11-04') }));
    const remixW = worlds(lv({ seed: FF.hashStr('daily-2026-11-07'), remix: days[0] }));
    const remixW2 = worlds(lv({ seed: FF.hashStr('daily-2026-11-08'), remix: days[1] }));
    return {
      weeks, before: FF.weekTwistOf('2026-10-30'), weekNow: FF.weekTwist(FF.weekInfo().seed),
      oldDay: day('2026-11-06'), mods: days.map((d) => d && d.mod), plainW, remixW, remixW2,
      normal: (() => { const L = lv({ seed: 424242 }); return { fx: L.fx, twist: L.twist, mod: L.modAt(5000) }; })(),
      gameDaily: (() => { const g = new FF.Game({ mode: 'daily', seed: FF.hashStr('daily-' + FF.todayKey()), silent: true, settings: {}, seen: {}, callbacks: {} }); return { mod: g.remix && g.remix.mod, m1: g.L.modAt(10), world: g.world.id }; })(),
      gameEndless: (() => { const g = new FF.Game({ mode: 'endless', seed: 777, silent: true, settings: {}, seen: {}, callbacks: {} }); return { twist: g.twist, weekRun: g.weekRun }; })()
    };
  });
  console.log('rules', JSON.stringify(rules));
  const distinct = (a) => a.every((x, i) => i === 0 || x !== a[i - 1]);
  ok.rules = rules.weeks.every(Boolean) && distinct(rules.weeks) && new Set(rules.weeks.slice(0, 5)).size === 5 && rules.before === null && rules.weekNow === 'dark' &&
    rules.oldDay === null && rules.mods.every(Boolean) && distinct(rules.mods) && rules.mods.every((m) => ['lowgrav', 'dark', 'burst', 'mirror', 'sawrain'].indexOf(m) < 0) &&
    rules.remixW !== rules.plainW && rules.remixW2 !== rules.remixW && !rules.normal.fx && rules.normal.twist === null &&
    rules.gameDaily.mod === 'heavy' && rules.gameDaily.m1 === 'heavy' && rules.gameEndless.twist === null && !rules.gameEndless.weekRun;

  // 2) every twist is hard but fair: the perfect bot still gets through the first stages of each one
  const fair = await page.evaluate(() => {
    const out = {};
    for (const tw of ['lowgrav', 'dark', 'burst', 'mirror', 'sawrain']) {
      let best = 0;
      for (const sd of [11, 22, 33]) {
        const g = new FF.Game({ mode: 'endless', seed: sd, silent: true, settings: {}, seen: {}, callbacks: {} });
        g.L = new FF.Level({ seed: sd, seen: {}, twist: tw }); g.twist = g.L.twist; g.L.ensure(400);
        let n = 0;
        while (!g.dead && n++ < 120 * 150) { if ((n & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
        best = Math.max(best, g.maxStage);
      }
      out[tw] = best;
    }
    const L = new FF.Level({ seed: 5, seen: {}, twist: 'burst' }), Ln = new FF.Level({ seed: 5, seen: {} });
    out.burstFast = L.speedAt(1250) > Ln.speedAt(1250) * 1.2 && L.speedAt(500) === Ln.speedAt(500) && L.speedAt(1250) <= 205;
    const Ls = new FF.Level({ seed: 5, seen: {}, twist: 'sawrain' }); Ls.ensure(6000);
    out.saws = Ls.objs.filter((o) => o.t === 'saw' || o.kind === 'saw').length;
    out.grav = new FF.Level({ seed: 5, seen: {}, twist: 'lowgrav' }).gravAt(100);
    return out;
  });
  console.log('fair', fair);
  ok.fair = ['lowgrav', 'dark', 'burst', 'mirror', 'sawrain'].every((k) => fair[k] >= 3) && fair.burstFast && fair.saws > 0 && fair.grav < 1;

  // 3) server rows (read only, the existing table): the week's #1 (a strong bot on the twist road), a run made
  //    WITHOUT the twist on the same seed (must fail verification), and last week's runs for the last-week card
  const made = await page.evaluate(() => {
    const play = (mode, seed, secs, hack) => {
      let res = null;
      const g = new FF.Game({ mode, seed, silent: true, settings: {}, seen: {}, callbacks: { onEnd: (r) => (res = r), onEvent: () => {} } });
      if (hack) { g.L = new FF.Level({ seed, seen: {} }); g.twist = null; g.L.ensure(400); }
      let n = 0;
      while (!g.dead && n++ < 120 * secs) { if ((n & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
      while (!g.dead && n++ < 120 * 400) g.tick(FF.STEP);
      g.end();
      return { score: res.score, dist: res.dist, stage: res.stage, proof: FF.Online.encodeRun(res) };
    };
    const w = FF.weekInfo(), prev = FF.weekInfo(w.start - 864e5);
    return { lead: play('endless', w.seed, 150), legacy: play('endless', w.seed, 70, true), last: play('endless', prev.seed, 40), prevStart: prev.start, wkStart: w.start };
  });
  const post = (e) => fetch(base + '/rest/v1/ff_scores', { method: 'POST', headers: { apikey: 'test-key', 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
  const iso = (ms) => new Date(ms).toISOString();
  await post({ board: 'endless', name: 'Leader', score: made.lead.score, dist: made.lead.dist, stage: made.lead.stage, proof: made.lead.proof, device: 'leaddev', created_at: iso(made.wkStart + 3600e3) });
  await post({ board: 'endless', name: 'NoTwist', score: made.legacy.score, dist: made.legacy.dist, stage: made.legacy.stage, proof: made.legacy.proof, device: 'legacydev', created_at: iso(made.wkStart + 7200e3) });
  await post({ board: 'endless', name: 'LastWk', score: made.last.score + 2000, dist: made.last.dist, stage: made.last.stage, proof: made.last.proof, device: 'lastdev', created_at: iso(made.prevStart + 3600e3) }); // fake score: hidden
  await post({ board: 'endless', name: 'LastWk2', score: made.last.score, dist: made.last.dist, stage: made.last.stage, proof: made.last.proof, device: 'lastdev2', created_at: iso(made.prevStart + 7200e3) });
  console.log('rows', { lead: made.lead.score, legacy: made.legacy.score, last: made.last.score });

  // 4) my weekly run through the UI: the banner, the twist, a perfect bot to stage 3 (reward), then a crash
  const run1 = await page.evaluate(async () => {
    FF.UI.act('weekly');
    while (!FF.UI.game || FF.UI.game.mode !== 'endless') await new Promise((r) => setTimeout(r, 30));
    const g = FF.UI.game, ban = document.querySelector('#twistBan');
    const out = { twist: g.twist, weekRun: g.weekRun, ban: ban.classList.contains('hidden') ? '' : ban.textContent };
    let n = 0;
    while (!g.dead && n++ < 120 * 200) { if ((n & 1) === 0 && !g.pendingFlip && g.p.x < 6300 && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
    while (!g.ended) await new Promise((r) => setTimeout(r, 50));
    await new Promise((r) => setTimeout(r, 600));
    return Object.assign(out, { score: g.score, stage: g.maxStage, wkr: Object.assign({}, FF.save.wkr), best: FF.save.weekly.best, ghostLen: (FF.save.weekly.ghost || []).length, goal: document.querySelector('#overGoal').textContent });
  });
  console.log('run1', run1);
  ok.run1 = run1.twist === 'dark' && run1.weekRun && /DARKNESS/.test(run1.ban) && /WEEK 46/.test(run1.ban) && run1.stage >= 3 && run1.wkr.t_wk_dark === '2026-11-06' && !run1.wkr.wk_dark_x && run1.best === run1.score && run1.ghostLen > 10;

  // 5) build 37: the home has ONE weekly card — the boss duel (week, live countdown, the week's reward ladder). The weekly
  //    run still has its code, its board and its rank (read from the real board when the home opens), just no home button.
  await page.evaluate(() => { FF.UI.act('home'); });
  await page.waitForFunction(() => FF.UI.weekAt && !FF.UI.weekBusy && FF.save.weekly.rank === 2 && FF.save.weekly.of === 2 && FF.save.weekly.lead, null, { timeout: 30000 }); // the home's quiet board refresh is done
  const card = await page.evaluate(() => ({ noWeekBtn: !document.querySelector('#home [data-act=weekly]'), boss: document.querySelector('#eventCard .evCard.boss').textContent, left: document.querySelector('#bossLeft').textContent, urgent: document.querySelector('#bossLeft').classList.contains('urgent'), rw: document.querySelector('#bossRw').textContent, ws: Object.assign({}, FF.save.weekly, { ghost: 0, lead: FF.save.weekly.lead && FF.save.weekly.lead.name }) }));
  console.log('card', card);
  await shot('weekly-home');
  ok.card = card.noWeekBtn && /WEEK 46/.test(card.boss) && /\d/.test(card.left) && !card.urgent && /ECLIPSE/.test(card.rw) && card.ws.rank === 2 && card.ws.of === 2 && card.ws.gap === made.lead.score - run1.score + 1 && card.ws.lead === 'Leader';

  // 6) the next weekly run races the #1's ghost (replayed from their verified proof) — banner + the ghost on screen
  const run2 = await page.evaluate(async () => {
    FF.UI.act('weekly');
    await new Promise((r) => setTimeout(r, 900));
    const g = FF.UI.game, ban = document.querySelector('#twistBan');
    return { ghost: (g.ghost || []).length, name: g.opts.ghostName, label: g.ghostLabel(), ban: ban.textContent, shown: !ban.classList.contains('hidden') };
  });
  console.log('run2', run2);
  await shot('weekly-banner');
  // the ghost ahead of me, in the dark
  await page.evaluate(() => { const g = FF.UI.game; let n = 0; while (n++ < 120 * 6 && !g.dead) { if ((n & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); } });
  await page.waitForTimeout(150);
  await shot('weekly-run');
  ok.run2 = run2.ghost > 10 && run2.name === '#1 Leader' && run2.label === '#1 LEADER' && run2.shown && /Leader/.test(run2.ban);
  const res2 = await page.evaluate(async () => {
    const g = FF.UI.game; let n = 0;
    while (!g.dead && n++ < 120 * 120) g.tick(FF.STEP);
    while (FF.UI.screen !== 'over') await new Promise((r) => setTimeout(r, 50));
    await new Promise((r) => setTimeout(r, 300));
    return { goal: document.querySelector('#overGoal').textContent };
  });
  console.log('results', res2);
  await shot('weekly-results');
  ok.results = /This week: #2 of 2/.test(res2.goal) && /to pass Leader/.test(res2.goal) && /Reach stage 6 this week: ECLIPSE character/.test(res2.goal);

  // 7) the week board: NoTwist's run (same seed, no twist) never verifies
  await page.evaluate(() => FF.UI.act('board'));
  await page.click('[data-btab="worldWeek"]', { force: true });
  await page.waitForFunction(() => /🎯|👑|✓/.test(document.querySelector('#boardStatus').textContent), null, { timeout: 30000 });
  const board = await page.evaluate(() => [...document.querySelectorAll('#boardList .brow')].map((r) => r.querySelector('.nm').firstChild.textContent));
  console.log('week board', board);
  ok.board = board.length === 2 && /Leader/.test(board[0]) && !board.some((r) => /NoTwist|LastWk/.test(r));

  // 8) the Daily remix: banner, modifier, a new world order — and its proof verifies; an old (pre-remix) daily proof still does
  const daily = await page.evaluate(async () => {
    FF.UI.act('home');
    await new Promise((r) => setTimeout(r, 900));
    FF.UI.act('daily');
    while (!FF.UI.game || FF.UI.game.mode !== 'daily') await new Promise((r) => setTimeout(r, 30));
    await new Promise((r) => setTimeout(r, 700));
    const g = FF.UI.game, ban = document.querySelector('#twistBan');
    return { mod: g.remix && g.remix.mod, ban: ban.textContent, shown: !ban.classList.contains('hidden'), world: g.world.id, bookWorld: g.L.stageDef(0).world };
  });
  await shot('daily');
  const dproof = await page.evaluate(() => {
    const play = (date) => {
      let res = null;
      const g = new FF.Game({ mode: 'daily', seed: FF.hashStr('daily-' + date), silent: true, settings: {}, seen: {}, callbacks: { onEnd: (r) => (res = r), onEvent: () => {} } });
      let n = 0;
      while (!g.dead && n++ < 120 * 40) { if ((n & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
      while (!g.dead && n++ < 120 * 300) g.tick(FF.STEP);
      g.end();
      res.date = date;
      return { row: { board: 'daily-' + date, score: res.score, dist: res.dist, proof: FF.Online.encodeRun(res) }, remix: !!g.remix };
    };
    const now = play(FF.todayKey()), old = play('2026-11-04');
    return { nowOk: FF.Online.verifyEntry(now.row), nowRemix: now.remix, oldOk: FF.Online.verifyEntry(old.row), oldRemix: old.remix, fakeOk: FF.Online.verifyEntry(Object.assign({}, now.row, { score: now.row.score + 50 })) };
  });
  console.log('daily', daily, dproof);
  ok.daily = daily.mod === 'heavy' && daily.shown && /HEAVY DAY/.test(daily.ban) && /REMIX/.test(daily.ban) && daily.world !== daily.bookWorld &&
    dproof.nowOk && dproof.nowRemix && dproof.oldOk && !dproof.oldRemix && !dproof.fakeOk;

  // 9) Arabic: the banner reads in Egyptian Arabic
  const ar = await page.evaluate(async () => {
    FF.UI.act('home');
    await new Promise((r) => setTimeout(r, 900));
    FF.save.settings.lang = 'ar';
    FF.UI.act('weekly');
    await new Promise((r) => setTimeout(r, 600));
    const t = document.querySelector('#twistBan').textContent;
    FF.UI.game.paused = true;
    FF.UI.act('home');
    await new Promise((r) => setTimeout(r, 900));
    const card = document.querySelector('#eventCard .evCard.boss').textContent;
    FF.save.settings.lang = 'en';
    return { t, card };
  });
  console.log('arabic', ar);
  ok.arabic = /ضلمة/.test(ar.t) && /الأسبوع 46/.test(ar.t) && /الأسبوع 46/.test(ar.card); // the card's live text (week, ladder) is written in the current language

  // 10) a new week: the "last week you finished #2 of 2" card on the first open (rank from the real board)
  await page.evaluate(() => {
    FF.save.weekly = { key: '2026-10-30', best: 400, dist: 300, stage: 4, tries: 3, x: 3000, rival: null, proof: '', rank: 5, of: 9 };
    FF.save.weekLast = null;
    FF.UI.persist();
  });
  await page.reload();
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
  await page.waitForFunction(() => /#2 of 2/.test(document.querySelector('#weekLast').textContent), null, { timeout: 30000 });
  const last = await page.evaluate(() => ({ text: document.querySelector('#weekLast').textContent, shown: !document.querySelector('#weekLast').classList.contains('hidden'), wl: FF.save.weekLast }));
  console.log('last week', last);
  await shot('lastweek');
  await page.evaluate(() => FF.UI.act('weekLastClose'));
  await page.reload();
  await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
  await page.waitForTimeout(1200);
  const again = await page.evaluate(() => !document.querySelector('#weekLast').classList.contains('hidden'));
  ok.last = last.shown && /You finished #2 of 2/.test(last.text) && /400 points · stage 4/.test(last.text) && /DARKNESS/.test(last.text) && !again;

  const pass = Object.values(ok).every(Boolean) && !errs.length;
  console.log(pass ? 'WEEKLY2 TEST PASSED' : 'WEEKLY2 TEST FAILED', ok, errs);
  await b.close();
  srv.kill();
  process.exit(pass ? 0 : 1);
})();
