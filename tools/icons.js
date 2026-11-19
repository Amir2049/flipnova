// Generates icons/icon-192.png and icons/icon-512.png from the in-game Flippo sprite.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const root = path.resolve(__dirname, '..');
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.goto('file://' + root + '/tools/concept.html');
  await page.waitForFunction(() => document.title === 'READY');
  const targets = [[192, 'icons/icon-192.png'], [512, 'icons/icon-512.png'],
    [48, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png'], [72, 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png'],
    [96, 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png'], [144, 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png'],
    [192, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png']];
  for (const [size, out] of targets) {
    const data = await page.evaluate((size) => {
      const low = FF.makeCanvas(32, 32);
      const g = low.getContext('2d');
      for (let y = 0; y < 32; y++) { g.fillStyle = FF.mix('#27d7ff', '#b45cff', y / 31); g.fillRect(0, y, 32, 1); }
      g.fillStyle = '#070926'; g.fillRect(2, 2, 28, 28);
      FF.drawSpikes(g, 4, 30, 8, 'up'); FF.drawSpikes(g, 20, 2, 8, 'down');
      const t = FF.makeCanvas(20, 24); FF.drawFlippo(t.getContext('2d'), 4, 6, { skin: 'flippo', face: 'joy' });
      g.drawImage(t, 6, 3, 20, 24);
      const c = document.createElement('canvas'); c.width = c.height = size;
      const cg = c.getContext('2d'); cg.imageSmoothingEnabled = false; cg.drawImage(low, 0, 0, size, size);
      return c.toDataURL('image/png');
    }, size);
    fs.mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
    fs.writeFileSync(path.join(root, out), Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close();
})();
