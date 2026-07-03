// haptics.js — light vibration feedback on supported mobile devices. No-ops on
// desktop, when unsupported, or when the haptics preference is off.
import { preferences } from './preferences.js';

function buzz(pattern) {
  if (!preferences.hapticsEnabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

// Light tap — a correct guess.
export function tap() { buzz(12); }

// Stronger pattern — the end-of-turn buzzer.
export function buzzer() { buzz([0, 90, 50, 90]); }
