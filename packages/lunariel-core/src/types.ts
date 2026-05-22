/**
 * Shared types for the guardian's intercession cycle.
 * Used by both the web application and the API.
 */

/**
 * The vigil state tracks every phase of Lunariel's intercession cycle.
 * Internal code uses these string literals; the UI maps them to sacred labels.
 */
export type VigilState =
  | "awaitingPetition"   // Guardian is present, waiting
  | "receivingPetition"  // Microphone is open, petition being offered
  | "discerning"         // Guardian is listening and transmuting the intention
  | "composingPrayer"    // Prayer is being woven
  | "readyToSing"        // Prayer is composed, awaiting the vigil to begin
  | "keepingVigil"       // Guardian is singing — the loop as rosary
  | "sacredSilence"      // Vigil is paused, not ended
  | "vigilClosed"        // Vigil has been formally closed
  | "interrupted";       // An error broke the intercession

/**
 * The result returned by the API intercession endpoint.
 * Contains the full prayer, the loopable refrain, and optional discernment notes.
 */
export interface IntercessionResult {
  /** Full Latin prayer text, 2–3 sentences (refrain is separate). */
  prayer: string;
  /**
   * A short loopable Latin refrain extracted from the prayer.
   * Lunariel sings the full prayer once, then loops this refrain as the vigil.
   */
  refrain: string;
  /**
   * The purified form of the petition, if it was ethically transmuted.
   * Absent when the original petition required no discernment.
   */
  purifiedIntention?: string;
  /**
   * A gentle, user-facing note shown when the petition was returned to the light.
   * Example: "Your guardian has returned this petition to the light: may love be free."
   */
  discernmentNotice?: string;
}

/**
 * A petition payload sent from the web app to the API.
 */
export interface PetitionPayload {
  /** Base64-encoded audio recording of the spoken petition. */
  audio?: string;
  /** MIME type of the audio blob (e.g. "audio/webm"). */
  mimeType?: string;
  /** Plain-text fallback for mock/dev mode. */
  transcript?: string;
}

/**
 * A single entry in the Book of Remembrance.
 */
export interface PrayerRecord {
  id: string;
  timestamp: string; // ISO 8601
  prayer: string;
  refrain: string;
  purifiedIntention?: string;
  discernmentNotice?: string;
}
