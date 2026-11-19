// 💾 OLD SAVES MUST SURVIVE EVERY NEW BUILD. Must pass on every build from build 32 on.
// Loads 3 frozen saves written by build 21 itself (tools/fixtures/saves-b21/, made by tools/save-fixtures-make.js)
// into this build, served by tools/mock-supabase.js (the real server is blocked), and checks for each one:
//   1. the game opens on the home screen with no errors, and every bit of progress is still there
//      (best, coins, runs, skins, achievements, Adventure stars, Tower stars, Legend data (the Tower and the Legend are gone as modes, their data stays), Daily, name, language);
//   2. one more Endless run adds to that progress instead of replacing it;
//   3. a reload keeps it, and if the browser wipes localStorage the IndexedDB copy brings it back;
//   4. (new) the progress code: copy it in Settings, paste it on a fresh device → the same progress.
// usage: node tools/save-compat-test.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const PORT = 8805;
const KEY = 'flipfrenzy.v1';
const DIR = path.join(__dirname, 'fixtures', 'saves-b21');

// progress = everything a player would be angry to lose. Server queue fields (pendingScores, onlineBest, onlineV)
// and day-based fields (missions, todayScores) may change on their own, so they're not compared here.
function progressProblems(old, now, label) {
  const bad = [];
  const eq = (k) => { if (JSON.stringify(old[k]) !== JSON.stringify(now[k])) bad.push(label + ': ' + k + ' changed ' + JSON.stringify(old[k]).slice(0, 60) + ' → ' + JSON.stringify(now[k]).slice(0, 60)); };
  const atLeast = (k) => { if (!((now[k] || 0) >= (old[k] || 0))) bad.push(label + ': ' + k + ' went down ' + old[k] + ' → ' + now[k]); };
  const keeps = (k) => { for (const id in old[k] || {}) if (!(now[k] || {})[id]) bad.push(label + ': lost ' + k + '.' + id); };
  ['best', 'coins', 'runs', 'xp', 'totalDist', 'bestStage'].forEach(atLeast);
  ['skin', 'trail', 'name', 'levels', 'deviceId'].forEach((k) => { if (k in old) eq(k); });
  ['owned', 'ach', 'seen'].forEach(keeps);
  for (const id in old.tower || {}) if (!((now.tower || {})[id] >= old.tower[id])) bad.push(label + ': Tower ' + id + ' stars ' + old.tower[id] + ' → ' + (now.tower || {})[id]);
  for (const id in old.camp || {}) {
    const a = old.camp[id], b = (now.camp || {})[id] || {};
    if (a.cleared && !b.cleared) bad.push(label + ': Adventure ' + id + ' no longer cleared');
    if ((b.stars || 0) < (a.stars || 0)) bad.push(label + ': Adventure ' + id + ' stars ' + a.stars + ' → ' + b.stars);
  }
  if (old.legend) {
    const a = old.legend, b = now.legend || {};
    if (!(b.attempts >= a.attempts)) bad.push(label + ': Legend attempts ' + a.attempts + ' → ' + b.attempts);
    if (!(b.best >= a.best)) bad.push(label + ': Legend best ' + a.best + ' → ' + b.best);
    if (a.done && !b.done) bad.push(label + ': Legend no longer done');
  }
  if (old.daily && old.daily.best && now.daily && now.daily.date === old.daily.date && now.daily.best < old.daily.best) bad.push(label + ': Daily best went down');
  for (const k in old.settings || {}) if (JSON.stringify(old.settings[k]) !== JSON.stringify((now.settings || {})[k])) bad.push(label + ': setting ' + k + ' changed ' + old.settings[k] + ' → ' + (now.settings || {})[k]);
  return bad;
}

async function openWith(browser, base, fixture) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  // put the old save in place before the game's scripts run — only on the very first load of this "device"
  if (fixture) await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem('__compatSeeded')) { localStorage.setItem(k, v); localStorage.setItem('__compatSeeded', '1'); } }, [KEY, JSON.stringify(fixture)]);
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/supabase|ERR_FAILED|net::/i.test(m.text())) page.errs.push(m.text()); });
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home', null, { timeout: 15000 });
  await page.waitForTimeout(700);
  return { ctx, page };
}
const readSave = (page) => page.evaluate((k) => ({ live: JSON.parse(JSON.stringify(FF.save)), stored: JSON.parse(localStorage.getItem(k) || 'null') }), KEY);
const reload = async (page) => { await page.reload(); await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home', null, { timeout: 15000 }); await page.waitForTimeout(900); };

(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const base = 'http://localhost:' + PORT;
  const browser = await chromium.launch();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  const problems = [];
  let checked = 0;
  for (const f of files) {
    const label = f.replace('.json', '');
    const old = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const { ctx, page } = await openWith(browser, base, old);
    // 1) open
    let s = await readSave(page);
    problems.push(...progressProblems(old, s.live, label + ' (open)'), ...progressProblems(old, s.stored || {}, label + ' (open, stored)'));
    const stars = Object.values(old.camp || {}).reduce((a, r) => a + (r.stars || 0), 0);
    const home = await page.evaluate(() => ({ camp: document.querySelector('#campStars').textContent, best: document.querySelector('#homeBest').textContent, lang: document.documentElement.lang || FF.save.settings.lang }));
    if (!home.camp.includes('★ ' + stars + '/')) problems.push(label + ': home shows Adventure "' + home.camp + '", expected ' + stars + ' stars');
    if (old.best && !home.best.includes(String(old.best))) problems.push(label + ': home best "' + home.best + '" does not show ' + old.best);
    // 2) one more Endless run (bot), through the real UI
    const run = await page.evaluate(async () => {
      FF.UI.startGame('endless');
      let w = 0;
      while ((!FF.UI.game || FF.UI.game.mode !== 'endless') && w++ < 200) await new Promise((ok) => setTimeout(ok, 50));
      const g = FF.UI.game;
      let n = 0;
      while (!g.dead && n++ < 120 * 600) { if ((n & 1) === 0 && !g.pendingFlip && n < 120 * 10 && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); g.tick(FF.STEP); }
      w = 0;
      while (!g.ended && w++ < 40) await new Promise((ok) => setTimeout(ok, 50));
      if (g.dead && !g.ended) g.end();
      await new Promise((ok) => setTimeout(ok, 500));
      FF.UI.act('home');
      return { ended: g.ended, score: g.score };
    });
    s = await readSave(page);
    const after = s.live;
    if (!run.ended) problems.push(label + ': the extra run never ended');
    if (after.runs !== (old.runs || 0) + 1) problems.push(label + ': runs ' + old.runs + ' → ' + after.runs + ' after one run');
    problems.push(...progressProblems(old, after, label + ' (after a run)'));
    // 3) reload, then lose localStorage and come back from the IndexedDB copy
    await reload(page);
    problems.push(...progressProblems(after, (await readSave(page)).live, label + ' (reload)'));
    await page.evaluate((k) => localStorage.removeItem(k), KEY);
    await reload(page);
    await page.waitForTimeout(800);
    problems.push(...progressProblems(after, (await readSave(page)).live, label + ' (localStorage wiped → IndexedDB)'));
    // 4) the progress code onto a brand-new device
    await page.evaluate(() => FF.UI.act('settings'));
    await page.click('[data-act2="saveOut"]', { force: true });
    const code = await page.inputValue('#codeText');
    const fresh = await openWith(browser, base, null);
    await fresh.page.evaluate(() => FF.UI.act('settings'));
    await fresh.page.click('[data-act2="saveIn"]', { force: true });
    await fresh.page.fill('#codeText', code);
    await fresh.page.click('#codeOk', { force: true });
    await fresh.page.waitForTimeout(1300);
    await fresh.page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home', null, { timeout: 15000 });
    await fresh.page.waitForTimeout(600);
    const moved = (await readSave(fresh.page)).live;
    problems.push(...progressProblems(after, moved, label + ' (progress code → new device)'));
    if (/^FNSAVE:/.test(code) === false) problems.push(label + ': no progress code shown');
    problems.push(...page.errs.map((e) => label + ': page error ' + e), ...fresh.page.errs.map((e) => label + ' (new device): page error ' + e));
    console.log(label.padEnd(13), 'runs', old.runs, '→', after.runs, '· coins', old.coins, '→', after.coins, '· best', old.best, '→', after.best, '· Adventure ★', stars, '· Tower', JSON.stringify(old.tower), '· Legend', old.legend ? old.legend.attempts + ' tries' : '-', '· lang', old.settings.lang, '· code', code.length, 'chars');
    await fresh.ctx.close();
    await ctx.close();
    checked++;
  }
  await browser.close();
  srv.kill();
  const pass = checked === 3 && !problems.length;
  if (problems.length) console.log(problems.join('\n'));
  console.log(pass ? 'SAVE COMPAT TEST PASSED (' + checked + ' build-21 saves)' : 'SAVE COMPAT TEST FAILED');
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
