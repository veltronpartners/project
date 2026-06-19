"use client";

import { updateDecisionStatus } from "@/app/(portal)/decisions/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["approved", "in_progress", "under_review", "declined", "superseded"];

export function StatusSelect({
  decisionId,
  status,
  disabled,
}: {
  decisionId: string;
  status: string;
  disabled: boolean;
}) {
  return (
    <Select
      defaultValue={status}
      disabled={disabled}
      onValueChange={(next) => updateDecisionStatus(decisionId, next)}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
