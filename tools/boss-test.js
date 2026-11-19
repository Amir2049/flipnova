// ⚔️ WEEKLY BOSS test (build 36): INFINITY VOID vs THE CRIMSON TYRANT. Runs against tools/mock-supabase.js
// (the real server is blocked). Checks:
//   1. the home card "WEEKLY BOSS" leads the weekly row, with a live countdown; tapping it starts the duel as INFINITY VOID
//   2. the boss appears (entrance → VS → FIGHT), every attack is telegraphed (≥ 0.5 real seconds, harmless while warned)
//   3. a planning bot wins: all 3 phases trigger (PHASE 2, ARENA COLLAPSE), the Tyrant falls, INFINITY VOID unlocks
//   4. the fight is deterministic: the recorded taps replay to the very same result
//   5. a loss (no taps) unlocks nothing; old saves without boss fields still load; other modes keep their rules
//   6. build 37, the animation feast: the scripted fights start AND draw every registered effect (FF.BOSS_FX, ≥ 20
//      distinct ids, each with a name and a painter)
//   7. build 37, the dimensions: the duel travels citadel → mirror void → starfall cosmos → shattered time → collapsed
//      citadel, and each dimension's signature attack (mirror, gravity, comet, shard) is used
//   8. build 37, fun first: phase-1 warnings ≥ 1.12 sim s (≈ 0.9 real s), 3 hearts with invulnerability, and losing every
//      heart rewinds to the phase checkpoint (hp back to the phase mark, same dimension family); 3 rewinds, then defeat
//   9. build 38, the STARFALL TUNNEL: the cosmos is drawn as a pseudo-3D tube (frames drawn, the hero from behind), every
//      lethal hazard on screen is drawn from its own hitbox, the projection keeps hero and hazard boxes overlapping exactly
//      when the simulation says they do, the camera rolls 180° on the ceiling, and every tunnel warning is ≥ 1.12 sim s
//  10. build 38, the defeat cinematic: it plays after the last heart (drawn, ~2 s), a tap skips it, then DEFEATED
// usage: node tools/boss-test.js [shotDir]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = +process.env.BOSS_PORT || 8812; // BOSS_PORT: when 8812 is held by another tree's server
const SHOTS = process.argv[2] || '';
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch();
  const errs = [];
  const fresh = async (initSave) => {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
    await ctx.route(/supabase\.co/, (r) => r.abort());
    if (initSave) await ctx.addInitScript((s) => { try { if (!localStorage.getItem('flipfrenzy.v1')) localStorage.setItem('flipfrenzy.v1', s); } catch (e) { /* */ } }, JSON.stringify(initSave));
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('http://localhost:' + PORT + '/index.html');
    await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
    await page.evaluate(() => { FF.save.tutDone = 1; FF.save.runs = 12; FF.save.bestStage = 4; FF.save.name = 'Tester'; FF.UI.persist(); FF.UI.act('home'); });
    await page.waitForTimeout(300);
    return { ctx, page };
  };
  const shot = (page, n) => (SHOTS ? page.screenshot({ path: path.join(SHOTS, 'b36-boss-' + n + '.png') }) : null);
  const ok = {};

  // ---------- 1+2+3: the win, through the real home card
  const A = await fresh({ best: 4200, coins: 900, runs: 40, skin: 'cat', trail: 'spark', owned: { flippo: 1, cat: 1 }, ach: { first_flip: 1 }, seen: {}, tutDone: 1, name: 'OldSave' });
  const card = await A.page.evaluate(() => {
    const c = document.querySelector('#eventCard .evCard.boss[data-act=boss]');
    // build 37: the boss duel is the only weekly card (no separate weekly-run button, no Daily door on the home)
    const alone = !document.querySelector('#home [data-act=weekly]') && !document.querySelector('#home [data-act=daily]') && document.querySelectorAll('#eventCard button').length === 1;
    return { shown: !!c && c.offsetParent !== null, leads: alone, text: c ? c.textContent : '', left: document.querySelector('#bossLeft').textContent,
      oldSave: FF.save.best === 4200 && FF.save.skin === 'cat' && FF.save.owned.cat === 1 && !FF.save.bossWin, locked: !FF.isUnlocked(FF.skinById('ivoid')), arStrings: !!FF.UI.act };
  });
  console.log('card', card);
  ok.card = card.shown && card.leads && /BOSS/.test(card.text) && /⏳\s*\u2066?\d/.test(card.left) && card.oldSave && card.locked;
  await A.page.click('#eventCard .evCard.boss');
  await A.page.waitForFunction(() => FF.UI.game && FF.UI.game.boss, null, { timeout: 8000 });
  const fight = await A.page.evaluate(async () => {
    const g = FF.UI.game, B = g.boss;
    g.paused = true; // the test drives the ticks itself (the screen still renders every frame)
    B.botLate = true;
    const out = { tele1: [], teleT: [], tunGeo: { checked: 0, bad: 0 }, roll: [], mode: g.mode, skin: g.opts.skin, seed: g.seed === FF.bossWeek().seed, intro: B.mode, introLen: B.introLen, tele: [], harmless: true, appear: false };
    const seen = new Set();
    let n = 0;
    // the screen cannot paint while this loop holds the thread, so the test paints a frame itself every 4 ticks (30 fps
    // of sim time) into an offscreen canvas: that is what proves each effect is actually drawn, not just started
    const ocv = document.createElement('canvas'); ocv.width = FF.W; ocv.height = FF.H;
    const octx = ocv.getContext('2d'); octx.imageSmoothingEnabled = false;
    const step = () => {
      g.paused = false;
      if (!g.dead && (n & 1) === 0 && !g.pendingFlip && B.botShouldFlip()) g.botAct();
      if (B.botWantsUlt()) g.ultAct(); // b42: the bot fires its ULTIMATE when the meter is full
      g.tick(FF.STEP); n++;
      if ((n & 3) === 0 && !g.ended) g.renderFrame(octx);
      // the tunnel draws what collides: at the hero's depth, the projected hero box and hazard box overlap on screen
      // exactly when the simulation's boxes overlap (both come from the same rectangles, through the same projection)
      if (B.tunnelOn() && B.mode === 'fight' && (n & 1) === 0) {
        const p = g.p, cam = p.x - FF.PLAYER_X, V = B.tunView(); if (B.t - B.rollT0 > 0.65) out.roll.push([+(p.y).toFixed(0), +V.roll.toFixed(2)]); // (once the eased roll has settled)
        for (const h of B.hz) {
          const r = B.rectAt(h, B.t, cam); if (!r) continue;
          const hx = p.x + FF.PW / 2; if (!(r[0] <= hx && hx <= r[0] + r[2])) continue;
          const sim = r[1] < p.y + FF.PH && r[1] + r[3] > p.y;
          const a0 = B.tunProject(hx, p.y), a1 = B.tunProject(hx, p.y + FF.PH), b0 = B.tunProject(hx, r[1]), b1 = B.tunProject(hx, r[1] + r[3]);
          const along = (q) => (q[0] - a0[0]) * (a1[0] - a0[0]) + (q[1] - a0[1]) * (a1[1] - a0[1]), L = along(a1), u0 = along(b0), u1 = along(b1);
          const drawn = Math.min(u0, u1) < L && Math.max(u0, u1) > 0;
          out.tunGeo.checked++; if (sim !== drawn) out.tunGeo.bad++;
        }
      }
      g.paused = true;
      // every hazard: warned for ≥ 0.62 sim s (≈ 0.5 real s at 1.25x) and harmless while it is only a warning
      for (const h of B.hz) {
        if (!seen.has(h)) { seen.add(h); out.tele.push(+(h.tl - h.t0).toFixed(3)); if (B.phase === 0) out.tele1.push(+(h.tl - h.t0).toFixed(3)); if (B.dim === 2) out.teleT.push(+(h.tl - h.t0).toFixed(3)); }
        if (B.t >= h.t0 && B.t < h.tl && B.rectAt(h, B.t, g.p.x - FF.PLAYER_X)) out.harmless = false;
      }
    };
    while (B.mode === 'intro' && n < 120 * 10) step();
    out.appear = B.mode === 'fight' && B.events.some((e) => e[1] === 'fight');
    window.__stepUntil = (fn, max) => { let k = 0; while (!fn() && !g.ended && k++ < max) step(); return fn(); };
    window.__B = B; window.__g = g; window.__out = out;
    return out;
  });
  // phase 1 on screen (wait for a live attack to be on screen)
  await A.page.evaluate(() => __stepUntil(() => __B.hz.some((h) => __B.t > h.tl && h.k === 'cleave') && __B.t > 8, 120 * 60));
  await A.page.waitForTimeout(120);
  await shot(A.page, 'phase1');
  await A.page.evaluate(() => __stepUntil(() => __B.phase === 1 && __B.mode === 'fight' && __B.hz.some((h) => __B.t > h.tl), 120 * 120));
  await A.page.waitForTimeout(120);
  await shot(A.page, 'phase2');
  await A.page.evaluate(() => __stepUntil(() => __B.dim === 2 && __B.mode === 'fight' && __B.hz.some((h) => __B.t > h.tl), 120 * 120));
  await A.page.waitForTimeout(120);
  await shot(A.page, 'tunnel');
  await A.page.evaluate(() => __stepUntil(() => __B.phase === 2 && __B.mode === 'fight' && __B.hz.some((h) => __B.t > h.tl), 120 * 120));
  await A.page.waitForTimeout(120);
  await shot(A.page, 'phase3');
  await A.page.evaluate(() => __stepUntil(() => __B.mode === 'reward' && __B.t - __B.modeT0 > 1.4, 120 * 240));
  await A.page.waitForTimeout(120);
  await shot(A.page, 'skin'); // the INFINITY VOID unlock cinematic
  const won = await A.page.evaluate(async () => {
    __stepUntil(() => __g.ended, 120 * 240);
    const g = __g, B = __B;
    while (FF.UI.screen !== 'over') await new Promise((r) => setTimeout(r, 50));
    await new Promise((r) => setTimeout(r, 400));
    return {
      ended: g.ended, dead: !!g.dead, won: B.won, phases: B.stats.phases.length, kinds: B.stats.kinds, orbs: B.stats.orbs, counters: B.stats.counters, time: +B.fightTime.toFixed(2),
      ev: B.events.filter((e) => /phase|dying|fight/.test(e[1])).map((e) => e[1]).join(','),
      bossWin: FF.save.bossWin, unlocked: FF.isUnlocked(FF.skinById('ivoid')), trail: FF.isUnlocked(FF.trailById('ivoid')), week: Object.assign({}, FF.save.boss),
      title: document.querySelector('#overTitle').textContent, sub: document.querySelector('#overBest').textContent, goal: document.querySelector('#overGoal').textContent,
      inputs: FF.UI.lastRes && FF.UI.lastRes.inputs, seed: g.seed, introSeen: !!g.opts.introSeen, oldKept: FF.save.best === 4200 && FF.save.owned.cat === 1 && FF.save.skin === 'cat',
      fxIds: Object.keys(FF.BOSS_FX || {}).filter((id) => !FF.BOSS_FX[id].owner || FF.BOSS_FX[id].owner === 'tyrant'), // (b44: another boss's own effects are checked by its own test) fxNamed: Object.values(FF.BOSS_FX || {}).every((d) => d.name && Object.keys(d).some((k) => typeof d[k] === 'function')),
      fxSeen: Object.assign({}, B.fxSeen), fxDrawn: Object.keys(B.fxDrawn || {}), dims: B.dims.join('>'), hits: B.stats.hits, hearts: B.hearts,
      b42: { clash: Object.assign({}, B.stats.clash), ults: B.stats.ults || 0, qte: B.stats.qte || 0, chase: B.stats.kinds.chase || 0, negInputs: (FF.UI.lastRes && FF.UI.lastRes.inputs || []).filter((v) => v < 0).length },
      tun: Object.assign({}, B.tunStats), near: B.stats.nearMiss || 0, paints: B.paints,
      tunTime: (() => { const a = B.events.find((e) => e[1] === 'dim:cosmos'), b = B.events.find((e) => e[1] === 'dim:shatter'); return a && b ? +(b[0] - a[0]).toFixed(2) : 0; })(),
      shifts: B.events.filter((e) => /^shift:/.test(e[1])).map((e) => e[1]).join(',')
    };
  });
  const fightOut = await A.page.evaluate(() => __out);
  console.log('fight', { mode: fightOut.mode, skin: fightOut.skin, seed: fightOut.seed, intro: fightOut.intro, appear: fightOut.appear, harmless: fightOut.harmless, teleMin: Math.min(...fightOut.tele), attacks: fightOut.tele.length });
  console.log('won', Object.assign({}, won, { inputs: won.inputs && won.inputs.length, fxIds: won.fxIds.length, fxSeen: Object.keys(won.fxSeen).length, fxDrawn: won.fxDrawn.length }));
  ok.dims = won.dims === 'citadel>mirror>cosmos>shatter>collapse' && ['mirror', 'gravity', 'comet', 'shard'].every((k) => won.kinds[k] > 0);
  console.log('dims', won.dims, ok.dims, JSON.stringify(won.kinds));
  ok.appear = fightOut.mode === 'boss' && fightOut.skin === 'ivoid' && fightOut.seed && fightOut.intro === 'intro' && fightOut.appear;
  ok.telegraph = fightOut.harmless && fightOut.tele.length > 14 && Math.min(...fightOut.tele) >= 0.62 && Math.min(...fightOut.tele) / 1.25 >= 0.49 &&
    fightOut.tele1.length >= 3 && Math.min(...fightOut.tele1) >= 1.12;
  console.log('phase-1 warnings', Math.min(...fightOut.tele1), 'over', fightOut.tele1.length);
  // 9. the STARFALL TUNNEL
  const ceil = fightOut.roll.filter((r) => r[0] < 50), floor = fightOut.roll.filter((r) => r[0] > 140);
  // 11. build 42: the tunnel CHASE, the CLASH QTE (won by a timed tap), the ULTIMATE (a recorded input), counter-QTEs
  console.log('b42', JSON.stringify(won.b42));
  ok.b42 = won.b42.chase > 0 && won.b42.clash.win >= 1 && won.b42.ults >= 1 && won.b42.negInputs === won.b42.ults;
  console.log('tunnel time', won.tunTime, 's (b38: 8.64 s)', 'shifts', won.shifts);
  console.log('tunnel', won.tun, 'geo', fightOut.tunGeo, 'warnings', Math.min(...fightOut.teleT), 'x' + fightOut.teleT.length, 'roll floor', floor.length && floor[0][1], 'ceiling', ceil.length && ceil[0][1], 'near misses', won.near);
  ok.tunnel = won.tun.frames > 100 && won.tun.hero > 100 && won.tun.lethal > 10 && won.tun.lethal === won.tun.drawn && fightOut.tunGeo.checked >= 1 && fightOut.tunGeo.bad === 0 &&
    fightOut.teleT.length >= 3 && Math.min(...fightOut.teleT) >= 1.75 && won.tunTime >= 8.64 * 1.8 && won.shifts === 'shift:in,shift:out' && floor.length > 0 && floor.every((r) => Math.abs(r[1]) < 0.25) && ceil.length > 0 && ceil.every((r) => Math.abs(r[1] - Math.PI) < 0.3);
  ok.win = won.ended && !won.dead && won.won && won.phases === 3 && /phase2,phase3,dying/.test(won.ev) && Object.keys(won.kinds).length >= 7 && won.orbs > 5 &&
    won.bossWin === 1 && won.unlocked && won.trail && won.week.wins === 1 && won.week.best > 0 && /TYRANT FALLS/.test(won.title) && /INFINITY VOID/.test(won.goal) && won.oldKept;

  // skin: INFINITY VOID equipped in Characters + its aura in a normal Endless run
  await A.page.evaluate(() => { FF.UI.act('home'); });
  await A.page.waitForTimeout(300);
  await A.page.evaluate(() => FF.UI.act('skins'));
  await A.page.waitForTimeout(300);
  const equip = await A.page.evaluate(async () => {
    const cards = [...document.querySelectorAll('#skinGrid > *')];
    const c = cards.find((x) => /INFINITY VOID/.test(x.textContent));
    if (c) c.click();
    await new Promise((r) => setTimeout(r, 200));
    return { found: !!c, skin: FF.save.skin };
  });
  console.log('equip', equip);
  await A.page.waitForTimeout(250);
  await A.page.evaluate(() => { FF.UI.act('home'); });
  await A.page.waitForTimeout(200);
  await A.page.evaluate(() => { FF.UI.act('play'); });
  await A.page.waitForFunction(() => FF.UI.game && FF.UI.game.mode === 'endless');
  const endless = await A.page.evaluate(() => { const g = FF.UI.game; g.paused = true; for (let i = 0; i < 120 * 4; i++) { g.paused = false; if ((i & 1) === 0 && !g.pendingFlip && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); g.chain = 12; } g.paused = true; return { skin: g.opts.skin, boss: !!g.boss, dead: !!g.dead }; });
  await A.page.waitForTimeout(150);
  await shot(A.page, 'skin-run');
  console.log('endless with the skin', endless);
  ok.skin = equip.found && equip.skin === 'ivoid' && endless.skin === 'ivoid' && !endless.boss;

  // ---------- 4: determinism — the recorded taps replay to the same fight
  const rep = await A.page.evaluate((w) => {
    const run = (replay) => {
      let res = null;
      const g = new FF.Game({ mode: 'boss', seed: w.seed, boss: 'tyrant', replay, introSeen: w.introSeen, silent: true, settings: {}, seen: {}, skin: 'ivoid', callbacks: { onEnd: (r) => (res = r), onEvent: () => {} } });
      let n = 0;
      while (!g.ended && n++ < 120 * 400) { if (g.dead) { g.end(); break; } g.tick(FF.STEP); }
      return res && res.boss;
    };
    const a = run(w.inputs), c = run(w.inputs);
    return { a: a && { win: a.win, time: +a.time.toFixed(3), pct: a.pct, phase: a.phase }, same: JSON.stringify(a) === JSON.stringify(c) };
  }, won);
  console.log('replay', rep);
  ok.replay = rep.same && rep.a && rep.a.win && Math.abs(rep.a.time - won.time) < 0.01;
  await A.ctx.close();

  // ---------- 5: a loss unlocks nothing; normal modes keep their rules
  const Bp = await fresh();
  await Bp.page.evaluate(() => FF.UI.act('boss'));
  await Bp.page.waitForFunction(() => FF.UI.game && FF.UI.game.boss);
  const lost = await Bp.page.evaluate(async () => {
    const g = FF.UI.game; g.paused = true;
    const ocv = document.createElement('canvas'); ocv.width = FF.W; ocv.height = FF.H; const octx = ocv.getContext('2d');
    let n = 0;
    while (!g.dead && n++ < 120 * 240) { g.paused = false; g.tick(FF.STEP); if ((n & 3) === 0) g.renderFrame(octx); g.paused = true; }
    const B = g.boss, cps = B.events.filter((e) => e[1] === 'checkpoint').length;
    g.paused = false;
    const d0 = performance.now(); let defeatT = 0;
    while (FF.UI.screen !== 'over') { await new Promise((r) => setTimeout(r, 50)); if (g.deadT > 1.6 && !defeatT) defeatT = performance.now() - d0; }
    const defeat = { drawn: !!B.fxDrawn.defeat, ev: B.events.some((e) => e[1] === 'defeat'), ms: Math.round(performance.now() - d0), line: B.defeat && B.defeat.en, phase: B.defeat && B.defeat.phase };
    await new Promise((r) => setTimeout(r, 300));
    // a tap skips the defeat cinematic
    const skip = (() => {
      let ended = false;
      const w = FF.bossWeek(), k = new FF.Game({ mode: 'boss', seed: w.seed, boss: 'tyrant', introSeen: true, silent: true, settings: {}, seen: {}, skin: 'ivoid', callbacks: { onEnd: () => (ended = true), onEvent: () => {} } });
      const KB = k.boss; KB.retries = KB.def.continues; KB.hearts = 1; KB.startFight();
      KB.hurt({ k: 'wave' });
      let tt = 0; for (let i = 0; i < 30 && !ended; i++) { k.update(1 / 60); tt += 1 / 60; if (i === 24) k.flip(); }
      return { dead: !!k.dead, ended, tt: +tt.toFixed(2), started: !!KB.defeat };
    })();
    // b42: a CLASH lost (no tap) costs a heart, never the last one; then the fight goes on
    const clashL = (() => {
      const w = FF.bossWeek(), k = new FF.Game({ mode: 'boss', seed: w.seed, boss: 'tyrant', introSeen: true, silent: true, settings: {}, seen: {}, skin: 'ivoid', callbacks: { onEnd: () => {}, onEvent: () => {} } });
      const KB = k.boss; KB.startFight(); KB.hearts = 1; KB.startClash(0);
      for (let i = 0; i < 120 * 3.2; i++) { k.tick(FF.STEP); if ((i & 3) === 0) k.renderFrame(octx); }
      // and every ULTIMATE variant draws (skins: ivoid, bwarden, wshinobi, ctyrant, jackpot, generic)
      const ults = {};
      for (const sk of Object.keys(FF.BOSS_ULTS)) {
        const u = new FF.Game({ mode: 'boss', seed: w.seed, boss: 'tyrant', introSeen: true, silent: true, settings: {}, seen: {}, skin: 'ivoid', ultSkin: sk, callbacks: { onEnd: () => {}, onEvent: () => {} } });
        const UB = u.boss; UB.startFight(); UB.ult = 100; const hp0 = UB.hp; const fired = UB.ultimate();
        for (let i = 0; i < 120 * 3; i++) { u.tick(FF.STEP); if ((i & 7) === 0) u.renderFrame(octx); }
        ults[sk] = fired && UB.hp < hp0 && UB.mode === 'fight';
      }
      return { res: KB.clash && KB.clash.res, hearts: KB.hearts, mode: KB.mode, dead: !!k.dead, drawn: Object.keys(KB.fxDrawn), ults };
    })();
    const L = new FF.Level({ seed: 5, seen: {} });
    const e = new FF.Game({ mode: 'endless', seed: 777, silent: true, settings: {}, seen: {}, callbacks: {} });
    // a checkpoint in phase 2: a bot reaches the starfall cosmos, then stops dodging until the hearts run out; the rewind
    // goes back to the phase's mark and its first dimension (the mirror void)
    const cp = (() => {
      const w = FF.bossWeek(), c = new FF.Game({ mode: 'boss', seed: w.seed, boss: 'tyrant', introSeen: true, silent: true, settings: {}, seen: {}, skin: 'ivoid', callbacks: { onEnd: () => {}, onEvent: () => {} } });
      const F2 = c.boss; F2.botLate = true;
      let k = 0, stop = false, before = null;
      while (!c.ended && !c.dead && k++ < 120 * 300) {
        if (!stop && F2.dim === 2 && F2.mode === 'fight') { stop = true; } // in the STARFALL COSMOS (phase 2's 2nd dimension)
        if (!stop && (k & 1) === 0 && !c.pendingFlip && F2.botShouldFlip()) c.botAct();
        if (stop) { F2.orbs.length = 0; F2.nextOrb = F2.t + 9; } // (b38: the tunnel's longer warnings mean fewer hits: no seal orbs either, so the hearts run out here)
        c.tick(FF.STEP);
        if ((k & 3) === 0) c.renderFrame(octx);
        if (stop && !before) before = { dim: F2.dim };
        if (F2.events.some((e) => e[1] === 'checkpoint')) break;
      }
      return { wasDim: before && before.dim, phase: F2.phase, hp: F2.hp, mark: F2.phaseHp[1], hearts: F2.hearts, dim: F2.dim, mode: F2.mode, hits: F2.stats.hits, retries: F2.retries, fxSeen: F2.fxSeen, fxDrawn: Object.keys(F2.fxDrawn) };
    })();
    return { clashL, defeat, skip, retries: B.retries, hits: B.stats.hits, cps, fxSeen: B.fxSeen, fxDrawn: Object.keys(B.fxDrawn), cp,
      dead: !!g.dead, cause: g.dead && g.dead.cause, win: g.boss.won, bossWin: !!FF.save.bossWin, unlocked: FF.isUnlocked(FF.skinById('ivoid')), owned: !!FF.save.owned.ivoid, tries: FF.save.boss && FF.save.boss.tries,
      pct: FF.save.boss && FF.save.boss.pct, title: document.querySelector('#overTitle').textContent, endlessNoBoss: !e.boss && e.L.objs.length > 0 && !L.opts.custom, speed: FF.Game.modeSpeed('boss') };
  });
  console.log('lost', Object.assign({}, lost, { fxSeen: undefined, fxDrawn: undefined, cp: Object.assign({}, lost.cp, { fxSeen: undefined, fxDrawn: undefined }) }));
  ok.hearts = lost.hits === 3 * (1 + 3) && lost.retries === 3 && lost.cps === 3;
  ok.checkpoint = lost.cp.retries === 1 && lost.cp.phase === 1 && lost.cp.hp === lost.cp.mark && lost.cp.hearts === 3 && lost.cp.dim === 1 && lost.cp.wasDim === 2 && lost.cp.mode === 'retry';
  // every effect: started and drawn somewhere across the scripted fights (the win, the loss, the checkpoint)
  console.log('clash lost', JSON.stringify(Object.assign({}, lost.clashL, { drawn: undefined })));
  ok.clashLose = lost.clashL.res === 'lose' && lost.clashL.hearts === 1 && lost.clashL.mode === 'fight' && !lost.clashL.dead && Object.values(lost.clashL.ults).length === 6 && Object.values(lost.clashL.ults).every(Boolean);
  const seenAll = Object.assign({}, won.fxSeen, lost.fxSeen, lost.cp.fxSeen, { clashLose: 1 }), drawnAll = new Set([...won.fxDrawn, ...lost.fxDrawn, ...lost.cp.fxDrawn, ...lost.clashL.drawn]);
  const fxMissing = won.fxIds.filter((id) => !seenAll[id] || !drawnAll.has(id));
  console.log('fx', { registered: won.fxIds.length, started: Object.keys(seenAll).length, drawn: drawnAll.size, missing: fxMissing, names: won.fxIds.join(',') });
  ok.fx = won.fxIds.length >= 20 && won.fxNamed && fxMissing.length === 0 && drawnAll.size >= 20;
  await shot(Bp.page, 'lost');
  console.log('defeat cinematic', lost.defeat);
  console.log('defeat skip', lost.skip);
  ok.defeat = lost.skip.dead && lost.skip.ended && lost.skip.started && lost.skip.tt < 0.6 && lost.defeat.drawn && lost.defeat.ev && lost.defeat.ms > 1500 && lost.defeat.ms < 4500 && /[A-Z]/.test(lost.defeat.line || '');
  ok.loss = lost.dead && /^boss_/.test(lost.cause) && !lost.win && !lost.bossWin && !lost.unlocked && !lost.owned && lost.tries === 1 && /DEFEATED/.test(lost.title) && lost.endlessNoBoss;
  // Arabic strings exist for the new UI
  const ar = await Bp.page.evaluate(() => { FF.save.settings.lang = 'ar'; FF.UI.act('home'); FF.UI.applyLang && FF.UI.applyLang(); return document.querySelector('#eventCard .evCard.boss').textContent; });
  console.log('arabic card', ar);
  ok.arabic = /زعيم الأسبوع/.test(ar) || /زعيم/.test(ar);
  await Bp.ctx.close();

  const pass = Object.values(ok).every(Boolean) && !errs.length;
  console.log(pass ? 'BOSS TEST PASSED' : 'BOSS TEST FAILED', ok, errs);
  await b.close();
  srv.kill();
  process.exit(pass ? 0 : 1);
})();
