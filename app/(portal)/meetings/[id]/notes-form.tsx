"use client";

import { useActionState } from "react";
import { updateMeetingNotes, type FormState } from "../actions";
import type { Meeting } from "@/types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NotesForm({ meeting }: { meeting: Meeting }) {
  const action = updateMeetingNotes.bind(null, meeting.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">During / after meeting</h3>
      <div className="space-y-2">
        <Label htmlFor="key_decisions">Key decisions</Label>
        <Textarea id="key_decisions" name="key_decisions" rows={2} defaultValue={meeting.key_decisions ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={meeting.notes ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next_meeting">Next meeting date</Label>
        <Input id="next_meeting" name="next_meeting" type="date" defaultValue={meeting.next_meeting ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save & mark completed"}
      </Button>
    </form>
  );
}
