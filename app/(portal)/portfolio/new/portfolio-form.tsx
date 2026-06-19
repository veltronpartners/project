"use client";

import { useActionState } from "react";
import { createPortfolio, type FormState } from "../actions";
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

const STAGES = ["idea", "pre-revenue", "revenue-generating", "scaling", "growth"];
const ENGAGEMENT_TYPES = ["partnerships", "fundraising", "advisory", "execution", "combination"];
const CADENCES = ["weekly", "biweekly", "monthly"];

export function PortfolioForm({ leads }: { leads: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createPortfolio,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Company name *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legal_name">Legal name</Label>
          <Input id="legal_name" name="legal_name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hq_location">HQ location</Label>
          <Input id="hq_location" name="hq_location" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select name="stage">
            <SelectTrigger id="stage">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="engagement_type">Engagement type</Label>
          <Select name="engagement_type">
            <SelectTrigger id="engagement_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ENGAGEMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="veltron_lead_id">Veltron Lead</Label>
          <Select name="veltron_lead_id">
            <SelectTrigger id="veltron_lead_id">
              <SelectValue placeholder="Assign a lead" />
            </SelectTrigger>
            <SelectContent>
              {leads.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporting_cadence">Reporting cadence</Label>
          <Select name="reporting_cadence">
            <SelectTrigger id="reporting_cadence">
              <SelectValue placeholder="Select cadence" />
            </SelectTrigger>
            <SelectContent>
              {CADENCES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="top_priority">Top priority</Label>
        <Input id="top_priority" name="top_priority" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="key_risk">Key risk</Label>
        <Input id="key_risk" name="key_risk" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create portfolio company"}
      </Button>
    </form>
  );
}
