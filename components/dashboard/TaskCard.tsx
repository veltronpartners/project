import { cn } from "@/lib/utils";

export function TaskCard({
  title,
  dueDate,
  status,
}: {
  title: string;
  dueDate: string | null;
  status: string;
}) {
  const overdue = status === "overdue";
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <span className="text-sm text-foreground">{title}</span>
      <span
        className={cn("text-xs", overdue ? "text-danger" : "text-text-muted")}
      >
        {dueDate ? new Date(dueDate).toLocaleDateString() : "No due date"}
      </span>
    </div>
  );
}
