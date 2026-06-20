"use client";

import { useActionState } from "react";
import { replyToPartner, type FormState } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReplyForm({ portfolioId }: { portfolioId: string }) {
  const action = replyToPartner.bind(null, portfolioId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <Textarea name="message_text" rows={2} placeholder="Reply to the partner…" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
