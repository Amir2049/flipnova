// NOVA STUDIO — Amir's own game maker: scenes, pixel art, objects, rules, library, backups, notes, play, share, export.
(function (G) {
  'use strict';
  const N = G.Nova, T = N.TILE;
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);

  // ------------------------------------------------------------------ words (Egyptian Arabic first, English if you switch)
  const DICT = {
    ar: {
      tagline: 'أهلا يا أمير 👋 اعمل أي لعبة في دماغك', import: 'استيراد', library: 'مكتبتي', newGame: 'لعبة جديدة', myGames: 'ألعابي', noGames: 'لسه مفيش ألعاب — اختار قالب من فوق.',
      resume: 'كمّل', lastEdit: 'آخر تعديل', tScene: 'المشهد', tArt: 'الرسم', tObjects: 'الحاجات', tRules: 'القواعد', tGame: 'اللعبة', play: 'جرّب',
      hDraw: 'حط', hErase: 'امسح', hRect: 'مستطيل: اسحب تملا أو تمسح مساحة مرة واحدة', hPick: 'قطّارة: دوس على أي حاجة في المشهد عشان تختارها', hMove: 'حرّك الشاشة',
      hHere: 'جرّب من هنا: دوس على أي مربع واللاعب يبدأ منه', hUndo: 'رجوع', frame: 'فريم', rulesHead: '<b>لما</b> يحصل حاجة <b>←</b> اعمل حاجات', addRule: 'قاعدة',
      scenes: 'مشاهد', sceneSet: 'إعدادات المشهد', name: 'الاسم', width: 'العرض (مربعات)', height: 'الطول (مربعات)', bg: 'الخلفية', newScene: '＋ مشهد جديد', copyScene: '⧉ انسخ المشهد',
      delScene: '🗑 امسح المشهد', done: 'تمام', cancel: 'لا', yes: 'أيوه', newObj: '＋ حاجة جديدة', newThing: 'حاجة جديدة', whatDoes: 'بتعمل إيه', looksLike: 'شكلها',
      placeIt: '✏️ حطها', drawIt: '🎨 ارسم شكلها', delete: '🗑 امسح', toLib: '⭐ احفظها في مكتبتي', fromLib: '📚 هات من مكتبتي', savedLib: '⭐ اتحفظت في مكتبتك',
      libEmpty: 'المكتبة فاضية. أي حاجة تعجبك دوس «احفظها في مكتبتي».', libTitle: '📚 مكتبتي — دوس على حاجة تضيفها للعبة', libHome: '📚 مكتبتي — الحاجات اللي حفظتها (تقدر تمسح)', added: '✓ اتضافت: ',
      noRules: 'مفيش قواعد لسه. القواعد بتخلّي لعبتك تعمل حاجات مميزة، زي: «لما اللاعب يلمس الجوهرة ← اكتب رسالة وزوّد 10».', when: 'لما', then: 'اعمل', and: 'و', andAlso: '＋ وكمان…',
      anything: '(أي حاجة)', pick: '(اختار)', message: 'الرسالة', number: 'رقم', seconds: 'ثانية', gName: 'اسم اللعبة', lives: 'الأرواح (0 = يجرب على طول)', gravity: 'الجاذبية (0 = مفيش)', showScore: 'اظهر الأسكور',
      exportHtml: '📤 طلّع اللعبة كملف (HTML)', shareCode: '🔗 كود مشاركة', duplicate: '⧉ اعمل نسخة', delGame: '🗑 امسح اللعبة', exportNote: 'ملف الـHTML هو لعبتك كلها في ملف واحد: يفتح في أي متصفح، تبعته لصحابك، أو ترفعه على itch.io.',
      todo: '✅ مهامي في اللعبة دي', todoPh: 'اكتب مهمة واضغط ＋', ideas: '💡 أفكاري', ideasPh: 'اكتب أي فكرة تيجي في دماغك…', backups: '🕘 نسخ احتياطية', backupsNote: 'بتتعمل لوحدها. لو بوّظت حاجة ارجع لنسخة قديمة.',
      noBackups: 'لسه مفيش نسخ — بتتعمل لوحدها وانت شغال.', restore: 'ارجع للنسخة دي', restored: '🕘 رجعت للنسخة القديمة (والحالية اتحفظت نسخة)', delQ: 'تمسح «{n}»؟ مش هتعرف ترجعها.',
      delTypeQ: 'تمسح «{n}» من كل المشاهد؟', copied: 'اتنسخ!', copyMade: 'عملت نسخة — انت دلوقتي في النسخة', codeTitle: '🔗 كود «{n}»', codeNote: 'ابعته، واللي معاه NOVA STUDIO يدوس 📥 استيراد ويلزقه.',
      close: 'اقفل', copy: 'انسخ', send: 'ابعت', impTitle: '📥 استيراد لعبة', impPh: 'الزق كود المشاركة هنا', openFile: '📂 افتح ملف', importBtn: 'استيراد', imported: '✓ اتستوردت «{n}»', notGame: 'ده مش لعبة NOVA STUDIO',
      saved: '📤 اتحفظ ', full: '⚠ المساحة خلصت — طلّع لعبة كملف عشان تحفظها', frame2: 'عملت فريم 2 — غيّر فيه عشان يتحرك', onePlayer: 'لاعب واحد في المشهد — اتنقل لهنا', noPlayer: 'مفيش لاعب في المشهد ده — حط لاعب الأول',
      tplPlatformer: 'منصّات', tplFlip: 'قلب الجاذبية', tplFlappy: 'طيران', tplMaze: 'متاهة', tplBlank: 'فاضي', copyOf: ' نسخة', sceneN: 'مشهد ', minutesAgo: 'من {n} دقيقة', hoursAgo: 'من {n} ساعة', daysAgo: 'من {n} يوم', now: 'دلوقتي'
    },
    en: {
      tagline: 'Hi Amir 👋 make any game you can imagine', import: 'Import', library: 'My library', newGame: 'New game', myGames: 'My games', noGames: 'No games yet — pick a template above.',
      resume: 'Continue', lastEdit: 'Last edit', tScene: 'Scene', tArt: 'Art', tObjects: 'Objects', tRules: 'Rules', tGame: 'Game', play: 'Play',
      hDraw: 'Place', hErase: 'Erase', hRect: 'Rectangle: drag to fill or erase an area at once', hPick: 'Picker: tap anything in the scene to select it', hMove: 'Move the view',
      hHere: 'Test from here: tap a cell and the player starts there', hUndo: 'Undo', frame: 'Frame', rulesHead: '<b>WHEN</b> something happens <b>→</b> do things', addRule: 'Rule',
      scenes: 'scenes', sceneSet: 'Scene settings', name: 'Name', width: 'Width (tiles)', height: 'Height (tiles)', bg: 'Background', newScene: '＋ New scene', copyScene: '⧉ Copy scene',
      delScene: '🗑 Delete scene', done: 'Done', cancel: 'Cancel', yes: 'Yes', newObj: '＋ New object', newThing: 'New thing', whatDoes: 'What it does', looksLike: 'Looks like',
      placeIt: '✏️ Place it', drawIt: '🎨 Draw its look', delete: '🗑 Delete', toLib: '⭐ Save to my library', fromLib: '📚 From my library', savedLib: '⭐ Saved to your library',
      libEmpty: 'Your library is empty. Tap “Save to my library” on anything you like.', libTitle: '📚 My library — tap something to add it', libHome: '📚 My library — things you saved (you can delete)', added: '✓ Added: ',
      noRules: 'No rules yet. Rules make your game do special things — like “WHEN player touches Gem → show a message and add 10 score”.', when: 'WHEN', then: 'THEN', and: 'AND', andAlso: '＋ and also…',
      anything: '(anything)', pick: '(pick)', message: 'message', number: 'number', seconds: 'seconds', gName: 'Game name', lives: 'Lives (0 = try forever)', gravity: 'Gravity (0 = none)', showScore: 'Show score',
      exportHtml: '📤 Export as a game file (HTML)', shareCode: '🔗 Share code', duplicate: '⧉ Duplicate', delGame: '🗑 Delete game', exportNote: 'The HTML file is your whole game in one file: open it in any browser, send it to friends, or upload it to itch.io.',
      todo: '✅ My to-do for this game', todoPh: 'Type a task and tap ＋', ideas: '💡 My ideas', ideasPh: 'Write down any idea…', backups: '🕘 Backups', backupsNote: 'Made automatically. If you break something, go back to an older one.',
      noBackups: 'No backups yet — they are made while you work.', restore: 'Restore this', restored: '🕘 Restored (the current version was backed up first)', delQ: 'Delete “{n}”? This cannot be undone.',
      delTypeQ: 'Delete “{n}” from every scene?', copied: 'Copied!', copyMade: 'Copied — you are editing the copy', codeTitle: '🔗 Code for “{n}”', codeNote: 'Send it. In NOVA STUDIO they tap 📥 Import and paste it.',
      close: 'Close', copy: 'Copy', send: 'Send', impTitle: '📥 Import a game', impPh: 'Paste a share code here', openFile: '📂 Open file', importBtn: 'Import', imported: '✓ Imported “{n}”', notGame: 'That is not a NOVA STUDIO game',
      saved: '📤 Saved ', full: '⚠ Storage is full — export a game to keep it safe', frame2: 'Frame 2 made — change it to animate', onePlayer: 'One player per scene — moved here', noPlayer: 'No player in this scene — place one first',
      tplPlatformer: 'Platformer', tplFlip: 'Gravity Flip', tplFlappy: 'Flappy', tplMaze: 'Maze', tplBlank: 'Blank', copyOf: ' copy', sceneN: 'Scene ', minutesAgo: '{n} min ago', hoursAgo: '{n} h ago', daysAgo: '{n} days ago', now: 'just now'
    }
  };
  const BEH_AR = { platformer: 'لاعب — منصّات', topdown: 'لاعب — من فوق', flip: 'لاعب — قلب جاذبية', flappy: 'لاعب — طيران', solid: 'حيطة / أرض', hazard: 'خطر (بيموّت)', coin: 'بتتجمع', goal: 'الهدف / الخروج',
    patrol: 'عدو — بيمشي', chaser: 'عدو — بيطاردك', spring: 'سوستة', key: 'مفتاح', door: 'باب مقفول', checkpoint: 'نقطة حفظ', sign: 'لافتة (فيها كلام)', decor: 'زينة' };
  const EV_AR = { start: 'المشهد يبدأ', touch: 'اللاعب يلمس…', tap: 'اللاعب يدوس / ينط', score: 'الأسكور يوصل…', every: 'كل … ثانية', after: 'بعد … ثانية', die: 'اللاعب يموت', win: 'اللاعب يكسب' };
  const ACT_AR = { score: 'زوّد الأسكور', destroy: 'شيل الحاجة اللي اتلمست', say: 'اكتب رسالة', sound: 'شغّل صوت', scene: 'روح لمشهد رقم', next: 'المشهد اللي بعده', win: 'اكسب اللعبة', lose: 'اخسر',
    kill: 'اللاعب يموت', shake: 'هز الشاشة', gravity: 'اقلب الجاذبية', lives: 'زوّد أرواح', spawn: 'طلّع … جنب اللاعب', bounce: 'نطّط اللاعب لفوق', speed: 'غيّر سرعة اللاعب ×' };
  const PROP_AR = { speed: 'السرعة', jump: 'قوة النطة', value: 'القيمة', text: 'الكلام' };

  // ------------------------------------------------------------------ storage
  const KEY = 'novastudio.v1';
  let store = { projects: {}, order: [], lib: null, lang: 'ar', last: null };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.projects) store = Object.assign(store, s); } catch (e) { /* fresh start */ }
  for (const id of Object.keys(store.projects)) { const ok = sanitize(store.projects[id]); if (ok) store.projects[id] = ok; else delete store.projects[id]; }
  store.order = store.order.filter((id) => store.projects[id]);
  const lang = () => (store.lang === 'en' ? 'en' : 'ar');
  const t = (k, n) => (DICT[lang()][k] || DICT.en[k] || k).replace('{n}', n == null ? '' : n);
  const behName = (b) => (lang() === 'ar' ? BEH_AR[b] : N.BEHAVIORS[b].name);
  let saveT = 0;
  function persist(now) {
    clearTimeout(saveT);
    const go = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { toast(t('full')); } };
    if (now) go(); else saveT = setTimeout(go, 400);
  }
  function touched() { if (P) { P.updated = Date.now(); remember(); persist(); autoSnap(); } }
  function remember() { if (P) store.last = { pid, tab, sceneIdx, cam: { x: cam.x, y: cam.y, z: cam.z } }; }

  // only known shapes get in: a shared code can never carry code, only data
  function sanitize(p) {
    if (!p || typeof p !== 'object' || !Array.isArray(p.scenes) || !p.types || !p.sprites) return null;
    const out = { name: String(p.name || 'My Game').slice(0, 30), lives: Math.max(0, Math.min(99, +p.lives || 0)), gravity: Math.max(0, Math.min(3000, +p.gravity || 0)), hud: p.hud !== false,
      sprites: {}, types: {}, scenes: [], rules: [], updated: +p.updated || Date.now(),
      notes: (Array.isArray(p.notes) ? p.notes : []).slice(0, 100).map((x) => ({ text: String(x && x.text || '').slice(0, 120), done: !!(x && x.done) })).filter((x) => x.text),
      idea: String(p.idea || '').slice(0, 4000) };
    const ID = /^[a-zA-Z0-9_]{1,24}$/;
    for (const id in p.sprites) {
      if (!ID.test(id)) continue;
      const sp = p.sprites[id], fr = (sp && Array.isArray(sp.frames) ? sp.frames : []).slice(0, 4).map((f) => (String(f) + '.'.repeat(256)).slice(0, 256).replace(/[^.0-9a-f]/g, '.'));
      if (fr.length) out.sprites[id] = { frames: fr, name: sp.name ? String(sp.name).slice(0, 16) : undefined };
    }
    for (const id in p.types) {
      const ty = p.types[id];
      if (!ID.test(id) || !ty || !N.BEHAVIORS[ty.beh]) continue;
      const props = {};
      for (const k in (ty.props || {})) if (/^(speed|jump|value|text)$/.test(k)) props[k] = k === 'text' ? String(ty.props[k]).slice(0, 60) : +ty.props[k] || 0;
      out.types[id] = { name: String(ty.name || id).slice(0, 20), sprite: out.sprites[ty.sprite] ? ty.sprite : Object.keys(out.sprites)[0], beh: ty.beh, props };
    }
    for (const sc of p.scenes.slice(0, 50)) {
      const cols = Math.max(10, Math.min(400, +sc.cols || 40)), rows = Math.max(6, Math.min(60, +sc.rows || 11));
      const objs = (Array.isArray(sc.objs) ? sc.objs : []).filter((o) => Array.isArray(o) && out.types[o[0]] && o[1] >= 0 && o[1] < cols && o[2] >= 0 && o[2] < rows).slice(0, 8000).map((o) => [o[0], o[1] | 0, o[2] | 0]);
      out.scenes.push({ name: String(sc.name || 'Scene').slice(0, 20), cols, rows, bg: /^#[0-9a-fA-F]{6}$/.test(sc.bg || '') ? sc.bg : '#141828', objs });
    }
    if (!out.scenes.length) return null;
    for (const r of (Array.isArray(p.rules) ? p.rules : []).slice(0, 100)) {
      if (!r || !r.when || !N.EVENTS[r.when.ev]) continue;
      const then = (Array.isArray(r.then) ? r.then : []).filter((a) => a && N.ACTIONS[a.act]).slice(0, 10).map((a) => ({ act: a.act, n: +a.n || 0, text: a.text ? String(a.text).slice(0, 60) : '', type: a.type && out.types[a.type] ? a.type : '' }));
      out.rules.push({ when: { ev: r.when.ev, n: +r.when.n || 0, type: r.when.type && out.types[r.when.type] ? r.when.type : '' }, then });
    }
    return out;
  }

  // ------------------------------------------------------------------ 📚 my library: things saved once, usable in every game
  function libItems() {
    if (!Array.isArray(store.lib)) {
      // first time: start the library with everything from the templates
      store.lib = [];
      const seen = new Set();
      for (const tp of G.NovaTemplates) {
        const p = tp.make();
        for (const id in p.types) {
          const ty = p.types[id], key = ty.sprite + '|' + ty.beh;
          if (seen.has(key)) continue;
          seen.add(key);
          store.lib.push({ name: ty.name, beh: ty.beh, props: clone(ty.props || {}), frames: clone(p.sprites[ty.sprite].frames) });
        }
      }
      persist();
    }
    return store.lib;
  }
  function saveToLib(id) {
    const ty = P.types[id];
    libItems().unshift({ name: ty.name, beh: ty.beh, props: clone(ty.props || {}), frames: clone(P.sprites[ty.sprite].frames) });
    store.lib = store.lib.slice(0, 300);
    persist(); toast(t('savedLib'));
  }
  function addFromLib(it) {
    const sid = uid('s'), tid = uid('t');
    P.sprites[sid] = { name: it.name.slice(0, 16), frames: clone(it.frames) };
    P.types[tid] = { name: it.name, sprite: sid, beh: it.beh, props: clone(it.props || {}) };
    selType = tid; editType = tid; touched();
    toast(t('added') + it.name);
    return tid;
  }
  function libBox(pickMode) {
    const items = libItems();
    modal('<b>' + (pickMode ? t('libTitle') : t('libHome')) + '</b>' + (items.length ? '<div class="lib" id="libGrid"></div>' : '<small>' + t('libEmpty') + '</small>') +
      '<div class="row"><button class="btn ghost" id="libClose">' + t('close') + '</button></div>');
    $('#libClose').onclick = closeModal;
    const grid = $('#libGrid');
    if (!grid) return;
    items.forEach((it, i) => {
      const d = document.createElement('div'); d.className = 'libItem';
      const c = document.createElement('canvas'); c.width = T; c.height = T;
      const img = N.spriteCanvas({ frames: it.frames }, 0); if (img) c.getContext('2d').drawImage(img, 0, 0);
      d.appendChild(c);
      d.insertAdjacentHTML('beforeend', '<div>' + esc(it.name) + '</div><small style="color:var(--dim)">' + (N.BEHAVIORS[it.beh] || {}).icon + '</small>' + (pickMode ? '' : '<button class="del">✕</button>'));
      if (pickMode) d.onclick = () => { addFromLib(it); closeModal(); if (tab === 'scene') renderPalette(); else renderTypes(); };
      else d.querySelector('.del').onclick = () => { items.splice(i, 1); persist(); libBox(false); };
      grid.appendChild(d);
    });
  }

  // ------------------------------------------------------------------ 🕘 automatic backups (kept in IndexedDB so they never fill the main save)
  const IDB = {
    db: null,
    open(cb) {
      if (this.db) return cb(this.db);
      try {
        const r = indexedDB.open('novastudio', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('snaps');
        r.onsuccess = () => { this.db = r.result; cb(this.db); };
        r.onerror = () => cb(null);
      } catch (e) { cb(null); }
    },
    get(key, cb) { this.open((db) => { if (!db) return cb(null); const q = db.transaction('snaps').objectStore('snaps').get(key); q.onsuccess = () => cb(q.result || null); q.onerror = () => cb(null); }); },
    put(key, val) { this.open((db) => { if (db) db.transaction('snaps', 'readwrite').objectStore('snaps').put(val, key); }); }
  };
  let lastSnap = 0;
  function snapNow(force) {
    if (!P) return;
    const id = pid, data = JSON.stringify(P);
    IDB.get(id, (list) => {
      list = list || [];
      if (!force && list.length && list[0].data === data) return;
      list.unshift({ t: Date.now(), data });
      IDB.put(id, list.slice(0, 12));
    });
    lastSnap = Date.now();
  }
  function autoSnap() { if (Date.now() - lastSnap > 5 * 60 * 1000) snapNow(); } // at most one every 5 minutes while you work
  function ago(ms) {
    const m = Math.floor((Date.now() - ms) / 60000);
    return m < 1 ? t('now') : m < 60 ? t('minutesAgo', m) : m < 1440 ? t('hoursAgo', Math.floor(m / 60)) : t('daysAgo', Math.floor(m / 1440));
  }

  // ------------------------------------------------------------------ state
  let P = null, pid = null, tab = 'scene', sceneIdx = 0, tool = 'draw', rectMode = false, selType = null, undo = [];
  let selSprite = null, frame = 0, pen = 'pen', color = '9', artUndo = [], editType = null;
  let player = null, playFrom = 'editor';

  function show(id) { $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id)); }
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), 2200); }
  function hint(msg) { const el = $('#hint'); el.textContent = msg; el.classList.remove('hidden'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), 2600); }
  function modal(html) { $('#modalBody').innerHTML = html; $('#modal').classList.remove('hidden'); }
  function closeModal() { $('#modal').classList.add('hidden'); }
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') closeModal(); });
  function applyLang() {
    document.documentElement.lang = lang();
    $$('[data-t]').forEach((el) => { el.innerHTML = t(el.dataset.t); });
    $$('[data-tt]').forEach((el) => { el.title = t(el.dataset.tt); });
    $('#langBtn').textContent = lang() === 'ar' ? 'English' : 'عربي';
    $('#spriteName').placeholder = t('name');
  }

  // ------------------------------------------------------------------ home
  function thumb(p, cv) {
    try { const g = new N.Game(p, { muted: true }); g.msg = null; g.render(cv.getContext('2d')); } catch (e) { /* broken projects still list */ }
  }
  function renderHome() {
    applyLang();
    const last = store.last && store.projects[store.last.pid] ? store.last : null;
    $('#resume').innerHTML = '';
    if (last) {
      const p = store.projects[last.pid], d = document.createElement('div');
      d.className = 'resume';
      d.innerHTML = '<canvas width="320" height="180"></canvas><div><b>▶ ' + t('resume') + ': ' + esc(p.name) + '</b><small>' + t('lastEdit') + ' ' + ago(p.updated) + '</small></div><span class="go">➜</span>';
      thumb(p, d.querySelector('canvas'));
      d.onclick = () => open(last.pid, true);
      $('#resume').appendChild(d);
    }
    $('#tplList').innerHTML = G.NovaTemplates.map((tp) => '<div class="card tpl" data-tpl="' + tp.id + '"><div class="big">' + tp.icon + '</div><b>' + t('tpl' + tp.id[0].toUpperCase() + tp.id.slice(1)) + '</b></div>').join('');
    const list = $('#projList');
    if (!store.order.length) { list.innerHTML = '<small style="color:var(--dim)">' + t('noGames') + '</small>'; return; }
    list.innerHTML = '';
    for (const id of store.order) {
      const p = store.projects[id], c = document.createElement('div');
      c.className = 'card';
      c.innerHTML = '<canvas width="320" height="180"></canvas><b>' + esc(p.name) + '</b><small>' + p.scenes.length + ' ' + t('scenes') + ' · ' + ago(p.updated) + '</small>' +
        '<div class="row"><button data-p="play">▶</button><button data-p="edit">✏️</button><button data-p="copy">⧉</button><button data-p="del">🗑</button></div>';
      thumb(p, c.querySelector('canvas'));
      c.querySelector('[data-p=play]').onclick = () => { open(id); playGame('home'); };
      c.querySelector('[data-p=edit]').onclick = () => open(id, true);
      c.querySelector('[data-p=copy]').onclick = () => { const n = clone(p); n.name = (p.name + t('copyOf')).slice(0, 30); addProject(n); renderHome(); };
      c.querySelector('[data-p=del]').onclick = () => confirmBox(t('delQ', esc(p.name)), () => { delete store.projects[id]; store.order = store.order.filter((x) => x !== id); if (store.last && store.last.pid === id) store.last = null; persist(true); renderHome(); });
      c.querySelector('canvas').onclick = () => open(id, true);
      list.appendChild(c);
    }
  }
  $('#tplList').addEventListener('click', (e) => {
    const c = e.target.closest('[data-tpl]'); if (!c) return;
    const tp = G.NovaTemplates.find((x) => x.id === c.dataset.tpl);
    open(addProject(clone(tp.make())));
  });
  function addProject(p) {
    const id = uid('p');
    store.projects[id] = sanitize(p);
    store.order.unshift(id);
    persist(true);
    return id;
  }
  function confirmBox(text, yes) {
    modal('<div>' + text + '</div><div class="row"><button class="btn ghost" id="mNo">' + t('cancel') + '</button><button class="btn red" id="mYes">' + t('yes') + '</button></div>');
    $('#mNo').onclick = closeModal; $('#mYes').onclick = () => { closeModal(); yes(); };
  }

  // ------------------------------------------------------------------ open a project (resume puts you back exactly where you were)
  function open(id, resume) {
    pid = id; P = store.projects[id];
    store.order = [id, ...store.order.filter((x) => x !== id)];
    const last = resume && store.last && store.last.pid === id ? store.last : null;
    sceneIdx = last ? Math.min(last.sceneIdx || 0, P.scenes.length - 1) : 0;
    undo = []; artUndo = [];
    selType = Object.keys(P.types).find((k) => P.types[k].beh === 'solid') || Object.keys(P.types)[0] || null;
    selSprite = Object.keys(P.sprites)[0] || null; editType = selType; frame = 0;
    lastSnap = 0; snapNow(); // a backup every time you open a game
    show('editor');
    setTab(last ? last.tab || 'scene' : 'scene');
    if (last && last.cam && tab === 'scene') { Object.assign(cam, last.cam); drawScene(); }
    remember(); persist();
  }
  function setTab(tb) {
    tab = tb;
    $$('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tb));
    $$('.pane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + tb));
    if (tb === 'scene') { renderPalette(); fitScene(); drawScene(); }
    if (tb === 'art') renderArt();
    if (tb === 'objects') renderTypes();
    if (tb === 'rules') renderRules();
    if (tb === 'game') renderGame();
    remember(); persist();
  }
  $$('.tab').forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));

  // ------------------------------------------------------------------ scene editor
  const cv = $('#sceneCv'), sg = cv.getContext('2d');
  const cam = { x: 0, y: 0, z: 2 };
  const scene = () => P.scenes[sceneIdx];
  const isPlayer = (tid) => P.types[tid] && N.BEHAVIORS[P.types[tid].beh].player;
  function fitScene() {
    const r = cv.getBoundingClientRect(), dpr = G.devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    const sc = scene();
    cam.z = Math.max(1, cv.height / (sc.rows * T));
    cam.x = 0; cam.y = 0;
    $('#sceneName').textContent = (sceneIdx + 1) + '/' + P.scenes.length + ' ' + sc.name;
  }
  let rectPrev = null;
  function drawScene() {
    if (!P || tab !== 'scene') return;
    const sc = scene(), z = cam.z, g = sg;
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#05060d'; g.fillRect(0, 0, cv.width, cv.height);
    g.save(); g.translate(-Math.round(cam.x), -Math.round(cam.y)); g.scale(z, z);
    g.fillStyle = sc.bg; g.fillRect(0, 0, sc.cols * T, sc.rows * T);
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1 / z;
    g.beginPath();
    for (let c = 0; c <= sc.cols; c++) { g.moveTo(c * T, 0); g.lineTo(c * T, sc.rows * T); }
    for (let r = 0; r <= sc.rows; r++) { g.moveTo(0, r * T); g.lineTo(sc.cols * T, r * T); }
    g.stroke();
    for (const [tid, c, r] of sc.objs) {
      const ty = P.types[tid], img = ty && N.spriteCanvas(P.sprites[ty.sprite], 0);
      if (img) g.drawImage(img, c * T, r * T); else { g.fillStyle = '#ff6ec7'; g.fillRect(c * T, r * T, T, T); }
    }
    if (rectPrev) {
      const [c0, r0, c1, r1] = rectPrev;
      g.fillStyle = tool === 'erase' ? 'rgba(255,77,109,0.3)' : 'rgba(39,215,255,0.25)';
      g.fillRect(c0 * T, r0 * T, (c1 - c0 + 1) * T, (r1 - r0 + 1) * T);
      g.strokeStyle = tool === 'erase' ? '#ff4d6d' : '#27d7ff'; g.lineWidth = 2 / z;
      g.strokeRect(c0 * T, r0 * T, (c1 - c0 + 1) * T, (r1 - r0 + 1) * T);
    }
    // a screen-sized frame where the game starts
    g.strokeStyle = 'rgba(255,210,63,0.5)'; g.lineWidth = 2 / z; g.strokeRect(0, 0, Math.min(N.W, sc.cols * T), Math.min(N.H, sc.rows * T));
    g.strokeStyle = 'rgba(39,215,255,0.6)'; g.strokeRect(0, 0, sc.cols * T, sc.rows * T);
    g.restore();
  }
  const ptrs = new Map();
  let stroke = null, panStart = null;
  function cellAt(e) {
    const r = cv.getBoundingClientRect(), dpr = cv.width / r.width;
    const x = ((e.clientX - r.left) * dpr + cam.x) / cam.z, y = ((e.clientY - r.top) * dpr + cam.y) / cam.z;
    return [Math.floor(x / T), Math.floor(y / T)];
  }
  const inScene = (c, r) => c >= 0 && r >= 0 && c < scene().cols && r < scene().rows;
  function setCell(c, r, erase) {
    const sc = scene(), i = sc.objs.findIndex((o) => o[1] === c && o[2] === r);
    if (erase) { if (i >= 0) sc.objs.splice(i, 1); return; }
    if (!selType) return;
    if (i >= 0) { if (sc.objs[i][0] === selType) return; sc.objs.splice(i, 1); }
    if (isPlayer(selType)) for (let j = sc.objs.length - 1; j >= 0; j--) if (isPlayer(sc.objs[j][0])) sc.objs.splice(j, 1); // one player per scene
    sc.objs.push([selType, c, r]);
  }
  function paint(e) {
    const [c, r] = cellAt(e);
    if (!inScene(c, r)) return;
    if (rectMode && (tool === 'draw' || tool === 'erase')) {
      const [c0, r0] = stroke.start;
      rectPrev = [Math.min(c0, c), Math.min(r0, r), Math.max(c0, c), Math.max(r0, r)];
      drawScene();
      return;
    }
    const k = c + ',' + r;
    if (stroke.done.has(k)) return;
    stroke.done.add(k);
    setCell(c, r, tool === 'erase');
    drawScene();
  }
  function tapTool(e) {
    const [c, r] = cellAt(e);
    if (!inScene(c, r)) return;
    const o = scene().objs.find((x) => x[1] === c && x[2] === r);
    if (tool === 'pick') {
      if (o) { selType = o[0]; setTool('draw'); renderPalette(); hint('💧 ' + P.types[o[0]].name); }
      return;
    }
    if (tool === 'here') playFromHere(c, r);
  }
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 || tool === 'move') {
      if (stroke) { if (!rectMode) touched(); else undo.pop(); }
      stroke = null; rectPrev = null;
      const pts = [...ptrs.values()];
      panStart = { cam: { ...cam }, mid: midOf(pts), dist: distOf(pts) };
      drawScene();
      return;
    }
    if (tool === 'pick' || tool === 'here') { tapTool(e); return; }
    undo.push(clone(scene().objs)); if (undo.length > 60) undo.shift();
    stroke = { done: new Set(), start: cellAt(e) };
    paint(e);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (panStart) {
      const pts = [...ptrs.values()], m = midOf(pts), dpr = cv.width / cv.getBoundingClientRect().width;
      let z = panStart.cam.z;
      if (pts.length === 2 && panStart.dist > 0) z = Math.max(0.5, Math.min(8, panStart.cam.z * distOf(pts) / panStart.dist));
      // keep the point under the fingers in place while zooming
      const wx = (panStart.mid.x * dpr + panStart.cam.x) / panStart.cam.z, wy = (panStart.mid.y * dpr + panStart.cam.y) / panStart.cam.z;
      cam.z = z; cam.x = wx * z - m.x * dpr; cam.y = wy * z - m.y * dpr;
      drawScene();
    } else if (stroke) paint(e);
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (stroke) {
      if (rectPrev) { const [c0, r0, c1, r1] = rectPrev; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) setCell(c, r, tool === 'erase'); rectPrev = null; drawScene(); }
      touched(); stroke = null;
    }
    if (!ptrs.size) { if (panStart) { panStart = null; remember(); persist(); } }
    else { const pts = [...ptrs.values()]; panStart = { cam: { ...cam }, mid: midOf(pts), dist: distOf(pts) }; }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => { e.preventDefault(); cam.z = Math.max(0.5, Math.min(8, cam.z * (e.deltaY < 0 ? 1.15 : 0.87))); drawScene(); }, { passive: false });
  function midOf(pts) { const r = cv.getBoundingClientRect(); return { x: pts.reduce((a, p) => a + p.x, 0) / pts.length - r.left, y: pts.reduce((a, p) => a + p.y, 0) / pts.length - r.top }; }
  function distOf(pts) { return pts.length < 2 ? 0 : Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); }
  G.addEventListener('resize', () => { if (P && tab === 'scene') { const z = cam.z, x = cam.x, y = cam.y; fitScene(); cam.z = z; cam.x = x; cam.y = y; drawScene(); } });

  function thumbCanvas(sp) {
    const c = document.createElement('canvas'); c.width = T; c.height = T;
    const img = N.spriteCanvas(sp, 0); if (img) c.getContext('2d').drawImage(img, 0, 0);
    return c;
  }
  function renderPalette() {
    const el = $('#palette');
    el.innerHTML = '';
    for (const id of Object.keys(P.types)) {
      const ty = P.types[id], d = document.createElement('div');
      d.className = 'pal' + (id === selType ? ' on' : '');
      d.appendChild(thumbCanvas(P.sprites[ty.sprite]));
      d.insertAdjacentHTML('beforeend', '<div class="nm">' + esc(ty.name) + '</div>');
      d.onclick = () => { selType = id; if (tool !== 'draw' && tool !== 'erase') setTool('draw'); if (tool === 'erase') setTool('draw'); renderPalette(); };
      el.appendChild(d);
    }
    const lib = document.createElement('div'); lib.className = 'pal'; lib.innerHTML = '<div style="font-size:24px;line-height:34px">📚</div><div class="nm">' + t('library') + '</div>';
    lib.onclick = () => libBox(true);
    el.appendChild(lib);
    const add = document.createElement('div'); add.className = 'pal'; add.innerHTML = '<div style="font-size:24px;line-height:34px">＋</div><div class="nm">' + t('newThing') + '</div>';
    add.onclick = () => { newType(); setTab('objects'); };
    el.appendChild(add);
  }
  function setTool(tl) {
    tool = tl;
    $$('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tl));
    const h = { pick: 'hPick', here: 'hHere' }[tl];
    if (h) hint(t(h));
  }
  $$('[data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));

  function sceneMenu() {
    const sc = scene();
    modal('<b>' + t('sceneSet') + '</b>' +
      '<label class="field"><span>' + t('name') + '</span><input id="scName" maxlength="20" value="' + esc(sc.name) + '"></label>' +
      '<div class="row"><label class="field"><span>' + t('width') + '</span><input id="scCols" type="number" min="10" max="400" value="' + sc.cols + '"></label>' +
      '<label class="field"><span>' + t('height') + '</span><input id="scRows" type="number" min="6" max="60" value="' + sc.rows + '"></label>' +
      '<label class="field"><span>' + t('bg') + '</span><input id="scBg" type="color" value="' + sc.bg + '"></label></div>' +
      '<div class="row" style="justify-content:flex-start"><button class="btn" id="scAdd">' + t('newScene') + '</button><button class="btn" id="scDup">' + t('copyScene') + '</button>' +
      (P.scenes.length > 1 ? '<button class="btn red" id="scDel">' + t('delScene') + '</button>' : '') + '</div>' +
      '<div class="row"><button class="btn play" id="scOk">' + t('done') + '</button></div>');
    $('#scOk').onclick = () => {
      sc.name = $('#scName').value.slice(0, 20) || sc.name;
      sc.cols = Math.max(10, Math.min(400, +$('#scCols').value || sc.cols));
      sc.rows = Math.max(6, Math.min(60, +$('#scRows').value || sc.rows));
      sc.bg = $('#scBg').value;
      sc.objs = sc.objs.filter((o) => o[1] < sc.cols && o[2] < sc.rows);
      touched(); closeModal(); fitScene(); drawScene();
    };
    $('#scAdd').onclick = () => { P.scenes.splice(sceneIdx + 1, 0, { name: t('sceneN') + (P.scenes.length + 1), cols: 40, rows: sc.rows, bg: sc.bg, objs: [] }); sceneIdx++; afterScene(); };
    $('#scDup').onclick = () => { const n = clone(sc); n.name = (sc.name + ' 2').slice(0, 20); P.scenes.splice(sceneIdx + 1, 0, n); sceneIdx++; afterScene(); };
    if ($('#scDel')) $('#scDel').onclick = () => { P.scenes.splice(sceneIdx, 1); sceneIdx = Math.max(0, sceneIdx - 1); afterScene(); };
  }
  function afterScene() { undo = []; touched(); closeModal(); fitScene(); drawScene(); }

  // ------------------------------------------------------------------ pixel art
  const acv = $('#artCv'), ag = acv.getContext('2d'), pv = $('#artPreview');
  const sprite = () => P.sprites[selSprite];
  function renderArt() {
    if (!selSprite || !P.sprites[selSprite]) selSprite = Object.keys(P.sprites)[0];
    const list = $('#spriteList');
    list.innerHTML = '<button class="btn" id="newSpr">＋</button>';
    for (const id of Object.keys(P.sprites)) {
      const d = document.createElement('div'); d.className = 'spr' + (id === selSprite ? ' on' : '');
      d.appendChild(thumbCanvas(P.sprites[id]));
      d.insertAdjacentHTML('beforeend', '<span>' + esc(P.sprites[id].name || id) + '</span>');
      d.onclick = () => { selSprite = id; frame = 0; artUndo = []; renderArt(); };
      list.appendChild(d);
    }
    $('#newSpr').onclick = () => {
      const id = uid('s');
      P.sprites[id] = { name: 'sprite', frames: ['.'.repeat(256)] };
      selSprite = id; frame = 0; touched(); renderArt();
    };
    $('#colors').innerHTML = Object.keys(N.PAL).map((k) => '<button class="col' + (k === color ? ' on' : '') + '" data-col="' + k + '" style="background:' + N.PAL[k] + '"></button>').join('');
    $$('[data-col]').forEach((b) => (b.onclick = () => { color = b.dataset.col; if (pen === 'erase') setPen('pen'); renderArt(); }));
    $('#spriteName').value = sprite() ? sprite().name || selSprite : '';
    if (frame >= sprite().frames.length) frame = 0;
    $('#fr0').classList.toggle('on', frame === 0); $('#fr1').classList.toggle('on', frame === 1);
    drawArt();
  }
  function drawArt() {
    const px = sprite().frames[frame];
    ag.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i++) { const ch = px[i]; if (ch !== '.') { ag.fillStyle = N.PAL[ch]; ag.fillRect((i % 16) * 16, ((i / 16) | 0) * 16, 16, 16); } }
    ag.strokeStyle = 'rgba(255,255,255,0.12)'; ag.lineWidth = 1;
    ag.beginPath(); for (let k = 0; k <= 16; k++) { ag.moveTo(k * 16 + 0.5, 0); ag.lineTo(k * 16 + 0.5, 256); ag.moveTo(0, k * 16 + 0.5); ag.lineTo(256, k * 16 + 0.5); } ag.stroke();
    ag.strokeStyle = 'rgba(255,210,63,0.25)'; ag.beginPath(); ag.moveTo(128.5, 0); ag.lineTo(128.5, 256); ag.moveTo(0, 128.5); ag.lineTo(256, 128.5); ag.stroke();
    const p = pv.getContext('2d'); p.imageSmoothingEnabled = false; p.clearRect(0, 0, 48, 48);
    const img = N.spriteCanvas(sprite(), frame); if (img) p.drawImage(img, 0, 0, 48, 48);
  }
  function setPx(i, ch) { const f = sprite().frames; const s = f[frame]; if (s[i] === ch) return; f[frame] = s.slice(0, i) + ch + s.slice(i + 1); }
  function artAt(e) { const r = acv.getBoundingClientRect(); const c = Math.floor((e.clientX - r.left) / r.width * 16), rr = Math.floor((e.clientY - r.top) / r.height * 16); return c >= 0 && c < 16 && rr >= 0 && rr < 16 ? rr * 16 + c : -1; }
  let artDown = false;
  function artPaint(e) {
    const i = artAt(e); if (i < 0) return;
    if (pen === 'fill') {
      const s = sprite().frames[frame], from = s[i]; if (from === color) return;
      const a = s.split(''), st = [i];
      while (st.length) { const k = st.pop(); if (a[k] !== from) continue; a[k] = color; const x = k % 16; if (x > 0) st.push(k - 1); if (x < 15) st.push(k + 1); if (k >= 16) st.push(k - 16); if (k < 240) st.push(k + 16); }
      sprite().frames[frame] = a.join('');
    } else setPx(i, pen === 'erase' ? '.' : color);
    drawArt();
  }
  acv.addEventListener('pointerdown', (e) => { acv.setPointerCapture(e.pointerId); artUndo.push(sprite().frames[frame]); if (artUndo.length > 60) artUndo.shift(); artDown = true; artPaint(e); });
  acv.addEventListener('pointermove', (e) => { if (artDown && pen !== 'fill') artPaint(e); });
  const artUp = () => { if (artDown) { artDown = false; touched(); renderArtList(); } };
  acv.addEventListener('pointerup', artUp); acv.addEventListener('pointercancel', artUp);
  function renderArtList() { // refresh only the thumbnails
    $$('#spriteList .spr').forEach((d, i) => { const id = Object.keys(P.sprites)[i], c = d.querySelector('canvas'), g = c.getContext('2d'); g.clearRect(0, 0, T, T); const img = N.spriteCanvas(P.sprites[id], 0); if (img) g.drawImage(img, 0, 0); });
  }
  function setPen(p) { pen = p; $$('[data-pen]').forEach((b) => b.classList.toggle('on', b.dataset.pen === p)); }
  $$('[data-pen]').forEach((b) => (b.onclick = () => setPen(b.dataset.pen)));
  $('#spriteName').addEventListener('input', (e) => { sprite().name = e.target.value.slice(0, 16); touched(); renderArtList(); });

  // ------------------------------------------------------------------ objects (types)
  function newType() {
    const id = uid('t');
    P.types[id] = { name: t('newThing'), sprite: Object.keys(P.sprites)[0], beh: 'decor', props: {} };
    editType = id; selType = id; touched();
    return id;
  }
  function renderTypes() {
    if (!editType || !P.types[editType]) editType = Object.keys(P.types)[0];
    const list = $('#typeList');
    list.innerHTML = '<button class="btn" id="newTyp">' + t('newObj') + '</button><button class="btn ghost" id="libTyp">' + t('fromLib') + '</button>';
    for (const id of Object.keys(P.types)) {
      const ty = P.types[id], d = document.createElement('div'); d.className = 'typ' + (id === editType ? ' on' : '');
      d.appendChild(thumbCanvas(P.sprites[ty.sprite]));
      d.insertAdjacentHTML('beforeend', '<div><b>' + esc(ty.name) + '</b><small>' + N.BEHAVIORS[ty.beh].icon + ' ' + behName(ty.beh) + '</small></div>');
      d.onclick = () => { editType = id; renderTypes(); };
      list.appendChild(d);
    }
    $('#newTyp').onclick = () => { newType(); renderTypes(); };
    $('#libTyp').onclick = () => libBox(true);
    const ty = P.types[editType], ed = $('#typeEdit');
    if (!ty) { ed.innerHTML = ''; return; }
    const props = N.PROPS[ty.beh] || {};
    const pname = (k) => (lang() === 'ar' ? PROP_AR[k] || k : k);
    ed.innerHTML =
      '<label class="field"><span>' + t('name') + '</span><input id="tyName" maxlength="20" value="' + esc(ty.name) + '"></label>' +
      '<div class="field"><span>' + t('whatDoes') + '</span><div class="chips" id="tyBeh">' + Object.keys(N.BEHAVIORS).map((b) => '<button class="chip' + (b === ty.beh ? ' on' : '') + '" data-b="' + b + '">' + N.BEHAVIORS[b].icon + ' ' + behName(b) + '</button>').join('') + '</div></div>' +
      (Object.keys(props).length ? '<div class="row">' + Object.keys(props).map((k) => '<label class="field"><span>' + pname(k) + '</span><input data-prop="' + k + '" ' + (k === 'text' ? 'maxlength="60"' : 'type="number"') + ' value="' + esc(ty.props[k] !== undefined ? ty.props[k] : props[k]) + '"></label>').join('') + '</div>' : '') +
      '<div class="field"><span>' + t('looksLike') + '</span><div class="chips" id="tySpr"></div></div>' +
      '<div class="row" style="justify-content:flex-start"><button class="btn play" id="tyPlace">' + t('placeIt') + '</button><button class="btn" id="tyDraw">' + t('drawIt') + '</button>' +
      '<button class="btn" id="tyLib">' + t('toLib') + '</button><button class="btn red" id="tyDel">' + t('delete') + '</button></div>';
    const spr = $('#tySpr');
    for (const sid of Object.keys(P.sprites)) {
      const b = document.createElement('button'); b.className = 'chip' + (sid === ty.sprite ? ' on' : '');
      b.appendChild(thumbCanvas(P.sprites[sid]));
      b.onclick = () => { ty.sprite = sid; touched(); renderTypes(); };
      spr.appendChild(b);
    }
    $('#tyName').oninput = (e) => { ty.name = e.target.value.slice(0, 20) || '…'; touched(); };
    $('#tyName').onchange = () => renderTypes();
    $$('#tyBeh [data-b]').forEach((b) => (b.onclick = () => { ty.beh = b.dataset.b; ty.props = {}; touched(); renderTypes(); }));
    $$('[data-prop]').forEach((i) => (i.oninput = () => { ty.props[i.dataset.prop] = i.dataset.prop === 'text' ? i.value.slice(0, 60) : +i.value || 0; touched(); }));
    $('#tyPlace').onclick = () => { selType = editType; setTool('draw'); setTab('scene'); };
    $('#tyDraw').onclick = () => { selSprite = ty.sprite; frame = 0; setTab('art'); };
    $('#tyLib').onclick = () => saveToLib(editType);
    $('#tyDel').onclick = () => confirmBox(t('delTypeQ', esc(ty.name)), () => {
      delete P.types[editType];
      for (const sc of P.scenes) sc.objs = sc.objs.filter((o) => o[0] !== editType);
      for (const r of P.rules) { if (r.when.type === editType) r.when.type = ''; for (const a of r.then) if (a.type === editType) a.type = ''; }
      if (selType === editType) selType = Object.keys(P.types)[0] || null;
      editType = null; touched(); renderTypes();
    });
  }

  // ------------------------------------------------------------------ rules
  const NEEDS_N = { score: 'number', every: 'seconds', after: 'seconds' };
  const ACT_PARAM = { score: 'n', scene: 'n', lives: 'n', bounce: 'n', speed: 'n', spawn: 'type', say: 'text', sound: 'sound' };
  const evName = (k) => (lang() === 'ar' ? EV_AR[k] : N.EVENTS[k]);
  const actName = (k) => (lang() === 'ar' ? ACT_AR[k] : N.ACTIONS[k]);
  function typeOptions(sel, blank) {
    return (blank ? '<option value="">' + blank + '</option>' : '') + Object.keys(P.types).map((k) => '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(P.types[k].name) + '</option>').join('');
  }
  function renderRules() {
    const el = $('#ruleList');
    if (!P.rules.length) { el.innerHTML = '<small style="color:var(--dim)">' + t('noRules') + '</small>'; return; }
    el.innerHTML = P.rules.map((r, i) => {
      const w = r.when;
      let wp = '';
      if (w.ev === 'touch') wp = '<select data-r="' + i + '" data-k="wtype">' + typeOptions(w.type, t('anything')) + '</select>';
      else if (NEEDS_N[w.ev]) wp = '<input type="number" data-r="' + i + '" data-k="wn" value="' + (w.n || 0) + '"> <small>' + t(NEEDS_N[w.ev]) + '</small>';
      const acts = r.then.map((a, j) => {
        const pk = ACT_PARAM[a.act];
        let ap = '';
        if (pk === 'n') ap = '<input type="number" step="any" data-r="' + i + '" data-a="' + j + '" data-k="an" value="' + (a.n || 0) + '">';
        if (pk === 'text') ap = '<input maxlength="60" data-r="' + i + '" data-a="' + j + '" data-k="at" value="' + esc(a.text) + '" placeholder="' + t('message') + '">';
        if (pk === 'sound') ap = '<select data-r="' + i + '" data-a="' + j + '" data-k="at">' + N.SOUNDS.map((s) => '<option' + (s === a.text ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>';
        if (pk === 'type') ap = '<select data-r="' + i + '" data-a="' + j + '" data-k="atype">' + typeOptions(a.type, t('pick')) + '</select>';
        return '<div class="line"><span class="then">' + (j ? t('and') : t('then')) + '</span><select data-r="' + i + '" data-a="' + j + '" data-k="act">' +
          Object.keys(N.ACTIONS).map((k) => '<option value="' + k + '"' + (k === a.act ? ' selected' : '') + '>' + actName(k) + '</option>').join('') + '</select>' + ap +
          '<button class="x" data-r="' + i + '" data-delact="' + j + '">✕</button></div>';
      }).join('');
      return '<div class="rule"><div class="line"><span class="when">' + t('when') + '</span><select data-r="' + i + '" data-k="ev">' +
        Object.keys(N.EVENTS).map((k) => '<option value="' + k + '"' + (k === w.ev ? ' selected' : '') + '>' + evName(k) + '</option>').join('') + '</select>' + wp +
        '<button class="x" data-delrule="' + i + '">🗑</button></div>' + acts +
        '<div class="line"><button class="btn ghost" data-addact="' + i + '">' + t('andAlso') + '</button></div></div>';
    }).join('');
    $$('#ruleList [data-k]').forEach((x) => (x.onchange = () => {
      const r = P.rules[+x.dataset.r], a = x.dataset.a !== undefined ? r.then[+x.dataset.a] : null, k = x.dataset.k;
      if (k === 'ev') { r.when = { ev: x.value, n: x.value === 'every' || x.value === 'after' ? 3 : x.value === 'score' ? 10 : 0, type: '' }; }
      if (k === 'wtype') r.when.type = x.value;
      if (k === 'wn') r.when.n = +x.value || 0;
      if (k === 'act') { a.act = x.value; a.n = x.value === 'speed' ? 1.5 : x.value === 'scene' ? 1 : x.value === 'score' ? 1 : 0; a.text = x.value === 'sound' ? 'beep' : ''; a.type = ''; }
      if (k === 'an') a.n = +x.value || 0;
      if (k === 'at') a.text = x.value.slice(0, 60);
      if (k === 'atype') a.type = x.value;
      touched();
      if (k === 'ev' || k === 'act') renderRules();
    }));
    $$('#ruleList [data-delrule]').forEach((b) => (b.onclick = () => { P.rules.splice(+b.dataset.delrule, 1); touched(); renderRules(); }));
    $$('#ruleList [data-delact]').forEach((b) => (b.onclick = () => { P.rules[+b.dataset.r].then.splice(+b.dataset.delact, 1); touched(); renderRules(); }));
    $$('#ruleList [data-addact]').forEach((b) => (b.onclick = () => { P.rules[+b.dataset.addact].then.push({ act: 'say', text: '!', n: 0, type: '' }); touched(); renderRules(); }));
  }

  // ------------------------------------------------------------------ game: settings, to-do, ideas, backups, share, export
  function renderGame() {
    $('#gameForm').innerHTML =
      '<label class="field"><span>' + t('gName') + '</span><input id="gName" maxlength="30" value="' + esc(P.name) + '"></label>' +
      '<div class="row"><label class="field"><span>' + t('lives') + '</span><input id="gLives" type="number" min="0" max="99" value="' + P.lives + '"></label>' +
      '<label class="field"><span>' + t('gravity') + '</span><input id="gGrav" type="number" min="0" max="3000" step="50" value="' + P.gravity + '"></label>' +
      '<label class="field"><span>' + t('showScore') + '</span><select id="gHud"><option value="1"' + (P.hud ? ' selected' : '') + '>' + t('yes') + '</option><option value="0"' + (!P.hud ? ' selected' : '') + '>' + t('cancel') + '</option></select></label></div>' +
      '<div class="field"><span>' + t('todo') + '</span><div class="todo" id="todo"></div><div class="row"><input id="todoIn" maxlength="120" placeholder="' + t('todoPh') + '" style="flex:1"><button class="btn" id="todoAdd">＋</button></div></div>' +
      '<label class="field"><span>' + t('ideas') + '</span><textarea class="idea" id="idea" maxlength="4000" placeholder="' + t('ideasPh') + '">' + esc(P.idea) + '</textarea></label>' +
      '<div class="row" style="justify-content:flex-start;gap:8px">' +
      '<button class="btn play" id="gExport">' + t('exportHtml') + '</button><button class="btn" id="gShare">' + t('shareCode') + '</button>' +
      '<button class="btn" id="gBackups">' + t('backups') + '</button><button class="btn" id="gDup">' + t('duplicate') + '</button><button class="btn red" id="gDel">' + t('delGame') + '</button></div>' +
      '<small style="color:var(--dim)">' + t('exportNote') + '</small>';
    renderTodo();
    const add = () => { const v = $('#todoIn').value.trim(); if (!v) return; P.notes.push({ text: v.slice(0, 120), done: false }); $('#todoIn').value = ''; touched(); renderTodo(); };
    $('#todoAdd').onclick = add;
    $('#todoIn').onkeydown = (e) => { if (e.key === 'Enter') add(); };
    $('#idea').oninput = (e) => { P.idea = e.target.value.slice(0, 4000); touched(); };
    $('#gName').oninput = (e) => { P.name = e.target.value.slice(0, 30) || 'My Game'; touched(); };
    $('#gLives').oninput = (e) => { P.lives = Math.max(0, Math.min(99, +e.target.value || 0)); touched(); };
    $('#gGrav').oninput = (e) => { P.gravity = Math.max(0, Math.min(3000, +e.target.value || 0)); touched(); };
    $('#gHud').onchange = (e) => { P.hud = e.target.value === '1'; touched(); };
    $('#gExport').onclick = exportHtml;
    $('#gShare').onclick = shareCode;
    $('#gBackups').onclick = backupsBox;
    $('#gDup').onclick = () => { const n = clone(P); n.name = (P.name + t('copyOf')).slice(0, 30); open(addProject(n)); toast(t('copyMade')); };
    $('#gDel').onclick = () => confirmBox(t('delQ', esc(P.name)), () => { delete store.projects[pid]; store.order = store.order.filter((x) => x !== pid); store.last = null; persist(true); P = null; goHome(); });
  }
  function renderTodo() {
    const el = $('#todo');
    if (!el) return;
    // unfinished tasks first
    const order = P.notes.map((n, i) => i).sort((a, b) => P.notes[a].done - P.notes[b].done);
    el.innerHTML = order.map((i) => '<div class="it' + (P.notes[i].done ? ' done' : '') + '"><input type="checkbox" data-td="' + i + '"' + (P.notes[i].done ? ' checked' : '') + '><span>' + esc(P.notes[i].text) + '</span><button data-tdx="' + i + '">✕</button></div>').join('');
    $$('[data-td]').forEach((c) => (c.onchange = () => { P.notes[+c.dataset.td].done = c.checked; touched(); renderTodo(); }));
    $$('[data-tdx]').forEach((b) => (b.onclick = () => { P.notes.splice(+b.dataset.tdx, 1); touched(); renderTodo(); }));
  }
  function backupsBox() {
    IDB.get(pid, (list) => {
      list = list || [];
      modal('<b>' + t('backups') + '</b><small style="color:var(--dim)">' + t('backupsNote') + '</small>' +
        (list.length ? '<div class="snaps">' + list.map((s, i) => { let n = '?'; try { const p = JSON.parse(s.data); n = p.scenes.reduce((a, sc) => a + sc.objs.length, 0); } catch (e) { /* skip */ } return '<button class="btn ghost" data-snap="' + i + '">🕘 ' + ago(s.t) + ' · ' + new Date(s.t).toLocaleString() + ' · ' + n + ' ▦</button>'; }).join('') + '</div>' : '<small>' + t('noBackups') + '</small>') +
        '<div class="row"><button class="btn ghost" id="bkClose">' + t('close') + '</button></div>');
      $('#bkClose').onclick = closeModal;
      $$('[data-snap]').forEach((b) => (b.onclick = () => confirmBox(t('restore') + '?', () => {
        const p = sanitize(JSON.parse(list[+b.dataset.snap].data));
        if (!p) return;
        snapNow(true); // keep what you had, just in case
        store.projects[pid] = p; P = p; persist(true);
        toast(t('restored'));
        open(pid);
      })));
    });
  }

  const PLAYER_CSS = 'html,body{margin:0;height:100%;background:#000;overflow:hidden}' +
    '.nv-host{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.nv-screen{width:min(100vw,177.78vh);height:min(56.25vw,100vh);image-rendering:pixelated}.nv-pad{position:absolute;inset:0;pointer-events:none}' +
    '.nv-btn{pointer-events:auto;position:absolute;bottom:16px;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3);color:#fff;font:26px sans-serif;display:flex;align-items:center;justify-content:center;touch-action:none}' +
    '.nv-btn.l1{left:18px}.nv-btn.l2{left:94px}.nv-btn.r1{right:22px;width:76px;height:76px}.nv-btn.u1{left:56px;bottom:90px}.nv-btn.d1{left:56px;bottom:16px}' +
    '.nv-pad:has(.u1) .nv-btn.l1{bottom:52px;left:0}.nv-pad:has(.u1) .nv-btn.l2{bottom:52px;left:112px}.nv-tapzone{pointer-events:auto;position:absolute;inset:0}' +
    '.brand{position:fixed;right:8px;top:6px;color:rgba(255,255,255,.45);font:11px sans-serif;pointer-events:none}';
  function gameHtml(p) {
    const pub = clone(p); delete pub.notes; delete pub.idea; // your notes stay private
    const data = JSON.stringify(pub).replace(/</g, '\\u003c');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">' +
      '<title>' + esc(p.name) + '</title><style>' + PLAYER_CSS + '</style></head><body><div id="game"></div><div class="brand">Made with NOVA STUDIO</div>' +
      '<script>\n' + NovaRuntime.toString() + '\nNovaRuntime(window);\nvar NOVA_GAME = ' + data + ';\nNova.mount(document.getElementById("game"), NOVA_GAME, {});\n<\/script></body></html>';
  }
  function fileName(ext) { return ((P.name || 'game').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'game') + '.' + ext; }
  function saveFile(name, text, mime) {
    if (G.AndroidBridge && G.AndroidBridge.saveFile) {
      G.AndroidBridge.saveFile(btoa(unescape(encodeURIComponent(text))), name, mime);
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(t('saved') + name);
  }
  function exportHtml() { saveFile(fileName('html'), gameHtml(P), 'text/html'); }

  const b64 = (buf) => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  async function packCode(p) {
    const pub = clone(p); delete pub.notes; delete pub.idea;
    const json = JSON.stringify(pub);
    if (G.CompressionStream) {
      const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
      return 'NOVA1:' + b64(buf);
    }
    return 'NOVA0:' + btoa(unescape(encodeURIComponent(json)));
  }
  async function unpackCode(code) {
    code = String(code || '').trim();
    if (/^NOVA1:/.test(code)) {
      const bin = atob(code.slice(6)), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
    }
    if (/^NOVA0:/.test(code)) return JSON.parse(decodeURIComponent(escape(atob(code.slice(6)))));
    const m = code.match(/var NOVA_GAME = (\{[\s\S]*?\});\nNova\.mount/); // an exported HTML game
    if (m) return JSON.parse(m[1]);
    return JSON.parse(code);
  }
  async function shareCode() {
    const code = await packCode(P);
    modal('<b>' + t('codeTitle', esc(P.name)) + '</b><textarea id="codeOut" readonly>' + esc(code) + '</textarea>' +
      '<small style="color:var(--dim)">' + t('codeNote') + '</small>' +
      '<div class="row"><button class="btn ghost" id="cClose">' + t('close') + '</button><button class="btn" id="cCopy">' + t('copy') + '</button><button class="btn play" id="cSend">' + t('send') + '</button></div>');
    $('#cClose').onclick = closeModal;
    $('#cCopy').onclick = () => { const ta = $('#codeOut'); ta.select(); try { navigator.clipboard.writeText(code).then(() => toast(t('copied')), () => { document.execCommand('copy'); toast(t('copied')); }); } catch (e) { document.execCommand('copy'); toast(t('copied')); } };
    $('#cSend').onclick = () => {
      if (G.AndroidBridge && G.AndroidBridge.shareText) G.AndroidBridge.shareText(code);
      else if (navigator.share) navigator.share({ text: code }).catch(() => {});
      else $('#cCopy').click();
    };
  }
  function importBox() {
    modal('<b>' + t('impTitle') + '</b><textarea id="codeIn" placeholder="' + t('impPh') + '"></textarea>' +
      '<div class="row" style="justify-content:space-between"><label class="btn ghost">' + t('openFile') + '<input type="file" id="fileIn" accept=".html,.htm,.json,.txt" hidden></label>' +
      '<span><button class="btn ghost" id="iClose">' + t('cancel') + '</button> <button class="btn play" id="iGo">' + t('importBtn') + '</button></span></div>');
    const go = async (text) => {
      try {
        const p = sanitize(await unpackCode(text));
        if (!p) throw new Error('bad');
        const id = addProject(p); closeModal(); toast(t('imported', p.name)); open(id);
      } catch (e) { toast(t('notGame')); }
    };
    $('#iClose').onclick = closeModal;
    $('#iGo').onclick = () => go($('#codeIn').value);
    $('#fileIn').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => go(String(r.result)); r.readAsText(f); };
  }

  // ------------------------------------------------------------------ play
  function playGame(from, proj, scene0) {
    playFrom = from || 'editor';
    persist(true);
    show('play');
    player = N.mount($('#playHost'), proj || clone(P), { scene: scene0 !== undefined ? scene0 : from === 'editor' && tab === 'scene' ? sceneIdx : 0 });
  }
  // 🎯 test from here: the player starts on the cell you tapped
  function playFromHere(c, r) {
    const p = clone(P), sc = p.scenes[sceneIdx];
    const pl = sc.objs.find((o) => isPlayer(o[0]));
    if (!pl) { toast(t('noPlayer')); return; }
    sc.objs = sc.objs.filter((o) => o === pl || !(o[1] === c && o[2] === r));
    pl[1] = c; pl[2] = r;
    playGame('editor', p, sceneIdx);
  }
  function stopGame() {
    if (player) { player.stop(); player = null; }
    if (playFrom === 'home') goHome();
    else { show('editor'); const keep = { ...cam }; setTab(tab); if (tab === 'scene') { Object.assign(cam, keep); drawScene(); } }
  }
  function goHome() { if (P) snapNow(); P = null; renderHome(); show('home'); }

  // ------------------------------------------------------------------ buttons
  const ACT = {
    home: () => { remember(); persist(true); goHome(); },
    play: () => playGame('editor'),
    stop: stopGame,
    import: importBox,
    library: () => libBox(false),
    lang: () => { store.lang = lang() === 'ar' ? 'en' : 'ar'; persist(true); applyLang(); if (P) setTab(tab); else renderHome(); },
    rectMode: () => { rectMode = !rectMode; $('#rectBtn').classList.toggle('on', rectMode); if (tool !== 'draw' && tool !== 'erase') setTool('draw'); if (rectMode) hint(t('hRect')); },
    undo: () => { if (undo.length) { scene().objs = undo.pop(); touched(); drawScene(); } },
    scenePrev: () => { if (sceneIdx > 0) { sceneIdx--; undo = []; fitScene(); drawScene(); remember(); persist(); } },
    sceneNext: () => { if (sceneIdx < P.scenes.length - 1) { sceneIdx++; undo = []; fitScene(); drawScene(); remember(); persist(); } },
    sceneMenu,
    addRule: () => { P.rules.push({ when: { ev: 'touch', type: '', n: 0 }, then: [{ act: 'say', text: '!', n: 0, type: '' }] }); touched(); renderRules(); },
    artMirror: () => { artUndo.push(sprite().frames[frame]); const s = sprite().frames[frame].split(''); for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) s[r * 16 + 15 - c] = s[r * 16 + c]; sprite().frames[frame] = s.join(''); touched(); drawArt(); renderArtList(); },
    artUndo: () => { if (artUndo.length) { sprite().frames[frame] = artUndo.pop(); touched(); drawArt(); renderArtList(); } },
    artClear: () => { artUndo.push(sprite().frames[frame]); sprite().frames[frame] = '.'.repeat(256); touched(); drawArt(); renderArtList(); },
    frame0: () => { frame = 0; artUndo = []; renderArt(); },
    frame1: () => { const f = sprite().frames; if (f.length < 2) { f.push(f[0]); touched(); toast(t('frame2')); } frame = 1; artUndo = []; renderArt(); }
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) ACT[b.dataset.act](); });
  // on a computer: Ctrl+Z undo, Space/Enter play, Esc back
  G.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
    if ($('#play').classList.contains('on')) { if (e.key === 'Escape') stopGame(); return; }
    if (!P) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); tab === 'art' ? ACT.artUndo() : ACT.undo(); }
    else if (e.key === 'Enter') ACT.play();
    else if (e.key === 'Escape') ACT.home();
  });

  // Android back button
  G.NovaBack = function () {
    if (!$('#modal').classList.contains('hidden')) { closeModal(); return true; }
    if ($('#play').classList.contains('on')) { stopGame(); return true; }
    if ($('#editor').classList.contains('on')) { ACT.home(); return true; }
    return false;
  };
  G.addEventListener('pagehide', () => { remember(); persist(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { remember(); persist(true); if (P) snapNow(); } });

  G.NovaStudio = { store, open, sanitize, packCode, unpackCode, gameHtml, libItems, get P() { return P; } };
  applyLang();
  // straight back to the game you were working on
  if (store.last && store.projects[store.last.pid]) open(store.last.pid, true);
  else renderHome();
})(window);
