"use client";

import { useActionState } from "react";
import { assignForm, type FormState } from "../../actions";
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

export function AssignForm({
  formId,
  contacts,
}: {
  formId: string;
  contacts: { id: string; full_name: string; portfolioName: string }[];
}) {
  const action = assignForm.bind(null, formId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="partner_contact_id">Partner contact *</Label>
        <Select name="partner_contact_id" required>
          <SelectTrigger id="partner_contact_id">
            <SelectValue placeholder="Select a partner contact" />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name} — {c.portfolioName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Input id="deadline" name="deadline" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cover_note">Cover note (shown to partner)</Label>
        <Textarea id="cover_note" name="cover_note" rows={3} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send to partner"}
      </Button>
    </form>
  );
}
