"use client";

import { useActionState } from "react";
import { saveNotionSettings, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function NotionForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveNotionSettings, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api_key">Notion API key *</Label>
        <Input id="api_key" name="api_key" type="password" required placeholder="secret_..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="database_id">Database ID *</Label>
        <Input id="database_id" name="database_id" required />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Notion settings"}
      </Button>
    </form>
  );
}
