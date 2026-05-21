/**
 * Petition Chamber — the user's voice entering the guardian's presence.
 *
 * Wraps microphone monitoring and audio recording.
 * When the user offers a petition, the chamber opens the mic and records.
 * When the user finishes, it closes and returns the recording for discernment.
 */
import { useMicMonitor, UseMicMonitor } from "../hooks/useMicMonitor";
import { useAudioRecorder, RecordingResult } from "../hooks/useAudioRecorder";
import { useCallback, useEffect } from "react";

export interface PetitionChamberState {
  mic: UseMicMonitor;
  isReceiving: boolean;
  /** Open the chamber and begin recording. */
  openChamber: () => void;
  /** Close the chamber; fires the onPetitionReceived callback with the audio. */
  closeChamber: () => void;
  /** Register a callback that receives the audio blob when recording stops. */
  onPetitionReceived: (handler: (result: RecordingResult) => void) => void;
}

export function usePetitionChamber(): PetitionChamberState {
  const mic = useMicMonitor();
  const recorder = useAudioRecorder();

  // Warm up the microphone on mount so the first offer is fast
  useEffect(() => {
    void mic.startMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChamber = useCallback(() => {
    if (recorder.isRecording) return;
    if (mic.stream) {
      recorder.start(mic.stream);
    } else {
      void mic.startMonitoring().then((stream) => {
        if (stream) recorder.start(stream);
      });
    }
  }, [recorder, mic]);

  const closeChamber = useCallback(() => {
    recorder.stop();
  }, [recorder]);

  return {
    mic,
    isReceiving: recorder.isRecording,
    openChamber,
    closeChamber,
    onPetitionReceived: recorder.onStop,
  };
}
