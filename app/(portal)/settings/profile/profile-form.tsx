"use client";

import { useActionState } from "react";
import { updateProfile, type FormState } from "./actions";
import type { User } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Profile</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input id="full_name" name="full_name" required defaultValue={user.full_name} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={user.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input id="linkedin_url" name="linkedin_url" defaultValue={user.linkedin_url ?? ""} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
