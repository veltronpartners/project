"use client";

import { decideExpense } from "@/app/(portal)/finance/actions";
import { Button } from "@/components/ui/button";

export function ExpenseDecisionButtons({ expenseId }: { expenseId: string }) {
  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={() => decideExpense(expenseId, "approved")}>
        Approve
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => decideExpense(expenseId, "declined")}>
        Decline
      </Button>
    </div>
  );
}
