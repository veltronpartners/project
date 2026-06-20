"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveFormProgress,
  submitForm,
  uploadFormFieldFile,
  getFormFieldFileUrl,
} from "@/app/(partner)/partner/actions";
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
import { Paperclip, X } from "lucide-react";

function fileNameFromPath(path: string) {
  const last = path.split("/").pop() ?? path;
  return last.replace(/^[0-9a-f-]{36}-/, "");
}

function FileUploadInput({
  assignmentId,
  fieldId,
  value,
  onChange,
  disabled,
}: {
  assignmentId: string;
  fieldId: string;
  value: string | null;
  onChange: (path: string | null) => void;
  disabled: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const result = await uploadFormFieldFile(assignmentId, fieldId, file);
    setUploading(false);
    if (result.error) setError(result.error);
    else if (result.path) onChange(result.path);
  }

  async function handleView() {
    if (!value) return;
    const url = await getFormFieldFileUrl(value);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else setError("Couldn't open this file.");
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Paperclip className="h-4 w-4 shrink-0 text-text-muted" />
        <button type="button" onClick={handleView} className="truncate text-left hover:underline">
          {fileNameFromPath(value)}
        </button>
        {!disabled && (
          <button type="button" onClick={() => onChange(null)} className="ml-auto text-text-muted hover:text-danger">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Input
        type="file"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading && <p className="text-xs text-text-muted">Uploading…</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function FieldInput({
  assignmentId,
  field,
  value,
  onChange,
  disabled,
}: {
  assignmentId: string;
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
      return (
        <FileUploadInput
          assignmentId={assignmentId}
          fieldId={field.id}
          value={(value as string) ?? null}
          onChange={onChange}
          disabled={disabled}
        />
      );
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
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection] = useState(0);
  const router = useRouter();

  function updateAnswer(fieldId: string, value: string | string[] | boolean | null) {
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
            <FieldInput
              key={field.id}
              assignmentId={assignmentId}
              field={field}
              value={null}
              onChange={() => {}}
              disabled
            />
          ) : (
            <div key={field.id} className="space-y-1">
              <Label>
                {field.label} {field.required && <span className="text-danger">*</span>}
              </Label>
              {field.helpText && <p className="text-xs text-text-muted">{field.helpText}</p>}
              <FieldInput
                assignmentId={assignmentId}
                field={field}
                value={answers[field.id] ?? null}
                onChange={(v) => updateAnswer(field.id, v)}
                disabled={readOnly}
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
