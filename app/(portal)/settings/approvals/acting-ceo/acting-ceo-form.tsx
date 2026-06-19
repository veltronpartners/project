"use client";

import { useActionState } from "react";
import { appointActingCeo, type FormState } from "../actions";
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

export function ActingCeoForm({ team }: { team: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(appointActingCeo, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Appoint Acting CEO</h3>
      <div className="space-y-1">
        <Label htmlFor="delegated_to_user_id">Staff member</Label>
        <Select name="delegated_to_user_id">
          <SelectTrigger id="delegated_to_user_id">
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="end_date">End date (optional — leave blank to end manually)</Label>
        <Input id="end_date" name="end_date" type="date" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Appointing…" : "Appoint Acting CEO"}
      </Button>
    </form>
  );
}
