// "Human bot": plays like a person — it aims for the MIDDLE of each safe timing window and then misses
// by a random error of up to ±J seconds (reaction/thumb jitter). A level passes only if most trials survive.
// It also can't tap twice in a row faster than a person can (--gap seconds between taps, default 0.3;
// in flight, where you hold and release, 0.15), and it plans with that limit too — so a section that only
// works with a lightning-fast double tap fails.
// --cp: instead of whole runs, start from EVERY checkpoint exactly like a respawn (on the floor, at a random
// moment of the clock) and play to the next one — catches sections that only work when you arrive a certain way.
// --templates: every endless chunk type, repeated, at a slow (120) and the top (212) speed.
// --endless: real Endless runs (current rules) from 0 to 3.2km on several seeds — the whole ramp, mixes included.
// usage: node tools/human-test.js [--jitter 0.04] [--trials 4] [--gap 0.3] [--cp] [--templates] [--endless] [ids...]   (ids: c1-1 ... legend, rift-cosmos-175 ...)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  let J = 0.04, trials = 4, GAP = 0.3, CP = false, TPL = false, END = false, GEN = 0, LEN = 32000, COMBO = '', SEED0 = 0, SIGHT = false, JSET = false, LATE = false;
  const ids = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--jitter') { J = parseFloat(args[++i]); JSET = true; }
    else if (args[i] === '--trials') trials = parseInt(args[++i], 10);
    else if (args[i] === '--gap') GAP = parseFloat(args[++i]);
    else if (args[i] === '--cp') CP = true;
    else if (args[i] === '--templates') TPL = true;
    else if (args[i] === '--endless') END = true;
    else if (args[i] === '--late') { END = true; LATE = true; } // b61: Endless from stage 21 to the end of the book (the three new worlds)
    else if (args[i] === '--gen') GEN = parseInt(args[++i], 10);
    else if (args[i] === '--seeds') SEED0 = parseInt(args[++i], 10); // another set of 8 Endless seeds
    else if (args[i] === '--sight') SIGHT = true; // play every level with human eyes (screen only + reaction time)
    else if (args[i] === '--len') LEN = parseInt(args[++i], 10);
    else if (args[i] === '--combo') COMBO = args[++i]; // e.g. pend,mover,orbit@178:0.52
    else ids.push(args[i]);
  }
  const b = await chromium.launch(); const page = await b.newPage();
  await page.route('**/*supabase.co/**', (r) => r.abort()); // test the stage book in js/stages.js, not the published one
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  if (process.env.TFPOW) await page.addInitScript((v) => { window.TFPOW = +v; }, process.env.TFPOW); // try another late-game stretch
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html'); await page.waitForTimeout(800);
  const res = await page.evaluate(({ ids, J, trials, GAP, CP, TPL, END, GEN, LEN, COMBO, SEED0, SIGHT, JSET, LATE, LATEFROM, LATETO }) => {
    const P = FF.Phys;
    if (GEN) FF.GEN_V = GEN; // test an older/newer set of Endless rules
    if (window.TFPOW) FF.TF_POW = window.TFPOW;
    // the "person" lives in js/fairness.js (the in-game Stage Maker uses the same one)
    function humanRun(def, seed, from, to, t0) {
      const L = def.endless ? new FF.Level({ seed: def.seed, noHints: true, seen: {}, noRift: true }) : new FF.Level({ campaign: def, noHints: true, seen: {}, practice: !!def.legend });
      if (def.endless) L.finishX = def.len;
      // the game runs faster than real time (1.25×, challenges 1.5×): a person's reaction and tap spacing are that much longer in game time
      const sc = FF.Game.modeSpeed(def.viral ? 'viral' : def.legend ? 'legend' : def.endless ? 'endless' : 'campaign');
      // 🔥 challenges are made for experts: they must be beatable with near-perfect timing (±15ms), not by everyone
      const hard = def.viral || def.legend; // 🔥 challenges and 👑 the Legend: near-impossible by design
      const j = hard && !JSET ? Math.min(J, 0.015) : J;
      // challenges are also played with human eyes: only what's on screen, a quarter second to react
      const eyes = hard || SIGHT ? { sight: FF.W - FF.PLAYER_X, react: 0.25 * sc } : {};
      // Endless speeds up as it goes (1x → 1.25x game speed), so a person's timing stretches with it
      const ramp = def.endless ? { J: j, GAP, scaleAt: (x) => FF.Game.modeSpeedAt('endless', x, L) } : { J: j * sc, GAP: GAP * sc };
      return FF.Fair.run(L, Object.assign({ seed, from, to, t0, endless: !!def.endless }, ramp, eyes));
    }
    // the bonus worlds behind RIFT portals, at a slow and a fast pace
    const rifts = [];
    FF.RIFTS.forEach((R, i) => [[120, 0.3], [175, 0.85]].forEach(([sp, d]) => rifts.push({ id: 'rift-' + R.id + '-' + sp, en: 'Rift ' + R.id + ' ' + sp, speed: sp, d, ramp: 0, steps: [{ world: R.id }].concat(R.steps) })));
    let list = FF.CAMPAIGN.list.concat(rifts) // build 36: the Legend and the 1% challenges are gone;
    if (END) list = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ endless: true, seed: (k + SEED0 * 8) * 7919, len: LEN, id: 'endless-' + k, en: 'Endless seed ' + k, speed: 112 }));
    if (COMBO) {
      const [names, rest] = COMBO.split('@'), [sp, d] = (rest || '150:0.5').split(':').map(Number);
      list = [{ id: 'combo', en: names + ' @' + sp, speed: sp, d, ramp: 0, steps: names.split(',') }];
    }
    if (TPL) {
      list = [];
      for (const name of Object.keys(FF.Level.TEMPLATES)) {
        if (name === 'calm' || name === 'rift') continue;
        for (const [sp, d] of [[120, 0.35], [212, 1]]) list.push({ id: name + '-' + sp, en: name + ' @' + sp, speed: sp, d, ramp: 0, steps: Array(6).fill(0).flatMap(() => [name, 'calm']) });
      }
    }
    const out = [];
    for (const def of list) {
      if (ids.length && !ids.includes(def.id)) continue;
      const runs = [];
      if (LATE && def.endless) {
        // from stage 21 to the end of the book: where the run reaches the newest worlds
        const L0 = new FF.Level({ seed: def.seed, noHints: true, seen: {}, noRift: true });
        const n = L0.book.stages.length;
        for (let g = 0; L0.stX.length <= n && g < 400; g++) L0.ensure(L0.genX + 3000);
        const from = L0.stX[(LATEFROM || 23) - 1], to = (LATETO && L0.stX[LATETO]) || L0.stX[n] || L0.genX;
        def.len = to + 3000;
        for (let t = 0; t < trials; t++) { const r = humanRun(def, 1000 + t * 77, from, to, 2.1 * t); if (!r.ok) r.at = 'x' + Math.round(r.x) + ':' + r.at; runs.push(r); }
      } else if (CP && def.endless) {
        // every stage again, entered at shifted clock times (a revive, Zen or a ?stage= start lands on other phases)
        for (let x = 0, i = 0; x < def.len; x += 3000, i++) {
          for (let t = 0; t < trials; t++) {
            const r = humanRun(def, 2000 + t * 31 + i, x, Math.min(def.len, x + 3000), 3.7 * t + 1.3 * i);
            if (!r.ok) r.at = 'st' + (i + 1) + ':' + r.at;
            runs.push(r);
          }
        }
      } else if (CP) {
        const L = new FF.Level({ campaign: def, noHints: true, seen: {}, practice: !!def.legend });
        const cps = L.checkpoints.slice(1);
        cps.forEach((cx, i) => {
          for (let t = 0; t < trials; t++) {
            const r = humanRun(def, 2000 + t * 31 + i, cx, cps[i + 1] || L.finishX, 3.7 * t + 1.3 * i);
            if (!r.ok) r.at = 'cp' + (i + 1) + ':' + r.at;
            runs.push(r);
          }
        });
        if (!cps.length) runs.push({ ok: true });
      } else for (let t = 0; t < (def.viral || def.legend ? Math.max(trials, 12) : trials); t++) runs.push(humanRun(def, 1000 + t * 77));
      out.push({ id: def.id, name: def.en, pass: runs.filter((r) => r.ok).length, runs, viral: !!(def.viral || def.legend) });
    }
    return out;
  }, { ids, J, trials, GAP, CP, TPL, END, GEN, LEN, COMBO, SEED0, SIGHT, JSET, LATE, LATEFROM: +(process.env.LATE_FROM || 23), LATETO: +(process.env.LATE_TO || 0) }); // e.g. LATE_FROM=7 LATE_TO=14: stages 7..14
  let bad = 0;
  for (const r of res) {
    // 🔥 challenges are meant to be near-impossible: they only have to be beatable (a near-perfect player clears it at least once)
    const okEnough = r.viral ? r.pass >= 1 : r.pass >= Math.ceil(r.runs.length * 0.75);
    if (!okEnough) bad++;
    console.log(r.id.padEnd(7), r.name.padEnd(18), r.pass + '/' + r.runs.length, okEnough ? 'ok ' : 'HARD', r.runs.filter((x) => !x.ok).map((x) => x.cause + '@' + x.at + '%').join(' '));
  }
  console.log(bad ? bad + ' level(s) too tight for humans' : 'ALL HUMANLY FAIR', errs);
  await b.close();
})();
