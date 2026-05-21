/**
 * User-facing copy for every state and error in Lunariel's cycle.
 *
 * Sacred language should clarify, not obscure.
 * Developers receive precise technical messages; users receive symbolic ones.
 */
import type { VigilState } from "./types.js";

/** Maps each vigil state to the label shown in the chapel interface. */
export const VIGIL_STATE_LABELS: Record<VigilState, string> = {
  awaitingPetition: "Awaiting Petition",
  receivingPetition: "Receiving Petition",
  discerning: "Discerning",
  composingPrayer: "Weaving Prayer",
  readyToSing: "Prayer Ready",
  keepingVigil: "Keeping Vigil",
  sacredSilence: "Sacred Silence",
  vigilClosed: "Vigil Closed",
  interrupted: "The vigil was interrupted",
};

/** Maps each vigil state to the instruction shown below the status. */
export const VIGIL_STATE_INSTRUCTIONS: Record<VigilState, string> = {
  awaitingPetition:
    "Press Offer Petition, speak your intention, then press again when done.",
  receivingPetition: "Speak your intention — press the button again when done.",
  discerning: "Your guardian is discerning…",
  composingPrayer: "Your guardian is weaving the prayer…",
  readyToSing: "Press Begin Vigil to start the guardian's song.",
  keepingVigil: "The guardian sings without ceasing.",
  sacredSilence: "The vigil rests in sacred silence. Press Resume Vigil to continue.",
  vigilClosed: "The vigil has been closed. Offer a new petition when ready.",
  interrupted:
    "The vigil was interrupted. Press Offer Petition to begin again.",
};

/** User-facing error messages. */
export const ERROR_MESSAGES = {
  emptyPetition: "Place a petition before the guardian first.",
  audioFailure:
    "The voice could not be kindled. The prayer remains written.",
  generationFailure:
    "The prayer could not be woven. Try offering the petition again.",
  loopFailure: "The vigil was interrupted.",
  storageFailure: "The Book of Remembrance could not be inscribed.",
  micPermissionDenied:
    "Microphone permission denied. Allow access to offer a petition.",
} as const;

/** Developer console log prefixes. */
export const LOG_PREFIX = {
  guardianCore: "[Lunariel:GuardianCore]",
  discernment: "[Lunariel:DiscernmentFilter]",
  prayerForge: "[Lunariel:PrayerForge]",
  canticle: "[Lunariel:CanticleEngine]",
  vigil: "[Lunariel:VigilLoop]",
  remembrance: "[Lunariel:BookOfRemembrance]",
} as const;
