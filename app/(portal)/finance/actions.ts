"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

function canManageFinance(role: string) {
  return role === "director" || role === "finance_officer";
}

const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  total_budget: z.string().min(1, "Total budget is required"),
});

export async function createBudget(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canManageFinance(user.role)) {
    return { error: "Only the Finance Officer or a Director can create a budget." };
  }

  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_budgets")
    .insert({
      name: parsed.data.name,
      period_start: emptyToNull(formData.get("period_start")),
      period_end: emptyToNull(formData.get("period_end")),
      total_budget: Number(parsed.data.total_budget),
      approved: isDirector(user.role),
      approved_by: isDirector(user.role) ? user.id : null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn't create the budget. " + (error?.message ?? "") };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "finance_budget",
    resourceId: data.id,
    resourceName: parsed.data.name,
  });

  revalidatePath("/finance/budgets");
  return undefined;
}

export async function approveBudget(id: string) {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  await supabase.from("finance_budgets").update({ approved: true, approved_by: user.id }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "approved",
    resourceType: "finance_budget",
    resourceId: id,
  });

  revalidatePath("/finance/budgets");
}

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().optional(),
  date: z.string().optional(),
});

export async function submitExpense(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  let receiptPath: string | null = null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    receiptPath = `receipts/${randomUUID()}-${receipt.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(receiptPath, receipt);
    if (uploadError) return { error: "Receipt upload failed: " + uploadError.message };
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      submitted_by: user.id,
      category: emptyToNull(formData.get("category")),
      description: parsed.data.description,
      amount: Number(parsed.data.amount),
      date: emptyToNull(formData.get("date")) ?? new Date().toISOString().slice(0, 10),
      receipt_url: receiptPath,
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      project_id: emptyToNull(formData.get("project_id")),
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn't submit the expense. " + (error?.message ?? "") };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "expense",
    resourceId: data.id,
    resourceName: parsed.data.description,
    newValue: parsed.data,
  });

  const { data: financeStaff } = await supabase
    .from("users")
    .select("id")
    .in("role", ["finance_officer", "director"]);
  await Promise.all(
    (financeStaff ?? []).map((s) =>
      createNotification({
        userId: s.id,
        type: "flagged_item",
        title: `Expense submitted — ${parsed.data.description}`,
        message: `${parsed.data.amount} by ${user.full_name}`,
        link: `/finance/expenses/${data.id}`,
      }),
    ),
  );

  revalidatePath("/finance/expenses");
  return undefined;
}

export async function decideExpense(id: string, status: "approved" | "declined" | "reimbursed") {
  const user = await getCurrentStaffUser();
  if (!canManageFinance(user.role)) return;

  const supabase = await createClient();
  const { data: expense } = await supabase
    .from("expenses")
    .select("submitted_by, description")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("expenses")
    .update({ status, approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", id);

  if (expense) {
    await createNotification({
      userId: expense.submitted_by,
      type: "flagged_item",
      title: `Expense ${status} — ${expense.description}`,
      link: `/finance/expenses/${id}`,
    });
  }

  await logAudit({
    actorId: user.id,
    action: status === "approved" ? "approved" : status === "declined" ? "declined" : "updated",
    resourceType: "expense",
    resourceId: id,
  });

  revalidatePath("/finance/expenses");
  revalidatePath(`/finance/expenses/${id}`);
}

export async function getSignedReceiptUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}
