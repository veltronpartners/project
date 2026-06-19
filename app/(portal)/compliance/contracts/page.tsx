import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, isDirector } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ContractStatusSelect } from "@/components/compliance/ContractStatusSelect";
import { ContractForm } from "./contract-form";
import type { Contract } from "@/types";

function expiryDot(contract: Contract) {
  if (!contract.expiry_date) return "bg-muted";
  const daysLeft = (new Date(contract.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "bg-danger";
  if (daysLeft <= 60) return "bg-warning";
  return "bg-success";
}

export default async function ContractsPage() {
  const user = await getCurrentStaffUser();
  const canManage = user.role === "director" || user.role === "compliance_officer";
  if (!hasAccess(user.role, "compliance") && user.role !== "partnerships_officer") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: contracts }, { data: portfolios }] = await Promise.all([
    supabase.from("contracts").select("*").order("expiry_date"),
    supabase.from("portfolio_companies").select("id, name").order("name"),
  ]);
  const rows = (contracts ?? []) as Contract[];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Contract Tracker</h1>

      {canManage && <ContractForm portfolios={portfolios ?? []} />}

      {rows.length === 0 ? (
        <EmptyState message="No contracts on file yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${expiryDot(c)}`} />
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-text-muted">
                    {c.contract_type?.replace("_", " ") ?? "—"} · {c.counterparty ?? "—"}
                    {c.expiry_date && ` · expires ${new Date(c.expiry_date).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              {canManage ? (
                <ContractStatusSelect contractId={c.id} status={c.status} />
              ) : (
                <span className="text-xs capitalize text-text-muted">{c.status.replace("_", " ")}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
