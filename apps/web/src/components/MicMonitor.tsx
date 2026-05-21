import { useEffect } from "react";
import { UseMicMonitor } from "../hooks/useMicMonitor";
import styles from "./MicMonitor.module.css";

const BAR_COUNT = 16;

interface Props {
  mic: UseMicMonitor;
  active: boolean;
}

export function MicMonitor({ mic, active }: Props) {
  const {
    devices,
    selectedDeviceId,
    selectDevice,
    volume,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    error,
  } = mic;

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
          Voice
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
        className={styles.meter}
        aria-label={`Input level: ${Math.round(volume * 100)}%`}
        aria-hidden={!active}
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const lit = i < activeBarCount;
          // Shift from lunar blue toward rose as volume rises
          const hue = 220 - i * 4;
          return (
            <div
              key={i}
              className={`${styles.bar} ${lit ? styles.barLit : ""}`}
              style={
                lit
                  ? {
                      background: `hsl(${hue}, 50%, 62%)`,
                      boxShadow: `0 0 5px hsl(${hue}, 50%, 70%)`,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      {!isMonitoring && !error && (
        <p className={styles.hint}>Opening the chamber…</p>
      )}
      {error && <p className={styles.micError}>{error}</p>}
    </div>
  );
}
