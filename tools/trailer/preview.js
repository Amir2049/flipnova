// node tools/trailer/preview.js out.png t1 t2 ... [--w=960]   -> contact sheet (3 per row)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
const args = process.argv.slice(2), out = args[0], W = +((args.find((a) => a.startsWith('--w=')) || '--w=960').slice(4));
const times = args.slice(1).filter((a) => !a.startsWith('--')).map(Number);
const srv = http.createServer((q, s) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream' }); s.end(fs.readFileSync(p)); });
(async () => {
  await new Promise((ok) => srv.listen(0, ok));
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('http://localhost:' + srv.address().port + '/page.html'); await pg.waitForFunction(() => window.READY, null, { timeout: 20000 });
  const res = await pg.evaluate(async ({ times, W }) => {
    const Hh = Math.round(W * 9 / 16), cols = Math.min(3, times.length), rows = Math.ceil(times.length / cols);
    const sheet = document.createElement('canvas'); sheet.width = cols * W; sheet.height = rows * Hh; const sg = sheet.getContext('2d');
    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const ms = [];
    times.forEach((t, i) => { const t0 = performance.now(); TR.frame(c, t); ms.push(Math.round(performance.now() - t0)); sg.drawImage(c, (i % cols) * W, Math.floor(i / cols) * Hh);
      sg.fillStyle = '#ff0'; sg.font = '16px monospace'; sg.fillText(t.toFixed(2), (i % cols) * W + 6, Math.floor(i / cols) * Hh + 18); });
    return { url: sheet.toDataURL('image/png'), ms };
  }, { times, W });
  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log('ms/frame', res.ms.join(' '), errs.length ? 'ERRORS: ' + errs.slice(0, 5).join(' | ') : '');
  await b.close(); srv.close();
})();
