import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { ConflictEntry, Contract } from "@/types";

export function ComplianceStatusReport({
  openConflicts,
  expiringContracts,
  pendingSignoffCount,
}: {
  openConflicts: ConflictEntry[];
  expiringContracts: Contract[];
  pendingSignoffCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Open conflicts" value={openConflicts.length} />
        <StatCard label="Contracts expiring soon" value={expiringContracts.length} />
        <StatCard label="Pending engagement sign-offs" value={pendingSignoffCount} />
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Open conflicts</h4>
        {openConflicts.length === 0 ? (
          <EmptyState message="No open conflicts." />
        ) : (
          openConflicts.map((c) => (
            <div key={c.id} className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm">
              {c.description}
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Contracts expiring within 60 days</h4>
        {expiringContracts.length === 0 ? (
          <EmptyState message="No contracts expiring soon." />
        ) : (
          expiringContracts.map((c) => (
            <div key={c.id} className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
              {c.title} — expires {c.expiry_date && new Date(c.expiry_date).toLocaleDateString()}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
