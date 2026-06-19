"use client";

import { useActionState } from "react";
import { connectMailbox, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function ConnectForm({ isDirector }: { isDirector: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(connectMailbox, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Connect a mailbox</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email_address">Mailbox address *</Label>
          <Input id="email_address" name="email_address" type="email" required placeholder="you@veltronpartners.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mailbox password *</Label>
          <Input id="password" name="password" type="password" required />
        </div>
      </div>
      {isDirector && (
        <div className="flex items-center gap-2">
          <Checkbox id="is_shared" name="is_shared" />
          <Label htmlFor="is_shared" className="font-normal">
            This is a shared mailbox (e.g. partnerships@ or contact@)
          </Label>
        </div>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Connecting…" : "Connect"}
      </Button>
    </form>
  );
}
