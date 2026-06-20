"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { isDirector } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { runDailyBackup } from "@/lib/backup/snapshot";

export async function getBackupDownloadUrl(path: string): Promise<string | null> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("backups").createSignedUrl(`daily/${path}`, 60 * 5);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function runBackupNow(): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can trigger a backup." };

  try {
    const result = await runDailyBackup();
    await logAudit({
      actorId: user.id,
      action: "created",
      resourceType: "backup",
      resourceName: result.path,
      newValue: { tableCount: result.tableCount, rowCount: result.rowCount },
    });
    revalidatePath("/settings/backups");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Backup failed." };
  }
}
