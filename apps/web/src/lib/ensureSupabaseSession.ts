import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";

const LEGACY_STORAGE_KEY = "lunariel.remembrance";
const MIGRATION_FLAG = "lunariel.remembrance.migrated";

interface LegacyRecord {
  id: string;
  timestamp: string;
  prayer: string;
  refrain: string;
  purifiedIntention?: string;
  discernmentNotice?: string;
}

export async function migrateLocalRemembrance(userId: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, "1");
    return;
  }

  let legacy: LegacyRecord[];
  try {
    legacy = JSON.parse(raw) as LegacyRecord[];
  } catch {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(MIGRATION_FLAG, "1");
    return;
  }

  if (legacy.length === 0) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(MIGRATION_FLAG, "1");
    return;
  }

  const supabase = getSupabaseClient();
  const rows = legacy.map((r) => ({
    id: r.id,
    user_id: userId,
    created_at: r.timestamp,
    prayer: r.prayer,
    refrain: r.refrain,
    purified_intention: r.purifiedIntention ?? null,
    discernment_notice: r.discernmentNotice ?? null,
  }));

  const { error } = await supabase.from("prayer_records").insert(rows);
  if (error) {
    console.warn("[Lunariel:BookOfRemembrance] Legacy migration failed:", error.message);
    return;
  }

  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.setItem(MIGRATION_FLAG, "1");
}

export async function ensureSupabaseSession(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseClient();
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user) {
    await migrateLocalRemembrance(existing.session.user.id);
    return existing.session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("[Lunariel:Supabase] Anonymous sign-in failed:", error?.message);
    return null;
  }

  await migrateLocalRemembrance(data.user.id);
  return data.user.id;
}
