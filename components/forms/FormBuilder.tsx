"use client";

import { useActionState, useState } from "react";
import { saveForm, type FormState } from "@/app/(portal)/forms/actions";
import type { FormField, FormSchema } from "@/lib/forms/schema";
import { FIELD_TYPE_LABELS, type FieldType } from "@/lib/forms/schema";
import type { FormRecord } from "@/types";
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
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[];
const FORM_TYPES = ["onboarding", "periodic_report", "document_request", "annual_review", "exit", "custom"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function FormBuilder({ form }: { form?: FormRecord }) {
  const action = saveForm.bind(null, form?.id ?? null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const [schema, setSchema] = useState<FormSchema>(form?.schema ?? { sections: [{ id: uid(), title: "Section 1", fields: [] }] });

  function addSection() {
    setSchema((s) => ({ sections: [...s.sections, { id: uid(), title: `Section ${s.sections.length + 1}`, fields: [] }] }));
  }
  function removeSection(sectionId: string) {
    setSchema((s) => ({ sections: s.sections.filter((sec) => sec.id !== sectionId) }));
  }
  function updateSectionTitle(sectionId: string, title: string) {
    setSchema((s) => ({ sections: s.sections.map((sec) => (sec.id === sectionId ? { ...sec, title } : sec)) }));
  }
  function addField(sectionId: string) {
    const field: FormField = { id: uid(), type: "short_text", label: "Untitled question", required: false };
    setSchema((s) => ({
      sections: s.sections.map((sec) => (sec.id === sectionId ? { ...sec, fields: [...sec.fields, field] } : sec)),
    }));
  }
  function updateField(sectionId: string, fieldId: string, patch: Partial<FormField>) {
    setSchema((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, fields: sec.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
          : sec,
      ),
    }));
  }
  function removeField(sectionId: string, fieldId: string) {
    setSchema((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, fields: sec.fields.filter((f) => f.id !== fieldId) } : sec,
      ),
    }));
  }
  function moveField(sectionId: string, fieldId: string, dir: -1 | 1) {
    setSchema((s) => ({
      sections: s.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const idx = sec.fields.findIndex((f) => f.id === fieldId);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= sec.fields.length) return sec;
        const fields = [...sec.fields];
        [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
        return { ...sec, fields };
      }),
    }));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="schema" value={JSON.stringify(schema)} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Form title *</Label>
          <Input id="title" name="title" required defaultValue={form?.title ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form_type">Form type</Label>
          <Select name="form_type" defaultValue={form?.form_type ?? "custom"}>
            <SelectTrigger id="form_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description / cover note shown to partner</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={form?.description ?? ""} />
      </div>

      <div className="space-y-4">
        {schema.sections.map((section) => (
          <div key={section.id} className="space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center gap-2">
              <Input
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                className="font-medium"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {section.fields.map((field, idx) => (
                <div key={field.id} className="space-y-2 rounded-md bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                      className="flex-1"
                      placeholder="Question label"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(section.id, field.id, { type: v as FieldType })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {FIELD_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1 text-xs">
                      <Checkbox
                        checked={field.required ?? false}
                        onCheckedChange={(v) => updateField(section.id, field.id, { required: Boolean(v) })}
                      />
                      Required
                    </label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveField(section.id, field.id, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveField(section.id, field.id, 1)}
                      disabled={idx === section.fields.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeField(section.id, field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {(field.type === "dropdown" || field.type === "multi_select") && (
                    <Input
                      placeholder="Options, comma separated"
                      value={field.options?.join(", ") ?? ""}
                      onChange={(e) =>
                        updateField(section.id, field.id, {
                          options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => addField(section.id)}>
              Add field
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addSection}>
          Add section
        </Button>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : form ? "Save changes" : "Create form"}
      </Button>
    </form>
  );
}
