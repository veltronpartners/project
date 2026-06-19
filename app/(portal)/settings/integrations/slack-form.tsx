"use client";

import { useActionState } from "react";
import { saveSlackSettings, type FormState } from "./actions";
import { SLACK_EVENTS } from "@/lib/slack/events";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function SlackForm({
  channel,
  events,
}: {
  channel: string;
  events: string[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveSlackSettings, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook_url">Incoming webhook URL *</Label>
        <Input id="webhook_url" name="webhook_url" type="url" required placeholder="https://hooks.slack.com/services/..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="channel">Default channel</Label>
        <Input id="channel" name="channel" placeholder="#general" defaultValue={channel} />
      </div>
      <div className="space-y-2">
        <Label>Events that push to Slack</Label>
        <div className="grid gap-2 md:grid-cols-2">
          {SLACK_EVENTS.map((e) => (
            <label key={e.key} className="flex items-center gap-2 text-sm">
              <Checkbox name={`event_${e.key}`} defaultChecked={events.includes(e.key)} />
              {e.label}
            </label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Slack settings"}
      </Button>
    </form>
  );
}
