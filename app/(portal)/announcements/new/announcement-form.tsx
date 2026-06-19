"use client";

import { useActionState } from "react";
import { createAnnouncement, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnnouncementForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createAnnouncement, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body *</Label>
        <Textarea id="body" name="body" rows={4} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires_at">Expires (optional)</Label>
          <Input id="expires_at" name="expires_at" type="date" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pinned" name="pinned" />
        <Label htmlFor="pinned" className="font-normal">Pin to top</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="slack_posted" name="slack_posted" />
        <Label htmlFor="slack_posted" className="font-normal">
          Push to Slack once published (requires Slack integration to be connected)
        </Label>
      </div>

      <p className="text-xs text-text-muted">
        Company-wide announcements are Tier 1 — this submits for Director approval before it goes live (Section 12.2).
      </p>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit for approval"}
      </Button>
    </form>
  );
}
