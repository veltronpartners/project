"use client";

import { useActionState } from "react";
import { uploadSignedCopy, type FormState } from "../actions";
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

export function UploadForm({ portfolios }: { portfolios: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(uploadSignedCopy, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document_title">Document title *</Label>
        <Input id="document_title" name="document_title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Signed file *</Label>
        <Input id="file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="externally_signed_date">Date signed *</Label>
          <Input id="externally_signed_date" name="externally_signed_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externally_signed_by">Signed by (name/role) *</Label>
          <Input id="externally_signed_by" name="externally_signed_by" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="external_signing_tool">Method</Label>
          <Select name="external_signing_tool">
            <SelectTrigger id="external_signing_tool">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Wet Ink">Wet Ink</SelectItem>
              <SelectItem value="DocuSign">DocuSign</SelectItem>
              <SelectItem value="Other E-Sign Tool">Other E-Sign Tool</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
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
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "File signed document"}
      </Button>
    </form>
  );
}
