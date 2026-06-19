"use client";

import { useState } from "react";
import { updateProjectProgress } from "@/app/(portal)/projects/actions";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export function ProgressControl({
  projectId,
  initialValue,
  readOnly,
}: {
  projectId: string;
  initialValue: number;
  readOnly: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="space-y-2">
      <Progress value={value} />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          disabled={readOnly}
          onChange={(e) => setValue(Number(e.target.value))}
          onBlur={() => updateProjectProgress(projectId, value)}
          className="w-20"
        />
        <span className="text-sm text-text-muted">% complete</span>
      </div>
    </div>
  );
}
