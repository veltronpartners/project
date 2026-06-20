import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Engagement } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-text-muted",
  in_progress: "bg-veltron-gold-muted text-veltron-charcoal",
  approved: "bg-success/15 text-success",
  declined: "bg-danger/15 text-danger",
  under_review: "bg-warning/15 text-warning",
};

export default async function IntakeListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("engagements").select("*").order("created_at", { ascending: false });
  if (q) query = query.ilike("company_name", `%${q}%`);
  const { data: engagements } = await query;
  const rows = (engagements ?? []) as Engagement[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Engagement Intake</h1>
        {canEdit(user.role, "intake") && (
          <Button asChild>
            <Link href="/intake/new">New Intake</Link>
          </Button>
        )}
      </div>

      <form className="flex gap-2" method="get">
        <Input name="q" placeholder="Search by company name" defaultValue={q ?? ""} className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No engagement intakes yet — start one with New Intake." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Ref #</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Target Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/intake/${e.id}/stage/${e.current_stage}`} className="hover:underline">
                      {e.ref_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium">{e.company_name}</td>
                  <td className="px-4 py-2 text-text-muted">{e.engagement_type ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{e.current_stage} / 6</td>
                  <td className="px-4 py-2">
                    <Badge className={cn("border-0", STATUS_STYLES[e.overall_status])}>
                      {e.overall_status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{e.priority_level ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">
                    {e.target_decision_date ? new Date(e.target_decision_date).toLocaleDateString() : "—"}
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
