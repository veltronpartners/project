"use client";

import { updateTaskStatus } from "@/app/(portal)/projects/actions";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/types";

const COLUMNS: { status: ProjectTask["status"]; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "in_progress", label: "In Progress" },
  { status: "complete", label: "Complete" },
  { status: "overdue", label: "Overdue" },
];

const PRIORITY_COLOR: Record<string, string> = {
  high: "border-l-danger",
  medium: "border-l-warning",
  low: "border-l-success",
};

export function TaskKanban({
  projectId,
  tasks,
  memberNameById,
}: {
  projectId: string;
  tasks: ProjectTask[];
  memberNameById: Map<string, string>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {COLUMNS.map((col) => (
        <div key={col.status} className="space-y-2">
          <h4 className="text-sm font-semibold text-text-muted">{col.label}</h4>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.status === col.status)
              .map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "rounded-md border border-border border-l-4 bg-card p-3",
                    PRIORITY_COLOR[task.priority ?? "medium"],
                  )}
                >
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {task.assignee_id ? memberNameById.get(task.assignee_id) ?? "—" : "Unassigned"}
                    {task.due_date && ` · Due ${new Date(task.due_date).toLocaleDateString()}`}
                  </p>
                  <select
                    className="mt-2 w-full rounded border border-border bg-background px-1.5 py-1 text-xs"
                    defaultValue={task.status}
                    onChange={(e) =>
                      updateTaskStatus(
                        task.id,
                        projectId,
                        e.target.value as ProjectTask["status"],
                      )
                    }
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.status} value={c.status}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
