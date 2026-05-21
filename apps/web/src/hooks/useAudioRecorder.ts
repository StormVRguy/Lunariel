import { useCallback, useRef, useState } from "react";

export interface RecordingResult {
  blob: Blob;
  mimeType: string; // e.g. "audio/webm"
}

interface UseAudioRecorder {
  isRecording: boolean;
  start: (stream: MediaStream) => void;
  stop: () => void;
  onStop: (handler: (result: RecordingResult) => void) => void;
}

export function useAudioRecorder(): UseAudioRecorder {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onStopRef = useRef<((r: RecordingResult) => void) | null>(null);

  const onStop = useCallback((handler: (r: RecordingResult) => void) => {
    onStopRef.current = handler;
  }, []);

  const start = useCallback((stream: MediaStream) => {
    if (isRecording) return;

    chunksRef.current = [];

    // Pick best supported format; fall back to browser default
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const raw = recorder.mimeType || mimeType || "audio/webm";
      // Strip codec parameters — Gemini API expects clean MIME type
      const cleanMime = raw.split(";")[0];
      const blob = new Blob(chunksRef.current, { type: cleanMime });
      onStopRef.current?.({ blob, mimeType: cleanMime });
      setIsRecording(false);
    };

    // Collect chunks every 250ms so onstop gets all data
    recorder.start(250);
    setIsRecording(true);
  }, [isRecording]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  return { isRecording, start, stop, onStop };
}

/** Convert a Blob to a base64 string (without the data-URL prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
