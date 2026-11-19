// 📖 STORY test (builds 43–44): the story screen in order, and chapter 3, MINO vs PALE NIRO. Runs against tools/mock-supabase.js (the real server is blocked).
//   1. the home has a STORY door; tapping it starts the duel as MINO against PALE NIRO (story save, never the weekly one)
//   2. a planning bot wins: the fight travels old tunnel → dark → echoes → memories → the fall (3D tunnel) → the ledge,
//      and uses every new attack (knock, knock2, echo, pit, drop, pslash); every hazard is harmless while it is a warning
//   3. the STYLE meter climbs (a rank above D) and the ULT fills
//   4. the two mid-fight memories ask to play (bossPhase 1 and 2), and the win unlocks NIRO and PALE NIRO
//   5. the fight is deterministic: the recorded taps replay to the very same result
//   6. the weekly Tyrant still loads with its own dimensions (no story leaks into it)
// usage: node tools/niro-test.js [shotDir]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = +process.env.NIRO_PORT || 8833;
const SHOTS = process.argv[2] || '';
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:' + PORT + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.evaluate(() => { FF.save.tutDone = 1; FF.save.runs = 12; FF.save.bestStage = 4; FF.save.name = 'Tester'; FF.save.storySeen = { prologue: 1, intro: 1 }; FF.save.storyCh1 = 1; FF.UI.persist(); FF.UI.act('home'); });
  await page.waitForTimeout(400);
  const shot = (n) => (SHOTS ? page.screenshot({ path: path.join(SHOTS, 'b43-' + n + '.png') }) : null);
  await shot('home');
  const ok = {};
  const door = await page.evaluate(() => { const d = document.querySelector('#home [data-act=story]'); return { shown: !!d && d.offsetParent !== null, text: d ? d.textContent : '', lockedNiro: !FF.isUnlocked(FF.skinById('niro')) }; });
  console.log('door', door);
  ok.door = door.shown && /STORY/.test(door.text) && door.lockedNiro;
  // b44: the door opens the story screen: prologue + 5 chapters in order (2, 4 and 5 are COMING SOON)
  await page.click('#home [data-act=story]');
  await page.waitForFunction(() => FF.UI.screen === 'storyBox');
  await page.waitForTimeout(500);
  await shot('story');
  const order = await page.evaluate(() => [...document.querySelectorAll('#storyList .stCard')].map((c) => c.dataset.ch + ':' + (c.classList.contains('soon') ? 'soon' : c.classList.contains('lock') ? 'lock' : c.classList.contains('done') ? 'done' : 'open')).join());
  console.log('order', order);
  ok.order = order === 'pro:done,ch1:done,ch2:soon,ch3:open,ch4:soon,ch5:soon';
  await page.click('#storyList .stCard[data-ch=ch3]');
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.boss, null, { timeout: 8000 });
  const start = await page.evaluate(() => {
    const g = FF.UI.game, B = g.boss;
    window.__phaseEv = [];
    const cb = g.opts.callbacks.onEvent; g.opts.callbacks.onEvent = (t, d) => { if (t === 'bossPhase') window.__phaseEv.push(d.phase); cb(t, d); };
    g.paused = true; B.botLate = true;
    const out = { boss: B.def.id, skin: g.opts.skin, story: !!g.opts.story, dims: B.D.map((d) => d.id), tele: {}, harmless: true, maxRank: 0, hits: 0 };
    const seen = new Set();
    let n = 0;
    const ocv = document.createElement('canvas'); ocv.width = FF.W; ocv.height = FF.H; const octx = ocv.getContext('2d');
    const step = () => {
      g.paused = false;
      if (!g.dead && (n & 1) === 0 && !g.pendingFlip && B.botShouldFlip()) g.botAct();
      if (B.botWantsUlt()) g.ultAct();
      g.tick(FF.STEP); n++;
      if ((n & 3) === 0 && !g.ended) g.renderFrame(octx);
      g.paused = true;
      out.maxRank = Math.max(out.maxRank, B.rank);
      for (const h of B.hz) {
        const k = h.k + (h.nw ? ':knock' : h.echo ? ':echo' : '');
        if (!seen.has(h)) { seen.add(h); const w = +(h.tl - h.t0).toFixed(3); out.tele[k] = Math.min(out.tele[k] === undefined ? 9 : out.tele[k], w); }
        if (B.t >= h.t0 && B.t < h.tl && B.rectAt(h, B.t, g.p.x - FF.PLAYER_X)) out.harmless = false;
      }
    };
    window.__stepUntil = (fn, max) => { let k = 0; while (!fn() && !g.ended && k++ < max) step(); return fn(); };
    window.__B = B; window.__g = g; window.__out = out;
    return out;
  });
  console.log('start', start);
  ok.start = start.boss === 'niro' && start.skin === 'mino' && start.story && start.dims.join() === 'old,dark,echo,memory,fall,ledge';
  await page.evaluate(() => __stepUntil(() => __B.ans && __B.ans.n >= 1 && __B.t - __B.ans.hit.find((x) => x) > 0.12, 120 * 60));
  await page.waitForTimeout(250);
  await shot('answer');
  // b45: the new set pieces, caught live
  for (const [nm, cond] of [['fist', "__B.hz.some((h) => h.k === 'fist' && __B.t > h.tl + 0.04 && __B.t < h.tl + 0.2)"], ['quake', "__B.hz.some((h) => h.k === 'quake' && __B.t > h.tl + 0.35)"], ['strike', "__B.fxl.some((f) => f.id === 'cubeStrike' && __B.t - f.t0 > 0.4)"], ['dash', "__B.hz.some((h) => h.k === 'dash' && __B.t > h.tl + 0.3)"]]) {
    await page.evaluate((c) => __stepUntil(new Function('return ' + c), 120 * 200), cond);
    await page.evaluate(() => { document.querySelectorAll('.storyCine button').forEach((x) => x.click()); });
    await page.waitForTimeout(400);
    await shot('set-' + nm);
  }
  // a look at every dimension (with a live attack on screen)
  for (const [i, nm] of [[0, 'old'], [1, 'dark'], [2, 'echo'], [3, 'memory'], [4, 'fall'], [5, 'ledge']]) {
    if (i > 0) { // the transition into it, caught while the old world is leaving
      await page.evaluate((i) => __stepUntil(() => __B.mode === 'trans' && __B.transDim === i && __B.t - __B.modeT0 > 1.32, 120 * 240), i);
      await page.evaluate(() => { document.querySelectorAll('.storyCine button').forEach((x) => x.click()); });
      await page.waitForTimeout(600);
      await shot('trans-' + nm);
    }
    await page.evaluate((i) => __stepUntil(() => __B.dim === i && __B.mode === 'fight' && __B.hz.some((h) => __B.t > h.t0 + 0.3) && __B.t - __B.modeT0 > 2.5, 120 * 240), i);
    await page.evaluate(() => { document.querySelectorAll('.storyCine button').forEach((x) => x.click()); });
    await page.waitForTimeout(600);
    await shot('dim-' + nm);
  }
  // the ending you play: KNOCK THREE TIMES
  await page.evaluate(() => __stepUntil(() => __B.mode === 'finale' && __B.fin.n >= 1 && __B.t - __B.fin.good[0] > 0.2, 120 * 300));
  await page.waitForTimeout(300);
  await shot('finale');
  await page.evaluate(() => __stepUntil(() => __B.mode === 'dying' && __B.t - __B.modeT0 > 1.6, 120 * 60));
  await page.waitForTimeout(300);
  await shot('freed');
  const won = await page.evaluate(() => {
    __stepUntil(() => __B.mode === 'reward' && __B.t - __B.modeT0 > 1.0, 120 * 400);
    const B = __B;
    return { mode: B.mode, won: B.won, dead: !!__g.dead, dims: B.dims.join(), kinds: B.stats.kinds, hits: B.stats.hits, retries: B.retries, maxRank: __out.maxRank, bestRank: B.stats.bestRank, ults: B.stats.ults || 0, tele: __out.tele, harmless: __out.harmless, phaseEv: window.__phaseEv.join(), time: +B.fightTime.toFixed(2), answers: B.stats.answers || 0, kbest: B.kbest || 0, perfect: B.stats.perfect || 0, orbs: B.stats.orbs, fin: B.events.filter((e) => /^fin/.test(e[1])).map((e) => e[1]).join(), fxDrawn: Object.keys(B.fxDrawn).filter((k) => /^niro|cubeStrike/.test(k)).join() };
  });
  console.log('won', won);
  const kinds = ['knock', 'knock2', 'echo', 'pit', 'gaze', 'fists', 'quake', 'dash']; // (b45: pslash and drop are fillers now)
  ok.win = won.won && !won.dead && won.dims === 'old,dark,echo,memory,fall,ledge' && kinds.every((k) => won.kinds[k] > 0) && won.harmless && won.phaseEv === '1,2';
  ok.fair = Object.values(won.tele).every((w) => w >= 0.5);
  ok.style = won.bestRank >= 2;
  ok.duel = won.answers >= 20 && won.perfect >= 5 && won.orbs === 0; // b44: no seal orbs here, he is hurt by knocking back on the beat
  ok.finale = /^finale,fin:good,fin:good,fin:good$/.test(won.fin) && /niroTrans/.test(won.fxDrawn) && /niroFree/.test(won.fxDrawn) && /cubeStrike/.test(won.fxDrawn) && won.kbest >= 10;
  await shot('reward');
  // let the fight end (the truth cinematic may play: skip it), then the results
  await page.evaluate(() => { __g.paused = false; });
  for (let i = 0; i < 80; i++) {
    const sc = await page.evaluate(() => { document.querySelectorAll('.storyCine button').forEach((x) => x.click()); return FF.UI.screen; });
    if (sc === 'over') break;
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(600);
  await shot('over');
  const res = await page.evaluate(() => ({ screen: FF.UI.screen, title: document.querySelector('#overTitle').textContent, goal: document.querySelector('#overGoal').textContent, storyWin: FF.save.storyWin, bossWin: !!FF.save.bossWin, niro: FF.isUnlocked(FF.skinById('niro')), pale: FF.isUnlocked(FF.skinById('paleniro')), mino: FF.isUnlocked(FF.skinById('mino')), inputs: FF.UI.lastRes && FF.UI.lastRes.inputs, seed: FF.UI.lastRes && FF.UI.lastRes.seed }));
  console.log('result', Object.assign({}, res, { inputs: res.inputs && res.inputs.length }));
  ok.result = res.screen === 'over' && /NIRO IS FREE/.test(res.title) && res.storyWin === 1 && !res.bossWin && res.niro && res.pale && res.mino;
  // determinism
  const rep = await page.evaluate((w) => {
    const run = () => {
      let r = null;
      const g = new FF.Game({ mode: 'boss', seed: w.seed, boss: 'niro', replay: w.inputs, introSeen: false, silent: true, settings: {}, seen: {}, skin: 'mino', callbacks: { onEnd: (x) => (r = x), onEvent: () => {} } });
      let n = 0;
      while (!g.ended && n++ < 120 * 600) { if (g.dead) { g.end(); break; } g.tick(FF.STEP); }
      return r && r.boss;
    };
    const a = run(), c = run();
    return { a: a && { win: a.win, time: +a.time.toFixed(3) }, same: JSON.stringify(a) === JSON.stringify(c) };
  }, res);
  console.log('replay', rep);
  ok.replay = rep.same && rep.a && rep.a.win && Math.abs(rep.a.time - won.time) < 0.02;
  // the weekly Tyrant keeps its own world
  const ty = await page.evaluate(() => { const g = new FF.Game({ mode: 'boss', seed: 5, boss: 'tyrant', introSeen: true, silent: true, settings: {}, seen: {}, skin: 'ivoid', callbacks: { onEnd: () => {}, onEvent: () => {} } }); return { dims: g.boss.D.map((d) => d.id).join(), world: g.boss.def.world }; });
  console.log('tyrant', ty);
  ok.tyrant = ty.dims === 'citadel,mirror,cosmos,shatter,collapse' && ty.world === 'citadel';
  await page.evaluate(() => { FF.UI.game = null; FF.UI.act('home'); FF.save.storySeen.ch1intro = 1; FF.UI.act('story'); });
  await page.waitForTimeout(400);
  await page.click('#storyList .stCard[data-ch=ch1]');
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.boss && FF.UI.game.boss.def.id === 'tyrant', null, { timeout: 8000 }).catch(() => {});
  const ch1 = await page.evaluate(() => { const g = FF.UI.game; return g && g.boss ? { boss: g.boss.def.id, story: g.opts.story, skin: g.opts.skin, weekly: g.seed === FF.bossWeek().seed } : null; });
  console.log('chapter 1', ch1);
  ok.ch1 = !!ch1 && ch1.boss === 'tyrant' && ch1.story === 'tyrant' && ch1.skin === 'ivoid' && !ch1.weekly;
  await b.close(); srv.kill();
  console.log('errors', errs);
  const all = Object.values(ok).every(Boolean) && !errs.length;
  console.log(JSON.stringify(ok));
  console.log(all ? 'NIRO TEST PASSED' : 'NIRO TEST FAILED');
  process.exit(all ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
