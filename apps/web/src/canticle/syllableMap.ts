/**
 * Syllable Map — letter-to-tone correspondences for the canticle engine.
 *
 * Every letter has a fixed entry in LETTER_TUNES. Words split into syllables;
 * each syllable becomes a chord by mixing all its letter-tunes at once.
 */
import { getLetterTune, letterToNote } from "./letterTunes";

export { letterToNote, getLetterTune, LETTER_TUNES } from "./letterTunes";

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

/**
 * Chord for a syllable: one pitch per letter, in syllable order.
 * Repeated letters stack the same tune (stronger presence of that sound).
 */
export function syllableToChord(syllable: string): string[] {
  const letters = syllable.toLowerCase().replace(/[^a-z]/g, "").split("");
  if (letters.length === 0) return [letterToNote("a")];
  return letters.map(letterToNote);
}

/** Human-readable chord description for debugging / UI. */
export function syllableChordLabel(syllable: string): string {
  const letters = syllable.toLowerCase().replace(/[^a-z]/g, "").split("");
  if (letters.length === 0) return "—";
  return letters.map((ch) => getLetterTune(ch).label).join(" + ");
}

/** Duration scales with letter count — more letters, longer chord bloom. */
export function syllableDurationMs(syllable: string): number {
  const n = syllable.replace(/[^a-z]/gi, "").length;
  const count = Math.max(n, 1);
  return Math.max(520, 400 + count * 110);
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

/** One sung step; wordGapAfter inserts silence before the next word. */
export interface SyllableStep {
  syllable: string;
  wordGapAfter: boolean;
}

/** Syllable sequence with word-boundary markers for the canticle engine. */
export function prayerToSyllableSteps(prayer: string): SyllableStep[] {
  const segments = prayerToWordSegments(prayer);
  const steps: SyllableStep[] = [];

  for (let wi = 0; wi < segments.length; wi++) {
    const { syllables } = segments[wi];
    for (let si = 0; si < syllables.length; si++) {
      steps.push({
        syllable: syllables[si],
        wordGapAfter: si === syllables.length - 1 && wi < segments.length - 1,
      });
    }
  }

  return steps;
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
