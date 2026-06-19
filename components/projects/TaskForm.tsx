"use client";

import { useActionState } from "react";
import { addProjectTask, type FormState } from "@/app/(portal)/projects/actions";
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

export function TaskForm({
  projectId,
  members,
}: {
  projectId: string;
  members: { id: string; full_name: string }[];
}) {
  const action = addProjectTask.bind(null, projectId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor="title">Task</Label>
        <Input id="title" name="title" required className="w-56" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="assignee_id">Assignee</Label>
        <Select name="assignee_id">
          <SelectTrigger id="assignee_id" className="w-40">
            <SelectValue placeholder="Assign to" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority" defaultValue="medium">
          <SelectTrigger id="priority" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="due_date">Due date</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add task"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
