"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartner } from "@/lib/auth/dal";

export async function markPartnerNotificationRead(id: string) {
  const partner = await getCurrentPartner();
  const supabase = await createClient();
  await supabase.from("partner_notifications").update({ is_read: true }).eq("id", id).eq("partner_contact_id", partner.id);
  revalidatePath("/partner", "layout");
}

export async function markAllPartnerNotificationsRead() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();
  await supabase
    .from("partner_notifications")
    .update({ is_read: true })
    .eq("partner_contact_id", partner.id)
    .eq("is_read", false);
  revalidatePath("/partner", "layout");
}
