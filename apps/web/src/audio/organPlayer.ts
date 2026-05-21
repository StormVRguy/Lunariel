// Tone.js is loaded lazily so no AudioContext is created before a user gesture.
import { prayerToSyllables, syllableToChord, syllableDurationMs } from "./wordToChord";

type ToneModule = typeof import("tone");
let toneCache: ToneModule | null = null;

async function getTone(): Promise<ToneModule> {
  if (!toneCache) toneCache = await import("tone");
  return toneCache;
}

export async function primeAudio(): Promise<void> {
  const Tone = await getTone();
  await Tone.start();
}

export interface PlayCallbacks {
  onSyllable?: (index: number, syllable: string) => void;
  /** Between loops or when playback ends. */
  onRest?: () => void;
}

const GAP_MS = 60;
const LOOP_PAUSE_MS = 600;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

class OrganPlayer {
  private synth: import("tone").PolySynth | null = null;
  private abortController: AbortController | null = null;
  private shouldLoop = false;

  get isSinging() {
    return this.shouldLoop;
  }

  async play(prayer: string, callbacks?: PlayCallbacks): Promise<void> {
    const syllables = prayerToSyllables(prayer);
    if (syllables.length === 0) return;

    this.stop();
    this.shouldLoop = true;

    const Tone = await getTone();
    await Tone.start();

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    if (!this.synth) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 32,
        oscillator: { type: "sine" },
        envelope: { attack: 0.06, decay: 0.08, sustain: 0.88, release: 0.5 },
      });
      const filter = new Tone.Filter(2000, "lowpass");
      const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.45 });
      const vol = new Tone.Volume(-6);
      synth.connect(filter);
      filter.connect(reverb);
      reverb.connect(vol);
      vol.toDestination();
      this.synth = synth;
    }

    try {
      while (this.shouldLoop && !signal.aborted) {
        for (let i = 0; i < syllables.length; i++) {
          if (!this.shouldLoop || signal.aborted) break;

          const syllable = syllables[i];
          callbacks?.onSyllable?.(i, syllable);

          const notes = syllableToChord(syllable);
          const duration = syllableDurationMs(syllable);

          this.synth.triggerAttack(notes);
          await sleep(duration, signal);
          this.synth.triggerRelease(notes);
          await sleep(GAP_MS, signal);
        }

        if (this.shouldLoop && !signal.aborted) {
          callbacks?.onRest?.();
          await sleep(LOOP_PAUSE_MS, signal);
        }
      }
    } catch {
      // AbortError when stop() is called
    } finally {
      callbacks?.onRest?.();
      this.shouldLoop = false;
      this.synth?.releaseAll();
    }
  }

  stop(): void {
    this.shouldLoop = false;
    this.abortController?.abort();
    this.synth?.releaseAll();
  }

  dispose(): void {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    toneCache = null;
  }
}

export const organPlayer = new OrganPlayer();
