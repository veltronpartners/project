import Link from "next/link";
import { cn } from "@/lib/utils";

export function MailboxSwitcher({
  mailboxes,
  active,
}: {
  mailboxes: string[];
  active: string;
}) {
  if (mailboxes.length <= 1) return null;
  return (
    <div className="space-y-1 border-b border-border pb-3">
      {mailboxes.map((m) => (
        <Link
          key={m}
          href={`/email?mailbox=${encodeURIComponent(m)}`}
          className={cn(
            "block truncate rounded-md px-2 py-1.5 text-xs",
            m === active ? "bg-veltron-gold-muted font-medium text-veltron-charcoal" : "text-text-muted hover:bg-muted/40",
          )}
        >
          {m}
        </Link>
      ))}
    </div>
  );
}
