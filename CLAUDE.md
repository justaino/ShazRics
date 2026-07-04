# CLAUDE.md — ShazRics

Persistent guardrails for this repo. Read before any work. These don't change between phases.

## What this is
**ShazRics** — a Nigerian song-lyrics party game (name = "Shaz" from Shazam + "Rics" from lyrics). One device, passed around a room. Teams take turns: the card shows an **incomplete lyric**, the team shouts the missing part, then the phone-holder taps **Reveal** to check and self-scores **Got it** (+1) or **Skip**. Cards won pile up per team; the winner is revealed when the game ends.

It is a **fork of the Omo Naija engine** (github.com/justaino/Omo-Naija). Same architecture, same card-stack scoreboard, same pass-and-play loop — with two deliberate differences (see "How this differs from Omo Naija").

## Status (living — update as you go)
As of start: **Not started.** First job is to fork the Omo Naija codebase, re-theme it to the plum/cream palette, and adapt the data model + turn mechanic. Phases 0–3 of Omo Naija are the reference for what "done" looks like on the shared engine.

- **Workflow:** work on `dev`; merge to `main` only when explicitly asked. Bump `CACHE` in `service-worker.js` on any app-shell change.
- **Commit messages:** **never add a `Co-Authored-By` trailer** (or any "Generated with Claude" line). Plain messages only.
- **Keep the docs current as you go.** On any user-visible or operational change, update **both** `documentation/RUNBOOK.md` (operations/how-to) and `documentation/WHATS-NEW.md` (player-facing changelog) in the same batch of work — don't leave them describing older behaviour.
- **Phase 4 is deferred** (online multiplayer, stats/history, etc.) — don't build toward it unless asked.

## How this differs from Omo Naija (the only two real changes)
1. **No Green / Grey / Mixed modes.** Drop the mode concept entirely — no mode setting on Setup, no mode chip on the card, no `modes` field in the data. Clue-giving style is irrelevant here; the card carries the challenge.
2. **New turn mechanic: reveal-then-self-score.** Each card shows an incomplete lyric. The team completes it aloud; the phone-holder taps **Reveal answer** to show the completed line **and** the `artist — song` credit; then taps **Got it!** (+1) or **Skip**. No typing, no automatic answer-checking — honour-system self-scoring, exactly like reading the back of a flashcard.

**Everything else carries over unchanged:** teams (2–6, coloured), timestamp timer (30/60/90s) + Wake Lock, deck shuffle/draw, skip rules (Free/Limited/Penalty), win conditions (Open-ended/First-to-N/Fixed rounds), the JS-computed card-stack scoreboard with "+N", the GSAP + canvas-confetti end-game reveal, Howler sound + mute, swipe gestures (right = Got it, left = Skip), haptics, persistence/resume, custom + bundled banks, How-to screen, install button, and the buildless PWA.

## The golden rule
**Preserve the Omo Naija structure and interaction design.** We are re-skinning and adjusting one mechanic — not rebuilding or redesigning the app. Keep the component structure, the screen flow, and the feel. Change the palette, the copy, the data model, and the turn step; leave the rest.

## Stack — fixed (same as Omo Naija)
- **Vanilla HTML / CSS / JavaScript.** No React, Vue, Svelte, or any UI framework.
- **GSAP (+ Flip)** for animation, **canvas-confetti** for the win, **Howler.js** for sound.
- **Buildless — no build step, no bundler.** Plain ES modules served statically over HTTP.
- Libraries are **vendored locally** in `assets/vendor/` (no CDN at runtime) so the app works offline. Display font self-hosted in `assets/fonts/`.

## Theme — dark-first "Midnight & Gold" (default), plum & cream (light option)
**Current identity (post-Phase 5):** the app is **dark-first**. The default theme is **Midnight & Gold** — deep plum-midnight surfaces, a **gold** primary accent, dusty-plum secondary, cream text. The plum/cream palette below is now the **light** theme (the optional topbar toggle) and its tokens in `css/base.css` `:root` are the baseline the dark layer overrides. **Two rules when touching theming:**
- **Never restyle inside `css/dark.css` with component-specific hacks first.** Recolour at the token level under `[data-theme="dark"]` (as the file already does) so both themes stay in sync; add per-component overrides only where a plum value is baked in as a surface.
- **Keep the light plum/cream theme working and unchanged.** It's the fallback and the original identity; changes to the dark look must not touch `base.css`/`components.css`/`screens.css` colours.

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

- In the **light** theme, card surfaces are cream and plum is the brand/accent (ink on cream, cream on plum). In the **dark** default (Midnight & Gold), surfaces are midnight, gold is the primary accent, plum is secondary, and text is cream — see `css/dark.css` for the resolved values.
- **Team colour options** (draw from the palette so the board stays cohesive, and read on both themes): plum `#6D4C7D`, mauve `#A67BA0`, gold `#C6A15B`, dusty teal `#5E8B87`, terracotta `#C57B57`, slate `#6B7A99`.
- Brand mark: the **"SR"** tile — cream-on-plum in the light theme, gold-on-midnight in the dark default. PWA icons are the gold-on-midnight mark; `manifest.json` theme/background colours are midnight.
- Theme is system-aware with an explicit topbar toggle; **dark is the default** for an unset preference (`preferences.theme` / the boot script in `index.html`).

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
- **Reveal is required before scoring** on each card (the phone-holder needs to see the answer to judge). Got it / Skip are only enabled after Reveal — or keep them always enabled but make Reveal the obvious primary action; pick one and be consistent.
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
