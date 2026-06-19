"use client";

import { useActionState } from "react";
import { addBudgetItem, type FormState } from "@/app/(portal)/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function BudgetItemForm({ projectId }: { projectId: string }) {
  const action = addBudgetItem.bind(null, projectId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor="item_name">Item</Label>
        <Input id="item_name" name="item_name" required className="w-44" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" className="w-32" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="vendor">Vendor</Label>
        <Input id="vendor" name="vendor" className="w-32" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="estimated">Estimated</Label>
        <Input id="estimated" name="estimated" type="number" className="w-28" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="actual">Actual</Label>
        <Input id="actual" name="actual" type="number" className="w-28" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add line item"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
