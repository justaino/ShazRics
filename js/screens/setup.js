// setup.js — the game setup form. Edits a local DRAFT (teams + settings) and
// only commits to gameState when "Start game" is pressed.
import { TEAM_COLORS, MIN_TEAMS, MAX_TEAMS, defaultSettings } from '../state.js';
import { preferences } from '../preferences.js';
import { availableBanks } from '../banks.js';
import { esc } from '../util.js';

let draft = null;

// Prepare the draft before showing setup. Pass { teams, settings } to prefill
// (used by "Play again — same teams"); otherwise sensible defaults.
export function prepare(prefill) {
  if (prefill && Array.isArray(prefill.teams) && prefill.teams.length) {
    draft = {
      settings: { ...defaultSettings(), ...(prefill.settings || {}) },
      teams: prefill.teams.map((t, i) => ({ name: t.name, color: t.color || TEAM_COLORS[i % MAX_TEAMS] })),
    };
  } else {
    // Seed from the user's saved defaults (Settings screen).
    draft = {
      settings: {
        ...defaultSettings(),
        timerSeconds: preferences.defaultTimerSeconds,
        skipRule: preferences.defaultSkipRule,
        winCondition: preferences.defaultWinCondition,
        winTarget: preferences.defaultWinTarget,
        wordbankId: preferences.defaultWordbankId,
        artistHint: preferences.defaultArtistHint,
      },
      teams: [
        { name: 'Team A', color: TEAM_COLORS[0] },
        { name: 'Team B', color: TEAM_COLORS[1] },
      ],
    };
  }
}

export function render(el, ctx) {
  if (!draft) prepare();
  const rerender = () => render(el, ctx);
  const s = draft.settings;

  const banks = availableBanks();
  if (!banks.some((b) => b.id === s.wordbankId)) s.wordbankId = banks[0]?.id || 'naija-lyrics-v2';

  const seg = (active) => (active ? ' class="active"' : '');
  const showStepper = s.winCondition !== 'open';
  const stepperLabel = s.winCondition === 'fixedRounds' ? 'Rounds to play' : 'Score to win';

  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="screen__header">
        <div>
          <div class="screen__eyebrow">Setup</div>
          <h2 class="screen__title">Game setup</h2>
        </div>
      </div>
      <div class="screen__copy">Shape the room, pick the pace, and launch.</div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Teams</div>
        ${draft.teams.map((t, i) => `
          <div class="team-row">
            <span class="swatch" style="background:${t.color};"></span>
            <input value="${esc(t.name)}" aria-label="Team ${i + 1} name" data-team="${i}" />
            <button class="icon-btn" data-remove="${i}" aria-label="Remove team ${i + 1}" ${draft.teams.length <= MIN_TEAMS ? 'disabled' : ''}>×</button>
          </div>`).join('')}
        ${draft.teams.length < MAX_TEAMS ? '<button class="btn btn--ghost" data-add style="min-height:44px; margin-top:6px;">+ Add team</button>' : ''}
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Word bank</div>
        <select class="bank-select" data-bank aria-label="Word bank">
          ${banks.map((b) => `<option value="${b.id}"${b.id === s.wordbankId ? ' selected' : ''}>${esc(b.name)}${b.custom ? ' (custom)' : ''}</option>`).join('')}
        </select>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Timer</div>
        <div class="segmented segmented--3">
          <button data-timer="30"${seg(s.timerSeconds === 30)}>30s</button>
          <button data-timer="60"${seg(s.timerSeconds === 60)}>60s</button>
          <button data-timer="90"${seg(s.timerSeconds === 90)}>90s</button>
        </div>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Skips</div>
        <div class="segmented segmented--3">
          <button data-skip="free"${seg(s.skipRule === 'free')}>Free</button>
          <button data-skip="limited"${seg(s.skipRule === 'limited')}>Limited</button>
          <button data-skip="penalty"${seg(s.skipRule === 'penalty')}>Penalty</button>
        </div>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Win condition</div>
        <div class="segmented segmented--3">
          <button data-win="open"${seg(s.winCondition === 'open')}>Open-ended</button>
          <button data-win="firstToN"${seg(s.winCondition === 'firstToN')}>First to score</button>
          <button data-win="fixedRounds"${seg(s.winCondition === 'fixedRounds')}>Fixed rounds</button>
        </div>
        ${showStepper ? `
        <div class="screen__copy" style="margin-top:8px; font-size:0.86rem;">${stepperLabel}</div>
        <div class="stepper">
          <button data-step="-1">−</button>
          <input type="number" value="${s.winTarget}" min="1" max="99" data-target />
          <button data-step="1">+</button>
        </div>` : ''}
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Artist hint</div>
        <div class="setting-row">
          <span>Show the artist before Reveal</span>
          <div class="segmented segmented--2">
            <button data-hint="on"${seg(s.artistHint)}>On</button>
            <button data-hint="off"${seg(!s.artistHint)}>Off</button>
          </div>
        </div>
        <div class="screen__copy" style="font-size:0.86rem;">Easier play for younger or mixed groups. Off by default.</div>
      </div>

      <div class="button-stack" style="margin-top:8px;">
        <button class="btn btn--primary" data-start>Start game</button>
        <button class="btn btn--secondary" data-back>Back</button>
      </div>
    </div>`;

  // Team name edits — update the draft WITHOUT re-rendering (keeps input focus).
  el.querySelectorAll('[data-team]').forEach((input) => {
    input.addEventListener('input', () => {
      draft.teams[Number(input.dataset.team)].name = input.value;
    });
  });

  el.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (draft.teams.length <= MIN_TEAMS) return;
      draft.teams.splice(Number(btn.dataset.remove), 1);
      rerender();
    });
  });

  el.querySelector('[data-add]')?.addEventListener('click', () => {
    if (draft.teams.length >= MAX_TEAMS) return;
    const used = draft.teams.map((t) => t.color);
    const color = TEAM_COLORS.find((c) => !used.includes(c)) || TEAM_COLORS[draft.teams.length % MAX_TEAMS];
    const letter = String.fromCharCode(65 + draft.teams.length); // A, B, C...
    draft.teams.push({ name: `Team ${letter}`, color });
    rerender();
  });

  el.querySelector('[data-bank]')?.addEventListener('change', (e) => {
    draft.settings.wordbankId = e.target.value;
  });

  el.querySelectorAll('[data-timer]').forEach((b) =>
    b.addEventListener('click', () => { draft.settings.timerSeconds = Number(b.dataset.timer); rerender(); }));

  el.querySelectorAll('[data-skip]').forEach((b) =>
    b.addEventListener('click', () => { draft.settings.skipRule = b.dataset.skip; rerender(); }));

  el.querySelectorAll('[data-win]').forEach((b) =>
    b.addEventListener('click', () => {
      draft.settings.winCondition = b.dataset.win;
      if (b.dataset.win === 'fixedRounds' && draft.settings.winTarget > 20) draft.settings.winTarget = 5;
      rerender();
    }));

  el.querySelectorAll('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const next = draft.settings.winTarget + Number(b.dataset.step);
      draft.settings.winTarget = Math.min(99, Math.max(1, next));
      rerender();
    }));

  el.querySelector('[data-target]')?.addEventListener('change', (e) => {
    const v = Math.min(99, Math.max(1, Number(e.target.value) || 1));
    draft.settings.winTarget = v;
    rerender();
  });

  el.querySelectorAll('[data-hint]').forEach((b) =>
    b.addEventListener('click', () => { draft.settings.artistHint = b.dataset.hint === 'on'; rerender(); }));

  // Back to Home — lets the player revisit Settings / How to play before starting.
  // The draft is module-level and uncommitted, so leaving doesn't touch gameState.
  el.querySelector('[data-back]').addEventListener('click', () => ctx.actions.goHome());

  el.querySelector('[data-start]').addEventListener('click', () => {
    // Tidy names; require at least MIN_TEAMS.
    draft.teams.forEach((t, i) => { t.name = (t.name || '').trim() || `Team ${String.fromCharCode(65 + i)}`; });
    if (draft.teams.length < MIN_TEAMS) return;
    ctx.actions.startGame({ settings: { ...draft.settings }, teams: draft.teams.map((t) => ({ ...t })) });
  });
}
