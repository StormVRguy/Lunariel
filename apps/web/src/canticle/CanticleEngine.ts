/**
 * Canticle Engine — Lunariel's voice.
 *
 * Each syllable is a chord: every letter contributes its fixed tune from
 * LETTER_TUNES, and all letter-tones sound together via PolySynth.
 * Notes are scheduled on the audio clock (triggerAttackRelease) so every
 * syllable is heard reliably with no voice-stealing from manual release.
 */
import { getTone } from "./primeAudio";
import type { SyllableStep } from "./syllableMap";
import { syllableToChord, syllableDurationMs } from "./syllableMap";
import { LOG_PREFIX } from "lunariel-core";

/** Breath between syllables (audio-time gap after each chord ends). */
const GAP_SEC = 0.09;

/** Silence between words (where spaces fall in the prayer text). */
const WORD_GAP_MS = 300;

export interface PlayCallbacks {
  onSyllable?: (index: number, syllable: string) => void;
  /** Called when a syllable's chord has finished (audio clock). */
  onSyllableEnd?: (index: number) => void;
  onRest?: () => void;
}

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

/** Unique pitches so PolySynth attack/release voice counts stay consistent. */
function chordForSynth(syllable: string): string[] {
  const notes = syllableToChord(syllable);
  return [...new Set(notes)];
}

class CanticleEngine {
  private synth: import("tone").PolySynth | null = null;
  private reverb: import("tone").Reverb | null = null;
  private abortController: AbortController | null = null;
  private _isPaused = false;
  private resumeResolve: (() => void) | null = null;
  private initPromise: Promise<void> | null = null;

  get isPaused(): boolean {
    return this._isPaused;
  }

  async singPhrase(
    steps: SyllableStep[],
    startIndex: number,
    callbacks: PlayCallbacks,
    signal: AbortSignal
  ): Promise<void> {
    const { synth, Tone } = await this.ensureReady();

    for (let i = 0; i < steps.length; i++) {
      if (signal.aborted) break;

      await this.waitIfPaused(signal);
      if (signal.aborted) break;

      const { syllable, wordGapAfter } = steps[i];
      const chord = chordForSynth(syllable);
      if (chord.length === 0) continue;

      const durationSec = syllableDurationMs(syllable) / 1000;
      const index = startIndex + i;

      callbacks.onSyllable?.(index, syllable);

      const t0 = Tone.now() + 0.02;
      synth.triggerAttackRelease(chord, durationSec, t0);

      let waitMs = Math.ceil((durationSec + GAP_SEC) * 1000);
      if (wordGapAfter) waitMs += WORD_GAP_MS;

      await sleep(waitMs, signal);

      if (!signal.aborted) {
        callbacks.onSyllableEnd?.(index);
      }
    }
  }

  enterSacredSilence(): void {
    this._isPaused = true;
    this.synth?.releaseAll();
    console.log(`${LOG_PREFIX.canticle} Entering sacred silence.`);
  }

  resumeVigil(): void {
    this._isPaused = false;
    this.resumeResolve?.();
    this.resumeResolve = null;
    console.log(`${LOG_PREFIX.canticle} Vigil resumed.`);
  }

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
    this.reverb?.dispose();
    this.reverb = null;
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    this.initPromise = null;
  }

  private async ensureReady(): Promise<{
    synth: import("tone").PolySynth;
    Tone: typeof import("tone");
  }> {
    if (!this.initPromise) {
      this.initPromise = this.initSynth();
    }
    await this.initPromise;
    if (!this.synth) throw new Error("Canticle synth failed to initialize");
    const Tone = await getTone();
    return { synth: this.synth, Tone };
  }

  private async initSynth(): Promise<void> {
    const Tone = await getTone();
    await Tone.start();

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.04,
        decay: 0.12,
        sustain: 0.75,
        release: 0.35,
      },
    });
    synth.maxPolyphony = 64;

    // Full letter range is C2–D♭4 — do NOT use a ~500 Hz bandpass (it silences bass letters).
    const highpass = new Tone.Filter(55, "highpass");
    const lowpass = new Tone.Filter(5200, "lowpass");

    const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.38 });
    await reverb.generate();

    const vol = new Tone.Volume(-4);

    synth.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(reverb);
    reverb.connect(vol);
    vol.toDestination();

    this.synth = synth;
    this.reverb = reverb;
    console.log(`${LOG_PREFIX.canticle} Letter-chord synth ready (full-range).`);
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
