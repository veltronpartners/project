import Link from "next/link";
import { Paperclip, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageSummary } from "@/lib/mail/imap";

export function MessageList({
  messages,
  mailbox,
  folder,
  activeUid,
}: {
  messages: MessageSummary[];
  mailbox: string;
  folder: string;
  activeUid: number | null;
}) {
  if (messages.length === 0) {
    return <p className="p-4 text-sm text-text-muted">No messages in this folder.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {messages.map((m) => (
        <Link
          key={m.uid}
          href={`/email?mailbox=${encodeURIComponent(mailbox)}&folder=${encodeURIComponent(folder)}&uid=${m.uid}`}
          className={cn(
            "block px-3 py-2.5",
            m.uid === activeUid ? "bg-accent" : "hover:bg-muted/30",
            !m.seen && "font-semibold",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm">{m.from}</span>
            <span className="shrink-0 text-xs text-text-muted">
              {new Date(m.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            {m.flagged && <Star className="h-3 w-3 fill-veltron-gold text-veltron-gold" />}
            <span className="truncate">{m.subject}</span>
            {m.hasAttachments && <Paperclip className="h-3 w-3 shrink-0" />}
          </div>
        </Link>
      ))}
    </div>
  );
}
