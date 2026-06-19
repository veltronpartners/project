export function MeetingCard({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-xs text-text-muted">
        {new Date(date).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </div>
    </div>
  );
}
