// a gameplay video WITH sound of the whole fight (the bot plays it in real time)
// usage: node tools/tyrantfight/clip.js PAGE.html OUT.mp4 [--w=1280] [--h=720] [--lang=en]
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PAGE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]), VW = +arg('w', 1280), VH = +arg('h', 720);
(async () => {
  const TMP = fs.mkdtempSync(path.join(path.dirname(OUT), 'rec-'));
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, recordVideo: { dir: TMP, size: { width: VW, height: VH } } });
  await ctx.addInitScript(() => { const conn = AudioNode.prototype.connect; AudioNode.prototype.connect = function (dst) { const r = conn.apply(this, arguments); if (dst && dst instanceof AudioDestinationNode && !dst.context.__tap) { const c = dst.context; c.__tap = c.createMediaStreamDestination(); conn.call(this, c.__tap); window.__tapCtx = c; } return r; }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const t0 = Date.now(); await p.goto('file://' + PAGE); await p.evaluate(() => document.fonts.ready); await p.evaluate(require('./bot.js'));
  await p.waitForTimeout(600);
  await p.click(arg('lang', 'en') === 'ar' ? '#ar' : '#en');
  const recStart = await p.evaluate(async () => {
    const D = FF.TyrantFight._dbg; D.QG.rs = [1, 1, 1];   // the clip keeps the full picture
    await new Promise((r) => setTimeout(r, 150)); const c = window.__tapCtx; window.__chunks = [];
    const rec = new MediaRecorder(c.__tap.stream, { mimeType: 'audio/webm;codecs=opus' }); rec.ondataavailable = (e) => window.__chunks.push(e.data); rec.start(250); window.__rec = rec;
    const B = window.__bot; window.__fr = []; let last = performance.now(); const tick = (now) => { window.__fr.push(now - last); last = now; B.step(); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    return performance.timeOrigin + performance.now() - 150;
  });
  await p.waitForFunction(() => { const S = FF.TyrantFight._dbg.S; return S.mode === 'won' && S.t - S.mt0 > 3.5; }, null, { timeout: 300000, polling: 500 });
  const info = await p.evaluate(() => { const S = FF.TyrantFight._dbg.S, f = window.__fr; return { t: S.t.toFixed(1), deaths: S.deaths, fps: (1000 * f.length / f.reduce((a, b) => a + b, 0)).toFixed(1) }; });
  const audio = await p.evaluate(() => new Promise((ok) => { const r = window.__rec; r.onstop = async () => { const buf = new Uint8Array(await new Blob(window.__chunks).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); ok(btoa(s)); }; r.stop(); }));
  const v = await p.video().path(); await ctx.close(); await b.close();
  fs.writeFileSync(TMP + '/a.webm', Buffer.from(audio, 'base64'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', v, '-itsoffset', ((recStart - t0) / 1000).toFixed(3), '-i', TMP + '/a.webm', '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-15:TP=-1.5', '-movflags', '+faststart', '-shortest', OUT]);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(1) + ' MB', JSON.stringify(info), errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : '');
})().catch((e) => { console.error(e); process.exit(1); });
