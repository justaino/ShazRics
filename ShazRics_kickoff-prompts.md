# Claude Code — Kickoff Prompts (ShazRics)

Run these in a **new Claude Code session**, in order. Phase 0 to completion (and eyeball it) before Phase 1. Assumes `ShazRics_CLAUDE.md` (renamed to `CLAUDE.md`), `ShazRics_ROADMAP.md` (renamed to `ROADMAP.md`), and `naija-lyrics-sample.json` are in the new repo, and that you have the Omo Naija codebase available to fork.

---

## Before you start (one-time setup, do this yourself)
1. Create a new repo/folder for ShazRics.
2. Copy the **entire Omo Naija codebase** into it (all of `index.html`, `css/`, `js/`, `assets/`, `data/`, `manifest.json`, `service-worker.js`).
3. Drop in `CLAUDE.md`, `ROADMAP.md`, and `data/wordbanks/naija-lyrics-sample.json` from these files.
4. Then paste Phase 0 below.

---

## Phase 0 — Fork, re-skin, adapt data

```
We're building "ShazRics", a Nigerian song-lyrics party game. It is a FORK of the Omo Naija engine that has been copied into this repo. Read CLAUDE.md and ROADMAP.md first and follow them strictly. The golden rule: preserve the Omo Naija structure and interaction design — we are re-skinning and adjusting one mechanic, not rebuilding.

Phase 0 only — get a running, rebranded copy. Do NOT change the turn mechanic yet.

1. Re-theme to the plum/cream palette in CLAUDE.md (Theme section). Swap the green design tokens in the CSS tokens/base file. This is a cream/LIGHT theme (Omo Naija was dark) — card surfaces are cream, plum is the brand/accent. Check contrast everywhere (ink on cream, cream on plum). Update team colour options to the palette list.
2. Rebrand: change the app name to "ShazRics" throughout (titles, header, How-to, manifest). Replace the Nigerian-flag "ON" brand mark with a "SR" mark on plum (simple, clean). Regenerate the PWA icons and set manifest.json theme_color / background_color to match the new palette.
3. Adapt the data model: replace the bundled word bank with the lyric shape { id, prompt, answer, artist, song, era, difficulty } — drop the modes and hint fields. Wire in data/wordbanks/naija-lyrics-sample.json as the default bank. Update wordbank-loader.js to the new card shape.
4. Bump CACHE (e.g. omo-naija-v… → shazrics-v1) and update PRECACHE in service-worker.js for any renamed/added files.
5. Prune the fork: this repo is a copy of Omo Naija, so delete what the lyrics game doesn't use — the Nigerian-flag brand art, old PWA icons, the Omo Naija word banks (naija-classic.json, naija-artists.json), and the mode system's code (not just its UI — mode fields in gameState, mode logic in the turn engine, mode components/CSS). Before deleting anything, grep to confirm it's truly unreferenced; if unsure, list it and ask rather than deleting blind. Do the deletion as its own clearly-labelled commit, and update PRECACHE for removed files.

Done when: the app boots, looks like ShazRics (plum/cream, SR mark), the sample lyric bank loads, every screen renders, and Omo-Naija-only files/code are gone. The OLD turn mechanic (with modes) may still be partly present in the play flow — that's expected; we finish swapping it in Phase 1. Test in a real browser (python3 -m http.server 8731) before calling it done. Do not start Phase 1.
```

---

## Phase 1 — Swap the mechanic (reveal + self-score)

```
Continue ShazRics. Phase 0 (fork + re-skin + data model) is done. Read CLAUDE.md and ROADMAP.md; implement Phase 1 only. Keep the plum/cream look and the Omo Naija structure.

Turn it into a lyrics game with a reveal-then-self-score mechanic:

1. Remove modes ENTIRELY: delete the Green/Grey/Mixed setting from the Setup screen, the mode chip from the card, and all mode logic from the turn engine and gameState. No mode language anywhere.

2. Card face: show the card's `prompt` (the incomplete lyric) large and readable, with its visible blank. Keep the answer hidden initially.

3. Reveal: add a "Reveal answer" primary action on the play card. On reveal, show `answer` prominently and the "`artist` — `song`" credit beneath it. Track a `revealed` flag in the current-turn state so it resets per card.

4. Scoring: "Got it!" = +1 and advance to the next card; "Skip" = advance respecting the skip rule. Apply the Reveal-gating rule from CLAUDE.md consistently (Reveal is the obvious primary action; Got it/Skip finalise the card). Swipe gestures keep working (right = Got it, left = Skip) and must play nicely with the Reveal step.

5. Everything else stays as-is from the engine: 30/60/90s timestamp timer + Wake Lock, deck shuffle/draw, skip rules, win conditions, the JS card-stack scoreboard with "+N", the GSAP + confetti end-game reveal, Howler sound + mute, haptics, persistence/resume.

6. Rewrite the How-to screen for the new flow (read the incomplete lyric → team completes it → Reveal → Got it / Skip). Update any Setup copy.

Done when: a full multi-team game plays start to finish — incomplete lyric shown, reveal works, self-scoring is correct, cards stack per team, timer/skip/win settings take effect, and refreshing mid-game resumes it. Test in a real browser before committing. Do not start Phase 2.
```

---

## Phase 2 — Content & custom banks

```
Continue ShazRics. Phases 0 and 1 are done — it's a working lyrics game (plum/cream, reveal-then-self-score, Omo-Naija-only code pruned). Read CLAUDE.md and ROADMAP.md; implement Phase 2 only. Keep the look and structure.

Goal: let the household create their own lyric banks in-app, so real favourites can be poured in without touching code.

1. Extend the existing custom-bank editor (inherited from Omo Naija) to accept LYRIC rows instead of plain words. Input format, one entry per line:
   prompt || answer || artist || song
   - "||" is the delimiter. artist and song are optional (a row may be just "prompt || answer").
   - The prompt should contain the visible blank (e.g. a trailing ______ or a mid-line gap) — accept whatever the user types; don't auto-insert blanks.
2. Parse each line into the card shape { id, prompt, answer, artist, song, era, difficulty }. Auto-generate id; default era/difficulty if not supplied (era "modern", difficulty "medium"). Trim whitespace.
3. Validation: a row is valid if it has at least prompt AND answer. Show a friendly, specific error for malformed rows (e.g. "Line 4: missing the answer after ||") and don't save until fixed — but let valid rows preview.
4. Live preview: as with the format demo, show how the first card will look (prompt with blank, then the revealed answer + "artist — song" credit) so the user can sanity-check before saving.
5. Persist custom banks to localStorage (same mechanism as Omo Naija's custom banks). The Setup bank picker lists bundled + custom banks; Settings keeps a default-bank choice. Editing an existing custom bank (not just add/delete) should work here if it doesn't already — re-open its rows in the editor, save back.
6. Keep the bundled sample bank clearly labelled as a format demo ("replace with your own").
7. Update the How-to / any helper text to explain the "prompt || answer || artist || song" format with a one-line example.

Done when: you can paste a set of lyric rows in the editor, see them validate and preview, save the bank, pick it on Setup, and immediately play a full game from it. Malformed rows are caught with clear messages. Test in a real browser (python3 -m http.server 8731) before committing. Do not start Phase 3.
```

---

## Phase 3 — Polish

```
Continue ShazRics. Phase 2 is done — custom lyric banks work end to end. Read CLAUDE.md and ROADMAP.md; implement Phase 3 only. This is the polish pass; don't change the core loop or data model.

1. Reveal animation: animate the answer appearing on Reveal (a card flip, or the answer + "artist — song" credit fading/sliding in) using GSAP. Must honour prefers-reduced-motion (instant, no motion, when set). Keep it quick — this fires on every card.
2. Sound: fit the audio to the reveal beat via the existing Howler setup — a soft chime on Reveal, the "got it" ding on Got it, the buzzer at zero seconds. Respect the global mute and the Settings sound toggle. No new audio library.
3. Optional "artist hint" toggle: a Settings option (and/or a per-game Setup toggle) that shows the artist up-front on the card, before Reveal, to make play easier for younger/mixed groups. Default off.
4. Accessibility pass: verify contrast on the plum/cream palette (ink on cream, cream on plum, muted text), visible focus states, labelled controls, tap targets >= 56px, and that Reveal / Got it / Skip are all keyboard-reachable and screen-reader-sensible.
5. Optional dark mode: mirror Omo Naija's system-aware, persisted toggle, retinted for the plum palette (deep-plum surfaces, cream text). Only if it doesn't destabilise the light theme — light is primary.
6. PWA check: after all the Phase 2–3 changes, confirm install + offline still work. Bump CACHE and update PRECACHE for any added/removed files (animations, sounds, icons).
7. Final polish sweep: no accidental-tap hazards (confirm before End Game; Got it / Skip well separated), no dead CSS/JS left from the polish work, consistent copy.

Done when: reveals feel smooth (and respect reduced-motion), sound fits the flow and mutes cleanly, the app passes an accessibility check, PWA install/offline is intact, and an optional dark mode works if included. Test in a real browser before committing.
```

---

### After Phase 3
That's v1 feature-complete — a polished, installable, offline lyrics party game your household can fill with its own banks. Anything beyond this (online multiplayer, typed-answer auto-checking, multiple-choice, audio snippets, stats/history, shareable results) is Phase 4 / deferred — come back and we'll scope it if you want to go there.
