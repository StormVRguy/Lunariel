/**
 * Vigil Loop — the guardian's endless intercession.
 *
 * The vigil runs as a rosary: one full prayer, then the refrain sung
 * three times, then the full prayer again from the beginning — cycling
 * indefinitely until formally closed.
 *
 *   prayer → refrain × 3 → prayer → refrain × 3 → …
 *
 * The pattern mirrors the liturgical structure of a responsory:
 * the full canticle opens the vigil; the refrain is its living echo,
 * repeated and deepened before the canticle is proclaimed anew.
 */
import { prayerToSyllableSteps } from "../canticle/syllableMap";
import { canticleEngine, PlayCallbacks } from "../canticle/CanticleEngine";
import { LOG_PREFIX } from "lunariel-core";

const REFRAIN_REPETITIONS = 3;

export interface VigilCallbacks extends PlayCallbacks {
  /** Called when transitioning from prayer to the refrain cycle. */
  onRefrainStart?: () => void;
  /** Called when transitioning from the refrain back to the full prayer. */
  onPrayerStart?: () => void;
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
   * Begin the vigil: full prayer → refrain × 3 → full prayer → …
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

    const prayerSteps  = prayerToSyllableSteps(prayer);
    const refrainSteps = prayerToSyllableSteps(refrain);

    if (prayerSteps.length === 0) {
      console.warn(`${LOG_PREFIX.vigil} Prayer has no syllables; aborting vigil.`);
      this.active = false;
      return;
    }

    // Fall back to full prayer if refrain is empty
    const refrainSource =
      refrainSteps.length > 0 ? refrainSteps : prayerSteps;

    console.log(
      `${LOG_PREFIX.vigil} Beginning vigil. ` +
      `Prayer: ${prayerSteps.length} syl. ` +
      `Refrain: ${refrainSource.length} syl.`
    );

    try {
      // ── First pass: full prayer ──────────────────────────────────
      await canticleEngine.singPhrase(prayerSteps, 0, callbacks ?? {}, signal);
      if (!this.active || signal.aborted) return;

      // ── Repeat cycle: refrain × 3, then full prayer ──────────────
      while (this.active && !signal.aborted) {

        // Refrain phase
        callbacks?.onRefrainStart?.();
        console.log(`${LOG_PREFIX.vigil} Entering refrain phase.`);
        for (let r = 0; r < REFRAIN_REPETITIONS; r++) {
          if (!this.active || signal.aborted) break;
          await canticleEngine.singPhrase(refrainSource, 0, callbacks ?? {}, signal);
        }

        if (!this.active || signal.aborted) break;

        // Return to full prayer
        callbacks?.onPrayerStart?.();
        console.log(`${LOG_PREFIX.vigil} Returning to full prayer.`);
        await canticleEngine.singPhrase(prayerSteps, 0, callbacks ?? {}, signal);
      }
    } catch {
      // AbortError when closeVigil() is called — expected exit
    } finally {
      this.active = false;
      callbacks?.onRest?.();
      console.log(`${LOG_PREFIX.vigil} Vigil closed.`);
    }
  }

  /** Pause the vigil in sacred silence. */
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
