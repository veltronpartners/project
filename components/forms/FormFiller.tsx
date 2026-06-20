"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFormProgress, submitForm } from "@/app/(partner)/partner/actions";
import type { FormAnswers, FormField, FormSchema } from "@/lib/forms/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string | string[] | boolean | null;
  onChange: (v: string | string[] | boolean | null) => void;
  disabled: boolean;
}) {
  switch (field.type) {
    case "section_header":
      return <h4 className="font-heading text-sm font-semibold">{field.label}</h4>;
    case "long_text":
      return (
        <Textarea
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "dropdown":
      return (
        <Select value={(value as string) ?? undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multi_select": {
      const selected = (value as string[]) ?? [];
      return (
        <div className="space-y-1">
          {(field.options ?? []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(o)}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...selected, o] : selected.filter((s) => s !== o))
                }
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "yes_no":
      return (
        <Select
          value={value === true ? "yes" : value === false ? "no" : undefined}
          onValueChange={(v) => onChange(v === "yes")}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      );
    case "rating":
      return (
        <Select value={(value as string) ?? undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "signature":
      return (
        <Input
          placeholder="Type your full name"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="font-display italic"
        />
      );
    case "file_upload":
      return <p className="text-xs text-text-muted">File upload — attach via Documents and reference it in notes.</p>;
    default:
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
  }
}

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
  const router = useRouter();

  function updateAnswer(fieldId: string, value: string | string[] | boolean | null) {
    const next = { ...answers, [fieldId]: value };
    setAnswers(next);
    startTransition(() => {
      saveFormProgress(assignmentId, next);
    });
  }

  const requiredMissing = schema.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.required && f.type !== "section_header")
    .some((f) => {
      const v = answers[f.id];
      return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    });

  async function handleSubmit() {
    setError(null);
    const result = await submitForm(assignmentId, answers);
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

  return (
    <div className="space-y-6">
      {schema.sections.map((section) => (
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
                  disabled={readOnly}
                />
              </div>
            ),
          )}
        </div>
      ))}

      {isPending && <p className="text-xs text-text-muted">Saving…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!readOnly && (
        <Button onClick={handleSubmit} disabled={requiredMissing}>
          Submit
        </Button>
      )}
    </div>
  );
}
