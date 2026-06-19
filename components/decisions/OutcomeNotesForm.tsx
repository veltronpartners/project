"use client";

import { useActionState } from "react";
import { addOutcomeNotes, type FormState } from "@/app/(portal)/decisions/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function OutcomeNotesForm({ decisionId, initialNotes }: { decisionId: string; initialNotes: string | null }) {
  const action = addOutcomeNotes.bind(null, decisionId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <Textarea name="outcome_notes" rows={3} defaultValue={initialNotes ?? ""} placeholder="What happened as a result of this decision?" />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save outcome notes"}
      </Button>
    </form>
  );
}
