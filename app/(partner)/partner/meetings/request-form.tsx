"use client";

import { useActionState } from "react";
import { requestMeeting, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function RequestMeetingForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(requestMeeting, undefined);

  if (state?.success) {
    return <p className="text-sm text-success">Request sent — your Veltron Lead will be in touch.</p>;
  }

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Request a meeting</h3>
      <div className="space-y-2">
        <Label htmlFor="reason">What's it about? *</Label>
        <Textarea id="reason" name="reason" rows={2} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferred_dates">Preferred dates/times</Label>
        <Input id="preferred_dates" name="preferred_dates" placeholder="e.g. Tuesday or Wednesday afternoon" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request meeting"}
      </Button>
    </form>
  );
}
