import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, isDirector } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { ApproveBudgetButton } from "@/components/finance/ApproveBudgetButton";
import { BudgetForm } from "./budget-form";
import type { FinanceBudget } from "@/types";

export default async function BudgetsPage() {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "finance")) redirect("/dashboard");

  const supabase = await createClient();
  const { data: budgets } = await supabase.from("finance_budgets").select("*").order("created_at", { ascending: false });
  const rows = (budgets ?? []) as FinanceBudget[];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Budgets</h1>

      <BudgetForm />

      {rows.length === 0 ? (
        <EmptyState message="No budget periods yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-text-muted">
                  {b.period_start ? new Date(b.period_start).toLocaleDateString() : "—"} –{" "}
                  {b.period_end ? new Date(b.period_end).toLocaleDateString() : "—"} · {b.currency}{" "}
                  {b.total_budget?.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={b.approved ? "default" : "outline"}>
                  {b.approved ? "Approved" : "Pending approval"}
                </Badge>
                {isDirector(user.role) && !b.approved && <ApproveBudgetButton budgetId={b.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
