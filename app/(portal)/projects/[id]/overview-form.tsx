"use client";

import { useActionState } from "react";
import { updateProjectOverview, type FormState } from "../actions";
import type { InternalProject } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OverviewForm({
  project,
  team,
  readOnly,
}: {
  project: InternalProject;
  team: { id: string; full_name: string }[];
  readOnly: boolean;
}) {
  const action = updateProjectOverview.bind(null, project.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <fieldset disabled={readOnly} className="space-y-6 disabled:opacity-70">
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Project name *</Label>
            <Input id="name" name="name" defaultValue={project.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue={project.type ?? undefined}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_build">Product build</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="systems">Systems</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scale">Scale</Label>
            <Select name="scale" defaultValue={project.scale ?? undefined}>
              <SelectTrigger id="scale">
                <SelectValue placeholder="Select scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead_id">Lead</Label>
            <Select name="lead_id" defaultValue={project.lead_id ?? undefined}>
              <SelectTrigger id="lead_id">
                <SelectValue placeholder="Assign a lead" />
              </SelectTrigger>
              <SelectContent>
                {team.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Start date</Label>
            <Input id="start_date" name="start_date" type="date" defaultValue={project.start_date ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_end_date">Target end date</Label>
            <Input
              id="target_end_date"
              name="target_end_date"
              type="date"
              defaultValue={project.target_end_date ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_estimated">Estimated budget (USD)</Label>
            <Input
              id="budget_estimated"
              name="budget_estimated"
              type="number"
              defaultValue={project.budget_estimated ?? ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="in_scope">In scope</Label>
          <Textarea id="in_scope" name="in_scope" rows={2} defaultValue={project.in_scope ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="out_of_scope">Out of scope</Label>
          <Textarea id="out_of_scope" name="out_of_scope" rows={2} defaultValue={project.out_of_scope ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="success_criteria">Success criteria</Label>
          <Textarea
            id="success_criteria"
            name="success_criteria"
            rows={2}
            defaultValue={project.success_criteria ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="top_priority">Top priority</Label>
          <Input id="top_priority" name="top_priority" defaultValue={project.top_priority ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="key_risk">Key risk</Label>
          <Input id="key_risk" name="key_risk" defaultValue={project.key_risk ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={project.notes ?? ""} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        {!readOnly && (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        )}
      </form>
    </fieldset>
  );
}
