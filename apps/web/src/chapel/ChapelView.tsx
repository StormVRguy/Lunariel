/**
 * Chapel View — Lunariel's sanctuary.
 *
 * Layout:
 *   Top bar    — name, subtitle, mic toggle
 *   Mic panel  — slides in on demand or when receiving
 *   Hero       — Lunariel's spirit, large and centred
 *   Status     — vigil state label + instruction, large text
 *   Controls   — contextual action buttons
 *   Separator  — ritual hairline
 *   Prayer     — syllable chamber, full width
 *   Footer     — Book of Remembrance
 */
import { useState, useEffect } from "react";
import { useGuardianCore } from "../guardian/useGuardianCore";
import { HaloDisplay } from "./HaloDisplay";
import { PetitionAltar } from "./PetitionAltar";
import { DiscernmentNotice } from "./DiscernmentNotice";
import { VigilControls } from "./VigilControls";
import { PrayerChamber } from "./PrayerChamber";
import { LunarielSpirit } from "./LunarielSpirit";
import { SacredColumn } from "./SacredColumn";
import { BookOfRemembrancePanel } from "./BookOfRemembrancePanel";
import { VigilCounter } from "./VigilCounter";
import { MicMonitor } from "../components/MicMonitor";
import styles from "./ChapelView.module.css";

const PRAYER_VISIBLE_STATES = new Set([
  "readyToSing",
  "keepingVigil",
  "sacredSilence",
  "vigilClosed",
]);

export function ChapelView() {
  const core = useGuardianCore();

  // Mic panel: user-toggled OR auto-opened while recording
  const [micOpen, setMicOpen] = useState(false);
  useEffect(() => {
    if (core.petitionChamber.isReceiving) setMicOpen(true);
  }, [core.petitionChamber.isReceiving]);

  const showPrayer =
    core.activePrayer.length > 0 && PRAYER_VISIBLE_STATES.has(core.vigilState);

  const isVigil = core.vigilState === "keepingVigil";

  return (
    <main className={styles.chapel}>

      {/* ── Sacred columns — fixed flanking pillars ───────────────── */}
      <div className={`${styles.columnWrap} ${styles.columnWrapLeft}`}>
        <SacredColumn isActive={isVigil} />
      </div>
      <div className={`${styles.columnWrap} ${styles.columnWrapRight}`}>
        <SacredColumn isActive={isVigil} mirror />
      </div>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.topBarSpacer} aria-hidden />
        <div className={styles.topActions}>
          <button
            className={`${styles.micToggle} ${micOpen ? styles.micToggleOpen : ""}`}
            onClick={() => setMicOpen((v) => !v)}
            aria-expanded={micOpen}
            aria-label="Toggle voice settings"
          >
            {micOpen ? "◈ Voice ▴" : "◈ Voice"}
          </button>
        </div>
      </header>

      {/* ── Mic panel ─────────────────────────────────────────────── */}
      <div
        className={`${styles.micPanel} ${micOpen ? styles.micPanelOpen : ""}`}
        aria-hidden={!micOpen}
      >
        <MicMonitor mic={core.petitionChamber.mic} active={core.petitionChamber.isReceiving} />
      </div>

      {/* ── Hero: spirit + identity ───────────────────────────────── */}
      <section className={styles.hero} aria-label="Lunariel">
        <div className={styles.heroSpirit}>
          <LunarielSpirit isActive={isVigil} />
        </div>
        <div className={`${styles.heroIdentity} ${isVigil ? styles.heroIdentityVigil : ""}`}>
          <p className={styles.heroName}>Lunariel</p>
          <p className={styles.heroDivider} aria-hidden>◈</p>
          <p className={styles.heroTitle}>Guardian of Intercession</p>
          <div className={styles.heroOffer}>
            <PetitionAltar
              vigilState={core.vigilState}
              isReceiving={core.petitionChamber.isReceiving}
              hasPrayer={core.activePrayer.length > 0}
              onOfferPetition={core.offerPetition}
            />
          </div>
        </div>
      </section>

      {/* ── Status text ───────────────────────────────────────────── */}
      <section className={styles.status} aria-live="polite">
        <HaloDisplay vigilState={core.vigilState} />
      </section>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {core.error && (
        <p className={styles.errorBanner} role="alert">{core.error}</p>
      )}

      {/* ── Discernment ───────────────────────────────────────────── */}
      {core.discernmentNotice && (
        <div className={styles.discernmentWrap}>
          <DiscernmentNotice notice={core.discernmentNotice} />
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────── */}
      <div className={styles.controls}>
        <VigilControls
          vigilState={core.vigilState}
          onBeginVigil={core.beginVigil}
          onEnterSacredSilence={core.enterSacredSilence}
          onResumeVigil={core.resumeVigil}
          onCloseVigil={core.closeVigil}
        />
      </div>

      {/* ── Ritual separator + prayer ─────────────────────────────── */}
      {showPrayer && (
        <>
          <div className={styles.ritual} aria-hidden />
          <div className={styles.prayerZone}>
            <PrayerChamber
              prayer={core.isRefrainPhase ? core.activeRefrain : core.activePrayer}
              activeIndex={core.activeSyllableIndex}
              isKeepingVigil={isVigil}
              isRefrainPhase={core.isRefrainPhase}
            />
          </div>
        </>
      )}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <BookOfRemembrancePanel />
        <VigilCounter isKeepingVigil={isVigil} />
      </footer>

    </main>
  );
}
