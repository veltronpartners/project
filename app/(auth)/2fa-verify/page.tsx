import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/shared/AuthShell";
import { VerifyForm } from "./verify-form";

export default async function TwoFaVerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("users")
    .select("two_factor_enabled")
    .eq("id", user.id)
    .maybeSingle();

  let enabled = staffRow?.two_factor_enabled ?? null;
  if (enabled === null) {
    const { data: partnerRow } = await supabase
      .from("partner_contacts")
      .select("two_factor_enabled")
      .eq("id", user.id)
      .maybeSingle();
    enabled = partnerRow?.two_factor_enabled ?? false;
  }

  if (!enabled) redirect("/2fa-setup");

  return (
    <AuthShell
      title="Two-factor verification"
      description="Enter the code from your authenticator app to continue."
    >
      <VerifyForm />
    </AuthShell>
  );
}
