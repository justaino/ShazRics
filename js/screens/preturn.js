// preturn.js — the "pass the phone" handoff. Shows the active team;
// "Start" begins the turn.
import { currentTeam } from '../game.js';
import { esc } from '../util.js';

export function render(el, ctx) {
  const team = currentTeam();
  const { round } = ctx.state;
  const name = team ? team.name : 'Team';

  el.innerHTML = `
    <div class="card" style="background: linear-gradient(135deg, var(--plum) 0%, var(--plum-deep) 100%); color: var(--color-white);">
      <div class="texture" aria-hidden="true"></div>
      <div class="turn-card">
        <h2 class="turn-card__title">${esc(name)}'s turn</h2>
        <p class="turn-card__subtitle">Round ${round} · pass the phone to your team</p>
        <p class="rule-line">Read the lyric, shout the missing part, then reveal to check. Keep it loud and keep the next team from peeking.</p>
        <button class="btn start-btn" data-start>Start</button>
      </div>
    </div>`;

  el.querySelector('[data-start]').addEventListener('click', () => ctx.actions.startTurn());
}
