"use client";

import { useActionState, useState } from "react";
import { generateFormLink, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function GenerateLinkForm({ formId, origin }: { formId: string; origin: string }) {
  const action = generateFormLink.bind(null, formId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const [copied, setCopied] = useState(false);

  const generatedUrl = state?.success ? `${origin}/respond/${state.success}` : null;

  async function copyLink() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Generate a shareable link</h3>
      <p className="text-xs text-text-muted">
        Send this to anyone reaching out about a partnership — no portal account needed. Their response shows up
        below for you to review and decide whether to bring them on board.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="recipient_name">Recipient name</Label>
          <Input id="recipient_name" name="recipient_name" placeholder="For your reference" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient_email">Recipient email</Label>
          <Input id="recipient_email" name="recipient_email" type="email" placeholder="For your reference" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires_in_days">Expires in (days) *</Label>
          <Input id="expires_in_days" name="expires_in_days" type="number" min={1} max={90} defaultValue={7} required />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate link"}
      </Button>

      {generatedUrl && (
        <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3">
          <code className="flex-1 truncate text-xs">{generatedUrl}</code>
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      )}
    </form>
  );
}
