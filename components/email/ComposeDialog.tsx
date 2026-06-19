"use client";

import { useActionState, useState } from "react";
import { sendEmail, type FormState } from "@/app/(portal)/email/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ComposeDialog({
  mailboxes,
  defaultFrom,
  prefill,
}: {
  mailboxes: string[];
  defaultFrom: string;
  prefill?: { to?: string; subject?: string; body?: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(sendEmail, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Compose</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {mailboxes.length > 1 ? (
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Select name="from" defaultValue={defaultFrom}>
                <SelectTrigger id="from">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mailboxes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <input type="hidden" name="from" value={defaultFrom} />
          )}
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="email" required defaultValue={prefill?.to ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cc">Cc</Label>
            <Input id="cc" name="cc" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required defaultValue={prefill?.subject ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" rows={8} required defaultValue={prefill?.body ?? ""} />
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Send"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
