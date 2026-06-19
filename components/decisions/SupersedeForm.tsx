"use client";

import { useActionState } from "react";
import { supersedeDecision, type FormState } from "@/app/(portal)/decisions/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SupersedeForm({ decisionId }: { decisionId: string }) {
  const action = supersedeDecision.bind(null, decisionId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Supersede this decision</h3>
      <p className="text-xs text-text-muted">
        Creates a new decision entry and marks this one as superseded — the history stays intact.
      </p>
      <div className="space-y-1">
        <Label htmlFor="decision_summary">New decision summary</Label>
        <Textarea id="decision_summary" name="decision_summary" rows={2} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rationale">New rationale</Label>
        <Textarea id="rationale" name="rationale" rows={2} required />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Superseding…" : "Supersede"}
      </Button>
    </form>
  );
}
