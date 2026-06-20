"use client";

import { useActionState } from "react";
import { uploadPartnerDocument, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UploadForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(uploadPartnerDocument, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Send us your files</h3>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="other">
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">File *</Label>
          <Input id="file" name="file" type="file" required accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Notes</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Uploaded — thank you.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
