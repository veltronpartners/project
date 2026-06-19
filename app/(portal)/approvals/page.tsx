import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  declined: "bg-danger/15 text-danger",
  more_info_requested: "bg-muted text-text-muted",
};

export default async function ApprovalsQueuePage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  let query = supabase.from("approval_requests").select("*").order("created_at", { ascending: false });
  if (user.role !== "director") {
    query = query.eq("routed_to_user_id", user.id);
  }
  const { data: requests } = await query;
  const rows = requests ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Approvals</h1>
      <p className="text-sm text-text-muted">
        Nothing irreversible or company-defining leaves Veltron without sign-off here.
      </p>

      {rows.length === 0 ? (
        <EmptyState message="No approval requests right now." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/approvals/${r.id}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <div className="text-sm font-medium">{r.summary}</div>
                <div className="text-xs text-text-muted">
                  {r.category.replace("_", " ")} · requested {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge className={cn("border-0", STATUS_STYLES[r.status])}>
                {r.status.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
