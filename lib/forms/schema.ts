export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "date"
  | "dropdown"
  | "multi_select"
  | "yes_no"
  | "file_upload"
  | "signature"
  | "rating"
  | "section_header";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  helpText?: string;
  required?: boolean;
  options?: string[]; // dropdown / multi_select
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormSchema {
  sections: FormSection[];
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  number: "Number",
  date: "Date",
  dropdown: "Dropdown",
  multi_select: "Multi-select",
  yes_no: "Yes / No",
  file_upload: "File Upload",
  signature: "Digital Signature",
  rating: "Rating Scale (1-5)",
  section_header: "Section Header",
};

export type FormAnswers = Record<string, string | string[] | boolean | null>;
