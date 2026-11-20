// Exercises the Level Maker end to end and checks featured levels with the bot.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const out = process.argv[2];
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + root + '/index.html');
  await page.waitForTimeout(1200);
  // b66: the Level Maker button is hidden for new players (build 33, until 5 runs or stage 3) — play as a returning player
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('flipfrenzy.v1') || '{}'); Object.assign(s, { runs: 6, tutDone: 1 }); localStorage.setItem('flipfrenzy.v1', JSON.stringify(s)); });
  await page.reload();
  await page.waitForTimeout(1200);
  console.log('featured:', await page.evaluate(() => FF.Editor.FEATURED.map((l) => l.name + ' ' + JSON.stringify(FF.Editor.verify(l)))));
  await page.click('[data-act=levels]');
  await page.waitForTimeout(300);
  if (out) await page.screenshot({ path: out + '/levels.png' });
  await page.click('[data-act=newLevel]');
  await page.waitForTimeout(300);
  const box = await page.$eval('#screen', (c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const tap = (lx, ly) => page.mouse.click(box.x + (lx / 320) * box.w, box.y + (ly / 180) * box.h);
  const tool = async (name) => {
    for (let i = 0; i < 3; i++) {
      if (await page.$('#edTools [data-tool=' + name + ']')) break;
      await page.click('#edTools .tool.cat');
    }
    await page.click('#edTools [data-tool=' + name + ']');
  };
  await tool('spike'); await tap(150, 150); await tap(158, 150); await tap(260, 45);
  await tool('wallB'); await tap(300, 90);
  await tool('coin'); for (let i = 0; i < 4; i++) await tap(180 + i * 14, 100);
  // drag paints a row of spikes
  await tool('spike');
  await page.mouse.move(box.x + box.w * (200 / 320), box.y + box.h * (150 / 180)); await page.mouse.down();
  await page.mouse.move(box.x + box.w * (260 / 320), box.y + box.h * (150 / 180), { steps: 12 }); await page.mouse.up();
  // scroll with the arrow
  await page.click('.edArrow.right'); await page.click('.edArrow.right');
  await tool('laser'); await tap(200, 90);
  await tool('lift'); await tap(120, 100);
  await page.waitForTimeout(200);
  console.log('items:', await page.evaluate(() => FF.Editor.data.items.length), 'cam:', await page.evaluate(() => Math.round(FF.Editor.camX)));
  if (out) await page.screenshot({ path: out + '/editor.png' });
  await page.click('[data-ed=verify]');
  await page.waitForTimeout(1500);
  console.log('verify:', await page.evaluate(() => [FF.Editor.data.verified, document.querySelector('#edMsg').textContent]));
  if (out) await page.screenshot({ path: out + '/editor-verify.png' });
  const code = await page.evaluate(() => FF.Editor.encode(FF.Editor.data));
  const back = await page.evaluate((c) => { const d = FF.Editor.decode(c); return d && d.items.length === FF.Editor.data.items.length; }, code);
  console.log('code roundtrip:', back, code.length);
  await page.click('[data-ed=test]');
  await page.evaluate(() => { window.__bot = setInterval(() => { const g = FF.UI.game; if (g && !g.dead && FF.Phys.botShouldFlip(g.p, g.L, g.time)) g.botAct(); }, 8); });
  await page.waitForTimeout(2500);
  if (out) await page.screenshot({ path: out + '/custom-play.png' });
  await page.waitForFunction(() => FF.UI.screen === 'over', null, { timeout: 60000 });
  console.log('result:', await page.evaluate(() => [document.querySelector('#overTitle').textContent, !document.querySelector('#overEdit').classList.contains('hidden')]));
  await page.evaluate(() => clearInterval(window.__bot));
  await page.click('#overEdit');
  await page.waitForTimeout(300);
  console.log('back in editor:', await page.evaluate(() => FF.Editor.active), 'saved:', await page.evaluate(() => FF.save.levels.length));
  await page.click('[data-ed=exit]');
  await page.waitForTimeout(300);
  if (out) await page.screenshot({ path: out + '/levels-after.png' });
  console.log('errors:', errors);
  await b.close();
})();
