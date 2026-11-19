// Gift codes from the server: a gift added to the (mock) server after the app was built must unlock,
// draw and equip in the game; a wrong code must not; a malicious gift must be rejected or sanitised.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const PORT = 8798;
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'inherit' });
  await new Promise((ok) => setTimeout(ok, 600));
  const base = 'http://localhost:' + PORT;
  const add = (code, gift) => fetch(base + '/__gifts', { method: 'POST', body: JSON.stringify({ code, gift }) });
  const art = Array(20).fill('................');
  art[1] = '.....aaaaaa.....'; art[2] = '....abbbbbba....';
  await add('TEST-GIFT-1', { message: 'Hi <b>friend</b>', skin: { id: 'g_test', name: 'TESTER', body: '#223344', dark: '#000000', shade: '#112233', light: '#445566', eye: '#ffffff', pupil: '#ff0000', art, pal: { a: '#ffd23f', b: '#ff3355' }, fx: { type: 'orbs', c1: '#2a8aff', c2: '#ff2a4a' } }, trail: { id: 't_test', name: 'TEST TRAIL', colors: ['#ff00ff', '#00ffff'], style: 'rain' } });
  await add('EVIL-1', { skin: { id: 'flippo', name: '<img src=x onerror=alert(1)>', body: 'red;background:url(x)', dark: '#000000', shade: '#000000', light: '#000000', eye: '#000000', pupil: '#000000' } });
  const b = await chromium.launch();
  // a gift made with the real gift maker page: read its SQL, take the JSON out, store it like Supabase would
  const maker = await b.newPage();
  await maker.goto('file://' + path.join(__dirname, '..', 'dist', 'gift-maker.html'));
  await maker.waitForTimeout(500);
  await maker.click('#presets button');
  await maker.fill('#code', 'maker-made-42');
  await maker.waitForTimeout(300);
  const sql = await maker.inputValue('#out');
  const m = sql.match(/', '(?:[^']|'')*', '((?:[^']|'')*)'::jsonb/);
  const makerGift = JSON.parse(m[1].replace(/''/g, "'"));
  const hashOk = sql.includes(require('crypto').createHash('sha256').update('MAKER-MADE-42').digest('hex'));
  await maker.close();
  await add('MAKER-MADE-42', makerGift);
  const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  page.on('dialog', (d) => { errs.push('DIALOG ' + d.message()); d.dismiss(); });
  await page.goto(base + '/index.html'); await page.waitForTimeout(3200); // let the daily-streak toasts pass
  const redeem = async (code) => {
    await page.evaluate((url) => { FF.save.onlineOverride = { url, key: 'test-key' }; FF.UI.act('settings'); }, base);
    await page.click('#settings [data-act=redeem]');
    await page.fill('#codeText', code);
    await page.click('#codeOk');
    await page.waitForTimeout(700);
    return page.evaluate(() => ({ toast: [...document.querySelectorAll('.toast')].map((t) => t.innerHTML).pop(), skin: FF.save.skin, trail: FF.save.trail }));
  };
  const wrong = await redeem('NOPE-0000');
  const good = await redeem(' test-gift-1 ');
  const evil = await redeem('EVIL-1');
  const made = await redeem('maker-made-42');
  // reload: the gift must survive (saved locally) and still draw
  await page.reload(); await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({ skin: FF.save.skin, gifts: (FF.save.gifts || []).length, registered: !!FF.SKINS.find((s) => s.id === 'g_test'), trail: !!FF.trailById('t_test'), unlocked: FF.isUnlocked(FF.SKINS.find((s) => s.id === 'g_test')), flippoName: FF.skinById('flippo').name }));
  await page.evaluate(() => FF.UI.act('skins')); await page.waitForTimeout(300);
  await page.click('#skins .tab[data-tab="trails"]').catch(() => {});
  await page.waitForTimeout(300);
  const trailsTab = await page.evaluate(() => document.querySelectorAll('#skinGrid .card').length);
  await page.evaluate(() => FF.UI.startGame('endless', { seed: 5 }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(require('os').tmpdir(), 'gift-play.png') });
  console.log({ wrong, good, evil, made, hashOk, after, trailsTab, errs });
  const pass = /مش صحيح|not valid/.test(wrong.toast) && good.skin === 'g_test' && good.trail === 't_test' && !/<b>friend/.test(good.toast) && /مش صحيح|not valid/.test(evil.toast) && after.registered && after.trail && after.unlocked && after.flippoName === 'FLIPPO' && trailsTab > 5 && hashOk && made.skin === makerGift.skin.id && made.trail === makerGift.trail.id && !errs.length;
  console.log(pass ? 'GIFT TEST PASSED' : 'GIFT TEST FAILED');
  await b.close(); srv.kill(); process.exit(pass ? 0 : 1);
})();
