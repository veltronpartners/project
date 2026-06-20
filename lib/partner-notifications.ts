import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PartnerNotification } from "@/types";

/**
 * Notifies a partner contact of a staff-side action (form assigned,
 * message reply, action assigned, document/submission reviewed). Uses
 * the admin client since the caller is almost always a staff session,
 * not the partner's own -- same reasoning as lib/notifications.ts.
 */
export async function createPartnerNotification(params: {
  partnerContactId: string;
  type: PartnerNotification["type"];
  title: string;
  message?: string;
  link?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("partner_notifications").insert({
    partner_contact_id: params.partnerContactId,
    type: params.type,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
  });
  if (error) console.error("Failed to create partner notification", error);
}
