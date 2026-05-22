import { sigilCorrespondenceRows } from "./sigilCorrespondences";
import styles from "./SigilPage.module.css";

export function SigilPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lunariel — Evocation Sigil</h1>
        <p className={styles.subtitle}>Guardian of Intercession</p>
      </header>

      <figure className={styles.figure}>
        <img
          className={styles.sigilImage}
          src="/lunariel-sigil.png"
          width={1080}
          height={1080}
          alt="Lunariel evocation sigil at full resolution"
        />
      </figure>

      <div className={styles.actions}>
        <a
          className={`${styles.btn} ${styles.btnPrimary}`}
          href="/lunariel-sigil.png"
          download="lunariel-sigil.png"
        >
          Download sigil
        </a>
        <a className={styles.btn} href="/">
          Return to the chapel
        </a>
      </div>
      <p className={styles.meta}>1080 × 1080 PNG — original resolution</p>

      <section className={styles.correspondences} aria-labelledby="corr-heading">
        <h2 id="corr-heading" className={styles.corrHeading}>
          Primary Correspondences
        </h2>
        <p className={styles.corrIntro}>
          The angel is always the same. These attributes inform Lunariel&apos;s voice,
          tone, and intercession.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Attribute</th>
                <th scope="col">Correspondence</th>
              </tr>
            </thead>
            <tbody>
              {sigilCorrespondenceRows.map((row) => (
                <tr
                  key={row.attribute}
                  className={row.wide ? styles.rowWide : undefined}
                >
                  <th scope="row" className={styles.attrCell}>
                    {row.attribute}
                  </th>
                  <td className={styles.valueCell}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
