"use client";

import { approveBudget } from "@/app/(portal)/finance/actions";
import { Button } from "@/components/ui/button";

export function ApproveBudgetButton({ budgetId }: { budgetId: string }) {
  return (
    <Button type="button" size="sm" onClick={() => approveBudget(budgetId)}>
      Approve
    </Button>
  );
}
