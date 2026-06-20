"use client";

import { useActionState } from "react";
import { sendPartnerMessage, type FormState } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function MessageForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(sendPartnerMessage, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <Textarea name="message_text" rows={3} maxLength={2000} placeholder="Write a message to your Veltron Lead…" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
