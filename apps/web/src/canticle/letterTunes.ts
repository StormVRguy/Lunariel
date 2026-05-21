/**
 * Letter Tunes — the permanent dictionary of Lunariel's alphabet.
 *
 * Human, angelic register: D₃–E♭₅ (≈147–622 Hz).
 * Warm choir hum — not sub-bass, not shrill.
 */

export type LetterTune = {
  note: string;
  label: string;
};

/** Twenty-six chromatic steps from D₃ to E♭₅. */
export const LETTER_TUNES: Record<string, LetterTune> = {
  a: { note: "D3",  label: "D₃" },
  b: { note: "Eb3", label: "E♭₃" },
  c: { note: "E3",  label: "E₃" },
  d: { note: "F3",  label: "F₃" },
  e: { note: "F#3", label: "F♯₃" },
  f: { note: "G3",  label: "G₃" },
  g: { note: "Ab3", label: "A♭₃" },
  h: { note: "A3",  label: "A₃" },
  i: { note: "Bb3", label: "B♭₃" },
  j: { note: "B3",  label: "B₃" },
  k: { note: "C4",  label: "C₄" },
  l: { note: "Db4", label: "D♭₄" },
  m: { note: "D4",  label: "D₄" },
  n: { note: "Eb4", label: "E♭₄" },
  o: { note: "E4",  label: "E₄" },
  p: { note: "F4",  label: "F₄" },
  q: { note: "F#4", label: "F♯₄" },
  r: { note: "G4",  label: "G₄" },
  s: { note: "Ab4", label: "A♭₄" },
  t: { note: "A4",  label: "A₄" },
  u: { note: "Bb4", label: "B♭₄" },
  v: { note: "B4",  label: "B₄" },
  w: { note: "C5",  label: "C₅" },
  x: { note: "Db5", label: "D♭₅" },
  y: { note: "D5",  label: "D₅" },
  z: { note: "Eb5", label: "E♭₅" },
};

const FALLBACK: LetterTune = { note: "E4", label: "E₄" };

export function getLetterTune(letter: string): LetterTune {
  const ch = letter.toLowerCase().replace(/[^a-z]/g, "");
  return LETTER_TUNES[ch] ?? FALLBACK;
}

export function letterToNote(letter: string): string {
  return getLetterTune(letter).note;
}
