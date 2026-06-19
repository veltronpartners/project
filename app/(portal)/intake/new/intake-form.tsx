"use client";

import { useActionState } from "react";
import { createIntake, type FormState } from "../actions";
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

export function IntakeForm({ team }: { team: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createIntake, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company name *</Label>
        <Input id="company_name" name="company_name" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="engagement_type">Engagement type</Label>
          <Select name="engagement_type">
            <SelectTrigger id="engagement_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {["partnerships", "fundraising", "advisory", "execution", "combination"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select name="source">
            <SelectTrigger id="source">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority_level">Priority</Label>
          <Select name="priority_level" defaultValue="medium">
            <SelectTrigger id="priority_level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="officer_id">Officer</Label>
          <Select name="officer_id">
            <SelectTrigger id="officer_id">
              <SelectValue placeholder="Assign officer" />
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
          <Label htmlFor="lead_id">Lead</Label>
          <Select name="lead_id">
            <SelectTrigger id="lead_id">
              <SelectValue placeholder="Assign lead" />
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
          <Label htmlFor="target_decision_date">Target decision date</Label>
          <Input id="target_decision_date" name="target_decision_date" type="date" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create intake"}
      </Button>
    </form>
  );
}
