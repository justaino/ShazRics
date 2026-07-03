// reveal.js — the end-game ranking, animated: podium rows stagger in, scores
// count up from zero, the winner gets a gold glow + crown + canvas-confetti.
// All motion degrades gracefully under prefers-reduced-motion (via anim.js).
import { rankedTeams } from '../game.js';
import { esc } from '../util.js';
import * as anim from '../anim.js';

const unit = (n) => (n === 1 ? 'point' : 'points');

export function render(el, ctx) {
  const ranked = rankedTeams();
  const top = ranked[0];
  const topScore = top ? top.score : 0;
  const tie = ranked.length > 1 && ranked[1].score === topScore;
  const title = !top ? 'Game over' : tie ? "It's a tie!" : `${top.name} wins!`;

  const podium = ranked.map((t) => {
    const winner = t.score === topScore;
    return `
      <div class="podium__team${winner ? ' podium__team--winner' : ''}">
        <div class="podium__name">${winner ? '<span class="crown">👑</span> ' : ''}<span class="swatch" style="background:${t.color}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>${esc(t.name)}</div>
        <div class="podium__pill"><span class="count" data-to="${t.score}">0</span>&nbsp;${unit(t.score)}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="card reveal-card">
      <div class="reveal-card__header">
        <div class="reveal-card__eyebrow">Celebration time</div>
        <h2 class="reveal-card__title">${esc(title)}</h2>
      </div>
      <div class="podium">${podium}</div>
      <div class="button-stack">
        <button class="btn btn--primary" data-again>Play again (same teams)</button>
        <button class="btn btn--secondary" data-new>New game</button>
      </div>
    </div>`;

  // Animate: podium in, numbers up, confetti for the winner.
  anim.revealPodium([...el.querySelectorAll('.podium__team')]);
  el.querySelectorAll('.count').forEach((c) => anim.countUp(c, Number(c.dataset.to)));
  anim.celebrate();

  el.querySelector('[data-again]').addEventListener('click', () => ctx.actions.playAgain());
  el.querySelector('[data-new]').addEventListener('click', () => ctx.actions.newGame());
}
