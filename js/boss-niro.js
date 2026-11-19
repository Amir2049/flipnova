// FLIPNOVA — 📖 STORY, CHAPTER 3: PALE NIRO (builds 43–44). MINO's twin, caught by the Void for a thousand days.
// Rides on the generic duel in boss.js (own dimensions, attacks, world, painter, voice, transitions and ending through
// the def hooks). Every attack is closed-form on the fight clock and the fight's own rng: a fight replays exactly from
// its taps. KNOCK: three knocks, and the strike lands on the THIRD knock in the lane you were in on the second.
// build 44: a different duel. There are no seal orbs here: after each of his attacks it is YOUR TURN, and you hurt him by
// knocking back on the beat (three gold rings; every tap that lands on one is a knock, all three is a PERFECT ANSWER).
// build 44: his own identity. Sounds (breath, stone, knocks), a different way into every dimension (lights out, the
// mirror breaks, the film burns, the floor gives way, the light rises), a living boss (poses for every attack, a scream,
// the brother flickering through), richer worlds, the GAZE attack, and the ending you play: KNOCK THREE TIMES.
(function (FF) {
  'use strict';
  const W = FF.W, H = FF.H, C = FF.C, F = FF.F, MID = FF.MID, PX = FF.PLAYER_X;
  const BW = FF.BossWorld, rect = BW.rect, hash = BW.hash, font = FF.font, FX = FF.BOSS_FX;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (x) => x * x * (3 - 2 * x), eo = (x) => 1 - Math.pow(1 - x, 3);
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mix = (a, b, t) => { if (t <= 0) return a; if (t >= 1) return b; const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const SX = 214; // where pale blades leave (screen x), like the Tyrant's

  // ------------------------------------------------------------------ the story skins (unlocked by the chapter)
  const CUBE = (hair, band, shirt, extra) => {
    const rows = [
      '................',
      '..hhhhhhhhhhhh..',
      '.hhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhh.',
      band ? '.bbbbbbbbbbbbbbb' : '.hh..........hh.',
      band ? '.h............bb' : '.h............h.',
      band ? '..............b.' : '................',
      '................', '................', '................', '................', '................',
      'ssssssssssssssss',
      'ssssssssssssssss',
      'zsssssssssssssz.',
      '.zzzzzzzzzzzzz..',
      '................', '................', '................', '................'
    ];
    const pal = { h: hair, s: shirt, z: extra || shirt };
    if (band) pal.b = band;
    return { art: rows, pal };
  };
  const mino = CUBE('#2a1a10', null, '#b5532a', '#7d3518');
  const niro = CUBE('#2a1a10', '#3fb39a', '#2f7d6b', '#1d5246');
  const pale = CUBE('#0e1018', '#7f8a96', '#2a3140', '#1c212d');
  FF.SKINS.push(
    { id: 'mino', name: 'MINO', body: '#c98d5a', dark: '#2a1a10', shade: '#9c6539', light: '#e6b683', eye: '#3b2416', pupil: '#ffffff', unlock: 'storyPlay', rarity: 'icon', art: mino.art, pal: mino.pal },
    { id: 'niro', name: 'NIRO', body: '#c98d5a', dark: '#2a1a10', shade: '#9c6539', light: '#e6b683', eye: '#3b2416', pupil: '#ffffff', unlock: 'story', rarity: 'icon', art: niro.art, pal: niro.pal },
    { id: 'paleniro', name: 'PALE NIRO', body: '#b9c4cc', dark: '#0e1018', shade: '#8b98a3', light: '#e3ebf0', eye: '#ffffff', pupil: '#ffffff', glow: '#ffffff', unlock: 'story', rarity: 'icon', art: pale.art, pal: pale.pal, fx: { type: 'glow', c1: '#ffffff', c2: '#9ff0ff' } }
  );

  // ------------------------------------------------------------------ the dimensions
  const DIMS = [
    { id: 'old', v: 0, phase: 0, from: 1.0, name: 'THE EMBER MINES', nameAr: 'مناجم الجمر', pool: ['knock', 'fists', 'quake', 'pslash', 'drop'], sig: 'knock', sigs: ['fists', 'quake'] },
    { id: 'dark', v: 1, phase: 0, from: 0.83, name: 'THE DARK', nameAr: 'الضلمة', pool: ['knock', 'knock2', 'gaze', 'quake'], sig: 'knock2', sigs: ['gaze', 'quake'] },
    { id: 'echo', v: 2, phase: 1, from: 0.66, name: 'PRISM ECHOES', nameAr: 'أصداء المنشور', pool: ['dash', 'echo', 'knock2', 'dash', 'drop'], sig: 'dash', sigs: ['echo', 'dash'] },
    { id: 'memory', v: 3, phase: 1, from: 0.5, name: 'GOLDEN MEMORIES', nameAr: 'الذكريات الدهبي', pool: ['pit', 'fists', 'knock', 'echo'], sig: 'pit', sigs: ['fists'] },
    { id: 'fall', v: 4, tunnel: 1, phase: 2, from: 0.33, name: 'THE FALL', nameAr: 'السقوط', pool: ['chase', 'comet', 'slash', 'pillar'], sig: 'chase', sigs: ['comet'] },
    { id: 'ledge', v: 5, phase: 2, from: 0.15, name: 'THE LEDGE', nameAr: 'الحافة', pool: ['dash', 'fists', 'gaze', 'quake', 'knock2', 'pit'], sig: 'knock', sigs: ['dash', 'fists', 'gaze'] }
  ];
  FF.NIRO_DIMS = DIMS;
  const ACCENT = ['#ff8a3a', '#ff3aa8', '#3affe8', '#ffd27a', '#7ae8ff', '#3affff']; // b45: every dimension has its own colour

  // ------------------------------------------------------------------ attacks
  const other = (s) => (s === 'f' ? 'c' : 'f');
  const sideNow = (p) => (p.grav > 0 ? 'f' : 'c');
  const cue = (fight, t, s, o) => (fight.cues = fight.cues || []).push({ t, s, o, done: 0 }); // a sound on the fight clock
  // a knock wave: born at `at` in the lane the hero is in at that moment, it reaches the hero on the strike beat
  function knockWave(fight, strikeT) {
    const p = fight.g.p;
    fight.addHz({ k: 'wave', mir: 1, nw: 1, side: sideNow(p), t0: fight.t, tl: strikeT - 0.1, sx0: PX + 52, v: 420, w: 16, h: 22 });
  }
  function knocks(fight, list, strikeIx) {
    fight.knk = (fight.knk || []).concat(list.map((tt, i) => ({ t: tt, n: i + 1, strike: i === strikeIx, done: 0 })));
    fight.beatRow = { t0: fight.t, ts: list.slice(), strike: strikeIx };
  }
  const ATTACKS = {
    knock(o) { // tok · tok · TOK
      const b = o.P.beat, k1 = o.t + 0.3, k2 = k1 + b, k3 = k2 + b;
      knocks(this, [k1, k2, k3], 2);
      (this.pend = this.pend || []).push({ at: k2, fn() { knockWave(this, k3); } });
      return { first: k3 - 0.1, busy: k3 + 0.35, hits: [k3] };
    },
    knock2(o) { // tok · tok · (nothing) · TOK: the strike comes one beat late
      const b = o.P.beat, k1 = o.t + 0.3, k2 = k1 + b, k3 = k2 + b * 2;
      knocks(this, [k1, k2, k3], 2);
      (this.pend = this.pend || []).push({ at: k2 + b, fn() { knockWave(this, k3); } });
      return { first: k3 - 0.1, busy: k3 + 0.35, hits: [k3] };
    },
    pslash(o) { // pale blades (one lane, then the other)
      const P = o.P; let side = o.side, busy = o.t, first = Infinity; const hits = [];
      for (let i = 0; i < P.waves; i++) {
        const tl = o.t + o.T + i * P.gap;
        this.addHz({ k: 'wave', mir: 1, side, t0: tl - o.T, tl, sx0: SX, v: P.waveV, w: 16, h: 22 });
        busy = Math.max(busy, tl + (SX - PX + 16) / P.waveV + 0.05); first = Math.min(first, tl); hits.push(tl);
        side = other(side);
      }
      return { first, busy, hits };
    },
    echo(o) { // three of him: only the one with the glowing eyes is real, and his blade comes in his lane
      const P = o.P; let busy = o.t, first = Infinity; const hits = [];
      const n = this.phase >= 2 ? 2 : 1;
      cue(this, o.t + 0.05, 'echoSplit');
      for (let i = 0; i < n; i++) {
        const side = this.rng() < 0.5 ? 'f' : 'c', tl = o.t + o.T + 0.2 + i * (P.gap + 0.35);
        this.addHz({ k: 'wave', mir: 1, echo: 1, side, t0: tl - o.T - 0.2, tl, sx0: SX + 20, v: P.waveV, w: 16, h: 22, seed: Math.floor(this.rng() * 1e6) });
        busy = Math.max(busy, tl + (SX + 20 - PX + 16) / P.waveV + 0.05); first = Math.min(first, tl); hits.push(tl);
      }
      return { first, busy, hits };
    },
    drop(o) { // stone shards fall on the spots you are about to reach
      const P = o.P; let side = o.side, busy = o.t, first = Infinity; const hits = [];
      for (let i = 0; i < P.cleavers; i++) {
        const t0 = o.t + i * P.cleaveInt, wx = o.cam + o.v * (i * P.cleaveInt) + 252;
        this.addHz({ k: 'cleave', comet: 1, side, t0, tl: t0 + o.T + 0.1, wx });
        busy = Math.max(busy, this.passT(wx, 8)); first = Math.min(first, t0 + o.T + 0.1); hits.push(t0 + o.T);
        if (this.rng() < 0.6) side = other(side);
      }
      return { first, busy, hits };
    },
    pit(o) { // the ground gives way under one lane, then the other
      const P = o.P; let side = o.side, busy = o.t, first = Infinity; const hits = [];
      for (let i = 0; i < P.pillars; i++) {
        const t0 = o.t + i * P.pillarInt, wx = o.cam + o.v * (i * P.pillarInt) + 236, tl = t0 + o.T;
        this.addHz({ k: 'pit', side, t0, tl, te: tl + 2.2, wx, w: 34 });
        cue(this, tl, 'pitCrack');
        busy = Math.max(busy, this.passT(wx, 34)); first = Math.min(first, tl); hits.push(tl);
        if (this.rng() < 0.7) side = other(side);
      }
      return { first, busy, hits };
    },
    fists(o) { // b45 VOID FISTS: giant fists slam the lanes you are about to reach, one after the other
      const P = o.P; let side = o.side, busy = o.t, first = Infinity; const hits = [];
      const n = this.phase >= 1 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const t0 = o.t + i * P.pillarInt * 0.9, wx = o.cam + o.v * (i * P.pillarInt * 0.9) + 246, tl = t0 + o.T;
        this.addHz({ k: 'fist', side, t0, tl, te: tl + 0.42, wx, w: 30 });
        cue(this, tl, 'fistSlam');
        busy = Math.max(busy, this.passT(wx, 30)); first = Math.min(first, tl); hits.push(tl);
        side = other(side);
      }
      return { first, busy, hits };
    },
    quake(o) { // b45 KNOCK QUAKE: a row of stone spikes erupts and runs along one lane toward you
      const P = o.P; let side = o.side, busy = o.t, first = Infinity; const hits = [];
      const n = this.phase >= 2 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const tl = o.t + o.T + i * 0.9, v = 300 + this.phase * 30;
        this.addHz({ k: 'quake', side, t0: tl - o.T, tl, te: tl + 1.6, sx0: 326, v, w: 64, h: 15 });
        cue(this, tl, 'quakeRun');
        busy = Math.max(busy, tl + (326 - PX + 64) / v + 0.05); first = Math.min(first, tl); hits.push(tl + (326 - PX - 12) / v);
        side = other(side);
      }
      return { first, busy, hits };
    },
    dash(o) { // b45 PRISM DASH: three coloured echoes of him dash across, lane after lane, leaving rainbow trails
      const P = o.P; let side = this.rng() < 0.5 ? 'f' : 'c', busy = o.t, first = Infinity; const hits = [];
      const v = 330 + this.phase * 25, gap = 0.5 + (2 - this.phase) * 0.08;
      cue(this, o.t + o.T - 0.25, 'dashTrio');
      for (let i = 0; i < 3; i++) {
        const tl = o.t + o.T + i * gap;
        this.addHz({ k: 'dash', side, col: i, t0: o.t, tl, te: tl + 1.4, sx0: 300, v, w: 18, h: 22 });
        busy = Math.max(busy, tl + (300 - PX + 18) / v + 0.05); first = Math.min(first, tl); hits.push(tl + (300 - PX - 12) / v);
        if (i < 2 && this.rng() < 0.75) side = other(side);
      }
      return { first, busy, hits };
    },
    gaze(o) { // b44: his stare burns one whole half of the arena, then the other
      const P = o.P; let side = o.side, tl = o.t + o.T + 0.2, first = Infinity, busy = o.t; const hits = [];
      for (let i = 0; i < P.sweeps; i++) {
        this.addHz({ k: 'gaze', side, t0: tl - o.T - 0.2, tl, te: tl + 0.5 });
        cue(this, tl, 'gaze');
        first = Math.min(first, tl); hits.push(tl); busy = tl + 0.5; tl += 0.5 + 0.7; side = other(side);
      }
      return { first, busy, hits };
    }
  };

  // ------------------------------------------------------------------ YOUR TURN: the answer (how you hurt him)
  const ANS_WIN = 0.18, ANS_LEAD = 0.6, ANS_DMG = 3, ANS_BONUS = 5, COMBO_COL = ['#ffffff', '#3affe8', '#ff3aa8', '#ffd23f', '#ff5a3c'];
  function answerPlan(t) { // called every fight tick: a new attack of his books your answer right after it
    const A = this.anim;
    if (A && A !== this._ansFor && A.te > t && A.kind !== 'roar' && A.kind !== 'idle' && A.kind !== 'dying') {
      this._ansFor = A;
      const b = this.P().beat, a0 = A.te + 0.1, ld = ANS_LEAD + (this.ansTold ? 0 : 1.2); // (the first time, the banner is read first)
      this.ans = { t0: a0, ts: [a0 + ld, a0 + ld + b, a0 + ld + 2 * b], hit: [0, 0, 0], n: 0 };
      this.nextAtk = Math.max(this.nextAtk, this.ans.ts[2] + 0.35);
    }
    const N = this.ans;
    if (N && t >= N.t0 && !N.said) { N.said = 1; if (!this.ansTold) { this.ansTold = 1; this.say('YOUR TURN', 'TAP AS EACH GOLD RING CLOSES', 'دورك', 'اضغط لما كل حلقة دهبي تقفل', '#ffe9a0', 1.3); } this.g.sfx('uiGo'); }
    if (N && !N.missed && t > N.ts[2] + ANS_WIN && N.n < 3) { N.missed = 1; if (this.kcombo) { this.kcombo = 0; this.log('combo:lost'); } } // a ring passed without a knock: the combo breaks
    if (N && t > N.ts[2] + 0.6) this.ans = null;
  }
  function answerTap() {
    const N = this.ans, t = this.t, g = this.g;
    if (!N || t < N.t0) return;
    for (let i = 0; i < 3; i++) {
      if (N.hit[i] || Math.abs(t - N.ts[i]) > ANS_WIN) continue;
      N.hit[i] = t; N.n++;
      const perfect = N.n === 3;
      this.kcombo = (this.kcombo || 0) + 1; this.kcomboT = t; this.kbest = Math.max(this.kbest || 0, this.kcombo);
      if (this.kcombo % 5 === 0) { g.sfx('comboUp', { n: this.kcombo }); this.log('combo:' + this.kcombo); }
      this.flashA = t; // the edges glow
      this.stats.answers = (this.stats.answers || 0) + 1; if (perfect) this.stats.perfect = (this.stats.perfect || 0) + 1;
      g.sfx('knockMe', { n: N.n }); this.addStreak(); this.gain(perfect ? 'grand' : 'seal'); this.log(perfect ? 'answer:perfect' : 'answer');
      const p = g.p, cx = p.x + 6, cy = p.y + 6, col = COMBO_COL[Math.min(4, Math.floor(this.kcombo / 5))];
      if (!g.settings.reduceFx) { g.hitstop = Math.max(g.hitstop, perfect ? 0.11 : 0.035); g.shake = Math.max(g.shake, perfect ? 0.5 : 0.14); }
      g.burst(cx, cy, [col, '#ffe9a0', '#ffffff'], perfect ? 26 : 9, perfect ? 150 : 90, perfect ? 2 : 1);
      if (perfect) { // the half-cube is thrown: slow-mo, a punch-in on his face, an impact frame, a storm of colour
        g.skill('PERFECT ANSWER', '#ffe9a0', 80, 0.12); this.whip(6, -3, 0.03, 0.4); this.impact(1.1);
        g.slowT = Math.max(g.slowT, 0.45); g.flash = 0.9; g.flashCol = ACCENT[this.dim] || '#ffe9a0';
        this.fx('cubeStrike', 1.1, { col: ACCENT[this.dim] || '#ffe9a0' }); g.sfx('cubeStrike');
      }
      this.damage(ANS_DMG + (perfect ? ANS_BONUS : 0) + Math.floor(this.kcombo / 5));
      if (this.mode !== 'fight') this.ans = null;
      return;
    }
  }
  function answerBot() { // the test bot answers on the beat, and keeps still otherwise while it is its turn
    const N = this.ans, t = this.t;
    if (!N || t < N.t0 - 0.05) return undefined;
    for (let i = 0; i < 3; i++) if (!N.hit[i] && t >= N.ts[i] - 0.004 && t <= N.ts[i] + ANS_WIN * 0.6) return true;
    return false;
  }
  function drawAnswer(ctx, S) {
    const N = this.ans, t = this.t; if (!N || t < N.t0 - 0.25 || this.mode !== 'fight') return;
    const y = 50, a = clamp((t - (N.t0 - 0.25)) / 0.25, 0, 1);
    ctx.globalAlpha = a;
    rect(ctx, W / 2 - 46, y - 13, 92, 26, 'rgba(5,6,13,0.6)');
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 28 + i * 28, hit = N.hit[i], q = N.ts[i] - t, gone = !hit && q < -ANS_WIN;
      ctx.fillStyle = hit ? '#ffe9a0' : gone ? 'rgba(120,60,70,0.7)' : 'rgba(255,233,160,0.15)'; ctx.beginPath(); ctx.arc(x, y, hit ? 7 + clamp(1 - (t - hit) / 0.2, 0, 1) * 4 : 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = gone ? '#7a3a44' : '#ffe9a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
      if (!hit && !gone && q < 1.2) { const inWin = Math.abs(q) <= ANS_WIN; ctx.strokeStyle = inWin ? '#7fffb0' : '#ffffff'; ctx.lineWidth = inWin ? 2.5 : 1; ctx.beginPath(); ctx.arc(x, y, 7 + Math.max(0, q) * 22, 0, Math.PI * 2); ctx.stroke(); }
      ctx.lineWidth = 1;
    }
    ctx.globalAlpha = 1;
    font.draw(ctx, 'YOUR TURN', W / 2, y - 24, { color: '#ffe9a0', align: 'center', outline: '#05060d' });
    for (const ht of N.hit) { // each knock that lands flies to him as a ring
      if (!ht) continue; const d = (t - ht) / 0.45; if (d >= 1) continue;
      const x = S.hx + (S.bs[0] - S.hx) * eo(d), yy = S.hy + (S.bs[1] - 30 - S.hy) * eo(d);
      ctx.strokeStyle = 'rgba(255,233,160,' + (1 - d).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, yy, 6 + d * 16, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - d)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(S.hx, S.hy, d * 60, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ------------------------------------------------------------------ the ending you play: KNOCK THREE TIMES
  const BEAT = [2.2, 2.9, 3.6], WIN = 0.2; // (the first ring closes once the banner has been read)
  function finaleStart() {
    const g = this.g;
    this.mode = 'finale'; this.modeT0 = this.t; this.hp = 1;
    this.fin = { n: 0, c0: this.t, miss: 0, good: [] };
    this.clearField(); this.orbs = []; this.bolts = []; this.gravT = 0; this.pend = []; this.knk = []; this.cues = []; this.beatRow = null; this.ans = null;
    this.invulnT = this.t + 999;
    this.impact(0.8); g.slowT = Math.max(g.slowT, 0.6);
    g.sfx('clashIn');
    this.say('KNOCK THREE TIMES', 'TAP AS EACH RING CLOSES', 'دُق تلات مرات', 'اضغط لما كل حلقة تقفل', '#ffe9a8', 2.4);
    this.log('finale');
  }
  function finaleTick() {
    const F2 = this.fin, t = this.t;
    if (t > F2.c0 + BEAT[F2.n] + WIN) { F2.n = 0; F2.good = []; F2.miss++; F2.c0 = t - 1.3; this.log('fin:late'); } // missed the beat: the rhythm starts again
  }
  function finaleTap() {
    const F2 = this.fin, t = this.t, g = this.g, d = t - (F2.c0 + BEAT[F2.n]);
    if (Math.abs(d) <= WIN) {
      F2.n++; F2.good.push(t);
      g.sfx('knock', { strike: F2.n === 3 }); this.whip(0, 4, 0, 0.25); this.log('fin:good');
      if (!g.settings.reduceFx) g.shake = Math.max(g.shake, 0.12 + F2.n * 0.06);
      if (F2.n === 3) { this.finaleDone = 1; this.hp = 0; this.mode = 'fight'; this.startDying(); }
    } else { F2.n = 0; F2.good = []; F2.miss++; F2.c0 = t - 1.2; g.sfx('lock'); this.log('fin:miss'); }
  }
  function finaleBot() { const F2 = this.fin; return this.t >= F2.c0 + BEAT[F2.n] - 0.005; }
  function drawFinale(ctx, S) {
    const F2 = this.fin, t = this.t, el = t - this.modeT0;
    ctx.fillStyle = 'rgba(2,2,6,' + (0.5 * clamp(el / 0.5, 0, 1)).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
    for (const gt of F2.good) { const d = (t - gt) / 0.8; if (d < 1) { ctx.strokeStyle = 'rgba(255,233,160,' + (0.9 * (1 - d)).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S.hx, S.hy, d * 240, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; } }
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 44 + i * 44, y = 122, done = i < F2.n, cur = i === F2.n, tb = F2.c0 + BEAT[i], q = tb - t;
      ctx.fillStyle = done ? '#ffe9a0' : 'rgba(5,6,13,0.75)'; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = done ? '#ffffff' : i === 2 ? '#ff5a6e' : '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
      if (cur && q > -WIN && q < 1.1) { const inWin = Math.abs(q) <= WIN; ctx.strokeStyle = inWin ? '#7fffb0' : '#ffffff'; ctx.lineWidth = inWin ? 3 : 1.5; ctx.beginPath(); ctx.arc(x, y, 13 + Math.max(0, q) * 34, 0, Math.PI * 2); ctx.stroke(); }
      ctx.lineWidth = 1;
      font.draw(ctx, String(i + 1), x, y - 4, { color: done ? '#1a1030' : '#ffffff', align: 'center', outline: done ? null : '#05060d' });
    }
    if (el > 2.5) font.draw(ctx, F2.miss && F2.n === 0 ? 'TAP WHEN THE RING CLOSES' : 'KNOCK!', W / 2, 96, { color: '#ffe9a0', align: 'center', outline: '#05060d' });
    if (false) font.draw(ctx, '', W / 2, 106, { color: '#ff9ab0', align: 'center', outline: '#05060d' });
  }

  // ------------------------------------------------------------------ the boss
  FF.registerBoss({
    id: 'niro', name: 'PALE NIRO', nameAr: 'نيرو الباهت', world: 'niro', hp: 260, hero: 'mino', heroName: 'MINO', heroNameAr: 'مينو',
    story: true, dims: DIMS, reward: { skin: 'niro', name: 'NIRO + PALE NIRO' }, fallTitle: ['NIRO IS FREE', 'نيرو اتحرر'], rim: ['#cfe6ff', '#e8f1ff', '#9ff0ff'],
    amb: 'niro', flashCol: '#e8f1ff', transFx: 'niroTrans', noOrbs: true, styleUlt: true, onTap: answerTap, botFlip: answerBot,
    sfxMap: { bossWarn: 'niroWarn', bossCharge: 'niroCharge', bossRoar: 'niroBreath', shiftBoom: 'niroShift', thunder: 'niroCrack', bossHit: 'niroChip', stingVS: 'niroVS', stingVictory: 'niroFree' },
    phases: [
      { speed: 135, tele: 1.13, rest: 0.95, overlap: 0, combo: 0, orbEvery: 1.1, waves: 1, cleavers: 2, cleaveInt: 0.8, pillars: 2, pillarInt: 0.95, sweeps: 1, gap: 0.8, waveV: 235, beat: 0.74 },
      { speed: 148, tele: 0.98, rest: 0.65, overlap: 0, combo: 0.15, orbEvery: 1.15, waves: 2, cleavers: 3, cleaveInt: 0.72, pillars: 3, pillarInt: 0.85, sweeps: 1, gap: 0.74, waveV: 260, beat: 0.68 },
      { speed: 158, tele: 0.88, rest: 0.42, overlap: 0.04, combo: 0.3, orbEvery: 1.15, waves: 2, cleavers: 3, cleaveInt: 0.66, pillars: 3, pillarInt: 0.78, sweeps: 2, gap: 0.68, waveV: 280, beat: 0.64 }
    ],
    hearts: 3, continues: 3, invuln: 1.4,
    lines: {
      entrance: ['YOU LET GO OF MY HAND.', 'إنت سبت إيدي.'],
      reply: ['I NEVER LET GO.', 'أنا عمري ما سبتها.'],
      p2: ['THREE OF ME. NONE FORGIVE YOU.', 'تلاتة مني. ولا واحد هيسامحك.'],
      p3: ['THEN FALL, LIKE I FELL!', 'يبقى اقع، زي ما أنا وقعت!'],
      awake: ['I REMEMBER THE RHYTHM.', 'أنا فاكر الإيقاع.'],
      big: ['HOLD ON, NIRO!', 'استحمل يا نيرو!'],
      counter: ['I KNOW YOUR RHYTHM.', 'أنا حافظ إيقاعك.'],
      hurt: [['STOP KNOCKING!', 'بطّل تخبط!'], ['YOU LEFT ME THERE!', 'إنت سبتني هناك!'], ['A THOUSAND DAYS...', 'ألف يوم...']],
      fall: ['...THAT SOUND. I KNOW THAT SOUND.', '...الصوت ده. أنا عارف الصوت ده.'],
      mock: [['YOU LET GO AGAIN.', 'سبت تاني.'], ['GO HOME, BROTHER.', 'روّح يا أخويا.'], ['THE DARK KEEPS ME.', 'الضلمة ماسكاني.']]
    },
    attacks: ATTACKS,
    rect(h, t, camAt) {
      if (h.k === 'pit') return [h.wx, h.side === 'f' ? F - 5 : C, h.w, 5];
      if (h.k === 'gaze') return h.side === 'c' ? [camAt - 30, C, 262, MID - 3 - C] : [camAt - 30, MID + 3, 262, F - MID - 3];
      if (h.k === 'fist') { if (t > h.te) return null; return [h.wx, h.side === 'f' ? F - 36 : C, h.w, 36]; }
      if (h.k === 'quake' || h.k === 'dash') { const sx = h.sx0 - h.v * (t - h.tl); if (sx < -80) return null; return [camAt + sx, h.side === 'f' ? F - h.h : C, h.w, h.h]; }
      return null;
    },
    attackFx() { /* (the Tyrant's chains and cleaver storms are not his) */ },
    tick(t) {
      answerPlan.call(this, t);
      if (this.pend && this.pend.length) {
        for (const e of this.pend) if (!e.done && t >= e.at) { e.done = 1; if (t - e.at < 0.1) e.fn.call(this); } // (stale ones from before a transition are dropped)
        this.pend = this.pend.filter((e) => !e.done);
      }
      if (this.knk && this.knk.length) {
        for (const k of this.knk) if (!k.done && t >= k.t) {
          k.done = 1;
          if (t - k.t > 0.1) continue;
          this.g.sfx('knock', { strike: k.strike }); this.flashK = t; this.lastKnock = k;
          if (k.strike && !this.g.settings.reduceFx) this.g.shake = Math.max(this.g.shake, 0.12);
        }
        this.knk = this.knk.filter((k) => !k.done || t - k.t < 0.8);
      }
      if (this.cues && this.cues.length) {
        for (const c of this.cues) if (!c.done && t >= c.t) { c.done = 1; if (t - c.t < 0.1) { const g = this.g; g.sfx(c.s, c.o); if (c.s === 'gaze' || c.s === 'fistSlam' || c.s === 'quakeRun') this.flashK = t; if (!g.settings.reduceFx) { if (c.s === 'fistSlam') { g.shake = Math.max(g.shake, 0.38); g.hitstop = Math.max(g.hitstop, 0.04); } else if (c.s === 'quakeRun') g.shake = Math.max(g.shake, 0.2); else if (c.s === 'gaze') g.shake = Math.max(g.shake, 0.25); } } }
        this.cues = this.cues.filter((c) => !c.done);
      }
    },
    onDim(D) {
      const di = DIMS.indexOf(D); if (di >= 0 && !this.g.settings.reduceFx) { this.g.flash = 1.2; this.g.flashCol = ACCENT[di]; } // b45: each world arrives in its own colour
      this.darkT0 = D.id === 'dark' ? this.t : this.darkT0;
      this.g.sfx({ dark: 'lightsOut', echo: 'echoSplit', memory: 'niroCrack', fall: 'pitCrack', ledge: 'quake' }[D.id] || 'niroCrack');
    },
    finale: finaleStart, finaleTick, finaleTap, finaleBot,
    onDying() { this.fx('niroFree', 3.4); },
    drawBoss(g, rt) { paintNiro.call(this, g, rt); }
  });

  // ------------------------------------------------------------------ the boss painter (into the fight's 170² buffer)
  // He is alive: a pose for every attack, a scream when the world changes, the brother flickering through when he is hit,
  // and at the very end his own colours coming back.
  function paintNiro(g, rt) {
    const T = this.t === undefined ? rt : this.t, t = rt, ph = this.phase || 0, A = this.anim || { kind: 'idle', hits: [] }, mode = this.mode;
    const r = (x, y, w, h, c) => rect(g, x, y, w, h, c), el = T - (this.modeT0 || 0);
    const free = mode === 'dying' ? ease(clamp(el / 2.4, 0, 1)) : mode === 'reward' || mode === 'won' ? 1 : 0, fin = mode === 'finale' && this.fin ? this.fin.n / 3 : 0;
    const sk = mix('#b9c4cc', '#c98d5a', free), skd = mix('#8b98a3', '#9c6539', free), skl = mix('#d6dee3', '#e6b683', free), hair = mix('#0e1018', '#2a1a10', free);
    const band = free > 0 ? mix('#7f8a96', '#3fb39a', free) : ph === 2 && Math.sin(t * 7) > 0.6 ? '#3fb39a' : '#7f8a96', shirt = mix('#2a3140', '#2f7d6b', free);
    const tele = A.tl !== undefined && T < A.tl, k0 = A.tl > A.t0 ? clamp((T - A.t0) / (A.tl - A.t0), 0, 1) : 1, hitNow = (A.hits || []).some((h) => T >= h && T < h + 0.2);
    const rec = clamp(1 - (T - (this.hitT === undefined ? -9 : this.hitT)) / 0.22, 0, 1), scream = mode === 'trans' && el < 1.7 ? Math.sin(clamp(el / 1.7, 0, 1) * Math.PI) : 0;
    let hx = Math.sin(t * 0.9) * 1.5 + rec * 6, hy = Math.sin(t * 1.7) * 1.5 - rec * 3 - scream * 5;
    if (A.kind === 'drop' && tele) hy -= 3 * k0;
    if (A.kind === 'gaze') hy += 3;
    if (mode === 'finale') { hx += Math.sin(t * 40) * 1.5 * (1 - fin); hy += 4; }
    hy += free * 4; hx = Math.round(hx); hy = Math.round(hy);
    // shoulders that dissolve into the Void, block by block (he comes back together as he is freed)
    r(44, 68, 82, 20, shirt); r(44, 68, 82, 2, mix('#3c4558', '#3fb39a', free)); r(38, 74, 8, 14, shirt); r(124, 74, 8, 14, mix('#1c212d', '#1d5246', free)); r(66, 64, 38, 8, mix('#1c212d', '#1d5246', free));
    for (let y = 88; y < 144; y += 4) for (let x = 38; x < 132; x += 4) {
      const hh = hash(x * 7 + y * 13), gone = ((y - 88) / 56) * (1 - free * 0.85) + scream * 0.15;
      if (hh < gone) continue;
      const dy = ((t * 6 + hh * 24) % 4) * (1 - free), dx = Math.sin(t * 2 + y * 0.3) * (gone * 3);
      r(x + dx, y + dy, 4, 4, hh > 0.85 ? mix('#3a4058', '#3fb39a', free) : y < 104 ? shirt : mix('#141826', '#1d5246', free));
    }
    const nc = Math.round(7 * (1 - free));
    for (let i = 0; i < nc; i++) { const a = t * (0.6 + i * 0.05 + scream * 2) + i * 0.9, R = 58 + (i % 3) * 8 + scream * 14, x = 85 + Math.cos(a) * R, y = 74 + Math.sin(a) * R * 0.45, s = 4 + (i % 3) * 2; r(x, y, s, s, '#1a1e2e'); r(x, y, s, 1, '#3a4058'); }
    r(74 + hx, 58 + hy, 22, 12, skd);
    // ---- the fists: every attack has its own gesture
    let lx = 24, ly = 76, rx = 128, ry = 72, blade = 0;
    if (A.kind === 'knock' || A.kind === 'knock2') { const k = this.lastKnock, d = k ? T - k.t : 9; ry += d < 0.12 ? 12 * (1 - d / 0.12) : (tele ? -6 : 0); }
    else if (A.kind === 'pit') { const up = tele ? 26 * ease(k0) : 0; ly -= up; ry -= up; if (hitNow) { ly += 14; ry += 14; } }
    else if (A.kind === 'pslash') { if (tele) { ry -= 22 * ease(k0); blade = k0; } else if (hitNow) { ry += 10; rx -= 14; blade = 1; } }
    else if (A.kind === 'drop' && tele) { ly -= 10; ry -= 10; lx -= 6; rx += 6; }
    else if (A.kind === 'echo' && tele) { lx -= 8 * Math.sin(k0 * Math.PI); rx += 8 * Math.sin(k0 * Math.PI); }
    if (scream) { lx -= 10 * scream; rx += 8 * scream; ly += 8 * scream; ry += 8 * scream; }
    if (mode === 'finale') { lx = 40 + hx; ly = 22 + hy; rx = 112 + hx; ry = 22 + hy; } // hands on his head
    if (free > 0) { ly += free * 12; ry += free * 12; }
    const fist = (x, y) => { r(x, y, 20, 18, sk); r(x, y, 20, 3, skl); r(x + 16, y, 4, 18, skd); for (let i = 0; i < 3; i++) r(x + 3 + i * 5, y + 5, 1, 8, skd); r(x + 4, y + 18, 12, Math.max(4, 104 - y - 18 > 30 ? 30 : 104 - y - 18), shirt); };
    fist(lx, ly); fist(rx, ry);
    if (blade > 0) { const L = 46 * blade; r(rx + 8, ry - L, 4, L, '#e8f1ff'); r(rx + 8, ry - L, 1, L, '#ffffff'); r(rx + 11, ry - L, 1, L, '#7fe8ff'); }
    if (A.kind === 'pit' && hitNow) for (let i = 0; i < 5; i++) { r(lx - 8 + i * 9, ly + 20 + (i % 2) * 3, 5, 2, '#e8f1ff'); r(rx - 8 + i * 9, ry + 20 + (i % 2) * 3, 5, 2, '#e8f1ff'); }
    // ---- the head
    const X = 56 + hx, Y = 6 + hy;
    if (A.kind === 'echo' && tele) for (const o of [-26, 26]) { g.globalAlpha = 0.3 + 0.15 * Math.sin(t * 20); r(X + o * Math.sin(k0 * Math.PI), Y, 58, 56, '#b9c4cc'); r(X + o * Math.sin(k0 * Math.PI) + 7, Y + 25, 16, 10, '#ffffff'); r(X + o * Math.sin(k0 * Math.PI) + 35, Y + 25, 16, 10, '#ffffff'); g.globalAlpha = 1; }
    r(X, Y, 58, 56, sk); r(X + 52, Y, 6, 56, skd); r(X, Y + 50, 58, 6, skd); r(X, Y, 3, 50, skl);
    r(X - 4, Y - 8, 66, 16, hair); r(X - 4, Y + 8, 6, 18, hair); r(X + 56, Y + 8, 6, 18, hair);
    for (let i = 0; i < 8; i++) r(X + i * 7, Y + 7, 6, 3 + (i * 5) % 4, hair);
    r(X - 4, Y + 10, 66, 5, band); r(X - 4, Y + 10, 66, 1, mix('#a8b2bc', '#7fe8c8', free));
    const fl = Math.sin(t * 5) * 3 + scream * 6; r(X + 61, Y + 11, 10, 3, band); r(X + 68, Y + 13 + fl * 0.4, 4, 12, band); r(X + 63, Y + 14, 3, 9 + fl, mix('#5f6a76', '#1d5246', free));
    // brows: anger, then grief (the finale), then peace
    const ang = (0.3 + scream * 0.25) * (1 - free) * (1 - fin * 1.6);
    g.fillStyle = hair; g.save(); g.translate(X + 14, Y + 21); g.rotate(ang); g.fillRect(-9, -1.5, 18, 3); g.restore(); g.save(); g.translate(X + 44, Y + 21); g.rotate(-ang); g.fillRect(-9, -1.5, 18, 3); g.restore();
    // eyes: white and glowing... unless the brother shows through
    const flare = A.kind === 'gaze' ? (tele ? 0.5 + k0 : 1.6) : 0, ge = (0.75 + 0.25 * Math.sin(t * 9) + scream * 0.4 + flare) * (1 - free);
    const brother = (i) => free > 0.35 || (i === 1 && (rec > 0.2 || (ph === 2 && Math.sin(t * 3.1) > 0.7) || (fin > 0 && Math.sin(t * (6 + fin * 10)) > 1 - fin * 1.4)));
    [7, 35].forEach((ex, i) => {
      r(X + ex, Y + 25, 16, 10, '#ffffff');
      if (brother(i)) { r(X + ex + 5, Y + 26, 7, 8, '#5a3418'); r(X + ex + 7, Y + 28, 3, 4, '#150c08'); r(X + ex + 6, Y + 27, 2, 2, '#ffffff'); }
      else if (ge > 0.05) { const rad = 20 + flare * 10, gr = g.createRadialGradient(X + ex + 8, Y + 30, 0, X + ex + 8, Y + 30, rad); gr.addColorStop(0, 'rgba(255,255,255,' + clamp(0.7 * ge, 0, 1).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(X + ex + 8 - rad, Y + 30 - rad, rad * 2, rad * 2); }
    });
    if (A.kind === 'drop' && tele) for (const ex of [14, 42]) { g.fillStyle = 'rgba(255,255,255,' + (0.5 * k0).toFixed(2) + ')'; g.fillRect(X + ex, 0, 3, Y + 25); }
    r(X + 26, Y + 36, 6, 9, skd);
    // mouth: shut, screaming, or (at last) a small smile
    if (scream > 0.15) { const mh = Math.round(4 + scream * 10); r(X + 19, Y + 44, 20, mh, '#1a0a0e'); r(X + 20, Y + 44, 18, 2, '#f4f1ea'); }
    else if (free > 0.6) { r(X + 20, Y + 48, 18, 2, '#4a2413'); r(X + 18, Y + 46, 2, 2, '#4a2413'); r(X + 38, Y + 46, 2, 2, '#4a2413'); }
    else r(X + 20, Y + 48, 18, 2, '#3a2a2a');
    if ((fin >= 0.6 || free > 0) && brother(1)) { const tl2 = Math.min(18, (fin + free) * 14); r(X + 42, Y + 36, 2, tl2, 'rgba(190,245,255,0.9)'); r(X + 41, Y + 36 + tl2 - 2, 4, 3, '#e8fdff'); }
    // the Void's cracks: more each phase, closing as he remembers
    g.strokeStyle = scream > 0.3 ? '#ffffff' : '#0a0c12'; g.lineWidth = 1.2;
    const CR = [[[7, 25], [1, 16]], [[7, 35], [2, 46]], [[51, 25], [56, 14]], [[51, 35], [57, 44]], [[29, 24], [32, 12], [28, 2]], [[14, 39], [8, 52]], [[44, 39], [52, 52]]];
    const n = Math.round([3, 5, 7][ph] * (1 - Math.max(fin * 0.7, free)));
    for (let i = 0; i < n; i++) { const p = CR[i]; g.beginPath(); g.moveTo(X + p[0][0], Y + p[0][1]); for (let k = 1; k < p.length; k++) g.lineTo(X + p[k][0], Y + p[k][1]); g.stroke(); }
  }

  // ------------------------------------------------------------------ his world (one variant per dimension)
  const PAL = [
    { sky: ['#14040a', '#3a0c0a', '#7a2a0c'], wall: '#2a0e08', wallHi: '#5a2410', wood: '#3a160a', woodHi: '#9a4a1a', tile: '#3a1408', tileHi: '#ff8a3a', mote: ['#ffb14a', '#ff5a1a', '#ffe9a0'], lamp: '#ffb14a', gem: ['#ffd23f', '#ff8a3a', '#fff3c4'] },
    { sky: ['#050010', '#0c0424', '#1a0838'], wall: '#0e0620', wallHi: '#24104a', wood: '#120828', woodHi: '#3a1a6a', tile: '#0e0620', tileHi: '#ff3aa8', mote: ['#ff3aa8', '#3affe8'], lamp: '#ff3aa8', gem: ['#3affe8', '#ff3aa8', '#e8fdff'] },
    { sky: ['#06000e', '#1a0034', '#3a0058'], wall: '#120428', wallHi: '#e8f1ff', wood: '#1a0838', woodHi: '#7a3aff', tile: '#10022a', tileHi: '#3affe8', mote: ['#ff3aa8', '#3affe8', '#ffe93a'], lamp: '#3affe8', gem: ['#ff3aa8', '#3affe8', '#ffe93a'] },
    { sky: ['#3a1206', '#a8461a', '#ffc070'], wall: '#5a2a10', wallHi: '#8a4a1a', wood: '#4a220c', woodHi: '#c07a2a', tile: '#5a2c10', tileHi: '#ffd27a', mote: ['#ffd9a0', '#ffc8d8', '#fff0c8'], lamp: '#ffe9a0', gem: ['#ffd27a', '#ffc8d8', '#ffffff'] },
    null,
    { sky: ['#000610', '#001a3a', '#00507a'], wall: '#061a2a', wallHi: '#1a5a7a', wood: '#08202e', woodHi: '#2a7a9a', tile: '#0a1a26', tileHi: '#3affff', mote: ['#3affff', '#ffffff', '#b8a6ff', '#ff7ae8'], lamp: '#3affff', gem: ['#3affff', '#ff7ae8', '#ffffff'] }
  ];
  const GEM = (i) => [hash(i * 3 + 1) * 640, C + 14 + hash(i * 3 + 2) * (F - C - 44)]; // where the wall crystals sit (painted, then twinkled live)
  function paintSky(g, w, h, r, v) {
    const P = PAL[v]; g.fillStyle = BW.vgrad(g, 0, h, P.sky); g.fillRect(0, 0, w, h);
    if (v === 5) { const gr = g.createRadialGradient(w * 0.45, h + 40, 10, w * 0.45, h + 40, 220); gr.addColorStop(0, 'rgba(159,240,255,0.55)'); gr.addColorStop(1, 'rgba(159,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    if (v === 2) { for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(232,241,255,' + (0.05 + r() * 0.2).toFixed(2) + ')'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); } g.fillStyle = 'rgba(232,241,255,0.25)'; g.fillRect(0, MID, w, 1); }
  }
  function paintFar(g, w, h, r, v) {
    const P = PAL[v];
    if (v === 2) { // tall mirror shards: in each one, a pale face is looking back
      for (let i = 0; i < 9; i++) {
        const x = i * 72 + Math.floor(r() * 20), sw = 26 + Math.floor(r() * 18), y0 = 42 + Math.floor(r() * 16), y1 = 132 + Math.floor(r() * 16);
        const gr = g.createLinearGradient(x, y0, x + sw, y1); gr.addColorStop(0, '#1a1c2a'); gr.addColorStop(0.5, '#0a0a12'); gr.addColorStop(1, '#22263a');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + sw, y0 - 8); g.lineTo(x + sw + 6, y1); g.lineTo(x + 6, y1 + 8); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(232,241,255,0.55)'; g.lineWidth = 1; g.stroke();
        const cx = x + sw / 2 + 3, cy = (y0 + y1) / 2 - 6, fw = Math.floor(sw * 0.5);
        g.fillStyle = 'rgba(185,196,204,0.16)'; g.fillRect(cx - fw / 2, cy - fw / 2, fw, fw);
        g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(cx - fw / 2 + 2, cy - 1, 3, 2); g.fillRect(cx + fw / 2 - 5, cy - 1, 3, 2);
      }
      for (let i = 0; i < 16; i++) { const s = 4 + Math.floor(r() * 10), x = Math.floor(r() * w), y = 40 + Math.floor(r() * 100); g.fillStyle = '#10101a'; g.fillRect(x, y, s, s); g.fillStyle = 'rgba(207,230,255,0.2)'; g.fillRect(x, y, s, 1); g.fillRect(x, y, 1, s); }
      return;
    }
    if (v === 5) { // rock spires lit from below
      for (let x = 0; x < w; x += 18 + Math.floor(r() * 20)) { const top = 60 + Math.floor(r() * 60), bw = 10 + Math.floor(r() * 14); g.fillStyle = P.wall; g.fillRect(x, top, bw, h - top); g.fillStyle = 'rgba(159,240,255,0.28)'; g.fillRect(x, top, 1, h - top); g.fillRect(x, h - 30, bw, 30); }
      return;
    }
    for (let y = C; y < F; y += 13) for (let x = ((y / 13) & 1) * -12; x < w; x += 24) { g.fillStyle = P.wall; g.fillRect(x, y, 23, 12); g.fillStyle = P.wallHi; g.fillRect(x, y, 23, 1); }
    if (v === 3) { // the workshop: shelves of carved half-cubes, and the pictures they kept
      for (const sy of [74, 118]) { g.fillStyle = P.wood; g.fillRect(0, sy, w, 4); g.fillStyle = P.woodHi; g.fillRect(0, sy, w, 1);
        for (let x = 6; x < w; x += 22 + Math.floor(r() * 18)) { const s = 6 + Math.floor(r() * 6); g.fillStyle = '#b9a37c'; g.fillRect(x, sy - s, s, s); g.fillStyle = '#e6d6b0'; g.fillRect(x, sy - s, s, 1); g.fillStyle = '#7d6a4a'; g.fillRect(x + s - 1, sy - s, 1, s); } }
      for (let i = 0; i < 6; i++) { // framed memories: two small figures, side by side
        const x = 30 + i * 104, y = 84 + (i % 2) * 6;
        g.fillStyle = '#2a1608'; g.fillRect(x, y, 34, 26); g.fillStyle = '#7a4a22'; g.fillRect(x, y, 34, 1); g.fillRect(x, y, 1, 26);
        const gr = g.createLinearGradient(0, y, 0, y + 26); gr.addColorStop(0, '#ffd9a0'); gr.addColorStop(1, '#c0703a'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, 28, 20);
        g.fillStyle = '#b5532a'; g.fillRect(x + 9, y + 12, 5, 9); g.fillStyle = '#2f7d6b'; g.fillRect(x + 19, y + 12, 5, 9); g.fillStyle = '#c98d5a'; g.fillRect(x + 9, y + 7, 5, 5); g.fillRect(x + 19, y + 7, 5, 5); g.fillStyle = '#2a1a10'; g.fillRect(x + 9, y + 7, 5, 2); g.fillRect(x + 19, y + 7, 5, 2);
      }
    } else { // the mines: dark alcoves, and crystals growing out of the stone
      for (let i = 0; i < 8; i++) { const x = Math.floor(r() * w), y = C + 20 + Math.floor(r() * 80); g.fillStyle = '#0a0604'; g.fillRect(x, y, 10, 14); }
      for (let i = 0; i < 16; i++) { const [x, y] = GEM(i); for (let k = 0; k < 3; k++) { const sx = x + k * 5 - 5, sh = 5 + ((i + k) % 3) * 3; g.fillStyle = P.gem[(i + k) % 3]; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + 3, y - sh); g.lineTo(sx + 6, y); g.closePath(); g.fill(); } }
    }
  }
  function paintMid(g, w, h, r, v) {
    const P = PAL[v];
    if (v === 2) { for (let i = 0; i < 8; i++) { const s = 14 + Math.floor(r() * 22), x = Math.floor(r() * w), y = 50 + Math.floor(r() * 80); g.fillStyle = '#07070c'; g.fillRect(x, y, s, s); g.fillStyle = 'rgba(232,241,255,0.35)'; g.fillRect(x, y, s, 1); } return; }
    if (v === 5) { for (let x = 0; x < w; x += 9 + Math.floor(r() * 16)) { const l = 6 + Math.floor(r() * 26); g.fillStyle = P.wall; g.fillRect(x, C, 5, l); g.fillRect(x + 1, C + l, 3, 4); } return; }
    for (let i = 0; i < 4; i++) {
      const x = 64 + i * 140;
      g.fillStyle = P.wood; g.fillRect(x, C, 6, F - C); g.fillStyle = P.woodHi; g.fillRect(x, C, 1, F - C);
      g.fillStyle = P.wood; g.fillRect(x - 20, C + 4, 46, 5); g.fillStyle = P.woodHi; g.fillRect(x - 20, C + 4, 46, 1);
      for (let k = 0; k < 12; k++) { g.fillStyle = P.wood; g.fillRect(x - 14 + k, C + 9 + k, 2, 2); g.fillRect(x + 18 - k, C + 9 + k, 2, 2); } // braces
      for (let y = C + 9; y < C + 40 + (i % 2) * 14; y += 3) { g.fillStyle = '#0a0604'; g.fillRect(x + 60 + ((y / 3) & 1), y, 2, 2); } // a hanging chain
    }
  }
  function paintTile(g, w, h, r, v, top) {
    const P = PAL[v];
    g.fillStyle = P.tile; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, 0, 1, h); }
    for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 4 + Math.floor(r() * 6), 1); }
    g.fillStyle = P.tileHi; g.fillRect(0, top ? 0 : h - 1, w, 1);
    if (v === 5) for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(159,240,255,0.5)'; g.fillRect(Math.floor(r() * w), top ? 1 : h - 3, 1, 2); }
  }
  const CORE_F = [[[0, -46], [-22, -10], [0, -4]], [[0, -46], [22, -10], [0, -4]], [[-22, -10], [-14, 20], [0, -4]], [[22, -10], [14, 20], [0, -4]], [[-14, 20], [0, 46], [0, -4]]]; // (one facet is gone)
  const CORE_C = ['#d6fbff', '#8fe4f2', '#62c6dc', '#44a6c2', '#3390b0'];
  BW.register({
    id: 'niro', name: 'THE OLD MINES', nameAr: 'المناجم القديمة',
    variants: DIMS.map((d) => d.name), transition: 'rip', seam: '#e8f1ff',
    layers(v) {
      const k = 'niro45:' + v;
      return {
        sky: BW.layer(k + ':sky', W, H, (g, w, h, r) => paintSky(g, w, h, r, v)),
        far: BW.layer(k + ':far', 640, H, (g, w, h, r) => paintFar(g, w, h, r, v)),
        mid: BW.layer(k + ':mid', 560, H, (g, w, h, r) => paintMid(g, w, h, r, v)),
        floor: BW.layer(k + ':floor', 64, H - F, (g, w, h, r) => paintTile(g, w, h, r, v, true)),
        ceil: BW.layer(k + ':ceil', 64, C, (g, w, h, r) => paintTile(g, w, h, r, v, false))
      };
    },
    drawVariant(ctx, v, cam, t, st) {
      if (v === 4) { if (st.tunnel) return st.tunnel(ctx); v = 2; }
      const L = this.layers(v), P = PAL[v];
      ctx.drawImage(L.sky, 0, 0);
      if (st.sky) st.sky(ctx, v);
      if (v === 5) { // THE LEDGE: the broken Core hangs in the pit, breathing light, its shards circling it
        const pu = 0.5 + 0.5 * Math.sin(t * 2.2), cx = 150 - ((cam * 0.03) % 30), cy = 78 + Math.sin(t * 0.9) * 2;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.05 + 0.04 * pu; ctx.fillStyle = '#9ff0ff';
        for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * 0.12; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 320, cy + Math.sin(a) * 320); ctx.lineTo(cx + Math.cos(a + 0.07) * 320, cy + Math.sin(a + 0.07) * 320); ctx.fill(); }
        ctx.restore();
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80); gr.addColorStop(0, 'rgba(255,255,255,' + (0.35 + 0.2 * pu).toFixed(2) + ')'); gr.addColorStop(0.4, 'rgba(159,240,255,0.25)'); gr.addColorStop(1, 'rgba(159,240,255,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 80, cy - 80, 160, 160);
        CORE_F.forEach((tri, i) => { ctx.fillStyle = CORE_C[i]; ctx.beginPath(); tri.forEach((p, k) => (k ? ctx.lineTo(cx + p[0] * 0.8, cy + p[1] * 0.8) : ctx.moveTo(cx + p[0] * 0.8, cy + p[1] * 0.8))); ctx.closePath(); ctx.fill(); });
        ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(cx, cy + 36); ctx.lineTo(cx - 3, cy + 20); ctx.lineTo(cx + 4, cy + 8); ctx.lineTo(cx - 2, cy - 6); ctx.lineTo(cx + 5, cy - 20); ctx.stroke();
        for (let i = 0; i < 9; i++) { const a = t * (0.4 + hash(i) * 0.4) + i * 0.7, rr = 44 + i * 5, sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr * 0.45; ctx.fillStyle = i % 3 ? '#9ff0ff' : '#ffffff'; ctx.beginPath(); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx + 3, sy); ctx.lineTo(sx, sy + 4); ctx.lineTo(sx - 3, sy); ctx.closePath(); ctx.fill(); }
      }
      BW.tile(ctx, L.far, cam * 0.15, 0);
      if (v === 0) { // the ember mines: lava glows under the floor and the far wall breathes heat
        const pu = 0.5 + 0.5 * Math.sin(t * 2.6), gr = ctx.createLinearGradient(0, F - 50, 0, F); gr.addColorStop(0, 'rgba(255,90,20,0)'); gr.addColorStop(1, 'rgba(255,90,20,' + (0.18 + 0.12 * pu).toFixed(2) + ')'); ctx.fillStyle = gr; ctx.fillRect(0, F - 50, W, 50);
      }
      if (v === 1 || v === 2) { // neon: a grid of light on the far wall, pulsing with his knocks
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = v === 1 ? 'rgba(255,58,168,0.10)' : 'rgba(58,255,232,0.10)'; ctx.beginPath();
        for (let x = -((cam * 0.2) % 24); x < W; x += 24) { ctx.moveTo(x, C); ctx.lineTo(x - 30, F); } for (let y = C + 12; y < F; y += 18) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); ctx.restore();
      }
      if (v === 0 || v === 1) { // the crystals in the stone catch the light
        for (let i = 0; i < 16; i++) { const [gx, gy] = GEM(i), sx = ((gx - cam * 0.15) % 640 + 640) % 640, tw = Math.sin(t * (2 + hash(i) * 3) + i * 1.7); if (sx < W + 4 && tw > 0.55) { ctx.fillStyle = v === 1 ? 'rgba(159,240,255,0.5)' : '#ffffff'; ctx.fillRect(Math.round(sx), Math.round(gy - 8), 1, 5); ctx.fillRect(Math.round(sx) - 2, Math.round(gy - 6), 5, 1); } }
      }
      if (v === 1) { // THE DARK is not empty: pale eyes open and shut far away
        for (let i = 0; i < 12; i++) { const sx = ((i * 97 + 30 - cam * 0.1) % 640 + 640) % 640, sy = C + 16 + hash(i + 40) * (F - C - 40), open = Math.sin(t * (0.5 + hash(i) * 0.6) + i * 2.1); if (sx < W + 6 && open > 0.2) { const a = Math.min(1, (open - 0.2) * 3) * 0.7; ctx.fillStyle = 'rgba(232,241,255,' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(sx), Math.round(sy), 2, 1); ctx.fillRect(Math.round(sx) + 5, Math.round(sy), 2, 1); } }
      }
      if (st.between) st.between(ctx, v);
      BW.tile(ctx, L.mid, cam * 0.45, 0);
      if (v === 2) { // a blade of light sweeps across the mirrors
        const bx = ((t * 90) % (W + 200)) - 100; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(232,241,255,0.07)'; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 26, 0); ctx.lineTo(bx - 34, H); ctx.lineTo(bx - 60, H); ctx.fill(); ctx.restore();
      }
      if (v === 3) { // warm light falls through the workshop in shafts
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,210,140,0.06)';
        for (let i = 0; i < 3; i++) { const x = ((i * 150 + 40 - cam * 0.3) % 450 + 450) % 450 - 60; ctx.beginPath(); ctx.moveTo(x, C); ctx.lineTo(x + 30, C); ctx.lineTo(x - 40 + Math.sin(t * 0.5 + i) * 6, F); ctx.lineTo(x - 80 + Math.sin(t * 0.5 + i) * 6, F); ctx.fill(); }
        ctx.restore();
      }
      if (v === 0 || v === 1 || v === 3) { // the lanterns hanging from the posts flicker
        const sc = cam * 0.45;
        for (let i = 0; i < 4; i++) {
          const sx = ((64 + i * 140 + 14 - sc) % 560 + 560) % 560;
          if (sx > W + 20) continue;
          const fl = 0.75 + 0.25 * Math.sin(t * 11 + i * 2) * Math.sin(t * 4.3 + i), y = C + 20;
          rect(ctx, sx - 1, C + 9, 1, 8, '#1a1008'); rect(ctx, sx - 3, y - 3, 6, 8, '#3a2a1b'); rect(ctx, sx - 2, y - 2, 4, 6, P.lamp);
          const gr = ctx.createRadialGradient(sx, y, 0, sx, y, 34 * fl); gr.addColorStop(0, FF.rgba(P.lamp, v === 1 ? 0.12 : 0.32)); gr.addColorStop(1, FF.rgba(P.lamp, 0));
          ctx.fillStyle = gr; ctx.fillRect(sx - 36, y - 36, 72, 72);
        }
      }
      BW.embers(ctx, cam, t, v === 2 ? 30 : v === 3 ? 34 : 22, P.mote, v === 5 ? 0.9 : 0.25);
      BW.tile(ctx, L.ceil, cam, 0);
      BW.tile(ctx, L.floor, cam, F);
    },
    drawFront(ctx, v, cam, t) {
      if (v === 3) { // the past: warm film
        ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,170,80,0.3)'; ctx.fillRect(0, 0, W, H); ctx.restore();
        const f = Math.floor(t * 14); for (let i = 0; i < 60; i++) rect(ctx, hash(i + f * 13) * W, hash(i * 3 + f * 7) * H, 1, 1, hash(i + f) > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.16)');
      }
      const L = BW.vignette();
      ctx.drawImage(L, 0, 0, W, 40, 0, 0, W, 40); ctx.drawImage(L, 0, H - 40, W, 40, 0, H - 40, W, 40);
      ctx.drawImage(L, 0, 40, 72, H - 80, 0, 40, 72, H - 80); ctx.drawImage(L, W - 72, 40, 72, H - 80, W - 72, 40, 72, H - 80);
    }
  });

  // ------------------------------------------------------------------ b44: every dimension is entered its own way
  // The effect lives for the whole transition. Until the swap (0.9 s in) it keeps a copy of the screen while three knocks
  // ripple out of him; after it, that copy leaves in the dimension's own manner over the new world.
  let shot = null;
  FX.niroTrans = {
    name: 'Niro: the world changes', owner: 'niro',
    post(ctx, f, el, k, S) {
      const cv = S.cv; if (!cv) return false;
      if (!shot) shot = FF.makeCanvas(W, H);
      if (el < 0.88) {
        const sg = shot.getContext('2d'); sg.imageSmoothingEnabled = false; sg.clearRect(0, 0, W, H); sg.drawImage(cv, 0, 0, W, H); f.has = 1;
        [0.5, 0.68, 0.86].forEach((kt, i) => { const d = (el - kt) / 0.5; if (d > 0 && d < 1) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - d)).toFixed(2) + ')'; ctx.lineWidth = 1 + i; ctx.beginPath(); ctx.arc(S.bs[0], S.bs[1] - 30, d * (150 + i * 60), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; } });
        if (f.to === 'dark') { const fl = el > 0.3 && Math.floor(el * 22) % 3 === 0 ? 0.5 : 0; if (fl) { ctx.fillStyle = 'rgba(0,0,0,' + fl + ')'; ctx.fillRect(0, 0, W, H); } } // the lanterns gutter
        return;
      }
      if (!f.has) return false;
      const q = clamp((el - 0.9) / 1.25, 0, 1), fl = clamp(1 - (el - 0.9) / 0.16, 0, 1);
      ctx.imageSmoothingEnabled = false;
      if (q < 1) {
        if (f.to === 'dark') { // LIGHTS OUT: the lit world shrinks to a circle around you, then that goes too
          const R = (1 - ease(q)) * 250; ctx.fillStyle = 'rgba(0,0,0,' + (0.9 * (1 - q)).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
          if (R > 2) { ctx.save(); ctx.beginPath(); ctx.arc(S.hx, S.hy, R, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(shot, 0, 0); ctx.restore(); ctx.strokeStyle = 'rgba(255,200,120,' + (1 - q).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S.hx, S.hy, R, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
        } else if (f.to === 'echo') { // THE MIRROR BREAKS: the world splits into strips that slide away, up and down
          const n = 8, sw = W / n;
          for (let i = 0; i < n; i++) { const d = clamp(q * 1.6 - i * 0.07, 0, 1), dy = ease(d) * (H + 20) * (i % 2 ? 1 : -1); if (d >= 1) continue; ctx.drawImage(shot, i * sw, 0, sw, H, i * sw, dy, sw, H); ctx.fillStyle = '#ffffff'; ctx.fillRect(i * sw, dy < 0 ? dy + H - 2 : dy, sw, 2); ctx.fillRect(i * sw, 0, 1, H); }
        } else if (f.to === 'memory') { // THE FILM BURNS: holes eat the picture from the middle, their edges glowing
          const cs = 16;
          for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) {
            const th = hash(x * 3.1 + y * 7.7) * 0.5 + Math.hypot(x + cs / 2 - W / 2, y + cs / 2 - H / 2) / 260, d = q * 1.5 - th;
            if (d > 0.1) continue;
            ctx.drawImage(shot, x, y, cs, cs, x, y, cs, cs);
            if (d > -0.08) { ctx.fillStyle = d > 0.02 ? 'rgba(255,240,200,0.85)' : 'rgba(255,140,40,0.6)'; ctx.fillRect(x, y, cs, cs); }
          }
        } else if (f.to === 'fall') { // THE FLOOR GIVES WAY: the world breaks into blocks and drops out from under you
          const cs = 20;
          for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) {
            const st = hash(x * 1.7 + y * 5.3) * 0.25 + (1 - y / H) * 0.3, d = clamp((q * 1.5 - st) / 0.9, 0, 1);
            if (d >= 1) continue;
            const dy = d * d * (H + 60), rot = d * (hash(x + y * 3) - 0.5) * 2.4;
            ctx.save(); ctx.translate(x + cs / 2, y + cs / 2 + dy); ctx.rotate(rot); ctx.drawImage(shot, x, y, cs, cs, -cs / 2, -cs / 2, cs, cs); if (d > 0) { ctx.strokeStyle = 'rgba(232,241,255,0.5)'; ctx.strokeRect(-cs / 2 + 0.5, -cs / 2 + 0.5, cs - 1, cs - 1); } ctx.restore();
          }
        } else { // THE LIGHT RISES: the tunnel lifts away in pieces as the Core's light floods up from below
          const cs = 20, wy = H - ease(q) * (H + 40);
          for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) {
            if (y + cs > wy + 40) continue;
            const d = clamp((y + cs - wy) / 40, 0, 1), dy = -d * d * 26;
            ctx.globalAlpha = 1 - d; ctx.drawImage(shot, x, y, cs, cs, x, y + dy, cs, cs); ctx.globalAlpha = 1;
          }
          const gr = ctx.createLinearGradient(0, wy - 10, 0, wy + 60); gr.addColorStop(0, 'rgba(159,240,255,0)'); gr.addColorStop(0.3, 'rgba(232,253,255,0.9)'); gr.addColorStop(1, 'rgba(159,240,255,0)'); ctx.fillStyle = gr; ctx.fillRect(0, wy - 10, W, 70);
        }
      }
      if (fl > 0) { ctx.fillStyle = (f.to === 'memory' ? 'rgba(255,220,160,' : 'rgba(255,255,255,') + fl.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
    }
  };
  FX.cubeStrike = { // b45 PERFECT ANSWER: MINO throws his half of the cube; it bursts on his brother in every colour
    name: 'Niro: the half-cube strike', owner: 'niro',
    front(ctx, f, el, k, S) {
      const hx = S.hx, hy = S.hy, bx = S.bs[0] - 6, by = S.bs[1] - 40, col = f.col || '#ffe9a0', fly = clamp(el / 0.32, 0, 1);
      if (fly < 1) {
        for (let i = 6; i >= 0; i--) {
          const q = clamp(fly - i * 0.035, 0, 1), e = eo(q), x = hx + (bx - hx) * e, y = hy + (by - hy) * e - Math.sin(q * Math.PI) * 46, sz = i ? 5 - i * 0.5 : 7;
          ctx.fillStyle = i ? FF.rgba(['#ffe9a0', col, '#ffffff'][i % 3], 0.6 - i * 0.07) : '#fff3c4'; ctx.fillRect(Math.round(x - sz / 2), Math.round(y - sz / 2), Math.round(sz), Math.round(sz * 1.3));
          if (!i) { const gr = ctx.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, 'rgba(255,233,160,0.9)'); gr.addColorStop(1, 'rgba(255,233,160,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 22, y - 22, 44, 44); }
        }
        return;
      }
      const d = el - 0.32, a = clamp(1 - d / 0.78, 0, 1);
      [col, '#ffe9a0', '#ffffff'].forEach((c, j) => { ctx.strokeStyle = FF.rgba(c, a); ctx.lineWidth = 3 - j; ctx.beginPath(); ctx.arc(bx, by, d * (240 + j * 70), 0, Math.PI * 2); ctx.stroke(); });
      ctx.lineWidth = 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.8;
      for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2 + 0.2, L = 30 + d * 260; ctx.fillStyle = ['#ff3aa8', '#3affe8', '#ffe93a', '#ffffff'][i % 4]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang - 0.04) * L, by + Math.sin(ang - 0.04) * L); ctx.lineTo(bx + Math.cos(ang + 0.04) * L, by + Math.sin(ang + 0.04) * L); ctx.fill(); }
      ctx.restore();
      for (let i = 0; i < 44; i++) { const ang = hash(i) * Math.PI * 2, sp = 60 + hash(i + 3) * 200, x = bx + Math.cos(ang) * sp * d, y = by + Math.sin(ang) * sp * d + d * d * 160; rect(ctx, x, y, 3, 3, FF.rgba(['#ff3aa8', '#3affe8', '#ffe93a', '#ff8a3a', '#7a5aff', '#ffffff'][i % 6], a)); }
      const pop = clamp(d / 0.12, 0, 1), sc = Math.round(5 - 2 * eo(pop));
      if (d < 0.75) { font.draw(ctx, 'PERFECT!', W / 2 + 2, 70, { color: col, align: 'center', scale: sc }); font.draw(ctx, 'PERFECT!', W / 2, 68, { color: '#ffffff', align: 'center', outline: '#05060d', scale: sc }); }
    },
    post(ctx, f, el) { if (el > 0.32 && el < 0.38) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore(); } } // the impact frame
  };
  FX.niroFree = { // the Void lets go of him: pale flakes fall away, warm light comes up, the three knocks ring out
    name: 'Niro: freed', owner: 'niro',
    front(ctx, f, el, k, S) {
      const bx = S.bs[0], by = S.bs[1] - 20;
      [0, 0.22, 0.44].forEach((kt) => { const d = (el - kt) / 0.9; if (d > 0 && d < 1) { ctx.strokeStyle = 'rgba(255,233,160,' + (0.9 * (1 - d)).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, d * 260, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; } });
      const a = clamp(el / 2.2, 0, 1), gr = ctx.createRadialGradient(bx, by, 0, bx, by, 60 + a * 120); gr.addColorStop(0, 'rgba(255,233,168,' + (0.55 * a).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,233,168,0)'); ctx.fillStyle = gr; ctx.fillRect(bx - 190, by - 190, 380, 380);
      for (let i = 0; i < 40; i++) { const t0 = hash(i) * 2.2, d = el - t0; if (d < 0 || d > 1.2) continue; const x = bx - 40 + hash(i + 9) * 80 + Math.sin(d * 4 + i) * 6, y = by - 30 + hash(i + 5) * 50 + d * d * 70; rect(ctx, x, y, 3, 3, 'rgba(185,196,204,' + (1 - d / 1.2).toFixed(2) + ')'); }
      for (let i = 0; i < 24; i++) { const ph = (el * (0.3 + hash(i) * 0.4) + hash(i + 3)) % 1; rect(ctx, bx - 60 + hash(i + 7) * 120, by + 60 - ph * 130, 1, 2, 'rgba(255,243,196,' + (a * (1 - ph)).toFixed(2) + ')'); }
    }
  };

  // ------------------------------------------------------------------ his marks on the fight (drawing only)
  const echoBuf = {};
  function cube(id, flip) { // a pre-drawn 2x cube of a skin (echoes)
    const k = id + (flip ? 'f' : '');
    if (!echoBuf[k]) { const c = FF.makeCanvas(40, 48), g = c.getContext('2d'); g.imageSmoothingEnabled = false; const tmp = FF.makeCanvas(20, 24); FF.drawFlippo(tmp.getContext('2d'), 4, 6, { skin: id, face: 'focus' }); if (flip) { g.translate(0, 48); g.scale(1, -1); } g.drawImage(tmp, 0, 0, 40, 48); echoBuf[k] = c; }
    return echoBuf[k];
  }
  function marks(ctx, S) {
    const t = this.t, cam = S.cam, rt = S.rt;
    // the rhythm row: three dots that fill on each knock (the third is the strike)
    const B = this.beatRow;
    if (B && t < B.ts[B.ts.length - 1] + 0.5 && t > B.t0) {
      const x0 = W / 2 - 20;
      for (let i = 0; i < 3; i++) {
        const on = t >= B.ts[i], strike = i === B.strike, x = x0 + i * 20, y = 48, pop = on ? clamp(1 - (t - B.ts[i]) / 0.25, 0, 1) : 0, rr = 4 + pop * 4;
        ctx.fillStyle = on ? (strike ? '#ff3a5a' : '#ffffff') : 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
        if (strike && !on) { ctx.strokeStyle = 'rgba(255,58,90,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke(); }
      }
    }
    // knock rings from his fist
    for (const k of this.knk || []) {
      const d = t - k.t; if (d < 0 || d > 0.7) continue;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - d / 0.7)).toFixed(2) + ')'; ctx.lineWidth = k.strike ? 2 : 1;
      ctx.beginPath(); ctx.arc(S.bs[0] + 50, S.bs[1] + 10, d * (k.strike ? 260 : 180), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }
    for (const h of this.hz) {
      if (h.dead) continue;
      // a knock wave's lane glows from the 2nd knock until the strike
      if (h.nw && t < h.tl + 0.05) { const y = h.side === 'f' ? F - 26 : C, pu = 0.25 + 0.2 * Math.sin(rt * 30); ctx.fillStyle = 'rgba(255,58,90,' + pu.toFixed(2) + ')'; ctx.fillRect(0, y, W, 26); }
      // the pit: cracks in its warning, then a hole with falling blocks
      if (h.k === 'pit') {
        const x = Math.round(h.wx - cam), top = h.side === 'f';
        if (x > W + 10 || x + h.w < -10) continue;
        if (t < h.tl) {
          const k = (t - h.t0) / (h.tl - h.t0), y = top ? F : C - 1;
          ctx.fillStyle = k > 0.6 && Math.floor(rt * 16) % 2 ? '#ff3a5a' : '#e8f1ff';
          for (let i = 0; i < h.w; i += 2) { const j = Math.round(Math.sin(i * 1.7 + h.wx) * 2 * k); ctx.fillRect(x + i, y + (top ? j : -j), 2, 1); }
          for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + i * 8, top ? F - 2 - k * 3 : C + 1 + k * 3, 1, 1);
        } else {
          const d = t - h.tl, y0 = top ? F : 0, hh = top ? H - F : C;
          rect(ctx, x, y0, h.w, hh, '#040306'); rect(ctx, x, top ? F : C - 1, h.w, 1, '#9ff0ff');
          for (let i = 0; i < 4; i++) { const by = (top ? F + 2 : C - 6) + (top ? 1 : -1) * d * d * 120 * (1 + i * 0.3); if (by > -8 && by < H + 8) rect(ctx, x + 3 + i * 8, by, 5, 5, '#3a2a1b'); }
        }
      }
      // the gaze: two thin lines from his eyes while it is a warning, then the whole half burns white
      if (h.k === 'gaze') {
        const y0 = h.side === 'c' ? C : MID + 3, hh = h.side === 'c' ? MID - 3 - C : F - MID - 3, ex = S.bs[0] - 12, ey = S.bs[1] - 42;
        if (t < h.tl) {
          const k = clamp((t - h.t0) / (h.tl - h.t0), 0, 1);
          ctx.fillStyle = 'rgba(232,241,255,' + (0.06 + 0.1 * k + (k > 0.7 && Math.floor(rt * 16) % 2 ? 0.1 : 0)).toFixed(2) + ')'; ctx.fillRect(0, y0, W, hh);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * k).toFixed(2) + ')'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(0, y0 + hh / 2); ctx.moveTo(ex + 20, ey); ctx.lineTo(0, y0 + hh / 2 + 6); ctx.stroke(); ctx.setLineDash([]);
        } else if (t <= h.te) {
          const fl = 0.75 + 0.25 * Math.sin(rt * 60);
          ctx.fillStyle = 'rgba(232,241,255,' + (0.8 * fl).toFixed(2) + ')'; ctx.fillRect(0, y0, W, hh);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, y0 + hh / 2 - 6, W, 12); ctx.fillStyle = '#9ff0ff'; ctx.fillRect(0, y0, W, 2); ctx.fillRect(0, y0 + hh - 2, W, 2);
          for (let i = 0; i < 14; i++) rect(ctx, hash(i + Math.floor(rt * 30)) * W, y0 + hash(i * 3 + Math.floor(rt * 30)) * hh, 6, 1, '#ffffff');
        }
      }
      // b45 VOID FISTS: a shadow and a target on the lane, the fist rushing in, then the slam (dust ring, cracks)
      if (h.k === 'fist') {
        const x = Math.round(h.wx - cam), top = h.side === 'c', lane = top ? C : F; if (x > W + 40 || x < -60) continue;
        const k = clamp((t - h.t0) / (h.tl - h.t0), 0, 1), col = ACCENT[this.dim] || '#ffffff';
        if (t < h.tl) {
          ctx.fillStyle = FF.rgba(col, 0.15 + 0.35 * k); ctx.fillRect(x - 4, top ? C : F - 3, h.w + 8, 3);
          ctx.strokeStyle = FF.rgba(col, 0.4 + 0.6 * k); ctx.beginPath(); ctx.ellipse(x + h.w / 2, lane, (1.6 - k) * 26 + 6, 3, 0, 0, Math.PI * 2); ctx.stroke();
          if (k > 0.55) { const e = (k - 0.55) / 0.45, fy = top ? H + 20 - e * e * (H + 20 - (C + 36)) : -60 + e * e * (F - 36 + 60); for (let i = 0; i < 6; i++) rect(ctx, x - 4 + i * 8, top ? fy + 40 : fy - 30 - (i % 2) * 10, 1, 22, FF.rgba('#ffffff', 0.25 + 0.3 * e)); drawFist(ctx, x - 6, fy, top, col); }
        } else {
          const d = t - h.tl;
          drawFist(ctx, x - 6, top ? C - 2 + Math.min(d, 0.3) * 6 : F - 36 + 2 - Math.min(d, 0.3) * 6, top, col);
          if (d < 0.5) { ctx.strokeStyle = FF.rgba('#ffffff', 1 - d * 2); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + h.w / 2, lane, 10 + d * 120, 3 + d * 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
          for (let i = 0; i < 8 && d < 0.6; i++) rect(ctx, x + h.w / 2 + Math.cos(i * 0.8) * d * 90, lane + (top ? 1 : -1) * (Math.abs(Math.sin(i * 1.3)) * d * 60 - d * d * 80), 3, 3, i % 2 ? col : '#3a2a1b');
        }
      }
      // b45 KNOCK QUAKE: cracks run along the lane, then the spikes erupt and race toward you
      if (h.k === 'quake') {
        const top = h.side === 'c', col = ACCENT[this.dim] || '#ffffff';
        if (t < h.tl) { const k = clamp((t - h.t0) / (h.tl - h.t0), 0, 1); ctx.fillStyle = FF.rgba(col, 0.12 + 0.3 * k * (Math.floor(rt * 14) % 2 ? 1 : 0.6)); ctx.fillRect(0, top ? C : F - 18, W, 18); for (let i = 0; i < 12; i++) rect(ctx, W - i * 26 * k, top ? C + 1 : F - 2, 14, 1, '#ffffff'); }
        else {
          const sx = h.sx0 - h.v * (t - h.tl);
          for (let i = 0; i < 8; i++) { const px = sx + i * 8, hh = h.h * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + t * 30))); ctx.fillStyle = i % 2 ? col : '#ffffff'; ctx.beginPath(); if (top) { ctx.moveTo(px, C); ctx.lineTo(px + 4, C + hh); ctx.lineTo(px + 8, C); } else { ctx.moveTo(px, F); ctx.lineTo(px + 4, F - hh); ctx.lineTo(px + 8, F); } ctx.fill(); }
          for (let i = 0; i < 10; i++) rect(ctx, sx + h.w + i * 7 + hash(i + Math.floor(rt * 20)) * 6, top ? C + 2 + hash(i) * 8 : F - 4 - hash(i) * 8, 3, 3, 'rgba(200,170,130,' + (0.8 - i * 0.07).toFixed(2) + ')');
        }
      }
      // three echoes: one is real (glowing eyes), and the real one moves among them until it settles
      if (h.echo && t >= h.t0 && t < h.tl + 0.2) {
        const span = h.tl - h.t0, k = (t - h.t0) / span, slots = [['f', F - 48], ['c', C], ['m', MID - 24]];
        let real = h.side === 'f' ? 0 : 1;
        if (k < 0.55) real = Math.floor(hash(h.seed + Math.floor((t - h.t0) / 0.13)) * 3);
        slots.forEach(([s, y], i) => {
          const isReal = i === real, gone = t >= h.tl && !isReal;
          if (gone) { const d = (t - h.tl) / 0.2; for (let j = 0; j < 6; j++) rect(ctx, 250 + 20 + Math.cos(j) * d * 30, y + 24 + Math.sin(j * 2) * d * 30, 3, 3, 'rgba(232,241,255,' + (1 - d).toFixed(2) + ')'); return; }
          ctx.globalAlpha = isReal ? 1 : 0.4 + 0.15 * Math.sin(rt * 20 + i);
          ctx.drawImage(cube('paleniro', s === 'c'), 250, y);
          ctx.globalAlpha = 1;
          if (isReal) { const gy = s === 'c' ? y + 28 : y + 20; const gr = ctx.createRadialGradient(270, gy, 0, 270, gy, 22); gr.addColorStop(0, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(248, gy - 22, 44, 44); }
        });
      }
    }
  }
  function dashMarks(ctx, S) { // drawn in front of him, so the echoes are seen leaving his body
    const t = this.t, rt = S.rt;
    for (const h of this.hz) {
      // b45 PRISM DASH: three coloured echoes wait at the edge, then dash with rainbow afterimages
      if (h.k === 'dash' && !h.dead) {
        const DC = ['#3affe8', '#ff3aa8', '#ffe93a'][h.col], top = h.side === 'c', y = top ? C : F - 24;
        if (t < h.tl) { const k = clamp((t - h.t0) / (h.tl - h.t0), 0, 1); ctx.globalAlpha = 0.35 + 0.65 * k; ctx.drawImage(cube('paleniro', top), 262 + (1 - k) * 40 + h.col * 14, top ? C : F - 48); ctx.globalAlpha = 1; ctx.fillStyle = FF.rgba(DC, 0.12 + 0.25 * k); ctx.fillRect(0, top ? C : F - 26, W, 26); }
        else {
          const sx = h.sx0 - h.v * (t - h.tl);
          for (let j = 6; j >= 1; j--) { ctx.globalAlpha = 0.12 + 0.06 * (6 - j); ctx.fillStyle = ['#ff3aa8', '#ffe93a', '#3affe8', '#7a5aff', '#ff8a3a', '#ffffff'][(j + h.col) % 6]; ctx.fillRect(sx + j * 12, y + 2, 14, 20); }
          ctx.globalAlpha = 1; ctx.drawImage(cube('paleniro', top), sx - 10, top ? C : F - 48); ctx.fillStyle = FF.rgba(DC, 0.5); ctx.fillRect(sx - 2, y, 20, 24);
        }
      }
    }
  }
  function drawFist(ctx, x, y, up, col) { // a giant fist, knuckles toward the lane: sleeve, glowing cuff, back of the hand, thumb, four curled fingers
    ctx.save(); ctx.translate(x, y + (up ? 38 : 0)); if (up) ctx.scale(1, -1);
    rect(ctx, 7, -70, 30, 62, '#1c212d'); rect(ctx, 7, -70, 5, 62, '#2a3140'); rect(ctx, 32, -70, 5, 62, '#0e1018');
    rect(ctx, 4, -12, 36, 6, col); rect(ctx, 4, -12, 36, 1, '#ffffff');
    rect(ctx, 0, -6, 44, 24, '#b9c4cc'); rect(ctx, 0, -6, 44, 3, '#e3ebf0'); rect(ctx, 40, -6, 4, 24, '#8b98a3'); rect(ctx, 0, -6, 2, 24, '#d6dee3');
    rect(ctx, -6, -2, 13, 15, '#c9d2d9'); rect(ctx, -6, -2, 13, 2, '#eef3f6'); rect(ctx, -6, 11, 13, 2, '#8b98a3'); rect(ctx, -6, -2, 2, 15, '#8b98a3');
    for (let i = 0; i < 4; i++) { const fx = 2 + i * 10; rect(ctx, fx, 16, 9, 15, '#d6dee3'); rect(ctx, fx, 16, 9, 2, '#ffffff'); rect(ctx, fx + 8, 16, 1, 15, '#8b98a3'); rect(ctx, fx + 1, 28, 7, 4, '#a8b2bc'); rect(ctx, fx + 2, 31, 5, 1, '#5f6a76'); }
    ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(16, 4); ctx.lineTo(13, 10); ctx.moveTo(30, -2); ctx.lineTo(27, 8); ctx.stroke(); // the Void's cracks
    ctx.fillStyle = FF.rgba(col, 0.55); ctx.fillRect(-4, 31, 50, 3);
    ctx.restore();
  }
  function darkness(ctx, S) {
    const t = this.t, k = clamp((t - (this.darkT0 || 0)) / 1.0, 0, 1), rev = clamp(1 - (t - (this.flashK || -9)) / 0.6, 0, 1), a = (0.9 - 0.62 * rev) * k;
    if (a <= 0.02) return;
    const b = this._dk || (this._dk = FF.makeCanvas(W, H)), g = b.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(2,2,5,' + a.toFixed(2) + ')'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    hole(S.hx, S.hy, 38); hole(S.bs[0], S.bs[1] - 42, 30);
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(b, 0, 0);
    // what you must see is always outlined: every blade, shard and hole, and the seal orbs
    const cam = S.cam;
    for (const h of this.hz) {
      if (h.dead || h.nw || h.k === 'gaze') continue;
      const r = this.rectAt(h, Math.max(t, h.tl), cam); if (!r) continue;
      ctx.strokeStyle = t < h.tl ? (Math.floor(S.rt * 12) % 2 ? '#ff3a5a' : '#ff9ab0') : '#ffffff';
      ctx.strokeRect(Math.round(r[0] - cam) + 0.5, Math.round(r[1]) + 0.5, Math.round(r[2]) - 1, Math.round(r[3]) - 1);
    }
    for (const o of this.orbs) { if (o.taken) continue; const x = o.wx - cam; ctx.fillStyle = '#7fe8ff'; ctx.beginPath(); ctx.arc(x, o.y, 3, 0, Math.PI * 2); ctx.fill(); }
  }
  const def = FF.BOSSES.niro;
  def.renderMid = function (ctx, S) { if (S.tun) return; if (this.D[this.dim].id !== 'dark') marks.call(this, ctx, S); };
  def.renderFront = function (ctx, S) {
    if (!S.tun && this.D[this.dim].id === 'dark' && (this.mode === 'fight' || this.mode === 'retry' || this.mode === 'clash')) { darkness.call(this, ctx, S); marks.call(this, ctx, S); }
    if (!S.tun) dashMarks.call(this, ctx, S);
    edgeGlow.call(this, ctx, S);
    drawAnswer.call(this, ctx, S);
    drawCombo.call(this, ctx, S);
    if (this.mode === 'finale') drawFinale.call(this, ctx, S);
  };
  // b45: the screen's edges glow in the dimension's colour on every knock (his and yours)
  const EDGE = {};
  function edgeGlow(ctx, S) {
    const t = this.t, k = Math.max(clamp(1 - (t - (this.flashK || -9)) / 0.3, 0, 1) * 0.7, clamp(1 - (t - (this.flashA || -9)) / 0.35, 0, 1));
    if (k <= 0.02 || this.mode === 'finale') return;
    const col = ACCENT[this.dim] || '#ffffff';
    let c = EDGE[col];
    if (!c) { c = EDGE[col] = FF.makeCanvas(W, H); const g = c.getContext('2d'); const add = (x0, y0, x1, y1, x, y, w, h) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, FF.rgba(col, 0.75)); gr.addColorStop(1, FF.rgba(col, 0)); g.fillStyle = gr; g.fillRect(x, y, w, h); }; add(0, 0, 0, 34, 0, 0, W, 34); add(0, H, 0, H - 34, 0, H - 34, W, 34); add(0, 0, 40, 0, 0, 0, 40, H); add(W, 0, W - 40, 0, W - 40, 0, 40, H); }
    ctx.globalAlpha = k; ctx.drawImage(c, 0, 0); ctx.globalAlpha = 1;
  }
  function drawCombo(ctx, S) {
    const n = this.kcombo || 0; if (n < 2 || this.mode === 'finale') return;
    const t = this.t, pop = clamp(1 - (t - (this.kcomboT || -9)) / 0.18, 0, 1), col = COMBO_COL[Math.min(4, Math.floor(n / 5))];
    const sc = 2 + Math.round(pop) + (n >= 10 ? 1 : 0);
    font.draw(ctx, 'x' + n, W - 40, 66 - pop * 3, { color: col, align: 'center', outline: '#05060d', scale: sc });
    font.draw(ctx, 'KNOCK COMBO', W - 40, 66 + sc * 7 + 2, { color: '#ffffff', align: 'center', outline: '#05060d' });
  }
})(window.FF);
