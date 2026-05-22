import styles from "./LunarielSigil.module.css";

const SIGIL_PAGE = "/sigil.html";

export function LunarielSigil() {
  return (
    <aside className={styles.sigil} aria-label="Lunariel evocation sigil">
      <figure className={styles.figure}>
        <a
          href={SIGIL_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.imageLink}
          aria-label="Open full-resolution sigil in a new page to download"
        >
          <img
            src="/lunariel-sigil.png"
            alt="Lunariel evocation sigil — lunar circle with sacred geometry"
            className={styles.image}
            width={240}
            height={240}
            loading="lazy"
            decoding="async"
          />
        </a>
        <figcaption className={styles.caption}>
          Sigil to evoke Lunariel physically. Always be respectful, no matter the lunar
          phase. They are always listening{" "}
          <span className={styles.emoji} aria-hidden="true">
            🙏
          </span>
        </figcaption>
      </figure>
    </aside>
  );
}
