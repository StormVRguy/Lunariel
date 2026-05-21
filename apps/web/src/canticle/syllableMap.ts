/**
 * Syllable Map — letter-to-tone correspondences for the canticle engine.
 *
 * Every letter of the Latin alphabet maps to a deterministic musical tone.
 * Words are split into syllables; each syllable becomes a chord.
 * The system sings the guardian's prayer letter by letter, fused into sound.
 */

const NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
const BASE_OCTAVE = 3;
const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

/** Deterministic tone for a single letter (a–z). */
export function letterToNote(letter: string): string {
  const ch = letter.toLowerCase().replace(/[^a-z]/g, "");
  if (!ch) return `${NOTE_NAMES[0]}${BASE_OCTAVE}`;
  const code = ch.charCodeAt(0) - 97; // a=0 … z=25
  const pitchClass = code % 12;
  const octave = BASE_OCTAVE + Math.floor(code / 12);
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

/** All letter-tones in a syllable, sounded together as a chord. */
export function syllableToChord(syllable: string): string[] {
  const letters = syllable.toLowerCase().replace(/[^a-z]/g, "").split("");
  if (letters.length === 0) return [`${NOTE_NAMES[0]}${BASE_OCTAVE}`];
  return letters.map(letterToNote);
}

/** Duration in ms scales with syllable letter count. */
export function syllableDurationMs(syllable: string): number {
  const n = syllable.replace(/[^a-z]/gi, "").length;
  const count = Math.max(n, 1);
  return 180 + count * 120;
}

/**
 * Latin-oriented syllabification: vowel nuclei with leading consonants;
 * adjacent vowels (diphthongs) stay in one syllable.
 */
export function splitIntoSyllables(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];

  const syllables: string[] = [];
  let i = 0;

  while (i < w.length) {
    let syllable = "";

    while (i < w.length && !VOWELS.has(w[i])) {
      syllable += w[i++];
    }
    while (i < w.length && VOWELS.has(w[i])) {
      syllable += w[i++];
    }
    if (i < w.length && !VOWELS.has(w[i])) {
      let consonants = "";
      while (i < w.length && !VOWELS.has(w[i])) {
        consonants += w[i++];
      }
      if (consonants.length >= 2 && syllable.length > 0) {
        syllable += consonants.slice(0, -1);
        i -= 1;
      } else {
        syllable += consonants;
      }
    }

    if (syllable) syllables.push(syllable);
  }

  return syllables.length > 0 ? syllables : [w];
}

export interface WordSegment {
  word: string;
  syllables: string[];
}

/** Parse prayer text into word segments, each with its syllables. */
export function prayerToWordSegments(prayer: string): WordSegment[] {
  const chunks = prayer
    .replace(/\s+/g, "")
    .split(/[^a-zA-Z]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  return chunks.map((word) => ({
    word,
    syllables: splitIntoSyllables(word),
  }));
}

/** Flatten all syllables from a prayer text into a single sequence. */
export function prayerToSyllables(prayer: string): string[] {
  return prayerToWordSegments(prayer).flatMap((w) => w.syllables);
}

/** Map a global syllable index → { wordIndex, syllableIndex within word }. */
export function syllableIndexToPosition(
  segments: WordSegment[],
  globalIndex: number
): { wordIndex: number; syllableIndex: number } | null {
  let n = 0;
  for (let wi = 0; wi < segments.length; wi++) {
    for (let si = 0; si < segments[wi].syllables.length; si++) {
      if (n === globalIndex) return { wordIndex: wi, syllableIndex: si };
      n++;
    }
  }
  return null;
}
