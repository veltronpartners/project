import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/permissions";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";

export default async function ComplianceOverviewPage() {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "compliance")) redirect("/dashboard");

  const supabase = await createClient();
  const sixtyDaysOut = new Date();
  sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);

  const [{ count: openConflicts }, { data: expiringContracts }, { data: escalationGuide }] = await Promise.all([
    supabase.from("conflict_register").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("contracts")
      .select("*")
      .lte("expiry_date", sixtyDaysOut.toISOString().slice(0, 10))
      .neq("status", "expired")
      .neq("status", "terminated")
      .order("expiry_date"),
    supabase.from("decision_escalation_guide").select("*").order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Compliance</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/compliance/conflicts">Conflicts of Interest</Link>
          </Button>
          <Button asChild>
            <Link href="/compliance/contracts">Contract Tracker</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Open conflict declarations" value={openConflicts ?? 0} />
        <StatCard label="Contracts expiring within 60 days" value={expiringContracts?.length ?? 0} />
      </div>

      {expiringContracts && expiringContracts.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">Expiring soon</h3>
          {expiringContracts.map((c) => (
            <div key={c.id} className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
              {c.title} — expires {new Date(c.expiry_date).toLocaleDateString()}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Escalation Guide</h3>
        {!escalationGuide || escalationGuide.length === 0 ? (
          <EmptyState message="No escalation guide configured." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Must consult</th>
                  <th className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {escalationGuide.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-2 capitalize">{row.category}</td>
                    <td className="px-4 py-2">{row.must_consult}</td>
                    <td className="px-4 py-2 text-text-muted">{row.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
