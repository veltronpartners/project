import { cn } from "@/lib/utils";

export function AnnouncementBanner({
  title,
  body,
  priority,
}: {
  title: string;
  body: string;
  priority: "urgent" | "normal" | "info";
}) {
  return (
    <div
      className={cn("rounded-md border px-4 py-3", {
        "border-danger/30 bg-danger/10": priority === "urgent",
        "border-veltron-gold/30 bg-accent": priority === "normal",
        "border-border bg-muted/40": priority === "info",
      })}
    >
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-0.5 text-sm text-text-muted">{body}</p>
    </div>
  );
}
