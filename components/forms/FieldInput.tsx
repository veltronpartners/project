"use client";

import { useState } from "react";
import type { FormField } from "@/lib/forms/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, X } from "lucide-react";

export type FieldValue = string | string[] | boolean | null;

function fileNameFromPath(path: string) {
  const last = path.split("/").pop() ?? path;
  return last.replace(/^[0-9a-f-]{36}-/, "");
}

function FileUploadInput({
  fieldId,
  value,
  onChange,
  disabled,
  onUploadFile,
  onViewFile,
}: {
  fieldId: string;
  value: string | null;
  onChange: (path: string | null) => void;
  disabled: boolean;
  onUploadFile: (fieldId: string, file: File) => Promise<{ path?: string; error?: string }>;
  onViewFile: (path: string) => Promise<string | null>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const result = await onUploadFile(fieldId, file);
    setUploading(false);
    if (result.error) setError(result.error);
    else if (result.path) onChange(result.path);
  }

  async function handleView() {
    if (!value) return;
    const url = await onViewFile(value);
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

export function FieldInput({
  field,
  value,
  onChange,
  disabled,
  onUploadFile,
  onViewFile,
}: {
  field: FormField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  disabled: boolean;
  onUploadFile?: (fieldId: string, file: File) => Promise<{ path?: string; error?: string }>;
  onViewFile?: (path: string) => Promise<string | null>;
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
      if (!onUploadFile || !onViewFile) {
        return <p className="text-xs text-text-muted">File upload isn&apos;t available in this context.</p>;
      }
      return (
        <FileUploadInput
          fieldId={field.id}
          value={(value as string) ?? null}
          onChange={onChange}
          disabled={disabled}
          onUploadFile={onUploadFile}
          onViewFile={onViewFile}
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
