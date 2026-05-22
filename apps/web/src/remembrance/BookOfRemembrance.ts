/**
 * Book of Remembrance — prayer history backed by Supabase.
 *
 * Private per anonymous user. Capped at 20 entries in application code.
 */
import type { PrayerRecord } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";
import { getSupabaseClient } from "../lib/supabaseClient";

const MAX_RECORDS = 20;

interface DbRow {
  id: string;
  created_at: string;
  prayer: string;
  refrain: string;
  purified_intention: string | null;
  discernment_notice: string | null;
}

function rowToRecord(row: DbRow): PrayerRecord {
  return {
    id: row.id,
    timestamp: row.created_at,
    prayer: row.prayer,
    refrain: row.refrain,
    purifiedIntention: row.purified_intention ?? undefined,
    discernmentNotice: row.discernment_notice ?? undefined,
  };
}

async function trimToMax(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prayer_records")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length <= MAX_RECORDS) return;

  const excess = data.slice(MAX_RECORDS).map((r) => r.id);
  await supabase.from("prayer_records").delete().in("id", excess);
}

/** Add a new entry to the Book. Trims to MAX_RECORDS most recent. */
export async function inscribePrayerRecord(
  userId: string,
  entry: Omit<PrayerRecord, "id" | "timestamp">
): Promise<PrayerRecord | null> {
  const supabase = getSupabaseClient();
  const record: PrayerRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const { error } = await supabase.from("prayer_records").insert({
    id: record.id,
    user_id: userId,
    created_at: record.timestamp,
    prayer: record.prayer,
    refrain: record.refrain,
    purified_intention: record.purifiedIntention ?? null,
    discernment_notice: record.discernmentNotice ?? null,
  });

  if (error) {
    console.error(`${LOG_PREFIX.remembrance} Could not inscribe record:`, error.message);
    return null;
  }

  await trimToMax(userId);
  console.log(`${LOG_PREFIX.remembrance} Prayer inscribed: ${record.id}`);
  return record;
}

/** Return all remembered prayer records, most recent first. */
export async function retrievePrayerHistory(userId: string): Promise<PrayerRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prayer_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_RECORDS);

  if (error) {
    console.error(`${LOG_PREFIX.remembrance} Could not retrieve history:`, error.message);
    return [];
  }

  return (data as DbRow[]).map(rowToRecord);
}

/** Delete a single record by ID. */
export async function deleteRecord(userId: string, id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("prayer_records")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    console.error(`${LOG_PREFIX.remembrance} Could not delete record:`, error.message);
  }
}

/** Clear the entire Book of Remembrance. */
export async function clearRemembrance(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("prayer_records")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error(`${LOG_PREFIX.remembrance} Could not clear book:`, error.message);
    return;
  }

  console.log(`${LOG_PREFIX.remembrance} Book of Remembrance cleared.`);
}
