import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Decision } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-success/15 text-success",
  in_progress: "bg-veltron-gold-muted text-veltron-charcoal",
  under_review: "bg-warning/15 text-warning",
  declined: "bg-danger/15 text-danger",
  superseded: "bg-muted text-text-muted",
};

export default async function DecisionLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("decisions").select("*").order("date", { ascending: false });
  if (q) query = query.ilike("decision_summary", `%${q}%`);
  const { data: decisions } = await query;
  const rows = (decisions ?? []) as Decision[];

  const byStatus = rows.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Decision Log</h1>
        {canEdit(user.role, "decisions") && (
          <Button asChild>
            <Link href="/decisions/new">Log Decision</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Approved" value={byStatus.approved ?? 0} />
        <StatCard label="In progress" value={byStatus.in_progress ?? 0} />
        <StatCard label="Under review" value={byStatus.under_review ?? 0} />
        <StatCard label="Declined" value={byStatus.declined ?? 0} />
      </div>

      <form className="flex gap-2" method="get">
        <Input name="q" placeholder="Search decision summaries" defaultValue={q ?? ""} className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No decisions logged yet — log your first one." />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Log ID</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Summary</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/decisions/${d.id}`} className="hover:underline">
                      {d.log_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-text-muted">{d.category}</td>
                  <td className="px-4 py-2 font-medium">{d.decision_summary}</td>
                  <td className="px-4 py-2">
                    <Badge className={cn("border-0", STATUS_STYLES[d.status])}>
                      {d.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {d.due_date ? new Date(d.due_date).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
