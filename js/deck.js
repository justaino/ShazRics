// deck.js — turning the lyric bank into a playable deck.
// Pure-ish helpers: shuffle, build a shuffled deck, and draw the next card
// (reshuffling skips, or rebuilding from the bank, when the deck runs dry).

// Fisher-Yates shuffle, returns a NEW array.
export function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Slim a bank card down to what play needs (the lyric card shape).
function toDeckCard(card) {
  return {
    id: card.id,
    prompt: card.prompt,
    answer: card.answer,
    artist: card.artist,
    song: card.song,
    era: card.era,
    difficulty: card.difficulty,
  };
}

// Build a shuffled deck from every card in the bank.
export function buildDeck(cards) {
  return shuffle(cards).map(toDeckCard);
}

// Draw the next card off the deck, mutating gameState. When the deck empties,
// reshuffle the skipped pile back in; if that's empty too (everything won),
// rebuild a fresh deck from the full bank so play never hard-stops.
export function drawCard(gameState, bankCards) {
  if (gameState.deck.length === 0) {
    if (gameState.discard.length > 0) {
      gameState.deck = shuffle(gameState.discard);
      gameState.discard = [];
    } else {
      gameState.deck = buildDeck(bankCards);
    }
  }
  return gameState.deck.pop() || null;
}
