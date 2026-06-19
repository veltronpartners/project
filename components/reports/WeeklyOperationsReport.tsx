import { StatCard } from "@/components/dashboard/StatCard";

export function WeeklyOperationsReport({
  portfolioUpdates,
  decisionsLogged,
  meetingsHeld,
  tasksCompleted,
}: {
  portfolioUpdates: number;
  decisionsLogged: number;
  meetingsHeld: number;
  tasksCompleted: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">Activity over the last 7 days.</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Portfolio check-ins" value={portfolioUpdates} />
        <StatCard label="Decisions logged" value={decisionsLogged} />
        <StatCard label="Meetings held" value={meetingsHeld} />
        <StatCard label="Tasks completed" value={tasksCompleted} />
      </div>
      <p className="text-xs text-text-muted">
        Emailing this digest to Directors and pushing it to Slack activates once those integrations are connected.
      </p>
    </div>
  );
}
