import type { FormSchema, FormAnswers } from "@/lib/forms/schema";

function renderValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function SubmissionAnswers({ schema, answers }: { schema: FormSchema; answers: FormAnswers }) {
  return (
    <div className="space-y-6">
      {schema.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h3 className="font-heading text-sm font-semibold">{section.title}</h3>
          <dl className="space-y-2 rounded-md border border-border p-4">
            {section.fields.map((field) => (
              <div key={field.id}>
                <dt className="text-xs text-text-muted">{field.label}</dt>
                <dd className="text-sm">{renderValue(answers[field.id])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
