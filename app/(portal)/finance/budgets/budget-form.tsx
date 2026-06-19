"use client";

import { useActionState } from "react";
import { createBudget, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function BudgetForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBudget, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-4">
      <div className="space-y-1">
        <Label htmlFor="name">Budget name *</Label>
        <Input id="name" name="name" required className="w-48" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="period_start">Period start</Label>
        <Input id="period_start" name="period_start" type="date" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="period_end">Period end</Label>
        <Input id="period_end" name="period_end" type="date" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="total_budget">Total (USD) *</Label>
        <Input id="total_budget" name="total_budget" type="number" required className="w-32" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create budget"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
