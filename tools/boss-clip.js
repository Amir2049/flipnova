// Record a clip of a boss fight WITH its sound, as a player would see and hear it (the bot plays).
// usage: node tools/boss-clip.js OUT.mp4 [--secs=45] [--w=1280] [--h=720]
// Picture: Playwright's page recording. Sound: the game's own output, tapped in the page (MediaRecorder), then muxed.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const OUT = path.resolve(process.argv[2] || 'boss-clip.mp4'), SECS = +arg('secs', 45), VW = +arg('w', 1280), VH = +arg('h', 720), PORT = +arg('port', 8889);
const TMP = fs.mkdtempSync(path.join(path.dirname(OUT), 'clip-'));
(async () => {
  const srv = spawn('node', [path.join(__dirname, 'mock-supabase.js'), String(PORT)], { stdio: 'ignore' });
  await new Promise((ok) => setTimeout(ok, 700));
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, recordVideo: { dir: TMP, size: { width: VW, height: VH } } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  // tap the game's sound: every AudioContext also feeds a recorder
  await ctx.addInitScript(() => {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const conn = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dst) {
      const r = conn.apply(this, arguments);
      if (dst && dst instanceof AudioDestinationNode && !dst.context.__tap) { const c = dst.context; c.__tap = c.createMediaStreamDestination(); conn.call(this, c.__tap); window.__tapCtx = c; }
      return r;
    };
  });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const t0 = Date.now();
  await page.goto('http://localhost:' + PORT + '/index.html');
  await page.waitForFunction(() => window.FF && FF.UI && FF.save && FF.UI.screen === 'home');
  await page.evaluate(() => { FF.save.tutDone = 1; FF.save.runs = 12; FF.save.settings.lang = 'en'; FF.save.settings.muted = false; FF.UI.persist(); FF.audio.init(); });
  await page.waitForFunction(() => window.__tapCtx, null, { timeout: 5000 }).catch(() => {});
  const recStart = await page.evaluate(() => { const c = window.__tapCtx; if (!c) return -1; window.__chunks = []; const r = new MediaRecorder(c.__tap.stream, { mimeType: 'audio/webm;codecs=opus' }); r.ondataavailable = (e) => window.__chunks.push(e.data); r.start(250); window.__rec = r; return performance.timeOrigin + performance.now(); });
  await page.evaluate(() => FF.UI.act('boss'));
  await page.waitForFunction(() => FF.UI.game && FF.UI.game.boss);
  await page.evaluate(() => { const g = FF.UI.game, B = g.boss; B.botLate = true; const up = g.update.bind(g); let n = 0; g.update = function (dt) { if (!g.dead && !g.ended && (n++ & 1) === 0 && !g.pendingFlip && B.botShouldFlip()) g.botAct(); up(dt); }; });
  await page.waitForTimeout(SECS * 1000);
  const audio = await page.evaluate(() => new Promise((ok) => { const r = window.__rec; if (!r) return ok(null); r.onstop = async () => { const blob = new Blob(window.__chunks, { type: 'audio/webm' }); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); ok(btoa(s)); }; r.stop(); }));
  const vpath = await page.video().path();
  await ctx.close(); await b.close(); srv.kill();
  const apath = path.join(TMP, 'a.webm');
  const lead = recStart > 0 ? Math.max(0, (recStart - t0) / 1000) : 0;   // the picture started at page open; the sound a little later
  if (audio) fs.writeFileSync(apath, Buffer.from(audio, 'base64'));
  const args = ['-y', '-loglevel', 'error', '-i', vpath];
  if (audio) args.push('-itsoffset', lead.toFixed(3), '-i', apath, '-map', '0:v', '-map', '1:a');
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30');
  if (audio) args.push('-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-15:TP=-1.5');
  args.push('-movflags', '+faststart', '-shortest', OUT);
  execFileSync('ffmpeg', args);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(1) + ' MB', audio ? 'with sound' : 'NO SOUND', errs.length ? 'errors: ' + errs.slice(0, 3).join(' | ') : '');
})().catch((e) => { console.error(e); process.exit(1); });
