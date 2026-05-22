/**
 * Book of Remembrance Panel — a collapsible history of past prayers.
 */
import { useState, useCallback, useEffect } from "react";
import {
  retrievePrayerHistory,
  clearRemembrance,
  deleteRecord,
} from "../remembrance/BookOfRemembrance";
import { useSupabaseSession } from "../lib/SupabaseProvider";
import type { PrayerRecord } from "lunariel-core";
import { LunarielSigil } from "./LunarielSigil";
import styles from "./BookOfRemembrancePanel.module.css";

export function BookOfRemembrancePanel() {
  const { userId, ready, configured } = useSupabaseSession();
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<PrayerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    if (!configured) {
      setError("Remembrance is not configured. Set Supabase environment variables.");
      setRecords([]);
      return;
    }
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      setRecords(await retrievePrayerHistory(userId));
    } catch {
      setError("The Book could not be opened.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [configured, userId]);

  useEffect(() => {
    if (isOpen && ready) {
      void loadRecords();
    }
  }, [isOpen, ready, loadRecords]);

  const handleClear = useCallback(async () => {
    if (!userId) return;
    await clearRemembrance(userId);
    setRecords([]);
  }, [userId]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteRecord(userId, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [userId]
  );

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={isOpen ? () => setIsOpen(false) : () => setIsOpen(true)}
        aria-expanded={isOpen}
      >
        {isOpen ? "▲ Close Remembrance" : "▾ Book of Remembrance"}
      </button>

      <div
        className={`${styles.panelShell} ${isOpen ? styles.panelShellOpen : ""}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.panelInner}>
          <div className={styles.panel}>
            <div className={styles.header}>
              <p className={styles.title}>Past Prayers</p>
              {records.length > 0 && userId && (
                <button className={styles.clearBtn} onClick={() => void handleClear()}>
                  Clear remembrance
                </button>
              )}
            </div>

            {loading && <p className={styles.empty}>Opening the book…</p>}
            {error && <p className={styles.empty}>{error}</p>}
            {!loading && !error && records.length === 0 && (
              <p className={styles.empty}>No prayers have been inscribed yet.</p>
            )}
            {!loading && !error && records.length > 0 && (
              <div className={styles.recordList}>
                {records.map((r) => (
                  <div key={r.id} className={styles.record}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => void handleDelete(r.id)}
                      aria-label="Delete this prayer record"
                      title="Remove"
                    >
                      ×
                    </button>
                    <p className={styles.recordMeta}>
                      {new Date(r.timestamp).toLocaleString()}
                    </p>
                    <p className={styles.recordPrayer}>{r.prayer}</p>
                    {r.discernmentNotice && (
                      <p className={styles.recordNotice}>{r.discernmentNotice}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <LunarielSigil />
    </div>
  );
}
