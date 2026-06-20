"use client";

import { useActionState } from "react";
import { addPartnerAction, type FormState } from "./actions";
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

export function ActionForm({
  portfolioId,
  contacts,
}: {
  portfolioId: string;
  contacts: { id: string; full_name: string }[];
}) {
  const action = addPartnerAction.bind(null, portfolioId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label>Partner contact</Label>
        <Select name="partner_contact_id">
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Title</Label>
        <Input name="title" required className="w-56" />
      </div>
      <div className="space-y-1">
        <Label>Due date</Label>
        <Input name="due_date" type="date" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Assign"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
