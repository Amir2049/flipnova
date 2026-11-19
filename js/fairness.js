// FLIPNOVA — "could a person beat this?" A planning bot that plays like a human: it reacts with up to ±J seconds of
// error, never taps faster than a person can (GAP seconds between taps) and prefers routes with comfortable spacing.
// Used by the Stage Maker's fairness check and by tools/human-test.js.
(function (FF) {
  'use strict';
  const Fair = {};
  FF.Fair = Fair;

  // anything that moves fast is planned at the real physics rate, so the bot never misreads it by a step
  const FAST = { piston: 1, orbit: 1, pend: 1, saw: 1, fball: 1, wdot: 1, bounce: 1, meteor: 1 };
  const fineDt = (p, L) => (L.near(p.x, p.x + 220).some((o) => FAST[o.t] || o.kind === 'blink') ? FF.STEP : 1 / 60);

  // like Phys.canSurvive, but a state that starts right after a flip may only flip again `gap` seconds later
  function canG(p0, L, time, horizon, depth, gap, dt) {
    const P = FF.Phys;
    const p = P.clone(p0);
    const cps = [];
    let t = 0, k = 0;
    while (t < horizon) {
      p.speed = L.speedAt(p.x);
      if (P.step(p, dt, L, time + t)) {
        if (depth <= 0) return false;
        for (let i = cps.length - 1; i >= 0; i--) {
          const c = cps[i];
          if (c.t < gap) break;
          if (L.inLock(c.p.x)) continue;
          const q = P.clone(c.p);
          P.flipState(q);
          if (canG(q, L, time + c.t, horizon - c.t, depth - 1, gap, dt)) return true;
        }
        return false;
      }
      t += dt;
      if (++k % 3 === 0) cps.push({ p: P.clone(p), t });
    }
    return true;
  }

  // o: { seed, from, to, t0, J (reaction error, s), GAP (min seconds between taps), endless (keep generating),
  //      sight (px visible ahead), react (s to react), slip (chance per tap of a bad misjudgement) — without sight the bot sees everything in the next 0.9s }
  // returns a runner; call runner.step(ms) until runner.done, then read runner.result { ok, x, at, cause, narrow }
  Fair.runner = function (L, o) {
    const P = FF.Phys;
    const J0 = o.J !== undefined ? o.J : 0.04, GAP0 = o.GAP !== undefined ? o.GAP : 0.3;
    // o.scaleAt(x): how much faster than real time the game runs there (reaction & tap spacing stretch with it)
    let J = J0, GAP = GAP0;
    const rnd = FF.mulberry32(o.seed || 1);
    let from = o.from || 0;
    if (o.endless && from > 0) { L.ensure(from + 800); from = L.chunkStarts.find((c) => c >= from) || from; } // like the game's stage starts
    const to = o.to || L.endX || L.finishX; // a book that ends: up to its finish line
    const p = { x: from, y: FF.F - 12, vy: 0, grav: 1, grounded: true, speed: L.speedAt(from) };
    const t0 = o.t0 || 0;
    let time = t0, n = 0, pending = -1, narrow = 0, lastFlip = -9;
    const H0 = 0.9;
    // like a person: plan only what is on screen (o.sight px ahead), minus the time it takes to react (o.react s)
    const horizon = () => (o.sight ? FF.clamp(o.sight / Math.max(1, p.speed) - (o.react || 0), 0.15, H0) : H0);
    const R = { done: false, result: null, from, to, p };
    const finish = (res) => { R.done = true; R.result = Object.assign({ x: p.x, at: Math.round((p.x / (L.finishX === Infinity ? to : L.finishX)) * 100), narrow }, res); };
    function tick() {
      if (o.scaleAt) { const sc = o.scaleAt(p.x); J = J0 * sc; GAP = GAP0 * sc; }
      if (o.endless) { L.ensure(p.x + 300); if ((n & 1023) === 0) L.prune(p.x - 400); }
      p.speed = L.speedAt(p.x);
      const gap = p.fly ? Math.min(GAP, 0.15) : GAP;
      if (pending >= 0 && n >= pending) { P.flipState(p); pending = -1; lastFlip = time; }
      else if (pending < 0 && (n % 3) === 0 && !L.inLock(p.x) && !P.canSurvive(p, L, time, p.fly ? Math.min(0.5, horizon()) : horizon(), 0, fineDt(p, L))) {
        // find the window of good flip moments [a, b] starting from now. Like a person, prefer a route where
        // every later tap is comfortably spaced; only if there is none, accept the minimum human gap.
        const search = (gp) => {
          let a = -1, bnd = -1;
          const q = P.clone(p);
          let tt = 0;
          for (let s = 0; s <= 26; s++) {
            const f = P.clone(q);
            P.flipState(f);
            const ok = !L.inLock(q.x) && time + tt - lastFlip >= gp && canG(f, L, time + tt, p.fly ? Math.min(0.5, horizon()) : horizon(), p.fly ? 3 : 2, gp, fineDt(q, L));
            if (ok && a < 0) a = tt;
            if (ok) bnd = tt; else if (a >= 0) break;
            for (let k = 0; k < 2; k++) { q.speed = L.speedAt(q.x); if (P.step(q, 1 / 120, L, time + tt)) { s = 99; break; } tt += 1 / 120; }
          }
          return [a, bnd];
        };
        let [a, bnd] = search(p.fly ? 0.2 : Math.max(0.45, gap * 1.5));
        if (a < 0) [a, bnd] = search(gap);
        if (a >= 0 && a <= 0.06) {
          const mid = (a + bnd) / 2;
          if (bnd - a < 2 * J) narrow++;
          // o.slip: a real person now and then reacts late (chance per tap; 0.12-0.3s too late).
          // Not in flight: there you steer by holding, not by separate taps
          // o.gauss: errors spread like a real person's (bell curve, J = one standard deviation) instead of an even ±J
          const gs = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
          const err = o.slip && !p.fly && rnd() < o.slip ? 0.12 + 0.18 * rnd() : o.gauss ? gs() * J : (rnd() * 2 - 1) * J;
          const when = Math.max(0, mid + err);
          pending = n + Math.max(0, Math.round(when * 120));
        } else if (a < 0 && time - lastFlip >= gap) { P.flipState(p); lastFlip = time; } // panic: no good window found
      }
      const r = P.step(p, FF.STEP, L, time, true);
      time += FF.STEP; n++;
      if (r) finish({ ok: false, cause: r.cause });
      else if (p.x >= to || time >= 900 + t0) finish({ ok: p.x >= to });
    }
    R.step = function (ms) {
      const end = performance.now() + ms;
      while (!R.done) {
        for (let i = 0; i < 60 && !R.done; i++) tick();
        if (performance.now() >= end) break;
      }
      return R.done;
    };
    return R;
  };
  Fair.run = function (L, o) {
    const r = Fair.runner(L, o);
    while (!r.done) r.step(1e9);
    return r.result;
  };
})(window.FF);
