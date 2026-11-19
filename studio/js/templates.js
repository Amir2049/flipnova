// NOVA STUDIO — ready-made games to start from (every one is fully editable).
(function (G) {
  'use strict';
  // a sprite from 16 rows of 16 characters (palette keys, '.' = see-through); short rows are padded
  const S = (...frames) => ({ frames: frames.map((rows) => { const r = rows.map((x) => (x + '................').slice(0, 16)); while (r.length < 16) r.unshift('................'); return r.slice(0, 16).join(''); }) });

  const ART = {
    hero: S(
      ['', '', '....11111111', '...1999999991', '..199999999991', '..193399933991', '..193099930991', '..199999999991', '..199999999991', '..199966669991', '..199999999991', '...1999999991', '....11111111', '....11....11', '....11....11', ''],
      ['', '', '....11111111', '...1999999991', '..199999999991', '..193399933991', '..193099930991', '..199999999991', '..199999999991', '..199966669991', '..199999999991', '...1999999991', '....11111111', '.....11..11', '.....11..11', '']),
    bird: S(
      ['', '', '', '.....11111', '....1666661', '...166663031', '..1666666661.', '.11166666665555', '1333166666655', '1333366666661', '.1111666666661', '...1666666661', '....1111111', '', '', ''],
      ['', '', '', '.....11111', '....1666661', '...166663031', '..1666666661', '..166666666555', '..11666666655', '.133316666661', '.1333316666661', '..11111666661', '....1111111', '', '', '']),
    grass: S(['7777777777777777', '7877787778777877', '8dd8dddd8ddd8dd8', 'dddddddddddddddd', 'ddedddddddeddddd', 'dddddddddddddddd', 'dddddeddddddddde', 'dddddddddddddddd', 'deddddddddddeddd', 'dddddddddddddddd', 'ddddddeddddddddd', 'dddddddddddddddd', 'dddddddddeddddde', 'dedddddddddddddd', 'dddddddddddddddd', 'dddddddddddddddd']),
    dirt: S(['dddddddddddddddd', 'ddedddddddeddddd', 'dddddddddddddddd', 'dddddeddddddddde', 'dddddddddddddddd', 'deddddddddddeddd', 'dddddddddddddddd', 'ddddddeddddddddd', 'dddddddddddddddd', 'dddddddddeddddde', 'dedddddddddddddd', 'dddddddddddddddd', 'ddddeddddddddedd', 'dddddddddddddddd', 'ddddddddeddddddd', 'dddddddddddddddd']),
    brick: S(['2222222222222222', '1111111211111112', '1111111211111112', '1111111211111112', '2222222222222222', '1112111111121111', '1112111111121111', '1112111111121111', '2222222222222222', '1111111211111112', '1111111211111112', '1111111211111112', '2222222222222222', '1112111111121111', '1112111111121111', '1112111111121111']),
    pipe: S(['1888888888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1877788888888881', '1888888888888881']),
    spike: S(['', '', '', '', '', '', '', '', '...3.......3', '...4.......4', '..444.....444', '..444.....444', '.44444...44444', '.44444...44444', '4444444.4444444', '4444444444444444']),
    coin: S(
      ['', '', '', '.....666666', '....66333666', '...6636666666', '...6636666666', '...6636666666', '...6666666666', '...6666666666', '....66666666', '.....666666', '', '', '', ''],
      ['', '', '', '......6666', '.....663666', '.....636666', '.....636666', '.....636666', '.....666666', '.....666666', '.....666666', '......6666', '', '', '', '']),
    gem: S(
      ['', '', '', '.....999999', '....99333999', '...9993999999', '...a99999999a', '....a999999a', '.....a9999a', '......a99a', '.......aa', '', '', '', '', ''],
      ['', '', '', '.....999999', '....99999999', '...9999999999', '...a99993999a', '....a999999a', '.....a9999a', '......a99a', '.......aa', '', '', '', '', '']),
    flag: S(
      ['..3', '..3666666', '..36666666', '..3666666', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '.111', '11111'],
      ['..3', '..366666', '..3666666', '..366666', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '.111', '11111']),
    slime: S(
      ['', '', '', '', '', '.....111111', '....14444441', '...1444444441', '..144334433441', '..144304430441', '..144444444441', '..144444444441', '..144144441441', '...14444444441', '....111111111', ''],
      ['', '', '', '', '', '', '.....111111', '...114444441', '..1444334433441', '..1444304430441', '..1444444444441', '..1441444414441', '..14444444444441', '...111111111111', '', '']),
    ghost: S(
      ['', '....33333333', '...3333333333', '..333333333333', '..330033300333', '..330033300333', '..333333333333', '..333333333333', '..333300003333', '..333333333333', '..333333333333', '..333333333333', '..33.333.333.3', '..3...3...3', '', ''],
      ['', '....33333333', '...3333333333', '..333333333333', '..333003330033', '..333003330033', '..333333333333', '..333333333333', '..333300003333', '..333333333333', '..333333333333', '..333333333333', '..3.333.333.33', '...3...3...3', '', '']),
    spring: S(['', '', '', '', '', '', '', '', '..444444444444', '..444444444444', '....3.....3', '.....3...3', '....3.....3', '.....3...3', '..222222222222', '..222222222222']),
    key: S(['', '', '', '', '...666', '..66.66', '..6...6', '..66.66', '...666666666', '.........6.6', '.........6.6', '', '', '', '', '']),
    door: S(['..dddddddddddd', '.dd5555555555dd', '.d555555555555d', '.d5dddd55dddd5d', '.d5d55d55d55d5d', '.d5dddd55dddd5d', '.d555555555555d', '.d555555556665d', '.d555555556065d', '.d555555556665d', '.d5dddd55dddd5d', '.d5d55d55d55d5d', '.d5dddd55dddd5d', '.d555555555555d', '.d555555555555d', '.dddddddddddddd']),
    check: S(
      ['', '..1', '..1222', '..12222', '..1222', '..1', '..1', '..1', '..1', '..1', '..1', '..1', '..1', '..1', '.111', '11111'],
      ['', '..3', '..3777', '..37777', '..3777', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '..3', '.111', '11111']),
    sign: S(['', '', '.dddddddddddddd', '.deeeeeeeeeeeed', '.de0000e0000eed', '.deeeeeeeeeeeed', '.de000e00000eed', '.deeeeeeeeeeeed', '.dddddddddddddd', '.......dd', '.......dd', '.......dd', '.......dd', '.......dd', '.......dd', '......dddd']),
    flower: S(['', '', '', '', '', '', '', '......c.c', '.....ccccc', '......c6c', '.....ccccc', '......c.c', '.......8', '......88', '.......8', '.......8']),
    wall: S(['bbbbbbbbbbbbbbbb', 'b11111111111111b', 'b1bbbbbbbbbbbb1b', 'b1b1111111111b1b', 'b1b1bbbbbbbb1b1b', 'b1b1b111111b1b1b', 'b1b1b1bbbb1b1b1b', 'b1b1b1b11b1b1b1b', 'b1b1b1b11b1b1b1b', 'b1b1b1bbbb1b1b1b', 'b1b1b111111b1b1b', 'b1b1bbbbbbbb1b1b', 'b1b1111111111b1b', 'b1bbbbbbbbbbbb1b', 'b11111111111111b', 'bbbbbbbbbbbbbbbb'])
  };
  const T = (name, sprite, beh, props) => ({ name, sprite, beh, props: props || {} });

  // scene helpers: objs are [typeId, col, row]
  function grid(cols, rows) {
    const objs = [], at = new Map();
    const put = (t, c, r) => { if (c < 0 || r < 0 || c >= cols || r >= rows) return; const k = c + ',' + r; if (at.has(k)) objs.splice(objs.indexOf(at.get(k)), 1); const o = [t, c, r]; at.set(k, o); objs.push(o); };
    const row = (t, c0, c1, r) => { for (let c = c0; c <= c1; c++) put(t, c, r); };
    const rect = (t, c0, r0, c1, r1) => { for (let r = r0; r <= r1; r++) row(t, c0, c1, r); };
    return { objs, put, row, rect };
  }

  function platformer() {
    const types = {
      hero: T('Hero', 'hero', 'platformer'), grass: T('Grass', 'grass', 'solid'), dirt: T('Dirt', 'dirt', 'solid'), brick: T('Brick', 'brick', 'solid'),
      spike: T('Spikes', 'spike', 'hazard'), coin: T('Coin', 'coin', 'coin'), gem: T('Gem', 'gem', 'coin', { value: 5 }), slime: T('Slime', 'slime', 'patrol'),
      spring: T('Spring', 'spring', 'spring'), key: T('Key', 'key', 'key'), door: T('Door', 'door', 'door'), flag: T('Goal', 'flag', 'goal'),
      check: T('Checkpoint', 'check', 'checkpoint'), sign: T('Sign', 'sign', 'sign', { text: 'Jump on slimes!' }), flower: T('Flower', 'flower', 'decor')
    };
    const a = grid(70, 11);
    a.row('grass', 0, 18, 9); a.rect('dirt', 0, 10, 18, 10);
    a.row('grass', 22, 40, 9); a.rect('dirt', 22, 10, 40, 10);
    a.row('grass', 44, 69, 9); a.rect('dirt', 44, 10, 69, 10);
    a.put('hero', 2, 8); a.put('sign', 5, 8); a.put('flower', 8, 8); a.put('flower', 15, 8);
    a.row('brick', 10, 13, 6); a.row('coin', 10, 13, 5);
    a.put('spike', 16, 8); a.put('slime', 28, 8); a.put('slime', 35, 8);
    a.row('coin', 19, 21, 6); a.put('spring', 38, 8); a.row('brick', 33, 37, 4); a.put('gem', 35, 3);
    a.put('check', 45, 8); a.row('spike', 50, 52, 8); a.row('brick', 49, 53, 5); a.row('coin', 49, 53, 4);
    a.put('key', 58, 8); a.rect('brick', 63, 5, 63, 7); a.put('door', 63, 8); a.put('flag', 67, 8); a.put('slime', 56, 8);
    const b = grid(50, 11);
    b.row('grass', 0, 49, 9); b.rect('dirt', 0, 10, 49, 10);
    b.put('hero', 2, 8); b.row('brick', 8, 12, 6); b.row('brick', 15, 19, 3); b.row('gem', 15, 19, 2);
    b.row('spike', 7, 13, 8); b.put('spring', 14, 8); b.put('slime', 24, 8); b.put('slime', 30, 8); b.row('coin', 22, 32, 7); b.put('flag', 46, 8);
    return {
      name: 'Jungle Jump', lives: 3, gravity: 900, sprites: ART, types,
      scenes: [{ name: 'Level 1', cols: 70, rows: 11, bg: '#5ab8ff', objs: a.objs }, { name: 'Level 2', cols: 50, rows: 11, bg: '#2a1f5a', objs: b.objs }],
      rules: [{ when: { ev: 'start' }, then: [{ act: 'say', text: 'Collect coins! Reach the flag!' }] }, { when: { ev: 'score', n: 20 }, then: [{ act: 'say', text: '20 coins! Amazing!' }, { act: 'sound', text: 'win' }] }]
    };
  }

  function flipRun() {
    const types = { hero: T('Runner', 'hero', 'flip'), brick: T('Block', 'brick', 'solid'), spike: T('Spikes', 'spike', 'hazard'), coin: T('Coin', 'coin', 'coin'), flag: T('Goal', 'flag', 'goal') };
    const a = grid(90, 11);
    a.row('brick', 0, 89, 0); a.row('brick', 0, 89, 10);
    a.put('hero', 2, 9);
    for (let c = 12; c < 84; c += 7) {
      const top = (c / 7) % 2 < 1;
      a.put('spike', c, top ? 9 : 1); a.put('coin', c + 3, top ? 2 : 8);
      if (c % 3 === 0) a.rect('brick', c + 4, top ? 1 : 7, c + 4, top ? 3 : 9);
    }
    a.put('flag', 87, 9);
    return {
      name: 'Flip Run', lives: 0, gravity: 900, sprites: ART, types,
      scenes: [{ name: 'Run', cols: 90, rows: 11, bg: '#140c38', objs: a.objs }],
      rules: [{ when: { ev: 'start' }, then: [{ act: 'say', text: 'Tap to flip gravity!' }] }]
    };
  }

  function flappy() {
    const types = { bird: T('Bird', 'bird', 'flappy'), pipe: T('Pipe', 'pipe', 'solid'), coin: T('Coin', 'coin', 'coin'), flag: T('Goal', 'flag', 'goal') };
    const a = grid(100, 11);
    a.put('bird', 3, 5);
    let r = FF_rand(7);
    for (let c = 14; c < 92; c += 8) {
      const gap = 2 + Math.floor(r() * 5);
      a.rect('pipe', c, 0, c, gap - 1); a.rect('pipe', c, gap + 3, c, 10);
      a.put('coin', c, gap + 1);
    }
    a.rect('flag', 96, 0, 96, 10);
    return {
      name: 'Sky Hop', lives: 0, gravity: 700, sprites: ART, types,
      scenes: [{ name: 'Sky', cols: 100, rows: 11, bg: '#7fd4ff', objs: a.objs }],
      rules: [{ when: { ev: 'start' }, then: [{ act: 'say', text: 'Tap to fly!' }] }]
    };
  }
  function FF_rand(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  function maze() {
    const types = { hero: T('Explorer', 'hero', 'topdown'), wall: T('Wall', 'wall', 'solid'), gem: T('Gem', 'gem', 'coin'), ghost: T('Ghost', 'ghost', 'chaser'),
      key: T('Key', 'key', 'key'), door: T('Door', 'door', 'door'), flag: T('Exit', 'flag', 'goal') };
    const map = [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W.P..g....W.....g.....W...gW',
      'W.WWWWWW..W..WWWWWWW..W.W..W',
      'W.W....W.....W.....W....W..W',
      'W.W.gg.WWWW..W..G..WWWW.WW.W',
      'W.W....W.....W.....W....W..W',
      'W.WWW.WW..WWWWWW.WWW..WWW..W',
      'W....g....W..........gW....W',
      'WWWWWW.WWWW..WWWWWWW..W.WWWW',
      'W..K...W.......g.....W.D..EW',
      'W..........G.........W.W...W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWW'
    ];
    const a = grid(28, 12);
    const key = { W: 'wall', P: 'hero', g: 'gem', G: 'ghost', K: 'key', D: 'door', E: 'flag' };
    map.forEach((row, r) => [...row].forEach((ch, c) => { if (key[ch]) a.put(key[ch], c, r); }));
    return {
      name: 'Treasure Maze', lives: 3, gravity: 0, sprites: ART, types,
      scenes: [{ name: 'Maze', cols: 28, rows: 12, bg: '#0b0b14', objs: a.objs }],
      rules: [{ when: { ev: 'start' }, then: [{ act: 'say', text: 'Find the key, open the door!' }] }, { when: { ev: 'touch', type: 'ghost' }, then: [{ act: 'kill' }] }]
    };
  }

  function blank() {
    const types = { hero: T('Hero', 'hero', 'platformer'), grass: T('Grass', 'grass', 'solid'), dirt: T('Dirt', 'dirt', 'solid'), coin: T('Coin', 'coin', 'coin'), flag: T('Goal', 'flag', 'goal') };
    const a = grid(40, 11);
    a.row('grass', 0, 39, 9); a.rect('dirt', 0, 10, 39, 10); a.put('hero', 2, 8); a.put('flag', 37, 8);
    return { name: 'My Game', lives: 0, gravity: 900, sprites: ART, types, scenes: [{ name: 'Scene 1', cols: 40, rows: 11, bg: '#5ab8ff', objs: a.objs }], rules: [] };
  }

  G.NovaTemplates = [
    { id: 'platformer', icon: '🏃', name: 'Platformer', ar: 'منصّات', make: platformer },
    { id: 'flip', icon: '🔃', name: 'Gravity Flip', ar: 'قلب الجاذبية', make: flipRun },
    { id: 'flappy', icon: '🐦', name: 'Flappy', ar: 'طيران', make: flappy },
    { id: 'maze', icon: '🧭', name: 'Maze', ar: 'متاهة', make: maze },
    { id: 'blank', icon: '✨', name: 'Blank', ar: 'فاضي', make: blank }
  ];
  G.NovaArt = ART;
  G.NovaSprite = S;
})(window);
