"use client";

import { useActionState } from "react";
import { verifyTfa } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyTfa, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">Authentication code</Label>
        <Input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="6-digit code or backup code"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
