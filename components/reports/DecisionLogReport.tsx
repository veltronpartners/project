import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { Decision } from "@/types";

export function DecisionLogReport({ rows }: { rows: Decision[] }) {
  const byCategory = rows.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});

  const csvRows = rows.map((d) => ({
    log_id: d.log_id,
    date: d.date,
    category: d.category,
    summary: d.decision_summary,
    status: d.status,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCsvButton filename="decision-log-report.csv" rows={csvRows} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total decisions" value={rows.length} />
        {Object.entries(byCategory)
          .slice(0, 3)
          .map(([category, count]) => (
            <StatCard key={category} label={category} value={count} />
          ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No decisions logged yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Log ID</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Summary</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{d.log_id}</td>
                  <td className="px-3 py-2 text-text-muted">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 capitalize">{d.category}</td>
                  <td className="px-3 py-2">{d.decision_summary}</td>
                  <td className="px-3 py-2 text-text-muted capitalize">{d.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
