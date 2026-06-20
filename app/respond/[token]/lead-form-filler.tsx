"use client";

import { useActionState, useState } from "react";
import { submitLeadResponse, uploadLeadFile, viewLeadFile, type SubmitState } from "./actions";
import type { FormAnswers } from "@/lib/forms/schema";
import type { FormRecord } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldInput, type FieldValue } from "@/components/forms/FieldInput";

export function LeadFormFiller({ token, form }: { token: string; form: FormRecord }) {
  const action = submitLeadResponse.bind(null, token);
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(action, undefined);
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  function updateAnswer(fieldId: string, value: FieldValue) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  const allFields = form.schema.sections.flatMap((s) => s.fields).filter((f) => f.type !== "section_header");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const missing = allFields.filter((f) => {
      if (!f.required) return false;
      const v = answers[f.id];
      return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    });
    if (missing.length > 0) {
      e.preventDefault();
      setValidationError(`Please complete: ${missing.map((f) => f.label).join(", ")}`);
    } else {
      setValidationError(null);
    }
  }

  if (state?.success) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-8 text-center">
        <p className="font-heading text-lg font-semibold text-success">Thank you — received.</p>
        <p className="mt-2 text-sm text-text-muted">
          Someone from Veltron Partners will review your response and follow up if there&apos;s a fit.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      <div className="space-y-4 rounded-md border border-border p-4">
        <h3 className="font-heading text-sm font-semibold">About you</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="respondent_name">Your name *</Label>
            <Input id="respondent_name" name="respondent_name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="respondent_email">Your email *</Label>
            <Input id="respondent_email" name="respondent_email" type="email" required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="respondent_company">Company / Organisation</Label>
            <Input id="respondent_company" name="respondent_company" />
          </div>
        </div>
      </div>

      {form.schema.sections.map((section) => (
        <div key={section.id} className="space-y-4 rounded-md border border-border p-4">
          <h3 className="font-heading text-sm font-semibold">{section.title}</h3>
          {section.fields.map((field) =>
            field.type === "section_header" ? (
              <FieldInput key={field.id} field={field} value={null} onChange={() => {}} disabled />
            ) : (
              <div key={field.id} className="space-y-1">
                <Label>
                  {field.label} {field.required && <span className="text-danger">*</span>}
                </Label>
                {field.helpText && <p className="text-xs text-text-muted">{field.helpText}</p>}
                <FieldInput
                  field={field}
                  value={answers[field.id] ?? null}
                  onChange={(v) => updateAnswer(field.id, v)}
                  disabled={false}
                  onUploadFile={(fieldId, file) => uploadLeadFile(token, fieldId, file)}
                  onViewFile={viewLeadFile}
                />
              </div>
            ),
          )}
        </div>
      ))}

      {(validationError || state?.error) && <p className="text-sm text-danger">{validationError ?? state?.error}</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
