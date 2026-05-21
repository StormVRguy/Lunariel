/**
 * Halo Display — the guardian's state as pure text.
 *
 * The spirit canvas IS the halo; this component carries only the words:
 * a large state label and a smaller italic instruction below.
 */
import type { VigilState } from "lunariel-core";
import { VIGIL_STATE_LABELS, VIGIL_STATE_INSTRUCTIONS } from "lunariel-core";
import styles from "./HaloDisplay.module.css";

interface Props {
  vigilState: VigilState;
}

const VIGIL_GLOW_STATES: VigilState[] = ["keepingVigil"];
const MUTED_STATES: VigilState[] = ["awaitingPetition", "vigilClosed"];

export function HaloDisplay({ vigilState }: Props) {
  const isVigil      = VIGIL_GLOW_STATES.includes(vigilState);
  const isMuted      = MUTED_STATES.includes(vigilState);
  const isInterrupted = vigilState === "interrupted";

  return (
    <div className={styles.wrapper}>
      <p
        className={[
          styles.stateLabel,
          isVigil      ? styles.stateLabelVigil      : "",
          isMuted      ? styles.stateLabelMuted      : "",
          isInterrupted ? styles.stateLabelInterrupted : "",
        ].filter(Boolean).join(" ")}
      >
        {VIGIL_STATE_LABELS[vigilState]}
      </p>
      <p className={styles.stateInstruction}>
        {VIGIL_STATE_INSTRUCTIONS[vigilState]}
      </p>
    </div>
  );
}
