export function ActivityFeedItem({
  actor,
  action,
  resourceName,
  createdAt,
}: {
  actor: string;
  action: string;
  resourceName: string | null;
  createdAt: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0">
      <p className="text-sm text-foreground">
        <span className="font-medium">{actor}</span> {action.replace("_", " ")}
        {resourceName ? ` — ${resourceName}` : ""}
      </p>
      <span className="shrink-0 text-xs text-text-muted">
        {new Date(createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}
