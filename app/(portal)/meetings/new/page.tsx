import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { MeetingForm } from "./meeting-form";

export default async function NewMeetingPage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "calendar")) redirect("/meetings");

  const supabase = await createClient();
  const [{ data: team }, { data: portfolios }] = await Promise.all([
    supabase.from("users").select("id, full_name").order("full_name"),
    supabase.from("portfolio_companies").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Schedule Meeting</h1>
      <MeetingForm team={team ?? []} portfolios={portfolios ?? []} />
    </div>
  );
}
