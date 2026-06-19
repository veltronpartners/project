"use client";

import { disconnectMailbox } from "./actions";
import type { MailboxConnection } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MailboxRow({ connection, ownerName }: { connection: MailboxConnection; ownerName: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
      <div>
        <p className="font-medium">{connection.email_address}</p>
        <p className="text-xs text-text-muted">
          {connection.is_shared ? "Shared" : "Individual"} · owner: {ownerName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={connection.is_connected ? "default" : "outline"}>
          {connection.is_connected ? "Connected" : "Disconnected"}
        </Badge>
        {connection.is_connected && (
          <Button type="button" variant="outline" size="sm" onClick={() => disconnectMailbox(connection.id)}>
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
