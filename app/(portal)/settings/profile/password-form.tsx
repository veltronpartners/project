"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changePassword, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Change password</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new_password">New password *</Label>
          <Input id="new_password" name="new_password" type="password" required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password *</Label>
          <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
