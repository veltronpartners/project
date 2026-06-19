import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { InternalProject } from "@/types";

export function ProjectStatusReport({ rows }: { rows: InternalProject[] }) {
  const csvRows = rows.map((p) => ({
    name: p.name,
    status: p.status,
    percent_complete: p.percent_complete,
    budget_used: p.budget_used,
    budget_estimated: p.budget_estimated ?? "",
    health: p.health_indicator ?? "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCsvButton filename="project-status-report.csv" rows={csvRows} />
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No internal projects yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((p) => (
            <div key={p.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <HealthBadge status={p.health_indicator} />
              </div>
              <Progress value={p.percent_complete} className="mt-2" />
              <div className="mt-1 flex justify-between text-xs text-text-muted">
                <span>{p.percent_complete}% complete</span>
                <span>
                  {p.currency} {p.budget_used.toLocaleString()} / {p.budget_estimated?.toLocaleString() ?? "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
