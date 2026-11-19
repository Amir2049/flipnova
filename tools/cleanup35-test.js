// 🧹 Build-35 cleanup test, against tools/mock-supabase.js — the real server is blocked (*supabase.co is aborted).
//   1. the Challenge Tower is gone everywhere (home button, screen, board tab, mission, data);
//   2. an old save holding a 'tower' mission + Tower stars + the Tower Master achievement loads with no errors:
//      the mission is swapped for a real one, save.tower is kept, SIR FLIP / GOLDEN stay unlocked;
//   3. toasts queue up one at a time in the wall band above the ceiling — never on the floor lane, never on the
//      results buttons — and the results icon row fits in a 390 px tall screen;
//   4. the anonymous counter sends each event once a day ('run' at most 20), only {"ev": ...}, and nothing at all
//      from a test browser that isn't pointed at the mock server;
//   5. Arabic: the weekly countdown is words with no LTR isolate, "3%" stays "3%".
// usage: node tools/cleanup35-test.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8835;
const URL = 'http://localhost:' + PORT;
const fails = [];
const ok = (cond, what) => { if (!cond) fails.push(what); console.log((cond ? '  ✓ ' : '  ✗ ') + what); };
const counts = () => fetch(URL + '/__counts').then((r) => r.json());

(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 700));
  const b = await chromium.launch();
  const errs = [];
  const open = async (seed, { mock = true, counter = null, keep = null } = {}) => {
    const ctx = keep || await b.newContext({ viewport: { width: 844, height: 390 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(e.message));
    await ctx.route(/supabase\.co/, (r) => r.abort());
    if (!keep) {
      await ctx.addInitScript(([seed, mock, url, counter]) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        const d = new Date(), p = (n) => String(n).padStart(2, '0');
        const today = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
        const s = JSON.parse(JSON.stringify(seed).replace(/__TODAY__/g, today));
        if (mock) s.onlineOverride = { url, key: 'test-key' };
        localStorage.setItem('flipfrenzy.v1', JSON.stringify(s));
        if (counter) localStorage.setItem('flipnova.count.v1', JSON.stringify(counter));
      }, [seed, mock, URL, counter]);
    }
    await page.goto(URL + '/index.html');
    await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
    await page.waitForTimeout(2600);
    return { ctx, page };
  };

  // ---- 1 + 2: an old save with a Tower mission, Tower stars and the Tower Master achievement
  console.log('old save with a tower mission');
  const old = {
    enV1: 1, runs: 40, best: 9000, bestStage: 6, coins: 1234, tutDone: 1, settings: { lang: 'en' },
    tower: { t1: 3, t2: 3, t3: 3, t4: 3, t5: 3, t6: 3, t7: 3, t8: 3, t9: 3, t10: 3 }, ach: { master: 1700000000000, first_flip: 1700000000000 },
    missions: { date: '__TODAY__', bonus: false, list: [
      { id: 'tower', target: 1, reward: 40, progress: 0, done: false },
      { id: 'coins', target: 60, reward: 40, progress: 10, done: false },
      { id: 'ghostmission', target: 2, reward: 80, progress: 2, done: true }] }
  };
  const A = await open(old);
  const p = A.page;
  const r1 = await p.evaluate(() => {
    FF.UI.act('missionsBox');
    const mis = document.querySelector('#missions').textContent;
    const ids = FF.save.missions.list.map((m) => m.id);
    FF.UI.act('home');
    return {
      homeBtn: !!document.querySelector('[data-act=tower]'), screen: !!document.querySelector('#tower'), tab: !!document.querySelector('[data-btab=tower]'),
      list: !!document.querySelector('#towerList'), data: typeof FF.TOWER + typeof FF.towerList,
      text: /tower|برج/i.test(document.querySelector('#home').textContent + document.querySelector('#board').textContent),
      ids, misText: mis, tower: FF.save.tower, master: !!FF.save.ach.master,
      knight: FF.isUnlocked(FF.SKINS.find((s) => s.id === 'knight')), gold: FF.isUnlocked(FF.SKINS.find((s) => s.id === 'gold')),
      doneKept: FF.save.missions.list.filter((m) => m.done).length
    };
  });
  ok(!r1.homeBtn && !r1.screen && !r1.tab && !r1.list, 'no Tower button, screen, list or board tab');
  ok(r1.data === 'undefinedundefined', 'no FF.TOWER / FF.towerList data');
  ok(!r1.text, 'no "Tower" text on home or the board');
  ok(r1.ids.length === 3 && !r1.ids.includes('tower') && !r1.ids.includes('ghostmission') && new Set(r1.ids).size === 3, 'unknown missions swapped for 3 real ones: ' + r1.ids.join(','));
  ok(r1.doneKept === 1, 'a finished old mission stays finished (coins not paid twice)');
  ok(!/undefined/.test(r1.misText) && r1.misText.length > 20, 'missions screen renders');
  ok(r1.tower && r1.tower.t1 === 3 && Object.keys(r1.tower).length === 10, 'save.tower kept untouched');
  ok(r1.master && r1.gold && r1.knight, 'Tower Master kept, GOLDEN and SIR FLIP stay unlocked');
  // a run ends and missions update without throwing
  await p.evaluate(() => FF.UI.startGame('endless'));
  await p.waitForTimeout(800);
  await p.evaluate(() => { FF.UI.game.p.y = -1e4; });
  await p.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 20000 });
  ok(true, 'a run ends normally on the old save');
  const fresh = await p.evaluate(() => {
    // a brand-new player: SIR FLIP is "30 Adventure stars", GOLDEN is Challenge Master (build 36: every Gauntlet without dying)
    const s = FF.save, keep = { tower: s.tower, ach: s.ach, camp: s.camp, viral: s.viral };
    s.tower = {}; s.ach = {}; s.camp = {}; s.viral = {};
    const knight = FF.isUnlocked(FF.SKINS.find((x) => x.id === 'knight')), gold = FF.isUnlocked(FF.SKINS.find((x) => x.id === 'gold'));
    Object.assign(s, keep);
    return { knight, gold };
  });
  ok(!fresh.knight && !fresh.gold, 'SIR FLIP / GOLDEN are still earned (not free) for a new player');

  // ---- 3: toasts and the results layout
  console.log('toasts and layout');
  await p.evaluate(() => FF.UI.act('home'));
  await p.waitForTimeout(400);
  await p.evaluate(() => FF.UI.startGame('endless'));
  await p.waitForTimeout(900);
  const t3 = await p.evaluate(() => {
    document.querySelector('#toasts').innerHTML = ''; // start from an empty queue
    ['🏆 one <b>A</b>', '🔓 two <b>B</b>', '🎯 three <b>C</b>'].forEach((h) => FF.UI.toast(h));
    const st = document.querySelector('#stage').getBoundingClientRect();
    const u = st.height / FF.H;
    const vis = [...document.querySelectorAll('#toasts .toast')].filter((d) => getComputedStyle(d).display !== 'none');
    const r = vis[0] && vis[0].getBoundingClientRect();
    return { n: vis.length, queued: document.querySelectorAll('#toasts .toast').length, bottom: r ? r.bottom - st.top : 0, ceil: FF.C * u, floor: FF.F * u };
  });
  ok(t3.n === 1 && t3.queued === 3, 'one toast at a time, the rest wait (' + t3.n + ' shown, ' + t3.queued + ' queued)');
  ok(t3.bottom > 0 && t3.bottom <= t3.ceil + 1, 'toast sits above the ceiling line (bottom ' + Math.round(t3.bottom) + ' ≤ ' + Math.round(t3.ceil) + '), far from the floor lane (' + Math.round(t3.floor) + ')');
  await p.waitForTimeout(2600);
  const t3b = await p.evaluate(() => ({ left: document.querySelectorAll('#toasts .toast').length, text: document.querySelector('#toasts').textContent }));
  ok(t3b.left === 2 && /two/.test(t3b.text), 'the next toast takes over when the first is done');
  await p.evaluate(() => { FF.UI.game.p.y = -1e4; });
  await p.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 20000 });
  await p.waitForTimeout(700);
  const t4 = await p.evaluate(() => {
    FF.UI.toast('🔥 Day 1 in a row! <b>+25</b>');
    const R = (e) => e.getBoundingClientRect();
    const t = [...document.querySelectorAll('#toasts .toast')].find((d) => getComputedStyle(d).display !== 'none');
    const tr = t && R(t);
    const icons = [...document.querySelectorAll('#over .iconrow .ic')].filter((e) => getComputedStyle(e).display !== 'none').map(R);
    const hit = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { inView: icons.length >= 2 && icons.every((r) => r.bottom <= innerHeight && r.top >= 0), covered: icons.some((r) => hit(tr, r)), againOk: R(document.querySelector('#over [data-act=again]')).bottom <= innerHeight };
  });
  ok(t4.inView && t4.againOk, 'results: PLAY AGAIN and the whole icon row fit in 390 px');
  ok(!t4.covered, 'results: no toast on the Home / Share buttons');

  // ---- 5: Arabic countdown and percent
  const ar = await p.evaluate(() => {
    FF.save.settings.lang = 'ar';
    const s = FF.UI.fmtLeft(2 * 86400000 + 3 * 3600000 + 60000), h = FF.UI.fmtLeft(5 * 3600000 + 2 * 60000);
    FF.save.settings.lang = 'en';
    const e = FF.UI.fmtLeft(2 * 86400000 + 3 * 3600000 + 60000);
    return { s, h, e };
  });
  ok(ar.s === 'يومين و3 ساعات' && ar.h === '5 ساعات ودقيقتين' && !/[⁦⁩]/.test(ar.s), 'Arabic countdown in words: "' + ar.s + '" / "' + ar.h + '"');
  ok(/2d 3h/.test(ar.e), 'English countdown unchanged: ' + ar.e);
  await A.ctx.close();

  // ---- 4: the anonymous counter
  console.log('anonymous counter');
  const base = (await counts()).n;
  const delta = async () => { const n = (await counts()).n, o = {}; for (const k in n) o[k] = n[k] - (base[k] || 0); return o; };
  const C = await open({ enV1: 1, runs: 3, best: 500, tutDone: 1, settings: { lang: 'en' } }, { counter: { first: '2020-01-01' } });
  let c = { n: await delta() };
  ok(c.n.open === 1 && c.n.back === 1, 'open + back sent once (open ' + c.n.open + ', back ' + c.n.back + ')');
  await C.page.reload();
  await C.page.waitForFunction(() => window.FF && FF.UI && FF.UI.screen === 'home');
  await C.page.waitForTimeout(2600);
  c = { n: await delta() };
  ok(c.n.open === 1 && c.n.back === 1, 'a second open the same day sends nothing');
  const sent = await C.page.evaluate(() => { let n = 0; for (let i = 0; i < 25; i++) if (FF.Online.count('run')) n++; FF.Online.count('share'); FF.Online.count('share'); FF.Online.count('stage3'); FF.Online.count('stage3'); FF.Online.count('name:bob'); return n; });
  await C.page.waitForTimeout(600);
  c = Object.assign(await counts(), { n: await delta() });
  ok(sent === 20 && c.n.run === 20, "'run' capped at 20 a day (" + c.n.run + ')');
  ok(c.n.share === 1 && c.n.stage3 === 1, 'share / stage3 once a day');
  ok(c.calls.every((x) => x.keys.length === 1 && x.keys[0] === 'ev' && typeof x.body.ev === 'string'), 'every call carries only {"ev": ...}');
  ok(c.calls.every((x) => ['open', 'back', 'tut', 'run', 'stage3', 'share', 'vs_open'].includes(x.body.ev)), 'no unknown event ever sent');
  // the next day: everything may be sent again once
  await C.page.evaluate(() => { const k = 'flipnova.count.v1'; const s = JSON.parse(localStorage.getItem(k)); s.day = '2020-01-02'; localStorage.setItem(k, JSON.stringify(s)); FF.Online.count('open'); FF.Online.count('open'); });
  await C.page.waitForTimeout(400);
  c = { n: await delta() };
  ok(c.n.open === 2, 'a new day counts open once more');
  // the owner never counts
  const own = await C.page.evaluate(() => { FF.save.owner = true; const r = FF.Online.count('share') || FF.Online.count('run'); FF.save.owner = false; return r; });
  ok(!own, 'owner devices send nothing');
  await C.ctx.close();
  // a test browser that is NOT pointed at the mock server: nothing goes out
  const n0 = (await counts()).calls.length;
  const D = await open({ enV1: 1, runs: 3, tutDone: 1, settings: { lang: 'en' } }, { mock: false, counter: { first: '2020-01-01' } });
  const dSent = await D.page.evaluate(() => FF.Online.count('share'));
  await D.page.waitForTimeout(400);
  ok(!dSent && (await counts()).calls.length === n0, 'automated browser without the mock server sends nothing');
  await D.ctx.close();
  // the Maker app never counts
  const ctxM = await b.newContext({ viewport: { width: 844, height: 390 } });
  await ctxM.route(/supabase\.co/, (r) => r.abort());
  await ctxM.addInitScript((url) => localStorage.setItem('flipfrenzy.v1', JSON.stringify({ enV1: 1, runs: 3, onlineOverride: { url, key: 'test-key' } })), URL);
  const pm = await ctxM.newPage();
  pm.on('pageerror', (e) => errs.push(e.message));
  await pm.goto(URL + '/index.html?maker=1');
  await pm.waitForFunction(() => window.FF && FF.UI && FF.save);
  await pm.waitForTimeout(2600);
  const mSent = await pm.evaluate(() => FF.Online.count('share'));
  ok(!mSent && (await counts()).calls.length === n0, 'the Maker app sends nothing');
  await ctxM.close();

  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  srv.kill();
  console.log(fails.length ? 'FAIL (' + fails.length + ')' : 'PASS');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
