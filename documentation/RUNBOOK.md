# ShazRics — Runbook

Operational guide for running, deploying, maintaining, and extending the app.
For product/design intent see `README.md`; for guardrails see `CLAUDE.md`; for
the phased build plan see `ROADMAP.md`.

> **Living document.** ShazRics is a fork of the Omo Naija engine; this runbook
> tracks the app as it stands. Phases 0–3 are done: the re-skin, the
> reveal-then-self-score mechanic, in-app custom lyric banks, and the polish pass
> (reveal animation + chime, optional artist hint, accessibility, dark mode) are
> all live. When you change behaviour, update this file **and** `WHATS-NEW.md`.

---

## 1. What it is

A Nigerian **song-lyrics** party game. One device is passed around a room; teams
take turns. The card shows an **incomplete lyric**; the team shouts the missing
part, then the phone-holder taps **Reveal** to check and self-scores **Got it**
(+1) or **Skip**. Won cards pile up per team; a winner is revealed at the end.

- **Vanilla HTML / CSS / JS, buildless** — no framework, no bundler, no build step.
- **Single source of truth:** one `gameState` object; screens render from it.
- **Offline-first PWA:** installable, works with no network.
- No backend, no accounts — everything is `localStorage`.

**Fork status:** ShazRics keeps the Omo Naija architecture, card-stack
scoreboard, and pass-and-play loop. The two deliberate differences are both
live: (1) **no game modes** (the mode system is fully removed), and (2) a
**reveal-then-self-score** turn mechanic — the card shows an incomplete lyric,
the phone-holder taps **Reveal** to see the answer plus the `artist — song`
credit, then self-scores **Got it** / **Skip**. Got it / Skip stay disabled
until Reveal (the answer is the gate). An optional **artist hint** (off by
default; set at Setup or as a Settings default) shows the artist on the card
*before* Reveal for easier play — the song title still waits for the reveal.

---

## 2. Run it locally

ES-module imports and the lyric-bank `fetch` do **not** work from `file://`, so
serve the folder over HTTP:

```bash
cd "ShazRics"
python3 -m http.server 8731      # or: npx serve
```

Open `http://localhost:8731`. `localhost` is a secure context, so the service
worker registers and the PWA is installable there too.

There is **nothing to build or install** — it's static files.

### Developing & testing locally

- **The service worker serves stale files.** It precaches the app shell and
  serves cache-first, so after the first load your edits may not show. While
  developing, open DevTools → **Application → Service Workers → "Update on
  reload"**, or **Network → "Disable cache"** (DevTools must stay open); a hard
  reload (Cmd-Shift-R) also works.
- **Reset game state between tests.** Everything persists to `localStorage`. To
  start clean, clear it (DevTools → Application → Local Storage) or in the
  console:
  `localStorage.removeItem('shazrics:state')` (in-progress game),
  `…('shazrics:banks')` (custom banks), `…('shazrics:prefs')` (settings + theme).
- **Test mobile layout** with DevTools' device toolbar (Cmd-Shift-M) at a phone
  width. Check dark mode (🌙 / ☀️) too — it follows the OS by default (`theme:
  'system'` in prefs) and the topbar button sets an explicit light/dark choice;
  the dark colours are an additive override layer in `css/dark.css`.

When you change an app-shell file, bump `CACHE` (see §6) so installed devices
refresh.

---

## 3. Project structure

```
index.html                 # entry: topbar + screen shells + script tags
manifest.json              # PWA manifest (plum theme colour, SR icons)
service-worker.js          # PWA offline cache (precache + cache-first)
css/
  base.css                 # plum/cream tokens, reset, @font-face, app shell, focus ring
  components.css           # reusable building blocks (cards, buttons, pills, piles)
  screens.css              # per-screen layout
  animations.css           # @keyframes + reduced-motion guard
  dark.css                 # additive dark theme (system-aware, topbar toggle)
js/
  app.js                   # controller: routing, actions, timer lifecycle, boot, SW registration
  state.js                 # gameState shape + localStorage (load/save/reset)
  preferences.js           # persisted global prefs + setup defaults
  game.js                  # turn engine: scoring, skip rules, win conditions
  deck.js                  # shuffle / build deck / draw (lyric cards)
  timer.js                 # timestamp countdown + Wake Lock + tick/buzzer hooks
  sound.js                 # Howler effects (chime/ding/tick/buzzer) + global mute
  haptics.js               # navigator.vibrate (mobile)
  anim.js                  # GSAP helpers (reveal-answer, fly-to-pile, count-up, confetti) — reduced-motion aware
  theme.js                 # light/dark theming (system-aware; topbar toggle)
  banks.js                 # lyric-bank registry (bundled + custom in localStorage)
  util.js                  # esc()
  data/wordbank-loader.js  # load a bank by id (custom from localStorage, else JSON)
  screens/                 # one render(el, ctx) per screen
  components/card-stack.js # JS-computed pile (offsets + "+N")
data/wordbanks/            # bundled lyric bank JSON
  naija-lyrics-v2.json       # 50-song chorus bank (the default)
assets/
  vendor/                  # GSAP, Flip, Howler, canvas-confetti (vendored, no CDN)
  fonts/anton-latin.woff2  # self-hosted display font
  sounds/                  # chime / ding / tick / buzzer WAVs
  icons/                   # PWA icons (192/512/1024) — cream "SR" on plum
documentation/RUNBOOK.md   # this file
```

---

## 4. Lyric card data model

Bundled banks live in `data/wordbanks/<id>.json`. **The file name must equal the
bank `id`** — the loader fetches `data/wordbanks/${id}.json`. Card shape:

```json
{
  "id": "l011",
  "prompt": "You don't need no other body ... Only you fi ______",
  "answer": "hold my body",
  "artist": "Wizkid ft. Tems",
  "song": "Essence",
  "era": "modern",
  "difficulty": "easy"
}
```

- `prompt` shows on the card (the incomplete lyric, with a visible blank).
  `answer` is hidden until **Reveal**; on reveal, `answer` plus the
  `artist — song` credit are the payoff.
- `artist` and `song` are **optional** (a card may carry just `prompt` +
  `answer`); the credit line simply omits whatever is missing.
- `era` and `difficulty` are metadata only (browsing/labels); if omitted the
  in-app editor defaults them to `"modern"` / `"medium"`.
- **No `modes` or `hint` fields** — the mode system was removed in Phase 0.
- Keep all lyric text **ASCII-safe**.

---

## 5. How it works (mental model)

- **State-driven routing.** `gameState.phase` is one of
  `home | setup | preturn | play | turnsummary | scoreboard | end` (plus aux
  `settings | howto | banks`). `app.js` shows the matching `<section>` and calls
  that screen module's `render(el, ctx)`. **Never** route by a hardcoded index.
- **Actions.** Screens call `ctx.actions.*` (in `app.js`); each mutates state
  via `game.js`/`state.js`, then `render()` re-paints. Navigation = set
  `gameState.phase` + render.
- **Persistence.** `saveState()` runs on every change; on boot a
  `status: 'playing'` game makes Home show **Continue** and resumes exactly.
  Global prefs live separately in `preferences.js` so they survive "New game".
- **Timer.** Source of truth is the `turn.endsAt` timestamp (compared to
  `Date.now()`), never tick-counting — backgrounding the tab can't drift it. It
  holds a Screen Wake Lock during a turn.
- **Animation is cosmetic.** Game state always advances first; `anim.js` animates
  a throwaway clone. A missing/janky animation can never freeze the game. All
  motion degrades under `prefers-reduced-motion`.

---

## 6. Service worker & cache busting  ⚠️ important

`service-worker.js` precaches the app shell (`PRECACHE` list) and serves
cache-first. Installed devices keep serving cached files until the SW updates.

**On every deploy that changes any app-shell file:**

1. Bump `CACHE` in `service-worker.js`, e.g. `shazrics-v2` → `shazrics-v3`. The
   `activate` handler deletes caches whose key ≠ current, so the bump is what
   forces installed clients to refetch. **Forget it → phones serve stale.**
2. If you **added or removed** a shell file (css/js/asset/bank), also update the
   `PRECACHE` array so offline still has everything.

After deploying, an installed device updates on its next launch (the new SW
calls `skipWaiting()` + `clients.claim()`).

To wipe a stuck install during dev: DevTools → Application → Service Workers →
Unregister, then Application → Storage → Clear site data.

---

## 7. Common tasks

### Add a bundled lyric bank manually (in code) — full walkthrough

A "bundled" bank ships in the repo as a JSON file and shows in the picker for
everyone (unlike a custom bank, which lives only in one device's
`localStorage`). Adding one touches **three** files: the bank JSON, the registry
in `banks.js`, and the service worker. Do all of it or the bank won't load
offline / won't appear.

**Step 1 — Choose an id.** Pick a short, kebab-case, ASCII id, e.g.
`afrobeats-2010s`. This id is used in three places and they must match exactly:
the file name, the `BUNDLED` entry, and (optionally) a default-bank preference.

**Step 2 — Create the bank file** at `data/wordbanks/<id>.json` — the **file
name must equal the id** (the loader fetches `data/wordbanks/${id}.json`). Shape:

```json
{
  "id": "afrobeats-2010s",
  "name": "Afrobeats 2010s",
  "description": "Optional one-line blurb (shown nowhere critical).",
  "cards": [
    {
      "id": "a001",
      "prompt": "Johnny, Johnny, Johnny, ______",
      "answer": "where you dey go?",
      "artist": "Yemi Alade",
      "song": "Johnny",
      "era": "modern",
      "difficulty": "easy"
    }
  ]
}
```

Rules for the file:
- The top-level `id` should equal the file name (the loader keys off the file
  name, but keep them identical to avoid confusion).
- `name` is the label shown in the picker and Settings — make it human-friendly.
- `cards` is an array of the §4 card shape. Each card needs at least `prompt`
  and `answer`; `artist`, `song`, `era`, `difficulty` are optional but
  recommended. Give each card a unique `id` (any scheme — `a001`, `a002`…).
- Put a **visible blank** in every `prompt` (e.g. a trailing `______` or a
  mid-line gap) so players know what to shout.
- **ASCII-safe only** — no smart quotes, em-dashes, or emoji in the text. Curly
  apostrophes from copy-paste are the usual culprit; replace with plain `'`.
- Valid JSON — no trailing commas, double-quoted keys/strings.

**Step 3 — Register it** in `js/banks.js` → the `BUNDLED` array. Add
`{ id, name }` (the `name` here should match the file's `name`):

```js
const BUNDLED = [
  { id: 'naija-lyrics-v2', name: 'Naija Chorus (50 songs)' },
  { id: 'afrobeats-2010s', name: 'Afrobeats 2010s' },
];
```

This is what makes it appear in the Setup picker and the Settings default-bank
list. (A bank file that exists but isn't registered here is invisible.)

**Step 4 — Precache it for offline** in `service-worker.js`: add the file to the
`PRECACHE` array (near the other `data/wordbanks/*.json` entry)…

```js
'data/wordbanks/naija-lyrics-v2.json',
'data/wordbanks/afrobeats-2010s.json',
```

…and **bump `CACHE`** (e.g. `shazrics-v5` → `shazrics-v6`) so installed devices
refetch. Skipping this means phones keep serving the old shell and the new bank
404s offline.

**Step 5 — (optional) Make it the default.** To have new games pre-select it,
set `defaultWordbankId` in `js/preferences.js` to your id, or just pick it once
in Settings → Default word bank (that choice persists per device).

**Step 6 — Test it (required).** Serve over HTTP and confirm it loads and plays:

```bash
python3 -m http.server 8731
```

Open `http://localhost:8731`, then in DevTools console sanity-check the parse:

```js
const cards = await (await fetch('data/wordbanks/afrobeats-2010s.json')).json();
console.log(cards.cards.length, cards.cards[0]);
```

Then start a game with the bank selected and play a card through Reveal →
Got it. (Remember the SW serves stale files — use "Update on reload" while
testing; see §2 and §6.)

**Step 7 — Update the docs.** Note the new bank in `WHATS-NEW.md` if it's
player-facing.

### Add / edit / delete a custom bank (in-app, no code)
Settings → Word banks. Custom banks are stored in `localStorage`
(`shazrics:banks`) and served offline by the loader — they never touch the repo.

- **Add:** name the bank, then paste lyric rows in the box, **one per line**, as
  `prompt || answer || artist || song`. `||` is the delimiter; **artist and song
  are optional** (a row can be just `prompt || answer`). Put a visible blank in
  the prompt yourself (the app never auto-inserts one). A live **preview** shows
  the first card, and malformed rows are flagged with a specific message (e.g.
  _"Line 4: missing the answer after ||."_) — you can't save until they're fixed.
  Tap **+ Add lyric bank**.
- **Edit:** the ✎ button re-opens a bank's rows in the same editor; **Save
  changes** keeps its id, so any default-bank / setup selection stays valid.
- **Delete:** the **×** button (confirms first). If the deleted bank was the
  default, it falls back to `naija-lyrics-v2`.

The parse/serialize lives in `js/banks.js` (`parseLyrics`, `cardsToText`,
`LYRIC_DELIM`); the editor UI is in `js/screens/settings.js`.

### Change default game settings
Defaults that pre-fill Setup live in `js/preferences.js`
(`defaultTimerSeconds`, `defaultSkipRule`, `defaultWinCondition`,
`defaultWinTarget`, `defaultWordbankId`, `defaultArtistHint`) and are editable
in-app via Settings. The per-game copy is `gameState.settings.artistHint`
(`play.js` reads it to show the up-front artist hint).

### Add a new screen
1. Create `js/screens/<name>.js` exporting `render(el, ctx)`.
2. Add `<section class="screen" id="<name>-screen"></section>` to `index.html`.
3. Register it in `app.js` `SCREENS` (`aux: true` if outside the core flow) and
   add an action that sets `gameState.phase`.
4. Add the new JS file to `PRECACHE` + bump `CACHE`.

### Theme / palette
Design tokens live in `css/base.css` `:root` (`--plum`, `--plum-deep`, `--cream`,
`--cream-deep`, `--ink`, `--muted`, `--gold`, `--mauve`). Legacy `--color-*`
names are aliased to these so existing rules keep working.

---

## 8. Deploy (GitHub Pages)

Static files, so Pages serves them directly — no build, no Actions needed.

1. Push the branch you want to publish (see branch policy below).
2. Repo **Settings → Pages → Deploy from a branch** → choose the branch → folder
   **`/ (root)`** → Save.
3. Relative paths + `manifest.json`'s relative `start_url`/`scope` mean the app
   works under any subpath; the service worker registers with a relative path so
   its scope matches automatically.

### Branch policy
Work happens on **`dev`**; **`main`** is merged only on explicit request. Point
Pages at `dev` to test work-in-progress, or merge `dev → main` and point Pages at
`main` for the stable/published version.

### Install on a phone
Open the Pages URL on the phone (HTTPS required) → browser menu → **Add to Home
Screen**. It installs and runs offline.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Blank page / "cannot use import outside a module" | Opened via `file://`. Serve over HTTP instead. |
| Lyric bank fails to load | Same — `fetch` needs HTTP; check the bank id/path (file name must equal `id`). |
| Phone shows an old version after deploy | `CACHE` not bumped. Bump it; the SW cleans old caches on next launch. |
| Animations/sound/confetti missing | A vendored lib in `assets/vendor/` didn't load, or `prefers-reduced-motion` is on (motion intentionally skipped). |
| No "Continue game" on Home | Only appears when a saved game has `status: 'playing'`. |
| PWA won't install | Needs HTTPS or localhost (not plain-HTTP LAN). Use GitHub Pages. |
| Timer "drifts" suspicion | It's timestamp-based; resuming a turn whose `endsAt` passed jumps to the summary by design. |

---

## 10. Testing

No test framework (buildless). Verified via headless Chrome + Node during
development:
- Boot smoke (libs load, no console errors, correct screen).
- Engine assertions (scoring, skip rules, win conditions, deck refill) — the
  pure `state.js`/`deck.js`/`game.js` modules run in Node with no DOM.
- Screenshots of each screen for visual parity.

Note: a service worker's live install/cache cycle can't be fully exercised under
headless virtual-time — validate PWA install/offline on a real device.
