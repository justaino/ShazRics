// theme.js — light/dark theming. Default follows the OS ('system'); the topbar
// toggle flips to an explicit 'light'/'dark'. Applied via data-theme on <html>;
// the actual colours live in css/dark.css (an additive override layer).
import { preferences, savePrefs } from './preferences.js';

const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

// The effective theme right now ('light' | 'dark').
export function resolved() {
  const t = preferences.theme || 'system';
  if (t === 'light' || t === 'dark') return t;
  return mq && mq.matches ? 'dark' : 'light';
}

export function isDark() {
  return resolved() === 'dark';
}

export function apply() {
  document.documentElement.setAttribute('data-theme', resolved());
}

// Flip to the opposite of what's showing now (becomes an explicit choice).
export function toggle() {
  preferences.theme = resolved() === 'dark' ? 'light' : 'dark';
  savePrefs();
  apply();
  return resolved();
}

// Keep following the OS while the preference is still 'system'.
export function initSystemListener(onChange) {
  mq?.addEventListener?.('change', () => {
    if ((preferences.theme || 'system') === 'system') {
      apply();
      onChange?.();
    }
  });
}
