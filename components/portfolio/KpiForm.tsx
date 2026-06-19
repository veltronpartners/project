"use client";

import { useActionState } from "react";
import { addKpi, type FormState } from "@/app/(portal)/portfolio/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function KpiForm({ portfolioId }: { portfolioId: string }) {
  const action = addKpi.bind(null, portfolioId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor="kpi_name">KPI name</Label>
        <Input id="kpi_name" name="kpi_name" required className="w-40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="target">Target</Label>
        <Input id="target" name="target" className="w-28" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="current_value">Current</Label>
        <Input id="current_value" name="current_value" className="w-28" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="unit">Unit</Label>
        <Input id="unit" name="unit" className="w-20" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add KPI"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
