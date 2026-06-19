"use client";

import { updateMilestoneStatus } from "@/app/(portal)/projects/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["pending", "in_progress", "complete", "delayed"] as const;

export function MilestoneStatusSelect({
  milestoneId,
  projectId,
  status,
}: {
  milestoneId: string;
  projectId: string;
  status: string;
}) {
  return (
    <Select
      defaultValue={status}
      onValueChange={(next) =>
        updateMilestoneStatus(milestoneId, projectId, next as (typeof STATUSES)[number])
      }
    >
      <SelectTrigger className="w-36">
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
