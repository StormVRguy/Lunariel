/**
 * Vigil Controls — the guardian's action panel.
 *
 * Presents the correct actions for each phase of the vigil:
 * Begin, Pause, Resume, and Close. Only contextually relevant
 * controls are shown at any given time.
 */
import type { VigilState } from "lunariel-core";
import styles from "./VigilControls.module.css";

interface Props {
  vigilState: VigilState;
  onBeginVigil: () => void;
  onEnterSacredSilence: () => void;
  onResumeVigil: () => void;
  onCloseVigil: () => void;
}

export function VigilControls({
  vigilState,
  onBeginVigil,
  onEnterSacredSilence,
  onResumeVigil,
  onCloseVigil,
}: Props) {
  const showBegin = vigilState === "readyToSing";
  const showSilence = vigilState === "keepingVigil";
  const showResume = vigilState === "sacredSilence";
  const showClose = vigilState === "keepingVigil" || vigilState === "sacredSilence";

  if (!showBegin && !showSilence && !showResume && !showClose) return null;

  return (
    <div className={styles.wrapper}>
      {showBegin && (
        <button
          className={`${styles.btn} ${styles.btnBegin}`}
          onClick={onBeginVigil}
        >
          Begin Vigil
        </button>
      )}

      {showSilence && (
        <button
          className={`${styles.btn} ${styles.btnSilence}`}
          onClick={onEnterSacredSilence}
        >
          Sacred Silence
        </button>
      )}

      {showResume && (
        <button
          className={`${styles.btn} ${styles.btnResume}`}
          onClick={onResumeVigil}
        >
          Resume Vigil
        </button>
      )}

      {showClose && (
        <button
          className={`${styles.btn} ${styles.btnClose}`}
          onClick={onCloseVigil}
        >
          Close Vigil
        </button>
      )}
    </div>
  );
}
