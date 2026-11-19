// Renders tools/concept.html and saves each concept canvas as a PNG into concept/
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('file://' + root + '/tools/concept.html');
  await page.waitForFunction(() => document.title === 'READY', null, { timeout: 30000 });
  const shots = [['keyart', '01-key-art'], ['characters', '02-characters'], ['worlds', '03-worlds'], ['obstacles', '04-obstacles']];
  for (const [id, name] of shots) {
    const data = await page.$eval('#' + id, (c) => c.toDataURL('image/png'));
    require('fs').writeFileSync(path.join(root, 'concept', name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    console.log('saved', name);
  }
  await browser.close();
})();
