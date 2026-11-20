// FLIPNOVA — physics, hand-made challenge chunks and the fair level generator.
(function (FF) {
  'use strict';
  const C = FF.C, F = FF.F, PW = FF.PW, PH = FF.PH;

  // ---------------------------------------------------------------- physics
  const Phys = {};
  FF.Phys = Phys;

  Phys.phaseOf = (grav) => (grav > 0 ? 'b' : 'p');

  Phys.moverY = function (o, time) {
    return o.yMin + (o.yMax - o.yMin) * (0.5 + 0.5 * Math.sin((time * Math.PI * 2) / o.period + o.off));
  };

  // Laser gate: the beam alternates between the upper and lower half, always telegraphed.
  // Cycle: upper ON -> both off (gap) -> lower ON -> gap. The gap is longer than it takes to cross the beam,
  // so whatever moment you arrive, one side is always safe.
  Phys.LASER_GAP = 0.45;
  Phys.laserState = function (o, time) {
    const g = Phys.LASER_GAP, P = 2 * (o.dur + g);
    const T = (((time + o.off) % P) + P) % P;
    if (T < o.dur) return { on: 'up', next: 'down', left: o.dur + g - T, warn: o.dur + g - T < 0.5 };
    if (T < o.dur + g) return { on: null, next: 'down', left: o.dur + g - T, warn: true };
    if (T < 2 * o.dur + g) return { on: 'down', next: 'up', left: P - T, warn: P - T < 0.5 };
    return { on: null, next: 'up', left: P - T, warn: true };
  };

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  Phys.overlap = overlap;

  // ---- time-driven objects (all pure functions of time: predictable, readable, bot-checkable)
  const TAU = Math.PI * 2;
  const wave = (time, period, off) => 0.5 - 0.5 * Math.cos(((time / period) + (off || 0)) * TAU);
  Phys.liftY = (o, time) => o.yA + (o.yB - o.yA) * wave(time, o.period, o.off);
  Phys.blinkOn = (o, time) => ((((time / o.period) + o.off) % 1) + 1) % 1 < 0.55;
  Phys.blinkWarn = (o, time) => { const f = ((((time / o.period) + o.off) % 1) + 1) % 1; return f > 0.4 && f < 0.55; };
  Phys.popOut = (o, time) => ((((time / o.period) + o.off) % 1) + 1) % 1 > 1 - (o.duty || 0.5);
  Phys.popWarn = (o, time) => { const f = ((((time / o.period) + o.off) % 1) + 1) % 1, s = 1 - (o.duty || 0.5); return f > s - 0.2 && f <= s; };
  Phys.sawX = (o, time) => o.x0 + (o.x1 - o.x0) * wave(time, o.period, o.off);
  Phys.orbitPos = (o, time) => { const a = (time / o.period + o.off) * TAU * o.dir; return [o.cx + Math.cos(a) * o.r, o.cy + Math.sin(a) * o.r]; };
  Phys.pendPos = (o, time) => { const th = o.amp * Math.sin((time / o.period + o.off) * TAU); return [o.px + Math.sin(th) * o.len, C + Math.cos(th) * o.len]; };
  // NEW: firebar balls (one object per ball, all on the same rotating arm), snake orbs, meteors, bouncers
  Phys.fbarPos = (o, time) => { const a = (time / o.period + o.off) * TAU * o.dir; return [o.cx + Math.cos(a) * o.r, FF.MID + Math.sin(a) * o.r]; };
  Phys.waveY = (o, time) => (o.cy == null ? FF.MID : o.cy) + o.amp * Math.sin((time / o.period + o.ph) * TAU);
  const tri = (u) => { const f = ((u % 1) + 1) % 1; return f < 0.5 ? f * 2 : 2 - f * 2; };
  Phys.bouncePos = (o, time) => [o.x0 + (o.x1 - o.x0) * tri(time / o.px + o.off), C + 5 + (F - C - 10) * tri(time / o.py + o.off * 1.7)];
  Phys.METEOR_H = 14;
  Phys.CRUMBLE_T = 0.8;
  // Pistons / jaws / geysers: rest, glow (warning), SLAM out fast, hold, pull back in. Extension 0..1.
  const cyc = (o, time) => ((((time / o.period) + o.off) % 1) + 1) % 1;
  Phys.pistonExt = (o, time) => {
    const f = cyc(o, time), s = 1 - o.duty;
    if (f < s) return 0;
    const u = (f - s) / o.duty;
    return Math.min(1, u / 0.14, (1 - u) / 0.22);
  };
  Phys.pistonWarn = (o, time) => { const f = cyc(o, time), s = 1 - o.duty; return f > s - 0.2 && f <= s; };
  // a meteor: hidden in the ceiling, warns (red column), slams down to the floor, then climbs back
  Phys.meteorY = (o, time) => C - Phys.METEOR_H + Phys.pistonExt(o, time) * (F - C);
  Phys.pistonRect = (o, time) => {
    const len = Math.round(o.reach * Phys.pistonExt(o, time));
    if (len < 8) return null; // the first few pixels of the slam never kill (forgiving, like the art's glow)
    // the trailing edge is extra forgiving: if you're nearly past when it fires, you make it
    return o.side === 'floor' ? [o.x + 3, F - len, o.w - 10, len] : [o.x + 3, C, o.w - 10, len];
  };

  Phys.solidActive = (o, phase, time) => {
    if (o.t !== 'solid' || o.ghost) return false;
    if (o.phase && o.phase !== phase) return false;
    if (o.kind === 'blink') return Phys.blinkOn(o, time);
    if (o.kind === 'crumble') return o.touchT === undefined || time - o.touchT < Phys.CRUMBLE_T;
    return true;
  };

  // Returns hazard rect (already forgiving) or null.
  Phys.hazardRect = function (o, time) {
    switch (o.t) {
      case 'spike': return o.dir === 'up' ? [o.x + 2, o.y - 6, o.w - 4, 6] : [o.x + 2, o.y, o.w - 4, 6];
      case 'mover': return [o.x + 1, Phys.moverY(o, time) + 1, o.w - 2, o.h - 2];
      case 'laser': {
        const s = Phys.laserState(o, time);
        if (s.on === 'up') return [o.x + 1, C, 2, FF.MID - C];
        if (s.on === 'down') return [o.x + 1, FF.MID, 2, F - FF.MID];
        return null;
      }
      case 'pop': return Phys.popOut(o, time) ? (o.side === 'floor' ? [o.x + 2, F - 6, o.w - 7, 6] : [o.x + 2, C, o.w - 7, 6]) : null; // forgiving trailing edge
      case 'saw': { const x = Phys.sawX(o, time); return [x - 5, (o.side === 'floor' ? F - 6 : C + 6) - 5, 10, 10]; }
      case 'orbit': { const q = Phys.orbitPos(o, time); return [q[0] - 3, q[1] - 3, 6, 6]; }
      case 'pend': { const q = Phys.pendPos(o, time); return [q[0] - 5, q[1] - 5, 10, 10]; }
      case 'hblock': return o.look ? (o.side === 'top' ? [o.x + 2, o.y, o.w - 4, 6] : [o.x + 2, o.y + o.h - 6, o.w - 4, 6]) : [o.x + 1, o.y + 1, o.w - 2, o.h - 2]; // (b59: the beat looks hurt exactly like spikes)
      case 'piston': return Phys.pistonRect(o, time);
      case 'fball': { const q = Phys.fbarPos(o, time); return [q[0] - 3, q[1] - 3, 6, 6]; }
      case 'wdot': { const y = Phys.waveY(o, time); return [o.x + 1, y - 3, 5, 6]; }
      case 'bounce': { const q = Phys.bouncePos(o, time); return [q[0] - 3, q[1] - 3, 7, 7]; }
      case 'meteor': {
        const y = Phys.meteorY(o, time), h = Phys.METEOR_H;
        if (y <= C + PH + 2) return null; // in or near the ceiling: the ceiling lane is never hit
        return [o.x + 2, Math.max(C, y) + 1, o.w - 4, Math.min(h, y + h - C) - 2];
      }
    }
    return null;
  };

  // One fixed physics step. p = {x,y,vy,grav,grounded,speed}. Returns null or a death cause object.
  // `real` is true only for the live game (so simulations never trigger crumbling platforms).
  Phys.step = function (p, dt, L, time, real) {
    const phase = Phys.phaseOf(p.grav);
    const prevX = p.x;
    // b61 WIND (SANDSTORM world): a tailwind carries you faster, a headwind holds you back — only inside its zone
    p.x += p.speed * dt * (L.winds ? L.windAt(p.x + PW / 2) : 1);
    const near = L.near(p.x - 60, p.x + 60);
    for (let i = 0; i < near.length; i++) if (near[i].kind === 'lift') near[i].y = Phys.liftY(near[i], time);

    // horizontal: running into the front of a solid = crash (small step-up forgiveness)
    for (let i = 0; i < near.length; i++) {
      const s = near[i];
      if (!Phys.solidActive(s, phase, time)) continue;
      if (!overlap(p.x, p.y, PW, PH, s.x, s.y, s.w, s.h)) continue;
      const penDown = p.y + PH - s.y;
      const penUp = s.y + s.h - p.y;
      if (penDown <= 3) p.y = s.y - PH;
      else if (penUp <= 3) p.y = s.y + s.h;
      // thin platforms (catch, lift, crumble, shelf…) never kill from the edge: you slide to the nearer side
      else if (s.h <= 8) p.y = penDown <= penUp ? s.y - PH : s.y + s.h;
      else return { cause: s.kind === 'wall' ? 'wall_' + s.phase : s.kind || 'block', obj: s };
    }

    // flight portals: in fly mode you hold to rise and let go to fall
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      if ((o.t === 'flyIn' || o.t === 'flyOut') && p.x + PW > o.x && p.lastPortal !== o.x) {
        p.lastPortal = o.x;
        p.fly = o.t === 'flyIn';
        p.thrust = false;
        p.grav = 1;
        p.portal = o.t;
      }
    }

    // b61 TOTEMS (JUNGLE RUINS world): passing one flips your gravity for free — read where it throws you
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      if (o.t === 'totem' && !p.fly && prevX + PW / 2 < o.x && p.x + PW / 2 >= o.x) { Phys.flipState(p); p.padFlip = true; }
    }

    // vertical (+ fans pushing air)
    const prevY = p.y;
    let acc = p.fly ? (p.thrust ? -Phys.FLY_ACC : Phys.FLY_ACC) : FF.G * p.grav * (L.gravAt ? L.gravAt(p.x) : 1);
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      if (o.t === 'fan' && p.x + PW > o.x && p.x < o.x + o.w) acc += o.side === 'floor' ? -3700 : 3700;
      // b59 gravity FIELDS: FLOAT (weak gravity, slow floaty flips) and HEAVY (strong gravity, snappy flips)
      if (o.t === 'field' && !p.fly && p.x + PW / 2 > o.x && p.x + PW / 2 < o.x + o.w) acc *= o.mul;
    }
    p.vy += acc * dt;
    const vmax = p.fly ? Phys.FLY_MAXV : FF.MAXV;
    if (p.vy > vmax) p.vy = vmax;
    if (p.vy < -vmax) p.vy = -vmax;
    p.y += p.vy * dt;
    p.grounded = false;
    if (p.y + PH >= F) {
      p.y = F - PH;
      if (p.vy > 0) p.vy = 0;
      if (p.grav > 0) p.grounded = true;
    }
    if (p.y <= C) {
      p.y = C;
      if (p.vy < 0) p.vy = 0;
      if (p.grav < 0) p.grounded = true;
    }
    for (let i = 0; i < near.length; i++) {
      const s = near[i];
      if (!Phys.solidActive(s, phase, time)) continue;
      if (!overlap(p.x, p.y, PW, PH, s.x, s.y, s.w, s.h)) continue;
      let ground = false;
      if (prevY + PH <= s.y + 1.5 || (p.y + PH / 2 < s.y + s.h / 2 && p.vy >= 0)) {
        p.y = s.y - PH;
        if (p.vy > 0) p.vy = 0;
        if (p.grav > 0) ground = true;
      } else {
        p.y = s.y + s.h;
        if (p.vy < 0) p.vy = 0;
        if (p.grav < 0) ground = true;
      }
      if (ground) {
        p.grounded = true;
        if (real && s.kind === 'crumble' && s.touchT === undefined) s.touchT = time;
      }
    }

    // flip pads (on the surface) and bumpers (floating springs) flip you for free
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      if (o.t === 'pad' && p.grounded) {
        const onIt = o.side === 'floor' ? p.grav > 0 && p.y + PH >= F - 0.5 : p.grav < 0 && p.y <= C + 0.5;
        if (onIt && p.x + PW > o.x + 2 && p.x < o.x + o.w - 2) {
          Phys.flipState(p);
          p.vy = p.grav * 200;
          p.padFlip = true;
          break;
        }
      } else if (o.t === 'bumper' && p.lastBump !== o.x && overlap(p.x, p.y, PW, PH, o.x, o.y, o.w, o.h)) {
        p.lastBump = o.x;
        Phys.flipState(p);
        p.vy = p.grav * 240;
        p.padFlip = true;
        break;
      }
    }

    // hazards (player hitbox inset by 1px — fair, never stricter than the art)
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      const r = Phys.hazardRect(o, time);
      if (!r) continue;
      if (overlap(p.x + 1, p.y + 1, PW - 2, PH - 2, r[0], r[1], r[2], r[3])) {
        let cause = o.t;
        if (o.t === 'spike') cause = o.y === F ? 'spike_floor' : o.y === C ? 'spike_ceil' : 'spike_slab';
        else if (o.t === 'hblock' && o.look) cause = o.side === 'bottom' ? 'look_floor' : 'look_ceil'; // b66: the b59 ground looks (block, mace, crystal, ember) are not the flight tunnel
        return { cause, obj: o };
      }
    }
    return null;
  };

  Phys.FLY_ACC = 950;   // gentle: easy to hover and steer
  Phys.FLY_MAXV = 150;
  Phys.flipState = function (p) {
    if (p.fly) { p.thrust = !p.thrust; return; } // in flight a "flip" toggles the thruster
    p.grav = -p.grav;
    if (p.grounded) p.vy = p.grav * FF.FLIP_KICK;
    p.grounded = false;
  };

  Phys.clone = (p) => ({ x: p.x, y: p.y, vy: p.vy, grav: p.grav, grounded: p.grounded, speed: p.speed, lastBump: p.lastBump, fly: p.fly, thrust: p.thrust, lastPortal: p.lastPortal });
  Phys.isHazard = (o) => ['spike', 'mover', 'laser', 'pop', 'saw', 'orbit', 'pend', 'hblock', 'piston', 'fball', 'wdot', 'bounce', 'meteor'].includes(o.t);

  // Simulate without input. Returns seconds until death, or null if alive for `horizon` seconds.
  Phys.timeToDeath = function (p0, L, time, horizon, dt) {
    dt = dt || 1 / 240;
    const p = Phys.clone(p0);
    let t = 0;
    while (t < horizon) {
      p.speed = L.speedAt(p.x);
      if (Phys.step(p, dt, L, time + t)) return t;
      t += dt;
    }
    return null;
  };

  // Small planner: can the runner survive `horizon` seconds using at most `depth` extra flips?
  // Used by the attract-mode demo and by the automated fairness tests.
  Phys.canSurvive = function (p0, L, time, horizon, depth, dt) {
    dt = dt || 1 / 60;
    const p = Phys.clone(p0);
    const checkpoints = [];
    let t = 0, k = 0;
    while (t < horizon) {
      p.speed = L.speedAt(p.x);
      if (Phys.step(p, dt, L, time + t)) {
        if (depth <= 0) return false;
        for (let i = checkpoints.length - 1; i >= 0; i--) {
          const c = checkpoints[i];
          if (L.inLock(c.p.x)) continue;
          const q = Phys.clone(c.p);
          Phys.flipState(q);
          if (Phys.canSurvive(q, L, time + c.t, horizon - c.t, depth - 1, dt)) return true;
        }
        return false;
      }
      t += dt;
      if (++k % 3 === 0) checkpoints.push({ p: Phys.clone(p), t });
    }
    return true;
  };

  // Decide whether a bot should flip right now.
  // Flight autopilot for bots: steer towards the middle of the tunnel just ahead.
  Phys.flyWantsThrust = function (p, L) {
    const x0 = p.x + 4, x1 = p.x + 60;
    let sum = 0, n = 0, top = C, bot = F;
    for (const o of L.near(x0, x1)) {
      if (o.t !== 'hblock') continue;
      if (o.side === 'top') top = Math.max(top, o.y + o.h); else bot = Math.min(bot, o.y);
      sum += o.side === 'top' ? o.y + o.h : o.y;
      n++;
    }
    const target = n ? (top + bot) / 2 : FF.MID;
    const pred = p.y + PH / 2 + p.vy * 0.14;
    return pred > target;
  };
  Phys.botShouldFlip = function (p, L, time) {
    if (p.fly) return Phys.flyWantsThrust(p, L) !== !!p.thrust;
    if (L.inLock(p.x)) return false;
    const H = p.fly ? 0.55 : 0.9, D = p.fly ? 3 : 2;
    // fast things (pistons, and spinning hazards at high speed): plan at the real physics rate so the bot never misjudges by a pixel
    const fine = L.near(p.x, p.x + 220).some((o) => o.t === 'piston' || o.t === 'meteor' || o.t === 'fball' || o.t === 'bounce' || o.t === 'wdot' || (p.speed > 165 && (o.t === 'orbit' || o.t === 'pend' || o.t === 'saw' || o.kind === 'blink'))) ? FF.STEP : undefined;
    if (Phys.canSurvive(p, L, time, H, 0, fine)) return false; // nothing to do yet
    if (Phys.canSurvive(p, L, time, H, D, fine)) return false; // a later flip still works: wait (timing!)
    return true; // now is the moment
  };

  // ---------------------------------------------------------------- level
  function Level(opts) {
    this.opts = opts || {};
    this.rng = FF.mulberry32(this.opts.seed || 1);
    this.objs = [];
    this.genX = 0;
    this.groupId = 0;
    this.lastName = '';
    this.sinceCalm = 0;
    this.chunkStarts = [0];
    this.script = this.opts.script ? this.opts.script.slice() : null;
    this.finishX = Infinity;
    this.fixedSpeed = this.opts.speed || 0;
    this.gen = FF.GEN[this.opts.genV] || FF.GEN[FF.GEN_V];
    this.book = this.opts.book || FF.BOOK; // a Stage Maker draft can be played without touching the live book
    if (this.gen.book && (this.opts.campaign || this.opts.script || this.opts.custom)) this.gen = FF.GEN[4]; // hand-made levels never use the stage book
    // a book that ends: the finish line sits at the end of its last stage
    this.endX = this.gen.book && this.book.comingSoon && !this.opts.campaign && !this.opts.script && !this.opts.custom ? this.book.stages.length * Level.STAGE_LEN : 0;
    if (this.gen.lens && !this.opts.campaign && !this.opts.script && !this.opts.custom) { this.stX = [0]; this.endsV7 = !!this.endX; this.endX = 0; }
    this.seen = this.opts.seen || {};
    this.stageMods = {};
    // 🎲 build 35: the weekly TWIST / the Daily REMIX (FF.weekTwist / FF.dailyRemix) — book roads only
    this.fx = !!(this.opts.twist || this.opts.remix) && !!this.gen.book && !this.opts.campaign && !this.opts.script && !this.opts.custom;
    this.twist = this.fx ? this.opts.twist || null : null;
    this.remix = this.fx ? this.opts.remix || null : null;
    // a twist / remix road is its own road: the same seed played without the twist never reproduces it, so a run
    // made by an old build (or by a cheat that drops the darkness) can't pass as a twist run
    if (this.fx) this.rng = FF.mulberry32(((this.opts.seed || 1) ^ (this.twist ? 0x7715 : 0x2e31)) >>> 0 || 1);
    this.runMod = this.twist === 'lowgrav' ? 'lowgrav' : this.remix && ['heavy', 'tight', 'turbo'].indexOf(this.remix.mod) >= 0 ? this.remix.mod : null;
    if (this.opts.campaign) {
      // two passes: measure the level, then build it again with the speed ramping up along its length
      if (!this.opts.noRamp) {
        const probe = new Level(Object.assign({}, this.opts, { noRamp: true, seen: {}, noHints: true }));
        this.rampLen = probe.finishX;
        this.rampAmt = this.opts.campaign.ramp !== undefined ? this.opts.campaign.ramp : 0.25;
      }
      this.buildCampaign(this.opts.campaign);
      return;
    }
    if (this.opts.custom) {
      // a player-made level: fixed objects, fixed speed, finish line
      const c = this.opts.custom;
      this.objs = FF.levelObjects(c);
      this.dashes = this.objs.filter((o) => o.t === 'dash');
      this.coinTotal = this.objs.filter((o) => o.t === 'coin').length;
      this.fixedSpeed = c.speed || 120;
      this.finishX = c.len;
      this.genX = Infinity;
      this.chunkStarts = [0];
      for (let x = 400; x < c.len; x += 400) this.chunkStarts.push(x);
      return;
    }
    this.addStart();
  }
  FF.Level = Level;

  // ---- how Endless/Daily ramp up. Every replay proof remembers which version it was made with,
  // so older runs are re-played with the rules they were played under (the world board keeps them).
  FF.GEN = {
    3: { v0: 104, step: 10, steps: 9, cap: 214, dLen: 26000, gap: 26, calm: 0.12, stretch: false },
    4: { v0: 112, step: 11, steps: 8, cap: 212, dLen: 18000, gap: 26, calm: 0.07, stretch: true }, // faster from the start, harder sooner, fewer breathers
    5: { gap: 26, stretch: true, book: true }, // every stage comes from the stage book (js/stages.js)
    6: { gap: 26, stretch: true, book: true, smooth: true }, // …and the speed climbs all the way through each stage
    // v7: every stage has its own length (book `len`, stage 1 is short), a scripted opening (book `open`), and a stage only
    // ends when its finale has played — the finale never spills into the next stage and nothing (rift, gravity calm) eats it
    7: { gap: 26, stretch: true, book: true, smooth: true, lens: true },
    // v8 (17 Nov review: 56% of a run asked for no tap): spike groups often come in pairs on BOTH surfaces, so
    // whichever side you're on you have to act; calm stretches split their coins across both sides (optional tap)
    8: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true },
    // v9 (b56, Amir: 'too fast, 1.5x after 20 s'): every stage still faster than the one before, by about half as much
    9: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true, damp: 0.75, full: true },
    // v10 (b60, Amir: 'world 1 is far too long'): v9's finale played EVERY obstacle + 3 guests, so stage 1 ran 72 s
    // instead of the book's ~27 s. Now each stage keeps its book length and its own finale; the whole family and the
    // guests are shown in the stage's BODY instead (the picks that used to be random), so the variety stays
    10: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true, damp: 0.75, full: true, fit: true },
    // v11 (b61, Amir: 'I don't want fewer taps'): short beats are 5-7 taps instead of 4-6 (+ the three new worlds' obstacles)
    11: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true, damp: 0.75, full: true, fit: true, taps: true },
    // v12 (b62): stages 9-22 ran at the top game speed (2.2x) with taps ~0.3 s apart — the human bot failed them since b60.
    // The cause: the top speed was designed for 'the end of stage 22' (22 x 3000 px), but stages grew longer, so it
    // arrived around stage 9. v12 puts it back at about the end of stage 22 (topX), and the late-speed tap stretch
    // applies to every stage (wide). The start (first 20000 px) is exactly as before; the top speed is the same.
    12: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true, damp: 0.75, full: true, fit: true, taps: true, wide: true, topX: 180000 },
    // v13 (b64, Amir: 'the second part is a bit boring'): v12 stretched so much that taps/min stayed flat (~58) after
    // minute 2 — no build-up. Now the top speed comes at ~stage 15 and the stretch is gentler, so the pace keeps climbing
    13: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true, damp: 0.75, full: true, fit: true, taps: true, wide: true, topX: 120000, tfPow: 0.6 },
    // v14 (b66, "make one tap more fun"): v13's road + CLOSE SHAVE coins (x3) right before every 3rd spike group,
    // and (Amir: 'too many shapes do what spikes do') spikes are 2 of every 3 hazard groups instead of 1 in 5
    14: { gap: 26, stretch: true, book: true, smooth: true, lens: true, dense: true, damp: 0.75, full: true, fit: true, taps: true, wide: true, topX: 120000, tfPow: 0.6, risk: true, spiky: true }
  };
  FF.GEN_V = 14;
  // ---- endless growth: stages every 300m, each one can bring a twist
  Level.STAGE_LEN = 3000; // a new stage (and a new world) every 300m
  Level.MODS = ['none', 'lowgrav', 'heavy', 'turbo', 'goldrush', 'tight'];
  Level.prototype.stageAt = function (x) {
    if (this.stX) return this.stageAtV7(x);
    return Math.floor(Math.max(0, x) / Level.STAGE_LEN) + 1;
  };
  // ---- rules v7: stage lines are decided while the road is built (this.stX[i] = where stage i+1 starts).
  // Behind the build point (genX) the answer is final; ahead of it, stages are guessed from their book lengths.
  Level.prototype.stageLen = function (st) {
    return this.stageDefN(st).s.len || Level.STAGE_LEN;
  };
  Level.prototype.stageAtV7 = function (x) {
    const s = this.stX, n = s.length;
    x = Math.max(0, x);
    let i = n - 1;
    while (i > 0 && x < s[i]) i--;
    if (i < n - 1) return i + 1; // a closed stage: final
    // the open (last) stage runs at least to the build point; past that, guess from the book lengths
    let st = n, e = Math.max(s[n - 1] + this.stageLen(n), this.genX === Infinity ? 0 : this.genX);
    while (x > e && st < 9999) { st++; e += this.stageLen(st); }
    return st;
  };
  Level.prototype.stageX0 = function (st) {
    const s = this.stX;
    if (st <= s.length) return s[Math.max(0, st - 1)];
    let n = s.length, e = Math.max(s[n - 1] + this.stageLen(n), this.genX === Infinity ? 0 : this.genX);
    while (++n < st) e += this.stageLen(n);
    return e;
  };
  // where the open stage should end: on the fixed grid, so a long finale in one stage never pushes all later
  // stages back (the next stage just gets less mix before its own finale) — but never less than 40% of its length
  Level.prototype.stageEnd = function (st) {
    const g = this.nomGrid || (this.nomGrid = [0]);
    while (g.length <= st) g.push(g[g.length - 1] + this.stageLen(g.length));
    return Math.max(this.stX[st - 1] + 0.4 * this.stageLen(st), g[st]);
  };
  Level.prototype.nominalAt = function (x) {
    const g = this.nomGrid || (this.nomGrid = [0]);
    while (g[g.length - 1] <= x && g.length < 20000) g.push(g[g.length - 1] + this.stageLen(g.length));
    let i = g.length - 2;
    while (i > 0 && x < g[i]) i--;
    return { st: i + 1, x0: g[i], len: g[i + 1] - g[i] };
  };
  // where stage `st` really starts (builds the road far enough to know)
  Level.prototype.stageStartX = function (st) {
    if (!this.stX) return (st - 1) * Level.STAGE_LEN;
    let guard = 0;
    while (this.stX.length < st && this.genX !== Infinity && guard++ < 4000) this.ensure(this.genX + 200);
    return this.stX[Math.min(st, this.stX.length) - 1];
  };
  // a position given in old 3000-px-per-stage units (?stage=N, the owner's start stage) → the same spot of the real stage
  Level.prototype.fromNominal = function (x) {
    if (!this.stX || x <= 0) return x;
    const SL = Level.STAGE_LEN, st = Math.floor(x / SL) + 1, into = x - (st - 1) * SL;
    const a = this.stageStartX(st), b = this.stageStartX(st + 1);
    return b > a ? Math.round(a + (b - a) * into / SL) : a + into;
  };
  // called before every chunk: closes the open stage once its finale (and the calm before a gravity change) has played
  Level.prototype.stageLine = function () {
    const st = this.stX.length, s0 = this.stX[st - 1], S = this.fx ? this.fxStage(st) : this.stageDef(this.genX);
    if (this.finaleQ && this.finaleQ.length) return;
    const fin = S.finale.length ? !!(this.finaleAt && this.finaleAt[st]) : this.genX >= this.stageEnd(st);
    if (!fin) return;
    const next = this.stageDefN(st + 1).s;
    const gNext = next.mod === 'lowgrav' ? 0.72 : next.mod === 'heavy' ? 1.3 : 1;
    if (gNext !== this.gravAt(this.genX) && this.endCalm !== st) { this.endCalm = st; this.wantCalm = 1; return; } // land before gravity flips
    if (this.wantCalm) return;
    this.stX.push(this.genX);
    if (this.endsV7 && this.stX.length > this.book.stages.length) this.endX = this.genX;
  };
  Level.prototype.modAt = function (x) {
    if (this.opts.script || this.opts.custom || this.opts.campaign || this.opts.noMods) return 'none';
    if (this.gen.book) { const m = this.stageDef(x).mod; return m === 'none' && this.runMod ? this.runMod : m; }
    const st = this.stageAt(x);
    if (st < 3) return 'none';
    if (this.stageMods[st] === undefined) {
      const r = FF.mulberry32((this.opts.seed || 1) * 31 + st * 977);
      this.stageMods[st] = r() < 0.25 ? 'none' : Level.MODS[1 + Math.floor(r() * (Level.MODS.length - 1))];
    }
    return this.stageMods[st];
  };
  Level.prototype.gravAt = function (x) {
    const m = this.modAt(x);
    return m === 'lowgrav' ? 0.72 : m === 'heavy' ? 1.3 : 1;
  };
  // Dash gates: a speed burst for the next stretch (by position, so it's predictable)
  Level.prototype.dashMul = function (x) {
    const ds = this.dashes;
    if (!ds) return 1;
    for (let i = ds.length - 1; i >= 0; i--) {
      const o = ds[i];
      if (x >= o.x && x < o.x + o.len) return 1 + 0.5 * Math.min(1, (o.x + o.len - x) / 60);
    }
    return 1;
  };
  Level.prototype.rampMul = function (x) {
    return this.rampLen ? 1 + this.rampAmt * FF.clamp(x / this.rampLen, 0, 1) : 1;
  };
  Level.prototype.speedAt = function (x) {
    if (this.speedMarks) {
      let v = this.speedMarks[0].v;
      for (const m of this.speedMarks) if (x >= m.x) v = m.v;
      return v * this.dashMul(x) * this.rampMul(x);
    }
    if (this.fixedSpeed) return this.fixedSpeed * this.dashMul(x) * this.rampMul(x);
    x = Math.max(0, x);
    if (this.gen.book) {
      // eased up to the stage's speed over the first 300px, then a slow creep (+4) inside the stage
      // v7: the speed climbs on a fixed grid of the book lengths (stage 1 is short, so it is never slower than before at
      // any point of the road); what a stage plays (name, mix, finale, gravity) follows the real stage lines
      let st, into, SLx = Level.STAGE_LEN;
      if (this.stX) { const g = this.nominalAt(x); st = g.st; into = x - g.x0; SLx = g.len; } else { st = this.stageAt(x); into = x - (st - 1) * Level.STAGE_LEN; }
      const cur = this.bookSpeed(st), cur0 = this.bookSpeed(1);
      let v;
      if (this.gen.smooth) {
        // a steady climb from this stage's speed to the next one's: you feel it speed up every second
        const last = this.book.comingSoon && st >= this.book.stages.length;
        const next = last ? cur + 4 : this.bookSpeed(st + 1);
        v = Math.min(this.book.loop.cap, cur + (next - cur) * FF.clamp(into / SLx, 0, 1));
      } else {
        const start = st > 1 ? this.bookSpeed(st - 1) + 4 : cur;
        v = Math.min(this.book.loop.cap, start + (cur - start) * FF.clamp(into / 300, 0, 1) + 4 * (into / Level.STAGE_LEN));
      }
      if (this.gen.damp) v = cur0 + (v - cur0) * this.gen.damp; // (v9: a gentler climb from the first stage's speed)
      if (this.modAt(x) === 'turbo') v = Math.min(v * 1.08, 220);
      if (this.twist === 'burst') { const b = this.burstAt(x); if (b > 0) v = Math.max(v, Math.min(v * (1 + 0.3 * b), Level.BURST_CAP)); }
      return v * this.dashMul(x);
    }
    // every stage is a clear step up (eased in over 300px) plus a slow creep inside it:
    // 112 → 123 (300m) → 134 → … → 200 (2.4km), then +2 per stage up to 212
    const G = this.gen, SL = Level.STAGE_LEN, st = Math.floor(x / SL);
    const base = (i) => G.v0 + G.step * Math.min(i, G.steps) + 2 * Math.max(0, i - G.steps);
    const into = x - st * SL;
    let v = base(Math.max(0, st - 1)) + (base(st) - base(Math.max(0, st - 1))) * FF.clamp(into / 300, 0, 1) + 5 * (into / SL);
    v = Math.min(v, G.cap);
    if (this.modAt(x) === 'turbo') v = Math.min(v * 1.08, 220);
    return v * this.dashMul(x);
  };
  // extra intensity beyond max difficulty (0..1): fewer breathers, tighter chunk spacing
  Level.prototype.overdrive = function (x) {
    if (this.gen.book) return FF.clamp(this.stageDef(x).lap * 0.25, 0, 1);
    return FF.clamp((x - this.gen.dLen) / 30000, 0, 1);
  };
  Level.prototype.difficulty = function (x) {
    if (this.gen.book) return this.stageDef(x).hard;
    return FF.clamp(x / this.gen.dLen, 0, 1);
  };

  // b66: the "all coins" star — every plain coin, plus one whole lane of every fork (a fork's lanes are split by a solid
  // slab, so a deathless run can only take one). got = { '': plain taken, 'f3r': risky lane of fork f3 taken, ... }
  Level.prototype.allCoins = function (got) {
    const sets = this.coinSets || {};
    if ((got[''] || 0) < (sets[''] || 0)) return false;
    const forks = {};
    for (const k in sets) if (k) (forks[k.slice(0, -1)] || (forks[k.slice(0, -1)] = [])).push(k);
    return Object.values(forks).every((ks) => ks.some((k) => (got[k] || 0) >= sets[k]));
  };
  Level.prototype.add = function (o) {
    if (o.w === undefined) o.w = 0;
    if (o.t === 'coin') {
      this.coinTotal = (this.coinTotal || 0) + 1;
      // b66: a fork's two lanes can't both be run without dying, so for the "all coins" star each fork counts one lane
      const ck = o.fork ? o.fork + o.lane : '';
      const cs = this.coinSets || (this.coinSets = {});
      cs[ck] = (cs[ck] || 0) + 1;
    }
    if (o.t === 'dash') (this.dashes || (this.dashes = [])).push(o);
    if (o.t === 'wind') (this.winds || (this.winds = [])).push(o);
    this.objs.push(o);
    return o;
  };

  Level.prototype.near = function (x0, x1) {
    const out = [];
    const a = this.objs;
    for (let i = 0; i < a.length; i++) {
      const o = a[i];
      if (o.x <= x1 && o.x + o.w >= x0) out.push(o);
    }
    return out;
  };

  // v11: Endless runs up to 2.2x game speed late in the book, which squeezed a beat's taps to ~0.3 s apart (the
  // human-test bot failed stages 21+ even in b60). Above game speed 1.5x, tap spacings stretch faster than the game
  // speed grows (measured: stretching only in step with it still failed every late seed). Up to 1.5x nothing changes.
  Level.prototype.tf = function (x) {
    if (!this.gen.taps || this.opts.script || this.opts.campaign || !this.stX || !this.book) return 1;
    if (!this.gen.wide && !this.stageDef(x).roomy) return 1; // (only stages marked roomy — the three new worlds; the original 22 stay as they are)
    const s = FF.Game && FF.Game.modeSpeedAt ? FF.Game.modeSpeedAt('endless', x, this) : 1;
    return Math.max(1, Math.pow(s / 1.5, FF.TF_POW || this.gen.tfPow || 1.6)); // (1 up to 1.5x; 1.34 at 1.8x; 1.85 at 2.2x)
  };
  Level.prototype.tfIn = function (x) { return this.tf(x); };
  Level.prototype.windAt = function (x) {
    const a = this.winds;
    for (let i = a.length - 1; i >= 0; i--) if (x > a[i].x && x < a[i].x + a[i].w) return a[i].mul;
    return 1;
  };

  Level.prototype.inLock = function (x) {
    const a = this.objs;
    for (let i = 0; i < a.length; i++) {
      const o = a[i];
      if (o.t === 'lock' && x + PW > o.x && x < o.x + o.w) return true;
    }
    return false;
  };

  Level.prototype.prune = function (x) {
    if (this.winds) this.winds = this.winds.filter((o) => o.x + o.w > x - 80);
    this.objs = this.objs.filter((o) => o.x + o.w > x - 80 || o.t === 'finish');
  };

  Level.prototype.ensure = function (x) {
    if (this.opts.custom || this.opts.campaign) return;
    while (this.genX < x + 420) {
      if (this.script) {
        if (!this.script.length) {
          if (this.finishX === Infinity) {
            this.finishX = this.genX + 30;
            this.add({ t: 'finish', x: this.finishX, w: 4 });
          }
          this.genX += 400;
          continue;
        }
        this.addChunk(this.script.shift());
      } else if (this.stX && (this.stageLine(), false)) {
        // (v7 stage lines)
      } else if (this.endX && this.genX >= this.endX) {
        if (this.finishX === Infinity) { this.finishX = this.endX; this.add({ t: 'finish', x: this.endX, w: 4 }); }
        this.genX = Infinity;
      } else {
        this.addChunk(this.pickChunk());
      }
    }
  };

  Level.prototype.addStart = function () {
    this.add({ t: 'hint', x: 30, key: 'tap', w: 0 });
    const g = ++this.groupId;
    const dn = this.gen.dense && !this.opts.short;
    for (let i = 0; i < 5; i++) this.add({ t: 'coin', x: (dn ? 70 : 130) + i * 14, y: F - 6, group: g });
    if (dn) { this.lastSpike = 'ceil'; this.introBeats = ['run', 'stairs', 'run', 'chain']; } // you start on the floor: the first beat starts there
    this.genX = this.opts.short ? 140 : dn ? 150 : 230; // v8: the first beat comes within a second
  };

  const TEMPLATES = {};
  Level.TEMPLATES = TEMPLATES;

  // minD: difficulty needed before it can appear. w: base weight.
  const POOL = [
    ['spikeF', 0, 1.2], ['spikeC', 0, 1.2], ['trajectory', 0.04, 1], ['zigzag', 0.08, 1.2],
    ['gate', 0.12, 1], ['fork', 0.16, 0.8], ['catch', 0.2, 0.8], ['gatePair', 0.24, 0.9],
    ['mover', 0.2, 0.7], ['pad', 0.1, 0.8], ['laser', 0.28, 0.7], ['lock', 0.3, 0.6], ['gateSpike', 0.36, 0.8],
    ['dash', 0.1, 0.6], ['fan', 0.12, 0.7], ['pop', 0.15, 0.8], ['saw', 0.18, 0.8], ['lift', 0.2, 0.7],
    ['bumper', 0.22, 0.6], ['crumble', 0.25, 0.7], ['orbit', 0.25, 0.7], ['pend', 0.28, 0.7], ['blink', 0.3, 0.6],
    ['fly', 0.14, 0.9], ['piston', 0.12, 0.9], ['jaws', 0.26, 0.7], ['geyser', 0.18, 0.8],
    // new in rules v6 (never picked by older rules, so old replays stay exact)
    ['firebar', 0.2, 0.8, 6], ['snake', 0.25, 0.8, 6], ['meteor', 0.15, 0.8, 6], ['bouncer', 0.22, 0.8, 6],
    // b61: the three new worlds' own obstacles (only through the stage book)
    ['wind', 0.2, 0.8, 11], ['float', 0.15, 0.8, 11], ['heavy', 0.15, 0.8, 11], ['totem', 0.2, 0.8, 11]
  ];

  // ---- the stage book (js/stages.js): checked once at load, so a typo there never breaks the game
  const MIN_D = {};
  for (const c of POOL) MIN_D[c[0]] = c[1];
  const LASER_MAX = 205;
  FF.compileBook = function (raw) {
    const warn = [];
    const num = (v, a, b, def) => (v !== null && v !== '' && Number.isFinite(+v) ? FF.clamp(+v, a, b) : def);
    const list = raw && Array.isArray(raw.stages) ? raw.stages : [];
    const stages = [];
    list.forEach((s, i) => {
      if (!s || typeof s !== 'object') { warn.push('stage ' + (i + 1) + ' is not { ... }'); return; }
      const mix = {};
      for (const k in s.mix || {}) {
        if (MIN_D[k] === undefined) warn.push('stage ' + (i + 1) + ': unknown obstacle "' + k + '"');
        else if (+s.mix[k] > 0) mix[k] = Math.min(100, +s.mix[k]);
      }
      // crumbling floors under heavy gravity drop you too fast to react: never together
      const heavy = s.mod === 'heavy';
      if (heavy && mix.crumble) { delete mix.crumble; warn.push('stage ' + (i + 1) + ': crumble is left out under heavy gravity'); }
      // lifts under low gravity: you float off them too slowly to make the next flip
      const low = s.mod === 'lowgrav';
      if (low && mix.lift) { delete mix.lift; warn.push('stage ' + (i + 1) + ': lift is left out under low gravity'); }
      // lasers switch sides on a beat: above speed 205 (turbo counts) the beat outruns a person's reaction
      const fastLaser = num(s.speed, 80, 226, 112 + 6 * i) * (s.mod === 'turbo' ? 1.08 : 1) > LASER_MAX;
      if (fastLaser && mix.laser) { delete mix.laser; warn.push('stage ' + (i + 1) + ': laser is left out above speed ' + LASER_MAX); }
      if (!Object.keys(mix).length) { mix.spikeF = 1; mix.spikeC = 1; }
      const finale = (Array.isArray(s.finale) ? s.finale : []).filter((n) => {
        if (MIN_D[n] === undefined) { warn.push('stage ' + (i + 1) + ': unknown finale obstacle "' + n + '"'); return false; }
        return !(heavy && n === 'crumble') && !(fastLaser && n === 'laser') && !(low && n === 'lift');
      }).slice(0, 8);
      const open = (Array.isArray(s.open) ? s.open : []).filter((n) => {
        if (MIN_D[n] === undefined) { warn.push('stage ' + (i + 1) + ': unknown opening obstacle "' + n + '"'); return false; }
        return !(heavy && n === 'crumble') && !(fastLaser && n === 'laser') && !(low && n === 'lift');
      }).slice(0, 4);
      const world = FF.WORLDS.some((w) => w.id === s.world) ? s.world : FF.WORLDS[i % (FF.WORLDS_BASE || FF.WORLDS.length)].id;
      if (s.world && world !== s.world) warn.push('stage ' + (i + 1) + ': unknown world "' + s.world + '"');
      const st = {
        name: String(s.name || 'STAGE ' + (i + 1)).toUpperCase().slice(0, 22), nameAr: String(s.nameAr || '').slice(0, 22), world,
        speed: num(s.speed, 80, 226, 112 + 6 * i), hard: num(s.hard, 0, 1, 0.5), breather: Math.round(num(s.breather, 1, 12, 4)),
        mix, finale, mod: Level.MODS.indexOf(s.mod) > 0 ? s.mod : 'none', rift: !!s.rift
      };
      // rules v7 only (older rules ignore them). Left out when not set, so an older book keeps its exact id
      if (s.len !== undefined && s.len !== null && s.len !== '') st.len = Math.round(num(s.len, 1200, 6000, Level.STAGE_LEN));
      if (open.length) st.open = open;
      if (s.roomy) st.roomy = true; // b61: tap spacing stretches with the late game speed (left out when not set: old ids stay)
      stages.push(st);
    });
    if (!stages.length) stages.push({ name: 'STAGE 1', nameAr: '', world: 'neon', speed: 120, hard: 0.3, breather: 3, mix: { spikeF: 1, spikeC: 1 }, finale: [], mod: 'none', rift: false });
    const lp = (raw && raw.loop) || {};
    const book = { stages, loop: { from: Math.round(num(lp.from, 1, stages.length, 1)), speedStep: num(lp.speedStep, 0, 10, 2), cap: num(lp.cap, 80, 226, 220) } };
    if (raw && raw.comingSoon) book.comingSoon = true; // the run ends after the last stage: COMING SOON
    book.id = (FF.hashStr(JSON.stringify(book)) >>> 0).toString(36);
    book.warnings = warn;
    if (warn.length && typeof console !== 'undefined') console.warn('stage book:', warn.join(' | '));
    return book;
  };
  // a compiled book back to plain data (compiling it again gives the same book and the same id)
  FF.bookRaw = (book) => ({ stages: book.stages.map((s) => Object.assign({ name: s.name, nameAr: s.nameAr, world: s.world, speed: s.speed, hard: s.hard, breather: s.breather, mod: s.mod, rift: s.rift, mix: Object.assign({}, s.mix), finale: s.finale.slice() }, s.len ? { len: s.len } : {}, s.open ? { open: s.open.slice() } : {}, s.roomy ? { roomy: true } : {})), loop: Object.assign({}, book.loop), comingSoon: !!book.comingSoon });
  FF.BOOK = FF.compileBook(FF.STAGE_BOOK);
  // stage number (1, 2, …) → its entry; past the end the run laps from loop.from, flat out
  Level.prototype.stageDefN = function (st) {
    const B = this.book, n = B.stages.length;
    if (st <= n) return { s: B.stages[Math.max(0, st - 1)], lap: 0 };
    const span = n - B.loop.from + 1, i = st - 1 - n;
    return { s: B.stages[B.loop.from - 1 + (i % span)], lap: 1 + Math.floor(i / span) };
  };
  Level.prototype.stageDef = function (x) {
    const st = this.stageAt(x), c = this.bookCache || (this.bookCache = {});
    if (!c[st]) {
      const r = this.stageDefN(st);
      c[st] = r.lap ? Object.assign({}, r.s, { hard: 1, breather: r.s.breather + r.lap, lap: r.lap }) : Object.assign({ lap: 0 }, r.s);
    }
    return c[st];
  };
  Level.prototype.bookSpeed = function (st) {
    const r = this.stageDefN(st), B = this.book;
    if (!r.lap) return r.s.speed;
    const top = B.stages[B.stages.length - 1].speed;
    return Math.min(Math.max(top, B.loop.cap), top + r.lap * B.loop.speedStep);
  };
  // ⚡ TURBO BURSTS (weekly twist): two bursts in every stage, +30% speed eased in over 160px, never above 205
  // (the speed where lasers stop being readable), so the fastest stages simply stay as they are
  Level.BURST_CAP = 205;
  Level.BURSTS = [[1000, 1500], [2100, 2550]];
  Level.prototype.burstAt = function (x) {
    if (this.twist !== 'burst' || x < 0) return 0;
    const into = x % Level.STAGE_LEN;
    for (const z of Level.BURSTS) if (into > z[0] && into < z[1]) return FF.clamp(Math.min(into - z[0], z[1] - into) / 160, 0, 1);
    return 0;
  };
  // a stage as the twist / remix plays it: the extra obstacle of the week/day in its mix, and nothing that the
  // run-wide modifier makes unfair (the same rules js/stages.js applies to a stage's own modifier)
  Level.prototype.fxStage = function (st) {
    const c = this.fxCache || (this.fxCache = {});
    if (c[st]) return c[st];
    // by stage number (rules v7 stages have their own lengths, so a nominal x would point at the wrong stage)
    const R = this.stageDefN(st), S = R.lap ? Object.assign({}, R.s, { hard: 1, breather: R.s.breather + R.lap, lap: R.lap }) : Object.assign({ lap: 0 }, R.s);
    const v7 = !!(this.stX && this.stX[st - 1] !== undefined), SL = v7 ? this.stageLen(st) : Level.STAGE_LEN, s0 = v7 ? this.stX[st - 1] : (st - 1) * Level.STAGE_LEN;
    const mix = Object.assign({}, S.mix);
    let top = 1;
    for (const k in mix) top = Math.max(top, mix[k]);
    if (this.twist === 'sawrain') mix.saw = (mix.saw || 0) + Math.max(2, top * 1.2);
    if (this.remix && this.remix.mod === 'storm') { mix.zigzag = (mix.zigzag || 0) + top; mix.gateSpike = (mix.gateSpike || 0) + top * 0.6; }
    const g = this.gravAt(s0 + SL / 2), fast = this.speedAt(s0 + SL - 1) > 205;
    const bad = (n) => (g > 1 && n === 'crumble') || (g < 1 && n === 'lift') || (fast && n === 'laser');
    for (const k in mix) if (bad(k)) delete mix[k];
    if (!Object.keys(mix).length) { mix.spikeF = 1; mix.spikeC = 1; }
    // saw rain: every stage also opens with a saw, so the week's twist is felt even in short v7 stages
    const open = this.twist === 'sawrain' && this.stX ? ['saw'].concat(S.open || []) : S.open;
    return (c[st] = Object.assign({}, S, { mix, open, finale: S.finale.map((n) => (bad(n) ? 'spikeF' : n)) }));
  };
  Level.prototype.pickBook = function () {
    const st = this.stageAt(this.genX), SL = Level.STAGE_LEN, s0 = (st - 1) * SL, S = this.fx ? this.fxStage(st) : this.stageDef(this.genX);
    const k = this.speedAt(this.genX) / 100;
    this.riftAt = this.riftAt || {};
    this.finaleAt = this.finaleAt || {};
    this.finaleQ = this.finaleQ || [];
    // gravity changes at the next stage line (heavy / low gravity): nothing may straddle it, so the last bit is calm
    if (this.gen.smooth && this.gravAt(s0 + SL) !== this.gravAt(this.genX) && this.genX > s0 + SL - 400 * k) { this.finaleQ = []; return 'calm'; }
    // ...and a short calm right after it, so you land in the new gravity before the next obstacle
    if (this.gen.smooth && st > 1 && this.gravAt(s0 - 1) !== this.gravAt(s0) && this.genX < s0 + 180 * k) return 'calm';
    if (this.finaleQ.length) return this.finaleQ.shift();
    if (S.rift && !this.opts.noRift && !this.riftAt[st] && this.genX > s0 + 900) { this.riftAt[st] = 1; return 'rift'; }
    // the stage's finale: its obstacles back-to-back, timed to end around the stage line
    if (S.finale.length && !this.finaleAt[st] && this.genX > s0 + SL - S.finale.length * 230 * k) {
      this.finaleAt[st] = 1;
      this.finaleQ = S.finale.slice(1);
      return S.finale[0];
    }
    if (this.sinceCalm >= S.breather) return 'calm';
    // weighted pick from the stage's mix, never the same obstacle as one of the last two
    const recent = this.recent || [];
    let names = Object.keys(S.mix).filter((n) => recent.indexOf(n) < 0);
    if (!names.length) names = Object.keys(S.mix).filter((n) => n !== this.lastName);
    if (!names.length) names = Object.keys(S.mix);
    let total = 0;
    for (const n of names) total += S.mix[n];
    let r = this.rng() * total;
    for (const n of names) { r -= S.mix[n]; if (r <= 0) return n; }
    return names[0];
  };

  // rules v7: the stage's opening plays first, its finale is timed by its real length and always closes the stage
  Level.prototype.pickBook7 = function () {
    const st = this.stX.length, s0 = this.stX[st - 1], S = this.fx ? this.fxStage(st) : this.stageDef(this.genX), len = this.stageLen(st), end = this.stageEnd(st);
    const k = this.speedAt(this.genX) / 100;
    this.riftAt = this.riftAt || {};
    this.finaleAt = this.finaleAt || {};
    this.finaleQ = this.finaleQ || [];
    this.openAt = this.openAt || {};
    if (this.wantCalm) { this.wantCalm = 0; return 'calm'; } // after the finale, before a gravity change
    if (this.gen.dense && !this.opts.script && st === 1 && !this.startBeat && !this.opts.startX) { this.startBeat = 1; return 'beatS'; } // (b52: a tap in the first second)
    if (this.finaleQ.length) return this.finaleQ.shift();
    // a short calm right after a gravity change, so you land in the new gravity before the next obstacle
    if (st > 1 && this.gravAt(s0 - 1) !== this.gravAt(s0) && this.genX < s0 + (this.gen.dense ? 90 : 180) * k) return 'calm'; // (v8: one calm after a gravity change, not two)
    const beatAfter = (n) => n; // (b51: no beat queued behind the book's own obstacles)
    const P = this.stagePlan(st, S); // (b56: this run's order of the stage's own obstacles — nothing to memorise)
    if (P.open.length && !this.openAt[st]) { this.openAt[st] = 1; const op = this.withBeats(P.open, true); this.openQ = op.slice(1); return op[0]; }
    if (this.openQ && this.openQ.length) return this.openQ.shift();
    if (S.rift && !this.opts.noRift && !this.riftAt[st] && this.genX > s0 + Math.min(900, len * 0.3)) { this.riftAt[st] = 1; return 'rift'; }
    if (P.finale.length && !this.finaleAt[st] && this.genX > end - this.finaleLen(P.finale, st, k) - 200 * k) { // (200k: about half a chunk, so it ends near the line, not past it)
      this.finaleAt[st] = 1;
      const fin = this.withBeats(P.finale);
      this.finaleQ = fin.slice(1);
      return fin[0];
    }
    if (!S.finale.length && this.genX >= end) return 'calm'; // (the stage line comes right here)
    // v8: the beat queued behind the last obstacle — only while there's still room before the finale starts
    const room = () => this.genX < end - (P.finale.length ? this.finaleLen(P.finale, st, k) : 0) - 200 * k;
    if (this.beatNext) { this.beatNext = 0; if (room()) return 'beat'; }
    if (this.heldPick) { const h = this.heldPick; this.heldPick = null; return beatAfter(h); } // the obstacle that waited behind its lead-in beat
    if (this.sinceCalm >= S.breather) return this.gen.dense && !this.opts.script ? 'pulse' : 'calm'; // (v8: the breather becomes a short pulse, same length)
    const recent = (this.recent || []).slice();
    // right before the finale, never the obstacle the finale opens with (two of the same beat back-to-back can lock up)
    if (P.finale.length && this.genX > end - this.finaleLen(P.finale, st, k) - 900 * k) recent.push(P.finale[0]);
    let names = Object.keys(S.mix).filter((n) => recent.indexOf(n) < 0);
    if (!names.length) names = Object.keys(S.mix).filter((n) => n !== this.lastName);
    if (!names.length) names = Object.keys(S.mix);
    let total = 0;
    for (const n of names) total += S.mix[n];
    let r = this.rng() * total, pick = names[0];
    for (const n of names) { r -= S.mix[n]; if (r <= 0) { pick = n; break; } }
    // v10: the stage's family and its guests come first in the body (one each, this run's order), then the usual mix
    if (this.gen.fit && P.show && P.show.length) { const i = P.show.findIndex((n) => recent.indexOf(n) < 0); if (i >= 0) pick = P.show.splice(i, 1)[0]; }
    // v8: most obstacles can be sat out on the safe surface (measured: 60-100% of them needed no tap),
    // so often a short BEAT follows: spikes on both surfaces, a tap whatever side you're on (never inside a finale's run-up)
    // v8: obstacles you can mostly sit through (measured: 85-100% of them needed no tap) also get a beat IN FRONT
    if (this.gen.dense && !this.opts.script && PASSIVE[pick] && room() && this.rng() < 0.8) { this.heldPick = pick; return 'beat'; }
    return beatAfter(pick);
  };
  const PASSIVE = { dash: 1, blink: 1, fork: 1, bumper: 1, fan: 1, orbit: 1, zigzag: 1, geyser: 1, gatePair: 1, pad: 1, catch: 1, trajectory: 1 };
  // b56 (Amir: 'the road gets memorised'): every run plays each stage's own opening and finale in its own order,
  // and swaps about a third of them for other obstacles of the same stage (uniform pick, so it's not always the
  // same two). Same counts, same book, same speeds. Seeded by the run's seed (replays match).
  Level.prototype.stagePlan = function (st, S) {
    if (!this.gen.dense || this.opts.script || this.opts.custom) return { open: S.open || [], finale: S.finale };
    const c = this.plans || (this.plans = {});
    if (c[st]) return c[st];
    const r = FF.mulberry32((this.opts.seed || 1) * 31 + st * 977);
    const names = Object.keys(S.mix);
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    const swap = (a) => { for (let i = 0; i < a.length; i++) if (names.length && r() < 0.34) { const avoid = [a[i - 1], a[i + 1]]; const ok = names.filter((n) => avoid.indexOf(n) < 0); if (ok.length) a[i] = ok[Math.floor(r() * ok.length)]; } return a; };
    const fix = (a) => { for (let i = 1; i < a.length; i++) if (a[i] === a[i - 1]) { const ok = names.filter((n) => n !== a[i - 1] && n !== a[i + 1]); if (ok.length) a[i] = ok[Math.floor(r() * ok.length)]; } return a; };
    // only orders the book itself already uses: every neighbour pair (a then b) must appear somewhere in the book's
    // openings/finales, or b doesn't run on a clock — a new order never invents a pairing nobody tested (b56)
    const okPairs = PAIRS(this.book);
    const valid = (a) => a.every((n, i) => i === 0 || !TIMED[n] || okPairs[a[i - 1] + '>' + n]);
    const make = (list) => { for (let t = 0; t < 12; t++) { const a = fix(swap(shuffle(list.slice()))); if (valid(a)) return a; } return list.slice(); };
    if (this.gen.full) {
      // b57 (Amir: 'still few obstacles, few kinds'): the finale plays EVERY obstacle of the stage's mix once
      // (plus the book's own finale ones), in this run's order — a stage shows its whole family
      // + two guests from the previous stage's family (different each run) so every stage shows 7+ kinds
      // b58 (Amir: 'I still see two kinds'): early stages are nearly all spike-looking, so three guests that LOOK
      // different (saw, piston, laser, pop, pendulum, orbit, jaws, fire bar, snake, geyser, meteor) join every stage
      const LOOK = ['saw', 'piston', 'laser', 'pop', 'orbit', 'jaws', 'firebar', 'snake', 'geyser', 'meteor', 'mover']; // (b59: the pendulum stays in the stages that own it — as a surprise guest it was the one unfair clock)
      const prev = LOOK.filter((n) => names.indexOf(n) < 0 && S.finale.indexOf(n) < 0);
      const guests = shuffle(prev).slice(0, 3);
      if (this.gen.fit) {
        // v10: the book's finale (this run's order), and the family + guests queued for the stage's body
        // plain spike pieces of the opening/finale (spikes are already everywhere in the beats) become the guests:
        // same number of pieces, so the same length — but they LOOK different
        // (only the SHORT guests swap in — saw, orbit, fire bar, crusher, laser are about as long as a spike group with
        // its run-up — so the stage keeps its length; the long ones (piston, meteor, pop...) go to the body)
        const SHORT = { saw: 1, orbit: 1, firebar: 1, mover: 1, laser: 1 };
        const g = shuffle(prev.filter((n) => SHORT[n])).slice(0, 3), PLAIN = { spikeF: 1, spikeC: 1 };
        guests.forEach((n) => { if (!SHORT[n]) g.push(n); });
        const sub = (list) => list.map((n) => (PLAIN[n] && g.length && SHORT[g[0]] ? g.shift() : n));
        const twin = (a) => a.some((n, i) => i > 0 && n === a[i - 1]);
        const order = (list) => { for (let t = 0; t < 60; t++) { const a = shuffle(list.slice()); if (valid(a) && !twin(a)) return a; } for (let t = 0; t < 40; t++) { const a = shuffle(list.slice()); if (valid(a)) return a; } const a = shuffle(list.slice()); for (let i = 1; i < a.length; i++) if (TIMED[a[i]] && !okPairs[a[i - 1] + '>' + a[i]]) { const t = a.splice(i, 1)[0]; a.push(t); } return a; };
        const op0 = sub(S.open || []), fi0 = sub(S.finale);
        // most stages are ALL opening + finale (no body), so from stage 2 every finale has at least 1 short guest
        // (a swapped spike counts) — about 4 s longer than the book, never the 40 s v9 added
        const swapped = op0.concat(fi0).filter((n) => SHORT[n] && names.indexOf(n) < 0 && S.finale.indexOf(n) < 0 && (S.open || []).indexOf(n) < 0).length;
        // (a stage whose finale has under 2 hazards that look like something — SUGAR RUSH is all bounce pads — gets 2)
        const HAZ = { piston: 1, gate: 1, gatePair: 1, gateSpike: 1, pop: 1, laser: 1, snake: 1, geyser: 1, meteor: 1, saw: 1, orbit: 1, firebar: 1, mover: 1, jaws: 1, pend: 1, blink: 1 };
        const want = new Set(op0.concat(fi0).filter((n) => HAZ[n])).size < 2 ? 2 : 1;
        for (let i = swapped; st > 1 && i < want && g.length && SHORT[g[0]]; i++) fi0.push(g.shift());
        const open = order(op0), finale = order(fi0);
        // stages are short now, so a finale often opens the stage right after a gravity change: a short beat first, so
        // a laser/blink/pop/pendulum gets its long look (endless seed 2: the blink laser opening GLITCH STORM was 0/4)
        if (st > 1 && (LONG_RUNUP[finale[0]] || finale[0] === 'blink')) finale.unshift('beatS');
        const own = names.filter((n) => !PLAIN[n] && open.indexOf(n) < 0 && finale.indexOf(n) < 0);
        const show = shuffle(g); shuffle(own).forEach((n, i) => show.splice(Math.min(show.length, i * 2 + 1), 0, n));
        return (c[st] = { open, finale, show });
      }
      const all = names.concat(S.finale.filter((n) => names.indexOf(n) < 0), guests);
      const tryOrder = () => { for (let t = 0; t < 40; t++) { const a = shuffle(all.slice()); if (valid(a)) return a; } return null; };
      let fin = tryOrder();
      if (!fin) { fin = shuffle(all.slice()); for (let i = 1; i < fin.length; i++) if (TIMED[fin[i]] && !okPairs[fin[i - 1] + '>' + fin[i]]) { const t = fin.splice(i, 1)[0]; fin.push(t); } }
      return (c[st] = { open: make(S.open || []), finale: fin });
    }
    return (c[st] = { open: make(S.open || []), finale: make(S.finale) });
  };
  const pairCache = new WeakMap();
  const PAIRS = (book) => {
    if (pairCache.has(book)) return pairCache.get(book);
    const p = {};
    for (const s of book.stages) for (const l of [s.open || [], s.finale || []]) for (let i = 1; i < l.length; i++) p[l[i - 1] + '>' + l[i]] = 1;
    pairCache.set(book, p); return p;
  };
  // how long a finale really is at speed k: its obstacles are built once on a scratch copy (nothing real changes)
  // v8: a finale gets a BEAT after every obstacle (fixed positions, so its length is known in advance)
  const NO_BEAT = { fly: 1, rift: 1, lock: 1, fork: 1, calm: 1, beat: 1, beatS: 1, pulse: 1 };
  Level.prototype.withBeats = function (list, trail) {
    // b52 (densify, Amir): the book's obstacles stay exactly as designed and in order; SHORT beats (2-3 taps)
    // go between them — after every opening obstacle, after every other finale obstacle — so a stage grows by
    // a few short beats only (each world still comes in the same order, a little later)
    if (!this.gen.dense || this.opts.script) return list;
    const out = [];
    list.forEach((n, i) => {
      out.push(n);
      const between = i < list.length - 1 && !NO_BEAT[n] && !NO_BEAT[list[i + 1]];
      if (trail ? !NO_BEAT[n] : between && (i % 2 === 0 || (this.gen.taps && this.stX && this.stX.length > 1) || (this.gen.full && LONG_RUNUP[list[i + 1]]))) out.push('beatS'); // (v11: after EVERY finale obstacle from stage 2 — stage 1 stays short) // (b58: a beat always comes before a pop/pendulum/laser)
    });
    return out;
  };
  Level.prototype.finaleLen = function (list, st, k) {
    const c = this.finLenCache || (this.finLenCache = {});
    if (c[st]) return c[st];
    list = this.withBeats(list);
    const tmp = Object.create(this);
    tmp.objs = []; tmp.dashes = []; tmp.winds = null; tmp.coinTotal = 0; tmp.coinSets = {}; tmp.groupId = 0; tmp.riftCount = this.riftCount || 0;
    tmp.opts = Object.assign({}, this.opts, { noHints: true });
    tmp.rng = FF.mulberry32((this.opts.seed || 1) * 13 + st * 7);
    const d = this.stageDef(this.genX).hard;
    let L = 0;
    list.forEach((n, i) => { const kk = this.gen.wide && SPATIAL[n] ? k * this.tf(this.genX + L) : k; L += TEMPLATES[n].call(tmp, this.genX + L, kk, Math.max(d, MIN_D[n] || 0), tmp.rng) + (this.gen.gap + (TIMED[n] ? 60 : 0) + (list[i - 1] === 'beat' && TIMED[n] ? (LONG_RUNUP[n] ? RUNUP.laser : RUNUP.before) : 0)) * kk; });
    return (c[st] = L);
  };

  Level.prototype.worldAt = function (x) {
    if (this.worldMarks) {
      let w = this.worldMarks[0].w;
      for (const m of this.worldMarks) if (x >= m.x) w = m.w;
      return FF.worldById(w);
    }
    if (this.opts.world) return FF.worldById(this.opts.world);
    if (this.gen.book && !this.opts.script) { const id = this.stageDef(x).world; return FF.worldById(this.remix && this.remix.perm ? this.remix.perm[id] || id : id); }
    const off = this.opts.worldOffset || 0;
    return FF.WORLDS[(Math.floor(x / Level.STAGE_LEN) + off) % (FF.WORLDS_BASE || FF.WORLDS.length)]; // (b61: old rules never see the new worlds)
  };

  Level.prototype.pickChunk = function () {
    if (this.gen.book && !this.opts.script) return this.stX ? this.pickBook7() : this.pickBook();
    // a RIFT portal on every even stage (from 600m), a little after the stage starts
    if (!this.opts.noRift && !this.opts.script) {
      const st = this.stageAt(this.genX), SL = Level.STAGE_LEN;
      this.riftAt = this.riftAt || {};
      if (st >= 3 && st % 2 === 1 && !this.riftAt[st] && this.genX > (st - 1) * SL + 900) { this.riftAt[st] = 1; return 'rift'; }
    }
    const d = this.difficulty(this.genX);
    const od = this.overdrive(this.genX);
    if (this.sinceCalm >= 3 - Math.floor(d * 1.5) + Math.round(od * 2) || (this.lastName !== 'calm' && this.rng() < this.gen.calm * (1 - od * 0.7))) return 'calm';
    const world = this.worldAt(this.genX);
    const cands = POOL.filter((c) => c[1] <= d && c[0] !== this.lastName && !c[3]);
    let total = 0;
    const ws = cands.map((c) => {
      const w = c[2] * ((world.weights && world.weights[c[0]]) || 1);
      total += w;
      return w;
    });
    let r = this.rng() * total;
    for (let i = 0; i < cands.length; i++) {
      r -= ws[i];
      if (r <= 0) return cands[i][0];
    }
    return cands[0][0];
  };

  // obstacles that run on a clock: two of them back-to-back can line up so no timing gets through both
  const SPATIAL = { spikeF: 1, spikeC: 1, zigzag: 1, gateSpike: 1, gate: 1, gatePair: 1 };
  const TIMED_GAP = 50;
  const BOUNCY = { bumper: 1, pad: 1, fan: 1, dash: 1 };
  const FRESH = { firebar: 1, snake: 1, meteor: 1, bouncer: 1 }; // the newest ones always get a run-up: they move in 2D and need a look first
  const TIMED = { firebar: 1, snake: 1, meteor: 1, bouncer: 1, laser: 1, blink: 1, pop: 1, mover: 1, orbit: 1, pend: 1, saw: 1, piston: 1, jaws: 1, geyser: 1, crumble: 1, lift: 1, lock: 1 };
  Level.prototype.addChunk = function (name) {
    // room before a timed obstacle when the one before also ran on a clock or bounced you around
    // (smooth books add more before a pendulum: its swing needs a clear run-up)
    if (this.gen.book && TIMED[name] && (TIMED[this.lastName] || (this.gen.smooth && (BOUNCY[this.lastName] || FRESH[name] || FRESH[this.lastName])))) {
      // (v7 plays every finale in full, so a laser right after a snake/blink, or a beat right after a dash, needs a longer look)
      this.genX += Math.round((this.gen.lens && (name === 'laser' || BOUNCY[this.lastName]) ? 110 : this.gen.smooth && name === 'pend' ? (BOUNCY[this.lastName] ? 110 : 80) : this.gen.smooth && (FRESH[name] || FRESH[this.lastName]) ? 70 : this.gen.lens && name === 'pop' ? 70 : TIMED_GAP) * this.speedAt(this.genX) / 100 * this.tf(this.genX));
    }
    // v12: the lift needs you to land on it on its beat — a longer look before it (stage 8 failed for skilled players)
    if (this.gen.wide && name === 'lift') this.genX += Math.round(80 * this.speedAt(this.genX) / 100 * this.tf(this.genX));
    // v8: a beat leaves you on a fixed surface, so anything on a clock right after it gets a real run-up to re-time
    if (this.afterBeat && name !== 'beat') {
      if (TIMED[name]) {
        const ru = Math.round((LONG_RUNUP[name] ? RUNUP.laser : RUNUP.before) * this.speedAt(this.genX) / 100 * this.tf(this.genX));
        if (this.gen.dense && !this.script) { const side = this.lastSpike || 'floor'; this.coinLine(this.genX + 10, laneY(side), Math.max(2, Math.floor((ru - 30) / 14)), 14); } // (b53: coins to grab in the run-up)
        this.genX += ru;
      }
      this.afterBeat = 0;
    }
    const x0 = this.genX;
    const k = this.speedAt(x0) / 100;
    let d = this.opts.difficulty !== undefined ? this.opts.difficulty : this.difficulty(x0);
    if (this.gen.book) d = Math.max(d, MIN_D[name] || 0); // an obstacle is never built below its own level
    // v12: pieces made only of spikes and walls (nothing on a clock) are laid out wider late in a run, like the beats
    const len = TEMPLATES[name].call(this, x0, this.gen.wide && SPATIAL[name] ? k * this.tf(x0) : k, d, this.rng);
    if (!this.seen[name] && name !== 'calm' && name !== 'beat' && name !== 'beatS' && name !== 'pulse' && !this.opts.noHints) {
      this.seen[name] = true;
      this.add({ t: 'hint', x: x0 - 30, key: name, w: 0 });
    }
    const tight = this.modAt(x0) === 'tight' ? 0.55 : 1;
    const gap = this.opts.campaign || this.script ? 26 : this.gen.dense ? 13 : this.gen.gap; // hand-made levels keep their spacing (v8: half the empty space between pieces)
    this.genX = x0 + Math.round(len) + Math.round(gap * k * tight * (1 - 0.4 * this.overdrive(x0)) * this.tf(x0));
    this.chunkStarts.push(this.genX);
    if (name === 'beat' || name === 'beatS' || name === 'pulse') { this.afterBeat = 1; this.sinceCalm = 0; return; } // (a beat is punctuation: the obstacle before it still counts as the last one)
    this.lastName = name;
    this.recent = (this.recent || []).concat([name]).slice(-2);
    this.sinceCalm = name === 'calm' ? 0 : this.sinceCalm + 1;
  };

  // ---- helpers
  Level.prototype.coinLine = function (x, y, n, gap, gold) {
    const g = ++this.groupId;
    for (let i = 0; i < n; i++) this.add({ t: 'coin', x: x + i * gap, y, group: g, gold: !!gold });
    return g;
  };
  Level.prototype.spikes = function (x, side, n) {
    this.lastSpike = side; // (v8: after spikes on one side you're on the other — the next beat starts there)
    const y = side === 'floor' ? F : C;
    // v14 CLOSE SHAVE: every 3rd spike group has a x3 coin just before it, on its own surface — you only get it if you
    // stay until the last moment (a GREAT / PERFECT-late flip). Optional, no rng used, so the road is v13's road.
    if (this.gen.risk && x > 600 && (this.shaveN = (this.shaveN || 0) + 1) % 3 === 0) this.add({ t: 'coin', x: x - 18, y: side === 'floor' ? F - 6 : C + 6, risk: true });
    return this.add({ t: 'spike', x, y, w: n * 8, dir: side === 'floor' ? 'up' : 'down' });
  };
  Level.prototype.wall = function (x, phase) {
    return this.add({ t: 'solid', kind: 'wall', x, y: C, w: 8, h: F - C, phase });
  };
  const other = (s) => (s === 'floor' ? 'ceil' : 'floor');
  const laneY = (side) => (side === 'floor' ? F - 6 : C + 6);

  // ---- templates (all distances scale with speed k, so timing windows stay fair)
  TEMPLATES.calm = function (x0, k, d, rng) {
    const len = 120 * k;
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    this.coinLine(x0 + 16, laneY(side), 6, 14);
    if (!this.script && !this.opts.campaign && d > 0.12 && rng.chance(0.07)) {
      this.add({ t: 'portal', x: x0 + len * 0.6, y: FF.MID - 6, w: 12 });
    }
    return len;
  };

  // v8 BEAT: two short spike groups, one per surface, a beat apart. Sitting still is never safe here.
  // It starts later after anything that bounces you or runs on a clock, so you've landed and settled first.
  TEMPLATES.beat = function (x0, k, d, rng) {
    // start on the surface you're most likely standing on: the far side of the last spikes (else a coin flip)
    const coin = rng.chance(0.5) ? 'floor' : 'ceil';
    const first = this.lastSpike ? other(this.lastSpike) : coin;
    // (v12: the pendulum's swing reaches past its own piece — a longer look after it; and the lead stretches late in a run)
    const lead = (this.gen.wide && this.lastName === 'pend' ? 110 : TIMED[this.lastName] ? RUNUP.after : BOUNCY[this.lastName] ? 60 : 18) * k * (this.gen.wide ? this.tf(x0) : 1);
    let x = x0 + lead;
    // which beat: RUN (alternating spikes), PHASE (alternating colour walls), RUSH (a run that speeds up),
    // TWIN (spikes then a wall: flip, land, flip back). The meaner the stage, the more of the special ones.
    const r = rng();
    const intro = this.introBeats && this.introBeats.length ? this.introBeats.shift() : null; // v8: the run opens by showing the family
    const fieldPick = this.gen.full && !intro && rng() < (this.shortBeat ? 0.25 : 0.3) ? (rng() < 0.5 ? 'float' : 'heavy') : null;
    if (fieldPick) return TEMPLATES.field.call(this, x0, k, d, rng, fieldPick, first, lead);
    const kind = this.shortBeat ? (r < 0.5 ? 'run' : r < 0.75 ? 'stairs' : d > 0.3 ? 'chain' : 'run') : intro || (d > 0.3 && r < 0.14 ? 'phase' : d > 0.4 && r < 0.26 ? 'rush' : d > 0.35 && r < 0.36 ? 'twin' : r < 0.5 ? 'stairs' : d > 0.3 && r < 0.66 ? 'chain' : 'run');
    if (kind === 'phase') {
      // spacing proven by gatePair; the coin between two walls marks the middle of the lane
      const n = rng.int(2, d > 0.6 ? 4 : 3), gap = (104 - 16 * d) * k;
      let ph = rng.chance(0.5) ? 'b' : 'p';
      for (let i = 0; i < n; i++) {
        this.wall(x, ph);
        if (i < n - 1) { this.add({ t: 'coin', x: x + gap / 2 + 4, y: FF.MID, group: 0 }); x += gap; }
        ph = ph === 'b' ? 'p' : 'b';
      }
      return x - x0 + 8 + 50 * k;
    }
    if (kind === 'twin') {
      // the gateSpike move, as a beat: flip over the spikes, land, flip back before the wall of that colour
      const n = 3 + Math.round(d);
      this.spikes(x, first, n);
      const wx = x + n * 8 + Math.round(110 * k);
      this.wall(wx, first === 'floor' ? 'p' : 'b');
      this.coinLine(wx - Math.round(60 * k), laneY(first), 3, 12);
      return wx - x0 + 8 + 50 * k;
    }
    // RUN / RUSH / STAIRS / CHAIN: one tap per step, on a RHYTHM (a motif of spacings, like a drum pattern you
    // read instead of hear). 4-7 taps per beat. CHAIN swaps some spikes for colour walls (a wall of your colour
    // blocks you just like spikes on your surface). Spacing never under 0.72 of the base: a hand can follow it.
    const M0 = MOTIFS[kind === 'rush' ? 'build' : kind === 'stairs' ? 'steady' : this.forceMotif || MOTIF_KEYS[Math.floor(rng() * MOTIF_KEYS.length)]];
    const M = this.shortBeat ? (this.gen.taps ? M0.concat(M0).slice(0, 4 + Math.floor(rng() * 4)) : M0.slice(0, 3 + Math.floor(rng() * 3))) : M0; // (a short beat: 4-6 taps; v11: 5-8)
    const tf = this.tfIn(x0), base = (this.gen.full ? 75 : 80) * k * tf, minSp = (k > 1.75 ? 0.82 : 0.72) * base; // (b59: a little more room at the very top speeds) // (b53/b58: quicker — more taps in the same distance)
    let side = first, n = 0;
    for (let i = 0; i <= M.length; i++) {
      const wallHere = kind === 'chain' && i > 0 && rng.chance(0.45);
      if (wallHere) { this.wall(x, side === 'floor' ? 'b' : 'p'); n = 1; } // (blue blocks the floor-runner, purple the ceiling-runner)
      else {
        n = kind === 'stairs' ? Math.min(5, 1 + i) : rng.int(1, 2 + Math.round(d));
        // (b59: the looks take turns — spikes, block, spikes, mace, crystal, spikes, ember — so any 7 groups show all five)
        const look = this.gen.fit ? this.fitLook(x, rng) : this.gen.full ? LOOK_CYCLE[(this.lookN = (this.lookN === undefined ? Math.floor(rng() * 7) : this.lookN + 1)) % LOOK_CYCLE.length] : 'spike';
        if (look !== 'spike') {
          this.add({ t: 'hblock', look, x, y: side === 'floor' ? F - 8 : C, w: n * 8, h: 8, side: side === 'floor' ? 'bottom' : 'top' });
          this.lastSpike = side;
        } else this.spikes(x, side, n);
        this.coinLine(x - 4, laneY(other(side)), 2, 12);
      }
      if (i < M.length) {
        const nextWall = kind === 'chain'; // (walls need a little more room than spikes: the flip must be done before)
        x += n * 8 + Math.max(minSp * (nextWall ? 1.15 : 1), base * M[i]);
      }
      side = other(side);
    }
    return x - x0 + n * 8 + 30 * k;
  };
  // run-ups around obstacles on a clock (k units). Long run-ups read as pauses (Amir: 'a stop every 2 s'),
  // so they're as short as the fairness bots allow.
  // v10: every stage walks through all the beat looks before repeating one (spikes last), from a different start each stage
  Level.prototype.fitLook = function (x, rng) {
    const st = this.stX ? this.stX.length : 1;
    if (this.lookSt !== st) { this.lookSt = st; this.lookN = 0; const a = ['block', 'mace', 'crystal', 'ember']; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } this.lookOrder = this.gen.spiky ? [].concat(...a.map((l) => ['spike', 'spike', l])) : a.concat('spike'); } // (v14: spikes are 2 of every 3 hazards; v10-v13: 1 in 5)
    return this.lookOrder[this.lookN++ % this.lookOrder.length];
  };
  const LOOK_CYCLE = ['spike', 'block', 'spike', 'mace', 'crystal', 'spike', 'ember'];
  const RUNUP = { before: 70, laser: 130, after: 70 }; // (b58: shorter pauses; laser/pop/pendulum keep their long look)
  const LONG_RUNUP = { laser: 1, pop: 1, pend: 1 };
  TEMPLATES.beatS = function (x0, k, d, rng) {
    this.shortBeat = 1;
    try { return TEMPLATES.beat.call(this, x0, k, d, rng); } finally { this.shortBeat = 0; }
  };
  // b59 FIELDS: a zone where gravity changes and a run of spikes inside is spaced for it. FLOAT (x0.45 gravity):
  // flips take ~1.5x longer — tap earlier, slower rhythm. HEAVY (x1.9): flips are snappy — a tight, quick run.
  TEMPLATES.field = function (x0, k, d, rng, kind, first, lead) {
    const mul = kind === 'float' ? 0.45 : 1.9, flight = 1 / Math.sqrt(mul);
    const n = (this.shortBeat ? 3 : 4) + Math.round(rng() * (this.shortBeat ? 1 : 2)) + (d > 0.6 ? 1 : 0);
    const sp = (kind === 'float' ? 95 : 62) * k * this.tfIn(x0); // (in the field's own rhythm)
    const zx = x0 + (lead || 30 * k), inX = zx + 60 * k * flight;
    let x = inX, side = first || 'floor', g = 0;
    for (let i = 0; i < n; i++) {
      g = rng.int(1, 2);
      this.spikes(x, side, g);
      this.coinLine(x - 4, laneY(other(side)), 2, 12);
      if (i < n - 1) x += g * 8 + sp;
      side = other(side);
    }
    const end = x + g * 8 + 40 * k * flight;
    this.add({ t: 'field', kind, mul, x: zx, w: Math.round(end - zx), y: C, h: F - C });
    return end - x0 + 50 * k;
  };
  // ---- b61: the three new worlds' own obstacles ----
  // NEBULA: the gravity fields as obstacles of their own (a longer run than inside a beat)
  TEMPLATES.float = function (x0, k, d, rng) {
    const first = this.lastSpike ? other(this.lastSpike) : rng.chance(0.5) ? 'floor' : 'ceil';
    return TEMPLATES.field.call(this, x0, k, d, rng, 'float', first, (TIMED[this.lastName] ? RUNUP.after : 30) * k);
  };
  TEMPLATES.heavy = function (x0, k, d, rng) {
    const first = this.lastSpike ? other(this.lastSpike) : rng.chance(0.5) ? 'floor' : 'ceil';
    return TEMPLATES.field.call(this, x0, k, d, rng, 'heavy', first, (TIMED[this.lastName] ? RUNUP.after : 30) * k);
  };
  // SANDSTORM: a WIND zone. TAILWIND (x1.3): you're carried faster, the spikes keep their spacing, so the taps come
  // quicker — a rush. HEADWIND (x0.72): you're held back, the spikes sit closer together but arrive slower — a crawl
  // through a dense field. A sand-coloured run-in before it so you see the gust coming.
  TEMPLATES.wind = function (x0, k, d, rng) {
    const tail = rng.chance(0.5), mul = tail ? 1.3 : 0.72;
    const first = this.lastSpike ? other(this.lastSpike) : rng.chance(0.5) ? 'floor' : 'ceil';
    const n = 4 + Math.round(rng() * 2) + (d > 0.6 ? 1 : 0);
    const sp = (tail ? 84 : 62) * k * mul * this.tfIn(x0); // (in time: tail = 0.83 of a normal beat step, head = 1.15)
    const zx = x0 + (TIMED[this.lastName] ? RUNUP.after : 30) * k, inX = zx + 70 * k * mul;
    let x = inX, side = first, g = 0;
    for (let i = 0; i < n; i++) {
      g = rng.int(1, 2);
      this.spikes(x, side, g);
      this.coinLine(x - 4, laneY(other(side)), 2, 12);
      if (i < n - 1) x += g * 8 + sp;
      side = other(side);
    }
    const end = x + g * 8 + 40 * k * mul;
    this.add({ t: 'wind', kind: tail ? 'tail' : 'head', mul, x: zx, w: Math.round(end - zx), y: C, h: F - C });
    return end - x0 + 50 * k;
  };
  // JUNGLE RUINS: TOTEMS flip you for free when you pass them. After each one, read the spikes: on the side it
  // threw you to = TAP back; on the side you left = HOLD (a tap now would kill you). Spikes first on one side,
  // so where you stand when you reach the first totem is known.
  TEMPLATES.totem = function (x0, k, d, rng) {
    const lead = (TIMED[this.lastName] ? RUNUP.after : BOUNCY[this.lastName] ? 60 : 24) * k;
    const A = this.lastSpike ? other(this.lastSpike) : rng.chance(0.5) ? 'floor' : 'ceil';
    let x = x0 + lead;
    const tk = k * this.tfIn(x0);
    this.spikes(x, A, 2); this.coinLine(x - 4, laneY(other(A)), 2, 12);
    let side = other(A); // where you are now
    x += 16 + 70 * tk;
    const n = 3 + (d > 0.5 ? 1 : 0) + (rng.chance(0.4) ? 1 : 0);
    let holds = 0;
    for (let i = 0; i < n; i++) {
      this.add({ t: 'totem', x: Math.round(x), w: 6, y: C, h: F - C });
      side = other(side); // the totem flips you
      const hold = i > 0 && holds < 2 && rng.chance(0.35);
      const sx = x + Math.round((hold ? 66 : 80) * tk);
      if (hold) { this.spikes(sx, other(side), 2); this.coinLine(sx - 4, laneY(side), 3, 12); holds++; } // stay where it threw you
      else { this.spikes(sx, side, 2); this.coinLine(sx - 4, laneY(other(side)), 2, 12); side = other(side); } // tap back
      x = sx + 16 + 64 * tk;
    }
    this.lastSpike = other(side);
    return x - x0 + 10 * k;
  };
  // PULSE (v8): a breather that still asks for taps. About the length of a calm, so the stage keeps its length:
  // two small spike groups, the first on the surface you're on.
  TEMPLATES.pulse = function (x0, k, d, rng) {
    const coin = rng.chance(0.5) ? 'floor' : 'ceil';
    const first = this.lastSpike ? other(this.lastSpike) : coin;
    const lead = (TIMED[this.lastName] ? RUNUP.after : BOUNCY[this.lastName] ? 60 : 20) * k;
    const a = x0 + lead, b = a + 8 + 85 * k * this.tfIn(x0);
    this.spikes(a, first, 1);
    this.spikes(b, other(first), 1);
    this.coinLine(a - 4, laneY(other(first)), 2, 12);
    this.coinLine(b - 4, laneY(first), 2, 12);
    return b - x0 + 8 + 20 * k;
  };
  // rhythm motifs (spacing as a share of the base beat)
  const MOTIFS = {
    steady: [1, 1, 1, 1],
    gallop: [0.75, 1.25, 0.75, 1.25],
    triplet: [0.75, 0.75, 1.5, 0.75, 0.75],
    swing: [1.25, 0.75, 1.25, 0.75, 1],
    stop: [0.75, 0.75, 0.75, 1.6, 0.75, 0.75],
    long: [1, 0.85, 1, 0.85, 1, 0.85],
    build: [1.4, 1.2, 1, 0.85, 0.75]
  };
  const MOTIF_KEYS = ['steady', 'gallop', 'triplet', 'swing', 'stop', 'long'];

  function spikeChunk(side) {
    return function (x0, k, d, rng) {
      const n = rng.int(2, 2 + Math.round(d * 2));
      const sx = x0 + 30 * k;
      this.spikes(sx, side, n);
      this.coinLine(sx - 10, laneY(other(side)), 4, 13);
      if (false) { // (b51: the book's spike chunks are back as designed)
        const m = rng.int(2, 2 + Math.round(d)), sx2 = sx + n * 8 + 85 * k;
        this.spikes(sx2, other(side), m);
        this.coinLine(sx2 - 8, laneY(side), 3, 13);
        return sx2 - x0 + m * 8 + 60 * k;
      }
      return 30 * k + n * 8 + 60 * k;
    };
  }
  TEMPLATES.spikeF = spikeChunk('floor');
  TEMPLATES.spikeC = spikeChunk('ceil');

  // Coins trace the exact arc of a perfect flip over the spikes — the level teaches timing.
  TEMPLATES.trajectory = function (x0, k, d, rng) {
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    const v = this.speedAt(x0);
    const sx = x0 + 90 * k;
    const n = rng.int(2, 3);
    this.spikes(sx, side, n);
    const p = { x: sx - v * 0.15 - PW, y: side === 'floor' ? F - PH : C, vy: 0, grav: side === 'floor' ? 1 : -1, grounded: true, speed: v };
    Phys.flipState(p);
    const g = ++this.groupId;
    let t = 0, lastX = -99;
    const gm = this.gravAt(sx);
    const dummy = { near: () => [], speedAt: () => v, gravAt: () => gm };
    while (t < 0.5) {
      Phys.step(p, 1 / 240, dummy, 0);
      t += 1 / 240;
      if (p.x - lastX >= 12) {
        lastX = p.x;
        this.add({ t: 'coin', x: p.x + 6, y: p.y + 6, group: g });
      }
      if (p.grounded) break;
    }
    return 90 * k + n * 8 + 70 * k;
  };

  TEMPLATES.zigzag = function (x0, k, d, rng) {
    const n = 2 + Math.floor(d * 2.5 + rng() * 1.2);
    const gap = (98 - 26 * d) * k;
    let side = rng.chance(0.5) ? 'floor' : 'ceil';
    for (let i = 0; i < n; i++) {
      const x = x0 + 30 * k + i * gap;
      this.spikes(x, side, 2);
      if (i < n - 1) this.add({ t: 'coin', x: x + gap / 2 + 8, y: FF.MID, group: 0 });
      side = other(side);
    }
    return 30 * k + (n - 1) * gap + 16 + 50 * k;
  };

  // Phase wall: solid only in its own colour. Blue = gravity down, purple = gravity up.
  TEMPLATES.gate = function (x0, k, d, rng) {
    const ph = rng.chance(0.5) ? 'b' : 'p';
    const wx = x0 + 70 * k;
    this.wall(wx, ph);
    // coins hint the safe side (purple → ceiling side, blue → floor side)
    this.coinLine(wx - 40 * k, laneY(ph === 'b' ? 'ceil' : 'floor'), 3, 12);
    return 70 * k + 8 + 50 * k;
  };

  TEMPLATES.gatePair = function (x0, k, d, rng) {
    const ph = rng.chance(0.5) ? 'b' : 'p';
    const gap = (104 - 16 * d) * k;
    const w1 = x0 + 50 * k;
    this.wall(w1, ph);
    this.wall(w1 + gap, ph === 'b' ? 'p' : 'b');
    this.add({ t: 'coin', x: w1 + gap / 2 + 4, y: FF.MID, group: 0 });
    return 50 * k + gap + 8 + 50 * k;
  };

  // Wall + spikes right before it: flip over the spikes, flip back in time for the wall.
  TEMPLATES.gateSpike = function (x0, k, d, rng) {
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    const ph = side === 'floor' ? 'p' : 'b'; // wall that must be passed in the colour of the spiked side
    const n = 4 + Math.round(d);
    const sx = x0 + 50 * k;
    this.spikes(sx, side, n);
    // room to land after the spikes and flip back before the wall: "flip over, land, flip back" — readable, never a mid-air trick
    const wx = sx + n * 8 + Math.round(110 * k);
    this.wall(wx, ph);
    this.add({ t: 'coin', x: sx + n * 4, y: FF.MID, group: 0 });
    this.coinLine(wx - Math.round(60 * k), laneY(side === 'floor' ? 'floor' : 'ceil'), 3, 12);
    return wx - x0 + 8 + 60 * k;
  };

  TEMPLATES.mover = function (x0, k, d, rng) {
    const n = d > 0.45 && rng.chance(0.5) ? 2 : 1;
    const gap = 130 * k;
    for (let i = 0; i < n; i++) {
      this.add({
        t: 'mover', x: x0 + 50 * k + i * gap, w: 14, h: 26,
        yMin: C, yMax: F - 26, period: 3 - 0.5 * d, off: rng() * Math.PI * 2
      });
    }
    return 50 * k + (n - 1) * gap + 14 + 60 * k;
  };

  // Choice Fork: a slab splits the corridor. One lane is safe, the other is risky with gems (x5).
  TEMPLATES.fork = function (x0, k, d, rng) {
    const sx = x0 + 60 * k;
    const len = 300 * k;
    const top = FF.MID - 4, bot = FF.MID + 4;
    const riskUpper = rng.chance(0.5);
    this.add({ t: 'solid', kind: 'slab', x: sx, y: top, w: len, h: 8, phase: null });
    this.add({ t: 'fork', x: sx, w: len, riskUpper, slabY: top });
    this.add({ t: 'sign', x: sx - 34 * k, kind: 'risk', upper: riskUpper, w: 0 });
    // risky lane
    const gap = (70 - 14 * d) * k;
    let surf = 0;
    let gems = ++this.groupId;
    const fid = 'f' + gems; // b66: the fork's coins are tagged by lane (r = risky, s = safe) for the "all coins" star
    for (let x = sx + 50 * k; x < sx + len - 40 * k; x += gap) {
      if (riskUpper) {
        if (surf === 0) this.add({ t: 'spike', x, y: top, w: 16, dir: 'up' });
        else this.add({ t: 'spike', x, y: C, w: 16, dir: 'down' });
      } else {
        if (surf === 0) this.add({ t: 'spike', x, y: F, w: 16, dir: 'up' });
        else this.add({ t: 'spike', x, y: bot, w: 16, dir: 'down' });
      }
      this.add({ t: 'coin', x: x + 8, y: riskUpper ? (C + top) / 2 : (bot + F) / 2, gold: true, group: gems, fork: fid, lane: 'r' });
      surf ^= 1;
    }
    // safe lane: plain coins
    const sy = riskUpper ? F - 6 : C + 6;
    const n0 = this.objs.length;
    this.coinLine(sx + 30 * k, sy, 8, 26 * k);
    for (let i = n0; i < this.objs.length; i++) if (this.objs[i].t === 'coin') { // re-file the safe lane's coins under the fork
      const o = this.objs[i], cs = this.coinSets; cs[''] -= 1; o.fork = fid; o.lane = 's'; cs[fid + 's'] = (cs[fid + 's'] || 0) + 1;
    }
    return 60 * k + len + 30 * k;
  };

  // Catch platform: a phase platform over a spike bed. It holds you only in its own colour.
  TEMPLATES.catch = function (x0, k, d, rng) {
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    const n = 9 + Math.round(d * 4);
    const sx = x0 + 60 * k;
    this.spikes(sx, side, n);
    const len = n * 8;
    if (side === 'floor') {
      this.add({ t: 'solid', kind: 'catch', x: sx - 30 * k, y: F - 42, w: len + 50 * k, h: 6, phase: 'p' });
      this.coinLine(sx, F - 42 + 6 + 6, Math.floor(len / 16), 16, true);
    } else {
      this.add({ t: 'solid', kind: 'catch', x: sx - 30 * k, y: C + 36, w: len + 50 * k, h: 6, phase: 'b' });
      this.coinLine(sx, C + 36 - 6, Math.floor(len / 16), 16, true);
    }
    return 60 * k + len + 60 * k;
  };

  // Flip Lock: tapping does nothing inside — read what waits at the exit.
  TEMPLATES.lock = function (x0, k, d, rng) {
    const zx = x0 + 50 * k;
    const len = 150 * k;
    this.add({ t: 'sign', x: x0, kind: 'lock', w: 0 });
    this.add({ t: 'lock', x: zx, w: len });
    this.coinLine(zx + 20, laneY('floor'), 5, 24 * k);
    this.coinLine(zx + 32, laneY('ceil'), 5, 24 * k);
    const first = rng.chance(0.5) ? 'floor' : 'ceil';
    this.spikes(zx + len + 40 * k, first, 2);
    this.spikes(zx + len + 40 * k + 95 * k, other(first), 2);
    return 50 * k + len + 40 * k + 95 * k + 16 + 40 * k;
  };

  // Flip Pad: a springy arrow that flips you automatically — then you have to answer it.
  TEMPLATES.pad = function (x0, k, d, rng) {
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    const px = x0 + 40 * k;
    this.add({ t: 'pad', x: px, w: 16, side });
    // something on the far side forces a quick flip back
    const sx = px + (100 - 20 * d) * k;
    this.spikes(sx, other(side), 3);
    this.coinLine(px + 20 * k, laneY(other(side)), 3, 12);
    // and a pad on the other side too, at higher difficulty
    if (d > 0.4 && rng.chance(0.5)) {
      this.add({ t: 'pad', x: sx + 90 * k, w: 16, side: other(side) });
      this.spikes(sx + 90 * k + (100 - 20 * d) * k, side, 3);
      return 40 * k + (100 - 20 * d) * k * 2 + 90 * k + 24 + 50 * k;
    }
    return 40 * k + (100 - 20 * d) * k + 24 + 50 * k;
  };

  // Laser Gate: the beam swaps halves on a fixed rhythm and flickers before switching.
  TEMPLATES.laser = function (x0, k, d, rng) {
    const n = d > 0.5 && rng.chance(0.5) ? 2 : 1;
    const gap = 150 * k;
    for (let i = 0; i < n; i++) {
      this.add({ t: 'laser', x: x0 + 60 * k + i * gap, w: 4, dur: 1.15 - 0.25 * d, off: rng() * 3 });
    }
    return 60 * k + (n - 1) * gap + 4 + 60 * k;
  };

  // ---------------------------------------------------------------- player-made levels
  // Compact items {k, x, y} (x in px, snapped to 8) -> real level objects.
  FF.EDITOR_TOOLS = ['spike', 'wallB', 'wallP', 'block', 'slab', 'catchB', 'catchP', 'mover', 'laser', 'pad', 'lock', 'coin', 'gem', 'finish', 'erase',
    'pop', 'saw', 'orbit', 'pend', 'lift', 'crumble', 'blink', 'bumper', 'fan', 'dash', 'flyIn', 'flyOut', 'piston', 'jaws', 'geyser'];
  FF.EDITOR_CATS = {
    danger: ['spike', 'pop', 'piston', 'jaws', 'geyser', 'saw', 'orbit', 'pend', 'mover', 'laser', 'wallB', 'wallP', 'lock'],
    platform: ['block', 'slab', 'catchB', 'catchP', 'lift', 'crumble', 'blink', 'bumper', 'pad', 'fan', 'dash', 'flyIn', 'flyOut'],
    reward: ['coin', 'gem', 'finish', 'erase']
  };
  FF.levelObjects = function (lv) {
    const out = [];
    const g = 1000;
    for (const it of lv.items || []) {
      const x = it.x, y = it.y;
      switch (it.k) {
        case 'spike': out.push(y > FF.MID ? { t: 'spike', x, y: F, w: 8, dir: 'up' } : { t: 'spike', x, y: C, w: 8, dir: 'down' }); break;
        case 'wallB': out.push({ t: 'solid', kind: 'wall', x, y: C, w: 8, h: F - C, phase: 'b' }); break;
        case 'wallP': out.push({ t: 'solid', kind: 'wall', x, y: C, w: 8, h: F - C, phase: 'p' }); break;
        case 'block': out.push({ t: 'solid', kind: 'block', x, y: FF.clamp(y - 8, C, F - 16), w: 16, h: 16, phase: null }); break;
        case 'slab': out.push({ t: 'solid', kind: 'slab', x, y: FF.MID - 4, w: 96, h: 8, phase: null }); break;
        case 'catchB': out.push({ t: 'solid', kind: 'catch', x, y: FF.clamp(y - 3, C + 14, F - 20), w: 64, h: 6, phase: 'b' }); break;
        case 'catchP': out.push({ t: 'solid', kind: 'catch', x, y: FF.clamp(y - 3, C + 14, F - 20), w: 64, h: 6, phase: 'p' }); break;
        case 'mover': out.push({ t: 'mover', x, w: 14, h: 26, yMin: C, yMax: F - 26, period: 2.6, off: (x / 8) % 7 }); break;
        case 'laser': out.push({ t: 'laser', x, w: 4, dur: 1.1, off: (x / 8) % 5 * 0.4 }); break;
        case 'pad': out.push({ t: 'pad', x, w: 16, side: y > FF.MID ? 'floor' : 'ceil' }); break;
        case 'lock': out.push({ t: 'lock', x, w: 96 }); break;
        case 'coin': out.push({ t: 'coin', x: x + 4, y: FF.clamp(y, C + 6, F - 6), group: g }); break;
        case 'gem': out.push({ t: 'coin', x: x + 4, y: FF.clamp(y, C + 6, F - 6), gold: true, group: 0 }); break;
        case 'pop': out.push({ t: 'pop', x, w: 24, side: y > FF.MID ? 'floor' : 'ceil', period: 1.5, off: (x / 8) % 4 * 0.25 }); break;
        case 'saw': out.push({ t: 'saw', x: x - 8, w: 96, x0: x, x1: x + 80, side: y > FF.MID ? 'floor' : 'ceil', period: 1.6, off: 0 }); break;
        case 'orbit': out.push({ t: 'orbit', x: x - 36, w: 72, cx: x, cy: FF.clamp(y, C + 34, F - 34), r: 30, period: 1.8, off: 0, dir: 1 }); break;
        case 'pend': out.push({ t: 'pend', x: x - 70, w: 140, px: x, len: 96, amp: 0.75, period: 2.2, off: 0 }); break;
        case 'lift': out.push({ t: 'solid', kind: 'lift', x, y: FF.MID, w: 64, h: 6, phase: null, yA: C + 30, yB: F - 30, period: 2.4, off: (x / 8) % 3 / 3 }); break;
        case 'crumble': out.push({ t: 'solid', kind: 'crumble', x, y: FF.clamp(y - 3, C + 14, F - 20), w: 48, h: 6, phase: null }); break;
        case 'blink': out.push({ t: 'solid', kind: 'blink', x, y: FF.clamp(y - 3, C + 14, F - 20), w: 48, h: 6, phase: null, period: 1.8, off: (x / 8) % 2 * 0.5 }); break;
        case 'bumper': out.push({ t: 'bumper', x, y: FF.clamp(y - 3, C, F - 5), w: 20, h: 5 }); break;
        case 'fan': out.push({ t: 'fan', x, w: 64, side: y > FF.MID ? 'floor' : 'ceil' }); break;
        case 'dash': out.push({ t: 'dash', x, w: 10, len: 300 }); break;
        case 'flyIn': out.push({ t: 'flyIn', x, w: 10 }); break;
        case 'flyOut': out.push({ t: 'flyOut', x, w: 10 }); break;
        case 'piston': out.push({ t: 'piston', x, w: 18, side: y > FF.MID ? 'floor' : 'ceil', reach: 66, period: 1.6, duty: 0.42, off: (x / 8) % 4 * 0.25, style: 'steel' }); break;
        case 'geyser': out.push({ t: 'piston', x, w: 20, side: y > FF.MID ? 'floor' : 'ceil', reach: 70, period: 1.4, duty: 0.5, off: (x / 8) % 3 / 3, style: 'fire' }); break;
        case 'jaws':
          out.push({ t: 'piston', x, w: 20, side: 'ceil', reach: 64, period: 2.0, duty: 0.27, off: 0, style: 'jaw' });
          out.push({ t: 'piston', x, w: 20, side: 'floor', reach: 64, period: 2.0, duty: 0.27, off: 0.5, style: 'jaw' });
          break;
      }
    }
    out.push({ t: 'finish', x: lv.len, w: 4 });
    out.sort((a, b) => a.x - b.x);
    return out;
  };

  // ================================================================ v4: new platforms & obstacles
  // LIFT — a moving platform over a spike bed; the ceiling is spiked in the middle, so ride it.
  TEMPLATES.lift = function (x0, k, d, rng) {
    const sx = x0 + 40 * k;
    this.spikes(sx, 'floor', 15);
    this.spikes(sx + 40, 'ceil', 6);
    this.add({ t: 'solid', kind: 'lift', x: sx - 40, y: FF.MID, w: 170, h: 6, phase: null, yA: FF.MID - 4, yB: F - 34, period: 2.8 - 0.4 * d, off: rng() });
    this.coinLine(sx + 30, FF.MID + 10, 5, 16);
    return 40 * k + 120 + 50 * k;
  };

  // CRUMBLE — lands hold for a moment, then fall apart. Don't overstay.
  TEMPLATES.crumble = function (x0, k, d, rng) {
    const units = d > 0.55 && rng.chance(0.5) ? 2 : 1;
    let u = x0 + 40 * k;
    for (let i = 0; i < units; i++) {
      // wide, readable: the crumble covers the whole bed, ceiling spikes only near the end.
      // Everything stretches with speed, so the time you get (up, then drop onto it) stays the same.
      const K = this.gen.stretch ? Math.max(1, k) : 1;
      const bed = Math.ceil(104 * K / 8) * 8;
      this.spikes(u, 'floor', bed / 8);
      this.spikes(u + Math.round(64 * K), 'ceil', 3);
      this.add({ t: 'solid', kind: 'crumble', x: u - 8, y: FF.MID + 14, w: bed + 8, h: 6, phase: null });
      this.coinLine(u + Math.round(16 * K), FF.MID + 8, 4, Math.round(16 * K));
      u += bed + 70 * k;
    }
    return u - x0 + 20 * k;
  };

  // BUMPER — pinball alley: springs on both surfaces bounce you along; spikes between them. Don't touch!
  TEMPLATES.bumper = function (x0, k, d, rng) {
    const v = this.speedAt(x0);
    const sx = x0 + 40 * k;
    this.add({ t: 'pad', x: sx, w: 16, side: 'floor' });
    this.add({ t: 'pad', x: sx, w: 16, side: 'ceil' });
    // simulate the launch from the floor to find where each bounce lands
    // Simulate the launch WITH the bumpers we place, so the path is exact at any speed:
    // fly until we touch a surface, put a bumper there, rewind a moment and continue through it.
    const placed = [];
    const dummy = { near: () => placed, speedAt: (x) => this.speedAt(x), gravAt: (x) => this.gravAt(x) };
    const p = { x: sx + 2, y: F - PH, vy: 0, grav: 1, grounded: true, speed: v };
    Phys.flipState(p);
    p.vy = p.grav * 200;
    const g = ++this.groupId;
    const bounces = 2 + Math.round(d * 2);
    const hist = [];
    let guard = 0, lastX = sx;
    const bumps = [];
    while (bumps.length < bounces && guard++ < 4000) {
      hist.push(Phys.clone(p));
      if (hist.length > 60) hist.shift();
      p.speed = dummy.speedAt(p.x);
      Phys.step(p, 1 / 240, dummy, 0);
      if (p.padFlip) { p.padFlip = false; continue; }
      if (p.grounded) {
        const onFloor = p.grav > 0;
        const b = { t: 'bumper', x: Math.round(p.x - 6), y: onFloor ? F - 5 : C, w: 24, h: 5 };
        placed.push(b);
        bumps.push(b);
        const back = hist[Math.max(0, hist.length - 30)];
        Object.assign(p, Phys.clone(back));
        hist.length = 0;
      }
    }
    // coins along the real path
    const q = { x: sx + 2, y: F - PH, vy: 0, grav: 1, grounded: true, speed: v };
    Phys.flipState(q);
    q.vy = q.grav * 200;
    for (let i = 0; i < 4000 && q.x < (bumps.length ? bumps[bumps.length - 1].x : sx); i++) {
      q.speed = dummy.speedAt(q.x);
      Phys.step(q, 1 / 240, dummy, 0);
      q.padFlip = false;
      if (q.x - lastX > 14) { lastX = q.x; this.add({ t: 'coin', x: q.x + 6, y: q.y + 6, group: g }); }
    }
    let prev = sx + 24;
    for (const b of bumps) {
      this.add(Object.assign({}, b));
      this.add({ t: 'bumper', x: b.x, y: b.y === C ? F - 5 : C, w: 24, h: 5 });
      const n = Math.floor((b.x - 10 - prev) / 8);
      if (n > 0) { this.spikes(prev, 'floor', n); this.spikes(prev, 'ceil', n); }
      prev = b.x + 34;
    }
    return prev - x0 + 60 * k;
  };

  // FAN — a floor fan lifts you over spikes if you DON'T flip. Trust the wind.
  TEMPLATES.fan = function (x0, k, d, rng) {
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    const fx = x0 + 40 * k;
    this.add({ t: 'fan', x: fx, w: 80, side });
    this.spikes(fx + 28, side, 3);
    const g = ++this.groupId;
    for (let i = 0; i < 3; i++) this.add({ t: 'coin', x: fx + 32 + i * 8, y: side === 'floor' ? F - 30 : C + 30, gold: true, group: g });
    return 40 * k + 80 + 60 * k;
  };

  // DASH — a speed gate: everything after it comes faster for a short stretch.
  TEMPLATES.dash = function (x0, k, d, rng) {
    const gx = x0 + 30 * k;
    const len = 300;
    this.add({ t: 'dash', x: gx, w: 10, len });
    const kk = k * 1.5;
    const gap = (100 - 20 * d) * kk;
    let side = rng.chance(0.5) ? 'floor' : 'ceil';
    for (let x = gx + 70 * kk; x < gx + len - 20; x += gap) {
      this.spikes(x, side, 2);
      side = other(side);
    }
    this.coinLine(gx + 20, FF.MID, 10, 26);
    return 30 * k + len + 30 * k;
  };

  // POP SPIKES — they spring out on a beat (they shake first). Read them; flip only if needed.
  TEMPLATES.pop = function (x0, k, d, rng) {
    const n = 2 + Math.round(d);
    let x = x0 + 40 * k;
    let side = rng.chance(0.5) ? 'floor' : 'ceil';
    for (let i = 0; i < n; i++) {
      this.add({ t: 'pop', x, w: 24, side, period: 1.5 - 0.3 * d, off: rng() });
      this.spikes(x + 24 + 64 * k, other(side), 2);
      x += 24 + 64 * k + 16 + 64 * k;
      side = rng.chance(0.5) ? side : other(side);
    }
    return x - x0 + 20 * k;
  };

  // SAW — a buzzsaw rolling back and forth along a surface.
  TEMPLATES.saw = function (x0, k, d, rng) {
    const side = rng.chance(0.5) ? 'floor' : 'ceil';
    const sx = x0 + 40 * k;
    const range = 70 + Math.round(30 * d);
    this.add({ t: 'saw', x: sx - 8, w: range + 16, x0: sx, x1: sx + range, side, period: 1.6 - 0.4 * d, off: rng() });
    this.spikes(sx + range + 20 + 30 * k, other(side), 2);
    this.coinLine(sx, laneY(side), 5, range / 5);
    return 40 * k + range + 36 + 30 * k + 50 * k;
  };

  // ORBIT — a spiked ball circling mid-air: time your flip through the ring.
  TEMPLATES.orbit = function (x0, k, d, rng) {
    const n = d > 0.5 && rng.chance(0.5) ? 2 : 1;
    let x = x0 + 50 * k;
    for (let i = 0; i < n; i++) {
      const side = rng.chance(0.5) ? 'floor' : 'ceil';
      this.add({ t: 'orbit', x: x - 36, w: 72, cx: x, cy: FF.MID, r: 30, period: 1.8 - 0.4 * d, off: rng(), dir: rng.chance(0.5) ? 1 : -1 });
      this.spikes(x - 60, side, 2);
      this.add({ t: 'coin', x, y: FF.MID, gold: true, group: 0 });
      x += 140 * k;
    }
    return x - x0;
  };

  // PENDULUM — a spiked ball swinging from the ceiling, skimming just over the floor runner.
  TEMPLATES.pend = function (x0, k, d, rng) {
    const px = x0 + 80 * k;
    this.add({ t: 'pend', x: px - 70, w: 140, px, len: 96, amp: 0.75, period: 2.2 - 0.4 * d, off: rng() });
    // the forced lane change comes after the swing zone, with room to flip without crossing the ball
    const sp = px + 75 + Math.round(50 * k);
    this.spikes(sp, rng.chance(0.5) ? 'floor' : 'ceil', 2);
    this.coinLine(px - 30, F - 6, 5, 15);
    return sp + 16 - x0 + 40 * k;
  };

  // BLINK — a bridge that appears and vanishes on a beat over a spike bed (gems for the brave).
  TEMPLATES.blink = function (x0, k, d, rng) {
    const sx = x0 + 40 * k;
    this.spikes(sx, 'floor', 16);
    const per = 1.8 - 0.3 * d, off = rng();
    this.add({ t: 'solid', kind: 'blink', x: sx + 8, y: FF.MID + 6, w: 56, h: 6, phase: null, period: per, off });
    this.add({ t: 'solid', kind: 'blink', x: sx + 64, y: FF.MID + 6, w: 56, h: 6, phase: null, period: per, off: off + 0.5 });
    this.coinLine(sx + 16, FF.MID + 18, 6, 18, true);
    return 40 * k + 128 + 50 * k;
  };

  // FLY — a flight portal turns you into a flyer: hold to rise, let go to fall, through a winding tunnel.
  TEMPLATES.fly = function (x0, k, d, rng) {
    const ix = x0 + Math.round(30 * k);
    this.add({ t: 'flyIn', x: ix, w: 10 });
    const start = ix + Math.round(70 * k);
    // Endless (smooth books): a shorter, gentler tunnel — the crowd test showed long flights were a wall mid-run
    const soft = this.gen.smooth && !this.opts.campaign && !this.opts.script;
    const len = Math.round((soft ? 300 + 140 * d : 360 + 260 * d) * k / 16) * 16;
    const A = soft ? 7 + 6 * d : 9 + 9 * d, lam = 360 * k, ph = rng() * Math.PI * 2;
    const half = 47; // a little roomier than before, and the softer flight makes it easy to steer
    const g = ++this.groupId;
    for (let x = start, i = 0; x < start + len; x += 16, i++) {
      const ease = Math.min(1, (x - start) / (120 * k), (start + len - 16 - x) / (120 * k));
      const yc = Math.round(FF.MID + A * ease * Math.sin(((x - start) / lam) * Math.PI * 2 + ph * ease));
      if (yc - half > C + 1) this.add({ t: 'hblock', x, y: C, w: 16, h: yc - half - C, side: 'top' });
      if (yc + half < F - 1) this.add({ t: 'hblock', x, y: yc + half, w: 16, h: F - (yc + half), side: 'bottom' });
      if (i % 2 === 0) this.add({ t: 'coin', x: x + 8, y: yc, group: g });
    }
    const ox = start + len + Math.round(30 * k);
    this.add({ t: 'flyOut', x: ox, w: 10 });
    return ox - x0 + Math.round(60 * k);
  };

  // ================================================================ v8: things that SLAM out and pull back in
  // PISTON ROW — steel pistons punch out of the floor or ceiling and fill that whole lane.
  // The other lane is always safe, so you can read it and choose (or be brave and time it).
  TEMPLATES.piston = function (x0, k, d, rng) {
    const n = 3 + Math.round(2 * d);
    let x = x0 + Math.round(40 * k);
    let side = rng.chance(0.5) ? 'floor' : 'ceil';
    const per = 1.7 - 0.3 * d;
    for (let i = 0; i < n; i++) {
      this.add({ t: 'piston', x, w: 18, side, reach: 66, period: per, duty: 0.42, off: rng(), style: 'steel' });
      this.add({ t: 'coin', x: x + 9, y: laneY(other(side)), group: 0 });
      x += 18 + Math.round((84 + 20 * (1 - d)) * k);
      side = rng.chance(0.65) ? other(side) : side;
    }
    return x - x0 + Math.round(10 * k);
  };
  // JAWS — a pair of crushers at the same spot taking turns: top slams, both open, bottom slams, both open.
  // Like the laser gate: one side is always safe and the open moment is longer than it takes to pass.
  TEMPLATES.jaws = function (x0, k, d, rng) {
    const n = d > 0.6 ? 3 : 2;
    const per = 2.0, duty = 0.27;
    let x = x0 + Math.round(50 * k);
    for (let i = 0; i < n; i++) {
      const off = rng();
      this.add({ t: 'piston', x, w: 20, side: 'ceil', reach: 64, period: per, duty, off, style: 'jaw' });
      this.add({ t: 'piston', x, w: 20, side: 'floor', reach: 64, period: per, duty, off: off + 0.5, style: 'jaw' });
      x += 20 + Math.round(130 * k);
    }
    return x - x0;
  };
  // GEYSER FIELD — vents erupt with fire; the other surface is spiked between the vents, so you weave.
  TEMPLATES.geyser = function (x0, k, d, rng) {
    const n = 2 + Math.round(1.5 * d);
    const side = rng.chance(0.6) ? 'floor' : 'ceil';
    let x = x0 + Math.round(40 * k);
    for (let i = 0; i < n; i++) {
      this.add({ t: 'piston', x, w: 20, side, reach: 70, period: 1.4 - 0.2 * d, duty: 0.5, off: rng(), style: 'fire' });
      this.add({ t: 'coin', x: x + 10, y: laneY(other(side)), gold: i === n - 1, group: 0 });
      const gapStart = x + 20 + Math.round(56 * k), gapEnd = x + 20 + Math.round(150 * k);
      if (i < n - 1) this.spikes(gapStart, other(side), Math.max(2, Math.floor((gapEnd - gapStart - Math.round(50 * k)) / 8)));
      x = gapEnd;
    }
    return x - x0 + Math.round(10 * k);
  };

  // ---------------------------------------------------------------- NEW OBSTACLES (rules v6)
  // FIREBAR — an arm of fireballs spinning around the middle of the corridor. Pass when it's away from your lane.
  TEMPLATES.firebar = function (x0, k, d, rng) {
    const n = d > 0.6 ? 2 : 1;
    let x = x0 + Math.round(60 * k);
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? -1 : 1, period = 2.1 - 0.5 * Math.min(1, d), off = rng();
      for (const r of [12, 24, 36, 48]) this.add({ t: 'fball', x: x - 52, w: 104, cx: x, r, period, off, dir, pivot: r === 12 });
      this.add({ t: 'coin', x, y: FF.MID, gold: true, group: 0 });
      x += Math.round(150 * k);
    }
    return x - x0;
  };

  // SNAKE — a line of electric orbs rippling through one half of the corridor, licking into that lane.
  // Spikes push you into its lane first: flip away before it reaches you, ride past it, then flip back over the spikes that follow.
  TEMPLATES.snake = function (x0, k, d, rng) {
    const n = 8 + Math.round(3 * Math.min(1, d)), gap = 15, period = 1.6 - 0.4 * Math.min(1, d), step = 0.12 + 0.05 * rng();
    const lane = rng.chance(0.5) ? 'floor' : 'ceil', safe = other(lane), s = lane === 'floor' ? 1 : -1;
    const sx = x0 + Math.round(80 * k), ph0 = rng(), len = n * gap;
    this.spikes(x0 + Math.round(10 * k), safe, Math.max(2, Math.round(4 * k)));
    for (let i = 0; i < n; i++) this.add({ t: 'wdot', x: sx + i * gap, w: 7, cy: FF.MID + s * 26, amp: 34, period, ph: ph0 + i * step, head: i === 0 });
    this.coinLine(sx, laneY(safe), 5, 22);
    this.spikes(sx + len + Math.round(30 * k), lane, Math.max(2, Math.round(4 * k)));
    return Math.round(80 * k) + len + Math.round(30 * k) + Math.max(2, Math.round(4 * k)) * 8 + Math.round(60 * k);
  };

  // METEOR — rocks drop out of the ceiling and smash into the floor (a red column warns you first).
  // The ceiling lane is always safe from them; spikes between the meteors push you down to the floor in between.
  TEMPLATES.meteor = function (x0, k, d, rng) {
    const n = 2 + Math.round(2 * Math.min(1, d));
    let x = x0 + Math.round(50 * k);
    for (let i = 0; i < n; i++) {
      this.add({ t: 'meteor', x, w: 16, period: 1.5 - 0.3 * Math.min(1, d), duty: 0.45, off: rng() });
      this.add({ t: 'coin', x: x + 8, y: laneY('ceil'), group: 0 });
      // room to drop to the floor behind the meteor (not through it) before the ceiling spikes
      if (i < n - 1) this.spikes(x + 16 + Math.round(90 * k), 'ceil', 2);
      x += 16 + Math.round(90 * k) + 16 + Math.round(70 * k);
    }
    return x - x0 + Math.round(20 * k);
  };

  // BOUNCER — a spiked ball bouncing diagonally around a box of the corridor, like an old screensaver.
  TEMPLATES.bouncer = function (x0, k, d, rng) {
    const n = d > 0.6 ? 2 : 1;
    let x = x0 + Math.round(50 * k);
    for (let i = 0; i < n; i++) {
      // it drifts sideways at under half your speed — faster and it would ride along with you and be impossible to dodge
      const range = Math.round(55 * k);
      this.add({ t: 'bounce', x: x - 4, w: range + 8, x0: x, x1: x + range, px: 2.8 - 0.4 * Math.min(1, d), py: 0.9 - 0.2 * Math.min(1, d), off: rng() });
      this.add({ t: 'coin', x: x + range / 2, y: FF.MID, gold: i === n - 1, group: 0 });
      x += range + Math.round(80 * k);
    }
    return x - x0;
  };

  // RIFT — a swirling portal up in the ceiling lane. Flip into it to visit a bonus world for a while.
  // Skip it and you just run on (a calm stretch with floor coins). Either way you come out at the same spot.
  TEMPLATES.rift = function (x0, k, d, rng) {
    this.riftCount = (this.riftCount || 0) + 1;
    const rx = x0 + Math.round(90 * k);
    const kind = (this.riftCount - 1 + Math.floor(((this.opts.seed || 1) % 97))) % FF.RIFTS.length;
    // coins arcing up to the portal show the way
    const g = ++this.groupId;
    for (let i = 0; i < 5; i++) this.add({ t: 'coin', x: rx - 70 + i * 12, y: F - 10 - i * 18, group: g });
    this.add({ t: 'rift', x: rx, y: C, w: 18, h: 44, kind, n: this.riftCount, retX: rx + Math.round(150 * k) });
    this.coinLine(rx + 30, F - 6, 6, 18);
    return rx - x0 + Math.round(340 * k);
  };

  // The bonus worlds behind a rift. Short, intense, packed with coins. Clear it for a big reward;
  // crash inside and the rift just spits you back out (no death).
  FF.RIFTS = [
    { id: 'cosmos', name: 'COSMIC FLIGHT', nameAr: 'طيران كوني', steps: ['calm', 'fly', 'calm', { coinArt: 'star' }, 'fly'] },
    { id: 'vault', name: 'GOLD VAULT', nameAr: 'خزنة الذهب', steps: ['calm', { coinArt: 'crown' }, 'zigzag', 'pad', { coinArt: 'heart' }, 'catch', 'trajectory'] },
    { id: 'aurora', name: 'PISTON PANIC', nameAr: 'فوضى المكابس', steps: ['calm', 'piston', 'jaws', 'geyser', 'piston'] }
  ];
  FF.riftLevel = function (o, speed, d, seed) {
    const R = FF.RIFTS[o.kind];
    const id = 'rift-' + R.id + '-' + o.n + '-' + (seed % 1000);
    if (!isFinite(d)) d = 0.5;
    return new Level({ campaign: { id, speed: Math.round(FF.clamp(speed, 100, 175)), d: Math.max(0.3, Math.min(0.85, d)), ramp: 0, steps: [{ world: R.id }].concat(R.steps) }, noHints: true, seen: {} });
  };

  // ================================================================ Adventure: hand-built levels
  // A campaign level is a fixed list of steps: template names, '|' checkpoints and set pieces {name: n}.
  const SET_HINT = { weave: 'spikeC', ladder: 'catch', moverWave: 'mover', popRhythm: 'pop', sawHall: 'saw', pendRow: 'pend', liftRelay: 'lift', fanChain: 'fan', coinArt: null };
  Level.prototype.buildCampaign = function (c) {
    this.fixedSpeed = c.speed;
    this.opts.difficulty = c.d;
    this.rng = FF.mulberry32(FF.hashStr(c.id));
    this.checkpoints = [0];
    this.chunkStarts = [0];
    this.add({ t: 'hint', x: 30, key: 'tap', w: 0 });
    this.genX = 220;
    for (const step of c.steps) {
      // markers for multi-world levels: {world: 'id'} switches the look, {speed: n} the pace
      if (step && step.world) {
        (this.worldMarks || (this.worldMarks = [])).push({ x: this.genX, w: step.world });
        continue;
      }
      if (step && step.speed) {
        (this.speedMarks || (this.speedMarks = [{ x: 0, v: c.speed }])).push({ x: this.genX, v: step.speed });
        continue;
      }
      const k = this.speedAt(this.genX) / 100;
      if (step === '|') {
        this.add({ t: 'check', x: this.genX, w: 4 });
        this.checkpoints.push(this.genX);
        this.chunkStarts.push(this.genX);
        this.genX += 40;
        continue;
      }
      if (typeof step === 'string') { this.addChunk(step); continue; }
      const name = Object.keys(step)[0];
      const x0 = this.genX;
      const hk = SET_HINT[name];
      if (hk && !this.seen[hk] && !this.opts.noHints) { this.seen[hk] = true; this.add({ t: 'hint', x: x0 - 30, key: hk, w: 0 }); }
      const len = SET[name].call(this, x0, k, c.d, this.rng, step[name]);
      this.genX = x0 + Math.round(len) + Math.round(26 * k);
      this.lastName = name;
    }
    this.finishX = this.genX + 40;
    this.add({ t: 'finish', x: this.finishX, w: 4 });
    this.genX = Infinity;
  };

  const SET = {};
  FF.SET = SET;

  // WEAVE — the floor is spiked all the way; the ceiling has spike blocks you must duck under in mid-air.
  // b55 hand-made pattern for Adventure levels: {pat: 'run:gallop'} / 'stairs' / 'chain' / 'rush' / 'phase' / 'twin'
  SET.pat = function (x0, k, d, rng, arg) {
    const [kind, motif] = String(arg).split(':');
    this.introBeats = [kind]; this.forceMotif = motif && MOTIFS[motif] ? motif : null;
    try { return TEMPLATES.beat.call(this, x0, k, d, rng); } finally { this.forceMotif = null; this.introBeats = null; }
  };
  SET.weave = function (x0, k, d, rng, n) {
    // The floor is spiked except for a safe hole under each ceiling-spike block:
    // drop into the hole, run under the spikes, flip back up. (A mid-air duck also works for experts.)
    const seg = 24 + Math.round(8 * d / 8) * 8;
    const free = Math.round(110 * k);
    const bed = x0 + Math.round(50 * k);
    const before = Math.round(34 * k), after = Math.round(52 * k);
    let x = bed + free, floorFrom = bed;
    for (let i = 0; i < n; i++) {
      this.spikes(x, 'ceil', seg / 8);
      this.add({ t: 'coin', x: x + seg / 2, y: FF.MID + 6, gold: true, group: 0 });
      const holeA = x - before, holeB = x + seg + after;
      const nf = Math.floor((holeA - floorFrom) / 8);
      if (nf > 0) this.spikes(floorFrom, 'floor', nf);
      floorFrom = holeB;
      x += seg + free;
    }
    const nf = Math.floor((x - floorFrom) / 8);
    if (nf > 0) this.spikes(floorFrom, 'floor', nf);
    return x - x0 + 20 * k;
  };

  // PHASE LADDER — purple and blue platforms alternate high/low over two spike beds. Every flip hands you to the next one.
  SET.ladder = function (x0, k, d, rng, n) {
    const len = 120, ov = Math.round(34 * k) + 10, step = len - ov;
    const sx = x0 + Math.round(40 * k);
    const g = ++this.groupId;
    for (let i = 0; i < n; i++) {
      const x = sx + i * step;
      const ph = i % 2 === 0 ? 'p' : 'b';
      const y = ph === 'p' ? FF.MID - 26 : FF.MID + 14;
      this.add({ t: 'solid', kind: 'catch', x, y, w: len, h: 6, phase: ph });
      this.add({ t: 'coin', x: x + len / 2, y: ph === 'p' ? y + 12 : y - 6, gold: i % 3 === 2, group: g });
    }
    const end = sx + (n - 1) * step + len;
    this.spikes(sx + 52, 'ceil', Math.floor((end - 20 - (sx + 52)) / 8));
    this.spikes(sx + 72, 'floor', Math.floor((end - 20 - (sx + 72)) / 8));
    return end - x0 + 40 * k;
  };

  // CRUSHER WAVE — a row of crushers moving as a travelling wave.
  SET.moverWave = function (x0, k, d, rng, n) {
    const gap = Math.round(96 * k);
    for (let i = 0; i < n; i++) {
      this.add({ t: 'mover', x: x0 + 50 * k + i * gap, w: 14, h: 26, yMin: C, yMax: F - 26, period: 3.0 - 0.3 * d, off: i * 1.3 });
    }
    this.coinLine(x0 + 50 * k + 7, FF.MID, n, gap);
    return 50 * k + (n - 1) * gap + 14 + 60 * k;
  };

  // POP RHYTHM — floor and ceiling pop spikes take turns. Ride the beat.
  SET.popRhythm = function (x0, k, d, rng, n) {
    const per = 2.0 - 0.2 * d;
    let x = x0 + 40 * k;
    for (let i = 0; i < n; i++) {
      this.add({ t: 'pop', x, w: 16, side: 'floor', period: per, off: i * 0.18, duty: 0.28 });
      this.add({ t: 'pop', x, w: 16, side: 'ceil', period: per, off: 0.5 + i * 0.18, duty: 0.28 });
      this.add({ t: 'coin', x: x + 8, y: FF.MID, group: 0 });
      x += 16 + Math.round(84 * k);
    }
    return x - x0 + 30 * k;
  };

  // SAW HALL — a buzzsaw on the floor and one on the ceiling, half a beat apart.
  SET.sawHall = function (x0, k, d, rng, n) {
    let x = x0 + 40 * k;
    for (let i = 0; i < n; i++) {
      const per = 2.6 - 0.3 * d;
      // floor saw guards the first half, ceiling saw the second: always solvable by switching sides once,
      // in the gap between them.
      const top = i % 2 === 1;
      this.add({ t: 'saw', x: x - 8, w: 64, x0: x, x1: x + 48, side: top ? 'ceil' : 'floor', period: per, off: i * 0.3 });
      const G = Math.round(36 * k); // a saw-free hand-over gap: flip here, whatever the saws are doing
      this.add({ t: 'saw', x: x + 40 + G, w: 72, x0: x + 56 + G, x1: x + 104 + G, side: top ? 'floor' : 'ceil', period: per, off: i * 0.3 + 0.5 });
      x += 96 + G + Math.round(130 * k);
    }
    return x - x0;
  };

  // PENDULUM ROW — swinging balls out of phase, with spikes forcing flips between them.
  SET.pendRow = function (x0, k, d, rng, n) {
    const gap = Math.round(230 * k);
    let x = x0 + 80 * k;
    for (let i = 0; i < n; i++) {
      this.add({ t: 'pend', x: x - 70, w: 140, px: x, len: 96, amp: 0.7, period: 2.5 - 0.3 * d, off: i * 0.27 });
      if (i < n - 1 && i % 2 === 1) this.spikes(x + Math.round(gap / 2) - 8, 'ceil', 2);
      this.add({ t: 'coin', x, y: F - 6, group: 0 });
      x += gap;
    }
    return x - x0 - gap + 110 * k;
  };

  // LIFT RELAY — hop from lift to lift over a long spike bed; ceiling spikes above each lift force the ride.
  SET.liftRelay = function (x0, k, d, rng, n) {
    const bed = x0 + Math.round(40 * k);
    let x = bed;
    for (let i = 0; i < n; i++) {
      // lifts overlap a little and move together, so every hand-over is level (never a luck-based gap)
      this.add({ t: 'solid', kind: 'lift', x: x - 40, y: FF.MID, w: 160, h: 6, phase: null, yA: FF.MID - 4, yB: F - 34, period: 2.8 - 0.3 * d, off: 0 });
      this.spikes(x + 40, 'ceil', 4);
      this.coinLine(x + 4, FF.MID + 4, 4, 22);
      x += 152;
    }
    const end = x - 152 + 120; // the spike bed stops where the last lift ends: stepping off is always safe
    this.spikes(bed, 'floor', Math.floor((end - bed) / 8));
    return end - x0 + 40 * k;
  };

  // FAN CHAIN — several fans in a row; let the wind carry you.
  SET.fanChain = function (x0, k, d, rng, n) {
    let x = x0;
    for (let i = 0; i < n; i++) x += TEMPLATES.fan.call(this, x, k, d, rng);
    return x - x0;
  };

  // COIN ART — a breather with a little picture made of coins.
  const ART = {
    arrow: ['..#..', '...#.', '#####', '...#.', '..#..'],
    star: ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'],
    heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
    crown: ['#..#..#', '##.#.##', '#######', '#######', '.#####.']
  };
  SET.coinArt = function (x0, k, d, rng, shape) {
    const a = ART[shape] || ART.star;
    const g = ++this.groupId;
    const sx = x0 + 40 * k, sy = FF.MID - (a.length - 1) * 5;
    for (let r = 0; r < a.length; r++) for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] === '#') this.add({ t: 'coin', x: sx + c * 11, y: sy + r * 10, group: g });
    }
    return 40 * k + a[0].length * 11 + 50 * k;
  };

})(window.FF);
