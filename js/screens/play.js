// play.js — the live turn. Lyric card, Got it / Skip, the timer ring, a thinning
// deck behind the card, and the urgency dot. On Got it the card flies to the
// team's score pill (GSAP); on Skip it slides away.
// (Phase 1 adds the Reveal-answer step; this is still the carried-over turn UI.)
import { currentTeam, canSkip, SKIP_LIMIT } from '../game.js';
import { esc } from '../util.js';
import * as anim from '../anim.js';
import * as sound from '../sound.js';
import * as haptics from '../haptics.js';

export function render(el, ctx) {
  const { state } = ctx;
  const team = currentTeam();
  const card = state.currentCard;
  const deckLeft = state.deck.length;

  // Initial timer text from the timestamp so it doesn't flash a stale value.
  const remaining = Math.max(0, (state.turn.endsAt || 0) - Date.now());
  const initialTime = `${Math.floor(Math.ceil(remaining / 1000) / 60)}:${String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}`;

  // Skip button label/availability per skip rule.
  let skipLabel = '⤺ Skip';
  let skipDisabled = false;
  if (state.settings.skipRule === 'limited') {
    skipLabel = `⤺ Skip (${Math.max(0, SKIP_LIMIT - state.turn.skipsUsed)})`;
    skipDisabled = !canSkip();
  } else if (state.settings.skipRule === 'penalty') {
    skipLabel = '⤺ Skip (−1)';
  }

  // Deck visibly thins: fewer peek cards as the draw pile empties.
  const peeks = (deckLeft > 1 ? '<div class="peek-card peek-card--one"></div>' : '')
              + (deckLeft > 0 ? '<div class="peek-card peek-card--two"></div>' : '');

  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="play-card">
        <div class="topbar-row">
          <div class="timer" id="timer-ring">
            <div class="timer__inner" id="timer-text">${initialTime}</div>
          </div>
          <div class="team-meta">
            <div class="team-name">${esc(team ? team.name : '')}</div>
            <div class="score-pill" id="score-pill"><span style="color:${team ? team.color : 'currentColor'}">●</span> ${team ? team.score : 0}</div>
          </div>
          <button class="ghost-link" data-end>End game</button>
        </div>

        <div class="play-meta">
          <div class="screen__eyebrow">Live play</div>
          <div class="deck-count" aria-label="Cards left in deck">${deckLeft} in deck</div>
        </div>

        <div class="word-stack">
          ${peeks}
          <div class="word-card" id="word-card">
            <div class="word-card__urgentbar" aria-hidden="true"></div>
            <div class="word-card__tags">
              <span class="tag">${esc(card ? [card.era, card.difficulty].filter(Boolean).join(' · ') : '')}</span>
            </div>
            <div class="word-card__word">${esc(card ? card.prompt : '')}</div>
            <div class="word-card__foot">
              <span>Shout the missing part</span>
              <span>●</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="action-btn action-btn--success" data-got>✓ Got it!</button>
          <button class="action-btn action-btn--skip" data-skip ${skipDisabled ? 'disabled' : ''}>${skipLabel}</button>
        </div>
      </div>
    </div>`;

  const cardEl = el.querySelector('#word-card');

  // The two outcomes — used by both the buttons and the swipe gestures.
  // Each animates the outgoing card (cosmetic), then advances the game.
  const doGot = () => {
    sound.play('ding');
    haptics.tap();
    anim.flyToPile(cardEl, el.querySelector('#score-pill'));
    ctx.actions.gotIt();
  };
  const doSkip = () => {
    anim.skipAway(cardEl);
    ctx.actions.skip();
  };

  el.querySelector('[data-got]').addEventListener('click', doGot);
  el.querySelector('[data-skip]').addEventListener('click', () => { if (!skipDisabled) doSkip(); });
  el.querySelector('[data-end]').addEventListener('click', () => ctx.actions.endGameConfirm());

  // Swipe: right = Got it, left = Skip (alongside the buttons).
  let dragging = false, startX = 0, startY = 0, dx = 0;
  const THRESHOLD = 90;
  const snapBack = () => { cardEl.style.transition = 'transform 0.2s ease'; cardEl.style.transform = ''; };

  cardEl.style.touchAction = 'pan-y'; // vertical scroll stays; we own horizontal
  cardEl.addEventListener('pointerdown', (e) => {
    dragging = true; startX = e.clientX; startY = e.clientY; dx = 0;
    cardEl.style.transition = 'none';
    try { cardEl.setPointerCapture?.(e.pointerId); } catch { /* non-active pointer */ }
  });
  cardEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    if (Math.abs(dx) < Math.abs(e.clientY - startY)) return; // mostly vertical: ignore
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx * 0.04}deg)`;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (dx > THRESHOLD) doGot();
    else if (dx < -THRESHOLD) { skipDisabled ? snapBack() : doSkip(); }
    else snapBack();
  };
  cardEl.addEventListener('pointerup', endDrag);
  cardEl.addEventListener('pointercancel', endDrag);
}
