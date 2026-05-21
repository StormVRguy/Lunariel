/**
 * Petition Altar — the user's point of contact with the guardian.
 *
 * Here the user offers their intention. The microphone is open,
 * the voice is received, and the prayer is begun.
 */
import type { VigilState } from "lunariel-core";
import { MicMonitor } from "../components/MicMonitor";
import type { UseMicMonitor } from "../hooks/useMicMonitor";
import styles from "./PetitionAltar.module.css";

interface Props {
  vigilState: VigilState;
  mic: UseMicMonitor;
  isReceiving: boolean;
  onOfferPetition: () => void;
}

const OFFER_BTN_STATES: VigilState[] = [
  "awaitingPetition",
  "receivingPetition",
  "readyToSing",
  "vigilClosed",
  "interrupted",
];

export function PetitionAltar({ vigilState, mic, isReceiving, onOfferPetition }: Props) {
  const canOffer = OFFER_BTN_STATES.includes(vigilState);

  const btnLabel = isReceiving
    ? "Receiving\u2026 Offer Again to Finish"
    : "Offer Petition";

  return (
    <div className={styles.wrapper}>
      <p className={styles.altarLabel}>Petition Altar</p>

      <MicMonitor mic={mic} active={isReceiving} />

      <button
        className={`${styles.offerBtn} ${isReceiving ? styles.offerBtnReceiving : ""}`}
        onClick={onOfferPetition}
        disabled={!canOffer}
        aria-pressed={isReceiving}
        aria-label={btnLabel}
      >
        {btnLabel}
      </button>
    </div>
  );
}
