// FLIPNOVA — one run: physics loop, skill moves, combo/frenzy, effects and the in-canvas HUD.
(function (FF) {
  'use strict';
  const W = FF.W, H = FF.H, C = FF.C, F = FF.F, PW = FF.PW, PH = FF.PH;
  const COL = FF.COLORS;
  const Phys = FF.Phys;
  const font = FF.font;

  function Game(opts) {
    this.opts = opts;
    this.mode = opts.mode; // endless | daily | zen | demo | campaign | custom (build 36: the Legend and the 1% challenges are gone)
    this.settings = opts.settings || {};
    this.cb = opts.callbacks || {};
    this.reset();
  }
  FF.Game = Game;

  Game.prototype.reset = function () {
    const o = this.opts;
    let seed = o.seed || Math.floor(Math.random() * 1e9);
    const lvlOpts = { seed, seen: o.seen || {}, noHints: this.mode === 'demo', genV: o.genV, book: o.book };
    if (this.mode === 'daily') lvlOpts.worldOffset = seed % (FF.WORLDS_BASE || FF.WORLDS.length);
    if (this.mode === 'campaign') {
      lvlOpts.campaign = o.level;
      lvlOpts.world = o.level.world;
    }
    // a title card + 3-2-1 before the run starts (great as a video hook)
    this.introT = o.intro ? INTRO_LEN : 0;
    if (this.mode === 'custom' || this.mode === 'editor') {
      lvlOpts.custom = o.custom;
      lvlOpts.world = o.custom.world;
      lvlOpts.noHints = true;
    }
    if (this.mode === 'zen') lvlOpts.difficulty = undefined;
    // ⚔️ boss fights: an open arena road (the boss brings every danger) at the fight's own speed
    if (this.mode === 'boss') { lvlOpts.custom = { world: 'volcano', len: 1e6, items: [], speed: 150 }; lvlOpts.world = 'volcano'; lvlOpts.noHints = true; }
    // 🎲 build 35: the week's road brings its TWIST, the Daily road its REMIX — decided by the seed alone,
    // so a replay (death replay, world-board proof, the leader's ghost) gets the very same road
    if (this.mode === 'endless' && !o.tutorial) { const tw = FF.weekTwist(lvlOpts.seed); if (tw) lvlOpts.twist = tw; }
    if (this.mode === 'daily') { const rx = FF.dailyRemix(lvlOpts.seed); if (rx) lvlOpts.remix = rx; }
    this.L = new FF.Level(lvlOpts);
    this.boss = this.mode === 'boss' && FF.BossFight ? new FF.BossFight(this, FF.BOSSES[o.boss || 'tyrant'], lvlOpts.seed) : null;
    this.twist = this.L.twist;
    this.remix = this.L.remix;
    this.weekRun = this.mode === 'endless' && !o.tutorial && (!!FF.weekKeyOfSeed(lvlOpts.seed) || lvlOpts.seed === FF.weekInfo().seed);
    this.inBurst = false;
    let sx = o.startX || 0;
    if (sx > 0 && this.L.stX) sx = this.L.fromNominal(sx); // rules v7: stages have their own lengths (startX is in 3000-px stages)
    if (sx > 0 && !this.L.opts.custom && !this.L.opts.campaign) {
      // never drop the player in the middle of an obstacle: start where the next one begins
      this.L.ensure(sx + 800);
      sx = this.L.chunkStarts.find((c) => c >= sx) || sx;
    }
    this.p = { x: sx, y: F - PH, vy: 0, grav: 1, grounded: true, speed: this.L.speedAt(sx) };
    this.stage = this.L.stageAt(sx);
    this.checkpoint = 0;
    this.deaths = 0;
    // recorded modes: every tap is queued to the next physics tick and logged, so the run can be replayed exactly
    this.rec = this.mode === 'endless' || this.mode === 'daily' || this.mode === 'boss';
    this.replay = this.rec && o.replay ? o.replay : null;
    this.seed = lvlOpts.seed;
    this.ri = 0;
    this.tickN = 0;
    this.inputs = [];
    this.pendingFlip = false;
    this.stageBanner = 0;
    this.maxStage = 1;
    this.mod = 'none';
    this.time = 0;
    this.acc = 0;
    this.camX = -FF.PLAYER_X;
    this.score = 0;
    this.distScore = 0;
    this.coins = 0;
    this.coinsTaken = 0;
    this.chain = 0;
    this.bestChain = 0;
    this.maxMult = 1;
    this.idleT = 0;
    this.frenzy = 0;
    this.frenzyT = 0;
    this.frenzies = 0;
    this.slowT = 0;
    this.perfStreak = 0;
    this.bestPerfStreak = 0;
    this.perfects = 0;
    this.perfAt = -9; // (visual only) when the last PERFECT landed: JACKPOT's 777 reel
    this.nears = 0;
    this.lines = 0;
    this.brave = 0;
    this.flips = 0;
    this.echoT = 0;
    this.glitchT = 0;
    this.lastFlipT = -1;
    this.particles = [];
    this.popups = [];
    this.flash = 0;
    this.flashCol = COL.blue;
    this.shake = 0;
    this.hitstop = 0;
    this.rings = [];   // Perfect-flip shockwaves (visual only)
    this.zoomT = 0;    // Perfect-flip camera punch (visual only)
    this.flow = 0;     // Experiment C: Perfect streak momentum (0..1), Endless/Daily only
    this.nerve = 0;    // v8 NERVE: bold taps in a row (GREAT / PERFECT / landing NEAR MISS); a safe early GOOD breaks it
    this.bestNerve = 0;
    this.greats = 0;
    this.runT = 0; this.mileI = 0; this.mileT = 0; this.mileName = ''; this.mileCol = '#fff'; // v8 time milestones (real seconds)
    this.soClose = 0;  // v8: metres short of your best flag when you died close to it
    this.dead = null;
    this.deadT = 0;
    this.ended = false;
    this.finished = false;
    this.paused = false;
    this.squash = 0;
    this.joyT = 0;
    this.lockShake = 0;
    this.invuln = 0;
    this.respawns = 0;
    this.history = [];
    this.failedGroups = {};
    this.forkLane = {};
    this.world = this.L.worldAt(sx);
    this.camX = sx - FF.PLAYER_X;
    this.worldPrev = null;
    this.worldFade = 0;
    this.worldBanner = this.boss ? 0 : 1.6;
    // rules v7: the run opens with its stage banner too (STAGE 1 · WARM UP), not only from stage 2 on
    if (this.L.stX && (this.mode === 'endless' || this.mode === 'daily')) { this.stageBanner = 2.4; this.mod = this.L.modAt(sx); }
    this.ghostRec = [];
    this.ghost = this.opts.ghost || null;
    this.botTick = 0;
    this.guides = !!this.settings.guides || this.mode === 'zen' || (this.opts.runs || 0) < 2;
    this.L.ensure(400);
  };

  Game.prototype.sfx = function (name, o) {
    if (this.mode === 'demo' || this.opts.silent) return;
    FF.audio && FF.audio.play(name, o);
  };
  Game.prototype.buzz = function (ms) {
    if (this.mode === 'demo' || !this.settings.vibration) return;
    try {
      if (window.AndroidBridge) window.AndroidBridge.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* not supported */ }
  };
  Game.prototype.emit = function (type, data) {
    if (this.mode === 'demo' || this.opts.silent || this.replay) return;
    this.cb.onEvent && this.cb.onEvent(type, data);
  };

  Game.prototype.mult = function () {
    return this.chain >= 10 ? 3 : this.chain >= 4 ? 2 : 1;
  };

  // ------------------------------------------------------------------ input
  // Legend runs are tick-exact: taps are queued and applied at the next physics tick, and the tick number
  // is recorded. Replaying those ticks reproduces the run exactly — that is the completion proof.
  Game.prototype.flip = function () {
    if (this.replay || this.introT > 0) return;
    if (this.dead && this.boss) { this.boss.skipDefeat(); return; } // ⚔️ a tap skips the defeat cinematic
    if (this.rec) {
      if (this.p.fly && this.p.thrust) return;
      if (!this.dead && !this.ended && !this.paused) this.pendingFlip = true;
      return;
    }
    if (this.p.fly) { if (!this.dead && !this.paused && !this.p.thrust) this.p.thrust = true; return; } // hold to fly
    this.doFlip();
  };

  Game.prototype.release = function () {
    if (this.replay || this.introT > 0) return;
    if (this.rec) { if (this.p.fly && this.p.thrust) this.pendingFlip = true; return; } // recorded as a toggle
    if (this.p.fly && this.p.thrust) this.p.thrust = false;
  };
  // ⚔️ b42: the boss duel's ULTIMATE (the ULT button, a key, or a tap held down): queued for the next tick and recorded
  Game.prototype.ultAct = function () {
    if (this.replay || !this.boss || this.dead || this.ended || this.paused) return false;
    if (!this.boss.ultReady()) return false;
    if (this.rec) { this.pendingUlt = true; return true; }
    return this.boss.ultimate();
  };
  // what a bot "tap" means: a gravity flip, or toggling the thruster while flying
  Game.prototype.botAct = function () {
    if (this.rec && !this.replay) { this.pendingFlip = true; return; } // recorded runs: same path as a real tap
    if (this.p.fly) Phys.flipState(this.p);
    else this.flip();
  };

  Game.prototype.doFlip = function () {
    if (this.dead || this.ended || this.paused) return false;
    const p = this.p;
    if (p.fly) { Phys.flipState(p); return true; } // thruster toggle (no cooldown)
    if (this.time - this.lastFlipT < 0.07) return false;
    if (this.L.inLock(p.x)) {
      this.lockShake = 0.25;
      this.sfx('lock');
      return false;
    }
    // Was this flip a Perfect? (simulate "no flip" — would we have died very soon?)
    const qualifies = p.grounded || this.time - this.lastFlipT > 0.3;
    const graded = this.graded();
    let perfect = false, grade = 0; // grade (Endless/Daily on rules v8): 2 GREAT, 1 GOOD — every saving tap answers you
    if (qualifies) {
      const tNo = Phys.timeToDeath(p, this.L, this.time, graded ? 0.75 : 0.3);
      if (tNo !== null && tNo <= 0.26) {
        const q = Phys.clone(p);
        Phys.flipState(q);
        const tYes = Phys.timeToDeath(q, this.L, this.time, 0.3);
        perfect = tYes === null;
      } else if (graded && tNo !== null) {
        const q = Phys.clone(p);
        Phys.flipState(q);
        if (Phys.timeToDeath(q, this.L, this.time, 0.3) === null) grade = tNo <= 0.45 ? 2 : 1;
      }
    }
    Phys.flipState(p);
    this.lastFlipT = this.time;
    this.flips++;
    if (this.boss) this.boss.onFlip();
    // Anti-cheat fairness: a phase object that appears *inside* the player is ghosted until left.
    const ph = Phys.phaseOf(p.grav);
    for (const o of this.L.near(p.x - 2, p.x + PW + 2)) {
      if (o.t === 'solid' && o.phase === ph && Phys.overlap(p.x, p.y, PW, PH, o.x, o.y, o.w, o.h)) o.ghost = true;
    }
    this.flash = 1;
    this.flashCol = ph === 'b' ? COL.blue : COL.purple;
    this.squash = -1;
    // v8 tap feel: a puff of sparks kicks off the surface you leave (in the colour you're flipping into)
    if (this.mode !== 'demo' && !this.boss) {
      const fromY = p.grav < 0 ? F : C; // (gravity has already flipped: we left the opposite surface)
      this.burst(p.x + 6, fromY, [this.flashCol, '#ffffff'], this.settings.reduceFx ? 3 : 7, 70, 1);
      for (let i = this.particles.length - 7; i < this.particles.length; i++) if (i >= 0) this.particles[i].vy = Math.abs(this.particles[i].vy) * (p.grav < 0 ? -1 : 1) * -1;
    }
    this.sfx('flip', { up: p.grav < 0 });
    this.buzz(6);
    if (this.flips === 1) this.emit('ach', 'first_flip');
    if (perfect) {
      this.perfects++;
      this.perfAt = this.time;
      this.perfStreak++;
      this.bestPerfStreak = Math.max(this.bestPerfStreak, this.perfStreak);
      this.skill('PERFECT!', COL.perfect, 30, 0.18);
      // the first PERFECT of a run lands hard: a tiny freeze + a squash (real time only, the physics ticks don't change)
      if (this.perfects === 1 && this.mode !== 'demo' && !this.settings.reduceFx) { this.hitstop = Math.max(this.hitstop, 0.05); this.squash = 1.4; this.shake = Math.max(this.shake, 0.12); }
      if (this.mode !== 'demo') this.slowT = 0.14;
      this.sfx('perfect');
      this.burst(p.x + 6, p.grav > 0 ? p.y + PH : p.y, COL.perfect, 10, 50);
      // Experiment A (15 Nov review): make a Perfect felt, not only counted. Pure feedback, physics untouched.
      if (this.mode !== 'demo') {
        const lvl = Math.min(this.perfStreak, 5);
        this.rings.push({ x: p.x + 6, y: p.y + 6, t: 0, life: 0.32, r: 26 + lvl * 6, col: lvl >= 3 ? '#ffffff' : COL.perfect });
        if (!this.settings.reduceFx) {
          this.hitstop = Math.max(this.hitstop, 0.035);
          this.zoomT = 0.16;
          this.shake = Math.max(this.shake, 0.06 + lvl * 0.015);
        }
        this.buzz(14);
        this.flowAdd(0.25);
        if (graded) this.nerveHit();
      }
      if (this.perfStreak === 3) {
        this.echoT = 4;
        this.popup('FLIP ECHO', COL.blueLight, 14);
      }
      if (this.perfStreak >= 5) this.emit('ach', 'perfect_rhythm');
    } else {
      this.perfStreak = 0;
      if (grade === 2) { // GREAT: late enough to count — a small ring, combo, a little FLOW
        this.skill('GREAT', '#9be7ff', 12, 0.08);
        this.greats++;
        this.rings.push({ x: p.x + 6, y: p.y + 6, t: 0, life: 0.22, r: 16, col: '#9be7ff' });
        this.flowAdd(0.12);
        this.nerveHit();
      } else if (grade === 1) { // GOOD: safe and early — a quiet ring, a few points, no text
        this.addScore(4);
        this.rings.push({ x: p.x + 6, y: p.y + 6, t: 0, life: 0.16, r: 10, col: '#cfd6ff' });
        this.nerveBreak();
      }
    }
    return true;
  };
  // tap grades, the landing near miss and their points only exist on rules v8 in Endless/Daily
  // (older replay proofs, the Adventure, the Legend and the bosses score exactly as before)
  Game.prototype.graded = function () {
    return (this.mode === 'endless' || this.mode === 'daily') && !this.boss && !!(this.L.gen && this.L.gen.dense);
  };
  // NERVE (push your luck, after Downwell's combo): waiting for the late tap keeps the streak and pays more,
  // the safe early tap costs it. Tiers pay coins once and multiply score while you hold them. Never easier.
  const MILES = [[10, 'SPARK', '#7dffb2'], [20, 'GLOW', '#27d7ff'], [30, 'BLAZE', '#ffb000'], [45, 'SURGE', '#ff6a3c'], [60, 'NOVA', '#ff3cf2'], [90, 'SUPERNOVA', '#ffffff'], [120, 'HYPERNOVA', '#ffd23f'], [180, 'INFINITE', '#b45cff']];
  const NERVE = [[8, 'HOT', '#ffb000', 1.5, 10], [15, 'BLAZING', '#ff6a3c', 2, 25], [25, 'UNREAL', '#ff3cf2', 3, 50], [40, 'NOVA', '#ffffff', 4, 100]];
  Game.prototype.nerveTier = function () { let t = -1; for (let i = 0; i < NERVE.length; i++) if (this.nerve >= NERVE[i][0]) t = i; return t; };
  Game.prototype.nerveMul = function () { const t = this.nerveTier(); return t < 0 ? 1 : NERVE[t][3]; };
  Game.prototype.nerveHit = function () {
    this.nerve++;
    this.bestNerve = Math.max(this.bestNerve, this.nerve);
    const T = NERVE.find((x) => x[0] === this.nerve);
    if (!T) return;
    this.coins += T[4];
    this.popup(T[1] + '!', T[2], 26);
    this.popup('+' + T[4] + ' x' + T[3], COL.coin, 12);
    this.flash = 1; this.flashCol = T[2];
    this.shake = Math.max(this.shake, this.settings.reduceFx ? 0.08 : 0.22);
    this.burst(this.p.x + 6, this.p.y + 6, [T[2], '#ffffff', COL.coin], 24, 110, 2);
    this.sfx(this.nerve >= 25 ? 'record' : 'frenzy');
    this.buzz(25);
  };
  Game.prototype.nerveBreak = function () {
    if (this.nerve >= 8) { this.popup('NERVE LOST', '#8a90b8', 18); this.sfx('lock'); this.buzz(12); }
    this.nerve = 0;
  };
  Game.prototype.flowAdd = function (v) {
    if (this.mode !== 'endless' && this.mode !== 'daily') return;
    const was = this.flow;
    this.flow = Math.min(1, this.flow + v);
    if (this.flow >= 1 && was < 1) { this.popup('MAX FLOW', '#27d7ff', 22); this.speedFx = 1.5; }
  };

  // ------------------------------------------------------------------ scoring
  Game.prototype.skill = function (text, color, pts, meter, chainAdd) {
    const before = this.mult();
    this.chain += chainAdd || 1;
    this.bestChain = Math.max(this.bestChain, this.chain);
    this.idleT = 0;
    const m = this.mult();
    this.addScore(pts);
    this.popup(text, color);
    this.joyT = 0.35;
    if (m > before) {
      this.maxMult = Math.max(this.maxMult, m);
      this.popup('x' + m + ' COMBO', COL.frenzy, 14);
      this.sfx('combo', { level: m });
      this.buzz(12);
      if (m === 3) this.emit('ach', 'combo_x3');
    }
    if (this.frenzyT <= 0) {
      this.frenzy += meter;
      if (this.frenzy >= 1) {
        this.frenzy = 0;
        this.frenzyT = 6;
        this.frenzies++;
        this.popup('FRENZY!', COL.frenzy, 20);
        this.sfx('frenzy');
        this.buzz(20);
        this.emit('ach', 'frenzy');
      }
    }
  };
  Game.prototype.addScore = function (pts) {
    this.score += Math.round(pts * this.mult() * (this.frenzyT > 0 ? 2 : 1) * (this.nerve >= 8 ? this.nerveMul() : 1));
  };

  // ------------------------------------------------------------------ effects
  Game.prototype.popup = function (text, color, dy) {
    if (this.mode === 'demo') return;
    if (this.boss && this.popups.length >= 2) this.popups.shift(); // the duel keeps the screen clean
    this.popups.push({ text, color, x: FF.PLAYER_X + 6, y: this.p.y - this.camY() - 10 + (this.p.grav > 0 ? -(dy || 0) : 22 + (dy || 0)), t: 0, life: 0.8 });
  };
  Game.prototype.camY = function () { return 0; };
  // build 38 perf: particles are pooled (no object per spark, no new array per frame) and capped
  const PPOOL = [], PMAX = 220;
  Game.prototype.burst = function (x, y, color, n, spd, size) {
    const reduce = this.settings.reduceFx;
    n = reduce ? Math.ceil(n / 3) : n;
    n = Math.min(n, PMAX - this.particles.length);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.4 + Math.random() * 0.8);
      const q = PPOOL.pop() || {};
      q.x = x; q.y = y; q.vx = Math.cos(a) * s; q.vy = Math.sin(a) * s; q.life = 0.35 + Math.random() * 0.35; q.t = 0;
      q.color = Array.isArray(color) ? color[i % color.length] : color; q.size = size || (Math.random() < 0.3 ? 2 : 1); q.g = 0;
      this.particles.push(q);
    }
  };

  // ------------------------------------------------------------------ update
  Game.prototype.update = function (dt) {
    if (this.paused || this.ended) return;
    const realDt = Math.min(dt, 0.05);
    // the whole game runs a bit faster than real time (1.25×, challenges 1.5×) — part of the game, so runs still count.
    // Physics always steps at FF.STEP, so replays and proofs don't depend on it.
    dt = realDt * (this.opts.timeScale || 1) * Game.modeSpeedAt(this.mode, this.inRift ? this.inRift.retX : this.p.x, this.inRift ? this.inRift.mainL : this.L);
    // FLOW: chained Perfects make the run go up to 15% faster in real time. Ticks are untouched, so replays,
    // proofs and level fairness are exactly the same; only your reaction window shrinks. Never easier.
    if (this.flow > 0) dt *= 1 + 0.15 * this.flow;
    this.updateFx(dt);
    // v8 MILESTONES (after Super Hexagon's callouts): a name at 10, 20, 30, 45, 60, 90, 120, 180 real seconds
    if (this.introT <= 0 && !this.dead && !this.victory && this.graded()) {
      this.runT += realDt;
      const M = MILES[this.mileI];
      if (M && this.runT >= M[0]) {
        this.mileI++; this.mileName = M[1]; this.mileCol = M[2]; this.mileT = 1.6;
        this.sfx('record'); this.flash = 1; this.flashCol = M[2]; this.buzz(20);
      }
    }
    this.mileT = Math.max(0, this.mileT - realDt);
    // tiny bullet-time on skill moves: feels great, never changes the physics
    if (this.slowT > 0) {
      this.slowT -= dt;
      dt *= 0.4;
    }
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }
    if (this.introT > 0) {
      this.introT -= realDt; // the countdown is always in real seconds
      if (this.introT <= 0) { this.popup('GO!', COL.perfect, 22); this.sfx('uiGo'); this.flash = 0.6; this.flashCol = COL.perfect; }
      else if (Math.ceil(this.introT) !== Math.ceil(this.introT + realDt) && this.introT < 3) this.sfx('ui');
      return;
    }
    if (this.victory) { this.updateVictory(dt); return; }
    if (this.dead) {
      this.deadT += dt;
      if (this.mode === 'campaign' && this.deadT > 0.75) this.respawnAtCheckpoint();
      else if (this.mode === 'zen' && this.deadT > 0.7) this.respawn();
      else if (this.mode === 'demo' && this.deadT > 1.2) { this.opts.seed = 0; this.reset(); }
      else if (this.boss) { this.boss.defeatTick(this.deadT); if (this.deadT > FF.BOSS_DEFEAT_LEN && !this.ended) this.end(); } // ⚔️ build 38: the defeat cinematic
      else if (this.deadT > (this.mode === 'endless' ? (this.soClose ? 1.15 : 0.45) : 0.95) && !this.ended && this.mode !== 'zen' && this.mode !== 'demo' && this.mode !== 'campaign') this.end();
      return;
    }
    this.acc += dt;
    while (this.acc >= FF.STEP && !this.dead && !this.ended) {
      this.tick(FF.STEP);
      this.acc -= FF.STEP;
    }
  };

  const INTRO_LEN = 3.6;
  const VIRAL_SPEED = 1.5, GAME_SPEED = 1.25;
  Game.VIRAL_SPEED = VIRAL_SPEED;
  Game.GAME_SPEED = GAME_SPEED;
  Game.modeSpeed = (mode) => (mode === 'demo' || mode === 'editor' ? 1 : GAME_SPEED);
  // Endless and Daily start at 1.1x (build 35: never slower than the tutorial — it was 1x) and the whole game speeds up fast:
  // 1.5x at 10500 px (the start of stage 5 now that stage 1 is 1500 px; it was 12000): never slower than before anywhere,
  // then it ACCELERATES — every stage climbs more than the one before — up to 2.2x at the end of stage 22
  // b56 (Amir: '1.56x after 20 seconds, illogical'): the time scale climbs to MID over ~30000 px (4-5 min) instead of
  // 10500 (about a minute); the top speed at the end of the book is the same.
  const START_SPEED = 1.1, RAMP_LEN = 20000, MID_SPEED = VIRAL_SPEED, END_X = 22 * 3000, END_SPEED = 2.2; // (b57/b58: quicker again)
  const endlessSpeed = (x, endX) => {
    if (x < RAMP_LEN) return START_SPEED + (MID_SPEED - START_SPEED) * Math.max(0, x) / RAMP_LEN;
    const u = FF.clamp((x - RAMP_LEN) / ((endX || END_X) - RAMP_LEN), 0, 1);
    return MID_SPEED + (END_SPEED - MID_SPEED) * u * u;
  };
  // L (optional): the run's level — rules v12 put the top speed back at about the end of stage 22 (L.gen.topX)
  Game.modeSpeedAt = (mode, x, L) => (mode === 'endless' || mode === 'daily' ? endlessSpeed(x || 0, L && L.gen && L.gen.topX) : Game.modeSpeed(mode));
  // how fast the run is compared to its start (what the speedometer shows: 1.00x, 1.50x, 2.00x…)
  Game.prototype.speedFactor = function () {
    const x = this.p.x, L = this.L;
    const v0 = L.speedAt(0) * Game.modeSpeedAt(this.mode, 0, L);
    return (L.speedAt(x) * Game.modeSpeedAt(this.mode, x, L)) / Math.max(1, v0);
  };
  Game.prototype.renderIntro = function (ctx) {
    const lv = this.opts.level || {}, t = INTRO_LEN - this.introT;
    ctx.fillStyle = 'rgba(5,6,13,0.72)';
    ctx.fillRect(0, 0, W, H);
    const k = Math.min(1, t / 0.25);
    font.draw(ctx, 'CHALLENGE', W / 2, 22, { color: '#ff5a6e', align: 'center', outline: '#05060d' });
    font.draw(ctx, lv.title || '', W / 2, 36, { color: COL.coin, align: 'center', outline: '#3a2000', scale: k < 1 ? 3 : 2 });
    if (t > 0.35) font.draw(ctx, lv.hook || '', W / 2, 62, { color: '#ffffff', align: 'center', outline: '#05060d' });
    if (t > 0.6) {
      // difficulty as little pixel skulls
      const n = lv.skulls || 1, S = ['.###.', '#.#.#', '#####', '.#.#.'];
      for (let i = 0; i < n; i++) {
        const sx = Math.round(W / 2 - (n * 14) / 2 + i * 14 + 2);
        S.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') { ctx.fillStyle = '#ff5a6e'; ctx.fillRect(sx + x * 2, 74 + y * 2, 2, 2); } }));
      }
    }
    if (t > 0.6) font.draw(ctx, 'TRY ' + (this.opts.attempt || 1), W / 2, 90, { color: '#cfd6ff', align: 'center', outline: '#05060d' });
    const left = Math.ceil(this.introT);
    if (this.introT <= 3) {
      const f = this.introT - Math.floor(this.introT);
      font.draw(ctx, String(left), W / 2, 112, { color: left === 1 ? COL.perfect : '#ffffff', align: 'center', outline: '#05060d', scale: f > 0.75 ? 4 : 3 });
    }
  };
  const VICTORY_LEN = 4.4;
  Game.prototype.updateVictory = function (dt) {
    const v = this.victory, p = this.p;
    v.t += dt;
    this.stageBanner = 0; this.worldBanner = 0; // the victory owns the screen
    // a slow, happy jog along the floor while the sky lights up
    p.grav = 1; p.fly = false; p.y = F - PH; p.vy = 0; p.grounded = true;
    p.x += Math.max(30, 110 - v.t * 22) * dt;
    this.camX = p.x - FF.PLAYER_X;
    this.joyT = 1;
    if (v.t >= v.next) {
      v.next = v.t + 0.22;
      const cols = [[COL.coin, '#fff6c2'], ['#ff5ad1', '#ffd1ec'], [COL.blue, '#d8f4ff'], [COL.perfect, '#ffffff'], ['#ff9a3c', '#ffe066']];
      const c = cols[Math.floor(Math.random() * cols.length)];
      const fx = this.camX + 30 + Math.random() * (W - 60), fy = 20 + Math.random() * 90;
      this.burst(fx, fy, c, 30, 120, 2);
      this.burst(fx, fy, '#ffffff', 8, 40, 1);
      if (Math.random() < 0.6) this.sfx('coin');
    }
    if (v.t > 1.2 && !v.cheer) { v.cheer = true; this.sfx('record'); this.flash = 1; this.flashCol = COL.coin; this.shake = 0.3; }
    if (v.t > 2.4 && !v.soon) { v.soon = true; this.sfx('frenzy'); this.flash = 0.8; this.flashCol = '#ff5ad1'; }
    if (v.t > 3.3 && this.opts.soonFirst && !v.gift) { v.gift = true; this.sfx('record'); this.flash = 1; this.flashCol = '#ff9a3c'; }
    if (v.t >= VICTORY_LEN + (this.opts.soonFirst ? 1.4 : 0)) this.end();
  };
  Game.prototype.renderVictory = function (ctx) {
    const v = this.victory, t = v.t;
    ctx.fillStyle = 'rgba(5,6,13,' + Math.min(0.55, t * 0.5).toFixed(2) + ')';
    ctx.fillRect(0, 0, W, H);
    const pop = (k) => 1 + Math.max(0, 1 - k * 4) * 0.8; // squash-in
    const n = this.L.book ? this.L.book.stages.length : 0;
    if (t < 1.2) {
      const k = t / 1.2;
      font.draw(ctx, 'STAGE ' + n + ' CLEARED', W / 2, 54, { color: '#ffffff', align: 'center', outline: '#05060d', scale: k < 0.15 ? 3 : 2 });
    } else {
      const k = t - 1.2;
      font.draw(ctx, 'ALL STAGES', W / 2, 34, { color: COL.coin, align: 'center', outline: '#3a2000', scale: Math.round(2 * pop(k)) || 2 });
      font.draw(ctx, 'CLEARED!', W / 2, 54, { color: COL.coin, align: 'center', outline: '#3a2000', scale: Math.round(2 * pop(k)) || 2 });
    }
    if (t > 2.4) {
      const k = t - 2.4;
      const hue = Math.round((t * 160) % 360);
      if (Math.floor(t * 6) % 6 !== 0 || k < 0.6) font.draw(ctx, 'COMING SOON', W / 2, 92, { color: 'hsl(' + hue + ',100%,70%)', align: 'center', outline: '#05060d', scale: k < 0.12 ? 3 : 2 });
      font.draw(ctx, 'NEW STAGES ARE ON THE WAY', W / 2, 116, { color: '#cfd6ff', align: 'center', outline: '#05060d' });
    }
    // first time ever: the gift skin pops out
    if (this.opts.soonFirst && t > 3.3) {
      const k = Math.min(1, (t - 3.3) / 0.35);
      ctx.fillStyle = 'rgba(5,6,13,0.6)';
      ctx.fillRect(W / 2 - 84, 124, 184, 54);
      FF.drawFlippoBig(ctx, W / 2 - 78, 128 + Math.round((1 - k) * 20), 2, { skin: 'nova', face: 'joy', t: this.time });
      font.draw(ctx, 'GIFT UNLOCKED', W / 2 + 30, 136, { color: '#ff9a3c', align: 'center', outline: '#05060d' });
      font.draw(ctx, 'NOVA SKIN', W / 2 + 30, 150, { color: '#ffffff', align: 'center', outline: '#05060d', scale: 2 });
    }
  };

  Game.prototype.updateFx = function (dt) {
    for (const q of this.particles) {
      q.t += dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += q.g * dt;
      q.vx *= 0.96;
      q.vy *= 0.96;
    }
    const P = this.particles; let j = 0; // compact in place; the dead ones go back to the pool
    for (let i = 0; i < P.length; i++) { const q = P[i]; if (q.t < q.life) P[j++] = q; else if (PPOOL.length < 400) PPOOL.push(q); }
    P.length = j;
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < r.life);
    this.zoomT = Math.max(0, this.zoomT - dt);
    if (this.flow > 0 && !this.dead) this.flow = Math.max(0, this.flow - dt * 0.06); // ~16 s from full to zero
    for (const u of this.popups) u.t += dt;
    this.popups = this.popups.filter((u) => u.t < u.life);
    this.flash = Math.max(0, this.flash - dt * 9);
    this.shake = Math.max(0, this.shake - dt);
    this.joyT = Math.max(0, this.joyT - dt);
    this.lockShake = Math.max(0, this.lockShake - dt);
    this.worldBanner = Math.max(0, this.worldBanner - dt);
    this.stageBanner = Math.max(0, this.stageBanner - dt);
    this.speedFx = Math.max(0, (this.speedFx || 0) - dt);
    this.speedPulse = Math.max(0, (this.speedPulse || 0) - dt * 1.5);
    if (this.riftBanner > 0) this.riftBanner -= dt;
    if (this.worldFade > 0) this.worldFade = Math.max(0, this.worldFade - dt);
    this.squash *= Math.pow(0.0005, dt);
  };

  Game.prototype.tick = function (dt) {
    const p = this.p, L = this.L;
    this.prevCam = this.camX; this.prevPX = p.x; this.prevPY = p.y;
    if (this.rec) {
      this.tickN++;
      if (this.replay) {
        // (b42: a negative entry is the boss duel's ULTIMATE, fired on that tick)
        while (this.ri < this.replay.length && Math.abs(this.replay[this.ri]) === this.tickN) { const v = this.replay[this.ri++]; if (v < 0) { if (this.boss) this.boss.ultimate(); } else this.doFlip(); }
      } else {
        if (this.pendingFlip) {
          this.pendingFlip = false;
          if (this.doFlip()) this.inputs.push(this.tickN);
        }
        if (this.pendingUlt) { this.pendingUlt = false; if (this.boss && this.boss.ultimate()) this.inputs.push(-this.tickN); }
      }
    }
    this.time += dt;
    L.ensure(p.x + 220);
    p.speed = L.speedAt(p.x);
    const wasGround = p.grounded;
    const prevX = p.x;

    if (this.mode === 'demo' && (++this.botTick & 1) === 0 && Phys.botShouldFlip(p, L, this.time)) this.botAct();

    const res = Phys.step(p, dt, L, this.time, true);
    if (res && this.invuln <= 0 && !this.opts.god) return this.inRift ? this.exitRift(false) : this.die(res);
    if (this.boss && (this.boss.tick(dt) || this.ended)) return;
    if (p.portal) {
      const into = p.portal === 'flyIn';
      p.portal = null;
      this.flash = 1;
      this.flashCol = into ? '#ff9a3c' : COL.blue;
      this.sfx(into ? 'frenzy' : 'world');
      this.popup(into ? 'FLY!' : 'LAND!', into ? '#ffb000' : COL.blueLight, 16);
      if (into) this.emit('hint', 'fly');
    }
    if (p.padFlip) {
      p.padFlip = false;
      this.flash = 1;
      this.flashCol = Phys.phaseOf(p.grav) === 'b' ? COL.blue : COL.purple;
      this.squash = -1;
      this.sfx('pad');
      this.buzz(10);
      this.burst(p.x + 6, p.grav > 0 ? p.y : p.y + PH, '#39ff88', 8, 60);
      this.popup('BOING!', '#39ff88');
    }
    if (this.invuln > 0) this.invuln -= dt;

    if (!wasGround && p.grounded) {
      this.squash = 1;
      if (this.mode !== 'demo') this.burst(p.x + 6, p.grav > 0 ? p.y + PH : p.y, this.world.edge, 4, 30);
      if (this.graded() && !this.settings.reduceFx) this.shake = Math.max(this.shake, 0.035); // v8: a light jolt on landing
      // NEAR MISS (v8): you landed right behind spikes on the surface you flipped to — the old 5px rule never fired
      if (this.graded()) {
        const dir = p.grav > 0 ? 'up' : 'down';
        for (const o of L.near(p.x - 16, p.x)) {
          if (o.t === 'spike' && o.dir === dir && !o.nmDone && o.x + o.w <= p.x + 1 && p.x - (o.x + o.w) <= 10) {
            o.nmDone = true;
            this.nears++;
            this.skill('NEAR MISS', COL.near, 20, 0.14);
            this.slowT = 0.1;
            this.sfx('near');
            this.buzz(8);
            this.flowAdd(0.12);
            this.nerveHit();
            break;
          }
        }
      }
    }

    // distance score
    this.distScore += (p.x - prevX) / 10;
    while (this.distScore >= 1) {
      this.distScore -= 1;
      this.addScore(1);
    }

    const near = L.near(p.x - 30, p.x + 40);
    const frz = this.frenzyT > 0;
    for (const o of near) {
      if (o.ghost && !Phys.overlap(p.x, p.y, PW, PH, o.x, o.y, o.w, o.h)) o.ghost = false;
      switch (o.t) {
        case 'coin':
          if (o.taken) break;
          if (frz) {
            const dx = p.x + 6 - o.x, dy = p.y + 6 - o.y;
            if (dx * dx + dy * dy < 40 * 40) {
              o.x += dx * dt * 9;
              o.y += dy * dt * 9;
            }
          }
          if (Phys.overlap(p.x - 2, p.y - 2, PW + 4, PH + 4, o.x - 3, o.y - 3, 7, 7)) this.takeCoin(o);
          else if (o.x < p.x - 6 && o.group) this.failedGroups[o.group] = true;
          break;
        case 'spike':
        case 'laser':
        case 'mover': {
          const r = Phys.hazardRect(o, this.time);
          if (!r) break;
          const gx = Math.max(r[0] - (p.x + PW), p.x - (r[0] + r[2]), 0);
          const gy = Math.max(r[1] - (p.y + PH), p.y - (r[1] + r[3]), 0);
          if (gx <= 2) o.minGap = Math.min(o.minGap === undefined ? 99 : o.minGap, gy);
          if (!o.nmDone && p.x > r[0] + r[2]) {
            o.nmDone = true;
            if (o.minGap !== undefined && o.minGap < 5) {
              this.nears++;
              this.skill('NEAR MISS', COL.near, 20, 0.14);
              this.slowT = 0.1;
              this.sfx('near');
              this.buzz(8);
            }
          }
          break;
        }
        case 'fork':
          if (this.forkLane[o.x] === undefined && p.x + PW >= o.x) this.forkLane[o.x] = p.y < o.slabY ? 'upper' : 'lower';
          if (!o.done && p.x > o.x + o.w) {
            o.done = true;
            const lane = this.forkLane[o.x];
            if ((lane === 'upper') === o.riskUpper) {
              this.brave++;
              this.skill('BRAVE ROUTE', COL.gold, 150, 0.35, 2);
              this.sfx('record');
              this.emit('ach', 'brave_route');
            }
          }
          break;
        case 'hint':
          if (!o.done && p.x >= o.x) {
            o.done = true;
            if (o.key !== 'tap' || this.guides) this.emit('hint', o.key);
          }
          break;
        case 'portal':
          if (!o.used && Phys.overlap(p.x, p.y, PW, PH, o.x - 6, o.y - 6, 24, 24)) {
            o.used = true;
            this.secretGlitch();
          }
          break;
        case 'check':
          if (!o.done && p.x >= o.x) {
            o.done = true;
            this.checkpoint = o.x;
            this.popup('CHECKPOINT', COL.perfect, 18);
            this.sfx('line');
            this.burst(o.x, F - 24, [COL.perfect, '#ffffff'], 12, 60);
          }
          break;
        case 'rift':
          if (!o.used && !this.inRift && Phys.overlap(p.x, p.y, PW, PH, o.x, o.y, o.w, o.h)) {
            o.used = true;
            this.enterRift(o);
            return;
          }
          break;
        case 'finish':
          if (this.inRift && p.x >= o.x) { this.exitRift(true); return; }
          if (!this.finished && p.x >= o.x) {
            this.finished = true;
            this.sfx('record');
            this.burst(p.x + 6, p.y + 6, [COL.coin, COL.perfect, COL.blue, COL.purple], 30, 90, 2);
            if (this.mode === 'endless' || this.mode === 'daily') {
              // the last stage is done: a victory lap with fireworks, then COMING SOON (score and distance stop here)
              this.comingSoon = true;
              this.victory = { t: 0, score: this.score, x: p.x, next: 0 };
              this.buzz(60);
              return;
            }
            this.end();
            return;
          }
          break;
      }
    }

    // combo decay — no sudden punishment, it eases down
    this.idleT += dt;
    if (this.idleT > 6.5 && this.chain > 0) {
      this.idleT = 3.5;
      this.chain = Math.floor(this.chain / 2);
    }
    if (this.frenzyT > 0) this.frenzyT -= dt;
    if (this.echoT > 0) this.echoT -= dt;
    if (this.glitchT > 0) this.glitchT -= dt;

    // stages: the run keeps growing
    if ((this.mode === 'endless' || this.mode === 'daily') && !this.inRift) {
      const st = L.stageAt(p.x);
      if (st !== this.stage) {
        this.stage = st;
        this.maxStage = Math.max(this.maxStage, st);
        this.mod = L.modAt(p.x);
        this.stageBanner = 2.4;
        const bonus = st * 5;
        this.coins += bonus;
        this.addScore(st * 50);
        this.popup('STAGE ' + st + '  +' + bonus, COL.coin, 16);
        this.popup('SPEED ' + this.speedFactor().toFixed(2) + 'X', '#ff9a3c', 30);
        this.speedFx = 2.2;
        this.speedPulse = 1;
        this.flash = 0.8;
        this.flashCol = '#ff9a3c';
        this.buzz(20);
        this.sfx('record');
        this.emit('stage', { stage: st, mod: this.mod });
      }
    }

    // ⚡ weekly TURBO BURSTS: a clear "here it comes" every time one starts (feedback only, never the physics)
    if (this.twist === 'burst' && !this.inRift) {
      const on = L.burstAt(p.x) > 0.3;
      if (on && !this.inBurst) {
        this.popup('BURST!', '#ff9a3c', 40);
        this.speedFx = Math.max(this.speedFx || 0, 1.4);
        this.speedPulse = 1;
        this.flash = Math.max(this.flash, 0.35); this.flashCol = '#ff9a3c';
        this.sfx('pad'); this.buzz(15);
      }
      this.inBurst = on;
    }

    // world change
    const w = L.worldAt(p.x);
    if (w !== this.world) {
      this.worldPrev = this.world;
      this.world = w;
      this.worldFade = 1.2;
      this.worldBanner = 2.2;
      this.sfx('world');
      this.emit('world', w);
    }

    this.history.push(p.x, p.y, p.grav);
    if (this.history.length > 90) this.history.splice(0, 3);
    if ((this.mode === 'daily' || this.weekRun) && !this.inRift && (Math.round(this.time * 120) % 4 === 0) && this.ghostRec.length < 30 * 2 * 600) {
      this.ghostRec.push(Math.round(p.x), Math.round(p.y));
    }
    if ((this.mode === 'daily' || this.weekRun) && this.ghost && !this.ghostBeaten) {
      const gx = this.ghost[this.ghost.length - 2];
      if (p.x > gx + 20) {
        this.ghostBeaten = true;
        if (this.weekRun) {
          // 👻 the week's #1 (or your own best this week) is behind you now
          const gn = this.ghostLabel();
          this.popup(gn === 'YOU' ? 'GHOST BEATEN!' : 'PASSED ' + gn + '!', '#5ef2ff', 18);
          this.flash = 0.6; this.flashCol = '#5ef2ff'; this.squash = 1;
          this.sfx('record'); this.buzz(30);
          this.emit('weekGhost', gn);
        } else {
          this.popup('GHOST BEATEN!', COL.purpleLight, 18);
          this.emit('ach', 'shadow_runner');
        }
      }
    }

    this.camX = p.x - FF.PLAYER_X;
    // drop what's behind the camera — but never anything past the last checkpoint, since a respawn goes back there
    if ((Math.round(this.time * 120) & 63) === 0) {
      let keep = this.camX;
      if (L.checkpoints) keep = Math.min(keep, this.checkpoint - 120);
      if (this.mode === 'zen') { const cs = L.chunkStarts.filter((x) => x <= p.x - 20); keep = Math.min(keep, (cs.length ? cs[cs.length - 1] : 0) - 120); } // zen respawns at the chunk start
      L.prune(keep);
    }
  };

  Game.prototype.takeCoin = function (o) {
    o.taken = true;
    this.coinsTaken++;
    const val = (o.gold ? 5 : 1) * (this.mod === 'goldrush' ? 2 : 1);
    this.coins += val;
    this.addScore(o.gold ? 50 : 10);
    this.sfx(o.gold ? 'gem' : 'coin');
    this.burst(o.x, o.y, o.gold ? [COL.gold, '#fff'] : [COL.coin, COL.coinLight], o.gold ? 8 : 4, 40);
    if (o.group && !this.failedGroups[o.group]) {
      const rest = this.L.objs.some((c) => c.t === 'coin' && c.group === o.group && !c.taken);
      if (!rest) {
        this.lines++;
        this.skill(o.gold ? 'GEM LINE' : 'CLEAN LINE', COL.coin, 60, 0.2);
        this.sfx('line');
        this.emit('ach', 'clean_line');
      }
    }
  };

  Game.prototype.secretGlitch = function () {
    this.glitchT = 3;
    this.sfx('glitch');
    this.buzz(30);
    this.popup('SECRET GLITCH', '#39ff88', 16);
    this.emit('ach', 'glitch_hunter');
    const x0 = this.p.x + 20, x1 = this.p.x + 320;
    for (const o of this.L.objs) {
      if (o.x + o.w > x0 && o.x < x1 && (o.t === 'spike' || o.t === 'mover' || o.t === 'solid' || o.t === 'lock')) {
        o.dead = true;
        this.burst(o.x - this.camX + o.w / 2 + this.camX, (o.y || FF.MID) + 4, ['#39ff88', '#ff3cf2', '#27d7ff'], 6, 60);
      }
    }
    this.L.objs = this.L.objs.filter((o) => !o.dead);
    const g = ++this.L.groupId;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) this.L.add({ t: 'coin', x: x0 + 40 + i * 30, y: C + 30 + j * 35, group: g, gold: (i + j) % 4 === 0 });
  };

  // RIFT: swap to a short bonus level in a secret world, then drop back into the run at the same spot.
  Game.prototype.enterRift = function (o) {
    const p = this.p;
    const R = FF.RIFTS[o.kind];
    this.inRift = { def: R, retX: o.retX, mainL: this.L, failed: this.failedGroups, fork: this.forkLane, coins: this.coins };
    this.L = FF.riftLevel(o, p.speed, this.inRift.mainL.difficulty(o.x), this.seed || 1);
    p.x = 0; p.y = F - PH; p.vy = 0; p.grav = 1; p.grounded = true;
    p.fly = false; p.thrust = false; p.lastPortal = undefined; p.lastBump = undefined;
    this.failedGroups = {};
    this.forkLane = {};
    this.history.length = 0;
    this.camX = p.x - FF.PLAYER_X;
    this.worldPrev = this.world;
    this.world = this.L.worldAt(0);
    this.worldFade = 1.2;
    this.worldBanner = 0;
    this.riftBanner = 2.6;
    this.flash = 1.4;
    this.flashCol = this.world.edge;
    this.invuln = 0.4;
    this.sfx('frenzy');
    this.buzz(30);
    this.burst(p.x + 6, p.y, [this.world.edge, '#ffffff', COL.coin], 30, 120, 2);
    this.emit('rift', R);
  };
  Game.prototype.exitRift = function (ok) {
    const p = this.p, r = this.inRift;
    const got = this.coins - r.coins;
    this.L = r.mainL;
    this.inRift = null;
    p.x = r.retX; p.y = F - PH; p.vy = 0; p.grav = 1; p.grounded = true;
    p.fly = false; p.thrust = false; p.lastPortal = undefined; p.lastBump = undefined;
    p.speed = this.L.speedAt(p.x);
    this.failedGroups = r.failed;
    this.forkLane = r.fork;
    this.history.length = 0;
    this.camX = p.x - FF.PLAYER_X;
    this.worldPrev = this.world;
    this.world = this.L.worldAt(p.x);
    this.worldFade = 1.2;
    this.invuln = 0.9;
    this.riftBanner = 0;
    this.worldBanner = 1.6;
    if (ok) {
      const bonus = 30 + got;
      this.coins += bonus;
      this.addScore(800);
      this.rifts = (this.rifts || 0) + 1;
      this.popup('RIFT CLEAR!  +' + bonus, COL.coin, 26);
      this.flash = 1.2;
      this.flashCol = COL.coin;
      this.sfx('record');
      this.burst(p.x + 6, p.y, [COL.coin, '#ffffff', COL.perfect], 34, 130, 2);
      this.emit('ach', 'rift_walker');
    } else {
      this.popup('RIFT COLLAPSED', COL.hazardLight, 26);
      this.shake = this.settings.reduceFx ? 0.1 : 0.3;
      this.flash = 1;
      this.flashCol = COL.hazard;
      this.sfx('crash');
      this.buzz(40);
      this.chain = Math.floor(this.chain / 2);
    }
  };

  Game.prototype.die = function (res) {
    const p = this.p;
    this.dead = res;
    this.deadT = 0;
    this.hitstop = 0.09;
    this.shake = this.settings.reduceFx ? 0.1 : 0.3;
    const skin = FF.skinById(this.opts.skin || 'flippo');
    this.burst(p.x + 6, p.y + 6, [skin.body, skin.dark, skin.light, '#ffffff'], 26, 110, 2);
    for (const q of this.particles) q.g = p.grav * 300;
    this.sfx('crash');
    this.buzz(45);
    if (this.mode === 'campaign') this.deaths++;
    this.chain = 0;
    // v8 SO CLOSE: died within 20% (at least 30 m) of your best flag — say how close, and hold the moment a bit longer
    const bx = this.opts.bestX || 0;
    if (this.graded() && bx > 0 && p.x < bx && bx - p.x <= Math.max(300, bx * 0.2)) this.soClose = Math.max(1, Math.round((bx - p.x) / 10));
    this.frenzyT = 0;
  };

  // Adventure: back to the last flag. Taken coins stay taken; crumbling platforms ahead are rebuilt.
  Game.prototype.respawnAtCheckpoint = function () {
    const p = this.p;
    p.x = this.checkpoint;
    p.y = F - PH;
    p.vy = 0;
    p.grav = 1;
    p.grounded = true;
    p.lastBump = undefined;
    p.fly = false; p.thrust = false; p.lastPortal = undefined; // dying mid-flight must not carry flight back to the flag
    this.dead = null;
    this.invuln = 0.8;
    this.camX = p.x - FF.PLAYER_X;
    for (const o of this.L.objs) {
      o.nmDone = false;
      o.minGap = undefined;
      o.ghost = false;
      if (o.t === 'fork') o.done = false;
      if (o.kind === 'crumble' && o.x >= this.checkpoint - 20) { o.touchT = undefined; o.fxDone = false; }
    }
    this.failedGroups = {};
    this.forkLane = {};
    this.history.length = 0;
    this.sfx('uiGo');
  };

  Game.prototype.respawn = function () {
    const p = this.p;
    const starts = this.L.chunkStarts.filter((x) => x <= p.x - 20);
    const sx = starts.length ? starts[starts.length - 1] : 0;
    p.x = Math.max(0, sx - 6);
    p.y = F - PH;
    p.vy = 0;
    p.grav = 1;
    p.grounded = true;
    p.fly = false; p.thrust = false; p.lastPortal = undefined;
    this.dead = null;
    this.invuln = 1.2;
    this.respawns++;
    this.camX = p.x - FF.PLAYER_X;
    for (const o of this.L.objs) {
      o.nmDone = false;
      o.minGap = undefined;
      if (o.t === 'fork') o.done = false;
    }
    this.forkLane = {};
    this.history.length = 0;
  };

  Game.prototype.end = function () {
    if (this.ended) return;
    this.ended = true;
    const res = {
      mode: this.mode,
      score: this.victory ? this.victory.score : this.score,
      dist: Math.floor((this.victory ? this.victory.x : this.inRift ? this.inRift.retX : this.p.x) / 10),
      coins: this.coins,
      rifts: this.rifts || 0,
      coinsTaken: this.coinsTaken,
      coinTotal: this.L.coinTotal || 0,
      greats: this.greats || 0, bestNerve: this.bestNerve || 0, secs: Math.floor(this.runT || 0), // (v8 missions)
      perfects: this.perfects,
      frenzies: this.frenzies,
      nears: this.nears,
      lines: this.lines,
      brave: this.brave,
      bestChain: this.bestChain,
      bestPerfStreak: this.bestPerfStreak,
      maxMult: this.maxMult,
      flips: this.flips,
      cause: this.dead ? this.dead.cause : null,
      finished: this.finished,
      comingSoon: !!this.comingSoon,
      challenge: this.opts.challenge || null,
      custom: this.opts.custom || null,
      fromEditor: !!this.opts.fromEditor,
      stage: this.maxStage,
      deaths: this.deaths,
      level: this.opts.level || null,
      replay: !!this.replay,
      tutorial: !!this.opts.tutorial,
      assist: !!(this.opts.god || (this.opts.timeScale && this.opts.timeScale !== 1) || this.opts.startX || this.opts.book),
      book: this.L.gen && this.L.gen.book ? this.L.book : null,
      inputs: this.rec && !this.replay ? this.inputs.slice() : null,
      seed: this.seed,
      date: this.mode === 'daily' ? FF.todayKey() : undefined,
      progress: this.L.finishX && this.L.finishX !== Infinity ? FF.clamp(this.p.x / this.L.finishX, 0, 1) : 0,
      deathX: this.dead ? this.p.x : null,
      ghostRec: this.mode === 'daily' || this.weekRun ? this.ghostRec : null,
      twist: this.twist || null,
      remix: this.remix ? this.remix.mod : null,
      weekRun: !!this.weekRun,
      ghostBeaten: !!this.ghostBeaten,
      boss: this.boss ? { id: this.boss.def.id, win: this.boss.won, time: this.boss.won ? this.boss.fightTime : this.boss.t - this.boss.fightT0, pct: Math.round((1 - this.boss.hp / this.boss.hpMax) * 100), phase: this.boss.phase + 1, stats: this.boss.stats, introSeen: !!this.opts.introSeen, heroOwned: !!this.opts.heroOwned, ultSkin: this.boss.ultSkin } : null,
      time: this.time
    };
    this.cb.onEnd && this.cb.onEnd(res);
  };

  // ------------------------------------------------------------------ render
  Game.prototype.render = function (ctx) {
    const p = this.p, a = this.prevCam === undefined || this.paused || this.dead || this.ended ? 1 : FF.clamp(this.acc / FF.STEP, 0, 1);
    if (a < 1 && Math.abs(this.camX - this.prevCam) < 40 && Math.abs(p.x - this.prevPX) < 40 && Math.abs(p.y - this.prevPY) < 40) {
      const real = [this.camX, p.x, p.y];
      this.camX = this.prevCam + (real[0] - this.prevCam) * a;
      p.x = this.prevPX + (real[1] - this.prevPX) * a;
      p.y = this.prevPY + (real[2] - this.prevPY) * a;
      try { this.renderFrame(ctx); } finally { this.camX = real[0]; p.x = real[1]; p.y = real[2]; }
      return;
    }
    this.renderFrame(ctx);
  };
  Game.prototype.renderFrame = function (ctx) {
    const t = this.time;
    const cam = Math.round(this.camX);
    FF.frameNo = (FF.frameNo || 0) + 1; // build 38: effects that need a copy of the frame share one per frame
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6 * this.shake * 3), Math.round((Math.random() - 0.5) * 6 * this.shake * 3));
    if (this.boss) this.boss.applyCam(ctx); // ⚔️ build 38: punch-ins, camera whips, the defeat push-in (a transform, no copy)
    const tun = !!this.boss && this.boss.tunnelOn(); // 🌌 the STARFALL TUNNEL draws the lane in perspective
    if (this.zoomT > 0 && !this.boss) { // Perfect punch: quick zoom toward the player, eased back out
      const k = this.zoomT / 0.16, z = 1 + 0.05 * Math.sin(k * Math.PI);
      const zx = this.p.x - cam + 6, zy = this.p.y + 6;
      ctx.translate(zx, zy); ctx.scale(z, z); ctx.translate(-zx, -zy);
    }

    const phase = Phys.phaseOf(this.p.grav);
    const edge = phase === 'b' ? COL.blue : COL.purple;
    const mir = this.twist === 'mirror'; // 🪞 weekly MIRROR RUN: the whole road is drawn right-to-left (text stays readable)
    if (mir) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); }
    if (this.boss) this.boss.renderBack(ctx, cam, t); else FF.drawWorld(ctx, this.world, cam, t, { edge });
    if (this.worldPrev && this.worldFade > 0) this.worldTransition(ctx, cam, t, edge);
    // subtle phase tint of the corridor
    if (!this.boss) { ctx.fillStyle = FF.rgba(edge, 0.05); ctx.fillRect(0, C, W, F - C); } // (the boss worlds tint their own lane)
    if (this.nerve >= 8 && !this.boss) { // NERVE tier: the lane's edges burn in its colour, pulsing
      const T = NERVE[this.nerveTier()], a = 0.35 + 0.25 * Math.sin(t * 12);
      ctx.fillStyle = FF.rgba(T[2], a); ctx.fillRect(0, C - 2, W, 2); ctx.fillRect(0, F, W, 2);
      ctx.fillStyle = FF.rgba(T[2], a * 0.35); ctx.fillRect(0, C, W, 3); ctx.fillRect(0, F - 3, W, 3);
    }
    if (this.frenzyT > 0 && !tun) {
      ctx.fillStyle = FF.rgba(COL.frenzy, 0.07 + 0.03 * Math.sin(t * 20));
      ctx.fillRect(0, C, W, F - C);
    }

    this.renderObjects(ctx, cam, phase);
    if (this.boss) this.boss.renderMid(ctx, cam, t);
    if (this.opts.hitbox) this.drawHitboxes(ctx, cam);
    this.renderGhost(ctx, cam);
    this.renderBestMark(ctx, cam);
    this.renderRivalMark(ctx, cam);
    if (!tun) this.drawSpeedLines(ctx, t);
    if (this.mode !== 'editor' && !(this.boss && this.boss.hideHero())) { if (tun) this.boss.renderTunnelHero(ctx, t); else this.renderPlayer(ctx, cam); }

    for (const q of this.particles) {
      ctx.fillStyle = q.color;
      ctx.globalAlpha = 1 - q.t / q.life;
      if (tun) { const r = this.boss.tunPt(q.x, q.y); if (!r) continue; const sz = Math.max(1, Math.round(q.size * Math.min(3, r[2]))); ctx.fillRect(Math.round(r[0] - sz / 2), Math.round(r[1] - sz / 2), sz, sz); continue; }
      ctx.fillRect(Math.round(q.x - cam), Math.round(q.y), q.size, q.size);
    }
    ctx.globalAlpha = 1;
    if (!tun) for (const r of this.rings) { // Perfect shockwave: a crisp ring that expands and thins out
      const k = r.t / r.life, e = 1 - (1 - k) * (1 - k);
      ctx.strokeStyle = r.col;
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = Math.max(1, Math.round(3 * (1 - k)));
      ctx.beginPath();
      ctx.arc(Math.round(r.x - cam), Math.round(r.y), 4 + e * r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    if (this.boss) this.boss.renderFront(ctx, cam, t);
    if (this.twist === 'dark') this.drawDark(ctx, cam);
    if (mir) ctx.restore();

    let pi = 0;
    for (const u of this.popups) {
      const k = u.t / u.life;
      let y = u.y - k * 14 * (this.p.grav > 0 ? 1 : -1), ux = mir ? W - u.x : u.x;
      if (tun) { ux = FF.BOSS_TUNNEL.cx + (pi++ % 2 ? 46 : -46); y = 118 - k * 14; } // over the hero's shoulders
      if (k > 0.75 && Math.floor(u.t * 30) % 2) continue;
      font.draw(ctx, u.text, FF.clamp(ux, font.width(u.text) / 2 + 2, W - font.width(u.text) / 2 - 2), y, { color: u.color, align: 'center', outline: '#05060d' });
    }

    if (this.flash > 0 && !this.settings.reduceFx) {
      ctx.fillStyle = FF.rgba(this.flashCol, 0.12 * this.flash);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    if (this.mode !== 'demo' && this.mode !== 'editor' && !this.boss) this.renderHUD(ctx);
    // build 35: on the stage book (Endless / Daily) the stage is the one name the player sees: "STAGE n · its name"
    // (no "WORLD n" banner any more, which disagreed with it). In Arabic the lines are an HTML overlay (the pixel font is Latin only).
    const bookRun = !!this.L.gen.book && (this.mode === 'endless' || this.mode === 'daily') && !this.inRift;
    const bannerT = bookRun ? Math.max(this.stageBanner, this.worldBanner) : this.stageBanner;
    const arB = bookRun && this.settings && this.settings.lang === 'ar';
    let arHtml = '';
    if (bannerT > 0 && this.mode !== 'demo' && this.mode !== 'editor') {
      const MODS = { lowgrav: ['LOW GRAVITY', COL.blueLight, 'جاذبية خفيفة'], heavy: ['HEAVY GRAVITY', COL.hazard, 'جاذبية تقيلة'], turbo: ['TURBO', COL.near, 'تيربو'], goldrush: ['GOLD RUSH x2', COL.coin, 'عملات ×2'], tight: ['TIGHT SQUEEZE', COL.purpleLight, 'ممر ضيق'] };
      const MOD = MODS[this.mod];
      const SD = bookRun ? this.L.stageDef(this.p.x) : null;
      if (arB) {
        arHtml = '<b>المرحلة \u2066' + this.stage + '\u2069</b>' + (SD ? '<span>' + (SD.nameAr || SD.name) + (SD.lap ? ' · لفة \u2066' + (SD.lap + 1) + '\u2069' : '') + '</span>' : '') +
          (MOD ? '<i style="color:' + MOD[1] + '">' + MOD[2] + '</i>' : '');
      } else if (Math.floor(bannerT * 10) % 4 || bannerT < 2) {
        font.draw(ctx, 'STAGE ' + this.stage, W / 2, 42, { color: COL.coin, align: 'center', outline: '#05060d', scale: 2 });
        if (SD) font.draw(ctx, SD.name + (SD.lap ? '  LAP ' + (SD.lap + 1) : ''), W / 2, 60, { color: '#ffffff', align: 'center', outline: '#05060d' });
        if (MOD) font.draw(ctx, MOD[0], W / 2, SD ? 72 : 60, { color: MOD[1], align: 'center', outline: '#05060d' });
      }
    }
    if (arHtml !== (this.arBanner || '')) { this.arBanner = arHtml; this.emit('banner', arHtml); }
    if (this.victory) this.renderVictory(ctx);
    if (this.boss) this.boss.renderOverlay(ctx, t);
    if (this.introT > 0) this.renderIntro(ctx);
    if (this.world.scanlines) FF.drawScanlines(ctx, 0.12);
    if (this.glitchT > 0 && !this.settings.reduceFx) this.glitchFx(ctx);
    if (this.riftBanner > 0 && this.inRift) {
      const a = Math.min(1, this.riftBanner * 2);
      ctx.globalAlpha = a;
      font.draw(ctx, 'SECRET RIFT', W / 2, H / 2 - 22, { color: COL.coin, align: 'center', outline: '#05060d' });
      font.draw(ctx, this.inRift.def.name, W / 2, H / 2 - 8, { color: this.world.edge, align: 'center', outline: '#05060d', scale: 2 });
      font.draw(ctx, 'CRASH > BACK TO THE RUN', W / 2, H / 2 + 12, { color: '#cfd6ff', align: 'center', outline: '#05060d' });
      ctx.globalAlpha = 1;
    }
    if (this.worldBanner > 0 && !bookRun && this.mode !== 'demo' && this.mode !== 'editor') {
      const a = Math.min(1, this.worldBanner * 2);
      if (Math.floor(this.worldBanner * 20) % 3 || this.worldBanner < 1.8) {
        ctx.globalAlpha = a;
        const dy = this.stageBanner > 0 && this.L.gen.book ? 20 : 0; // stay clear of the stage name + mod lines
        font.draw(ctx, 'WORLD ' + this.world.idx, W / 2, H / 2 - 12 + dy, { color: COL.coin, align: 'center', outline: '#05060d' });
        font.draw(ctx, this.world.name, W / 2, H / 2 + dy, { color: '#fff', align: 'center', outline: '#05060d', scale: 1 });
        ctx.globalAlpha = 1;
      }
    }
  };

  // owner tool: the real collision boxes (what actually hurts / what you stand on)
  Game.prototype.drawHitboxes = function (ctx, cam) {
    const t = this.time, phase = Phys.phaseOf(this.p.grav);
    for (const o of this.L.near(cam - 20, cam + W + 20)) {
      const r = Phys.hazardRect(o, t);
      if (r) { ctx.strokeStyle = 'rgba(255,51,85,0.95)'; ctx.strokeRect(Math.round(r[0] - cam) + 0.5, Math.round(r[1]) + 0.5, Math.max(1, Math.round(r[2]) - 1), Math.max(1, Math.round(r[3]) - 1)); }
      else if (o.t === 'solid' && Phys.solidActive(o, phase, t)) { ctx.strokeStyle = 'rgba(125,255,178,0.8)'; ctx.strokeRect(Math.round(o.x - cam) + 0.5, Math.round(o.y) + 0.5, Math.round(o.w) - 1, o.h - 1); }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(Math.round(this.p.x - cam) + 1.5, Math.round(this.p.y) + 1.5, PW - 3, PH - 3);
  };

  // Pixel-wave transition between worlds: the new world sweeps in block by block with a glowing edge.
  let RANKS = null;
  Game.prototype.worldTransition = function (ctx, cam, t, edge) {
    const B = 8, cols = Math.ceil(W / B), rows = Math.ceil(H / B);
    if (!RANKS) {
      RANKS = [];
      for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
        RANKS.push((bx / cols) * 0.75 + Math.abs(by - rows / 2) / rows * 0.1 + Math.random() * 0.15);
      }
    }
    const buf = this._wbuf || (this._wbuf = FF.makeCanvas(W, H));
    const bg = buf.getContext('2d');
    FF.drawWorld(bg, this.worldPrev, cam, t, { edge, noWeather: true });
    const prog = 1 - this.worldFade / 1.2;
    const glow = this.world.edge;
    for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
      const r = RANKS[by * cols + bx];
      if (r > prog) ctx.drawImage(buf, bx * B, by * B, B, B, bx * B, by * B, B, B);
      else if (r > prog - 0.05) { ctx.fillStyle = FF.rgba(glow, 0.55); ctx.fillRect(bx * B, by * B, B, B); }
    }
  };

  // Speed streaks: the faster you go, the more wind you see.
  Game.prototype.drawSpeedLines = function (ctx, t) {
    if (this.mode === 'editor' || this.settings.reduceFx) return;
    const v = this.p.speed;
    const n = Math.max(0, Math.round((v - 118) / 5)) + Math.round((this.speedFx || 0) * 8) + Math.round(this.flow * 10);
    if (!n) return;
    const hash = (i) => { const x = Math.sin(i * 91.7 + 13.3) * 43758.5; return x - Math.floor(x); };
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.35, 0.08 + (v - 118) / 300).toFixed(2) + ')';
    for (let i = 0; i < n; i++) {
      const len = 10 + hash(i + 3) * 26;
      const x = W - ((t * v * (1.6 + hash(i) * 1.4) + hash(i + 7) * W * 2) % (W + len));
      const y = C + 4 + hash(i + 11) * (F - C - 8);
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(len), 1);
    }
  };

  Game.prototype.renderObjects = function (ctx, cam, phase) {
    const t = this.time;
    const objs = this.L.near(cam - 20, cam + W + 20);
    const v = this.p.speed;
    // lock zones first (background overlay)
    for (const o of objs) {
      if (o.t !== 'lock') continue;
      const x = Math.round(o.x - cam);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let i = 0; i < o.w; i += 6) ctx.fillRect(x + i, C, 3, F - C);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x, C, 1, F - C);
      ctx.fillRect(x + Math.round(o.w), C, 1, F - C);
      const inside = this.L.inLock(this.p.x);
      const sh = inside && this.lockShake > 0 ? Math.round(Math.sin(this.lockShake * 60) * 2) : 0;
      FF.drawLock(ctx, Math.max(x + 4, Math.min(x + o.w - 11, FF.PLAYER_X + 20)) + sh, FF.MID - 4, inside ? '#ffffff' : 'rgba(255,255,255,0.7)');
    }
    for (const o of objs) {
      const x = o.x - cam;
      switch (o.t) {
        case 'solid': {
          const active = !o.phase || o.phase === phase;
          if (o.kind === 'lift' || o.kind === 'crumble' || o.kind === 'blink') {
            this.drawSpecialSolid(ctx, o, x, t);
            break;
          }
          if (!o.phase) {
            ctx.fillStyle = this.world.surface.dark;
            ctx.fillRect(Math.round(x), o.y, Math.round(o.w), o.h);
            ctx.fillStyle = this.world.surface.light;
            ctx.fillRect(Math.round(x), o.y, Math.round(o.w), 1);
            ctx.fillRect(Math.round(x), o.y + o.h - 1, Math.round(o.w), 1);
            ctx.fillRect(Math.round(x), o.y, 1, o.h);
          } else FF.drawPhaseRect(ctx, x, o.y, Math.round(o.w), o.h, o.phase, active && !o.ghost, t);
          break;
        }
        case 'spike':
          FF.drawSpikes(ctx, x, o.y, o.w, o.dir);
          if (this.guides) this.drawGuide(ctx, o, cam, v);
          break;
        case 'mover': {
          const y = Phys.moverY(o, t);
          ctx.fillStyle = 'rgba(255,120,140,0.45)';
          for (let yy = o.yMin; yy < o.yMax + o.h; yy += 4) ctx.fillRect(Math.round(x + o.w / 2), yy, 1, 2);
          FF.drawMover(ctx, x, y, o.w, o.h, t);
          break;
        }
        case 'laser':
          this.drawLaser(ctx, o, x, t);
          break;
        case 'check': {
          const fx = Math.round(x), on = this.checkpoint >= o.x;
          ctx.fillStyle = '#cfd6ff';
          ctx.fillRect(fx, F - 30, 2, 30);
          const col = on ? COL.perfect : '#7f88c4';
          for (let yy = 0; yy < 8; yy++) {
            const wv = Math.round(Math.sin(t * 6 + yy * 0.6));
            ctx.fillStyle = yy % 2 ? col : FF.mix(col, '#ffffff', 0.3);
            ctx.fillRect(fx + 2, F - 30 + yy, 12 + wv, 1);
          }
          break;
        }
        case 'bumper': this.drawBumper(ctx, o, x, t); break;
        case 'flyIn': case 'flyOut': this.drawPortalGate(ctx, o, x, t); break;
        case 'hblock': this.drawHBlock(ctx, o, x, t); break;
        case 'fan': this.drawFan(ctx, o, x, t); break;
        case 'dash': this.drawDash(ctx, o, x, t); break;
        case 'pop': this.drawPop(ctx, o, x, t); break;
        case 'field': this.drawField(ctx, o, x, t); break;
        case 'wind': this.drawWind(ctx, o, x, t); break;
        case 'totem': this.drawTotem(ctx, o, x, t); break;
        case 'piston': this.drawPiston(ctx, o, x, t); break;
        case 'rift': if (!o.used) this.drawRift(ctx, o, x, t); break;
        case 'saw': this.drawSaw(ctx, o, cam, t); break;
        case 'fball': this.drawFireball(ctx, o, cam, t); break;
        case 'wdot': this.drawSnakeOrb(ctx, o, x, t); break;
        case 'bounce': this.drawBouncer(ctx, o, cam, t); break;
        case 'meteor': this.drawMeteor(ctx, o, x, t); break;
        case 'orbit': this.drawOrbit(ctx, o, cam, t); break;
        case 'pend': this.drawPend(ctx, o, cam, t); break;
        case 'pad':
          this.drawPad(ctx, o, x, t);
          break;
        case 'coin':
          if (!o.taken) FF.drawCoin(ctx, x, o.y, t, { gold: o.gold, offset: o.x * 0.05 });
          break;
        case 'portal':
          if (!o.used) FF.drawPortal(ctx, x + 6, o.y + 6, t);
          break;
        case 'sign':
          this.drawSign(ctx, o, x, t);
          break;
        case 'finish': {
          for (let yy = C; yy < F; yy += 4) {
            ctx.fillStyle = ((yy / 4) & 1) ? '#ffffff' : '#05060d';
            ctx.fillRect(Math.round(x), yy, 4, 4);
            ctx.fillStyle = ((yy / 4) & 1) ? '#05060d' : '#ffffff';
            ctx.fillRect(Math.round(x) + 4, yy, 4, 4);
          }
          break;
        }
      }
    }
  };

  // Perfect-window guide: green ticks on the surface where your front edge should be when you tap.
  Game.prototype.drawGuide = function (ctx, o, cam, v) {
    const a = o.x - v * 0.24 - cam, b = o.x - v * 0.08 - cam;
    const y = o.dir === 'up' ? o.y - 2 : o.y + 1;
    ctx.fillStyle = FF.rgba(COL.perfect, 0.85);
    for (let x = Math.round(a); x < b; x += 3) ctx.fillRect(x, y, 2, 1);
  };

  // ---------------- v4 objects
  function spikeBall(ctx, cx, cy, r, t) {
    cx = Math.round(cx); cy = Math.round(cy);
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4 + t * 4;
      ctx.fillStyle = COL.hazardLight;
      ctx.fillRect(Math.round(cx + Math.cos(ang) * (r + 2)) - 1, Math.round(cy + Math.sin(ang) * (r + 2)) - 1, 2, 2);
    }
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r * r) {
        ctx.fillStyle = d > (r - 1) * (r - 1) ? COL.hazardDark : (x + y < -r / 2 ? COL.hazardLight : COL.hazard);
        ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
    ctx.fillStyle = '#05060d';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  }
  function chain(ctx, x0, y0, x1, y1, n) {
    ctx.fillStyle = '#9aa3c0';
    for (let i = 1; i < n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2);
  }
  Game.prototype.drawSpecialSolid = function (ctx, o, x, t) {
    x = Math.round(x);
    const w = Math.round(o.w);
    if (o.kind === 'lift') {
      o.y = Phys.liftY(o, t);
      const y = Math.round(o.y);
      ctx.fillStyle = 'rgba(255,224,102,0.35)';
      for (let yy = o.yA; yy < o.yB + o.h; yy += 4) { ctx.fillRect(x + 2, yy, 1, 2); ctx.fillRect(x + w - 3, yy, 1, 2); }
      ctx.fillStyle = '#3a3f55';
      ctx.fillRect(x, y, w, o.h);
      for (let i = 0; i < w; i += 6) { ctx.fillStyle = (i / 6) & 1 ? '#ffe066' : '#1a1a1a'; ctx.fillRect(x + i, y, 3, 2); }
      ctx.fillStyle = '#9aa3c0';
      ctx.fillRect(x, y + o.h - 1, w, 1);
      const up = Math.sin(((t / o.period) + o.off) * Math.PI * 2) < 0;
      ctx.fillStyle = '#ffe066';
      const cx = x + (w >> 1);
      ctx.fillRect(cx - 1, y + 2, 3, 1);
      ctx.fillRect(cx, up ? y + 1 : y + 3, 1, 1);
    } else if (o.kind === 'crumble') {
      const age = o.touchT === undefined ? -1 : t - o.touchT;
      if (age >= Phys.CRUMBLE_T) {
        if (!o.fxDone) { o.fxDone = true; this.burst(o.x + o.w / 2, o.y + 3, ['#c98a4a', '#7a4a20', '#e8b878'], 18, 60, 2); for (const q of this.particles.slice(-18)) q.g = 400; }
        return;
      }
      const sh = age >= 0 ? Math.round(Math.sin(t * 80) * (1 + age * 3)) : 0;
      ctx.fillStyle = '#7a4a20';
      ctx.fillRect(x + sh, o.y, w, o.h);
      ctx.fillStyle = '#c98a4a';
      for (let i = 0; i < w; i += 8) ctx.fillRect(x + sh + i, o.y, 7, o.h - 2);
      ctx.fillStyle = '#e8b878';
      ctx.fillRect(x + sh, o.y, w, 1);
      ctx.fillStyle = '#3a1e08';
      for (let i = 5; i < w; i += 13) { ctx.fillRect(x + sh + i, o.y + 1, 1, 3); ctx.fillRect(x + sh + i + 1, o.y + 3, 2, 1); }
    } else if (o.kind === 'blink') {
      const on = Phys.blinkOn(o, t), warn = Phys.blinkWarn(o, t);
      if (on && !(warn && Math.floor(t * 20) & 1)) {
        ctx.fillStyle = '#ff8a3a';
        ctx.fillRect(x, o.y, w, o.h);
        ctx.fillStyle = '#ffe0b0';
        for (let i = 0; i < w; i += 8) ctx.fillRect(x + i + 1, o.y + 1, 6, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, o.y, w, 1);
      } else {
        ctx.fillStyle = 'rgba(255,138,58,0.5)';
        for (let i = 0; i < w; i += 3) { ctx.fillRect(x + i, o.y, 1, 1); ctx.fillRect(x + i, o.y + o.h - 1, 1, 1); }
      }
    }
  };
  Game.prototype.drawPortalGate = function (ctx, o, x, t) {
    x = Math.round(x);
    const into = o.t === 'flyIn';
    const c1 = into ? '#ffb000' : '#27d7ff', c2 = into ? '#ff5a1a' : '#b45cff';
    for (let y = C; y < F; y += 2) {
      const w = 3 + Math.round(2 * Math.sin(y * 0.3 + t * 10));
      ctx.fillStyle = ((y / 2 + Math.floor(t * 20)) & 3) ? c1 : c2;
      ctx.fillRect(x + 5 - w, y, w * 2, 1);
    }
    ctx.fillStyle = FF.rgba(c1, 0.15);
    ctx.fillRect(x - 6, C, 22, F - C);
    // symbol: wing (fly) or arrow down (land)
    ctx.fillStyle = '#ffffff';
    const cy = FF.MID;
    if (into) { ctx.fillRect(x + 1, cy - 1, 8, 2); ctx.fillRect(x - 1, cy - 3, 4, 2); ctx.fillRect(x + 7, cy - 3, 4, 2); }
    else { ctx.fillRect(x + 4, cy - 5, 2, 8); ctx.fillRect(x + 2, cy + 1, 6, 2); ctx.fillRect(x + 3, cy + 3, 4, 1); }
  };
  // b59: three more looks for the same surface hazard (8 px tall, hurts exactly where it's drawn)
  // b59 gravity fields: FLOAT = green haze with bubbles drifting slowly; HEAVY = red stripes with arrows pressing
  // toward both surfaces. Edges glow so you see where the field starts and ends.
  Game.prototype.drawField = function (ctx, o, x, t) {
    x = Math.round(x);
    const fl = o.kind === 'float', col = fl ? '#3fdc7a' : '#ff6a1a';
    ctx.fillStyle = FF.rgba(col, 0.1); ctx.fillRect(x, C, o.w, F - C);
    ctx.fillStyle = FF.rgba(col, 0.7); ctx.fillRect(x, C, 2, F - C); ctx.fillRect(x + o.w - 2, C, 2, F - C);
    if (fl) {
      for (let i = 0; i < o.w / 14; i++) {
        const bx = x + ((i * 37) % o.w), by = F - ((t * 18 + i * 23) % (F - C));
        ctx.fillStyle = FF.rgba('#c8ffd8', 0.55); ctx.fillRect(bx, by, 2, 2); ctx.fillRect(bx + 1, by - 1, 1, 1);
      }
    } else {
      for (let xx = x + 6; xx < x + o.w - 6; xx += 16) {
        const off = Math.floor(t * 30) % 6;
        ctx.fillStyle = FF.rgba(col, 0.5);
        ctx.fillRect(xx, FF.MID + 6 + off, 1, 4); ctx.fillRect(xx - 1, FF.MID + 9 + off, 3, 1);   // pressing down
        ctx.fillRect(xx, FF.MID - 10 - off, 1, 4); ctx.fillRect(xx - 1, FF.MID - 10 - off, 3, 1); // pressing up
      }
    }
    font.draw(ctx, fl ? 'FLOAT' : 'HEAVY', x + 6, C + 4, { color: col, outline: '#05060d' });
  };
  // b61 WIND: a sand-tinted zone; TAILWIND streaks race forward with >> chevrons, HEADWIND streaks push back with <<
  Game.prototype.drawWind = function (ctx, o, x, t) {
    x = Math.round(x);
    const tail = o.kind === 'tail', col = tail ? '#ffc23a' : '#ff7a3a';
    ctx.fillStyle = FF.rgba(col, 0.09); ctx.fillRect(x, C, o.w, F - C);
    ctx.fillStyle = FF.rgba(col, 0.75); ctx.fillRect(x, C, 2, F - C); ctx.fillRect(x + o.w - 2, C, 2, F - C);
    for (let i = 0; i < o.w / 9; i++) {
      const len = 6 + (i % 4) * 3, sp = tail ? 160 : -110;
      const xx = x + (((i * 41 + t * sp) % o.w) + o.w) % o.w, yy = C + 8 + ((i * 29) % (F - C - 16));
      ctx.fillStyle = FF.rgba(i % 3 ? '#ffe2a8' : '#ffffff', 0.5);
      ctx.fillRect(Math.round(Math.min(xx, x + o.w - len)), yy, len, 1);
    }
    for (let xx = x + 14; xx < x + o.w - 14; xx += 30) { // chevrons on the middle line
      for (let k = 0; k < 2; k++) {
        const cx = xx + k * 5, d = tail ? 1 : -1;
        ctx.fillStyle = FF.rgba(col, 0.8);
        for (let r = 0; r < 4; r++) { ctx.fillRect(cx + d * r, FF.MID - 4 + r, 1, 1); ctx.fillRect(cx + d * r, FF.MID + 3 - r, 1, 1); }
      }
    }
    font.draw(ctx, tail ? 'TAILWIND' : 'HEADWIND', x + 6, C + 4, { color: col, outline: '#05060d' });
  };
  // b61 TOTEM: a carved stone pole across the lane with a glowing double arrow — passing it flips you
  Game.prototype.drawTotem = function (ctx, o, x, t) {
    x = Math.round(x);
    const glow = 0.55 + 0.35 * Math.sin(t * 6 + o.x * 0.01), passed = this.p && this.p.x + PW / 2 >= o.x;
    ctx.fillStyle = FF.rgba('#7aff6a', passed ? 0.12 : 0.22 * glow); ctx.fillRect(x - 4, C, o.w + 8, F - C);
    for (let y = C; y < F; y += 12) {
      ctx.fillStyle = '#3a4a2e'; ctx.fillRect(x, y, o.w, 11);
      ctx.fillStyle = '#5e7448'; ctx.fillRect(x, y, o.w, 1); ctx.fillRect(x, y, 1, 11);
      ctx.fillStyle = '#1a2414'; ctx.fillRect(x + 1, y + 4, 1, 2); ctx.fillRect(x + o.w - 2, y + 4, 1, 2); // carved eyes
    }
    const c = passed ? '#5a7a4a' : FF.mix('#7aff6a', '#ffffff', glow * 0.4), m = FF.MID;
    ctx.fillStyle = c;
    ctx.fillRect(x + 2, m - 9, 2, 18);
    for (let r = 0; r < 3; r++) { ctx.fillRect(x + 2 - r, m - 9 + r, 2 + r * 2, 1); ctx.fillRect(x + 2 - r, m + 8 - r, 2 + r * 2, 1); }
    // vines wrapping it
    ctx.fillStyle = '#2f9a3a';
    for (let y = C + 3; y < F - 3; y += 3) ctx.fillRect(x + Math.round(2.5 + Math.sin(y / 5 + o.x) * 3.5), y, 1, 2);
  };
  Game.prototype.drawLookHazard = function (ctx, o, x, t) {
    // drawn on an 8x8 grid per unit, rows counted from the surface (row 0 touches it); hurts where it's drawn
    const top = o.side === 'top';
    const px = (cx, r, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(cx, top ? o.y + r : o.y + o.h - r - h, w, h); };
    for (let i = 0; i < o.w; i += 8) {
      const u = x + i;
      if (o.look === 'mace') { // a steel ball studded with red spikes, on a short stem
        px(u + 3, 0, 2, 2, '#2a2f45');
        px(u + 1, 2, 6, 6, '#141826');            // outline
        px(u + 2, 3, 4, 4, '#9aa3b8');            // steel
        px(u + 2, top ? 3 : 6, 2, 1, '#e6ecf8');  // shine
        px(u + 0, 4, 1, 2, COL.hazard); px(u + 7, 4, 1, 2, COL.hazard); px(u + 3, 7, 2, 1, COL.hazard); // spikes
      } else if (o.look === 'crystal') { // three amber shards, outlined
        const H = [8, 6, 7];
        for (let k = 0; k < 3; k++) {
          const h = H[(k + i / 8) % 3], cx = u + k * 3 - (k === 2 ? 1 : 0);
          px(cx, 0, 3, h, '#5a2a00');
          px(cx + 1, 0, 1, h - 1, '#ffb000');
          px(cx + 1, h - 3, 1, 2, '#fff1b8');
        }
        px(u, 0, 8, 1, '#c4520e');
      } else { // ember: an iron brazier full of fire
        const f = Math.floor(t * 10 + i / 8) % 3;
        px(u, 0, 8, 3, '#1a0f0f'); px(u, 2, 8, 1, '#5a1a10');           // the bowl and its rim
        px(u + 1, 3, 6, 2, COL.hazard);                                  // embers
        px(u + 1 + (f === 0 ? 0 : 1), 5, 2, 2, '#ff6a1a'); px(u + 4 + (f === 2 ? 1 : 0), 5, 2, 3 - (f === 1 ? 1 : 0), '#ff6a1a'); // flames
        px(u + 2 + (f === 1 ? 1 : 0), 5, 1, 2, '#ffd23f'); px(u + 5, 5, 1, 1 + (f === 0 ? 1 : 0), '#ffd23f');
      }
    }
  };
  Game.prototype.drawHBlock = function (ctx, o, x, t) {
    x = Math.round(x);
    if (o.look && o.look !== 'block') { this.drawLookHazard(ctx, o, x, t); return; }
    const top = o.side === 'top';
    ctx.fillStyle = '#3a0814';
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = COL.hazardDark;
    for (let yy = o.y + 2; yy < o.y + o.h; yy += 6) ctx.fillRect(x + ((yy / 6) & 1 ? 0 : 8), yy, 8, 1);
    // jagged edge facing the tunnel (drawn inside the block, so what you see is what hurts)
    const ey = top ? o.y + o.h - 3 : o.y;
    ctx.fillStyle = COL.hazard;
    for (let i = 0; i < o.w; i += 4) {
      ctx.fillRect(x + i, ey + (top ? 0 : 1), 4, 2);
      ctx.fillRect(x + i + 1, top ? ey + 2 : ey, 2, 1);
    }
    ctx.fillStyle = COL.hazardLight;
    ctx.fillRect(x, top ? o.y + o.h - 1 : o.y, o.w, 1);
  };
  Game.prototype.drawBumper = function (ctx, o, x, t) {
    x = Math.round(x);
    const y = Math.round(o.y);
    ctx.fillStyle = '#7a1050';
    ctx.fillRect(x, y, o.w, o.h);
    ctx.fillStyle = COL.frenzy;
    ctx.fillRect(x + 1, y + 1, o.w - 2, o.h - 2);
    ctx.fillStyle = '#ffd0f0';
    ctx.fillRect(x + 2, y + 1, o.w - 4, 1);
    const k = Math.floor(t * 8) & 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4 + k * 2, y + 2, 2, 1);
    ctx.fillRect(x + o.w - 6 - k * 2, y + 2, 2, 1);
  };
  Game.prototype.drawFan = function (ctx, o, x, t) {
    x = Math.round(x);
    const fl = o.side === 'floor';
    const base = fl ? F - 4 : C;
    // wind column
    for (let i = 0; i < 14; i++) {
      const xx = x + 3 + ((i * 37) % (o.w - 6));
      const ph = ((t * 1.6 + i * 0.13) % 1);
      const yy = fl ? F - 8 - ph * 90 : C + 8 + ph * 90;
      ctx.fillStyle = 'rgba(200,240,255,' + (0.5 * (1 - ph)).toFixed(2) + ')';
      ctx.fillRect(xx, Math.round(yy), 1, 5);
    }
    ctx.fillStyle = '#2a3348';
    ctx.fillRect(x, base, o.w, 4);
    ctx.fillStyle = '#7f8db0';
    const sp = Math.floor(t * 30) & 3;
    for (let i = 0; i < o.w; i += 4) ctx.fillRect(x + i + (sp & 1), base + 1, 2, 2);
    ctx.fillStyle = '#b8f3ff';
    ctx.fillRect(x, fl ? base : base + 3, o.w, 1);
  };
  Game.prototype.drawDash = function (ctx, o, x, t) {
    x = Math.round(x);
    const k = Math.floor(t * 12) % 4;
    for (let y = C + 4; y < F - 4; y += 10) {
      ctx.fillStyle = ((y / 10 + k) & 3) === 0 ? '#ffffff' : '#ffe066';
      for (let j = 0; j < 4; j++) { ctx.fillRect(x + j, y + j, 1, 1); ctx.fillRect(x + j, y + 6 - j, 1, 1); ctx.fillRect(x + 4 + j, y + j, 1, 1); ctx.fillRect(x + 4 + j, y + 6 - j, 1, 1); }
    }
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x - 2, C, 12, 2);
    ctx.fillRect(x - 2, F - 2, 12, 2);
  };
  Game.prototype.drawPop = function (ctx, o, x, t) {
    x = Math.round(x);
    const fl = o.side === 'floor';
    if (Phys.popOut(o, t)) { FF.drawSpikes(ctx, x, fl ? F : C, o.w, fl ? 'up' : 'down'); return; }
    const warn = Phys.popWarn(o, t);
    const sh = warn ? Math.round(Math.sin(t * 70)) : 0;
    ctx.fillStyle = '#2a0f18';
    ctx.fillRect(x, fl ? F - 2 : C, o.w, 2);
    ctx.fillStyle = warn ? COL.hazard : COL.hazardDark;
    for (let i = 0; i < o.w; i += 8) ctx.fillRect(x + i + 3 + sh, fl ? F - (warn ? 4 : 2) : C + (warn ? 2 : 0), 2, warn ? 2 : 1);
  };
  // pistons (steel), jaws (toothed crushers) and geysers (fire)
  Game.prototype.drawPiston = function (ctx, o, x, t) {
    x = Math.round(x);
    const fl = o.side === 'floor';
    const len = Math.round(o.reach * Phys.pistonExt(o, t));
    const warn = Phys.pistonWarn(o, t);
    const sh = warn ? Math.round(Math.sin(t * 80)) : 0;
    const base = fl ? F : C;
    if (o.style === 'fire') {
      // vent
      ctx.fillStyle = '#3a1408';
      ctx.fillRect(x, fl ? F - 3 : C, o.w, 3);
      ctx.fillStyle = warn ? '#ffd23f' : '#ff5a10';
      ctx.fillRect(x + 3 + sh, fl ? F - 3 : C + 2, o.w - 6, 1);
      if (warn) for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,170,60,0.8)'; ctx.fillRect(x + 4 + ((t * 40 + i * 5) % (o.w - 8)), fl ? F - 6 - i * 2 : C + 4 + i * 2, 1, 1); }
      if (len > 0) {
        for (let yy = 0; yy < len; yy += 2) {
          const k = yy / Math.max(1, len);
          const wob = Math.round(Math.sin(t * 40 + yy * 0.5) * 2 * k);
          const ww = Math.max(2, Math.round((o.w - 4) * (1 - k * 0.6)));
          ctx.fillStyle = k < 0.3 ? '#fff6c2' : k < 0.65 ? '#ffb000' : '#ff3a10';
          ctx.fillRect(x + Math.round((o.w - ww) / 2) + wob, fl ? F - yy - 2 : C + yy, ww, 2);
        }
      }
      return;
    }
    const jaw = o.style === 'jaw';
    // housing
    ctx.fillStyle = jaw ? '#3a1020' : '#2a3040';
    ctx.fillRect(x - 1, fl ? F - 4 : C, o.w + 2, 4);
    ctx.fillStyle = warn ? COL.hazard : jaw ? '#7a2040' : '#5a6478';
    for (let i = 0; i < o.w; i += 6) ctx.fillRect(x + i + 1 + sh, fl ? F - 4 : C + 3, 3, 1);
    if (len < 2) return;
    // shaft + head
    const head = 6;
    const y0 = fl ? F - len : C;
    ctx.fillStyle = jaw ? '#c03050' : '#8a96b0';
    ctx.fillRect(x + o.w / 2 - 3, fl ? y0 + head : C, 6, Math.max(0, len - head));
    ctx.fillStyle = jaw ? '#ff4a6a' : '#cfd8ee';
    ctx.fillRect(x, fl ? y0 : C + len - head, o.w, head);
    ctx.fillStyle = jaw ? '#ffd0d8' : '#ffffff';
    ctx.fillRect(x, fl ? y0 : C + len - head, o.w, 1);
    // hazard stripes / teeth on the striking face
    if (jaw) {
      ctx.fillStyle = '#ffffff';
      for (let i = 1; i < o.w - 1; i += 4) ctx.fillRect(x + i, fl ? y0 - 2 : C + len, 2, 2);
    } else {
      for (let i = 0; i < o.w; i += 4) { ctx.fillStyle = (i / 4) & 1 ? '#ffd23f' : '#05060d'; ctx.fillRect(x + i, fl ? y0 + 2 : C + len - 4, 4, 2); }
    }
    if (len === o.reach && !this.settings.reduceFx && Math.floor(t * 30) % 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x - 2, fl ? y0 - 1 : C + len, o.w + 4, 1);
    }
  };
  // the rift portal: a swirling oval with orbiting sparks and a pull of light
  Game.prototype.drawRift = function (ctx, o, x, t) {
    const R = FF.RIFTS[o.kind];
    const w = FF.worldById(R.id);
    const cx = Math.round(x + o.w / 2), cy = Math.round(o.y + o.h / 2);
    const col = w.edge;
    ctx.fillStyle = FF.rgba(col, 0.12 + 0.06 * Math.sin(t * 6));
    ctx.fillRect(cx - 16, o.y, 32, o.h + 6);
    for (let i = 0; i < 26; i++) {
      const a = t * 3 + i * 0.6, rr = 1 - (i % 5) * 0.15;
      const px = Math.round(cx + Math.cos(a) * 9 * rr), py = Math.round(cy + Math.sin(a) * 21 * rr);
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? col : COL.coin;
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.fillStyle = '#05010f';
    ctx.fillRect(cx - 3, cy - 14, 6, 28);
    ctx.fillStyle = FF.rgba(col, 0.8);
    ctx.fillRect(cx - 1, cy - 12 + Math.round(Math.sin(t * 8) * 3), 2, 24);
    if (Math.floor(t * 3) % 2) font.draw(ctx, 'RIFT', cx, o.y + o.h + 4, { color: col, align: 'center', outline: '#05060d' });
  };
  Game.prototype.drawSaw = function (ctx, o, cam, t) {
    const fl = o.side === 'floor';
    const yy = fl ? F - 1 : C;
    ctx.fillStyle = 'rgba(255,90,120,0.45)';
    for (let x = o.x0; x <= o.x1; x += 4) ctx.fillRect(Math.round(x - cam), yy, 2, 1);
    const cx = Phys.sawX(o, t) - cam, cy = fl ? F - 6 : C + 6;
    const r = 7;
    for (let a = 0; a < 10; a++) {
      const ang = a * Math.PI / 5 + t * 14;
      ctx.fillStyle = COL.hazardLight;
      ctx.fillRect(Math.round(cx + Math.cos(ang) * (r + 1)), Math.round(cy + Math.sin(ang) * (r + 1)), 2, 2);
    }
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) {
      ctx.fillStyle = (Math.floor(Math.atan2(y, x) * 2 + t * 14) & 1) ? '#c9cfe0' : '#7f879c';
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
    ctx.fillStyle = COL.hazard;
    ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 4, 4);
  };
  Game.prototype.drawOrbit = function (ctx, o, cam, t) {
    const q = Phys.orbitPos(o, t);
    ctx.fillStyle = 'rgba(255,90,120,0.25)';
    for (let a = 0; a < 24; a++) ctx.fillRect(Math.round(o.cx - cam + Math.cos(a / 24 * Math.PI * 2) * o.r), Math.round(o.cy + Math.sin(a / 24 * Math.PI * 2) * o.r), 1, 1);
    ctx.fillStyle = '#5a6380';
    ctx.fillRect(Math.round(o.cx - cam) - 2, o.cy - 2, 5, 5);
    chain(ctx, o.cx - cam, o.cy, q[0] - cam, q[1], 5);
    spikeBall(ctx, q[0] - cam, q[1], 3, t);
  };
  // ---- new obstacles
  Game.prototype.drawFireball = function (ctx, o, cam, t) {
    const q = Phys.fbarPos(o, t), cx = Math.round(o.cx - cam);
    if (o.pivot) {
      // the pivot block, and a faint ring showing the reach of the arm
      ctx.fillStyle = 'rgba(255,150,40,0.18)';
      for (let a = 0; a < 32; a++) ctx.fillRect(Math.round(cx + Math.cos(a / 32 * Math.PI * 2) * 48), Math.round(FF.MID + Math.sin(a / 32 * Math.PI * 2) * 48), 1, 1);
      ctx.fillStyle = '#3a2a40'; ctx.fillRect(cx - 4, FF.MID - 4, 9, 9);
      ctx.fillStyle = '#ff9a3c'; ctx.fillRect(cx - 1, FF.MID - 1, 3, 3);
    }
    const x = Math.round(q[0] - cam), y = Math.round(q[1]), fl = Math.floor(t * 20 + o.r) & 1;
    ctx.fillStyle = 'rgba(255,120,20,0.35)'; ctx.fillRect(x - 5, y - 5, 11, 11);
    ctx.fillStyle = fl ? '#ff5a10' : '#ff7a1a'; ctx.fillRect(x - 4, y - 3, 9, 7); ctx.fillRect(x - 3, y - 4, 7, 9);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 2, y - 2, 5, 5);
    ctx.fillStyle = '#fff6c2'; ctx.fillRect(x - 1, y - 1, 2, 2);
  };
  Game.prototype.drawSnakeOrb = function (ctx, o, x, t) {
    const y = Math.round(Phys.waveY(o, t)), cx = Math.round(x) + 3;
    // the snake's track, then the orb with an electric flicker
    ctx.fillStyle = 'rgba(39,215,255,0.12)'; ctx.fillRect(cx, FF.MID - o.amp, 1, o.amp * 2);
    ctx.fillStyle = 'rgba(39,215,255,0.35)'; ctx.fillRect(cx - 5, y - 5, 11, 11);
    ctx.fillStyle = o.head ? '#b45cff' : '#27d7ff'; ctx.fillRect(cx - 3, y - 4, 7, 9); ctx.fillRect(cx - 4, y - 3, 9, 7);
    ctx.fillStyle = '#eafcff'; ctx.fillRect(cx - 1, y - 2, 3, 3);
    if (o.head) { ctx.fillStyle = '#05060d'; ctx.fillRect(cx - 2, y - 1, 1, 1); ctx.fillRect(cx + 2, y - 1, 1, 1); }
    if (Math.floor(t * 18 + o.x) % 5 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 4, y - 6, 1, 3); }
  };
  Game.prototype.drawBouncer = function (ctx, o, cam, t) {
    // a short motion trail shows which way it's going
    for (let i = 3; i >= 1; i--) {
      const q = Phys.bouncePos(o, t - i * 0.035);
      ctx.fillStyle = 'rgba(255,90,209,' + (0.12 * (4 - i)).toFixed(2) + ')';
      ctx.fillRect(Math.round(q[0] - cam) - 3, Math.round(q[1]) - 3, 7, 7);
    }
    const q = Phys.bouncePos(o, t);
    spikeBall(ctx, q[0] - cam, q[1], 3, t);
    ctx.fillStyle = '#ff5ad1'; ctx.fillRect(Math.round(q[0] - cam) - 1, Math.round(q[1]) - 1, 2, 2);
  };
  Game.prototype.drawMeteor = function (ctx, o, x, t) {
    x = Math.round(x);
    const y = Math.round(Phys.meteorY(o, t)), h = Phys.METEOR_H, warn = Phys.pistonWarn(o, t), ext = Phys.pistonExt(o, t);
    // the crater in the ceiling, and the red warning column before it drops
    ctx.fillStyle = '#2a1408'; ctx.fillRect(x - 1, C, o.w + 2, 3);
    if (warn && Math.floor(t * 16) & 1) { ctx.fillStyle = 'rgba(255,58,80,0.22)'; ctx.fillRect(x, C, o.w, F - C); }
    if (y + h <= C) return;
    // fire trail while it falls
    if (ext > 0.05 && ext < 0.98) for (let i = 1; i < 5; i++) { ctx.fillStyle = i < 3 ? 'rgba(255,176,0,0.55)' : 'rgba(255,58,16,0.35)'; ctx.fillRect(x + 3 + (i & 1), y - i * 4, o.w - 6, 3); }
    ctx.save(); ctx.beginPath(); ctx.rect(x - 2, C, o.w + 4, F - C); ctx.clip();
    ctx.fillStyle = '#5a3020'; ctx.fillRect(x, y, o.w, h);
    ctx.fillStyle = '#8a4a28'; ctx.fillRect(x + 2, y + 2, o.w - 6, h - 6);
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x + 4, y + h - 4, 3, 2); ctx.fillRect(x + o.w - 6, y + 4, 2, 3);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 5, y + 5, 2, 2);
    ctx.restore();
    if (ext >= 0.98) { ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.fillRect(x - 3, F - 2, o.w + 6, 2); } // the impact flash
  };
  Game.prototype.drawPend = function (ctx, o, cam, t) {
    const q = Phys.pendPos(o, t);
    ctx.fillStyle = '#5a6380';
    ctx.fillRect(Math.round(o.px - cam) - 3, C, 7, 3);
    chain(ctx, o.px - cam, C + 2, q[0] - cam, q[1], 9);
    spikeBall(ctx, q[0] - cam, q[1], 5, t);
  };

  Game.prototype.drawLaser = function (ctx, o, x, t) {
    x = Math.round(x);
    const s = Phys.laserState(o, t);
    const halves = { up: [C, FF.MID], down: [FF.MID, F] };
    for (const side of ['up', 'down']) {
      const [y0, y1] = halves[side];
      if (s.on === side) {
        ctx.fillStyle = FF.rgba(COL.hazard, 0.35);
        ctx.fillRect(x - 2, y0, 8, y1 - y0);
        ctx.fillStyle = COL.hazard;
        ctx.fillRect(x, y0, 4, y1 - y0);
        ctx.fillStyle = Math.floor(t * 30) & 1 ? '#ffffff' : COL.hazardLight;
        ctx.fillRect(x + 1, y0, 2, y1 - y0);
      } else {
        const warn = s.warn && s.next === side && Math.floor(t * 16) & 1;
        ctx.fillStyle = warn ? COL.hazardLight : 'rgba(255,90,120,0.35)';
        for (let y = y0; y < y1; y += 4) ctx.fillRect(x + 1, y, 2, 2);
      }
    }
    // emitters
    for (const [y, on] of [[C, s.on === 'up' || (s.warn && s.next === 'up')], [F - 5, s.on === 'down' || (s.warn && s.next === 'down')]]) {
      ctx.fillStyle = '#2a2f45';
      ctx.fillRect(x - 3, y, 10, 5);
      ctx.fillStyle = on ? COL.hazard : '#55607a';
      ctx.fillRect(x, y + 1, 4, 3);
    }
  };

  Game.prototype.drawPad = function (ctx, o, x, t) {
    x = Math.round(x);
    const fl = o.side === 'floor';
    const base = fl ? F - 3 : C;
    ctx.fillStyle = '#0b3d22';
    ctx.fillRect(x, base, o.w, 3);
    ctx.fillStyle = '#39ff88';
    ctx.fillRect(x + 1, fl ? base : base + 2, o.w - 2, 1);
    const bob = Math.floor(t * 6) % 3;
    for (let i = 0; i < 2; i++) {
      const cy = fl ? base - 4 - i * 4 - bob : base + 6 + i * 4 + bob;
      ctx.fillStyle = i ? 'rgba(57,255,136,0.5)' : '#39ff88';
      for (let k = 0; k < 4; k++) {
        const dy = fl ? k : -k;
        ctx.fillRect(x + 4 + k, cy + dy, 1, 1);
        ctx.fillRect(x + 11 - k, cy + dy, 1, 1);
      }
    }
  };

  Game.prototype.drawSign = function (ctx, o, x, t) {
    x = Math.round(x);
    if (o.kind === 'lock') {
      for (const yy of [F - 22, C + 12]) {
        ctx.fillStyle = '#cfd6ff';
        ctx.fillRect(x + 3, o.y === undefined ? yy : yy, 1, 10);
        ctx.fillStyle = '#05060d';
        ctx.fillRect(x - 2, yy - 10, 11, 11);
        FF.drawLock(ctx, x, yy - 9, '#ffe066');
      }
    } else if (o.kind === 'risk') {
      const yy = o.upper ? FF.MID - 30 : FF.MID + 18;
      ctx.fillStyle = '#05060d';
      ctx.fillRect(x - 6, yy - 6, 26, 13);
      FF.drawCoin(ctx, x, yy, t, { gold: true });
      font.draw(ctx, 'x5', x + 6, yy - 3, { color: COL.gold });
      ctx.fillStyle = COL.gold;
      ctx.fillRect(x - 6, yy + (o.upper ? 7 : -7), 26, 1);
    }
  };

  Game.prototype.renderGhost = function (ctx, cam) {
    if (!this.ghost || (this.mode !== 'daily' && !this.weekRun)) return;
    const i = Math.floor(this.time * 30) * 2;
    const g = this.ghost;
    if (i >= g.length - 1) {
      const gx = g[g.length - 2] - cam;
      if (gx > -10 && gx < W + 10) font.draw(ctx, 'x', gx + 6, g[g.length - 1] + 2, { color: COL.purpleLight, align: 'center' });
      return;
    }
    const gx = g[i] - cam, gy = g[i + 1];
    if (gx < -14 || gx > W + 2) return;
    const up = i >= 2 ? g[i + 1] < g[i - 1] - 0.5 || gy <= C + 1 : false;
    FF.drawFlippo(ctx, gx, gy, { skin: 'shadow', face: 'focus', alpha: 0.45, flipY: up && gy < FF.MID });
    if (this.weekRun && this.twist !== 'mirror' && !this.ghostBeaten) font.draw(ctx, this.ghostLabel(), gx + 6, gy < FF.MID ? gy + 14 : gy - 8, { color: '#5ef2ff', align: 'center', outline: '#05060d' });
  };
  Game.prototype.ghostLabel = function () {
    const n = this.opts.ghostName;
    return n && /^[\x20-\x7e#]{1,18}$/.test(n) ? String(n).toUpperCase() : n ? '#1' : 'YOU';
  };
  // 🌑 weekly DARKNESS: you only see so far ahead. The light always reaches at least ~0.85 s of road
  // (more as the run speeds up), and always the full corridor height, so every danger is still readable in time.
  Game.prototype.darkReach = function () {
    const eff = this.L.speedAt(this.p.x) * Game.modeSpeedAt(this.mode, this.p.x, this.L);
    return FF.clamp(eff * 0.85, 150, W - FF.PLAYER_X);
  };
  Game.prototype.drawDark = function (ctx, cam) {
    const cv = this.darkCv || (this.darkCv = FF.makeCanvas(W, H));
    const d = cv.getContext('2d');
    const px = Math.round(this.p.x - cam) + PW / 2, py = this.p.y + PH / 2, reach = this.darkReach();
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = 'rgba(2,3,10,0.96)';
    d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    let g = d.createLinearGradient(px - 40, 0, px + reach, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.18, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.8, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.fillRect(px - 40, C - 4, reach + 40, F - C + 8);
    g = d.createRadialGradient(px, py, 6, px, py, 40);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.fillRect(px - 40, py - 40, 80, 80);
    ctx.drawImage(cv, 0, 0);
  };

  // 🏁 Endless: a flag where your longest run ended — and a cheer the moment you pass it
  Game.prototype.renderBestMark = function (ctx, cam) {
    const bx = this.opts.bestX;
    if (this.mode !== 'endless' || !bx || this.replay) return;
    if (!this.pastBest && this.p.x > bx) {
      this.pastBest = true;
      this.popup('PAST YOUR BEST!', COL.coin, 24);
      this.flash = 0.5; this.flashCol = COL.coin;
      this.sfx('record'); this.buzz(25);
    }
    const x = Math.round(bx - cam);
    if (x < -20 || x > W + 4) return;
    for (let y = C; y < F; y += 6) { ctx.fillStyle = FF.rgba(COL.coin, 0.55); ctx.fillRect(x, y, 1, 3); }
    ctx.fillStyle = COL.coin; ctx.fillRect(x, C, 1, 10); ctx.fillRect(x + 1, C, 7, 5);
    font.draw(ctx, this.opts.weekly ? 'WEEK' : 'BEST', x + 3, C + 8, { color: COL.coin, outline: '#05060d' });
  };

  // 🎯 Weekly challenge: a flag (on the floor) where the player just above you on this week's board crashed.
  // Pass it and you take their place. Only a picture: the road and the rules don't change.
  Game.prototype.renderRivalMark = function (ctx, cam) {
    const rv = this.opts.rival;
    if (this.mode !== 'endless' || !rv || !rv.x || this.replay) return;
    const nm = /^[\x20-\x7e]{1,14}$/.test(rv.name || '') ? String(rv.name).toUpperCase() : 'RIVAL';
    if (!this.pastRival && this.p.x > rv.x) {
      this.pastRival = true;
      this.popup('PASSED ' + nm + '!', '#5ef2ff', 26);
      this.flash = 0.45; this.flashCol = '#5ef2ff';
      this.sfx('record'); this.buzz(30);
    }
    const x = Math.round(rv.x - cam);
    if (x < -40 || x > W + 4) return;
    const col = this.pastRival ? 'rgba(94,242,255,0.35)' : ('#5ef2ff');
    for (let y = C; y < F; y += 6) { ctx.fillStyle = 'rgba(94,242,255,0.5)'; ctx.fillRect(x, y + 3, 1, 3); }
    ctx.fillStyle = col; ctx.fillRect(x, F - 10, 1, 10); ctx.fillRect(x + 1, F - 10, 7, 5);
    font.draw(ctx, nm, x + 3, F - 16, { color: col, outline: '#05060d' });
  };

  // 🎁 build 39: the premium trails, one per premium skin. hx,hy = top-left of the hitbox at that moment, g = its gravity,
  // i = sample index, k = 0 (oldest) .. 1 (newest). Pure drawing, nothing here touches the run.
  Game.prototype.premTrail = function (ctx, tt, hx, hy, g, i, k) {
    const T = this.time, P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const cx = hx + 2, cy = hy + 6, dn = g < 0 ? -1 : 1;
    if (tt === 'jackpot') { // a lucky streak: green-gold chips, now and then a spinning coin or a card
      const s = 1 + Math.floor(k * 2.5);
      P(cx - s / 2, cy - s / 2 + Math.sin(i * 0.7 + T * 6) * 2, s, s, (i / 2 + Math.floor(T * 12)) % 3 ? '#ffd23f' : '#3fdc7a');
      if ((i * 7 + Math.floor(T * 10)) % 13 === 0) { P(cx - 1, cy - 5, 3, 3, '#ffd23f'); P(cx, cy - 5, 1, 3, '#fff6c2'); }
      else if ((i * 5 + Math.floor(T * 8)) % 17 === 0) { P(cx, cy + 3, 2, 3, '#ffffff'); P(cx, cy + 4, 1, 1, '#c02a38'); }
    } else if (tt === 'bwarden') { // blood: a dark liquid line that drips with his gravity
      P(cx - 1, cy - 1, 2 + (k > 0.6 ? 1 : 0), 2, k > 0.7 ? '#ff1a2e' : 'rgba(138,0,22,' + (0.35 + k * 0.5).toFixed(2) + ')');
      if (i % 6 === 0) { const d = ((T * 1.2 + i * 0.13) % 1); P(cx, cy + dn * (2 + d * 9), 1, d < 0.6 ? 2 : 1, 'rgba(192,16,42,' + (0.9 - d * 0.7).toFixed(2) + ')'); }
      if ((i * 3 + Math.floor(T * 14)) % 19 === 0) P(cx - 1, cy - 1, 1, 1, '#ffd0d8');
    } else if (tt === 'wshinobi') { // four-point star sparks that spin as they fade, on a pale wind line
      P(cx - 1, cy, 2, 1, (i & 4) ? 'rgba(255,122,18,' + (0.15 + k * 0.4).toFixed(2) + ')' : 'rgba(122,216,255,' + (0.15 + k * 0.4).toFixed(2) + ')');
      if (i % 4 === 0) {
        const c = k > 0.5 ? '#ffffff' : (i / 4) % 2 ? '#7ad8ff' : '#2a8cff', yy = cy + Math.sin(i + T * 5) * 3;
        P(cx, yy, 1, 1, c);
        // a small hollow diamond that turns as it fades (no plus shapes)
        if ((Math.floor(T * 12) + i) % 2) { P(cx, yy - 1, 1, 1, c); P(cx - 1, yy, 1, 1, c); P(cx + 1, yy, 1, 1, c); P(cx, yy + 1, 1, 1, c); }
        else { P(cx - 1, yy - 1, 2, 2, c); if ((i / 4) % 3 === 0) P(cx + 1, yy + 1, 1, 1, '#ff7a12'); }
      }
    } else if (tt === 'ctyrant') { // embers: a smouldering wake whose sparks rise against his gravity
      const s = 1 + Math.floor(k * 3);
      P(cx - s / 2, cy - s / 2, s, s, k > 0.75 ? '#ffd27a' : k > 0.45 ? ((i & 2) ? '#ff8ab0' : '#ff2a3a') : 'rgba(90,10,26,' + (0.3 + k).toFixed(2) + ')');
      if (i % 5 === 0) { const r = ((T * 1.5 + i * 0.21) % 1); P(cx + Math.sin(i + T * 4) * 2, cy - dn * (3 + r * 10), 1, 1, r < 0.4 ? '#ff8ab0' : 'rgba(255,42,58,' + (1 - r).toFixed(2) + ')'); }
    }
  };

  Game.prototype.renderPlayer = function (ctx, cam) {
    const p = this.p;
    const skinId = this.opts.skin || 'flippo';
    const trail = this.opts.trail || 'pixel';
    const h = this.history;
    const frz = this.frenzyT > 0;
    // trail
    if (!this.dead && (trail !== 'none' || frz) && h.length > 6) {
      const n = h.length / 3;
      for (let i = 0; i < n - 1; i += 2) {
        const hx = h[i * 3] - cam, hy = h[i * 3 + 1];
        const k = i / n;
        let col;
        const tt = frz && trail === 'none' ? 'pixel' : trail;
        if (tt === 'pixel') col = FF.rgba(FF.skinById(skinId).body, 0.15 + k * 0.4);
        else if (tt === 'spark') col = (i & 2) ? '#ffffff' : COL.coin;
        else if (tt === 'rainbow') col = ['#ff3355', '#ffb000', '#ffd23f', '#7dffb2', '#27d7ff', '#b45cff'][(i / 2 + Math.floor(this.time * 12)) % 6];
        else if (tt === 'echo') col = FF.rgba(COL.blueLight, 0.1 + k * 0.3);
        else if (tt === 'legend') col = ['#fff6c2', '#ffd23f', '#ffb000', '#ff6a1a'][(i / 2 + Math.floor(this.time * 16)) % 4];
        else if (tt.indexOf('t_') === 0) { const td = FF.trailById(tt); if (td) { col = td.colors[(i / 2 + Math.floor(this.time * 14)) % td.colors.length]; if (td.style === 'rain') { ctx.fillStyle = col; ctx.fillRect(Math.round(hx + 2), Math.round(hy + 6 + ((i * 5 + this.time * 40) % 9) - 4), 1, (i & 1) + 2); continue; } } }
        else if (tt === 'royal') col = (i * 3 + Math.floor(this.time * 16)) % 7 === 0 ? '#ffffff' : ['#ffd23f', '#c9971a', '#ff3355', '#ffd23f'][(i / 2 + Math.floor(this.time * 10)) % 4];
        else if (tt === 'ivoid') { col = (i * 5 + Math.floor(this.time * 20)) % 9 === 0 ? '#ffffff' : ['#7fe8ff', '#b8a6ff', '#3a5cff', '#e6f6ff'][(i / 2 + Math.floor(this.time * 12)) % 4]; if ((i * 3 + Math.floor(this.time * 24)) % 11 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(hx + 1), Math.round(hy + 2 + Math.sin(i + this.time * 9) * 5), 1, 1); } }
        else if (FF.PREMIUM[tt] && FF.PREMIUM[tt].trail === tt) { this.premTrail(ctx, tt, hx, hy, h[i * 3 + 2], i, k); continue; }
        else if (tt === 'infinity') col = ['#2a8aff', '#7fe8ff', '#b050ff', '#ffffff'][(i / 2 + Math.floor(this.time * 14)) % 4];
        else if (tt === 'matrix') col = (i * 7 + Math.floor(this.time * 18)) % 5 ? FF.rgba('#00ff66', 0.25 + k * 0.6) : '#b8ffd2';
        else if (tt === 'comet') col = k > 0.75 ? '#ffffff' : k > 0.45 ? '#ffe066' : FF.rgba('#ff5a3c', 0.25 + k * 0.6);
        if (!col) continue;
        ctx.fillStyle = col;
        if (tt === 'matrix') { ctx.fillRect(Math.round(hx + 2), Math.round(hy + 6 + ((i * 5 + this.time * 40) % 9) - 4), 1, (i & 1) + 2); continue; }
        const s = tt === 'spark' ? 1 : tt === 'comet' || tt === 'legend' ? 1 + Math.floor(k * 4) : 2 + Math.floor(k * 2);
        ctx.fillRect(Math.round(hx + 6 - s / 2 - 4), Math.round(hy + 6 - s / 2 + (tt === 'spark' ? Math.sin(i) * 3 : 0)), s, s);
      }
    }
    // Flip Echo afterimages
    if (this.echoT > 0 && h.length > 30) {
      for (const back of [10, 20]) {
        const j = h.length - back * 3;
        if (j < 0) continue;
        FF.drawFlippo(ctx, h[j] - cam, h[j + 1], { skin: skinId, face: 'focus', flipY: h[j + 2] < 0, alpha: 0.3 });
      }
    }
    if (this.invuln > 0 && Math.floor(this.invuln * 16) % 2) return;
    if (this.dead) return;
    let face = 'run';
    if (!p.grounded) face = 'flip';
    else if (this.joyT > 0) face = 'joy';
    else if (this.mult() >= 2 || frz) face = 'focus';
    else if (this.time % 3.2 < 0.12) face = 'blink';
    if (!p.grounded && this.joyT > 0) face = 'joy';
    const foot = p.grounded ? Math.floor(p.x / 7) & 1 : -1;
    let sx = 1, sy = 1;
    if (this.squash > 0.05) {
      sx = 1 + this.squash * 0.25;
      sy = 1 - this.squash * 0.25;
    } else if (!p.grounded) {
      sx = 0.9;
      sy = 1.12;
    }
    if (p.fly) {
      // little pixel rocket strapped under Flippo
      const rx = Math.round(p.x - cam) - 3, ry = Math.round(p.y) + 9;
      ctx.fillStyle = '#5a6380'; ctx.fillRect(rx, ry, 16, 5);
      ctx.fillStyle = '#c9cfe0'; ctx.fillRect(rx + 2, ry + 1, 12, 2);
      ctx.fillStyle = COL.hazard; ctx.fillRect(rx + 14, ry + 1, 3, 3); ctx.fillRect(rx - 1, ry - 2, 3, 3);
      if (p.thrust) {
        const fl = 3 + Math.floor(Math.random() * 4);
        ctx.fillStyle = '#ffe066'; ctx.fillRect(rx - fl, ry + 1, fl, 3);
        ctx.fillStyle = '#ff6a1a'; ctx.fillRect(rx - fl - 2, ry + 2, 2, 1);
      }
      face = p.thrust ? 'focus' : 'flip';
      sx = 1; sy = 1;
    }
    const prem = FF.skinById(skinId).prem;
    const aura = skinId === 'ivoid' || prem ? FF.clamp(this.chain / 10, 0, 1) * 0.7 + (this.frenzyT > 0 ? 0.3 : 0) + (this.boss && this.boss.awake ? 0.5 : 0) : 0;
    FF.drawFlippo(ctx, p.x - cam, p.y, { skin: skinId, face, foot: p.fly ? -1 : foot, flipY: p.grav < 0, sx, sy, t: this.time, aura, perf: prem ? this.time - this.perfAt : undefined });
    // ✦ INFINITY VOID: a transformation burst as the run starts
    if (skinId === 'ivoid' && this.time < 0.9 && !this.settings.reduceFx) {
      const k = this.time / 0.9, cx = p.x - cam + 6, cy = p.y + 6;
      ctx.fillStyle = 'rgba(200,240,255,' + (0.5 * (1 - k)).toFixed(2) + ')';
      ctx.fillRect(Math.round(cx - 3 - k * 10), Math.round(cy - 3 - k * 10), Math.round(6 + k * 20), Math.round(6 + k * 20));
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + k * 2, r = 6 + k * 34; ctx.fillStyle = i % 2 ? '#7fe8ff' : '#ffffff'; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 2, 2); }
    }
  };

  // Minimal HUD: score in the middle, coins on the right, combo only when it matters.
  Game.prototype.renderHUD = function (ctx) {
    const sc = String(this.score);
    const sw = font.width(sc, 2);
    font.draw(ctx, sc, W / 2, 5, { color: '#ffffff', align: 'center', scale: 2, outline: '#05060d' });
    const m = this.mult();
    if (m >= 2) {
      const col = m === 3 ? COL.frenzy : COL.near;
      const pulse = Math.floor(this.time * 6) & 1;
      font.draw(ctx, 'x' + m, W / 2 + sw / 2 + 6, 5 - pulse, { color: col, scale: 2, outline: '#05060d' });
    }
    // MILESTONE callout (big, centre) and SO CLOSE on death
    if (this.mileT > 0) {
      const k = this.mileT / 1.6, y = 52 - Math.round((1 - Math.min(1, (1 - k) * 6)) * 10);
      if (k > 0.15 || Math.floor(this.mileT * 20) & 1) {
        font.draw(ctx, this.mileName, W / 2, y, { color: this.mileCol, align: 'center', scale: 2, outline: '#05060d' });
        font.draw(ctx, MILES[this.mileI - 1][0] + ' SEC', W / 2, y + 16, { color: '#ffffff', align: 'center', outline: '#05060d' });
      }
    }
    if (this.dead && this.soClose && this.deadT > 0.12) {
      font.draw(ctx, 'SO CLOSE!', W / 2, 66, { color: COL.coin, align: 'center', scale: 2, outline: '#05060d' });
      font.draw(ctx, this.soClose + 'M TO YOUR BEST', W / 2, 84, { color: '#ffffff', align: 'center', outline: '#05060d' });
    }
    // NERVE: the streak under the score once it's worth something
    if (this.nerve >= 3) {
      const ti = this.nerveTier(), T = ti >= 0 ? NERVE[ti] : null, nx = ti + 1 < NERVE.length ? NERVE[ti + 1][0] : 0;
      const col = T ? T[2] : '#9be7ff';
      const txt = 'NERVE ' + this.nerve + (T ? ' ' + T[1] + ' x' + T[3] : '') + (nx ? '  >' + nx : '');
      font.draw(ctx, txt, W / 2, 27, { color: col, align: 'center', outline: '#05060d' });
    }
    // frenzy meter (only once it starts filling)
    const fill = this.frenzyT > 0 ? this.frenzyT / 6 : this.frenzy;
    if (fill > 0.01) {
      const bw = 64, bx = W / 2 - bw / 2, by = 21;
      ctx.fillStyle = 'rgba(5,6,13,0.7)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
      ctx.fillStyle = this.frenzyT > 0 ? (Math.floor(this.time * 12) & 1 ? COL.frenzy : '#ffffff') : COL.frenzy;
      ctx.fillRect(bx, by, Math.round(bw * fill), 2);
    }
    // coins
    const cs = String(this.coins);
    font.draw(ctx, cs, W - 6, 6, { color: COL.coin, align: 'right', outline: '#05060d' });
    FF.drawCoin(ctx, W - 12 - font.width(cs), 9, this.time);
    if (this.mode === 'zen') font.draw(ctx, 'ZEN', W - 6, 17, { color: COL.perfect, align: 'right', outline: '#05060d' });
    // speedometer: chevrons fill up as the run gets faster
    if ((this.mode === 'endless' || this.mode === 'daily') && !this.inRift) {
      const f = this.speedFactor(), k = FF.clamp((f - 1) / 1.4, 0, 1);
      if (f >= 1.05 || this.stage > 1) { // hidden at the very start: a "1.00X" there only says "this is slow"
      const pul = this.speedPulse > 0 && Math.floor(this.time * 14) & 1;
      const col = pul ? '#ffffff' : k > 0.75 ? COL.hazardLight : k > 0.4 ? '#ff9a3c' : COL.coin;
      for (let i = 0; i < 6; i++) font.draw(ctx, '>', 26 + i * 5, 6, { color: i < Math.ceil(k * 6) ? col : 'rgba(255,255,255,0.18)', outline: '#05060d' });
      font.draw(ctx, f.toFixed(2) + 'X', 26 + 32, 6, { color: col, outline: '#05060d', scale: pul ? 2 : 1 });
      }
      if (this.flow > 0) { // FLOW meter: fills with Perfects, drains over time
        const fc = this.flow >= 1 && Math.floor(this.time * 10) & 1 ? '#ffffff' : '#27d7ff';
        font.draw(ctx, 'FLOW', 26, 15, { color: fc, outline: '#05060d' });
        ctx.fillStyle = 'rgba(5,6,13,0.7)'; ctx.fillRect(48, 16, 32, 4);
        ctx.fillStyle = fc; ctx.fillRect(49, 17, Math.round(30 * this.flow), 2);
      }
    }
    if (this.inRift) {
      const R = this.inRift.def;
      if (Math.floor(this.time * 3) % 2 || this.riftBanner < 2) font.draw(ctx, 'RIFT: ' + R.name, 26, 6, { color: this.world.edge, outline: '#05060d' });
      const fx = this.L.finishX;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 0, W, 2);
      ctx.fillStyle = this.world.edge;
      ctx.fillRect(0, 0, Math.round(W * FF.clamp(this.p.x / fx, 0, 1)), 2);
    }
    // progress line for finite levels
    if (this.mode === 'campaign') {
      font.draw(ctx, this.opts.level.label, 26, 6, { color: '#cfd6ff', outline: '#05060d' });
      if (this.deaths) {
        const dx = 26, dy = 16;
        ctx.fillStyle = '#e8ecff';
        ctx.fillRect(dx + 1, dy, 5, 4); ctx.fillRect(dx + 2, dy + 4, 3, 2);
        ctx.fillStyle = '#05060d';
        ctx.fillRect(dx + 2, dy + 1, 1, 2); ctx.fillRect(dx + 4, dy + 1, 1, 2);
        font.draw(ctx, String(this.deaths), dx + 9, dy - 1, { color: COL.hazardLight, outline: '#05060d' });
      }
    }
    if (this.mode === 'custom' || this.mode === 'campaign') {
      const fx = this.L.finishX;
      if (fx !== Infinity) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 0, W, 2);
        ctx.fillStyle = COL.perfect;
        ctx.fillRect(0, 0, Math.round(W * FF.clamp(this.p.x / fx, 0, 1)), 2);
      }
    }
    // beating your best is celebrated once
    if (!this.bestFlag && this.opts.best && this.score > this.opts.best && (this.mode === 'endless' || this.mode === 'daily')) {
      this.bestFlag = true;
      this.popup('NEW BEST!', COL.coin, 24);
      this.sfx('record');
    }
  };


  Game.prototype.glitchFx = function (ctx) {
    const cv = ctx.canvas;
    for (let i = 0; i < 5; i++) {
      const y = Math.floor(Math.random() * H);
      const h = 2 + Math.floor(Math.random() * 10);
      const dx = Math.floor((Math.random() - 0.5) * 14);
      ctx.drawImage(cv, 0, y, W, h, dx, y, W, h);
    }
    ctx.fillStyle = 'rgba(57,255,136,0.06)';
    ctx.fillRect(0, 0, W, H);
  };
})(window.FF);
