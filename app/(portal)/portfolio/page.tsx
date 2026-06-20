import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioCompany, User } from "@/types";

export default async function PortfolioListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("portfolio_companies").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (status) query = query.eq("status", status);

  const { data: portfolios } = await query;
  const rows = (portfolios ?? []) as PortfolioCompany[];

  const leadIds = [...new Set(rows.map((p) => p.veltron_lead_id).filter(Boolean))];
  const { data: leads } = leadIds.length
    ? await supabase.from("users").select("id, full_name").in("id", leadIds as string[])
    : { data: [] as Pick<User, "id" | "full_name">[] };
  const leadNameById = new Map((leads ?? []).map((l) => [l.id, l.full_name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Portfolio</h1>
        {canEdit(user.role, "portfolio") && (
          <Button asChild>
            <Link href="/portfolio/new">Add New Portfolio</Link>
          </Button>
        )}
      </div>

      <form className="flex gap-2" method="get">
        <Input
          name="q"
          placeholder="Search by company name"
          defaultValue={q ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No portfolio companies yet — add your first one to get started." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Industry</th>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Lead</th>
                <th className="px-4 py-2 font-medium">Health</th>
                <th className="px-4 py-2 font-medium">Next Check-in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/portfolio/${p.id}`} className="font-medium text-foreground hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{p.industry ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{p.stage ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">
                    {p.veltron_lead_id ? leadNameById.get(p.veltron_lead_id) ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <HealthBadge status={p.health_indicator} />
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {p.next_checkin ? new Date(p.next_checkin).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
