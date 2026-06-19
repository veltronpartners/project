"use client";

import { useActionState } from "react";
import { declareConflict, type FormState } from "../actions";
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

export function DeclareForm({ portfolios }: { portfolios: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(declareConflict, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Declare a conflict</h3>
      <p className="text-xs text-text-muted">
        Declaring a conflict isn&apos;t an admission of wrongdoing — not declaring one you know about is the
        actual policy breach.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="conflict_type">Type</Label>
          <Select name="conflict_type">
            <SelectTrigger id="conflict_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="related_portfolio_id">Related portfolio</Label>
          <Select name="related_portfolio_id">
            <SelectTrigger id="related_portfolio_id">
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
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" name="description" rows={3} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parties_involved">Parties involved</Label>
        <Input id="parties_involved" name="parties_involved" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Declaring…" : "Declare Conflict"}
      </Button>
    </form>
  );
}
