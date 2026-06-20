"use client";

import { useState } from "react";
import { updatePartnerActionStatus } from "@/app/(partner)/partner/actions";
import type { PartnerAction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function PartnerActionCard({ action }: { action: PartnerAction }) {
  const [note, setNote] = useState(action.completion_note ?? "");
  const overdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== "done";

  return (
    <div className="space-y-2 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{action.title}</p>
        <Badge variant={action.status === "done" ? "default" : "outline"} className={cn("capitalize", overdue && "border-danger text-danger")}>
          {overdue ? "overdue" : action.status.replace("_", " ")}
        </Badge>
      </div>
      {action.description && <p className="text-sm text-text-muted">{action.description}</p>}
      {action.due_date && (
        <p className="text-xs text-text-muted">Due {new Date(action.due_date).toLocaleDateString()}</p>
      )}
      {action.status !== "done" && (
        <div className="space-y-2">
          <Textarea
            placeholder="Completion note (optional, max 300 characters)"
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            {action.status === "pending" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updatePartnerActionStatus(action.id, "in_progress", note)}
              >
                Mark in progress
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => updatePartnerActionStatus(action.id, "done", note)}>
              Mark done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
