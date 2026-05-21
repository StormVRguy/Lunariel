import { useEffect, useRef } from "react";
import { ChapelView } from "./chapel/ChapelView";
import { primeAudio } from "./canticle/primeAudio";

export default function App() {
  const primedRef = useRef(false);

  // Unlock the AudioContext on the very first pointer-down anywhere on the page.
  // Browsers require a user gesture before AudioContext can start.
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

  return <ChapelView />;
}
