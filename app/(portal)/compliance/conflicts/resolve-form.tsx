"use client";

import { useActionState } from "react";
import { resolveConflict, type FormState } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ResolveForm({ conflictId }: { conflictId: string }) {
  const action = resolveConflict.bind(null, conflictId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <Select name="status" defaultValue="under_review">
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="under_review">Under review</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="noted">Noted</SelectItem>
        </SelectContent>
      </Select>
      <Textarea name="resolution" placeholder="Resolution notes" rows={2} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
