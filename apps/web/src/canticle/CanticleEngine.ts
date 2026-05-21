/**
 * Canticle Engine — Lunariel's voice.
 *
 * Handles Tone.js synthesis and the low-level mechanics of singing:
 * triggering syllable chords, managing the polyphonic synth,
 * and supporting pause/resume without destroying the audio context.
 *
 * The sound identity is humming: sine oscillator, gentle envelope,
 * subtle reverb — breath-like, devotional, not mechanical.
 */
import { getTone } from "./primeAudio";
import { syllableToChord, syllableDurationMs } from "./syllableMap";
import { LOG_PREFIX } from "lunariel-core";

const GAP_MS = 60;

export interface PlayCallbacks {
  /** Called when a new syllable begins; carries its global index. */
  onSyllable?: (index: number, syllable: string) => void;
  /** Called between phrases or at the end of playback. */
  onRest?: () => void;
}

/** Abort-aware sleep. Rejects with AbortError when the signal fires. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
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

class CanticleEngine {
  private synth: import("tone").PolySynth | null = null;
  private abortController: AbortController | null = null;
  private _isPaused = false;
  private resumeResolve: (() => void) | null = null;

  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Sing a sequence of syllables from start to end.
   * Resolves when all syllables have been played or when aborted/paused.
   */
  async singPhrase(
    syllables: string[],
    startIndex: number,
    callbacks: PlayCallbacks,
    signal: AbortSignal
  ): Promise<void> {
    const synth = await this.ensureSynth();

    for (let i = 0; i < syllables.length; i++) {
      if (signal.aborted) break;

      // Check for pause between syllables
      await this.waitIfPaused(signal);
      if (signal.aborted) break;

      const syllable = syllables[i];
      callbacks.onSyllable?.(startIndex + i, syllable);

      const notes = syllableToChord(syllable);
      const duration = syllableDurationMs(syllable);

      synth.triggerAttack(notes);
      await sleep(duration, signal);
      if (!signal.aborted) synth.triggerRelease(notes);
      await sleep(GAP_MS, signal);
    }
  }

  /** Pause the vigil between syllables; the current chord fades naturally. */
  enterSacredSilence(): void {
    this._isPaused = true;
    this.synth?.releaseAll();
    console.log(`${LOG_PREFIX.canticle} Entering sacred silence.`);
  }

  /** Resume a paused vigil. */
  resumeVigil(): void {
    this._isPaused = false;
    this.resumeResolve?.();
    this.resumeResolve = null;
    console.log(`${LOG_PREFIX.canticle} Vigil resumed.`);
  }

  /** Stop all sound and abort the current phrase. */
  stop(): void {
    this._isPaused = false;
    this.resumeResolve?.();
    this.resumeResolve = null;
    this.abortController?.abort();
    this.synth?.releaseAll();
  }

  createAbortController(): AbortController {
    this.abortController = new AbortController();
    return this.abortController;
  }

  dispose(): void {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }

  private async ensureSynth(): Promise<import("tone").PolySynth> {
    if (!this.synth) {
      const Tone = await getTone();
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.06, decay: 0.08, sustain: 0.88, release: 0.5 },
      });
      synth.maxPolyphony = 32;
      const filter = new Tone.Filter(2000, "lowpass");
      const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.45 });
      const vol = new Tone.Volume(-6);
      synth.connect(filter);
      filter.connect(reverb);
      reverb.connect(vol);
      vol.toDestination();
      this.synth = synth;
      console.log(`${LOG_PREFIX.canticle} Synth initialized.`);
    }
    return this.synth;
  }

  private async waitIfPaused(signal: AbortSignal): Promise<void> {
    if (!this._isPaused) return;
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        this.resumeResolve = null;
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      this.resumeResolve = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
    });
  }
}

export const canticleEngine = new CanticleEngine();
