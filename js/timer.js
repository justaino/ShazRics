// timer.js — the turn countdown.
//
// SOURCE OF TRUTH is the `endsAt` timestamp (set from Date.now() at turn start),
// NOT a tick counter. The setInterval below only decides *when to re-read the
// clock*; the remaining time is always computed as endsAt - Date.now(), so
// backgrounding the tab can never make the clock drift.
//
// It also holds the Screen Wake Lock for the duration of a turn so the phone
// doesn't sleep mid-play.

import * as sound from './sound.js';
import * as haptics from './haptics.js';

const URGENT_MS = 10000; // last 10s: ring + word card go coral/urgent
const TICK_FROM = 5;     // play a tick each of the final 5 seconds

let intervalId = null;
let activeEndsAt = 0;
let durationMs = 0;
let onExpire = null;
let expired = false;
let wakeLock = null;
let lastSec = -1;        // last whole second announced (so tick fires once/sec)

// Start (or keep) the countdown for a turn ending at `endsAt`. If a countdown
// for the same endsAt is already running, this is a no-op — so re-rendering the
// play screen (on every Got it / Skip) doesn't restart the clock.
export function ensureRunning(endsAt, durationSeconds, expireCb) {
  if (intervalId && activeEndsAt === endsAt) {
    onExpire = expireCb; // keep callback fresh
    return;
  }
  stop();
  activeEndsAt = endsAt;
  durationMs = durationSeconds * 1000;
  onExpire = expireCb;
  expired = false;
  lastSec = -1;
  requestWakeLock();
  tick();
  intervalId = setInterval(tick, 200);
}

export function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  activeEndsAt = 0;
  releaseWakeLock();
}

// True once the current turn's clock has hit zero.
export function isExpired() {
  return expired;
}

// Format ms -> "M:SS".
export function format(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function tick() {
  const remaining = Math.max(0, activeEndsAt - Date.now());
  paint(remaining);

  // Tick once per second through the final stretch.
  const secs = Math.ceil(remaining / 1000);
  if (secs !== lastSec) {
    lastSec = secs;
    if (secs > 0 && secs <= TICK_FROM) sound.play('tick');
  }

  if (remaining <= 0 && !expired) {
    expired = true;
    sound.play('buzzer');
    haptics.buzzer();
    stop();
    if (onExpire) onExpire();
  }
}

// Update the conic-gradient ring + digits. Queries by id each tick so it keeps
// working even if the play screen DOM was re-rendered underneath us.
function paint(remaining) {
  const urgent = remaining <= URGENT_MS;
  const pct = durationMs ? (remaining / durationMs) * 100 : 0;

  const text = document.getElementById('timer-text');
  if (text) text.textContent = format(remaining);

  const ring = document.getElementById('timer-ring');
  if (ring) {
    const fill = urgent ? 'var(--color-coral)' : 'var(--color-primary)';
    const track = urgent ? 'rgba(197,123,87,0.16)' : 'rgba(109,76,125,0.16)';
    ring.style.background = `conic-gradient(${fill} 0 ${pct}%, ${track} 0 100%)`;
    ring.classList.toggle('timer--urgent', urgent);
  }

  const card = document.getElementById('word-card');
  if (card) card.classList.toggle('word-card--urgent', urgent);
}

// --- Screen Wake Lock -------------------------------------------------------

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    // The OS can drop the lock when the tab is hidden; re-acquire on return.
    wakeLock.addEventListener?.('release', () => { wakeLock = null; });
  } catch (err) {
    // Non-fatal (e.g. not allowed / unsupported) — the game still works.
    console.warn('[timer] wake lock unavailable', err?.message || err);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release?.().catch(() => {});
    wakeLock = null;
  }
}

// Re-acquire the lock if the tab becomes visible again mid-turn.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && intervalId && !wakeLock) {
    requestWakeLock();
  }
});
