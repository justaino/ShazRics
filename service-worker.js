// service-worker.js — buildless PWA offline support.
//
// Precaches the whole app shell (relative paths, so it works under any base
// subpath) and serves it stale-while-revalidate: the cached copy loads
// instantly (and offline), while a background fetch refreshes the cache so the
// next load is fresh — so a client never gets stuck on an old version.
//
// IMPORTANT: bump CACHE on every deploy that changes files, so installed
// devices pick up the new version (the old cache is cleaned on activate).
const CACHE = 'shazrics-v15';

const PRECACHE = [
  './',
  'index.html',
  'manifest.json',
  // styles
  'css/base.css', 'css/components.css', 'css/screens.css', 'css/animations.css', 'css/dark.css', 'css/neon.css', 'css/themes.css',
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
  'data/wordbanks/naija-lyrics-bank-popular.json',
  'data/wordbanks/naija-lyrics-bank-known.json',
  'data/wordbanks/naija-lyrics-v2.json',
  'assets/sounds/chime.wav', 'assets/sounds/ding.wav', 'assets/sounds/tick.wav', 'assets/sounds/buzzer.wav',
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

// Stale-while-revalidate: serve the cached copy instantly (fast, offline-proof),
// but always re-fetch in the background and update the cache, so the NEXT load
// gets the fresh file. This means an updated deploy self-heals within one reload
// — a client can never get permanently stuck on an old version — while the app
// still opens instantly and works fully offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return; // same-origin only

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);

    // Background refresh: pull a fresh copy and store it for next time.
    const network = fetch(req)
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => null);

    if (cached) {
      event.waitUntil(network); // keep the SW alive until the refresh completes
      return cached;
    }

    // Nothing cached yet: wait for the network.
    const res = await network;
    if (res) return res;

    // Offline and not cached: fall back to the app shell for navigations.
    if (req.mode === 'navigate') {
      const shell = (await cache.match('index.html')) || (await cache.match('./'));
      if (shell) return shell;
    }
    return Response.error();
  })());
});
