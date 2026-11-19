// FLIPNOVA — STAGE MAKER (owner only): edit the Endless stage book with buttons, play any stage, let the
// "human" bot check it can be beaten, then publish it to every player — no app update needed.
(function (FF) {
  'use strict';
  const UI = FF.UI;
  const $ = (s) => document.querySelector(s);
  const t = (k) => UI.t(k);
  const SM = {};
  FF.StageMaker = SM;

  // every obstacle with a little symbol and its name
  const OBS = {
    spikeF: ['▲', 'Floor spikes', 'شوك أرض'], spikeC: ['▼', 'Ceiling spikes', 'شوك سقف'], zigzag: ['≋', 'Zigzag', 'زجزاج'],
    trajectory: ['⤴', 'Coin arc', 'قوس عملات'], gate: ['▮', 'Gate', 'بوابة'], gatePair: ['▮▮', 'Double gate', 'بوابتين'],
    gateSpike: ['▮▲', 'Spike gate', 'بوابة بشوك'], fork: ['⑂', 'Fork', 'طريقين'], catch: ['◧', 'Colour platform', 'منصة ملونة'],
    mover: ['↕', 'Mover', 'بلوك متحرك'], pad: ['⏫', 'Jump pad', 'نطّاطة'], laser: ['⚡', 'Laser', 'ليزر'],
    lock: ['🔒', 'No-flip zone', 'ممنوع القلب'], dash: ['»', 'Speed gate', 'بوابة سرعة'], fan: ['🌀', 'Fan', 'مروحة'],
    pop: ['⇡', 'Pop spikes', 'شوك طالع'], saw: ['⚙', 'Saw', 'منشار'], lift: ['⇅', 'Lift', 'أسانسير'],
    bumper: ['◎', 'Bumpers', 'سست'], crumble: ['▧', 'Crumbling floor', 'أرض بتقع'], orbit: ['◌', 'Orbit ball', 'كورة بتلف'],
    pend: ['ϕ', 'Pendulum', 'بندول'], blink: ['◫', 'Blink bridge', 'كوبري بيختفي'], fly: ['✈', 'Flying', 'طيران'],
    piston: ['⬍', 'Pistons', 'مكابس'], jaws: ['⩘', 'Jaws', 'فكوك'], geyser: ['🔥', 'Fire geyser', 'نافورة نار'],
    firebar: ['✺', 'Firebar', 'ذراع نار'], snake: ['〰', 'Electric snake', 'ثعبان كهربا'], meteor: ['☄', 'Meteors', 'نيازك'], bouncer: ['⚡', 'Bouncer', 'كورة طايشة']
  };
  const MODS = ['none', 'lowgrav', 'heavy', 'turbo', 'goldrush', 'tight'];
  const MODN = { none: ['—', '—'], lowgrav: ['Low gravity', 'جاذبية خفيفة'], heavy: ['Heavy', 'جاذبية تقيلة'], turbo: ['Turbo', 'تيربو'], goldrush: ['Gold ×2', 'دهب ×2'], tight: ['Tight', 'زحمة'] };
  const S = {
    ar: {
      title: '🛠 صانع المراحل', add: '+ مرحلة', publish: '🌍 انشر للكل', reset: '↺ رجّع المنشور', back: 'رجوع', stage: 'مرحلة',
      name: 'الاسم', world: 'العالم', speed: 'السرعة', hard: 'الصعوبة', breather: 'استراحة كل', mod: 'المود', rift: 'بوابة عالم مؤقت',
      obstacles: 'العقبات (دوس عشان تزوّد — 0 يعني مقفولة)', finale: 'النهاية الصعبة (دوس عليها تشيلها)', addFinale: '+ زوّد للنهاية',
      play: '▶ العبها', check: '🤖 اختبرها', dup: '⧉ نسخة', del: '🗑 امسح', left: '◀', right: '▶',
      checking: '🤖 بيجرب زي لاعب حقيقي… {a}/{b}', fair: '✓ لاعب حقيقي يقدر يعدّيها ({n}/{m})',
      hardOk: '⚠ صعبة جدًا: عدّاها {n}/{m} — بيموت عند {d}م ({c})', unfair: '✗ غالبًا مستحيلة: بيموت عند {d}م ({c}) — قلّل السرعة أو الصعوبة',
      code: 'كودك السري', confirm: 'انشر', published: '🌍 اتنشرت! كل اللاعيبة هياخدوها أول ما يفتحوا اللعبة',
      denied: 'الكود غلط', nosrv: 'شغّل tools/supabase-v9.sql في Supabase الأول', limit: 'محاولات كتير — استنى ساعة', offline: 'محتاج نت عشان تنشر',
      draft: 'مسودة — مش منشورة', live: '✓ دي اللي الكل بيلعبها', keepOne: 'لازم تفضل مرحلة واحدة على الأقل', resetDone: 'رجعت للنسخة المنشورة',
      loop: 'بعد آخر مرحلة: يلف من المرحلة', warn: 'ملاحظات: ', ending: 'بعد آخر مرحلة', endSoon: '🏁 COMING SOON', endLoop: '↻ يلف تاني',
      undo: '↶ رجوع', redo: '↷ تقدّم', undoNone: 'مفيش حاجة ترجعها', surprise: '🎲 فاجئني', surprised: '🎲 مرحلة جديدة عشوائية — جرّبها!',
      testAll: '🤖 اختبر الكل', testAllRun: '🤖 بيختبر المرحلة {a} من {b}…', testAllDone: '🤖 خلص: ✓ {ok}  ⚠ {hard}  ✗ {bad} — دوس على أي مرحلة تشوفها',
      exp: '📤 صدّر', imp: '📥 استورد', expNote: 'ده كود كل المراحل — انسخه واحفظه أو ابعته:', copy: '📋 انسخ', copied: '📋 اتنسخ',
      impNote: 'الصق كود المراحل هنا:', load: 'حمّل', impOk: '📥 اتحمّلت المراحل (مسودة — جرّبها قبل ما تنشر)', impBad: 'الكود ده مش كود مراحل',
      reviews: '⭐ آراء اللاعيبة', watchEnd: '🏁 شوف النهاية', graph: 'السرعة اللي بتحسها في كل مرحلة (اللون = الصعوبة) — دوس على عمود تفتح مرحلته',
      app: 'Flippo Maker', hello: 'أهلا يا أمير 👋 كمّل من المرحلة {n}',
      bk: '🕘 نسخ', bkNote: 'نسخ احتياطية بتتعمل لوحدها (كل ما تفتح، وكل 5 دقايق شغل). دوس على نسخة ترجعلها:', bkNone: 'لسه مفيش نسخ — بتتعمل لوحدها وانت شغال', bkOk: '🕘 رجعت للنسخة دي (واللي كانت قبلها اتحفظت نسخة)', stagesN: 'مرحلة',
      notes: '📝 أفكاري', notesNote: 'أفكارك ومهامك — ليك انت بس، بتتحفظ لوحدها:', notesPh: 'مثلا: مرحلة 12 محتاجة استراحة أطول…', lang: 'EN',
      tUndo: 'رجوع', tRedo: 'تقدّم', tTestAll: 'اختبر كل المراحل', tSurprise: 'فاجئني: مرحلة عشوائية', tExp: 'صدّر كل المراحل كود', tImp: 'استورد كود مراحل', tEnd: 'شوف النهاية', tReset: 'رجّع المنشور'
    },
    en: {
      title: '🛠 Stage Maker', add: '+ Stage', publish: '🌍 Publish to everyone', reset: '↺ Back to published', back: 'Back', stage: 'Stage',
      name: 'Name', world: 'World', speed: 'Speed', hard: 'Difficulty', breather: 'Breather every', mod: 'Twist', rift: 'Rift portal',
      obstacles: 'Obstacles (tap to add more — 0 = off)', finale: 'Finale (tap one to remove it)', addFinale: '+ Add to finale',
      play: '▶ Play it', check: '🤖 Test it', dup: '⧉ Copy', del: '🗑 Delete', left: '◀', right: '▶',
      checking: '🤖 Playing it like a real person… {a}/{b}', fair: '✓ A real player can beat this ({n}/{m})',
      hardOk: '⚠ Very hard: cleared {n}/{m} — dies at {d}m ({c})', unfair: '✗ Probably impossible: dies at {d}m ({c}) — lower the speed or difficulty',
      code: 'Your secret code', confirm: 'Publish', published: '🌍 Published! Every player gets it the next time they open the game',
      denied: 'Wrong code', nosrv: 'Run tools/supabase-v9.sql in Supabase first', limit: 'Too many tries — wait an hour', offline: 'You need internet to publish',
      draft: 'Draft — not published', live: '✓ This is what everyone plays', keepOne: 'Keep at least one stage', resetDone: 'Back to the published stages',
      loop: 'After the last stage, loop from stage', warn: 'Notes: ', ending: 'After the last stage', endSoon: '🏁 COMING SOON', endLoop: '↻ Loop again',
      undo: '↶ Undo', redo: '↷ Redo', undoNone: 'Nothing to undo', surprise: '🎲 Surprise me', surprised: '🎲 A brand-new random stage — try it!',
      testAll: '🤖 Test all', testAllRun: '🤖 Testing stage {a} of {b}…', testAllDone: '🤖 Done: ✓ {ok}  ⚠ {hard}  ✗ {bad} — tap any stage to see it',
      exp: '📤 Export', imp: '📥 Import', expNote: 'This code holds every stage — copy it to keep it or send it:', copy: '📋 Copy', copied: '📋 Copied',
      impNote: 'Paste a stage code here:', load: 'Load', impOk: '📥 Stages loaded (a draft — test them before you publish)', impBad: 'That is not a stage code',
      reviews: '⭐ Player reviews', watchEnd: '🏁 Watch the ending', graph: 'How fast each stage feels (colour = difficulty) — tap a bar to open its stage',
      app: 'Flippo Maker', hello: 'Hi Amir 👋 back to stage {n}',
      bk: '🕘 Backups', bkNote: 'Backups are made by themselves (every time you open, and every 5 minutes of work). Tap one to go back to it:', bkNone: 'No backups yet — they are made while you work', bkOk: '🕘 Restored (what you had was backed up first)', stagesN: 'stages',
      notes: '📝 Notes', notesNote: 'Your ideas and to-dos — only for you, saved by themselves:', notesPh: 'e.g. stage 12 needs a longer breather…', lang: 'ع',
      tUndo: 'Undo', tRedo: 'Redo', tTestAll: 'Test every stage', tSurprise: 'Surprise me: a random stage', tExp: 'Export all stages as a code', tImp: 'Import a stage code', tEnd: 'Watch the ending', tReset: 'Back to published'
    }
  };
  const L = (k) => (S[UI.lang()] || S.en)[k];
  const obsName = (n) => (OBS[n] ? OBS[n][UI.lang() === 'ar' ? 2 : 1] : n);

  // the draft is plain data in the save, so nothing is lost if the app closes mid-edit
  const raw = (book) => FF.bookRaw(book);
  function draft() {
    if (!FF.save.stageDraft || !Array.isArray(FF.save.stageDraft.stages) || !FF.save.stageDraft.stages.length) FF.save.stageDraft = raw(FF.BOOK);
    return FF.save.stageDraft;
  }
  // ↶ ↷ every change is kept in a history (quick changes in a row, like dragging a slider, count as one)
  let hist = [], hp = -1, lastRec = 0, fair = {};
  function record() {
    const snap = JSON.stringify(draft()), now = Date.now();
    if (hist[hp] === snap) return;
    fair = {}; // the stages changed: old test results no longer apply
    if (now - lastRec < 700 && hp > 0) hist[hp] = snap;
    else { hist = hist.slice(0, hp + 1).concat([snap]).slice(-80); hp = hist.length - 1; }
    lastRec = now;
  }
  function travel(dir) {
    const j = hp + dir;
    if (j < 0 || j >= hist.length) { UI.toast(L('undoNone')); return; }
    hp = j; lastRec = 0;
    FF.save.stageDraft = JSON.parse(hist[hp]);
    UI.persist();
    cur = Math.min(cur, draft().stages.length - 1);
    render();
  }
  const keep = () => { FF.save.smCur = cur; UI.persist(); record(); autoSnap(); };
  // 🕘 automatic backups of the whole draft (their own storage, so they never fill the save): on open and every 5 minutes of work
  const SNAP_KEY = 'flipnova.makerSnaps';
  let lastSnap = 0;
  function snaps() { try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); } catch (e) { return []; } }
  function snapNow() {
    const list = snaps(), data = JSON.stringify(draft());
    lastSnap = Date.now();
    if (list.length && list[0].d === data) return;
    list.unshift({ t: Date.now(), d: data });
    try { localStorage.setItem(SNAP_KEY, JSON.stringify(list.slice(0, 15))); } catch (e) { /* full: keep going without */ }
  }
  function autoSnap() { if (Date.now() - lastSnap > 5 * 60 * 1000) snapNow(); }
  SM.snaps = snaps;
  const isLive = () => FF.compileBook(draft()).id === FF.BOOK.id;
  let cur = 0, checkRun = null;

  // Android back inside the Maker app: close the code box first, otherwise leave the app
  SM.back = function () {
    const box = $('#smPublish');
    if (box && !box.classList.contains('hidden')) { box.classList.add('hidden'); return true; }
    return false;
  };

  SM.open = function () {
    draft();
    if (!hist.length) { hist = [JSON.stringify(draft())]; hp = 0; }
    if (!SM.opened) { SM.opened = true; cur = FF.save.smCur || 0; snapNow(); if (FF.MAKER_APP && cur > 0) setTimeout(() => UI.toast(L('hello').replace('{n}', cur + 1)), 600); }
    cur = Math.min(cur, draft().stages.length - 1);
    UI.show('stageMaker');
    render();
  };

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function button(label, cls, fn) { const b = el('button', cls || 'btn ghost small', label); b.onclick = () => { UI.sound('ui'); fn(); }; return b; }

  function render() {
    const D = draft();
    $('#smTitle').textContent = FF.MAKER_APP ? '🛠 ' + L('app') : L('title');
    // left: the list of stages
    const list = $('#smList');
    list.innerHTML = '';
    D.stages.forEach((s, i) => {
      const w = FF.worldById(s.world);
      const b = el('button', 'smStage' + (i === cur ? ' on' : ''));
      b.style.borderColor = i === cur ? '#ffd23f' : w.edge;
      b.style.background = 'linear-gradient(90deg,' + w.surface.base + ',' + w.surface.dark + ')';
      const f = fair[i];
      b.innerHTML = '<b>' + (i + 1) + '</b><span></span><small>' + (f ? (f === 'ok' ? '✓ ' : f === 'hard' ? '⚠ ' : '✗ ') : '') + Math.round(s.speed) + '</small>';
      b.querySelector('span').textContent = UI.lang() === 'ar' && s.nameAr ? s.nameAr : s.name;
      b.onclick = () => { UI.sound('ui'); cur = i; stopCheck(); render(); };
      list.appendChild(b);
    });
    const side = $('#smSideBtns');
    side.innerHTML = '';
    side.appendChild(button(L('add'), 'btn small', () => {
      const last = D.stages[D.stages.length - 1];
      D.stages.push(Object.assign(JSON.parse(JSON.stringify(last)), { name: 'STAGE ' + (D.stages.length + 1), nameAr: '', speed: Math.min(218, last.speed + 2) }));
      cur = D.stages.length - 1; keep(); render();
    }));
    side.appendChild(button(L('publish'), 'btn small gold', askPublish));
    // the tools as one row of icons (long names live in the tooltip) so nothing is squeezed
    const icons = el('div', 'smIcons');
    const ic = (label, tip, fn) => { const b = button(label, 'btn ghost small sq', fn); b.title = tip; icons.appendChild(b); };
    ic('↶', L('tUndo'), () => travel(-1));
    ic('↷', L('tRedo'), () => travel(1));
    ic('🤖', L('tTestAll'), testAll);
    ic('🎲', L('tSurprise'), surprise);
    ic('📤', L('tExp'), exportBox);
    ic('📥', L('tImp'), importBox);
    ic('🕘', L('bk'), backupsBox);
    ic('📝', L('notes'), notesBox);
    ic('🏁', L('tEnd'), () => { stopCheck(); UI.watchEnding(); });
    // ⏪ every stage back to the original book that ships inside the game (the stable version) — one tap, then 🌍 publish
    ic('⏪', UI.lang() === 'ar' ? 'كل المراحل للأصل (النسخة القديمة المستقرة)' : 'All stages back to the original (the stable version)', () => {
      snapNow();
      FF.save.stageDraft = FF.bookRaw(FF.compileBook(FF.STAGE_BOOK)); cur = 0; keep();
      UI.toast(UI.lang() === 'ar' ? '⏪ كل المراحل رجعت للأصل — دوس 🌍 انشر للكل عشان توصل للاعيبة' : '⏪ Every stage is back to the original — tap 🌍 Publish to send it to players');
      render();
    });
    ic('↺', L('tReset'), () => { snapNow(); FF.save.stageDraft = raw(FF.BOOK); keep(); UI.toast(L('resetDone')); render(); });
    if (FF.MAKER_APP) ic(L('lang'), 'Language', () => { FF.save.settings.lang = UI.lang() === 'ar' ? 'en' : 'ar'; UI.persist(); UI.applyLang && UI.applyLang(); render(); });
    side.appendChild(icons);
    if (!FF.MAKER_APP) side.appendChild(button(L('back'), 'btn ghost small', () => { stopCheck(); UI.show('settings'); }));
    $('#smState').textContent = isLive() ? L('live') : L('draft');
    $('#smState').classList.toggle('warn', !isLive());
    renderStage();
  }

  function renderStage() {
    const D = draft(), s = D.stages[cur], box = $('#smMain');
    box.innerHTML = '';
    const ar = UI.lang() === 'ar';
    box.appendChild(graph());
    const changed = () => { keep(); $('#smState').textContent = isLive() ? L('live') : L('draft'); $('#smState').classList.toggle('warn', !isLive()); const b = $('#smList').children[cur]; if (b) { b.querySelector('span').textContent = ar && s.nameAr ? s.nameAr : s.name; b.querySelector('small').textContent = Math.round(s.speed); } };
    // name + the two big buttons
    const top = el('div', 'smTop');
    top.appendChild(el('b', 'smNum', L('stage') + ' ' + (cur + 1)));
    const nm = el('input', 'smName');
    nm.maxLength = 22;
    nm.value = ar ? s.nameAr || s.name : s.name;
    nm.oninput = () => { if (ar) s.nameAr = nm.value; else s.name = nm.value.toUpperCase().replace(/[^A-Z0-9 !?.-]/g, ''); changed(); };
    top.appendChild(nm);
    top.appendChild(button(L('play'), 'btn small play', play));
    top.appendChild(button(L('check'), 'btn small', check));
    box.appendChild(top);
    const res = el('p', 'smResult hidden');
    res.id = 'smResult';
    box.appendChild(res);
    // world
    const wr = row(L('world'));
    for (const w of FF.WORLDS) {
      const b = el('button', 'smWorld' + (s.world === w.id ? ' on' : ''));
      b.style.background = 'linear-gradient(180deg,' + w.surface.light + ',' + w.surface.base + ')';
      b.title = ar ? w.nameAr : w.name;
      b.textContent = w.idx;
      b.onclick = () => { UI.sound('ui'); s.world = w.id; changed(); render(); };
      wr.appendChild(b);
    }
    box.appendChild(wr);
    // sliders
    box.appendChild(slider(L('speed'), 100, 218, 1, s.speed, (v) => { s.speed = v; changed(); }, (v) => String(v)));
    box.appendChild(slider(L('hard'), 0, 100, 5, Math.round(s.hard * 100), (v) => { s.hard = v / 100; changed(); }, (v) => v + '%'));
    const br = row(L('breather'));
    const bv = el('b', 'smVal', String(s.breather));
    br.appendChild(button('−', 'btn ghost small sq', () => { s.breather = Math.max(1, s.breather - 1); bv.textContent = s.breather; changed(); }));
    br.appendChild(bv);
    br.appendChild(button('+', 'btn ghost small sq', () => { s.breather = Math.min(12, s.breather + 1); bv.textContent = s.breather; changed(); }));
    box.appendChild(br);
    // twist + rift
    const mr = row(L('mod'));
    for (const m of MODS) {
      const b = el('button', 'switch' + (s.mod === m ? ' on' : ''), MODN[m][ar ? 1 : 0]);
      b.onclick = () => { UI.sound('ui'); s.mod = m; changed(); renderStage(); };
      mr.appendChild(b);
    }
    const rb = el('button', 'switch' + (s.rift ? ' on' : ''), (s.rift ? '✓ ' : '') + L('rift'));
    rb.onclick = () => { UI.sound('ui'); s.rift = !s.rift; changed(); renderStage(); };
    mr.appendChild(rb);
    box.appendChild(mr);
    // obstacles: tap cycles 0 → 1 → 2 → 3 → 0
    box.appendChild(el('h4', 'smH', L('obstacles')));
    const grid = el('div', 'smGrid');
    for (const n of Object.keys(OBS)) {
      const w = s.mix[n] || 0;
      const b = el('button', 'smObs w' + Math.min(3, Math.round(w)));
      b.innerHTML = '<i></i><span></span><em></em>';
      b.querySelector('i').textContent = OBS[n][0];
      b.querySelector('span').textContent = obsName(n);
      b.querySelector('em').textContent = w ? '●'.repeat(Math.min(3, Math.round(w))) : '0';
      b.onclick = () => {
        UI.sound('ui');
        const nw = ((Math.round(s.mix[n] || 0)) + 1) % 4;
        if (nw) s.mix[n] = nw; else delete s.mix[n];
        if (!Object.keys(s.mix).length) s.mix[n] = 1; // a stage needs at least one obstacle
        changed(); renderStage();
      };
      grid.appendChild(b);
    }
    box.appendChild(grid);
    // finale
    box.appendChild(el('h4', 'smH', L('finale')));
    const fr = el('div', 'smFinale');
    s.finale.forEach((n, i) => {
      const c = el('button', 'smChip', OBS[n] ? OBS[n][0] + ' ' + obsName(n) + ' ✕' : n);
      c.onclick = () => { UI.sound('uiBack'); s.finale.splice(i, 1); changed(); renderStage(); };
      fr.appendChild(c);
    });
    if (s.finale.length < 8) {
      const sel = el('select', 'smAdd');
      sel.appendChild(new Option(L('addFinale'), ''));
      for (const n of Object.keys(OBS)) sel.appendChild(new Option(OBS[n][0] + ' ' + obsName(n), n));
      sel.onchange = () => { if (sel.value) { s.finale.push(sel.value); UI.sound('ui'); changed(); renderStage(); } };
      fr.appendChild(sel);
    }
    box.appendChild(fr);
    // order / copy / delete
    const ob = el('div', 'smRow smTools');
    ob.appendChild(button(L('left'), 'btn ghost small sq', () => move(-1)));
    ob.appendChild(button(L('right'), 'btn ghost small sq', () => move(1)));
    ob.appendChild(button(L('dup'), 'btn ghost small', () => { D.stages.splice(cur + 1, 0, JSON.parse(JSON.stringify(s))); cur++; keep(); render(); }));
    // ↺ the stage exactly as it ships in the game (handy after an accidental edit — then publish)
    const orig = FF.bookRaw(FF.compileBook(FF.STAGE_BOOK)).stages[cur];
    if (orig) ob.appendChild(button(UI.lang() === 'ar' ? '↺ الأصل' : '↺ Original', 'btn ghost small', () => {
      D.stages[cur] = JSON.parse(JSON.stringify(orig)); keep(); UI.toast(UI.lang() === 'ar' ? '↺ المرحلة ' + (cur + 1) + ' رجعت زي ما هي في اللعبة — انشر عشان توصل للكل' : '↺ Stage ' + (cur + 1) + ' is back to the original — publish to send it to everyone'); render();
    }));
    ob.appendChild(button(L('del'), 'btn ghost small', () => {
      if (D.stages.length <= 1) { UI.toast(L('keepOne')); return; }
      D.stages.splice(cur, 1); cur = Math.max(0, cur - 1); D.loop.from = Math.min(D.loop.from, D.stages.length); keep(); render();
    }));
    box.insertBefore(ob, box.children[2] || null); // copy / move / delete right under the stage name
    // after the last stage: the run ends with COMING SOON, or loops back faster
    const er = row(L('ending'));
    for (const [on, label] of [[true, L('endSoon')], [false, L('endLoop')]]) {
      const b = el('button', 'switch' + (!!D.comingSoon === on ? ' on' : ''), label);
      b.onclick = () => { UI.sound('ui'); D.comingSoon = on; changed(); renderStage(); };
      er.appendChild(b);
    }
    box.appendChild(er);
    // where the run loops to after the last stage
    const lr = row(L('loop'));
    if (D.comingSoon) lr.classList.add('hidden');
    const lv = el('b', 'smVal', String(D.loop.from));
    lr.appendChild(button('−', 'btn ghost small sq', () => { D.loop.from = Math.max(1, D.loop.from - 1); lv.textContent = D.loop.from; changed(); }));
    lr.appendChild(lv);
    lr.appendChild(button('+', 'btn ghost small sq', () => { D.loop.from = Math.min(D.stages.length, D.loop.from + 1); lv.textContent = D.loop.from; changed(); }));
    box.appendChild(lr);
    const warn = FF.compileBook(D).warnings;
    if (warn.length) box.appendChild(el('p', 'note smWarn', L('warn') + warn.join(' · ')));
  }
  // 📈 every stage as a bar: the speed you actually feel there (stage speed × game speed), coloured by difficulty
  function graph() {
    const D = draft(), n = D.stages.length;
    const wrap = el('div', 'smGraph');
    wrap.appendChild(el('small', 'smGraphLbl', L('graph')));
    const cv = el('canvas');
    cv.width = 600; cv.height = 90;
    const g = cv.getContext('2d');
    const felt = D.stages.map((s, i) => s.speed * FF.Game.modeSpeedAt('endless', i * FF.Level.STAGE_LEN + FF.Level.STAGE_LEN / 2));
    const top = Math.max(300, ...felt), bw = 600 / n;
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, 0, 600, 90);
    D.stages.forEach((s, i) => {
      const h = Math.round((felt[i] / top) * 74), hue = Math.round(120 - 120 * FF.clamp(s.hard, 0, 1));
      g.fillStyle = 'hsl(' + hue + ',85%,' + (i === cur ? 62 : 45) + '%)';
      g.fillRect(Math.round(i * bw) + 1, 90 - h, Math.max(2, Math.round(bw) - 2), h);
      if (i === cur) { g.strokeStyle = '#ffd23f'; g.lineWidth = 2; g.strokeRect(Math.round(i * bw) + 1, 90 - h, Math.max(2, Math.round(bw) - 2), h); }
      const f = fair[i];
      if (f) { g.fillStyle = f === 'ok' ? '#3ddc84' : f === 'hard' ? '#ffb84a' : '#ff5a5a'; g.fillRect(Math.round(i * bw) + 1, 0, Math.max(2, Math.round(bw) - 2), 5); }
    });
    cv.onclick = (e) => { const r = cv.getBoundingClientRect(); const i = FF.clamp(Math.floor(((e.clientX - r.left) / r.width) * n), 0, n - 1); UI.sound('ui'); cur = i; stopCheck(); render(); };
    wrap.appendChild(cv);
    return wrap;
  }

  // 🎲 a brand-new random stage in this slot: obstacles, finale, world and twist (speed and difficulty fit its place)
  const NAMES = ['STORM', 'RUSH', 'NIGHT', 'FURY', 'DRIFT', 'VOID', 'BLAZE', 'ECHO', 'SPARK', 'CHAOS', 'PULSE', 'FROST', 'NOVA', 'SHADOW', 'TURBO', 'RIFT'];
  const PRE = ['NEON', 'SKY', 'IRON', 'CRYSTAL', 'LAVA', 'GHOST', 'STAR', 'SUGAR', 'GLITCH', 'DEEP', 'WILD', 'CYBER'];
  function surprise() {
    const D = draft(), s = D.stages[cur], keys = Object.keys(OBS);
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const mix = {};
    while (Object.keys(mix).length < 4 + Math.floor(Math.random() * 2)) mix[pick(keys)] = 1 + Math.floor(Math.random() * 3);
    const names = Object.keys(mix);
    s.mix = mix;
    s.finale = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => pick(names));
    s.world = pick(FF.WORLDS).id;
    s.mod = Math.random() < 0.55 ? 'none' : pick(MODS.slice(1));
    s.rift = Math.random() < 0.3;
    s.name = (pick(PRE) + ' ' + pick(NAMES)).slice(0, 22);
    s.nameAr = '';
    keep(); UI.toast(L('surprised')); render();
  }

  // 🤖 test every stage, one after the other (2 players each) — the list and the graph show ✓ ⚠ ✗
  function testAll() {
    stopCheck();
    const book = FF.compileBook(draft()), D = draft(), SL = FF.Level.STAGE_LEN, n = D.stages.length, TRIALS = 2;
    const job = { st: 0, i: 0, r: null, ok: 0 };
    checkRun = job;
    fair = {};
    const msg = $('#smResult');
    msg.classList.remove('hidden', 'bad', 'good');
    const next = () => {
      if (checkRun !== job) return;
      if (!job.r) {
        const L2 = new FF.Level({ seed: 101 + job.i * 7919 + job.st * 31, noHints: true, seen: {}, noRift: true, book });
        const x0 = L2.stageStartX(job.st + 1), x1 = L2.stageStartX(job.st + 2); // (rules v7: every stage has its own length)
        L2.finishX = x1;
        job.r = FF.Fair.runner(L2, { seed: 2000 + job.i * 31, from: x0, to: x1, t0: 1.3 * job.i + 0.7, endless: true, scaleAt: (x) => FF.Game.modeSpeedAt('endless', x, L2) });
      }
      job.r.step(25);
      msg.textContent = L('testAllRun').replace('{a}', job.st + 1).replace('{b}', n);
      if (job.r.done) {
        if (job.r.result.ok) job.ok++;
        job.i++; job.r = null;
        if (job.i >= TRIALS) {
          fair[job.st] = job.ok === TRIALS ? 'ok' : job.ok ? 'hard' : 'bad';
          const b = $('#smList').children[job.st];
          if (b) b.querySelector('small').textContent = (fair[job.st] === 'ok' ? '✓ ' : fair[job.st] === 'hard' ? '⚠ ' : '✗ ') + Math.round(D.stages[job.st].speed);
          job.st++; job.i = 0; job.ok = 0;
        }
      }
      if (job.st < n) { job.timer = setTimeout(next, 0); return; }
      checkRun = null;
      const c = (k) => Object.values(fair).filter((v) => v === k).length;
      renderStage();
      const m = $('#smResult');
      m.classList.remove('hidden');
      m.textContent = L('testAllDone').replace('{ok}', c('ok')).replace('{hard}', c('hard')).replace('{bad}', c('bad'));
      m.classList.add(c('bad') ? 'bad' : 'good');
      UI.sound(c('bad') ? 'uiBack' : 'record');
    };
    next();
  }

  // 📤 📥 the whole book as one code (to keep a backup, or move stages between the Maker app and the game)
  const toCode = (o) => 'FNBOOK:' + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  const fromCode = (c) => { const m = String(c || '').trim().match(/FNBOOK:([A-Za-z0-9+/=]+)/); return m ? JSON.parse(decodeURIComponent(escape(atob(m[1])))) : null; };
  function codeBox(note, text, ro, btnLabel, fn) {
    const box = $('#smPublish');
    box.innerHTML = '';
    box.classList.remove('hidden');
    box.classList.add('smCodeBox');
    box.appendChild(el('small', 'smGraphLbl', note));
    const ta = el('textarea', 'rvText smCodeTa');
    ta.value = text; ta.readOnly = ro;
    box.appendChild(ta);
    const r = el('div', 'smRow');
    r.appendChild(button(btnLabel, 'btn small gold', () => fn(ta)));
    r.appendChild(button('✕', 'btn ghost small sq', () => box.classList.add('hidden')));
    box.appendChild(r);
    if (ro) ta.select(); else ta.focus();
  }
  function exportBox() {
    codeBox(L('expNote'), toCode(draft()), true, L('copy'), async (ta) => {
      ta.select();
      try { await navigator.clipboard.writeText(ta.value); } catch (e) { try { document.execCommand('copy'); } catch (e2) { /* select it by hand */ } }
      UI.toast(L('copied'));
    });
  }
  function importBox() {
    codeBox(L('impNote'), '', false, L('load'), (ta) => {
      let raw2 = null;
      try { raw2 = fromCode(ta.value); } catch (e) { raw2 = null; }
      if (!raw2 || !Array.isArray(raw2.stages) || !raw2.stages.length) { UI.toast(L('impBad')); return; }
      FF.save.stageDraft = FF.bookRaw(FF.compileBook(raw2)); // cleaned like any book
      cur = 0; keep(); $('#smPublish').classList.add('hidden'); UI.toast(L('impOk')); render();
    });
  }
  function backupsBox() {
    const list = snaps(), box = $('#smPublish');
    box.innerHTML = ''; box.classList.remove('hidden'); box.classList.add('smCodeBox');
    box.appendChild(el('small', 'smGraphLbl', list.length ? L('bkNote') : L('bkNone')));
    list.forEach((s) => {
      let n = 0; try { n = JSON.parse(s.d).stages.length; } catch (e) { /* skip */ }
      box.appendChild(button('🕘 ' + new Date(s.t).toLocaleString() + ' · ' + n + ' ' + L('stagesN'), 'btn ghost small', () => {
        snapNow();
        FF.save.stageDraft = JSON.parse(s.d); cur = Math.min(cur, draft().stages.length - 1);
        keep(); box.classList.add('hidden'); UI.toast(L('bkOk')); render();
      }));
    });
    box.appendChild(button('✕', 'btn ghost small sq', () => box.classList.add('hidden')));
  }
  function notesBox() {
    const box = $('#smPublish');
    box.innerHTML = ''; box.classList.remove('hidden'); box.classList.add('smCodeBox');
    box.appendChild(el('small', 'smGraphLbl', L('notesNote')));
    const ta = el('textarea', 'rvText smCodeTa');
    ta.value = FF.save.makerNotes || ''; ta.placeholder = L('notesPh'); ta.maxLength = 5000;
    ta.oninput = () => { FF.save.makerNotes = ta.value.slice(0, 5000); UI.persist(); };
    box.appendChild(ta);
    box.appendChild(button('✓', 'btn small gold', () => box.classList.add('hidden')));
    ta.focus();
  }
  SM.toCode = toCode; SM.fromCode = fromCode;

  function row(label) { const r = el('div', 'smRow'); r.appendChild(el('span', 'smLbl', label)); return r; }
  function slider(label, min, max, step, val, set, fmt) {
    const r = row(label);
    const inp = el('input');
    Object.assign(inp, { type: 'range', min, max, step, value: val });
    const v = el('b', 'smVal', fmt(val));
    inp.oninput = () => { v.textContent = fmt(+inp.value); set(+inp.value); };
    inp.addEventListener('pointerdown', (e) => e.stopPropagation());
    r.appendChild(inp);
    r.appendChild(v);
    return r;
  }
  function move(dir) {
    const D = draft(), j = cur + dir;
    if (j < 0 || j >= D.stages.length) return;
    const a = D.stages[cur];
    D.stages[cur] = D.stages[j];
    D.stages[j] = a;
    cur = j; keep(); render();
  }

  // ▶ play this stage of the draft (owner test runs never count)
  function play() {
    stopCheck();
    UI.startGame('endless', { book: FF.compileBook(draft()), startX: cur * FF.Level.STAGE_LEN, seed: 1 + Math.floor(Math.random() * 1e6), fromMaker: true });
  }

  // 🤖 three "people" play the stage from its start (different layouts and timings)
  function stopCheck() { if (checkRun) { clearTimeout(checkRun.timer); checkRun = null; } }
  function check() {
    stopCheck();
    const book = FF.compileBook(draft());
    const SL = FF.Level.STAGE_LEN, TRIALS = 3;
    let x0 = cur * SL, x1 = x0 + SL;
    const out = [];
    const job = { i: 0, r: null };
    checkRun = job;
    const msg = $('#smResult');
    msg.classList.remove('hidden', 'bad', 'good');
    const next = () => {
      if (checkRun !== job) return;
      if (!job.r) {
        const L2 = new FF.Level({ seed: 101 + job.i * 7919 + cur * 31, noHints: true, seen: {}, noRift: true, book });
        x0 = L2.stageStartX(cur + 1); x1 = L2.stageStartX(cur + 2); // (rules v7: every stage has its own length)
        L2.finishX = x1;
        job.r = FF.Fair.runner(L2, { seed: 2000 + job.i * 31, from: x0, to: x1, t0: 1.3 * job.i + 0.7, endless: true, scaleAt: (x) => FF.Game.modeSpeedAt('endless', x, L2) });
      }
      job.r.step(25);
      const pct = Math.round(FF.clamp((job.r.p.x - x0) / SL, 0, 1) * 100);
      msg.textContent = L('checking').replace('{a}', job.i + 1).replace('{b}', TRIALS) + '  ' + pct + '%';
      if (job.r.done) { out.push(job.r.result); job.i++; job.r = null; }
      if (job.i < TRIALS) { job.timer = setTimeout(next, 0); return; }
      checkRun = null;
      const ok = out.filter((r) => r.ok).length, bad = out.find((r) => !r.ok);
      const d = bad ? Math.round((bad.x - x0) / 10) : 0;
      const c = bad ? String(bad.cause || '?').replace(/_/g, ' ') : '';
      msg.textContent = ok === TRIALS ? L('fair').replace('{n}', ok).replace('{m}', TRIALS) : (ok ? L('hardOk') : L('unfair')).replace('{n}', ok).replace('{m}', TRIALS).replace('{d}', d).replace('{c}', c);
      msg.classList.add(ok === TRIALS ? 'good' : 'bad');
      UI.sound(ok === TRIALS ? 'record' : 'uiBack');
    };
    next();
  }

  // 🌍 publish: the server checks your secret code (tools/supabase-v9.sql → ff_admin)
  // 🌍 publish — but first the Maker checks everything by itself: what changed since the published stages
  // (so an accidental edit is caught), the bot plays every changed stage, and common mistakes are flagged.
  // Real problems (a stage nobody can pass) block publishing; warnings only ask you to look.
  const PC = {
    ar: { checking: '🔍 بيراجع قبل النشر…', botRun: '🤖 البوت بيجرب المرحلة {a} ({b} من {c})…', nothing: '✓ مفيش أي تغيير عن المنشور — مفيش حاجة تتنشر',
      changes: '📝 اللي اتغيّر عن المنشور:', added: 'مرحلة جديدة', removed: 'اتشالت {n} مرحلة من الآخر', undoStage: '↺ رجّعها', undone: '↺ رجعت المرحلة {n} زي المنشورة',
      okAll: '✓ كله تمام — جاهز للنشر', errs: '✗ لازم تصلح دول الأول:', warns: '⚠ بص على دول (تقدر تنشر برضه):', fixFirst: 'صلّح الأخطاء الأول',
      fName: 'الاسم', fWorld: 'العالم', fSpeed: 'السرعة', fHard: 'الصعوبة', fBreather: 'الاستراحة', fMod: 'المود', fRift: 'بوابة العالم', fMix: 'العقبات', fFinale: 'النهاية', fEnding: 'آخر اللعبة',
      eBot: 'المرحلة {n}: البوت مات في كل المحاولات (عند {m}) — غالبًا مستحيلة', wBot: 'المرحلة {n}: البوت عدّاها {k} من 3 بس — صعبة جدًا',
      wEarly: 'المرحلة {n}: فيها {k} نوع عقبة{x} — كتير على لاعب لسه بادئ', wTurbo: ' وتيربو', wAr: 'المرحلة {n}: ملهاش اسم عربي', wDrop: 'المرحلة {n}: أبطأ من اللي قبلها بـ {k} — هتحس إن اللعبة هديت فجأة',
      recheck: '🔍 راجع تاني' },
    en: { checking: '🔍 Checking before publishing…', botRun: '🤖 The bot is playing stage {a} ({b} of {c})…', nothing: '✓ Nothing changed since the published stages — nothing to publish',
      changes: '📝 What changed since the published stages:', added: 'new stage', removed: '{n} stage(s) removed from the end', undoStage: '↺ Undo it', undone: '↺ Stage {n} is back to the published one',
      okAll: '✓ All good — ready to publish', errs: '✗ Fix these first:', warns: '⚠ Have a look (you can still publish):', fixFirst: 'Fix the errors first',
      fName: 'name', fWorld: 'world', fSpeed: 'speed', fHard: 'difficulty', fBreather: 'breather', fMod: 'twist', fRift: 'rift portal', fMix: 'obstacles', fFinale: 'finale', fEnding: 'ending',
      eBot: 'Stage {n}: the bot died on every try (at {m}) — probably impossible', wBot: 'Stage {n}: the bot passed only {k} of 3 — very hard',
      wEarly: 'Stage {n}: {k} kinds of obstacles{x} — a lot for a new player', wTurbo: ' and turbo', wAr: 'Stage {n}: no Arabic name', wDrop: 'Stage {n}: {k} slower than the one before — the run will feel like it slowed down',
      recheck: '🔍 Check again' }
  };
  const P2 = (k, o) => { let t = (PC[UI.lang()] || PC.en)[k]; for (const q in (o || {})) t = t.replace('{' + q + '}', o[q]); return t; };
  const sortKeys = (o) => JSON.stringify(Object.keys(o || {}).sort().map((k) => [k, o[k]]));
  function stageDiff(a, b) { // which fields of stage b differ from published stage a
    const out = [];
    if (a.name !== b.name || (a.nameAr || '') !== (b.nameAr || '')) out.push('fName');
    if (a.world !== b.world) out.push('fWorld');
    if (Math.round(a.speed) !== Math.round(b.speed)) out.push('fSpeed');
    if (Math.abs((a.hard || 0) - (b.hard || 0)) > 0.005) out.push('fHard');
    if (a.breather !== b.breather) out.push('fBreather');
    if ((a.mod || 'none') !== (b.mod || 'none')) out.push('fMod');
    if (!!a.rift !== !!b.rift) out.push('fRift');
    if (sortKeys(a.mix) !== sortKeys(b.mix)) out.push('fMix');
    if (JSON.stringify(a.finale) !== JSON.stringify(b.finale)) out.push('fFinale');
    return out;
  }
  function askPublish() {
    stopCheck();
    const box = $('#smPublish');
    box.innerHTML = ''; box.classList.remove('hidden'); box.classList.add('smCodeBox');
    const msg = el('small', 'smGraphLbl', P2('checking'));
    box.appendChild(msg);
    const go = () => reviewDraft(box, msg);
    // compare against what is really live right now
    if (FF.Online.enabled() && navigator.onLine !== false) FF.Online.loadBook().catch(() => {}).finally(go); else go();
  }
  SM.review = (done) => reviewDraft($('#smPublish'), el('small'), done); // for tests
  function reviewDraft(box, msg, done) {
    const D = draft(), pub = FF.bookRaw(FF.BOOK), name = (s) => (UI.lang() === 'ar' && s.nameAr ? s.nameAr : s.name);
    const changed = [], lines = [];
    D.stages.forEach((s, i) => {
      const a = pub.stages[i];
      if (!a) { changed.push(i); lines.push({ i, text: (i + 1) + ' · ' + name(s) + ' — ' + P2('added') }); return; }
      const d = stageDiff(a, s);
      if (d.length) { changed.push(i); lines.push({ i, text: (i + 1) + ' · ' + name(s) + ' — ' + d.map((k) => P2(k)).join('، '), undo: true }); }
    });
    if (pub.stages.length > D.stages.length) lines.push({ text: P2('removed', { n: pub.stages.length - D.stages.length }) });
    if (!!pub.comingSoon !== !!D.comingSoon || (!D.comingSoon && JSON.stringify(pub.loop) !== JSON.stringify(D.loop))) lines.push({ text: P2('fEnding') });
    if (!lines.length) { msg.textContent = P2('nothing'); box.appendChild(button('✕', 'btn ghost small sq', () => box.classList.add('hidden'))); done && done({ nothing: true }); return; }
    // quick checks that need no bot
    const errs = [], warns = [];
    for (const w of FF.compileBook(D).warnings) warns.push(w);
    D.stages.forEach((s, i) => {
      const kinds = Object.keys(s.mix || {}).filter((k) => s.mix[k] > 0).length;
      if (i < 3 && (kinds > 8 || s.mod === 'turbo' || s.mod === 'tight')) warns.push(P2('wEarly', { n: i + 1, k: kinds, x: s.mod === 'turbo' ? P2('wTurbo') : '' }));
      if (changed.includes(i) && !s.nameAr) warns.push(P2('wAr', { n: i + 1 }));
      if (i > 0 && D.stages[i - 1].speed - s.speed > 15) warns.push(P2('wDrop', { n: i + 1, k: Math.round(D.stages[i - 1].speed - s.speed) }));
    });
    // 🤖 the bot plays every changed stage 3 times
    const book = FF.compileBook(D), SL = FF.Level.STAGE_LEN, TRIALS = 3;
    const job = { k: 0, i: 0, ok: 0, r: null, deaths: [] };
    checkRun = job;
    const step = () => {
      if (checkRun !== job) return;
      if (job.k >= changed.length) { checkRun = null; finish(); return; }
      const st = changed[job.k];
      if (!job.r) {
        const L2 = new FF.Level({ seed: 101 + job.i * 7919 + st * 31, noHints: true, seen: {}, noRift: true, book });
        const x0 = L2.stageStartX(st + 1), x1 = L2.stageStartX(st + 2); // (rules v7: every stage has its own length)
        L2.finishX = x1;
        job.r = FF.Fair.runner(L2, { seed: 2000 + job.i * 31, from: x0, to: x1, t0: 1.3 * job.i + 0.7, endless: true, scaleAt: (x) => FF.Game.modeSpeedAt('endless', x, L2) });
      }
      job.r.step(40);
      msg.textContent = P2('botRun', { a: st + 1, b: job.k + 1, c: changed.length });
      if (job.r.done) {
        if (job.r.result.ok) job.ok++; else job.deaths.push(Math.round((job.r.p.x - st * SL) / 10) + 'm');
        job.i++; job.r = null;
        if (job.i >= TRIALS) {
          fair[st] = job.ok === TRIALS ? 'ok' : job.ok ? 'hard' : 'bad';
          if (!job.ok) errs.push(P2('eBot', { n: st + 1, m: job.deaths.join(', ') }));
          else if (job.ok < TRIALS) warns.push(P2('wBot', { n: st + 1, k: job.ok }));
          job.k++; job.i = 0; job.ok = 0; job.deaths = [];
        }
      }
      job.timer = setTimeout(step, 0);
    };
    const finish = () => {
      box.innerHTML = '';
      box.appendChild(el('small', 'smGraphLbl', P2('changes')));
      for (const ln of lines) {
        const r = el('div', 'smRow smChange');
        r.appendChild(el('span', '', ln.text));
        if (ln.undo) r.appendChild(button(P2('undoStage'), 'btn ghost small', () => {
          D.stages[ln.i] = JSON.parse(JSON.stringify(pub.stages[ln.i])); keep(); UI.toast(P2('undone', { n: ln.i + 1 })); render(); askPublish();
        }));
        box.appendChild(r);
      }
      if (errs.length) { box.appendChild(el('small', 'smGraphLbl smBad', P2('errs'))); errs.forEach((e) => box.appendChild(el('div', 'smIssue bad', '✗ ' + e))); }
      if (warns.length) { box.appendChild(el('small', 'smGraphLbl smWarnT', P2('warns'))); warns.forEach((w) => box.appendChild(el('div', 'smIssue', '⚠ ' + w))); }
      if (!errs.length && !warns.length) box.appendChild(el('div', 'smIssue good', P2('okAll')));
      const r = el('div', 'smRow');
      const inp = el('input', 'smCode');
      inp.type = 'password'; inp.placeholder = L('code'); inp.autocomplete = 'off';
      r.appendChild(inp);
      const pubBtn = button(L('confirm'), 'btn small gold', async () => {
        if (errs.length) { UI.toast(P2('fixFirst')); return; }
        if (!FF.Online.canSend()) { UI.toast(L('offline')); return; }
        let res;
        try { res = await FF.Online.publishBook(inp.value, Object.assign(JSON.parse(JSON.stringify(draft())), { stamp: Date.now() })); } catch (e) { UI.toast(L('offline')); return; }
        UI.toast(L(res === 'ok' ? 'published' : res) || L('denied'));
        UI.sound(res === 'ok' ? 'record' : 'uiBack');
        if (res === 'ok') { snapNow(); box.classList.add('hidden'); render(); }
      });
      if (errs.length) pubBtn.disabled = true;
      r.appendChild(pubBtn);
      r.appendChild(button(P2('recheck'), 'btn ghost small', askPublish));
      r.appendChild(button('✕', 'btn ghost small sq', () => box.classList.add('hidden')));
      box.appendChild(r);
      renderList();
      UI.sound(errs.length ? 'uiBack' : 'ui');
      done && done({ lines, errs, warns });
    };
    step();
  }
  function renderList() { // refresh the ✓ ⚠ ✗ badges without rebuilding the open box
    const D = draft();
    [...$('#smList').children].forEach((b, i) => { const f = fair[i], sm = b.querySelector('small'); if (sm && D.stages[i]) sm.textContent = (f ? (f === 'ok' ? '✓ ' : f === 'hard' ? '⚠ ' : '✗ ') : '') + Math.round(D.stages[i].speed); });
  }
})(window.FF);
