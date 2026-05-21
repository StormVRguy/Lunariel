/**
 * Book of Remembrance — Lunariel's minimal prayer history.
 *
 * The guardian inscribes each completed prayer cycle in local storage.
 * The book is private, user-controllable, and capped at 20 entries.
 * No audio blobs are stored — only text and timestamps.
 */
import type { PrayerRecord } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";

const STORAGE_KEY = "lunariel.remembrance";
const MAX_RECORDS = 20;

function loadRecords(): PrayerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrayerRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: PrayerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error(`${LOG_PREFIX.remembrance} Could not inscribe record:`, err);
  }
}

/** Add a new entry to the Book. Trims to MAX_RECORDS most recent. */
export function inscribePrayerRecord(
  entry: Omit<PrayerRecord, "id" | "timestamp">
): PrayerRecord {
  const record: PrayerRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const records = loadRecords();
  records.unshift(record);
  saveRecords(records.slice(0, MAX_RECORDS));

  console.log(`${LOG_PREFIX.remembrance} Prayer inscribed: ${record.id}`);
  return record;
}

/** Return all remembered prayer records, most recent first. */
export function retrievePrayerHistory(): PrayerRecord[] {
  return loadRecords();
}

/** Delete a single record by ID. */
export function deleteRecord(id: string): void {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
}

/** Clear the entire Book of Remembrance. */
export function clearRemembrance(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log(`${LOG_PREFIX.remembrance} Book of Remembrance cleared.`);
}
