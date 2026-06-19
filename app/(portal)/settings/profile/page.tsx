import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { BackupCodesSection } from "./backup-codes-section";

export default async function ProfileSettingsPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("users")
    .select("two_factor_backup_codes")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Profile Settings</h1>

      <ProfileForm user={user} />
      <PasswordForm />
      <BackupCodesSection remaining={row?.two_factor_backup_codes?.length ?? 0} />
    </div>
  );
}
