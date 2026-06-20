import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/permissions";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";

export default async function FinanceOverviewPage() {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "finance")) redirect("/dashboard");

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  const [{ data: budgets }, { data: monthExpenses }, { count: pendingCount }] = await Promise.all([
    supabase.from("finance_budgets").select("total_budget"),
    supabase
      .from("expenses")
      .select("amount")
      .gte("date", startOfMonth.toISOString().slice(0, 10)),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const totalBudget = (budgets ?? []).reduce((sum, b) => sum + (b.total_budget ?? 0), 0);
  const monthSpend = (monthExpenses ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Finance</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/finance/budgets">Budgets</Link>
          </Button>
          <Button asChild>
            <Link href="/finance/expenses">Expenses</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total budgets (all periods)" value={`$${totalBudget.toLocaleString()}`} />
        <StatCard label="Spend this month" value={`$${monthSpend.toLocaleString()}`} />
        <StatCard label="Pending expense approvals" value={pendingCount ?? 0} />
      </div>
    </div>
  );
}
