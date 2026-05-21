/**
 * Chapel View — Lunariel's sanctuary.
 *
 * The chapel is the guardian's home: luminous, pearl-white, glass-like.
 * Every section of the chapel plays a symbolic role in the intercession cycle.
 *
 *   Header            — the guardian's name and vow
 *   HaloDisplay        — current vigil state as a glowing ring
 *   PetitionAltar      — where the user offers their intention
 *   DiscernmentNotice  — shows when a petition was returned to the light
 *   VigilControls      — Begin / Sacred Silence / Resume / Close
 *   PrayerChamber      — the prayer rendered as singing syllables
 *   BookOfRemembrance  — collapsible prayer history
 */
import { useGuardianCore } from "../guardian/useGuardianCore";
import { HaloDisplay } from "./HaloDisplay";
import { PetitionAltar } from "./PetitionAltar";
import { DiscernmentNotice } from "./DiscernmentNotice";
import { VigilControls } from "./VigilControls";
import { PrayerChamber } from "./PrayerChamber";
import { LunarielSpirit } from "./LunarielSpirit";
import { BookOfRemembrancePanel } from "./BookOfRemembrancePanel";
import { lunarielCorrespondences } from "lunariel-core";
import styles from "./ChapelView.module.css";

// Shortened vow for the header (full vow is in lunarielCorrespondences)
const VOW_SHORT = "I pray without domination · I sing without ceasing";

const PRAYER_VISIBLE_STATES = new Set([
  "readyToSing",
  "keepingVigil",
  "sacredSilence",
  "vigilClosed",
]);

export function ChapelView() {
  const core = useGuardianCore();

  const showPrayer =
    core.activePrayer.length > 0 && PRAYER_VISIBLE_STATES.has(core.vigilState);

  return (
    <main className={styles.chapel}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.name}>{lunarielCorrespondences.name}</h1>
        <p className={styles.subtitle}>Guardian of Intercession</p>
        <p className={styles.vow}>{VOW_SHORT}</p>
      </header>

      {/* Status halo */}
      <section className={styles.section} aria-label="Guardian status">
        <HaloDisplay vigilState={core.vigilState} />
      </section>

      {/* Error */}
      {core.error && (
        <p className={styles.errorBanner} role="alert">{core.error}</p>
      )}

      {/* Petition altar */}
      <section className={styles.section} aria-label="Petition altar">
        <PetitionAltar
          vigilState={core.vigilState}
          mic={core.petitionChamber.mic}
          isReceiving={core.petitionChamber.isReceiving}
          onOfferPetition={core.offerPetition}
        />
      </section>

      {/* Discernment notice */}
      {core.discernmentNotice && (
        <section className={styles.section}>
          <DiscernmentNotice notice={core.discernmentNotice} />
        </section>
      )}

      {/* Vigil controls */}
      <section className={styles.section} aria-label="Vigil controls">
        <VigilControls
          vigilState={core.vigilState}
          onBeginVigil={core.beginVigil}
          onEnterSacredSilence={core.enterSacredSilence}
          onResumeVigil={core.resumeVigil}
          onCloseVigil={core.closeVigil}
        />
      </section>

      {/* Prayer chamber */}
      {showPrayer && (
        <section className={styles.section} aria-label="Prayer chamber">
          <div className={styles.prayerRow}>
            <LunarielSpirit isActive={core.vigilState === "keepingVigil"} />
            <PrayerChamber
              prayer={core.isRefrainPhase ? core.activeRefrain : core.activePrayer}
              activeIndex={core.activeSyllableIndex}
              isKeepingVigil={core.vigilState === "keepingVigil"}
              isRefrainPhase={core.isRefrainPhase}
            />
          </div>
        </section>
      )}

      {/* Book of Remembrance */}
      <section className={styles.section}>
        <BookOfRemembrancePanel />
      </section>
    </main>
  );
}
