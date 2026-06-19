"use client";

import { useActionState } from "react";
import { addEngagementNote, type FormState } from "@/app/(portal)/intake/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function NotesForm({ engagementId, stage }: { engagementId: string; stage: number }) {
  const action = addEngagementNote.bind(null, engagementId, stage);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-veltron-charcoal/10 bg-muted/40 p-3">
      <Textarea
        name="note_text"
        rows={2}
        placeholder="Officer personal notes / comments — private to the review team"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add note"}
      </Button>
    </form>
  );
}
