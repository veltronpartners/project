"use client";

import { useActionState } from "react";
import { addMilestone, type FormState } from "@/app/(portal)/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function MilestoneForm({ projectId }: { projectId: string }) {
  const action = addMilestone.bind(null, projectId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor="title">Milestone</Label>
        <Input id="title" name="title" required className="w-56" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="target_date">Target date</Label>
        <Input id="target_date" name="target_date" type="date" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add milestone"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
