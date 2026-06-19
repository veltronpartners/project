"use client";

import { updateProjectHealth } from "@/app/(portal)/projects/actions";
import type { HealthIndicator } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS: { value: HealthIndicator; label: string }[] = [
  { value: "green", label: "🟢 On track" },
  { value: "yellow", label: "🟡 Needs attention" },
  { value: "red", label: "🔴 At risk" },
];

export function ProjectHealthSelector({
  projectId,
  value,
  disabled,
}: {
  projectId: string;
  value: HealthIndicator | null;
  disabled: boolean;
}) {
  return (
    <Select
      defaultValue={value ?? "green"}
      disabled={disabled}
      onValueChange={(next) => updateProjectHealth(projectId, next as HealthIndicator)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
