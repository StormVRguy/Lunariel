/**
 * Halo Display — the guardian's status as a luminous ring.
 *
 * The halo breathes when active, spins when composing, glows when keeping vigil.
 * It is the visual heartbeat of Lunariel's presence.
 */
import type { VigilState } from "lunariel-core";
import { VIGIL_STATE_LABELS, VIGIL_STATE_INSTRUCTIONS } from "lunariel-core";
import styles from "./HaloDisplay.module.css";

interface Props {
  vigilState: VigilState;
}

const SPINNING_STATES: VigilState[] = ["discerning", "composingPrayer", "receivingPetition"];
const ACTIVE_STATES: VigilState[] = ["readyToSing", "sacredSilence"];
const VIGIL_STATES: VigilState[] = ["keepingVigil"];

const STATE_SYMBOLS: Record<VigilState, string> = {
  awaitingPetition: "○",
  receivingPetition: "◉",
  discerning: "◌",
  composingPrayer: "◌",
  readyToSing: "◎",
  keepingVigil: "●",
  sacredSilence: "◑",
  vigilClosed: "○",
  interrupted: "×",
};

export function HaloDisplay({ vigilState }: Props) {
  const isSpinning = SPINNING_STATES.includes(vigilState);
  const isActive = ACTIVE_STATES.includes(vigilState);
  const isVigil = VIGIL_STATES.includes(vigilState);
  const isInterrupted = vigilState === "interrupted";

  const haloClass = [
    styles.halo,
    isVigil ? styles.haloVigil : "",
    isActive ? styles.haloActive : "",
    isInterrupted ? styles.haloInterrupted : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.wrapper}>
      <div className={haloClass} aria-hidden>
        {isSpinning && <div className={styles.spinner} />}
        <span className={styles.symbol}>{STATE_SYMBOLS[vigilState]}</span>
      </div>
      <p className={styles.stateLabel}>{VIGIL_STATE_LABELS[vigilState]}</p>
      <p className={styles.stateInstruction}>{VIGIL_STATE_INSTRUCTIONS[vigilState]}</p>
    </div>
  );
}
