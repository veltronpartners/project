import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { withDefaults } from "@/lib/notification-categories";
import { PreferencesForm } from "./preferences-form";

export default async function NotificationSettingsPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const [{ data: prefRow }, { data: mailbox }] = await Promise.all([
    supabase.from("notification_preferences").select("categories").eq("user_id", user.id).maybeSingle(),
    supabase.from("mailbox_connections").select("id").eq("user_id", user.id).eq("is_connected", true).limit(1).maybeSingle(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-text-muted">Choose how you want to hear about activity in the portal.</p>
      </div>
      <PreferencesForm initial={withDefaults(prefRow?.categories)} hasMailbox={Boolean(mailbox)} />
    </div>
  );
}
