import { useVigilPresence } from "../presence/useVigilPresence";
import styles from "./VigilCounter.module.css";

interface VigilCounterProps {
  isKeepingVigil: boolean;
}

function formatCount(count: number): string {
  if (count === 1) return "1 prayer being sung now";
  return `${count} prayers being sung now`;
}

export function VigilCounter({ isKeepingVigil }: VigilCounterProps) {
  const count = useVigilPresence(isKeepingVigil);

  return (
    <p className={styles.counter} aria-live="polite">
      {formatCount(count)}
    </p>
  );
}
