/**
 * Book of Remembrance Panel — a collapsible history of past prayers.
 *
 * The book is private and user-controlled. It can be cleared at any time.
 * It displays each prayer that Lunariel has sung, with timestamps.
 */
import { useState, useCallback } from "react";
import {
  retrievePrayerHistory,
  clearRemembrance,
  deleteRecord,
} from "../remembrance/BookOfRemembrance";
import type { PrayerRecord } from "lunariel-core";
import styles from "./BookOfRemembrancePanel.module.css";

export function BookOfRemembrancePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<PrayerRecord[]>([]);

  const open = useCallback(() => {
    setRecords(retrievePrayerHistory());
    setIsOpen(true);
  }, []);

  const handleClear = useCallback(() => {
    clearRemembrance();
    setRecords([]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={isOpen ? () => setIsOpen(false) : open}
        aria-expanded={isOpen}
      >
        {isOpen ? "▲ Close Remembrance" : "▾ Book of Remembrance"}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <p className={styles.title}>Past Prayers</p>
            {records.length > 0 && (
              <button className={styles.clearBtn} onClick={handleClear}>
                Clear remembrance
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <p className={styles.empty}>No prayers have been inscribed yet.</p>
          ) : (
            <div className={styles.recordList}>
              {records.map((r) => (
                <div key={r.id} className={styles.record}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(r.id)}
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
      )}
    </div>
  );
}
