import { useCallback, useEffect, useRef, useState } from "react";
// useSpeechListen removed — replaced by MediaRecorder + Gemini audio transcription
import { useMicMonitor, UseMicMonitor } from "./useMicMonitor";
import { useAudioRecorder, blobToBase64 } from "./useAudioRecorder";
import { organPlayer } from "../audio/organPlayer";

export type Phase =
  | "idle"
  | "listening"
  | "generating"
  | "prayerReady"
  | "singing";

interface PrayerSession {
  phase: Phase;
  latinPrayer: string;
  activeSyllableIndex: number | null;
  lang: string;
  error: string | null;
  mic: UseMicMonitor;
  onListen: () => void;
  onPray: () => void;
  onThankYou: () => void;
}

export function usePrayerSession(): PrayerSession {
  const [phase, _setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    _setPhase(p);
  };

  const [latinPrayer, setLatinPrayer] = useState("");
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mic = useMicMonitor();
  const recorder = useAudioRecorder();

  // Handle recording completion → send audio to API
  useEffect(() => {
    recorder.onStop(async ({ blob, mimeType }) => {
      setPhase("generating");
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let prayer: string;
        const mockPrayer = import.meta.env.VITE_MOCK_PRAYER === "true";

        if (mockPrayer) {
          await new Promise((r) => setTimeout(r, 800));
          prayer =
            "Domine Deus, exaudi orationem meam. Miserere nobis peccatoribus et da nobis pacem. Fiat voluntas tua in saecula saeculorum.";
        } else {
          const base64 = await blobToBase64(blob);
          const res = await fetch("/api/prayer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, mimeType }),
            signal: controller.signal,
          });
          const data = (await res.json()) as { prayer?: string; error?: string };
          if (!res.ok || !data.prayer) {
            throw new Error(data.error ?? "Failed to generate prayer");
          }
          prayer = data.prayer;
        }

        setLatinPrayer(prayer);
        setPhase("prayerReady");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setPhase("idle");
      }
    });
    // onStop registers a stable ref — only needs to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onListen = useCallback(() => {
    if (phase === "generating" || phase === "singing") return;
    setError(null);

    if (!recorder.isRecording) {
      setPhase("listening");
      if (mic.stream) {
        recorder.start(mic.stream);
      } else {
        // Stream not ready yet — open it, then start recording once it resolves
        void mic.startMonitoring().then((s) => {
          if (s) recorder.start(s);
        });
      }
    } else {
      recorder.stop();
      // phase transitions to "generating" inside the onStop callback
    }
  }, [phase, recorder, mic]);

  const onPray = useCallback(() => {
    if (phase !== "prayerReady" || !latinPrayer) return;
    if (organPlayer.isSinging) return;
    setPhase("singing");
    setError(null);
    setActiveSyllableIndex(null);
    void organPlayer
      .play(latinPrayer, {
        onSyllable: (index) => setActiveSyllableIndex(index),
        onRest: () => setActiveSyllableIndex(null),
      })
      .catch((err) => {
        setError((err as Error).message);
        setPhase("prayerReady");
        setActiveSyllableIndex(null);
      });
  }, [phase, latinPrayer]);

  const onThankYou = useCallback(() => {
    if (phase !== "singing") return;
    organPlayer.stop();
    setActiveSyllableIndex(null);
    setPhase("prayerReady");
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      organPlayer.stop();
    };
  }, []);

  return {
    phase,
    latinPrayer,
    activeSyllableIndex,
    lang: "audio",
    error,
    mic,
    onListen,
    onPray,
    onThankYou,
  };
}
