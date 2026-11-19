// FLIPNOVA — 5x7 bitmap pixel font (original glyphs), drawn straight onto the low-res canvas.
(function (FF) {
  'use strict';

  const G = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    B: '####.|#...#|#...#|####.|#...#|#...#|####.',
    C: '.###.|#...#|#....|#....|#....|#...#|.###.',
    D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
    E: '#####|#....|#....|####.|#....|#....|#####',
    F: '#####|#....|#....|####.|#....|#....|#....',
    G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
    H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
    K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
    O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    P: '####.|#...#|#...#|####.|#....|#....|#....',
    Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    S: '.####|#....|#....|.###.|....#|....#|####.',
    T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
    X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    0: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
    2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
    3: '####.|....#|....#|.###.|....#|....#|####.',
    4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
    5: '#####|#....|####.|....#|....#|#...#|.###.',
    6: '.###.|#....|#....|####.|#...#|#...#|.###.',
    7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
    8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    9: '.###.|#...#|#...#|.####|....#|....#|.###.',
    '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '.': '.....|.....|.....|.....|.....|.....|..#..',
    ',': '.....|.....|.....|.....|.....|..#..|.#...',
    ':': '.....|..#..|.....|.....|.....|..#..|.....',
    '-': '.....|.....|.....|.###.|.....|.....|.....',
    '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    x: '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
    "'": '..#..|..#..|.....|.....|.....|.....|.....',
    '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
    '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
    '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
    '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
    '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.',
    '#': '.#.#.|#####|.#.#.|.#.#.|.#.#.|#####|.#.#.',
    ' ': '.....|.....|.....|.....|.....|.....|.....'
  };

  const glyphs = {};
  for (const k in G) {
    glyphs[k] = G[k].split('|').map((row) => row.split('').map((c) => c === '#'));
  }

  function glyphFor(ch) {
    if (glyphs[ch]) return glyphs[ch];
    const up = ch.toUpperCase();
    return glyphs[up] || glyphs['?'];
  }

  const gcache = new Map();
  const scache = new Map();
  function glyphImg(ch, s, color, outline, shadow) {
    const key = ch + '|' + s + '|' + color + '|' + (outline || '') + '|' + (shadow || '');
    let c = gcache.get(key);
    if (c) return c;
    if (gcache.size > 1500) gcache.clear();
    c = document.createElement('canvas');
    c.width = 7 * s; c.height = 9 * s + (shadow ? s : 0);
    const g = c.getContext('2d');
    if (outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) font._raw(g, ch, s + dx * s, s + dy * s, s, outline);
    if (shadow) font._raw(g, ch, 2 * s, 2 * s, s, shadow);
    font._raw(g, ch, s, s, s, color);
    gcache.set(key, c);
    return c;
  }

  const font = {
    CW: 6, // advance per char at scale 1
    CH: 7,
    width(text, scale) {
      scale = scale || 1;
      return Math.max(0, text.length * 6 - 1) * scale;
    },
    // opts: color, scale, align ('left'|'center'|'right'), shadow (color), outline (color)
    draw(ctx, text, x, y, opts) {
      opts = opts || {};
      const s = opts.scale || 1;
      text = String(text);
      const w = font.width(text, s);
      let ox = Math.round(opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w : x);
      const oy = Math.round(y);
      const color = opts.color || '#fff';
      // each letter is drawn once into a little cached image (with its outline/shadow), then just stamped:
      // the HUD redraws text every frame, and pixel-by-pixel outlines were the most expensive part of a frame
      if (typeof color === 'string' && typeof document !== 'undefined') {
        // build 37: whole strings are cached too (same pixels, one stamp instead of one per letter) — the boss duel's
        // HUD, banners and cut-ins redraw ~100 letters a frame
        if (text.length > 1) {
          const key = text + '|' + s + '|' + color + '|' + (opts.outline || '') + '|' + (opts.shadow || '');
          let c = scache.get(key);
          if (!c) {
            if (scache.size > 400) scache.clear();
            c = document.createElement('canvas');
            c.width = Math.max(1, w + 2 * s); c.height = 9 * s + (opts.shadow ? s : 0);
            const g = c.getContext('2d');
            for (let i = 0; i < text.length; i++) if (text[i] !== ' ') g.drawImage(glyphImg(text[i], s, color, opts.outline, opts.shadow), i * 6 * s, 0);
            scache.set(key, c);
          }
          ctx.drawImage(c, ox - s, oy - s);
          ctx.fillStyle = color;
          return w;
        }
        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ') continue;
          ctx.drawImage(glyphImg(text[i], s, color, opts.outline, opts.shadow), ox + i * 6 * s - s, oy - s);
        }
        ctx.fillStyle = color;
        return w;
      }
      if (opts.outline) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
          font._raw(ctx, text, ox + dx * s, oy + dy * s, s, opts.outline);
        }
      }
      if (opts.shadow) font._raw(ctx, text, ox + s, oy + s, s, opts.shadow);
      font._raw(ctx, text, ox, oy, s, color);
      return w;
    },
    _raw(ctx, text, x, y, s, color) {
      ctx.fillStyle = color;
      for (let i = 0; i < text.length; i++) {
        const g = glyphFor(text[i]);
        const gx = x + i * 6 * s;
        for (let r = 0; r < 7; r++) {
          const row = g[r];
          for (let c = 0; c < 5; c++) if (row[c]) ctx.fillRect(gx + c * s, y + r * s, s, s);
        }
      }
    }
  };

  FF.font = font;
})(window.FF);
