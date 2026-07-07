# CLAUDE.md — ShazRics

Persistent guardrails for this repo. Read before any work. These don't change between phases.

## What this is
**ShazRics** — a Nigerian song-lyrics party game (name = "Shaz" from Shazam + "Rics" from lyrics). One device, passed around a room. Teams take turns: the card shows an **incomplete lyric**, the team shouts the missing part, and the phone-holder self-scores **Got it** (+1) or **Skip** (tapping **Reveal** to check the answer is optional). Cards won pile up per team; the winner is revealed when the game ends.

It is a **fork of the Omo Naija engine** (github.com/justaino/Omo-Naija). Same architecture, same card-stack scoreboard, same pass-and-play loop — with two deliberate differences (see "How this differs from Omo Naija").

## Status (living — update as you go)
**Phases 0–3, 5, and 6 done.** The fork is a working ShazRics lyrics game: plum/cream re-skin, self-score + optional-reveal mechanic, custom lyric banks, polish, the dark-first Midnight & Gold identity (Phase 5), and now **user-selectable themes** (Phase 6 — seven palettes picked in Settings, including the glass-and-glow **Midnight Neon**). Phase 4 remains deferred.

- **Workflow:** work on `dev`; merge to `main` only when explicitly asked. Bump `CACHE` in `service-worker.js` on any app-shell change.
- **Commit messages:** **never add a `Co-Authored-By` trailer** (or any "Generated with Claude" line). Plain messages only.
- **Keep the docs current as you go.** On any user-visible or operational change, update **both** `documentation/RUNBOOK.md` (operations/how-to) and `documentation/WHATS-NEW.md` (player-facing changelog) in the same batch of work — don't leave them describing older behaviour.
- **Phase 4 is deferred** (online multiplayer, stats/history, etc.) — don't build toward it unless asked.

## How this differs from Omo Naija (the only two real changes)
1. **No Green / Grey / Mixed modes.** Drop the mode concept entirely — no mode setting on Setup, no mode chip on the card, no `modes` field in the data. Clue-giving style is irrelevant here; the card carries the challenge.
2. **New turn mechanic: self-score, reveal optional.** Each card shows an incomplete lyric. The team completes it aloud; the phone-holder taps **Got it!** (+1) or **Skip** — **at any time**. **Reveal answer** is *optional* (tap the button, or tap the card) and just shows the completed line **and** the `artist — song` credit when a team wants to check — it never gates scoring. No typing, no automatic answer-checking — honour-system self-scoring, like reading the back of a flashcard.

**Everything else carries over unchanged:** teams (2–6, coloured), timestamp timer (30/60/90s) + Wake Lock, deck shuffle/draw, skip rules (Free/Limited/Penalty), win conditions (Open-ended/First-to-N/Fixed rounds), the JS-computed card-stack scoreboard with "+N", the GSAP + canvas-confetti end-game reveal, Howler sound + mute, swipe gestures (right = Got it, left = Skip), haptics, persistence/resume, custom + bundled banks, How-to screen, install button, and the buildless PWA.

## The golden rule
**Preserve the Omo Naija structure and interaction design.** We are re-skinning and adjusting one mechanic — not rebuilding or redesigning the app. Keep the component structure, the screen flow, and the feel. Change the palette, the copy, the data model, and the turn step; leave the rest.

## Stack — fixed (same as Omo Naija)
- **Vanilla HTML / CSS / JavaScript.** No React, Vue, Svelte, or any UI framework.
- **GSAP (+ Flip)** for animation, **canvas-confetti** for the win, **Howler.js** for sound.
- **Buildless — no build step, no bundler.** Plain ES modules served statically over HTTP.
- Libraries are **vendored locally** in `assets/vendor/` (no CDN at runtime) so the app works offline. Display font self-hosted in `assets/fonts/`.

## Theme — dark-first "Midnight Neon" (default), seven user-selectable palettes
**Current identity (post-Phase 6):** the app is **dark-first**. The default theme is **Midnight Neon** — a 2am-club look: a warm near-black ground (`#08070E`) with an ambient magenta/cyan glow, frosted-glass cards, magenta primary + cyan secondary, neon-glow display type (`css/neon.css`). Midnight & Gold (deep plum-midnight, gold primary) remains a selectable dark theme. The plum/cream palette below is the **light** baseline; its tokens in `css/base.css` `:root` are what the other themes override. **Users pick from seven themes in Settings → Theme** (Plum & Cream, Midnight & Gold, Midnight Neon, and four light alternatives — Emerald, Teal, Sunset, Cobalt), plus "Match device". A theme is **one `[data-theme="…"]` token block** (a *dark* theme adds targeted surface overrides too): the four light alternatives live in `css/themes.css`, the two dark themes in `css/dark.css` (Midnight & Gold) and `css/neon.css` (Midnight Neon); the switcher/registry is `js/theme.js`, the picker in `js/screens/settings.js`. The topbar light↔dark toggle is **always visible** and flips to the **last-used** theme of the other kind (Emerald ↔ Neon, Cobalt ↔ Midnight & Gold, …), tracked via `preferences.lastLightTheme` / `lastDarkTheme` in `theme.js` (`apply()` records the applied theme; `toggle()` restores the opposite slot). Exact per-theme token values: `documentation/THEME-PALETTES.md`. **Three rules when touching theming:**
- **Recolour through tokens only.** Every screen reads the palette tokens (the nine palette vars + `--plum-rgb`/`--gold-rgb` tint channels + `--plum-lift` for the play-card gradient + the `--color-*` aliases). Add a new theme as a token block; add per-component overrides only where a value is baked in as a surface (as `dark.css` does for `.word-card` etc.). When adding/removing a theme, keep the `THEMES` registry (`theme.js`) and the boot script's `KNOWN` id map (`index.html`) in sync.
- **Never restyle inside `css/dark.css` (or `themes.css`) with component-specific hacks first.** Do it at the token level so all themes stay in sync.
- **Keep the light plum/cream theme working and unchanged.** It's the fallback and the original identity; changes to any other theme must not touch `base.css`/`components.css`/`screens.css` colours.

The plum/cream palette (the **light** theme baseline) — classy, understated, warm:

```
--plum:        #6D4C7D;   /* primary brand / accents */
--plum-deep:   #43304F;   /* deep plum: headers, gradients, hero */
--plum-soft:   #EBE1EF;   /* soft plum tint on cream */
--cream:       #FAF5EE;   /* primary surface / card base */
--cream-deep:  #F0E8DC;   /* layered cream */
--ink:         #2C2430;   /* plum-charcoal text */
--muted:       #8A7E8F;   /* muted/secondary text */
--gold:        #C6A15B;   /* muted winner gold (crown, glow) */
--mauve:       #A67BA0;   /* dusty-rose secondary accent */
```

- In the **light** themes, card surfaces are cream and the primary token is the brand/accent (ink on cream, cream on primary). In the **dark** default (Midnight Neon), surfaces are frosted glass over a near-black glow, magenta is the primary accent, cyan is secondary, and text is near-white — see `css/neon.css`. The other dark theme (Midnight & Gold, `css/dark.css`) uses midnight surfaces + gold primary. The four alternative light themes (`css/themes.css`) recolour the same slots.
- **Team colour options** (draw from the palette so the board stays cohesive, and read across themes): plum `#6D4C7D`, mauve `#A67BA0`, gold `#C6A15B`, dusty teal `#5E8B87`, terracotta `#C57B57`, slate `#6B7A99`. Team colours are theme-independent (fixed identities), so a plum team dot on, say, the Emerald theme is expected.
- Brand mark: the **"SR"** tile — cream-on-primary in light themes, gold-on-midnight in Midnight & Gold, and a magenta→purple gradient tile in Midnight Neon. The installed PWA icon is a **single static** gold-on-midnight mark (a home-screen icon can't follow the in-app theme); `manifest.json` theme/background colours are near-black `#08070E` (the neon ground), but `<meta name="theme-color">` is updated dynamically per active theme by `theme.js`.
- Theme is system-aware with an explicit picker (Settings → Theme) + an always-visible quick light↔dark topbar toggle (flips to the last-used theme of the other kind); **dark is the default** for an unset preference — resolving to **Midnight Neon** (`preferences.theme` default, the `SYSTEM_DARK` id in `theme.js`, and the boot script in `index.html` must agree).

## Data model — lyric cards (words are data, not code)
Banks live in `data/wordbanks/*.json`, loaded via the same loader. Card shape:

```json
{
  "id": "l001",
  "prompt": "First line of the lyric, then the gap ...",
  "answer": "the missing words that complete it",
  "artist": "Artist Name",
  "song": "Song Title",
  "era": "modern",
  "difficulty": "easy"
}
```

- `prompt` shows on the card (the incomplete lyric, with a visible blank, e.g. a trailing `______` or a mid-line gap). `answer` is hidden until **Reveal**.
- On **Reveal**, show the completed lyric (`prompt` with `answer` filled in, or `answer` on its own) **and** the `artist — song` credit together as the payoff.
- Optionally show `artist` up-front as a difficulty-lowering hint — a small toggle, later, not v1.
- **No `modes` field.** No `hint` field needed (artist/song is the context).
- Bundled banks are **sample/original placeholders**; real lyric banks are expected to be **user-created** via the in-app custom-bank editor (extend it to accept `prompt | answer | artist | song` rows).

## Architecture rules (unchanged from Omo Naija)
- **Single `gameState` object.** Screens render from state; never a hardcoded screen index.
- **Persist to `localStorage`** on every change (powers Continue game).
- **No backend, no accounts, no network calls.** Single-device pass-and-play only.
- **Timer is timestamp-based** (never `setInterval` tick-counting). Use the **Wake Lock API** during a live turn.

## Game rules to honour
- **Scoring is even**: every correct guess = +1.
- **Reveal is optional.** Got it / Skip are usable at any time (Got it always; Skip subject to the skip rule). Reveal answer — the button, or a tap on the card — just shows the answer + credit for a team that wants to check; it never gates scoring.
- **Timed-out card is recoverable.** When the timer hits zero, the card still on screen is kept on the turn summary as **skipped** (no penalty, no skip-limit cost) so a team that knew it but ran out of time can flip it to **Got it** there (under the Free skip rule).
- **Skips** configurable at setup: Free (default), Limited, Penalty.
- **Win condition** configurable: Open-ended (default), First-to-N, Fixed rounds.
- **End Game is always reachable** during play and on the scoreboard; it jumps to the reveal.

## The signature card-stack (unchanged — get it right)
- Won cards render as a physical pile (offset + slight rotation), **JS-computed**, compressing to "+N" past ~8–10 visible so it never grows unusably tall.
- On "Got it", the current card flies onto the active team's pile (GSAP Flip).

## Quality bar (unchanged)
- Accessibility: `prefers-reduced-motion`, high contrast, tap targets ≥ 56px, labelled controls.
- Touch + desktop: tap and swipe both work.
- No accidental taps: confirm before End Game; keep Got it / Skip well separated.
- ASCII-safe data. **Test in a real browser before committing** (`python3 -m http.server 8731`).

## Cleanup after the fork (remove what this game doesn't use)
This repo is a copy of Omo Naija, so it arrives with files and code the lyrics game doesn't need. During Phase 0, actively prune — don't leave dead code lying around:
- **Delete Omo-Naija-only assets:** the Nigerian-flag brand art, old PWA icons, the Omo Naija word banks (`naija-classic.json`, `naija-artists.json`, etc.), and any images/sounds not reused.
- **Remove the mode system's code**, not just its UI: mode fields in `gameState`, mode logic in the turn engine, mode chips/components, and any CSS for them.
- **Strip dead branches** left behind once the mechanic changes (e.g. clue-style rendering, unused helpers in `deck.js`/screens/components).
- **Before deleting, confirm a file/function is truly unreferenced** (grep for imports/usages). If unsure whether something is still needed, **list it and ask** rather than deleting blind — a wrong delete can break the shared engine.
- Keep the deletion in its own commit with a clear message so it's easy to review/revert.
- After pruning, update `PRECACHE` in `service-worker.js` (remove deleted files) and bump `CACHE`.

Claude Code is well-suited to this: ask it to produce a **list of candidate files/functions to remove with the reason each is unused**, review the list, then have it delete in a single reviewable commit.

## Scope discipline
Build phase by phase per ROADMAP.md; meet each "Done when" before moving on. Don't pull Phase 4 forward. If a request isn't covered by the current phase, flag it rather than silently expanding scope.

## Working with the user
When a request is ambiguous enough that you restate or clarify before acting, **stop and let the user confirm first** — don't restate and implement in the same turn. If it's unambiguous, just build.
