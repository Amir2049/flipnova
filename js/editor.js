// FLIPNOVA — Level Maker: build, test, verify (by the bot) and share your own levels.
(function (FF) {
  'use strict';
  const C = FF.C, F = FF.F;
  const GRID = 8;
  const START_SAFE = 72;
  const MAX_LEN = 4000;
  const MAX_ITEMS = 800;

  const E = {
    active: false, data: null, camX: 24, tool: 'spike', cat: 'danger', game: null, dirty: true, fx: [],
    undo: [], drag: null, mark: null, msg: '', msgT: 0
  };
  FF.Editor = E;

  E.blank = function () {
    return { id: null, name: 'MY LEVEL', world: 'neon', speed: 120, len: 1600, items: [], verified: false };
  };

  E.open = function (lv) {
    E.data = JSON.parse(JSON.stringify(lv || E.blank()));
    E.camX = 24;
    E.undo = [];
    E.mark = null;
    E.dirty = true;
    E.active = true;
  };
  E.close = function () { E.active = false; };

  E.say = function (text) { E.msg = text; E.msgT = 2.5; FF.UI.editorMsg && FF.UI.editorMsg(text); };

  function snapshot() {
    E.undo.push(JSON.stringify(E.data));
    if (E.undo.length > 60) E.undo.shift();
  }
  E.undoLast = function () {
    const s = E.undo.pop();
    if (!s) return false;
    E.data = JSON.parse(s);
    E.dirty = true;
    return true;
  };

  function itemRect(it) {
    const o = FF.levelObjects({ items: [it], len: 1e9 })[0];
    if (!o || o.t === 'finish') return null;
    if (o.t === 'spike') return [o.x, o.dir === 'up' ? o.y - 8 : o.y, 8, 8];
    if (o.t === 'coin') return [o.x - 4, o.y - 4, 8, 8];
    if (o.t === 'mover' || o.t === 'laser' || o.t === 'lock') return [o.x, C, Math.max(o.w, 8), F - C];
    if (o.t === 'pad') return [o.x, o.side === 'floor' ? F - 8 : C, o.w, 8];
    return [o.x, o.y, o.w, o.h];
  }

  E.PAINT = ['spike', 'pop', 'coin', 'gem', 'block', 'erase', 'crumble', 'blink'];
  // place or erase at world coordinates
  E.tapAt = function (wx, wy, noSnap) {
    if (!noSnap) snapshot();
    if (wy < C - 4 || wy > F + 4) return;
    const d = E.data;
    const x = Math.floor(wx / GRID) * GRID;
    if (E.tool === 'erase') {
      for (let i = d.items.length - 1; i >= 0; i--) {
        const r = itemRect(d.items[i]);
        if (r && wx >= r[0] - 4 && wx <= r[0] + r[2] + 4 && wy >= r[1] - 4 && wy <= r[1] + r[3] + 4) {
          d.items.splice(i, 1);
          d.verified = false;
          E.dirty = true;
          FF.audio.play('uiBack');
          return;
        }
      }
      return;
    }
    if (E.tool === 'finish') {
      d.len = FF.clamp(x, 400, MAX_LEN);
      d.items = d.items.filter((it) => it.x < d.len - 8);
      d.verified = false;
      E.dirty = true;
      FF.audio.play('ui');
      return;
    }
    if (x < START_SAFE) { E.say('start'); E.fx.push({ x: wx, y: wy, t: 0, bad: true }); FF.audio.play('lock'); return; }
    if (d.items.length >= MAX_ITEMS) { E.say('full'); return; }
    let y = Math.round(wy);
    if (E.tool === 'block') y = Math.round(wy / GRID) * GRID;
    // no exact duplicates
    if (d.items.some((it) => it.k === E.tool && it.x === x && (it.y === undefined || Math.abs(it.y - y) < 6 || ((E.tool === 'spike' || E.tool === 'pad') && (it.y > FF.MID) === (y > FF.MID))))) return;
    const it = { k: E.tool, x };
    if (['spike', 'block', 'catchB', 'catchP', 'pad', 'coin', 'gem', 'pop', 'saw', 'orbit', 'crumble', 'blink', 'bumper', 'fan', 'piston', 'geyser'].includes(E.tool)) it.y = y;
    d.items.push(it);
    E.fx.push({ x: x + 4, y: it.y === undefined ? FF.MID : it.y, t: 0 });
    if (x > d.len - 48) d.len = Math.min(MAX_LEN, x + 96);
    d.verified = false;
    E.dirty = true;
    FF.audio.play(E.tool === 'coin' || E.tool === 'gem' ? 'coin' : 'ui');
  };

  // ---------------- verify with the planning bot
  E.verify = function (lv) {
    const L = new FF.Level({ custom: lv, seed: 1 });
    const p = { x: 0, y: F - 12, vy: 0, grav: 1, grounded: true, speed: L.speedAt(0) };
    let time = 0, k = 0;
    const maxT = 300;
    while (p.x < lv.len && time < maxT) {
      p.speed = L.speedAt(p.x);
      if ((k++ & 1) === 0 && FF.Phys.botShouldFlip(p, L, time)) FF.Phys.flipState(p);
      const r = FF.Phys.step(p, FF.STEP, L, time);
      time += FF.STEP;
      if (r) return { ok: false, x: Math.round(p.x), y: Math.round(p.y), cause: r.cause };
    }
    return { ok: p.x >= lv.len, x: Math.round(p.x) };
  };

  // ---------------- share codes
  const CODE = { spike: 's', wallB: 'b', wallP: 'p', block: 'o', slab: 'h', catchB: 'K', catchP: 'k', mover: 'm', laser: 'l', pad: 'j', lock: 'z', coin: 'c', gem: 'g',
    pop: 'q', saw: 'w', orbit: 'r', pend: 'n', lift: 'L', crumble: 'u', blink: 'B', bumper: 'U', fan: 'F', dash: 'd', flyIn: 'Y', flyOut: 'y', piston: 'P', jaws: 'J', geyser: 'V' };
  const UNCODE = {};
  for (const k in CODE) UNCODE[CODE[k]] = k;

  E.encode = function (lv) {
    const items = lv.items.map((it) => CODE[it.k] + it.x / GRID + (it.y !== undefined ? '.' + it.y : '')).join(',');
    const raw = ['FF1', encodeURIComponent(lv.name || 'LEVEL'), lv.world, lv.speed, lv.len / GRID, items].join('|');
    return 'FLIPNOVA:' + btoa(unescape(encodeURIComponent(raw)));
  };
  E.decode = function (code) {
    try {
      code = String(code).trim();
      const m = code.match(/(?:FLIPNOVA|FLIPFRENZY):([A-Za-z0-9+/=]+)/); // older level codes still load
      if (!m) return null;
      const raw = decodeURIComponent(escape(atob(m[1])));
      const parts = raw.split('|');
      if (parts[0] !== 'FF1' || parts.length < 6) return null;
      const lv = E.blank();
      lv.name = decodeURIComponent(parts[1]).slice(0, 20); // b66: same 20 as the name box (24 silently cut on the first edit)
      lv.world = FF.worldById(parts[2]).id;
      lv.speed = FF.clamp(parseInt(parts[3], 10) || 120, 90, 170);
      lv.len = FF.clamp((parseInt(parts[4], 10) || 200) * GRID, 400, MAX_LEN);
      lv.items = [];
      for (const tok of parts[5] ? parts[5].split(',') : []) {
        const k = UNCODE[tok[0]];
        if (!k) continue;
        const [xs, ys] = tok.slice(1).split('.');
        const it = { k, x: FF.clamp(parseInt(xs, 10) * GRID, START_SAFE, lv.len) };
        if (ys !== undefined) { const y = parseInt(ys, 10); if (isFinite(y)) it.y = FF.clamp(y, C, F); } // b66: a garbled y gave NaN
        if (isFinite(it.x)) lv.items.push(it);
        if (lv.items.length >= MAX_ITEMS) break;
      }
      return lv;
    } catch (e) {
      return null;
    }
  };

  // ---------------- tool icons (drawn with the game's own sprites)
  E.drawIcon = function (g, tool) {
    const COL = FF.COLORS;
    switch (tool) {
      case 'spike': FF.drawSpikes(g, 4, 14, 8, 'up'); break;
      case 'wallB': FF.drawPhaseRect(g, 6, 1, 5, 14, 'b', true, 0); break;
      case 'wallP': FF.drawPhaseRect(g, 6, 1, 5, 14, 'p', true, 0); break;
      case 'block': g.fillStyle = '#4a3f99'; g.fillRect(3, 3, 10, 10); g.fillStyle = '#0d0b20'; g.fillRect(4, 4, 8, 8); break;
      case 'slab': g.fillStyle = '#8f7bff'; g.fillRect(0, 6, 16, 4); break;
      case 'catchB': FF.drawPhaseRect(g, 1, 7, 14, 3, 'b', true, 0); break;
      case 'catchP': FF.drawPhaseRect(g, 1, 7, 14, 3, 'p', true, 0); break;
      case 'mover': FF.drawMover(g, 2, 2, 12, 12, 0); break;
      case 'laser': g.fillStyle = COL.hazard; g.fillRect(7, 2, 2, 12); g.fillStyle = '#fff'; g.fillRect(7, 2, 1, 12); g.fillStyle = '#55607a'; g.fillRect(5, 0, 6, 2); g.fillRect(5, 14, 6, 2); break;
      case 'pad':
        g.fillStyle = '#39ff88';
        g.fillRect(2, 13, 12, 2);
        for (let k = 0; k < 4; k++) { g.fillRect(4 + k, 10 - k, 1, 1); g.fillRect(11 - k, 10 - k, 1, 1); g.fillRect(4 + k, 6 - k, 1, 1); g.fillRect(11 - k, 6 - k, 1, 1); }
        break;
      case 'lock': FF.drawLock(g, 4, 4, '#ffe066'); break;
      case 'coin': FF.drawCoin(g, 8, 8, 0); break;
      case 'gem': FF.drawCoin(g, 8, 8, 0.5, { gold: true }); break;
      case 'finish': for (let y = 0; y < 16; y += 4) for (let x = 2; x < 14; x += 4) { g.fillStyle = ((x + y) / 4) & 1 ? '#fff' : '#111'; g.fillRect(x, y, 4, 4); } break;
      case 'pop': FF.drawSpikes(g, 0, 14, 16, 'up'); g.fillStyle = '#ffe066'; g.fillRect(7, 1, 2, 3); g.fillRect(7, 5, 2, 1); break;
      case 'saw': for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) { g.fillStyle = (x + y) & 2 ? '#c9cfe0' : '#7f879c'; g.fillRect(8 + x, 8 + y, 1, 1); } g.fillStyle = COL.hazard; g.fillRect(6, 6, 4, 4); break;
      case 'orbit': g.fillStyle = '#5a6380'; g.fillRect(7, 7, 2, 2); g.fillStyle = '#9aa3c0'; g.fillRect(9, 9, 1, 1); g.fillRect(11, 11, 1, 1); g.fillStyle = COL.hazard; g.fillRect(12, 12, 4, 4); break;
      case 'pend': g.fillStyle = '#9aa3c0'; for (let i = 0; i < 4; i++) g.fillRect(8 - i, 1 + i * 2, 1, 1); g.fillStyle = COL.hazard; g.fillRect(2, 9, 6, 6); break;
      case 'lift': g.fillStyle = '#3a3f55'; g.fillRect(1, 7, 14, 4); g.fillStyle = '#ffe066'; for (let i = 1; i < 15; i += 4) g.fillRect(i, 7, 2, 1); g.fillRect(7, 2, 2, 3); g.fillRect(7, 12, 2, 3); break;
      case 'crumble': g.fillStyle = '#c98a4a'; g.fillRect(1, 6, 14, 5); g.fillStyle = '#3a1e08'; g.fillRect(5, 7, 1, 3); g.fillRect(10, 6, 1, 2); g.fillRect(11, 8, 2, 1); break;
      case 'blink': g.fillStyle = '#ff8a3a'; g.fillRect(1, 6, 6, 5); g.fillStyle = 'rgba(255,138,58,0.5)'; for (let i = 9; i < 15; i += 2) { g.fillRect(i, 6, 1, 1); g.fillRect(i, 10, 1, 1); } break;
      case 'bumper': g.fillStyle = COL.frenzy; g.fillRect(1, 9, 14, 5); g.fillStyle = '#fff'; g.fillRect(3, 10, 10, 1); g.fillRect(6, 3, 4, 1); g.fillRect(7, 2, 2, 1); g.fillRect(7, 4, 2, 4); break;
      case 'fan': g.fillStyle = '#2a3348'; g.fillRect(1, 12, 14, 4); g.fillStyle = '#b8f3ff'; for (let i = 2; i < 15; i += 4) g.fillRect(i, 3, 1, 7); break;
      case 'dash': g.fillStyle = '#ffe066'; for (let j = 0; j < 4; j++) { g.fillRect(3 + j, 4 + j, 1, 1); g.fillRect(3 + j, 11 - j, 1, 1); g.fillRect(8 + j, 4 + j, 1, 1); g.fillRect(8 + j, 11 - j, 1, 1); } break;
      case 'flyIn': case 'flyOut': for (let y = 1; y < 15; y += 2) { g.fillStyle = tool === 'flyIn' ? (y & 2 ? '#ffb000' : '#ff5a1a') : (y & 2 ? '#27d7ff' : '#b45cff'); g.fillRect(5, y, 6, 1); } g.fillStyle = '#fff'; g.fillRect(4, 7, 8, 2); break;
      case 'piston': g.fillStyle = '#5a6478'; g.fillRect(2, 14, 12, 2); g.fillStyle = '#8a96b0'; g.fillRect(6, 6, 4, 8); g.fillStyle = '#cfd8ee'; g.fillRect(1, 2, 14, 4); g.fillStyle = '#ffd23f'; g.fillRect(1, 4, 4, 1); g.fillRect(9, 4, 4, 1); break;
      case 'jaws': g.fillStyle = '#ff4a6a'; g.fillRect(2, 0, 12, 5); g.fillRect(2, 11, 12, 5); g.fillStyle = '#fff'; for (let i = 3; i < 13; i += 4) { g.fillRect(i, 5, 2, 2); g.fillRect(i, 9, 2, 2); } break;
      case 'geyser': g.fillStyle = '#3a1408'; g.fillRect(2, 13, 12, 3); g.fillStyle = '#ff3a10'; g.fillRect(5, 6, 6, 7); g.fillStyle = '#ffb000'; g.fillRect(6, 3, 4, 8); g.fillStyle = '#fff6c2'; g.fillRect(7, 8, 2, 4); break;
      case 'erase': g.fillStyle = COL.hazard; for (let i = 0; i < 10; i++) { g.fillRect(3 + i, 3 + i, 2, 2); g.fillRect(12 - i, 3 + i, 2, 2); } break;
    }
  };

  // ---------------- render
  E.render = function (ctx, dt) {
    const d = E.data;
    if (E.dirty || !E.game) {
      E.game = new FF.Game({ mode: 'editor', custom: d, settings: { reduceFx: true }, skin: FF.save.skin });
      E.dirty = false;
    }
    const g = E.game;
    g.time += dt;
    g.camX = E.camX;
    g.render(ctx);
    const cam = Math.round(E.camX);
    // grid
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let x = -((cam % 32) + 32) % 32; x < FF.W; x += 32) for (let y = C + 4; y < F; y += 8) ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, FF.MID, FF.W, 1);
    // start zone + ghost Flippo
    const sx = -cam;
    ctx.fillStyle = 'rgba(125,255,178,0.08)';
    ctx.fillRect(sx, C, START_SAFE, F - C);
    FF.drawFlippo(ctx, sx, F - 12, { skin: FF.save.skin, face: 'run', foot: 0, alpha: 0.85 });
    FF.font.draw(ctx, 'START', sx + 6, F - 24, { color: FF.COLORS.perfect, align: 'center', outline: '#05060d' });
    // end
    FF.font.draw(ctx, 'FINISH', d.len - cam + 4, C + 4, { color: '#fff', align: 'center', outline: '#05060d' });
    // ruler
    for (let m = 0; m <= d.len; m += 400) {
      const x = m - cam;
      if (x < -10 || x > FF.W + 10) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x, F + 1, 1, 4);
      FF.font.draw(ctx, m / 10 + 'M', x + 2, F + 6, { color: 'rgba(255,255,255,0.6)' });
    }
    // bot failure marker
    if (E.mark) {
      const x = E.mark.x - cam;
      const blink = Math.floor(g.time * 4) & 1;
      ctx.fillStyle = blink ? FF.COLORS.hazard : '#fff';
      ctx.fillRect(x + 4, C, 1, F - C);
      FF.font.draw(ctx, 'X', x + 5, E.mark.y + 2, { color: FF.COLORS.hazard, align: 'center', outline: '#fff' });
    }
    // placement feedback
    for (const f of E.fx) {
      f.t += dt;
      const r = 3 + f.t * 30;
      ctx.strokeStyle = f.bad ? 'rgba(255,51,85,' + (1 - f.t * 3) + ')' : 'rgba(125,255,178,' + (1 - f.t * 3) + ')';
      ctx.strokeRect(Math.round(f.x - cam - r), Math.round(f.y - r), Math.round(r * 2), Math.round(r * 2));
    }
    E.fx = E.fx.filter((f) => f.t < 0.33);
    const sl = document.getElementById('edScroll');
    if (sl && !E.sliding) sl.value = Math.round(E.scrollFrac() * 1000);
    if (false) {
    const mw = 120, mx = (FF.W - mw) / 2, my = F + 15;
    ctx.fillStyle = 'rgba(5,6,13,0.7)';
    ctx.fillRect(mx - 1, my - 1, mw + 2, 5);
    for (const it of d.items) {
      ctx.fillStyle = it.k === 'coin' || it.k === 'gem' ? FF.COLORS.coin : it.k === 'wallB' || it.k === 'catchB' ? FF.COLORS.blue : it.k === 'wallP' || it.k === 'catchP' ? FF.COLORS.purple : FF.COLORS.hazard;
      ctx.fillRect(mx + Math.round((it.x / d.len) * mw), my, 1, 3);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(mx + Math.round(FF.clamp((E.camX + FF.PLAYER_X) / d.len, 0, 1) * mw), my - 2, 1, 7);
    }
  };

  // ---------------- pointer input: tap places instantly, dragging paints (for paintable tools)
  E.pointerDown = function (lx, ly) {
    snapshot();
    E.drag = { last: null };
    E.paintAt(lx, ly);
  };
  E.pointerMove = function (lx, ly) {
    if (!E.drag || !E.PAINT.includes(E.tool)) return;
    E.paintAt(lx, ly);
  };
  E.paintAt = function (lx, ly) {
    const wx = lx + E.camX;
    const key = Math.floor(wx / GRID) + ':' + (E.tool === 'coin' || E.tool === 'gem' || E.tool === 'block' ? Math.round(ly / 10) : ly > FF.MID);
    if (E.drag.last === key) return;
    E.drag.last = key;
    E.tapAt(wx, ly, true);
  };
  E.pointerUp = function () {
    if (E.drag && E.undo.length && E.undo[E.undo.length - 1] === JSON.stringify(E.data)) E.undo.pop();
    E.drag = null;
  };
  E.scroll = function (dx) {
    E.camX = FF.clamp(E.camX + dx, -40, Math.max(-40, E.data.len - FF.W + 60));
  };
  E.scrollFrac = () => FF.clamp((E.camX + 40) / Math.max(1, E.data.len - FF.W + 100), 0, 1);
  E.setScrollFrac = (f) => { E.camX = -40 + f * Math.max(0, E.data.len - FF.W + 100); };

  // ---------------- featured levels (built in code — remix them!)
  function featured() {
    const L = [];
    // 1. Flippo's Staircase
    {
      const it = [];
      for (let i = 0; i < 9; i++) {
        const x = 200 + i * 160;
        it.push({ k: 'spike', x, y: i % 2 ? 40 : 150 }, { k: 'spike', x: x + 8, y: i % 2 ? 40 : 150 });
        it.push({ k: 'coin', x: x + 72, y: 96 });
      }
      for (let i = 0; i < 6; i++) it.push({ k: 'block', x: 1720 + i * 48, y: 152 - i * 8 });
      for (let i = 0; i < 6; i++) it.push({ k: 'gem', x: 1720 + i * 48, y: 120 - i * 8 });
      L.push({ id: 'f1', featured: true, name: "FLIPPO'S STAIRS", world: 'neon', speed: 115, len: 2160, items: it, verified: true });
    }
    // 2. Laser Disco
    {
      const it = [];
      for (let i = 0; i < 7; i++) {
        const x = 220 + i * 210;
        it.push({ k: 'laser', x });
        it.push({ k: 'coin', x: x + 40, y: i % 2 ? 44 : 148 }, { k: 'coin', x: x + 56, y: i % 2 ? 44 : 148 });
        if (i % 3 === 2) it.push({ k: 'pad', x: x + 104, y: 150 });
      }
      L.push({ id: 'f2', featured: true, name: 'LASER DISCO', world: 'glitch', speed: 120, len: 1800, items: it, verified: true });
    }
    // 3. Gem Heist
    {
      const it = [];
      for (let i = 0; i < 4; i++) {
        const x = 220 + i * 360;
        for (let s = 0; s < 10; s++) it.push({ k: 'spike', x: x + 40 + s * 8, y: 150 });
        it.push({ k: 'catchP', x: x + 24, y: 116 });
        it.push({ k: 'catchP', x: x + 72, y: 116 });
        for (let gI = 0; gI < 4; gI++) it.push({ k: 'gem', x: x + 40 + gI * 24, y: 128 });
        it.push({ k: i % 2 ? 'wallP' : 'wallB', x: x + 240 });
      }
      L.push({ id: 'f3', featured: true, name: 'GEM HEIST', world: 'candy', speed: 125, len: 1760, items: it, verified: true });
    }
    // 4. Sky Elevator
    {
      const it = [];
      for (let i = 0; i < 5; i++) {
        const x = 200 + i * 260;
        for (let s2 = 0; s2 < 16; s2++) it.push({ k: 'spike', x: x + s2 * 8, y: 150 });
        it.push({ k: 'lift', x: x + 24 });
        for (let c = 0; c < 4; c++) it.push({ k: 'coin', x: x + 32 + c * 16, y: 80 });
        if (i % 2) it.push({ k: 'bumper', x: x + 180, y: 40 });
      }
      L.push({ id: 'f4', featured: true, name: 'SKY ELEVATOR', world: 'sky', speed: 115, len: 1600, items: it, verified: true });
    }
    // 5. Volcano Run
    {
      const it = [];
      for (let i = 0; i < 6; i++) {
        const x = 220 + i * 220;
        it.push({ k: i % 2 ? 'pop' : 'saw', x, y: i % 3 ? 150 : 40 });
        it.push({ k: 'crumble', x: x + 110, y: 100 });
        it.push({ k: 'gem', x: x + 130, y: 88 });
      }
      L.push({ id: 'f5', featured: true, name: 'VOLCANO RUN', world: 'volcano', speed: 125, len: 1640, items: it, verified: true });
    }
    return L;
  }
  E.FEATURED = featured();
})(window.FF);
