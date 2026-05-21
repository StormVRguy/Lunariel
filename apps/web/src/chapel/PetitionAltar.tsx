/**
 * Petition Altar — the single point of contact between user and guardian.
 *
 * Just the offer button. The microphone panel lives in the top bar.
 * The button changes label and pulse state while receiving the petition.
 */
import type { VigilState } from "lunariel-core";
import styles from "./PetitionAltar.module.css";

interface Props {
  vigilState: VigilState;
  isReceiving: boolean;
  hasPrayer: boolean;
  onOfferPetition: () => void;
}

const OFFER_BTN_STATES: VigilState[] = [
  "awaitingPetition",
  "receivingPetition",
  "readyToSing",
  "vigilClosed",
  "interrupted",
];

export function PetitionAltar({ vigilState, isReceiving, hasPrayer, onOfferPetition }: Props) {
  const canOffer = OFFER_BTN_STATES.includes(vigilState);
  if (!canOffer) return null;

  const btnLabel = isReceiving
    ? "Receiving\u2026 Offer Again to Finish"
    : hasPrayer
      ? "New Offering"
      : "Offer Petition";

  return (
    <button
      className={`${styles.btn} ${isReceiving ? styles.btnReceiving : ""}`}
      onClick={onOfferPetition}
      disabled={!canOffer}
      aria-pressed={isReceiving}
    >
      {btnLabel}
    </button>
  );
}
