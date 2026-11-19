// FLIPNOVA TikTok v3: short (≈18 s), game zoomed and bright, a hook in the first second, a fast fail montage,
// a 98% heartbreak in slow motion, the win, and a clear ending. Sound effects only (no AI voice).
// usage: node make3.js <gameRoot> <out.mp4> <cfg.json>
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
(async () => {
  const [root, out, cfgFile] = process.argv.slice(2);
  const CFG = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage();
  await p.route('**/*supabase.co/**', (r) => r.abort());
  await p.goto('file://' + root + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate((CFG) => {
    FF.save.settings.lang = 'en';
    const FPS = 30, lv = FF.VIRAL.find((v) => v.id === CFG.vid);
    const W = 216, H = 384, comp = document.createElement('canvas'); comp.width = W; comp.height = H;
    const g = comp.getContext('2d'); g.imageSmoothingEnabled = false;
    const gc = document.createElement('canvas'); gc.width = 320; gc.height = 180; const gctx = gc.getContext('2d'); gctx.imageSmoothingEnabled = false;
    const txt = (s, y, sc, color, outline) => FF.font.draw(g, s, W / 2, y, { scale: sc, align: 'center', color, outline: outline || '#05060d' });
    let rnd = 7; const rand = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
    // crop of the game (player sits at x=64): 144x140 around the corridor, drawn 1.5x
    const CX = 40, CY = 30, CW = 136, CH = 132, GY = 92, GW = 216, GH = 210;
    const SEG = CFG.seg; // [{n, stop, skip, slow?, freeze?, label?}]
    const S = { f: 0, seg: -1, game: null, phase: '', hold: 0, shake: 0, flash: 0, sfx: [], done: false, endF: 0, flips: 0 };
    function startSeg(k) {
      S.seg = k; const sg = SEG[k];
      const gm = new FF.Game({ mode: 'viral', level: lv, attempt: sg.n, settings: FF.save.settings, skin: CFG.skin || 'flippo', trail: 'pixel', silent: true, callbacks: { onEnd() {}, onEvent() {} } });
      const tick = gm.tick.bind(gm);
      const frac = () => gm.p.x / gm.L.finishX;
      const bot = () => frac() < sg.stop && FF.Phys.botShouldFlip(gm.p, gm.L, gm.time);
      if (sg.skip) { let i = 0; while (!gm.dead && frac() < sg.skip && i++ < 120 * 90) { if (bot()) gm.botAct(); tick(FF.STEP); } gm.particles.length = 0; gm.popups.length = 0; gm.worldBanner = 0; gm.prevCam = undefined; }
      gm.tick = (dt) => { if (bot()) { gm.botAct(); S.flipNow = true; } tick(dt); if (sg.slow && frac() > sg.slow) gm.opts.timeScale = 0.4; };
      gm.worldBanner = 0; S.game = gm; S.phase = 'play'; S.hold = 0; S.segF = S.f; (S.marks = S.marks || []).push(S.f);
    }
    function step() {
      if (S.seg < 0) startSeg(0);
      const gm = S.game, sg = SEG[S.seg];
      if (S.phase !== 'end') {
        gm.update(1 / FPS);
        if (S.flipNow) { S.flipNow = false; S.sfx.push({ t: 'flip', f: S.f }); }
        if (gm.dead && S.phase === 'play') { S.phase = 'dead'; S.shake = 8; S.flash = 6; S.sfx.push({ t: 'die', f: S.f }); }
        if (gm.finished && S.phase === 'play') { S.phase = 'win'; S.flash = 8; S.sfx.push({ t: 'win', f: S.f }); }
        if (S.phase === 'dead' || S.phase === 'win') {
          S.hold++;
          const need = S.phase === 'win' ? 40 : (sg.freeze || 6);
          if (S.hold >= need) {
            if (S.seg < SEG.length - 1) startSeg(S.seg + 1);
            else { S.phase = 'end'; S.endF = S.f; S.sfx.push({ t: 'end', f: S.f }); }
          }
        }
      }
      gm.render(gctx);
      // background
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#0b0730'); grd.addColorStop(1, '#3a0f5a');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // game, zoomed + brighter
      const sx = S.shake > 0 ? Math.round((rand() - 0.5) * 8) : 0, sy = S.shake > 0 ? Math.round((rand() - 0.5) * 6) : 0;
      if (S.shake > 0) S.shake--;
      g.filter = 'brightness(1.35) saturate(1.35) contrast(1.1)';
      g.drawImage(gc, CX, CY, CW, CH, sx, GY + sy, GW, GH);
      g.filter = 'none';
      const col = S.phase === 'win' || S.phase === 'end' ? '#3ddc84' : S.phase === 'dead' ? '#ff3355' : '#27d7ff';
      g.fillStyle = col; g.fillRect(0, GY - 3, W, 3); g.fillRect(0, GY + GH, W, 3);
      if (S.flash > 0) { g.fillStyle = S.phase === 'win' ? 'rgba(61,220,132,' + S.flash * 0.06 + ')' : 'rgba(255,51,85,' + S.flash * 0.07 + ')'; g.fillRect(0, GY, W, GH); S.flash--; }
      // hook (always visible, first frame included)
      const pulse = S.f % 20 < 10 ? 0 : 1;
      txt(CFG.hook1, 14 - pulse, CFG.hook1.length > 7 ? 3 : 4, '#ffd23f', '#3a2000');
      txt(CFG.hook2, 58, CFG.hook2.length > 13 ? 1 : 2, '#ffffff');
      // bottom: attempt + big progress bar
      const pct = Math.floor(FF.clamp(gm.p.x / gm.L.finishX, 0, 1) * 100);
      if (S.phase !== 'end') {
        const win = S.phase === 'win';
        txt(win ? 'CLEARED!' : 'TRY ' + sg.n, 318, 3, win ? '#3ddc84' : S.phase === 'dead' ? '#ff5a6e' : '#ffffff');
        g.fillStyle = '#1a1338'; g.fillRect(18, 352, 180, 14);
        g.fillStyle = win ? '#3ddc84' : pct >= 90 ? '#ff5a6e' : '#ffd23f'; g.fillRect(18, 352, Math.round(180 * pct / 100), 14);
        g.fillStyle = '#ffffff'; g.fillRect(18, 350, 180, 2); g.fillRect(18, 366, 180, 2);
        txt(pct + '%', 336, 1, '#ffffff');
        if (S.phase === 'dead' && sg.label) txt(sg.label, GY + 86, 4, '#ff5a6e', '#2a0010');
      } else {
        g.fillStyle = 'rgba(5,6,13,0.8)'; g.fillRect(0, GY, W, GH);
        txt(CFG.end1 || 'YOUR TURN', GY + 40, 4, '#ffd23f');
        txt('FLIPNOVA', GY + 104, 3, '#27d7ff');
        txt(CFG.end2 || 'FREE - NO ADS', GY + 150, 2, '#ffffff');
        txt('LINK IN BIO', 330, 2, '#ffd23f');
        if (S.f - S.endF > 75) S.done = true;
      }
      S.f++;
      return comp.toDataURL('image/png').split(',')[1];
    }
    window.__batch = (n) => { const o = []; for (let i = 0; i < n && !S.done; i++) o.push(step()); return { frames: o, done: S.done, sfx: S.sfx, f: S.f, marks: S.marks }; };
  }, CFG);
  const silent = out.replace(/\.mp4$/, '-video.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-vf', 'scale=1080:1920:flags=neighbor', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  let info;
  for (;;) { info = await p.evaluate(() => window.__batch(60)); for (const fr of info.frames) { if (!ff.stdin.write(Buffer.from(fr, 'base64'))) await new Promise((ok) => ff.stdin.once('drain', ok)); } if (info.done) break; }
  ff.stdin.end(); await new Promise((ok) => ff.on('close', ok)); await b.close();
  const total = info.f / 30;
  const inputs = [], filters = [], fx = []; let n = 1;
  const sfx = info.sfx.filter((s, i, a) => s.t !== 'flip' || !a.slice(0, i).some((z) => z.t === 'flip' && s.f - z.f < 4));
  for (const s of sfx) {
    const ms = Math.round(s.f / 30 * 1000);
    if (s.t === 'die') { inputs.push('-f', 'lavfi', '-t', '0.4', '-i', 'anoisesrc=color=brown:amplitude=1:sample_rate=44100'); filters.push(`[${n}:a]lowpass=f=1000,afade=t=out:st=0.05:d=0.35,volume=0.8,adelay=${ms}|${ms}[x${n}]`); }
    else if (s.t === 'win') { inputs.push('-f', 'lavfi', '-t', '1.2', '-i', "aevalsrc='0.25*sin(2*PI*523*t)+0.22*sin(2*PI*659*t)*gt(t,0.12)+0.22*sin(2*PI*784*t)*gt(t,0.24)+0.2*sin(2*PI*1046*t)*gt(t,0.36)':s=44100"); filters.push(`[${n}:a]afade=t=out:st=0.7:d=0.5,adelay=${ms}|${ms}[x${n}]`); }
    else if (s.t === 'flip') { inputs.push('-f', 'lavfi', '-t', '0.06', '-i', "aevalsrc='0.12*sin(2*PI*(600+4000*t)*t)':s=44100"); filters.push(`[${n}:a]afade=t=out:st=0.02:d=0.04,adelay=${ms}|${ms}[x${n}]`); }
    else { inputs.push('-f', 'lavfi', '-t', '0.3', '-i', "aevalsrc='0.2*sin(2*PI*880*t)':s=44100"); filters.push(`[${n}:a]afade=t=out:st=0.1:d=0.2,adelay=${ms}|${ms}[x${n}]`); }
    fx.push(`[x${n}]`); n++;
  }
  filters.push(`${fx.join('')}amix=inputs=${fx.length}:normalize=0,apad,atrim=0:${total.toFixed(2)},alimiter=limit=0.95[a]`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, ...inputs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('marks', info.marks.map((m) => (m / 30).toFixed(1)).join(' '), 'seconds', total.toFixed(1), 'sfx', sfx.length, 'saved', out);
})();
