// scoreboard.js — every team's pile, built dynamically with JS-computed
// offsets (card-stack component) that compress + show "+N" past a threshold.
// Tap a pile to expand its word list. "End game" jumps to the reveal.
import { pileHTML } from '../components/card-stack.js';
import { esc } from '../util.js';

export function render(el, ctx) {
  const { state } = ctx;

  const columns = state.teams.map((t) => {
    const list = t.wonCards.map((c) => {
      return `<div class="expanded-panel__item"><span><span class="expanded-panel__word">${esc(c.prompt || '')}</span></span><span class="expanded-panel__plus">+1</span></div>`;
    }).join('') || '<div class="expanded-panel__item"><span>No cards yet</span><span></span></div>';

    return `
      <div class="team-column" data-toggle role="button" tabindex="0" aria-expanded="false" aria-label="${esc(t.name)} pile, ${t.score} cards — toggle word list">
        <div class="team-column__top">
          <div class="team-column__name"><span class="swatch" style="background:${t.color}; display:inline-block; vertical-align:middle; margin-right:6px;"></span>${esc(t.name)}</div>
          <div class="team-column__score">${t.score}</div>
        </div>
        <div class="pile-wrap">${pileHTML(t.wonCards, t.color)}</div>
        <div class="expanded-panel">${list}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="scoreboard-card">
        <div class="screen__header">
          <div>
            <div class="screen__eyebrow">Scoreboard</div>
            <h2 class="screen__title">Cards on the table</h2>
          </div>
          <div class="screen__copy">Tap a pile</div>
        </div>
        <div class="team-grid">${columns}</div>
        <div class="button-stack">
          <button class="btn btn--secondary" data-back>Back</button>
          <button class="btn btn--dark" data-end>End game</button>
        </div>
      </div>
    </div>`;

  el.querySelectorAll('[data-toggle]').forEach((col) => {
    const toggle = () => col.setAttribute('aria-expanded', String(col.classList.toggle('is-expanded')));
    col.addEventListener('click', toggle);
    col.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  el.querySelector('[data-back]').addEventListener('click', () => ctx.actions.backToSummary());
  el.querySelector('[data-end]').addEventListener('click', () => ctx.actions.endGameConfirm());
}
