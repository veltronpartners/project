"use client";

import { useActionState } from "react";
import { addPartnerContact, type FormState } from "./actions";
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

export function ContactForm({ portfolioId }: { portfolioId: string }) {
  const action = addPartnerContact.bind(null, portfolioId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-border p-3">
      <p className="text-xs text-text-muted">
        Creates their partner portal login directly with a temporary password — share it with them securely.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input name="full_name" required className="w-44" />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input name="email" type="email" required className="w-56" />
        </div>
        <div className="space-y-1">
          <Label>Role</Label>
          <Input name="role_title" className="w-36" />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select name="contact_type" defaultValue="primary">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Temporary password</Label>
          <Input name="password" type="text" required minLength={8} className="w-40" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add contact"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
