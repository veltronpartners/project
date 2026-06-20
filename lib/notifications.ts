import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";
import { sendMail } from "@/lib/mail/smtp";
import { withDefaults } from "@/lib/notification-categories";
import type { Notification } from "@/types";

export async function createNotification(params: {
  userId: string;
  type: Notification["type"];
  title: string;
  message?: string;
  link?: string;
}) {
  // Admin client throughout: createNotification is only ever called from
  // trusted server-side code, and the recipient is often not the calling
  // request's own session (e.g. a partner notifying their Veltron Lead),
  // so per-request RLS clients can't reliably read prefs or write the row.
  const admin = createAdminClient();
  const { data: prefRow } = await admin
    .from("notification_preferences")
    .select("categories")
    .eq("user_id", params.userId)
    .maybeSingle();
  const prefs = withDefaults(prefRow?.categories)[params.type];

  if (prefs.in_app) {
    const { error } = await admin.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message ?? null,
      link: params.link ?? null,
    });
    if (error) console.error("Failed to create notification", error);
  }

  if (prefs.email) {
    await relayNotificationEmail(params.userId, params.title, params.message);
  }
}

/**
 * Notify a portfolio's assigned Veltron Lead, or every Director if no
 * lead is assigned -- a partner action (message, document, meeting
 * request, form submission) should never go completely unseen just
 * because a portfolio company hasn't had a lead assigned yet.
 */
export async function notifyPortfolioLeadOrDirectors(
  portfolioVeltronLeadId: string | null | undefined,
  params: Omit<Parameters<typeof createNotification>[0], "userId">,
) {
  if (portfolioVeltronLeadId) {
    await createNotification({ ...params, userId: portfolioVeltronLeadId });
    return;
  }

  const admin = createAdminClient();
  const { data: directors } = await admin.from("users").select("id").eq("role", "director");
  await notifyMany((directors ?? []).map((d) => d.id), params);
}

async function relayNotificationEmail(userId: string, title: string, message?: string) {
  // Admin client: a notification recipient often isn't the calling
  // request's session (e.g. a partner notifying their Veltron Lead), so
  // this can't go through the cookie-scoped RLS client.
  const admin = createAdminClient();
  const { data: mailbox } = await admin
    .from("mailbox_connections")
    .select("email_address, encrypted_password, smtp_host, smtp_port")
    .eq("user_id", userId)
    .eq("is_connected", true)
    .limit(1)
    .maybeSingle();
  if (!mailbox) return;

  try {
    await sendMail(
      {
        host: mailbox.smtp_host,
        port: mailbox.smtp_port,
        email: mailbox.email_address,
        password: decrypt(mailbox.encrypted_password),
        smtpHost: mailbox.smtp_host,
        smtpPort: mailbox.smtp_port,
      },
      {
        to: mailbox.email_address,
        subject: `Veltron Portal: ${title}`,
        html: `<p>${title}</p>${message ? `<p>${message}</p>` : ""}`,
        fromName: "Veltron Portal",
      },
    );
  } catch (error) {
    console.error("Failed to relay notification email", error);
  }
}

export async function notifyMany(
  userIds: string[],
  params: Omit<Parameters<typeof createNotification>[0], "userId">,
) {
  await Promise.all(
    [...new Set(userIds)].map((userId) => createNotification({ ...params, userId })),
  );
}
