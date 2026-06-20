"use client";

import { useActionState, useState } from "react";
import { createGroupChannel, type FormState } from "@/app/(portal)/chat/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";

export function NewGroupDialog({ team }: { team: { id: string; full_name: string; username: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(createGroupChannel, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <Users className="h-4 w-4" />
          New group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New group chat</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group name *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {team.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <Checkbox name="member_ids" value={m.id} />
                  {m.full_name} <span className="text-xs text-text-muted">@{m.username}</span>
                </label>
              ))}
            </div>
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
