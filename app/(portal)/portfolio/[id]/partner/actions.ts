"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";

export type FormState = { error?: string } | undefined;

export async function getPartnerDocumentUrl(storagePath: string): Promise<string | null> {
  await getCurrentStaffUser();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

const contactSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  role_title: z.string().optional(),
  contact_type: z.enum(["primary", "secondary"]),
});

export async function addPartnerContact(
  portfolioId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) return { error: "You don't have permission to add partner contacts." };

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  const supabase = await createClient();
  const { error } = await supabase.from("partner_contacts").insert({
    portfolio_id: portfolioId,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    role_title: parsed.data.role_title || null,
    contact_type: parsed.data.contact_type,
  });
  if (error) return { error: "Couldn't add contact: " + error.message };

  await logAudit({ actorId: user.id, action: "created", resourceType: "partner_contact", resourceName: parsed.data.full_name });
  revalidatePath(`/portfolio/${portfolioId}/partner`);
  return undefined;
}

export async function replyToPartner(
  portfolioId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const text = (formData.get("message_text") ?? "").toString().trim();
  if (!text) return { error: "Message can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("partner_messages").insert({
    portfolio_id: portfolioId,
    sender_type: "veltron_staff",
    sender_staff_id: user.id,
    message_text: text,
  });
  if (error) return { error: error.message };

  await logAudit({ actorId: user.id, action: "created", resourceType: "partner_message", resourceId: portfolioId });

  revalidatePath(`/portfolio/${portfolioId}/partner`);
  return undefined;
}

const actionSchema = z.object({
  partner_contact_id: z.string().min(1, "Select a partner contact"),
  title: z.string().min(1, "Title is required"),
});

export async function addPartnerAction(
  portfolioId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = actionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  const supabase = await createClient();
  const { error } = await supabase.from("partner_actions").insert({
    portfolio_id: portfolioId,
    partner_contact_id: parsed.data.partner_contact_id,
    assigned_by: user.id,
    title: parsed.data.title,
    description: (formData.get("description") ?? "").toString() || null,
    due_date: (formData.get("due_date") ?? "").toString() || null,
  });
  if (error) return { error: error.message };

  await logAudit({ actorId: user.id, action: "created", resourceType: "partner_action", resourceName: parsed.data.title });

  revalidatePath(`/portfolio/${portfolioId}/partner`);
  return undefined;
}

export async function reviewPartnerDocument(documentId: string, portfolioId: string, status: "accepted" | "rejected") {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) return;

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("partner_documents")
    .select("title, partner_contact_id")
    .eq("id", documentId)
    .maybeSingle();

  await supabase
    .from("partner_documents")
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", documentId);

  await logAudit({ actorId: user.id, action: status === "accepted" ? "approved" : "declined", resourceType: "partner_document", resourceId: documentId });
  revalidatePath(`/portfolio/${portfolioId}/partner`);
}

export async function toggleReportSchedule(
  portfolioId: string,
  partnerContactId: string,
  cadence: "weekly" | "biweekly" | "monthly" | "off",
) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) return;

  const supabase = await createClient();
  if (cadence === "off") {
    await supabase
      .from("partner_report_schedule")
      .update({ is_active: false })
      .eq("portfolio_id", portfolioId)
      .eq("partner_contact_id", partnerContactId);
  } else {
    await supabase.from("partner_report_schedule").upsert(
      {
        portfolio_id: portfolioId,
        partner_contact_id: partnerContactId,
        cadence,
        is_active: true,
      },
      { onConflict: "portfolio_id,partner_contact_id" },
    );
  }
  await logAudit({ actorId: user.id, action: "updated", resourceType: "partner_report_schedule", newValue: { cadence } });
  revalidatePath(`/portfolio/${portfolioId}/partner`);
}
