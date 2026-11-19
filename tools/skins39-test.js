// 🎁 Premium code skins (build 39, restyled in build 41): FEVER JACKPOT, BLOOD ORBIT, ORANGE STORM, CRIMSON KING
// (ids jackpot, bwarden, wshinobi, ctyrant). Checks: (1) before any code they are HIDDEN from the skins screen (skins and
// trails), but exist as ICON items; (2) wrong codes unlock nothing; (3) each code of BOTH generations unlocks exactly its
// own skin + trail, equips them and plays the unlock cinematic; codes typed with O for 0 / I for 1 still work;
// (4) every skin renders with no errors in every face and animates (idle loop, run frames, flip frame, an aura that
// grows with the combo, the 777 reel on a PERFECT); (5) a run with each skin + trail plays; (6) no plain code is in the repo.
// The codes are NEVER in this repo: old codes from env SKIN_CODES (comma separated, order jackpot, bwarden, wshinobi,
// ctyrant) or the file in SKIN_CODES_FILE; new codes from env SKIN_CODES_V2 or the file in SKIN_CODES_V2_FILE
// ("NAME: CODE" lines, same order). The world-board server is blocked (*supabase.co).  usage: node tools/skins39-test.js
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const KD = '/tmp/claude-0/-home-user/296d096b-fe22-5214-904e-abe8efe0459a/scratchpad/keys/';
const IDS = ['jackpot', 'bwarden', 'wshinobi', 'ctyrant'];
const NAMES = ['FEVER JACKPOT', 'BLOOD ORBIT', 'ORANGE STORM', 'CRIMSON KING'];
const KEYS = { jackpot: 'jp', bwarden: 'bw', wshinobi: 'ws', ctyrant: 'ct' };
const load = (env, file, v2) => {
  let c = (process.env[env] || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!c.length && fs.existsSync(file)) c = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((x) => (v2 ? x.split(':').slice(1).join(':') : x).trim()).filter(Boolean);
  return c;
};
const OLD = load('SKIN_CODES', process.env.SKIN_CODES_FILE || KD + 'skin-codes.txt', false);
const V2 = load('SKIN_CODES_V2', process.env.SKIN_CODES_V2_FILE || KD + 'skin-codes-v2.txt', true);
if (OLD.length !== 4 || V2.length !== 4) { console.log('SKINS39 TEST FAILED: need 4 old + 4 new codes (see the header)'); process.exit(1); }
const CODES = OLD.concat(V2);
// a typo the owner makes: 0 typed as the letter O (and 1 as I)
const typo = (c) => c.replace(/0/g, 'O').replace(/1/g, 'I');

let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

(async () => {
  // (6) the plain codes must not be anywhere in the tracked files (or in this test)
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter((f) => f && !/\.(apk|zip|png|jpg|ttf|woff2?)$/i.test(f));
  let leaks = 0;
  for (const f of tracked) {
    let txt; try { txt = fs.readFileSync(path.join(root, f), 'utf8').toUpperCase(); } catch (e) { continue; }
    for (const c of CODES) if (txt.includes(c.toUpperCase())) { leaks++; console.log('    leak in ' + f); }
  }
  ok(leaks === 0, 'no plain code in any tracked file (' + tracked.length + ' files)');

  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  let supa = 0;
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/supabase|ERR_FAILED|net::/i.test(m.text())) errs.push(m.text()); });
  await page.route(/supabase\.co/, (r) => { supa++; r.abort(); });
  await page.goto('file://' + root + '/index.html');
  await page.waitForTimeout(3200); // let the first toasts pass

  // (1) hidden before any code (skins and trails), yet they exist as ICON items with their new names
  const before = await page.evaluate((ids) => {
    FF.UI.act('skins');
    const names = () => [...document.querySelectorAll('#skinGrid .card .nm')].map((n) => n.textContent);
    const chars = names();
    document.querySelector('#skins .tab[data-tab="trails"]').click();
    const trails = names();
    document.querySelector('#skins .tab[data-tab="chars"]').click();
    return ids.map((id) => { const s = FF.skinById(id), tr = FF.trailById(id); return { name: s.id === id && s.name, icon: FF.rarityOf(s) === 'icon' && !!tr && FF.rarityOf(tr) === 'icon', locked: !FF.isUnlocked(s) && !FF.isUnlocked(tr), hidden: !chars.includes(s.name) && !trails.includes(tr.name), cards: chars.length }; });
  }, IDS);
  before.forEach((b, i) => ok(b.name === NAMES[i] && b.icon && b.locked && b.hidden && b.cards > 10, IDS[i] + ': "' + b.name + '" is an ICON skin + trail, locked and hidden from the list'));

  const redeem = async (code) => {
    await page.evaluate(() => FF.UI.act('settings'));
    await page.click('#settings [data-act=redeem]');
    await page.fill('#codeText', code);
    await page.click('#codeOk');
    await page.waitForTimeout(500);
    return page.evaluate((ids) => ({ skin: FF.save.skin, trail: FF.save.trail, codes: Object.assign({}, FF.save.codes || {}), reveal: !!document.querySelector('#premReveal'), screen: FF.UI.screen,
      unlocked: ids.filter((id) => FF.isUnlocked(FF.skinById(id)) || FF.isUnlocked(FF.trailById(id))) }), IDS);
  };

  // (2) wrong codes: close misses of the real ones and junk — nothing unlocks
  for (const bad of ['NOPE-0000', OLD[0].slice(0, -1) + (OLD[0].slice(-1) === '7' ? '8' : '7'), V2[1] + 'X', 'X' + V2[3], V2[2].slice(1)]) {
    const r = await redeem(bad);
    ok(!r.unlocked.length && !r.reveal && !IDS.includes(r.skin), 'a wrong code unlocks nothing');
  }

  // (3) each code: exactly its own skin + trail, equipped, with the cinematic. New codes first (with an O/0 typo on
  // some), then on a fresh save the old codes (they must keep working too).
  const round = async (codes, label) => {
    for (let i = 0; i < 4; i++) {
      const id = IDS[i];
      const typed = i % 2 ? '  ' + typo(codes[i]).toLowerCase() + ' ' : codes[i]; // trimmed, upper-cased, O/0 and I/1 forgiven
      const r = await redeem(typed);
      ok(r.skin === id && r.trail === id && !!r.codes[KEYS[id]] && r.unlocked.length === i + 1 && r.unlocked.includes(id), label + ' ' + id + ': its code' + (i % 2 ? ' (typed with O/I for 0/1)' : '') + ' unlocks and equips skin + trail (' + r.unlocked.length + ' unlocked)');
      ok(r.reveal && r.screen === 'skins', label + ' ' + id + ': the unlock cinematic plays over the skins screen');
      if (i === 0 && label === 'new') { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(require('os').tmpdir(), 'skins41-reveal.png') }); }
      await page.waitForTimeout(i === 0 && label === 'new' ? 3300 : 4800);
      ok(!(await page.evaluate(() => !!document.querySelector('#premReveal'))), label + ' ' + id + ': the cinematic ends by itself');
    }
  };
  await round(V2, 'new');
  const after = await page.evaluate((ids) => {
    FF.UI.act('skins');
    const cards = [...document.querySelectorAll('#skinGrid .card')];
    return ids.map((id) => { const c = cards.find((x) => x.querySelector('.nm').textContent === FF.skinById(id).name); return !!c && !c.classList.contains('locked'); });
  }, IDS);
  ok(after.every(Boolean), 'after the codes every premium skin shows, unlocked, in the skins screen');
  // the live card loop animates
  const cardAnim = await page.evaluate(async () => {
    const cv = document.querySelector('#skinGrid canvas[data-prem]');
    if (!cv) return false;
    const a = cv.toDataURL();
    for (let k = 0; k < 15; k++) { await new Promise((r) => setTimeout(r, 120)); if (a !== cv.toDataURL()) return true; }
    return false;
  });
  ok(cardAnim, 'the premium cards animate in the skins screen');
  // the old codes, on a fresh save
  await page.evaluate(() => { FF.save.codes = {}; FF.save.skin = 'flippo'; FF.save.trail = 'pixel'; });
  await round(OLD, 'old');

  // (4) rendering + animation
  const anim = await page.evaluate((ids) => {
    const res = {};
    const shot = (o) => { const c = FF.makeCanvas(80, 80), g = c.getContext('2d'); FF.drawFlippo(g, 34, 34, o); const d = g.getImageData(0, 0, 80, 80).data; let n = 0, h = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3]) n++; h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3]) >>> 0; } return { n, h }; };
    for (const id of ids) {
      const faces = {};
      for (const f of ['idle', 'run', 'blink', 'flip', 'focus', 'joy', 'dead']) faces[f] = shot({ skin: id, face: f, foot: 0 }).h;
      const idle = [0, 0.25, 0.5, 0.75, 1.0].map((t) => shot({ skin: id, face: 'run', t, aura: 0 }).h);
      const run0 = shot({ skin: id, face: 'run', foot: 0 }).h, run1 = shot({ skin: id, face: 'run', foot: 1 }).h;
      let lo = 0, hi = 0;
      for (let k = 0; k < 20; k++) { lo += shot({ skin: id, face: 'run', t: k * 0.13, aura: 0 }).n; hi += shot({ skin: id, face: 'run', t: k * 0.13, aura: 1.2 }).n; }
      const flipUp = shot({ skin: id, face: 'flip', t: 0.4, aura: 0.5, flipY: true }).n;
      res[id] = { distinctIdle: new Set(idle).size, runFrames: run0 !== run1, flipFace: faces.flip !== faces.run, faces: new Set(Object.values(faces)).size, auraLo: lo, auraHi: hi, flipUp };
    }
    const reel0 = shot({ skin: 'jackpot', face: 'run', t: 1, aura: 0 }).n, reel1 = shot({ skin: 'jackpot', face: 'run', t: 1, aura: 0, perf: 0.6 }).n;
    res.reel = reel1 - reel0;
    return res;
  }, IDS);
  for (const id of IDS) {
    const a = anim[id];
    ok(a.distinctIdle >= 4 && a.runFrames && a.flipFace && a.faces >= 4 && a.flipUp > 80, id + ': idle loop (' + a.distinctIdle + ' frames), run frames, own flip face, ' + a.faces + ' faces');
    ok(a.auraHi > a.auraLo * 1.12, id + ': the aura intensifies with the combo (' + a.auraLo + ' → ' + a.auraHi + ' px)');
  }
  ok(anim.reel > 40, 'JACKPOT: a PERFECT pops the 777 reel (+' + anim.reel + ' px)');

  // (5) a real run with each skin and trail
  for (const id of IDS) {
    await page.evaluate((id) => { FF.save.skin = id; FF.save.trail = id; FF.UI.startGame('endless', { seed: 7 }); }, id);
    await page.waitForFunction((id) => FF.UI.game && FF.UI.game.opts.skin === id, id, { timeout: 6000 }).catch(() => {}); // after the screen wipe
    const g = await page.evaluate(() => { const G = FF.UI.game; return { on: !!G, skin: G && G.opts.skin, trail: G && G.opts.trail }; });
    await page.waitForTimeout(1300); // it plays (and draws its trail) — any error is caught below
    ok(g.on && g.skin === id && g.trail === id, id + ': a run plays with its skin + trail ' + JSON.stringify(g));
    if (id === 'bwarden') await page.screenshot({ path: path.join(require('os').tmpdir(), 'skins39-run.png') });
    await page.evaluate(() => { if (FF.UI.game) FF.UI.game.p.grav = -FF.UI.game.p.grav; }); // a flipped frame too
    await page.waitForTimeout(250);
    await page.evaluate(() => { FF.UI.act('home'); });
    await page.waitForTimeout(1200); // let the screen wipe finish before the next run
  }
  // reload: still unlocked (they live in save.codes like the other gift codes)
  await page.reload(); await page.waitForTimeout(900);
  const kept = await page.evaluate((ids) => ids.every((id) => FF.isUnlocked(FF.skinById(id)) && FF.isUnlocked(FF.trailById(id))), IDS);
  ok(kept, 'after a reload all four are still unlocked');
  ok(!errs.length, 'no errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log('  (' + supa + ' supabase calls blocked)');
  await b.close();
  console.log(fails ? 'SKINS39 TEST FAILED (' + fails + ')' : 'SKINS39 TEST PASSED');
  process.exit(fails ? 1 : 0);
})();
