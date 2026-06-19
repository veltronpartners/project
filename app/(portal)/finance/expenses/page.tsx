import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { ExpenseDecisionButtons } from "@/components/finance/ExpenseDecisionButtons";
import { ExpenseForm } from "./expense-form";
import type { Expense } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  declined: "bg-danger/15 text-danger",
  reimbursed: "bg-muted text-text-muted",
};

const EXPENSE_THRESHOLD = 500;

export default async function ExpensesPage() {
  const user = await getCurrentStaffUser();
  const canManage = user.role === "director" || user.role === "finance_officer";
  const supabase = await createClient();

  let query = supabase.from("expenses").select("*").order("created_at", { ascending: false });
  if (!canManage) query = query.eq("submitted_by", user.id);
  const [{ data: expenses }, { data: portfolios }] = await Promise.all([
    query,
    supabase.from("portfolio_companies").select("id, name").order("name"),
  ]);
  const rows = (expenses ?? []) as Expense[];

  const submitterIds = [...new Set(rows.map((e) => e.submitted_by).filter(Boolean))];
  const { data: people } = submitterIds.length
    ? await supabase.from("users").select("id, full_name").in("id", submitterIds as string[])
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Expenses</h1>

      <ExpenseForm portfolios={portfolios ?? []} />

      {rows.length === 0 ? (
        <EmptyState message="No expenses yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <Link href={`/finance/expenses/${e.id}`} className="min-w-0 flex-1">
                <p className="font-medium">{e.description}</p>
                <p className="text-xs text-text-muted">
                  {canManage && `${nameById.get(e.submitted_by ?? "") ?? "—"} · `}
                  {e.category ?? "uncategorised"} ·{" "}
                  {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                  {e.amount > EXPENSE_THRESHOLD && " · needs two-person approval"}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <span className={cn("font-medium", e.amount > EXPENSE_THRESHOLD && "text-danger")}>
                  {e.currency} {e.amount.toLocaleString()}
                </span>
                <Badge className={cn("border-0 capitalize", STATUS_STYLES[e.status])}>{e.status}</Badge>
                {canManage && e.status === "pending" && <ExpenseDecisionButtons expenseId={e.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
