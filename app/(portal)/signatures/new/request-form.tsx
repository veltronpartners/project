"use client";

import { useActionState, useState } from "react";
import { createSignatureRequest, type FormState } from "../actions";
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

type SignerRow = { name: string; email: string; internalId: string };

export function RequestForm({ team, portfolios }: { team: { id: string; full_name: string; email: string }[]; portfolios: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createSignatureRequest, undefined);
  const [signers, setSigners] = useState<SignerRow[]>([{ name: "", email: "", internalId: "" }]);

  function updateSigner(i: number, patch: Partial<SignerRow>) {
    setSigners((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function pickInternal(i: number, userId: string) {
    const member = team.find((m) => m.id === userId);
    updateSigner(i, { internalId: userId, name: member?.full_name ?? "", email: member?.email ?? "" });
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="document_title">Document title *</Label>
        <Input id="document_title" name="document_title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Document *</Label>
        <Input id="file" name="file" type="file" required accept=".pdf,.docx" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="portfolio_id">Linked portfolio</Label>
        <Select name="portfolio_id">
          <SelectTrigger id="portfolio_id">
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
      <div className="space-y-2">
        <Label htmlFor="signing_order">Signing order</Label>
        <Select name="signing_order" defaultValue="sequential">
          <SelectTrigger id="signing_order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">Sequential</SelectItem>
            <SelectItem value="parallel">Parallel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Signers</Label>
        {signers.map((signer, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
            <div className="space-y-1">
              <Label className="text-xs">Internal staff (optional)</Label>
              <Select onValueChange={(v) => pickInternal(i, v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Or pick staff" />
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
              <Label className="text-xs">Name</Label>
              <Input
                name="signer_name"
                value={signer.name}
                onChange={(e) => updateSigner(i, { name: e.target.value })}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                name="signer_email"
                type="email"
                value={signer.email}
                onChange={(e) => updateSigner(i, { email: e.target.value })}
                className="w-52"
              />
            </div>
            <input type="hidden" name="signer_internal_id" value={signer.internalId} />
            {signers.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSigners((rows) => rows.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSigners((rows) => [...rows, { name: "", email: "", internalId: "" }])}
        >
          Add signer
        </Button>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send for signature"}
      </Button>
    </form>
  );
}
