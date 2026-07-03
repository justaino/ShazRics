// home.js — landing screen. "Play" starts setup; "Continue game" appears only
// when a resumable in-progress game exists on disk; "Install app" appears when
// the app can be installed (or on iOS, to show instructions).
import { hasResumableGame } from '../state.js';
import * as install from '../install.js';
import * as haptics from '../haptics.js';

// Hidden developer entry: tap the brand mark 5 times (within 2s of each tap) to
// open the read-only word-bank browser. No visual hint — dev-only.
const DEV_TAPS = 5;
const DEV_WINDOW = 2000;

export function render(el, ctx) {
  const canContinue = hasResumableGame();
  const canInstall = install.canShow();
  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="hero">
        <div class="brand-mark">SR</div>
        <div>
          <div class="screen__eyebrow">Nigerian lyrics party game</div>
          <h1 class="screen__title">ShazRics</h1>
        </div>
        <p class="screen__copy">Pass the phone, read the incomplete lyric, and shout the missing part. Reveal to check, self-score, and build a big pile of cards.</p>
      </div>
      <div class="button-stack">
        <button class="btn btn--primary" data-act="play">Play</button>
        ${canContinue ? '<button class="btn btn--secondary" data-act="continue">Continue game</button>' : ''}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <button class="btn btn--ghost" data-act="howto">How to play</button>
          <button class="btn btn--ghost" data-act="settings">Settings</button>
        </div>
        ${canInstall ? '<button class="btn btn--secondary" data-act="install">⤓ Install app</button>' : ''}
      </div>
    </div>`;

  el.querySelector('[data-act="play"]').addEventListener('click', () => ctx.actions.openSetup());
  el.querySelector('[data-act="continue"]')?.addEventListener('click', () => ctx.actions.continueGame());
  el.querySelector('[data-act="howto"]').addEventListener('click', () => ctx.actions.openHowto());
  el.querySelector('[data-act="settings"]').addEventListener('click', () => ctx.actions.openSettings());
  el.querySelector('[data-act="install"]')?.addEventListener('click', () => install.activate());

  // Easter egg: 5 quick taps on the "SR" mark -> the hidden lyric-bank browser.
  const mark = el.querySelector('.brand-mark');
  let taps = 0;
  let timer = null;
  mark?.addEventListener('click', () => {
    taps += 1;
    clearTimeout(timer);
    if (taps >= DEV_TAPS) {
      taps = 0;
      haptics.buzzer();
      ctx.actions.openBanks();
      return;
    }
    timer = setTimeout(() => { taps = 0; }, DEV_WINDOW);
  });
}
