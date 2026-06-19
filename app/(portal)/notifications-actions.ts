"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";

export async function markNotificationRead(id: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/", "layout");
}
