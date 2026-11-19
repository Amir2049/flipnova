// FLIPNOVA — the five worlds. Same rules everywhere; each world has its own look and a signature obstacle.
(function (FF) {
  'use strict';
  const W = FF.W;
  const H = 320;        // background layers are painted tall, then centred on the corridor
  const LAYER_Y = FF.MID - 160;
  const TILE = 256;

  function px(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }
  function bandSky(g, top, bot, y0, y1) {
    const bands = 10;
    const bh = (y1 - y0) / bands;
    for (let i = 0; i < bands; i++) {
      px(g, 0, Math.floor(y0 + i * bh), TILE, Math.ceil(bh) + 1, FF.mix(top, bot, i / (bands - 1)));
      // dithered seam between bands
      if (i < bands - 1) {
        g.fillStyle = FF.mix(top, bot, (i + 1) / (bands - 1));
        const yy = Math.floor(y0 + (i + 1) * bh) - 1;
        for (let x = (i & 1); x < TILE; x += 2) g.fillRect(x, yy, 1, 1);
      }
    }
  }
  function gear(g, cx, cy, R, teeth, col, hole) {
    for (let y = -R - 4; y <= R + 4; y++) {
      for (let x = -R - 4; x <= R + 4; x++) {
        const r = Math.sqrt(x * x + y * y);
        const a = Math.atan2(y, x);
        const tooth = Math.cos(a * teeth) > 0.3;
        if (r <= R || (r <= R + 3 && tooth)) {
          if (hole && r < R * 0.35) continue;
          g.fillStyle = col;
          g.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
  }

  const builders = {
    neon(rng) {
      const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
      const f = far.getContext('2d'), m = mid.getContext('2d');
      bandSky(f, '#070926', '#3a1258', 0, H);
      for (let i = 0; i < 70; i++) px(f, rng.int(0, TILE - 1), rng.int(0, 200), 1, 1, rng.chance(0.2) ? '#ff9ae8' : '#cfd8ff');
      // moon
      for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 81) px(f, 190 + x, 90 + y, 1, 1, (x + 3) * (x + 3) + (y + 2) * (y + 2) < 30 ? '#fff4d6' : '#ffd9a8');
      let x = 0;
      while (x < TILE) {
        const bw = rng.int(14, 30), bh = rng.int(40, 120);
        px(f, x, H - 40 - bh, bw, bh + 40, '#1a1442');
        for (let wy = H - 34 - bh; wy < H - 40; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (rng.chance(0.18)) px(f, wx, wy, 2, 3, rng.chance(0.5) ? '#ffcf6b' : '#5ad8ff');
        x += bw + rng.int(0, 4);
      }
      x = 0;
      while (x < TILE) {
        const bw = rng.int(22, 44), bh = rng.int(30, 90);
        const top = H - 50 - bh;
        px(m, x, top, bw, bh + 60, '#120d2e');
        px(m, x, top, bw, 1, '#2e2466');
        if (rng.chance(0.6)) {
          const sc = rng.pick(['#ff3cf2', '#27d7ff', '#ffe066', '#7dffb2']);
          const sw = rng.int(10, bw - 6);
          px(m, x + 3, top + 6, sw, 5, FF.rgba(sc, 0.25));
          px(m, x + 3, top + 6, sw, 1, sc);
          px(m, x + 3, top + 10, sw, 1, sc);
          px(m, x + 3, top + 6, 1, 5, sc);
          px(m, x + 2 + sw, top + 6, 1, 5, sc);
        }
        if (rng.chance(0.5)) {
          px(m, x + (bw >> 1), top - 12, 1, 12, '#2e2466');
          px(m, x + (bw >> 1), top - 13, 1, 1, '#ff3355');
        }
        x += bw + rng.int(6, 18);
      }
      return { far, mid };
    },
    clock(rng) {
      const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
      const f = far.getContext('2d'), m = mid.getContext('2d');
      bandSky(f, '#140b06', '#3d2412', 0, H);
      gear(f, 60, 150, 40, 10, '#2a180c', true);
      gear(f, 170, 220, 30, 8, '#2a180c', true);
      gear(f, 230, 90, 22, 7, '#2a180c', true);
      for (let i = 0; i < 4; i++) {
        const y = rng.int(70, 250);
        px(f, 0, y, TILE, 4, '#33200f');
        px(f, 0, y, TILE, 1, '#4d311a');
      }
      gear(m, 40, 110, 16, 8, '#5a3618', true);
      gear(m, 140, 200, 22, 9, '#5a3618', true);
      gear(m, 215, 130, 12, 6, '#6b4220', true);
      for (let i = 0; i < 3; i++) {
        const x = rng.int(10, 240);
        for (let y = 60; y < 260; y += 4) px(m, x, y, 2, 3, '#4a2c12');
      }
      return { far, mid };
    },
    mirror(rng) {
      const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
      const f = far.getContext('2d'), m = mid.getContext('2d');
      bandSky(f, '#03040a', '#141a36', 0, H / 2);
      bandSky(f, '#141a36', '#03040a', H / 2, H);
      for (let i = 0; i < 40; i++) {
        const x = rng.int(0, TILE), y = rng.int(0, H / 2 - 10);
        px(f, x, y, 1, 1, '#8aa0ff');
        px(f, x, H - y, 1, 1, '#3a4880');
      }
      for (let i = 0; i < 9; i++) {
        const x = rng.int(0, TILE - 20), h = rng.int(20, 70), w = rng.int(6, 14);
        for (let yy = 0; yy < h; yy++) {
          const ww = Math.max(1, Math.round(w * (1 - yy / h)));
          px(m, x + ((w - ww) >> 1), H / 2 - 4 - yy, ww, 1, yy === 0 ? '#9fb3ff' : '#2a3570');
          px(m, x + ((w - ww) >> 1), H / 2 + 4 + yy, ww, 1, '#1a2250');
        }
      }
      for (let x = 0; x < TILE; x += 2) px(m, x, H / 2, 1, 1, '#6c7fd6');
      return { far, mid };
    },
    candy(rng) {
      const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
      const f = far.getContext('2d'), m = mid.getContext('2d');
      bandSky(f, '#ffb7dc', '#a6e4ff', 0, H);
      for (let i = 0; i < 6; i++) {
        const cx = rng.int(0, TILE), cy = rng.int(70, 160);
        for (let k = 0; k < 4; k++) {
          const r = rng.int(7, 12), ox = k * 9 - 12;
          for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(f, cx + ox + x, cy + y, 1, 1, '#fff3fb');
        }
      }
      for (let x = 0; x < TILE; x++) {
        const h = 50 + Math.round(Math.sin(x / 20) * 12 + Math.sin(x / 7) * 4);
        px(f, x, H - h - 40, 1, h + 40, '#f7a8d6');
      }
      for (let i = 0; i < 7; i++) {
        const x = rng.int(4, TILE - 10), top = rng.int(110, 190);
        px(m, x + 4, top, 2, H - top, '#ffffff');
        const r = rng.int(6, 10), col = rng.pick(['#ff5fa8', '#5fd7ff', '#ffd54f', '#8cf5b3']);
        for (let y = -r; y <= r; y++) for (let xx = -r; xx <= r; xx++) {
          const d = xx * xx + y * y;
          if (d <= r * r) px(m, x + 5 + xx, top + y, 1, 1, (Math.floor(Math.atan2(y, xx) * 2 + Math.sqrt(d) / 3) & 1) ? col : '#ffffff');
        }
      }
      return { far, mid };
    },
    glitch(rng) {
      const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
      const f = far.getContext('2d'), m = mid.getContext('2d');
      bandSky(f, '#020403', '#06140c', 0, H);
      for (let y = 180; y < H; y += 8) px(f, 0, y, TILE, 1, '#0d3a22');
      for (let x = 0; x < TILE; x += 16) for (let y = 180; y < H; y++) if ((y & 1) === 0) px(f, x, y, 1, 1, '#0d3a22');
      for (let i = 0; i < 25; i++) px(f, rng.int(0, TILE), rng.int(0, 170), rng.int(2, 10), 1, rng.pick(['#123d26', '#2a0f33', '#0e2a3d']));
      let x = 6;
      while (x < TILE - 30) {
        const top = rng.int(130, 170);
        px(m, x, top, 24, H - top, '#0b1410');
        px(m, x + 3, top + 6, 18, 14, '#0f3d24');
        px(m, x + 4, top + 7, 16, 12, rng.pick(['#1aff7a', '#ff3cf2', '#27d7ff']));
        for (let yy = 0; yy < 12; yy += 2) px(m, x + 4, top + 7 + yy, 16, 1, 'rgba(0,0,0,0.35)');
        px(m, x + 6, top + 26, 3, 3, '#ff3355');
        px(m, x + 14, top + 26, 3, 3, '#27d7ff');
        x += rng.int(34, 60);
      }
      return { far, mid };
    }
  };

  builders.volcano = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#140404', '#4a0f06', 0, H);
    // distant volcano with glowing crater
    for (let y = 0; y < 120; y++) {
      const w = 20 + y * 1.4;
      px(f, 128 - w / 2, 130 + y, w, 1, '#250807');
    }
    px(f, 116, 128, 24, 3, '#ff6a1a');
    for (let i = 0; i < 30; i++) px(f, rng.int(0, TILE), rng.int(0, 130), 1, 1, rng.chance(0.5) ? '#ff8a3a' : '#7a2010');
    // lava rivers + jagged rocks in the mid layer
    for (let x = 0; x < TILE; x++) {
      const h = 40 + Math.round(Math.abs(Math.sin(x / 13)) * 26 + Math.sin(x / 5) * 4);
      px(m, x, H - h - 50, 1, h + 50, '#1c0605');
      if (x % 3 === 0) px(m, x, H - h - 50, 1, 1, '#5a1a0c');
    }
    // lava glow far below the track (kept dim so it never reads as a hazard)
    for (let x = 0; x < TILE; x++) px(f, x, 236 + Math.round(Math.sin(x / 11) * 2), 1, 4, '#5a1a08');
    return { far, mid };
  };
  builders.ocean = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#0a3a5a', '#020b1c', 0, H);
    // light rays
    for (let i = 0; i < 5; i++) {
      const x0 = rng.int(0, TILE);
      for (let y = 0; y < 200; y++) if ((y + i) % 2 === 0) px(f, x0 + y * 0.35, y, 6 - y / 40, 1, 'rgba(120,220,255,0.10)');
    }
    // kelp forest
    for (let i = 0; i < 14; i++) {
      const x = rng.int(0, TILE), h = rng.int(60, 150);
      for (let y = 0; y < h; y++) px(m, x + Math.round(Math.sin(y / 10 + i) * 3), H - 40 - y, 2, 1, y % 9 < 2 ? '#2f8a4a' : '#1b5a34');
    }
    // coral blobs
    for (let i = 0; i < 9; i++) {
      const x = rng.int(0, TILE), r = rng.int(4, 9), col = rng.pick(['#ff6f91', '#ffb347', '#c86bff']);
      for (let y = -r; y <= 0; y++) for (let xx = -r; xx <= r; xx++) if (xx * xx + y * y <= r * r) px(m, x + xx, H - 42 + y, 1, 1, (xx + y) & 1 ? col : '#0d3046');
    }
    return { far, mid };
  };
  builders.sky = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#3a7bd5', '#ffd6a0', 0, H);
    for (let i = 0; i < 8; i++) {
      const cx = rng.int(0, TILE), cy = rng.int(80, 240);
      for (let k = 0; k < 5; k++) {
        const r = rng.int(6, 12), ox = k * 8 - 16;
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(f, cx + ox + x, cy + y + (y > 3 ? 0 : 0), 1, 1, y > r / 2 ? '#e8f0ff' : '#ffffff');
      }
    }
    // floating temple islands with golden columns
    for (let i = 0; i < 3; i++) {
      const x = 20 + i * 85 + rng.int(-6, 6), y = rng.int(130, 200);
      for (let r = 0; r < 14; r++) px(m, x + r, y + r, 50 - r * 2, 1, '#8a6a4a');
      px(m, x, y - 2, 50, 3, '#cfa86a');
      for (let c = 0; c < 4; c++) {
        px(m, x + 6 + c * 12, y - 26, 4, 24, '#f4e3b5');
        px(m, x + 6 + c * 12, y - 26, 1, 24, '#ffffff');
      }
      px(m, x + 2, y - 30, 46, 4, '#e8c878');
      for (let r = 0; r < 6; r++) px(m, x + 4 + r * 3, y - 34 - r, 42 - r * 6, 1, '#e8c878');
    }
    return { far, mid };
  };

  builders.ice = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#06102a', '#1d3b6a', 0, H);
    // aurora ribbons
    for (let band = 0; band < 3; band++) {
      const col = ['rgba(90,255,190,0.18)', 'rgba(120,180,255,0.16)', 'rgba(200,120,255,0.14)'][band];
      for (let x = 0; x < TILE; x++) {
        const y = 80 + band * 14 + Math.round(Math.sin(x / 23 + band) * 10 + Math.sin(x / 7) * 2);
        px(f, x, y, 1, 10 + band * 2, col);
      }
    }
    for (let i = 0; i < 50; i++) px(f, rng.int(0, TILE), rng.int(60, 170), 1, 1, '#e8f4ff');
    // snowy mountains
    let x = -20;
    while (x < TILE + 20) {
      const w = rng.int(50, 90), h = rng.int(50, 90), base = H - 60;
      for (let yy = 0; yy < h; yy++) {
        const ww = Math.round(w * (yy / h));
        px(m, x + (w >> 1) - (ww >> 1), base - h + yy, ww, 1, yy < h * 0.3 ? '#e8f4ff' : '#2a4a78');
      }
      px(m, x, base, w, 60, '#2a4a78');
      x += w - rng.int(10, 25);
    }
    return { far, mid };
  };

  // ---- secret rift worlds (only reachable through a RIFT portal)
  builders.cosmos = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#02010a', '#1a0838', 0, H);
    // nebula clouds
    for (let i = 0; i < 260; i++) {
      const a = rng() * Math.PI * 2, r = rng() * 46;
      px(f, Math.round(128 + Math.cos(a) * r * 2.2), Math.round(150 + Math.sin(a) * r * 0.8), 2, 2, rng.chance(0.5) ? 'rgba(255,60,200,0.18)' : 'rgba(80,140,255,0.18)');
    }
    for (let i = 0; i < 120; i++) px(f, rng.int(0, TILE - 1), rng.int(0, H - 1), 1, 1, rng.chance(0.15) ? '#ffe9a8' : '#ffffff');
    // ringed planet
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) if (x * x + y * y <= 256) px(m, 70 + x, 110 + y, 1, 1, y < -4 ? '#ffb36b' : y < 6 ? '#ff7a4a' : '#c0442a');
    for (let x = -30; x <= 30; x++) { const y = Math.round(x * 0.22); if (Math.abs(x) > 15 || y > 0) px(m, 70 + x, 112 + y, 1, 1, '#ffe1a8'); }
    // tiny moon
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 25) px(m, 200 + x, 80 + y, 1, 1, x + y < 0 ? '#d8e4ff' : '#8a9acc');
    return { far, mid };
  };
  builders.vault = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#2a1600', '#6a3c00', 0, H);
    // giant vault door rings
    for (let y = -40; y <= 40; y++) for (let x = -40; x <= 40; x++) {
      const r = Math.sqrt(x * x + y * y);
      if (r < 40 && (r > 36 || (r > 22 && r < 25) || Math.abs(Math.atan2(y, x) % (Math.PI / 4)) < 0.05)) px(f, 128 + x, 140 + y, 1, 1, '#a8740a');
    }
    // piles of gold coins
    let x = -10;
    while (x < TILE + 10) {
      const w = rng.int(40, 70), h = rng.int(30, 60), base = H - 60;
      for (let yy = 0; yy < h; yy++) {
        const ww = Math.round(w * Math.sqrt(yy / h));
        const xs = x + (w >> 1) - (ww >> 1);
        px(m, xs, base - h + yy, ww, 1, '#c98a10');
        for (let cx = xs; cx < xs + ww; cx += 5) if (rng.chance(0.3)) px(m, cx, base - h + yy, 3, 1, rng.chance(0.4) ? '#fff0a0' : '#ffd23f');
      }
      px(m, x, base, w, 60, '#a8700a');
      x += w - rng.int(8, 20);
    }
    return { far, mid };
  };
  builders.aurora = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#020b12', '#08303a', 0, H);
    for (let band = 0; band < 4; band++) {
      const col = ['rgba(60,255,170,0.22)', 'rgba(60,200,255,0.18)', 'rgba(255,90,220,0.15)', 'rgba(180,255,90,0.12)'][band];
      for (let x = 0; x < TILE; x++) {
        const y = 60 + band * 16 + Math.round(Math.sin(x / 19 + band * 1.7) * 14 + Math.sin(x / 6 + band) * 2);
        px(f, x, y, 1, 18 + band * 3, col);
      }
    }
    for (let i = 0; i < 60; i++) px(f, rng.int(0, TILE), rng.int(20, 160), 1, 1, '#e8fff6');
    // machine towers (the pistons come from here)
    let x = 0;
    while (x < TILE) {
      const w = rng.int(16, 28), h = rng.int(50, 110), base = H - 50;
      px(m, x, base - h, w, h + 50, '#0b2026');
      px(m, x, base - h, w, 2, '#3affc0');
      for (let yy = base - h + 6; yy < base; yy += 9) px(m, x + 3, yy, w - 6, 2, rng.chance(0.4) ? '#1effa0' : '#123a40');
      x += w + rng.int(6, 20);
    }
    return { far, mid };
  };

  // ---- b61: three new worlds after THE LAST DOOR
  // SANDSTORM DUNES: a burning orange sky, a huge low sun, rolling dunes and half-buried pyramids
  builders.desert = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#3a1206', '#f08a2a', 0, H);
    for (let y = -26; y <= 26; y++) for (let x = -26; x <= 26; x++) if (x * x + y * y <= 676) px(f, 170 + x, 170 + y, 1, 1, x * x + y * y < 380 ? '#fff0b0' : '#ffc860');
    for (let i = 0; i < 4; i++) px(f, 140, 168 + i * 6, 60, 1, 'rgba(240,110,40,0.55)'); // heat bands across the sun
    // far pyramids
    for (const [cx, w] of [[50, 70], [110, 46], [215, 58]]) for (let yy = 0; yy < w / 2; yy++) px(f, cx - yy, H - 90 - w / 2 + yy, yy * 2 + 1, 1, yy % 7 === 0 ? '#9a4a1a' : '#b8622a');
    // dunes (sine ridges, light crest)
    for (let layer = 0; layer < 2; layer++) {
      const base = H - 70 + layer * 18, col = layer ? '#c8762e' : '#a85a22', crest = layer ? '#f2b060' : '#d8904a';
      for (let x = 0; x < TILE; x++) {
        const y = Math.round(base - 14 - Math.sin((x / TILE) * Math.PI * 2 * (layer + 1) + layer) * 10 - Math.sin(x / 9) * 1.5);
        px(m, x, y, 1, H - y, col); px(m, x, y, 1, 1, crest);
      }
    }
    for (let i = 0; i < 6; i++) { const x = rng.int(10, TILE - 10), y = H - 72 + rng.int(-4, 8); px(m, x, y - 10, 2, 10, '#3a5a22'); px(m, x - 3, y - 7, 3, 1, '#3a5a22'); px(m, x - 3, y - 9, 1, 2, '#3a5a22'); px(m, x + 2, y - 6, 3, 1, '#3a5a22'); px(m, x + 4, y - 8, 1, 2, '#3a5a22'); } // cacti
    return { far, mid };
  };
  // NEBULA DRIFT: deep space, a pink-violet nebula, a giant planet with rings and floating asteroid rocks
  builders.nebula = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#03020c', '#140a2e', 0, H);
    for (let i = 0; i < 420; i++) {
      const a = rng() * Math.PI * 2, r = Math.pow(rng(), 0.6) * 70;
      px(f, Math.round(((90 + Math.cos(a) * r * 2) % TILE + TILE) % TILE), Math.round(140 + Math.sin(a) * r * 0.7), 2, 2, ['rgba(255,70,190,0.14)', 'rgba(140,90,255,0.16)', 'rgba(60,220,255,0.1)'][i % 3]);
    }
    for (let i = 0; i < 140; i++) px(f, rng.int(0, TILE - 1), rng.int(0, H - 1), 1, 1, rng.chance(0.2) ? '#ffd0f4' : '#ffffff');
    // the gas giant
    for (let y = -30; y <= 30; y++) for (let x = -30; x <= 30; x++) if (x * x + y * y <= 900) px(m, 190 + x, 120 + y, 1, 1, ['#6a3ad8', '#8a5af0', '#b07aff', '#7a48e0'][(Math.floor((y + 30) / 7) + (x > 12 ? 1 : 0)) % 4]);
    for (let x = -52; x <= 52; x++) { const y = Math.round(x * 0.18); if (Math.abs(x) > 29 || y > 2) { px(m, 190 + x, 124 + y, 1, 1, '#ffd2f0'); px(m, 190 + x, 125 + y, 1, 1, 'rgba(255,170,230,0.5)'); } }
    // drifting rocks
    for (let i = 0; i < 9; i++) {
      const cx = rng.int(0, TILE), cy = rng.int(150, H - 50), r = rng.int(3, 8);
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(m, cx + x, cy + y, 1, 1, x + y < 0 ? '#5a5070' : '#2e2840');
    }
    return { far, mid };
  };
  // JUNGLE RUINS: misty green canopy, a stepped stone temple and hanging vines
  builders.jungle = function (rng) {
    const far = FF.makeCanvas(TILE, H), mid = FF.makeCanvas(TILE, H);
    const f = far.getContext('2d'), m = mid.getContext('2d');
    bandSky(f, '#06180e', '#3a7a3a', 0, H);
    for (let i = 0; i < 30; i++) px(f, rng.int(0, TILE), rng.int(40, 180), 1, rng.int(10, 30), 'rgba(220,255,200,0.07)'); // light shafts
    // the temple: stepped pyramid with a dark doorway
    for (let st = 0; st < 6; st++) px(f, 128 - 60 + st * 10, H - 70 - st * 14, 120 - st * 20, 14, st % 2 ? '#3e5a38' : '#4a6a42');
    px(f, 120, H - 70 - 5 * 14 - 10, 16, 10, '#24361f'); px(f, 122, H - 82, 12, 12, '#0e180c');
    // tree trunks and canopy
    let x = -6;
    while (x < TILE + 6) {
      const w = rng.int(5, 9);
      px(m, x, 40, w, H, '#2a1c10'); px(m, x + 1, 40, 1, H, '#4a3420');
      x += rng.int(30, 60);
    }
    for (let i = 0; i < 90; i++) { const cx = rng.int(0, TILE), cy = rng.int(20, 80), r = rng.int(6, 14); for (let y = -r; y <= r; y += 2) for (let xx = -r; xx <= r; xx += 2) if (xx * xx + y * y <= r * r && rng.chance(0.7)) px(m, cx + xx, cy + y, 2, 2, rng.chance(0.3) ? '#2f8a3a' : '#1c5a26'); }
    for (let i = 0; i < 14; i++) { const vx = rng.int(0, TILE), len = rng.int(30, 90); for (let y = 0; y < len; y++) px(m, vx + Math.round(Math.sin(y / 6) * 2), 70 + y, 1, 1, '#3a9a3a'); px(m, vx, 70 + len, 2, 2, '#ff6ab0'); } // vines + flowers
    for (let yy = H - 60; yy < H; yy += 3) for (let xx = 0; xx < TILE; xx += 4) if (rng.chance(0.5)) px(m, xx, yy, 3, 2, rng.chance(0.5) ? '#1f6a2a' : '#2f8a3a'); // ferns
    return { far, mid };
  };

  // Floor surface tile (32 x 60). The ceiling uses the same tile mirrored.
  function surfaceTile(world) {
    const cv = FF.makeCanvas(32, 60);
    const g = cv.getContext('2d');
    const s = world.surface;
    px(g, 0, 0, 32, 60, s.base);
    px(g, 0, 0, 32, 2, s.light);
    px(g, 0, 2, 32, 1, s.dark);
    switch (world.id) {
      case 'neon':
        for (let y = 8; y < 60; y += 8) {
          px(g, 0, y, 32, 1, s.dark);
          px(g, (y / 8) & 1 ? 0 : 16, y - 7, 1, 7, s.dark);
        }
        px(g, 20, 4, 6, 3, s.dark);
        break;
      case 'clock':
        for (let y = 6; y < 60; y += 12) {
          px(g, 0, y, 32, 1, s.dark);
          px(g, 3, y + 3, 1, 1, s.light);
          px(g, 28, y + 3, 1, 1, s.light);
        }
        px(g, 0, 0, 1, 60, s.dark);
        break;
      case 'mirror':
        for (let i = 0; i < 5; i++) px(g, 4 + i * 6, 6 + i * 2, 1, 6, s.light);
        for (let y = 14; y < 60; y += 10) px(g, 0, y, 32, 1, s.dark);
        break;
      case 'candy':
        for (let x = -60; x < 32; x += 8) for (let y = 3; y < 60; y++) {
          const xx = x + y;
          if (xx >= 0 && xx < 32) px(g, xx, y, 3, 1, s.light);
        }
        px(g, 0, 2, 32, 1, s.dark);
        break;
      case 'ice':
        px(g, 0, 0, 32, 3, '#ffffff');
        for (let x = 2; x < 32; x += 7) px(g, x, 3, 2, 2 + (x % 3), '#cfeaff');
        for (let y = 12; y < 60; y += 12) { px(g, 0, y, 32, 1, s.dark); px(g, (y * 3) % 28, y - 6, 3, 1, '#ffffff'); }
        break;
      case 'volcano':
        for (let i = 0; i < 6; i++) px(g, (i * 11) % 30, 8 + i * 8, 4, 2, '#ff5a10');
        for (let y = 10; y < 60; y += 10) px(g, 0, y, 32, 1, s.dark);
        px(g, 0, 2, 32, 1, '#ff8a3a');
        break;
      case 'ocean':
        for (let y = 6; y < 60; y += 8) for (let x = (y / 8) & 1 ? 0 : 4; x < 32; x += 8) px(g, x, y, 3, 2, s.dark);
        px(g, 6, 4, 2, 1, '#ff9ab0');
        px(g, 22, 3, 3, 2, '#ffd27a');
        break;
      case 'sky':
        for (let y = 8; y < 60; y += 8) px(g, 0, y, 32, 1, s.dark);
        px(g, 0, 3, 32, 1, '#fff4c8');
        for (let x = 4; x < 32; x += 8) px(g, x, 5, 2, 2, '#e8c878');
        break;
      case 'cosmos':
        for (let i = 0; i < 9; i++) px(g, (i * 13) % 31, 6 + i * 6, 1, 1, '#ffffff');
        for (let y = 10; y < 60; y += 10) px(g, 0, y, 32, 1, s.dark);
        break;
      case 'vault':
        for (let y = 6; y < 60; y += 8) for (let x = (y / 8) & 1 ? 0 : 8; x < 32; x += 16) { px(g, x, y, 14, 6, s.dark); px(g, x + 1, y, 12, 1, s.light); }
        break;
      case 'aurora':
        for (let y = 6; y < 60; y += 6) px(g, 0, y, 32, 1, s.dark);
        for (let x = 0; x < 32; x += 8) px(g, x + 2, 4, 3, 1, '#3affc0');
        break;
      case 'desert':
        for (let y = 5; y < 60; y += 7) for (let x = 0; x < 32; x++) if (Math.sin(x / 3 + y) > 0.6) px(g, x, y, 1, 1, s.dark);
        px(g, 0, 2, 32, 1, '#ffd890');
        px(g, 7, 12, 2, 1, s.light); px(g, 23, 30, 2, 1, s.light);
        break;
      case 'nebula':
        for (let y = 8; y < 60; y += 8) px(g, 0, y, 32, 1, s.dark);
        for (let i = 0; i < 7; i++) px(g, (i * 11 + 3) % 31, 5 + i * 8, 1, 1, i % 2 ? '#ff7ae0' : '#ffffff');
        px(g, 0, 2, 32, 1, '#ff7ae0');
        break;
      case 'jungle':
        for (let y = 6; y < 60; y += 10) for (let x = (y / 10) & 1 ? 0 : 8; x < 32; x += 16) { px(g, x, y, 15, 9, s.dark); px(g, x + 1, y, 13, 1, s.light); }
        for (let x = 1; x < 32; x += 5) px(g, x, 0, 2, 3, '#3ad04a'); // moss on the edge
        break;
      case 'glitch':
        for (let y = 6; y < 60; y += 6) px(g, 0, y, 32, 1, s.dark);
        for (let x = 0; x < 32; x += 8) px(g, x, 3, 1, 57, s.dark);
        px(g, 10, 20, 4, 1, '#1aff7a');
        break;
    }
    return cv;
  }

  FF.WORLDS = [
    {
      id: 'neon', name: 'NEON ROOFTOPS', nameAr: 'أسطح النيون', idx: 1,
      surface: { base: '#1b1838', dark: '#0d0b20', light: '#4a3f99' },
      edge: '#8f7bff', dim: 0.18, hud: '#ffffff',
      weights: { fork: 2.2 }
    },
    {
      id: 'clock', name: 'CLOCKWORK LAB', nameAr: 'مختبر التروس', idx: 2,
      surface: { base: '#7a4a22', dark: '#3d2410', light: '#d08a4a' },
      edge: '#ffb067', dim: 0.15, hud: '#fff2df',
      weights: { mover: 2.6 }
    },
    {
      id: 'mirror', name: 'MIRROR VOID', nameAr: 'فراغ المرايا', idx: 3,
      surface: { base: '#1a2042', dark: '#0a0d20', light: '#9fb3ff' },
      edge: '#9fb3ff', dim: 0.1, hud: '#e6ecff',
      weights: { gate: 2.2, gatePair: 2.2, gateSpike: 2 }
    },
    {
      id: 'candy', name: 'CANDY CIRCUIT', nameAr: 'دائرة الحلوى', idx: 4,
      surface: { base: '#5fd3a8', dark: '#2d8a6a', light: '#a8f5d8' },
      edge: '#ffffff', dim: 0.0, hud: '#ffffff',
      weights: { trajectory: 2.4, calm: 1.4, catch: 2 }
    },
    {
      id: 'glitch', name: 'GLITCH ARCADE', nameAr: 'آركيد الخلل', idx: 5,
      surface: { base: '#07130c', dark: '#020604', light: '#1aff7a' },
      edge: '#1aff7a', dim: 0.1, hud: '#d6ffe6', scanlines: true,
      weights: { lock: 2.6, zigzag: 1.5 }
    },
    {
      id: 'volcano', name: 'VOLCANO CORE', nameAr: 'قلب البركان', idx: 6,
      surface: { base: '#2a0d08', dark: '#120402', light: '#ff6a1a' },
      edge: '#ff8a3a', dim: 0.12, hud: '#ffe2cc',
      weights: { pop: 2.6, saw: 2.2, crumble: 1.8 }
    },
    {
      id: 'ocean', name: 'DEEP OCEAN', nameAr: 'أعماق المحيط', idx: 7,
      surface: { base: '#0f3a4a', dark: '#06202a', light: '#5fe0ff' },
      edge: '#5fe0ff', dim: 0.08, hud: '#e0f8ff',
      weights: { fan: 2.6, orbit: 2.3, bumper: 1.8 }
    },
    {
      id: 'sky', name: 'SKY TEMPLE', nameAr: 'معبد السماء', idx: 8,
      surface: { base: '#c99a5a', dark: '#7a5530', light: '#fff1c4' },
      edge: '#ffffff', dim: 0.05, hud: '#ffffff',
      weights: { lift: 2.6, blink: 2.2, pend: 2, dash: 1.6 }
    },
    {
      id: 'ice', name: 'FROZEN PEAKS', nameAr: 'القمم المتجمدة', idx: 9,
      surface: { base: '#6fa8dc', dark: '#3a6ea8', light: '#ffffff' },
      edge: '#cfeaff', dim: 0.1, hud: '#ffffff',
      weights: { crumble: 2.4, saw: 2, orbit: 1.8, gateSpike: 1.5 }
    },
    // b61: the three new worlds (they come after THE LAST DOOR; only the stage book uses them)
    {
      id: 'desert', name: 'SANDSTORM DUNES', nameAr: 'كثبان العاصفة', idx: 10,
      surface: { base: '#b8702a', dark: '#7a4416', light: '#ffd890' },
      edge: '#ffd890', dim: 0.06, hud: '#fff4e0'
    },
    {
      id: 'nebula', name: 'NEBULA DRIFT', nameAr: 'سديم المجرة', idx: 11,
      surface: { base: '#1c1036', dark: '#0a0620', light: '#c08aff' },
      edge: '#ff7ae0', dim: 0.06, hud: '#ffffff'
    },
    {
      id: 'jungle', name: 'JUNGLE RUINS', nameAr: 'أطلال الغابة', idx: 12,
      surface: { base: '#4a5a3a', dark: '#26301e', light: '#a8c87a' },
      edge: '#7aff6a', dim: 0.1, hud: '#eaffe0'
    }
  ];
  FF.WORLDS_BASE = 9; // the first nine: everything that existed before b61 (old rules, daily remix) uses only these

  FF.RIFT_WORLDS = [
    { id: 'cosmos', name: 'COSMIC RIFT', nameAr: 'الشق الكوني', idx: 0, rift: true,
      surface: { base: '#160a30', dark: '#08031a', light: '#c07bff' }, edge: '#ff5ae0', dim: 0.05, hud: '#ffffff' },
    { id: 'vault', name: 'GOLD VAULT', nameAr: 'خزنة الذهب', idx: 0, rift: true,
      surface: { base: '#8a5a08', dark: '#4a2e02', light: '#ffe066' }, edge: '#ffd23f', dim: 0.0, hud: '#ffffff' },
    { id: 'aurora', name: 'AURORA FORGE', nameAr: 'مصنع الشفق', idx: 0, rift: true,
      surface: { base: '#0b2a2e', dark: '#041416', light: '#3affc0' }, edge: '#3affc0', dim: 0.05, hud: '#ffffff' }
  ];
  FF.worldById = (id) => FF.WORLDS.find((w) => w.id === id) || FF.RIFT_WORLDS.find((w) => w.id === id) || FF.WORLDS[0];

  FF.prepareWorlds = function () {
    for (const w of FF.WORLDS.concat(FF.RIFT_WORLDS)) {
      if (w.far) continue;
      const rng = FF.mulberry32(FF.hashStr(w.id));
      const l = builders[w.id](rng);
      w.far = l.far;
      w.mid = l.mid;
      w.floorTile = surfaceTile(w);
      const ct = FF.makeCanvas(32, 60);
      const cg = ct.getContext('2d');
      cg.translate(0, 60);
      cg.scale(1, -1);
      cg.drawImage(w.floorTile, 0, 0);
      w.ceilTile = ct;
    }
  };

  function tiled(ctx, img, offset, y) {
    const iw = img.width;
    let x = -((offset % iw) + iw) % iw;
    for (; x < W; x += iw) ctx.drawImage(img, Math.round(x), y);
  }

  // Draws sky, parallax layers and the floor/ceiling bands.
  FF.drawWorld = function (ctx, world, scroll, t, opts) {
    opts = opts || {};
    tiled(ctx, world.far, scroll * 0.12, LAYER_Y);
    tiled(ctx, world.mid, scroll * 0.35, LAYER_Y);
    if (world.id === 'clock') {
      // one live, slowly turning gear for motion
      const a = t * 0.8;
      ctx.fillStyle = '#6b4220';
      for (let i = 0; i < 8; i++) {
        const ang = a + (i / 8) * Math.PI * 2;
        ctx.fillRect(Math.round(250 + Math.cos(ang) * 12) - 2, Math.round(70 + Math.sin(ang) * 12) - 2, 4, 4);
      }
      ctx.fillRect(244, 64, 12, 12);
    }
    if (!opts.noWeather) FF.drawWeather(ctx, world, scroll, t);
    if (world.dim) {
      ctx.fillStyle = 'rgba(4,6,16,' + world.dim + ')';
      ctx.fillRect(0, FF.C, W, FF.F - FF.C);
    }
    tiled(ctx, world.ceilTile, scroll, FF.C - 60);
    tiled(ctx, world.floorTile, scroll, FF.F);
    const edge = opts.edge || world.edge;
    ctx.fillStyle = edge;
    ctx.fillRect(0, FF.C - 1, W, 1);
    ctx.fillRect(0, FF.F, W, 1);
  };

  FF.drawScanlines = function (ctx, alpha) {
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    for (let y = 0; y < FF.H; y += 2) ctx.fillRect(0, y, W, 1);
  };

  // Ambient weather — pure function of time, so it costs no state and never touches gameplay.
  function hash(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  FF.drawWeather = function (ctx, world, scroll, t) {
    const top = FF.C, h = FF.F - FF.C;
    const wrap = (v, m) => ((v % m) + m) % m;
    switch (world.id) {
      case 'neon': // diagonal city rain
        ctx.fillStyle = 'rgba(150,170,255,0.35)';
        for (let i = 0; i < 40; i++) {
          const x = wrap(hash(i) * W - scroll * 0.6 - t * 60, W);
          const y = top + wrap(hash(i + 50) * h + t * 220, h);
          ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
        }
        break;
      case 'clock': // rising embers
        for (let i = 0; i < 18; i++) {
          const x = wrap(hash(i) * W - scroll * 0.4 + Math.sin(t * 2 + i) * 6, W);
          const y = top + wrap(hash(i + 9) * h - t * 18 * (0.5 + hash(i + 3)), h);
          ctx.fillStyle = i % 3 ? 'rgba(255,170,80,0.55)' : 'rgba(255,230,140,0.7)';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
        break;
      case 'mirror': // twinkling shards
        for (let i = 0; i < 16; i++) {
          const x = wrap(hash(i) * W - scroll * 0.2, W);
          const y = top + hash(i + 7) * h;
          const a = 0.2 + 0.5 * Math.max(0, Math.sin(t * 3 + i * 1.7));
          ctx.fillStyle = 'rgba(190,205,255,' + a.toFixed(2) + ')';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 2);
          if (a > 0.55) ctx.fillRect(Math.round(x) + 1, Math.round(y), 1, 2); // a brighter twin shard
        }
        break;
      case 'candy': { // falling sprinkles
        const cols = ['#ff5fa8', '#5fd7ff', '#ffd54f', '#8cf5b3', '#ffffff'];
        for (let i = 0; i < 26; i++) {
          const x = wrap(hash(i) * W - scroll * 0.5 + Math.sin(t + i) * 4, W);
          const y = top + wrap(hash(i + 30) * h + t * 25 * (0.6 + hash(i)), h);
          ctx.fillStyle = cols[i % cols.length];
          ctx.fillRect(Math.round(x), Math.round(y), i & 1 ? 2 : 1, i & 1 ? 1 : 2);
        }
        break;
      }
      case 'ice': // snow
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 36; i++) {
          const x = wrap(hash(i) * W - scroll * 0.55 + Math.sin(t * 1.3 + i) * 6 - t * 10, W);
          const y = top + wrap(hash(i + 40) * h + t * 18 * (0.5 + hash(i + 5)), h);
          ctx.fillRect(Math.round(x), Math.round(y), i % 5 ? 1 : 2, i % 5 ? 1 : 2);
        }
        break;
      case 'volcano': // rising ash and sparks
        for (let i = 0; i < 26; i++) {
          const x = wrap(hash(i) * W - scroll * 0.45 + Math.sin(t * 1.5 + i) * 5, W);
          const y = top + wrap(hash(i + 4) * h - t * 30 * (0.4 + hash(i + 8)), h);
          ctx.fillStyle = i % 4 ? 'rgba(255,120,40,0.6)' : 'rgba(255,220,120,0.8)';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
        break;
      case 'ocean': // bubbles
        for (let i = 0; i < 20; i++) {
          const x = wrap(hash(i) * W - scroll * 0.3 + Math.sin(t * 2 + i) * 3, W);
          const y = top + wrap(hash(i + 21) * h - t * 22 * (0.5 + hash(i + 2)), h);
          ctx.fillStyle = 'rgba(190,240,255,0.55)';
          const r = i % 3 === 0 ? 2 : 1;
          ctx.fillRect(Math.round(x), Math.round(y), r, r);
          if (r === 2) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
        }
        break;
      case 'sky': // drifting feathers of cloud
        for (let i = 0; i < 12; i++) {
          const x = wrap(hash(i) * W - scroll * 0.8 - t * 14, W + 20) - 10;
          const y = top + hash(i + 13) * h;
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.fillRect(Math.round(x), Math.round(y), 6 + (i % 3) * 3, 1);
        }
        break;
      case 'cosmos': // twinkling stars rushing past
        for (let i = 0; i < 30; i++) {
          const x = wrap(hash(i) * W - scroll * (0.9 + hash(i + 2)) - t * 40, W);
          const y = top + hash(i + 17) * h;
          ctx.fillStyle = i % 4 ? 'rgba(255,255,255,0.7)' : 'rgba(255,120,230,0.8)';
          ctx.fillRect(Math.round(x), Math.round(y), i % 6 ? 1 : 3, 1);
        }
        break;
      case 'vault': // glittering gold dust
        for (let i = 0; i < 26; i++) {
          const x = wrap(hash(i) * W - scroll * 0.4, W);
          const y = top + wrap(hash(i + 3) * h + t * 12 * (0.5 + hash(i)), h);
          const a = 0.3 + 0.6 * Math.max(0, Math.sin(t * 5 + i));
          ctx.fillStyle = 'rgba(255,220,90,' + a.toFixed(2) + ')';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          if (a > 0.8) ctx.fillRect(Math.round(x), Math.round(y), 2, 2); // a soft glint (round, not a '+')
        }
        break;
      case 'aurora': // floating green sparks
        for (let i = 0; i < 22; i++) {
          const x = wrap(hash(i) * W - scroll * 0.5 + Math.sin(t * 2 + i) * 5, W);
          const y = top + wrap(hash(i + 8) * h - t * 20 * (0.5 + hash(i + 1)), h);
          ctx.fillStyle = i % 3 ? 'rgba(60,255,180,0.6)' : 'rgba(255,120,230,0.6)';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
        break;
      case 'desert': // blowing sand streaks
        for (let i = 0; i < 34; i++) {
          const x = wrap(hash(i) * W - scroll * 0.7 - t * 120 * (0.6 + hash(i + 2)), W);
          const y = top + hash(i + 19) * h + Math.sin(t * 3 + i) * 2;
          ctx.fillStyle = i % 3 ? 'rgba(255,210,140,0.4)' : 'rgba(255,240,200,0.55)';
          ctx.fillRect(Math.round(x), Math.round(y), 3 + (i % 4) * 2, 1);
        }
        break;
      case 'nebula': // slow drifting stardust, some of it pink
        for (let i = 0; i < 26; i++) {
          const x = wrap(hash(i) * W - scroll * (0.3 + hash(i + 4) * 0.5), W);
          const y = top + wrap(hash(i + 23) * h + Math.sin(t * 0.8 + i) * 6, h);
          const a = 0.25 + 0.45 * Math.max(0, Math.sin(t * 2 + i * 1.3));
          ctx.fillStyle = i % 3 ? 'rgba(255,255,255,' + a.toFixed(2) + ')' : 'rgba(255,120,224,' + a.toFixed(2) + ')';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
        break;
      case 'jungle': // falling leaves and fireflies
        for (let i = 0; i < 18; i++) {
          const x = wrap(hash(i) * W - scroll * 0.5 + Math.sin(t * 1.4 + i) * 8, W);
          const y = top + wrap(hash(i + 31) * h + t * 14 * (0.5 + hash(i + 6)), h);
          ctx.fillStyle = i % 2 ? 'rgba(90,200,80,0.7)' : 'rgba(140,220,90,0.6)';
          ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
        }
        for (let i = 0; i < 10; i++) {
          const a = Math.max(0, Math.sin(t * 3 + i * 2.1));
          if (a < 0.3) continue;
          ctx.fillStyle = 'rgba(230,255,120,' + (a * 0.8).toFixed(2) + ')';
          ctx.fillRect(Math.round(wrap(hash(i + 60) * W - scroll * 0.3 + Math.sin(t + i) * 10, W)), Math.round(top + hash(i + 70) * h), 1, 1);
        }
        break;
      case 'glitch': // drifting data bits
        ctx.fillStyle = 'rgba(26,255,122,0.45)';
        for (let i = 0; i < 22; i++) {
          if (hash(i + Math.floor(t * 4)) < 0.25) continue;
          const x = wrap(hash(i) * W - scroll * 0.7, W);
          const y = top + wrap(hash(i + 11) * h + t * 40, h);
          ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
        }
        break;
    }
  };
})(window.FF);
