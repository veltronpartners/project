import type { HealthIndicator } from "@/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<HealthIndicator, { label: string; className: string }> = {
  green: { label: "On track", className: "bg-success/15 text-success" },
  yellow: { label: "Needs attention", className: "bg-warning/15 text-warning" },
  red: { label: "At risk", className: "bg-danger/15 text-danger" },
};

export function HealthBadge({ status }: { status: HealthIndicator | null }) {
  if (!status) return <span className="text-xs text-text-muted">—</span>;
  const { label, className } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-success": status === "green",
          "bg-warning": status === "yellow",
          "bg-danger": status === "red",
        })}
      />
      {label}
    </span>
  );
}
