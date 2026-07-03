// app.js — the controller. Owns rendering (state -> the right screen), the
// action handlers screens call, the play-screen timer lifecycle, and boot /
// resume. All navigation flows through gameState.phase; no hardcoded indices.

import { gameState, loadState, saveState, resetState, clearState, MIN_TEAMS } from './state.js';
import { loadPrefs } from './preferences.js';
import { loadWordbank } from './data/wordbank-loader.js';
import * as game from './game.js';
import * as timer from './timer.js';
import * as sound from './sound.js';
import * as theme from './theme.js';
import * as install from './install.js';

import * as home from './screens/home.js';
import * as setup from './screens/setup.js';
import * as preturn from './screens/preturn.js';
import * as play from './screens/play.js';
import * as summary from './screens/summary.js';
import * as scoreboard from './screens/scoreboard.js';
import * as reveal from './screens/reveal.js';
import * as settings from './screens/settings.js';
import * as howto from './screens/howto.js';
import * as banksBrowser from './screens/banks-browser.js';

// phase -> screen element id, topbar title, and the module that renders it.
// The seven `core` screens are the numbered game flow; `aux` screens (settings,
// how-to) are reachable from Home but not part of the 1..7 progression.
const SCREENS = [
  { phase: 'home',        id: 'home-screen',       title: 'Home',           mod: home },
  { phase: 'setup',       id: 'setup-screen',      title: 'Setup',          mod: setup },
  { phase: 'preturn',     id: 'turn-screen',       title: 'Pass the phone', mod: preturn },
  { phase: 'play',        id: 'play-screen',       title: 'Play',           mod: play },
  { phase: 'turnsummary', id: 'summary-screen',    title: 'Turn summary',   mod: summary },
  { phase: 'scoreboard',  id: 'scoreboard-screen', title: 'Scoreboard',     mod: scoreboard },
  { phase: 'end',         id: 'reveal-screen',     title: 'Reveal',         mod: reveal },
  { phase: 'settings',    id: 'settings-screen',   title: 'Settings',       mod: settings, aux: true },
  { phase: 'howto',       id: 'howto-screen',      title: 'How to play',    mod: howto,    aux: true },
  { phase: 'banks',       id: 'banks-screen',      title: 'Word banks',     mod: banksBrowser, aux: true },
];
const CORE = SCREENS.filter((s) => !s.aux);

const stepPill = document.getElementById('step-pill');
const muteBtn = document.getElementById('mute-btn');
const themeBtn = document.getElementById('theme-btn');

function updateMuteButton() {
  if (!muteBtn) return;
  const muted = sound.isMuted();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-pressed', String(muted));
  muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
}

function updateThemeButton() {
  if (!themeBtn) return;
  const dark = theme.isDark();
  themeBtn.textContent = dark ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

// Where to resume when the user taps "Continue game" on Home.
let resumePhase = null;

const ctx = { state: gameState, actions: {} };

// Fired when the turn clock hits zero.
function onExpire() {
  game.endTurn();
  render();
}

// Render whatever gameState.phase says, then reconcile the timer.
function render() {
  let idx = SCREENS.findIndex((s) => s.phase === gameState.phase);
  if (idx === -1) idx = 0;
  const active = SCREENS[idx];

  SCREENS.forEach((s) => {
    const el = document.getElementById(s.id);
    if (!el) return;
    const isActive = s.phase === active.phase;
    el.classList.toggle('is-visible', isActive);
    if (isActive) s.mod.render(el, ctx);
    else el.innerHTML = ''; // drop inactive listeners
  });

  if (stepPill) {
    if (active.aux) {
      stepPill.textContent = active.title;
    } else {
      const n = CORE.findIndex((s) => s.phase === active.phase) + 1;
      stepPill.textContent = `${n} / ${CORE.length} ${active.title}`;
    }
  }

  // The timer only runs on the play screen; its source of truth is turn.endsAt.
  if (active.phase === 'play' && gameState.turn.endsAt) {
    timer.ensureRunning(gameState.turn.endsAt, gameState.settings.timerSeconds, onExpire);
  } else {
    timer.stop();
  }
}

// --- Actions screens call ---------------------------------------------------

ctx.actions = {
  openSetup(prefill) {
    setup.prepare(prefill);
    gameState.phase = 'setup'; // not persisted: a half-built setup shouldn't clobber a resumable game
    render();
  },

  async startGame(draft) {
    // Load the chosen word bank so the deck is built from it (not the boot one).
    try {
      const cards = await loadWordbank(draft.settings.wordbankId);
      game.setCards(cards);
    } catch (err) {
      console.error('[app] could not load chosen bank, using current cards', err);
    }
    game.startGame(draft); // -> phase 'preturn', status 'playing'
    render();
  },

  startTurn() {
    game.startTurn(); // -> phase 'play', sets turn.endsAt
    render();         // render starts the timer
  },

  gotIt() {
    game.gotIt();
    render();
  },

  skip() {
    game.skip();
    render();
  },

  nextTeam() {
    game.nextTeam(); // -> 'preturn', or 'end' if a win condition is met
    render();
  },

  viewScoreboard() {
    gameState.phase = 'scoreboard';
    saveState();
    render();
  },

  backToSummary() {
    gameState.phase = 'turnsummary';
    saveState();
    render();
  },

  endGameConfirm() {
    if (!window.confirm('End the game now and reveal the winner?')) return;
    timer.stop();
    game.endGame(); // -> phase 'end', status 'ended'
    render();
  },

  continueGame() {
    gameState.phase = resumePhase || 'preturn';
    // If the saved turn's clock already ran out while away, go to the summary.
    if (gameState.phase === 'play' && (!gameState.turn.endsAt || gameState.turn.endsAt <= Date.now())) {
      game.endTurn();
    }
    saveState();
    render();
  },

  playAgain() {
    // Same teams + settings, fresh scores/deck.
    setup.prepare({
      teams: gameState.teams.map((t) => ({ name: t.name, color: t.color })),
      settings: { ...gameState.settings },
    });
    gameState.phase = 'setup';
    render();
  },

  newGame() {
    timer.stop();
    clearState();
    resetState(); // back to a pristine home
    render();
  },

  // Aux screens (reachable from Home; don't touch game state).
  openSettings() { gameState.phase = 'settings'; render(); },
  openHowto() { gameState.phase = 'howto'; render(); },
  openBanks() { gameState.phase = 'banks'; render(); }, // hidden dev screen (5-tap on the logo)
  goHome() { gameState.phase = 'home'; render(); },

  // Let the Settings screen keep the topbar mute icon in sync.
  syncMute() { updateMuteButton(); },
};

// --- Boot -------------------------------------------------------------------

function checkLibraries() {
  const libs = {
    'GSAP':            window.gsap ? (window.gsap.version || 'loaded') : null,
    'GSAP Flip':       window.Flip ? (window.Flip.version || 'loaded') : null,
    'Howler.js':       window.Howl ? 'loaded' : null,
    'canvas-confetti': typeof window.confetti === 'function' ? 'loaded' : null,
  };
  Object.entries(libs).forEach(([name, version]) => {
    if (version) console.log(`[libs] ${name} ready (${version})`);
    else console.warn(`[libs] ${name} did NOT load`);
  });
  if (window.gsap && window.Flip) window.gsap.registerPlugin(window.Flip);
}

async function boot() {
  loadPrefs(); // global toggles + setup defaults
  loadState(); // hydrate gameState from disk (if any)
  checkLibraries();
  sound.initSound();

  // Topbar controls (wired once; outside the screens).
  theme.apply();
  if (muteBtn) {
    muteBtn.addEventListener('click', () => { sound.toggleMute(); updateMuteButton(); });
    updateMuteButton();
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => { theme.toggle(); updateThemeButton(); });
    updateThemeButton();
  }
  theme.initSystemListener(updateThemeButton);
  // The install prompt can arrive after first paint — refresh Home when it does.
  install.onAvailable(() => { if (gameState.phase === 'home') render(); });

  // Decide the landing screen from the loaded state (synchronously, so the
  // first paint is instant — Home/Setup/Reveal don't need the word bank).
  if (gameState.status === 'playing' && Array.isArray(gameState.teams) && gameState.teams.length >= MIN_TEAMS) {
    // Resumable: land on Home (which shows "Continue game") and remember where
    // to jump back to. State stays intact so Continue resumes exactly.
    resumePhase = gameState.phase;
    gameState.phase = 'home';
  } else if (gameState.status === 'ended') {
    gameState.phase = 'end'; // keep showing the reveal across a refresh
  } else {
    clearState();
    resetState(); // clean slate
  }

  render();

  // The deck is only needed once play starts (after user interaction), so load
  // the bank after the first paint.
  try {
    const cards = await loadWordbank(gameState.settings.wordbankId);
    game.setCards(cards);
    console.log(`[app] word bank ready: ${cards.length} cards`);
  } catch (err) {
    console.error('[app] word bank failed to load', err);
  }
}

boot();

// Register the service worker (PWA: installable + offline). Relative path so the
// scope matches whatever base the app is served from (incl. GitHub Pages).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((reg) => console.log('[sw] registered, scope:', reg.scope))
      .catch((err) => console.warn('[sw] registration failed', err));
  });
}
