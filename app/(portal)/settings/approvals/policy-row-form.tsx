"use client";

import { useActionState } from "react";
import { updateApprovalPolicy, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PolicyRowForm({
  category,
  tier,
  delegatedToUserId,
  thresholdAmount,
  team,
}: {
  category: string;
  tier: number;
  delegatedToUserId: string | null;
  thresholdAmount: number | null;
  team: { id: string; full_name: string }[];
}) {
  const action = updateApprovalPolicy.bind(null, category);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
      <div className="w-44">
        <p className="text-sm font-medium capitalize">{category.replace("_", " ")}</p>
        <p className="text-xs text-text-muted">Tier {tier}</p>
      </div>
      {tier === 1 ? (
        <p className="text-xs text-text-muted">Always requires the Director (or Acting CEO).</p>
      ) : (
        <>
          <Select name="delegated_to_user_id" defaultValue={delegatedToUserId ?? undefined}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Stays with Director" />
            </SelectTrigger>
            <SelectContent>
              {team.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            name="threshold_amount"
            type="number"
            placeholder="Threshold (USD)"
            defaultValue={thresholdAmount ?? ""}
            className="w-36"
          />
        </>
      )}
      {tier !== 1 && (
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
