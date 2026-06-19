"use client";

import { useState } from "react";
import { updateChecklistItem } from "@/app/(portal)/intake/actions";
import type { ChecklistItemStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ChecklistItemStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "complete", label: "Complete" },
  { value: "flagged", label: "Flagged" },
  { value: "na", label: "N/A" },
];

export function ChecklistItemRow({
  item,
  engagementId,
  members,
  readOnly,
}: {
  item: {
    id: string;
    item_text: string;
    status: ChecklistItemStatus;
    officer_id: string | null;
    date_done: string | null;
    notes: string | null;
  };
  engagementId: string;
  members: { id: string; full_name: string }[];
  readOnly: boolean;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");

  return (
    <div
      className={cn(
        "rounded-md border p-3",
        item.status === "flagged" ? "border-danger/40 bg-danger/5" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{item.item_text}</span>
        <div className="flex items-center gap-2">
          <Select
            defaultValue={item.status}
            disabled={readOnly}
            onValueChange={(status) => updateChecklistItem(item.id, engagementId, { status })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={item.officer_id ?? undefined}
            disabled={readOnly}
            onValueChange={(officer_id) => updateChecklistItem(item.id, engagementId, { officer_id })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Officer" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-36"
            defaultValue={item.date_done ?? ""}
            disabled={readOnly}
            onChange={(e) => updateChecklistItem(item.id, engagementId, { date_done: e.target.value })}
          />
        </div>
      </div>
      <Textarea
        className="mt-2"
        placeholder="Notes"
        rows={1}
        value={notes}
        disabled={readOnly}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => updateChecklistItem(item.id, engagementId, { notes })}
      />
    </div>
  );
}
