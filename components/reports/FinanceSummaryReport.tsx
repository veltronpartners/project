import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { Expense, FinanceBudget } from "@/types";

export function FinanceSummaryReport({
  expenses,
  budgets,
}: {
  expenses: Expense[];
  budgets: FinanceBudget[];
}) {
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.category ?? "uncategorised";
    acc[key] = (acc[key] ?? 0) + e.amount;
    return acc;
  }, {});

  const totalBudget = budgets.reduce((sum, b) => sum + (b.total_budget ?? 0), 0);
  const totalSpent = expenses
    .filter((e) => e.status === "approved" || e.status === "reimbursed")
    .reduce((sum, e) => sum + e.amount, 0);

  const csvRows = Object.entries(byCategory).map(([category, total]) => ({ category, total }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCsvButton filename="finance-summary.csv" rows={csvRows} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total budget" value={`$${totalBudget.toLocaleString()}`} />
        <StatCard label="Total spent" value={`$${totalSpent.toLocaleString()}`} />
        <StatCard label="Remaining" value={`$${(totalBudget - totalSpent).toLocaleString()}`} />
      </div>
      {Object.keys(byCategory).length === 0 ? (
        <EmptyState message="No expenses recorded yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCategory).map(([category, total]) => (
                <tr key={category} className="border-t border-border">
                  <td className="px-3 py-2 capitalize">{category}</td>
                  <td className="px-3 py-2">${total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
