// game.js — the turn engine: building a game, running a turn, scoring,
// applying the skip rule, advancing teams, and evaluating win conditions.
// Every mutation persists via saveState(). It does NOT touch the DOM — app.js
// re-renders after calling these.

import { gameState, saveState, TEAM_COLORS } from './state.js';
import { buildDeck, drawCard } from './deck.js';

export const SKIP_LIMIT = 3; // skips per turn under the "limited" rule

// The full word bank, provided once at boot (and on resume) so the deck can be
// rebuilt synchronously when it runs out.
let bankCards = [];
export function setCards(cards) {
  bankCards = Array.isArray(cards) ? cards : [];
}

function blankTurn(startedAt = null, endsAt = null) {
  return { startedAt, endsAt, wonCards: [], skippedCards: [], skipsUsed: 0 };
}

// Build a fresh game from setup choices: { settings, teams:[{name,color}] }.
export function startGame({ settings, teams }) {
  Object.assign(gameState.settings, settings);

  gameState.teams = teams.map((t, i) => ({
    id: t.id || `team-${i + 1}`,
    name: (t.name || `Team ${i + 1}`).trim() || `Team ${i + 1}`,
    color: t.color || TEAM_COLORS[i % TEAM_COLORS.length],
    score: 0,
    wonCards: [],
  }));

  gameState.deck = buildDeck(bankCards);
  gameState.discard = [];
  gameState.currentCard = null;
  gameState.currentTeamIndex = 0;
  gameState.round = 1;
  gameState.turnsTaken = 0;
  gameState.turn = blankTurn();
  gameState.status = 'playing';
  gameState.startedAt = Date.now();
  gameState.phase = 'preturn';
  saveState();
}

export function currentTeam() {
  return gameState.teams[gameState.currentTeamIndex] || null;
}

// Pre-turn "Start" -> begin the active team's turn.
export function startTurn() {
  const now = Date.now();
  gameState.turn = blankTurn(now, now + gameState.settings.timerSeconds * 1000);
  gameState.currentCard = drawCard(gameState, bankCards);
  gameState.phase = 'play';
  saveState();
}

// "Got it!" — even +1 to the active team, card joins their pile, draw next.
export function gotIt() {
  if (gameState.phase !== 'play' || !gameState.currentCard) return;
  const team = currentTeam();
  const card = gameState.currentCard;
  team.score += 1;
  team.wonCards.push(card);
  gameState.turn.wonCards.push(card);
  gameState.currentCard = drawCard(gameState, bankCards);
  saveState();
}

// True only when the skip rule currently forbids another skip.
export function canSkip() {
  if (gameState.settings.skipRule === 'limited') {
    return gameState.turn.skipsUsed < SKIP_LIMIT;
  }
  return true;
}

// "Skip" — apply the chosen skip rule, card goes to the discard (can return
// later), draw next.
export function skip() {
  if (gameState.phase !== 'play' || !gameState.currentCard) return;
  if (!canSkip()) return;

  const rule = gameState.settings.skipRule;
  if (rule === 'penalty') {
    const team = currentTeam();
    team.score = Math.max(0, team.score - 1); // -1, never below zero
  }

  const card = gameState.currentCard;
  gameState.turn.skipsUsed += 1;
  gameState.turn.skippedCards.push(card);
  gameState.discard.push(card);
  gameState.currentCard = drawCard(gameState, bankCards);
  saveState();
}

// Reclassify a card on the turn summary as won (true) or skipped (false),
// adjusting the active team's score and piles to match. Only allowed under the
// "free" skip rule — Limited/Penalty attach a cost to a skip that a plain
// reclassification would side-step. `card` is the exact card object.
export function markCard(card, toWon) {
  if (gameState.phase !== 'turnsummary') return;
  if (gameState.settings.skipRule !== 'free') return;

  const team = gameState.teams[gameState.currentTeamIndex];
  const { wonCards, skippedCards } = gameState.turn;
  const removeRef = (arr) => {
    const i = arr.indexOf(card);
    if (i !== -1) arr.splice(i, 1);
    return i !== -1;
  };

  if (toWon && skippedCards.includes(card)) {
    removeRef(skippedCards);
    removeRef(gameState.discard);
    wonCards.push(card);
    team.wonCards.push(card);
    team.score += 1;
  } else if (!toWon && wonCards.includes(card)) {
    removeRef(wonCards);
    removeRef(team.wonCards);
    skippedCards.push(card);
    gameState.discard.push(card);
    team.score = Math.max(0, team.score - 1);
  }
  saveState();
}

// End the active turn (timer hit zero, or the player chose to stop) -> summary.
export function endTurn() {
  if (gameState.phase !== 'play') return;
  gameState.phase = 'turnsummary';
  saveState();
}

// "Next team" from the summary: advance, bump the round when we wrap, evaluate
// the win condition, then either end the game or hand off to the next team.
export function nextTeam() {
  gameState.turnsTaken += 1;
  gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
  if (gameState.currentTeamIndex === 0) gameState.round += 1;

  if (isGameOver()) {
    endGame();
    return;
  }
  gameState.phase = 'preturn';
  saveState();
}

// Win-condition check, evaluated after a completed turn.
//   firstToN     -> any team has reached the target score
//   fixedRounds  -> the target number of full rounds have been played
//   open         -> never auto-ends (End game only)
export function isGameOver() {
  const s = gameState.settings;
  if (s.winCondition === 'firstToN') {
    return gameState.teams.some((t) => t.score >= s.winTarget);
  }
  if (s.winCondition === 'fixedRounds') {
    return gameState.round > s.winTarget;
  }
  return false;
}

// Teams sorted high -> low (for the summary scoreboard and the reveal).
export function rankedTeams() {
  return gameState.teams.slice().sort((a, b) => b.score - a.score);
}

// Jump straight to the reveal — reachable any time from play / scoreboard.
export function endGame() {
  gameState.status = 'ended';
  gameState.phase = 'end';
  saveState();
}
