# Omo Naija — Runbook

Operational guide for running, deploying, maintaining, and extending the app.
For product/design intent see `README.md`; for guardrails see `CLAUDE.md`; for
the phased build history see `ROADMAP.md`.

---

## 1. What it is

A Nigerian party word-guessing game (Taboo / Heads Up family). One device is
passed around a room; teams take turns describing Nigerian slang while their
team guesses before a timer runs out. Won cards pile up per team; a winner is
revealed at the end.

- **Vanilla HTML / CSS / JS, buildless** — no framework, no bundler, no build step.
- **Single source of truth:** one `gameState` object; screens render from it.
- **Offline-first PWA:** installable, works with no network.
- No backend, no accounts — everything is `localStorage`.

---

## 2. Run it locally

ES-module imports and the word-bank `fetch` do **not** work from `file://`, so
serve the folder over HTTP:

```bash
cd "Omo Naija"
python3 -m http.server 8731      # or: npx serve
```

Open the printed `http://localhost:…` URL. `localhost` is a secure context, so
the service worker registers and the PWA is installable there too.

There is **nothing to build or install** — it's static files.

### Developing & testing locally

A few things that trip people up on a live edit loop:

- **The service worker serves stale files.** It precaches the app shell and
  serves cache-first, so after the first load your edits may not show. While
  developing, open DevTools and either tick **Application → Service Workers →
  "Update on reload"** + **"Bypass for network"**, or **Network → "Disable
  cache"** (DevTools must stay open); a hard reload (Cmd-Shift-R) also works.
- **Reset game state between tests.** Everything persists to `localStorage`, so
  a game resumes on reload. To start clean, clear it (DevTools → Application →
  Local Storage) or in the console:
  `localStorage.removeItem('omo-naija:state')` (in-progress game),
  `…('omo-naija:banks')` (custom banks), `…('omo-naija:prefs')` (settings + theme).
- **Test mobile + the full-bleed layout** with DevTools' device toolbar
  (Cmd-Shift-M) at a phone width — the card goes edge-to-edge at ≤480px and is a
  centered card above that. Check dark mode (🌙) too.

When you change an app-shell file, bump `CACHE` (see §6) so installed devices
refresh.

---

## 3. Project structure

```
index.html                 # entry: topbar + 9 empty <section> screen shells + script tags
manifest.json              # PWA manifest
service-worker.js          # PWA offline cache (precache + cache-first)
css/
  base.css                 # tokens, reset, @font-face, app shell, focus ring
  components.css           # reusable building blocks (cards, buttons, pills, piles)
  screens.css              # per-screen layout
  animations.css           # @keyframes + reduced-motion guard
js/
  app.js                   # controller: routing, actions, timer lifecycle, boot, SW registration
  state.js                 # gameState shape + localStorage (load/save/reset)
  preferences.js           # persisted global prefs + setup defaults
  game.js                  # turn engine: scoring, skip rules, win conditions
  deck.js                  # shuffle / build deck / draw (mode-aware)
  timer.js                 # timestamp countdown + Wake Lock + tick/buzzer hooks
  sound.js                 # Howler effects + global mute
  haptics.js               # navigator.vibrate (mobile)
  anim.js                  # GSAP helpers (fly-to-pile, count-up, confetti) — reduced-motion aware
  banks.js                 # word-bank registry (bundled + custom in localStorage)
  util.js                  # esc(), mode labels
  data/wordbank-loader.js  # load a bank by id (custom from localStorage, else JSON)
  screens/                 # one render(el, ctx) per screen
  components/card-stack.js # JS-computed pile (offsets + "+N")
data/wordbanks/            # bundled bank JSON (naija-classic, naija-genz)
assets/
  vendor/                  # GSAP, Flip, Howler, canvas-confetti (vendored, no CDN)
  fonts/anton-latin.woff2  # self-hosted display font
  sounds/                  # synthesized ding/tick/buzzer WAVs
  icons/                   # PWA icons (192/512)
documentation/RUNBOOK.md   # this file
```

---

## 4. How it works (mental model)

- **State-driven routing.** `gameState.phase` is one of
  `home | setup | preturn | play | turnsummary | scoreboard | end` (plus aux
  `settings | howto`). `app.js` shows the matching `<section>` and calls that
  screen module's `render(el, ctx)`. **Never** route by a hardcoded index.
- **Actions.** Screens call `ctx.actions.*` (in `app.js`); each mutates state
  via `game.js`/`state.js`, then `render()` re-paints. Navigation = set
  `gameState.phase` + render.
- **Persistence.** `saveState()` runs on every change; on boot a `status:
  'playing'` game makes Home show **Continue** and resumes exactly. Global prefs
  live separately in `preferences.js` so they survive "New game".
- **Timer.** Source of truth is the `turn.endsAt` timestamp (compared to
  `Date.now()`), never tick-counting — backgrounding the tab can't drift it. It
  holds a Screen Wake Lock during a turn.
- **Animation is cosmetic.** Game state always advances first; `anim.js`
  animates a throwaway clone. A missing/janky animation can never freeze the
  game. All motion degrades under `prefers-reduced-motion`.

---

## 5. Deploy (GitHub Pages)

Static files, so Pages serves them directly — no build, no Actions needed.

1. Push the branch you want to publish (see branch policy below).
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch** →
   choose the branch → folder **`/ (root)`** → Save.
3. Live at `https://<user>.github.io/Omo-Naija/` (this repo: `justaino`).

Relative paths and `manifest.json`'s relative `start_url`/`scope` mean the app
works fine under the `/Omo-Naija/` subpath; the service worker registers with a
relative path so its scope matches automatically.

### Install on a phone
Open the Pages URL on the phone (HTTPS is required for PWA install) → browser
menu → **Add to Home Screen**. It installs and runs offline.

### Branch policy
Work happens on **`dev`**; **`main`** is merged only on explicit request. Point
Pages at `dev` to test work-in-progress, or merge `dev → main` and point Pages
at `main` for the stable/published version.

---

## 6. Service worker & cache busting  ⚠️ important

`service-worker.js` precaches the app shell (`PRECACHE` list) and serves
cache-first. Installed devices keep serving cached files until the SW updates.

**On every deploy that changes any file:**

1. Bump `CACHE` in `service-worker.js`, e.g. `omo-naija-v1` → `omo-naija-v2`.
   The `activate` handler deletes caches whose key ≠ current, so the bump is
   what forces installed clients to refetch. **Forget it → phones serve stale.**
2. If you **added or removed** a shell file (css/js/asset), also update the
   `PRECACHE` array so offline still has everything.

After deploying, an installed device updates on its next launch (the new SW
calls `skipWaiting()` + `clients.claim()`).

To wipe a stuck install during dev: DevTools → Application → Service Workers →
Unregister, then Application → Storage → Clear site data.

---

## 7. Common tasks

### Add / delete a custom word bank (in-app, no code)
Users create banks at runtime — **Settings → Word banks → Add word bank**:
- A **name**, then **words one per line**, with an optional hint after a `|`.

Example to paste in the words box:

```
Jollof | the famous rice dish
Danfo | yellow Lagos bus
Owambe | a big lavish party
Suya | grilled spicy meat
Gele
Aso ebi
```

This stores a bank in `localStorage` (key `omo-naija:banks`) — no code, no
deploy. It then appears in the setup picker and the default-bank dropdown. The
loader (`js/data/wordbank-loader.js`) serves custom banks straight from
`localStorage`, so they work offline too. Delete one via the **×** next to it in
Settings (confirmation required); built-in bundled banks aren't deletable.

### Add a bundled word bank
1. Add `data/wordbanks/<id>.json` (same shape as `naija-classic.json`; keep
   text/hints **ASCII-safe**, each card has `id, text, category, era,
   difficulty, hint, modes`).
2. Register it in `js/banks.js` → `BUNDLED`.
3. Add its file to `PRECACHE` in `service-worker.js` and bump `CACHE`.

Users can also create **custom banks** at runtime (Settings → Add word bank);
those live in `localStorage`, no code change.

### Change default game settings
Defaults that pre-fill Setup live in `js/preferences.js`
(`defaultTimerSeconds`, `defaultMode`, etc.) and are editable in-app via the
Settings screen.

### Add a new screen
1. Create `js/screens/<name>.js` exporting `render(el, ctx)`.
2. Add a `<section class="screen" id="<name>-screen"></section>` to `index.html`.
3. Register it in `app.js` `SCREENS` (set `aux: true` if it's outside the 1–7
   game flow). Add an action that sets `gameState.phase`.
4. Add the new JS file to `PRECACHE` + bump `CACHE`.

### Change sounds
Regenerate WAVs into `assets/sounds/` (synthesized — no external assets needed)
and bump `CACHE`.

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Blank page / "cannot use import outside a module" | Opened via `file://`. Serve over HTTP instead. |
| Word bank fails to load | Same — `fetch` needs HTTP; check the bank id/path. |
| Phone shows an old version after deploy | `CACHE` not bumped. Bump it; the SW cleans old caches on next launch. |
| Animations/sound/confetti missing | A vendored lib in `assets/vendor/` didn't load, or `prefers-reduced-motion` is on (motion intentionally skipped). |
| No "Continue game" on Home | Only appears when a saved game has `status: 'playing'`. |
| PWA won't install | Needs HTTPS or localhost (not plain-HTTP LAN). Use GitHub Pages. |
| Timer "drifts" suspicion | It's timestamp-based; resuming a turn whose `endsAt` passed jumps to the summary by design. |

---

## 9. App store roadmap

### Android (Google Play / APK)
The app is ~80% ready. Remaining blockers before Play Store submission:

- **1024×1024 icon** — Play Store requires it for the store listing (current max is 512).
- **Privacy policy** — Google requires a hosted URL; a one-paragraph page on GitHub Pages is enough.
- **`assetlinks.json`** — hosted at `justaino.github.io/.well-known/assetlinks.json`; links the Play Store app's signing certificate to the domain. PWABuilder generates this file for you.
- **Screenshots** — Play Store needs at least 2 phone screenshots of the actual app.

For a **test APK** (sideload only, no Play Store account needed):
1. Go to [pwabuilder.com](https://pwabuilder.com) and enter the GitHub Pages URL.
2. Click **Package for stores → Android → Download**.
3. On the Android device: Settings → "Install unknown apps" → allow for your browser.
4. Open the downloaded APK on the device and tap Install.
5. The app appears on the home screen; the service worker caches everything on first launch for offline use.

### Apple App Store
Requires more work than Android — there is no TWA equivalent, so a native wrapper is needed:

- **Capacitor** (by Ionic) — wraps the existing HTML/CSS/JS in a native iOS shell; recommended approach.
- **Mac + Xcode** — required to build and submit.
- **Apple Developer Program** — $99/year.
- **1024×1024 icon** — required for the App Store listing.
- **Privacy policy** — required; same hosted URL as above works.
- **Polish for native feel** — suppress text selection/long-press menus on game elements; wire haptics to Capacitor's native plugin instead of the web Vibration API; style the status bar to match the app background.

---

## 10. Testing

No test framework (buildless). Verified via headless Chrome during development:
- Boot smoke (libs load, no console errors, correct screen).
- Engine assertions (scoring, skip rules, win conditions, deck refill).
- End-to-end click/swipe-through of the real app in an iframe driver.
- Screenshots of each screen for visual parity with the prototype.

Note: a service worker's live install/cache cycle can't be fully exercised under
headless virtual-time — validate PWA install/offline on a real device.
