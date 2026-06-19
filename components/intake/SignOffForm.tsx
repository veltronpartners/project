"use client";

import { useActionState } from "react";
import { signOffStage, type FormState } from "@/app/(portal)/intake/actions";
import type { User } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignOffForm({
  engagementId,
  stage,
  officer,
}: {
  engagementId: string;
  stage: number;
  officer: User;
}) {
  const action = signOffStage.bind(null, engagementId, stage);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-veltron-gold/30 bg-accent/40 p-4">
      <h3 className="font-heading text-sm font-semibold">Stage sign-off</h3>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <Label>Officer</Label>
          <p className="mt-1 text-foreground">{officer.full_name}</p>
        </div>
        <div>
          <Label>Date</Label>
          <p className="mt-1 text-foreground">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" name="remarks" rows={2} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing off…" : "Sign Off Stage"}
      </Button>
    </form>
  );
}
