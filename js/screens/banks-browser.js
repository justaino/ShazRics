// banks-browser.js — a hidden, read-only catalogue of every word bank in the
// app (bundled + custom) with all their cards. Reached only via a 5-tap
// easter egg on the Home brand mark; it never touches game state.
import { availableBanks } from '../banks.js';
import { loadWordbank } from '../data/wordbank-loader.js';
import { esc } from '../util.js';

// Cached across re-entries so the bundled JSON isn't refetched every time.
// null = not loaded yet.
let cache = null;

export function render(el, ctx) {
  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="screen__header">
        <div>
          <div class="screen__eyebrow">Developer</div>
          <h2 class="screen__title">Word banks</h2>
        </div>
      </div>
      <div data-body>
        <p class="screen__copy">Loading banks…</p>
      </div>
      <div class="button-stack" style="margin-top:8px;">
        <button class="btn btn--secondary" data-back>Back</button>
      </div>
    </div>`;

  el.querySelector('[data-back]').addEventListener('click', () => ctx.actions.goHome());

  if (cache) {
    paint(el);
  } else {
    loadAll().then((data) => {
      cache = data;
      // The user may have left the screen while loading — only paint if it's
      // still mounted (app.js clears innerHTML of inactive screens).
      if (el.querySelector('[data-body]')) paint(el);
    });
  }
}

// Load every bank's cards. Custom banks resolve from localStorage; bundled ones
// are fetched. A bank that fails to load is kept with an empty list + error.
async function loadAll() {
  const banks = availableBanks();
  return Promise.all(banks.map(async (b) => {
    try {
      return { ...b, cards: await loadWordbank(b.id), error: null };
    } catch (err) {
      return { ...b, cards: [], error: String((err && err.message) || err) };
    }
  }));
}

function paint(el) {
  const body = el.querySelector('[data-body]');
  if (!body) return;
  const totalCards = cache.reduce((n, b) => n + b.cards.length, 0);

  body.innerHTML = `
    <p class="screen__copy" style="font-size:0.86rem;">${cache.length} banks · ${totalCards} cards total</p>
    <input class="field" data-filter placeholder="Filter words or hints…" aria-label="Filter cards" />
    <div class="bank-list">${cache.map(bankHtml).join('')}</div>`;

  const filter = body.querySelector('[data-filter]');
  filter.addEventListener('input', () => applyFilter(body, filter.value.trim().toLowerCase()));
}

function bankHtml(b) {
  const rows = b.error
    ? `<p class="screen__copy" style="font-size:0.85rem; color:var(--color-coral);">Failed to load: ${esc(b.error)}</p>`
    : b.cards.map(cardHtml).join('');
  return `
    <details class="bank-group" data-bank>
      <summary class="bank-group__summary">
        <span class="bank-group__name">${esc(b.name)}</span>
        <span class="tag">${b.custom ? 'Custom' : 'Bundled'}</span>
        <span class="bank-group__count" data-count>${b.cards.length}</span>
      </summary>
      <div class="bank-cards">${rows}</div>
    </details>`;
}

function cardHtml(c) {
  const credit = [c.artist, c.song].filter(Boolean).join(' — ');
  const meta = [credit, c.era, c.difficulty].filter(Boolean).join(' · ');
  const search = `${c.prompt || ''} ${c.answer || ''} ${credit}`.toLowerCase();
  return `
    <div class="bank-card" data-card data-search="${esc(search)}">
      <div class="bank-card__main">
        <span class="bank-card__word">${esc(c.prompt || '')}</span>
        ${c.answer ? `<span class="bank-card__hint">${esc(c.answer)}</span>` : ''}
      </div>
      <div class="bank-card__meta">${esc(meta)}</div>
    </div>`;
}

// In-place filter (keeps input focus). Hides non-matching cards, updates each
// bank's count, hides empty banks, and auto-opens banks with matches.
function applyFilter(body, q) {
  body.querySelectorAll('[data-bank]').forEach((group) => {
    const cards = group.querySelectorAll('[data-card]');
    let visible = 0;
    cards.forEach((row) => {
      const match = !q || row.dataset.search.includes(q);
      row.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    });
    const count = group.querySelector('[data-count]');
    if (count) count.textContent = q ? `${visible} / ${cards.length}` : String(cards.length);
    group.classList.toggle('is-empty', !!q && visible === 0);
    group.open = q ? visible > 0 : false;
  });
}
