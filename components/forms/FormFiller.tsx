"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveFormProgress,
  submitForm,
  uploadFormFieldFile,
  getFormFieldFileUrl,
} from "@/app/(partner)/partner/actions";
import type { FormAnswers, FormSchema } from "@/lib/forms/schema";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldInput, type FieldValue } from "@/components/forms/FieldInput";

export function FormFiller({
  assignmentId,
  schema,
  initialAnswers,
  readOnly,
}: {
  assignmentId: string;
  schema: FormSchema;
  initialAnswers: FormAnswers;
  readOnly: boolean;
}) {
  const [answers, setAnswers] = useState<FormAnswers>(initialAnswers ?? {});
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection] = useState(0);
  const router = useRouter();

  function updateAnswer(fieldId: string, value: FieldValue) {
    const next = { ...answers, [fieldId]: value };
    setAnswers(next);
    startTransition(() => {
      saveFormProgress(assignmentId, next);
    });
  }

  const allFields = schema.sections.flatMap((s) => s.fields).filter((f) => f.type !== "section_header");
  const missingFields = allFields.filter((f) => {
    if (!f.required) return false;
    const v = answers[f.id];
    return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  });

  async function handleSubmit() {
    setError(null);
    if (missingFields.length > 0) {
      setError(`Please complete: ${missingFields.map((f) => f.label).join(", ")}`);
      return;
    }
    setSubmitting(true);
    const result = await submitForm(assignmentId, answers);
    setSubmitting(false);
    if (result?.error) setError(result.error);
    else {
      setSubmitted(true);
      router.refresh();
    }
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-6 text-center">
        <p className="font-medium text-success">Submitted — thank you.</p>
        <p className="mt-1 text-sm text-text-muted">Your Veltron Lead has been notified.</p>
      </div>
    );
  }

  const isLastSection = section === schema.sections.length - 1;
  const currentSection = schema.sections[section];

  return (
    <div className="space-y-6">
      {schema.sections.length > 1 && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Section {section + 1} of {schema.sections.length}: {currentSection.title}
          </span>
          {isPending && <span>Saving…</span>}
        </div>
      )}

      <div className="space-y-4 rounded-md border border-border p-4">
        {schema.sections.length === 1 && <h3 className="font-heading text-sm font-semibold">{currentSection.title}</h3>}
        {currentSection.fields.map((field) =>
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
                disabled={readOnly}
                onUploadFile={(fieldId, file) => uploadFormFieldFile(assignmentId, fieldId, file)}
                onViewFile={getFormFieldFileUrl}
              />
            </div>
          ),
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSection((s) => Math.max(0, s - 1))}
          disabled={section === 0}
        >
          Back
        </Button>

        {!readOnly && isLastSection && (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        )}
        {!isLastSection && (
          <Button type="button" onClick={() => setSection((s) => Math.min(schema.sections.length - 1, s + 1))}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
