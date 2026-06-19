"use client";

import { updateRiskStatus } from "@/app/(portal)/projects/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["open", "mitigated", "resolved", "accepted"] as const;

export function RiskStatusSelect({
  riskId,
  projectId,
  status,
}: {
  riskId: string;
  projectId: string;
  status: string;
}) {
  return (
    <Select
      defaultValue={status}
      onValueChange={(next) => updateRiskStatus(riskId, projectId, next as (typeof STATUSES)[number])}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
