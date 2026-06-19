"use client";

import { useActionState } from "react";
import { uploadDocument, type FormState } from "../actions";
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

const CATEGORIES = [
  "engagement",
  "due_diligence",
  "legal",
  "financial",
  "hr",
  "templates",
  "policies",
  "reports",
];

export function UploadForm({
  portfolios,
  canSetAccessLevel,
}: {
  portfolios: { id: string; name: string }[];
  canSetAccessLevel: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(uploadDocument, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">File *</Label>
        <Input id="file" name="file" type="file" required accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category">
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace("_", " ")}
                </SelectItem>
              ))}
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
        {canSetAccessLevel && (
          <div className="space-y-2">
            <Label htmlFor="access_level">Access level</Label>
            <Select name="access_level" defaultValue="internal">
              <SelectTrigger id="access_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="director_only">Director only</SelectItem>
                <SelectItem value="hr_only">HR only</SelectItem>
                <SelectItem value="compliance_only">Compliance only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
