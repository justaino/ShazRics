# ROADMAP.md — ShazRics

Phased build. Work top to bottom. Don't start a phase until the previous one's "Done when" is met.

This project **forks the Omo Naija engine** — so the roadmap is "adapt an existing working app," not "build from scratch." Most of the loop already works; we re-skin it and swap one mechanic.

---

## Phase 0 — Fork, re-skin, adapt data
Stand up a running copy in the new identity.

- [ ] Copy the Omo Naija repo into this project (keep the structure, CSS architecture, JS modules, PWA files).
- [ ] Swap the design tokens to the **plum/cream palette** (see CLAUDE.md → Theme). This is a cream/light theme — verify contrast (ink on cream, cream on plum).
- [ ] Rebrand: new name "ShazRics", new brand mark (**SR** on plum, or a music-note motif), regenerated PWA icons, and `manifest.json` theme/background colours.
- [ ] Update the lyric **data model**: change the bundled bank(s) to `{ id, prompt, answer, artist, song, era, difficulty }`. Drop `modes`/`hint`. Ship the sample bank (`naija-lyrics-sample.json`).
- [ ] Update `wordbank-loader.js` for the new card shape.
- [ ] **Prune the fork:** delete Omo-Naija-only assets (flag art, old icons, `naija-classic.json` / `naija-artists.json`), and remove the mode system's code and any now-dead helpers. Have Claude Code list candidate files/functions with the reason each is unused, review the list, then delete in one reviewable commit. Confirm each is truly unreferenced first.
- [ ] Bump `service-worker.js` `CACHE` and `PRECACHE` for renamed/added/removed files.

**Done when:** the app boots and looks like ShazRics (plum/cream, new mark), the sample lyric bank loads, and you can walk the existing screens. The turn mechanic is still the old one at this point — that's fine.

---

## Phase 1 — Swap the mechanic (reveal + self-score)
Turn it into a lyrics game.

- [ ] **Remove modes everywhere:** delete the Green/Grey/Mixed setting from Setup, the mode chip from the card, and mode logic from the turn engine and `gameState`.
- [ ] **Card face:** render `prompt` large (with a visible blank), the answer hidden. Add a **Reveal answer** action.
- [ ] **Reveal state:** on Reveal, show `answer` prominently and the `artist — song` credit underneath. Track `revealed` per card in turn state.
- [ ] **Scoring:** **Got it!** (+1, next card) and **Skip** (respect skip rule, next card). Decide and apply the Reveal-gating rule from CLAUDE.md (Reveal before scoring, or Reveal-as-primary) — be consistent.
- [ ] **Swipe gestures** keep working (right = Got it, left = Skip); make sure they interact sensibly with the Reveal step.
- [ ] Setup copy/labels updated (no mode language); How-to screen rewritten for the lyrics flow.

**Done when:** a full multi-team game plays end to end — read the incomplete lyric, reveal, self-score, cards stack, timer/skip/win settings all work, and a refresh resumes the game.

---

## Phase 2 — Content & custom banks
Make it yours to fill.

- [ ] Extend the **custom-bank editor** to accept lyric rows. Suggested input format, one per line:
      `prompt || answer || artist || song`  (a clear delimiter; artist/song optional).
- [ ] Validate + parse into the card shape; show a friendly error on malformed rows.
- [ ] Ship 1–2 **original sample banks** as format demos (clearly labelled "replace with your own").
- [ ] Bank picker on Setup lists bundled + custom banks; default-bank choice in Settings.

**Done when:** you can create a lyric bank in-app from pasted rows and immediately play it.

---

## Phase 3 — Polish
- [ ] Reveal animation (card flip or answer fade-in) using GSAP; honour `prefers-reduced-motion`.
- [ ] Sound cues fit the reveal beat (soft chime on Reveal, ding on Got it, buzzer at zero) with global mute.
- [ ] Optional **artist-as-hint** toggle (show the artist before reveal for easier play).
- [ ] Accessibility pass: contrast, focus states, labels, tap-target sizes.
- [ ] Optional dark mode mirroring Omo Naija's system-aware toggle.
- [ ] Confirm PWA install + offline still solid after the re-skin.

**Done when:** it feels polished, plays offline, is configurable and accessible.

---

## Phase 4 — Deferred / optional (out of scope for v1)
Online multiplayer, typed-answer auto-checking, multiple-choice mode, audio snippets, stats/history, shareable results. **Do not build toward these unless asked.**

---

## Phase 5 — Visual identity: Midnight & Gold (dark-first re-theme) ✅
Done after Phase 3, on request — the plum/cream look was reworked into a dark-first identity. Kept entirely within the theming layer; no layout, flow, or logic changes.

- [x] Retint `css/dark.css` from "slate + plum" to **Midnight & Gold** (deep plum-midnight surfaces, **gold** primary accent, dusty-plum secondary, cream text). Done at the token level (`--color-primary` → gold, palette tokens redefined under `[data-theme="dark"]`) so the whole app recolours through the same variables, with targeted overrides only where plum was baked in as a surface (the play card, primary-button text, the brand mark).
- [x] **Flip the default theme to dark** (the boot script in `index.html`, `preferences.theme`, and the topbar button's pre-JS state). Light plum/cream stays as the optional toggle and is left byte-for-byte unchanged.
- [x] Retint the brand mark (gold disc), regenerate the PWA icons (gold "SR" on midnight), and set `manifest.json` + `<meta name="theme-color">` to midnight.
- [x] Bump `service-worker.js` `CACHE`.
- [x] Update the docs (this file, `CLAUDE.md` theme section, `RUNBOOK.md`, `WHATS-NEW.md`).

**Done when:** the app opens in Midnight & Gold by default across every screen, the light theme still renders identically to before when toggled, and PWA install/offline still works. ✅

---

## Phase 6 — User-selectable themes (a theme picker)
Let players pick their palette from Settings, not just toggle light/dark. **Highly feasible** — it extends the token/`data-theme` system that Phases 3 & 5 already built (a theme is one `[data-theme="…"] { … }` block; `dark.css` is the proof). No architectural changes.

**Designs already exist.** Six palettes are drawn up with exact token values in **`documentation/THEME-PALETTES.md`** (the authoritative source) — the two live ones (**Plum & Cream** light, **Midnight & Gold** dark) plus four ready-to-wire light alternatives (**Emerald**, **Teal**, **Sunset**, **Cobalt**), including copy-paste CSS blocks and a step-by-step implementation recipe. Visual reference: the palette-comparison Artifact (link in that file). **A fresh Claude Code session should start by reading `documentation/THEME-PALETTES.md`.**

**Recommendations (defaults for the three open decisions):**
1. **Flat list of self-contained themes** for v1 — each theme declares whether it's *light* or *dark*, and the user picks one. (Defer per-theme light/dark *pairs* — more surface area for little v1 gain.)
2. **Keep one "Match device" option** that maps to a light default (Plum & Cream) + a dark default (Midnight & Gold); every other choice is explicit. Preserves today's system-aware behaviour without blocking explicit picks.
3. **Keep a single installed app icon** (the gold-on-midnight "SR"). The PWA home-screen icon is a static PNG and can't follow the in-app theme — a platform limit, not a code one; the in-app mark still recolours per theme.

**Tasks:**
- [ ] **Enabling cleanup:** tokenize the few remaining hardcoded accent colours (the `rgba(109,76,125,…)` plums, the timer track in `timer.js`, the `celebrate()` confetti + `.confetti` colours) so every palette looks intentional. Do this first.
- [ ] Add the four light-theme `[data-theme]` blocks (from `THEME-PALETTES.md`) — e.g. a `css/themes.css`; register it in `index.html` + `PRECACHE`, bump `CACHE`.
- [ ] Generalize `preferences.theme` (`system | light | dark` → any theme id), `js/theme.js` `apply()`/`resolved()`, and the pre-paint boot script in `index.html`; keep a light/dark map so the topbar icon + `Match device` stay correct.
- [ ] **Theme picker in Settings** — a grid of tappable swatches (reuse the comparison-Artifact swatch style), persisted on tap. Decide the topbar button's role (quick light/dark toggle, or opens the picker).
- [ ] Dynamic `<meta name="theme-color">` (and manifest-driven chrome) from the active theme's `--cream-deep` on switch.
- [ ] Update docs (`CLAUDE.md` theme section, `RUNBOOK.md`, `WHATS-NEW.md`) and mark this phase done.

**Done when:** a player can pick any bundled theme in Settings, the choice persists across sessions and applies before first paint (no flash), "Match device" still follows the OS, every screen looks intentional in every theme (light and dark), and PWA install/offline still works.
