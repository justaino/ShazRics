// state.js — the single source of truth for ShazRics.
// Holds the gameState shape, localStorage persistence, and a few shared
// constants. Game LOGIC lives in game.js / deck.js / timer.js — this file is
// just the data + how it is saved/loaded.

const STORAGE_KEY = 'shazrics:state';

// Team colours, handed out in order as teams are added at setup. Drawn from the
// plum/cream palette so the scoreboard stays cohesive.
export const TEAM_COLORS = [
  '#6D4C7D', // plum (brand)
  '#A67BA0', // mauve
  '#C6A15B', // gold
  '#5E8B87', // dusty teal
  '#C57B57', // terracotta
  '#6B7A99', // slate
];

export const MIN_TEAMS = 2;
export const MAX_TEAMS = TEAM_COLORS.length;

// Default settings for a brand-new game / setup draft.
export function defaultSettings() {
  return {
    timerSeconds: 60,                  // 30 | 60 | 90
    skipRule: 'free',                  // 'free' | 'limited' | 'penalty'
    winCondition: 'open',              // 'open' | 'firstToN' | 'fixedRounds'
    winTarget: 5,                      // score (firstToN) or rounds (fixedRounds)
    wordbankId: 'naija-lyrics-v2', // global sound/haptics live in preferences.js
  };
}

// A pristine game object. `status` drives whether a saved game can be resumed.
export function freshState() {
  return {
    // 'home' | 'setup' | 'preturn' | 'play' | 'turnsummary' | 'scoreboard' | 'end'
    phase: 'home',
    status: 'idle',              // 'idle' | 'playing' | 'ended'

    settings: defaultSettings(),

    // Each team: { id, name, color, score, wonCards: [card] }
    teams: [],

    deck: [],                    // remaining draw pile: [{id,prompt,answer,artist,song,era,difficulty}]
    discard: [],                 // skipped cards, reshuffled when the deck runs dry
    currentCard: null,           // the card showing during play

    currentTeamIndex: 0,
    round: 1,                    // 1-based; a round = every team has played once
    turnsTaken: 0,

    turn: {
      startedAt: null,           // Date.now() when the turn began
      endsAt: null,              // startedAt + timerSeconds*1000 (timer source of truth)
      wonCards: [],              // cards won THIS turn
      skippedCards: [],          // cards skipped THIS turn
      skipsUsed: 0,
      revealed: false,           // has the current card's answer been revealed?
    },

    startedAt: null,
    updatedAt: null,
  };
}

// The live object every module imports and renders from.
export const gameState = freshState();

// Reset the live object back to a pristine home state (used by "New game").
export function resetState() {
  Object.assign(gameState, freshState());
}

// Hydrate gameState from localStorage. Mutates in place so imported refs hold.
// Returns true if something was loaded.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    Object.assign(gameState, freshState(), JSON.parse(raw));
    return true;
  } catch (err) {
    console.warn('[state] could not load saved game', err);
    return false;
  }
}

// Persist the whole gameState. Call on every state change.
export function saveState() {
  try {
    gameState.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    return true;
  } catch (err) {
    console.warn('[state] could not save game', err);
    return false;
  }
}

// True if there's a resumable game on disk (powers Home "Continue game").
export function hasResumableGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    return saved.status === 'playing' && Array.isArray(saved.teams) && saved.teams.length >= MIN_TEAMS;
  } catch {
    return false;
  }
}

// Wipe the persisted game.
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[state] could not clear saved game', err);
  }
}
