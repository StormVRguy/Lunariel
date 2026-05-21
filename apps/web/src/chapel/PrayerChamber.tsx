/**
 * Prayer Chamber — the visible body of the prayer being sung.
 *
 * Displays the prayer broken into syllable chips.
 * The active syllable glows and rises; past syllables fade.
 * When in refrain phase, a badge marks the looping section.
 *
 * The prayer text scrolls to keep the active syllable in view.
 */
import { useEffect, useMemo, useRef } from "react";
import {
  prayerToWordSegments,
  syllableIndexToPosition,
  letterToNote,
} from "../canticle/syllableMap";
import styles from "./PrayerChamber.module.css";

interface Props {
  prayer: string;
  activeIndex: number | null;
  isKeepingVigil: boolean;
  isRefrainPhase: boolean;
}

export function PrayerChamber({ prayer, activeIndex, isKeepingVigil, isRefrainPhase }: Props) {
  const segments = useMemo(() => prayerToWordSegments(prayer), [prayer]);
  const activeRef = useRef<HTMLSpanElement | null>(null);

  const position =
    activeIndex !== null ? syllableIndexToPosition(segments, activeIndex) : null;

  useEffect(() => {
    if (activeRef.current && isKeepingVigil) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex, isKeepingVigil]);

  let globalIndex = 0;

  return (
    <div
      className={`${styles.wrapper} ${isKeepingVigil ? styles.wrapperLive : ""}`}
      aria-live="polite"
      aria-label="Prayer being sung"
    >
      <p className={styles.caption}>
        {isKeepingVigil && activeIndex !== null ? "♪ Singing" : "Prayer"}
        {isRefrainPhase && (
          <span className={styles.refrainBadge} title="The refrain loops as the vigil">
            Refrain
          </span>
        )}
      </p>

      <div className={styles.flow}>
        {segments.map((seg, wi) => (
          <span key={`${wi}-${seg.word}`} className={styles.wordGroup}>
            {seg.syllables.map((syl, si) => {
              const idx = globalIndex++;
              const isActive = isKeepingVigil && activeIndex === idx;
              const isPast = isKeepingVigil && activeIndex !== null && idx < activeIndex;
              const letters = syl.split("");

              return (
                <span
                  key={`${wi}-${si}-${syl}`}
                  ref={isActive ? activeRef : undefined}
                  className={[
                    styles.syllable,
                    isActive ? styles.syllableActive : "",
                    isPast ? styles.syllablePast : "",
                    !isKeepingVigil ? styles.syllableIdle : "",
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
              <span className={styles.wordGap} aria-hidden>·</span>
            )}
          </span>
        ))}
      </div>

      {position && isKeepingVigil && activeIndex !== null && (
        <p className={styles.meta}>
          Syllable {activeIndex + 1} of{" "}
          {segments.reduce((n, w) => n + w.syllables.length, 0)}
        </p>
      )}
    </div>
  );
}
