"use client";

import { useActionState, useState } from "react";
import { recordFinalDecision, type FormState } from "@/app/(portal)/intake/actions";
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

export function FinalDecisionForm({
  engagementId,
  currentDecision,
}: {
  engagementId: string;
  currentDecision: string | null;
}) {
  const action = recordFinalDecision.bind(null, engagementId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const [decision, setDecision] = useState(currentDecision ?? "");

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Final decision</h3>
      <div className="space-y-1">
        <Label htmlFor="final_decision">Decision</Label>
        <Select name="final_decision" value={decision} onValueChange={setDecision}>
          <SelectTrigger id="final_decision">
            <SelectValue placeholder="Select decision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
            <SelectItem value="Pending Further Review">Pending Further Review</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {decision === "Declined" && (
        <div className="space-y-1">
          <Label htmlFor="decline_reason">Decline reason *</Label>
          <Textarea id="decline_reason" name="decline_reason" rows={2} required />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="consensus_notes">Team consensus notes</Label>
        <Textarea id="consensus_notes" name="consensus_notes" rows={2} />
      </div>
      <p className="text-xs text-text-muted">
        Approving or declining routes through the Director (or Acting CEO) approval queue — it isn&apos;t final until they decide.
      </p>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending || !decision}>
        {pending ? "Submitting…" : "Submit for approval"}
      </Button>
    </form>
  );
}
