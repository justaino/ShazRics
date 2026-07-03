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
