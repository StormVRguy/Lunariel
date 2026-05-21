import { useCallback, useEffect, useRef, useState } from "react";

export interface MicDevice {
  deviceId: string;
  label: string;
}

export interface UseMicMonitor {
  devices: MicDevice[];
  selectedDeviceId: string;
  selectDevice: (id: string) => void;
  volume: number;       // 0–1 RMS level, updated ~60fps
  isMonitoring: boolean;
  stream: MediaStream | null;  // live stream — reuse for MediaRecorder
  startMonitoring: () => Promise<MediaStream | null>;
  stopMonitoring: () => void;
  error: string | null;
}

export function useMicMonitor(): UseMicMonitor {
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [volume, setVolume] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number>(0);
  const monitoringDeviceRef = useRef("");

  const stopMonitoring = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    if (audioCtxRef.current?.state !== "closed") {
      audioCtxRef.current?.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    monitoringDeviceRef.current = "";
    setVolume(0);
    setIsMonitoring(false);
  }, []);

  const startMonitoring = useCallback(
    async (deviceId?: string): Promise<MediaStream | null> => {
      const target = deviceId ?? selectedDeviceId;
      if (monitoringDeviceRef.current === target && isMonitoring) {
        return streamRef.current;
      }

      stopMonitoring();
      setError(null);

      try {
        const constraints: MediaStreamConstraints = {
          audio: target
            ? { deviceId: { exact: target }, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        };

        const liveStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = liveStream;
        setStream(liveStream);
        monitoringDeviceRef.current = target;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(liveStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.fftSize);

        setIsMonitoring(true);

        const tick = () => {
          if (!analyserRef.current || !dataRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataRef.current);
          let sum = 0;
          for (let i = 0; i < dataRef.current.length; i++) {
            const a = (dataRef.current[i] - 128) / 128;
            sum += a * a;
          }
          const rms = Math.sqrt(sum / dataRef.current.length);
          setVolume(Math.min(rms * 5, 1));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return liveStream;
      } catch (err) {
        const e = err as Error;
        setError(
          e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
            ? "Microphone permission denied."
            : `Could not access microphone: ${e.message}`
        );
        return null;
      }
    },
    [selectedDeviceId, isMonitoring, stopMonitoring]
  );

  // Enumerate devices (requires permission — ask once, then list)
  useEffect(() => {
    async function load() {
      try {
        // Trigger permission prompt so device labels are available
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());

        const all = await navigator.mediaDevices.enumerateDevices();
        const inputs: MicDevice[] = all
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${i + 1}`,
          }));
        setDevices(inputs);
        if (inputs.length > 0) {
          setSelectedDeviceId(inputs[0].deviceId);
        }
      } catch {
        // permission denied — user will see error when they try to monitor
      }
    }
    void load();
  }, []);

  // Re-start monitoring when the selected device changes while already monitoring
  const selectDevice = useCallback(
    (id: string) => {
      setSelectedDeviceId(id);
      if (isMonitoring) {
        void startMonitoring(id);
      }
    },
    [isMonitoring, startMonitoring]
  );

  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return {
    devices,
    selectedDeviceId,
    selectDevice,
    volume,
    isMonitoring,
    stream,
    startMonitoring,
    stopMonitoring,
    error,
  };
}
