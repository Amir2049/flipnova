// Offline cache so the game works without internet once installed.
const CACHE = 'flipnova-v12b'; // b48: the Tyrant's level with the trailer's art
const FILES = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './fonts/cairo.css', './fonts/cairo-arabic.woff2', './fonts/cairo-latin.woff2', './fonts/cinzel-900.woff2', './js/core.js', './js/font.js', './js/sprites.js', './js/worlds.js', './js/stages.js', './js/homebg.js', './js/level.js', './js/campaign.js',
  './js/audio.js', './js/game.js', './js/bossworld.js', './js/boss.js', './js/boss-niro.js', './js/hdart.js', './js/hdboss.js', './js/story.js', './js/bosslevel.js', './js/tyrantlevel.js', './js/fairness.js', './js/editor.js', './js/online-config.js', './js/online.js', './js/ui.js', './js/stagemaker.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.indexOf('/rest/') >= 0) return; // live server data (boards, names, stages) is never cached
  if (/\.mp4$/.test(new URL(e.request.url).pathname)) return; // b46: the film streams (range requests) and is never cached
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return res;
  }).catch(() => hit)));
});
