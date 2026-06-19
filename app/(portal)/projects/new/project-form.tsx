"use client";

import { useActionState } from "react";
import { createProject, type FormState } from "../actions";
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

export function ProjectForm({ team }: { team: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createProject, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Project name *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type">
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
          <Select name="scale">
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
          <Select name="lead_id">
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
          <Input id="start_date" name="start_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target_end_date">Target end date</Label>
          <Input id="target_end_date" name="target_end_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_estimated">Estimated budget (USD)</Label>
          <Input id="budget_estimated" name="budget_estimated" type="number" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="in_scope">In scope</Label>
        <Textarea id="in_scope" name="in_scope" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="out_of_scope">Out of scope</Label>
        <Textarea id="out_of_scope" name="out_of_scope" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="success_criteria">Success criteria</Label>
        <Textarea id="success_criteria" name="success_criteria" rows={2} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
