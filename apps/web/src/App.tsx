import { useEffect, useRef } from "react";
import { usePrayerSession } from "./hooks/usePrayerSession";
import { PrayerControls } from "./components/PrayerControls";
import { primeAudio } from "./audio/organPlayer";

export default function App() {
  const session = usePrayerSession();
  const primedRef = useRef(false);

  // Unlock the AudioContext on the very first pointer-down anywhere on the page.
  // This must happen synchronously inside a user-gesture handler.
  useEffect(() => {
    const unlock = () => {
      if (primedRef.current) return;
      primedRef.current = true;
      void primeAudio();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <PrayerControls
      phase={session.phase}
      latinPrayer={session.latinPrayer}
      activeSyllableIndex={session.activeSyllableIndex}
      error={session.error}
      mic={session.mic}
      onListen={session.onListen}
      onPray={session.onPray}
      onThankYou={session.onThankYou}
    />
  );
}
