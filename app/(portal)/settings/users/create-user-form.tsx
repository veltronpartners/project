"use client";

import { useActionState } from "react";
import { createStaffAccount, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, type Role } from "@/types";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createStaffAccount, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Create staff account</h3>
      <p className="text-xs text-text-muted">
        Creates the login directly with a temporary password — share it with them securely. Email invites
        activate once the Resend integration is connected.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select name="role" required>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Temporary password *</Label>
          <Input id="password" name="password" type="text" required minLength={8} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
