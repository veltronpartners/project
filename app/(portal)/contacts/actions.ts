"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

const contactSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  organisation: z.string().optional(),
  role_title: z.string().optional(),
  contact_type: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export async function createContact(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "contacts")) {
    return { error: "You don't have permission to add a contact." };
  }

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      full_name: parsed.data.full_name,
      organisation: emptyToNull(formData.get("organisation")),
      role_title: emptyToNull(formData.get("role_title")),
      contact_type: emptyToNull(formData.get("contact_type")),
      email: emptyToNull(formData.get("email")),
      phone: emptyToNull(formData.get("phone")),
      linkedin_url: emptyToNull(formData.get("linkedin_url")),
      website: emptyToNull(formData.get("website")),
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      notes: emptyToNull(formData.get("notes")),
      added_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't add the contact. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "contact",
    resourceId: data.id,
    resourceName: parsed.data.full_name,
    newValue: parsed.data,
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}`);
}

export async function updateContact(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "contacts")) {
    return { error: "You don't have permission to edit this contact." };
  }

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const update = {
    full_name: parsed.data.full_name,
    organisation: emptyToNull(formData.get("organisation")),
    role_title: emptyToNull(formData.get("role_title")),
    contact_type: emptyToNull(formData.get("contact_type")),
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    linkedin_url: emptyToNull(formData.get("linkedin_url")),
    website: emptyToNull(formData.get("website")),
    notes: emptyToNull(formData.get("notes")),
    last_contact: new Date().toISOString().slice(0, 10),
  };

  const { error } = await supabase.from("contacts").update(update).eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "contact",
    resourceId: id,
    resourceName: parsed.data.full_name,
    newValue: update,
  });

  revalidatePath(`/contacts/${id}`);
  return undefined;
}

export async function archiveContact(id: string) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "contacts")) return;

  const supabase = await createClient();
  await supabase.from("contacts").update({ status: "archived" }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "archived",
    resourceType: "contact",
    resourceId: id,
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}
