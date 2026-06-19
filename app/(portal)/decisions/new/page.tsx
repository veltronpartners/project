import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { DecisionForm } from "./decision-form";

export default async function NewDecisionPage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "decisions")) redirect("/decisions");

  const supabase = await createClient();
  const [{ data: portfolios }, { data: team }, { data: escalationGuide }] = await Promise.all([
    supabase.from("portfolio_companies").select("id, name").order("name"),
    supabase.from("users").select("id, full_name").order("full_name"),
    supabase.from("decision_escalation_guide").select("category, must_consult, notes").order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Log a Decision</h1>
      <DecisionForm
        portfolios={portfolios ?? []}
        team={team ?? []}
        escalationGuide={escalationGuide ?? []}
      />
    </div>
  );
}
