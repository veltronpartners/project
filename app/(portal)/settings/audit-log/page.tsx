import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@/types";

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ resource_type?: string; from?: string; to?: string; page?: string }>;
}) {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "audit_log")) redirect("/dashboard");

  const { resource_type, from, to, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (resource_type) query = query.eq("resource_type", resource_type);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: entries, count } = await query;
  const rows = (entries ?? []) as AuditLogEntry[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const filterParams = new URLSearchParams();
  if (resource_type) filterParams.set("resource_type", resource_type);
  if (from) filterParams.set("from", from);
  if (to) filterParams.set("to", to);
  function pageHref(p: number) {
    const params = new URLSearchParams(filterParams);
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length
    ? await supabase.from("users").select("id, full_name").in("id", actorIds as string[])
    : { data: [] as { id: string; full_name: string }[] };
  const actorNameById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));

  const csvRows = rows.map((r) => ({
    timestamp: r.created_at,
    actor: r.actor_id ? actorNameById.get(r.actor_id) ?? r.actor_id : "System",
    action: r.action,
    resource_type: r.resource_type,
    resource_name: r.resource_name ?? "",
    old_value: r.old_value ? JSON.stringify(r.old_value) : "",
    new_value: r.new_value ? JSON.stringify(r.new_value) : "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-text-muted">{count ?? 0} entries total</p>
        </div>
        <ExportCsvButton filename="veltron-audit-log-page.csv" rows={csvRows} />
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <Input name="resource_type" placeholder="Resource type (e.g. portfolio)" defaultValue={resource_type ?? ""} className="w-56" />
        <Input name="from" type="date" defaultValue={from ?? ""} />
        <Input name="to" type="date" defaultValue={to ?? ""} />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No activity has been logged yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Timestamp</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Resource</th>
                <th className="px-4 py-2 font-medium">Name</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="px-4 py-2 text-text-muted">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {entry.actor_id ? actorNameById.get(entry.actor_id) ?? "—" : "System"}
                  </td>
                  <td className="px-4 py-2 capitalize">{entry.action.replace("_", " ")}</td>
                  <td className="px-4 py-2 text-text-muted">{entry.resource_type}</td>
                  <td className="px-4 py-2">{entry.resource_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(page - 1)}>Previous</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(page + 1)}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
