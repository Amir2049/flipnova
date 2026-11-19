// FLIPNOVA — Adventure: 45 hand-built levels (9 worlds x 5). Level 5 of every world is a long Gauntlet.
// Steps: template names (see level.js), '|' = checkpoint flag, {setPiece: n} = campaign-only set pieces.
// Every level here is beaten by the planning bot in tools/campaign-test.js before it ships.
(function (FF) {
  'use strict';

  const W = [
    {
      world: 'neon', ar: 'أسطح النيون', en: 'Neon Rooftops',
      levels: [
        { ar: 'أول قلبة', en: 'First Flip', speed: 100, d: 0.1, steps: ['spikeF', 'calm', 'spikeC', 'trajectory', '|', 'spikeF', 'spikeC', 'zigzag', 'calm', { coinArt: 'arrow' }, 'trajectory', 'zigzag'] },
        { ar: 'زقاق الزجزاج', en: 'Zigzag Alley', speed: 105, d: 0.25, steps: ['zigzag', 'trajectory', 'zigzag', '|', 'spikeF', 'spikeC', 'zigzag', 'calm', 'zigzag', 'trajectory', '|', 'zigzag', 'zigzag'] },
        { ar: 'ماشي على السقف', en: 'Ceiling Walker', speed: 110, d: 0.35, steps: [{ weave: 2 }, 'calm', 'zigzag', '|', { weave: 3 }, 'trajectory', '|', 'zigzag', { weave: 3 }] },
        { ar: 'أسطح الشجعان', en: 'Brave Roofs', speed: 112, d: 0.4, steps: ['fork', 'zigzag', '|', 'fly', 'fork', 'trajectory', '|', { weave: 3 }, 'fork', 'fly'] },
        { ar: 'تحدي النيون', en: 'Neon Gauntlet', speed: 120, d: 0.55, gauntlet: true, steps: ['zigzag', { weave: 3 }, 'fork', '|', 'trajectory', 'zigzag', { weave: 4 }, '|', 'fork', 'fly', 'fork', '|', { weave: 4 }, 'zigzag', 'fly', { coinArt: 'star' }] }
      ]
    },
    {
      world: 'clock', ar: 'مختبر التروس', en: 'Clockwork Lab',
      levels: [
        { ar: 'التروس', en: 'Gears', speed: 108, d: 0.3, steps: ['mover', 'calm', 'mover', '|', 'spikeF', 'mover', 'zigzag', '|', 'mover', 'mover'] },
        { ar: 'المصعد', en: 'The Lift', speed: 110, d: 0.35, steps: ['lift', 'calm', 'mover', '|', 'lift', 'zigzag', '|', 'lift', 'mover', 'lift'] },
        { ar: 'موجة الكسّارات', en: 'Crusher Wave', speed: 115, d: 0.45, steps: [{ moverWave: 3 }, '|', 'fly', { moverWave: 4 }, '|', 'lift', { moverWave: 4 }] },
        { ar: 'خط الإنتاج', en: 'Assembly Line', speed: 118, d: 0.5, steps: ['lift', 'mover', 'pad', '|', 'mover', 'lift', 'zigzag', '|', { moverWave: 3 }, 'pad', 'lift', '|', { moverWave: 5 }] },
        { ar: 'قلب الساعة', en: 'Clock Heart', speed: 125, d: 0.65, gauntlet: true, steps: [{ moverWave: 4 }, 'lift', '|', 'pad', 'mover', 'zigzag', 'lift', '|', { moverWave: 5 }, { weave: 3 }, '|', 'lift', 'fly', 'mover', '|', { moverWave: 6 }, { coinArt: 'heart' }] }
      ]
    },
    {
      world: 'mirror', ar: 'فراغ المرايا', en: 'Mirror Void',
      levels: [
        { ar: 'الطور', en: 'Phase', speed: 105, d: 0.3, steps: ['gate', 'calm', 'gate', '|', 'gatePair', 'trajectory', 'gate', '|', 'gatePair'] },
        { ar: 'المنصة الماسكة', en: 'Catch Me', speed: 110, d: 0.4, steps: ['catch', 'gate', '|', 'catch', 'gatePair', '|', 'catch', 'gateSpike'] },
        { ar: 'سلم الأطوار', en: 'Phase Ladder', speed: 110, d: 0.45, steps: [{ ladder: 4 }, 'calm', '|', { ladder: 6 }, 'gatePair', '|', { ladder: 6 }] },
        { ar: 'انعكاس', en: 'Reflection', speed: 118, d: 0.55, steps: ['gateSpike', 'gatePair', 'catch', '|', { ladder: 5 }, 'fly', '|', 'gatePair', 'gatePair', 'catch', '|', { ladder: 7 }] },
        { ar: 'متاهة المرايا', en: 'Mirror Maze', speed: 125, d: 0.7, gauntlet: true, steps: ['gatePair', { ladder: 6 }, '|', 'gateSpike', 'catch', 'gateSpike', '|', { ladder: 8 }, 'gatePair', '|', 'catch', 'gateSpike', 'gatePair', '|', { ladder: 9 }, { coinArt: 'star' }] }
      ]
    },
    {
      world: 'candy', ar: 'دائرة الحلوى', en: 'Candy Circuit',
      levels: [
        { ar: 'بداية حلوة', en: 'Sweet Start', speed: 108, d: 0.35, steps: ['trajectory', 'calm', { coinArt: 'heart' }, 'bumper', '|', 'trajectory', 'fork', '|', 'bumper', 'trajectory'] },
        { ar: 'بيت النطّاطات', en: 'Bounce House', speed: 112, d: 0.45, steps: ['bumper', 'calm', 'fly', '|', 'fork', 'bumper', '|', 'trajectory', 'fly', 'bumper'] },
        { ar: 'الفرع الذهبي', en: 'Golden Fork', speed: 115, d: 0.5, steps: ['fork', 'fork', '|', 'catch', 'fork', 'bumper', '|', 'fork', 'fork'] },
        { ar: 'سكر زيادة', en: 'Sugar Rush', speed: 120, d: 0.6, steps: ['dash', 'bumper', 'fork', '|', 'trajectory', 'dash', 'zigzag', '|', 'bumper', 'bumper', 'fork', '|', 'dash', { weave: 3 }] },
        { ar: 'قلعة الحلوى', en: 'Candy Castle', speed: 128, d: 0.72, gauntlet: true, steps: ['fork', 'bumper', 'dash', '|', 'catch', { ladder: 5 }, '|', 'bumper', 'fork', 'zigzag', '|', 'dash', 'fly', 'fork', '|', { weave: 4 }, 'bumper', 'fly', { coinArt: 'heart' }] }
      ]
    },
    {
      world: 'glitch', ar: 'آركيد الخلل', en: 'Glitch Arcade',
      levels: [
        { ar: 'خلل', en: 'Glitch', speed: 110, d: 0.4, steps: ['lock', 'calm', 'laser', '|', 'lock', 'zigzag', '|', 'laser', 'lock'] },
        { ar: 'عرض الليزر', en: 'Laser Show', speed: 115, d: 0.5, steps: ['laser', 'laser', '|', 'pad', 'laser', 'blink', '|', 'laser', 'lock', 'laser'] },
        { ar: 'خطوة وامضة', en: 'Blinkstep', speed: 115, d: 0.5, steps: ['blink', 'lock', '|', 'blink', 'calm', 'laser', '|', 'blink', 'blink', 'pad'] },
        { ar: 'محبوس', en: 'Locked In', speed: 122, d: 0.62, steps: ['lock', 'laser', 'lock', '|', 'blink', 'laser', 'pad', '|', 'lock', 'fly', 'laser', '|', { weave: 3 }, 'lock'] },
        { ar: 'النواة المكسورة', en: 'Broken Core', speed: 130, d: 0.78, gauntlet: true, steps: ['laser', 'lock', 'blink', '|', 'pad', 'laser', 'gateSpike', '|', 'lock', 'laser', 'laser', '|', 'blink', { ladder: 6 }, '|', 'lock', 'laser', { weave: 4 }, { coinArt: 'arrow' }] }
      ]
    },
    {
      world: 'volcano', ar: 'قلب البركان', en: 'Volcano Core',
      levels: [
        { ar: 'حرارة', en: 'Heat', speed: 112, d: 0.45, steps: ['pop', 'calm', 'saw', '|', 'pop', 'crumble', '|', 'saw', 'pop'] },
        { ar: 'إيقاع النار', en: 'Fire Rhythm', speed: 115, d: 0.5, steps: [{ popRhythm: 3 }, '|', 'saw', 'crumble', { popRhythm: 4 }, '|', 'saw', 'saw'] },
        { ar: 'جسر الرماد', en: 'Ash Bridge', speed: 118, d: 0.55, steps: ['crumble', 'crumble', '|', 'pop', 'fly', 'saw', '|', 'crumble', { popRhythm: 4 }] },
        { ar: 'قاعة المناشير', en: 'Saw Hall', speed: 122, d: 0.65, steps: [{ sawHall: 3 }, '|', 'crumble', 'pop', { sawHall: 4 }, '|', 'saw', { popRhythm: 5 }, '|', 'crumble', 'crumble'] },
        { ar: 'نواة الحمم', en: 'Magma Core', speed: 126, d: 0.75, ramp: 0.18, gauntlet: true, steps: [{ popRhythm: 4 }, 'crumble', '|', { sawHall: 3 }, 'pop', '|', 'crumble', 'crumble', 'saw', '|', { weave: 3 }, 'calm', 'fly', '|', { popRhythm: 4 }, 'calm', { sawHall: 3 }, 'calm', 'crumble', { coinArt: 'star' }] }
      ]
    },
    {
      world: 'ocean', ar: 'أعماق المحيط', en: 'Deep Ocean',
      levels: [
        { ar: 'تحت الميّة', en: 'Under Water', speed: 110, d: 0.45, steps: ['fan', 'calm', 'orbit', '|', 'fan', 'bumper', '|', 'orbit', 'fan'] },
        { ar: 'التيار', en: 'The Current', speed: 115, d: 0.5, steps: [{ fanChain: 3 }, '|', 'fly', 'orbit', '|', { fanChain: 4 }, 'fly'] },
        { ar: 'الدوّامة', en: 'Whirlpool', speed: 118, d: 0.58, steps: ['orbit', 'orbit', '|', 'bumper', 'orbit', 'fan', '|', 'orbit', 'orbit', 'bumper'] },
        { ar: 'الشعاب', en: 'The Reef', speed: 124, d: 0.68, steps: [{ fanChain: 4 }, '|', 'orbit', 'bumper', 'catch', '|', 'orbit', 'fan', 'orbit', '|', { ladder: 6 }, 'bumper'] },
        { ar: 'عرش الأعماق', en: 'Abyss Throne', speed: 132, d: 0.82, gauntlet: true, steps: ['orbit', 'bumper', '|', { fanChain: 5 }, 'orbit', '|', 'bumper', 'bumper', 'orbit', '|', { ladder: 7 }, 'fly', '|', 'orbit', 'fly', 'orbit', { coinArt: 'heart' }] }
      ]
    },
    {
      world: 'sky', ar: 'معبد السماء', en: 'Sky Temple',
      levels: [
        { ar: 'سحاب', en: 'Clouds', speed: 112, d: 0.5, steps: ['lift', 'calm', 'pend', '|', 'blink', 'lift', '|', 'dash', 'pend'] },
        { ar: 'البندول', en: 'Pendulums', speed: 116, d: 0.55, steps: [{ pendRow: 3 }, '|', 'fly', 'dash', '|', { pendRow: 4 }, 'fly'] },
        { ar: 'تتابع المصاعد', en: 'Lift Relay', speed: 120, d: 0.6, steps: [{ liftRelay: 3 }, '|', 'pend', 'blink', '|', { liftRelay: 4 }, 'dash'] },
        { ar: 'رياح عالية', en: 'High Winds', speed: 126, d: 0.7, steps: ['dash', 'pend', 'lift', '|', { pendRow: 4 }, 'blink', '|', { liftRelay: 4 }, 'dash', '|', 'crumble', { pendRow: 5 }] },
        { ar: 'قمة المعبد', en: 'Temple Peak', speed: 135, d: 0.85, gauntlet: true, steps: [{ liftRelay: 3 }, 'pend', '|', 'dash', 'blink', 'blink', '|', { pendRow: 5 }, 'lift', '|', { ladder: 7 }, 'fly', '|', { liftRelay: 5 }, 'fly', { pendRow: 4 }, { coinArt: 'star' }] }
      ]
    },
    {
      world: 'ice', ar: 'القمم المتجمدة', en: 'Frozen Peaks',
      levels: [
        { ar: 'جليد', en: 'Ice', speed: 118, d: 0.6, steps: ['crumble', 'saw', '|', 'fly', 'gateSpike', '|', 'crumble', 'zigzag', 'fly'] },
        { ar: 'عاصفة ثلج', en: 'Blizzard', speed: 124, d: 0.7, steps: [{ weave: 4 }, '|', 'saw', 'orbit', 'crumble', '|', 'gatePair', 'laser', '|', { popRhythm: 4 }, 'saw'] },
        { ar: 'الجسر المتجمد', en: 'Frozen Bridge', speed: 128, d: 0.78, steps: [{ ladder: 7 }, '|', 'crumble', 'fly', 'saw', '|', { liftRelay: 4 }, '|', 'fly', { sawHall: 4 }] },
        { ar: 'الانهيار', en: 'Avalanche', speed: 134, d: 0.88, steps: ['dash', 'zigzag', '|', { moverWave: 5 }, '|', 'laser', 'gateSpike', 'crumble', '|', { fanChain: 4 }, 'orbit', '|', { pendRow: 4 }, { weave: 4 }] },
        { ar: 'القمة', en: 'The Summit', speed: 134, d: 1, gauntlet: true, steps: ['zigzag', { weave: 4 }, '|', { ladder: 8 }, '|', { moverWave: 5 }, 'laser', '|', { popRhythm: 5 }, 'calm', { sawHall: 3 }, '|', 'crumble', 'crumble', 'orbit', '|', { liftRelay: 4 }, { pendRow: 4 }, '|', { fanChain: 4 }, 'fly', '|', 'gatePair', 'gateSpike', 'fly', { coinArt: 'crown' }] }
      ]
    }
  ];

  // b55 — NOVA RUSH (Amir: 'levels like Geometry Dash, many different obstacles, hand-made'): five dense levels,
  // a tap every beat, the look changes world mid-level, checkpoints every 3-4 pieces. Open from the start.
  const P = (x) => ({ pat: x });
  W.push({
    world: 'neon', ar: 'نوفا راش', en: 'Nova Rush', free: true,
    levels: [
      { ar: 'نبض', en: 'Pulse', speed: 112, d: 0.35, steps: [P('run:steady'), 'spikeF', P('run:gallop'), '|', P('stairs'), 'zigzag', P('run:triplet'), '|', P('chain'), 'gateSpike', P('run:swing'), { coinArt: 'arrow' }] },
      { ar: 'إيقاع التروس', en: 'Clockwork Beat', speed: 118, d: 0.45, steps: [{ world: 'clock' }, 'piston', P('run:gallop'), 'saw', '|', 'jaws', P('run:stop'), 'firebar', '|', { sawHall: 3 }, P('run:long'), 'gateSpike', P('stairs')] },
      { ar: 'تحوّل المنشور', en: 'Prism Shift', speed: 122, d: 0.55, steps: [{ world: 'mirror' }, P('phase'), 'gatePair', P('chain'), '|', { ladder: 5 }, P('twin'), P('run:triplet'), '|', { world: 'glitch' }, 'blink', 'laser', P('chain'), 'lock', P('run:gallop')] },
      { ar: 'لحن الحمم', en: 'Molten Tempo', speed: 126, d: 0.65, steps: [{ world: 'volcano' }, 'geyser', P('run:steady'), 'meteor', '|', { popRhythm: 4 }, P('rush'), 'piston', '|', { world: 'ocean' }, 'pend', { pendRow: 3 }, 'orbit', P('run:swing'), '|', 'snake', P('stairs')] },
      { ar: 'سوبرنوفا', en: 'Supernova', speed: 130, d: 0.8, gauntlet: true, steps: [P('run:gallop'), 'piston', P('chain'), '|', { world: 'glitch' }, 'laser', P('rush'), 'blink', P('twin'), '|', { world: 'ice' }, 'saw', 'jaws', P('stairs'), { sawHall: 4 }, '|', { world: 'sky' }, { speed: 142 }, 'firebar', P('run:stop'), 'snake', P('chain'), '|', { weave: 4 }, P('rush'), { coinArt: 'star' }] }
    ]
  });

  const LIST = [];
  W.forEach((w, wi) => {
    w.levels.forEach((lv, li) => {
      LIST.push(Object.assign({ id: 'c' + (wi + 1) + '-' + (li + 1), wi, li, world: w.world, label: (wi + 1) + '-' + (li + 1) }, lv));
    });
  });
  FF.CAMPAIGN = { worlds: W, list: LIST, byId: (id) => LIST.find((l) => l.id === id) };

  // 🎓 TUTORIAL — the very first run: slow, one obstacle at a time with a calm stretch between, a hint for each.
  // It never counts (no score, no board); you can't lose it — a crash puts you back at the last checkpoint.
  FF.TUTORIAL = {
    id: 'tutorial', label: 'TUTORIAL', en: 'Tutorial', ar: 'التدريب', world: 'neon', speed: 92, d: 0, ramp: 0, tutorial: true,
    steps: ['calm', 'calm', 'spikeF', '|', 'calm', 'spikeC', '|', 'calm', 'calm', 'spikeF', '|', 'calm', 'zigzag', '|', 'calm', 'calm', 'trajectory', '|', 'calm', { coinArt: 'star' }]
  };

  // build 36: the Path of the Legend is gone (save.legend stays in the save untouched)

})(window.FF);
