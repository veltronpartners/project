"use client";

import { useActionState } from "react";
import { createContact, type FormState } from "../actions";
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

export function ContactForm({ portfolios }: { portfolios: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createContact, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organisation">Organisation</Label>
          <Input id="organisation" name="organisation" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role_title">Role / title</Label>
          <Input id="role_title" name="role_title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_type">Type</Label>
          <Select name="contact_type">
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
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input id="linkedin_url" name="linkedin_url" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portfolio_id">Linked portfolio</Label>
          <Select name="portfolio_id">
            <SelectTrigger id="portfolio_id">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add contact"}
      </Button>
    </form>
  );
}
