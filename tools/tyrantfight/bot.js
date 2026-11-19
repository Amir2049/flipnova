// a decent player for the run-and-gun Tyrant fight: it reads the danger in each lane and flips when its lane is
// about to hurt and the other one is clearer. It reacts late (react seconds) and sometimes slips (miss), like a person.
// exported as a string to evaluate in the page: window.__bot = { step(), react, miss }
module.exports = String.raw`(function () {
  const D = FF.TyrantFight._dbg, C = D.C, F = D.F, MIDY = D.MIDY;
  const B = window.__bot = { react: 0.32, miss: 0.0, cool: 0, flips: 0 };
  function danger(lane, T) {
    const S = D.S, P = S.p, sp = Math.max(1, S.speed), y = lane === 'f' ? F - 40 : C + 40, t = S.t; let best = Infinity;
    const at = (x0, x1) => { const tE = (x0 - (P.x + 46)) / sp, tX = (x1 - (P.x - 46)) / sp; if (tX >= 0 && tE < T) best = Math.min(best, Math.max(0, tE)); };
    for (const o of S.obs) {
      if (o.gone) continue; const x = D.sx(o.wx);
      if (o.k === 'spk' && o.side === lane) at(x, x + o.n * 80);
      else if (o.k === 'wall' && o.side === lane) at(x, x + 90);
      else if (o.k === 'rock' && o.side === lane) at(x - 72, x + 72);
      else if (o.k === 'saw' && Math.abs(o.y - y) < o.r + 40 + (o.amp || 0)) at(x - o.r, x + o.r);
    }
    for (const f of S.foes) {
      if (f.k === 'lunge' && f.lane === lane && t < f.t1) best = Math.min(best, Math.max(0, f.t0 + 0.5 - t));
      else if (f.k === 'breath' && f.lane === lane && t < f.t1) best = Math.min(best, Math.max(0, f.t0 - t));
      else if (f.k === 'dash' && f.lane === lane && t < f.hitT + 0.35) best = Math.min(best, Math.max(0, f.hitT - t));
      else if ((f.k === 'wave' || f.k === 'shock') && f.lane === lane && f.x > P.x - 60) best = Math.min(best, Math.max(0, (f.x - P.x - 60) / -f.v));
      else if (f.k === 'meteor' && f.lane === lane && !f.boom) { const dt = f.land - t; if (dt < T && Math.abs(D.sx(f.wx) - sp * dt - P.x) < 130) best = Math.min(best, Math.max(0, dt)); }
      else if (f.k === 'ball') { const rx = f.x - P.x, ry = f.y - y, vv = f.vx * f.vx + f.vy * f.vy, tc = Math.max(0, Math.min(T, -(rx * f.vx + ry * f.vy) / vv)), dx = rx + f.vx * tc, dy = ry + f.vy * tc; if (Math.hypot(dx, dy) < f.r + 40) best = Math.min(best, tc); }
    }
    return best;
  }
  B.danger = danger;
  B.step = function () {
    const S = D.S; if (S && S.mode === 'clash') { if (S.t >= B.cool) { D.press(); B.cool = S.t + 1 / (B.mash || 6); } return; }
    if (!S || S.mode !== 'fight') return;
    if (S.t < B.cool) return;
    const cur = S.p.g > 0 ? 'f' : 'c', oth = cur === 'f' ? 'c' : 'f';
    const dc = danger(cur, B.react + 0.5), dO = danger(oth, B.react + 0.8);
    if (dc < B.react && dO > dc + 0.12) { if (Math.random() < B.miss) { B.cool = S.t + 0.3; return; } D.press(); B.flips++; B.cool = S.t + 0.12; }
  };
})();`;
