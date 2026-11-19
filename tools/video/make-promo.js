// FLIPPO promo video (vertical 1080x1920, ~20 s) for TikTok / Reels / Shorts.
// Real gameplay (a bot that taps like a person, shielded so the clip never ends early): a hook, the three new
// worlds (sandstorm wind, nebula gravity fields, jungle totems), then an end card.
// Sound: ONLY the game's own effects (marketing/sounds/sfx-*.wav, made by tools/video/sound-pack.js). No music.
// usage: node tools/video/make-promo.js [out.mp4]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'marketing', 'videos', 'FLIPPO-promo-new-worlds.mp4'));
const FPS = 30, SR = 44100;
const SEGS = [
  // stage, frames, caption lines
  { st: 1, n: 105, top: ['ONE TAP', 'FLIPS GRAVITY'] },
  { st: 23, n: 150, top: ['SANDSTORM', 'THE WIND PUSHES YOU'] },
  { st: 25, n: 150, top: ['NEBULA', 'GRAVITY GOES LIGHT', 'AND HEAVY'] },
  { st: 27, n: 150, top: ['JUNGLE RUINS', 'TOTEMS FLIP YOU'] }
];
const END_N = 90;
(async () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'promo-'));
  const b = await chromium.launch(); const p = await b.newPage();
  await p.route('**/*supabase.co/**', (r) => r.abort());
  await p.goto('file://' + ROOT + '/index.html'); await p.waitForTimeout(1500);
  const total = SEGS.reduce((a, s) => a + s.n, 0) + END_N;
  await p.evaluate(({ SEGS, END_N, FPS }) => {
    FF.save.settings.lang = 'en';
    const W = 270, H = 480;
    const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
    const g = comp.getContext('2d'); g.imageSmoothingEnabled = false;
    const gc = document.createElement('canvas'); gc.width = 320; gc.height = 180;
    const gctx = gc.getContext('2d'); gctx.imageSmoothingEnabled = false;
    const txt = (s, y, sc, color) => FF.font.draw(g, s, W / 2, y, { scale: sc, align: 'center', color, outline: '#05060d' });
    const S = { k: -1, f: 0, sfx: [] };
    const P = FF.Phys;
    function start(k) {
      const sg = SEGS[k];
      const gm = new FF.Game({ mode: 'endless', settings: FF.save.settings, skin: 'flippo', seed: 9001 + k * 17, silent: true, god: true, callbacks: {}, startX: sg.st > 1 ? (sg.st - 1) * FF.Level.STAGE_LEN : undefined });
      gm.introT = 0;
      gm.sfx = (name) => { if (['flip', 'perfect', 'near', 'coin', 'combo', 'frenzy', 'world'].includes(name)) S.sfx.push({ name, f: S.f }); };
      // fast-forward until the world's own obstacle is a little ahead (so every segment shows it working)
      const want = { 23: 'wind', 25: 'field', 27: 'totem' }[sg.st];
      let i = 0, lastTap = -9;
      const play = () => {
        const p = gm.p;
        if (p.fly) { if (Math.random() < 0.05) gm.botAct(); return; }
        const td = P.timeToDeath(p, gm.L, gm.time, 0.6);
        if (td !== null && td <= 0.22 && gm.time - lastTap > 0.2) { const q = P.clone(p); P.flipState(q); if (P.timeToDeath(q, gm.L, gm.time, 0.6) === null) { gm.flip(); lastTap = gm.time; } }
      };
      const mute = gm.sfx; gm.sfx = () => {};
      while (i++ < 60 * 300) {
        if (gm.time > 2.5 && !(gm.stageBanner > 0) && (!want || gm.L.objs.some((o) => o.t === want && o.x - gm.p.x > 40 && o.x - gm.p.x < 160))) break;
        gm.update(1 / 60); play();
      }
      gm.sfx = mute; gm.particles.length = 0; gm.popups.length = 0;
      S.gm = gm; S.play = play; S.k = k; S.f0 = S.f;
    }
    window.__frame = () => {
      let k = 0, acc = 0;
      while (k < SEGS.length && S.f >= acc + SEGS[k].n) { acc += SEGS[k].n; k++; }
      g.fillStyle = '#05060d'; g.fillRect(0, 0, W, H);
      if (k < SEGS.length) {
        if (k !== S.k) start(k);
        const gm = S.gm;
        gm.update(1 / FPS); S.play();
        gctx.clearRect(0, 0, 320, 180); gm.render(gctx);
        // the corridor around the player, 1.5x: 180 game px wide → 270 wide
        g.drawImage(gc, 10, 20, 180, 140, 0, 150, 270, 210);
        g.fillStyle = 'rgba(5,6,13,0.85)'; g.fillRect(0, 0, W, 150); g.fillRect(0, 360, W, H - 360);
        const cap = SEGS[k].top, into = S.f - acc;
        const pop = into < 6 ? 1 + (6 - into) * 0.08 : 1;
        cap.forEach((line, i) => txt(line, 40 + i * 30, i === 0 ? Math.round(3 * pop) : 2, i === 0 ? FF.COLORS.coin : '#ffffff'));
        txt('FLIPPO', 400, 3, '#ffffff');
        txt('FREE  /  NO ADS', 438, 1, FF.COLORS.coin);
      } else {
        const e = S.f - acc;
        const s = FF.font.width('FLIPPO', 5), x0 = Math.round(W / 2 - s / 2);
        FF.font.draw(g, 'FLIP', x0, 150, { scale: 5, color: '#ffffff', outline: '#05060d' });
        FF.font.draw(g, 'PO', x0 + 4 * 6 * 5, 150, { scale: 5, color: FF.COLORS.coin, outline: '#05060d' });
        g.fillStyle = FF.COLORS.blue; g.fillRect(x0, 192, s / 2, 3); g.fillStyle = FF.COLORS.purple; g.fillRect(x0 + s / 2, 192, s / 2, 3);
        if (e > 8) txt('28 STAGES', 230, 2, '#ffffff');
        if (e > 16) txt('12 WORLDS', 256, 2, '#ffffff');
        if (e > 24) txt('ONE TAP', 282, 2, '#ffffff');
        if (e > 36) txt('FREE / NO ADS', 330, 2, FF.COLORS.coin);
        if (e > 48 && Math.floor(e / 8) % 2 === 0) txt('HOW FAR CAN YOU GET?', 380, 1, FF.COLORS.perfect);
        if (e === 0) S.sfx.push({ name: 'world', f: S.f });
      }
      S.f++;
      return comp.toDataURL('image/png');
    };
    window.__sfx = () => S.sfx;
  }, { SEGS, END_N, FPS });
  for (let f = 0; f < total; f++) {
    const url = await p.evaluate(() => window.__frame());
    fs.writeFileSync(path.join(tmp, 'f' + String(f).padStart(5, '0') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  const events = await p.evaluate(() => window.__sfx());
  await b.close();
  // mix the sound effects (16-bit mono WAVs) on the frame times
  const len = Math.ceil((total / FPS + 1) * SR), mix = new Float32Array(len);
  const cache = {};
  const load = (name) => {
    if (cache[name]) return cache[name];
    const buf = fs.readFileSync(path.join(ROOT, 'marketing', 'sounds', 'sfx-' + name + '.wav'));
    const n = (buf.length - 44) / 2, a = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = buf.readInt16LE(44 + i * 2) / 32768;
    return (cache[name] = a);
  };
  const gain = { flip: 0.55, perfect: 0.5, near: 0.5, coin: 0.25, combo: 0.5, frenzy: 0.5, world: 0.8 };
  let lastCoin = -99;
  for (const e of events) {
    if (e.name === 'coin') { if (e.f - lastCoin < 3) continue; lastCoin = e.f; }
    const a = load(e.name), at = Math.round((e.f / FPS) * SR), gg = gain[e.name] || 0.5;
    for (let i = 0; i < a.length && at + i < len; i++) mix[at + i] += a[i] * gg;
  }
  let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(mix[i]));
  const k = peak > 0.95 ? 0.95 / peak : 1;
  const wav = Buffer.alloc(44 + len * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + len * 2, 4); wav.write('WAVE', 8); wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mix[i] * k * 32767))), 44 + i * 2);
  fs.writeFileSync(path.join(tmp, 'sfx.wav'), wav);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png'), '-i', path.join(tmp, 'sfx.wav'),
    '-vf', 'scale=1080:1920:flags=neighbor', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-shortest', OUT]);
  // a poster frame for the post (the first frame of the jungle segment)
  const posterF = SEGS[0].n + SEGS[1].n + SEGS[2].n + 40;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, 'f' + String(posterF).padStart(5, '0') + '.png'), '-vf', 'scale=1080:1920:flags=neighbor', OUT.replace(/\.mp4$/, '-poster.png')]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(1) + ' MB,', (total / FPS).toFixed(1) + ' s,', events.length, 'sound events');
})();
