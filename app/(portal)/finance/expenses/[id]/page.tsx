import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getSignedReceiptUrl } from "../../actions";
import { ExpenseDecisionButtons } from "@/components/finance/ExpenseDecisionButtons";
import { Badge } from "@/components/ui/badge";
import type { Expense } from "@/types";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: expenseRow } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (!expenseRow) notFound();
  const expense = expenseRow as Expense;

  const { data: submitter } = expense.submitted_by
    ? await supabase.from("users").select("full_name").eq("id", expense.submitted_by).maybeSingle()
    : { data: null };

  const receiptUrl = expense.receipt_url ? await getSignedReceiptUrl(expense.receipt_url) : null;
  const canManage = user.role === "director" || user.role === "finance_officer";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{expense.description}</h1>
          <p className="text-sm text-text-muted">Submitted by {submitter?.full_name ?? "—"}</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {expense.status}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div>
          <dt className="text-text-muted">Amount</dt>
          <dd className="font-medium">
            {expense.currency} {expense.amount.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Category</dt>
          <dd>{expense.category ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Date</dt>
          <dd>{expense.date ? new Date(expense.date).toLocaleDateString() : "—"}</dd>
        </div>
      </dl>

      {receiptUrl ? (
        <div className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">Receipt</h3>
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-veltron-gold underline">
            View receipt
          </a>
        </div>
      ) : (
        <p className="text-sm text-text-muted">No receipt attached.</p>
      )}

      {canManage && expense.status === "pending" && <ExpenseDecisionButtons expenseId={id} />}
    </div>
  );
}
