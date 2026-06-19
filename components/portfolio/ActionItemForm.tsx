"use client";

import { useActionState } from "react";
import { addActionItem, type FormState } from "@/app/(portal)/portfolio/actions";
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

export function ActionItemForm({
  portfolioId,
  members,
}: {
  portfolioId: string;
  members: { id: string; full_name: string }[];
}) {
  const action = addActionItem.bind(null, portfolioId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required className="w-56" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="due_date">Due date</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority">
          <SelectTrigger id="priority" className="w-24">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="owner_id">Owner</Label>
        <Select name="owner_id">
          <SelectTrigger id="owner_id" className="w-40">
            <SelectValue placeholder="Assign to" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add action item"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
