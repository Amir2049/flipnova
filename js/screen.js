// FLIPNOVA — knows what it runs on, and goes fullscreen by itself.
// Browsers only allow fullscreen after a tap, so the first tap/click does it (on phones also landscape lock).
// On a phone it comes back on the next tap if the player leaves it; on a computer only the first click.
// The Android app and the Windows app are already full-window, so nothing happens there.
(function (FF) {
  'use strict';
  const ua = navigator.userAgent || '';
  const touch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  const app = !!window.AndroidBridge || /Electron|FlipFrenzyApp/.test(ua);
  const kind = app ? 'app' : touch ? (ios ? 'ios' : 'phone') : 'computer';
  FF.DEVICE = { kind, touch, ios, app };
  document.documentElement.classList.add('dev-' + kind);

  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* not allowed here */ } };
  function goFull() {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return; // iPhone Safari: no fullscreen for pages (the "turn your phone" screen still helps)
    try {
      const p = req.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) { /* blocked (e.g. an embed without permission) */ }
  }
  let tries = 0;
  addEventListener('pointerdown', () => {
    if (app || isFull()) return;
    if (!touch && tries > 0) return;
    tries++;
    goFull();
  }, true);
})(window.FF = window.FF || {});
