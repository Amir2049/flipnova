// FLIPNOVA — original pixel-art sprites, drawn procedurally (no external image files).
(function (FF) {
  'use strict';
  const C = FF.COLORS;

  // ---------- Skins (cosmetic only — identical hitbox & speed) ----------
  // pixel overlay helper for built-in skins: [[colourKey, x, y, w, h], ...] -> 20 rows of 16
  function A(rects) {
    const r = Array.from({ length: 20 }, () => Array(16).fill('.'));
    for (const [ch, x, y, w, h] of rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (r[y + j] && x + i < 16) r[y + j][x + i] = ch;
    return r.map((a) => a.join(''));
  }
  // the pharaoh's striped head-cloth (gold and blue), framing the face
  const NEMES = (() => {
    const q = [];
    for (let y = 1; y <= 14; y++) {
      const c = y % 2 ? 'g' : 'b';
      if (y <= 4) q.push([c, Math.max(1, 5 - y), y, 16 - 2 * Math.max(1, 5 - y), 1]);
      else { q.push([c, 0, y, 3, 1]); q.push([c, 13, y, 3, 1]); }
    }
    q.push(['g', 2, 5, 12, 1], ['k', 3, 7, 1, 1], ['k', 12, 7, 1, 1], ['b', 7, 15, 2, 2], ['g', 7, 17, 2, 1]);
    return A(q);
  })();
  FF.SKINS = [
    { id: 'flippo', name: 'FLIPPO', body: '#ff5a3c', dark: '#6e1a10', shade: '#d23a22', light: '#ffb199', eye: '#ffffff', pupil: '#1a0b0b', cost: 0 },
    { id: 'neon', name: 'NEON', body: '#122440', dark: '#27d7ff', shade: '#0b182c', light: '#2d5590', eye: '#27d7ff', pupil: '#eafcff', glow: '#27d7ff', cost: 150 },
    { id: 'robo', name: 'ROBO', body: '#a9b4c6', dark: '#283040', shade: '#7b879a', light: '#e8eef7', eye: '#ffffff', pupil: '#ff3355', acc: 'antenna', cost: 250 },
    { id: 'cloud', name: 'CLOUD', body: '#f4f7ff', dark: '#4b5a88', shade: '#c5d2f0', light: '#ffffff', eye: '#ffffff', pupil: '#2a3350', acc: 'puff', cost: 300 },
    { id: 'candy', name: 'CANDY', body: '#ff7ac8', dark: '#701346', shade: '#de4f9d', light: '#ffd1ec', eye: '#ffffff', pupil: '#3a0a24', acc: 'stripes', cost: 400 },
    { id: 'cat', name: 'MEOWPO', body: '#ffb347', dark: '#5a2e0a', shade: '#e08a2a', light: '#ffe0b0', eye: '#ffffff', pupil: '#1d4a12', acc: 'ears', cost: 500 },
    { id: 'phoenix', name: 'PHOENIX', body: '#ff7a1a', dark: '#5a1500', shade: '#e04a10', light: '#ffd36b', eye: '#fff6c2', pupil: '#7a1a00', acc: 'crest', unlock: 'lvl8' },
    { id: 'shadow', name: 'SHADOW', body: '#1d1a33', dark: '#05040c', shade: '#131126', light: '#34305a', eye: '#b45cff', pupil: '#f3e6ff', glow: '#b45cff', unlock: 'shadow_runner' },
    { id: 'gold', name: 'GOLDEN', body: '#ffd23f', dark: '#6b4800', shade: '#e0a400', light: '#fff6c2', eye: '#ffffff', pupil: '#3a2600', acc: 'sparkle', unlock: 'master' },
    { id: 'slime', name: 'GLOOP', body: '#6be36b', dark: '#1d5a22', shade: '#3fb04a', light: '#c8ffc0', eye: '#ffffff', pupil: '#0d2a10', acc: 'slime', cost: 800 },
    { id: 'alien', name: 'ZORP', body: '#9be85a', dark: '#2a4a12', shade: '#6cbf35', light: '#e0ffc0', eye: '#111111', pupil: '#ffffff', acc: 'stalks', cost: 1200 },
    { id: 'ninja', name: 'SHINOBI', body: '#2a2d44', dark: '#0a0b14', shade: '#1c1e30', light: '#454a6e', eye: '#ffffff', pupil: '#111111', acc: 'ninja', unlock: 'stage8' },
    { id: 'ghost', name: 'BOO', body: '#eef2ff', dark: '#5b6694', shade: '#c9d1f5', light: '#ffffff', eye: '#20264a', pupil: '#20264a', acc: 'ghost', glow: '#b8f3ff', unlock: 'stage10' },
    { id: 'legend', name: 'LEGEND', body: '#2a1a5e', dark: '#0d0622', shade: '#1d1145', light: '#6a4fd0', eye: '#ffe066', pupil: '#1a0b00', acc: 'crown', rainbow: true, unlock: 'legendAll' },
    { id: 'emperor', name: 'AMIR ♔', body: '#15101f', dark: '#c9971a', shade: '#0c0914', light: '#3a2f55', eye: '#ffe066', pupil: '#ff3355', glow: '#ffd23f', acc: 'emperor', unlock: 'owner' },
    { id: 'hacker', name: 'Y0U55EF', body: '#0b120d', dark: '#0e5a2a', shade: '#060a07', light: '#1d3a26', eye: '#00ff66', pupil: '#eafff0', glow: '#00ff66', acc: 'hacker', unlock: 'code:ys' },
    { id: 'sorcerer', name: 'GHONEIM ∞', body: '#1b2140', dark: '#070915', shade: '#121731', light: '#3a4478', eye: '#7fe8ff', pupil: '#ffffff', glow: '#5ab8ff', acc: 'sorcerer', unlock: 'code:gh' },
    { id: 'nova', name: 'NOVA', body: '#1a1240', dark: '#07041a', shade: '#120c30', light: '#4a3aa0', eye: '#fff1b8', pupil: '#ff5ad1', glow: '#ff9a3c', acc: 'nova', unlock: 'soon' },
    { id: 'aurora', name: 'AURORA', body: '#7fe8ff', dark: '#14306a', shade: '#4ab8e0', light: '#e6fbff', eye: '#ffffff', pupil: '#1a2a6a', glow: '#b8f3ff', acc: 'sparkle', unlock: 'streak7', rarity: 'diamond' },
    { id: 'knight', name: 'SIR FLIP', body: '#b9c0d4', dark: '#2c3142', shade: '#868ea8', light: '#eef1fa', eye: '#ffffff', pupil: '#111111', acc: 'knight', unlock: 'stars30' },
    // ---- build 25: more to collect. A(...) paints pixels on top of the body ([colour, x, y, w, h]; body is x2-13, y4-15)
    { id: 'toast', name: 'TOASTY', body: '#e8b86a', dark: '#5a3410', shade: '#c98f3e', light: '#ffe0a8', eye: '#ffffff', pupil: '#3a1a00', art: A([['y', 6, 5, 4, 1]]), pal: { y: '#fff27a' }, cost: 200 },
    { id: 'minty', name: 'MINTY', body: '#7dffc4', dark: '#14583a', shade: '#45d496', light: '#d8fff0', eye: '#ffffff', pupil: '#0b2a1d', cost: 200 },
    { id: 'grape', name: 'GRAPEY', body: '#9b5cff', dark: '#2e0d6a', shade: '#7a3ae0', light: '#d8c2ff', eye: '#ffffff', pupil: '#1d0640', art: A([['g', 7, 2, 1, 2], ['l', 8, 2, 2, 1]]), pal: { g: '#6b4a1a', l: '#3fb04a' }, cost: 250 },
    { id: 'panda', name: 'BAMBOO', body: '#f4f4f4', dark: '#151515', shade: '#d0d0d8', light: '#ffffff', eye: '#ffffff', pupil: '#151515',
      art: A([['k', 2, 2, 3, 2], ['k', 11, 2, 3, 2], ['k', 3, 6, 4, 4], ['k', 9, 6, 4, 4], ['w', 4, 7, 2, 2], ['w', 10, 7, 2, 2], ['k', 5, 8, 1, 1], ['k', 10, 8, 1, 1], ['k', 7, 10, 2, 1]]), pal: { k: '#151515', w: '#ffffff' }, cost: 600 },
    { id: 'bee', name: 'BUZZ', body: '#ffd23f', dark: '#3a2600', shade: '#e0a400', light: '#fff6c2', eye: '#ffffff', pupil: '#1a1408',
      art: A([['k', 3, 11, 10, 1], ['k', 3, 13, 10, 1], ['k', 5, 1, 1, 3], ['k', 10, 1, 1, 3], ['k', 4, 0, 2, 1], ['k', 10, 0, 2, 1], ['w', 0, 6, 2, 3], ['w', 14, 6, 2, 3]]), pal: { k: '#1a1408', w: '#c8f0ff' }, cost: 900 },
    { id: 'pengu', name: 'PENGU', body: '#262b45', dark: '#0a0c18', shade: '#1a1e33', light: '#4a5280', eye: '#ffffff', pupil: '#0a0c18',
      art: A([['w', 4, 11, 8, 4], ['o', 7, 10, 2, 1], ['w', 4, 7, 2, 2], ['w', 10, 7, 2, 2], ['k', 5, 8, 1, 1], ['k', 10, 8, 1, 1]]), pal: { w: '#f4f7ff', o: '#ff9a1a', k: '#0a0c18' }, cost: 1000 },
    { id: 'pumpkin', name: 'PUMPKO', body: '#ff8a1a', dark: '#5a2200', shade: '#e0620e', light: '#ffc27a', eye: '#fff27a', pupil: '#3a1200',
      art: A([['s', 7, 1, 2, 3], ['g', 9, 2, 2, 1], ['r', 5, 5, 1, 2], ['r', 10, 5, 1, 2], ['r', 5, 11, 1, 4], ['r', 10, 11, 1, 4]]), pal: { s: '#6b4a1a', g: '#3fb04a', r: '#c4520e' }, cost: 1500 },
    { id: 'astro', name: 'ASTRO', body: '#eef1fa', dark: '#3a4060', shade: '#c0c6da', light: '#ffffff', eye: '#7fe8ff', pupil: '#7fe8ff',
      art: A([['v', 3, 6, 10, 5], ['w', 4, 7, 2, 1], ['e', 5, 8, 1, 1], ['e', 10, 8, 1, 1], ['k', 12, 1, 1, 3], ['r', 12, 0, 1, 1]]), pal: { v: '#1a2a5a', w: '#bfe8ff', e: '#7fe8ff', k: '#8a93a8', r: '#ff3355' }, cost: 2000 },
    { id: 'dino', name: 'REXY', body: '#5ad15a', dark: '#163a16', shade: '#3a9e3a', light: '#c8f5a0', eye: '#ffffff', pupil: '#102a10',
      art: A([['s', 3, 3, 2, 1], ['s', 4, 2, 1, 1], ['s', 7, 3, 2, 1], ['s', 8, 2, 1, 1], ['s', 11, 3, 2, 1], ['s', 12, 2, 1, 1], ['b', 5, 12, 6, 3]]), pal: { s: '#ff9a1a', b: '#c8f5a0' }, cost: 2500 },
    { id: 'lava', name: 'MAGMA', body: '#2a1a1a', dark: '#0a0505', shade: '#1d1010', light: '#4a2a22', eye: '#ffb000', pupil: '#3a0a00', glow: '#ff5a1a',
      art: A([['l', 3, 5, 2, 1], ['l', 4, 6, 1, 1], ['l', 10, 5, 1, 1], ['l', 11, 6, 2, 1], ['l', 3, 12, 3, 1], ['l', 5, 13, 1, 2], ['l', 9, 11, 1, 2], ['l', 10, 13, 3, 1], ['l', 7, 14, 1, 1]]), pal: { l: '#ff6a1a' },
      fx: { type: 'sparkle', c1: '#ffb000', c2: '#ff3b1a' }, cost: 6000, rarity: 'diamond' },
    { id: 'frost', name: 'FROSTY', body: '#9fe4ff', dark: '#1a4a7a', shade: '#6ac4ef', light: '#eafaff', eye: '#ffffff', pupil: '#1a3a6a', glow: '#b8f3ff',
      art: A([['i', 3, 3, 1, 1], ['i', 5, 2, 1, 2], ['i', 7, 3, 1, 1], ['i', 9, 2, 1, 2], ['i', 11, 3, 1, 1], ['w', 3, 12, 1, 1], ['w', 11, 11, 1, 1], ['w', 6, 13, 1, 1]]), pal: { i: '#e6fbff', w: '#ffffff' },
      fx: { type: 'sparkle', c1: '#ffffff', c2: '#b8f3ff' }, cost: 6000, rarity: 'diamond' },
    { id: 'void', name: 'VOID', body: '#0a0814', dark: '#000000', shade: '#05040a', light: '#1d1838', eye: '#d6b8ff', pupil: '#0a0814', glow: '#b45cff',
      art: A([['s', 3, 5, 1, 1], ['s', 11, 12, 1, 1], ['s', 4, 13, 1, 1], ['p', 10, 5, 1, 1], ['p', 7, 12, 1, 1]]), pal: { s: '#ffffff', p: '#27d7ff' },
      fx: { type: 'orbs', c1: '#b45cff', c2: '#27d7ff' }, cost: 12000, rarity: 'diamond' },
    { id: 'storm', name: 'STORM', body: '#5a6688', dark: '#1a1f33', shade: '#434d6c', light: '#8a96bc', eye: '#ffe066', pupil: '#1a1f33', acc: 'puff',
      art: A([['y', 9, 10, 1, 1], ['y', 8, 11, 2, 1], ['y', 7, 12, 3, 1], ['y', 8, 13, 1, 1], ['y', 7, 14, 1, 1]]), pal: { y: '#ffe066' },
      fx: { type: 'glitch', c1: '#ffe066', c2: '#27d7ff' }, unlock: 'runs300', rarity: 'diamond' },
    { id: 'pharaoh', name: 'PHARAOH', body: '#e0a85a', dark: '#3a2400', shade: '#c08a3e', light: '#ffd9a0', eye: '#ffffff', pupil: '#1a0f00', glow: '#ffd23f', art: NEMES,
      pal: { g: '#ffd23f', b: '#1d3fae', k: '#1a0f00' }, fx: { type: 'sparkle', c1: '#ffd23f', c2: '#ffffff' }, cost: 25000, rarity: 'icon' },
    { id: 'cosmo', name: 'COSMO', body: '#151040', dark: '#05031a', shade: '#0d0a2e', light: '#3a2f8a', eye: '#ffffff', pupil: '#ff5ad1', rainbow: true,
      art: A([['s', 3, 5, 1, 1], ['s', 11, 6, 1, 1], ['s', 4, 12, 1, 1], ['s', 10, 13, 1, 1], ['p', 7, 11, 2, 1]]), pal: { s: '#fff6c2', p: '#ff5ad1' },
      fx: { type: 'orbs', c1: '#ffd23f', c2: '#ff5ad1' }, unlock: 'runs1000', rarity: 'icon' }
  ];
  // ⚔️ build 36: the weekly boss reward — INFINITY VOID (an original star sorcerer: swept silver crest, star-blue eyes,
  // a cosmic aura that grows with your combo). Cosmetic only, like every skin.
  FF.SKINS.push({ id: 'ivoid', name: 'INFINITY VOID', body: '#141a3a', dark: '#04061a', shade: '#0c1130', light: '#2e3a7a', eye: '#8fd8ff', pupil: '#ffffff', acc: 'ivoid', unlock: 'boss', rarity: 'icon' });
  // 🎁 build 39: four premium ICON skins, each unlocked only by its own gift code (only hashes live in ui.js). All original
  // characters: a lucky gambler, a calm blood-orb warden, a hooded wind ninja and a player-sized Crimson Tyrant.
  // Each one has an idle loop, run frames, its own flip face, an aura that grows with the combo and a matching trail.
  FF.PREMIUM = {
    jackpot: { key: 'jp', trail: 'jackpot', col: '#ffd23f', col2: '#3fdc7a', bg: '#03140a', ar: 'فيفر جاكبوت' },
    bwarden: { key: 'bw', trail: 'bwarden', col: '#ff2a3a', col2: '#ffd0d8', bg: '#140205', ar: 'مدار الدم' },
    wshinobi: { key: 'ws', trail: 'wshinobi', col: '#ff8a1a', col2: '#7ad8ff', bg: '#0a0614', ar: 'العاصفة البرتقالية' },
    ctyrant: { key: 'ct', trail: 'ctyrant', col: '#ff2a3a', col2: '#ff8ab0', bg: '#120306', ar: 'الملك القرمزي' }
  };
  // build 41: the owner's restyle. The ids (and the save.codes keys) stay the same, so anyone who redeemed keeps them.
  // 'art' paints the hair (rows 1-6) and the outfit (rows 12-15) over the body; the face and every live effect are code.
  FF.SKINS.push(
    { id: 'jackpot', name: 'FEVER JACKPOT', body: '#f2c9a0', dark: '#3a2a1e', shade: '#d9a87e', light: '#ffe2c4', eye: '#0fbf7a', pupil: '#7dffc8', acc: 'jackpot', unlock: 'code:jp', rarity: 'icon', prem: true,
      art: [
      '................',
      '....wwwwwww.....',
      '..wwwwwwwwwww...',
      '..wwggwwwwggww..',
      '.wwwwwwwwwwwwww.',
      '..ww........ww..',
      '..w..........w..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..jjjjwwwwjjjj..',
      '..jjjjwyywjjjj..',
      '..hjjjjwwjjjjh..',
      '..hhjjjjjjjjhh..',
      '................',
      '................',
      '................',
      '................'
    ], pal: {'w': '#9b4dff', 'g': '#6a2bbf', 'j': '#1f8a4a', 'h': '#14562f', 'y': '#ffd23f'} },
    { id: 'bwarden', name: 'BLOOD ORBIT', body: '#e8d2c0', dark: '#140a0c', shade: '#c9ad98', light: '#f7e6d8', eye: '#ff2a3a', pupil: '#2a0a0e', acc: 'bwarden', unlock: 'code:bw', rarity: 'icon', prem: true,
      art: [
      '................',
      '...kk......kk...',
      '..kkkk....kkkk..',
      '..kkkkkkkkkkkk..',
      '.kkkkkkkkkkkkkk.',
      '..kk.kkkkkk.kk..',
      '..k..........k..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..mmmmmmmmmmmm..',
      '..mmmmrmmrmmmm..',
      '..dmmmmmmmmmmd..',
      '..ddmmmmmmmmdd..',
      '................',
      '................',
      '................',
      '................'
    ], pal: {'k': '#141018', 'd': '#2a2230', 'r': '#b0102a', 'm': '#3a1418'} },
    { id: 'wshinobi', name: 'ORANGE STORM', body: '#f5c79a', dark: '#2a1a10', shade: '#dba476', light: '#ffe0bd', eye: '#ffffff', pupil: '#2a8cff', acc: 'wshinobi', unlock: 'code:ws', rarity: 'icon', prem: true,
      art: [
      '..y...y...y...y.',
      '..yy.yyy.yyy.yy.',
      '..yyyyyyyyyyyy..',
      '.yyuyyyyyyyyuyy.',
      'yyyyyyyyyyyyyyyy',
      '..yy........yy..',
      '..y..........y..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..kkkooooooookk.',
      '..kkooooooookk..',
      '..ooooobboooo...',
      '..oooooooooooo..',
      '................',
      '................',
      '................',
      '................'
    ], pal: {'y': '#ffd21a', 'u': '#e0a800', 'o': '#ff7a12', 'k': '#151520', 'b': '#2a6cff'} },
    { id: 'ctyrant', name: 'CRIMSON KING', body: '#f0c4b0', dark: '#1a0608', shade: '#d49c88', light: '#ffdccc', eye: '#ff1a1a', pupil: '#200000', acc: 'ctyrant', unlock: 'code:ct', rarity: 'icon', prem: true,
      art: [
      '...p..p..p..p...',
      '..pp.ppp.pp.pp..',
      '..pppppppppppp..',
      '.pqppppppppppqp.',
      'pppppppppppppppp',
      '..pp........pp..',
      '..p..........p..',
      '................',
      '................',
      '................',
      'ss............ss',
      'tss..........sst',
      '..rrrrrrrrrrrr..',
      '..xxxxxxxxxxxx..',
      '..rrrrrrrrrrrr..',
      '..rrrrrrrrrrrr..',
      '................',
      '................',
      '................',
      '................'
    ], pal: {'p': '#ff8ab0', 'q': '#e05a8a', 'r': '#1a0a10', 's': '#f0c4b0', 't': '#d49c88', 'x': '#5a0a1a'} }
  );
  FF.skinById = (id) => FF.SKINS.find((s) => s.id === id) || FF.SKINS[0];

  // ✦ earned only (never sold): the two hardest things in Endless
  FF.SKINS.push(
    { id: 'nerveking', name: 'NERVE KING', body: '#2a0c22', dark: '#08020a', shade: '#1c0818', light: '#5a1e4a', eye: '#ffb000', pupil: '#2a0c22', glow: '#ff3cf2', acc: 'crown', unlock: 'nerve40', rarity: 'icon' },
    { id: 'infinite', name: 'INFINITE', body: '#0d1030', dark: '#02030c', shade: '#080a20', light: '#2a2f70', eye: '#e6c8ff', pupil: '#b45cff', glow: '#b45cff', acc: 'sparkle', unlock: 'secs180', rarity: 'icon' }
  );

  // ---------- rarity (how rare a skin / trail is — the skins screen groups them and makes the rare ones shine)
  // DIRT (common) < RARE (blue) < DIAMOND (shines) < ICON (legendary, shines the most)
  FF.RARITIES = ['icon', 'diamond', 'rare', 'dirt'];
  const ICON = { legend: 1, emperor: 1, nova: 1, hacker: 1, sorcerer: 1, matrix: 1, infinity: 1, royal: 1 };
  const DIAMOND = { gold: 1, shadow: 1, phoenix: 1, ghost: 1, ninja: 1, knight: 1, rainbow: 1 };
  FF.rarityOf = function (it) {
    if (it.rarity) return it.rarity;
    if (ICON[it.id] || it.gift || /^code:/.test(it.unlock || '')) return 'icon'; // the friends' gift skins are one of a kind
    if (DIAMOND[it.id]) return 'diamond';
    if (it.unlock || (it.cost || 0) >= 500) return 'rare';
    return 'dirt';
  };

  FF.TRAILS = [
    { id: 'none', name: 'NONE', cost: 0 },
    { id: 'pixel', name: 'PIXEL', cost: 0 },
    { id: 'spark', name: 'SPARK', unlock: 'perfect_rhythm' },
    { id: 'rainbow', name: 'PRISM', unlock: 'frenzy' },
    { id: 'echo', name: 'ECHO', unlock: 'clean_line' },
    { id: 'comet', name: 'COMET', unlock: 'lvl5' },
    { id: 'legend', name: 'LEGEND', unlock: 'legend' },
    { id: 'matrix', name: 'MATRIX', unlock: 'code:ys' },
    { id: 'infinity', name: 'INFINITY', unlock: 'code:gh' },
    { id: 'royal', name: 'ROYAL', unlock: 'owner' },
    { id: 'ivoid', name: 'STARDUST', unlock: 'boss', rarity: 'icon' },
    // 🎁 build 39: the premium skins' own trails (same gift code as the skin; hidden from the list until redeemed)
    { id: 'jackpot', name: 'LUCKY 777', unlock: 'code:jp', rarity: 'icon', prem: true, colors: ['#ffd23f', '#3fdc7a', '#ffffff', '#1f8a4a'] },
    { id: 'bwarden', name: 'BLOOD TRAIL', unlock: 'code:bw', rarity: 'icon', prem: true, colors: ['#ff1a2e', '#8a0016', '#ff5a6e', '#3a0008'] },
    { id: 'wshinobi', name: 'WIND SPIRAL', unlock: 'code:ws', rarity: 'icon', prem: true, colors: ['#7ad8ff', '#2a8cff', '#ffffff', '#ff7a12'] },
    { id: 'ctyrant', name: 'CURSED FLAME', unlock: 'code:ct', rarity: 'icon', prem: true, colors: ['#ff2a3a', '#ff8ab0', '#ffd27a', '#5a0a1a'] }
  ];

  // 🗓 build 35: weekly rewards (cosmetic only). Each week's theme (FF.weekTheme) has a trail for reaching stage 3,
  // a character for stage 6 and its shiny version for stage 10 — only that week, back again 5 weeks later.
  FF.WEEK_GEAR = {
    lowgrav: { name: 'FEATHER', ar: 'ريشة', trail: ['#e6fbff', '#b8f3ff', '#7fe8ff'], body: '#dff6ff', dark: '#2a5a8a', shade: '#a8d8f0', light: '#ffffff', eye: '#ffffff', pupil: '#1a3a6a', glow: '#b8f3ff' },
    dark: { name: 'ECLIPSE', ar: 'كسوف', trail: ['#b45cff', '#55248f', '#e6c8ff', '#1a1240'], body: '#140f2a', dark: '#000000', shade: '#0b0818', light: '#3a2a6a', eye: '#ffe066', pupil: '#140f2a', glow: '#b45cff' },
    burst: { name: 'OVERCLOCK', ar: 'أوفركلوك', trail: ['#ffffff', '#ffe066', '#ff9a3c', '#ff3355'], body: '#ff9a3c', dark: '#5a1a00', shade: '#e0701a', light: '#ffe0b0', eye: '#ffffff', pupil: '#5a1a00', glow: '#ffe066' },
    mirror: { name: 'MIRAGE', ar: 'سراب', trail: ['#27d7ff', '#ffffff', '#ff5ad1'], body: '#c9d1f5', dark: '#3a2a6a', shade: '#9aa6dc', light: '#ffffff', eye: '#27d7ff', pupil: '#ff5ad1', glow: '#ff5ad1' },
    sawrain: { name: 'BUZZSAW', ar: 'منشار', trail: ['#ff3355', '#ffd0d8', '#86102b'], style: 'rain', body: '#b9c0d4', dark: '#3a0a14', shade: '#868ea8', light: '#ffd0d8', eye: '#ffffff', pupil: '#ff3355', glow: '#ff3355' }
  };
  for (const th in FF.WEEK_GEAR) {
    const G = FF.WEEK_GEAR[th];
    FF.TRAILS.push({ id: 't_wk_' + th, name: G.name, unlock: 'week:' + th + ':3', colors: G.trail, style: G.style || 'dots', rarity: 'rare', week: th });
    const sk = { body: G.body, dark: G.dark, shade: G.shade, light: G.light, eye: G.eye, pupil: G.pupil };
    FF.SKINS.push(Object.assign({ id: 'wk_' + th, name: G.name, unlock: 'week:' + th + ':6', rarity: 'diamond', week: th }, sk));
    FF.SKINS.push(Object.assign({ id: 'wk_' + th + '_x', name: G.name + ' ✦', unlock: 'week:' + th + ':10', rarity: 'icon', week: th, glow: G.glow, acc: 'sparkle' }, sk));
  }
  FF.weekGear = (th) => ({ trail: FF.trailById('t_wk_' + th), skin: FF.skinById('wk_' + th), shiny: FF.skinById('wk_' + th + '_x') });

  const cache = {};

  // ---------- gift skins & trails that arrive from the server (tools/gift-maker.html)
  // Everything is validated: only colours, a small pixel overlay and a few known effects — never code.
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const clean = (s, n) => String(s || '').replace(/[<>&"]/g, '').slice(0, n);
  FF.FX_TYPES = ['none', 'glow', 'orbs', 'rain', 'sparkle', 'glitch', 'rainbow'];
  FF.registerSkin = function (d) {
    if (!d || !/^g_[a-z0-9_]{2,24}$/.test(d.id)) return null;
    const s = { id: d.id, name: clean(d.name, 16) || 'GIFT', unlock: 'code:' + d.id, gift: true };
    for (const k of ['body', 'dark', 'shade', 'light', 'eye', 'pupil']) { if (!HEX.test(d[k] || '')) return null; s[k] = d[k]; }
    if (HEX.test(d.glow || '')) s.glow = d.glow;
    if (Array.isArray(d.art) && d.pal && typeof d.pal === 'object') {
      const pal = {};
      for (const ch in d.pal) if (/^[a-z]$/.test(ch) && HEX.test(d.pal[ch])) pal[ch] = d.pal[ch];
      s.art = d.art.slice(0, 20).map((row) => String(row).slice(0, 16).replace(/[^a-z._]/g, '.'));
      s.pal = pal;
    }
    const fx = d.fx || {};
    if (FF.FX_TYPES.includes(fx.type)) s.fx = { type: fx.type, c1: HEX.test(fx.c1 || '') ? fx.c1 : s.eye, c2: HEX.test(fx.c2 || '') ? fx.c2 : s.light };
    if (s.fx && s.fx.type === 'rainbow') s.rainbow = true;
    const i = FF.SKINS.findIndex((x) => x.id === s.id);
    if (i >= 0) FF.SKINS[i] = s; else FF.SKINS.push(s);
    for (const k in cache) if (k.indexOf(s.id + '|') === 0) delete cache[k];
    return s;
  };
  FF.registerTrail = function (d) {
    if (!d || !/^t_[a-z0-9_]{2,24}$/.test(d.id) || !Array.isArray(d.colors)) return null;
    const colors = d.colors.filter((c) => HEX.test(c)).slice(0, 8);
    if (!colors.length) return null;
    const t = { id: d.id, name: clean(d.name, 16) || 'GIFT', unlock: 'code:' + d.id, colors, style: d.style === 'rain' ? 'rain' : 'dots', gift: true };
    const i = FF.TRAILS.findIndex((x) => x.id === t.id);
    if (i >= 0) FF.TRAILS[i] = t; else FF.TRAILS.push(t);
    return t;
  };
  FF.trailById = (id) => FF.TRAILS.find((t) => t.id === id);

  function px(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  }

  // Body sits at (2,4)-(14,16) inside a 16x20 buffer (room for accessories & feet).
  function buildFlippo(skin, face, foot) {
    const cv = FF.makeCanvas(16, 20);
    const g = cv.getContext('2d');
    const bx = 2, by = 4;

    if (skin.glow) {
      g.fillStyle = FF.rgba(skin.glow, 0.28);
      g.fillRect(bx - 1, by, 14, 12);
      g.fillRect(bx, by - 1, 12, 14);
    }
    if (skin.acc === 'puff') {
      px(g, bx + 1, by - 2, 4, 1, skin.dark);
      px(g, bx + 7, by - 2, 4, 1, skin.dark);
      px(g, bx + 1, by - 1, 4, 2, skin.body);
      px(g, bx + 7, by - 1, 4, 2, skin.body);
      px(g, bx, by - 1, 1, 1, skin.dark);
      px(g, bx + 11, by - 1, 1, 1, skin.dark);
    }
    if (skin.acc === 'ears') {
      px(g, bx + 1, by - 1, 3, 1, skin.dark);
      px(g, bx + 1, by - 2, 2, 1, skin.dark);
      px(g, bx + 1, by - 3, 1, 1, skin.dark);
      px(g, bx + 8, by - 1, 3, 1, skin.dark);
      px(g, bx + 9, by - 2, 2, 1, skin.dark);
      px(g, bx + 10, by - 3, 1, 1, skin.dark);
      px(g, bx + 2, by - 1, 1, 1, '#ff9aa8');
      px(g, bx + 9, by - 1, 1, 1, '#ff9aa8');
    }
    if (skin.acc === 'crown') {
      // a classic crown: three pointed tips, gems only on the band
      px(g, bx + 2, by - 2, 8, 3, '#ffd23f');
      px(g, bx + 2, by - 3, 2, 1, '#ffd23f'); px(g, bx + 4, by - 3, 4, 1, '#ffd23f'); px(g, bx + 8, by - 3, 2, 1, '#ffd23f');
      px(g, bx + 2, by - 4, 1, 1, '#ffd23f'); px(g, bx + 5, by - 4, 2, 1, '#ffd23f'); px(g, bx + 9, by - 4, 1, 1, '#ffd23f');
      px(g, bx + 3, by - 1, 1, 1, '#ff3355'); px(g, bx + 6, by - 1, 1, 1, '#27d7ff'); px(g, bx + 8, by - 1, 1, 1, '#7dffb2');
    }
    if (skin.acc === 'crest') {
      px(g, bx + 4, by - 2, 1, 2, '#ffd36b');
      px(g, bx + 5, by - 4, 2, 4, '#ff3b1a');
      px(g, bx + 6, by - 5, 1, 1, '#ffd36b');
      px(g, bx + 7, by - 3, 1, 3, '#ffb000');
    }
    if (skin.acc === 'emperor') {
      // royal cape flowing behind, and a tall jewelled crown
      px(g, bx - 2, by + 3, 3, 10, '#8a0f24'); px(g, bx - 1, by + 2, 2, 1, '#b0172f'); px(g, bx - 2, by + 12, 2, 2, '#5a0818');
      // wide crown with five pointed tips (no straight bars), jewels only on the band
      px(g, bx + 1, by - 3, 10, 3, '#ffd23f'); px(g, bx + 1, by - 1, 10, 1, '#c9971a');
      for (const [tx, h] of [[1, 2], [3, 3], [5, 4], [8, 3], [10, 2]]) {
        for (let k = 1; k <= h; k++) px(g, bx + tx - (k > 1 && tx > 1 && tx < 10 ? 1 : 0), by - 3 - k, k > 1 && tx > 1 && tx < 10 ? 2 + (h - k === 0 ? -1 : 0) : 1, 1, '#ffd23f');
      }
      px(g, bx + 5, by - 7, 1, 1, '#fff6c2');
      px(g, bx + 2, by - 2, 1, 1, '#ff3355'); px(g, bx + 5, by - 2, 2, 1, '#27d7ff'); px(g, bx + 9, by - 2, 1, 1, '#7dffb2');
    }
    if (skin.acc === 'sorcerer') {
      // messy white hair sticking up
      const W = '#f4f7ff', S = '#c9d3f0';
      px(g, bx, by - 1, 12, 2, W);
      px(g, bx + 1, by - 3, 2, 2, W); px(g, bx + 4, by - 4, 2, 3, W); px(g, bx + 7, by - 3, 2, 2, W); px(g, bx + 9, by - 4, 2, 3, W);
      px(g, bx - 1, by, 2, 2, W); px(g, bx + 11, by - 1, 2, 2, W);
      px(g, bx + 5, by - 4, 1, 1, S); px(g, bx + 10, by - 4, 1, 1, S); px(g, bx + 2, by, 8, 1, S);
    }
    if (skin.acc === 'ivoid') {
      // spiky silver hair swept back by the wind (he runs to the right): separate strands, light on top, shade below
      const S1 = '#f6f9ff', S2 = '#c8d2ea', S3 = '#7f8cb8';
      px(g, bx, by - 1, 12, 2, S2); px(g, bx + 2, by - 1, 9, 1, S1);
      for (const [rx, len, c] of [[11, 4, S1], [9, 6, S1], [7, 5, S2], [5, 6, S1], [3, 4, S2], [1, 3, S3]]) {
        for (let k = 0; k < len; k++) px(g, bx + rx - Math.round(k * 0.9), by - 1 - k, k < len - 1 ? 2 : 1, 1, k === len - 1 ? '#ffffff' : c);
      }
      px(g, bx - 2, by, 3, 1, S2); px(g, bx - 3, by + 1, 2, 1, S3); px(g, bx - 1, by + 2, 2, 2, S3);
    }
    if (skin.acc === 'hacker') {
      // pointed hood peaks
      px(g, bx, by - 2, 3, 2, '#0b120d'); px(g, bx, by - 3, 1, 1, '#0b120d');
      px(g, bx + 9, by - 2, 3, 2, '#0b120d'); px(g, bx + 11, by - 3, 1, 1, '#0b120d');
      px(g, bx, by - 3, 1, 1, '#00ff66'); px(g, bx + 11, by - 3, 1, 1, '#00ff66');
      px(g, bx + 1, by - 2, 1, 1, '#1d3a26'); px(g, bx + 10, by - 2, 1, 1, '#1d3a26');
    }
    if (skin.acc === 'nova') {
      // solar flares licking up from the head (an exploding star)
      px(g, bx + 2, by - 2, 1, 2, '#ff5ad1'); px(g, bx + 4, by - 3, 1, 3, '#ff9a3c'); px(g, bx + 6, by - 4, 1, 4, '#ffd23f');
      px(g, bx + 8, by - 3, 1, 3, '#ff9a3c'); px(g, bx + 10, by - 2, 1, 2, '#ff5ad1'); px(g, bx + 6, by - 5, 1, 1, '#fff6c2');
    }
    if (skin.acc === 'antenna') {
      px(g, bx + 6, by - 3, 1, 3, skin.dark);
      px(g, bx + 5, by - 4, 3, 1, skin.dark);
      px(g, bx + 6, by - 4, 1, 1, '#ff3355');
    }

    // outline + body
    px(g, bx, by, 12, 12, skin.dark);
    g.clearRect(bx, by, 1, 1);
    g.clearRect(bx + 11, by, 1, 1);
    g.clearRect(bx, by + 11, 1, 1);
    g.clearRect(bx + 11, by + 11, 1, 1);
    px(g, bx + 1, by + 1, 10, 10, skin.body);
    px(g, bx + 1, by + 9, 10, 2, skin.shade);
    px(g, bx + 10, by + 1, 1, 10, skin.shade);
    px(g, bx + 2, by + 2, 3, 1, skin.light);
    px(g, bx + 2, by + 3, 1, 2, skin.light);

    if (skin.acc === 'stripes') {
      for (let iy = 1; iy <= 10; iy++) {
        for (let ix = 1; ix <= 10; ix++) {
          if ((ix + iy) % 4 === 0) px(g, bx + ix, by + iy, 1, 1, '#ffd1ec');
        }
      }
    }
    if (skin.acc === 'antenna') {
      px(g, bx + 1, by + 6, 1, 1, skin.light);
      px(g, bx + 10, by + 6, 1, 1, skin.light);
    }

    const ex1 = bx + 2, ex2 = bx + 7, ey = by + 3;
    const D = skin.dark === '#27d7ff' ? '#06101e' : skin.dark;
    const eye = skin.eye, pup = skin.pupil;

    if (face === 'run' || face === 'idle') {
      for (const ex of [ex1, ex2]) {
        px(g, ex, ey, 3, 3, eye);
        px(g, ex + 1, ey + 1, 2, 2, pup);
      }
      px(g, bx + 4, by + 8, 1, 1, D);
      px(g, bx + 5, by + 9, 2, 1, D);
      px(g, bx + 7, by + 8, 1, 1, D);
    } else if (face === 'blink') {
      for (const ex of [ex1, ex2]) px(g, ex, ey + 2, 3, 1, D);
      px(g, bx + 4, by + 8, 1, 1, D);
      px(g, bx + 5, by + 9, 2, 1, D);
      px(g, bx + 7, by + 8, 1, 1, D);
    } else if (face === 'flip') {
      for (const ex of [ex1, ex2]) {
        px(g, ex, ey - 1, 3, 4, eye);
        px(g, ex + 1, ey + 1, 1, 1, pup);
      }
      px(g, bx + 5, by + 8, 2, 2, D);
    } else if (face === 'focus') {
      for (const ex of [ex1, ex2]) {
        px(g, ex, ey + 1, 3, 2, eye);
        px(g, ex + 1, ey + 1, 2, 2, pup);
        px(g, ex, ey, 3, 1, D);
      }
      px(g, ex1, ey - 1, 1, 1, D);
      px(g, ex2 + 2, ey - 1, 1, 1, D);
      px(g, bx + 4, by + 9, 4, 1, D);
    } else if (face === 'joy') {
      for (const ex of [ex1, ex2]) {
        px(g, ex, ey + 2, 1, 1, D);
        px(g, ex + 1, ey + 1, 1, 1, D);
        px(g, ex + 2, ey + 2, 1, 1, D);
      }
      px(g, bx + 4, by + 7, 4, 2, D);
      px(g, bx + 5, by + 8, 2, 1, '#ff7a9a');
      px(g, bx + 2, by + 6, 1, 1, '#ff9aa8');
      px(g, bx + 9, by + 6, 1, 1, '#ff9aa8');
    } else if (face === 'dead') {
      for (const ex of [ex1, ex2]) {
        px(g, ex, ey, 1, 1, D);
        px(g, ex + 2, ey, 1, 1, D);
        px(g, ex + 1, ey + 1, 1, 1, D);
        px(g, ex, ey + 2, 1, 1, D);
        px(g, ex + 2, ey + 2, 1, 1, D);
      }
      px(g, bx + 3, by + 9, 1, 1, D);
      px(g, bx + 4, by + 8, 1, 1, D);
      px(g, bx + 5, by + 9, 1, 1, D);
      px(g, bx + 6, by + 8, 1, 1, D);
      px(g, bx + 7, by + 9, 1, 1, D);
      px(g, bx + 8, by + 8, 1, 1, D);
    }

    if (skin.acc === 'ears') {
      px(g, bx - 1, by + 7, 2, 1, skin.dark);
      px(g, bx + 11, by + 7, 2, 1, skin.dark);
    }
    // shape-changing accessories drawn over the face
    if (skin.acc === 'slime') {
      g.clearRect(bx, by, 2, 1); g.clearRect(bx + 10, by, 2, 1); g.clearRect(bx, by + 1, 1, 1); g.clearRect(bx + 11, by + 1, 1, 1);
      px(g, bx + 2, by + 12, 2, 2, skin.shade); px(g, bx + 7, by + 12, 1, 3, skin.shade); px(g, bx + 9, by + 12, 2, 1, skin.shade);
      px(g, bx + 3, by + 1, 2, 1, '#ffffff');
    } else if (skin.acc === 'stalks') {
      px(g, bx + 2, by - 1, 1, 1, skin.dark); px(g, bx + 9, by - 1, 1, 1, skin.dark);
      px(g, bx + 1, by - 4, 3, 3, '#ffffff'); px(g, bx + 8, by - 4, 3, 3, '#ffffff');
      px(g, bx + 2, by - 3, 1, 1, '#111111'); px(g, bx + 9, by - 3, 1, 1, '#111111');
    } else if (skin.acc === 'ninja') {
      px(g, bx + 1, by + 1, 10, 2, '#e8233a');
      px(g, bx - 2, by + 2, 3, 1, '#e8233a'); px(g, bx - 4, by + 3, 3, 1, '#e8233a'); px(g, bx - 3, by + 1, 1, 1, '#e8233a');
      px(g, bx + 1, by + 7, 10, 3, skin.dark);
    } else if (skin.acc === 'ghost') {
      g.clearRect(bx, by + 10, 12, 2);
      for (let i = 0; i < 12; i += 3) px(g, bx + i, by + 10, 2, 1, skin.body), px(g, bx + i, by + 11, 1, 1, skin.shade);
      px(g, bx + 2, by + 7, 2, 1, '#ff9ab0'); px(g, bx + 8, by + 7, 2, 1, '#ff9ab0');
    } else if (skin.acc === 'emperor') {
      // golden trim and a royal sash across the chest
      px(g, bx + 1, by + 1, 10, 1, '#c9971a');
      px(g, bx + 1, by + 9, 10, 1, '#ffd23f');
      for (let i = 0; i < 4; i++) px(g, bx + 3 + i * 2, by + 10 - (i & 1), 1, 1, '#ff3355');
    } else if (skin.acc === 'sorcerer') {
      // white fringe over the forehead, then the blindfold — lifted only when he's having fun
      px(g, bx + 1, by + 1, 10, 1, '#f4f7ff'); px(g, bx + 2, by + 2, 2, 1, '#f4f7ff'); px(g, bx + 7, by + 2, 2, 1, '#f4f7ff');
      const lifted = face === 'joy' || face === 'focus' || face === 'flip';
      if (face === 'dead') px(g, bx, by + 3, 12, 3, '#05060d');
      else if (lifted) {
        px(g, bx, by + 2, 12, 1, '#05060d');
        for (const ex of [bx + 2, bx + 7]) { px(g, ex, by + 3, 3, 3, '#7fe8ff'); px(g, ex + 1, by + 4, 1, 1, '#ffffff'); px(g, ex, by + 3, 3, 1, '#2a8aff'); }
      } else {
        px(g, bx, by + 3, 12, 3, '#05060d');
        px(g, bx + 1, by + 4, 10, 1, '#1a1d2e');
      }
      // high collar
      px(g, bx + 1, by + 9, 10, 2, '#0d1026'); px(g, bx + 5, by + 9, 2, 1, '#3a4478');
    } else if (skin.acc === 'ivoid') {
      // a silver fringe falling to one side, star-blue glowing eyes with a star glint, a high night collar
      px(g, bx + 1, by + 1, 10, 1, '#e6ecff'); px(g, bx + 6, by + 2, 4, 1, '#c8d2ea'); px(g, bx + 8, by + 3, 2, 1, '#c8d2ea');
      if (face === 'dead') { px(g, bx + 2, by + 4, 3, 1, '#8fd8ff'); px(g, bx + 7, by + 4, 3, 1, '#8fd8ff'); }
      else if (face === 'blink') { px(g, bx + 2, by + 5, 3, 1, '#8fd8ff'); px(g, bx + 7, by + 5, 3, 1, '#8fd8ff'); }
      else for (const ex of [bx + 2, bx + 7]) { px(g, ex, by + 3, 3, 3, '#2a6aff'); px(g, ex, by + 4, 3, 2, '#8fd8ff'); px(g, ex + 1, by + 4, 1, 1, '#ffffff'); px(g, ex + 2, by + 3, 1, 1, '#ffffff'); }
      px(g, bx + 1, by + 9, 10, 2, '#0a0e28'); px(g, bx + 5, by + 9, 2, 1, '#8fd8ff'); px(g, bx + 2, by + 10, 1, 1, '#ffffff'); px(g, bx + 9, by + 10, 1, 1, '#b8a6ff');
    } else if (skin.acc === 'hacker') {
      // dark face inside the hood, a glowing visor and 1s and 0s on the hoodie
      px(g, bx + 2, by + 2, 8, 6, '#020403');
      px(g, bx + 1, by + 8, 10, 1, '#0b120d'); // no mouth or blush showing under the hood
      px(g, bx + 1, by + 6, 1, 1, '#0b120d'); px(g, bx + 10, by + 6, 1, 1, '#0b120d');
      px(g, bx + 1, by + 1, 10, 1, '#123a20');
      if (face === 'dead') { px(g, bx + 2, by + 4, 8, 1, '#ff3355'); }
      else {
        px(g, bx + 2, by + 3, 8, 2, '#00ff66');
        px(g, bx + 2, by + 3, 8, 1, '#b8ffd2');
        px(g, bx + 5, by + 3, 2, 2, '#020403');
        if (face === 'joy' || face === 'focus') px(g, bx + 3, by + 6, 6, 1, '#00ff66');
        else px(g, bx + 4, by + 6, 4, 1, '#0f6a30');
      }
      px(g, bx + 2, by + 9, 1, 2, '#00ff66'); px(g, bx + 4, by + 9, 2, 2, '#0f6a30'); px(g, bx + 4, by + 9, 1, 2, '#00ff66');
      px(g, bx + 7, by + 9, 1, 2, '#00ff66'); px(g, bx + 9, by + 9, 1, 1, '#0f6a30');
    } else if (skin.acc === 'nova') {
      // a little galaxy on the body: specks of starlight and a warm core glow
      px(g, bx + 1, by + 1, 10, 1, '#2a1f66');
      px(g, bx + 2, by + 2, 1, 1, '#ffffff'); px(g, bx + 10, by + 2, 1, 1, '#ffd23f'); px(g, bx + 1, by + 9, 1, 1, '#fff6c2');
      px(g, bx + 9, by + 10, 1, 1, '#ff9a3c'); px(g, bx + 5, by + 10, 2, 1, '#ff5ad1'); px(g, bx + 3, by + 10, 1, 1, '#8a7dff');
    } else if (skin.acc === 'knight') {
      px(g, bx + 1, by + 3, 10, 3, skin.dark);
      if (face !== 'dead') { px(g, bx + 3, by + 4, 2, 1, '#ffe066'); px(g, bx + 7, by + 4, 2, 1, '#ffe066'); }
      px(g, bx + 5, by - 3, 2, 3, '#e8233a'); px(g, bx + 4, by - 4, 3, 1, '#e8233a'); px(g, bx + 3, by - 2, 1, 2, '#b01a2a');
      px(g, bx + 5, by + 6, 2, 4, skin.shade);
    }

    if (skin.prem) { // the premium skins paint their own faces: wipe the stock one first
      px(g, bx + 1, by + 1, 10, 10, skin.body); px(g, bx + 1, by + 9, 10, 2, skin.shade); px(g, bx + 10, by + 1, 1, 10, skin.shade);
      px(g, bx + 2, by + 2, 3, 1, skin.light); px(g, bx + 2, by + 3, 1, 2, skin.light);
      const EY = skin.eye, LID = skin.dark, closed = (ex) => px(g, ex, ey + 2, 3, 1, LID);
      const xx = (ex) => { px(g, ex, ey, 1, 1, LID); px(g, ex + 2, ey, 1, 1, LID); px(g, ex + 1, ey + 1, 1, 1, LID); px(g, ex, ey + 2, 1, 1, LID); px(g, ex + 2, ey + 2, 1, 1, LID); };
      const mouth = { run: () => px(g, bx + 5, by + 7, 2, 1, LID), flip: () => px(g, bx + 5, by + 6, 2, 2, LID), joy: () => { px(g, bx + 4, by + 6, 4, 1, LID); px(g, bx + 5, by + 7, 2, 1, '#ff7a9a'); }, focus: () => px(g, bx + 4, by + 7, 4, 1, LID), dead: () => px(g, bx + 4, by + 7, 4, 1, LID) }; // (the outfit covers by+8 on)
      const m = mouth[face] || mouth.run;
      if (skin.acc === 'jackpot') {
        // bright amber eyes with a gold glint, a lucky wink when he runs, a grin
        if (face === 'dead') { xx(ex1); xx(ex2); }
        else if (face === 'blink') { closed(ex1); closed(ex2); }
        else {
          const eye = (ex) => { px(g, ex, ey, 3, 3, EY); px(g, ex + 1, ey + 1, 1, 1, '#7a3a00'); px(g, ex, ey, 1, 1, '#ffffff'); px(g, ex + 2, ey + 2, 1, 1, skin.pupil); };
          eye(ex1);
          if (face === 'run' || face === 'idle') { px(g, ex2, ey + 1, 3, 1, LID); px(g, ex2 + 2, ey, 1, 1, LID); } else eye(ex2); // the lucky wink
        }
        if (face === 'run' || face === 'idle' || face === 'blink') { px(g, bx + 4, by + 7, 4, 1, LID); px(g, bx + 7, by + 6, 1, 1, LID); px(g, bx + 5, by + 7, 1, 1, '#ffd23f'); } else m();
      } else if (skin.acc === 'bwarden') {
        // calm, heavy-lidded red eyes that open wide when he flips
        if (face === 'dead') { closed(ex1); closed(ex2); }
        else if (face === 'blink' || face === 'joy') { closed(ex1); closed(ex2); }
        else {
          const wide = face === 'flip' || face === 'focus';
          for (const ex of [ex1, ex2]) { px(g, ex, ey + (wide ? 0 : 1), 3, wide ? 3 : 2, EY); px(g, ex + 1, ey + 1, 1, 1, '#ffd0d8'); if (!wide) px(g, ex, ey, 3, 1, LID); }
        }
        m();
      } else if (skin.acc === 'wshinobi') {
        // big bright eyes, a confident grin
        if (face === 'dead') { xx(ex1); xx(ex2); }
        else if (face === 'blink') { closed(ex1); closed(ex2); }
        else if (face === 'joy') { for (const ex of [ex1, ex2]) { px(g, ex, ey + 2, 1, 1, LID); px(g, ex + 1, ey + 1, 1, 1, LID); px(g, ex + 2, ey + 2, 1, 1, LID); } }
        else for (const ex of [ex1, ex2]) { px(g, ex, ey, 3, 3, EY); px(g, ex + 1, ey + (face === 'flip' ? 0 : 1), 2, 2, skin.pupil); if (face === 'focus') px(g, ex, ey, 3, 1, LID); }
        if (face === 'run' || face === 'idle') { px(g, bx + 4, by + 7, 4, 1, LID); px(g, bx + 4, by + 6, 1, 1, LID); px(g, bx + 7, by + 6, 1, 1, LID); } else m();
      } else if (skin.acc === 'ctyrant') {
        // narrow red eyes under a scowl, a sharp grin
        if (face === 'dead') { xx(ex1); xx(ex2); }
        else if (face === 'blink') { px(g, ex1, ey + 1, 3, 1, '#ff1a1a'); px(g, ex2, ey + 1, 3, 1, '#ff1a1a'); }
        else {
          const big = face === 'flip' || face === 'focus';
          for (const ex of [ex1, ex2]) { px(g, ex, ey, 3, big ? 3 : 2, LID); px(g, ex, ey + 1, 3, big ? 2 : 1, EY); px(g, ex + (ex === ex1 ? 2 : 0), ey + 1, 1, 1, '#ffd0d0'); }
          px(g, ex1, ey - 1, 2, 1, LID); px(g, ex2 + 1, ey - 1, 2, 1, LID);
        }
        if (face === 'run' || face === 'idle' || face === 'flip' || face === 'focus') { px(g, bx + 3, by + 7, 6, 1, LID); px(g, bx + 4, by + 7, 1, 1, '#ffffff'); px(g, bx + 7, by + 7, 1, 1, '#ffffff'); } else m();
      }
    }
    if (skin.art) {
      // the gift's own pixels on top ('.' keeps what's there, '_' erases)
      skin.art.forEach((row, yy) => {
        for (let xx = 0; xx < row.length; xx++) {
          const ch = row[xx];
          if (ch === '.') continue;
          if (ch === '_') g.clearRect(xx, yy, 1, 1);
          else if (skin.pal[ch]) px(g, xx, yy, 1, 1, skin.pal[ch]);
        }
      });
    }
    if (foot === 0) {
      px(g, bx + 2, by + 12, 3, 1, skin.dark);
      px(g, bx + 7, by + 12, 3, 1, skin.dark);
    } else if (foot === 1) {
      px(g, bx + 1, by + 12, 3, 1, skin.dark);
      px(g, bx + 8, by + 12, 3, 1, skin.dark);
    }
    return cv;
  }

  // x,y = top-left of the 12x12 hitbox. opts: skin, face, foot(-1 none), flipY, sx, sy, alpha, t
  FF.drawFlippo = function (ctx, x, y, opts) {
    opts = opts || {};
    const skin = typeof opts.skin === 'string' ? FF.skinById(opts.skin) : opts.skin || FF.SKINS[0];
    const face = opts.face || 'run';
    const foot = opts.foot === undefined ? -1 : opts.foot;
    const key = skin.id + '|' + face + '|' + foot;
    let buf = cache[key];
    if (!buf) buf = cache[key] = buildFlippo(skin, face, foot);
    const sx = opts.sx || 1, sy = opts.sy || 1;
    const live = skin.prem && opts.t !== undefined && !opts.alpha;
    if (live) FF.fxPremium(ctx, x, y, skin, opts, 0); // the half of the aura that passes behind him
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.translate(Math.round(x + 6), Math.round(y + 6));
    ctx.scale(sx, sy * (opts.flipY ? -1 : 1));
    ctx.drawImage(buf, -8, -10);
    ctx.restore();
    if (live) FF.fxPremium(ctx, x, y, skin, opts, 1);
    if (skin.rainbow && opts.t !== undefined && !opts.alpha) {
      // living rainbow aura — only the Legend has it
      const ring = [];
      for (let i = 0; i < 14; i++) ring.push([x - 1 + i, y - 2], [x - 1 + i, y + 13]);
      for (let i = 0; i < 14; i++) ring.push([x - 2, y - 1 + i], [x + 13, y - 1 + i]);
      ring.forEach((q, i) => {
        if ((i + Math.floor(opts.t * 20)) % 3) return;
        ctx.fillStyle = 'hsl(' + Math.round((i * 9 + opts.t * 240) % 360) + ',100%,65%)';
        ctx.fillRect(Math.round(q[0]), Math.round(q[1]), 1, 1);
      });
    }
    if (skin.fx && opts.t !== undefined && !opts.alpha) {
      const f = skin.fx, tt = opts.t;
      if (f.type === 'orbs') FF.fxOrbs(ctx, x, y, tt, f.c1, f.c2);
      else if (f.type === 'rain') FF.fxRain(ctx, x, y, tt, f.c1);
      else if (f.type === 'glitch') FF.fxGlitch(ctx, x, y, tt, buf, opts, f.c1, f.c2);
      else if (f.type === 'sparkle') { const k = Math.floor(tt * 6) % 4; const sp = [[13, -2], [-3, 2], [12, 10], [-2, 9]][k]; px(ctx, Math.round(x + sp[0]), Math.round(y + sp[1]), 1, 1, f.c1); px(ctx, Math.round(x + sp[0]) + 1, Math.round(y + sp[1]), 1, 1, f.c2); }
    }
    if (skin.acc === 'emperor' && opts.t !== undefined && !opts.alpha) {
      // a slow ring of golden sparks, and a flickering flame on the crown's tip
      const cx = x + 6, cy = y + 6;
      for (let i = 0; i < 6; i++) {
        const a = opts.t * 1.6 + i * (Math.PI / 3);
        const on = (Math.floor(opts.t * 8) + i) % 3 !== 0;
        if (on) px(ctx, Math.round(cx + Math.cos(a) * 12), Math.round(cy + Math.sin(a) * 9), 1, 1, i % 2 ? '#ffd23f' : '#fff6c2');
      }
      const fl = Math.floor(opts.t * 12) % 3;
      const fy = opts.flipY ? y + 16 : y - 7;
      px(ctx, Math.round(x + 5), Math.round(fy - fl), 2, 2, '#ff9a3c');
      px(ctx, Math.round(x + 5 + (fl === 1 ? 1 : 0)), Math.round(fy - 1 - fl), 1, 1, '#fff6c2');
    }
    if (skin.acc === 'sorcerer' && opts.t !== undefined && !opts.alpha) {
      // a blue and a red orb circle him; every few seconds they meet in a purple flash
      const cx = x + 6, cy = y + 6, a = opts.t * 3.2;
      const cyc = opts.t % 4.5, merge = cyc > 4 ? (cyc - 4) / 0.5 : 0;
      const r = 11 * (1 - merge);
      const orb = (ox, oy, c1, c2) => { px(ctx, Math.round(ox) - 1, Math.round(oy) - 1, 3, 3, c1); px(ctx, Math.round(ox), Math.round(oy), 1, 1, c2); };
      if (merge < 0.85) {
        orb(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, '#2a8aff', '#d8f4ff');
        orb(cx - Math.cos(a) * r, cy - Math.sin(a) * r * 0.6, '#ff2a4a', '#ffd8de');
      } else {
        const k = (merge - 0.85) / 0.15;
        ctx.fillStyle = 'rgba(176,80,255,' + (0.55 * (1 - k)).toFixed(2) + ')';
        ctx.fillRect(Math.round(cx - 9 - 6 * k), Math.round(cy - 9 - 6 * k), Math.round(18 + 12 * k), Math.round(18 + 12 * k));
        orb(cx, cy - 10, '#b050ff', '#ffffff');
      }
    }
    if (skin.acc === 'hacker' && opts.t !== undefined && !opts.alpha) {
      // falling green code around the hood
      for (let i = 0; i < 6; i++) {
        const fx = Math.round(x - 4 + ((i * 7) % 20)), fy = Math.round(y - 6 + ((opts.t * (28 + i * 6) + i * 9) % 26));
        px(ctx, fx, fy, 1, 2, i % 3 ? 'rgba(0,255,102,0.55)' : 'rgba(184,255,210,0.8)');
      }
      // every so often the image glitches
      const gk = Math.floor(opts.t * 10) % 23;
      if (gk === 0 || gk === 1) {
        ctx.save();
        ctx.globalAlpha *= 0.45;
        ctx.translate(Math.round(x + 6) + (gk ? 2 : -2), Math.round(y + 6));
        ctx.scale(opts.sx || 1, (opts.sy || 1) * (opts.flipY ? -1 : 1));
        ctx.drawImage(buf, -8, -10);
        ctx.restore();
        px(ctx, Math.round(x - 2), Math.round(y + 4), 16, 1, gk ? 'rgba(255,60,242,0.6)' : 'rgba(39,215,255,0.6)');
      }
    }
    if (skin.acc === 'ivoid' && opts.t !== undefined && !opts.alpha) FF.fxVoid(ctx, x, y, opts.t, opts.aura || 0, opts.flipY);
    if (skin.acc === 'nova' && opts.t !== undefined && !opts.alpha) {
      // every 1.6s a ring of light bursts out from the core and fades — a tiny supernova
      const cx = x + 6, cy = y + 6, ph = (opts.t % 1.6) / 1.6, r = 4 + ph * 13;
      const cols = ['#fff6c2', '#ffd23f', '#ff9a3c', '#ff5ad1'];
      ctx.save();
      ctx.globalAlpha *= Math.max(0, 1 - ph);
      for (let i = 0; i < 12; i++) {
        const a = i * (Math.PI / 6) + ph * 0.6;
        px(ctx, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 1, 1, cols[(i + Math.floor(ph * 4)) % 4]);
      }
      ctx.restore();
    }
    if (skin.acc === 'sparkle' && opts.t !== undefined) {
      const k = Math.floor(opts.t * 6) % 4;
      const sp = [[13, -2], [-3, 2], [12, 10], [-2, 9]][k];
      px(ctx, Math.round(x + sp[0]), Math.round(y + sp[1]), 1, 1, '#ffffff');
    }
  };

  // ✦ INFINITY VOID's cosmic aura: a slow nebula halo, orbiting star motes (more with a higher aura) and a shimmer
  // that runs along the silver crest. aura 0..1 grows with the combo (and in the boss fight once the Void awakens).
  FF.fxVoid = function (ctx, x, y, t, aura, flipY) {
    const cx = x + 6, cy = y + 6, A = FF.clamp(aura, 0, 1.5);
    const r0 = 9 + A * 4;
    // a soft nebula: dithered rings of faint light, never a box
    ctx.fillStyle = 'rgba(140,190,255,' + (0.16 + 0.16 * A + 0.05 * Math.sin(t * 3)).toFixed(3) + ')';
    for (let ring = 0; ring < 2; ring++) {
      const rr = r0 - 2 + ring * 3, n = 18 + ring * 6;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + t * (ring ? -0.6 : 0.8); ctx.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * 0.8), 1, 1); }
    }
    const n = 3 + Math.round(A * 5);
    for (let i = 0; i < n; i++) {
      const sp = 1.4 + (i % 3) * 0.5, a = t * sp * (i % 2 ? 1 : -1) + i * 2.1, r = 10 + (i % 3) * 3 + A * 3;
      const ox = cx + Math.cos(a) * r, oy = cy + Math.sin(a) * r * 0.55;
      const tw = (Math.floor(t * 10) + i) % 4 === 0;
      px(ctx, Math.round(ox), Math.round(oy), 1, 1, i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#7fe8ff' : '#b8a6ff');
      if (tw) { px(ctx, Math.round(ox) - 1, Math.round(oy), 3, 1, 'rgba(255,255,255,0.7)'); px(ctx, Math.round(ox), Math.round(oy) - 1, 1, 3, 'rgba(255,255,255,0.7)'); }
    }
    // the idle shimmer along the crest
    const sh = (t % 2.2) / 2.2;
    if (sh < 0.4) { const sx = Math.round(x - 3 + sh / 0.4 * 14); px(ctx, sx, Math.round(flipY ? y + 14 : y - 3), 1, 1, '#ffffff'); }
    if (A > 0.8) { // full power: a ring of light
      for (let i = 0; i < 20; i++) { if ((i + Math.floor(t * 18)) % 3) continue; const a = i / 20 * Math.PI * 2; px(ctx, Math.round(cx + Math.cos(a) * (r0 + 3)), Math.round(cy + Math.sin(a) * (r0 + 3) * 0.8), 1, 1, '#d8f4ff'); }
    }
  };
  // 🎁 build 39: the premium skins' live layer. layer 0 = behind the body, 1 = in front (orbits pass behind and in front).
  // Coordinates are local to the body centre (body = -6..6), y is mirrored when gravity is flipped so the hair, scarf
  // and horns stay on his head. opts.aura 0..1.5 grows with the combo; opts.perf = seconds since the last PERFECT.
  FF.fxPremium = function (ctx, x, y, skin, opts, layer) {
    const t = opts.t, A = FF.clamp(opts.aura || 0, 0, 1.5), fy = !!opts.flipY, cx = x + 6, cy = y + 6;
    const P = (lx, ly, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + lx), fy ? Math.round(cy - ly) - h : Math.round(cy + ly), w, h); };
    const flip = opts.face === 'flip', run = opts.foot === 0 || opts.foot === 1;
    const front = (s) => (layer === 1) === (s >= 0); // which half of an orbit this layer owns
    const ring = (r, ry, n, rot, col, skip) => { ctx.fillStyle = col; for (let i = 0; i < n; i++) { if (skip && (i + Math.floor(t * 14)) % skip) continue; const a = i / n * Math.PI * 2 + rot; if (!front(Math.sin(a))) continue; ctx.fillRect(Math.round(cx + Math.cos(a) * r), fy ? Math.round(cy - Math.sin(a) * ry) - 1 : Math.round(cy + Math.sin(a) * ry), 1, 1); } };
    if (skin.acc === 'jackpot') {
      // lucky aura: a green-gold dithered halo that brightens with the combo
      // big emerald aura that wraps the whole body (owner's request), growing with the combo
      ring(15 + A * 4, (15 + A * 4) * 0.95, 30 + Math.round(A * 16), t * 0.6, 'rgba(15,191,122,' + (0.35 + 0.3 * A).toFixed(2) + ')', 3);
      ring(12 + A * 3, (12 + A * 3) * 0.95, 24 + Math.round(A * 14), -t * 0.8, 'rgba(60,255,160,' + (0.3 + 0.3 * A).toFixed(2) + ')', 2);
      ring(9 + A * 3, (9 + A * 3) * 0.8, 18 + Math.round(A * 14), t * 0.9, 'rgba(125,255,178,' + (0.32 + 0.3 * A).toFixed(2) + ')', 2);
      ring(10 + A * 3, (10 + A * 3) * 0.8, 14 + Math.round(A * 10), -t * 1.3, 'rgba(255,210,63,' + (0.25 + 0.35 * A).toFixed(2) + ')', 3);
      // spinning dice (they tumble: a die mid-roll is drawn on its edge)
      const nd = 2 + Math.round(A * 1.4);
      // pips on a 4x4 face: [x, y, size] (a 3x3 face would leave a plus-shaped gap, so no)
      const PIPS = [[[1, 1, 2]], [[0, 0, 1], [3, 3, 1]], [[0, 0, 1], [3, 3, 1], [1, 1, 2]], [[0, 0, 1], [3, 0, 1], [0, 3, 1], [3, 3, 1]], [[0, 0, 1], [3, 0, 1], [0, 3, 1], [3, 3, 1], [1, 1, 2]], [[0, 0, 1], [3, 0, 1], [0, 2, 1], [3, 2, 1], [0, 3, 1], [3, 3, 1]]];
      for (let i = 0; i < nd; i++) {
        const a = t * 2.2 + i * Math.PI * 2 / nd, r = 12 + A * 2, sn = Math.sin(a);
        if (!front(sn)) continue;
        const dx = Math.cos(a) * r - 1, dy = sn * r * 0.5 - 1, roll = Math.floor(t * 9 + i * 3);
        if ((roll & 3) === 0) { P(dx, dy, 4, 2, '#c8ccd8'); P(dx, dy, 4, 1, '#ffffff'); continue; }
        P(dx - 1, dy - 1, 6, 6, layer ? '#1a1000' : 'rgba(26,16,0,0.6)'); P(dx, dy, 4, 4, layer ? '#f4f7ff' : '#b8bccb');
        for (const [px0, py0, w0] of PIPS[(roll + i) % 6]) P(dx + px0, dy + py0, w0, w0, (roll + i) % 6 === 0 ? '#c02a38' : '#1a1000');
      }
      // card shards circling the other way, flipping as they go
      const nc = 1 + Math.round(A * 2.2);
      for (let i = 0; i < nc; i++) {
        const a = -t * 1.6 + i * Math.PI * 2 / nc + 0.8, r = 9 + A * 2 + (i % 2) * 2, sn = Math.sin(a);
        if (!front(sn)) continue;
        const ph = Math.floor(t * 7 + i * 2) % 4, w = ph === 1 || ph === 3 ? 1 : 2, back = ph === 2;
        const qx = Math.cos(a) * r, qy = sn * r * 0.7 - 2;
        P(qx, qy, w, 3, back ? '#c02a38' : '#ffffff');
        if (!back && w === 2) P(qx, qy + 1, 1, 1, i % 2 ? '#c02a38' : '#1a1000');
        if (back) P(qx, qy + 1, w, 1, '#ffd23f');
      }
      if (layer === 1) for (let i = 0; i < 2 + Math.round(A * 4); i++) { const ph = (t * 1.3 + i * 0.37) % 1; if (ph < 0.5) P(((i * 29) % 22) - 11, ((i * 17) % 18) - 10 - ph * 3, 1, 1, ph < 0.2 ? '#ffffff' : '#ffd23f'); } // gold sparkle
      if (layer === 1 && (Math.floor(t * 5) % 7 === 0 || A > 0.9)) { const k = Math.floor(t * 5) % 4; P([-9, 8, 7, -8][k], [-8, -7, 6, 5][k], 1, 1, '#fff6c2'); }
      // 777 on a PERFECT: a tiny slot reel pops over his head, spins, and locks in on three sevens
      const pf = opts.perf;
      if (layer === 1 && pf !== undefined && pf >= 0 && pf < 1.1) {
        const pop = pf < 0.12 ? pf / 0.12 : 1, ry = -15 - Math.round(pop * 2);
        P(-7, ry - 1, 15, 7, '#c9971a'); P(-6, ry, 13, 5, '#1a1000');
        for (let k = 0; k < 3; k++) {
          const lock = pf > 0.3 + k * 0.12, wx = -6 + k * 4 + 1;
          P(wx - 1, ry, 4, 5, '#f4f7ff');
          if (lock) { const c = pf > 0.7 && Math.floor(pf * 16) % 2 ? '#ffd23f' : '#e8233a'; P(wx - 1, ry, 3, 1, c); P(wx + 1, ry + 1, 1, 1, c); P(wx, ry + 2, 1, 1, c); P(wx, ry + 3, 1, 2, c); }
          else { const sp = Math.floor(pf * 40 + k * 5) % 3; P(wx - 1, ry + sp, 3, 1, ['#3fdc7a', '#ffd23f', '#27d7ff'][(sp + k) % 3]); P(wx - 1, ry + sp + 2, 3, 1, '#c8ccd8'); }
        }
        if (pf > 0.66 && pf < 0.9) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + pf * 4, rr = 4 + (pf - 0.66) * 40; P(Math.cos(a) * rr, ry + 2 + Math.sin(a) * rr * 0.6, 1, 1, i % 2 ? '#ffd23f' : '#7dffb2'); }
      }
    } else if (skin.acc === 'bwarden') {
      // a slow heartbeat glow behind him, then rings and liquid blood orbs that never stop orbiting
      if (layer === 0) { const hb = t % 1.3, beat = hb < 0.1 ? 1 : hb > 0.22 && hb < 0.32 ? 0.7 : 0; if (beat) { ctx.fillStyle = 'rgba(255,42,74,' + ((0.1 + A * 0.12) * beat).toFixed(2) + ')'; ctx.fillRect(Math.round(cx - 8), Math.round(cy - 8), 16, 16); } }
      ring(11 + A * 2, (11 + A * 2) * 0.42, 26, t * 1.1, 'rgba(160,10,30,' + (0.5 + 0.3 * A).toFixed(2) + ')', 0);
      if (A > 0.45) { // a second, tilted ring once the combo is up
        ctx.fillStyle = 'rgba(255,74,90,' + (0.3 + 0.3 * (A - 0.45)).toFixed(2) + ')';
        for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 - t * 1.5; const s2 = Math.cos(a); if (!front(s2) || (i + Math.floor(t * 12)) % 2) continue; P(Math.sin(a) * 6, Math.cos(a) * (12 + A * 2) * 0.9 - 1, 1, 1, ctx.fillStyle); }
      }
      const n = 3 + Math.round(A * 2.6);
      for (let i = 0; i < n; i++) {
        const a = t * 1.8 + i * Math.PI * 2 / n, r = 11 + A * 2, sn = Math.sin(a);
        if (!front(sn)) continue;
        const ox = Math.cos(a) * r, oy = sn * r * 0.42, big = sn > 0.2;
        // a short wet smear behind each orb along its path
        for (let k = 1; k <= 2; k++) { const b = a - k * 0.16; P(Math.cos(b) * r, Math.sin(b) * r * 0.42, 1, 1, 'rgba(192,16,42,' + (0.55 - k * 0.2).toFixed(2) + ')'); }
        if (big) { P(ox - 1, oy - 2, 3, 1, '#c0102a'); P(ox - 2, oy - 1, 5, 2, '#c0102a'); P(ox - 1, oy + 1, 3, 1, '#7a0a1e'); P(ox - 1, oy - 1, 1, 1, '#ffd0d8'); P(ox + 1, oy, 1, 1, '#5a0010'); }
        else { P(ox - 1, oy - 1, 3, 2, '#8a0a20'); P(ox, oy - 1, 1, 1, '#ff4a5a'); }
        // now and then a droplet falls from an orb
        const dp = (t * 0.8 + i * 0.37) % 1;
        if (dp < 0.3) { const d = dp / 0.3; P(ox, oy + 2 + d * 8, 1, d < 0.5 ? 2 : 1, 'rgba(192,16,42,' + (0.9 - d * 0.6).toFixed(2) + ')'); }
      }
      if (layer === 1 && flip) P(-1, -9, 2, 2, '#ff4a5a'); // a bright bead pulled up as he flips
    } else if (skin.acc === 'wshinobi') {
      // the wind spiral: two arms of gusting pixels winding around him, wider and denser with the combo
      const N = 10 + Math.round(A * 10), spin = t * (5 + A * 3);
      for (let arm = 0; arm < 2; arm++) for (let i = 0; i < N; i++) {
        const u = i / N, an = u * 5.2 + arm * Math.PI + spin, r = 4 + u * (9 + A * 4), sn = Math.sin(an);
        if (!front(sn) || (i + arm) % 2 && u < 0.3) continue;
        P(Math.cos(an) * r, sn * r * 0.62, 1, 1, u > 0.8 ? '#ffffff' : u > 0.45 ? 'rgba(191,234,255,' + (0.45 + 0.35 * A).toFixed(2) + ')' : 'rgba(90,184,255,' + (0.35 + 0.3 * A).toFixed(2) + ')');
      }
      // blue wind orbs swirling around him (more with the combo), each with a spinning white core
      const no = 2 + Math.round(A * 2);
      for (let i = 0; i < no; i++) {
        const a = t * 2.6 + i * Math.PI * 2 / no, r = 11 + A * 2, sn = Math.sin(a);
        if (!front(sn)) continue;
        const ox = Math.cos(a) * r, oy = sn * r * 0.5 - 1, sp = Math.floor(t * 16 + i) % 4;
        P(ox - 1, oy - 2, 3, 1, '#2a8cff'); P(ox - 2, oy - 1, 5, 3, '#2a8cff'); P(ox - 1, oy + 2, 3, 1, '#2a8cff');
        P(ox - 1, oy - 1, 3, 3, '#7ad8ff'); P(ox + [-1, 1, 1, -1][sp], oy + [-1, -1, 1, 1][sp], 1, 1, '#ffffff'); P(ox, oy, 1, 1, '#ffffff');
      }
      if (layer === 0) {
        // the scarf: two tails streaming back from the knot, rippling; they lift on a flip and lengthen with the combo
        const L = 8 + Math.round(A * 6) + (run ? 2 : 0);
        for (let tail = 0; tail < 2; tail++) for (let k = 0; k < L - tail * 3; k++) {
          const wv = Math.sin(t * 11 - k * 0.8 + tail * 1.7) * Math.min(3, k * 0.3), lift = flip ? -k * 0.55 : (run ? 0 : k * 0.25);
          const sx = -6 - k * 1.5, sy = 4 + tail * 1 + wv + lift;
          P(sx, sy, 2, k < L / 2 && !tail ? 2 : 1, (k + Math.floor(t * 6)) % 4 === 0 ? '#ffd21a' : tail ? '#151520' : '#ff7a12');
        }
        // gust streaks peeling off behind him
        for (let i = 0; i < 2 + Math.round(A * 3); i++) { const ph = (t * 2.2 + i * 0.41) % 1; P(-8 - ph * 16, -6 + ((i * 5) % 13), 3 + (i % 2) * 2, 1, 'rgba(191,234,255,' + (0.5 * (1 - ph)).toFixed(2) + ')'); }
      }
    } else if (skin.acc === 'ctyrant') {
      // two extra arms at his sides (above his own), swinging out of step and raised on a flip
      const sw = run ? 7 : 2.5;
      const arm = (side, ph) => {
        const ang = flip ? -1.1 : Math.sin(t * sw + ph) * 0.7 - 0.35;
        const sx = side * 6, sy = -2;
        const ex = sx + side * Math.cos(ang) * 3, ey = sy + Math.sin(ang) * 3;
        const hx = ex + side * Math.cos(ang + 0.6 * side) * 2.5, hy = ey + Math.sin(ang + 0.6) * 2.5;
        P(Math.min(sx, ex), Math.min(sy, ey), Math.abs(ex - sx) + 1 | 0, Math.abs(ey - sy) + 1 | 0, layer ? '#f0c4b0' : '#d49c88');
        P(ex - 0.5, ey - 0.5, 2, 2, '#1a0a10'); // a dark band at the elbow
        P(hx - 0.5, hy - 0.5, 2, 2, layer ? '#f0c4b0' : '#d49c88'); P(hx + side, hy - 1, 1, 1, '#ff2a3a');
      };
      arm(layer ? 1 : -1, layer ? Math.PI : 0);
      // the aura: red and pink sparks rising off him (against his gravity), more and hotter with the combo
      const n = 4 + Math.round(A * 16);
      for (let i = 0; i < n; i++) {
        if ((i % 2) !== layer) continue;
        const life = (t * (0.7 + (i % 3) * 0.25) + i * 0.29) % 1, ex = ((i * 37) % 22) - 11 + Math.sin(t * 2 + i) * 2, ey = 9 - life * (20 + A * 6);
        P(ex, ey, 1, life < 0.3 && i % 3 === 0 ? 2 : 1, life < 0.25 ? '#ffd0e0' : life < 0.6 ? '#ff8ab0' : 'rgba(255,42,58,' + (1 - life).toFixed(2) + ')');
      }
      if (layer === 1) {
        // burning eyes: a red glow flickering at the outer corner of each eye
        const fl = Math.floor(t * 14) % 3;
        P(-6, -3 + (fl === 1 ? -1 : 0), 1, 1, fl ? '#ff2a3a' : '#ff8ab0'); P(5, -3 + (fl === 2 ? -1 : 0), 1, 1, fl ? '#ff2a3a' : '#ff8ab0');
        if (A > 0.6) ring(10 + A * 2, (10 + A * 2) * 0.85, 26, t * 1.4, 'rgba(255,138,176,0.6)', 2);
      } else if (A > 0.3) ring(9 + A * 2, (9 + A * 2) * 0.85, 30, -t, 'rgba(255,42,58,' + (0.2 + 0.25 * A).toFixed(2) + ')', 0);
    }
  };
  // effect helpers shared by built-in and gift skins
  FF.fxOrbs = function (ctx, x, y, t, c1, c2) {
    const cx = x + 6, cy = y + 6, a = t * 3.2;
    const orb = (ox, oy, c) => { px(ctx, Math.round(ox) - 1, Math.round(oy) - 1, 3, 3, c); px(ctx, Math.round(ox), Math.round(oy), 1, 1, '#ffffff'); };
    orb(cx + Math.cos(a) * 11, cy + Math.sin(a) * 6.6, c1);
    orb(cx - Math.cos(a) * 11, cy - Math.sin(a) * 6.6, c2);
  };
  FF.fxRain = function (ctx, x, y, t, c) {
    for (let i = 0; i < 6; i++) {
      const fx = Math.round(x - 4 + ((i * 7) % 20)), fy = Math.round(y - 6 + ((t * (28 + i * 6) + i * 9) % 26));
      ctx.globalAlpha = i % 3 ? 0.55 : 0.85;
      px(ctx, fx, fy, 1, 2, c);
      ctx.globalAlpha = 1;
    }
  };
  FF.fxGlitch = function (ctx, x, y, t, buf, opts, c1, c2) {
    const gk = Math.floor(t * 10) % 23;
    if (gk !== 0 && gk !== 1) return;
    ctx.save();
    ctx.globalAlpha *= 0.45;
    ctx.translate(Math.round(x + 6) + (gk ? 2 : -2), Math.round(y + 6));
    ctx.scale(opts.sx || 1, (opts.sy || 1) * (opts.flipY ? -1 : 1));
    ctx.drawImage(buf, -8, -10);
    ctx.restore();
    px(ctx, Math.round(x - 2), Math.round(y + 4), 16, 1, gk ? c1 : c2);
  };

  // ---------- Coins ----------
  FF.drawCoin = function (ctx, cx, cy, t, opts) {
    opts = opts || {};
    cx = Math.round(cx);
    cy = Math.round(cy);
    if (opts.gold) {
      // risk gem (worth 5)
      const rows = [1, 3, 5, 7, 9, 7, 5, 3, 1];
      for (let r = 0; r < 9; r++) {
        const w = rows[r];
        const x0 = cx - (w >> 1);
        px(ctx, x0, cy - 4 + r, w, 1, C.gold);
        px(ctx, x0, cy - 4 + r, 1, 1, '#7a4a00');
        px(ctx, x0 + w - 1, cy - 4 + r, 1, 1, '#7a4a00');
      }
      px(ctx, cx - 1, cy - 2, 1, 2, C.coinLight);
      px(ctx, cx - 2, cy, 1, 1, C.coinLight);
      const s = Math.floor(t * 5) % 6;
      if (s < 2) {
        px(ctx, cx + 2, cy - 5, 2, 2, '#fff'); // a soft glint
      }
      return;
    }
    const ph = Math.floor((t * 6 + (opts.offset || 0)) % 6);
    const widths = [7, 5, 3, 1, 3, 5];
    const w = widths[ph];
    const rowsW = [w - 2, w, w, w, w, w, w - 2];
    for (let r = 0; r < 7; r++) {
      const rw = Math.max(1, rowsW[r]);
      const x0 = cx - (rw >> 1);
      px(ctx, x0, cy - 3 + r, rw, 1, C.coinDark);
    }
    if (w >= 3) {
      for (let r = 1; r < 6; r++) {
        const rw = Math.max(1, (r === 1 || r === 5 ? w - 4 : w - 2));
        px(ctx, cx - (rw >> 1), cy - 3 + r, rw, 1, C.coin);
      }
      px(ctx, cx - (w >> 1) + 1, cy - 2, 1, 2, C.coinLight);
      if (w >= 5) px(ctx, cx, cy - 1, 1, 3, C.coinDark);
    } else {
      px(ctx, cx, cy - 2, 1, 5, C.coin);
    }
  };

  // ---------- Spikes (hazard colours never change between worlds) ----------
  // dir 'up' = base at y, tip at y-8.   dir 'down' = base at y, tip at y+8.
  FF.drawSpikes = function (ctx, x, y, w, dir) {
    x = Math.round(x);
    const n = Math.max(1, Math.round(w / 8));
    // b66: spikes read as danger on every world: a red glow on the surface under them and a dark outline round each one
    ctx.fillStyle = 'rgba(255,40,60,0.22)'; ctx.fillRect(x - 2, dir === 'up' ? y - 11 : y + 8, n * 8 + 4, 3);
    for (let i = 0; i < n; i++) {
      const sx = x + i * 8;
      for (let r = 0; r < 8; r++) {
        const half = (r >> 1) + 1, yy = dir === 'up' ? y - 8 + r : y + 7 - r;
        px(ctx, sx + 4 - half - 1, yy, half * 2 + 2, 1, '#05060d');
      }
      px(ctx, sx + 3, dir === 'up' ? y - 9 : y + 8, 2, 1, '#05060d'); // (the outline over the tip)
    }
    for (let i = 0; i < n; i++) {
      const sx = x + i * 8;
      for (let r = 0; r < 8; r++) {
        const half = (r >> 1) + 1; // 1..4
        const x0 = sx + 4 - half;
        const ww = half * 2;
        const yy = dir === 'up' ? y - 8 + r : y + 7 - r;
        px(ctx, x0, yy, ww, 1, r < 2 ? '#ffd0d6' : C.hazard); // (b66: a bright tip)
        px(ctx, x0, yy, 1, 1, FF.cbMode ? '#ffffff' : C.hazardLight);
        px(ctx, x0 + ww - 1, yy, 1, 1, FF.cbMode ? '#ffffff' : C.hazardDark);
      }
    }
    px(ctx, x, dir === 'up' ? y - 1 : y, n * 8, 1, FF.cbMode ? '#ffffff' : C.hazardDark);
  };

  // Lock icon 7x8
  FF.drawLock = function (ctx, x, y, col) {
    x = Math.round(x);
    y = Math.round(y);
    col = col || '#ffffff';
    px(ctx, x + 1, y, 5, 1, col);
    px(ctx, x + 1, y, 1, 3, col);
    px(ctx, x + 5, y, 1, 3, col);
    px(ctx, x, y + 3, 7, 5, col);
    px(ctx, x + 3, y + 4, 1, 2, '#000000');
  };

  // Hatched rect (phase solids). active = solid colour, otherwise dotted ghost outline.
  FF.drawPhaseRect = function (ctx, x, y, w, h, phase, active, t) {
    x = Math.round(x);
    y = Math.round(y);
    const col = phase === 'b' ? C.blue : C.purple;
    const dark = phase === 'b' ? C.blueDark : C.purpleDark;
    const light = phase === 'b' ? C.blueLight : C.purpleLight;
    if (active) {
      px(ctx, x, y, w, h, dark);
      ctx.fillStyle = col;
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          if (((xx + yy + Math.floor(t * 8)) & 3) === 0) ctx.fillRect(x + xx, y + yy, 1, 1);
        }
      }
      px(ctx, x, y, w, 1, light);
      px(ctx, x, y, 1, h, light);
      px(ctx, x + w - 1, y, 1, h, col);
      px(ctx, x, y + h - 1, w, 1, col);
    } else {
      ctx.fillStyle = FF.rgba(col, 0.55);
      for (let i = 0; i < w; i += 3) {
        ctx.fillRect(x + i, y, 1, 1);
        ctx.fillRect(x + i, y + h - 1, 1, 1);
      }
      for (let i = 0; i < h; i += 3) {
        ctx.fillRect(x, y + i, 1, 1);
        ctx.fillRect(x + w - 1, y + i, 1, 1);
      }
    }
    FF.drawPhaseMarks(ctx, x, y, w, h, phase, active);
  };

  // b66: Dual Flip is readable by SHAPE, not only by colour (blue/purple is the classic colour-blind pair).
  // Blue world = gravity down = ▼, purple world = gravity up = ▲, the same arrow the player's own gravity points.
  // Drawn on every phase solid, solid or ghost, every ~22 px along its long side. Pure drawing: no rule changes.
  FF.drawPhaseMarks = function (ctx, x, y, w, h, phase, active) {
    if (w < 7 || h < 5) return;
    const down = phase === 'b';
    ctx.fillStyle = active ? '#ffffff' : FF.rgba(phase === 'b' ? C.blueLight : C.purpleLight, 0.75);
    const arrow = (cx, cy) => { // 5 x 3 px
      for (let r = 0; r < 3; r++) ctx.fillRect(cx - 2 + r, down ? cy - 1 + r : cy + 1 - r, 5 - 2 * r, 1);
    };
    const tall = h >= w, len = tall ? h : w, n = Math.max(1, Math.floor((len - 6) / 22));
    for (let i = 0; i < n; i++) {
      const at = Math.round((len * (i + 0.5)) / n);
      if (tall) arrow(x + Math.floor(w / 2), y + at); else arrow(x + at, y + Math.floor(h / 2));
    }
  };

  // Moving barrier — a grumpy crusher block. Deadly to touch.
  FF.drawMover = function (ctx, x, y, w, h, t) {
    x = Math.round(x);
    y = Math.round(y);
    px(ctx, x, y, w, h, C.hazardDark);
    px(ctx, x + 1, y + 1, w - 2, h - 2, C.hazard);
    ctx.fillStyle = C.hazardDark;
    for (let yy = 2; yy < h - 2; yy += 4) ctx.fillRect(x + 1, y + yy, w - 2, 1);
    px(ctx, x + 1, y + 1, 1, h - 2, C.hazardLight);
    // eyes
    const ey = y + (h >> 1) - 3;
    px(ctx, x + 2, ey, 3, 3, '#fff');
    px(ctx, x + w - 5, ey, 3, 3, '#fff');
    px(ctx, x + 3, ey + 1, 1, 2, '#000');
    px(ctx, x + w - 4, ey + 1, 1, 2, '#000');
    px(ctx, x + 2, ey - 1, 3, 1, '#000');
    px(ctx, x + w - 5, ey - 1, 3, 1, '#000');
  };

  // Secret glitch portal
  FF.drawPortal = function (ctx, cx, cy, t) {
    const cols = ['#39ff88', '#ff3cf2', '#27d7ff', '#ffffff'];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + t * 3;
      const r = 7 + Math.sin(t * 9 + i) * 2;
      px(ctx, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2, cols[(i + Math.floor(t * 10)) % 4]);
    }
    FF.font.draw(ctx, '?', cx + (Math.random() < 0.15 ? 1 : 0), cy - 3, { color: '#fff', align: 'center' });
  };

  // App icon / share-card helper: big Flippo
  FF.drawFlippoBig = function (ctx, x, y, scale, opts) {
    const tmp = FF.makeCanvas(20, 24);
    FF.drawFlippo(tmp.getContext('2d'), 4, 6, opts);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, x, y, 20 * scale, 24 * scale);
  };
})(window.FF);
