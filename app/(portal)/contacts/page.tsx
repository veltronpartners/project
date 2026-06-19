import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Contact } from "@/types";

export default async function ContactsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const { q, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("contacts").select("*").neq("status", "archived").order("full_name");
  if (q) query = query.ilike("full_name", `%${q}%`);
  if (type) query = query.eq("contact_type", type);
  const { data: contacts } = await query;
  const rows = (contacts ?? []) as Contact[];

  const csvRows = rows.map((c) => ({
    name: c.full_name,
    organisation: c.organisation ?? "",
    role: c.role_title ?? "",
    type: c.contact_type ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    status: c.status,
    last_contact: c.last_contact ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Contacts &amp; Partners Directory</h1>
        <div className="flex gap-2">
          <ExportCsvButton filename="veltron-contacts.csv" rows={csvRows} />
          {canEdit(user.role, "contacts") && (
            <Button asChild>
              <Link href="/contacts/new">Add Contact</Link>
            </Button>
          )}
        </div>
      </div>

      <form className="flex gap-2" method="get">
        <Input name="q" placeholder="Search by name" defaultValue={q ?? ""} className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No contacts yet — add your first one." />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Organisation</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{c.organisation ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{c.contact_type ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{c.email ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{c.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-text-muted">
                    {c.last_contact ? new Date(c.last_contact).toLocaleDateString() : "—"}
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
