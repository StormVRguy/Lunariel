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
import { prayerToWordSegments, getLetterTune } from "../canticle/syllableMap";
import styles from "./PrayerChamber.module.css";

interface Props {
  prayer: string;
  activeIndex: number | null;
  isKeepingVigil: boolean;
  isRefrainPhase: boolean;
}

export function PrayerChamber({ prayer, activeIndex, isKeepingVigil, isRefrainPhase }: Props) {
  const segments = useMemo(() => prayerToWordSegments(prayer), [prayer]);
  const flowRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement | null>(null);

  const totalSyllables = useMemo(
    () => segments.reduce((n, w) => n + w.syllables.length, 0),
    [segments]
  );

  // Scroll vertically only — never pan horizontally (that caused the flicker).
  useEffect(() => {
    const flow = flowRef.current;
    const el = activeRef.current;
    if (!flow || !el || !isKeepingVigil) return;

    const flowRect = flow.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetTop =
      flow.scrollTop +
      (elRect.top - flowRect.top) -
      flow.clientHeight / 2 +
      elRect.height / 2;

    flow.scrollTo({
      top: Math.max(0, targetTop),
      left: 0,
      behavior: "smooth",
    });
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

      <div className={styles.flow} ref={flowRef}>
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
                  <span
                    className={`${styles.letters} ${isActive ? "" : styles.lettersHidden}`}
                    aria-hidden={!isActive}
                  >
                    {letters.map((ch, li) => (
                      <span
                        key={`${ch}-${li}`}
                        className={styles.letter}
                        style={isActive ? { animationDelay: `${li * 55}ms` } : undefined}
                        title={isActive ? getLetterTune(ch).label : undefined}
                      >
                        {ch}
                      </span>
                    ))}
                  </span>
                </span>
              );
            })}
            {wi < segments.length - 1 && (
              <span className={styles.wordGap} aria-hidden>·</span>
            )}
          </span>
        ))}
      </div>

      <p
        className={`${styles.meta} ${isKeepingVigil && activeIndex !== null ? "" : styles.metaHidden}`}
        aria-hidden={!(isKeepingVigil && activeIndex !== null)}
      >
        {activeIndex !== null
          ? `Syllable ${activeIndex + 1} of ${totalSyllables}`
          : "\u00a0"}
      </p>
    </div>
  );
}
