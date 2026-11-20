// Build 36 menu redesign: (1) no way to reach The Legend or the 1% challenges, (2) every home action still works,
// (3) nothing overflows the stage / viewport on home, results, skins, settings and boards, in English and Arabic,
// at 844x390 and 740x360. Build 38: the weekly boss card is small, at the bottom-left beside the mini buttons. The world board server is blocked (*supabase.co) so nothing leaves the machine.
// usage: node tools/redesign-test.js
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
const fails = [];
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails.push(msg); };

(async () => {
  const browser = await chromium.launch();
  const open = async (w, h) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    let supa = 0;
    await page.route(/supabase\.co/, (r) => { supa++; r.abort(); });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
    await page.goto('file://' + root + '/index.html');
    await page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
    // a player past the first minute (the full home), with no toast in the way
    await page.evaluate(() => {
      const s = FF.save; s.tutDone = 1; s.runs = 30; s.bestStage = 6; s.best = 12345; s.coins = 999999; s.xp = 50000; s.settings.lang = 'en';
      FF.UI.persist(); FF.UI.applyLang();
    });
    await page.waitForTimeout(900);
    return { page, errors, supa: () => supa };
  };
  const home = (page) => page.evaluate(() => new Promise((done) => { FF.UI.act('home'); const t0 = performance.now(); (function w() { if (FF.UI.screen === 'home' && !FF.UI.game) done(); else if (performance.now() - t0 > 3000) done(); else setTimeout(w, 30); })(); }));
  const setLang = (page, l) => page.evaluate((l) => { if (FF.save.settings.lang !== l) FF.UI.act('langToggle'); }, l);

  // ---------------------------------------------------------------- 1) The Legend and the 1% challenges are gone
  console.log('Legend / 1% challenges unreachable');
  const A = await open(844, 390);
  const gone = await A.page.evaluate(() => {
    const sel = '[data-act=legend], [data-act=viral], [data-act=legendGo], [data-act=legendPractice], [data-act=legendHall], [data-act=legendImport], [data-act=shareCert], [data-act=shareProof], [data-btab=worldLegend], #legend, #viral, #hall, #legendWin, .legendBtn, .viralBtn';
    const before = FF.UI.screen;
    for (const a of ['legend', 'viral', 'legendGo', 'legendPractice', 'legendHall', 'legendImport']) FF.UI.act(a);
    const vis = (el) => !!(el.offsetWidth || el.offsetHeight);
    const homeText = document.querySelector('#home').innerText + ' ' + [...document.querySelectorAll('#boardTabs .tab')].map((b) => b.innerText).join(' ');
    return {
      nodes: document.querySelectorAll(sel).length, still: FF.UI.screen === before && !FF.UI.game,
      data: typeof FF.LEGEND + typeof FF.VIRAL, text: /legend|1\s*%|challenges/i.test(homeText.replace(/♛\s*legend/i, '')),
      visibleLegendChip: [...document.querySelectorAll('.legendChip')].some(vis)
    };
  });
  ok(gone.nodes === 0, 'no Legend / 1% button, screen or board tab in the page (' + gone.nodes + ')');
  ok(gone.still, 'the old actions do nothing (still on home, no run)');
  ok(gone.data === 'undefinedundefined', 'no Legend / 1% level data left to start (' + gone.data + ')');
  ok(!gone.text, 'home and board tabs never mention them');
  ok(!gone.visibleLegendChip, 'the ♛ chip is hidden for a player who never earned it');
  // the save keeps the old data, the achievements stay owned, and they can still be earned in the Adventure
  const keep = await A.page.evaluate(() => {
    const s = FF.save, bk = JSON.stringify({ legend: s.legend, viral: s.viral, ach: s.ach, camp: s.camp });
    s.legend = { attempts: 9, best: 0.6, done: true, hall: [] }; s.viral = { v1: { tries: 3, done: 1 } };
    s.ach.legend = 1; s.ach.master = 1; s.ach.legend50 = 1;
    FF.UI.persist();
    const kept = JSON.parse(localStorage.getItem('flipfrenzy.v1'));
    const legSkin = FF.SKINS.find((x) => x.id === 'legend'), legTrail = FF.TRAILS.find((x) => x.id === 'legend');
    s.camp = {}; FF.CAMPAIGN.list.forEach((l) => (s.camp[l.id] = { cleared: true, stars: 3, deaths: 0 }));
    const r = { saveKept: kept.legend && kept.legend.attempts === 9 && kept.viral && kept.viral.v1.tries === 3, skin: FF.isUnlocked(legSkin), trail: FF.isUnlocked(legTrail) };
    // a new player: none of it is free, and the Adventure gives it
    s.ach = {}; s.camp = {}; s.legend = null; s.viral = {};
    r.freeSkin = FF.isUnlocked(legSkin); r.freeTrail = FF.isUnlocked(legTrail);
    Object.assign(s, JSON.parse(bk));
    return r;
  });
  ok(keep.saveKept, 'save.legend and save.viral are written back untouched');
  ok(keep.skin && keep.trail, 'LEGEND skin / trail stay owned by those who earned them');
  ok(!keep.freeSkin && !keep.freeTrail, 'LEGEND skin / trail are not free for a new player');
  const earn = await A.page.evaluate(() => new Promise((done) => {
    const s = FF.save, bk = JSON.stringify({ ach: s.ach, camp: s.camp });
    s.ach = {}; s.camp = {};
    FF.CAMPAIGN.list.forEach((l) => (s.camp[l.id] = { cleared: true, stars: 3, deaths: l.gauntlet ? 0 : 2 }));
    // finishing any level re-checks the old achievements (as the Adventure results do)
    const lv = FF.CAMPAIGN.list[0];
    FF.UI.startGame('campaign', { level: lv });
    setTimeout(() => {
      const g = FF.UI.game; g.p.x = g.L.finishX + 10;
      const t0 = performance.now();
      (function w() {
        if (s.ach.legend || performance.now() - t0 > 8000) {
          const r = { q: !!s.ach.legend25, h: !!s.ach.legend50, c: !!s.ach.legend75, master: !!s.ach.master, legend: !!s.ach.legend, skin: FF.isUnlocked(FF.SKINS.find((x) => x.id === 'legend')) };
          Object.assign(s, JSON.parse(bk)); FF.UI.persist(); done(r);
        } else setTimeout(w, 100);
      })();
    }, 400);
  }));
  ok(earn.q && earn.h && earn.c, 'Quarter Way / Halfway / So Close come from Adventure stars');
  ok(earn.master, 'Challenge Master comes from clearing every Gauntlet without dying');
  ok(earn.legend && earn.skin, '♛ Legend (and the LEGEND skin) come from every star + Challenge Master');
  await home(A.page);

  // ---------------------------------------------------------------- 2) every home action works
  console.log('every home action');
  const acts = await A.page.evaluate(() => [...document.querySelectorAll('#home [data-act]')].filter((b) => b.offsetWidth && !b.closest('.hidden')).map((b) => b.dataset.act));
  const expect = ['langToggle', 'board', 'skins', 'missionsBox', 'settings', 'play', 'camp', 'boss', 'levels', 'zen'];
  ok(expect.every((a) => acts.includes(a)), 'home shows ' + expect.join(', ') + ' (got ' + acts.join(', ') + ')');
  // build 37: a lighter home — no Daily Remix door, no separate weekly-run button (the boss duel IS the weekly challenge)
  ok(!acts.includes('daily') && !acts.includes('weekly') && acts.length <= 11 && !acts.includes('story'), 'no Daily / weekly-run / Story entries on the home (b66: the Story is gone) (' + acts.length + ' actions; b43: +story)');
  const check = {
    play: () => FF.UI.game && FF.UI.game.mode === 'endless' && !FF.UI.screen,
    boss: () => FF.UI.game && FF.UI.game.mode === 'boss',
    zen: () => FF.UI.game && FF.UI.game.mode === 'zen',
    camp: () => FF.UI.screen === 'camp', levels: () => FF.UI.screen === 'levels', board: () => FF.UI.screen === 'board',
    skins: () => FF.UI.screen === 'skins', missionsBox: () => FF.UI.screen === 'missionsBox', settings: () => FF.UI.screen === 'settings'
  };
  for (const a of Object.keys(check)) {
    await A.page.click('#home [data-act=' + a + ']');
    const done = await A.page.waitForFunction(check[a], null, { timeout: 4000 }).then(() => true).catch(() => false);
    let back = true;
    if (/camp|levels|board|skins|missionsBox|settings/.test(a)) {
      // the screen's own back button brings you home
      const sel = a === 'camp' ? '#camp .campHead [data-act=home]' : '#' + a + ' .scrHead .back';
      await A.page.waitForTimeout(450);
      await A.page.click(sel);
      back = await A.page.waitForFunction(() => FF.UI.screen === 'home', null, { timeout: 3000 }).then(() => true).catch(() => false);
    } else await home(A.page);
    ok(done && back, a + ' works' + (back ? '' : ' (but its back button did not return home)'));
  }
  const before = await A.page.evaluate(() => FF.save.settings.lang);
  await A.page.click('#home [data-act=langToggle]');
  const after = await A.page.evaluate(() => ({ lang: FF.save.settings.lang, dir: document.documentElement.dir }));
  ok(before === 'en' && after.lang === 'ar' && after.dir === 'rtl', 'language button switches to Arabic (RTL)');
  await setLang(A.page, 'en');
  // the event slot holds ONE card: the weekly boss duel, with the week, a live countdown, the reward ladder and the Tyrant art
  const ev = await A.page.evaluate(async () => {
    const c = document.querySelector('#eventCard'), b = c && c.querySelector('.evCard.boss[data-act=boss]'), art = document.querySelector('#bossArt');
    const px = () => { const d = art.getContext('2d').getImageData(0, 0, art.width, art.height).data; let n = 0, h = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) { n++; h = (h * 31 + d[i - 3] + d[i - 2] * 7) >>> 0; } return [n, h]; };
    await new Promise((r) => setTimeout(r, 300)); const a1 = px(); await new Promise((r) => setTimeout(r, 400)); const a2 = px();
    const r = b.getBoundingClientRect(), play = document.querySelector('.heroPlay').getBoundingClientRect(), st = document.querySelector('#stage').getBoundingClientRect();
    const mini = document.querySelector('#home .mini.maker').getBoundingClientRect(), left = document.querySelector('#bossLeft').getBoundingClientRect();
    // build 38: a lighter home — the boss card is small and tidy at the bottom-left, right next to the mini buttons
    const small = r.height < play.height * 0.8 && r.width < play.width * 0.6;
    // build 40: the boss card shares the doors row with Adventure (boss first), under PLAY
    const adv = document.querySelector('#home .door.adv').getBoundingClientRect();
    const corner = r.top > play.bottom && Math.abs(r.top - adv.top) < 4 && Math.abs(r.height - adv.height) < 4;
    const beside = r.right <= adv.left + 1 && adv.left - r.right < st.width * 0.05;
    const tappable = r.height >= 34 && r.width >= 120 && document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2).closest('[data-act=boss]') === b;
    return { here: !!c, cards: c ? c.querySelectorAll('button').length : 0, time: b ? b.querySelector('#bossLeft').textContent : '', week: b ? b.querySelector('#bossWeek').textContent : '', rw: b ? b.querySelector('#bossRw').textContent : '',
      art: a1[0] > 200, moves: a1[1] !== a2[1], small, corner, beside, tappable, timeShown: left.width > 10 && left.height > 6 };
  });
  ok(ev.here && ev.cards === 1 && /\d/.test(ev.time) && /WEEK \d+/.test(ev.week) && /PHASE 2.*PHASE 3.*DEFEAT/.test(ev.rw), '#eventCard holds the weekly boss card: ' + ev.week + ' · ' + ev.time + ' · ' + ev.rw);
  ok(ev.art && ev.moves, 'the Tyrant peeks out of the boss card, animated (art ' + ev.art + ', moving ' + ev.moves + ')');
  ok(ev.small && ev.corner && ev.beside && ev.tappable && ev.timeShown, 'the boss card sits beside Adventure in the doors row, same height, tappable, countdown shown (' + JSON.stringify({ small: ev.small, corner: ev.corner, beside: ev.beside, tappable: ev.tappable, time: ev.timeShown }) + ')');

  // ---------------------------------------------------------------- 3) nothing overflows
  console.log('layout: no overflow');
  const measure = (page, scope, scroller) => page.evaluate(([scope, scroller]) => {
    const st = document.querySelector('#stage').getBoundingClientRect();
    const box = document.querySelector(scope);
    const bad = [];
    const vis = (el) => { const cs = getComputedStyle(el); return el.offsetWidth > 0 && el.offsetHeight > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
    const els = [...box.querySelectorAll('button, button span, button small, button b, .chip, .chip b, h2, .bestline, .evTitle, .evTime, .evRank, .evTwist, .door b, .door small, .hpT b, .card, .set, .brow, .tab, .item, .bigscore, .why, .goal, .sub, .mis, .mis .t, .rarityHead, .nm, input')].filter(vis);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const name = (el.id ? '#' + el.id : el.className || el.tagName) + ' "' + (el.innerText || '').trim().slice(0, 18) + '"';
      if (r.left < st.left - 1 || r.right > st.right + 1 || r.left < -1 || r.right > innerWidth + 1) bad.push('x: ' + name);
      if (!scroller && (r.top < st.top - 1 || r.bottom > st.bottom + 1 || r.bottom > innerHeight + 1)) bad.push('y: ' + name);
      // text cut off inside its own box (an ellipsis counts as cut off): every line of its own text must sit inside it
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) if (q.width && (q.left < r.left - 1 || q.right > r.right + 1)) { bad.push('clip: ' + name + ' ' + Math.round(q.width) + '>' + Math.round(r.width)); break; }
      }
    }
    if (box.scrollWidth > box.clientWidth + 1) bad.push('the screen scrolls sideways');
    if (!scroller && box.scrollHeight > box.clientHeight + 1) bad.push('the screen scrolls (' + box.scrollHeight + '>' + box.clientHeight + ')');
    return { n: els.length, bad: bad.slice(0, 8) };
  }, [scope, scroller]);
  for (const [w, h] of [[844, 390], [740, 360]]) {
    const B = await open(w, h);
    for (const L of ['en', 'ar']) {
      await setLang(B.page, L);
      await home(B.page);
      await B.page.waitForTimeout(800); // entrances finished
      let m = await measure(B.page, '#home', false);
      ok(m.n > 15 && !m.bad.length, w + 'x' + h + ' ' + L + ' home (' + m.n + ' boxes) ' + m.bad.join(' | '));
      // a friend's challenge banner on top still fits
      await B.page.evaluate(() => { FF.UI.vs = { name: 'SAMIRA', score: 4321, seed: 99, mode: 'endless' }; FF.UI.applyLang(); });
      await B.page.waitForTimeout(700);
      m = await measure(B.page, '#home', false);
      ok(!m.bad.length, w + 'x' + h + ' ' + L + ' home with a challenge banner ' + m.bad.join(' | '));
      await B.page.evaluate(() => { FF.UI.vs = null; FF.UI.applyLang(); });
      for (const [act, scope] of [['skins', '#skins'], ['settings', '#settings'], ['board', '#board'], ['missionsBox', '#missionsBox']]) {
        await B.page.evaluate((a) => FF.UI.act(a), act);
        await B.page.waitForTimeout(650);
        m = await measure(B.page, scope, true);
        ok(m.n > 2 && !m.bad.length, w + 'x' + h + ' ' + L + ' ' + act + ' ' + m.bad.join(' | '));
        await home(B.page);
      }
      // results of a real run (a new best, so the near-miss challenge button shows too)
      await B.page.evaluate(() => { FF.save.best = 1; FF.UI.startGame('endless'); });
      await B.page.waitForTimeout(1500);
      await B.page.evaluate(() => { FF.UI.game.p.y = -1e4; });
      await B.page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 20000 });
      await B.page.waitForTimeout(900);
      m = await measure(B.page, '#over', false);
      ok(m.n > 4 && !m.bad.length, w + 'x' + h + ' ' + L + ' results ' + m.bad.join(' | '));
      await home(B.page);
    }
    ok(!B.errors.length, w + 'x' + h + ' no page errors ' + B.errors.slice(0, 3).join(' | '));
    ok(B.supa() >= 0, 'world board server blocked (' + B.supa() + ' calls stopped)');
    await B.page.close();
  }
  ok(!A.errors.length, 'no page errors ' + A.errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fails.length ? 'REDESIGN TEST FAILED (' + fails.length + ')' : 'REDESIGN TEST PASSED');
  process.exit(fails.length ? 1 : 0);
})();
