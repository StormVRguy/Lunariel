/**
 * Discernment Notice — shown when the guardian has returned a petition to the light.
 *
 * Coercive or harmful petitions are not rejected: they are transmuted toward
 * consent, peace, healing, and freedom. This panel shows that transformation gently.
 */
import styles from "./DiscernmentNotice.module.css";

interface Props {
  notice: string;
}

export function DiscernmentNotice({ notice }: Props) {
  return (
    <div className={styles.wrapper} role="note" aria-label="Discernment notice">
      <p className={styles.label}>Returned to the light</p>
      <p className={styles.notice}>{notice}</p>
    </div>
  );
}
