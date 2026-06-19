import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { LeaveDecisionButtons } from "@/components/hr/LeaveDecisionButtons";
import { LeaveForm } from "./leave-form";
import type { LeaveRequest } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  declined: "bg-danger/15 text-danger",
};

export default async function LeavePage() {
  const user = await getCurrentStaffUser();
  const canManage = user.role === "director" || user.role === "hr_officer";
  const supabase = await createClient();

  let query = supabase.from("leave_requests").select("*").order("start_date", { ascending: false });
  if (!canManage) query = query.eq("user_id", user.id);
  const { data: requests } = await query;
  const rows = (requests ?? []) as LeaveRequest[];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: people } = userIds.length
    ? await supabase.from("users").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Leave</h1>

      <LeaveForm />

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">
          {canManage ? "All leave requests" : "My leave requests"}
        </h3>
        {rows.length === 0 ? (
          <EmptyState message="No leave requests yet." />
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <div>
                  {canManage && <span className="font-medium">{nameById.get(r.user_id) ?? "—"} · </span>}
                  {r.leave_type ?? "leave"} · {new Date(r.start_date).toLocaleDateString()} –{" "}
                  {new Date(r.end_date).toLocaleDateString()} ({r.days_count} days)
                  {r.reason && <p className="text-xs text-text-muted">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`border-0 capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</Badge>
                  {canManage && r.status === "pending" && <LeaveDecisionButtons requestId={r.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
