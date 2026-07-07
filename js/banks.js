// banks.js — the registry of lyric banks. Bundled banks ship as JSON under
// data/wordbanks/; custom banks are user-created and live in localStorage.
const CUSTOM_KEY = 'shazrics:banks';

const BUNDLED = [
  { id: 'naija-lyrics-bank-popular', name: 'Naija - Popular Songs' },
  { id: 'naija-lyrics-bank-known', name: 'Naija - Other Songs' },
  { id: 'naija-lyrics-v2', name: 'Naija Chorus (50 songs)' },
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

// The delimiter between fields in the editor's textarea format.
export const LYRIC_DELIM = '||';

// Build lyric-card objects for a bank from parsed entries:
// [{ prompt, answer, artist, song }]. Auto-generates ids and defaults the
// optional era/difficulty so the cards match the bundled bank shape.
function toCards(bankId, entries) {
  return entries.map((e, i) => ({
    id: `${bankId}-${i}`,
    prompt: e.prompt,
    answer: e.answer,
    artist: e.artist || '',
    song: e.song || '',
    era: e.era || 'modern',
    difficulty: e.difficulty || 'medium',
  }));
}

// Create a custom bank from parsed lyric entries.
export function addCustomBank(name, entries) {
  const banks = customBanks();
  const id = `custom-${Date.now()}`;
  banks.push({ id, name, cards: toCards(id, entries) });
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(banks));
  return id;
}

// Edit an existing custom bank in place: replace its name + cards but KEEP its
// id, so the default-bank preference and any setup selection stay valid.
// Returns the id on success, or null if no such bank.
export function updateCustomBank(id, name, entries) {
  const banks = customBanks();
  const idx = banks.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  banks[idx] = { id, name, cards: toCards(id, entries) };
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(banks));
  return id;
}

export function deleteCustomBank(id) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customBanks().filter((b) => b.id !== id)));
}

// Serialize a bank's cards back into the editor's textarea format:
// "prompt || answer || artist || song" per line. Trailing empty artist/song
// fields are dropped so a bare "prompt || answer" round-trips cleanly.
export function cardsToText(cards) {
  return (cards || [])
    .map((c) => {
      const fields = [c.prompt, c.answer, c.artist, c.song].map((v) => (v == null ? '' : String(v).trim()));
      while (fields.length > 2 && fields[fields.length - 1] === '') fields.pop();
      return fields.join(` ${LYRIC_DELIM} `);
    })
    .join('\n');
}

// Parse the editor textarea into lyric entries. Each non-blank line is:
//   prompt || answer || artist || song   (artist and song optional)
// Returns { entries, errors }:
//   entries — valid rows as { prompt, answer, artist, song }
//   errors  — [{ line, message }] for malformed rows (missing prompt or answer)
// Line numbers are 1-based over the raw text so error messages point at the
// exact line the user sees. Blank lines are skipped but still counted.
export function parseLyrics(text) {
  const entries = [];
  const errors = [];
  String(text || '').split('\n').forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim();
    if (!line) return;
    const [prompt = '', answer = '', artist = '', song = ''] = line.split(LYRIC_DELIM).map((p) => p.trim());
    if (!prompt) {
      errors.push({ line: lineNo, message: `Line ${lineNo}: missing the lyric prompt before the ${LYRIC_DELIM}.` });
      return;
    }
    if (!answer) {
      errors.push({ line: lineNo, message: `Line ${lineNo}: missing the answer after ${LYRIC_DELIM}.` });
      return;
    }
    entries.push({ prompt, answer, artist, song });
  });
  return { entries, errors };
}
