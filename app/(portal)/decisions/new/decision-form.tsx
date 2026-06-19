"use client";

import { useActionState, useState } from "react";
import { createDecision, type FormState } from "../actions";
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

const CATEGORIES = [
  "partnership",
  "fundraising",
  "scope",
  "hiring",
  "legal",
  "financial",
  "strategy",
  "operations",
  "other",
];

export function DecisionForm({
  portfolios,
  team,
  escalationGuide,
}: {
  portfolios: { id: string; name: string }[];
  team: { id: string; full_name: string }[];
  escalationGuide: { category: string; must_consult: string; notes: string | null }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createDecision, undefined);
  const [category, setCategory] = useState("");
  const guideRow = escalationGuide.find((g) => g.category === category);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portfolio_id">Portfolio company (optional)</Label>
          <Select name="portfolio_id">
            <SelectTrigger id="portfolio_id">
              <SelectValue placeholder="Internal / not linked" />
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
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" value={category} onValueChange={setCategory} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="decision_summary">Decision summary</Label>
          <Textarea id="decision_summary" name="decision_summary" rows={2} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rationale">Rationale</Label>
          <Textarea id="rationale" name="rationale" rows={3} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="options_considered">Options considered</Label>
          <Textarea
            id="options_considered"
            name="options_considered"
            rows={2}
            placeholder="List the alternatives that were weighed"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="decision_maker_id">Decision maker</Label>
          <Select name="decision_maker_id">
            <SelectTrigger id="decision_maker_id">
              <SelectValue placeholder="Select decision maker" />
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
          <Label htmlFor="stakeholders_informed">Stakeholders informed</Label>
          <Input id="stakeholders_informed" name="stakeholders_informed" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="due_date">Due date</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review_date">Review date</Label>
            <Input id="review_date" name="review_date" type="date" />
          </div>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log decision"}
        </Button>
      </form>

      <aside className="space-y-2 rounded-md border border-veltron-gold/30 bg-accent/30 p-4">
        <h3 className="font-heading text-sm font-semibold">Escalation guide</h3>
        {guideRow ? (
          <div className="text-sm">
            <p className="font-medium text-foreground">{guideRow.must_consult}</p>
            {guideRow.notes && <p className="mt-1 text-text-muted">{guideRow.notes}</p>}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Select a category to see who must be consulted.</p>
        )}
      </aside>
    </div>
  );
}
