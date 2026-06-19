import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ActingCeoForm } from "./acting-ceo-form";
import { endActingCeoPeriod } from "../actions";

export default async function ActingCeoPage() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: activePeriod }, { data: team }] = await Promise.all([
    supabase.from("acting_ceo_periods").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("users").select("id, full_name").neq("id", user.id).order("full_name"),
  ]);

  let activeName: string | null = null;
  if (activePeriod) {
    const { data: activeUser } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", activePeriod.delegated_to_user_id)
      .maybeSingle();
    activeName = activeUser?.full_name ?? null;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Acting CEO</h1>

      {activePeriod ? (
        <div className="space-y-3 rounded-md border border-veltron-gold/30 bg-accent/30 p-4">
          <p className="text-sm">
            <span className="font-medium">{activeName ?? "A staff member"}</span> is currently Acting CEO,
            since {new Date(activePeriod.start_date).toLocaleDateString()}
            {activePeriod.end_date && ` until ${new Date(activePeriod.end_date).toLocaleDateString()}`}.
          </p>
          <form action={endActingCeoPeriod}>
            <Button type="submit" variant="outline">
              End Acting CEO period now
            </Button>
          </form>
        </div>
      ) : (
        <ActingCeoForm team={team ?? []} />
      )}
    </div>
  );
}
