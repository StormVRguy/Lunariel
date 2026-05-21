import { useCallback, useEffect, useRef, useState } from "react";

type SpeechListenResult =
  | { ok: true; transcript: string }
  | { ok: false; error: string };

interface UseSpeechListen {
  isListening: boolean;
  interimText: string;
  lang: string;
  toggle: () => void;
  onFinish: (handler: (result: SpeechListenResult) => void) => void;
  error: string | null;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Language for speech recognition. Override via ?lang=it-IT in the URL
// or by setting VITE_SPEECH_LANG in apps/web/.env.local
function detectLang(): string {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("lang");
  if (fromUrl) return fromUrl;
  const fromEnv = import.meta.env.VITE_SPEECH_LANG as string | undefined;
  if (fromEnv) return fromEnv;
  // Default to English so the recognizer works regardless of OS locale
  return "en-US";
}

export function useSpeechListen(): UseSpeechListen {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lang = detectLang();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalsRef = useRef<string[]>([]);
  const interimRef = useRef(""); // fallback: last interim text seen
  const onFinishRef = useRef<((r: SpeechListenResult) => void) | null>(null);
  const stoppingRef = useRef(false);

  const onFinish = useCallback((handler: (r: SpeechListenResult) => void) => {
    onFinishRef.current = handler;
  }, []);

  const buildRecognition = useCallback((): SpeechRecognition | null => {
    const Ctor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
    if (!Ctor) return null;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalsRef.current.push(result[0].transcript);
          interimRef.current = "";
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) interimRef.current = interim;
      setInterimText(interim);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" and "no-speech" are normal in continuous mode — let onend handle restart
      if (event.error === "aborted" || event.error === "no-speech") return;
      const msg =
        event.error === "not-allowed"
          ? "Microphone permission denied. Please allow microphone access."
          : event.error === "network"
          ? "Network error: Chrome speech recognition requires internet access."
          : `Speech recognition error: ${event.error}`;
      setError(msg);
      setIsListening(false);
      stoppingRef.current = false;
    };

    rec.onend = () => {
      if (stoppingRef.current) {
        stoppingRef.current = false;
        // Use finals if available; fall back to the last interim text Chrome had
        // (Chrome doesn't always finalize interim results when stop() is called)
        const fromFinals = finalsRef.current.join(" ").trim();
        const transcript = fromFinals || interimRef.current.trim();
        setIsListening(false);
        setInterimText("");
        finalsRef.current = [];
        interimRef.current = "";
        if (onFinishRef.current) {
          onFinishRef.current(
            transcript.length > 0
              ? { ok: true, transcript }
              : { ok: false, error: "No speech was detected. Try speaking closer to your microphone." }
          );
        }
      } else {
        // Browser auto-stopped (e.g. silence timeout) — restart if still "listening"
        setIsListening((prev) => {
          if (prev) {
            try {
              recognitionRef.current?.start();
            } catch {
              // already started
            }
          }
          return prev;
        });
      }
    };

    return rec;
  }, []);

  const toggle = useCallback(() => {
    setError(null);
    if (!isListening) {
      const Ctor =
        window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
      if (!Ctor) {
        setError(
          "Speech recognition is not supported in this browser. Use Chrome or Edge."
        );
        return;
      }
      finalsRef.current = [];
      interimRef.current = "";
      stoppingRef.current = false;
      const rec = buildRecognition()!;
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } else {
      stoppingRef.current = true;
      recognitionRef.current?.stop();
    }
  }, [isListening, buildRecognition]);

  useEffect(() => {
    return () => {
      stoppingRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return { isListening, interimText, lang, toggle, onFinish, error };
}
