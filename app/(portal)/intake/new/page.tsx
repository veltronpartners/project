import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { IntakeForm } from "./intake-form";

export default async function NewIntakePage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) redirect("/intake");

  const supabase = await createClient();
  const { data: team } = await supabase.from("users").select("id, full_name").order("full_name");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">New Engagement Intake</h1>
      <IntakeForm team={team ?? []} />
    </div>
  );
}
