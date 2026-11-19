// FLIPNOVA TikTok clip, built frame by frame (perfectly smooth 30 fps) with a male AI voice-over and sound effects.
// usage: node make2.js <gameRoot> <out.mp4> <ttsDir>
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
(async () => {
  const [root, out, tts] = process.argv.slice(2);
  const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
  const lines = [1, 2, 3, 4, 5, 6, 7].map((i) => ({ file: path.join(tts, 'L' + i + '.wav'), len: dur(path.join(tts, 'L' + i + '.wav')) }));
  const b = await chromium.launch(); const p = await b.newPage();
  await p.route('**/*supabase.co/**', (r) => r.abort());
  await p.goto('file://' + root + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate((lines) => {
    FF.save.settings.lang = 'en';
    const FPS = 30, lv = FF.VIRAL.find((v) => v.id === 'v1');
    const W = 216, H = 384, comp = document.createElement('canvas'); comp.width = W; comp.height = H;
    const g = comp.getContext('2d'); g.imageSmoothingEnabled = false;
    const gc = document.createElement('canvas'); gc.width = 320; gc.height = 180; const gctx = gc.getContext('2d'); gctx.imageSmoothingEnabled = false;
    const txt = (s, y, sc, color, outline) => FF.font.draw(g, s, W / 2, y, { scale: sc, align: 'center', color, outline: outline || '#05060d' });
    let rnd = 1; const rand = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
    // the story; `say` = which voice line goes with that moment
    const SEG = [
      { n: 1, stop: 0.05, skip: 0, sayStart: 0, sayDeath: 1 },
      { n: 18, stop: 0.41, skip: 0.35 },
      { n: 33, stop: 0.68, skip: 0.62, sayStart: 2 },
      { n: 46, stop: 0.92, skip: 0.82, sayDeath: 3 },
      { n: 47, stop: 2, skip: 0, cut: [0.08, 0.85], slow: 0.93, sayStart: 4, sayWin: 5 }
    ];
    const S = { f: 0, seg: -1, game: null, phase: '', hold: 0, shake: 0, busy: 0, voice: [], sfx: [], done: false, endF: 0 };
    const say = (i) => { const at = Math.max(S.f, S.busy); S.voice.push({ i, f: at }); S.busy = at + Math.ceil(lines[i].len * FPS) + 4; };
    function startSeg(k) {
      S.seg = k; const sg = SEG[k];
      const gm = new FF.Game({ mode: 'viral', level: lv, attempt: sg.n, settings: FF.save.settings, skin: 'flippo', trail: 'pixel', silent: true, callbacks: { onEnd() {}, onEvent() {} } });
      const tick = gm.tick.bind(gm);
      const frac = () => gm.p.x / gm.L.finishX;
      const bot = () => frac() < sg.stop && FF.Phys.botShouldFlip(gm.p, gm.L, gm.time);
      if (sg.skip) { let i = 0; while (!gm.dead && frac() < sg.skip && i++ < 120 * 60) { if (bot()) gm.botAct(); tick(FF.STEP); } gm.particles.length = 0; gm.popups.length = 0; gm.worldBanner = 0; gm.prevCam = undefined; }
      let cutDone = false;
      gm.tick = (dt) => {
        if (bot()) gm.botAct(); tick(dt);
        if (sg.cut && !cutDone && frac() >= sg.cut[0]) { cutDone = true; let i = 0; while (!gm.dead && frac() < sg.cut[1] && i++ < 120 * 60) { if (bot()) gm.botAct(); tick(FF.STEP); } gm.particles.length = 0; gm.popups.length = 0; gm.prevCam = undefined; S.shake = 4; }
        if (sg.slow && frac() > sg.slow) gm.opts.timeScale = 0.5;
      };
      S.game = gm; S.phase = 'play'; S.hold = 0;
      if (sg.sayStart !== undefined) say(sg.sayStart);
    }
    function step() {
      if (S.seg < 0) startSeg(0);
      const gm = S.game, sg = SEG[S.seg];
      if (S.phase !== 'end') {
        gm.update(1 / FPS);
        if (gm.dead && S.phase === 'play') { S.phase = 'dead'; S.shake = 9; S.sfx.push({ t: 'die', f: S.f }); if (sg.sayDeath !== undefined) say(sg.sayDeath); }
        if (gm.finished && S.phase === 'play') { S.phase = 'win'; S.sfx.push({ t: 'win', f: S.f }); if (sg.sayWin !== undefined) say(sg.sayWin); }
        if (S.phase === 'dead' || S.phase === 'win') {
          S.hold++;
          const need = Math.max(S.phase === 'win' ? 36 : 16, S.phase === 'dead' && sg.sayDeath !== undefined ? S.busy - S.f + 4 : 0);
          if (S.hold >= need) {
            if (S.seg < SEG.length - 1) startSeg(S.seg + 1);
            else { S.phase = 'end'; S.endF = S.f; say(6); S.sfx.push({ t: 'end', f: S.f }); }
          }
        }
      }
      gm.render(gctx);
      // ---- the vertical frame
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#05060d'); grd.addColorStop(0.5, '#140c38'); grd.addColorStop(1, '#2a0f4a');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      const pulse = S.f % 30 < 15 ? 0 : 1;
      txt('ONLY 1%', 22 - pulse, 4, '#ffd23f', '#3a2000');
      txt('CAN PASS THIS', 64, 2, '#ffffff');
      const gy = 108;
      g.fillStyle = S.phase === 'win' || S.phase === 'end' ? '#3ddc84' : S.phase === 'dead' ? '#ff3355' : '#27d7ff';
      g.fillRect(0, gy - 2, W, 184);
      const sx = S.shake > 0 ? Math.round((rand() - 0.5) * 6) : 0, sy = S.shake > 0 ? Math.round((rand() - 0.5) * 4) : 0;
      if (S.shake > 0) S.shake--;
      g.drawImage(gc, 6, 0, 216, 180, sx, gy + sy, 216, 180);
      const pct = Math.floor(FF.clamp(gm.p.x / gm.L.finishX, 0, 1) * 100);
      if (S.phase === 'play' || S.phase === 'dead') {
        txt('TRY ' + sg.n, 300, 3, S.phase === 'dead' ? '#ff5a6e' : '#ffffff');
        txt(pct + '%', 336, 2, pct >= 90 ? '#ff5a6e' : '#ffe066');
      } else {
        txt('CLEARED!', 300, 3, '#3ddc84');
        txt('ON TRY 47', 336, 2, '#ffffff');
      }
      if (S.phase === 'end') {
        g.fillStyle = 'rgba(5,6,13,0.75)'; g.fillRect(0, gy, W, 180);
        txt('CAN YOU?', gy + 26, 4, '#ffd23f');
        txt('FLIPNOVA', gy + 84, 3, '#27d7ff');
        txt('FREE - NO ADS', gy + 128, 2, '#ffffff');
        if (S.f - S.endF > Math.ceil(lines[6].len * FPS) + 20) S.done = true;
      }
      S.f++;
      return comp.toDataURL('image/png').split(',')[1];
    }
    window.__batch = (n) => { const out = []; for (let i = 0; i < n && !S.done; i++) out.push(step()); return { frames: out, done: S.done, voice: S.voice, sfx: S.sfx, f: S.f }; };
  }, lines);

  // frames → ffmpeg (scaled ×5 with hard pixels: 216x384 → 1080x1920)
  const silent = out.replace(/\.mp4$/, '-video.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-vf', 'scale=1080:1920:flags=neighbor', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  let info;
  for (;;) {
    info = await p.evaluate(() => window.__batch(60));
    for (const fr of info.frames) { if (!ff.stdin.write(Buffer.from(fr, 'base64'))) await new Promise((ok) => ff.stdin.once('drain', ok)); }
    if (info.done) break;
  }
  ff.stdin.end();
  await new Promise((ok) => ff.on('close', ok));
  await b.close();
  const total = info.f / 30;
  console.log('frames', info.f, 'seconds', total.toFixed(1), 'voice', JSON.stringify(info.voice), 'sfx', JSON.stringify(info.sfx));

  // ---- the sound: voice lines + little sound effects (a crash for each death, a chime for the win), no music
  const inputs = [], filters = [];
  info.voice.forEach((v, k) => {
    inputs.push('-i', lines[v.i].file);
    const ms = Math.round(v.f / 30 * 1000);
    filters.push(`[${k + 1}:a]aresample=44100,volume=1.6,adelay=${ms}|${ms}[v${k}]`);
  });
  let n = info.voice.length + 1; // input 0 is the video
  const fx = [];
  for (const s of info.sfx) {
    const ms = Math.round(s.f / 30 * 1000);
    if (s.t === 'die') { inputs.push('-f', 'lavfi', '-t', '0.35', '-i', 'anoisesrc=color=brown:amplitude=0.9:sample_rate=44100'); filters.push(`[${n}:a]lowpass=f=900,afade=t=out:st=0.05:d=0.3,volume=0.55,adelay=${ms}|${ms}[x${n}]`); }
    else if (s.t === 'win') { inputs.push('-f', 'lavfi', '-t', '0.9', '-i', "aevalsrc='0.25*sin(2*PI*523*t)+0.2*sin(2*PI*659*t)*gt(t,0.12)+0.2*sin(2*PI*784*t)*gt(t,0.24)':s=44100"); filters.push(`[${n}:a]afade=t=out:st=0.5:d=0.4,adelay=${ms}|${ms}[x${n}]`); }
    else { inputs.push('-f', 'lavfi', '-t', '0.25', '-i', "aevalsrc='0.2*sin(2*PI*880*t)':s=44100"); filters.push(`[${n}:a]afade=t=out:st=0.1:d=0.15,adelay=${ms}|${ms}[x${n}]`); }
    fx.push(`[x${n}]`); n++;
  }
  const mix = info.voice.map((v, k) => `[v${k}]`).join('') + fx.join('');
  filters.push(`${mix}amix=inputs=${info.voice.length + fx.length}:normalize=0,apad,atrim=0:${total.toFixed(2)},alimiter=limit=0.95[a]`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, ...inputs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('saved', out);
})();
