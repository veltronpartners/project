"use client";

import { Star, Archive, Trash2 } from "lucide-react";
import { toggleStar, archiveMessage, deleteMessage } from "@/app/(portal)/email/actions";
import { Button } from "@/components/ui/button";

export function MessageActions({
  mailbox,
  folder,
  uid,
  flagged,
}: {
  mailbox: string;
  folder: string;
  uid: number;
  flagged: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Star"
        onClick={() => toggleStar(mailbox, folder, uid, !flagged)}
      >
        <Star className={flagged ? "h-4 w-4 fill-veltron-gold text-veltron-gold" : "h-4 w-4"} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Archive"
        onClick={() => archiveMessage(mailbox, folder, uid)}
      >
        <Archive className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Delete"
        onClick={() => deleteMessage(mailbox, folder, uid)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
