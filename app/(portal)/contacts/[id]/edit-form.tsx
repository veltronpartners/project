"use client";

import { useActionState } from "react";
import { updateContact, type FormState } from "../actions";
import type { Contact } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = ["portfolio_contact", "investor", "advisor", "legal", "partner", "vendor", "other"];

export function EditForm({ contact, readOnly }: { contact: Contact; readOnly: boolean }) {
  const action = updateContact.bind(null, contact.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-70">
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" name="full_name" defaultValue={contact.full_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organisation">Organisation</Label>
            <Input id="organisation" name="organisation" defaultValue={contact.organisation ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_title">Role / title</Label>
            <Input id="role_title" name="role_title" defaultValue={contact.role_title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_type">Type</Label>
            <Select name="contact_type" defaultValue={contact.contact_type ?? undefined}>
              <SelectTrigger id="contact_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={contact.email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={contact.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input id="linkedin_url" name="linkedin_url" defaultValue={contact.linkedin_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" defaultValue={contact.website ?? ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={contact.notes ?? ""} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        {!readOnly && (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        )}
      </form>
    </fieldset>
  );
}
