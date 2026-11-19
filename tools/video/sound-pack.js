// FLIPNOVA sound pack for videos: renders every sound effect from the game's own js/audio.js to a WAV file.
// The same synthesis the game plays (no music, no melodies), rendered offline so it's identical every time.
// usage: node tools/video/sound-pack.js <gameRoot> [outDir=marketing/sounds]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const root = path.resolve(process.argv[2] || '');
  const out = path.resolve(process.argv[3] || path.join(__dirname, '..', '..', 'marketing', 'sounds'));
  if (!fs.existsSync(path.join(root, 'js', 'audio.js'))) { console.error('usage: node tools/video/sound-pack.js <gameRoot> [outDir]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.route(/supabase\.co/, (r) => r.abort());
  await p.goto('file://' + root + '/index.html');
  await p.waitForFunction(() => window.FF && FF.audio);
  // list the names the game can play (A.play looks them up in a private table, so ask it which ones exist)
  const NAMES = ['flip', 'perfect', 'near', 'coin', 'gem', 'line', 'combo', 'frenzy', 'world', 'crash', 'record', 'pad', 'lock', 'glitch', 'ui', 'uiBack', 'uiGo'];
  const files = await p.evaluate(async (NAMES) => {
    const SR = 44100, LEN = 1.6;
    const wav = (buf) => {
      const ch = buf.getChannelData(0);
      let end = ch.length; // trim the silent tail (keep 60 ms)
      while (end > 1 && Math.abs(ch[end - 1]) < 0.0005) end--;
      end = Math.min(ch.length, end + Math.round(SR * 0.06));
      const dv = new DataView(new ArrayBuffer(44 + end * 2));
      const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); dv.setUint32(4, 36 + end * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
      dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, SR, true);
      dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, end * 2, true);
      for (let i = 0; i < end; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 0x7fff, true);
      let s = ''; const u = new Uint8Array(dv.buffer);
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return { b64: btoa(s), sec: end / SR };
    };
    const A = FF.audio, RealAC = window.AudioContext;
    const res = {};
    for (const n of NAMES) {
      const off = new OfflineAudioContext(1, Math.round(SR * LEN), SR);
      Object.defineProperty(off, 'state', { get: () => 'running' }); // A.play only plays on a running context
      off.resume = () => Promise.resolve();
      window.AudioContext = function () { return off; };
      A.ctx = null;
      A.init();
      A.setVolumes({ sfx: 0.9, ui: 0.9, muted: false });
      A.play(n);
      const buf = await off.startRendering();
      let peak = 0;
      for (const v of buf.getChannelData(0)) peak = Math.max(peak, Math.abs(v));
      if (peak > 0.0005) res[n] = Object.assign(wav(buf), { peak: Math.round(peak * 100) / 100 });
    }
    window.AudioContext = RealAC;
    A.ctx = null;
    return res;
  }, NAMES);
  await b.close();
  const list = [];
  for (const [n, f] of Object.entries(files)) {
    fs.writeFileSync(path.join(out, 'sfx-' + n + '.wav'), Buffer.from(f.b64, 'base64'));
    list.push('| `sfx-' + n + '.wav` | ' + f.sec.toFixed(2) + ' s | ' + f.peak + ' |');
  }
  const missing = NAMES.filter((n) => !files[n]);
  fs.writeFileSync(path.join(out, 'README.md'), '# FLIPNOVA sound pack (for videos)\n\n' +
    'Rendered from the game\'s own `js/audio.js` by `node tools/video/sound-pack.js <gameRoot>`. Sound effects only: no music, no melodies, no voice.\n' +
    'Mono, 44.1 kHz, 16-bit WAV, silent tail trimmed. The noise in them is random, so each render differs very slightly.\n\n' +
    '| file | length | peak |\n|---|---|---|\n' + list.join('\n') + '\n' + (missing.length ? '\nSilent (not rendered): ' + missing.join(', ') + '\n' : ''));
  console.log('wrote', Object.keys(files).length, 'sounds to', out, missing.length ? '(silent: ' + missing.join(', ') + ')' : '');
})().catch((e) => { console.error(e); process.exit(1); });
