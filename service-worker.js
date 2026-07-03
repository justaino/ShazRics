// service-worker.js — buildless PWA offline support.
//
// Precaches the whole app shell (relative paths, so it works under any base
// subpath) and serves cache-first with a network fallback that also
// runtime-caches anything new.
//
// IMPORTANT: bump CACHE on every deploy that changes files, so installed
// devices pick up the new version (the old cache is cleaned on activate).
const CACHE = 'shazrics-v3';

const PRECACHE = [
  './',
  'index.html',
  'manifest.json',
  // styles
  'css/base.css', 'css/components.css', 'css/screens.css', 'css/animations.css', 'css/dark.css',
  // app modules
  'js/app.js', 'js/state.js', 'js/preferences.js', 'js/game.js', 'js/deck.js',
  'js/timer.js', 'js/sound.js', 'js/haptics.js', 'js/anim.js', 'js/banks.js',
  'js/theme.js', 'js/install.js',
  'js/util.js', 'js/data/wordbank-loader.js', 'js/components/card-stack.js',
  'js/screens/home.js', 'js/screens/setup.js', 'js/screens/preturn.js',
  'js/screens/play.js', 'js/screens/summary.js', 'js/screens/scoreboard.js',
  'js/screens/reveal.js', 'js/screens/settings.js', 'js/screens/howto.js',
  'js/screens/banks-browser.js',
  // vendored libs
  'assets/vendor/gsap.min.js', 'assets/vendor/Flip.min.js',
  'assets/vendor/howler.min.js', 'assets/vendor/confetti.browser.min.js',
  // font, lyric banks, sounds, icons
  'assets/fonts/anton-latin.woff2',
  'data/wordbanks/naija-chorus-50-pack.json',
  'assets/sounds/ding.wav', 'assets/sounds/tick.wav', 'assets/sounds/buzzer.wav',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-1024.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return; // ignore cross-origin

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      // Offline and not cached: fall back to the app shell for navigations.
      if (req.mode === 'navigate') {
        const shell = (await caches.match('index.html')) || (await caches.match('./'));
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
