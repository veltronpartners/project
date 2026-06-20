"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";
import type { FormSchema } from "@/lib/forms/schema";

function answersToNoteText(schema: FormSchema, answers: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === "section_header") continue;
      const value = answers[field.id];
      if (value === null || value === undefined || value === "") continue;
      const display = Array.isArray(value) ? value.join(", ") : String(value);
      lines.push(`${field.label}: ${display}`);
    }
  }
  return lines.join("\n");
}

export async function declineLead(submissionId: string, formId: string) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return;

  const supabase = await createClient();
  await supabase
    .from("lead_form_submissions")
    .update({ review_decision: "declined", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);

  await logAudit({ actorId: user.id, action: "declined", resourceType: "lead_form_submission", resourceId: submissionId });
  revalidatePath(`/forms/${formId}/leads`);
}

export async function moveLeadToIntake(submissionId: string, formId: string): Promise<{ error?: string }> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return { error: "You don't have permission to do this." };

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("lead_form_submissions")
    .select("*, forms(schema)")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) return { error: "Submission not found." };

  const { data: engagement, error } = await supabase
    .from("engagements")
    .insert({
      company_name: submission.respondent_company || submission.respondent_name,
      source: "inbound",
      officer_id: user.id,
      lead_id: user.id,
    })
    .select("id")
    .single();
  if (error || !engagement) return { error: "Couldn't create the engagement: " + (error?.message ?? "") };

  const schema = (submission.forms as unknown as { schema: FormSchema } | null)?.schema;
  const noteText = [
    `Converted from a shareable form link response.`,
    `Respondent: ${submission.respondent_name} <${submission.respondent_email}>`,
    schema ? answersToNoteText(schema, submission.answers) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  await supabase.from("engagement_notes").insert({
    engagement_id: engagement.id,
    stage: 1,
    author_id: user.id,
    note_text: noteText,
  });

  await supabase
    .from("lead_form_submissions")
    .update({
      review_decision: "move_to_intake",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      linked_engagement_id: engagement.id,
    })
    .eq("id", submissionId);

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "engagement",
    resourceId: engagement.id,
    resourceName: submission.respondent_company || submission.respondent_name,
  });

  revalidatePath(`/forms/${formId}/leads`);
  revalidatePath("/intake");
  return {};
}
