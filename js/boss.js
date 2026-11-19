// FLIPNOVA — ⚔️ BOSS FIGHTS. The weekly event: INFINITY VOID vs THE CRIMSON TYRANT (original characters).
// The fight is pure simulation on FF.STEP ticks: every attack, orb and phase change comes from the run's seed and the
// tick clock, so a fight replays exactly from its recorded taps (death replay, tests). Everything visual (cut-ins,
// impact frames, zoom, particles) reads the simulation and never writes it.
(function (FF) {
  'use strict';
  const W = FF.W, H = FF.H, C = FF.C, F = FF.F, MID = FF.MID, PW = FF.PW, PH = FF.PH, PX = FF.PLAYER_X;
  const COL = FF.COLORS, font = FF.font, BW = FF.BossWorld;
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const hash = BW.hash;
  const ov = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  FF.BOSSES = {};
  FF.registerBoss = (d) => (FF.BOSSES[d.id] = d);

  // ------------------------------------------------------------------ THE CRIMSON TYRANT
  FF.registerBoss({
    id: 'tyrant', name: 'THE CRIMSON TYRANT', nameAr: 'الطاغية القرمزي', world: 'citadel', hp: 140, hero: 'ivoid', heroName: 'INFINITY VOID', heroNameAr: 'إنفينيتي ڤويد',
    // tele = telegraph (sim s; the game runs at 1.25x, so 1.13 s ≈ 0.9 real s), gap = seconds between the waves of one slash.
    // build 37 (owner): fun first. Phase 1 is a gentle showcase (one blade at a time, ~0.9 s warnings, lots of seal orbs),
    // and the challenge rises gently: phase 2 ≈ 0.76 s warnings, phase 3 ≈ 0.66 s with short combos.
    phases: [
      { speed: 135, tele: 1.13, rest: 0.95, overlap: 0, combo: 0, orbEvery: 1.15, waves: 1, cleavers: 2, cleaveInt: 0.8, pillars: 2, pillarInt: 0.9, sweeps: 1, gap: 0.8, waveV: 235 },
      { speed: 150, tele: 0.95, rest: 0.6, overlap: 0, combo: 0.2, orbEvery: 1.2, waves: 2, cleavers: 3, cleaveInt: 0.7, pillars: 3, pillarInt: 0.8, sweeps: 2, gap: 0.72, waveV: 265 },
      { speed: 165, tele: 0.82, rest: 0.35, overlap: 0.08, combo: 0.45, orbEvery: 1.2, waves: 2, cleavers: 4, cleaveInt: 0.64, pillars: 4, pillarInt: 0.72, sweeps: 2, gap: 0.64, waveV: 290 }
    ],
    hearts: 3, continues: 3, invuln: 1.4,
    lines: {
      entrance: ['YOU DARE STAND BEFORE A KING?', 'إنت جاي تقف قدام ملك؟'],
      reply: ['THEN STEP ASIDE, KING.', 'يبقى وسّع يا ملك.'],
      p2: ['YOU CALL THAT LIGHT? BURN!', 'ده نورك؟ اتحرق!'],
      p3: ['THEN THIS WHOLE ARENA FALLS WITH YOU!', 'يبقى الساحة كلها تقع فوق دماغك!'],
      awake: ['FINE. NO MORE HOLDING BACK.', 'تمام. كفاية هزار.'],
      big: ['STAY IN MY SPACE, AND YOU LOSE.', 'طول ما إنت في مساحتي، إنت خسران.'],
      counter: ['TOO SLOW.', 'بطيء أوي.'],
      hurt: [['INSOLENT SPARK!', 'شرارة قليلة الأدب!'], ['I AM ETERNAL!', 'أنا مبموتش!'], ['KNEEL!', 'اركع!']],
      fall: ['IMPOSSIBLE... A STAR OUTSHINES ME?', 'مستحيل... نجمة تطفيني؟'],
      // build 38: the defeat cinematic's mocking cut-in
      mock: [['IS THAT ALL THE VOID HAS? PATHETIC.', 'هو ده كل اللي عند الفراغ؟ ضعيف.'], ['BOW, LITTLE STAR. KINGS DO NOT FALL.', 'انحني يا نجمة صغيرة. الملوك مبتقعش.'], ['RUN HOME. THE CROWN STAYS MINE.', 'ارجع بيتك. التاج هيفضل بتاعي.']]
    }
  });

  // 🌌 build 37: the duel travels through DIMENSIONS. Each one has its own world variant (palette, sky, tiles, particles),
  // its own attack pool and a signature attack it always opens with. `from` = the Tyrant's hp fraction that opens it;
  // `phase` = which tuning row (and checkpoint) it belongs to. Phase checkpoints rewind to the phase's first dimension.
  const DIMS = [
    { id: 'citadel', v: 0, phase: 0, from: 1.0, name: 'THE CRIMSON CITADEL', nameAr: 'قلعة الجمر', pool: ['slash', 'cleave', 'pillar', 'beam'], sig: 'slash' },
    { id: 'mirror', v: 3, phase: 1, from: 0.66, name: 'MIRROR VOID', nameAr: 'فراغ المرايا', pool: ['mirror', 'slash', 'cleave', 'beam'], sig: 'mirror' },
    { id: 'cosmos', v: 4, tunnel: 1, phase: 1, from: 0.53, name: 'STARFALL COSMOS', nameAr: 'كون النجوم', pool: ['comet', 'gravity', 'slash', 'pillar', 'chase'], sig: 'gravity', sigs: ['chase', 'comet'] }, // (b42: the tunnel opens gravity → the Tyrant's chase → comets)
    { id: 'shatter', v: 5, phase: 2, from: 0.33, name: 'SHATTERED TIME', nameAr: 'الزمن المكسور', pool: ['shard', 'slash', 'cleave', 'beam'], sig: 'shard' },
    { id: 'collapse', v: 2, phase: 2, from: 0.15, name: 'THE COLLAPSED CITADEL', nameAr: 'القلعة المنهارة', pool: ['pillar', 'cleave', 'slash', 'beam'], sig: 'cleave' }
  ];
  FF.BOSS_DIMS = DIMS;

  // week → which boss (one boss for now; a future boss joins this list with its own world)
  FF.BOSS_ROTA = ['tyrant'];
  FF.bossWeek = function (now) {
    const w = FF.weekInfo(now);
    return { key: w.key, seed: (FF.hashStr('boss-' + w.key) % 2000000000) + 1, left: w.left, end: w.end, id: FF.BOSS_ROTA[((FF.weekNo(w.key) % FF.BOSS_ROTA.length) + FF.BOSS_ROTA.length) % FF.BOSS_ROTA.length] };
  };

  // b42: the clash QTE and the ultimate
  const CLASH_LEN = 2.7, CLASH_RING = [0.5, 1.75], CLASH_WIN = [1.32, 1.7], CLASH_AT = [0.8, 0.24], ULT_LEN = 2.9, ULT_HIT = 1.65, ULT_DMG = 12, CLASH_DMG = 8;
  const ULT_GAIN = { seal: 4, grand: 6, counter: 7, clash: 25, near: 2, qte: 10 };
  FF.BOSS_QTE = { CLASH_LEN, CLASH_RING, CLASH_WIN, ULT_LEN };
  const SHIFT_LEN = 3.0, ROLL_T = 0.6, TUN_INSET = 3, TUN_REST = 0.75;
  const TUN_EASY = (P) => ({ tele: 1.76, waves: 1, waveV: Math.round(P.waveV * 0.72), cleavers: 2, cleaveInt: P.cleaveInt * 1.5, pillars: 2, pillarInt: P.pillarInt * 1.5, sweeps: 1 });
  const INTRO_FULL = 3.4, INTRO_SHORT = 1.6, TRANS_LEN = 2.5, DYING_LEN = 3.4, REWARD_LEN = 3.4, WON_LEN = 1.6;
  const SX_BLADE = 214;   // screen x where slash waves leave the blades
  const MOUTH = [226, 64]; // the fire beam leaves the jaw here (screen)

  function Fight(game, def, seed) {
    this.g = game;
    this.def = def;
    this.rng = FF.mulberry32(((seed || 1) ^ 0xb055) >>> 0 || 1);
    if (def.sfxMap && !game._sfxMapped) { const base = game.sfx, map = def.sfxMap; game._sfxMapped = 1; game.sfx = function (n, o) { return base.call(this, map[n] || n, o); }; } // b44: a boss can have its own voice
    this.D = def.dims || DIMS; // b43: every boss brings its own dimensions (the Tyrant's are the default)
    this.hpMax = def.hp; this.hp = def.hp;
    this.phase = 0;
    this.t = 0;
    this.mode = 'intro';
    this.introLen = game.opts.introSeen ? INTRO_SHORT : INTRO_FULL;
    this.modeT0 = 0;
    this.hz = []; this.orbs = []; this.bolts = [];
    this.nextAtk = 0; this.nextOrb = 0; this.lastAtk = '';
    this.anim = { kind: 'idle', t0: 0, tl: 0, te: 0, hits: [] };
    this.hitT = -9; this.recoilT = -9; this.shieldT = -9; this.counterCD = 0; this.cutIn = null; this.impactT = -9; this.zoomT = -9;
    this.lastBigLine = -99; this.lastHurt = -99; this.hurtN = 0;
    this.stats = { orbs: 0, counters: 0, shields: 0, attacks: 0, kinds: {}, phases: [0], teleMin: 9 };
    this.fightT0 = 0; this.fightTime = 0;
    this.worldV = 0; this.worldFrom = -1; this.worldK0 = -9; this.worldStyle = 'wipe';
    this.dim = 0; this.sigNext = this.D[0].sig; this.sigQ = (this.D[0].sigs || []).slice(); this.gravT = 0; this.gravEnd = 0; this.dims = [this.D[0].id];
    this.awake = false; this.armsK = 0;
    this.banner = null;
    this.won = false;
    this.events = []; // what happened (for tests): [t, name]
    // build 37: the animation feast. fx() starts an effect on the fight clock (bookkeeping only: it never reads this.rng
    // nor touches a hazard), the renderer draws it from its start time. fxSeen / fxDrawn are for tests.
    this.fxl = []; this.fxSeen = {}; this.fxDrawn = {};
    this.streak = 0; this.streakT = -99;
    this.whips = []; this.defeat = null;
    this.style = 0; this.rank = 0; this.rankT = -9; this.stats.bestRank = 0; // b43: the STYLE meter (D C B A S)
    this.ult = 0; this.ultN = 0; this.clashDone = {}; this.clash = null; this.qteN = 0; // b42: the ultimate meter, clashes, counter-QTEs
    this.ultSkin = game.opts.ultSkin || 'ivoid'; // build 38: camera whips (render bookkeeping) and the defeat cinematic's data
    // build 37 (owner): 3 hearts with a short invulnerability flash after a hit, and a checkpoint at the start of each
    // phase: losing every heart rewinds to the start of the current phase (hp back to that phase's mark, hearts refilled).
    // def.continues rewinds per attempt; after the last one the duel is lost.
    this.heartsMax = def.hearts || 3; this.hearts = this.heartsMax; this.invulnT = -9; this.hurtT = -9;
    this.retries = 0; this.phaseHp = [def.hp, Math.round(def.hp * 0.66), Math.round(def.hp * 0.33)];
    this.stats.hits = 0; this.stats.retries = 0;
    game.L.fixedSpeed = def.phases[0].speed;
  }
  FF.BossFight = Fight;
  Fight.prototype.P = function () { return this.def.phases[this.phase]; };
  Fight.prototype.tunDim = function () { return !!this.D[this.dim].tunnel; };
  Fight.prototype.firstDim = function (ph) { const i = this.D.findIndex((d) => d.phase === ph); return i < 0 ? 0 : i; };
  Fight.prototype.line = function (k) { const l = this.def.lines[k]; return { en: l[0], ar: l[1] }; };
  Fight.prototype.log = function (n) { this.events.push([Math.round(this.t * 1000) / 1000, n]); };
  const sideOf = (p) => (p.grav > 0 ? 'f' : 'c');

  // ---------------------------------------------------------------- hazards (all closed-form in time)
  // returns the hazard's lethal box in WORLD coords at sim time t, with the camera at camAt (= player x - PLAYER_X)
  Fight.prototype.rectAt = function (h, t, camAt) {
    if (h.dead || t < h.tl || t > h.te) return null;
    switch (h.k) {
      case 'wave': { const sx = h.sx0 - h.v * (t - h.tl); return sx < -30 ? null : [camAt + sx, h.side === 'f' ? F - h.h : C, h.w, h.h]; }
      case 'cleave': return [h.wx, h.side === 'f' ? F - 30 : C, 8, 30];
      case 'shard': return [h.wx, h.side === 'f' ? F - 40 : C, 10, 40];
      case 'pillar': { const hh = 54 * Math.min(1, (t - h.tl) / 0.06); return [h.wx, h.side === 'f' ? F - hh : C, 14, hh]; }
      default: if (this.def.rect) return this.def.rect.call(this, h, t, camAt); return null;
      case 'beam': return h.side === 'c' ? [camAt - 30, C, MOUTH[0] + 30, MID - 3 - C] : [camAt - 30, MID + 3, MOUTH[0] + 30, F - MID - 3];
    }
    return null;
  };
  Fight.prototype.hitAt = function (t, camAt, px, py) {
    const ins = this.worldV === 4 ? TUN_INSET : 1; // build 39: the tunnel forgives (a smaller hurtbox, drawn as the hero's core)
    for (const h of this.hz) {
      const r = this.rectAt(h, t, camAt);
      if (r && ov(px + ins, py + ins, PW - 2 * ins, PH - 2 * ins, r[0], r[1], r[2], r[3])) return h;
    }
    return null;
  };
  // predicted first collision (seconds from now) for a copy of the player that flips now (or not), within `horizon`
  Fight.prototype.collideIn = function (flip, horizon, q0, off) {
    const g = this.g, q = FF.Phys.clone(q0 || g.p), o = off || 0;
    if (flip) FF.Phys.flipState(q);
    const dt = 1 / 60;
    for (let s = 0; s * dt <= horizon; s++) {
      const tt = this.t + o + s * dt;
      if (s > 0) FF.Phys.step(q, dt, g.L, g.time + o + s * dt, false);
      if (this.hitAt(tt, q.x - PX, q.x, q.y)) return s * dt;
    }
    return null;
  };

  Fight.prototype.addHz = function (h) {
    h.dead = false;
    if (h.te === undefined) h.te = Infinity;
    this.hz.push(h);
    this.stats.teleMin = Math.min(this.stats.teleMin, h.tl - h.t0);
    return h;
  };
  // when a static (world-placed) hazard is behind the player for good
  Fight.prototype.passT = function (wx, w) { const p = this.g.p; return this.t + Math.max(0, (wx + w - p.x) / p.speed) + 0.05; };

  Fight.prototype.attack = function (kind) {
    // build 39: the STARFALL TUNNEL is easy to read: ≥ 1.4 real s warnings, slower blades, one blade per slash, fewer and
    // wider-spaced cleavers/pillars that still land exactly where the hero arrives
    const tun = this.tunDim(), P0 = this.P(), P = tun ? Object.assign({}, P0, TUN_EASY(P0)) : P0;
    const T = P.tele, t = this.t, p = this.g.p, cam = p.x - PX, v = p.speed;
    const land = (dtl, w) => (tun ? cam + PX + v * dtl - w / 2 + PW / 2 : null); // world x the hero's centre reaches dtl from now
    let side = sideOf(p), busy = t, first = Infinity;
    const other = (s) => (s === 'f' ? 'c' : 'f');
    const hits = [];
    if (kind === 'slash') {
      for (let i = 0; i < P.waves; i++) {
        const tl = t + T + i * P.gap;
        this.addHz({ k: 'wave', side, t0: tl - T, tl, sx0: SX_BLADE, v: P.waveV, w: 16, h: 22 });
        busy = Math.max(busy, tl + (SX_BLADE - PX + 16) / P.waveV + 0.05);
        first = Math.min(first, tl); hits.push(tl);
        side = other(side);
      }
    } else if (kind === 'cleave') {
      for (let i = 0; i < P.cleavers; i++) {
        const t0 = t + i * P.cleaveInt, wx = tun ? land(i * P.cleaveInt + T + 0.1, 8) : cam + v * (i * P.cleaveInt) + 252;
        this.addHz({ k: 'cleave', side, t0, tl: t0 + T + 0.1, wx });
        busy = Math.max(busy, this.passT(wx, 8));
        first = Math.min(first, t0 + T + 0.1); hits.push(t0 + T);
        if (this.rng() < 0.6) side = other(side);
      }
    } else if (kind === 'pillar') {
      for (let i = 0; i < P.pillars; i++) {
        const t0 = t + i * P.pillarInt, wx = tun ? land(i * P.pillarInt + T, 14) : cam + v * (i * P.pillarInt) + 240;
        this.addHz({ k: 'pillar', side, t0, tl: t0 + T, te: t0 + T + 1.0, wx });
        busy = Math.max(busy, this.passT(wx, 14));
        first = Math.min(first, t0 + T); hits.push(t0 + T);
        side = other(side);
      }
    } else if (kind === 'mirror') { // MIRROR VOID: a glass blade on your lane, then its reflection on the other one
      for (let i = 0; i < 2; i++) {
        const tl = t + T + i * 0.62;
        this.addHz({ k: 'wave', mir: 1, side, t0: tl - T, tl, sx0: SX_BLADE, v: P.waveV, w: 16, h: 22 });
        busy = Math.max(busy, tl + (SX_BLADE - PX + 16) / P.waveV + 0.05);
        first = Math.min(first, tl); hits.push(tl);
        side = other(side);
      }
    } else if (kind === 'comet') { // STARFALL COSMOS: comets fall on marked spots (cleaver hitboxes, star-blue)
      for (let i = 0; i < P.cleavers; i++) {
        const t0 = t + i * P.cleaveInt, wx = tun ? land(i * P.cleaveInt + T + 0.1, 8) : cam + v * (i * P.cleaveInt) + 252;
        this.addHz({ k: 'cleave', comet: 1, side, t0, tl: t0 + T + 0.1, wx });
        busy = Math.max(busy, this.passT(wx, 8));
        first = Math.min(first, t0 + T + 0.1); hits.push(t0 + T);
        if (this.rng() < 0.6) side = other(side);
      }
    } else if (kind === 'gravity') { // STARFALL COSMOS: gravity flips on its own (only into a clear lane, warned for T)
      this.gravT = t + T + 0.15; this.gravEnd = this.gravT + 1.0;
      first = this.gravT; hits.push(this.gravT);
      busy = this.gravT + 0.7;
    } else if (kind === 'shard') { // SHATTERED TIME: frozen crystal shards un-freeze in your lane and hang there
      for (let i = 0; i < P.pillars; i++) {
        const t0 = t + i * P.pillarInt, wx = cam + v * (i * P.pillarInt) + 236;
        this.addHz({ k: 'shard', side, t0, tl: t0 + T, te: t0 + T + 1.4, wx });
        busy = Math.max(busy, this.passT(wx, 10));
        first = Math.min(first, t0 + T); hits.push(t0 + T);
        if (this.rng() < 0.55) side = other(side);
      }
    } else if (kind === 'chase') { // b42 TUNNEL CHASE: the Tyrant comes up the tube from BEHIND, raking one lane, then the other
      for (let i = 0; i < 2; i++) {
        const tl = t + T + i * 1.25;
        this.addHz({ k: 'wave', rear: 1, side, t0: tl - T, tl, te: tl + 2.4, sx0: PX - 78, v: -112, w: 18, h: 26, qte: 1 });
        busy = Math.max(busy, tl + (78 + 30) / 112 + 0.1);
        first = Math.min(first, tl); hits.push(tl);
        side = other(side);
      }
    } else if (this.def.attacks && this.def.attacks[kind]) { // b43: a boss's own attacks
      const r = this.def.attacks[kind].call(this, { T, t, p, cam, v, side, P, tun, land, other, kind });
      first = r.first; busy = r.busy; for (const x of r.hits) hits.push(x);
    } else if (kind === 'beam') {
      let tl = t + T;
      for (let i = 0; i < P.sweeps; i++) {
        this.addHz({ k: 'beam', side, t0: tl - T, tl, te: tl + 0.55, qte: this.phase >= 1 ? 1 : 0 }); // (b42: a counter-QTE on the big beams)
        first = Math.min(first, tl); hits.push(tl);
        busy = tl + 0.55;
        tl += 0.55 + 0.55;
        side = other(side);
      }
    }
    this.anim = { kind, t0: t, tl: first, te: busy, hits };
    this.attackFx(kind, busy);
    this.stats.attacks++;
    this.stats.kinds[kind] = (this.stats.kinds[kind] || 0) + 1;
    this.log('atk:' + kind);
    this.g.sfx(kind === 'beam' || kind === 'gravity' ? 'bossCharge' : 'bossWarn');
    return busy;
  };

  // which animated moments an attack brings (all inside its own telegraph / hit window; hitboxes are unchanged)
  Fight.prototype.attackFx = function (kind, busy) {
    if (this.def.attackFx) return this.def.attackFx.call(this, kind, busy);
    const t = this.t, mine = this.hz.filter((h) => h.t0 >= t - 1e-9 && !h.fxd);
    for (const h of mine) h.fxd = 1;
    if (kind === 'mirror') { this.fx('mirrorEcho', Math.max(0.8, busy - t)); for (const tl of this.anim.hits) this.fx('quadSlash', 0.34, { t0: tl - 0.04 }); }
    else if (kind === 'gravity') this.fx('gravityPulse', this.gravEnd - t, { flipAt: this.gravT });
    else if (kind === 'shard') this.fx('clockHands', Math.max(0.8, busy - t));
    else if (kind === 'comet') { /* the comets are drawn with the hazards */ }
    if (kind === 'slash') {
      for (const h of mine) this.fx('chainWhip', h.tl - t + (SX_BLADE - PX + 20) / h.v, { h });
      for (const tl of this.anim.hits) this.fx('quadSlash', 0.34, { t0: tl - 0.04 });
    } else if (kind === 'cleave') {
      this.fx('cleaverTornado', Math.max(0.6, busy - t));
      if (this.phase === 2) for (const h of mine) this.fx('meteor', 0.8, { h, t0: h.tl - 0.45 });
    } else if (kind === 'pillar') {
      for (const h of mine) this.fx('fissure', h.tl - h.t0 + 0.3, { h, t0: h.t0, seed: Math.round(h.wx) });
    } else if (kind === 'beam') {
      this.fx('roarRings', 1.0);
      if (this.phase >= 1) this.fx('thunderStrike', 0.36, { seed: Math.round(t * 1000) });
    }
  };

  Fight.prototype.schedule = function () {
    const P = this.P(), t = this.t;
    if (t < this.nextAtk) return;
    const pool = this.D[this.dim].pool;
    let kind = pool[Math.floor(this.rng() * pool.length)];
    if (kind === this.lastAtk) kind = pool[(pool.indexOf(kind) + 1 + Math.floor(this.rng() * (pool.length - 1))) % pool.length];
    if (this.sigNext) { kind = this.sigNext; this.sigNext = (this.sigQ && this.sigQ.shift()) || null; } // a new dimension opens with its signature attack(s)
    this.lastAtk = kind;
    const busy = this.attack(kind);
    const combo = this.rng() < P.combo && !this.tunDim(); // (no combos in the tunnel)
    this.combo = combo ? t : this.combo;
    this.nextAtk = busy - P.overlap + (combo ? 0.06 : P.rest) + (this.tunDim() ? TUN_REST : 0);
  };

  // ---------------------------------------------------------------- the tick (called by Game.tick, after the physics)
  Fight.prototype.tick = function (dt) {
    const g = this.g, p = g.p;
    this.t += dt;
    const t = this.t, cam = p.x - PX, el = t - this.modeT0;
    // build 39: the tunnel camera's roll eases toward the hero's gravity side over ROLL_T (bookkeeping only, no rng)
    const gs = p.grav > 0 ? 1 : -1;
    if (this.rollSide !== gs) { this.rollA = this.rollSide === undefined ? (gs > 0 ? 0 : Math.PI) : this.rollAt(t); this.rollB = gs > 0 ? 0 : Math.PI; this.rollT0 = t; this.rollSide = gs; }
    if (this.fxl.length) this.fxl = this.fxl.filter((f) => t < f.t0 + f.len + 0.02);
    while (this.whips.length && t > this.whips[0].t0 + this.whips[0].len) this.whips.shift();
    if (this.cutIn && t > this.cutIn.t0 + this.cutIn.len) this.cutIn = null;
    if (this.banner && t > this.banner.t0 + this.banner.len) this.banner = null;
    this.armsK = this.phase >= 1 ? Math.min(1, this.armsK + dt / 0.6) : 0;
    if (this.mode === 'intro') {
      const L = this.introLen;
      if (L === INTRO_FULL) {
        if (el >= 0.9 && !this.burst0) { this.burst0 = 1; this.impact(0.9); g.sfx('bossRoar'); this.fx('roarRings', 1.0); this.cut('boss', 'entrance', 1.3, true); }
        if (el >= 1.7 && !this.vsS) { this.vsS = 1; g.sfx('stingVS'); } // (its swell lands on the VS splash)
        if (el >= 2.2 && !this.vs0) { this.vs0 = 1; g.sfx('cutIn'); g.emit('bossLine', { ar: this.def.heroNameAr + ' ضد ' + this.def.nameAr + ' — ' + this.def.lines.reply[1], len: 1.2 }); }
      } else if (el >= 0.3 && !this.burst0) { this.burst0 = 1; this.impact(0.5); g.sfx('bossRoar'); g.sfx('stingVS'); g.emit('bossLine', { ar: this.def.heroNameAr + ' ضد ' + this.def.nameAr, len: 1.2 }); }
      if (el >= L) this.startFight();
      return;
    }
    if (this.mode === 'trans') {
      if (el >= 0.9 && !this.transDone) {
        this.transDone = 1;
        const D = this.D[this.transDim], newPhase = D.phase !== this.phase;
        this.phase = D.phase;
        this.enterDim(this.transDim);
        this.impact(0.6);
        g.sfx(D.id === 'collapse' ? 'shatter' : 'bossRoar');
        if (newPhase) {
          this.stats.phases.push(Math.round(t * 100) / 100);
          g.L.fixedSpeed = this.P().speed;
          this.log('phase' + (this.phase + 1));
        }
        if (D.id === 'mirror') { this.fx('weatherFront', 1.5, { ph: 1 }); this.fx('crimsonMoon', Infinity); }
        else if (D.id === 'cosmos') this.fx('starfield', Infinity);
        else if (D.id === 'shatter') { if (!this.shift) this.fx('arenaTilt', 1.2); /* (after the tunnel, the unroll is the lurch) */ this.fx('frozenDebris', Infinity); this.fx('shadowClones', Infinity); }
        if (this.def.onDim) this.def.onDim.call(this, D, newPhase);
        else if (D.id === 'collapse') { this.fxl = this.fxl.filter((f) => f.id !== 'shadowClones' && f.id !== 'frozenDebris'); this.fx('arenaTilt', 1.2); this.fx('pillarCollapse', 1.6); this.fx('debrisFall', Infinity); this.fx('weatherFront', 1.5, { ph: 2 }); g.sfx('quake'); }
        if (this.hdOn() && !isAr(g)) FF.HDBoss.title(D.name, newPhase ? 'PHASE ' + (this.phase + 1) : 'DIMENSION ' + (this.dim + 1), ['#ffd23f', '#7fe8ff', '#b8a6ff', '#ffe6a0', '#ff8a00'][this.dim], 2.1); // 🎬 b47: the name slammed in the trailer's style
        else this.say(D.name, newPhase ? 'PHASE ' + (this.phase + 1) : 'DIMENSION ' + (this.dim + 1), D.nameAr, newPhase ? 'المرحلة ⁦' + (this.phase + 1) + '⁩' : 'البُعد ⁦' + (this.dim + 1) + '⁩', ['#ffd23f', '#7fe8ff', '#b8a6ff', '#bff6ff', '#ff8a00'][this.dim]);
      }
      if (this.transCut && el >= 1.75) { this.cut('boss', this.transCut, 1.1, true); this.transCut = null; }
      if (!this.def.dims && this.phase === 2 && this.dim === 3 && el >= (this.shift ? 2.5 : 1.45) && !this.awake) {
        this.awake = true;
        this.cut('hero', 'awake', 1.0, true);
        this.fx('aurora', Infinity);
        this.say('VOID AWAKENED', 'YOUR SEALS HIT HARDER', 'الفراغ صحي', 'ضرباتك بقت أقوى', '#7fe8ff');
        g.sfx('cutIn');
        g.flash = 1; g.flashCol = '#7fe8ff';
        g.burst(p.x + 6, p.y + 6, ['#7fe8ff', '#ffffff', '#b8a6ff'], 40, 140, 2);
      }
      if (el >= (this.transLen || TRANS_LEN)) { this.mode = 'fight'; this.modeT0 = t; this.nextAtk = t + 0.5; this.nextOrb = t + 0.3; }
      return;
    }
    if (this.mode === 'clash') {
      if (!this.clash.res && el >= CLASH_RING[1]) this.clashResolve(false);
      if (this.mode === 'clash' && el >= CLASH_LEN) { this.mode = 'fight'; this.modeT0 = t; this.nextAtk = t + 0.9; this.nextOrb = t + 0.4; }
      return false;
    }
    if (this.mode === 'finale') { if (this.def.finaleTick) this.def.finaleTick.call(this, el, dt); return false; } // b44
    if (this.mode === 'ult') {
      if (el >= ULT_HIT && !this.ultHitDone) { this.ultHitDone = 1; g.sfx('ultHit', { skin: this.ultSkin }); this.impact(1.2); this.strike(ULT_DMG); }
      if (this.mode === 'ult' && el >= ULT_LEN) { this.mode = 'fight'; this.modeT0 = t; this.nextAtk = t + 0.9; this.nextOrb = t + 0.4; }
      return false;
    }
    if (this.mode === 'retry') {
      if (el >= 1.5) { this.mode = 'fight'; this.modeT0 = t; this.nextAtk = t + 0.9; this.nextOrb = t + 0.3; this.say('FIGHT!', '', 'يلا!', '', '#ffd23f', 0.7); g.sfx('uiGo'); }
      return;
    }
    if (this.mode === 'dying') {
      if (!this.def.onDying && Math.floor(el / 0.2) !== Math.floor((el - dt) / 0.2) && el < 2.4) { g.sfx('bossHit'); g.shake = Math.max(g.shake, 0.25); }
      if (el >= 2.2 && !this.whiteOut) { this.whiteOut = t; this.fx('victoryBurst', 1.1); this.impact(1.0); g.sfx('stingVictory'); this.say((this.def.fallTitle || ['TYRANT FALLS'])[0], 'TIME ' + fmtTime(this.fightTime), (this.def.fallTitle || [0, 'الطاغية وقع'])[1], 'الوقت ⁦' + fmtTime(this.fightTime) + '⁩', '#ffd23f'); }
      if (el >= DYING_LEN) { this.mode = g.opts.heroOwned ? 'won' : 'reward'; this.modeT0 = t; if (this.mode === 'reward') g.sfx('unlock'); }
      return;
    }
    if (this.mode === 'reward' || this.mode === 'won') {
      if (el >= (this.mode === 'reward' ? REWARD_LEN : WON_LEN) && !g.ended) { g.finished = true; g.end(); }
      return;
    }
    // ---- fight
    // build 39: a heartbeat under the fight when hearts run low — and it races on the last heart
    if (this.hearts <= 2 && this.hearts > 0 && t >= (this.nextBeat || 0)) { g.sfx('heart', { fast: this.hearts === 1 }); this.nextBeat = t + (this.hearts === 1 ? 0.5 : 0.95); }
    if (this.style > 0) this.styleSet(this.style - dt * 3.2);
    if (this.def.tick) this.def.tick.call(this, t, dt);
    this.schedule();
    // the weather lives: lava geysers in the distance, ember storms once the Tyrant is awake (clock-driven, no rng)
    const ft = t - this.fightT0, cross = (per, off) => Math.floor((ft - off) / per) !== Math.floor((ft - dt - off) / per);
    if (!this.def.dims && cross(2.7, 0.4)) this.fx('lavaGeyser', 1.6, { px: 40 + hash(Math.floor(ft * 10)) * 240, cam0: cam });
    if (!this.def.dims && this.phase >= 1 && cross(5.2, 1.0)) this.fx('emberStorm', 2.2);
    if (!this.def.noOrbs && t >= this.nextOrb) {
      const r = this.rng(), side = r < 0.38 ? 'f' : r < 0.76 ? 'c' : 'm';
      this.orbs.push({ wx: cam + 330, y: side === 'f' ? F - 9 : side === 'c' ? C + 9 : MID, side, t0: t });
      this.nextOrb = t + this.P().orbEvery * (0.8 + 0.4 * this.rng());
    }
    // the time-shield shatters slash waves that touch it
    if (t < this.shieldT) {
      for (const h of this.hz) {
        if (h.k !== 'wave' || h.dead) continue;
        const r = this.rectAt(h, t, cam);
        if (r && Math.abs(r[0] + r[2] / 2 - (p.x + 6)) < 26 && Math.abs(r[1] + r[3] / 2 - (p.y + 6)) < 30) {
          h.dead = true; this.stats.shields++;
          g.burst(r[0] + 8, r[1] + 10, ['#7fe8ff', '#ffffff', '#ff3a5a'], 14, 90);
          g.sfx('perfect'); g.popup('BLOCKED', '#7fe8ff', 30);
        }
      }
    }
    if (!g.opts.god && t >= this.invulnT) {
      const h = this.hitAt(t, cam, p.x, p.y);
      if (h && this.hurt(h)) return true;
      if (this.mode !== 'fight') return false;
      this.nearMisses(t, cam, p);
    }
    this.hz = this.hz.filter((h) => !(h.dead || t > h.te + 0.3 || (h.k === 'wave' && !h.rear && h.sx0 - h.v * (t - h.tl) < -40) || ((h.k === 'cleave' || h.k === 'pillar' || h.k === 'shard') && h.wx < cam - 40)));
    // the gravity shift: flips the hero on its own, but only into a lane that stays clear (else it waits, then fizzles)
    if (this.gravT && t >= this.gravT) {
      if (t > this.gravEnd) this.gravT = 0;
      else if (this.collideIn(true, 0.6) === null) {
        FF.Phys.flipState(p); this.gravT = 0;
        this.log('gravity'); g.sfx('freeze'); g.flash = 0.6; g.flashCol = '#b8a6ff';
        g.burst(p.x + 6, p.y + 6, ['#b8a6ff', '#ffffff', '#7fe8ff'], 16, 120);
      }
    }
    // seal orbs
    for (const o of this.orbs) {
      if (o.taken) continue;
      if (Math.abs(o.wx - (p.x + 6)) < 9 && Math.abs(o.y - (p.y + 6)) < 11) {
        o.taken = t;
        const big = o.side === 'm', dmg = this.tunDim() ? (big ? 3 : 2) : (big ? 6 : 4) + (this.awake ? 1 : 0); // (b39: the tunnel lasts twice as long)
        this.stats.orbs++;
        this.addStreak(); this.gain(big ? 'grand' : 'seal');
        this.bolts.push({ t0: t, dmg, sx: PX + 6, sy: p.y + 6, big });
        g.skill(big ? 'GRAND SEAL' : 'SEAL', big ? '#ffe9a0' : '#7fe8ff', big ? 80 : 40, 0.12);
        g.sfx('sealFire');
        g.burst(o.wx, o.y, ['#7fe8ff', '#ffffff', '#b8a6ff'], 10, 70);
        if (big && t - this.lastBigLine > 9) { this.lastBigLine = t; this.cut('hero', 'big', 1.0, false); }
      }
    }
    this.orbs = this.orbs.filter((o) => !o.taken && o.wx > cam - 20);
    // seal bolts land on the Tyrant
    for (const b of this.bolts) if (!b.done && t >= b.t0 + 0.3) { b.done = true; this.damage(b.dmg, b.counter); }
    this.bolts = this.bolts.filter((b) => !b.done || t < b.t0 + 0.6);
    return false;
  };

  // build 38: a hazard that brushes past the hero (in its column, a few pixels off) is a NEAR MISS: a moment of slow
  // motion (real-time pacing only: the ticks are unchanged), streaks and CLOSE!. Reads the hazards, never changes them.
  Fight.prototype.nearMisses = function (t, cam, p) {
    for (const h of this.hz) {
      if (h.nm || h.dead || t < h.tl) continue;
      const r = this.rectAt(h, t, cam);
      if (!r || r[0] > p.x + PW || r[0] + r[2] < p.x) continue;
      const gap = Math.max(r[1] - (p.y + PH), p.y - (r[1] + r[3]));
      if (gap >= 0 && gap < (p.grounded ? 10 : 26)) {
        h.nm = 1; this.stats.nearMiss = (this.stats.nearMiss || 0) + 1; this.gain('near');
        this.fx('nearMiss', 0.5);
        this.whip(0, p.grav > 0 ? 3 : -3, 0, 0.28);
        const g = this.g;
        g.slowT = Math.max(g.slowT, 0.22);
        g.sfx('whoosh');
        this.log('near');
      }
    }
  };
  Fight.prototype.startFight = function () {
    this.mode = 'fight'; this.modeT0 = this.t; this.fightT0 = this.t;
    this.nextAtk = this.t + 0.7; this.nextOrb = this.t + 0.35;
    this.say('FIGHT!', '', 'يلا!', '', '#ffd23f', 0.9);
    this.g.sfx('uiGo'); this.g.flash = 0.8; this.g.flashCol = '#ffd23f';
    this.log('fight');
  };
  Fight.prototype.say = function (title, sub, titleAr, subAr, col, len) {
    this.banner = { title, sub, titleAr, subAr, col, t0: this.t, len: len || 1.8 };
    this.g.emit('bossBanner', this.banner);
  };
  // a portrait cut-in. full = letterboxed, mid-screen (only when nothing can hurt you); else a strip above the ceiling
  Fight.prototype.cut = function (who, key, len, full) {
    const l = this.def.lines[key];
    this.cutIn = { who, en: l[0], ar: l[1], t0: this.t, len: Math.min(2, len), full: !!full };
    this.g.emit('bossLine', this.cutIn);
  };
  Fight.prototype.impact = function (zoom) {
    this.impactT = this.t; this.zoomT = this.t; this.zoomAmt = zoom || 0.5;
    const g = this.g;
    if (!g.settings.reduceFx) { g.hitstop = Math.max(g.hitstop, 0.07); g.shake = Math.max(g.shake, 0.35); }
  };

  Fight.prototype.damage = function (dmg, counter) {
    const g = this.g, t = this.t;
    if (this.mode !== 'fight') return;
    this.hp = Math.max(0, this.hp - dmg);
    this.hitT = t; this.recoilT = t;
    g.sfx('bossHit');
    this.fx('sealImpact', 0.6, { dmg, seed: Math.round(t * 1000) });
    this.fx('hitSpark', 0.42, { n: this.streak, seed: Math.round(t * 997) });
    if (dmg >= 6 || counter) this.whip(7, -3, -0.025);
    if (!g.settings.reduceFx) { g.hitstop = Math.max(g.hitstop, dmg >= 6 ? 0.06 : 0.035); g.shake = Math.max(g.shake, dmg >= 6 ? 0.28 : 0.15); }
    if (dmg >= 6 || counter) { this.impactT = t; this.fx('voidCut', 0.34, { seed: Math.round(t * 1000) }); g.sfx('voidCut'); }
    g.burst(g.camX + 236, 70 + this.rng() * 50, ['#ffffff', '#7fe8ff', '#ff3a5a', '#ffd27a'], 16, 120, 2);
    this.dmgPops = (this.dmgPops || []).filter((d) => t - d.t < 0.8).concat([{ t, dmg, y: 40 + this.rng() * 40 }]);
    if (t - this.lastHurt > 7 && this.hp > 0 && this.rng() < 0.5) { this.lastHurt = t; const l = this.def.lines.hurt[this.hurtN++ % this.def.lines.hurt.length]; this.cutIn = { who: 'boss', en: l[0], ar: l[1], t0: t, len: 0.9, full: false }; g.emit('bossLine', this.cutIn); }
    const f = this.hp / this.hpMax;
    if (this.hp <= 0) return this.def.finale && !this.finaleDone ? this.def.finale.call(this) : this.startDying();
    let d = this.dim;
    while (d + 1 < this.D.length && f <= this.D[d + 1].from) d++;
    if (d > this.dim) return this.startTrans(d);
    // b42: at the big moments the duel becomes a CLASH (a timed tap)
    if (!this._noClash) for (let i = 0; i < CLASH_AT.length; i++) if (!this.clashDone[i] && f <= CLASH_AT[i]) { this.clashDone[i] = 1; return this.startClash(i); }
  };
  // b42: damage dealt from inside a cinematic (clash win, counter-QTE, ultimate): the same path as a seal, transitions included
  Fight.prototype.strike = function (dmg) {
    const m = this.mode;
    if (this.tunDim()) dmg = Math.ceil(dmg / 2); // (the tunnel lasts: everything hits for half in it)
    this.mode = 'fight'; this._noClash = true;
    this.damage(dmg, true);
    this._noClash = false;
    if (this.mode === 'fight') this.mode = m;
  };
  // b43: STYLE. Every stylish act (a seal, a near miss, a counter, a clash) raises it; it drains slowly and a hit costs a lot.
  // The rank multiplies how fast the ULT fills. It is fight bookkeeping (no rng), so replays stay exact.
  const STYLE_GAIN = { seal: 5, grand: 9, counter: 14, clash: 25, near: 11, qte: 18 }, RANK_AT = [0, 18, 38, 58, 80], RANK_MUL = [1, 1, 1.1, 1.25, 1.5];
  FF.BOSS_RANKS = ['D', 'C', 'B', 'A', 'S'];
  Fight.prototype.styleSet = function (v) {
    this.style = Math.max(0, Math.min(100, v));
    let r = 0; while (r + 1 < RANK_AT.length && this.style >= RANK_AT[r + 1]) r++;
    if (r > this.rank) { this.rankT = this.t; this.g.sfx('styleUp', { rank: r }); this.log('rank:' + FF.BOSS_RANKS[r]); }
    this.rank = r; this.stats.bestRank = Math.max(this.stats.bestRank, r);
  };
  Fight.prototype.gain = function (k) {
    this.styleSet(this.style + (STYLE_GAIN[k] || 0));
    if (this.ult >= 100) return;
    this.ult = Math.min(100, this.ult + ULT_GAIN[k] * (this.def.styleUlt ? RANK_MUL[this.rank] : 1)); // (b44: the weekly Tyrant keeps its tuned pace)
    if (this.ult >= 100) { this.fx('ultReady', 1.4); this.g.sfx('ultReady'); this.log('ultReady'); }
  };
  // ---- the CLASH: the screen splits, time slows, a ring closes — tap as it meets the gold band
  Fight.prototype.startClash = function (i) {
    const g = this.g;
    this.mode = 'clash'; this.modeT0 = this.t; this.clash = { i, res: null, resT: -1 };
    this.clearField(); this.orbs = []; this.gravT = 0;
    this.invulnT = Math.max(this.invulnT, this.t + CLASH_LEN + 0.6);
    this.fx('clashSplit', CLASH_LEN);
    g.sfx('clashIn'); g.slowT = Math.max(g.slowT, 0.5);
    this.stats.clash = this.stats.clash || { win: 0, lose: 0 };
    this.log('clash');
  };
  Fight.prototype.clashResolve = function (win) {
    const g = this.g, c = this.clash;
    if (!c || c.res) return;
    c.res = win ? 'win' : 'lose'; c.resT = this.t;
    this.stats.clash[c.res]++;
    if (win) {
      this.gain('clash'); this.addStreak();
      this.fx('clashWin', CLASH_LEN - (this.t - this.modeT0) + 0.3);
      g.sfx('clashWin'); this.impact(1.0); this.whip(10, -4, 0.04, 0.5);
      this.strike(CLASH_DMG);
      this.log('clash:win');
    } else {
      // failing costs a heart, but never the last one: a clash can not end the duel
      if (this.hearts > 1) { this.hearts--; this.hurtT = this.t; this.stats.hits++; }
      this.fx('heartShatter', 0.8, { n: this.hearts, y: g.p.y }); this.fx('clashLose', 1.0);
      g.sfx('clashLose'); g.flash = 0.7; g.flashCol = '#ff3a5a'; this.whip(-10, 4, -0.05, 0.5);
      this.log('clash:lose');
    }
  };
  // ---- the ULTIMATE: a full meter + the ULT button (recorded like a tap: replays stay exact)
  Fight.prototype.ultimate = function () {
    const g = this.g;
    if (this.mode !== 'fight' || this.ult < 100 || g.dead) return false;
    this.mode = 'ult'; this.modeT0 = this.t; this.ult = 0; this.ultN++; this.ultHitDone = 0;
    this.clearField(); this.orbs = []; this.gravT = 0;
    this.invulnT = Math.max(this.invulnT, this.t + ULT_LEN + 0.6);
    this.stats.ults = (this.stats.ults || 0) + 1;
    this.fx('ultimate', ULT_LEN, { skin: this.ultSkin });
    g.sfx('ultStart', { skin: this.ultSkin }); g.slowT = Math.max(g.slowT, 0.4);
    this.log('ult:' + this.ultSkin);
    return true;
  };
  Fight.prototype.ultReady = function () { return this.mode === 'fight' && this.ult >= 100 && !this.g.dead; };
  Fight.prototype.botWantsUlt = function () { return this.ultReady(); };
  // the ULT button (canvas coordinates): bottom-left, above the floor
  Fight.prototype.ultHit = function (x, y) { return this.ultReady() && x < 46 && y > H - 46; };
  // when a counter-QTE hazard reaches the hero (beam: when it lights; the chase: when its blade passes the hero)
  const qteAt = (h) => (h.k === 'beam' ? h.tl : h.tl + (PX - h.sx0) / -h.v);
  FF.bossQteAt = qteAt;
  Fight.prototype.clearField = function () {
    const g = this.g, cam = g.p.x - PX;
    for (const h of this.hz) { const r = this.rectAt(h, Math.max(this.t, h.tl), cam); if (r) g.burst(r[0] + r[2] / 2, r[1] + r[3] / 2, ['#ff8a3a', '#ffd27a', '#2a0a10'], 8, 70); }
    this.hz = []; this.anim = { kind: 'roar', t0: this.t, tl: this.t, te: this.t + 1.2, hits: [] };
  };
  Fight.prototype.startTrans = function (d) {
    const g = this.g, np = this.D[d].phase, newPhase = np !== this.phase;
    this.mode = 'trans'; this.modeT0 = this.t; this.transTo = np; this.transDim = d; this.transDone = 0;
    this.whip(0, 7, 0.05, 0.5);
    // build 39: into or out of the tunnel is a DIMENSION SHIFT: the arena rolls up into a tube (or unrolls), hyperspace
    this.shift = this.D[d].tunnel ? 'in' : this.tunDim() ? 'out' : null;
    this.transLen = this.shift ? SHIFT_LEN : TRANS_LEN;
    g.sfx('shiftBoom'); // a reverse swell into a deep boom on every phase change / dimension shift
    if (this.def.transFx) this.fx(this.def.transFx, this.transLen, { to: this.D[d].id, from: this.D[this.dim].id, shift: this.shift });
    if (this.shift) { if (!this.def.transFx) { g.sfx('warp'); this.fx('dimensionShift', SHIFT_LEN, { dir: this.shift }); } this.log('shift:' + this.shift); }
    this.clearField();
    this.impact(0.7);
    g.slowT = Math.max(g.slowT, 0.5);
    g.flash = 1.4; g.flashCol = this.def.flashCol || (np === 2 ? '#ff8a00' : '#ff3a5a');
    g.sfx('bossRoar');
    if (!this.def.dims) { this.fx('roarRings', 1.0); this.fx('thunderStrike', 0.36, { seed: Math.round(this.t * 1000) }); }
    g.sfx('thunder');
    if (newPhase && !this.shift) this.cut('boss', np === 1 ? 'p2' : 'p3', 1.5, true);
    if (newPhase) this.g.emit('bossPhase', { boss: this.def.id, phase: np }); // b43: the story mode plays a flashback here
    this.transCut = newPhase && this.shift ? (np === 1 ? 'p2' : 'p3') : null; // (a shift plays first: the king speaks after it)
  };
  Fight.prototype.startDying = function () {
    const g = this.g;
    this.mode = 'dying'; this.modeT0 = this.t; this.won = true;
    this.fightTime = this.t - this.fightT0;
    this.clearField();
    this.anim = { kind: 'dying', t0: this.t, tl: this.t, te: this.t + DYING_LEN, hits: [] };
    this.impact(0.9);
    g.slowT = Math.max(g.slowT, 1.6);
    g.sfx('impact');
    this.cut('boss', 'fall', 0.85, true); // (b38: short — the finishing combo is the show)
    this.fxl = this.fxl.filter((f) => f.id !== 'shadowClones');
    if (this.def.onDying) this.def.onDying.call(this);
    else {
      this.fx('deathThroes', DYING_LEN);
      this.fx('galaxyFinisher', DYING_LEN);
      this.fx('finalCombo', 2.4); // build 38: a dash through the king, then a storm of hits
    }
    this.log('dying');
  };
  // a flip: a PERFECT dodge (the attack was about to land) counter-hits and raises the time-shield
  Fight.prototype.onFlip = function (oldSide) {
    const g = this.g, t = this.t;
    if (this.mode === 'intro' && g.opts.introSeen && t - this.modeT0 > 0.2) { this.introLen = Math.min(this.introLen, t - this.modeT0 + 0.15); return; }
    if (this.mode === 'clash') { const el = t - this.modeT0; if (el >= CLASH_RING[0]) this.clashResolve(el >= CLASH_WIN[0] && el <= CLASH_WIN[1]); return; }
    if (this.mode === 'finale') { if (this.def.finaleTap) this.def.finaleTap.call(this); return; }
    if (this.mode === 'fight' && this.def.onTap) this.def.onTap.call(this); // b44: a boss can read every tap (PALE NIRO: knocking back)
    if (this.mode === 'fight') this.fx('starDash', 0.5, { x0: g.p.x, y0: g.p.y });
    // b42: COUNTER-QTE — a big attack carries a closing ring; a flip inside its band cancels it and strikes back
    if (this.mode === 'fight') for (const h of this.hz) {
      if (!h.qte || h.dead || h.qd) continue;
      const at = qteAt(h);
      if (t >= at - 0.4 && t <= at - 0.04) {
        h.qd = 1; h.dead = true; this.qteN++;
        this.stats.qte = (this.stats.qte || 0) + 1;
        this.fx('qteCounter', 0.8, { kind: h.k, side: h.side });
        g.sfx('clash'); g.sfx('impact'); this.whip(9, 0, 0.03);
        this.gain('qte'); this.addStreak();
        this.strike(5);
        this.log('qte:' + h.k);
        return;
      }
    }
    if (this.mode !== 'fight' || t < this.counterCD) return;
    const q = FF.Phys.clone(g.p);
    FF.Phys.flipState(q); // undo: the copy stays where the player was
    q.vy = 0;
    const dt = 1 / 60;
    let threat = null;
    for (let s = 0; s * dt <= 0.24 && !threat; s++) {
      const qx = g.p.x + g.p.speed * s * dt, h = this.hitAt(t + s * dt, qx - PX, qx, q.y);
      if (h) { const r = this.rectAt(h, t + s * dt, qx - PX); threat = { wx: FF.clamp(r[0] + r[2] / 2, qx, qx + 40), wy: FF.clamp(q.y + PH / 2, r[1], r[1] + r[3]) }; }
    }
    if (!threat) return;
    this.fx('parryClash', 0.45, threat); // build 38: the dodge CLASHES with the attack where it would have hit
    this.whip(8, 0, 0.03);
    g.sfx('clash');
    this.counterCD = t + 0.9;
    this.shieldT = t + 0.55;
    this.stats.counters++;
    this.addStreak(); this.gain('counter');
    // TIME STOP: the world greys and holds still for ~0.4 real s (a real-time hitstop: the simulation never pauses, so
    // replays are untouched; slowT 0.28 halves the drain at first, hence 0.33), then space ripples out from the hero
    this.fx('timeFreeze', 0.05);
    this.fx('perfectRipple', 0.6);
    if (!g.settings.reduceFx) g.hitstop = Math.max(g.hitstop, 0.33);
    g.sfx('freeze');
    this.bolts.push({ t0: t, dmg: this.tunDim() ? 3 : 5 + (this.awake ? 1 : 0), sx: PX + 6, sy: g.p.y + 6, big: true, counter: true });
    g.skill('COUNTER!', '#7fe8ff', 120, 0.2, 2);
    g.slowT = Math.max(g.slowT, 0.28);
    g.sfx('impact');
    this.impactT = t;
    if (this.stats.counters % 3 === 1 && t - this.lastBigLine > 6) { this.lastBigLine = t; this.cut('hero', 'counter', 0.9, false); }
    this.log('counter');
  };

  // a hit: lose a heart (and flash invulnerable for a moment); with no hearts left, rewind to this phase's checkpoint
  Fight.prototype.hurt = function (h) {
    const g = this.g, t = this.t, p = g.p;
    this.log('hit:' + h.k);
    this.stats.hits++;
    this.hearts--; this.hurtT = t; this.invulnT = t + (this.def.invuln || 1.4);
    this.styleSet(this.style - 45);
    this.streak = 0;
    this.fx('heartShatter', 0.8, { n: this.hearts, y: p.y });
    this.nextBeat = t + 0.6;
    this.whip(-9, 4, -0.05); this.impactT = t; // build 38: every hit lands with an impact frame and a camera whip
    g.sfx('bossHurt'); g.buzz(40);
    if (!g.settings.reduceFx) g.shake = Math.max(g.shake, 0.3);
    g.flash = 0.7; g.flashCol = '#ff3a5a';
    g.burst(p.x + 6, p.y + 6, ['#ff3a5a', '#ffffff', '#7fe8ff'], 18, 110);
    if (this.hearts > 0) { g.popup(this.hearts === 1 ? 'LAST HEART!' : 'OUCH!', '#ff9ab0', 26); return false; }
    if (this.retries >= (this.def.continues || 0)) { g.die({ cause: 'boss_' + h.k }); this.defeatStart(); return true; }
    this.retries++; this.stats.retries++;
    this.hp = Math.min(this.hpMax, Math.max(this.hp, this.phaseHp[this.phase]));
    this.hearts = this.heartsMax; this.invulnT = t + 2.5;
    this.clearField(); this.orbs = []; this.bolts = []; this.gravT = 0;
    this.enterDim(this.firstDim(this.phase));
    this.mode = 'retry'; this.modeT0 = t;
    this.fx('checkpointRewind', 1.5);
    this.say('CHECKPOINT', 'PHASE ' + (this.phase + 1) + ' AGAIN', 'نقطة حفظ', 'المرحلة ⁦' + (this.phase + 1) + '⁩ تاني', '#7fe8ff', 1.4);
    g.sfx('freeze');
    this.log('checkpoint');
    return false;
  };
  // step into dimension d: its world (ripped open), its signature attack next
  Fight.prototype.enterDim = function (d) {
    const DIMS = this.D;
    if (d === this.dim && this.worldV === DIMS[d].v) return;
    this.dim = d;
    this.worldFrom = this.worldV; this.worldV = DIMS[d].v; this.worldK0 = this.t; this.worldStyle = this.def.transFx ? 'none' : 'rip';
    if (this.def.transFx) this.worldK0 = -10; // (its own effect carries the change)
    if (this.mode === 'trans' && this.shift) this.worldK0 = -10; // (the dimension shift replaces the rip)
    this.sigNext = DIMS[d].sig; this.sigQ = (DIMS[d].sigs || []).slice();
    if (this.dims[this.dims.length - 1] !== DIMS[d].id) this.dims.push(DIMS[d].id);
    if (!(this.mode === 'trans' && this.shift) && !this.def.transFx) this.fx('dimensionRip', 1.0);
    this.log('dim:' + DIMS[d].id);
  };
  Fight.prototype.addStreak = function () {
    if (this.t - this.streakT > 5) this.streak = 0;
    this.streak++; this.streakT = this.t;
    if (!this.fxl.some((f) => f.id === 'starShards')) this.fx('starShards', Infinity);
  };
  Fight.prototype.fx = function (id, len, d) {
    if (!FX[id]) return null;
    const f = Object.assign({ id, t0: this.t, len }, d);
    this.fxl.push(f);
    this.fxSeen[id] = (this.fxSeen[id] || 0) + 1;
    return f;
  };
  // draws every live effect that has a painter for this layer. layers, back to front:
  // sky (behind the citadel) · between (behind the arches) · back (over the world) · mid (with the telegraphs) ·
  // behind (just behind the Tyrant) · body (replaces the Tyrant) · boss (on the Tyrant) · top (over the hazards) ·
  // front (over the hero) · post (screen-space, before the HUD)
  Fight.prototype.drawFx = function (ctx, layer, S) {
    let any = false;
    for (const f of this.fxl) {
      const fn = FX[f.id][layer];
      if (typeof fn !== 'function') continue; // (b45: never trip on a non-painter field)
      const el = this.t - f.t0;
      if (el < 0 || el > f.len) continue;
      if (fn.call(this, ctx, f, el, f.len === Infinity ? 0 : el / f.len, S) !== false) { this.fxDrawn[f.id] = 1; any = true; }
    }
    return any;
  };

  // the planning bot used by tests and the owner's autoplay: dodge on the last safe moment, grab safe orbs
  Fight.prototype.botShouldFlip = function () {
    const g = this.g, p = g.p;
    if (this.mode === 'clash') { const el = this.t - this.modeT0; return !this.clash.res && el >= (CLASH_WIN[0] + CLASH_WIN[1]) / 2 - 0.03; }
    if (this.mode === 'finale') return this.def.finaleBot ? this.def.finaleBot.call(this) : false;
    if (this.mode === 'fight' && this.def.botFlip) { const r = this.def.botFlip.call(this); if (r !== undefined) return r; }
    if (this.mode !== 'fight' || !p.grounded) return false;
    const HZN = 0.8;
    const stay = this.collideIn(false, HZN);
    if (stay === null) {
      const want = this.orbs.find((o) => !o.taken && o.side !== sideOf(p) && o.wx > p.x + 4 && o.wx < p.x + 90);
      return !!want && this.collideIn(true, HZN) === null;
    }
    const flip = this.collideIn(true, HZN);
    if (flip === null) {
      // a stylish bot (tests, the owner's autoplay) dodges at the last moment: a COUNTER, if waiting is still safe
      if (this.botLate && stay > 0.2) {
        const wait = stay - 0.17, q = FF.Phys.clone(p), dt = 1 / 60;
        for (let s = 0; s * dt < wait; s++) FF.Phys.step(q, dt, g.L, g.time + s * dt, false);
        if (this.collideIn(true, HZN, q, wait) === null) return false;
      }
      return true;
    }
    return stay < 0.1 && flip > stay;
  };

  // ================================================================ DRAWING (reads the fight, never writes it)
  const fmtTime = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + Math.floor((s * 10) % 10);
  FF.fmtBossTime = fmtTime;
  const TY = { armor: '#1c0c14', armorHi: '#3e1c2a', edge: '#6a2a3a', molten: '#ff5a1a', moltenHi: '#ffd27a', flesh: '#7a1424', fleshHi: '#c02a38', bone: '#e8dcc0', boneSh: '#9a8a70', eye: '#fff2a0', eyeF: '#ff9a1a', blade: '#c8c0b0', bladeHi: '#ffffff', bladeEdge: '#ff3a5a', spirit: 'rgba(255,40,70,0.55)', spiritHi: 'rgba(255,190,200,0.7)' };

  // a thick pixel limb from (x,y): segment by segment
  function seg(g, x, y, a, len, th, col, hi) {
    let ex = x, ey = y;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i <= len; i += (i + 2 > len && i < len ? len - i : 2)) { // build 38 perf: a stamp every 2 px (and one at the end)
      ex = x + ca * i; ey = y + sa * i;
      rect(g, ex - th / 2, ey - th / 2, th, th, col);
      if (hi) rect(g, ex - th / 2, ey - th / 2, th, 1, hi);
    }
    return [ex, ey];
  }
  // build 37 perf: the blade is painted once per size (the same pixel recipe at angle 0) and drawn rotated after that
  const CLEAVERS = {};
  function cleaver(g, x, y, a, s) {
    let c = CLEAVERS[s];
    if (!c) { c = CLEAVERS[s] = FF.makeCanvas(32, 17); paintCleaver(c.getContext('2d'), 2, 3, 0, s); }
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(a); g.drawImage(c, -2, -3); g.restore();
  }
  function paintCleaver(g, x, y, a, s) {
    // a huge butcher blade on a short haft: broad, notched, with a glowing red edge
    const ca = Math.cos(a), sa = Math.sin(a), na = a + Math.PI / 2, cn = Math.cos(na), sn = Math.sin(na);
    for (let i = 0; i < 6; i++) rect(g, x + ca * i - 1, y + sa * i - 1, 3, 3, '#2a1a10');
    for (let i = 6; i < 6 + 22 * s; i++) {
      for (let j = -2; j < 11 * s; j++) {
        const px = x + ca * i + cn * j, py = y + sa * i + sn * j;
        const notch = j > 9 * s && (i % 6) < 2;
        if (notch) continue;
        rect(g, px, py, 1.2, 1.2, j >= 10 * s - 1 ? TY.bladeEdge : j < 0 ? '#5a5048' : (i + j) % 7 === 0 ? TY.bladeHi : TY.blade);
      }
    }
  }
  // the Tyrant's face, drawn by hand (front view; rows 17+ are the jaw, which drops open)
  const HEAD = [
    '......kkkkkkkkkkkkkk......',
    '....kkhhhhhhhhhhhhhhkk....',
    '...khhaaaaaaaaaaaaaahhk...',
    '..khaaaaaaaaaaaaaaaaaahk..',
    '..kaaeaaaaaaaaaaaaaaeaak..',
    '.khaaaeeaaaaaaaaaaeeaaahk.',
    '.kaaaaaaeeaaaaaaeeaaaaaak.',
    'kkkkkkkkkkkaaaakkkkkkkkkkk',
    'khhhhhhhhhkkaakkhhhhhhhhhk',
    'kaokyyyyoakkaakkaoyyyyokak',
    'kaaookkooaakaakaaookkooaak',
    '.kaaaaaaaaakkkkaaaaaaaaak.',
    '.kaarraaaaaakkaaaaaarraak.',
    '.karrfraaaakmmkaaaarfrrak.',
    '..karraaaakmmmmkaaaarrak..',
    '..kaaaaaakkkkkkkkaaaaaak..',
    '..kbkbkbkbkbkbkbkbkbkbkk..',
    '..kbkbkbkbkbkbkbkbkbkbkk..',
    '...khhhhhhhhhhhhhhhhhk....',
    '....kaaaaaaaaaaaaaaak.....',
    '.....kkaaaaaaaaaaakk......',
    '.......kkkkkkkkkkk........'
  ];
  // build 37 perf: each jaw opening / phase / mouth colour is painted once, then blitted
  const HEADS = {};
  function drawHead(g, x, y, open, ph, mouth) {
    const key = open + '|' + ph + '|' + mouth;
    let c = HEADS[key];
    if (!c) { c = HEADS[key] = FF.makeCanvas(26, 30); paintHead(c.getContext('2d'), 0, 0, open, ph, mouth); }
    g.drawImage(c, Math.round(x), Math.round(y));
  }
  function paintHead(g, x, y, open, ph, mouth) {
    const pal = { k: '#0a0206', a: TY.armor, h: TY.armorHi, e: TY.edge, b: TY.bone, y: ph === 2 ? '#ffffff' : TY.eye, o: TY.eyeF, m: TY.molten, r: TY.flesh, f: TY.fleshHi };
    HEAD.forEach((row, j) => {
      const dy = j >= 17 ? open : 0;
      for (let i = 0; i < row.length; i++) { const c = row[i]; if (c !== '.') rect(g, x + i, y + j + dy, 1, 1, pal[c]); }
    });
    if (open > 0) rect(g, x + 3, y + 17, 19, open, mouth);
  }

  // the Tyrant: drawn into its own buffer each frame (cx,cy = body centre in the buffer)
  Fight.prototype.drawTyrant = function (g, rt, opts) {
    if (this.def && this.def.drawBoss) return this.def.drawBoss.call(this, g, rt, opts);
    const BXc = 84, BYc = 78, ph = this.phase, t = rt, A = this.anim, ft = this.t;
    const breath = Math.sin(t * 2.4) * 1.5;
    const k = (a, b) => FF.clamp((ft - a) / Math.max(0.001, b - a), 0, 1);
    const wind = A.kind !== 'idle' && A.kind !== 'roar' && A.kind !== 'dying' ? k(A.t0, A.tl) : 0;
    const swing = A.hits.some((h) => ft >= h && ft < h + 0.12);
    const roar = A.kind === 'roar' || this.mode === 'trans';
    const grow = ph === 2 ? 4 : ph === 1 ? 2 : 0;
    const cx = BXc, cy = BYc + breath;
    // ---- aura
    if (ph >= 1 || roar) {
      const n = ph === 2 ? 26 : 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, rr = 46 + grow * 3 + Math.sin(t * 6 + i * 1.7) * 5;
        const x = cx + Math.cos(a) * rr * 0.9, y = cy - 6 + Math.sin(a) * rr;
        const fh = 6 + (Math.sin(t * 11 + i * 2.3) * 0.5 + 0.5) * (ph === 2 ? 14 : 8);
        rect(g, x - 2, y - fh, 4, fh, ph === 2 ? 'rgba(20,0,0,0.65)' : 'rgba(255,40,70,0.35)');
        rect(g, x - 1, y - fh + 1, 2, fh - 2, ph === 2 ? 'rgba(255,90,0,0.7)' : 'rgba(255,120,140,0.45)');
      }
    }
    // ---- a tattered royal mantle of smoke and cinders, down to the floor (build 38 perf: 63 frames per phase, at 10 fps,
    // painted once each and stamped at the breath's offset)
    const MAN = this._man || (this._man = {}), mk = ph + ':' + (Math.floor(t * 10) % 63);
    if (!MAN[mk]) {
      const mc = MAN[mk] = FF.makeCanvas(170, 170), mg = mc.getContext('2d'), mt = (Math.floor(t * 10) % 63) / 10;
      for (let x = -34; x <= 32; x += 2) {
        const tat = Math.abs(Math.sin(x * 0.37 + 1.3)) * 10 + Math.sin(mt * 5 + x * 0.3) * 2.5;
        const len = 24 + (34 - Math.abs(x + 1)) * 0.55 + tat;
        const fold = ((x + 34) % 10) < 2;
        rect(mg, BXc + x, BYc + 12, 2, len, fold ? '#2c1020' : x < 0 ? '#14060e' : '#1a0812');
        rect(mg, BXc + x, BYc + 12 + len - 3, 2, 3, ph === 2 ? '#a03a00' : '#5a0a18');
        if ((x + Math.floor(mt * 9)) % 10 === 0) rect(mg, BXc + x, BYc + 10 + len, 1, 2, ph === 2 ? TY.moltenHi : '#ff5a3a');
      }
    }
    g.drawImage(MAN[mk], 0, Math.round(breath));
    // ---- spectral extra arms (phase 2+): flame arms from the back, growing in
    if (this.armsK > 0) {
      const ak = this.armsK, sw = Math.sin(t * 3) * 0.2;
      for (const s of [-1, 1]) {
        const ox = cx + 10, oy = cy - 18;
        const e = seg(g, ox, oy, -Math.PI / 2 - 0.6 * s + sw + (wind && s < 0 ? -0.5 * wind : 0), 26 * ak, 6, TY.spirit, TY.spiritHi);
        const e2 = seg(g, e[0], e[1], Math.PI + 0.4 * s - sw, 20 * ak, 5, TY.spirit, TY.spiritHi);
        for (let c = 0; c < 3; c++) rect(g, e2[0] - 4 - c, e2[1] - 3 + c * 3, 4, 2, 'rgba(255,220,220,0.8)');
      }
    }
    // ---- back (lower) arms: fists that slam the ground for the pillars
    const slam = A.kind === 'pillar' || A.kind === 'shard' ? (swing ? 1 : wind > 0 && wind < 1 ? -wind : 0) : 0;
    for (const s of [0, 1]) {
      const sx = cx - 8 + s * 22, sy = cy + 2;
      const a1 = slam > 0 ? 1.9 : slam < 0 ? -2.2 + s * 0.3 : 2.2 + s * 0.4 + Math.sin(t * 2 + s) * 0.1;
      const e = seg(g, sx, sy, a1, 16, 7, TY.flesh, TY.fleshHi);
      const e2 = seg(g, e[0], e[1], slam > 0 ? 1.6 : slam < 0 ? -1.4 : 2.6, 14, 6, TY.armor, TY.edge);
      rect(g, e2[0] - 5, e2[1] - 4, 10, 9, TY.armor); rect(g, e2[0] - 5, e2[1] - 4, 10, 2, TY.edge);
      for (let c = 0; c < 3; c++) rect(g, e2[0] - 6, e2[1] - 3 + c * 3, 2, 2, TY.bone);
      if (ph === 2) rect(g, e2[0] - 2, e2[1], 3, 2, TY.molten);
    }
    // ---- torso: obsidian plate armor over crimson flesh, molten cracks (build 38 perf: the plates and the pauldrons are
    // painted once per phase and stamped at the breath's offset)
    const TOR = this._tor || (this._tor = {}), by = Math.round(breath);
    if (!TOR[ph]) {
      TOR[ph] = [FF.makeCanvas(170, 170), FF.makeCanvas(170, 170)];
      const tg = TOR[ph][0].getContext('2d'), pg = TOR[ph][1].getContext('2d');
      for (let y = -26; y <= 16; y++) {
        const half = 30 + grow - Math.max(0, y + 2) * 0.55 - (y < -18 ? (-18 - y) * 1.6 : 0);
        rect(tg, BXc - half, BYc + y, half * 2, 1, y % 7 === 0 ? TY.armorHi : TY.armor);
        rect(tg, BXc - half, BYc + y, 2, 1, TY.edge);
      }
      rect(tg, BXc - 22, BYc - 6, 44, 2, TY.flesh); rect(tg, BXc - 16, BYc + 6, 32, 2, TY.flesh); // muscle gaps between plates
      for (const s of [-1, 1]) { // pauldrons with spikes
        const px = BXc + s * 24, py = BYc - 22;
        rect(pg, px - 10, py - 4, 20, 10, TY.armorHi); rect(pg, px - 10, py - 4, 20, 2, TY.edge);
        for (let k2 = 0; k2 < 3; k2++) for (let j = 0; j < 7; j++) rect(pg, px - 7 + k2 * 6 + (j * 0.15) * s, py - 5 - j, Math.max(1, 3 - j * 0.4), 1, j > 4 ? TY.bone : TY.boneSh);
      }
    }
    g.drawImage(TOR[ph][0], 0, by);
    const core = ph === 2 ? 0.6 + 0.4 * Math.sin(t * 9) : ph === 1 ? 0.4 : 0.15;
    const crk = this._crk || (this._crk = {}); // the molten cracks: one fixed pattern per phase, pulsing by alpha
    if (!crk[ph]) {
      crk[ph] = FF.makeCanvas(170, 170);
      const cg = crk[ph].getContext('2d'), cr = FF.mulberry32(77);
      for (let i = 0; i < 5 + ph * 4; i++) BW.crack(cg, 84 - 6 + cr() * 12, 78 - 6 + cr() * 8, cr() * Math.PI * 2, 8 + ph * 7, TY.molten, cr, ph === 2);
    }
    g.globalAlpha = 0.5 + core * 0.5; g.drawImage(crk[ph], 0, Math.round(cy - 78)); g.globalAlpha = 1;
    if (ph === 2) { rect(g, cx - 5, cy - 8, 10, 10, TY.molten); rect(g, cx - 3, cy - 6, 6, 6, TY.moltenHi); rect(g, cx - 1, cy - 4, 2, 2, '#ffffff'); } // the burning heart
    g.drawImage(TOR[ph][1], 0, by); // pauldrons
    // ---- head: the hand-drawn face, horns curving up from the temples, a crown of spikes, burning eyes
    const tilt = A.kind === 'beam' ? -3 * wind : roar ? -3 : 0;
    const hx = cx - 16, hy = cy - 50 + tilt;
    // the two great horns and the crown of spikes (build 38 perf: painted once per phase and flicker frame, then stamped)
    const HRN = this._hrn || (this._hrn = {}), hk = ph + ':' + (ph === 2 ? Math.floor(t * 12) % 2 : 0), hx0 = BXc - 16, hy0 = BYc - 50;
    if (!HRN[hk]) {
      const hc = HRN[hk] = FF.makeCanvas(170, 170), hg = hc.getContext('2d'), par = ph === 2 ? Math.floor(t * 12) % 2 : 0;
      for (const s of [-1, 1]) { // out from the temples, then up and inward like a crescent
        const ox = s < 0 ? hx0 + 2 : hx0 + 23, oy = hy0 + 5;
        for (let i = 0; i < 26 + grow * 2; i++) {
          const u = i / 26, w = Math.max(1, 5 - i * 0.17);
          const x = ox + s * (Math.sin(u * 1.7) * 13), y = oy - u * 22 - Math.sin(u * 3.1) * 3;
          rect(hg, x - w / 2 - 0.5, y - 0.5, w + 1, 2.2, '#0a0206');
          rect(hg, x - w / 2, y, w, 1.5, i < 8 ? TY.boneSh : (i % 5 === 0 ? '#fff6e0' : TY.bone));
          if (ph === 2 && i > 20) rect(hg, x - 1, y - 1, 2, 2, (par + i) % 2 ? TY.molten : TY.moltenHi);
        }
      }
      for (let i = 0; i < 5; i++) { const sh = [4, 6, 8, 6, 4][i]; for (let j = 0; j < sh; j++) rect(hg, hx0 + 6 + i * 3 + (j > sh - 3 ? 0.5 : 0), hy0 - j, j > sh - 3 ? 1 : 2, 1, ph === 2 ? (j > sh - 3 ? TY.moltenHi : TY.molten) : j > sh - 3 ? TY.bone : TY.boneSh); }
    }
    g.drawImage(HRN[hk], Math.round(hx - hx0), Math.round(hy - hy0));
    const open = A.kind === 'beam' ? Math.round(Math.min(6, 2 + wind * 5)) : roar ? 6 : ft - this.hitT < 0.2 ? 3 : 0;
    drawHead(g, hx, hy, open, ph, A.kind === 'beam' ? TY.moltenHi : '#3a0006');
    const blink = this.mode === 'intro' && this.t - this.modeT0 < 0.5 ? 0 : 1;
    if (blink) for (const ex of [hx + 3, hx + 17]) for (let f = 0; f < 4; f++) { const fh = 2 + ((Math.floor(t * 14) + f + ex) % 4) + ph; rect(g, ex + f, hy + 9 - fh, 1, fh, f % 2 ? TY.eyeF : TY.moltenHi); }
    // ---- front (upper) arms holding the cleavers
    const slash = A.kind === 'slash' || A.kind === 'mirror', throwing = A.kind === 'cleave' || A.kind === 'comet';
    for (const s of [0, 1]) {
      const sx = cx - 22 + s * 40, sy = cy - 20;
      let a1, a2;
      if (slash) { const up = swing ? 0 : wind; a1 = swing ? 2.5 : -2.3 * up + (1 - up) * 2.6; a2 = swing ? 2.9 : -2.9 * up + (1 - up) * -2.8; }
      else if (throwing) { const ph2 = Math.sin(ft * 10 + s * 2); a1 = -2.4 + ph2 * 0.6; a2 = -2.6 + ph2 * 0.8; }
      else if (roar) { a1 = -2.6 - s * 0.4; a2 = -2.2 - s * 0.5; }
      else { a1 = 2.3 + s * 0.2 + Math.sin(t * 2.4 + s) * 0.08; a2 = -2.75 + Math.sin(t * 2 + s) * 0.08; }
      const e = seg(g, sx, sy, a1, 17, 8, TY.flesh, TY.fleshHi);
      rect(g, e[0] - 5, e[1] - 5, 10, 10, TY.armorHi); // elbow guard
      const e2 = seg(g, e[0], e[1], a2, 15, 7, TY.armor, TY.edge);
      rect(g, e2[0] - 4, e2[1] - 4, 8, 8, TY.flesh);
      cleaver(g, e2[0], e2[1], a2 - 0.25, s ? 0.8 : 1);
    }
    // charge glow while winding up
    if (wind > 0 && wind < 1) {
      const gx = A.kind === 'beam' ? hx + 6 : cx - 30, gy = A.kind === 'beam' ? hy + 20 : cy - 30;
      const rr = 2 + wind * 6;
      g.fillStyle = A.kind === 'beam' ? 'rgba(255,220,120,0.8)' : 'rgba(255,60,90,0.6)';
      g.fillRect(Math.round(gx - rr), Math.round(gy - rr), Math.round(rr * 2), Math.round(rr * 2));
    }
  };

  Fight.prototype.bossScreen = function () {
    const t = this.t, A = this.anim;
    let x = 262, y = MID - 6;
    x += Math.sin(t * 0.9) * 4; y += Math.sin(t * 1.7) * 3;
    if (this.phase === 2) { x += Math.sin(t * 2.6) * 6; y += Math.sin(t * 3.3) * 4; } // phase 3: it prowls
    if ((A.kind === 'slash' || A.kind === 'mirror') && A.hits.some((h) => t >= h - 0.08 && t < h + 0.25)) x -= 14; // lunges into the slash
    if (A.kind === 'pillar' && A.hits.some((h) => t >= h && t < h + 0.15)) y += 4;
    const rec = t - this.recoilT;
    if (rec < 0.25) x += (1 - rec / 0.25) * 8;
    if (this.mode === 'dying') { const el = t - this.modeT0; x += Math.sin(t * 60) * 3 * Math.min(1, el); y += el * el * 10; }
    if (this.mode === 'trans' && t - this.modeT0 < 1) x += Math.sin(t * 70) * 3;
    const o = this._bsv || (this._bsv = [0, 0]);
    if (this.tunnelOn()) { // in the tunnel the Tyrant looms at the far end, rolling with the camera
      const V = this.tunView(), ox = (x - 262) * 0.7, oy = (y - MID + 6) * 0.7 + 8;
      o[0] = TUN.cx + ox * V.cr - oy * V.sr; o[1] = TUN.cy + ox * V.sr + oy * V.cr;
    } else { o[0] = x; o[1] = y; }
    return o;
  };

  // 🎬 build 47: the Tyrant's fight is painted in HD (js/hdboss.js) on layers around this canvas, which then only clears
  Fight.prototype.hdOn = function () { return !!FF.HDBoss && FF.HDBoss.on(this); };
  Fight.prototype.renderBack = function (ctx, cam, rt) {
    if (this.hdOn()) { FF.HDBoss.frame(this, ctx.getTransform(), rt); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.restore(); return; }
    const wk = this.worldK0 > -9 ? FF.clamp((this.t - this.worldK0) / 1.0, 0, 1) : 1;
    const S = this.frameS(cam, rt);
    // build 38: the STARFALL COSMOS is a pseudo-3D tunnel; leaving it, the tunnel is what tears away
    const tun = (c) => this.renderTunnelBack(c, S, rt);
    if (S.tun) {
      tun(ctx);
      if (this.worldFrom >= 0 && this.worldFrom !== this.worldV && wk < 1) {
        const buf = BW._buf || (BW._buf = FF.makeCanvas(W, H)), key = this.worldFrom + '>' + this.worldV + '@' + this.worldK0;
        if (BW._bufKey !== key) { // (painted once when the tear starts, like every rip)
          BW._bufKey = key;
          const bg = buf.getContext('2d'); bg.clearRect(0, 0, W, H);
          BW.defs[this.def.world].drawVariant(bg, this.worldFrom, cam, rt, { v: this.worldFrom, from: -1, k: 1, quake: 0 });
        }
        BW.rip(ctx, buf, wk, '#e8d8ff');
      }
    } else {
      BW.draw(ctx, this.def.world, cam, rt, { v: this.worldV, from: this.worldFrom, k: wk, style: this.worldStyle, quake: this.phase === 2 ? 1.2 : 0, tunnel: tun, ripKey: this.worldK0,
        sky: (c, v) => { S.v = v; this.drawFx(c, 'sky', S); }, between: (c, v) => { S.v = v; this.drawFx(c, 'between', S); } });
    }
    S.v = this.worldV;
    if (!S.tun) this.drawFx(ctx, 'back', S);
  };
  // build 38 perf: one reusable per-frame context for every painter (no object per layer per frame)
  Fight.prototype.frameS = function (cam, rt) {
    const S = this._S || (this._S = {});
    const p = this.g.p;
    S.cam = cam; S.rt = rt; S.v = this.worldV; S.tun = this.tunnelOn();
    if (S.tun) { const V = this.tunView(); S.V = V; S.hx = V.hsx; S.hy = V.hsy; S.hs = V.hs; S.vx = TUN.cx; S.vy = TUN.cy; }
    else { S.V = null; S.hx = PX + PW / 2; S.hy = p.y + PH / 2; S.hs = 1; S.vx = W * 0.62; S.vy = MID; }
    S.bs = this.bossScreen();
    S.bx = Math.round(S.bs[0] - 84); S.by = Math.round(S.bs[1] - 78);
    return S;
  };
  // the Tyrant and the layers that ride on it. build 38 perf: one baked, rim-lit stamp (see tyrantBufs)
  Fight.prototype.drawTyrantLayer = function (ctx, S, rt) {
    if (this.hdOn()) { S.buf = null; S.rim = null; this.drawFx(ctx, 'behind', S); this.drawFx(ctx, 'boss', S); return; } // 🎬 painted in HD behind this canvas: only the effects ON him stay here
    if (this.mode === 'intro' && this.t - this.modeT0 < (this.introLen === INTRO_FULL ? 0.9 : 0.3)) return; // hidden in the dark: only the eyes (overlay)
    const B = this.tyrantBufs(rt);
    S.buf = B.buf; S.rim = B.rim;
    const flash = this.t - this.hitT < 0.08 || (this.mode === 'dying' && Math.floor(rt * 20) % 3 === 0);
    this.drawFx(ctx, 'behind', S);
    if (!this.drawFx(ctx, 'body', S)) ctx.drawImage(flash ? this.tyrantFlash() : B.out, 0, 0, TBW + 2, TBH + 2, S.bx - 1, S.by - 1, TBW + 2, TBH + 2);
    this.drawFx(ctx, 'boss', S);
  };
  const TBW = 146, TBH = 150, SCW = 110, SCH = 113, RIM4 = [[0, 1], [2, 1], [1, 0], [1, 2]]; // build 38 perf: the Tyrant never leaves this corner of its 170² buffer (measured over whole fights)
  // build 38 perf: the Tyrant is repainted at 20 Hz into a BACK buffer, and its rim-lit outline is baked on the NEXT frame
  // before the two swap: a repaint's cost is split over two frames (no spike), and a frame stamps one image.
  Fight.prototype.tyrantBufs = function (rt) {
    const key = Math.floor(rt * 20), alive = this.mode !== 'reward' && this.mode !== 'won'; // animated on threes (20 Hz)
    if (!this._tb) { const mk = () => ({ buf: FF.makeCanvas(170, 170), rim: FF.makeCanvas(170, 170), out: FF.makeCanvas(172, 172) }); this._tb = [mk(), mk()]; this._tf = 0; this._tPend = false; this._bbK = -1; }
    const changed = this._tqK !== key || this._tqA !== alive || this._tqP !== this.phase || this._tqM !== this.anim;
    if (!this._tPend && changed) { // first half: paint the body into the back buffer
      this._tqK = key; this._tqA = alive; this._tqP = this.phase; this._tqM = this.anim;
      this.paints = (this.paints || 0) + 1;
      const B = this._tb[1 - this._tf], g = B.buf.getContext('2d');
      g.clearRect(0, 0, 170, 170);
      if (alive) this.drawTyrant(g, rt); // dying: deathThroes breaks it apart
      this._tPend = true;
      if (this._bbK < 0) this.tyrantRim(); // the very first frame shows it at once
    } else if (this._tPend) this.tyrantRim();
    const F0 = this._tb[this._tf];
    this._bb = F0.buf; this._rim = F0.rim; this._bo = F0.out;
    return F0;
  };
  Fight.prototype.tyrantRim = function () { // second half: a hot rim light around the whole silhouette, then show it
    const B = this._tb[1 - this._tf], rg = B.rim.getContext('2d'), og = B.out.getContext('2d');
    rg.clearRect(0, 0, TBW, TBH); rg.drawImage(B.buf, 0, 0, TBW, TBH, 0, 0, TBW, TBH);
    rg.globalCompositeOperation = 'source-in'; rg.fillStyle = this.def.rim ? this.def.rim[this._tqP] : this._tqP === 2 ? '#ffb14a' : this._tqP === 1 ? '#ff3a8a' : '#ff3a5a'; rg.fillRect(0, 0, TBW, TBH); rg.globalCompositeOperation = 'source-over';
    og.clearRect(0, 0, TBW + 2, TBH + 2);
    for (const [dx, dy] of RIM4) og.drawImage(B.rim, 0, 0, TBW, TBH, dx, dy, TBW, TBH);
    og.drawImage(B.buf, 0, 0, TBW, TBH, 1, 1, TBW, TBH);
    this._tf = 1 - this._tf; this._tPend = false; this._bbK = this._tqK; this._bw = null;
  };

  Fight.prototype.tyrantFlash = function () { // the white-hot hit flash, made once per repaint
    if (!this._bw) {
      const c = this._bwc || (this._bwc = FF.makeCanvas(172, 172)), g = c.getContext('2d');
      g.clearRect(0, 0, 172, 172); g.drawImage(this._bo, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, 172, 172); g.globalCompositeOperation = 'source-over';
      this._bw = c;
    }
    return this._bw;
  };

  Fight.prototype.renderMid = function (ctx, cam, rt) {
    const t = this.t, S = this.frameS(cam, rt);
    if (S.tun) return this.renderTunnelMid(ctx, S, rt);
    if (this.def.renderMid) this.def.renderMid.call(this, ctx, S);
    this.drawFx(ctx, 'mid', S); // fissures and chains sit under the telegraphs, so a warning is never covered
    // telegraphs (behind everything that can hurt)
    for (const h of this.hz) {
      if (t < h.t0 || t >= h.tl) continue;
      const k = (t - h.t0) / (h.tl - h.t0), on = k > 0.75 || Math.floor(rt * 16) % 2 === 0;
      const a = (0.35 + 0.65 * k).toFixed(2);
      if (h.k === 'wave') {
        const y = h.side === 'f' ? F - 2 : C + 1;
        if (on) { ctx.fillStyle = 'rgba(255,50,80,' + a + ')'; ctx.fillRect(0, y, SX_BLADE, 2); }
        for (let i = 0; i < 5; i++) font.draw(ctx, '<', ((SX_BLADE - 10 - ((rt * 140 + i * 40) % 200)) | 0), h.side === 'f' ? F - 12 : C + 4, { color: 'rgba(255,90,110,' + a + ')' });
        ctx.fillStyle = 'rgba(255,50,80,' + (0.12 * k).toFixed(2) + ')';
        ctx.fillRect(0, h.side === 'f' ? F - 22 : C, SX_BLADE, 22);
      } else if (h.k === 'shard') { // a frozen ghost of the crystal, ticking as it thaws
        const x = Math.round(h.wx - cam), y0 = h.side === 'f' ? F - 40 : C;
        ctx.fillStyle = 'rgba(255,50,80,' + (0.14 * k + 0.08).toFixed(2) + ')'; ctx.fillRect(x, y0, 10, 40);
        ctx.strokeStyle = 'rgba(191,246,255,' + (0.3 + 0.5 * k).toFixed(2) + ')'; ctx.strokeRect(x + 0.5, y0 + 0.5, 9, 39);
        if (on) { ctx.fillStyle = '#ff3a5a'; ctx.fillRect(x - 2, h.side === 'f' ? F - 1 : C, 14, 2); }
        const an = Math.floor(k * 12) / 12 * Math.PI * 2, cy = y0 + 20;
        for (let r = 0; r < 4; r++) rect(ctx, x + 5 + Math.sin(an) * r, cy - Math.cos(an) * r, 1, 1, '#ffd27a');
      } else if (h.k === 'cleave' || h.k === 'pillar') {
        const x = Math.round(h.wx - cam), w = h.k === 'cleave' ? 8 : 14, hh = h.k === 'cleave' ? 30 : 54;
        ctx.fillStyle = 'rgba(255,50,80,' + (0.18 * k + 0.08).toFixed(2) + ')';
        ctx.fillRect(x, h.side === 'f' ? F - hh : C, w, hh);
        if (on) { ctx.fillStyle = h.k === 'cleave' ? '#ff3a5a' : '#ff8a00'; ctx.fillRect(x - 2, h.side === 'f' ? F - 1 : C, w + 4, 2); }
        if (h.k === 'cleave') for (let y = C; y < F; y += 6) { ctx.fillStyle = 'rgba(255,60,90,' + (0.2 + 0.4 * k).toFixed(2) + ')'; ctx.fillRect(x + 3, y, 2, 3); }
        else for (let i = 0; i < 4; i++) { const dy = ((rt * 50 + i * 7) % 14); ctx.fillStyle = '#ffb14a'; ctx.fillRect(x + 2 + i * 3, h.side === 'f' ? F - 2 - dy : C + 1 + dy, 1, 1); }
      } else if (h.k === 'beam') {
        const y0 = h.side === 'c' ? C : MID + 3, hh = h.side === 'c' ? MID - 3 - C : F - MID - 3;
        ctx.fillStyle = 'rgba(255,170,60,' + (0.1 + 0.16 * k).toFixed(2) + ')';
        ctx.fillRect(0, y0, MOUTH[0], hh);
        if (on) { ctx.fillStyle = '#ffd27a'; ctx.fillRect(0, y0 + (h.side === 'c' ? hh - 1 : 0), MOUTH[0], 1); ctx.fillRect(0, y0 + hh / 2, MOUTH[0], 1); }
      }
    }
    // the Tyrant
    const bs = S.bs;
    this.drawTyrantLayer(ctx, S, rt);
    for (const d of this.dmgPops || []) { const k = (t - d.t) / 0.8; if (k < 1) font.draw(ctx, '-' + d.dmg + '%', bs[0] - 30, d.y - k * 14, { color: k < 0.15 ? '#ffffff' : '#ff9ab0', align: 'center', outline: '#05060d', scale: k < 0.1 ? 2 : 1 }); }
    // hazards
    for (const h of this.hz) {
      if (t < h.t0) continue;
      if (h.k === 'wave' && t >= h.tl) {
        const sx = h.sx0 - h.v * (t - h.tl), y = h.side === 'f' ? F - 22 : C;
        for (let tr = 3; tr >= 0; tr--) { // a crescent slash with afterimages
          const ax = sx + tr * 10, al = tr ? 0.18 * (4 - tr) : 1;
          ctx.globalAlpha = al;
          for (let j = 0; j < 22; j++) {
            const u = j / 21, bend = Math.sin(u * Math.PI) * 9, yy = h.side === 'f' ? y + j : y + j;
            rect(ctx, ax + 9 - bend, yy, 3, 1, tr ? (h.mir ? '#7fe8ff' : '#ff3a5a') : j % 5 ? (h.mir ? '#e8fbff' : '#ffd0d8') : '#ffffff');
            rect(ctx, ax + 12 - bend, yy, 2, 1, '#ff3a5a');
            if (h.mir && !tr && j % 4 === 0) rect(ctx, ax + 6 - bend, yy, 1, 1, '#b8a6ff');
          }
        }
        ctx.globalAlpha = 1;
      } else if (h.k === 'cleave' && t >= h.tl - 0.1) {
        const x = Math.round(h.wx - cam), drop = FF.clamp((t - (h.tl - 0.1)) / 0.1, 0, 1);
        const surf = h.side === 'f' ? F : C, len = 30;
        const yTip = h.side === 'f' ? C + (surf - C) * drop : F - (F - surf) * drop;
        const y0 = h.side === 'f' ? yTip - len : yTip;
        if (h.comet) { // a comet: a white-hot head at the surface end and a star-blue tail
          const head = h.side === 'f' ? y0 + len - 8 : y0;
          for (let i = 0; i < len; i += 2) rect(ctx, x + 1 + Math.sin(i + rt * 30), y0 + i, 6, 2, (h.side === 'f' ? i : len - i) > 18 ? '#ffffff' : (i >> 1) % 2 ? '#7fe8ff' : '#b8a6ff');
          rect(ctx, x - 1, head, 10, 8, '#e8fbff'); rect(ctx, x + 1, head + 2, 6, 4, '#ffffff'); rect(ctx, x + 7, y0, 1, len, '#ff3a5a');
        } else {
          rect(ctx, x, y0, 8, len, '#c8c0b0'); rect(ctx, x, y0, 2, len, '#ffffff'); rect(ctx, x + 7, y0, 1, len, '#ff3a5a');
          rect(ctx, x - 2, h.side === 'f' ? y0 - 6 : y0 + len, 12, 6, '#2a1a10'); // haft guard
        }
        if (drop >= 1 && t - h.tl < 0.15) { rect(ctx, x - 8, h.side === 'f' ? F - 2 : C, 24, 2, '#ffd27a'); }
      } else if (h.k === 'pillar' && t >= h.tl) {
        const x = Math.round(h.wx - cam), q = t > h.te ? 1 - (t - h.te) / 0.3 : Math.min(1, (t - h.tl) / 0.06), hh = Math.max(0, 54 * q);
        const y0 = h.side === 'f' ? F - hh : C;
        rect(ctx, x, y0, 14, hh, '#1c0c14');
        rect(ctx, x + 4, y0, 6, hh, h.k && this.phase === 2 ? '#ff8a00' : '#ff5a1a');
        rect(ctx, x + 6, y0, 2, hh, '#ffd27a');
        rect(ctx, x, y0, 1, hh, '#6a2a3a');
        const tip = h.side === 'f' ? y0 : y0 + hh - 4;
        rect(ctx, x + 2, tip, 10, 4, '#ffd27a');
        if (t - h.tl < 0.2) { const r = (t - h.tl) * 260; ctx.fillStyle = 'rgba(255,200,120,' + (1 - (t - h.tl) * 5).toFixed(2) + ')'; ctx.fillRect(Math.round(x + 7 - r), h.side === 'f' ? F - 2 : C, Math.round(r * 2), 2); }
      } else if (h.k === 'shard' && t >= h.tl) { // the thawed time-crystal: pale glass with a frozen clock inside
        const x = Math.round(h.wx - cam), y0 = h.side === 'f' ? F - 40 : C, q = t > h.te ? Math.max(0, 1 - (t - h.te) / 0.3) : 1;
        if (q > 0) {
          ctx.globalAlpha = q;
          for (let j = 0; j < 40; j++) { const u = h.side === 'f' ? j / 40 : 1 - j / 40, w = Math.max(2, Math.round(10 * (0.35 + 0.65 * u))); rect(ctx, x + 5 - w / 2, y0 + j, w, 1, j % 9 === 0 ? '#ffffff' : '#bff6ff'); }
          rect(ctx, x + 1, y0, 1, 40, '#ffffff'); rect(ctx, x + 8, y0, 1, 40, '#ff3a5a');
          const cy = y0 + (h.side === 'f' ? 26 : 14);
          for (let a = 0; a < 8; a++) rect(ctx, x + 5 + Math.cos(a * 0.785) * 3, cy + Math.sin(a * 0.785) * 3, 1, 1, '#3a5a5a');
          rect(ctx, x + 5, cy - 2, 1, 3, '#ffd27a'); rect(ctx, x + 5, cy, 2, 1, '#ffd27a');
          if (t - h.tl < 0.15) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - (t - h.tl) / 0.15).toFixed(2) + ')'; ctx.fillRect(x - 3, y0, 16, 40); }
          ctx.globalAlpha = 1;
        }
      } else if (h.k === 'beam' && t >= h.tl && t <= h.te + 0.1) {
        const y0 = h.side === 'c' ? C : MID + 3, hh = h.side === 'c' ? MID - 3 - C : F - MID - 3;
        const q = t > h.te ? 1 - (t - h.te) / 0.1 : Math.min(1, (t - h.tl) / 0.05);
        const mx = bs[0] - 84 + 72, my = bs[1] - 78 + 50;
        // sweep in from the jaw to the band, then a full-width river of fire
        ctx.fillStyle = 'rgba(255,90,20,' + (0.8 * q).toFixed(2) + ')';
        ctx.fillRect(0, y0, Math.round(mx), hh);
        const c1 = 'rgba(255,220,120,' + (0.9 * q).toFixed(2) + ')', c2 = 'rgba(255,255,255,' + q.toFixed(2) + ')'; // (b37 perf: one style per pass)
        ctx.fillStyle = c1;
        for (let x = 0; x < mx; x += 3) ctx.fillRect(x, Math.round(y0 + hh * 0.25 + Math.sin(x * 0.2 + rt * 30) * 4), 3, Math.round(hh * 0.5));
        ctx.fillStyle = c2;
        for (let x = 0; x < mx; x += 3) ctx.fillRect(x, Math.round(y0 + hh * 0.42 + Math.sin(x * 0.2 + rt * 30) * 2), 3, Math.round(hh * 0.16));
        ctx.fillStyle = '#ffffff';
        for (let x = 0; x < mx; x += 3) if (((x + Math.floor(rt * 40)) % 17) === 0) ctx.fillRect(x, Math.round(y0 + hash(x + Math.floor(rt * 10)) * hh), 2, 2);
        ctx.fillStyle = 'rgba(255,200,90,' + (0.6 * q).toFixed(2) + ')';
        const yy = y0 + hh / 2;
        for (let i = 0; i < 6; i++) { const u = i / 6; ctx.fillRect(Math.round(mx - 10 + u * 6), Math.round(my + (yy - my) * u - 3), 8, 6); }
      }
    }
    // seal orbs: a turning ring of light with four motes
    for (const o of this.orbs) {
      const x = o.wx - cam, y = o.y, big = o.side === 'm', a = rt * 4;
      const R = big ? 6 : 5, pul = 0.5 + 0.5 * Math.sin(rt * 8 + o.wx);
      ctx.fillStyle = big ? 'rgba(255,233,160,' + (0.2 + 0.2 * pul).toFixed(2) + ')' : 'rgba(127,232,255,' + (0.18 + 0.2 * pul).toFixed(2) + ')';
      ctx.fillRect(Math.round(x - R - 2), Math.round(y - R - 2), R * 2 + 4, R * 2 + 4);
      for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; rect(ctx, x + Math.cos(an) * R, y + Math.sin(an) * R, 1, 1, big ? '#ffe9a0' : '#7fe8ff'); }
      for (let i = 0; i < 4; i++) { const an = a + i * Math.PI / 2; rect(ctx, x + Math.cos(an) * (R - 2) - 0.5, y + Math.sin(an) * (R - 2) - 0.5, 2, 2, '#ffffff'); }
      rect(ctx, x - 1, y - 1, 2, 2, '#ffffff');
      if (big) font.draw(ctx, 'FLIP', x, y + (y > MID ? 8 : -14), { color: '#ffe9a0', align: 'center', outline: '#05060d' });
    }
    // seal bolts: star-blue comets from the hero to the Tyrant
    for (const b of this.bolts) {
      const k = FF.clamp((t - b.t0) / 0.3, 0, 1);
      if (b.done) { const q = (t - b.t0 - 0.3) / 0.3; ctx.fillStyle = 'rgba(200,240,255,' + (1 - q).toFixed(2) + ')'; const r = 6 + q * 20; ctx.fillRect(Math.round(bs[0] - 30 - r), Math.round(bs[1] - 10 - r), Math.round(r * 2), Math.round(r * 2)); continue; }
      const ex = bs[0] - 30, ey = bs[1] - 10, x = b.sx + (ex - b.sx) * k, y = b.sy + (ey - b.sy) * k - Math.sin(k * Math.PI) * 24;
      for (let i = 0; i < 8; i++) { const kk = Math.max(0, k - i * 0.03), tx = b.sx + (ex - b.sx) * kk, ty = b.sy + (ey - b.sy) * kk - Math.sin(kk * Math.PI) * 24; rect(ctx, tx - 1, ty - 1, 3 - (i > 4 ? 1 : 0), 3 - (i > 4 ? 1 : 0), i ? (i % 2 ? '#7fe8ff' : '#b8a6ff') : '#ffffff'); }
      rect(ctx, x - 2, y - 2, b.big ? 6 : 5, b.big ? 6 : 5, '#ffffff');
    }
    this.drawFx(ctx, 'top', S);
  };

  // the hero's time-shield + front layer
  Fight.prototype.renderFront = function (ctx, cam, rt) {
    const t = this.t, S = this.frameS(cam, rt), sc = S.hs, cx = S.hx, cy = S.hy;
    if (S.tun) this.renderTunnelNear(ctx, S, rt); // whatever is passing the camera (behind the hero's back)
    if (t < this.shieldT) {
      const k = 1 - (this.shieldT - t) / 0.55, r = (14 + k * 4) * sc;
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2 + rt * 3; rect(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, sc, sc, i % 3 ? '#7fe8ff' : '#ffffff'); }
      ctx.fillStyle = 'rgba(127,232,255,' + (0.18 * (1 - k)).toFixed(2) + ')';
      ctx.fillRect(Math.round(cx - r), Math.round(cy - r), Math.round(r * 2), Math.round(r * 2));
    }
    if (t < this.invulnT && this.mode !== 'dying' && !this.g.dead && Math.floor(rt * 18) % 2 === 0) { // the invulnerability flash after a hit
      const hw = (PW / 2 + 2) * sc, x = Math.round(cx - hw), y = Math.round(cy - hw), w = Math.round(hw * 2);
      ctx.strokeStyle = t - this.hurtT < 0.3 ? '#ffffff' : '#7fe8ff'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, w - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2 * sc, y + 2 * sc, w - 4 * sc, w - 4 * sc);
    }
    for (const h of this.hz) { // b42: a counter-QTE's closing ring around the hero: flip inside the gold band to counter
      if (!h.qte || h.dead) continue;
      const at = FF.bossQteAt(h), q = (at - t) / 1.0;
      if (q < 0 || q > 1) continue;
      ctx.strokeStyle = 'rgba(255,233,160,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 10 * sc + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, (10 + q * 40) * sc + 4, 0, Math.PI * 2); ctx.stroke();
      if (q < 0.4) font.draw(ctx, 'COUNTER!', cx, cy - 18 * sc - 8, { color: '#ffe9a0', align: 'center', outline: '#05060d' });
    }
    if (this.def.renderFront) this.def.renderFront.call(this, ctx, S);
    this.drawFx(ctx, 'front', S);
    BW.defs[this.def.world].drawFront(ctx, this.worldV, cam, rt, {});
  };

  // the cut-in portrait art: the hero (big pixel bust) and the Tyrant's face
  Fight.prototype.portrait = function (ctx, who, x, y, s, rt) {
    if (who === 'hero') { FF.drawFlippoBig(ctx, x, y, s, { skin: this.def.hero || 'ivoid', face: 'focus', t: rt, aura: 1 }); return; }
    if (this.hdOn()) { FF.HDBoss.portrait(this, ctx.getTransform(), x, y, 76 * s / 2, 64 * s / 2, 'head'); return; } // 🎬 b47: the HD face
    let buf = this._bb; // build 37 perf: the Tyrant was already drawn this frame (renderMid): reuse that buffer
    if (!buf || this.mode === 'reward' || this.mode === 'won') {
      buf = this._pb || (this._pb = FF.makeCanvas(170, 170));
      const g = buf.getContext('2d');
      g.clearRect(0, 0, 170, 170);
      this.drawTyrant(g, rt);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 46, 0, 76, 64, x, y, 76 * s / 2, 64 * s / 2); // the head and horns, close up
  };
  // the home card's Tyrant (build 37): the head and horns, breathing and burning, drawn by a fight-less stand-in
  let artFight = null;
  FF.drawTyrantArt = function (ctx, rt) {
    if (!artFight) {
      artFight = Object.create(Fight.prototype);
      Object.assign(artFight, { def: FF.BOSSES.tyrant, phase: 0, t: 0, anim: { kind: 'idle', t0: 0, tl: 0, te: 0, hits: [] }, armsK: 0, hitT: -9, mode: 'fight', modeT0: 0, _art: FF.makeCanvas(170, 170) });
    }
    const f = artFight, g = f._art.getContext('2d');
    f.t = rt; f.phase = Math.floor(rt / 6) % 3; f.armsK = f.phase ? 1 : 0;
    g.clearRect(0, 0, 170, 170); f.drawTyrant(g, rt);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(f._art, 46, 0, 76, 64, 0, 0, 76, 64);
  };
  // b47: the game's pixel Tyrant as a puppet for other screens (the Tyrant's boss level, js/tyrantlevel.js): the whole body
  // into a 170² buffer (body centre at 84,78). o = { t, phase 0..2, anim {kind,t0,tl,te,hits}, hitT, mode, modeT0, armsK }
  FF.tyrantPuppet = function () {
    const f = Object.create(Fight.prototype);
    Object.assign(f, { def: FF.BOSSES.tyrant, phase: 0, t: 0, anim: { kind: 'idle', t0: 0, tl: 0, te: 0, hits: [] }, armsK: 0, hitT: -9, mode: 'fight', modeT0: 0, recoilT: -9 });
    return {
      draw(g, rt, o) {
        o = o || {};
        f.t = o.t !== undefined ? o.t : rt; f.phase = o.phase || 0; f.armsK = o.armsK !== undefined ? o.armsK : f.phase ? 1 : 0;
        f.hitT = o.hitT !== undefined ? o.hitT : -9; f.mode = o.mode || 'fight'; f.modeT0 = o.modeT0 || 0; if (o.anim) f.anim = o.anim;
        g.clearRect(0, 0, 170, 170); f.drawTyrant(g, rt);
      }
    };
  };
  const isAr = (g) => g.settings && g.settings.lang === 'ar';
  function speedLines(ctx, cx, cy, rt, col, n) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = hash(i) * Math.PI * 2, r0 = 40 + hash(i + 3) * 60 + ((rt * 400 + i * 37) % 60), len = 20 + hash(i + 5) * 40;
      for (let k = 0; k < len; k += 2) ctx.fillRect(Math.round(cx + Math.cos(a) * (r0 + k)), Math.round(cy + Math.sin(a) * (r0 + k)), 2, 1);
    }
  }
  function bars(ctx, k) { const h = Math.round(16 * k); if (h > 0) { rect(ctx, 0, 0, W, h, '#000'); rect(ctx, 0, H - h, W, h, '#000'); } }

  // screen-space overlays: HUD, intro, banners, cut-ins, impact frames, chromatic flash, punch-in
  Fight.prototype.renderOverlay = function (ctx, rt) {
    const g = this.g, t = this.t, ar = isAr(g), cv = ctx.canvas;
    // b42: the ambience follows the duel (its own setting, on by default; no music, sound design only)
    if (FF.audio && FF.audio.ambience && !g.opts.silent && !g.replay) FF.audio.ambience({ on: g.settings.amb2 === true, v: this.worldV, phase: this.phase, hearts: this.hearts, set: this.def.amb || '' });
    this.zoomCam(ctx); // build 38: punch-ins and the defeat push-in (the whips are a translate on the world: applyCam)
    // impact frame: 2 frames of high-contrast silhouette
    const it = g.dead ? -1 : t - this.impactT; // (dead: the fight clock stopped — the defeat cinematic has its own impact frames)
    if (it >= 0 && it < 0.05 && !g.settings.reduceFx) {
      ctx.save();
      if (this.hdOn()) FF.HDBoss.invert(); else { ctx.globalCompositeOperation = 'difference'; rect(ctx, 0, 0, W, H, '#ffffff'); } // (b38 perf: one full-screen pass; b47: HD inverts the whole stage)
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      rect(ctx, 0, MID, W, 1, '#ff3a5a');
    } else if (it >= 0.05 && it < 0.22 && !g.settings.reduceFx) { // chromatic flash
      const k = 1 - (it - 0.05) / 0.17;
      const sb = snap(cv); // build 38 perf: the frame's one shared snapshot
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35 * k;
      ctx.drawImage(sb, (Math.floor(rt * 60) % 2) ? 2 : -2, 0); // (b38 perf: one fringe a frame, alternating sides)
      ctx.restore();
    }
    // screen-space effects (tilt, time stop, ripple, void cut, galaxy zoom-out) work on the finished world frame
    const S = this.frameS(g.p.x - PX, rt); S.cv = cv;
    this.drawFx(ctx, 'post', S);
    if (this.mode === 'intro') this.renderIntro(ctx, rt);
    else this.renderHUD(ctx, rt);
    // phase transformation: screen-wide shockwave ring
    if (this.mode === 'trans') {
      const el = t - this.modeT0, bs = S.bs;
      if (el < 1.2) {
        const r = el * 320;
        ctx.strokeStyle = this.transTo === 2 ? 'rgba(255,170,60,' + (1 - el / 1.2).toFixed(2) + ')' : 'rgba(255,80,110,' + (1 - el / 1.2).toFixed(2) + ')';
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bs[0] - 20, bs[1] - 10, r, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      }
      bars(ctx, Math.min(1, el * 5, ((this.transLen || TRANS_LEN) - el) * 5));
    }
    if (this.mode === 'dying') {
      const el = t - this.modeT0;
      bars(ctx, Math.min(1, el * 5));
      if (el > 2.0) { const w = el < 2.35 ? (el - 2.0) / 0.35 : Math.max(0, 1 - (el - 2.35) / 0.9); ctx.fillStyle = 'rgba(255,255,255,' + w.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
    }
    if (this.mode === 'reward' || this.mode === 'won') this.renderReward(ctx, rt);
    if (g.dead) return this.renderDefeat(ctx, rt); // build 38: the defeat cinematic owns the screen
    // cut-ins
    const ci = this.cutIn;
    if (ci) {
      const el = t - ci.t0, k = Math.min(1, el / 0.12), out = Math.min(1, (ci.t0 + ci.len - t) / 0.12);
      const vis = Math.min(k, out);
      if (ci.full) {
        bars(ctx, vis);
        const y = 52, hh = 70, slide = (1 - k) * (ci.who === 'boss' ? 1 : -1) * W;
        ctx.save(); ctx.translate(Math.round(slide), 0);
        ctx.fillStyle = ci.who === 'boss' ? '#2a0008' : '#06103a';
        ctx.beginPath(); ctx.moveTo(0, y + 10); ctx.lineTo(W, y); ctx.lineTo(W, y + hh - 10); ctx.lineTo(0, y + hh); ctx.fill();
        speedLines(ctx, ci.who === 'boss' ? 250 : 70, y + hh / 2, rt, ci.who === 'boss' ? 'rgba(255,80,100,0.5)' : 'rgba(127,232,255,0.5)', 26);
        rect(ctx, 0, y + 9, W, 1, ci.who === 'boss' ? '#ff3a5a' : '#7fe8ff');
        if (ci.who === 'boss') this.portrait(ctx, 'boss', 196, y - 6, 3, rt); else this.portrait(ctx, 'hero', 4, y - 12, 4, rt);
        if (!ar) {
          const tx = ci.who === 'boss' ? 8 : 92, nm = ci.who === 'boss' ? this.def.name : this.def.heroName;
          font.draw(ctx, nm, tx, y + 16, { color: ci.who === 'boss' ? '#ff9ab0' : '#b8f3ff', outline: '#05060d' });
          wrap(ctx, ci.en, tx, y + 30, ci.who === 'boss' ? 180 : 220, '#ffffff', 1);
        }
        ctx.restore();
      } else {
        // a strip below the floor: never covers anything that can hurt you, nor the boss bar
        const BH = H - F - 1, slide = (1 - vis) * BH;
        ctx.save(); ctx.translate(0, Math.round(slide));
        ctx.fillStyle = ci.who === 'boss' ? 'rgba(42,0,8,0.94)' : 'rgba(6,16,58,0.94)';
        ctx.fillRect(0, F + 1, W, BH);
        rect(ctx, 0, F + 1, W, 1, ci.who === 'boss' ? '#ff3a5a' : '#7fe8ff');
        speedLines(ctx, ci.who === 'boss' ? 280 : 40, F + 12, rt, ci.who === 'boss' ? 'rgba(255,80,100,0.35)' : 'rgba(127,232,255,0.35)', 12);
        if (ci.who === 'boss' && this.hdOn()) FF.HDBoss.portrait(this, ctx.getTransform(), W - 46, F + 1, 40, 26, 'face');
        else if (ci.who === 'boss') { let b = this._bb; if (!b) { b = this._pb2 || (this._pb2 = FF.makeCanvas(170, 170)); const bg = b.getContext('2d'); bg.clearRect(0, 0, 170, 170); this.drawTyrant(bg, rt); } ctx.drawImage(b, 56, 20, 56, 36, W - 46, F + 1, 40, 26); }
        else FF.drawFlippoBig(ctx, 4, F - 4, 1.3, { skin: this.def.hero || 'ivoid', face: 'focus', t: rt, aura: 1 });
        if (!ar) font.draw(ctx, ci.en, ci.who === 'boss' ? W - 52 : 34, F + 9, { color: '#ffffff', outline: '#05060d', align: ci.who === 'boss' ? 'right' : 'left' });
        ctx.restore();
      }
    }
    // banners
    const b = this.banner;
    if (b && !ar) {
      const el = t - b.t0, k = Math.min(1, el / 0.15), sc = el < 0.12 ? 4 : 3;
      if (el < b.len - 0.2 || Math.floor(rt * 20) % 2) {
        const by = ci && ci.full ? 128 : 66; // under a full cut-in, never on top of its line
        font.draw(ctx, b.title, W / 2, by - (sc - 3) * 4, { color: b.col, align: 'center', outline: '#05060d', scale: b.title.length > 12 ? 2 : sc });
        if (b.sub) font.draw(ctx, b.sub, W / 2, by + (ci && ci.full ? 20 : 26), { color: '#ffffff', align: 'center', outline: '#05060d' });
      }
      if (k < 1) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 * (1 - k)).toFixed(2) + ')'; ctx.fillRect(0, (ci && ci.full ? 118 : 56), W, 40); }
    }
  };
  const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const HEARTS = {};
  function heart(ctx, x, y, col, hi) { // build 38 perf: each heart colour is painted once, then stamped
    const key = col + hi;
    let c = HEARTS[key];
    if (!c) {
      c = HEARTS[key] = FF.makeCanvas(9, 8); const hg = c.getContext('2d');
      rect(hg, 0, 0, 9, 8, '#05060d');
      HEART.forEach((row, j) => { for (let i = 0; i < 7; i++) if (row[i] === '#') rect(hg, i + 1, j + 1, 1, 1, j === 1 && i < 3 ? hi : col); });
    }
    ctx.drawImage(c, x - 1, y - 1);
  }
  function wrap(ctx, text, x, y, w, col, sc) {
    const words = text.split(' '); let line = '', yy = y;
    for (const wd of words) {
      const tryL = line ? line + ' ' + wd : wd;
      if (font.width(tryL, sc) > w && line) { font.draw(ctx, line, x, yy, { color: col, outline: '#05060d', scale: sc }); line = wd; yy += 10 * sc; }
      else line = tryL;
    }
    if (line) font.draw(ctx, line, x, yy, { color: col, outline: '#05060d', scale: sc });
  }

  Fight.prototype.renderIntro = function (ctx, rt) {
    const el = this.t - this.modeT0, full = this.introLen === INTRO_FULL, ar = isAr(this.g);
    const burstAt = full ? 0.9 : 0.3, vsAt = full ? 2.2 : 0.55, end = this.introLen;
    // the dark before the king
    if (el < burstAt) {
      rect(ctx, 0, 0, W, H, '#000');
      const r = FF.mulberry32(9), k = el / burstAt;
      for (let i = 0; i < 7; i++) { const g2 = ctx; const len = 30 + 80 * k; BW.crack(g2, 160 + (r() - 0.5) * 40, 90 + (r() - 0.5) * 30, r() * Math.PI * 2, len, 'rgba(255,60,40,0.8)', r, true); }
      if (el > burstAt * 0.55) { // the eyes open
        const o = Math.min(1, (el - burstAt * 0.55) / 0.2) * 3;
        for (const ex of [140, 168]) { rect(ctx, ex, 80 - o / 2, 14, o, '#ff9a1a'); rect(ctx, ex + 3, 80 - o / 3, 8, Math.max(1, o * 0.6), '#fff2a0'); }
      }
      bars(ctx, 1);
      return;
    }
    if (full && el < vsAt) { bars(ctx, 1); return; } // the cut-in shows the entrance line
    if (el < end - 0.35) {
      // VS splash
      const k = Math.min(1, (el - vsAt) / 0.15);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(Math.round(-(1 - k) * 160), 0);
      ctx.fillStyle = '#06103a'; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(176, 20); ctx.lineTo(144, 160); ctx.lineTo(0, 160); ctx.fill();
      speedLines(ctx, 60, 90, rt, 'rgba(127,232,255,0.4)', 22);
      this.portrait(ctx, 'hero', 6, 34, 4, rt);
      if (!ar) { font.draw(ctx, this.def.heroName, 8, 26, { color: '#b8f3ff', outline: '#05060d' }); if (full) wrap(ctx, this.def.lines.reply[0], 8, 136, 130, '#ffffff', 1); }
      ctx.restore();
      ctx.save(); ctx.translate(Math.round((1 - k) * 160), 0);
      ctx.fillStyle = '#2a0008'; ctx.beginPath(); ctx.moveTo(180, 20); ctx.lineTo(W, 20); ctx.lineTo(W, 160); ctx.lineTo(148, 160); ctx.fill();
      speedLines(ctx, 260, 90, rt, 'rgba(255,80,100,0.4)', 22);
      this.portrait(ctx, 'boss', 186, 40, 3.6, rt);
      if (!ar) font.draw(ctx, this.def.name, W - 6, 26, { color: '#ff9ab0', outline: '#05060d', align: 'right' });
      ctx.restore();
      const vk = Math.min(1, (el - vsAt - 0.1) / 0.12);
      if (vk > 0) font.draw(ctx, 'VS', W / 2, 74, { color: '#ffd23f', align: 'center', outline: '#3a0006', scale: vk < 1 ? 6 : 4 });
      bars(ctx, 1);
    } else bars(ctx, (end - el) / 0.35);
  };

  Fight.prototype.renderHUD = function (ctx, rt) {
    const g = this.g, t = this.t;
    if (this.mode === 'reward' || this.mode === 'won') return;
    const bw = 180, bx = Math.round(W / 2 - bw / 2), by = 12;
    const f = this.hp / this.hpMax;
    this._shown = this._shown === undefined ? f : this._shown + (f - this._shown) * 0.06; // the damage trail drains slowly
    if (this._shown < f) this._shown = f;
    font.draw(ctx, this.def.name, W / 2, 2, { color: this.phase === 2 ? '#ffb14a' : '#ff9ab0', align: 'center', outline: '#05060d' });
    rect(ctx, bx - 2, by - 1, bw + 4, 7, '#05060d');
    rect(ctx, bx - 1, by, bw + 2, 5, '#3a0a14');
    rect(ctx, bx, by + 1, Math.round(bw * this._shown), 3, '#ffffff');
    const cols = ['#ff3a5a', '#ff2a8a', '#ff8a00'];
    rect(ctx, bx, by + 1, Math.round(bw * f), 3, t - this.hitT < 0.1 ? '#ffffff' : cols[this.phase]);
    rect(ctx, bx, by + 1, Math.round(bw * f), 1, 'rgba(255,255,255,0.45)');
    for (const m of [0.33, 0.66]) rect(ctx, bx + Math.round(bw * m), by - 1, 1, 7, '#ffd27a');
    font.draw(ctx, Math.ceil(f * 100) + '%', bx + bw + 6, by - 1, { color: '#ffffff', outline: '#05060d' });
    for (let i = 0; i < 3; i++) rect(ctx, bx - 14 + i * 4, by + 1, 3, 3, i <= this.phase ? cols[i] : '#3a0a14');
    // the hero side: name, time, aura level
    const ft = this.mode === 'fight' || this.mode === 'trans' ? t - this.fightT0 : this.fightTime;
    font.draw(ctx, fmtTime(Math.max(0, ft)), 4, 22, { color: '#b8f3ff', outline: '#05060d' });
    for (let i = 0; i < this.heartsMax; i++) { // the hearts (the one just lost blinks out)
      const full = i < this.hearts, lost = i === this.hearts && t - this.hurtT < 0.6;
      if (lost && Math.floor(rt * 16) % 2) continue;
      heart(ctx, W - 12 - i * 11, 22, full ? '#ff3a5a' : lost ? '#ffffff' : '#3a0a14', full ? '#ffb0c0' : '#5a1a24');
    }
    if (!g.dead && (this.mode === 'fight' || this.mode === 'clash' || this.mode === 'ult')) { // b43: the STYLE rank
      const RC = ['#8a8fa8', '#7fe8ff', '#7fffb0', '#ffd23f', '#ff5aa8'], r = this.rank, pop = Math.max(0, 1 - (t - this.rankT) / 0.35), sc = 2 + (pop > 0 ? 1 : 0);
      rect(ctx, 3, 31, 34, 15, 'rgba(5,6,13,0.7)');
      font.draw(ctx, FF.BOSS_RANKS[r], 6, 33 - (sc - 2) * 2, { color: r === 4 && Math.floor(rt * 8) % 2 ? '#ffffff' : RC[r], outline: '#05060d', scale: sc });
      const k = r === 4 ? 1 : (this.style - RANK_AT[r]) / (RANK_AT[r + 1] - RANK_AT[r]);
      rect(ctx, 18, 41, 17, 3, '#1a1530'); rect(ctx, 18, 41, Math.round(17 * Math.max(0, Math.min(1, k))), 3, RC[r]);
      font.draw(ctx, 'STYLE', 18, 33, { color: '#b8f3ff', outline: '#05060d' });
      if (pop > 0 && r >= 2) font.draw(ctx, ['', '', 'NICE', 'AWESOME', 'STYLISH!'][r], 40, 33, { color: RC[r], outline: '#05060d' });
    }
    if (this.def.continues) font.draw(ctx, 'CP ' + (this.def.continues - this.retries), W - 4, 32, { color: '#b8f3ff', outline: '#05060d', align: 'right' });
    if (this.combo && t - this.combo < 0.8 && Math.floor(rt * 10) % 2) font.draw(ctx, 'COMBO!', W - 60, 40, { color: '#ffb14a', outline: '#05060d', align: 'center' });
    if (this.tunnelOn() && !g.dead) this.renderGravHUD(ctx, rt);
    // b42: the ULT meter / button (bottom-left)
    if (!g.dead) {
      const k = this.ult / 100, ready = k >= 1, cx = 22, cy = H - 22, pu = ready ? 1 + Math.sin(rt * 10) : 0;
      disc(ctx, cx, cy, 17 + pu, ready ? 'rgba(255,233,160,0.35)' : 'rgba(5,6,13,0.7)');
      ctx.strokeStyle = '#3a2a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = ready ? '#ffe9a0' : '#7fe8ff'; ctx.beginPath(); ctx.arc(cx, cy, 15, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      font.draw(ctx, 'ULT', cx, cy - 4, { color: ready ? '#ffe9a0' : '#b8f3ff', align: 'center', outline: '#05060d' });
      if (ready && Math.floor(rt * 4) % 2) font.draw(ctx, 'HOLD / E', cx + 22, cy - 4, { color: '#ffe9a0', outline: '#05060d' });
    }
  };

  // ================================================================ 🌌 BUILD 38 — THE STARFALL TUNNEL (pseudo-3D, canvas 2D)
  // In the STARFALL COSMOS the road wraps into a tube seen from behind the hero. The duel itself does not change: it is
  // the same 2D lane, read as world x = depth ahead of the hero and world y = the tube's vertical diameter (floor at the
  // bottom, ceiling at the top). So a hazard is drawn by projecting rectAt() — the very box the collision test uses —
  // and the hero by projecting its own box: what you see hit you is what hit you. The camera sits behind and above the
  // hero and rolls around the tube's axis as the hero crosses it (0° on the floor, 90° mid-flip, 180° on the ceiling),
  // so the hero always stands at the bottom of the screen. The roll is a pure function of the hero's position (and of
  // the gravity-shift countdown), so a replay draws the very same frames. Drawing only: nothing here writes the fight.
  const TUN = { cx: 160, cy: 70, FOC: 80, D: 40, h: 38, R: 62, far: 720, ts: 1.12, near: -34 };
  FF.BOSS_TUNNEL = TUN;
  Fight.prototype.tunnelOn = function () { return this.worldV === 4; };
  // build 39: the roll EASES to the hero's side over ROLL_T after each flip (it used to snap with the hero's height), the
  // camera stays inside the tube, and a dimension shift swings the camera in from far behind (or pulls it out)
  Fight.prototype.rollAt = function (t) {
    if (this.rollT0 === undefined) return 0;
    const q = FF.clamp((t - this.rollT0) / ROLL_T, 0, 1), e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    return this.rollA + (this.rollB - this.rollA) * e;
  };
  Fight.prototype.tunView = function () {
    const p = this.g.p, V = this._tv || (this._tv = { k1: NaN });
    if (V.k1 === p.y && V.k2 === p.x && V.k3 === this.t && V.k4 === this.mode) return V;
    V.k1 = p.y; V.k2 = p.x; V.k3 = this.t; V.k4 = this.mode;
    let roll = this.rollAt(this.t), d = TUN.D, warp = 0;
    // the gravity-shift countdown leans the whole tube toward the coming roll
    if (this.gravT && this.t < this.gravT) roll += (p.grav > 0 ? 1 : -1) * 0.2 * FF.clamp(1 - (this.gravT - this.t) / 1.2, 0, 1);
    if (this.mode === 'trans' && this.shift) {
      const el = this.t - this.modeT0;
      if (this.shift === 'in') { const e = ease(FF.clamp((el - 0.9) / 1.6, 0, 1)); d *= 1 + 6 * (1 - e); roll += (1 - e) * Math.PI * 1.5; warp = 1 - e; }
      else { const e = FF.clamp(el / 0.9, 0, 1); d *= 1 + 3 * e * e; roll -= e * e * Math.PI; warp = e; }
    }
    V.roll = roll; V.cr = Math.cos(roll); V.sr = Math.sin(roll); V.d = d; V.warp = warp;
    V.hv = p.y + PH / 2 - MID; V.hx = p.x + PW / 2;
    let qx = -TUN.h * V.sr, qy = V.hv - TUN.h * V.cr; // the camera: h above the hero, "above" turning with the roll
    const ql = Math.hypot(qx, qy); if (ql > 44) { qx *= 44 / ql; qy *= 44 / ql; } // ...but always inside the tube
    V.qx = qx; V.qy = qy;
    tp(V, 0, 0, V.hv); V.hsx = PT[0]; V.hsy = PT[1]; V.hs = PT[2];
    V.hrot = roll + (p.grav > 0 ? 0 : Math.PI);
    return V;
  };
  const PT = [0, 0, 0];
  // project a tube point: dz = depth ahead of the hero's centre, (lat, v) = across the tube (v = world y - MID)
  function tp(V, dz, lat, v) {
    const s = TUN.FOC / Math.max(3, dz + (V.d || TUN.D)), ax = lat - V.qx, ay = v - V.qy;
    PT[0] = TUN.cx + (ax * V.cr - ay * V.sr) * s; PT[1] = TUN.cy + (ax * V.sr + ay * V.cr) * s; PT[2] = s;
    return PT;
  }
  Fight.prototype.tunProject = function (x, y) { const V = this.tunView(), q = tp(V, x - V.hx, 0, y - MID); return [q[0], q[1]]; }; // (tests)
  Fight.prototype.tunPt = function (x, y) { // a world point (particles): null once it is behind the camera
    const V = this.tunView(), dz = x - V.hx;
    if (dz < TUN.near) return null;
    return tp(V, dz, 0, y - MID);
  };
  const BX = new Float64Array(16);
  function q4(ctx, a, b, c, d) { ctx.moveTo(BX[a * 2], BX[a * 2 + 1]); ctx.lineTo(BX[b * 2], BX[b * 2 + 1]); ctx.lineTo(BX[c * 2], BX[c * 2 + 1]); ctx.lineTo(BX[d * 2], BX[d * 2 + 1]); ctx.closePath(); }
  // a box in the tube: depth dz0..dz1, lateral l0..l1, across v0..v1 (back face, sides, then the face toward you)
  function tbox(ctx, V, dz0, dz1, l0, l1, v0, v1, cB, cS, cF) {
    dz0 = Math.max(dz0, TUN.near + 4); if (dz1 <= dz0) return;
    for (let d = 0; d < 2; d++) for (let j = 0; j < 4; j++) { tp(V, d ? dz1 : dz0, j === 0 || j === 3 ? l0 : l1, j < 2 ? v0 : v1); BX[(d * 4 + j) * 2] = PT[0]; BX[(d * 4 + j) * 2 + 1] = PT[1]; }
    ctx.fillStyle = cB; ctx.beginPath(); q4(ctx, 4, 5, 6, 7); ctx.fill();
    ctx.fillStyle = cS; ctx.beginPath(); q4(ctx, 0, 1, 5, 4); q4(ctx, 3, 2, 6, 7); q4(ctx, 0, 3, 7, 4); q4(ctx, 1, 2, 6, 5); ctx.fill();
    ctx.fillStyle = cF; ctx.beginPath(); q4(ctx, 0, 1, 2, 3); ctx.fill();
  }
  // a crescent blade standing on a wall (vw) and reaching up to vt, at one depth
  function fin(ctx, V, dz, vw, vt, col) {
    if (dz < TUN.near + 4) return;
    const mid = vw + (vt - vw) * 0.72;
    ctx.fillStyle = col; ctx.beginPath();
    tp(V, dz, -17, vw); ctx.moveTo(PT[0], PT[1]); tp(V, dz, -12, mid); ctx.lineTo(PT[0], PT[1]); tp(V, dz, -4, vt); ctx.lineTo(PT[0], PT[1]);
    tp(V, dz, 4, vt); ctx.lineTo(PT[0], PT[1]); tp(V, dz, 12, mid); ctx.lineTo(PT[0], PT[1]); tp(V, dz, 17, vw); ctx.lineTo(PT[0], PT[1]);
    tp(V, dz, 6, vw + (vt - vw) * 0.45); ctx.lineTo(PT[0], PT[1]); tp(V, dz, -6, vw + (vt - vw) * 0.45); ctx.lineTo(PT[0], PT[1]);
    ctx.closePath(); ctx.fill();
  }
  // a flat strip lying on a wall (telegraph lanes, road tiles)
  function strip(ctx, V, dz0, dz1, l0, l1, v) {
    dz0 = Math.max(dz0, TUN.near + 4); if (dz1 <= dz0) return;
    tp(V, dz0, l0, v); ctx.moveTo(PT[0], PT[1]); tp(V, dz0, l1, v); ctx.lineTo(PT[0], PT[1]);
    tp(V, dz1, l1, v); ctx.lineTo(PT[0], PT[1]); tp(V, dz1, l0, v); ctx.lineTo(PT[0], PT[1]); ctx.closePath();
  }
  const fadeZ = (dz) => FF.clamp(1 - (dz - 260) / 420, 0, 1);

  // the backdrop: rotating deep space, the Tyrant looming at the far end, then the tube (rings, rails, the road)
  Fight.prototype.renderTunnelBack = function (ctx, S, rt) {
    const V = S.V || this.tunView();
    // deep space turns with the camera (build 38 perf: on the floor or the ceiling it is an aligned blit, rotated only mid-roll)
    const sky = BW.tunnelSky(), rr = ((V.roll % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (rr < 0.004 || 2 * Math.PI - rr < 0.004) ctx.drawImage(sky, 200 - TUN.cx, 200 - TUN.cy, W, H, 0, 0, W, H);
    else if (Math.abs(rr - Math.PI) < 0.004) ctx.drawImage(BW.tunnelSky180(), 200 - TUN.cx, 200 - TUN.cy, W, H, 0, 0, W, H);
    else { ctx.save(); ctx.translate(TUN.cx, TUN.cy); ctx.rotate(V.roll); ctx.drawImage(sky, -200, -200); ctx.restore(); }
    ctx.drawImage(BW.tunnelGlow(), TUN.cx - 70, TUN.cy - 70);
    // the warp starfield (arrival) radiates from the vanishing point ('back' effects are painted here in the tunnel)
    S.v = 4; this.drawFx(ctx, 'back', S);
    // the Tyrant: huge, at the end of the tube, turning with the camera. Its effects ride inside the same transform.
    const bx = S.bx, by = S.by, bs = S.bs, loc = this._tloc || (this._tloc = [0, 0]);
    ctx.save(); ctx.translate(Math.round(bs[0]), Math.round(bs[1])); ctx.rotate(V.roll); ctx.scale(TUN.ts, TUN.ts);
    S.bx = -84; S.by = -78; S.bs = loc;
    this.drawTyrantLayer(ctx, S, rt);
    S.bx = bx; S.by = by; S.bs = bs;
    ctx.restore();
    this.drawTunnelGeo(ctx, V, rt);
    this.drawTunnelDust(ctx, V, rt);
    this.tunStats = this.tunStats || { frames: 0, lethal: 0, drawn: 0, hero: 0 };
    this.tunStats.frames++;
  };
  Fight.prototype.drawTunnelGeo = function (ctx, V, rt) {
    const R = TUN.R, SP = 48, spin = rt * 0.5, near = TUN.near + 6;
    // rings of starlight, nearest brightest
    const k0 = Math.ceil((V.hx + near) / SP), k1 = Math.floor((V.hx + 470) / SP);
    // the tube wall: translucent bands between the nearest rings (an even-odd donut each)
    for (let k = k0 + 5; k >= k0; k--) {
      const za = k * SP - V.hx, zb = za + SP;
      if (za < 24) continue; // (the nearest band would cover the whole screen: skipped, the rings say enough)
      tp(V, Math.max(za, near), 0, 0); const ax = PT[0], ay = PT[1], ar2 = R * PT[2];
      tp(V, zb, 0, 0); const bx2 = PT[0], by2 = PT[1], br = R * PT[2];
      ctx.fillStyle = k % 2 ? 'rgba(40,24,96,0.34)' : 'rgba(20,12,60,0.26)';
      ctx.beginPath(); ctx.arc(ax, ay, ar2 + 0.5, 0, Math.PI * 2); ctx.moveTo(bx2 + br, by2); ctx.arc(bx2, by2, br, 0, Math.PI * 2, true); ctx.fill('evenodd');
    }
    for (let k = k1; k >= k0; k--) {
      const dz = k * SP - V.hx, a = Math.pow(FF.clamp(1 - dz / 470, 0, 1), 1.4) * (dz < 0 ? 0.5 + 0.5 * (dz - near) / -near : 1);
      if (a <= 0.02) continue;
      tp(V, dz, 0, 0);
      const cx = PT[0], cy = PT[1], r = R * PT[2];
      ctx.globalAlpha = a * 0.85;
      ctx.lineWidth = Math.max(1, Math.min(4, 2.2 * PT[2]));
      ctx.strokeStyle = k % 2 ? '#7f6ad8' : '#4ad0ff';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      // panel lights turning around each ring (the tube rotates)
      ctx.fillStyle = k % 4 === 0 ? '#ffffff' : '#e8d8ff';
      const sz = Math.max(1, Math.round(1.8 * PT[2]));
      for (let j = 0; j < 8; j++) { const an = spin + j * 0.785 + k * 0.2; ctx.fillRect(Math.round(cx + Math.cos(an) * r - sz / 2), Math.round(cy + Math.sin(an) * r - sz / 2), sz, sz); }
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
    // eight rails along the tube, converging on the Tyrant
    ctx.strokeStyle = 'rgba(184,166,255,0.28)'; ctx.beginPath();
    for (let j = 0; j < 8; j++) {
      const an = spin * 0.4 + j * 0.785, la = Math.cos(an) * R, va = Math.sin(an) * R;
      tp(V, near, la, va); ctx.moveTo(PT[0], PT[1]); tp(V, 520, la, va); ctx.lineTo(PT[0], PT[1]);
    }
    ctx.stroke();
    // the road: the lane wraps onto the tube's floor and ceiling as two ribbons of asteroid-rock tiles
    const TS = 24, t0 = Math.ceil((V.hx + near) / TS);
    for (let band = 2; band >= 0; band--) {
      const zA = band === 0 ? near : band === 1 ? 170 : 330, zB = band === 0 ? 170 : band === 1 ? 330 : 520;
      ctx.globalAlpha = band === 0 ? 1 : band === 1 ? 0.7 : 0.32;
      for (let par = 0; par < 2; par++) {
        ctx.fillStyle = par ? '#2a2050' : '#1a1430';
        ctx.beginPath();
        for (let k = t0; k * TS - V.hx < zB; k++) {
          if (((k % 2) + 2) % 2 !== par) continue;
          const a0 = Math.max(zA, k * TS - V.hx), a1 = Math.min(zB, (k + 1) * TS - V.hx);
          if (a1 <= a0) continue;
          strip(ctx, V, a0, a1, -16, 16, 60); strip(ctx, V, a0, a1, -16, 16, -60);
        }
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // glowing kerbs on both ribbons (the lane you run in is the bright one)
    const pu = 0.55 + 0.35 * Math.sin(rt * 4);
    for (const v of [60, -60]) {
      const mine = (v > 0) === (V.hv > 0);
      ctx.strokeStyle = mine ? FF.rgba('#e8d8ff', pu) : 'rgba(127,232,255,0.35)';
      ctx.beginPath();
      for (const l of [-16, 16]) { tp(V, near, l, v); ctx.moveTo(PT[0], PT[1]); tp(V, 480, l, v); ctx.lineTo(PT[0], PT[1]); }
      ctx.stroke();
    }
  };
  // stars and rock debris rushing at the camera out of the depth (closed form in time: no state, never drifts)
  Fight.prototype.drawTunnelDust = function (ctx, V, rt) {
    const span = 680, near = TUN.near + 6;
    ctx.strokeStyle = 'rgba(232,216,255,0.75)'; ctx.beginPath();
    ctx.fillStyle = '#e8d8ff';
    for (let i = 0; i < 56; i++) {
      const an = hash(i + 1100) * Math.PI * 2, rr = 14 + hash(i + 1101) * 44, la = Math.cos(an) * rr, va = Math.sin(an) * rr;
      const dz = ((hash(i + 1102) * span - V.hx - rt * 160) % span + span) % span + near;
      if (dz < 70 || V.warp > 0.05) { tp(V, dz, la, va); ctx.moveTo(PT[0], PT[1]); tp(V, dz + 16 + Math.max(0, 70 - dz) * 0.3 + V.warp * 320, la, va); ctx.lineTo(PT[0], PT[1]); } // (hyperspace: everything streaks)
      else { tp(V, dz, la, va); const sz = PT[2] > 0.5 ? 2 : 1; ctx.fillRect(Math.round(PT[0]), Math.round(PT[1]), sz, sz); }
    }
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const an = hash(i + 1200) * Math.PI * 2, rr = 20 + hash(i + 1201) * 34, la = Math.cos(an) * rr, va = Math.sin(an) * rr;
      const dz = ((hash(i + 1202) * span - V.hx - rt * 70) % span + span) % span + near + 10;
      tp(V, dz, la, va);
      const s = Math.max(1, Math.round(3.5 * PT[2])), x = Math.round(PT[0] - s / 2), y = Math.round(PT[1] - s / 2), tw = (Math.floor(rt * 8) + i) % 2;
      rect(ctx, x, y, s, Math.max(1, Math.round(s * (tw ? 0.7 : 1))), '#2a2050');
      rect(ctx, x, y, s, 1, '#e8d8ff');
      if (s > 3) rect(ctx, x + 1, y + s - 2, s - 2, 1, '#100c22');
    }
  };
  const ghostBox = { cleave: [8, 30], shard: [10, 40], pillar: [14, 54] };
  // telegraphs + everything ahead of the hero, far to near
  Fight.prototype.renderTunnelMid = function (ctx, S, rt) {
    const V = S.V, t = this.t, camAt = this.g.p.x - PX;
    this.drawFx(ctx, 'mid', S);
    // telegraphs: lit on the tube walls, under the hazards (harmless while they are only warnings)
    for (const h of this.hz) {
      if (t < h.t0 || t >= h.tl) continue;
      const k = (t - h.t0) / (h.tl - h.t0), on = k > 0.75 || Math.floor(rt * 16) % 2 === 0, vw = h.side === 'f' ? 60 : -60;
      if (h.k === 'wave') {
        ctx.fillStyle = 'rgba(255,50,80,' + (0.2 + 0.3 * k).toFixed(2) + ')'; ctx.beginPath(); strip(ctx, V, -10, SX_BLADE - PX, -12, 12, vw); ctx.fill();
        if (on) { ctx.strokeStyle = '#ff3a5a'; ctx.beginPath(); for (const l of [-12, 12]) { tp(V, -10, l, vw); ctx.moveTo(PT[0], PT[1]); tp(V, SX_BLADE - PX, l, vw); ctx.lineTo(PT[0], PT[1]); } ctx.stroke(); }
        if (on) { ctx.fillStyle = 'rgba(255,120,140,0.85)'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const dz = SX_BLADE - PX - 4 - ((rt * 150 + i * 32) % 160); strip(ctx, V, dz, dz + 3, -12, 12, vw); } ctx.fill(); }
        ctx.globalAlpha = 0.25 + 0.35 * k; fin(ctx, V, SX_BLADE - PX - 6, vw, vw > 0 ? 38 : -38, h.mir ? '#7fe8ff' : '#ff3a5a'); ctx.globalAlpha = 1;
      } else if (h.k === 'beam') {
        const vb = h.side === 'c' ? -3 : 3;
        ctx.fillStyle = 'rgba(255,170,60,' + (0.08 + 0.14 * k).toFixed(2) + ')'; ctx.beginPath(); strip(ctx, V, -10, 300, -58, 58, vb); ctx.fill();
        if (on) { ctx.strokeStyle = '#ffd27a'; ctx.beginPath(); for (const l of [-58, 58]) { tp(V, -10, l, vb); ctx.moveTo(PT[0], PT[1]); tp(V, 300, l, vb); ctx.lineTo(PT[0], PT[1]); } ctx.stroke(); }
      } else {
        const gb = ghostBox[h.k] || [10, 30], dz0 = h.wx - V.hx, vt = h.side === 'f' ? 60 - gb[1] : -60 + gb[1];
        ctx.globalAlpha = 0.35 + 0.4 * k;
        tbox(ctx, V, dz0, dz0 + gb[0], -9, 9, Math.min(vw, vt), Math.max(vw, vt), 'rgba(255,50,80,0.12)', 'rgba(255,50,80,0.18)', 'rgba(255,60,90,' + (0.15 + 0.25 * k).toFixed(2) + ')');
        ctx.globalAlpha = 1;
        if (on) { ctx.fillStyle = h.comet ? '#7fe8ff' : h.k === 'pillar' ? '#ff8a00' : '#ff3a5a'; ctx.beginPath(); strip(ctx, V, dz0 - 3, dz0 + gb[0] + 3, -15, 15, vw); ctx.fill(); }
        if (h.k === 'cleave') this.tunFlyer(ctx, V, h, rt);
      }
    }
    this.tunHazards(ctx, V, rt, camAt, 1);
    this.tunOrbs(ctx, V, rt, 1);
    // seal bolts: star-blue comets from the hero into the depth, to the Tyrant
    for (const b of this.bolts) {
      const k = FF.clamp((t - b.t0) / 0.3, 0, 1), ex = S.bs[0], ey = S.bs[1] + 6;
      if (b.done) { const q = (t - b.t0 - 0.3) / 0.3; ctx.strokeStyle = 'rgba(200,240,255,' + (1 - q).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex, ey, 4 + q * 22, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; continue; }
      for (let i = 0; i < 8; i++) {
        const kk = Math.max(0, k - i * 0.03), sz = Math.max(1, Math.round((1 - kk) * 6 + 1));
        rect(ctx, V.hsx + (ex - V.hsx) * kk + Math.sin(kk * Math.PI) * 30, V.hsy - 8 + (ey - V.hsy + 8) * kk, sz, sz, i ? (i % 2 ? '#7fe8ff' : '#b8a6ff') : '#ffffff');
      }
    }
    for (const d of this.dmgPops || []) { const k = (t - d.t) / 0.8; if (k < 1) font.draw(ctx, '-' + d.dmg + '%', S.bs[0] + 34, S.bs[1] - 30 - k * 14, { color: k < 0.15 ? '#ffffff' : '#ff9ab0', align: 'center', outline: '#05060d', scale: k < 0.1 ? 2 : 1 }); }
    this.drawFx(ctx, 'top', S);
  };
  // the cleaver (or comet) hurled out of the depth during its warning: it lands on its mark exactly when it turns lethal
  Fight.prototype.tunFlyer = function (ctx, V, h, rt) {
    const t = this.t, e = FF.clamp((t - (h.tl - 0.6)) / 0.6, 0, 1);
    if (e <= 0) return;
    const gb = ghostBox.cleave, dzE = h.wx - V.hx + gb[0] / 2, vE = h.side === 'f' ? 60 - gb[1] / 2 : -60 + gb[1] / 2, q = e * e;
    const dz = 620 + (dzE - 620) * q, v = -8 + (vE + 8) * q;
    tp(V, dz, 0, v);
    const x = PT[0], y = PT[1], s = PT[2];
    if (h.comet) { // a comet: a white head, a star-blue tail streaming back toward the Tyrant
      const tx = x, ty = y; tp(V, dz + 60, 0, v * 0.8);
      ctx.strokeStyle = 'rgba(127,232,255,0.6)'; ctx.lineWidth = Math.max(1, 3 * s); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(PT[0], PT[1]); ctx.stroke(); ctx.lineWidth = 1;
      const r = Math.max(2, 5 * s); rect(ctx, tx - r, ty - r, r * 2, r * 2, '#e8fbff'); rect(ctx, tx - r / 2, ty - r / 2, r, r, '#ffffff');
    } else {
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(rt * 14); const sc = Math.max(0.5, s * 1.6); ctx.scale(sc, sc);
      if (!miniC) miniCleaver(ctx, -999, -999, 0);
      ctx.drawImage(miniC, -7, -3); ctx.restore();
    }
  };
  // live hazards from their hitboxes. pass 1 = ahead of the hero (before it is drawn), 0 = passing the camera
  Fight.prototype.tunHazards = function (ctx, V, rt, camAt, pass) {
    const t = this.t, list = this._thz || (this._thz = []);
    list.length = 0;
    for (const h of this.hz) {
      if (t < h.t0) continue;
      const r = this.rectAt(h, t, camAt);
      if (!r) continue;
      const dz0 = r[0] - V.hx;
      if ((dz0 > 0) !== (pass === 1)) continue;
      h._r = r; h._dz = dz0; list.push(h);
    }
    list.sort((a, b) => b._dz - a._dz);
    for (const h of list) {
      const r = h._r, dz0 = r[0] - V.hx, dz1 = r[0] + r[2] - V.hx, v0 = r[1] - MID, v1 = r[1] + r[3] - MID, fl = h.side === 'f';
      if (dz1 < TUN.near + 4) continue;
      this.tunStats.lethal++;
      if (h.k === 'wave') {
        const vw = fl ? v1 : v0, vt = fl ? v0 : v1, hi = h.mir ? '#e8fbff' : '#ffd0d8', mid = h.mir ? '#7fe8ff' : '#ff3a5a';
        for (let i = 3; i >= 1; i--) { ctx.globalAlpha = 0.16 * (4 - i); fin(ctx, V, dz0 + i * 13, vw, vt, mid); }
        ctx.globalAlpha = 1;
        fin(ctx, V, dz1, vw, vt, '#5a0a18'); fin(ctx, V, dz0 + 2, vw, vt, mid); fin(ctx, V, dz0, vw, vw + (vt - vw) * 0.92, hi);
      } else if (h.k === 'cleave') {
        if (h.comet) tbox(ctx, V, dz0, dz1, -8, 8, v0, v1, '#3a5cff', '#7fe8ff', '#e8fbff');
        else tbox(ctx, V, dz0, dz1, -9, 9, v0, v1, '#5a5048', '#8a8070', '#c8c0b0');
        ctx.fillStyle = '#ff3a5a'; ctx.beginPath(); strip(ctx, V, dz0, dz1, -9, 9, fl ? v0 : v1); ctx.fill();
        const e = t - h.tl;
        if (e < 0.18) { tp(V, dz0, 0, fl ? 60 : -60); const rr = (6 + e * 160) * PT[2]; ctx.strokeStyle = 'rgba(255,233,160,' + (1 - e / 0.18).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(PT[0], PT[1], rr, rr * 0.35, -V.roll, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
      } else if (h.k === 'pillar' || h.k === 'shard') {
        const sh = h.k === 'shard';
        tbox(ctx, V, dz0, dz1, sh ? -6 : -8, sh ? 6 : 8, v0, v1, sh ? '#3a5a5a' : '#1c0c14', sh ? '#bff6ff' : '#6a2a3a', sh ? '#e8fbff' : '#ff5a1a');
        if (!sh) { ctx.fillStyle = '#ffd27a'; ctx.beginPath(); tp(V, dz0, -2, v0); ctx.moveTo(PT[0], PT[1]); tp(V, dz0, 2, v0); ctx.lineTo(PT[0], PT[1]); tp(V, dz0, 2, v1); ctx.lineTo(PT[0], PT[1]); tp(V, dz0, -2, v1); ctx.lineTo(PT[0], PT[1]); ctx.closePath(); ctx.fill(); }
        const e = t - h.tl;
        if (e < 0.2) { tp(V, dz0 + 7, 0, fl ? 60 : -60); const rr = (8 + e * 200) * PT[2]; ctx.strokeStyle = 'rgba(255,200,120,' + (1 - e * 5).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(PT[0], PT[1], rr, rr * 0.35, -V.roll, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
      } else if (h.k === 'beam') { // a half-tube river of fire out of the Tyrant's jaw
        const vb = h.side === 'c' ? -3 : 3, vw = h.side === 'c' ? -60 : 60, q = t > h.te ? 1 - (t - h.te) / 0.1 : Math.min(1, (t - h.tl) / 0.05);
        for (let z = 520; z >= Math.max(dz0, TUN.near + 6); z -= 40) {
          ctx.globalAlpha = q * (0.35 + 0.45 * fadeZ(z));
          ctx.fillStyle = (z / 40) % 2 ? '#ff5a1a' : '#ffb14a'; ctx.beginPath();
          for (let j = 0; j <= 8; j++) { const an = j / 8 * Math.PI, la = Math.cos(an) * 58, va = vb + Math.sin(an) * (vw - vb); tp(V, z + Math.sin(rt * 20 + z) * 3, la, va); if (j) ctx.lineTo(PT[0], PT[1]); else ctx.moveTo(PT[0], PT[1]); }
          ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else tbox(ctx, V, dz0, dz1, -8, 8, v0, v1, '#5a0a18', '#ff3a5a', '#ffd0d8');
      this.tunStats.drawn++;
    }
  };
  Fight.prototype.tunOrbs = function (ctx, V, rt, pass) {
    for (const o of this.orbs) {
      const dz = o.wx - V.hx;
      if ((dz > 0) !== (pass === 1) || dz < TUN.near + 6 || dz > 560) continue;
      tp(V, dz, 0, o.y - MID);
      const x = PT[0], y = PT[1], s = PT[2], big = o.side === 'm', R = (big ? 6 : 5) * s, pul = 0.5 + 0.5 * Math.sin(rt * 8 + o.wx);
      disc(ctx, x, y, R + 2 * s, big ? 'rgba(255,233,160,' + (0.2 + 0.2 * pul).toFixed(2) + ')' : 'rgba(127,232,255,' + (0.18 + 0.2 * pul).toFixed(2) + ')');
      ctx.strokeStyle = big ? '#ffe9a0' : '#7fe8ff'; ctx.lineWidth = Math.max(1, s); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      const m = Math.max(1, Math.round(s * 1.5));
      for (let i = 0; i < 4; i++) { const an = rt * 4 + i * Math.PI / 2; rect(ctx, x + Math.cos(an) * (R - 2 * s) - m / 2, y + Math.sin(an) * (R - 2 * s) - m / 2, m, m, '#ffffff'); }
      if (big && s > 0.4) font.draw(ctx, 'FLIP', x, y - R - 10, { color: '#ffe9a0', align: 'center', outline: '#05060d' });
    }
  };
  // build 39: an UPRIGHT gravity compass (never rolls with the camera): the arrow points where "down" is on screen, and a
  // little side view shows which lane you stand on — orientation is never lost, even mid-roll
  Fight.prototype.renderGravHUD = function (ctx, rt) {
    const V = this.tunView(), gs = this.g.p.grav > 0 ? 1 : -1, cx = W - 20, cy = H - 22, dx = -gs * V.sr, dy = gs * V.cr;
    disc(ctx, cx, cy, 13, 'rgba(5,6,13,0.72)');
    ctx.strokeStyle = '#7fe8ff'; ctx.beginPath(); ctx.arc(cx, cy, 12.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - dx * 7, cy - dy * 7); ctx.lineTo(cx + dx * 8, cy + dy * 8); ctx.stroke(); ctx.lineWidth = 1;
    const hx = cx + dx * 9, hy = cy + dy * 9, px = -dy, py = dx;
    ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.moveTo(hx + dx * 3, hy + dy * 3); ctx.lineTo(hx - dx * 3 + px * 4, hy - dy * 3 + py * 4); ctx.lineTo(hx - dx * 3 - px * 4, hy - dy * 3 - py * 4); ctx.closePath(); ctx.fill();
    // the lane map: ceiling bar, floor bar, you
    const lx = W - 52, top = H - 33, bot = H - 11, me = gs > 0 ? bot - 3 : top + 2;
    rect(ctx, lx - 1, top - 2, 14, 26, 'rgba(5,6,13,0.72)');
    rect(ctx, lx, top, 12, 1, gs < 0 ? '#ffe9a0' : '#4a3a7a'); rect(ctx, lx, bot, 12, 1, gs > 0 ? '#ffe9a0' : '#4a3a7a');
    rect(ctx, lx + 4, me, 4, 2, '#7fe8ff'); if (Math.floor(rt * 6) % 2) rect(ctx, lx + 5, gs > 0 ? top + 3 : bot - 4, 2, 2, 'rgba(184,243,255,0.6)');
    font.draw(ctx, gs > 0 ? 'FLOOR' : 'CEILING', lx - 4, H - 9, { color: '#b8f3ff', outline: '#05060d', align: 'right' });
  };
  Fight.prototype.renderTunnelNear = function (ctx, S, rt) {
    this.tunHazards(ctx, S.V, rt, this.g.p.x - PX, 0);
    this.tunOrbs(ctx, S.V, rt, 0);
  };
  // the hero from behind: INFINITY VOID's back, cosmic aura, a wake of stars streaming past the camera
  let heroBack = null, heroBackId = null;
  // (12x12, seen from behind: a rim of starlight on the shoulders and the glowing ∞ of the Void on its back)
  const BACK = ['.kkkkkkkkkk.', 'kllllllllllk', 'klbbbbbbbbsk', 'klbbbbbbbbsk', 'klbwwbbwwbsk', 'klwbbwwbbwsk', 'klbwwbbwwbsk', 'klbbbbbbbbsk', 'klbbbbbbbbsk', 'kssssssssssk', '.kkk.kk.kkk.', '..kk....kk..'];
  Fight.prototype.renderTunnelHero = function (ctx, rt) {
    const g = this.g, V = this.tunView(), x = V.hsx, y = V.hsy, s = V.hs;
    if (!heroBack || heroBackId !== this.def.hero) {
      heroBackId = this.def.hero; heroBack = FF.makeCanvas(12, 12); const hg = heroBack.getContext('2d'), sk = FF.skinById(this.def.hero || 'ivoid'), pal = { k: sk.dark, l: sk.light, b: sk.body, s: sk.shade, w: sk.eye };
      BACK.forEach((row, j) => { for (let i = 0; i < 12; i++) if (row[i] !== '.') { hg.fillStyle = pal[row[i]]; hg.fillRect(i, j, 1, 1); } });
    }
    // build 39: WHERE A FLIP TAKES YOU — the other lane lights up and a ghost of the hero waits there, joined by a dotted arc
    if ((this.mode === 'fight' || this.mode === 'retry') && !g.dead) {
      const vt = V.hv > 0 ? -(F - PH / 2 - MID) : F - PH / 2 - MID, wall = vt > 0 ? 60 : -60, pu = 0.55 + 0.45 * Math.sin(rt * 6);
      ctx.fillStyle = 'rgba(127,232,255,' + (0.16 + 0.12 * pu).toFixed(2) + ')'; ctx.beginPath(); strip(ctx, V, 2, 90, -10, 10, wall); ctx.fill();
      tp(V, 26, 0, vt); const gx = PT[0], gy = PT[1], gs = PT[2] * 6;
      ctx.strokeStyle = 'rgba(184,243,255,' + (0.5 + 0.4 * pu).toFixed(2) + ')'; ctx.setLineDash([2, 2]); ctx.strokeRect(Math.round(gx - gs) + 0.5, Math.round(gy - gs) + 0.5, Math.round(gs * 2), Math.round(gs * 2)); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(184,243,255,0.7)';
      for (let i = 1; i < 9; i++) { const u = i / 9; tp(V, 26 * u, Math.sin(u * Math.PI) * 26, V.hv + (vt - V.hv) * u); ctx.fillRect(Math.round(PT[0]), Math.round(PT[1]), 2, 2); }
      font.draw(ctx, 'FLIP', gx, gy - gs - 9, { color: '#b8f3ff', align: 'center', outline: '#05060d' });
    }
    for (let i = 0; i < 10; i++) { // the wake: stars peel off the hero toward the camera
      const q = (rt * 2.2 + hash(i + 1300)) % 1, sp = (hash(i + 1301) - 0.5) * 90;
      rect(ctx, x + sp * q, y + 6 + q * q * 40, q > 0.6 ? 2 : 1, q > 0.6 ? 2 : 1, i % 3 ? '#7fe8ff' : '#ffffff');
    }
    const sq = g.squash || 0, sx = s * (1 + sq * 0.12), sy = s * (1 - sq * 0.12);
    const rot = Math.round(V.hrot * 8 / Math.PI) * Math.PI / 8; // (in 22.5° steps: crisp pixels, feet toward its wall)
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (Math.abs(rot % (2 * Math.PI)) > 1e-3) ctx.rotate(rot); ctx.scale(sx, sy);
    FF.fxVoid(ctx, -6, -6, rt, FF.clamp(g.chain / 10, 0, 1) * 0.7 + (this.awake ? 0.5 : 0), false);
    ctx.drawImage(heroBack, -6, -6);
    // the forgiving hurtbox, shown as the hero's glowing core (only this part of you can be hit in the tunnel)
    ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + 0.3 * Math.sin(rt * 9)).toFixed(2) + ')'; ctx.fillRect(-6 + TUN_INSET, -6 + TUN_INSET, PW - 2 * TUN_INSET, 1); ctx.fillRect(-6 + TUN_INSET, 5 - TUN_INSET, PW - 2 * TUN_INSET, 1);
    ctx.restore();
    this.tunStats && this.tunStats.hero++;
  };

  // ================================================================ 🎥 BUILD 38 — CAMERA, ACTION, DEFEAT
  // The fight's camera is a transform on the world draw (it used to copy the whole frame to zoom): the punch-in, the
  // whips on big moments (counter, heavy seal, hit, phase roar), the victory combo and the defeat push-in.
  // whip() is bookkeeping on the fight clock only (no rng, no hazard): replays are untouched.
  Fight.prototype.whip = function (dx, dy, rot, len) {
    if (this.whips.length > 5) this.whips.shift();
    this.whips.push({ t0: this.t, dx, dy, rot: rot || 0, len: len || 0.34 });
  };
  Fight.prototype.applyCam = function (ctx) {
    const g = this.g;
    if (g.settings.reduceFx || g.dead) return;
    const t = this.t;
    let dx = 0, dy = 0;
    for (const w of this.whips) {
      const e = t - w.t0;
      if (e < 0 || e > w.len) continue;
      const o = e < 0.05 ? e / 0.05 : Math.exp(-(e - 0.05) * 11) * Math.cos((e - 0.05) * 26);
      dx += w.dx * o; dy += w.dy * o;
    }
    if (this.mode === 'dying') { // the finishing combo: every hit whips the camera the other way
      const el = t - this.modeT0, n = Math.floor(el / 0.16), e = el - n * 0.16;
      if (el > 0.2 && el < 2.1) { const o = Math.exp(-e * 22); dx += (n % 2 ? 5 : -5) * o; dy += (n % 3 - 1) * 3 * o; }
    }
    dx = Math.round(dx); dy = Math.round(dy);
    if (!dx && !dy) return;
    // whatever the shifted frame uncovers is filled black (whole pixels: every blit stays on the fast, aligned path)
    ctx.fillStyle = '#05030a';
    if (dx > 0) ctx.fillRect(0, 0, dx, H); else if (dx < 0) ctx.fillRect(W + dx, 0, -dx, H);
    if (dy > 0) ctx.fillRect(0, 0, W, dy); else if (dy < 0) ctx.fillRect(0, H + dy, W, -dy);
    ctx.translate(dx, dy);
  };
  // the camera zooms (punch-in on impacts, the defeat push-in): one copy of the finished world frame, drawn scaled
  Fight.prototype.zoomCam = function (ctx) {
    const g = this.g, cv = ctx.canvas;
    if (g.settings.reduceFx) return;
    const t = this.t, tun = this.tunnelOn();
    let z = 0, fx, fy;
    if (g.dead) {
      const el = g.deadT || 0, k = ease(Math.min(1, el / 0.25)) * (1 - FF.clamp((el - 1.1) / 0.45, 0, 1)), hs = this.heroScreen();
      z = 0.45 * k; fx = hs[0]; fy = hs[1];
    } else {
      const zt = t - this.zoomT;
      if (zt >= 0 && zt < 0.45) z = this.zoomAmt * 0.18 * Math.sin((zt / 0.45) * Math.PI);
      const bs = this.bossScreen();
      fx = tun ? TUN.cx : (bs[0] + PX) / 2; fy = tun ? TUN.cy + 30 : MID;
    }
    if (z <= 0.004) return;
    const b = snap(cv);
    ctx.drawImage(b, fx - fx * (1 + z), fy - fy * (1 + z), W * (1 + z), H * (1 + z));
    snapF = -1; // the frame changed: the next effect that needs a copy takes a fresh one
  };
  // the hero's screen spot (and its scale) — 2D lane or tunnel
  Fight.prototype.heroScreen = function () {
    if (this.tunnelOn()) { const V = this.tunView(); return [V.hsx, V.hsy, V.hs]; }
    return [PX + PW / 2, this.g.p.y + PH / 2, 1];
  };
  // the hero is hidden while the defeat cinematic throws its own copy through the air
  Fight.prototype.hideHero = function () { return !!this.g.dead && (this.g.deadT || 0) > 0.22; };

  // ---------------- 💀 THE DEFEAT (build 38): ~2 s, a tap skips it. Slow-mo hit → the screen cracks → the Tyrant's
  // mocking cut-in → the hero knocked through the air in pixel frames → shockwave and debris → TRY AGAIN with the
  // checkpoint you reached. Its clock is the game's death timer (the simulation is over): nothing here can change a run.
  const DEFEAT_LEN = 2.6;
  FF.BOSS_DEFEAT_LEN = DEFEAT_LEN;
  Fight.prototype.defeatStart = function () {
    const g = this.g, hs = this.heroScreen(), L = this.def.lines.mock, l = L[(this.stats.hits + this.retries) % L.length];
    this.defeat = { x: hs[0], y: hs[1], s: hs[2], en: l[0], ar: l[1], phase: this.phase, dim: this.dim, pct: Math.round((1 - this.hp / this.hpMax) * 100), done: {} };
    this.log('defeat');
    g.sfx('stingDefeat'); g.sfx('glassCrack');
    g.emit('bossLine', { ar: l[1], len: 1.2 });
  };
  Fight.prototype.defeatTick = function (el) {
    const d = this.defeat, g = this.g;
    if (!d) return;
    const at = (k, x) => { if (el >= x && !d.done[k]) { d.done[k] = 1; return true; } return false; };
    if (at('w', 0.25)) g.sfx('whoosh');
    if (at('c', 0.38)) g.sfx('cutIn');
    if (at('s', 0.6)) { g.sfx('shatter'); g.buzz(30); }
    if (at('t', 1.55)) { g.sfx('tryAgain'); g.emit('bossBanner', { title: 'TRY AGAIN', titleAr: 'حاول تاني', sub: '', subAr: 'نقطة الحفظ: المرحلة ⁦' + (d.phase + 1) + '⁩ · ' + this.D[d.dim].nameAr, len: 1.2 }); }
  };
  Fight.prototype.skipDefeat = function () { const g = this.g; if ((g.deadT || 0) > 0.3) g.deadT = Math.max(g.deadT, DEFEAT_LEN); };
  let crackCv = null, crackAt = '';
  function crackLayer(x, y, seed) { // the cracked screen: painted once per defeat, then revealed by a growing circle
    const key = Math.round(x) + ',' + Math.round(y) + ',' + seed;
    if (crackAt === key) return crackCv;
    crackAt = key; crackCv = crackCv || FF.makeCanvas(W, H);
    const g = crackCv.getContext('2d'), r = FF.mulberry32(seed);
    g.clearRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) BW.crack(g, x, y, i / 9 * Math.PI * 2 + r() * 0.4, 60 + r() * 120, i % 3 ? 'rgba(255,255,255,0.7)' : '#bff6ff', r, i % 2 === 0);
    for (let ring = 1; ring <= 3; ring++) { // concentric breaks
      const rr = ring * 22 + r() * 8;
      for (let a = 0; a < Math.PI * 2; a += 0.09) if (r() < 0.55) rect(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85, 2, 1, 'rgba(255,255,255,0.6)');
    }
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
    return crackCv;
  }
  let tumble = null, tumbleId = null;
  Fight.prototype.renderDefeat = function (ctx, rt) {
    const g = this.g, d = this.defeat, el = g.deadT || 0, ar = isAr(g);
    if (!d) return;
    this.fxDrawn.defeat = 1;
    const x0 = d.x, y0 = d.y, fx = !fxOff(g);
    // 1) slow-mo hit: an impact frame, then a red, drained world with speed lines on the hero
    if (el < 0.07 && fx) {
      if (this.hdOn()) FF.HDBoss.invert(); else { ctx.save(); ctx.globalCompositeOperation = 'difference'; rect(ctx, 0, 0, W, H, '#ffffff'); ctx.globalCompositeOperation = 'source-over'; ctx.restore(); }
    } else if (el < 1.55) {
      const a = Math.min(1, el / 0.2) * (1 - FF.clamp((el - 1.25) / 0.3, 0, 1));
      ctx.fillStyle = 'rgba(60,0,12,' + (0.38 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      if (el < 0.6) speedLines(ctx, x0, y0, rt + el, 'rgba(255,200,210,' + (0.55 * (1 - el / 0.6)).toFixed(2) + ')', 30);
    }
    // 2) the screen cracks from the impact point
    if (el > 0.08 && el < 1.75 && fx) {
      const cv = crackLayer(x0, y0, 17 + this.stats.hits), R = ease(Math.min(1, (el - 0.08) / 0.22)) * 360;
      ctx.save(); ctx.globalAlpha = 1 - FF.clamp((el - 1.45) / 0.3, 0, 1);
      ctx.beginPath(); ctx.arc(x0, y0, R, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(cv, 0, 0); ctx.restore();
    }
    // 3) the shockwave and the debris
    if (el > 0.12 && el < 1.4) {
      const e = el - 0.12;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,233,160,' + Math.max(0, 1 - e / 0.7).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x0, y0, e * 330, e * 230, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,90,110,' + Math.max(0, 1 - e / 0.9).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x0, y0, e * 220, e * 150, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 22; i++) {
        const an = hash(i + 1500) * Math.PI * 2, sp = 90 + hash(i + 1501) * 170, s = 2 + Math.floor(hash(i + 1502) * 3);
        const px = x0 + Math.cos(an) * sp * e, py = y0 + Math.sin(an) * sp * e * 0.8 + 220 * e * e;
        if (py > H + 4) continue;
        rect(ctx, px, py, s, s, i % 3 === 0 ? '#ffd27a' : i % 3 === 1 ? '#7fe8ff' : '#2a1030');
        if (s > 3) rect(ctx, px, py, s, 1, '#ffffff');
      }
    }
    // 4) the hero is knocked through the air: a tumbling pixel sprite (quarter-turn frames) with afterimages
    if (el > 0.18 && el < 1.7) {
      if (!tumble || tumbleId !== this.def.hero) { tumbleId = this.def.hero; tumble = FF.makeCanvas(16, 16); FF.drawFlippo(tumble.getContext('2d'), 2, 2, { skin: this.def.hero || 'ivoid', face: 'dead' }); }
      const e = el - 0.18, dir = d.x > W / 2 ? 1 : -1, base = d.s;
      for (let k = 3; k >= 0; k--) {
        const ee = Math.max(0, e - k * 0.045), hx = x0 - dir * ee * 150, hy = y0 - ee * 190 + ee * ee * 260;
        const fr = Math.floor(ee / 0.07) % 4, sc = base * (1 + ee * 1.6);
        ctx.save(); ctx.globalAlpha = k ? 0.22 * (4 - k) / 4 : 1;
        ctx.translate(Math.round(hx), Math.round(hy)); ctx.rotate(fr * Math.PI / 2 * -dir); ctx.scale(sc, sc);
        ctx.drawImage(tumble, -8, -8); ctx.restore();
        if (!k && Math.floor(el * 30) % 4 === 0) star4(ctx, hx + 8 * sc, hy - 6 * sc, 3, '#ffffff');
      }
    }
    // 5) the Tyrant mocks you: a slanted cut-in panel with his face and his line
    if (el > 0.32 && el < 1.5) {
      const e = el - 0.32, k = ease(Math.min(1, e / 0.14)), out = Math.min(1, (1.5 - el) / 0.14), vis = Math.min(k, out);
      bars(ctx, vis);
      const y = 18, hh = 62, slide = (1 - k) * W;
      ctx.save(); ctx.translate(Math.round(slide), 0); ctx.globalAlpha = Math.max(0, out);
      ctx.fillStyle = '#2a0008'; ctx.beginPath(); ctx.moveTo(40, y + 8); ctx.lineTo(W, y); ctx.lineTo(W, y + hh - 8); ctx.lineTo(28, y + hh); ctx.fill();
      speedLines(ctx, 250, y + hh / 2, rt, 'rgba(255,80,100,0.5)', 24);
      rect(ctx, 40, y + 7, W - 40, 1, '#ff3a5a');
      this.portrait(ctx, 'boss', 214, y - 6, 3, rt);
      if (!ar) { font.draw(ctx, this.def.name, 52, y + 14, { color: '#ff9ab0', outline: '#05060d' }); wrap(ctx, d.en, 52, y + 28, 150, '#ffffff', 1); }
      ctx.restore();
    }
    if (el > 0.35 && el < 1.5 && !ar) font.draw(ctx, 'TAP TO SKIP', W - 4, H - 10, { color: 'rgba(255,255,255,0.6)', align: 'right', outline: '#05060d' });
    // 6) TRY AGAIN: it slams in, with the checkpoint you reached
    if (el > 1.5) {
      const e = el - 1.5, k = Math.min(1, e / 0.12), sh = e < 0.25 ? Math.round(Math.sin(e * 90) * 4 * (1 - e / 0.25)) : 0;
      ctx.fillStyle = 'rgba(5,4,16,' + Math.min(0.78, e * 4).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const r = ((e * 300 + i * 30) % 220); rect(ctx, W / 2 + Math.cos(i) * r, 74 + Math.sin(i * 1.7) * r * 0.5, 2, 1, i % 2 ? '#ff3a5a' : '#ffd27a'); }
      if (!ar) {
        const sc = k < 1 ? Math.round(7 - k * 3) : 4;
        font.draw(ctx, 'TRY AGAIN', W / 2 + sh, 58 - (sc - 4) * 4, { color: Math.floor(e * 14) % 2 && e < 0.4 ? '#ffffff' : '#ffd23f', align: 'center', outline: '#3a0006', scale: sc });
        if (e > 0.12) font.draw(ctx, 'CHECKPOINT: PHASE ' + (d.phase + 1) + ' - ' + this.D[d.dim].name, W / 2, 104, { color: '#b8f3ff', align: 'center', outline: '#05060d' });
        if (e > 0.2) font.draw(ctx, d.pct + '% DAMAGE DEALT', W / 2, 118, { color: '#ff9ab0', align: 'center', outline: '#05060d' });
      }
      // the phase track: three pips, the checkpoint you reached lit and pulsing
      if (e > 0.16) for (let i = 0; i < 3; i++) {
        const px = W / 2 - 40 + i * 40, on = i <= d.phase, cur = i === d.phase, pu = cur ? 1 + Math.round(Math.sin(rt * 10)) : 0;
        rect(ctx, px - 5 - pu, 132 - pu, 10 + pu * 2, 10 + pu * 2, on ? (cur ? '#7fe8ff' : '#3a7aa8') : '#2a0a14');
        rect(ctx, px - 4, 133, 8, 1, on ? '#ffffff' : '#3a1a24');
        if (i < 2) rect(ctx, px + 7, 136, 26, 2, i < d.phase ? '#7fe8ff' : '#3a1a24');
      }
    }
  };

  // ---------------- ACTION MOMENTS (build 38): sparks, clashes, slow-mo dodges — drawn by the FX painters below

  // ================================================================ ✨ BUILD 37 — THE ANIMATION FEAST
  // 23 animated moments. The simulation starts them with fight.fx(id, len, data) (bookkeeping on the fight clock only);
  // each painter here is (ctx, f, el, k, S): f = the effect, el = seconds since it started, k = el / len (0 when it is
  // open-ended), S = { cam, rt, bs, v, bx, by, buf, rim, cv }. A painter returns false when it drew nothing this frame.
  // Painters only draw: they never read the fight's rng nor change a hazard, so replays and proofs stay exact.
  const FX = {};
  FF.BOSS_FX = FX;
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
  const ramp = (el, len, a, b) => Math.max(0, Math.min(1, el / a, (len - el) / b));
  const fxOff = (g) => !!(g.settings && g.settings.reduceFx);
  function star4(ctx, x, y, s, col) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = col;
    ctx.fillRect(x - s, y, s * 2 + 1, 1); ctx.fillRect(x, y - s, 1, s * 2 + 1);
    if (s > 1) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1); }
  }
  function disc(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  let postBuf = null;
  let snapF = -1, snapCv = null;
  // build 38 perf: ONE copy of the finished world frame per frame, shared by every screen-space effect (the time stop,
  // ripple, void cut, tilt, rewind and the chromatic flash used to copy the whole canvas each)
  const snap = (cv) => {
    if (!postBuf) postBuf = FF.makeCanvas(W, H);
    if (snapF === FF.frameNo && snapCv === cv) return postBuf;
    snapF = FF.frameNo; snapCv = cv;
    const pg = postBuf.getContext('2d');
    pg.clearRect(0, 0, W, H);
    if (FF.HDBoss && FF.HDBoss.layersOn()) FF.HDBoss.compose(pg, W, H, cv); else pg.drawImage(cv, 0, 0, W, H, 0, 0, W, H); // b47: under HD the pixels are see-through
    return postBuf;
  };
  let miniC = null;
  function miniCleaver(ctx, x, y, a) { // painted once, then stamped rotated
    if (!miniC) {
      miniC = FF.makeCanvas(14, 7); const g = miniC.getContext('2d');
      g.fillStyle = '#2a1a10'; g.fillRect(0, 2, 4, 2); g.fillStyle = '#c8c0b0'; g.fillRect(4, 0, 9, 5);
      g.fillStyle = '#ffffff'; g.fillRect(4, 0, 9, 1); g.fillStyle = '#ff3a5a'; g.fillRect(4, 5, 9, 1);
    }
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a); ctx.drawImage(miniC, -3, -3); ctx.restore();
  }
  function galaxy(ctx, cx, cy, spin, flat, R) {
    for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 32; i++) {
      const u = i / 32, an = u * 7 + arm * Math.PI + spin * 1.6, r = 4 + u * R;
      const big = u < 0.3 ? 2 : 1;
      rect(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r * flat, big, big, u < 0.25 ? '#ffffff' : u < 0.6 ? '#b8a6ff' : '#7fe8ff');
    }
    disc(ctx, cx, cy, 6, 'rgba(184,166,255,0.35)');
    disc(ctx, cx, cy, 3, 'rgba(255,255,255,0.7)');
  }

  // ---------------- THE CRIMSON TYRANT (10)
  FX.quadSlash = { // every slash is now a four-arm combo: crescent arcs off each arm + afterimages of the lunge
    name: 'Four-arm combo slash',
    behind(ctx, f, el, k, S) {
      ctx.save();
      if (S.rim) for (let i = 3; i >= 1; i--) { ctx.globalAlpha = 0.45 * (1 - k) * (1 - i / 4); ctx.drawImage(S.rim, 0, 0, TBW, TBH, S.bx + i * 10, S.by - i * 2, TBW, TBH); }
      ctx.restore();
    },
    boss(ctx, f, el, k, S) {
      const cx = S.bs[0] - 18, cy = S.bs[1] - 12, arms = this.phase >= 1 ? 4 : 2;
      for (let a = 0; a < arms; a++) {
        const r = 30 + a * 8, a0 = -1.3 - a * 0.18, sw = 2.7 * ease(k * 2.4 - a * 0.22);
        if (sw <= 0) continue;
        for (let s = 0; s <= 20; s++) {
          const u = s / 20, an = a0 - sw * u, hd = u > 0.85;
          ctx.globalAlpha = (1 - k) * (0.25 + 0.75 * u);
          rect(ctx, cx + Math.cos(an) * r - 1, cy + Math.sin(an) * r * 0.8 - 1, hd ? 3 : 2, hd ? 3 : 2, hd ? '#ffffff' : a >= 2 ? '#ff9ab0' : '#ff3a5a');
        }
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.fissure = { // the floor splits from the Tyrant's feet to the spot where the pillar will erupt (inside its warning)
    name: 'Ground-splitting fissure',
    mid(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      const h = f.h, t = this.t, px = h.wx - S.cam + 7, x0 = 250;
      const run = ease(FF.clamp((t - h.t0) / (h.tl - h.t0), 0, 1)), tip = x0 + (px - x0) * run;
      const fl = h.side === 'f', y = fl ? F : C, fade = t > h.tl ? 1 - (t - h.tl) / 0.3 : 1;
      if (tip >= x0 - 1 || fade <= 0) return false;
      ctx.globalAlpha = fade;
      ctx.fillStyle = 'rgba(255,90,26,0.22)'; ctx.fillRect(Math.round(tip), fl ? y - 6 : y, Math.round(x0 - tip), 6);
      for (let x = Math.floor(tip); x < x0; x += 2) {
        const wx = x + S.cam, d = Math.round(Math.abs(Math.sin(wx * 0.45 + f.seed)) * 3) + (hash(Math.floor(wx / 2) + f.seed) < 0.2 ? 2 : 0);
        rect(ctx, x, fl ? y - d - 1 : y, 2, d + 1, x - tip < 8 ? '#ffd27a' : '#ff5a1a');
      }
      for (let i = 0; i < 5; i++) { const q = (S.rt * 3 + i / 5) % 1; rect(ctx, tip + (hash(i + f.seed) - 0.5) * 8, fl ? y - 2 - q * 16 : y + 1 + q * 16, 1, 1, i % 2 ? '#ffd27a' : '#ffffff'); }
      ctx.globalAlpha = 1;
    }
  };
  const tornado = (front) => function (ctx, f, el, k, S) {
    const n = 6 + this.phase * 2, a = ramp(el, f.len, 0.2, 0.25), cx = S.bs[0] - 6, cy = S.bs[1] - 44;
    if (a <= 0) return false;
    ctx.globalAlpha = a;
    if (!front) { // the wind funnel
      ctx.fillStyle = 'rgba(255,200,200,0.35)';
      for (let i = 0; i < 5; i++) {
        const rr = 12 + i * 6, yy = cy + 10 - i * 6;
        for (let j = 0; j < 10; j++) { const an = el * (9 + i) + j / 10 * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(an) * rr), Math.round(yy + Math.sin(an) * 3), 3, 1); }
      }
    }
    for (let i = 0; i < n; i++) {
      const an = el * 13 + (i / n) * Math.PI * 2, sn = Math.sin(an);
      if ((sn > 0) !== front) continue;
      const lvl = i % 3, rr = 18 + lvl * 9;
      miniCleaver(ctx, cx + Math.cos(an) * rr, cy - lvl * 7 + sn * 6, an * 2 + i);
    }
    ctx.globalAlpha = 1;
  };
  FX.cleaverTornado = { name: 'Cleaver tornado', behind: tornado(false), boss: tornado(true) };
  FX.chainWhip = { // each slash wave is a blade on a chain: it coils at the hand during the warning, then whips out
    name: 'Chained-blade whip',
    mid(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      const h = f.h, t = this.t;
      if (h.dead) return false;
      const hx = S.bs[0] - 44, hy = S.bs[1] - 14, fl = h.side === 'f', wy = fl ? F - 11 : C + 11;
      if (t < h.tl) {
        const q = (t - h.t0) / (h.tl - h.t0);
        for (let i = 0; i < 12; i++) { const an = el * (8 + q * 20) + i / 12 * Math.PI * 2; rect(ctx, hx + Math.cos(an) * 8, hy + Math.sin(an) * 5, 2, 2, i % 2 ? '#9a8a80' : '#3a2a28'); }
        return;
      }
      const sx = h.sx0 - h.v * (t - h.tl) + 14;
      if (sx < PX + 30) return false;
      const len = Math.hypot(hx - sx, hy - wy), n = Math.max(2, Math.floor(len / 4)), sag = Math.min(18, len * 0.12) * (fl ? 1 : -1);
      for (let i = 0; i <= n; i++) {
        const u = i / n, x = hx + (sx - hx) * u, y = hy + (wy - hy) * u + Math.sin(u * Math.PI) * sag + Math.sin(u * 20 - t * 30) * (1 - u) * 1.5;
        rect(ctx, x, y, 2, 2, i % 2 ? '#9a8a80' : '#3a2a28');
        if (i % 6 === 0) rect(ctx, x, y, 1, 1, '#ff3a5a');
      }
      const e = t - h.tl;
      if (e < 0.1) for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; rect(ctx, hx + Math.cos(an) * (4 + e * 90), hy + Math.sin(an) * (4 + e * 90), 1, 1, '#ffffff'); }
    }
  };
  FX.roarRings = { // the roar is visible: rings of pressure and streaks blasting out of the jaw
    name: 'Roaring shockwave rings',
    front(ctx, f, el, k, S) {
      const mx = S.bs[0] - 12, my = S.bs[1] - 28;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const e = el - i * 0.13; if (e <= 0) continue;
        const r = e * 240, a = (1 - k) * Math.max(0, 1 - r / 300);
        if (a <= 0) continue;
        ctx.strokeStyle = (i % 2 ? 'rgba(255,90,110,' : 'rgba(255,210,150,') + a.toFixed(2) + ')';
        ctx.beginPath(); ctx.ellipse(mx, my, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(255,220,200,' + (0.5 * (1 - k)).toFixed(2) + ')';
      for (let i = 0; i < 14; i++) {
        const an = hash(i + 70) * Math.PI * 2, r0 = 10 + el * 200 + hash(i + 71) * 30;
        for (let s = 0; s < 14; s += 2) ctx.fillRect(Math.round(mx + Math.cos(an) * (r0 + s)), Math.round(my + Math.sin(an) * (r0 + s) * 0.7), 2, 1);
      }
    }
  };
  FX.meteor = { // phase 3: the cleavers come down as meteors of molten iron (through the dark above/below the lane)
    name: 'Molten iron meteor',
    top(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      const h = f.h, t = this.t, x = h.wx - S.cam + 4, fl = h.side === 'f', hit = h.tl - 0.1;
      if (t < hit) {
        const q = 1 - (hit - t) / 0.35; if (q < 0) return false;
        const y0 = fl ? -24 : H + 24, y1 = fl ? C : F;
        for (let i = 9; i >= 0; i--) {
          const u = Math.max(0, q - i * 0.035), tx = x + 80 * (1 - u), ty = y0 + (y1 - y0) * u, sz = Math.max(1, 6 - i * 0.5);
          rect(ctx, tx - sz / 2, ty - sz / 2, sz, sz, i < 1 ? '#ffffff' : i < 3 ? '#ffd27a' : i < 6 ? '#ff8a00' : '#7a1a04');
        }
        return;
      }
      const e = t - h.tl;
      if (e < 0 || e > 0.45) return false;
      const surf = fl ? F : C, a = 1 - e / 0.45, sgn = fl ? 1 : -1;
      ctx.fillStyle = 'rgba(255,140,40,' + (0.5 * a).toFixed(2) + ')'; ctx.fillRect(Math.round(x - 10), fl ? surf - 3 : surf, 28, 3);
      for (let i = 0; i < 12; i++) {
        const vx = (hash(i + h.wx) - 0.5) * 110, vy = -50 - hash(i + 3 + h.wx) * 40;
        const dy = Math.min(0, vy * e + 200 * e * e);
        rect(ctx, x + 4 + vx * e, surf + dy * sgn, 2, 2, i % 3 ? '#ff8a00' : '#ffd27a');
      }
    }
  };
  FX.crimsonMoon = { // phase 2: a vast crimson moon climbs over the citadel and stays
    name: 'Crimson moon rising',
    sky(ctx, f, el, k, S) {
      if (S.v !== 1 && S.v !== 3) return false;
      const mir = S.v === 3, q = ease(el / 2.4), x = 72, y0 = mir ? MID : F + 20, y = Math.round(y0 - (y0 - (mir ? 52 : 62)) * q), r = mir ? 18 : 22, pu = 0.5 + 0.5 * Math.sin(S.rt * 2.2);
      if (mir) { ctx.save(); ctx.globalAlpha = 0.35; ctx.translate(0, 2 * MID); ctx.scale(1, -1); FX.crimsonMoon.disk(ctx, x, y, r, pu, S); ctx.restore(); }
      FX.crimsonMoon.disk(ctx, x, y, r, pu, S);
    },
    disk(ctx, x, y, r, pu, S) {
      disc(ctx, x, y, r + 14, 'rgba(255,40,70,' + (0.08 + 0.05 * pu).toFixed(3) + ')');
      disc(ctx, x, y, r + 6, 'rgba(255,60,90,0.16)');
      disc(ctx, x, y, r, '#a01232');
      disc(ctx, x - 3, y - 3, r - 4, '#d82a46');
      for (let i = 0; i < 7; i++) disc(ctx, x + (hash(i + 40) - 0.5) * r * 1.3, y + (hash(i + 41) - 0.5) * r * 1.3, 1.5 + hash(i + 42) * 3, '#8a0c26');
      ctx.strokeStyle = 'rgba(255,190,200,0.55)'; ctx.beginPath(); ctx.arc(x, y, r - 0.5, -1.2, 1.0); ctx.stroke();
      const cl = ((S.rt * 9) % 140) - 40; // a storm cloud drifting across its face
      ctx.fillStyle = 'rgba(20,6,30,0.65)'; ctx.fillRect(Math.round(x - 40 + cl), y + 4, 46, 4); ctx.fillRect(Math.round(x - 30 + cl), y + 8, 30, 3);
    }
  };
  FX.arenaTilt = { // phase 3: the arena lurches; the whole world rolls and rights itself (no attack runs meanwhile)
    name: 'Arena tilt',
    post(ctx, f, el, k, S) {
      if (fxOff(this.g)) return false;
      const ang = (0.075 + 0.012 * Math.sin(el * 11)) * ramp(el, f.len, 0.3, 0.55);
      const b = snap(S.cv);
      ctx.save(); // (b38 perf: no black underlay needed — the scale below always covers the corners)
      ctx.translate(W / 2, H / 2); ctx.rotate(ang); const sc = 1 + Math.abs(ang) * 1.9; ctx.scale(sc, sc);
      ctx.drawImage(b, -W / 2, -H / 2);
      ctx.restore();
    }
  };
  FX.shadowClones = { // phase 3: two shadow kings stalk behind the Tyrant, echoing its moves
    name: 'Shadow clones',
    behind(ctx, f, el, k, S) {
      if (!S.buf) return false; // (b47: the HD layer paints its own shadow kings)
      const sh = this._shd || (this._shd = FF.makeCanvas(170, 170)), sg = sh.getContext('2d'), bucket = this._bbK;
      if (this._shdT !== bucket) { // the shadows lag the king a little anyway: refresh their silhouette at 20 Hz
        this._shdT = bucket;
        // build 38: the shadow kings stand further back (3/4 size, painted pre-scaled: half the pixels to blend)
        sg.clearRect(0, 0, 170, 170); sg.imageSmoothingEnabled = false; sg.drawImage(S.buf, 0, 0, TBW, TBH, 0, 0, SCW, SCH);
        sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#16000c'; sg.fillRect(0, 0, SCW, SCH); sg.globalCompositeOperation = 'source-over';
      }
      const a = Math.min(1, el / 0.6);
      for (let i = 0; i < 2; i++) {
        const ox = (i ? 52 : 44) + Math.sin(this.t * 2.2 + i * 2) * 4, oy = (i ? 34 : -18) + Math.sin(this.t * 1.7 + i) * 3;
        ctx.globalAlpha = a * (0.5 + 0.15 * Math.sin(S.rt * 7 + i));
        ctx.drawImage(sh, 0, 0, SCW, SCH, Math.round(S.bx + ox), Math.round(S.by + oy), SCW, SCH);
        ctx.globalAlpha = a;
        for (const ex of [53, 64]) rect(ctx, S.bx + ox + ex, S.by + oy + 26, 3, 2, i ? '#b45cff' : '#ff8a00');
        for (let j = 0; j < 4; j++) { const q = (S.rt * 0.8 + j / 4 + i * 0.5) % 1; rect(ctx, S.bx + ox + 60 + hash(j + i * 9) * 50, S.by + oy + 70 - q * 50, 2, 2, 'rgba(120,40,160,' + (0.5 * (1 - q)).toFixed(2) + ')'); }
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.deathThroes = { // the fall: molten cracks race over the body, then it breaks into tumbling burning pieces
    name: 'Death throes',
    body(ctx, f, el, k, S) {
      const T = 28, cx = 84, cy = 78, br = el - 0.9, shake = el < 2.2 ? Math.round(Math.sin(el * 70) * 1.5) : 0;
      const fade = 1 - FF.clamp((el - 2.6) / 0.7, 0, 1);
      if (fade <= 0) return;
      ctx.globalAlpha = fade;
      if (br <= 0) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(S.rim, S.bx + dx + shake, S.by + dy);
        ctx.drawImage(S.buf, S.bx + shake, S.by);
      } else {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
          const sx = i * T, sy = j * T, mx = sx + T / 2 - cx, my = sy + T / 2 - cy, d = Math.hypot(mx, my) || 1;
          const e = Math.max(0, br - hash(i + j * 6) * 0.5);
          const ox = (mx / d) * e * e * 70 + mx * e * 0.4, oy = (my / d) * e * e * 40 + e * e * 70, rot = (hash(i * 7 + j) - 0.5) * e * 4;
          ctx.save(); ctx.translate(Math.round(S.bx + sx + T / 2 + ox), Math.round(S.by + sy + T / 2 + oy)); ctx.rotate(rot);
          ctx.drawImage(S.buf, sx, sy, T, T, -T / 2, -T / 2, T, T);
          ctx.restore();
          if (d < 50 && e > 0) for (let q = 1; q < 4; q++) rect(ctx, S.bx + sx + T / 2 + ox * (1 - q * 0.12), S.by + sy + T / 2 + oy * (1 - q * 0.12) - q * 2, 2, 2, q === 1 ? '#ffd27a' : '#ff5a1a');
        }
      }
      if (el > 0.2 && el < 1.5) {
        const r = FF.mulberry32(91);
        for (let i = 0; i < 8; i++) BW.crack(ctx, S.bx + cx - 4 + r() * 8, S.by + cy - 14 + r() * 10, r() * Math.PI * 2, Math.min(40, (el - 0.2) * 40), i % 2 ? '#ffd27a' : '#ffffff', r, false);
      }
      ctx.globalAlpha = 1;
    }
  };

  const ROCKS = {};
  function rockSprite(key, sz, ang, body, edge, top) { // a small rotated chunk, painted once (16x16, centred)
    let c = ROCKS[key];
    if (!c) {
      c = ROCKS[key] = FF.makeCanvas(16, 16); const g = c.getContext('2d');
      g.translate(8, 8); g.rotate(ang);
      g.fillStyle = body; g.fillRect(-sz / 2, -sz / 2, sz, sz * 0.8);
      g.fillStyle = edge; if (top) g.fillRect(-sz / 2, -sz / 2, sz, 1); else g.fillRect(-sz / 2, sz * 0.3 - 1, sz, 1);
    }
    return c;
  }
  // ---------------- INFINITY VOID (6)
  FX.starDash = { // every flip leaves a starburst where you left and a line of twinkling stars to where you land
    name: 'Starburst dash trail',
    front(ctx, f, el, k, S) {
      const p = this.g.p;
      if (el < 0.22 || f.x1 === undefined) { f.x1 = p.x; f.y1 = p.y; } // render-side cache of the landing spot
      let x0 = f.x0 - S.cam + 6, y0 = f.y0 + 6, x1 = f.x1 - S.cam + 6, y1 = f.y1 + 6;
      const fade = 1 - k;
      if (S.tun) { // the tunnel: the same world points, projected
        const a = this.tunPt(f.x0 + 6, f.y0 + 6); if (!a) return false; x0 = a[0]; y0 = a[1];
        const b = this.tunPt(f.x1 + 6, f.y1 + 6); x1 = b ? b[0] : S.hx; y1 = b ? b[1] : S.hy;
      }
      if (el < 0.16) {
        const r = 3 + el * 70;
        for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + 0.39; for (let s = r * 0.5; s < r; s += 2) rect(ctx, x0 + Math.cos(an) * s, y0 + Math.sin(an) * s, 1, 1, i % 2 ? '#b8a6ff' : '#ffffff'); }
      }
      for (let i = 0; i < 12; i++) {
        const u = i / 11, tw = (Math.floor(S.rt * 20) + i) % 3 === 0;
        ctx.globalAlpha = fade * (0.4 + 0.6 * u);
        star4(ctx, x0 + (x1 - x0) * u + Math.sin(i * 2.1) * 3, y0 + (y1 - y0) * u, tw ? 2 : 1, i % 3 === 0 ? '#7fe8ff' : i % 3 === 1 ? '#b8a6ff' : '#ffffff');
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.timeFreeze = { // a perfect dodge stops time: the world turns grey and holds; only the hero's bubble keeps colour
    name: 'Time-freeze bubble',
    post(ctx, f, el, k, S) {
      if (fxOff(this.g)) return false;
      const cx = S.hx, cy = S.hy, R = 26 * Math.min(1.6, S.hs), b = snap(S.cv);
      ctx.save();
      ctx.globalCompositeOperation = 'saturation'; rect(ctx, 0, 0, W, H, '#808080');
      ctx.globalCompositeOperation = 'multiply'; rect(ctx, 0, 0, W, H, '#c0c8dc');
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(b, 0, 0); ctx.restore();
      for (let i = 0; i < 40; i++) { const an = i / 40 * Math.PI * 2; rect(ctx, cx + Math.cos(an) * R, cy + Math.sin(an) * R, 1, 1, i % 10 ? '#7fe8ff' : '#ffffff'); }
      for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; rect(ctx, cx + Math.cos(an) * (R - 4), cy + Math.sin(an) * (R - 4), 1, 1, '#b8f3ff'); }
      const hand = (performance.now() / 90) % (Math.PI * 2); // the clock hand ticks in real time while the world stands still
      for (let s = 0; s < R - 6; s += 2) rect(ctx, cx + Math.cos(hand) * s, cy + Math.sin(hand) * s, 1, 1, '#ffffff');
      font.draw(ctx, 'TIME STOP', W / 2, 30, { color: '#b8f3ff', align: 'center', outline: '#05060d' });
    }
  };
  FX.starShards = { // seals and counters in a row gather star shards around the hero: more, bigger, faster
    name: 'Orbiting star shards',
    front(ctx, f, el, k, S) {
      const p = this.g.p, since = this.t - this.streakT, live = since < 5 ? this.streak : 0;
      if (!live || this.mode === 'reward' || this.mode === 'won') return false;
      const n = Math.min(10, live), cx = S.hx, cy = S.hy, R = (11 + n * 0.9) * S.hs, sz = 1 + Math.min(2, Math.floor(live / 4)) + (S.hs > 1 ? 1 : 0);
      ctx.globalAlpha = Math.min(1, (5 - since) / 0.6);
      for (let i = 0; i < n; i++) {
        const an = S.rt * (3 + n * 0.25) + i / n * Math.PI * 2;
        const x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R * 0.6;
        rect(ctx, x - Math.cos(an) * 3, y, 1, 1, 'rgba(127,232,255,0.5)');
        star4(ctx, x, y, sz, i % 2 ? '#7fe8ff' : '#ffe9a0');
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.perfectRipple = { // after the time stop, space itself ripples out from the hero
    name: 'Perfect-flip space ripple',
    post(ctx, f, el, k, S) {
      if (fxOff(this.g)) return false;
      const cx = S.hx, cy = S.hy, r = 10 + el * 240, A = 3 * (1 - k), b = snap(S.cv), lim = Math.min(r, 90);
      for (let dy = -lim; dy <= lim; dy += 4) {
        const y = Math.round(cy + dy); if (y < 0 || y > H - 4) continue;
        const xo = Math.sqrt(Math.max(0, r * r - dy * dy)), sh = Math.round(A * Math.sin(dy * 0.4 + el * 40));
        for (const x of [cx - xo, cx + xo]) {
          const sx = Math.round(FF.clamp(x - 8, 0, W - 16));
          if (x > -12 && x < W + 12) ctx.drawImage(b, sx, y, 16, 4, sx + sh, y, 16, 4);
        }
      }
      ctx.strokeStyle = 'rgba(184,243,255,' + (0.6 * (1 - k)).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.9, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(184,166,255,' + (0.4 * (1 - k)).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.75, r * 0.68, 0, 0, Math.PI * 2); ctx.stroke();
    }
  };
  FX.voidCut = { // a heavy seal splits the whole screen along a diagonal through the Tyrant, the void showing between
    name: 'Void cut',
    post(ctx, f, el, k, S) {
      if (fxOff(this.g)) return false;
      const o = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 4, b = snap(S.cv);
      const ax = S.bs[0] + 50, ay = -10, bx = S.bs[0] - 150, by = H + 10;
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; // normal (points up-right... or down-left)
      ctx.lineWidth = Math.ceil(o * 2 + 3); ctx.strokeStyle = '#020010'; // the void band (the halves cover the rest)
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) { const u = hash(i + f.seed % 97), w = (hash(i + 5) - 0.5) * o * 2; rect(ctx, ax + dx * u + nx * w, ay + dy * u + ny * w, 1, 1, i % 3 ? '#b8a6ff' : '#ffffff'); }
      for (const sgn of [1, -1]) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
        const fx2 = nx * sgn * 400, fy2 = ny * sgn * 400;
        ctx.lineTo(bx + fx2, by + fy2); ctx.lineTo(ax + fx2, ay + fy2); ctx.closePath(); ctx.clip();
        ctx.drawImage(b, Math.round(nx * sgn * o), Math.round(ny * sgn * o));
        ctx.restore();
      }
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(184,166,255,' + (0.7 * (1 - k)).toFixed(2) + ')';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
  };
  FX.galaxyFinisher = { // the finishing blow: the camera pulls out into deep space while a galaxy swallows the king
    name: 'Galaxy finisher',
    post(ctx, f, el, k, S) {
      if (fxOff(this.g)) return false;
      const z = el < 0.6 ? ease(el / 0.6) : el < 1.9 ? 1 : Math.max(0, 1 - (el - 1.9) / 0.35);
      if (z <= 0) return false;
      const b = snap(S.cv), s = 1 - 0.26 * z, fx = S.bs[0] - 20, fy = S.bs[1] - 10;
      { // deep space only where the shrinking frame uncovers it (build 38 perf: four strips, not a full-screen fill)
        const x0 = Math.floor(fx - fx * s), y0 = Math.floor(fy - fy * s), x1 = Math.ceil(x0 + W * s), y1 = Math.ceil(y0 + H * s);
        ctx.fillStyle = '#03021a'; ctx.fillRect(0, 0, W, y0); ctx.fillRect(0, y1, W, H - y1); ctx.fillRect(0, y0, x0, y1 - y0); ctx.fillRect(x1, y0, W - x1, y1 - y0);
      }
      for (let i = 0; i < 28; i++) rect(ctx, hash(i + 300) * W, hash(i + 301) * H, 1, 1, (Math.floor(S.rt * 6) + i) % 7 ? '#5a5a9a' : '#ffffff');
      galaxy(ctx, fx, fy, el, 0.55, 170);
      const dw = W * s, dh = H * s, dx = fx - fx * s, dy = fy - fy * s;
      ctx.drawImage(b, dx, dy, dw, dh);
      ctx.strokeStyle = '#7fe8ff'; ctx.strokeRect(Math.round(dx) - 0.5, Math.round(dy) - 0.5, Math.round(dw) + 1, Math.round(dh) + 1);
    },
    boss(ctx, f, el, k, S) {
      const a = Math.min(1, el / 0.4) * (1 - FF.clamp((el - 2.4) / 0.8, 0, 1));
      if (a <= 0) return false;
      ctx.globalAlpha = a; galaxy(ctx, S.bs[0] - 4, S.bs[1] - 14, el * 2, 0.5, 70 * (1 - el / 4)); ctx.globalAlpha = 1;
    }
  };

  // ---------------- THE CITADEL ALIVE (7)
  FX.thunderStrike = { // lightning lances down onto the Tyrant's crown (charging the beam, or answering a phase roar)
    name: 'Lightning strike + screen flash',
    boss(ctx, f, el, k, S) {
      if (!(el < 0.07 || (el > 0.13 && el < 0.22) || (el > 0.27 && el < 0.31))) return false;
      const tx = S.bs[0] - 6, ty = S.bs[1] - 60;
      BW.strike(ctx, f.seed, tx + (hash(f.seed) - 0.5) * 80, tx, ty, '#ffffff', 'rgba(210,190,255,0.55)');
      for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2; rect(ctx, tx + Math.cos(an) * (5 + el * 40), ty + Math.sin(an) * (4 + el * 30), 2, 2, '#f2e6ff'); }
    },
    post(ctx, f, el, k, S) {
      if (el > 0.2 || fxOff(this.g)) return false;
      ctx.fillStyle = el < 0.05 ? 'rgba(255,255,255,0.45)' : 'rgba(220,200,255,' + (0.22 * (1 - el / 0.2)).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  };
  FX.debrisFall = { // phase 3: chunks of the citadel rain down at three depths (parallax), the nearest hit the ceiling
    name: 'Falling debris parallax',
    back(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      ctx.globalAlpha = Math.min(1, el / 0.8);
      for (let i = 0; i < 18; i++) {
        const d = i % 3, sz = 3 + d * 3, sp = 26 + d * 30 + hash(i) * 20, par = 0.15 + d * 0.2;
        const x = ((hash(i + 21) * 600 - S.cam * par) % (W + 40) + W + 40) % (W + 40) - 20;
        const y = ((S.rt * sp + hash(i + 33) * (H + 40)) % (H + 40)) - 20;
        const an = S.rt * (1 + d) * (hash(i + 5) - 0.5) * 3, fr = ((Math.round(an / (Math.PI / 4)) % 8) + 8) % 8; // 8 tumble frames
        ctx.drawImage(rockSprite('df' + d + ':' + fr, sz, fr * Math.PI / 4, d === 2 ? '#1a0604' : d ? '#2a0c08' : '#3a140c', '#ff6a00', false), Math.round(x) - 8, Math.round(y) - 8);
        if (d === 2) { ctx.fillStyle = 'rgba(255,120,40,0.25)'; ctx.fillRect(Math.round(x), Math.round(y - 10), 1, 8); }
      }
      ctx.globalAlpha = 1;
    },
    front(ctx, f, el, k, S) { // big near rocks, only in the dark above the ceiling: they smash on its top
      for (let i = 0; i < 4; i++) {
        const per = 1.3 + hash(i + 60) * 0.8, q = ((S.rt + hash(i + 61) * per) % per) / per, x = 30 + hash(i + 62 + Math.floor((S.rt + hash(i + 61) * per) / per)) * 260;
        const y = -12 + (C - 6 + 12) * Math.min(1, q * 1.4);
        if (q < 0.72) { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(q * 6); rect(ctx, -5, -4, 10, 8, '#0e0404'); rect(ctx, -5, 3, 10, 1, '#ff6a00'); ctx.restore(); }
        else { const e = (q - 0.72) / 0.28; for (let j = 0; j < 6; j++) rect(ctx, x + (j - 2.5) * e * 8, C - 6 - Math.sin(e * Math.PI) * (4 + j % 3 * 3), 2, 2, j % 2 ? '#3a1208' : '#ff8a00'); }
      }
    }
  };
  FX.emberStorm = { // once the Tyrant is awake, gusts of embers storm across the citadel behind the lane
    name: 'Ember storm',
    back(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      const q = Math.sin(k * Math.PI), n = Math.round(80 * q);
      ctx.fillStyle = 'rgba(255,90,30,' + (0.06 * q).toFixed(3) + ')'; ctx.fillRect(0, C, W, F - C);
      for (let pass = 0; pass < 2; pass++) { // one colour per pass: far fewer style changes
        ctx.fillStyle = pass ? 'rgba(255,210,122,0.9)' : 'rgba(255,138,58,0.8)';
        for (let i = pass; i < n; i += 2) {
          const sp = 380 + hash(i + 1) * 220, x = W + 20 - ((el * sp + hash(i + 2) * W) % (W + 60));
          const y = C + 4 + hash(i) * (F - C - 8) + Math.sin(el * 3 + i) * 6 + (W - x) * 0.08, l = 3 + Math.round(hash(i + 4) * 6);
          ctx.fillRect(Math.round(x), Math.round(y), l, 1);
        }
      }
    }
  };
  FX.lavaGeyser = { // in the distance, behind the arches, geysers of lava burst and rain back down
    name: 'Lava geysers',
    between(ctx, f, el, k, S) {
      const x = Math.round(f.px - (S.cam - f.cam0) * 0.4);
      if (x < -20 || x > W + 20) return false;
      const up = ease(el / 0.3), down = el > f.len - 0.5 ? (f.len - el) / 0.5 : 1, hh = 64 * up * down, base = F - 8;
      ctx.globalAlpha = 0.75;
      for (let y = 0; y < hh; y += 2) { const w = 3 + Math.round(Math.sin(y * 0.4 + S.rt * 20)) + (y > hh - 8 ? 2 : 0); rect(ctx, x - w, base - y, w * 2, 2, y > hh - 6 ? '#ffd27a' : y % 6 ? '#ff5a1a' : '#c2381e'); }
      for (let i = 0; i < 10; i++) {
        const e = (el * 1.4 + hash(i + 7)) % 1, vx = (hash(i + 3) - 0.5) * 40;
        rect(ctx, x + vx * e, base - hh - 16 * Math.sin(e * Math.PI) + e * e * hh * 0.9, 2, 2, i % 2 ? '#ff8a00' : '#ffd27a');
      }
      for (let i = 0; i < 3; i++) disc(ctx, x + (i - 1) * 6, base - 2 - (el * 10 + i * 3) % 10, 4, 'rgba(255,200,160,0.18)');
      ctx.globalAlpha = 1;
    }
  };
  FX.pillarCollapse = { // the arena collapses: three colossal columns topple and crash in a burst of dust
    name: 'Collapsing pillars',
    back(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      for (let i = 0; i < 3; i++) {
        const e = el - 0.1 - i * 0.15; if (e < 0) continue;
        const bx = 70 + i * 92, dir = i === 1 ? 1 : -1, ang = dir * Math.min(1.45, e * e * 2.6), fade = 1 - FF.clamp((e - 0.85) / 0.3, 0, 1);
        if (fade <= 0) continue;
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(bx, F); ctx.rotate(ang);
        rect(ctx, -8, -104, 16, 104, '#22080e'); rect(ctx, -8, -104, 1, 104, '#6a1a2a');
        for (let y = -100; y < 0; y += 13) rect(ctx, -8, y, 16, 1, '#14040a');
        rect(ctx, -11, -110, 22, 8, '#2e0c16'); rect(ctx, -11, -110, 22, 1, '#6a1a2a');
        for (let y = -96; y < -8; y += 4) rect(ctx, -1 + Math.round(Math.sin(y * 0.3) * 2), y, 1, 3, '#ff5a1a');
        ctx.restore();
        if (e > 0.72) { const q = (e - 0.72) / 0.45; for (let j = 0; j < 10; j++) disc(ctx, bx + dir * j * 11, F - 4 - hash(j + i * 10) * 6 - q * 8, 3 + q * 7, 'rgba(120,70,60,' + (0.4 * (1 - q)).toFixed(2) + ')'); }
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.aurora = { // VOID AWAKENED: a star-blue aurora ripples over the burning hellscape sky
    name: 'Aurora sky',
    sky(ctx, f, el, k, S) {
      if (S.v !== 2 && S.v !== 5) return false;
      const a = Math.min(1, el / 1.5), cv = this._aur || (this._aur = FF.makeCanvas(W, 90)), bucket = Math.floor(S.rt * 20) + (a < 1 ? 0.5 : 0);
      if (this._aurT !== bucket) { this._aurT = bucket; const ag = cv.getContext('2d'); ag.clearRect(0, 0, W, 90); FX.aurora.paint(ag, a, S); }
      ctx.drawImage(cv, 0, 18, W, 72, 0, 18, W, 72);
    },
    paint(ctx, a, S) {
      for (let x = 0; x < W; x += 3) {
        const wx = x + S.cam * 0.05;
        const y = Math.round(40 + Math.sin(wx * 0.03 + S.rt * 0.9) * 9 + Math.sin(wx * 0.011 - S.rt * 0.5) * 7);
        const hh = 22 + Math.sin(wx * 0.05 + S.rt * 1.3) * 9, sh = 0.5 + 0.5 * Math.sin(wx * 0.08 - S.rt * 2);
        ctx.globalAlpha = a * (0.12 + 0.2 * sh); ctx.fillStyle = '#7fe8ff'; ctx.fillRect(x, y, 3, Math.round(hh * 0.4));
        ctx.globalAlpha = a * (0.08 + 0.14 * sh); ctx.fillStyle = '#b8a6ff'; ctx.fillRect(x, y + Math.round(hh * 0.4), 3, Math.round(hh * 0.6));
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.weatherFront = { // each phase brings its weather in as a visible front: a rain wall (2), an ash wall (3)
    name: 'Weather front per phase',
    back(ctx, f, el, k, S) {
      if (S.tun) return false; // (2D lane art: the tunnel draws its own)
      const edge = W + 30 - (W + 160) * ease(k), rain = f.ph === 1;
      ctx.fillStyle = rain ? 'rgba(200,170,255,0.14)' : 'rgba(180,150,140,0.16)'; ctx.fillRect(Math.round(edge - 12), C, 18, F - C);
      for (let i = 0; i < 90; i++) {
        const x = edge + hash(i) * 200; if (x > W) continue;
        const y = ((S.rt * (rain ? 320 : 60) + hash(i + 9) * (F - C)) % (F - C)) + C;
        if (rain) rect(ctx, x, y, 1, 6, 'rgba(230,210,255,0.55)');
        else rect(ctx, x + Math.sin(S.rt * 3 + i) * 3, y, 2, 2, i % 3 ? 'rgba(160,150,150,0.6)' : 'rgba(255,140,60,0.6)');
      }
      if (rain && el > 0.3 && el < 0.36) BW.bolt(ctx, 99, Math.round(edge), '#f2e6ff');
    }
  };

  // ---------------- HEARTS, CHECKPOINTS & PAYOFF (build 37, owner: fun first)
  FX.sealImpact = { // every seal that lands pays off big: a starburst, a cross-cut and shards off the Tyrant
    name: 'Seal impact starburst',
    boss(ctx, f, el, k, S) {
      const cx = S.bs[0] - 30, cy = S.bs[1] - 10, big = f.dmg >= 6, R = (10 + f.dmg * 4) * ease(Math.min(1, el / 0.25));
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 12; i++) {
        const an = i / 12 * Math.PI * 2 + (f.seed % 7), len = R * (i % 2 ? 0.6 : 1);
        for (let s = len * 0.4; s < len; s += 2) rect(ctx, cx + Math.cos(an) * s, cy + Math.sin(an) * s, 2, 2, i % 3 ? '#7fe8ff' : '#ffffff');
      }
      if (el < 0.3) { const c = (el / 0.3) * 26; for (let s = -c; s < c; s += 1) { rect(ctx, cx + s, cy + s * 0.8, 2, 1, '#ffffff'); rect(ctx, cx + s, cy - s * 0.8, 2, 1, big ? '#ffe9a0' : '#b8a6ff'); } }
      for (let i = 0; i < 10; i++) { const an = hash(i + f.seed) * Math.PI * 2, d = el * (90 + hash(i + 2) * 80); rect(ctx, cx + Math.cos(an) * d, cy + Math.sin(an) * d + el * el * 120, 2, 2, i % 2 ? '#ff3a5a' : '#2a0a10'); }
      ctx.lineWidth = 2; ctx.strokeStyle = big ? '#ffe9a0' : '#b8f3ff';
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.3, R, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      if (big) font.draw(ctx, 'CRITICAL!', cx, cy - 34 - el * 10, { color: '#ffe9a0', align: 'center', outline: '#05060d' });
      ctx.globalAlpha = 1;
    }
  };
  FX.heartShatter = { // a hit costs a heart: it pops over the hero and breaks in two
    name: 'Heart shatter',
    front(ctx, f, el, k, S) {
      const x = S.hx - 4, y = (S.tun ? S.hy - 6 : f.y) - 14 - el * 16, sp = el * 14;
      ctx.globalAlpha = 1 - k;
      heartHalf(ctx, x - sp, y + el * el * 40, 0); heartHalf(ctx, x + 4 + sp, y + el * el * 40, 1);
      for (let i = 0; i < 8; i++) rect(ctx, x + 4 + Math.cos(i) * el * 50, y + 3 + Math.sin(i) * el * 40, 1, 1, '#ffb0c0');
      ctx.globalAlpha = 1;
    }
  };
  function heartHalf(ctx, x, y, right) { HEART.forEach((row, j) => { for (let i = right ? 3 : 0; i < (right ? 7 : 4); i++) if (row[i] === '#') rect(ctx, x + i - (right ? 3 : 0), y + j, 1, 1, '#ff3a5a'); }); }
  FX.checkpointRewind = { // no hearts left: the duel rewinds to the phase checkpoint like a tape
    name: 'Checkpoint rewind',
    post(ctx, f, el, k, S) {
      const b = snap(S.cv), a = el < 1.0 ? 1 : 1 - (el - 1.0) / 0.5;
      if (!fxOff(this.g)) for (let y = 0; y < H; y += 6) { const off = Math.round(Math.sin(y * 0.13 + el * 30) * 8 * a + (hash(y + Math.floor(el * 20)) - 0.5) * 6 * a); ctx.drawImage(b, 0, y, W, 6, off, y, W, 6); }
      ctx.fillStyle = 'rgba(40,120,160,' + (0.25 * a).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) rect(ctx, 0, ((el * 260 + i * 47) % H), W, 1, 'rgba(255,255,255,0.35)');
      ctx.globalAlpha = a;
      font.draw(ctx, '<<  REWIND', 8, H - 22, { color: '#b8f3ff', outline: '#05060d', scale: 2 });
      const cx = W - 30, cy = H - 30, an = -el * 12;
      for (let i = 0; i < 24; i++) { const q = i / 24 * Math.PI * 2; rect(ctx, cx + Math.cos(q) * 12, cy + Math.sin(q) * 12, 1, 1, '#7fe8ff'); }
      for (let r = 0; r < 10; r++) rect(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r, 1, 1, '#ffffff');
      ctx.globalAlpha = 1;
    }
  };

  // ---------------- THE DIMENSIONS (build 37: the duel moves through other worlds)
  FX.dimensionRip = { // the arena is torn open into the next dimension: sparks crackle along the tear, shards fly out
    name: 'Dimension rip',
    front(ctx, f, el, k, S) {
      const pts = BW.tearPts(Math.min(1, el / 1.0));
      ctx.globalAlpha = 1 - k * 0.7;
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
        const j = (hash(i + Math.floor(S.rt * 30)) - 0.5) * 4;
        rect(ctx, x + j, y - j, 2, 2, i % 3 ? '#b8a6ff' : '#ffffff');
        if (i % 4 === 0) rect(ctx, x + (x - W * 0.6) * 0.05 * k * 6, y + (y - MID) * 0.05 * k * 6, 3, 2, '#7fe8ff');
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.mirrorEcho = { // MIRROR VOID: the Tyrant's glass reflection steps out of the mirror and slashes with it
    name: 'Mirror echo',
    behind(ctx, f, el, k, S) {
      if (!S.buf) return false; // (b47: the HD layer paints its own reflection)
      const c = this._mir || (this._mir = FF.makeCanvas(170, 170)), mg = c.getContext('2d');
      if (this._mirK !== this._bbK) { // build 38 perf: re-made only when the Tyrant is repainted
        this._mirK = this._bbK;
        mg.clearRect(0, 0, 170, 170); mg.save(); mg.translate(170, 0); mg.scale(-1, 1); mg.drawImage(S.buf, 0, 0); mg.restore();
        mg.globalCompositeOperation = 'source-atop'; mg.fillStyle = 'rgba(127,232,255,0.55)'; mg.fillRect(0, 0, 170, 170); mg.globalCompositeOperation = 'source-over';
      }
      const a = ramp(el, f.len, 0.2, 0.3);
      ctx.globalAlpha = a * 0.55; ctx.drawImage(c, 170 - TBW, 0, TBW, TBH, Math.round(S.bx + 34 + 170 - TBW + Math.sin(el * 6) * 3), Math.round(S.by + 4), TBW, TBH);
      ctx.globalAlpha = a; for (let i = 0; i < 6; i++) rect(ctx, S.bx + 60 + i * 14, S.by + 30 + ((el * 80 + i * 23) % 100), 1, 6, 'rgba(232,251,255,0.7)');
      ctx.globalAlpha = 1;
    }
  };
  FX.starfield = { // STARFALL COSMOS: warp streaks on arrival, then stars stream past and shooting stars cross
    name: 'Warp starfield',
    back(ctx, f, el, k, S) {
      if (S.v !== 4) return false;
      const warp = Math.max(0, 1 - el / 1.4), vx = S.vx, vy = S.vy;
      for (let i = 0; i < 40; i++) {
        const an = hash(i + 500) * Math.PI * 2, d = ((S.rt * (60 + warp * 400) + hash(i + 501) * 200) % 200), len = 2 + warp * 26;
        const x = vx + Math.cos(an) * d, y = vy + Math.sin(an) * d * 0.6;
        ctx.fillStyle = i % 3 ? 'rgba(232,216,255,0.75)' : 'rgba(127,232,255,0.85)';
        for (let s = 0; s < len; s += 2) ctx.fillRect(Math.round(x + Math.cos(an) * s), Math.round(y + Math.sin(an) * s * 0.6), 1, 1);
      }
      const per = 1.9, n = Math.floor(S.rt / per), q = (S.rt - n * per) / 0.5;
      if (q < 1) { const sx = W - q * 260 - hash(n) * 40, sy = 44 + hash(n + 1) * 60 + q * 30; for (let s = 0; s < 18; s++) rect(ctx, sx + s * 2, sy - s * 0.25, 1, 1, s < 3 ? '#ffffff' : 'rgba(184,166,255,0.6)'); }
    }
  };
  FX.gravityPulse = { // STARFALL COSMOS signature: a ring counts down around the hero, then gravity flips by itself
    name: 'Gravity shift',
    front(ctx, f, el, k, S) {
      const p = this.g.p, cx = S.hx, cy = S.hy, left = f.flipAt - this.t;
      if (left > 0) {
        const q = 1 - left / (f.flipAt - f.t0), R = 34 - q * 20;
        for (let i = 0; i < 32; i++) { const an = i / 32 * Math.PI * 2 + el * 4; rect(ctx, cx + Math.cos(an) * R, cy + Math.sin(an) * R * 0.8, 1, 1, i % 4 ? '#b8a6ff' : '#ffffff'); }
        const up = p.grav > 0 ? -1 : 1;
        for (let i = 0; i < 3; i++) { const yy = cy + up * (16 + ((el * 50 + i * 10) % 30)); rect(ctx, cx - 3, yy, 7, 1, '#e8d8ff'); rect(ctx, cx - 2, yy + up, 5, 1, '#e8d8ff'); rect(ctx, cx - 1, yy + up * 2, 3, 1, '#e8d8ff'); }
        font.draw(ctx, 'GRAVITY SHIFT ' + Math.ceil(left * 2), W / 2, 42, { color: '#e8d8ff', align: 'center', outline: '#05060d' });
      } else {
        const e = -left; if (e > 0.5) return false;
        ctx.fillStyle = 'rgba(184,166,255,' + (0.35 * (1 - e / 0.5)).toFixed(2) + ')';
        for (let y = C; y < F; y += 4) ctx.fillRect(0, y + Math.round(Math.sin(y * 0.2 + e * 40) * 2), W, 1);
      }
    }
  };
  FX.clockHands = { // SHATTERED TIME signature: giant clock hands spin behind the Tyrant as the shards thaw
    name: 'Clock-hand sweep',
    behind(ctx, f, el, k, S) {
      const cx = S.bs[0] - 4, cy = S.bs[1] - 20, a = ramp(el, f.len, 0.2, 0.3);
      ctx.globalAlpha = a;
      for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; rect(ctx, cx + Math.cos(an) * 56, cy + Math.sin(an) * 56, i % 3 ? 2 : 4, 2, '#ffd27a'); }
      for (const [len, sp, col, w] of [[50, 9, '#e8dcc0', 3], [36, -3, '#ffd27a', 4]]) {
        const an = el * sp; for (let s = 0; s < len; s += 2) rect(ctx, cx + Math.cos(an) * s, cy + Math.sin(an) * s, w, w, col);
      }
      ctx.globalAlpha = 1;
    }
  };
  FX.frozenDebris = { // SHATTERED TIME: the collapse stopped mid-air — rubble hangs frozen at three depths
    name: 'Frozen debris',
    back(ctx, f, el, k, S) {
      if (S.v !== 5) return false;
      const hic = Math.floor(S.rt / 1.7) !== Math.floor((S.rt - 0.06) / 1.7) ? 1 : 0; // a time hiccup: everything jolts
      for (let i = 0; i < 16; i++) {
        const d = i % 3, sz = 3 + d * 3, par = 0.12 + d * 0.2;
        const x = ((hash(i + 700) * 640 - S.cam * par) % (W + 40) + W + 40) % (W + 40) - 20, y = C + 6 + hash(i + 701) * (F - C - 20) + hic;
        // build 38 perf: each frozen chunk is painted (rotated) once, then stamped pixel-aligned
        ctx.drawImage(rockSprite('fz' + i, sz, hash(i + 702) * 3, d === 2 ? '#2a3a3a' : d ? '#1a2a2c' : '#122022', '#bff6ff', true), Math.round(x) - 8, Math.round(y) - 8);
        if ((Math.floor(S.rt * 3) + i) % 7 === 0) rect(ctx, x + 2, y - 2, 1, 1, '#ffffff');
      }
    }
  };

  // ---------------- BUILD 39 — THE DIMENSION SHIFT (into / out of the STARFALL TUNNEL, ~3 s)
  function hyperLines(ctx, cx, cy, el, w, n) { // hyperspace: lines rushing out of the vanishing point
    if (w <= 0.02) return;
    ctx.strokeStyle = 'rgba(232,240,255,' + Math.min(0.9, w).toFixed(2) + ')'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const an = hash(i + 1900) * Math.PI * 2, r0 = 8 + ((el * (260 + hash(i + 1901) * 300) + hash(i + 1902) * 200) % 200), len = 6 + w * (40 + hash(i + 1903) * 90);
      ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 0.8); ctx.lineTo(cx + Math.cos(an) * (r0 + len), cy + Math.sin(an) * (r0 + len) * 0.8);
    }
    ctx.stroke();
  }
  function rollUp(ctx, b, k, spin) { // the flat arena rolls up into a tube around the hero (k 0 → flat, 1 → a tube end-on)
    rect(ctx, 0, 0, W, H, '#02010a');
    const cx = TUN.cx, cy = MID;
    if (spin) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin); ctx.translate(-cx, -cy); }
    for (let y = 0; y < H; y += 4) { // (4-px slices: 45 blits)
      const d = (y + 2 - cy) / (H / 2), ad = Math.min(1, Math.abs(d)), sq = 1 - 0.62 * k * ad, sx = 1 - 0.8 * k * Math.pow(ad, 1.2);
      ctx.drawImage(b, 0, y, W, 4, Math.round(cx - (W * sx) / 2), Math.round(cy + (y - cy) * sq), Math.round(W * sx), Math.ceil(4 * sq + 1));
    }
    if (spin) ctx.restore();
  }
  FX.dimensionShift = {
    name: 'Dimension shift (tunnel in / out)',
    post(ctx, f, el, k, S) {
      const fx = !fxOff(this.g), ar = isAr(this.g), tun = this.tunnelOn();
      if (f.dir === 'in') {
        if (!tun && el > 0.1 && fx) { rollUp(ctx, snap(S.cv), ease(Math.min(1, (el - 0.1) / 0.8)), Math.min(1, (el - 0.1) / 0.8) * 0.5); snapF = -1; }
        hyperLines(ctx, TUN.cx, tun ? TUN.cy : MID, el, Math.sin(FF.clamp((el - 0.35) / 1.6, 0, 1) * Math.PI), 60);
      } else {
        if (!tun && el < 1.75 && fx) { rollUp(ctx, snap(S.cv), 1 - ease(FF.clamp((el - 0.9) / 0.85, 0, 1)), 0); snapF = -1; }
        hyperLines(ctx, TUN.cx, tun ? TUN.cy : MID, el, Math.sin(FF.clamp((el - 0.1) / 1.4, 0, 1) * Math.PI), 60);
      }
      if (el > 0.8 && el < 1.15) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - Math.abs(el - 0.92) / 0.23).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); } // the flash
      if (el > 0.95 && el < 2.75 && !ar) { // DIMENSION SHIFT: slams in with chromatic edges, flickers out
        const e = el - 0.95, sl = Math.round((1 - ease(Math.min(1, e / 0.18))) * -120), sc = e < 0.1 ? 4 : 3;
        if (e < 1.5 || Math.floor(e * 20) % 2) {
          font.draw(ctx, 'DIMENSION SHIFT', W / 2 + sl - 2, 30, { color: '#ff3a8a', align: 'center', scale: sc });
          font.draw(ctx, 'DIMENSION SHIFT', W / 2 + sl + 2, 30, { color: '#4ad0ff', align: 'center', scale: sc });
          font.draw(ctx, 'DIMENSION SHIFT', W / 2 + sl, 30, { color: '#ffffff', align: 'center', outline: '#05060d', scale: sc });
          rect(ctx, 0, 27 + 14 * sc / 3 + 6, W, 1, f.dir === 'in' ? '#b8a6ff' : '#ff8a00');
        }
      }
    }
  };

  // ---------------- BUILD 38 — MORE ACTION (5)
  FX.hitSpark = { // every seal that lands throws combo hit-sparks; a streak stacks a growing COMBO counter on the Tyrant
    name: 'Combo hit-sparks',
    boss(ctx, f, el, k, S) {
      const cx = S.bs[0] - 24 + (hash(f.seed) - 0.5) * 20, cy = S.bs[1] - 14 + (hash(f.seed + 1) - 0.5) * 20, n = 6 + Math.min(8, f.n * 2), L = (10 + Math.min(14, f.n * 3)) * ease(Math.min(1, el / 0.12));
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < n; i++) {
        const an = i / n * Math.PI * 2 + hash(i + f.seed) * 0.6, len = L * (0.6 + 0.4 * hash(i + f.seed + 3));
        ctx.fillStyle = i % 2 ? '#ffffff' : f.n >= 3 ? '#ffe9a0' : '#7fe8ff';
        for (let s = len * 0.35; s < len; s += 2) ctx.fillRect(Math.round(cx + Math.cos(an) * s), Math.round(cy + Math.sin(an) * s), 2, 1);
      }
      if (el < 0.06 && !this.hdOn()) rect(ctx, cx - 6, cy - 6, 12, 12, '#ffffff'); // (b47: under HD the chest ring and sparks are the flash)
      ctx.globalAlpha = 1;
    },
    top(ctx, f, el, k, S) {
      if (f.n < 2) return false;
      font.draw(ctx, f.n + ' HIT COMBO', FF.clamp(S.bs[0] - 30, 50, W - 50), Math.max(30, S.bs[1] - 62) - el * 8, { color: f.n >= 5 ? '#ffe9a0' : '#b8f3ff', align: 'center', outline: '#05060d', scale: el < 0.08 ? 2 : 1 });
    }
  };
  FX.parryClash = { // a last-moment dodge CLASHES with the attack: crossed blades of light where it would have hit
    name: 'Parry clash',
    top(ctx, f, el, k, S) {
      let x, y, sc = 1;
      if (S.tun) { const q = this.tunPt(f.wx, f.wy); if (!q) return false; x = q[0]; y = q[1]; sc = Math.min(2.4, q[2]); }
      else { x = FF.clamp(f.wx - S.cam, 20, W - 20); y = f.wy; }
      const a = 1 - k, r = (6 + el * 90) * sc;
      ctx.globalAlpha = a;
      for (const s of [-1, 1]) { // two blades of light crossing
        const an = s * (0.75 + el * 2), dx = Math.cos(an) * 16 * sc, dy = Math.sin(an) * 16 * sc;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, 2 * sc); ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
        ctx.strokeStyle = s > 0 ? '#7fe8ff' : '#ff3a5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - dx * 1.2, y - dy * 1.2 + 1); ctx.lineTo(x + dx * 1.2, y + dy * 1.2 + 1); ctx.stroke();
      }
      ctx.strokeStyle = '#ffe9a0'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) { const an = hash(i + 1600) * Math.PI * 2, d = el * (120 + hash(i + 1601) * 80) * sc; rect(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d + el * el * 90, 2, 1, i % 2 ? '#ffd27a' : '#ffffff'); }
      if (el < 0.05) { rect(ctx, x - 10 * sc, y - 1, 20 * sc, 3, '#ffffff'); rect(ctx, x - 1, y - 10 * sc, 3, 20 * sc, '#ffffff'); }
      ctx.globalAlpha = 1;
      font.draw(ctx, 'CLASH!', x, y - 20 * sc - el * 10, { color: '#ffffff', align: 'center', outline: '#05060d', scale: el < 0.08 ? 2 : 1 });
    }
  };
  FX.nearMiss = { // a hazard brushes past: time slows, streaks wrap the hero, CLOSE!
    name: 'Slow-mo near miss',
    front(ctx, f, el, k, S) {
      const x = S.hx, y = S.hy, sc = S.hs, a = 1 - k;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#e8fbff';
      for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2 + el * 3, r0 = (12 + el * 30) * sc; for (let s = 0; s < 8 * sc; s += 2) ctx.fillRect(Math.round(x + Math.cos(an) * (r0 + s)), Math.round(y + Math.sin(an) * (r0 + s) * 0.8), 1, 1); }
      ctx.strokeStyle = 'rgba(127,232,255,0.7)'; ctx.beginPath(); ctx.ellipse(x, y, (10 + el * 22) * sc, (8 + el * 16) * sc, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      font.draw(ctx, 'CLOSE!', x, y - 22 * sc - el * 12, { color: '#b8f3ff', align: 'center', outline: '#05060d' });
    },
    post(ctx, f, el, k, S) { // the slow-mo grade: cool edges for a moment
      if (fxOff(this.g)) return false;
      const a = 0.22 * Math.sin(Math.min(1, k * 1.2) * Math.PI);
      ctx.fillStyle = 'rgba(40,120,200,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10); ctx.fillRect(0, 10, 10, H - 20); ctx.fillRect(W - 10, 10, 10, H - 20);
    }
  };
  FX.finalCombo = { // the victory: the hero dashes through the king, then a storm of hits with a climbing counter
    name: 'Final combo',
    boss(ctx, f, el, k, S) {
      const n = Math.min(14, Math.floor(Math.max(0, el - 0.2) / 0.16) + 1);
      if (el < 0.2 || el > 2.15) return false;
      for (let i = Math.max(0, n - 3); i < n; i++) { // the last few hit-sparks
        const e = el - 0.2 - i * 0.16; if (e < 0 || e > 0.3) continue;
        const cx = S.bs[0] - 10 + (hash(i + 1700) - 0.5) * 70, cy = S.bs[1] - 20 + (hash(i + 1701) - 0.5) * 70, L = 8 + e * 70;
        ctx.globalAlpha = 1 - e / 0.3;
        for (let j = 0; j < 8; j++) { const an = j / 8 * Math.PI * 2 + i; ctx.fillStyle = j % 2 ? '#ffffff' : '#ffe9a0'; for (let s = L * 0.4; s < L; s += 2) ctx.fillRect(Math.round(cx + Math.cos(an) * s), Math.round(cy + Math.sin(an) * s), 2, 1); }
        if (e < 0.05) rect(ctx, cx - 7, cy - 7, 14, 14, '#ffffff');
        // a slash mark across the body
        ctx.strokeStyle = '#7fe8ff'; ctx.lineWidth = 2; ctx.beginPath(); const sa = hash(i + 1702) * Math.PI; ctx.moveTo(cx - Math.cos(sa) * 26, cy - Math.sin(sa) * 26); ctx.lineTo(cx + Math.cos(sa) * 26, cy + Math.sin(sa) * 26); ctx.stroke(); ctx.lineWidth = 1;
      }
      ctx.globalAlpha = 1;
    },
    front(ctx, f, el, k, S) { // the dash: a blade of starlight from the hero through the Tyrant
      if (el < 0.25) {
        const q = ease(el / 0.12), hx = S.hx, hy = S.hy, ex = S.bs[0], ey = S.bs[1] - 10, x = hx + (ex - hx) * q, y = hy + (ey - hy) * q;
        ctx.globalAlpha = 1 - FF.clamp((el - 0.12) / 0.13, 0, 1);
        ctx.strokeStyle = '#7fe8ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke(); ctx.lineWidth = 1;
        star4(ctx, x, y, 5, '#ffe9a0');
        ctx.globalAlpha = 1;
      }
    },
    post(ctx, f, el, k, S) { // the climbing hit counter, on top of everything (the galaxy pull-out included)
      const n = Math.min(14, Math.floor(Math.max(0, el - 0.2) / 0.16) + 1);
      if (el > 0.2 && el < 2.3) {
        const e = el - 0.2 - (n - 1) * 0.16;
        font.draw(ctx, n + ' HITS', W - 8, 44, { color: n >= 10 ? '#ffe9a0' : '#ffffff', align: 'right', outline: '#05060d', scale: e < 0.05 ? 3 : 2 });
        if (n >= 6) font.draw(ctx, n >= 12 ? 'UNSTOPPABLE!' : n >= 9 ? 'INCREDIBLE!' : 'GREAT!', W - 8, 64, { color: '#ffd23f', align: 'right', outline: '#05060d' });
      }
    }
  };
  FX.victoryBurst = { // the king breaks apart: a supernova of rings, white-hot debris and light beams
    name: 'Victory supernova',
    post(ctx, f, el, k, S) {
      const cx = S.bs[0] - 6, cy = S.bs[1] - 14;
      for (let i = 0; i < 3; i++) {
        const e = el - i * 0.09; if (e <= 0) continue;
        ctx.lineWidth = 4 - i; ctx.strokeStyle = ['rgba(255,255,255,', 'rgba(255,233,160,', 'rgba(127,232,255,'][i] + Math.max(0, 1 - e / 0.8).toFixed(2) + ')';
        ctx.beginPath(); ctx.ellipse(cx, cy, e * 380, e * 300, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(255,240,200,' + (0.5 * (1 - k)).toFixed(2) + ')';
      for (let i = 0; i < 10; i++) { // light beams
        const an = hash(i + 1800) * Math.PI * 2 + el * 0.4, len = 60 + el * 260;
        for (let s = 10; s < len; s += 3) ctx.fillRect(Math.round(cx + Math.cos(an) * s), Math.round(cy + Math.sin(an) * s), 2, 2);
      }
      for (let i = 0; i < 26; i++) { // burning debris of the crown and armor
        const an = hash(i + 1810) * Math.PI * 2, sp = 70 + hash(i + 1811) * 200, s = 2 + Math.floor(hash(i + 1812) * 4);
        const x = cx + Math.cos(an) * sp * el, y = cy + Math.sin(an) * sp * el + 120 * el * el;
        rect(ctx, x, y, s, s, i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffd27a' : '#ff5a1a');
      }
    }
  };

  // ---------------- BUILD 42 — CLASH, COUNTER-QTE, ULTIMATE
  FX.clashSplit = { // the screen splits hero vs Tyrant, time slows, a ring closes onto the gold band: TAP!
    name: 'Clash split-screen QTE',
    post(ctx, f, el, k, S) {
      const a = Math.min(1, el / 0.25), c = this.clash;
      ctx.fillStyle = 'rgba(5,4,16,' + (0.55 * a).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
      const sl = Math.round((1 - a) * 80);
      ctx.fillStyle = '#06103a'; ctx.beginPath(); ctx.moveTo(-sl, 0); ctx.lineTo(W / 2 + 22 - sl, 0); ctx.lineTo(W / 2 - 22 - sl, H); ctx.lineTo(-sl, H); ctx.fill();
      ctx.fillStyle = '#2a0008'; ctx.beginPath(); ctx.moveTo(W / 2 + 22 + sl, 0); ctx.lineTo(W + sl, 0); ctx.lineTo(W + sl, H); ctx.lineTo(W / 2 - 22 + sl, H); ctx.fill();
      speedLines(ctx, 70, 90, S.rt, 'rgba(127,232,255,0.35)', 18); speedLines(ctx, 250, 90, S.rt, 'rgba(255,80,100,0.35)', 18);
      this.portrait(ctx, 'hero', 10 - sl, 40, 4, S.rt); this.portrait(ctx, 'boss', 200 + sl, 46, 3, S.rt);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 + 22, 0); ctx.lineTo(W / 2 - 22, H); ctx.stroke(); ctx.lineWidth = 1;
      const cx = W / 2, cy = MID - 6, rOf = (e) => 72 - 60 * FF.clamp((e - CLASH_RING[0]) / (CLASH_RING[1] - CLASH_RING[0]), 0, 1);
      if (!c.res && el >= CLASH_RING[0]) {
        ctx.strokeStyle = 'rgba(255,233,160,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, (rOf(CLASH_WIN[0]) + rOf(CLASH_WIN[1])) / 2, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, rOf(el), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
        const inWin = el >= CLASH_WIN[0] && el <= CLASH_WIN[1];
        font.draw(ctx, inWin ? 'TAP!' : 'CLASH!', cx, cy - 6, { color: inWin ? '#ffe9a0' : '#ffffff', align: 'center', outline: '#05060d', scale: inWin ? 3 : 2 });
      } else if (c.res) {
        const e = this.t - c.resT;
        font.draw(ctx, c.res === 'win' ? 'CLASH WON!' : 'OVERPOWERED', cx, cy - 10, { color: c.res === 'win' ? '#ffe9a0' : '#ff9ab0', align: 'center', outline: '#05060d', scale: e < 0.1 ? 4 : 3 });
        if (c.res === 'win') for (let i = 0; i < 5; i++) { const q = FF.clamp((e - i * 0.12) / 0.15, 0, 1); if (q > 0 && q < 1) { ctx.strokeStyle = i % 2 ? '#7fe8ff' : '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(200, 30 + i * 22); ctx.lineTo(200 + 110 * q, 60 + i * 18); ctx.stroke(); ctx.lineWidth = 1; } }
      }
    }
  };
  FX.clashWin = { name: 'Clash counter-combo', front(ctx, f, el, k, S) { const n = Math.min(6, 1 + Math.floor(el / 0.12)); font.draw(ctx, n + ' HIT COUNTER', W / 2, 150, { color: '#ffe9a0', align: 'center', outline: '#05060d' }); } };
  FX.clashLose = { name: 'Clash lost', front(ctx, f, el, k, S) { ctx.fillStyle = 'rgba(255,40,70,' + (0.3 * (1 - k)).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); } };
  FX.qteCounter = { name: 'Perfect counter (QTE)', front(ctx, f, el, k, S) { ctx.globalAlpha = 1 - k; star4(ctx, S.hx, S.hy, 10 + el * 40, '#ffe9a0'); font.draw(ctx, 'PERFECT COUNTER!', S.hx + 10, S.hy - 30 - el * 10, { color: '#ffe9a0', outline: '#05060d' }); ctx.globalAlpha = 1; } };
  FX.ultReady = { name: 'Ultimate ready', post(ctx, f, el, k, S) { ctx.strokeStyle = 'rgba(255,233,160,' + (1 - k).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(22, H - 22, 17 + el * 40, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; font.draw(ctx, 'ULTIMATE READY', W / 2, 44, { color: '#ffe9a0', align: 'center', outline: '#05060d' }); } };
  // the ULTIMATE, by skin: a title card, a build-up in the skin's colours, the strike on ULT_HIT, the aftermath
  const ULTS = { ivoid: ['GALAXY COLLAPSE', '#7fe8ff', '#b8a6ff'], bwarden: ['BLOOD RAIN', '#ff1a2e', '#8a0016'], wshinobi: ['ORANGE STORM', '#ff7a12', '#7ad8ff'], ctyrant: ['CROWN OF FIRE', '#ff8a00', '#ff2a3a'], jackpot: ['777 JACKPOT', '#ffd23f', '#3fdc7a'], generic: ['NOVA BURST', '#ffffff', '#7fe8ff'] };
  FF.BOSS_ULTS = ULTS;
  FX.ultimate = {
    name: 'Ultimate finisher (per skin)',
    post(ctx, f, el, k, S) {
      const U = ULTS[f.skin] || ULTS.generic, c1 = U[1], c2 = U[2], tx = S.bs[0] - 10, ty = S.bs[1] - 14, hitE = el - ULT_HIT;
      ctx.fillStyle = 'rgba(3,2,14,' + Math.min(0.6, el * 2).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
      if (hitE < 0) {
        const q = el / ULT_HIT;
        for (let i = 0; i < 26; i++) { // the build-up: the skin's energy spirals in on the Tyrant
          const an = i / 26 * Math.PI * 2 + el * (f.skin === 'wshinobi' ? 9 : 3), r = 150 * (1 - q) + 10 + hash(i + 2000) * 20;
          rect(ctx, tx + Math.cos(an) * r, ty + Math.sin(an) * r * (f.skin === 'wshinobi' ? 1.4 : 0.8) - (f.skin === 'bwarden' ? ((el * 260 + i * 37) % 200) - 100 : 0), 3, f.skin === 'bwarden' ? 7 : 3, i % 2 ? c1 : c2);
        }
        if (f.skin === 'jackpot') for (let r = 0; r < 3; r++) { const lock = el > 0.6 + r * 0.3; font.draw(ctx, lock ? '7' : String(Math.floor(el * 30 + r * 3) % 10), W / 2 - 30 + r * 30, 120, { color: lock ? '#ffd23f' : '#ffffff', align: 'center', outline: '#3a2000', scale: 4 }); }
        if (f.skin === 'ivoid' || f.skin === 'generic') galaxy(ctx, tx, ty, el * 3, 0.5, 30 + q * 50);
      } else {
        if (hitE < 0.12) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); }
        ctx.lineWidth = 4; ctx.strokeStyle = c1; ctx.beginPath(); ctx.ellipse(tx, ty, hitE * 420, hitE * 300, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
        for (let i = 0; i < 24; i++) { const an = hash(i + 2100) * Math.PI * 2, d = hitE * (120 + hash(i + 2101) * 160); rect(ctx, tx + Math.cos(an) * d, ty + Math.sin(an) * d + hitE * hitE * 80, 3, 3, i % 2 ? c1 : c2); }
      }
      const tk = Math.min(1, el / 0.2);
      if (el < 2.4 && !isAr(this.g)) { font.draw(ctx, 'ULTIMATE', W / 2, 18, { color: '#ffffff', align: 'center', outline: '#05060d' }); font.draw(ctx, U[0], W / 2 + Math.round((1 - tk) * 200), 30, { color: c1, align: 'center', outline: '#05060d', scale: 3 }); }
    }
  };

  Fight.prototype.renderReward = function (ctx, rt) {
    const el = this.t - this.modeT0, g = this.g, ar = isAr(g);
    ctx.fillStyle = 'rgba(3,4,20,' + Math.min(0.88, el * 2).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
    // a cosmic burst: rings of stars
    for (let ring = 0; ring < 3; ring++) {
      const r = ((el * 90 + ring * 40) % 140);
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2 + ring; rect(ctx, 160 + Math.cos(a) * r, 92 + Math.sin(a) * r * 0.7, 1, 1, ['#7fe8ff', '#ffffff', '#b8a6ff'][ring]); }
    }
    speedLines(ctx, 160, 92, rt, 'rgba(184,166,255,0.35)', 30);
    const k = Math.min(1, el / 0.4);
    const s = k < 1 ? Math.round(2 + k * 3) : 5;
    const RW = this.def.reward || { skin: this.def.hero || 'ivoid', name: 'INFINITY VOID' }; // b45: what this boss unlocks
    FF.drawFlippoBig(ctx, Math.round(160 - 10 * s), Math.round(96 - 13 * s), s, { skin: RW.skin, face: 'joy', t: rt, aura: 1 });
    if (!ar) {
      if (this.mode === 'reward') {
        if (el > 0.5) font.draw(ctx, 'NEW SKIN UNLOCKED', W / 2, 18, { color: '#7fe8ff', align: 'center', outline: '#05060d' });
        if (el > 0.7) font.draw(ctx, RW.name, W / 2, 150, { color: '#ffffff', align: 'center', outline: '#2a3a7a', scale: 2 });
      } else {
        font.draw(ctx, 'VICTORY', W / 2, 18, { color: '#ffd23f', align: 'center', outline: '#05060d', scale: 2 });
        font.draw(ctx, 'TIME ' + fmtTime(this.fightTime), W / 2, 156, { color: '#ffffff', align: 'center', outline: '#05060d' });
      }
    }
  };
})(window.FF);
