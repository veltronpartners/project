"use client";

import { useActionState } from "react";
import { updatePortfolioOverview, type FormState } from "../actions";
import type { PortfolioCompany } from "@/types";
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

export function OverviewForm({
  portfolio,
  leads,
  readOnly,
}: {
  portfolio: PortfolioCompany;
  leads: { id: string; full_name: string }[];
  readOnly: boolean;
}) {
  const action = updatePortfolioOverview.bind(null, portfolio.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <fieldset disabled={readOnly} className="space-y-6 disabled:opacity-70">
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Company name *</Label>
            <Input id="name" name="name" defaultValue={portfolio.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal name</Label>
            <Input id="legal_name" name="legal_name" defaultValue={portfolio.legal_name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={portfolio.industry ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" defaultValue={portfolio.website ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hq_location">HQ location</Label>
            <Input id="hq_location" name="hq_location" defaultValue={portfolio.hq_location ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select name="stage" defaultValue={portfolio.stage ?? undefined}>
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
            <Select name="engagement_type" defaultValue={portfolio.engagement_type ?? undefined}>
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
            <Select name="veltron_lead_id" defaultValue={portfolio.veltron_lead_id ?? undefined}>
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
            <Select name="reporting_cadence" defaultValue={portfolio.reporting_cadence ?? undefined}>
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
          <Input id="top_priority" name="top_priority" defaultValue={portfolio.top_priority ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="key_risk">Key risk</Label>
          <Input id="key_risk" name="key_risk" defaultValue={portfolio.key_risk ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={portfolio.notes ?? ""} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        {!readOnly && (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        )}
      </form>
    </fieldset>
  );
}
