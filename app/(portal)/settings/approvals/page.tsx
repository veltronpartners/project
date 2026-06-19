import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PolicyRowForm } from "./policy-row-form";

export default async function ApprovalSettingsPage() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: policies }, { data: team }] = await Promise.all([
    supabase.from("approval_policies").select("*").order("tier"),
    supabase.from("users").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Approval Policy</h1>
        <Button asChild variant="outline">
          <Link href="/settings/approvals/acting-ceo">Acting CEO</Link>
        </Button>
      </div>
      <p className="text-sm text-text-muted">
        Tier 1 categories always require the Director (or an active Acting CEO). Tier 2 categories can be
        delegated, optionally with a threshold above which it still routes to the Director.
      </p>

      <div className="space-y-2">
        {(policies ?? []).map((p) => (
          <PolicyRowForm
            key={p.category}
            category={p.category}
            tier={p.tier}
            delegatedToUserId={p.delegated_to_user_id}
            thresholdAmount={p.threshold_amount}
            team={team ?? []}
          />
        ))}
      </div>
    </div>
  );
}
