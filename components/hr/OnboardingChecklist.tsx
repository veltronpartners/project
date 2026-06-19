"use client";

import { useActionState } from "react";
import { addOnboardingTask, updateOnboardingTaskStatus, type FormState } from "@/app/(portal)/hr/actions";
import type { OnboardingTask } from "@/types";
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

const STATUSES = ["pending", "in_progress", "complete"] as const;

export function OnboardingChecklist({
  userId,
  tasks,
  canManage,
}: {
  userId: string;
  tasks: OnboardingTask[];
  canManage: boolean;
}) {
  const action = addOnboardingTask.bind(null, userId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <div className="space-y-3">
      {canManage && (
        <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
          <div className="space-y-1">
            <Label htmlFor="task_name">Task</Label>
            <Input id="task_name" name="task_name" required className="w-56" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select name="category">
              <SelectTrigger id="category" className="w-40">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system_access">System access</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="introductions">Introductions</SelectItem>
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
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-text-muted">No onboarding tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">{t.task_name}</p>
                <p className="text-xs text-text-muted">
                  {t.category ?? "general"}
                  {t.due_date && ` · Due ${new Date(t.due_date).toLocaleDateString()}`}
                </p>
              </div>
              <select
                className="rounded border border-border bg-background px-2 py-1 text-xs"
                defaultValue={t.status}
                onChange={(e) =>
                  updateOnboardingTaskStatus(t.id, userId, e.target.value as (typeof STATUSES)[number])
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
