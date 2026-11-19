// Renders the FLIPNOVA story trailer to MP4 (1920x1080, 30 fps, H.264 + AAC).
// usage: node tools/trailer/video.js --narr=DIR [--out=DIR] [--workers=3] [--fps=30] [--name=FLIPNOVA-trailer]
// DIR holds the narration lines l1.mp3 .. l14.mp3. Needs playwright (Chromium) and ffmpeg.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const ROOT = __dirname, NARR = arg('narr', path.join(__dirname, 'narr')), OUT = path.resolve(arg('out', path.join(ROOT, '..', '..', 'build', 'trailer')));
const WORKERS = +arg('workers', 3), FPS = +arg('fps', 30), NAME = arg('name', 'FLIPNOVA-trailer'), VW = 1920, VH = 1080, SR = 48000;
const FFMPEG = fs.existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : 'ffmpeg';
fs.mkdirSync(OUT, { recursive: true });

const sinks = {}; let audioDone; const audioP = new Promise((ok) => (audioDone = ok));
const srv = http.createServer((q, s) => {
  const url = decodeURIComponent(q.url.split('?')[0]);
  if (q.method === 'POST') {
    const parts = []; q.on('data', (c) => parts.push(c));
    q.on('end', () => {
      const body = Buffer.concat(parts);
      if (url === '/audio') { audioDone(body); s.writeHead(200); return s.end('ok'); }
      const w = +(q.url.split('w=')[1] || 0), sink = sinks[w];
      if (body.length !== VW * VH * 4) { s.writeHead(400); return s.end('bad frame'); }
      if (sink.stdin.write(body)) { s.writeHead(200); s.end('ok'); } else sink.stdin.once('drain', () => { s.writeHead(200); s.end('ok'); });
    });
    return;
  }
  const p = url.startsWith('/narr/') ? path.join(NARR, path.basename(url)) : path.join(ROOT, url);
  if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.woff2') ? 'font/woff2' : p.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream' });
  s.end(fs.readFileSync(p));
});

(async () => {
  await new Promise((ok) => srv.listen(0, ok));
  const base = 'http://localhost:' + srv.address().port + '/page.html';
  const b = await chromium.launch();
  const open = async () => { const pg = await b.newPage(); pg.on('pageerror', (e) => console.error('page error:', e.message)); await pg.goto(base); await pg.waitForFunction(() => window.READY && window.TR && TR.timelineReady, null, { timeout: 30000 }); return pg; };
  const t0 = Date.now();
  // ---- sound
  const ap = await open();
  const dur = await ap.evaluate(() => TR.DUR);
  await ap.evaluate(async (hasNarr) => {
    const narr = [];
    for (let i = 1; i <= 14; i++) { if (!hasNarr) { narr.push(null); continue; } const r = await fetch('/narr/l' + i + '.mp3'); narr.push(r.ok ? await r.arrayBuffer() : null); }
    const buf = await TR.renderAudio(narr), L = buf.getChannelData(0), R = buf.getChannelData(1), inter = new Float32Array(L.length * 2);
    for (let i = 0; i < L.length; i++) { inter[i * 2] = L[i]; inter[i * 2 + 1] = R[i]; }
    await fetch('/audio', { method: 'POST', body: inter.buffer });
  }, !!NARR);
  const raw = await audioP; await ap.close();
  const rawPath = path.join(OUT, 'audio.f32'), wavPath = path.join(OUT, 'audio.wav');
  fs.writeFileSync(rawPath, raw);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', rawPath, '-af', 'loudnorm=I=-14:TP=-1.2:LRA=14,alimiter=limit=0.84', '-ar', String(SR), wavPath]);
  fs.unlinkSync(rawPath);
  console.log('sound done in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  if (process.argv.includes('--audio-only')) { await b.close(); srv.close(); return; }
  // ---- picture, in parallel chunks
  const total = Math.round(dur * FPS), per = Math.ceil(total / WORKERS), segs = [];
  let done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const a = w * per, z = Math.min(total, a + per), seg = path.join(OUT, 'seg' + w + '.mp4'); segs[w] = seg;
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', VW + 'x' + VH, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-threads', '1', '-pix_fmt', 'yuv420p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    sinks[w] = ff; const ended = new Promise((ok) => ff.on('close', ok));
    const pg = await open();
    for (let f = a; f < z; f += 10) {
      const n = Math.min(10, z - f);
      await pg.evaluate(async ({ f, n, FPS, w, VW, VH }) => {
        const c = window.__c || (window.__c = Object.assign(document.createElement('canvas'), { width: VW, height: VH })), x = c.getContext('2d', { willReadFrequently: true });
        for (let i = 0; i < n; i++) { TR.frame(c, (f + i) / FPS); const d = x.getImageData(0, 0, VW, VH).data; await fetch('/frame?w=' + w, { method: 'POST', body: d }); }
      }, { f, n, FPS, w, VW, VH });
      done += n; process.stdout.write('\rframes ' + done + '/' + total + '  ' + ((Date.now() - t0) / 1000).toFixed(0) + 's   ');
    }
    await pg.close(); ff.stdin.end(); await ended;
  }));
  console.log('');
  const list = path.join(OUT, 'segs.txt'); fs.writeFileSync(list, segs.map((s) => "file '" + s + "'").join('\n'));
  const outMp4 = path.join(OUT, NAME + '.mp4');
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', wavPath, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', outMp4]);
  segs.forEach((s) => fs.unlinkSync(s)); fs.unlinkSync(list);
  await b.close(); srv.close();
  console.log('wrote', outMp4, (fs.statSync(outMp4).size / 1e6).toFixed(1) + ' MB in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
})().catch((e) => { console.error(e); process.exit(1); });
