import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { DeclareForm } from "./declare-form";
import { ResolveForm } from "./resolve-form";
import type { ConflictEntry } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-danger/15 text-danger",
  under_review: "bg-warning/15 text-warning",
  resolved: "bg-success/15 text-success",
  noted: "bg-muted text-text-muted",
};

export default async function ConflictsPage() {
  const user = await getCurrentStaffUser();
  const canManage = user.role === "director" || user.role === "compliance_officer";
  const supabase = await createClient();

  let query = supabase.from("conflict_register").select("*").order("created_at", { ascending: false });
  if (!canManage) query = query.eq("reported_by", user.id);
  const [{ data: conflicts }, { data: portfolios }] = await Promise.all([
    query,
    supabase.from("portfolio_companies").select("id, name").order("name"),
  ]);
  const rows = (conflicts ?? []) as ConflictEntry[];

  const reporterIds = [...new Set(rows.map((c) => c.reported_by).filter(Boolean))];
  const { data: people } = reporterIds.length
    ? await supabase.from("users").select("id, full_name").in("id", reporterIds as string[])
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Conflict of Interest Register</h1>

      <DeclareForm portfolios={portfolios ?? []} />

      {rows.length === 0 ? (
        <EmptyState message="No conflicts declared." />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-md border border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.description}</p>
                  <p className="text-xs text-text-muted">
                    Reported by {nameById.get(c.reported_by ?? "") ?? "—"} · {c.conflict_type ?? "—"}
                    {c.parties_involved && ` · ${c.parties_involved}`}
                  </p>
                </div>
                <Badge className={cn("border-0 capitalize", STATUS_STYLES[c.status])}>
                  {c.status.replace("_", " ")}
                </Badge>
              </div>
              {c.resolution && <p className="mt-2 text-xs text-text-muted">Resolution: {c.resolution}</p>}
              {canManage && c.status !== "resolved" && <ResolveForm conflictId={c.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
