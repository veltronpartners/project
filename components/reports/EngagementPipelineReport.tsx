import { StatCard } from "@/components/dashboard/StatCard";
import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { Engagement } from "@/types";

export function EngagementPipelineReport({ rows }: { rows: Engagement[] }) {
  const byStage = [1, 2, 3, 4, 5, 6].map((stage) => ({
    stage,
    count: rows.filter((r) => r.current_stage === stage).length,
  }));
  const approved = rows.filter((r) => r.overall_status === "approved").length;
  const conversionRate = rows.length > 0 ? Math.round((approved / rows.length) * 100) : 0;

  const csvRows = rows.map((r) => ({
    ref_number: r.ref_number,
    company_name: r.company_name,
    stage: r.current_stage,
    status: r.overall_status,
    priority: r.priority_level ?? "",
    target_decision_date: r.target_decision_date ?? "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCsvButton filename="engagement-pipeline.csv" rows={csvRows} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total intakes" value={rows.length} />
        <StatCard label="Approved" value={approved} />
        <StatCard label="Conversion rate" value={`${conversionRate}%`} />
        <StatCard label="In progress" value={rows.filter((r) => r.overall_status === "in_progress").length} />
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No engagement intakes yet." />
      ) : (
        <div className="grid grid-cols-6 gap-2">
          {byStage.map((s) => (
            <div key={s.stage} className="rounded-md border border-border p-3 text-center">
              <div className="text-2xl font-semibold">{s.count}</div>
              <div className="text-xs text-text-muted">Stage {s.stage}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
