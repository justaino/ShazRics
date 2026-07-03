// preferences.js — persistent user PREFERENCES, separate from a game's state so
// they survive "New game". Holds the global sound/haptics toggles and the
// defaults that seed a new game's setup.
const KEY = 'shazrics:prefs';

export const preferences = {
  // Defaults used to seed the setup draft for a new game.
  defaultTimerSeconds: 60,
  defaultSkipRule: 'free',
  defaultWinCondition: 'open',
  defaultWinTarget: 5,
  defaultWordbankId: 'naija-lyrics-sample',
  // Global toggles.
  soundEnabled: true,
  hapticsEnabled: true,
  theme: 'system', // 'system' | 'light' | 'dark'
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(preferences, JSON.parse(raw));
  } catch (err) {
    console.warn('[prefs] could not load', err);
  }
}

export function savePrefs() {
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
  } catch (err) {
    console.warn('[prefs] could not save', err);
  }
}
