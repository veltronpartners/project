"use client";

import { useActionState } from "react";
import { submitLeaveRequest, type FormState } from "../actions";
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

export function LeaveForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitLeaveRequest, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Request leave</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="leave_type">Type</Label>
          <Select name="leave_type" defaultValue="annual">
            <SelectTrigger id="leave_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="sick">Sick</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div />
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date *</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date *</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" rows={2} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
