// play.js — the live turn. The card shows an incomplete lyric; the team shouts
// the missing part, then the phone-holder taps Reveal to see the answer + the
// artist — song credit and self-scores Got it / Skip. The timer ring, a thinning
// deck behind the card, and the urgency dot carry over from Omo Naija.
//
// Reveal-gating rule: REVEAL BEFORE SCORING. Got it / Skip stay disabled until
// Reveal is tapped. The phone-holder has to see the completed line to judge the
// shout honestly — this is a read-the-back-of-the-flashcard game — so the answer
// is the gate, and Reveal is the unmistakable first action on every card.
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
  let revealed = !!state.turn.revealed; // may flip to true in place on Reveal

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

  // The artist — song credit, from whichever fields the card carries.
  const credit = card ? [card.artist, card.song].filter(Boolean).join(' — ') : '';

  // Optional up-front artist hint (Settings/Setup) — shown before Reveal to make
  // play easier for younger/mixed groups. Hidden once the answer is revealed
  // (the full credit shows there instead), and only when the card names an artist.
  const showHint = !!state.settings.artistHint && !!(card && card.artist);

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
            <div class="word-card__body">
              <div class="word-card__word">${esc(card ? card.prompt : '')}</div>
              <div class="word-card__hint" id="artist-hint"${(showHint && !revealed) ? '' : ' hidden'}>
                <span class="word-card__hint-label">Hint</span> ${esc(card ? card.artist : '')}
              </div>
              <div class="word-card__answer" id="answer-block" aria-live="polite"${revealed ? '' : ' hidden'}>
                <div class="word-card__answer-label">Answer</div>
                <div class="word-card__answer-text">${esc(card ? card.answer : '')}</div>
                ${credit ? `<div class="word-card__credit">${esc(credit)}</div>` : ''}
              </div>
            </div>
            <div class="word-card__foot">
              <span id="foot-hint">${revealed ? 'Did they get it?' : 'Shout the missing part'}</span>
              <span>●</span>
            </div>
          </div>
        </div>

        <div class="actions" id="actions">
          ${revealed ? '' : '<button class="action-btn action-btn--reveal" data-reveal style="grid-column:1/-1;">👁 Reveal answer</button>'}
          <button class="action-btn action-btn--success" data-got ${revealed ? '' : 'disabled'}>✓ Got it!</button>
          <button class="action-btn action-btn--skip" data-skip ${(!revealed || skipDisabled) ? 'disabled' : ''}>${skipLabel}</button>
        </div>
      </div>
    </div>`;

  const cardEl = el.querySelector('#word-card');
  const answerBlock = el.querySelector('#answer-block');
  const artistHintEl = el.querySelector('#artist-hint');
  const footHint = el.querySelector('#foot-hint');
  const gotBtn = el.querySelector('[data-got]');
  const skipBtn = el.querySelector('[data-skip]');
  const revealBtn = el.querySelector('[data-reveal]');

  // Reveal: flip the card in place (no re-render, so the answer can fade in),
  // unlock scoring, then persist so a refresh mid-reveal resumes revealed.
  const doReveal = () => {
    if (revealed || !card) return;
    revealed = true;
    sound.play('chime');
    haptics.tap();
    if (artistHintEl) artistHintEl.hidden = true; // the full credit shows below now
    answerBlock.hidden = false;
    anim.revealAnswer(answerBlock);
    footHint.textContent = 'Did they get it?';
    revealBtn?.remove();
    gotBtn.disabled = false;
    if (!skipDisabled) skipBtn.disabled = false;
    gotBtn.focus(); // keyboard: move focus off the removed Reveal button to the primary action
    ctx.actions.reveal();
  };

  // The two scoring outcomes — used by both the buttons and the swipe gestures.
  // Each animates the outgoing card (cosmetic), then advances the game.
  const doGot = () => {
    if (!revealed) return;
    sound.play('ding');
    haptics.tap();
    anim.flyToPile(cardEl, el.querySelector('#score-pill'));
    ctx.actions.gotIt();
  };
  const doSkip = () => {
    if (!revealed || skipDisabled) return;
    anim.skipAway(cardEl);
    ctx.actions.skip();
  };

  revealBtn?.addEventListener('click', doReveal);
  gotBtn.addEventListener('click', doGot);
  skipBtn.addEventListener('click', doSkip);
  el.querySelector('[data-end]').addEventListener('click', () => ctx.actions.endGameConfirm());

  // Swipe: before reveal, a decisive swipe (either way) flips the card. After
  // reveal, right = Got it, left = Skip (alongside the buttons).
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
    if (!revealed) {
      if (Math.abs(dx) > THRESHOLD) doReveal();
      snapBack();
      return;
    }
    if (dx > THRESHOLD) doGot();
    else if (dx < -THRESHOLD) { skipDisabled ? snapBack() : doSkip(); }
    else snapBack();
  };
  cardEl.addEventListener('pointerup', endDrag);
  cardEl.addEventListener('pointercancel', endDrag);
}
