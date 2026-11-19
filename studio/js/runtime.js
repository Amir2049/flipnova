// NOVA STUDIO — the game runtime. It plays any project made in the studio.
// Everything lives inside one function so an exported game can carry this exact code with it.
function NovaRuntime(G) {
  'use strict';
  const N = G.Nova = G.Nova || {};
  const T = N.TILE = 16;
  N.W = 320; N.H = 180;

  // 16 colours ('.' is see-through)
  N.PAL = {
    '0': '#0b0b14', '1': '#3a3f5c', '2': '#8890b0', '3': '#f4f4f8', '4': '#ff4d4d', '5': '#ff9a3c', '6': '#ffd23f', '7': '#6be36b',
    '8': '#1f8a4c', '9': '#27d7ff', 'a': '#2a5cff', 'b': '#8a4dff', 'c': '#ff6ec7', 'd': '#8a5a2b', 'e': '#e8b86a', 'f': '#ffd1b0'
  };

  // what each kind of object does on its own (rules can add anything on top)
  N.BEHAVIORS = {
    platformer: { name: 'Player — platformer', player: true, icon: '🏃' },
    topdown: { name: 'Player — top-down', player: true, icon: '🧭' },
    flip: { name: 'Player — gravity flip', player: true, icon: '🔃' },
    flappy: { name: 'Player — flappy', player: true, icon: '🐦' },
    solid: { name: 'Wall / ground', icon: '🧱' },
    hazard: { name: 'Danger (kills)', icon: '🔺' },
    coin: { name: 'Collectible', icon: '🪙' },
    goal: { name: 'Goal / exit', icon: '🏁' },
    patrol: { name: 'Enemy — walks', icon: '👾' },
    chaser: { name: 'Enemy — chases', icon: '👻' },
    spring: { name: 'Spring', icon: '🌀' },
    key: { name: 'Key', icon: '🔑' },
    door: { name: 'Locked door', icon: '🚪' },
    checkpoint: { name: 'Checkpoint', icon: '🚩' },
    sign: { name: 'Sign (shows text)', icon: '🪧' },
    decor: { name: 'Decoration', icon: '🌸' }
  };
  N.PROPS = { // the knobs each behaviour shows in the studio, with defaults
    platformer: { speed: 90, jump: 290 }, topdown: { speed: 80 }, flip: { speed: 110 }, flappy: { speed: 80, jump: 210 },
    coin: { value: 1 }, patrol: { speed: 40 }, chaser: { speed: 35 }, spring: { jump: 420 }, sign: { text: 'Hello!' }
  };
  N.prop = (type, k) => (type.props && type.props[k] !== undefined && type.props[k] !== '' ? type.props[k] : (N.PROPS[type.beh] || {})[k]);

  // ------------------------------------------------------------------ sprites
  const cache = new Map();
  N.spriteCanvas = function (sp, frame) {
    if (!sp) return null;
    const px = sp.frames[frame % sp.frames.length] || sp.frames[0];
    const key = px;
    let c = cache.get(key);
    if (c) return c;
    c = document.createElement('canvas'); c.width = T; c.height = T;
    const g = c.getContext('2d');
    for (let i = 0; i < 256; i++) {
      const ch = px[i];
      if (ch && ch !== '.' && N.PAL[ch]) { g.fillStyle = N.PAL[ch]; g.fillRect(i % 16, (i / 16) | 0, 1, 1); }
    }
    if (cache.size > 600) cache.clear();
    cache.set(key, c);
    return c;
  };
  N.clearSpriteCache = () => cache.clear();

  // ------------------------------------------------------------------ tiny pixel font (3x5)
  const GLYPH = {
    A: '7d5755', B: '6d6d6', C: '74447', D: '65556', E: '74747', F: '74744', G: '74557', H: '55755', I: '72227', J: '11157', K: '55655', L: '44447',
    M: '57755', N: '65555', O: '75557', P: '75744', Q: '75571', R: '75765', S: '74717', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255',
    Y: '55222', Z: '71247', 0: '75557', 1: '26227', 2: '71747', 3: '71717', 4: '55711', 5: '74717', 6: '74757', 7: '71111', 8: '75757', 9: '75717',
    ' ': '00000', '!': '22202', '?': '71202', '.': '00002', ',': '00024', ':': '02020', '-': '00700', '+': '02720', '/': '11244', "'": '22000', 'x': '05250', '%': '51245', '♥': '57720', '★': '27752'
  };
  GLYPH.A = '75755';
  N.text = function (g, s, x, y, col, scale, align) {
    s = String(s).toUpperCase(); scale = scale || 1;
    const w = s.length * 4 * scale - scale;
    if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    for (const pass of [0, 1]) {
      g.fillStyle = pass ? col : 'rgba(0,0,0,0.8)';
      const o = pass ? 0 : scale;
      for (let i = 0; i < s.length; i++) {
        const gl = GLYPH[s[i]] || GLYPH['?'];
        for (let r = 0; r < 5; r++) {
          const bits = parseInt(gl[r] || '0', 16);
          for (let b = 0; b < 3; b++) if (bits & (4 >> b)) g.fillRect(x + o + (i * 4 + b) * scale, y + o + r * scale, scale, scale);
        }
      }
    }
    return w;
  };

  // ------------------------------------------------------------------ sound (little beeps, no music)
  let ac = null;
  N.sfx = function (name, muted) {
    if (muted) return;
    try {
      ac = ac || new (G.AudioContext || G.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const S = { jump: [[440, 760, 0.12, 'square']], coin: [[880, 880, 0.05, 'square'], [1320, 1320, 0.1, 'square', 0.05]], hit: [[300, 60, 0.3, 'sawtooth']],
        win: [[523, 523, 0.1, 'square'], [659, 659, 0.1, 'square', 0.1], [784, 784, 0.25, 'square', 0.2]], spring: [[200, 900, 0.2, 'triangle']],
        flip: [[600, 300, 0.08, 'triangle']], door: [[200, 400, 0.15, 'square']], beep: [[660, 660, 0.08, 'square']], boom: [[120, 30, 0.4, 'sawtooth']] }[name] || [];
      for (const [f0, f1, d, wave, delay] of S) {
        const t0 = ac.currentTime + (delay || 0), o = ac.createOscillator(), v = ac.createGain();
        o.type = wave; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + d);
        v.gain.setValueAtTime(0.08, t0); v.gain.exponentialRampToValueAtTime(0.001, t0 + d);
        o.connect(v); v.connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.02);
      }
    } catch (e) { /* no sound here */ }
  };

  // ------------------------------------------------------------------ the game
  // project: { name, sprites:{id:{frames:[256 chars]}}, types:{id:{name,sprite,beh,props}}, scenes:[{name,cols,rows,bg,objs:[[typeId,col,row]]}],
  //            rules:[{when:{ev,type,n},then:[{act,n,type,text}]}], lives, gravity, hud }
  function Game(project, opts) {
    this.P = project; this.opts = opts || {};
    this.vars = { score: 0, lives: project.lives || 0, keys: 0 };
    this.sceneIdx = this.opts.scene || 0;
    this.state = 'play'; // play | dead | win | over
    this.input = { left: false, right: false, up: false, down: false, act: false, actHit: false };
    this.loadScene(this.sceneIdx);
  }
  N.Game = Game;

  Game.prototype.loadScene = function (i) {
    const P = this.P, sc = P.scenes[i];
    this.sceneIdx = i; this.scene = sc;
    this.objs = []; this.player = null; this.solids = new Map();
    this.t = 0; this.msg = null; this.shake = 0; this.parts = [];
    this.fired = {}; this.everyT = {};
    this.gdir = 1;
    for (const [tid, c, r] of sc.objs) {
      const type = P.types[tid];
      if (!type) continue;
      const o = { type, tid, x: c * T, y: r * T, w: T, h: T, vx: 0, vy: 0, alive: true, sx: c * T, sy: r * T, dir: 1, frame: 0 };
      if (N.BEHAVIORS[type.beh] && N.BEHAVIORS[type.beh].player) {
        if (this.player) continue; // one player per scene
        this.player = o; o.x += 2; o.w = 12; o.h = 14; o.y += 2;
      }
      if (type.beh === 'solid' || type.beh === 'door') this.solids.set(c + ',' + r, o);
      if (type.beh === 'patrol') o.vx = N.prop(type, 'speed');
      this.objs.push(o);
    }
    this.spawn = this.player ? { x: this.player.x, y: this.player.y } : null;
    this.camX = 0; this.camY = 0;
    this.follow(true);
    this.rule('start');
  };

  Game.prototype.mode = function () { return this.player ? this.player.type.beh : 'none'; };
  Game.prototype.gravity = function () { return this.P.gravity || 900; };

  Game.prototype.solidAt = function (px, py) {
    const k = Math.floor(px / T) + ',' + Math.floor(py / T), o = this.solids.get(k);
    return o && o.alive ? o : null;
  };
  // move a box and stop it at walls; returns which sides were hit
  Game.prototype.moveBox = function (o, dx, dy) {
    const hit = { l: false, r: false, u: false, d: false, wall: null };
    if (dx) {
      o.x += dx;
      const xs = dx > 0 ? o.x + o.w - 0.01 : o.x;
      for (let y = o.y + 0.5; y < o.y + o.h; y += Math.min(T - 1, o.h - 1)) {
        const s = this.solidAt(xs, y) || this.solidAt(xs, o.y + o.h - 0.5);
        if (s) { o.x = dx > 0 ? s.x - o.w : s.x + T; hit[dx > 0 ? 'r' : 'l'] = true; hit.wall = s; break; }
      }
    }
    if (dy) {
      o.y += dy;
      const ys = dy > 0 ? o.y + o.h - 0.01 : o.y;
      for (let x = o.x + 0.5; x < o.x + o.w; x += Math.min(T - 1, o.w - 1)) {
        const s = this.solidAt(x, ys) || this.solidAt(o.x + o.w - 0.5, ys);
        if (s) { o.y = dy > 0 ? s.y - o.h : s.y + T; hit[dy > 0 ? 'd' : 'u'] = true; hit.wall = s; break; }
      }
    }
    return hit;
  };

  Game.prototype.press = function (k, on) {
    if (k === 'act' && on && !this.input.act) this.input.actHit = true;
    this.input[k] = on;
  };

  Game.prototype.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    this.t += dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.life -= dt; }
    this.parts = this.parts.filter((q) => q.life > 0);
    if (this.state === 'dead') {
      if ((this.deadT -= dt) <= 0) this.respawn();
      return;
    }
    if (this.state !== 'play') return;
    const p = this.player, I = this.input;
    if (p) this.updatePlayer(p, I, dt);
    I.actHit = false;
    for (const o of this.objs) if (o.alive && o !== p) this.updateObj(o, dt);
    if (p && this.state === 'play') this.touches(p);
    // timed rules
    for (let i = 0; i < (this.P.rules || []).length; i++) {
      const r = this.P.rules[i], w = r.when;
      if (w.ev === 'every') { const n = Math.max(0.2, +w.n || 1); this.everyT[i] = (this.everyT[i] || 0) + dt; if (this.everyT[i] >= n) { this.everyT[i] -= n; this.run(r.then, null); } }
      if (w.ev === 'after' && !this.fired[i] && this.t >= (+w.n || 1)) { this.fired[i] = 1; this.run(r.then, null); }
      if (w.ev === 'score' && !this.fired[i] && this.vars.score >= (+w.n || 0)) { this.fired[i] = 1; this.run(r.then, null); }
    }
    if (p && (p.y > this.scene.rows * T + 40 || p.y < -60)) this.die();
    this.follow(false);
  };

  Game.prototype.updatePlayer = function (p, I, dt) {
    const ty = p.type, beh = ty.beh, g = this.gravity();
    const sp = +N.prop(ty, 'speed') || 80;
    if (beh === 'platformer') {
      const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
      p.vx = dir * sp; if (dir) p.dir = dir;
      p.vy = Math.min(p.vy + g * dt, 420);
      if ((I.actHit || (I.up && !p.upHeld)) && p.ground) { p.vy = -(+N.prop(ty, 'jump') || 290); N.sfx('jump', this.opts.muted); this.rule('tap'); }
      p.upHeld = I.up;
      const hx = this.moveBox(p, p.vx * dt, 0);
      const hy = this.moveBox(p, 0, p.vy * dt);
      if (hy.d || hy.u) p.vy = 0;
      p.ground = hy.d;
      p.moving = !!dir;
      void hx;
    } else if (beh === 'topdown') {
      const dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
      const k = dx && dy ? 0.7071 : 1;
      if (dx) p.dir = dx;
      this.moveBox(p, dx * sp * k * dt, 0); this.moveBox(p, 0, dy * sp * k * dt);
      p.moving = !!(dx || dy);
      if (I.actHit) this.rule('tap');
    } else if (beh === 'flip') {
      if (I.actHit && p.ground) { this.gdir *= -1; p.ground = false; N.sfx('flip', this.opts.muted); this.rule('tap'); }
      p.vy = FFclamp(p.vy + g * this.gdir * dt, -420, 420);
      const hx = this.moveBox(p, sp * dt, 0);
      const hy = this.moveBox(p, 0, p.vy * dt);
      if (hy.d || hy.u) p.vy = 0;
      p.ground = this.gdir > 0 ? hy.d : hy.u;
      p.moving = true;
      if (hx.r) this.die(); // ran into a wall
    } else if (beh === 'flappy') {
      if (I.actHit) { p.vy = -(+N.prop(ty, 'jump') || 210); N.sfx('jump', this.opts.muted); this.rule('tap'); }
      p.vy = Math.min(p.vy + g * 0.8 * dt, 400);
      const hx = this.moveBox(p, sp * dt, 0), hy = this.moveBox(p, 0, p.vy * dt);
      p.moving = true;
      if (hx.r || hx.l || hy.d || hy.u) this.die();
    }
  };
  function FFclamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  Game.prototype.updateObj = function (o, dt) {
    const beh = o.type.beh, g = this.gravity(), grav = this.mode() !== 'topdown';
    if (beh === 'patrol') {
      if (grav) { o.vy = Math.min(o.vy + g * dt, 420); const hy = this.moveBox(o, 0, o.vy * dt); if (hy.d) o.vy = 0; o.ground = hy.d; }
      const hx = this.moveBox(o, o.vx * dt, 0);
      // turn at walls, and (with gravity) at the edge of a platform
      const ahead = o.vx > 0 ? o.x + o.w + 1 : o.x - 1;
      const edge = grav && o.ground && !this.solidAt(ahead, o.y + o.h + 2);
      if (hx.l || hx.r || edge) o.vx = -o.vx;
      o.dir = o.vx >= 0 ? 1 : -1; o.moving = true;
    } else if (beh === 'chaser' && this.player) {
      const p = this.player, s = +N.prop(o.type, 'speed') || 35;
      const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1;
      if (d < 220) { o.x += dx / d * s * dt; o.y += dy / d * s * dt; o.dir = dx >= 0 ? 1 : -1; o.moving = true; }
    }
  };

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  Game.prototype.touches = function (p) {
    for (const o of this.objs) {
      if (!o.alive || o === p) continue;
      const beh = o.type.beh;
      const box = beh === 'hazard' ? { x: o.x + 3, y: o.y + 4, w: T - 6, h: T - 6 } : o;
      const near = beh === 'door' ? { x: o.x - 2, y: o.y - 2, w: T + 4, h: T + 4 } : box;
      if (!overlap(p, near)) { if (beh === 'sign') o.shown = false; continue; }
      if (beh === 'hazard' || beh === 'patrol' || beh === 'chaser') {
        // jumping on a walking enemy squashes it (platformer only)
        if (beh === 'patrol' && p.type.beh === 'platformer' && p.vy > 0 && p.y + p.h - o.y < 8) {
          o.alive = false; p.vy = -200; this.puff(o, '#ffffff'); N.sfx('hit', this.opts.muted); this.rule('touch', o); continue;
        }
        if (this.rule('touch', o) === 'handled') continue;
        this.die(); return;
      }
      if (beh === 'coin') { o.alive = false; this.vars.score += +N.prop(o.type, 'value') || 1; this.puff(o, '#ffd23f'); N.sfx('coin', this.opts.muted); }
      if (beh === 'key') { o.alive = false; this.vars.keys++; this.puff(o, '#ffd23f'); N.sfx('coin', this.opts.muted); }
      if (beh === 'door' && this.vars.keys > 0) { this.vars.keys--; o.alive = false; this.puff(o, '#8a5a2b'); N.sfx('door', this.opts.muted); }
      if (beh === 'spring' && p.vy >= 0) { p.vy = -(+N.prop(o.type, 'jump') || 420); if (p.type.beh === 'flip') p.vy *= this.gdir; N.sfx('spring', this.opts.muted); }
      if (beh === 'checkpoint' && !o.on) { o.on = true; this.spawn = { x: o.x + 2, y: o.y + 2 }; this.say('Checkpoint!', 1); N.sfx('beep', this.opts.muted); }
      if (beh === 'sign' && !o.shown) { o.shown = true; this.say(N.prop(o.type, 'text'), 2.5); }
      if (!o.touchedOnce || beh === 'solid' || beh === 'decor' || beh === 'sign') this.rule('touch', o);
      if (beh === 'coin' || beh === 'key' || beh === 'checkpoint') o.touchedOnce = true;
      if (beh === 'goal' && this.state === 'play') { this.nextScene(); return; }
    }
  };

  // ------------------------------------------------------------------ rules: WHEN something happens THEN do things
  N.EVENTS = {
    start: 'Scene starts', touch: 'Player touches…', tap: 'Player taps / jumps', score: 'Score reaches…', every: 'Every … seconds',
    after: 'After … seconds', die: 'Player dies', win: 'Player wins'
  };
  N.ACTIONS = {
    score: 'Add to score', destroy: 'Remove the touched thing', say: 'Show a message', sound: 'Play a sound', scene: 'Go to scene #',
    next: 'Next scene', win: 'Win the game', lose: 'Lose (game over)', kill: 'Player dies', shake: 'Shake the screen',
    gravity: 'Flip gravity', lives: 'Add lives', spawn: 'Make a … near the player', bounce: 'Bounce the player up', speed: 'Change player speed ×'
  };
  N.SOUNDS = ['beep', 'coin', 'jump', 'hit', 'win', 'spring', 'flip', 'door', 'boom'];
  Game.prototype.rule = function (ev, obj) {
    let handled = false;
    (this.P.rules || []).forEach((r) => {
      const w = r.when;
      if (w.ev !== ev) return;
      if (ev === 'touch' && w.type && (!obj || obj.tid !== w.type)) return;
      handled = true;
      this.run(r.then, obj);
    });
    return handled ? 'handled' : null;
  };
  Game.prototype.run = function (acts, obj) {
    const p = this.player;
    for (const a of acts || []) {
      const n = +a.n || 0;
      switch (a.act) {
        case 'score': this.vars.score += n || 1; break;
        case 'destroy': if (obj) { obj.alive = false; this.puff(obj, '#ffffff'); } break;
        case 'say': this.say(a.text || '...', 2.5); break;
        case 'sound': N.sfx(a.text || 'beep', this.opts.muted); break;
        case 'scene': if (this.P.scenes[n - 1]) { this.loadScene(n - 1); return; } break;
        case 'next': this.nextScene(); return;
        case 'win': this.win(); return;
        case 'lose': this.gameOver(); return;
        case 'kill': this.die(); return;
        case 'shake': this.shake = 0.4; break;
        case 'gravity': this.gdir *= -1; break;
        case 'lives': this.vars.lives += n || 1; break;
        case 'bounce': if (p) p.vy = -(n || 300) * this.gdir; break;
        case 'speed': if (p) { p.type = Object.assign({}, p.type, { props: Object.assign({}, p.type.props, { speed: (+N.prop(p.type, 'speed') || 80) * (n || 1) }) }); } break;
        case 'spawn': {
          const ty = this.P.types[a.type];
          if (ty && p) { const o = { type: ty, tid: a.type, x: p.x + (n || 48) * (p.dir || 1), y: p.y, w: T, h: T, vx: ty.beh === 'patrol' ? (+N.prop(ty, 'speed') || 40) : 0, vy: 0, alive: true, dir: 1, frame: 0 }; this.objs.push(o); }
          break;
        }
      }
    }
  };
  Game.prototype.say = function (text, s) { this.msg = { text: String(text).slice(0, 60), t: s || 2 }; };
  Game.prototype.puff = function (o, col) {
    for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 60; this.parts.push({ x: o.x + 8, y: o.y + 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5, col }); }
  };
  Game.prototype.die = function () {
    if (this.state !== 'play' || !this.player) return;
    const p = this.player;
    this.puff(p, '#ff4d4d'); this.shake = 0.3; N.sfx('hit', this.opts.muted);
    this.rule('die');
    if (this.state !== 'play') return;
    if (this.P.lives > 0) { this.vars.lives--; if (this.vars.lives <= 0) { this.gameOver(); return; } }
    this.state = 'dead'; this.deadT = 0.7;
    this.opts.onDie && this.opts.onDie();
  };
  Game.prototype.respawn = function () {
    // the scene restarts (things you collected come back), but you keep your score and start at the last checkpoint
    const keep = Object.assign({}, this.vars), sp = this.spawn;
    this.loadScene(this.sceneIdx);
    this.vars = keep;
    if (sp && this.player) { this.player.x = sp.x; this.player.y = sp.y; this.spawn = sp; this.follow(true); }
    this.state = 'play';
  };
  Game.prototype.nextScene = function () {
    if (this.sceneIdx + 1 < this.P.scenes.length) { N.sfx('win', this.opts.muted); this.loadScene(this.sceneIdx + 1); } else this.win();
  };
  Game.prototype.win = function () { this.state = 'win'; this.rule('win'); N.sfx('win', this.opts.muted); this.opts.onEnd && this.opts.onEnd('win', this.vars); };
  Game.prototype.gameOver = function () { this.state = 'over'; N.sfx('boom', this.opts.muted); this.opts.onEnd && this.opts.onEnd('over', this.vars); };

  Game.prototype.follow = function (snap) {
    const p = this.player, sc = this.scene;
    if (!p) return;
    const mw = Math.max(0, sc.cols * T - N.W), mh = Math.max(0, sc.rows * T - N.H);
    const tx = FFclamp(p.x + p.w / 2 - N.W / 2 + (p.type.beh === 'flip' || p.type.beh === 'flappy' ? 60 : 0), 0, mw);
    const ty = FFclamp(p.y + p.h / 2 - N.H / 2, 0, mh);
    this.camX = snap ? tx : this.camX + (tx - this.camX) * 0.15;
    this.camY = snap ? ty : this.camY + (ty - this.camY) * 0.15;
  };

  // ------------------------------------------------------------------ drawing
  Game.prototype.render = function (g) {
    const sc = this.scene, P = this.P;
    g.save();
    g.fillStyle = sc.bg || '#141828'; g.fillRect(0, 0, N.W, N.H);
    let cx = Math.round(this.camX), cy = Math.round(this.camY);
    if (this.shake > 0) { cx += Math.round((Math.random() - 0.5) * 6); cy += Math.round((Math.random() - 0.5) * 6); }
    const fr = Math.floor(this.t * 4);
    for (const o of this.objs) {
      if (!o.alive || o === this.player) continue;
      const x = Math.round(o.x - cx), y = Math.round(o.y - cy);
      if (x < -T || x > N.W || y < -T || y > N.H) continue;
      const c = N.spriteCanvas(P.sprites[o.type.sprite], o.type.beh === 'checkpoint' && !o.on ? 0 : fr);
      if (c) this.blit(g, c, x, y, o.dir < 0, false);
      else { g.fillStyle = '#ff6ec7'; g.fillRect(x, y, T, T); }
    }
    const p = this.player;
    if (p && this.state !== 'dead') {
      const c = N.spriteCanvas(P.sprites[p.type.sprite], p.moving ? fr : 0);
      if (c) this.blit(g, c, Math.round(p.x - 2 - cx), Math.round(p.y - 2 - cy), p.dir < 0, p.type.beh === 'flip' && this.gdir < 0);
    }
    for (const q of this.parts) { g.fillStyle = q.col; g.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), 2, 2); }
    g.restore();
    // HUD
    if (P.hud !== false) {
      g.fillStyle = '#000'; g.fillRect(6, 7, 6, 6); g.fillStyle = '#ffd23f'; g.fillRect(6, 6, 5, 5); g.fillStyle = '#fff6c2'; g.fillRect(7, 7, 1, 2); // a little coin
      N.text(g, String(this.vars.score), 14, 6, '#ffd23f', 1);
      if (P.lives > 0) N.text(g, '♥ ' + this.vars.lives, 6, 14, '#ff4d4d', 1);
      if (this.vars.keys > 0) N.text(g, 'KEYS ' + this.vars.keys, 6, P.lives > 0 ? 22 : 14, '#ffd23f', 1);
    }
    if (this.msg) {
      g.fillStyle = 'rgba(5,6,13,0.8)'; g.fillRect(20, N.H - 30, N.W - 40, 18);
      N.text(g, this.msg.text, N.W / 2, N.H - 24, '#ffffff', 1, 'center');
    }
    if (this.state === 'win' || this.state === 'over') {
      g.fillStyle = 'rgba(5,6,13,0.7)'; g.fillRect(0, 0, N.W, N.H);
      N.text(g, this.state === 'win' ? 'YOU WIN!' : 'GAME OVER', N.W / 2, 60, this.state === 'win' ? '#ffd23f' : '#ff4d4d', 3, 'center');
      N.text(g, 'SCORE ' + this.vars.score, N.W / 2, 90, '#ffffff', 2, 'center');
      N.text(g, 'TAP TO PLAY AGAIN', N.W / 2, 120, '#8890b0', 1, 'center');
    }
  };
  Game.prototype.blit = function (g, c, x, y, flipX, flipY) {
    if (!flipX && !flipY) { g.drawImage(c, x, y); return; }
    g.save(); g.translate(x + (flipX ? T : 0), y + (flipY ? T : 0)); g.scale(flipX ? -1 : 1, flipY ? -1 : 1); g.drawImage(c, 0, 0); g.restore();
  };

  // which on-screen buttons a game needs
  N.controlsFor = function (project) {
    let beh = 'none';
    for (const sc of project.scenes) for (const [tid] of sc.objs) { const ty = project.types[tid]; if (ty && N.BEHAVIORS[ty.beh] && N.BEHAVIORS[ty.beh].player) { beh = ty.beh; break; } }
    return beh === 'platformer' ? ['left', 'right', 'act'] : beh === 'topdown' ? ['left', 'right', 'up', 'down', 'act'] : ['tap'];
  };

  // ------------------------------------------------------------------ a ready player: canvas + touch buttons + keyboard
  N.mount = function (host, project, opts) {
    opts = opts || {};
    host.innerHTML = '';
    host.classList.add('nv-host');
    const cv = document.createElement('canvas'); cv.width = N.W; cv.height = N.H; cv.className = 'nv-screen';
    host.appendChild(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    let game = null, raf = 0, last = 0, stopped = false;
    const start = () => { game = new Game(project, { muted: opts.muted, scene: opts.scene || 0, onEnd: () => {} }); };
    start();
    const pad = document.createElement('div'); pad.className = 'nv-pad';
    const ctl = N.controlsFor(project);
    const btn = (k, label, cls) => {
      const b = document.createElement('div'); b.className = 'nv-btn ' + cls; b.textContent = label;
      const on = (e) => { e.preventDefault(); if (game.state === 'win' || game.state === 'over') { start(); return; } game.press(k, true); };
      const off = (e) => { e.preventDefault(); game.press(k, false); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
      pad.appendChild(b);
    };
    if (ctl[0] === 'tap') {
      const z = document.createElement('div'); z.className = 'nv-tapzone';
      z.addEventListener('pointerdown', (e) => { e.preventDefault(); if (game.state === 'win' || game.state === 'over') { start(); return; } game.press('act', true); });
      z.addEventListener('pointerup', () => game.press('act', false));
      pad.appendChild(z);
    } else {
      btn('left', '◀', 'l1'); btn('right', '▶', 'l2');
      if (ctl.includes('up')) { btn('up', '▲', 'u1'); btn('down', '▼', 'd1'); }
      btn('act', ctl.includes('up') ? 'A' : '⤒', 'r1');
    }
    host.appendChild(pad);
    const keys = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ' ': 'act', z: 'act', x: 'act' };
    const kd = (e) => {
      const k = keys[e.key]; if (!k) return; e.preventDefault();
      if (game.state === 'win' || game.state === 'over') { start(); return; }
      game.press(k, true); if (k === 'up' && ctl[0] === 'tap') game.press('act', true);
    };
    const ku = (e) => { const k = keys[e.key]; if (!k) return; game.press(k, false); if (k === 'up') game.press('act', false); };
    G.addEventListener('keydown', kd); G.addEventListener('keyup', ku);
    const loop = (ts) => {
      if (stopped) return;
      const dt = last ? (ts - last) / 1000 : 0; last = ts;
      game.update(dt); game.render(g);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return {
      get game() { return game; },
      stop() { stopped = true; cancelAnimationFrame(raf); G.removeEventListener('keydown', kd); G.removeEventListener('keyup', ku); host.innerHTML = ''; }
    };
  };
  return N;
}
NovaRuntime(window);
