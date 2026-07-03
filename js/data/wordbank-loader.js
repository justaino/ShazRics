// wordbank-loader.js — loads a lyric bank by id and returns its cards.
// Custom banks (user-created) live in localStorage; bundled banks are JSON
// files under data/wordbanks/. Lyrics are data, not code.
import { getCustomBank } from '../banks.js';

const WORDBANK_BASE = 'data/wordbanks';

export async function loadWordbank(id = 'naija-lyrics-sample') {
  // Custom bank? Serve it straight from localStorage (works offline, no fetch).
  const custom = getCustomBank(id);
  if (custom) {
    const cards = Array.isArray(custom.cards) ? custom.cards : [];
    console.log(`[wordbank-loader] loaded custom "${custom.name}" — ${cards.length} cards`);
    return cards;
  }

  // Bundled bank — fetch the JSON (relative to the document; serve the folder).
  const res = await fetch(`${WORDBANK_BASE}/${id}.json`);
  if (!res.ok) {
    throw new Error(`Word bank "${id}" failed to load: ${res.status} ${res.statusText}`);
  }
  const bank = await res.json();
  const cards = Array.isArray(bank.cards) ? bank.cards : [];
  console.log(`[wordbank-loader] loaded "${bank.name ?? id}" — ${cards.length} cards`);
  return cards;
}
