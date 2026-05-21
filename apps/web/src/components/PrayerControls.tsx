import { Phase } from "../hooks/usePrayerSession";
import { UseMicMonitor } from "../hooks/useMicMonitor";
import { MicMonitor } from "./MicMonitor";
import { SyllableVisualizer } from "./SyllableVisualizer";
import styles from "./PrayerControls.module.css";

interface Props {
  phase: Phase;
  latinPrayer: string;
  activeSyllableIndex: number | null;
  error: string | null;
  mic: UseMicMonitor;
  onListen: () => void;
  onPray: () => void;
  onThankYou: () => void;
}

const STATUS_LABELS: Record<Phase, string> = {
  idle: "Press LISTEN, speak your intention, then press the button again",
  listening: "Recording — press the button again when done",
  generating: "Sending recording to Gemini…",
  prayerReady: "Press PRAY to begin",
  singing: "Singing the prayer — press THANK YOU to stop",
};

export function PrayerControls({
  phase,
  latinPrayer,
  activeSyllableIndex,
  error,
  mic,
  onListen,
  onPray,
  onThankYou,
}: Props) {
  const isListenDisabled = phase === "generating" || phase === "singing";
  const isPrayDisabled = phase !== "prayerReady";
  const isThankYouDisabled = phase !== "singing";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.cross}>✝</div>
        <h1 className={styles.title}>Autonomous Praying System</h1>
      </header>

      <p className={styles.statusLine}>{STATUS_LABELS[phase]}</p>

      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${styles.btnListen} ${phase === "listening" ? styles.active : ""}`}
          onClick={onListen}
          disabled={isListenDisabled}
          aria-pressed={phase === "listening"}
        >
          {phase === "listening" ? "● REC — CLICK TO STOP" : "LISTEN"}
        </button>

        <button
          className={`${styles.btn} ${styles.btnPray}`}
          onClick={onPray}
          disabled={isPrayDisabled}
        >
          {phase === "singing" ? "PRAYING…" : "PRAY"}
        </button>

        <button
          className={`${styles.btn} ${styles.btnThankYou}`}
          onClick={onThankYou}
          disabled={isThankYouDisabled}
        >
          THANK YOU
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {phase === "generating" && (
        <div className={styles.spinner} aria-label="Generating prayer" />
      )}

      {latinPrayer && (phase === "prayerReady" || phase === "singing") && (
        <SyllableVisualizer
          prayer={latinPrayer}
          activeIndex={activeSyllableIndex}
          isSinging={phase === "singing"}
        />
      )}

      {/* Mic selector + level meter — hidden while generating or singing */}
      {phase !== "generating" && phase !== "singing" && (
        <MicMonitor mic={mic} active={phase === "listening"} />
      )}
    </div>
  );
}
