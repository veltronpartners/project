"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";
import { createPartnerNotification } from "@/lib/partner-notifications";
import type { FormSchema } from "@/lib/forms/schema";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

export async function saveForm(
  formId: string | null,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) {
    return { error: "Only a Director or Veltron Lead can build forms." };
  }

  const title = (formData.get("title") ?? "").toString().trim();
  const formType = (formData.get("form_type") ?? "custom").toString();
  const schemaJson = (formData.get("schema") ?? "").toString();

  if (!title) return { error: "Title is required." };

  let schema: FormSchema;
  try {
    schema = JSON.parse(schemaJson);
  } catch {
    return { error: "Couldn't parse the form schema." };
  }
  if (!schema.sections || schema.sections.length === 0) {
    return { error: "Add at least one section with a field." };
  }

  const supabase = await createClient();

  if (formId) {
    const { error } = await supabase
      .from("forms")
      .update({
        title,
        description: emptyToNull(formData.get("description")),
        form_type: formType,
        schema,
        last_edited_by: user.id,
      })
      .eq("id", formId);
    if (error) return { error: error.message };

    await logAudit({ actorId: user.id, action: "updated", resourceType: "form", resourceId: formId, resourceName: title });
    revalidatePath(`/forms/${formId}`);
    return undefined;
  }

  const { data, error } = await supabase
    .from("forms")
    .insert({
      title,
      description: emptyToNull(formData.get("description")),
      form_type: formType,
      schema,
      status: "draft",
      created_by: user.id,
      last_edited_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Couldn't create the form: " + (error?.message ?? "") };

  await logAudit({ actorId: user.id, action: "created", resourceType: "form", resourceId: data.id, resourceName: title });
  revalidatePath("/forms");
  redirect(`/forms/${data.id}`);
}

export async function setFormStatus(formId: string, status: "draft" | "active" | "archived") {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return;
  const supabase = await createClient();
  await supabase.from("forms").update({ status }).eq("id", formId);
  await logAudit({ actorId: user.id, action: "updated", resourceType: "form", resourceId: formId, newValue: { status } });
  revalidatePath(`/forms/${formId}`);
  revalidatePath("/forms");
}

export async function duplicateForm(formId: string) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return;
  const supabase = await createClient();
  const { data: original } = await supabase.from("forms").select("*").eq("id", formId).maybeSingle();
  if (!original) return;

  const { data: copy } = await supabase
    .from("forms")
    .insert({
      title: `${original.title} (copy)`,
      description: original.description,
      form_type: original.form_type,
      schema: original.schema,
      status: "draft",
      created_by: user.id,
      last_edited_by: user.id,
      is_template: false,
    })
    .select("id")
    .single();

  if (copy) redirect(`/forms/${copy.id}`);
}

const assignSchema = z.object({
  partner_contact_id: z.string().min(1, "Select a partner contact"),
});

export async function assignForm(formId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return { error: "You don't have permission to assign forms." };

  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  const supabase = await createClient();
  const [{ data: contact }, { data: form }] = await Promise.all([
    supabase.from("partner_contacts").select("portfolio_id").eq("id", parsed.data.partner_contact_id).maybeSingle(),
    supabase.from("forms").select("title").eq("id", formId).maybeSingle(),
  ]);
  if (!contact) return { error: "Partner contact not found." };

  const { data: assignment, error } = await supabase
    .from("form_assignments")
    .insert({
      form_id: formId,
      portfolio_id: contact.portfolio_id,
      partner_contact_id: parsed.data.partner_contact_id,
      assigned_by: user.id,
      cover_note: emptyToNull(formData.get("cover_note")),
      deadline: emptyToNull(formData.get("deadline")),
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !assignment) return { error: "Couldn't assign the form: " + (error?.message ?? "") };

  await createPartnerNotification({
    partnerContactId: parsed.data.partner_contact_id,
    type: "form_assigned",
    title: `New form: ${form?.title ?? "Untitled form"}`,
    message: emptyToNull(formData.get("cover_note")) ?? undefined,
    link: `/partner/forms/${assignment.id}`,
  });

  await logAudit({ actorId: user.id, action: "created", resourceType: "form_assignment", resourceId: assignment.id });
  revalidatePath(`/forms/${formId}/submissions`);
  redirect(`/forms/${formId}/submissions`);
}

export async function reviewSubmission(
  submissionId: string,
  assignmentId: string,
  decision: "accepted" | "reopened",
  flagNote?: string,
) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return;

  const supabase = await createClient();
  await supabase
    .from("form_assignments")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_flag: decision === "reopened" ? flagNote ?? null : null,
    })
    .eq("id", assignmentId);

  const { data: assignment } = await supabase
    .from("form_assignments")
    .select("partner_contact_id, form_id, forms(title)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignment?.partner_contact_id) {
    const formTitle = (assignment.forms as unknown as { title: string } | null)?.title ?? "your form";
    await createPartnerNotification({
      partnerContactId: assignment.partner_contact_id,
      type: "form_reviewed",
      title: decision === "accepted" ? `Submission accepted: ${formTitle}` : `Changes requested: ${formTitle}`,
      message: decision === "reopened" ? flagNote : undefined,
      link: `/partner/forms/${assignmentId}`,
    });
  }

  await logAudit({
    actorId: user.id,
    action: decision === "accepted" ? "approved" : "updated",
    resourceType: "form_submission",
    resourceId: submissionId,
  });

  revalidatePath(`/forms/${assignment?.form_id}/submissions`);
}
