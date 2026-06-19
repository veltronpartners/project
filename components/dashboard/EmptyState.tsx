export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-text-muted">
      {message}
    </p>
  );
}
