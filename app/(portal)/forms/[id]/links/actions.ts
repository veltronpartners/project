"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";
import { generateLinkToken } from "@/lib/leads/link-flow";

export type FormState = { error?: string; success?: string } | undefined;

const generateSchema = z.object({
  recipient_name: z.string().optional(),
  recipient_email: z.string().email().optional().or(z.literal("")),
  expires_in_days: z.coerce.number().int().min(1).max(90),
});

export async function generateFormLink(formId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return { error: "You don't have permission to generate form links." };

  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  const token = generateLinkToken();
  const expiresAt = new Date(Date.now() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000);

  const supabase = await createClient();
  const { error } = await supabase.from("form_link_tokens").insert({
    form_id: formId,
    token,
    recipient_name: parsed.data.recipient_name || null,
    recipient_email: parsed.data.recipient_email || null,
    created_by: user.id,
    expires_at: expiresAt.toISOString(),
  });
  if (error) return { error: "Couldn't generate the link: " + error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "form_link_token",
    resourceName: parsed.data.recipient_email || parsed.data.recipient_name || "unnamed recipient",
  });

  revalidatePath(`/forms/${formId}/links`);
  return { success: token };
}

export async function revokeFormLink(linkId: string, formId: string) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) return;

  const supabase = await createClient();
  await supabase.from("form_link_tokens").update({ status: "revoked" }).eq("id", linkId).eq("status", "active");

  await logAudit({ actorId: user.id, action: "updated", resourceType: "form_link_token", resourceId: linkId, newValue: { status: "revoked" } });
  revalidatePath(`/forms/${formId}/links`);
}
