"use client";

import { useActionState } from "react";
import { signDocument, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export function SignForm({ token, signerName }: { token: string; signerName: string }) {
  const action = signDocument.bind(null, token);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  if (state?.success) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
        Signed successfully. Thank you — you may close this page.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Sign this document</h3>
      <div className="space-y-2">
        <Label htmlFor="typed_name">Type your full name to sign *</Label>
        <Input id="typed_name" name="typed_name" required defaultValue={signerName} className="font-display text-lg italic" />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="agree" name="agree" required />
        <Label htmlFor="agree" className="font-normal text-xs leading-snug">
          I agree this constitutes my legal signature on this document.
        </Label>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing…" : "Sign document"}
      </Button>
    </form>
  );
}
