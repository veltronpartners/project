"use client";

import { useActionState } from "react";
import { grantSharedAccess, revokeSharedAccess, type FormState } from "./actions";
import type { SharedMailboxAccess } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ShareAccessForm({
  sharedMailboxes,
  team,
  access,
  nameById,
}: {
  sharedMailboxes: string[];
  team: { id: string; full_name: string }[];
  access: SharedMailboxAccess[];
  nameById: Map<string, string>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(grantSharedAccess, undefined);

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Shared mailbox access</h3>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <Select name="mailbox_email">
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Mailbox" />
          </SelectTrigger>
          <SelectContent>
            {sharedMailboxes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="user_id">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Grant to" />
          </SelectTrigger>
          <SelectContent>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          {pending ? "Granting…" : "Grant access"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      {access.length > 0 && (
        <div className="space-y-1">
          {access.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span>
                {a.mailbox_email} → {nameById.get(a.user_id) ?? "—"}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => revokeSharedAccess(a.id)}>
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
