import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_TABLES } from "./tables";

const BACKUP_RETENTION_DAYS = 30;

export async function runDailyBackup(): Promise<{ path: string; tableCount: number; rowCount: number }> {
  const admin = createAdminClient();

  const snapshot: Record<string, unknown[]> = {};
  let rowCount = 0;
  for (const table of ALL_TABLES) {
    const { data, error } = await admin.from(table).select("*");
    if (error) throw new Error(`Failed to export ${table}: ${error.message}`);
    snapshot[table] = data ?? [];
    rowCount += data?.length ?? 0;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `daily/${timestamp}.json`;
  const body = JSON.stringify({ generated_at: new Date().toISOString(), tables: snapshot }, null, 2);

  const { error: uploadError } = await admin.storage.from("backups").upload(path, body, {
    contentType: "application/json",
  });
  if (uploadError) throw new Error(`Failed to upload snapshot: ${uploadError.message}`);

  await pruneOldBackups(admin);

  return { path, tableCount: ALL_TABLES.length, rowCount };
}

async function pruneOldBackups(admin: ReturnType<typeof createAdminClient>) {
  const { data: files } = await admin.storage.from("backups").list("daily");
  if (!files) return;

  const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const stale = files.filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff).map((f) => `daily/${f.name}`);
  if (stale.length > 0) {
    await admin.storage.from("backups").remove(stale);
  }
}
