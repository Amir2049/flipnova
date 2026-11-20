// FLIPNOVA — world leaderboards.
// Every submitted score carries a proof (level seed + the tick of every tap). Before a score is shown,
// THIS device replays the run with the real game code and checks it reproduces the same result.
// So nobody can type in a fake score: unverifiable entries are simply not displayed.
(function (FF) {
  'use strict';
  const O = {};
  FF.Online = O;
  const TABLE = 'ff_scores';
  const VKEY = 'flipfrenzy.verified.v1';
  // bump when physics or level generation change: older proofs belong to an older 'season' and are hidden quietly
  O.PROOF_V = 17; // 17: rules v14 (CLOSE SHAVE x3 coins, b66); // 16: rules v13 (the pace keeps climbing in part 2, b64); // 15: rules v12 (late-speed stretch in every stage, b62); // 14: rules v11 (5-7 tap beats, three new worlds, b61); // 13: rules v10 (stages keep their book length, b60); // 11: Endless/Daily rules v8 (beats, tap grades, landing near miss); 12: rules v9 (gentler speed climb)
  // which Endless rules a proof was played under (see FF.GEN)
  O.genOf = (v) => (v >= 17 ? 14 : v >= 16 ? 13 : v >= 15 ? 12 : v >= 14 ? 11 : v >= 13 ? 10 : v >= 12 ? 9 : v >= 11 ? 8 : v >= 10 ? 7 : v >= 9 ? 6 : v >= 5 ? 5 : v >= 4 ? 4 : 3);
  // v5 runs are played on the stage book (js/stages.js); a run made on a different book can't be replayed here
  // v5/v6 proofs only name their book; from v7 a proof carries the whole book, so it replays whatever is published later
  O.bookOk = (pr) => !pr || pr.v < 5 || pr.v >= 7 || pr.b === FF.BOOK.id;
  O.proofBook = (pr) => {
    if (!pr || pr.v < 7) return null;
    if (!pr.bk || typeof pr.bk !== 'object') return false;
    const book = FF.compileBook(pr.bk);
    return book.id === pr.b ? book : false;
  };

  O.cfg = () => {
    const c = FF.ONLINE_CONFIG || {};
    const o = (FF.save && FF.save.onlineOverride) || {};
    return { url: (o.url || c.url || '').replace(/\/+$/, ''), key: o.key || c.key || '' };
  };
  O.enabled = () => { const c = O.cfg(); return !!(c.url && c.key); };
  // automated test browsers never post to the real board (they still can when pointed at a test server)
  O.canSend = () => O.enabled() && !(navigator.webdriver && !(FF.save && FF.save.onlineOverride));

  function headers(extra) {
    const c = O.cfg();
    return Object.assign({ apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }, extra || {});
  }

  // ---------------- proofs for normal runs (endless / daily)
  O.encodeRun = function (res, meta) {
    let prev = 0;
    const i = (res.inputs || []).map((v) => { const x = v - prev; prev = v; return x.toString(36); }).join('.');
    const book = res.book || FF.BOOK;
    const raw = JSON.stringify({ v: O.PROOF_V, m: res.mode, s: res.seed, dt: res.date || '', sc: res.score, d: res.dist, st: res.stage || 1, b: book.id, bk: FF.bookRaw(book), i });
    return 'FFRUN:' + btoa(unescape(encodeURIComponent(raw)));
  };
  O.decodeRun = function (code) {
    try {
      const m = String(code).match(/FFRUN:([A-Za-z0-9+/=]+)/);
      if (!m) return null;
      const o = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      let acc = 0;
      const inputs = (o.i ? o.i.split('.') : []).map((x) => (acc += parseInt(x, 36)));
      return { v: o.v || 1, mode: o.m, seed: o.s, date: o.dt, score: o.sc, dist: o.d, stage: o.st, b: o.b, bk: o.bk, inputs };
    } catch (e) { return null; }
  };
  // Replays a run and returns what it really scores.
  O.replayRun = function (pr) {
    const book = O.proofBook(pr) || undefined;
    const g = new FF.Game({ mode: pr.mode, seed: pr.seed, replay: pr.inputs, genV: O.genOf(pr.v || 1), book, silent: true, settings: {}, callbacks: {}, seen: {} });
    let n = 0;
    while (!g.dead && !g.finished && n++ < 260000) g.tick(FF.STEP);
    return { score: g.score, dist: Math.floor(g.p.x / 10), dead: !!g.dead, finished: !!g.finished };
  };

  // 👻 a verified weekly run, replayed into a ghost path (x, y every 4 ticks) — the same recording a Daily ghost uses
  O.ghostOf = function (proof) {
    const pr = O.decodeRun(proof);
    if (!pr || pr.mode !== 'endless' || !O.bookOk(pr) || O.proofBook(pr) === false) return null;
    const book = O.proofBook(pr) || undefined;
    const g = new FF.Game({ mode: 'endless', seed: pr.seed, replay: pr.inputs, genV: O.genOf(pr.v || 1), book, silent: true, settings: {}, callbacks: {}, seen: {} });
    let n = 0;
    while (!g.dead && !g.finished && n++ < 260000) g.tick(FF.STEP);
    return g.weekRun && g.ghostRec.length > 4 ? g.ghostRec : null;
  };

  O.isCurrent = function (row) {
    const pr = O.decodeRun(row.proof);
    return !pr || (pr.v === O.PROOF_V && O.bookOk(pr)); // undecodable rows go on to verification (and count as fake)
  };

  // ---------------- verification (cached on this device)
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(VKEY)) || {}; } catch (e) { cache = {}; }
  const saveCache = () => { try { localStorage.setItem(VKEY, JSON.stringify(cache)); } catch (e) { /* ok */ } };
  O.verifyEntry = function (row) {
    const key = O.PROOF_V + '|' + FF.BOOK.id + '|' + row.board + '|' + FF.hashStr(row.proof || '') + '|' + row.score;
    if (cache[key] !== undefined) return cache[key];
    let ok = false;
    try {
      { // build 36: only Endless and Daily rows are shown (the Legend board is gone)
        const pr = O.decodeRun(row.proof);
        if (pr && O.bookOk(pr) && O.proofBook(pr) !== false && pr.score === row.score && pr.dist === row.dist) {
          const isDaily = row.board.indexOf('daily-') === 0;
          const modeOk = isDaily ? pr.mode === 'daily' && 'daily-' + pr.date === row.board && pr.seed === FF.hashStr('daily-' + pr.date) : pr.mode === 'endless' && row.board === 'endless';
          if (modeOk) {
            const r = O.replayRun(pr);
            ok = (r.dead || r.finished) && r.score === row.score && r.dist === row.dist; // a run ends by a crash, or by clearing the last stage
          }
        }
      }
    } catch (e) { ok = false; }
    cache[key] = ok;
    saveCache();
    return ok;
  };

  // ---------------- network
  O.top = async function (board, limit) {
    if (!O.enabled()) throw new Error('offline');
    const c = O.cfg();
    const order = 'score.desc,created_at.asc';
    const q = c.url + '/rest/v1/' + TABLE + '?select=id,created_at,board,name,score,dist,stage,skin,proof,device&board=eq.' + encodeURIComponent(board) + '&order=' + order + '&limit=' + (limit || 60);
    // never hang on a bad connection: give up after 15s and say why
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(q, { headers: headers(), signal: ctl ? ctl.signal : undefined, cache: 'no-store' });
      if (!r.ok) { let body = ''; try { body = (await r.text()).slice(0, 80); } catch (e) { /* none */ } throw new Error('HTTP ' + r.status + (body ? ' ' + body : '')); }
      return await r.json();
    } catch (e) {
      throw new Error(e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || String(e));
    } finally { if (timer) clearTimeout(timer); }
  };
  // 🗓 this week's Endless runs (read only: the same rows the world board already has, newest week only)
  O.weekTop = async function (startMs) {
    if (!O.enabled()) throw new Error('offline');
    const c = O.cfg();
    const q = c.url + '/rest/v1/' + TABLE + '?select=id,created_at,board,name,score,dist,stage,skin,proof,device&board=eq.endless&created_at=gte.' + encodeURIComponent(new Date(startMs).toISOString()) + '&order=score.desc,created_at.asc&limit=300';
    const r = await fetch(q, { headers: headers(), cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  // 👥 friends: the best Endless runs of a few names (no minimum score — everyone shows)
  O.friendsTop = async function (names) {
    if (!O.enabled()) throw new Error('offline');
    const list = names.map((n) => '"' + String(n).replace(/["\\]/g, '') + '"').join(',');
    if (!list) return [];
    const c = O.cfg();
    const q = c.url + '/rest/v1/' + TABLE + '?select=id,created_at,board,name,score,dist,stage,skin,proof,device&board=eq.endless&name=in.(' + encodeURIComponent(list) + ')&order=score.desc&limit=200';
    const r = await fetch(q, { headers: headers(), cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  // ---------------- names: every name belongs to one player (tools/supabase-v9.sql)
  O.key = (n) => String(n || '').replace(/\s/g, '').toLowerCase();
  // the secret that proves this device owns its name (never shown, never sent anywhere but our own server)
  O.token = function () {
    const s = FF.save;
    if (!s.playerToken) {
      const a = new Uint8Array(20);
      (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256));
      s.playerToken = Array.from(a, (x) => x.toString(16).padStart(2, '0')).join('');
      FF.UI.persist();
    }
    return s.playerToken;
  };
  // the name each player uses NOW (ff_names, tools/supabase-names.sql), so a renamed player shows up under the new name
  O.currentNames = async function (devices) {
    const ds = [...new Set(devices.filter((d) => /^[a-z0-9]{4,20}$/.test(d || '')))];
    if (!O.enabled() || !ds.length) return {};
    const c = O.cfg();
    try {
      const r = await fetch(c.url + '/rest/v1/ff_names?select=device,name&device=in.(' + ds.join(',') + ')', { headers: headers(), cache: 'no-store' });
      if (!r.ok) return {};
      const out = {};
      for (const x of await r.json()) out[x.device] = x.name;
      return out;
    } catch (e) { return {}; }
  };
  // the world boards list each player's best score, from this score up
  O.MIN_SHOW = { endless: 10000, daily: 5000 };
  O.WEEK_SEND = false; // true = weekly bests go to the server even when they aren't an all-time best (more rows on the Week board)
  O.minFor = (board) => (board === 'endless' ? O.MIN_SHOW.endless : String(board).indexOf('daily-') === 0 ? O.MIN_SHOW.daily : 0);
  O.named = () => !!(FF.save.name && FF.save.nameClaimed === O.key(FF.save.name));
  async function rpc(fn, body) {
    const c = O.cfg();
    const r = await fetch(c.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (r.status === 404) return { missing: true }; // the server hasn't got v9 yet
    if (!r.ok) throw new Error('http ' + r.status);
    return { v: await r.json() };
  }
  // 'ok' | 'taken' | 'bad' | 'limit' | 'nosrv'
  O.claimName = async function (name) {
    if (!O.canSend()) throw new Error('offline');
    const r = await rpc('claim_name', { p_name: String(name || '').trim(), p_token: O.token(), p_device: O.deviceId() });
    if (r.missing) { O.oldServer = true; return 'nosrv'; }
    if (r.v === 'ok') { FF.save.nameClaimed = O.key(name); FF.UI.persist(); }
    return r.v;
  };
  O.submit = async function (entry) {
    if (!O.canSend()) throw new Error('offline');
    if (!O.oldServer) {
      const r = await rpc('submit_score', { p_token: O.token(), p_board: entry.board, p_score: entry.score, p_dist: entry.dist, p_stage: entry.stage, p_skin: entry.skin, p_proof: entry.proof, p_device: entry.device });
      if (!r.missing) {
        if (r.v === 'noname') { FF.save.nameClaimed = ''; FF.UI.persist(); }
        if (r.v !== 'ok') throw new Error(String(r.v));
        return true;
      }
      O.oldServer = true;
    }
    const c = O.cfg();
    const r = await fetch(c.url + '/rest/v1/' + TABLE, { method: 'POST', headers: headers({ Prefer: 'return=minimal' }), body: JSON.stringify(entry) });
    if (!r.ok) throw new Error('http ' + r.status);
    return true;
  };
  // gift codes live on the server (tools/supabase-gifts.sql): ask whether THIS code is one
  O.redeem = async function (code) {
    if (!O.enabled()) throw new Error('offline');
    const c = O.cfg();
    const r = await fetch(c.url + '/rest/v1/rpc/redeem_gift', { method: 'POST', headers: headers(), body: JSON.stringify({ code: String(code || '') }) });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    return j && typeof j === 'object' ? j : null;
  };
  // "a newer version is out" notice: the newest build number + its download link live in public.ff_meta
  // (see tools/supabase-update.sql). Keep BUILD equal to versionCode in android/app/build.gradle.
  O.BUILD = 48;
  O.checkUpdate = async function () {
    if (!O.enabled()) return null;
    const c = O.cfg();
    const r = await fetch(c.url + '/rest/v1/ff_meta?id=eq.1&select=build,url,note', { headers: headers(), cache: 'no-store' });
    if (!r.ok) return null;
    const m = (await r.json())[0];
    return m && +m.build > O.BUILD && /^https:\/\//.test(m.url || '') ? m : null;
  };
  // ---------------- the stage book everyone plays (published from the Stage Maker into ff_meta.book)
  const BKEY = 'flipnova.book';
  // only stages published from the Maker after 30 Oct 2026 (they carry a `stamp`) replace the built-in ones:
  // the book published before that (stage 1 edited by accident) is ignored, so the game starts with the original stages again
  O.BOOK_MIN_STAMP = Date.UTC(2026, 9, 30, 20, 0);
  const fresh = (raw) => !!(raw && +raw.stamp >= O.BOOK_MIN_STAMP);
  O.useBook = function (raw) {
    if (raw && !fresh(raw)) raw = null;
    const before = FF.BOOK.id;
    FF.BOOK = FF.compileBook(raw || FF.STAGE_BOOK);
    try { if (raw) localStorage.setItem(BKEY, JSON.stringify(raw)); else localStorage.removeItem(BKEY); } catch (e) { /* ok */ }
    return FF.BOOK.id !== before;
  };
  // the last published book is remembered, so the game plays the same stages offline
  O.cachedBook = function () {
    try { const b = JSON.parse(localStorage.getItem(BKEY)); return b && Array.isArray(b.stages) && b.stages.length && fresh(b) ? b : null; } catch (e) { return null; }
  };
  O.loadBook = async function () {
    if (!O.enabled()) return false;
    const c = O.cfg();
    const r = await fetch(c.url + '/rest/v1/ff_meta?id=eq.1&select=book', { headers: headers(), cache: 'no-store' });
    if (!r.ok) return false; // a server without the v9 column: keep the built-in stages
    const m = (await r.json())[0];
    const raw = m && m.book && Array.isArray(m.book.stages) && m.book.stages.length ? m.book : null;
    return O.useBook(raw);
  };
  // is this the owner's code? (checked on the server — the game itself knows nothing about it)
  O.ownerCheck = async function (code) {
    if (!O.canSend()) return false;
    const r = await rpc('owner_check', { p_code: String(code || '') });
    return !r.missing && r.v === true;
  };
  // 'ok' | 'denied' | 'bad' | 'limit' | 'nosrv'
  O.publishBook = async function (code, raw) {
    if (!O.enabled()) throw new Error('offline');
    const r = await rpc('publish_book', { p_code: String(code || ''), p_book: raw });
    if (r.missing) return 'nosrv';
    if (r.v === 'ok') O.useBook(raw);
    return r.v;
  };
  // queue so scores made offline are sent later
  O.queue = function (entry) {
    const s = FF.save;
    s.pendingScores = (s.pendingScores || []).filter((e) => e.board !== entry.board || e.score > entry.score).concat([entry]).slice(-20);
    FF.UI.persist();
    O.flush();
  };
  O.flush = async function () {
    const s = FF.save;
    if (!O.canSend() || !s.pendingScores || !s.pendingScores.length || O.busy) return;
    O.busy = true;
    // no world board without a name of your own: try to claim the one typed in; if it's taken, wait for a new one
    if (!O.named() && !O.oldServer) {
      let res = 'none';
      try { if (s.name) res = await O.claimName(s.name); } catch (e) { res = 'offline'; }
      if (res !== 'ok' && res !== 'nosrv') { O.busy = false; if (O.onNeedName) O.onNeedName(res); return; }
    }
    const left = [];
    for (const e of s.pendingScores) {
      try { await O.submit(e); if (O.onSent) O.onSent(e); } catch (err) { left.push(e); }
    }
    s.pendingScores = left;
    FF.UI.persist();
    O.busy = false;
  };
  // ---------------- anonymous counter (build 35, tools/supabase-counter.sql)
  // Sends ONLY the event name, e.g. {"ev":"open"} — no name, no device id, no score, nothing else. The server keeps
  // daily totals. This device sends each event at most once a day ('run': at most 20 a day), remembered in localStorage.
  // Never in the Maker app, never for the owner, never from automated test browsers unless pointed at the mock server.
  O.COUNT_EVENTS = ['open', 'back', 'tut', 'stage3', 'share', 'vs_open', 'run'];
  O.COUNT_RUN_MAX = 20;
  const CKEY = 'flipnova.count.v1';
  O.count = function (ev) {
    try {
      if (O.COUNT_EVENTS.indexOf(ev) < 0 || FF.MAKER_APP || window.FF_LINK) return false;
      if (FF.save && FF.save.owner) return false;
      if (!O.canSend()) return false;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
      const day = FF.todayKey();
      let st = null;
      try { st = JSON.parse(localStorage.getItem(CKEY)); } catch (e) { st = null; }
      if (!st || typeof st !== 'object') st = {};
      if (st.day !== day) { st.day = day; st.sent = {}; st.runs = 0; }
      if (!st.sent) st.sent = {};
      if (ev === 'run') { if ((st.runs || 0) >= O.COUNT_RUN_MAX) return false; st.runs = (st.runs || 0) + 1; }
      else { if (st.sent[ev]) return false; st.sent[ev] = 1; }
      try { localStorage.setItem(CKEY, JSON.stringify(st)); } catch (e) { return false; } // can't remember it → don't send
      const c = O.cfg();
      fetch(c.url + '/rest/v1/rpc/count_event', { method: 'POST', headers: headers(), body: JSON.stringify({ ev }), keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer' }).catch(() => {});
      return true;
    } catch (e) { return false; }
  };
  // the device's first day, kept only on the device; 'back' = opened on a later day than that
  O.countOpen = function () {
    let st = null;
    try { st = JSON.parse(localStorage.getItem(CKEY)); } catch (e) { st = null; }
    const day = FF.todayKey();
    let first = st && st.first;
    if (!first) {
      // a player from before build 35 (already has runs) is a returning player; a brand-new device starts today
      first = FF.save && FF.save.runs > 0 ? '0000-00-00' : day;
      try { localStorage.setItem(CKEY, JSON.stringify(Object.assign(st || {}, { first }))); } catch (e) { /* private mode */ }
    }
    O.count('open');
    if (first < day) O.count('back');
  };

  O.deviceId = function () {
    const s = FF.save;
    if (!s.deviceId) { s.deviceId = Math.random().toString(36).slice(2, 12); FF.UI.persist(); }
    return s.deviceId;
  };
})(window.FF);
