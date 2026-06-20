"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";
import { createPartnerNotification } from "@/lib/partner-notifications";

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
  password: z.string().min(8, "Temporary password must be at least 8 characters"),
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

  // Bug fix: this used to only insert a partner_contacts row with a random
  // id, never creating an actual Supabase Auth account -- the contact had
  // no way to ever log in. Mirror createStaffAccount's pattern: create the
  // auth user first, then the domain row with the SAME id.
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: "Couldn't create the login: " + (createError?.message ?? "unknown error") };
  }

  const { error } = await admin.from("partner_contacts").insert({
    id: created.user.id,
    portfolio_id: portfolioId,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    role_title: parsed.data.role_title || null,
    contact_type: parsed.data.contact_type,
    is_active: true,
  });
  if (error) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Couldn't save the contact record: " + error.message };
  }

  await logAudit({
    actorId: user.id,
    action: "invited",
    resourceType: "partner_contact",
    resourceId: created.user.id,
    resourceName: parsed.data.full_name,
    newValue: { email: parsed.data.email, portfolio_id: portfolioId },
  });
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

  const { data: contacts } = await supabase
    .from("partner_contacts")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("is_active", true);
  await Promise.all(
    (contacts ?? []).map((c) =>
      createPartnerNotification({
        partnerContactId: c.id,
        type: "message",
        title: `New message from ${user.full_name}`,
        message: text.slice(0, 100),
        link: "/partner/messages",
      }),
    ),
  );

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

  await createPartnerNotification({
    partnerContactId: parsed.data.partner_contact_id,
    type: "action_assigned",
    title: `New action: ${parsed.data.title}`,
    message: (formData.get("description") ?? "").toString() || undefined,
    link: "/partner/actions",
  });

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

  if (doc?.partner_contact_id) {
    await createPartnerNotification({
      partnerContactId: doc.partner_contact_id,
      type: "document_reviewed",
      title: status === "accepted" ? `Document accepted: ${doc.title}` : `Document needs attention: ${doc.title}`,
      link: "/partner/documents",
    });
  }

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
