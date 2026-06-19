"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { decrypt } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { setMessageFlag, moveMessage as imapMoveMessage, type MailAccountCredentials } from "@/lib/mail/imap";
import { sendMail } from "@/lib/mail/smtp";

export type FormState = { error?: string } | undefined;

export async function getMailboxCredentials(mailboxEmail: string): Promise<MailAccountCredentials & { smtpHost: string; smtpPort: number } | null> {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: connection } = await supabase
    .from("mailbox_connections")
    .select("*")
    .eq("email_address", mailboxEmail)
    .eq("is_connected", true)
    .maybeSingle();
  if (!connection) return null;

  if (connection.user_id !== user.id) {
    const { data: access } = await supabase
      .from("shared_mailbox_access")
      .select("id")
      .eq("mailbox_email", mailboxEmail)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!access) return null;
  }

  return {
    host: connection.imap_host,
    port: connection.imap_port,
    smtpHost: connection.smtp_host,
    smtpPort: connection.smtp_port,
    email: connection.email_address,
    password: decrypt(connection.encrypted_password),
  };
}

export async function sendEmail(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const from = (formData.get("from") ?? "").toString();
  const to = (formData.get("to") ?? "").toString();
  const subject = (formData.get("subject") ?? "").toString();
  const body = (formData.get("body") ?? "").toString();
  const cc = (formData.get("cc") ?? "").toString();

  if (!from || !to || !subject || !body) {
    return { error: "From, To, Subject, and Body are required." };
  }

  const creds = await getMailboxCredentials(from);
  if (!creds) return { error: "You don't have access to send from that mailbox." };

  const signature = `<p>${user.full_name}<br/>Veltron Partners Limited<br/>${from}</p>`;
  const result = await sendMail(creds, {
    to,
    cc: cc || undefined,
    subject,
    html: `<div>${body.replace(/\n/g, "<br/>")}</div><hr/>${signature}`,
    fromName: user.full_name,
  });
  if (!result.ok) return { error: "Send failed: " + result.error };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "email",
    resourceName: subject,
    newValue: { from, to, subject },
  });

  revalidatePath("/email");
  return undefined;
}

export async function toggleStar(mailboxEmail: string, folder: string, uid: number, value: boolean) {
  const creds = await getMailboxCredentials(mailboxEmail);
  if (!creds) return;
  await setMessageFlag(creds, folder, uid, "\\Flagged", value);
  revalidatePath("/email");
}

export async function markAsRead(mailboxEmail: string, folder: string, uid: number) {
  const creds = await getMailboxCredentials(mailboxEmail);
  if (!creds) return;
  await setMessageFlag(creds, folder, uid, "\\Seen", true);
  revalidatePath("/email");
}

export async function archiveMessage(mailboxEmail: string, folder: string, uid: number) {
  const creds = await getMailboxCredentials(mailboxEmail);
  if (!creds) return;
  await imapMoveMessage(creds, folder, uid, "Archive");
  revalidatePath("/email");
}

export async function deleteMessage(mailboxEmail: string, folder: string, uid: number) {
  const creds = await getMailboxCredentials(mailboxEmail);
  if (!creds) return;
  await imapMoveMessage(creds, folder, uid, "Trash");
  revalidatePath("/email");
}
