// summary.js — end-of-turn recap: cards won (and faded skipped) this turn plus
// the updated scoreboard. Under the "free" skip rule each card is tappable to
// flip won <-> skipped (correcting a mis-tap), which updates the score live.
// "Next team" advances; "Scoreboard" peeks the piles.
import { markCard } from '../game.js';
import { esc } from '../util.js';

export function render(el, ctx) {
  const { state } = ctx;
  const rerender = () => render(el, ctx);
  const editable = state.settings.skipRule === 'free';
  const team = state.teams[state.currentTeamIndex];

  // One indexable list so a tap maps back to its exact card object.
  const entries = [
    ...state.turn.wonCards.map((c) => ({ c, won: true })),
    ...state.turn.skippedCards.map((c) => ({ c, won: false })),
  ];

  const cards = entries.map((e, i) => {
    const cls = e.won ? 'mini-card' : 'mini-card mini-card--faded';
    const meta = e.won ? 'won' : 'skipped';
    const label = e.c.prompt || '';
    const inner = `<div><div class="mini-card__word">${esc(label)}</div></div><div class="mini-card__meta">${meta}</div>`;
    return editable
      ? `<button class="${cls}" data-entry="${i}" aria-label="${esc(label)}: ${meta}. Tap to change.">${inner}</button>`
      : `<div class="${cls}">${inner}</div>`;
  }).join('');

  const chips = state.teams.map((t, i) =>
    `<div class="team-chip${i === state.currentTeamIndex ? ' team-chip--active' : ''}">${esc(t.name)} · ${t.score}</div>`
  ).join('');

  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="summary-card">
        <div>
          <h2 class="screen__title">Time! ${esc(team ? team.name : 'Team')} got ${state.turn.wonCards.length}</h2>
        </div>
        <div class="screen__copy">${editable ? 'Cards this turn — tap one to switch won / skipped' : 'Cards this turn'}</div>
        <div class="summary-grid">
          ${cards || '<div class="screen__copy" style="grid-column:1/-1;">No cards this turn.</div>'}
        </div>
        <div>
          <div class="screen__copy" style="margin-bottom:8px;">Scoreboard</div>
          <div class="scoreboard-row">${chips}</div>
        </div>
        <div class="button-stack">
          <button class="btn btn--primary" data-next>Next team</button>
          <button class="btn btn--secondary" data-scoreboard>View scoreboard</button>
        </div>
      </div>
    </div>`;

  if (editable) {
    el.querySelectorAll('[data-entry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const e = entries[Number(btn.dataset.entry)];
        markCard(e.c, !e.won);
        rerender();
      });
    });
  }

  el.querySelector('[data-next]').addEventListener('click', () => ctx.actions.nextTeam());
  el.querySelector('[data-scoreboard]').addEventListener('click', () => ctx.actions.viewScoreboard());
}
