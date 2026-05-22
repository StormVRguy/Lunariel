import { useEffect, useRef, useState } from "react";
import { ChapelView } from "./chapel/ChapelView";
import { SigilPage } from "./chapel/SigilPage";
import { primeAudio } from "./canticle/primeAudio";

function isSigilRoute(): boolean {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return path === "/sigil" || path.endsWith("/sigil.html");
}

export default function App() {
  const [showSigil] = useState(isSigilRoute);
  const primedRef = useRef(false);

  useEffect(() => {
    if (showSigil) return;
    const unlock = () => {
      if (primedRef.current) return;
      primedRef.current = true;
      void primeAudio();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, [showSigil]);

  if (showSigil) {
    return <SigilPage />;
  }

  return <ChapelView />;
}
