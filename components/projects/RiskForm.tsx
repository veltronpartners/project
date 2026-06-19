"use client";

import { useActionState } from "react";
import { addRisk, type FormState } from "@/app/(portal)/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RiskForm({ projectId }: { projectId: string }) {
  const action = addRisk.bind(null, projectId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor="description">Risk</Label>
        <Input id="description" name="description" required className="w-56" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="likelihood">Likelihood</Label>
        <Select name="likelihood">
          <SelectTrigger id="likelihood" className="w-28">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="impact">Impact</Label>
        <Select name="impact">
          <SelectTrigger id="impact" className="w-28">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="mitigation">Mitigation</Label>
        <Input id="mitigation" name="mitigation" className="w-56" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add risk"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
