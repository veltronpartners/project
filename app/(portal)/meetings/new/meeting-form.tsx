"use client";

import { useActionState } from "react";
import { createMeeting, type FormState } from "../actions";
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

export function MeetingForm({
  team,
  portfolios,
}: {
  team: { id: string; full_name: string }[];
  portfolios: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createMeeting, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting_type">Type</Label>
          <Select name="meeting_type">
            <SelectTrigger id="meeting_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portfolio_checkin">Portfolio check-in</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="board">Board</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date &amp; time *</Label>
          <Input id="date" name="date" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location / link</Label>
          <Input id="location" name="location" />
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

      <div className="space-y-2">
        <Label>Attendees</Label>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
          {team.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <Checkbox name="attendees" value={m.id} />
              {m.full_name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agenda">Agenda</Label>
        <Textarea id="agenda" name="agenda" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Scheduling…" : "Schedule meeting"}
      </Button>
    </form>
  );
}
