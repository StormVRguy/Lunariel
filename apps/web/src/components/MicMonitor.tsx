import { useEffect } from "react";
import { UseMicMonitor } from "../hooks/useMicMonitor";
import styles from "./MicMonitor.module.css";

const BAR_COUNT = 16;

interface Props {
  mic: UseMicMonitor;
  active: boolean; // true = currently recording for speech recognition
}

export function MicMonitor({ mic, active }: Props) {
  const { devices, selectedDeviceId, selectDevice, volume, isMonitoring, startMonitoring, stopMonitoring, error } = mic;

  // Auto-start monitoring on mount; stop when hidden
  useEffect(() => {
    void startMonitoring();
    return () => stopMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBarCount = Math.round(volume * BAR_COUNT);

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="mic-select">
          🎙 Microphone
        </label>
        <select
          id="mic-select"
          className={styles.select}
          value={selectedDeviceId}
          onChange={(e) => selectDevice(e.target.value)}
          disabled={devices.length === 0}
        >
          {devices.length === 0 && (
            <option value="">No microphones found</option>
          )}
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`${styles.meter} ${active ? styles.meterActive : ""}`}
        aria-label={`Input level: ${Math.round(volume * 100)}%`}
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const lit = i < activeBarCount;
          // Colour shifts from amber → orange → red at the high end
          const hue = 45 - i * 2.2;
          return (
            <div
              key={i}
              className={`${styles.bar} ${lit ? styles.barLit : ""}`}
              style={
                lit
                  ? { background: `hsl(${hue}, 90%, 55%)`, boxShadow: `0 0 6px hsl(${hue}, 90%, 40%)` }
                  : undefined
              }
            />
          );
        })}
      </div>

      {!isMonitoring && !error && (
        <p className={styles.hint}>Starting microphone…</p>
      )}
      {error && <p className={styles.micError}>{error}</p>}
    </div>
  );
}
