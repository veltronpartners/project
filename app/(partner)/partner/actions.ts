"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartner } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import type { FormAnswers } from "@/lib/forms/schema";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function uploadFormFieldFile(
  assignmentId: string,
  fieldId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const partner = await getCurrentPartner();

  if (file.size === 0) return { error: "Empty file." };
  if (file.size > 25 * 1024 * 1024) return { error: "Files must be 25MB or smaller." };

  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("form_assignments")
    .select("id")
    .eq("id", assignmentId)
    .eq("partner_contact_id", partner.id)
    .maybeSingle();
  if (!assignment) return { error: "Form not found." };

  const storagePath = `form-uploads/${partner.id}/${assignmentId}/${fieldId}-${randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) return { error: "Upload failed: " + error.message };

  return { path: storagePath };
}

export async function getFormFieldFileUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function saveFormProgress(assignmentId: string, answers: FormAnswers) {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("form_submissions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("form_submissions")
      .update({ answers, last_saved_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("form_submissions").insert({
      assignment_id: assignmentId,
      partner_contact_id: partner.id,
      answers,
      last_saved_at: new Date().toISOString(),
    });
  }

  await supabase
    .from("form_assignments")
    .update({ status: "in_progress" })
    .eq("id", assignmentId)
    .eq("status", "not_started");

  revalidatePath(`/partner/forms/${assignmentId}`);
}

export async function submitForm(assignmentId: string, answers: FormAnswers): Promise<FormState> {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  await saveFormProgress(assignmentId, answers);

  const { error } = await supabase
    .from("form_submissions")
    .update({ is_complete: true, submitted_at: new Date().toISOString() })
    .eq("assignment_id", assignmentId);
  if (error) return { error: error.message };

  const { data: assignment } = await supabase
    .from("form_assignments")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .select("assigned_by, form_id, forms(title)")
    .single();

  const { notifyPortfolioLeadOrDirectors } = await import("@/lib/notifications");
  await notifyPortfolioLeadOrDirectors(assignment?.assigned_by, {
    type: "flagged_item",
    title: `${partner.full_name} submitted a form`,
    message: (assignment?.forms as unknown as { title: string } | null)?.title,
    link: `/forms/${assignment?.form_id}/submissions/${assignmentId}`,
  });

  await logAudit({
    actorId: partner.id,
    action: "created",
    resourceType: "form_submission",
    resourceId: assignmentId,
  });

  revalidatePath("/partner/forms");
  return { success: true };
}

export async function uploadPartnerDocument(_prevState: FormState, formData: FormData): Promise<FormState> {
  const partner = await getCurrentPartner();
  const file = formData.get("file");
  const title = (formData.get("title") ?? "").toString().trim();
  const category = (formData.get("category") ?? "other").toString();
  const description = (formData.get("description") ?? "").toString();

  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (!title) return { error: "Title is required." };
  if (file.size > 25 * 1024 * 1024) return { error: "Files must be 25MB or smaller." };

  const supabase = await createClient();
  const storagePath = `partner-uploads/${partner.id}/${randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { error } = await supabase.from("partner_documents").insert({
    portfolio_id: partner.portfolio_id,
    partner_contact_id: partner.id,
    title,
    category,
    description: description || null,
    file_url: storagePath,
    file_type: file.type || null,
    file_size_kb: Math.round(file.size / 1024),
  });
  if (error) return { error: error.message };

  const { data: lead } = await supabase
    .from("portfolio_companies")
    .select("veltron_lead_id")
    .eq("id", partner.portfolio_id)
    .maybeSingle();
  const { notifyPortfolioLeadOrDirectors } = await import("@/lib/notifications");
  await notifyPortfolioLeadOrDirectors(lead?.veltron_lead_id, {
    type: "flagged_item",
    title: `${partner.full_name} uploaded a document`,
    message: title,
    link: `/portfolio/${partner.portfolio_id}/partner`,
  });

  await logAudit({
    actorId: partner.id,
    action: "created",
    resourceType: "partner_document",
    resourceName: title,
  });

  revalidatePath("/partner/documents");
  return { success: true };
}

export async function updatePartnerActionStatus(
  actionId: string,
  status: "in_progress" | "done",
  completionNote?: string,
) {
  const partner = await getCurrentPartner();
  const supabase = await createClient();
  await supabase
    .from("partner_actions")
    .update({
      status,
      completion_note: completionNote || null,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", actionId)
    .eq("partner_contact_id", partner.id);

  await logAudit({
    actorId: partner.id,
    action: "updated",
    resourceType: "partner_action",
    resourceId: actionId,
    newValue: { status },
  });

  revalidatePath("/partner/actions");
}

export async function requestMeeting(_prevState: FormState, formData: FormData): Promise<FormState> {
  const partner = await getCurrentPartner();
  const reason = (formData.get("reason") ?? "").toString().trim();
  const preferredDates = (formData.get("preferred_dates") ?? "").toString().trim();
  if (!reason) return { error: "Tell us briefly what it's about." };

  const supabase = await createClient();
  const { data: portfolio } = await supabase
    .from("portfolio_companies")
    .select("veltron_lead_id, name")
    .eq("id", partner.portfolio_id)
    .maybeSingle();

  const { notifyPortfolioLeadOrDirectors } = await import("@/lib/notifications");
  await notifyPortfolioLeadOrDirectors(portfolio?.veltron_lead_id, {
    type: "flagged_item",
    title: `Meeting request from ${partner.full_name}`,
    message: `${reason} — preferred: ${preferredDates || "no preference"}`,
    link: `/portfolio/${partner.portfolio_id}/partner`,
  });

  await logAudit({
    actorId: partner.id,
    action: "created",
    resourceType: "meeting_request",
    resourceName: `${partner.full_name} — ${portfolio?.name ?? ""}`,
  });

  return { success: true };
}

export async function sendPartnerMessage(_prevState: FormState, formData: FormData): Promise<FormState> {
  const partner = await getCurrentPartner();
  const text = (formData.get("message_text") ?? "").toString().trim();
  if (!text) return { error: "Message can't be empty." };
  if (text.length > 2000) return { error: "Messages are limited to 2,000 characters." };

  const supabase = await createClient();
  const { error } = await supabase.from("partner_messages").insert({
    portfolio_id: partner.portfolio_id,
    sender_type: "partner",
    sender_partner_id: partner.id,
    message_text: text,
  });
  if (error) return { error: error.message };

  const { data: portfolio } = await supabase
    .from("portfolio_companies")
    .select("veltron_lead_id")
    .eq("id", partner.portfolio_id)
    .maybeSingle();
  const { notifyPortfolioLeadOrDirectors } = await import("@/lib/notifications");
  await notifyPortfolioLeadOrDirectors(portfolio?.veltron_lead_id, {
    type: "flagged_item",
    title: `Message from ${partner.full_name}`,
    message: text.slice(0, 100),
    link: `/portfolio/${partner.portfolio_id}/partner`,
  });

  await logAudit({
    actorId: partner.id,
    action: "created",
    resourceType: "partner_message",
  });

  revalidatePath("/partner/messages");
  return { success: true };
}
