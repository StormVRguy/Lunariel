/**
 * Discernment Filter — the ethical gateway of Lunariel's intercession.
 *
 * Every petition passes through discernment before a prayer is composed.
 * Coercive, harmful, or obsessive requests are transmuted toward the light:
 * consent, peace, justice, healing, protection, clarity, or freedom.
 *
 * The filter does not reject petitions — it returns them to blessing.
 */
import type { IntercessionResult, PetitionPayload } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";
import {
  composePrayerFromAudio,
  composePrayerFromText,
} from "../forge/PrayerForge.js";

/**
 * Receives a petition, runs it through the Prayer Forge (which embeds
 * discernment in its system instruction), and returns the intercession result.
 *
 * The single Gemini call handles both discernment and prayer composition,
 * since the forge's system instruction carries both responsibilities.
 */
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
