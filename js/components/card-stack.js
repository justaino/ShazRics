// card-stack.js — renders a team's won-cards pile with JS-COMPUTED offsets and
// rotations (replacing the prototype's static .pile-card:nth-child rules, which
// capped at 6). Past a threshold the vertical step compresses and a "+N" chip
// shows the overflow, so a long pile never grows unusably tall.
import { esc } from '../util.js';

const VISIBLE = 8;     // most cards rendered before we compress + show "+N"
const BASE_STEP = 12;  // px between cards when uncompressed
const ROTS = [-3, 2, -2, 2, -2, 3, -2, 2]; // per-card tilt, cycled

// Translucent tint from a team's hex colour (any colour gets a pile that
// matches the prototype's green/gold/coral look).
export function tint(hex, alpha = 0.16) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// HTML for one team's pile (the inner contents of a .pile-wrap).
export function pileHTML(cards, color) {
  const total = cards.length;
  if (total === 0) return '<div class="pile-empty">No cards yet</div>';

  const shown = cards.slice(-VISIBLE);          // keep the most recent on top
  const hidden = total - shown.length;
  // Compress so the whole pile stays within ~ VISIBLE*BASE_STEP px tall.
  const step = total <= VISIBLE
    ? BASE_STEP
    : Math.max(5, Math.round((VISIBLE * BASE_STEP) / total));

  const piles = shown.map((c, i) => {
    const y = i * step;
    const rot = ROTS[i % ROTS.length];
    return `<div class="pile-card" style="background:${tint(color)}; transform: translateY(${y}px) rotate(${rot}deg); z-index:${i};"><span>${esc(c.prompt || '')}</span><span>✓</span></div>`;
  }).join('');

  const badge = hidden > 0 ? `<div class="pile-more">+${hidden}</div>` : '';
  return piles + badge;
}
