// theme.js — theming. The default follows the OS ('system'); the user can pick
// any bundled theme in Settings, or use the topbar button as a quick light/dark
// toggle. The choice is a theme id (or 'system') persisted in preferences.theme
// and applied via data-theme on <html>; the actual colours live in the token
// blocks in css/base.css (light default), css/dark.css and css/themes.css.
import { preferences, savePrefs } from './preferences.js';

const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

// The bundled themes, in picker order. `kind` decides the topbar icon and the
// 'system' mapping. Keep the ids in sync with the boot script in index.html and
// the [data-theme] blocks in the stylesheets. 'system' is offered separately as
// "Match device" — it isn't a theme id, it resolves to a light/dark default.
// `swatch` = the representative colours the Settings picker paints each tile
// with: { bg (surface), plum (primary), gold, ink (label) }.
export const THEMES = [
  { id: 'light',   name: 'Plum & Cream',      kind: 'light', swatch: { bg: '#F0E8DC', plum: '#6D4C7D', gold: '#C6A15B', ink: '#2C2430' } },
  { id: 'dark',    name: 'Midnight & Gold',   kind: 'dark',  swatch: { bg: '#221C31', plum: '#8F72AB', gold: '#C9A24E', ink: '#F1EADD' } },
  { id: 'neon',    name: 'Midnight Neon',     kind: 'dark',  swatch: { bg: '#0E0B1A', plum: '#FF2BD6', gold: '#3AA0FF', ink: '#EAF0FF' } },
  { id: 'emerald', name: 'Emerald & Cream',   kind: 'light', swatch: { bg: '#EEE8DA', plum: '#2E6B4E', gold: '#C6A15B', ink: '#1E2A24' } },
  { id: 'teal',    name: 'Teal & Sand',       kind: 'light', swatch: { bg: '#EFE7D7', plum: '#1E7A8C', gold: '#E0A34F', ink: '#1D2A2E' } },
  { id: 'sunset',  name: 'Sunset Terracotta', kind: 'light', swatch: { bg: '#F2E7D8', plum: '#C05A38', gold: '#E3A93C', ink: '#2E201A' } },
  { id: 'cobalt',  name: 'Cobalt & Cream',    kind: 'light', swatch: { bg: '#EDE7D9', plum: '#34558B', gold: '#D2A24C', ink: '#1E2733' } },
];

// 'system' maps to these light/dark defaults. Midnight Neon is the app default,
// so the dark side (and an unset preference) resolves to it. They're also the
// fallbacks for the "last used light/dark theme" the toggle restores.
const SYSTEM_LIGHT = 'light';
const SYSTEM_DARK = 'neon';

function isKnownId(id) {
  return THEMES.some((t) => t.id === id);
}

// 'light' | 'dark' for a concrete theme id (defaults to dark for anything odd).
function kindOf(id) {
  const t = THEMES.find((x) => x.id === id);
  return t ? t.kind : 'dark';
}

// Record the theme that's active right now into its matching light/dark slot, so
// the topbar toggle can flip back to whichever palette of the other kind the user
// last used (e.g. Emerald ↔ Neon). Leaves the opposite slot untouched.
function remember() {
  const r = resolved();
  if (kindOf(r) === 'light') preferences.lastLightTheme = r;
  else preferences.lastDarkTheme = r;
  savePrefs();
}

// The concrete theme id applied to <html> right now (never 'system').
export function resolved() {
  const t = preferences.theme || 'system';
  if (t === 'system') return mq && mq.matches ? SYSTEM_DARK : SYSTEM_LIGHT;
  return isKnownId(t) ? t : SYSTEM_DARK;
}

// True when the resolved theme is a dark one (drives the topbar sun/moon icon).
export function isDark() {
  const th = THEMES.find((t) => t.id === resolved());
  return th ? th.kind === 'dark' : false;
}

export function apply() {
  document.documentElement.setAttribute('data-theme', resolved());
  syncMetaThemeColor();
  remember(); // whatever we just applied is now the last-used theme of its kind
}

// Keep the browser chrome / status-bar colour in step with the active theme by
// reading its resolved --cream-deep (the page background) off the root.
function syncMetaThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--cream-deep').trim();
  if (bg) meta.setAttribute('content', bg);
}

// Pick a specific theme id (or 'system'); persist + apply instantly. apply()
// remembers it as the last-used theme of its kind (so the toggle returns to it).
export function setTheme(id) {
  preferences.theme = id;
  savePrefs();
  apply();
}

// Topbar button: a quick light↔dark flip. It restores whichever theme of the
// OTHER kind was last active — Emerald ↔ Neon, Cobalt ↔ Midnight & Gold, etc. —
// falling back to the light/dark defaults. Always available (never hidden).
export function toggle() {
  preferences.theme = isDark()
    ? (preferences.lastLightTheme || SYSTEM_LIGHT)
    : (preferences.lastDarkTheme || SYSTEM_DARK);
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
