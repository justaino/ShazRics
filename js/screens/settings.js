// settings.js — global preferences: sound/haptics toggles, the defaults that
// seed a new game, and custom word-bank management. Edits persist immediately.
import { preferences, savePrefs } from '../preferences.js';
import { availableBanks, customBanks, getCustomBank, addCustomBank, updateCustomBank, deleteCustomBank, parseLyrics, cardsToText, LYRIC_DELIM } from '../banks.js';
import * as sound from '../sound.js';
import * as theme from '../theme.js';
import { esc } from '../util.js';

// One tappable theme tile, painted in its own palette's colours.
function themeSwatch(t, selected) {
  const s = t.swatch;
  return `
    <button class="theme-swatch${selected ? ' is-selected' : ''}" data-theme-id="${t.id}"
      style="background:${s.bg}; color:${s.ink};" aria-pressed="${selected}" aria-label="${esc(t.name)} theme">
      <span class="theme-swatch__check" aria-hidden="true">✓</span>
      <span class="theme-swatch__dots">
        <span class="theme-swatch__dot" style="background:${s.plum};"></span>
        <span class="theme-swatch__dot" style="background:${s.gold};"></span>
      </span>
      <span class="theme-swatch__name">${esc(t.name)}</span>
    </button>`;
}

// Which custom bank (if any) is currently being edited. Module-level so it
// survives the re-renders triggered by other setting changes. Reset on
// save / cancel / delete-of-edited / leaving Settings.
let editingId = null;

export function render(el, ctx) {
  const rerender = () => render(el, ctx);
  const p = preferences;
  // The bank under edit (null when adding). Drop a stale id if it was deleted.
  const editing = editingId ? getCustomBank(editingId) : null;
  if (editingId && !editing) editingId = null;
  const seg = (a) => (a ? ' class="active"' : '');
  const showStepper = p.defaultWinCondition !== 'open';
  const stepperLabel = p.defaultWinCondition === 'fixedRounds' ? 'Rounds to play' : 'Score to win';
  const banks = availableBanks();
  const custom = customBanks();

  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="screen__header">
        <div>
          <h2 class="screen__title">Settings</h2>
        </div>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Sound &amp; haptics</div>
        <div class="setting-row">
          <span>Sound</span>
          <div class="segmented segmented--2">
            <button data-sound="on"${seg(p.soundEnabled)}>On</button>
            <button data-sound="off"${seg(!p.soundEnabled)}>Off</button>
          </div>
        </div>
        <div class="setting-row">
          <span>Haptics</span>
          <div class="segmented segmented--2">
            <button data-haptics="on"${seg(p.hapticsEnabled)}>On</button>
            <button data-haptics="off"${seg(!p.hapticsEnabled)}>Off</button>
          </div>
        </div>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Theme</div>
        <div class="theme-grid">
          <button class="theme-swatch theme-swatch--system${p.theme === 'system' ? ' is-selected' : ''}" data-theme-id="system" aria-pressed="${p.theme === 'system'}" aria-label="Match device theme">
            <span class="theme-swatch__check" aria-hidden="true">✓</span>
            <span class="theme-swatch__name">Match device</span>
          </button>
          ${theme.THEMES.map((t) => themeSwatch(t, p.theme === t.id)).join('')}
        </div>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Game defaults</div>
        <div class="screen__copy" style="font-size:0.86rem; margin-bottom:8px;">These pre-fill a new game's setup.</div>
        <div class="segmented segmented--3" style="margin-bottom:10px;">
          <button data-timer="30"${seg(p.defaultTimerSeconds === 30)}>30s</button>
          <button data-timer="60"${seg(p.defaultTimerSeconds === 60)}>60s</button>
          <button data-timer="90"${seg(p.defaultTimerSeconds === 90)}>90s</button>
        </div>
        <div class="segmented segmented--3" style="margin-bottom:10px;">
          <button data-skip="free"${seg(p.defaultSkipRule === 'free')}>Free</button>
          <button data-skip="limited"${seg(p.defaultSkipRule === 'limited')}>Limited</button>
          <button data-skip="penalty"${seg(p.defaultSkipRule === 'penalty')}>Penalty</button>
        </div>
        <div class="segmented segmented--3">
          <button data-win="open"${seg(p.defaultWinCondition === 'open')}>Open-ended</button>
          <button data-win="firstToN"${seg(p.defaultWinCondition === 'firstToN')}>First to score</button>
          <button data-win="fixedRounds"${seg(p.defaultWinCondition === 'fixedRounds')}>Fixed rounds</button>
        </div>
        ${showStepper ? `
        <div class="screen__copy" style="margin-top:8px; font-size:0.86rem;">${stepperLabel}</div>
        <div class="stepper">
          <button data-step="-1">−</button>
          <input type="number" value="${p.defaultWinTarget}" min="1" max="99" data-target />
          <button data-step="1">+</button>
        </div>` : ''}
        <div class="screen__copy" style="margin:10px 0 6px; font-size:0.86rem;">Default word bank</div>
        <select class="bank-select" data-defbank aria-label="Default word bank">
          ${banks.map((b) => `<option value="${b.id}"${b.id === p.defaultWordbankId ? ' selected' : ''}>${esc(b.name)}${b.custom ? ' (custom)' : ''}</option>`).join('')}
        </select>
        <div class="setting-row" style="margin-top:12px;">
          <span>Artist hint <span style="color:var(--muted); font-weight:600;">(show artist before Reveal)</span></span>
          <div class="segmented segmented--2">
            <button data-arthint="on"${seg(p.defaultArtistHint)}>On</button>
            <button data-arthint="off"${seg(!p.defaultArtistHint)}>Off</button>
          </div>
        </div>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:10px;">Word banks</div>
        ${custom.length ? custom.map((b) => `
          <div class="setting-row">
            <span>${esc(b.name)} · ${b.cards.length} cards</span>
            <div class="bank-actions">
              <button class="icon-btn" data-editbank="${b.id}" aria-label="Edit ${esc(b.name)}">✎</button>
              <button class="icon-btn" data-delbank="${b.id}" data-delname="${esc(b.name)}" aria-label="Delete ${esc(b.name)}">×</button>
            </div>
          </div>`).join('') : '<div class="screen__copy" style="font-size:0.86rem;">No custom banks yet.</div>'}
        <div style="margin-top:10px;">
          ${editing ? `<div class="screen__copy" style="font-size:0.86rem; margin-bottom:6px;">Editing <strong>${esc(editing.name)}</strong></div>` : ''}
          <input class="field" data-bankname placeholder="New bank name" aria-label="Bank name" value="${editing ? esc(editing.name) : ''}" />
          <div class="screen__copy" style="font-size:0.82rem; margin:0 0 6px;">
            One lyric per line: <strong>prompt ${esc(LYRIC_DELIM)} answer ${esc(LYRIC_DELIM)} artist ${esc(LYRIC_DELIM)} song</strong>.
            Artist and song are optional. Put a visible blank in the prompt.<br>
            e.g. <code>Only you fi ______ ${esc(LYRIC_DELIM)} hold my body ${esc(LYRIC_DELIM)} Wizkid ${esc(LYRIC_DELIM)} Essence</code>
          </div>
          <textarea class="field" data-bankwords rows="5" placeholder="Only you fi ______ ${esc(LYRIC_DELIM)} hold my body ${esc(LYRIC_DELIM)} Wizkid ${esc(LYRIC_DELIM)} Essence" aria-label="Lyric rows, one per line">${editing ? esc(cardsToText(editing.cards)) : ''}</textarea>
          <div class="lyric-preview" data-bankpreview hidden></div>
          ${editing ? `
          <div class="button-stack" style="margin-top:0;">
            <button class="btn btn--ghost" data-addbank style="min-height:44px;">Save changes</button>
            <button class="btn btn--secondary" data-canceledit style="min-height:44px;">Cancel</button>
          </div>` : '<button class="btn btn--ghost" data-addbank style="min-height:44px;">+ Add lyric bank</button>'}
          <div class="screen__copy" data-bankerr style="font-size:0.82rem; color:var(--color-coral); margin-top:6px; display:none;"></div>
        </div>
      </div>

      <div class="button-stack" style="margin-top:8px;">
        <button class="btn btn--secondary" data-back>Back</button>
      </div>
    </div>`;

  const set = (fn) => { fn(); savePrefs(); rerender(); };

  el.querySelectorAll('[data-sound]').forEach((b) => b.addEventListener('click', () => set(() => {
    p.soundEnabled = b.dataset.sound === 'on'; sound.refreshMute(); ctx.actions.syncMute();
  })));
  el.querySelectorAll('[data-haptics]').forEach((b) => b.addEventListener('click', () => set(() => {
    p.hapticsEnabled = b.dataset.haptics === 'on';
  })));

  // Theme picker: apply instantly (no flash), persist, sync the topbar icon,
  // then re-render so the selected tile updates.
  el.querySelectorAll('[data-theme-id]').forEach((b) => b.addEventListener('click', () => {
    theme.setTheme(b.dataset.themeId);
    ctx.actions.syncTheme?.();
    rerender();
  }));
  el.querySelectorAll('[data-timer]').forEach((b) => b.addEventListener('click', () => set(() => { p.defaultTimerSeconds = Number(b.dataset.timer); })));
  el.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => set(() => { p.defaultSkipRule = b.dataset.skip; })));
  el.querySelectorAll('[data-win]').forEach((b) => b.addEventListener('click', () => set(() => { p.defaultWinCondition = b.dataset.win; })));
  el.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => set(() => {
    p.defaultWinTarget = Math.min(99, Math.max(1, p.defaultWinTarget + Number(b.dataset.step)));
  })));
  el.querySelector('[data-target]')?.addEventListener('change', (e) => set(() => {
    p.defaultWinTarget = Math.min(99, Math.max(1, Number(e.target.value) || 1));
  }));
  el.querySelector('[data-defbank]')?.addEventListener('change', (e) => { p.defaultWordbankId = e.target.value; savePrefs(); });
  el.querySelectorAll('[data-arthint]').forEach((b) => b.addEventListener('click', () => set(() => { p.defaultArtistHint = b.dataset.arthint === 'on'; })));

  el.querySelectorAll('[data-editbank]').forEach((b) => b.addEventListener('click', () => {
    editingId = b.dataset.editbank;
    rerender();
  }));

  el.querySelector('[data-canceledit]')?.addEventListener('click', () => {
    editingId = null;
    rerender();
  });

  // Live preview + inline error: re-parse on each keystroke without a full
  // re-render (that would drop textarea focus). Shows the first valid card as
  // it will play, and the first malformed-row error as the user types.
  const wordsField = el.querySelector('[data-bankwords]');
  const preview = el.querySelector('[data-bankpreview]');
  const err = el.querySelector('[data-bankerr]');
  const refreshPreview = () => {
    const { entries, errors } = parseLyrics(wordsField.value);
    if (errors.length) {
      showErr(err, errors[0].message + (errors.length > 1 ? ` (+${errors.length - 1} more)` : ''));
    } else {
      hideErr(err);
    }
    if (entries.length) {
      preview.innerHTML = previewHtml(entries[0]);
      preview.hidden = false;
    } else {
      preview.hidden = true;
    }
  };
  wordsField?.addEventListener('input', refreshPreview);
  refreshPreview();

  el.querySelector('[data-addbank]')?.addEventListener('click', () => {
    const name = el.querySelector('[data-bankname]').value.trim();
    const { entries, errors } = parseLyrics(wordsField.value);
    if (!name) return showErr(err, 'Give the bank a name.');
    if (errors.length) return showErr(err, errors[0].message + (errors.length > 1 ? ` (+${errors.length - 1} more)` : ''));
    if (entries.length < 1) return showErr(err, `Add at least one lyric row (prompt ${LYRIC_DELIM} answer).`);
    if (editingId) {
      updateCustomBank(editingId, name, entries);
      editingId = null;
    } else {
      addCustomBank(name, entries);
    }
    rerender();
  });

  el.querySelectorAll('[data-delbank]').forEach((b) => b.addEventListener('click', () => {
    if (!window.confirm(`Delete the "${b.dataset.delname}" word bank? This can't be undone.`)) return;
    deleteCustomBank(b.dataset.delbank);
    if (editingId === b.dataset.delbank) editingId = null;
    if (p.defaultWordbankId === b.dataset.delbank) { p.defaultWordbankId = 'naija-lyrics-bank-popular'; savePrefs(); }
    rerender();
  }));

  el.querySelector('[data-back]').addEventListener('click', () => { editingId = null; ctx.actions.goHome(); });
}

function showErr(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideErr(el) {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

// Render the first parsed entry the way it plays: the prompt with its blank,
// then the revealed answer and the "artist — song" credit.
function previewHtml(e) {
  const credit = [e.artist, e.song].filter(Boolean).join(' — ');
  return `
    <div class="lyric-preview__label">Card preview</div>
    <div class="lyric-preview__prompt">${esc(e.prompt)}</div>
    <div class="lyric-preview__answer">
      <span class="lyric-preview__answer-label">Answer</span>
      <span class="lyric-preview__answer-text">${esc(e.answer)}</span>
      ${credit ? `<span class="lyric-preview__credit">${esc(credit)}</span>` : ''}
    </div>`;
}
