"use client";

import { updateActionStatus } from "@/app/(portal)/portfolio/actions";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["pending", "in_progress", "complete", "overdue"] as const;

export function ActionStatusSelect({
  actionId,
  portfolioId,
  status,
}: {
  actionId: string;
  portfolioId: string;
  status: string;
}) {
  return (
    <Select
      defaultValue={status}
      onValueChange={(next) =>
        updateActionStatus(actionId, portfolioId, next as (typeof STATUSES)[number])
      }
    >
      <SelectTrigger
        className={cn("w-36", status === "overdue" && "border-danger text-danger")}
      >
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
