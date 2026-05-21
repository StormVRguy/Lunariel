/**
 * Guardian Core — the central orchestrator of Lunariel's intercession cycle.
 *
 * Coordinates petition intake, discernment, prayer composition, canticle singing,
 * the vigil loop, and the Book of Remembrance. Every state transition here
 * corresponds to a phase in the guardian's symbolic work.
 *
 * State flow:
 *   awaitingPetition → receivingPetition → discerning →
 *   composingPrayer → readyToSing → keepingVigil ↔ sacredSilence → readyToSing
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { VigilState, IntercessionResult } from "lunariel-core";
import { ERROR_MESSAGES, LOG_PREFIX } from "lunariel-core";
import { usePetitionChamber, PetitionChamberState } from "../petition/usePetitionChamber";
import { vigilLoop } from "../vigil/VigilLoop";
import { inscribePrayerRecord } from "../remembrance/BookOfRemembrance";
import { blobToBase64 } from "../hooks/useAudioRecorder";

export interface GuardianCoreState {
  vigilState: VigilState;
  activePrayer: string;
  activeRefrain: string;
  discernmentNotice: string | null;
  activeSyllableIndex: number | null;
  /** True while singing the full prayer; false once in the refrain loop. */
  isRefrainPhase: boolean;
  error: string | null;
  petitionChamber: PetitionChamberState;

  offerPetition: () => void;
  beginVigil: () => void;
  enterSacredSilence: () => void;
  resumeVigil: () => void;
  closeVigil: () => void;
}

export function useGuardianCore(): GuardianCoreState {
  const [vigilState, _setVigilState] = useState<VigilState>("awaitingPetition");
  const vigilStateRef = useRef<VigilState>("awaitingPetition");

  const [activePrayer, setActivePrayer] = useState("");
  const [activeRefrain, setActiveRefrain] = useState("");
  const [discernmentNotice, setDiscernmentNotice] = useState<string | null>(null);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number | null>(null);
  const [isRefrainPhase, setIsRefrainPhase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chamber = usePetitionChamber();
  const abortRef = useRef<AbortController | null>(null);

  const setVigilState = useCallback((s: VigilState) => {
    vigilStateRef.current = s;
    _setVigilState(s);
  }, []);

  // When the petition chamber finishes recording, send the audio for discernment
  useEffect(() => {
    chamber.onPetitionReceived(async ({ blob, mimeType }) => {
      if (vigilStateRef.current !== "receivingPetition") return;

      setVigilState("discerning");
      setError(null);
      setDiscernmentNotice(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setVigilState("composingPrayer");
        const base64Audio = await blobToBase64(blob);

        const response = await fetch("/api/intercession", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64Audio, mimeType }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unknown error from guardian.");
        }

        const result = (await response.json()) as IntercessionResult;

        setActivePrayer(result.prayer);
        setActiveRefrain(result.refrain);
        setDiscernmentNotice(result.discernmentNotice ?? null);
        setIsRefrainPhase(false);

        // Inscribe in the Book of Remembrance
        inscribePrayerRecord({
          prayer: result.prayer,
          refrain: result.refrain,
          purifiedIntention: result.purifiedIntention,
          discernmentNotice: result.discernmentNotice,
        });

        setVigilState("readyToSing");
        console.log(`${LOG_PREFIX.guardianCore} Prayer ready. Awaiting vigil.`);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error(`${LOG_PREFIX.guardianCore} Intercession failed:`, err);
        setError(ERROR_MESSAGES.generationFailure);
        setVigilState("interrupted");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offerPetition = useCallback(() => {
    const state = vigilStateRef.current;
    if (state === "receivingPetition") {
      // Second press: close the chamber and let the recording handler take over
      chamber.closeChamber();
    } else if (
      state === "awaitingPetition" ||
      state === "readyToSing" ||
      state === "vigilClosed" ||
      state === "interrupted"
    ) {
      vigilLoop.closeVigil();
      setActiveSyllableIndex(null);
      setIsRefrainPhase(false);
      setVigilState("receivingPetition");
      chamber.openChamber();
    }
  }, [chamber, setVigilState]);

  const beginVigil = useCallback(() => {
    if (vigilStateRef.current !== "readyToSing") return;
    if (!activePrayer) return;

    setVigilState("keepingVigil");
    setActiveSyllableIndex(null);
    setIsRefrainPhase(false);

    vigilLoop
      .beginVigil(activePrayer, activeRefrain, {
        onSyllable: (index) => setActiveSyllableIndex(index),
        onRest: () => setActiveSyllableIndex(null),
        onRefrainStart: () => setIsRefrainPhase(true),
      })
      .catch((err) => {
        console.error(`${LOG_PREFIX.guardianCore} Vigil error:`, err);
        setError(ERROR_MESSAGES.loopFailure);
        setVigilState("interrupted");
      });
  }, [activePrayer, activeRefrain, setVigilState]);

  const enterSacredSilence = useCallback(() => {
    if (vigilStateRef.current !== "keepingVigil") return;
    setVigilState("sacredSilence");
    vigilLoop.enterSacredSilence();
  }, [setVigilState]);

  const resumeVigil = useCallback(() => {
    if (vigilStateRef.current !== "sacredSilence") return;
    setVigilState("keepingVigil");
    vigilLoop.resumeVigil();
  }, [setVigilState]);

  const closeVigil = useCallback(() => {
    const state = vigilStateRef.current;
    if (state !== "keepingVigil" && state !== "sacredSilence") return;
    vigilLoop.closeVigil();
    setActiveSyllableIndex(null);
    setIsRefrainPhase(false);
    setVigilState("readyToSing");
  }, [setVigilState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      vigilLoop.closeVigil();
    };
  }, []);

  return {
    vigilState,
    activePrayer,
    activeRefrain,
    discernmentNotice,
    activeSyllableIndex,
    isRefrainPhase,
    error,
    petitionChamber: chamber,
    offerPetition,
    beginVigil,
    enterSacredSilence,
    resumeVigil,
    closeVigil,
  };
}
