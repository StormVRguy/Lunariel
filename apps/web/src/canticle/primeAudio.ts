/**
 * Primes the Web Audio context on the first user gesture.
 * Browsers require a user interaction before AudioContext can start.
 * Call this once inside a pointerdown handler before any sound is played.
 */

type ToneModule = typeof import("tone");
let toneCache: ToneModule | null = null;

export async function getTone(): Promise<ToneModule> {
  if (!toneCache) toneCache = await import("tone");
  return toneCache;
}

export async function primeAudio(): Promise<void> {
  const Tone = await getTone();
  await Tone.start();
}
