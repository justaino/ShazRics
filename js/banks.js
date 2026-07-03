// banks.js — the registry of lyric banks. Bundled banks ship as JSON under
// data/wordbanks/; custom banks are user-created and live in localStorage.
const CUSTOM_KEY = 'shazrics:banks';

const BUNDLED = [
  { id: 'naija-chorus-50-pack', name: 'Naija Chorus (50 songs)' },
];

export function isBundled(id) {
  return BUNDLED.some((b) => b.id === id);
}

export function customBanks() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// All banks for the picker: bundled first, then custom (tagged).
export function availableBanks() {
  return [
    ...BUNDLED.map((b) => ({ ...b, custom: false })),
    ...customBanks().map((b) => ({ id: b.id, name: b.name, custom: true })),
  ];
}

export function getCustomBank(id) {
  return customBanks().find((b) => b.id === id) || null;
}

// Build card objects for a bank from parsed word entries: [{ text, hint }].
// NOTE: the custom-bank editor still uses the old word/hint format; Phase 2
// extends it to the lyric shape (prompt | answer | artist | song).
function toCards(bankId, words) {
  return words.map((w, i) => ({
    id: `${bankId}-${i}`,
    text: w.text,
    hint: w.hint || '',
    era: 'custom',
    difficulty: 'medium',
  }));
}

// Create a custom bank from parsed word entries: [{ text, hint }].
export function addCustomBank(name, words) {
  const banks = customBanks();
  const id = `custom-${Date.now()}`;
  banks.push({ id, name, cards: toCards(id, words) });
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(banks));
  return id;
}

// Edit an existing custom bank in place: replace its name + cards but KEEP its
// id, so the default-bank preference and any setup selection stay valid.
// Returns the id on success, or null if no such bank.
export function updateCustomBank(id, name, words) {
  const banks = customBanks();
  const idx = banks.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  banks[idx] = { id, name, cards: toCards(id, words) };
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(banks));
  return id;
}

export function deleteCustomBank(id) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customBanks().filter((b) => b.id !== id)));
}

// Serialize a bank's cards back into the editor's textarea format:
// "text | hint" per line (the "| hint" is dropped when there's no hint).
export function cardsToText(cards) {
  return (cards || [])
    .map((c) => (c.hint ? `${c.text} | ${c.hint}` : c.text))
    .join('\n');
}

// Parse a textarea into word entries. One per line; "word | hint" is supported.
export function parseWords(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [word, ...rest] = line.split('|');
      return { text: word.trim(), hint: rest.join('|').trim() };
    })
    .filter((w) => w.text);
}
