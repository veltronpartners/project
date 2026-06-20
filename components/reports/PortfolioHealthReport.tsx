import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { PortfolioCompany } from "@/types";

export function PortfolioHealthReport({ rows }: { rows: PortfolioCompany[] }) {
  const csvRows = rows.map((p) => ({
    name: p.name,
    industry: p.industry ?? "",
    health: p.health_indicator ?? "",
    last_checkin: p.last_checkin ?? "",
    next_checkin: p.next_checkin ?? "",
    top_priority: p.top_priority ?? "",
    key_risk: p.key_risk ?? "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCsvButton filename="portfolio-health-summary.csv" rows={csvRows} />
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No portfolio companies yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Health</th>
                <th className="px-3 py-2 font-medium">Last Check-in</th>
                <th className="px-3 py-2 font-medium">Next Check-in</th>
                <th className="px-3 py-2 font-medium">Top Priority</th>
                <th className="px-3 py-2 font-medium">Key Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    <HealthBadge status={p.health_indicator} />
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {p.last_checkin ? new Date(p.last_checkin).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {p.next_checkin ? new Date(p.next_checkin).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-muted">{p.top_priority ?? "—"}</td>
                  <td className="px-3 py-2 text-text-muted">{p.key_risk ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
