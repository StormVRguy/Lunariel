/**
 * Discernment Filter — the ethical gateway of Lunariel's intercession.
 */
import type { IntercessionResult, PetitionPayload } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";
import {
  composePrayerFromAudio,
  composePrayerFromText,
} from "../forge/PrayerForge.js";

export async function receivePetition(
  payload: PetitionPayload
): Promise<IntercessionResult> {
  console.log(`${LOG_PREFIX.discernment} Receiving petition for discernment.`);

  if (payload.audio && payload.mimeType) {
    return composePrayerFromAudio(payload.audio, payload.mimeType);
  }

  if (typeof payload.transcript === "string" && payload.transcript.trim().length > 0) {
    return composePrayerFromText(payload.transcript);
  }

  throw new Error(
    "The petition could not be received. Provide either audio or a transcript."
  );
}
