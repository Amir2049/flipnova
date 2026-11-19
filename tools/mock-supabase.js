// Tiny stand-in for the Supabase REST API (just what the game uses) + a static server for the game itself.
// node tools/mock-supabase.js [port]   → game at http://localhost:PORT/ , API at http://localhost:PORT/rest/v1/ff_scores
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = +process.argv[2] || 8787;
const rows = [];
const gifts = {}; // sha256(code) -> gift, like public.ff_gifts
const players = {};
const reviews = [];
const meta = { book: null }; // public.ff_meta row 1 // ff_key(name) -> { name, th, device }, like public.ff_players
const key = (n) => String(n || '').replace(/\s/g, '').toLowerCase();
const sha = (code) => require('crypto').createHash('sha256').update(String(code || '').replace(/\s/g, '').toUpperCase(), 'utf8').digest('hex');
let nextId = 1;
const counts = { n: {}, calls: [] }; // public.ff_count stand-in
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

function api(req, res, u) {
  if (req.headers.apikey !== 'test-key') { res.writeHead(401, cors); return res.end('{"message":"no key"}'); }
  if (req.method === 'GET') {
    let out = rows.slice();
    const board = u.searchParams.get('board');
    if (board) out = out.filter((r) => 'eq.' + r.board === board);
    const order = (u.searchParams.get('order') || '').split(',').filter(Boolean).map((o) => o.split('.'));
    out.sort((a, b) => {
      for (const [k, dir] of order) { if (a[k] !== b[k]) return (a[k] < b[k] ? -1 : 1) * (dir === 'desc' ? -1 : 1); }
      return 0;
    });
    out = out.slice(0, +u.searchParams.get('limit') || 1000);
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
    return res.end(JSON.stringify(out));
  }
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const e = JSON.parse(body);
      // same checks as the RLS policy in supabase-setup.sql
      const ok = e.name && e.name.length <= 14 && /^(endless|legend|daily-\d{4}-\d{2}-\d{2})$/.test(e.board) && Number.isInteger(e.score) && e.proof && e.proof.length < 200000;
      if (!ok) { res.writeHead(403, cors); return res.end('{"message":"policy"}'); }
      rows.push(Object.assign({ id: nextId++, created_at: new Date(Date.now() + nextId).toISOString(), dist: 0, stage: 1, skin: 'flippo', device: '' }, e));
      res.writeHead(201, cors);
      res.end();
    });
    return;
  }
  res.writeHead(405, cors);
  res.end();
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (u.pathname === '/rest/v1/ff_scores') return api(req, res, u);
  // v9: unique names + submit_score (same rules as tools/supabase-v9.sql)
  if (u.pathname === '/rest/v1/rpc/claim_name' || u.pathname === '/rest/v1/rpc/submit_score') {
    if (process.env.MOCK_OLD) { res.writeHead(404, cors); return res.end(); }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const e = JSON.parse(body || '{}');
      const out = (v) => { res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors)); res.end(JSON.stringify(v)); };
      const th = sha(e.p_token || '');
      if (u.pathname.endsWith('claim_name')) {
        const nm = String(e.p_name || '').trim(), k = key(nm);
        if (String(e.p_token || '').length < 24) return out('bad');
        if (nm.length < 3 || nm.length > 14 || !/^[A-Za-z0-9_ .\u0600-\u06FF-]+$/.test(nm)) return out('bad');
        if (['flippo', 'فليبو', 'flipnova', 'flipfrenzy', 'admin', 'owner', 'player', 'guest'].includes(k)) return out('taken');
        const p = players[k];
        if (p && p.th !== th && !(p.th === null && p.device && p.device === e.p_device)) return out('taken');
        for (const q in players) if (players[q].th === th && q !== k) delete players[q];
        players[k] = { name: nm, th, device: e.p_device || '' };
        return out('ok');
      }
      const p = Object.values(players).find((q) => q.th === th);
      if (!p) return out('noname');
      if (!/^(endless|legend|daily-\d{4}-\d{2}-\d{2})$/.test(e.p_board) || !Number.isInteger(e.p_score)) return out('bad');
      rows.push({ id: nextId++, created_at: new Date(Date.now() + nextId).toISOString(), board: e.p_board, name: p.name, score: e.p_score, dist: e.p_dist || 0, stage: e.p_stage || 1, skin: e.p_skin || 'flippo', proof: e.p_proof, device: e.p_device || '' });
      out('ok');
    });
    return;
  }
  if (u.pathname === '/__players' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(players)); }
  if (u.pathname === '/__players') { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { const e = JSON.parse(b || '{}'); players[key(e.name)] = { name: e.name, th: null, device: e.device }; res.writeHead(201); res.end(); }); return; }
  if (u.pathname === '/rest/v1/rpc/redeem_gift' || u.pathname === '/__gifts') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const e = JSON.parse(body || '{}');
      if (u.pathname === '/__gifts') { gifts[sha(e.code)] = e.gift; res.writeHead(201); return res.end(); }
      if (req.headers.apikey !== 'test-key') { res.writeHead(401, cors); return res.end(); }
      res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
      res.end(JSON.stringify(gifts[sha(e.code)] || null));
    });
    return;
  }
  if (u.pathname === '/rest/v1/ff_names') {
    const want = ((u.searchParams.get('device') || '').match(/^in\.\((.*)\)$/) || [])[1];
    const ds = want ? want.split(',') : null;
    const out = Object.values(players).filter((q) => q.th && q.device && (!ds || ds.includes(q.device))).map((q) => ({ device: q.device, name: q.name }));
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
    return res.end(JSON.stringify(out));
  }
  if (u.pathname === '/rest/v1/ff_meta') { res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors)); return res.end(JSON.stringify([{ build: +(process.env.MOCK_BUILD || 0), url: 'https://example.com/FLIPNOVA.apk', note: 'test note', book: meta.book }])); }
  if (u.pathname === '/rest/v1/rpc/owner_check') {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => { const e = JSON.parse(b || '{}'); res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors)); res.end(JSON.stringify(sha(e.p_code) === sha('TEST-CODE'))); });
    return;
  }
  // ⭐ reviews, like tools/supabase-reviews.sql
  if (u.pathname === '/rest/v1/rpc/submit_review' || u.pathname === '/rest/v1/rpc/owner_reviews') {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      const e = JSON.parse(b || '{}');
      let out;
      if (u.pathname.endsWith('submit_review')) {
        const ok = e.p_device && e.p_device.length >= 6 && e.p_stars >= 1 && e.p_stars <= 5 && e.p_build >= 1;
        if (ok) {
          const old = reviews.findIndex((r) => r.device === e.p_device && r.build === e.p_build);
          const row = { device: e.p_device, build: e.p_build, stars: e.p_stars, body: String(e.p_body || '').slice(0, 300), name: String(e.p_name || '').slice(0, 16), lang: e.p_lang || '', at: new Date().toISOString() };
          if (old >= 0) reviews[old] = row; else reviews.push(row);
        }
        out = ok ? 'ok' : 'bad';
      } else out = sha(e.p_code) === sha('TEST-CODE') ? reviews.slice().reverse().map(({ device, ...r }) => r) : [];
      res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
      res.end(JSON.stringify(out));
    });
    return;
  }
  if (u.pathname === '/rest/v1/rpc/publish_book') {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      const e = JSON.parse(b || '{}');
      const ok = sha(e.p_code) === sha('TEST-CODE');
      if (ok) meta.book = e.p_book;
      res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
      res.end(JSON.stringify(ok ? 'ok' : 'denied'));
    });
    return;
  }
  // build 35: anonymous counter (same rules as tools/supabase-counter.sql). /__counts shows every call the game made.
  if (u.pathname === '/rest/v1/rpc/count_event') {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      if (req.headers.apikey !== 'test-key') { res.writeHead(401, cors); return res.end(); }
      let e = {};
      try { e = JSON.parse(b || '{}'); } catch (x) { e = {}; }
      counts.calls.push({ body: e, keys: Object.keys(e) });
      if (['open', 'back', 'tut', 'run', 'stage3', 'share', 'vs_open'].includes(e.ev)) counts.n[e.ev] = (counts.n[e.ev] || 0) + 1;
      res.writeHead(204, cors);
      res.end();
    });
    return;
  }
  if (u.pathname === '/__counts') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(counts)); }
  if (u.pathname === '/__rows') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(rows)); }
  const f = path.join(ROOT, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('mock supabase + game on http://localhost:' + PORT));
