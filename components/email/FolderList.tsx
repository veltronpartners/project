import Link from "next/link";
import { Inbox, Star, Send, FileText, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderInfo } from "@/lib/mail/imap";

const ICONS: Record<string, typeof Inbox> = {
  INBOX: Inbox,
  Sent: Send,
  Drafts: FileText,
  Archive: Archive,
  Trash: Trash2,
  Starred: Star,
};

export function FolderList({
  folders,
  mailbox,
  activeFolder,
}: {
  folders: FolderInfo[];
  mailbox: string;
  activeFolder: string;
}) {
  return (
    <nav className="space-y-0.5">
      {folders.map((f) => {
        const Icon = ICONS[f.name] ?? Inbox;
        return (
          <Link
            key={f.path}
            href={`/email?mailbox=${encodeURIComponent(mailbox)}&folder=${encodeURIComponent(f.path)}`}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
              f.path === activeFolder ? "bg-accent font-medium" : "hover:bg-muted/40",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {f.name}
            </span>
            {f.unread > 0 && <span className="text-xs text-text-muted">{f.unread}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
