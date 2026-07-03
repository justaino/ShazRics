# ShazRics

A Nigerian song-lyrics party game for mobile, desktop, and web. Pass one device around the room: the card shows an **incomplete lyric**, a team shouts the missing part, then the phone-holder taps **Reveal** to check and self-scores **Got it** (+1) or **Skip**. Won cards pile up per team, and the winner is revealed when you end the game.

> *ShazRics* — "Shaz" from Shazam + "Rics" from lyrics. How well do you really sabi the words?

It's a fork of the [Omo Naija](https://github.com/justaino/Omo-Naija) engine — same architecture, card-stack scoreboard, and pass-and-play loop, re-skinned to plum/cream with a lyrics turn mechanic.

## Status
Early. Phase 0 of `ROADMAP.md` is done: the fork is re-skinned to ShazRics (plum/cream, "SR" mark), the bundled 50-song Naija chorus lyric bank loads, and the Omo-Naija-only assets/word-banks/mode-system code are removed. The reveal-then-self-score turn mechanic lands in Phase 1. See `CLAUDE.md` → Status.

## How to play (the game)
1. Set up teams, timer length, skip rule, and win condition.
2. Pass the phone to the active team.
3. Read the incomplete lyric aloud and shout the missing part.
4. Tap **Got it!** for each line you nail (+1), **Skip** to pass.
5. When the timer ends, the phone moves to the next team.
6. Tap **End game** anytime to reveal the final stacks and the winner.

## Tech
- Vanilla HTML / CSS / JavaScript (no UI framework, no build step).
- GSAP (+ Flip) for animation, Howler.js for sound, canvas-confetti for the win — all vendored locally in `assets/vendor/` (no CDN), so the app works offline.
- `localStorage` for game state + settings (no backend, no accounts).
- Buildless PWA: hand-written `manifest.json` + `service-worker.js` — installable and fully offline.

## Run it
Serve the folder over HTTP (ES-module imports and the lyric-bank `fetch` don't work from `file://`):

```
python3 -m http.server 8731     # or: npx serve
```

Then open the printed `http://localhost:…` URL. The PWA installs over **HTTPS or localhost**.

> Note: after changing app-shell files, bump `CACHE` in `service-worker.js` so installed devices pick up the new version.

## Structure
```
shazrics/
  index.html              # entry (design source of truth)
  css/                    # base/tokens, components, screens, animations, dark
  js/
    app.js                # bootstrap + state-driven screen routing
    state.js              # gameState + localStorage persistence
    game.js               # turn engine, scoring, win conditions
    timer.js              # timestamp countdown + wake lock
    deck.js               # shuffle / draw
    screens/              # render fn per screen
    components/           # card, pile, scoreboard, timer ring
    data/wordbank-loader.js
  data/wordbanks/
    naija-chorus-50-pack.json  # bundled 50-song lyric bank
  assets/sounds/  assets/icons/  assets/fonts/
  manifest.json  service-worker.js
  CLAUDE.md  ROADMAP.md  README.md
```

## Design system
Plum `#6D4C7D`, deep plum `#43304F`, muted gold `#C6A15B`, mauve `#A67BA0`, ink `#2C2430`, cream surface `#FAF5EE`. Bold display font for lyrics, clean sans for UI. Cream cards on cream, pill buttons, segmented controls, conic-gradient timer ring, and the signature stacked-card piles.

## Contributing notes
Read `CLAUDE.md` first — it has the non-negotiable guardrails. Build only the current `ROADMAP.md` phase and meet its "Done when" before moving on.
