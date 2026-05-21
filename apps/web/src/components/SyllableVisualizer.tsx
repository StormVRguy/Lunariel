import { useEffect, useMemo, useRef } from "react";
import {
  prayerToWordSegments,
  syllableIndexToPosition,
  letterToNote,
} from "../audio/wordToChord";
import styles from "./SyllableVisualizer.module.css";

interface Props {
  prayer: string;
  activeIndex: number | null;
  isSinging: boolean;
}

export function SyllableVisualizer({ prayer, activeIndex, isSinging }: Props) {
  const segments = useMemo(() => prayerToWordSegments(prayer), [prayer]);
  const activeRef = useRef<HTMLSpanElement | null>(null);

  const position =
    activeIndex !== null ? syllableIndexToPosition(segments, activeIndex) : null;

  useEffect(() => {
    if (activeRef.current && isSinging) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex, isSinging]);

  let globalIndex = 0;

  return (
    <div
      className={`${styles.wrapper} ${isSinging ? styles.wrapperLive : ""}`}
      aria-live="polite"
      aria-label="Syllables being sung"
    >
      <div className={styles.scanline} aria-hidden />
      <p className={styles.caption}>
        {isSinging && activeIndex !== null ? "♪ Now singing" : "Syllables"}
      </p>

      <div className={styles.flow}>
        {segments.map((seg, wi) => (
          <span key={`${wi}-${seg.word}`} className={styles.wordGroup}>
            {seg.syllables.map((syl, si) => {
              const idx = globalIndex++;
              const isActive = isSinging && activeIndex === idx;
              const isPast = isSinging && activeIndex !== null && idx < activeIndex;
              const letters = syl.split("");

              return (
                <span
                  key={`${wi}-${si}-${syl}`}
                  ref={isActive ? activeRef : undefined}
                  className={[
                    styles.syllable,
                    isActive ? styles.syllableActive : "",
                    isPast ? styles.syllablePast : "",
                    !isSinging ? styles.syllableIdle : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles.syllableGlow} aria-hidden />
                  <span className={styles.syllableText}>{syl}</span>
                  {isActive && (
                    <span className={styles.letters} aria-hidden>
                      {letters.map((ch, li) => (
                        <span
                          key={`${ch}-${li}`}
                          className={styles.letter}
                          style={{ animationDelay: `${li * 55}ms` }}
                          title={letterToNote(ch)}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              );
            })}
            {wi < segments.length - 1 && (
              <span className={styles.wordGap} aria-hidden>
                ·
              </span>
            )}
          </span>
        ))}
      </div>

      {position && isSinging && activeIndex !== null && (
        <p className={styles.meta}>
          Syllable {activeIndex + 1} of{" "}
          {segments.reduce((n, w) => n + w.syllables.length, 0)}
        </p>
      )}
    </div>
  );
}
