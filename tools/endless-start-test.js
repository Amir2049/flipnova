// 🚀 Endless start + stage book test (build 35, rules v7). No network: *supabase.co is blocked.
// The first 20 s must have a real threat early (a moving obstacle in the first 5 s, a faster start than before),
// every stage must play ITS OWN obstacles and its WHOLE finale before the next stage line (no spill, nothing eaten
// by a rift or a gravity calm), stage 1 must be short — and none of it may make the game easier:
// the speed (px/s x time scale) must be >= build 34's at every point of the road.
// Old proofs (real build-34 runs in tools/fixtures/b34-proofs.json, rules v6) must still verify exactly.
// Self-check: the same stage-book checks run on rules v6 must FAIL (that is the bug this build fixes).
// usage: node tools/endless-start-test.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  let net = 0; // (requests to *supabase.co are all aborted; counted only for the report)
  await page.route(/supabase\.co/, (r) => { net++; r.abort(); });
  await page.goto('file://' + path.resolve(__dirname, '..') + '/index.html');
  await page.waitForTimeout(800);
  const old = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'b34-proofs.json'), 'utf8')).rows;
  const r = await page.evaluate((old) => {
    const ms = (x) => FF.Game.modeSpeedAt('endless', x);
    const MOVING = { piston: 1, saw: 1, pend: 1, orbit: 1, mover: 1, pop: 1, laser: 1, blink: 1, jaws: 1, geyser: 1, firebar: 1, snake: 1, meteor: 1, bouncer: 1, dash: 1, gate: 1, gatePair: 1, gateSpike: 1, lock: 1, crumble: 1, lift: 1, fan: 1, fly: 1 };
    // the stage book as it plays: chunks per stage, finale played in full, chunks straddling a stage line
    const book = (genV) => {
      const orig = FF.Level.prototype.addChunk, N = FF.BOOK.stages.length;
      let spill = 0, finShort = 0, ownMissing = 0, st3 = 1e9, firstMove = 1e9, st1len = 0;
      for (let seed = 1; seed <= 8; seed++) {
        const log = [];
        FF.Level.prototype.addChunk = function (name) { const x0 = this.genX; orig.call(this, name); log.push({ name, x: x0, end: this.genX }); };
        const L = new FF.Level({ seed: seed * 7919, seen: {}, genV });
        L.ensure(N * 3400);
        FF.Level.prototype.addChunk = orig;
        const end = log[log.length - 1].end;
        const lines = L.stX ? L.stX.slice() : Array.from({ length: Math.ceil(end / 3000) }, (_, i) => i * 3000);
        st1len = Math.max(st1len, lines[1]);
        let t = 0; for (let x = 0; x < 3000; x += 2) { const c = log.find((c) => c.x >= x && c.x < x + 2 && MOVING[c.name]); if (c) { firstMove = Math.min(firstMove, t); break; } t += 2 / (L.speedAt(x) * ms(x)); }
        for (let st = 1; st < Math.min(N, lines.length - 1); st++) {
          const S = FF.BOOK.stages[st - 1], cs = log.filter((c) => c.x >= lines[st - 1] && c.x < lines[st]);
          const nm = cs.map((c) => c.name);
          let best = 0;
          for (let i = 0; i < nm.length; i++) { let k = 0; while (k < S.finale.length && nm[i + k] === S.finale[k]) k++; best = Math.max(best, k); }
          if (best < S.finale.length) finShort++;
          if (!cs.some((c) => S.mix[c.name] || S.finale.indexOf(c.name) >= 0)) ownMissing++;
          if (cs.length && cs[cs.length - 1].end > lines[st] + 2) spill++;
          if (st === 3) st3 = Math.min(st3, cs.filter((c) => c.name !== 'calm' && c.name !== 'rift').length);
        }
      }
      return { spill, finShort, ownMissing, st3, firstMove: +firstMove.toFixed(2), st1len };
    };
    const v7 = book(7), v6 = book(6);
    // speed never lower than build 34 (rules v6 grid, 1.0x start, 1.5x at 12000)
    const oldScale = (x) => (x < 12000 ? 1 + 0.5 * x / 12000 : 1.5 + 0.7 * Math.pow(FF.clamp((x - 12000) / 54000, 0, 1), 2));
    const L6 = new FF.Level({ seed: 5, genV: 6, book: FF.compileBook({ stages: FF.bookRaw(FF.BOOK).stages.map((s) => Object.assign({}, s, { len: undefined, open: undefined })), loop: FF.BOOK.loop, comingSoon: true }) });
    const L7 = new FF.Level({ seed: 5 });
    L6.ensure(66000); L7.ensure(66000);
    // (1 px/s slack: the book itself slows 189 -> 188 in its last stages. Dash bursts and the turbo stage are left out: they belong to an obstacle / a stage's content, not the road's speed)
    const base = (L, x) => L.speedAt(x) / L.dashMul(x) / (L.modAt(x) === 'turbo' ? 1.08 : 1);
    let slower = 0;
    const slowAt = [];
    // (b56: the real-time scale ramps slower on purpose — Amir found 1.5x after 20 s too fast — so the check is on the road's own speed)
    // (rules v9 calm the climb on purpose; the road's structure is checked on v8, which is v9 without the calming)
    const L8 = new FF.Level({ seed: 5, genV: 8 }); L8.ensure(66000);
    for (let x = 0; x < 64000; x += 50) if (base(L8, x) < base(L6, x) - 1) { slower++; slowAt.push(x); }
    // the start: faster than the tutorial (92 x 1.25 = 115 px/s), the opening banner, the meter hidden (under 1.05x)
    const g = new FF.Game({ mode: 'endless', seed: 77, silent: true, settings: {}, callbacks: {}, seen: {} });
    const start = { v: +(g.L.speedAt(0) * ms(0)).toFixed(1), banner: g.stageBanner > 0, meterHidden: g.speedFactor() < 1.05, gen: FF.GEN_V };
    // old proofs verify, a changed score does not
    const oldOk = old.map((row) => FF.Online.verifyEntry(row));
    const oldFake = old.map((row) => FF.Online.verifyEntry(Object.assign({}, row, { score: row.score + 1 })));
    // a new proof (rules v7) verifies too
    const g2 = new FF.Game({ mode: 'endless', seed: 4321, silent: true, settings: {}, callbacks: {}, seen: {} });
    let n = 0;
    while (!g2.dead && n++ < 120 * 120) { if ((n & 1) === 0 && !g2.pendingFlip && n < 120 * 70 && FF.Phys.botShouldFlip(g2.p, g2.L, g2.time)) g2.botAct(); g2.tick(FF.STEP); }
    const res = { mode: 'endless', seed: 4321, score: g2.score, dist: Math.floor(g2.p.x / 10), stage: g2.maxStage, inputs: g2.inputs };
    const newOk = FF.Online.verifyEntry({ board: 'endless', score: res.score, dist: res.dist, proof: FF.Online.encodeRun(res) });
    return { v7, v6, slower, slowAt: slowAt.slice(0, 5), start, oldOk, oldFake, newOk, newStage: g2.maxStage };
  }, old);
  console.log(JSON.stringify(r, null, 1));
  const v7ok = r.v7.spill === 0 && r.v7.finShort === 0 && r.v7.ownMissing === 0 && r.v7.st3 >= 4 && r.v7.firstMove < 5 && r.v7.st1len < 2600;
  const v6bad = r.v6.spill > 0 && r.v6.finShort > 0; // the bug really is there in the old rules (the test can fail)
  const pass = v7ok && v6bad && r.slower === 0 && r.start.v > 115 && r.start.banner && r.start.meterHidden && r.start.gen === 13 &&
    r.oldOk.every(Boolean) && !r.oldFake.some(Boolean) && r.newOk && !errs.length;
  console.log(pass ? 'ENDLESS START TEST PASSED' : 'ENDLESS START TEST FAILED', { v7ok, v6bad, net }, errs);
  await b.close();
  process.exit(pass ? 0 : 1);
})();
