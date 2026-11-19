// =====================================================================================
//  FLIPNOVA — STAGE BOOK   (كتاب المراحل)
//  This is the simple "engine" file for Endless and Daily: every stage of a run is one entry below.
//  Change a number, add a stage, move obstacles around — save, then reload the game. That's it.
//  هنا تقدر تعدل كل مرحلة بإيدك: السرعة، العقبات، العالم، المود، والنهاية الصعبة.
//
//  A stage is 300m (3000 px) unless it sets `len`. Fields:
//    name / nameAr  what the stage banner says
//    world          neon clock mirror candy glitch volcano ocean sky ice  desert nebula jungle (b61)
//    speed          how fast the run is in this stage (112 = start, 218 = the most a human can handle)
//    hard           0 … 1  how mean each obstacle is (more spikes, tighter gaps, faster saws)
//    mix            which obstacles appear and how often (bigger number = more often)
//    breather       how many obstacles in a row before a short calm stretch (bigger = harder)
//    mod            none lowgrav heavy turbo goldrush tight
//    rift           true = a portal to a bonus world appears in this stage
//    (crumble is skipped automatically in heavy-gravity stages, lift in low-gravity ones — they'd be unfair there)
//    finale         obstacles played back-to-back (no calm) at the end of the stage — the stage "boss"
//    len            (optional) how long the stage is in px (1200 … 6000, default 3000). The stage ends when its finale ends.
//    open           (optional) up to 4 obstacles played first when the stage starts — its opening set piece
//    roomy          (optional) true = taps spread out as the game speeds up late in a run (the b61 worlds use it)
//
//  Obstacles you can use in mix / finale:
//    spikeF spikeC trajectory zigzag gate gatePair gateSpike fork catch mover pad laser lock
//    dash fan pop saw lift bumper crumble orbit pend blink fly piston jaws geyser
//    firebar snake meteor bouncer   (new: spinning fire bar, electric snake, falling meteors, bouncing spike ball)
//    wind float heavy totem         (b61: sandstorm wind, gravity fields, flip totems)
//
//  After the last stage: comingSoon: true ends the run with COMING SOON; otherwise it loops back to `loop.from`, each lap faster.
//  Note: editing this file starts a new "season" on the world board — older runs were played on
//  different stages, so they stop showing (your own records on the device stay).
//  Test any stage fast in a browser: index.html?stage=7  (those runs never count).
// =====================================================================================
window.FF = window.FF || {};
window.FF.STAGE_BOOK = {
  stages: [
    { name: 'WARM UP', nameAr: 'التسخين', world: 'neon', speed: 112, hard: 0.27, breather: 4, len: 1500,
      open: ['dash', 'zigzag'],
      mix: { spikeF: 2, spikeC: 2, trajectory: 1, zigzag: 1, pad: 1, piston: 1, gate: 1, dash: 1 },
      finale: ['piston', 'spikeC', 'gate'] },

    { name: 'GEAR UP', nameAr: 'دوّر التروس', world: 'clock', speed: 130, hard: 0.42, breather: 5,
      mix: { gate: 2, zigzag: 1, pad: 1, dash: 1, piston: 2, spikeC: 1 },
      finale: ['gate', 'piston', 'zigzag', 'piston'] },

    { name: 'MIRROR MAZE', nameAr: 'متاهة المرايا', world: 'mirror', speed: 148, hard: 0.54, breather: 7, rift: true,
      mix: { fork: 2, catch: 2, gatePair: 2, trajectory: 1, pop: 1 },
      finale: ['fork', 'gatePair', 'catch', 'pop'] },

    { name: 'SUGAR RUSH', nameAr: 'هوس السكر', world: 'candy', speed: 158, hard: 0.54, breather: 8, mod: 'lowgrav',
      mix: { pad: 1, bumper: 1, fan: 2, dash: 2, gate: 2 },
      finale: ['bumper', 'fan', 'pad', 'dash'] },

    { name: 'GLITCH STORM', nameAr: 'عاصفة الخلل', world: 'glitch', speed: 171, hard: 0.68, breather: 9, rift: true,
      mix: { blink: 2, pop: 2, laser: 2, snake: 2, lock: 1, gateSpike: 1 },
      finale: ['blink', 'snake', 'laser', 'pop', 'blink'] },

    { name: 'LAVA RUN', nameAr: 'جري في الحمم', world: 'volcano', speed: 172, hard: 0.68, breather: 8, mod: 'heavy',
      mix: { geyser: 3, meteor: 2, piston: 2, spikeF: 1, gate: 1 },
      finale: ['geyser', 'meteor', 'spikeF', 'geyser', 'piston'] },

    { name: 'THE ABYSS', nameAr: 'الهاوية', world: 'ocean', speed: 174, hard: 0.74, breather: 8, rift: true,
      mix: { mover: 2, orbit: 2, pend: 2, fly: 1, catch: 1 },
      finale: ['orbit', 'pend', 'mover', 'orbit'] },

    { name: 'SKY TRIAL', nameAr: 'اختبار السما', world: 'sky', speed: 176, hard: 0.8, breather: 8,
      mix: { fly: 1, fan: 2, bouncer: 2, lift: 1, trajectory: 2, bumper: 1 },
      finale: ['bouncer', 'fan', 'fly', 'lift'] },

    { name: 'FROSTBITE', nameAr: 'لسعة التلج', world: 'ice', speed: 178, hard: 0.86, breather: 9, mod: 'tight', rift: true,
      mix: { crumble: 2, saw: 2, jaws: 2, zigzag: 1 },
      finale: ['saw', 'jaws', 'crumble', 'saw'] },

    { name: 'SAW FACTORY', nameAr: 'مصنع المناشير', world: 'clock', speed: 180, hard: 0.92, breather: 9,
      mix: { saw: 3, firebar: 2, jaws: 2, piston: 2, gateSpike: 1 },
      finale: ['jaws', 'firebar', 'saw', 'piston', 'jaws', 'saw'] },

    { name: 'NEON OVERDRIVE', nameAr: 'نيون بأقصى سرعة', world: 'neon', speed: 181, hard: 0.97, breather: 9, mod: 'turbo', rift: true,
      mix: { gateSpike: 2, pop: 2, lock: 1, dash: 2, zigzag: 1 },
      finale: ['pop', 'gateSpike', 'dash', 'pop'] },

    { name: 'GOLD FEVER', nameAr: 'حمّى الدهب', world: 'candy', speed: 183, hard: 1, breather: 9, mod: 'goldrush',
      mix: { pop: 2, bumper: 2, bouncer: 2, pend: 1, orbit: 1, fork: 1, geyser: 1 },
      finale: ['pop', 'orbit', 'bouncer', 'bumper', 'pend'] },

    { name: 'MIRROR HELL', nameAr: 'جحيم المرايا', world: 'mirror', speed: 185, hard: 1, breather: 9, rift: true,
      mix: { fork: 2, catch: 2, gatePair: 2, blink: 2, lock: 1 },
      finale: ['gatePair', 'blink', 'fork', 'catch', 'blink'] },

    { name: 'MELTDOWN', nameAr: 'الانصهار', world: 'volcano', speed: 186, hard: 1, breather: 10, mod: 'heavy',
      mix: { geyser: 2, meteor: 2, pop: 2, piston: 2, gateSpike: 1, jaws: 1 },
      finale: ['meteor', 'geyser', 'piston', 'gateSpike', 'jaws', 'meteor'] },

    { name: 'DEEP PRESSURE', nameAr: 'ضغط الأعماق', world: 'ocean', speed: 187, hard: 1, breather: 10, rift: true,
      mix: { pend: 2, orbit: 2, snake: 2, mover: 2, fly: 1, saw: 1 },
      finale: ['pend', 'snake', 'orbit', 'saw', 'mover', 'pend'] },

    { name: 'STORM TEMPLE', nameAr: 'معبد العاصفة', world: 'sky', speed: 188, hard: 1, breather: 10, mod: 'lowgrav',
      mix: { fly: 2, fan: 2, bumper: 1, pad: 1, trajectory: 1 },
      finale: ['fly', 'pad', 'fan', 'fly'] },

    { name: 'BLACK ICE', nameAr: 'التلج الأسود', world: 'ice', speed: 189, hard: 1, breather: 10, mod: 'tight', rift: true,
      mix: { saw: 2, crumble: 2, jaws: 2, zigzag: 1, gateSpike: 1 },
      finale: ['saw', 'crumble', 'jaws', 'saw', 'zigzag'] },

    { name: 'CHAOS ENGINE', nameAr: 'محرك الفوضى', world: 'glitch', speed: 189, hard: 1, breather: 11,
      mix: { blink: 1, pop: 1, saw: 1, jaws: 1, geyser: 1, piston: 1, orbit: 1, pend: 1, gateSpike: 1, fork: 1, crumble: 1, firebar: 1, snake: 1, meteor: 1, bouncer: 1 },
      finale: ['blink', 'firebar', 'jaws', 'orbit', 'meteor', 'pop', 'snake', 'saw'] },

    { name: 'NEON ECLIPSE', nameAr: 'كسوف النيون', world: 'neon', speed: 189, hard: 1, breather: 11, rift: true,
      mix: { catch: 2, mover: 2, blink: 2, spikeC: 1 },
      finale: ['catch', 'mover', 'spikeC', 'blink', 'catch'] },

    { name: 'CRYSTAL CRUSH', nameAr: 'سحق الكريستال', world: 'ice', speed: 189, hard: 1, breather: 11,
      mix: { piston: 2, firebar: 2, gate: 2, crumble: 2, trajectory: 1 },
      finale: ['piston', 'firebar', 'gate', 'crumble', 'trajectory', 'firebar'] },

    { name: 'SUGAR STORM', nameAr: 'عاصفة السكر', world: 'candy', speed: 189, hard: 1, breather: 11, mod: 'heavy', rift: true,
      mix: { bumper: 2, jaws: 2, blink: 2, fan: 1 },
      finale: ['bumper', 'jaws', 'blink', 'fan', 'jaws'] },

    { name: 'THE LAST DOOR', nameAr: 'الباب الأخير', world: 'mirror', speed: 188, hard: 1, breather: 12, mod: 'goldrush',
      mix: { orbit: 2, geyser: 2, fly: 2, firebar: 1, snake: 1, meteor: 1, bouncer: 1, gatePair: 1, dash: 1 },
      finale: ['fly', 'firebar', 'orbit', 'bouncer', 'geyser', 'snake', 'gatePair', 'meteor', 'dash', 'orbit'] },

    // ---- b61: three NEW worlds behind THE LAST DOOR (each one has its own obstacle that works differently) ----
    // SANDSTORM DUNES — wind: a TAILWIND carries you faster (quicker taps), a HEADWIND holds you back (closer spikes)
    { name: 'SANDSTORM', nameAr: 'العاصفة الرملية', world: 'desert', speed: 189, hard: 0.9, breather: 10, roomy: true,
      open: ['wind'],
      mix: { wind: 3, saw: 1, spikeF: 1, spikeC: 1, firebar: 1 },
      finale: ['wind', 'saw', 'wind', 'firebar'] },

    { name: 'DUNE FURY', nameAr: 'غضب الكثبان', world: 'desert', speed: 190, hard: 1, breather: 10, roomy: true,
      mix: { wind: 3, meteor: 1, jaws: 1, geyser: 1, zigzag: 1 },
      finale: ['wind', 'meteor', 'wind', 'jaws'] },

    // NEBULA DRIFT — gravity fields: FLOAT (weak gravity, slow flips — tap early), HEAVY (strong gravity, snappy flips)
    { name: 'NEBULA DRIFT', nameAr: 'سديم المجرة', world: 'nebula', speed: 190, hard: 0.92, breather: 10, roomy: true,
      open: ['float'],
      mix: { float: 2, heavy: 2, orbit: 1, meteor: 1, snake: 1 },
      finale: ['heavy', 'orbit', 'float', 'snake'] },

    { name: 'EVENT HORIZON', nameAr: 'أفق الحدث', world: 'nebula', speed: 191, hard: 1, breather: 11, roomy: true,
      mix: { float: 2, heavy: 2, orbit: 1, bouncer: 1, laser: 1 },
      finale: ['float', 'bouncer', 'heavy', 'orbit'] },

    // JUNGLE RUINS — totems flip you for free: spikes where it throws you = tap, spikes where you were = don't
    { name: 'JUNGLE RUINS', nameAr: 'أطلال الغابة', world: 'jungle', speed: 191, hard: 0.95, breather: 10, roomy: true,
      open: ['totem'],
      mix: { totem: 3, saw: 1, mover: 1, zigzag: 1, pend: 1 },
      finale: ['totem', 'saw', 'totem', 'mover'] },

    { name: 'TEMPLE OF FLIPS', nameAr: 'معبد القلبات', world: 'jungle', speed: 192, hard: 1, breather: 12, roomy: true, mod: 'goldrush',
      mix: { totem: 3, wind: 2, float: 1, heavy: 1, jaws: 1, firebar: 1 },
      finale: ['totem', 'wind', 'heavy', 'float', 'totem'] }
  ],
  // after the last stage the run ends: "COMING SOON" (set comingSoon: false to loop back to stage `loop.from` instead)
  comingSoon: true,
  loop: { from: 10, speedStep: 1, cap: 218 }
};
