"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { NOTIFICATION_CATEGORIES, type CategoryPrefs } from "@/lib/notification-categories";

export async function saveNotificationPreferences(formData: FormData) {
  const user = await getCurrentStaffUser();

  const categories: CategoryPrefs = {} as CategoryPrefs;
  for (const { key } of NOTIFICATION_CATEGORIES) {
    categories[key] = {
      in_app: formData.get(`${key}_in_app`) === "on",
      email: formData.get(`${key}_email`) === "on",
    };
  }

  const supabase = await createClient();
  await supabase
    .from("notification_preferences")
    .upsert({ user_id: user.id, categories }, { onConflict: "user_id" });

  revalidatePath("/settings/notifications");
}
