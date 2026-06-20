import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { BackupList } from "./backup-list";

export default async function BackupsPage() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: files } = await supabase.storage.from("backups").list("daily", {
    sortBy: { column: "created_at", order: "desc" },
  });

  const rows = (files ?? [])
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => ({
      name: f.name,
      createdAt: f.created_at ?? null,
      sizeBytes: (f.metadata as { size?: number } | null)?.size ?? null,
    }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Backups</h1>
        <p className="text-sm text-text-muted">
          Full database snapshots, separate from the per-module exports in Data Export — this is the disaster
          recovery copy of everything: every table, every row.
        </p>
      </div>
      <BackupList files={rows} />
    </div>
  );
}
