"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";
import { encrypt } from "@/lib/encryption";
import { testConnection } from "@/lib/mail/imap";

export type FormState = { error?: string; success?: string } | undefined;

const connectSchema = z.object({
  email_address: z.string().email(),
  password: z.string().min(1, "Password is required"),
  is_shared: z.string().optional(),
  for_user_id: z.string().optional(),
});

export async function connectMailbox(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = connectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const isShared = parsed.data.is_shared === "on";
  const ownerId = isShared && isDirector(user.role) && parsed.data.for_user_id
    ? parsed.data.for_user_id
    : user.id;

  // Only a Director can connect a mailbox on someone else's behalf or mark it shared.
  if ((isShared || ownerId !== user.id) && !isDirector(user.role)) {
    return { error: "Only a Director can connect a shared mailbox." };
  }

  const host = process.env.MAIL_SERVER_HOST ?? "mail.veltronpartners.com";
  const imapPort = Number(process.env.MAIL_IMAP_PORT ?? 993);
  const smtpPort = Number(process.env.MAIL_SMTP_PORT ?? 465);

  const result = await testConnection({
    host,
    port: imapPort,
    email: parsed.data.email_address,
    password: parsed.data.password,
  });
  if (!result.ok) {
    return { error: "Couldn't connect to the mailbox: " + result.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mailbox_connections").upsert(
    {
      user_id: ownerId,
      email_address: parsed.data.email_address,
      is_shared: isShared,
      encrypted_password: encrypt(parsed.data.password),
      imap_host: host,
      imap_port: imapPort,
      smtp_host: host,
      smtp_port: smtpPort,
      is_connected: true,
      last_connection_check: new Date().toISOString(),
    },
    { onConflict: "user_id,email_address" },
  );
  if (error) return { error: "Couldn't save the connection: " + error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "mailbox_connection",
    resourceName: parsed.data.email_address,
  });

  revalidatePath("/settings/email-accounts");
  return { success: "Mailbox connected." };
}

export async function disconnectMailbox(id: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("mailbox_connections")
    .select("user_id, email_address")
    .eq("id", id)
    .maybeSingle();
  if (!connection) return;
  if (connection.user_id !== user.id && !isDirector(user.role)) return;

  await supabase.from("mailbox_connections").update({ is_connected: false }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "mailbox_connection",
    resourceName: connection.email_address,
    newValue: { disconnected: true },
  });

  revalidatePath("/settings/email-accounts");
}

export async function grantSharedAccess(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can manage shared mailbox access." };

  const mailboxEmail = (formData.get("mailbox_email") ?? "").toString();
  const grantUserId = (formData.get("user_id") ?? "").toString();
  if (!mailboxEmail || !grantUserId) return { error: "Select a mailbox and a staff member." };

  const supabase = await createClient();
  const { error } = await supabase.from("shared_mailbox_access").insert({
    mailbox_email: mailboxEmail,
    user_id: grantUserId,
    granted_by: user.id,
  });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "shared_mailbox_access",
    resourceName: mailboxEmail,
    newValue: { granted_to: grantUserId },
  });

  revalidatePath("/settings/email-accounts");
  return undefined;
}

export async function revokeSharedAccess(id: string) {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  const { data: access } = await supabase
    .from("shared_mailbox_access")
    .select("mailbox_email, user_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("shared_mailbox_access").delete().eq("id", id);

  if (access) {
    await logAudit({
      actorId: user.id,
      action: "deleted",
      resourceType: "shared_mailbox_access",
      resourceName: access.mailbox_email,
      newValue: { revoked_from: access.user_id },
    });
  }

  revalidatePath("/settings/email-accounts");
}
