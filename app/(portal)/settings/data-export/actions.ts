"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";

const EXPORTABLE_TABLES: Record<string, string> = {
  portfolio: "portfolio_companies",
  decisions: "decisions",
  contacts: "contacts",
  finance_expenses: "expenses",
  finance_budgets: "finance_budgets",
  hr_staff_profiles: "staff_profiles",
  compliance_conflicts: "conflict_register",
  compliance_contracts: "contracts",
  projects: "internal_projects",
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
}

export async function exportModuleCsv(moduleKey: string): Promise<{ csv?: string; error?: string }> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can export data." };

  const table = EXPORTABLE_TABLES[moduleKey];
  if (!table) return { error: "Unknown module." };

  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*");
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "data_export",
    resourceName: moduleKey,
  });

  return { csv: toCsv(data ?? []) };
}

export async function exportFullDatabaseJson(): Promise<{ json?: string; error?: string }> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can export data." };

  const supabase = await createClient();
  const result: Record<string, unknown[]> = {};
  for (const [key, table] of Object.entries(EXPORTABLE_TABLES)) {
    const { data } = await supabase.from(table).select("*");
    result[key] = data ?? [];
  }

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "data_export",
    resourceName: "full_database",
  });

  return { json: JSON.stringify(result, null, 2) };
}
