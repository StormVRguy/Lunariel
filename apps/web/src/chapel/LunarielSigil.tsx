import styles from "./LunarielSigil.module.css";

export function LunarielSigil() {
  return (
    <aside className={styles.sigil} aria-label="Lunariel evocation sigil">
      <figure className={styles.figure}>
        <img
          src="/lunariel-sigil.png"
          alt="Lunariel evocation sigil — lunar circle with sacred geometry"
          className={styles.image}
          width={240}
          height={240}
          loading="lazy"
          decoding="async"
        />
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
