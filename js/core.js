// FLIPNOVA — core constants & helpers (shared by every module)
window.FF = window.FF || {};
(function (FF) {
  'use strict';
  // the FLIPNOVA Maker app (android maker flavor) opens index.html?maker=1: straight into the Stage Maker
  FF.MAKER_APP = typeof location !== 'undefined' && /[?&]maker=1\b/.test(location.search);

  // Logical (pixel-art) resolution. Everything is drawn at this size then scaled up.
  // Landscape: wide view = more time to read what's coming.
  FF.W = 320;
  FF.H = 180;
  FF.C = 36;          // ceiling surface (y)
  FF.F = 156;         // floor surface (y)
  FF.MID = 96;
  FF.PLAYER_X = 64;   // player's fixed screen x
  FF.PW = 12;
  FF.PH = 12;
  FF.G = 2600;        // gravity (px/s^2)
  FF.MAXV = 460;      // terminal velocity
  FF.FLIP_KICK = 60;  // initial push when flipping
  FF.STEP = 1 / 120;  // fixed physics step

  FF.COLORS = {
    blue: '#27d7ff', blueDark: '#0b6b94', blueLight: '#b8f3ff',
    purple: '#b45cff', purpleDark: '#55248f', purpleLight: '#e6c8ff',
    hazard: '#ff3355', hazardLight: '#ffd0d8', hazardDark: '#86102b',
    coin: '#ffd23f', coinDark: '#a8740a', coinLight: '#fff6c2',
    gold: '#ffb000', white: '#ffffff', ink: '#070a18',
    perfect: '#7dffb2', near: '#ffe066', frenzy: '#ff5ad1'
  };

  FF.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  FF.lerp = (a, b, t) => a + (b - a) * t;
  FF.rand = Math.random;

  // Small fast deterministic RNG (seeded runs: Daily Remix, Weekly).
  FF.mulberry32 = function (seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    return r;
  };

  FF.hashStr = function (s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  FF.todayKey = function () {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  // 🗓 WEEKLY CHALLENGE: one Endless road for everyone, from Friday 20:00 Cairo time to the next Friday 20:00.
  // Cairo's clock offset comes from the browser's time-zone data (summer time included); +2 h if it has none.
  FF.cairoOffset = function (ms) {
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const v = {};
      for (const x of f.formatToParts(new Date(ms))) v[x.type] = +x.value;
      const off = Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute, v.second) - Math.floor(ms / 1000) * 1000;
      if (Math.abs(off) <= 4 * 3600000) return Math.round(off / 60000) * 60000;
    } catch (e) { /* old browser */ }
    return 2 * 3600000;
  };
  FF.weekInfo = function (now) {
    now = now === undefined ? Date.now() : now;
    const DAY = 86400000;
    const local = now + FF.cairoOffset(now); // Cairo wall-clock time, written as if it were UTC
    const d = new Date(local);
    const back = (d.getUTCDay() - 5 + 7) % 7; // days since Friday
    let fri = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - back * DAY + 20 * 3600000;
    if (fri > local) fri -= 7 * DAY;
    const start = fri - FF.cairoOffset(fri - 2 * 3600000);
    const nf = fri + 7 * DAY, end = nf - FF.cairoOffset(nf - 2 * 3600000);
    const fd = new Date(fri), p = (n) => String(n).padStart(2, '0');
    const key = fd.getUTCFullYear() + '-' + p(fd.getUTCMonth() + 1) + '-' + p(fd.getUTCDate());
    return { key, seed: FF.weekSeedOf(key), start, end, left: end - now };
  };
  FF.weekSeedOf = (key) => (FF.hashStr('weekly-' + key) % 2000000000) + 1;

  // 🎲 BUILD 35 — REMIX RULES. The weekly road gets a TWIST and the Daily road a REMIX (other world order + a
  // run-wide modifier). Both come only from the road's seed, so a replay proof needs nothing new: the same seed
  // always rebuilds the same road. Versioned by date: roads from before these dates keep their old rules, so every
  // proof already on the board still replays exactly. (Normal Endless runs use random seeds: never touched.)
  FF.REMIX = { weekFrom: '2026-11-06', dayFrom: '2026-11-07' };
  const DAY = 86400000;
  const dkey = (ms) => { const d = new Date(ms), p = (n) => String(n).padStart(2, '0'); return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()); };
  const kms = (key) => { const m = String(key).split('-'); return Date.UTC(+m[0], +m[1] - 1, +m[2]); };
  // five twists, one per week in turn (never the same two weeks running). Hard and fair: none removes a danger.
  FF.WEEK_TWISTS = ['lowgrav', 'dark', 'burst', 'mirror', 'sawrain'];
  FF.weekNo = (key) => Math.round((kms(key) - Date.UTC(2026, 9, 30)) / (7 * DAY));
  FF.weekTheme = (key) => FF.WEEK_TWISTS[((FF.weekNo(key) % 5) + 5) % 5]; // the week's look + rewards (every week)
  FF.weekTwistOf = (key) => (key >= FF.REMIX.weekFrom ? FF.weekTheme(key) : null); // the week's rules (from weekFrom)
  const seedMaps = { w: {}, d: {}, wTo: 0, dTo: 0 };
  // which week / day a seed belongs to (scans the remix era up to a week ahead; cached)
  FF.weekKeyOfSeed = function (seed) {
    const to = Date.now() + 15 * DAY;
    if (to > seedMaps.wTo) {
      for (let ms = kms(FF.REMIX.weekFrom); ms <= to; ms += 7 * DAY) seedMaps.w[FF.weekSeedOf(dkey(ms))] = dkey(ms);
      seedMaps.wTo = to + DAY;
    }
    return seedMaps.w[seed] || null;
  };
  FF.dayKeyOfSeed = function (seed) {
    const to = Date.now() + 3 * DAY;
    if (to > seedMaps.dTo) {
      for (let ms = kms(FF.REMIX.dayFrom); ms <= to; ms += DAY) seedMaps.d[FF.hashStr('daily-' + dkey(ms))] = dkey(ms);
      seedMaps.dTo = to + DAY / 4;
    }
    return seedMaps.d[seed] || null;
  };
  FF.weekTwist = (seed) => { const k = FF.weekKeyOfSeed(seed); return k ? FF.weekTwistOf(k) : null; };
  // the Daily remix: never one of the weekly twists, and never the same modifier two days running
  FF.DAILY_MODS = ['heavy', 'tight', 'turbo', 'storm'];
  FF.dailyRemix = function (seed) {
    const key = FF.dayKeyOfSeed(seed);
    if (!key) return null;
    const n = Math.round(kms(key) / DAY);
    const r = FF.mulberry32(seed ^ 0x5eed);
    const base = (FF.WORLDS || []).slice(0, FF.WORLDS_BASE || 99); // (b61: the remix shuffles the first nine, as before)
    const ids = base.map((w) => w.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp; }
    const perm = {};
    base.forEach((w, i) => (perm[w.id] = ids[i]));
    return { key, v: 2, mod: FF.DAILY_MODS[n % FF.DAILY_MODS.length], perm };
  };

  FF.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return c;
  };

  FF.hexToRgb = function (hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  FF.mix = function (h1, h2, t) {
    const a = FF.hexToRgb(h1), b = FF.hexToRgb(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  FF.rgba = function (hex, a) {
    const [r, g, b] = FF.hexToRgb(hex);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  };
})(window.FF);
