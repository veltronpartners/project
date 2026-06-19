"use client";

import { useActionState } from "react";
import { upsertStaffProfile, type FormState } from "../../actions";
import type { StaffProfile, User } from "@/types";
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

export function ProfileForm({
  staffUser,
  profile,
  team,
  showSensitiveFields,
}: {
  staffUser: User;
  profile: StaffProfile | null;
  team: { id: string; full_name: string }[];
  showSensitiveFields: boolean;
}) {
  const action = upsertStaffProfile.bind(null, staffUser.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employment_type">Employment type</Label>
          <Select name="employment_type" defaultValue={profile?.employment_type ?? undefined}>
            <SelectTrigger id="employment_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full time</SelectItem>
              <SelectItem value="part_time">Part time</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="advisor">Advisor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_status">Contract status</Label>
          <Select name="contract_status" defaultValue={profile?.contract_status ?? undefined}>
            <SelectTrigger id="contract_status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending_renewal">Pending renewal</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={profile?.start_date ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporting_to">Reporting to</Label>
          <Select name="reporting_to" defaultValue={profile?.reporting_to ?? undefined}>
            <SelectTrigger id="reporting_to">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {team.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={profile?.timezone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_country">Location / country</Label>
          <Input id="location_country" name="location_country" defaultValue={profile?.location_country ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency contact name</Label>
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={profile?.emergency_contact_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency contact phone</Label>
          <Input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            defaultValue={profile?.emergency_contact_phone ?? ""}
          />
        </div>
      </div>

      {showSensitiveFields && (
        <div className="space-y-4 rounded-md border border-veltron-gold/30 bg-accent/20 p-4">
          <p className="text-xs font-medium text-text-muted">Director-only fields</p>
          <div className="space-y-2">
            <Label htmlFor="remuneration">Remuneration</Label>
            <Input id="remuneration" name="remuneration" defaultValue={profile?.remuneration ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="performance_notes">Performance notes</Label>
            <Textarea
              id="performance_notes"
              name="performance_notes"
              rows={3}
              defaultValue={profile?.performance_notes ?? ""}
            />
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
