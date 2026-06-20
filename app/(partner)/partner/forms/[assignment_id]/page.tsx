import { notFound } from "next/navigation";
import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { FormFiller } from "@/components/forms/FormFiller";
import type { FormRecord } from "@/types";

export default async function FillFormPage({
  params,
}: {
  params: Promise<{ assignment_id: string }>;
}) {
  const { assignment_id } = await params;
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("form_assignments")
    .select("*, forms(*)")
    .eq("id", assignment_id)
    .eq("partner_contact_id", partner.id)
    .maybeSingle();
  if (!assignment) notFound();

  const { data: submission } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("assignment_id", assignment_id)
    .maybeSingle();

  const form = assignment.forms as unknown as FormRecord;
  const readOnly = assignment.status === "submitted" || assignment.status === "accepted";

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{form.title}</h1>
        {assignment.cover_note && <p className="mt-1 text-sm text-text-muted">{assignment.cover_note}</p>}
        {assignment.review_flag && (
          <p className="mt-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            Reopened by Veltron: {assignment.review_flag}
          </p>
        )}
      </div>
      <FormFiller
        assignmentId={assignment_id}
        schema={form.schema}
        initialAnswers={submission?.answers ?? {}}
        readOnly={readOnly}
      />
    </div>
  );
}
