/**
 * Vigil Loop — the guardian's endless intercession.
 *
 * The loop is not mere repetition. It is the angel keeping vigil:
 * the rosary of sound, faithful and circular.
 *
 * Cycle 0: the full prayer is sung once, syllable by syllable.
 * Cycles 1+: the refrain alone loops indefinitely, until the vigil is closed.
 *
 * "Loop as rosary" — the vigil persists until the guardian is formally dismissed.
 */
import { prayerToSyllables } from "../canticle/syllableMap";
import { canticleEngine, PlayCallbacks } from "../canticle/CanticleEngine";
import { LOG_PREFIX } from "lunariel-core";

export interface VigilCallbacks extends PlayCallbacks {
  /** Called when transitioning from the full prayer to the refrain loop. */
  onRefrainStart?: () => void;
}

class VigilLoop {
  private active = false;

  get isKeepingVigil(): boolean {
    return this.active;
  }

  get isPaused(): boolean {
    return canticleEngine.isPaused;
  }

  /**
   * Begin the vigil: sing the full prayer once, then loop the refrain.
   * Returns a promise that resolves when the vigil is closed.
   */
  async beginVigil(
    prayer: string,
    refrain: string,
    callbacks?: VigilCallbacks
  ): Promise<void> {
    this.closeVigil();

    this.active = true;
    const ac = canticleEngine.createAbortController();
    const signal = ac.signal;

    const prayerSyllables = prayerToSyllables(prayer);
    const refrainSyllables = prayerToSyllables(refrain);

    if (prayerSyllables.length === 0) {
      console.warn(`${LOG_PREFIX.vigil} Prayer has no syllables; aborting vigil.`);
      this.active = false;
      return;
    }

    console.log(
      `${LOG_PREFIX.vigil} Beginning vigil. Prayer: ${prayerSyllables.length} syllables. ` +
      `Refrain: ${refrainSyllables.length} syllables.`
    );

    // The refrain source: fall back to full prayer if refrain is empty
    const refrainSource = refrainSyllables.length > 0 ? refrainSyllables : prayerSyllables;

    try {
      // Cycle 0: sing the full prayer once, indices starting at 0
      await canticleEngine.singPhrase(prayerSyllables, 0, callbacks ?? {}, signal);

      if (!this.active || signal.aborted) return;

      // Switch PrayerChamber to refrain text immediately, no pause
      callbacks?.onRefrainStart?.();
      console.log(`${LOG_PREFIX.vigil} Full prayer complete. Entering refrain loop.`);

      // Cycles 1+: loop the refrain with indices always starting at 0
      // so PrayerChamber (now showing refrain text) highlights correctly
      while (this.active && !signal.aborted) {
        await canticleEngine.singPhrase(refrainSource, 0, callbacks ?? {}, signal);
        // No gap between repetitions — the vigil is seamless
      }
    } catch {
      // AbortError when closeVigil() is called — this is the expected exit path
    } finally {
      this.active = false;
      callbacks?.onRest?.();
      console.log(`${LOG_PREFIX.vigil} Vigil closed.`);
    }
  }

  /** Pause the vigil in sacred silence. The loop stays warm. */
  enterSacredSilence(): void {
    canticleEngine.enterSacredSilence();
  }

  /** Resume a paused vigil. */
  resumeVigil(): void {
    canticleEngine.resumeVigil();
  }

  /** Formally close the vigil — abort audio and end the loop. */
  closeVigil(): void {
    this.active = false;
    canticleEngine.stop();
  }
}

export const vigilLoop = new VigilLoop();
