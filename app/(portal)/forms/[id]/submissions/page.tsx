import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-muted text-text-muted",
  in_progress: "bg-warning/15 text-warning",
  submitted: "bg-veltron-gold-muted text-veltron-charcoal",
  reopened: "bg-danger/15 text-danger",
  accepted: "bg-success/15 text-success",
  expired: "bg-danger/15 text-danger",
};

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("id, title").eq("id", id).maybeSingle();
  if (!form) notFound();

  const { data: assignments } = await supabase
    .from("form_assignments")
    .select("*, partner_contacts(full_name), portfolio_companies(name)")
    .eq("form_id", id)
    .order("sent_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Submissions — {form.title}</h1>

      {!assignments || assignments.length === 0 ? (
        <EmptyState message="This form hasn't been assigned to anyone yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Partner</th>
                <th className="px-4 py-2 font-medium">Portfolio</th>
                <th className="px-4 py-2 font-medium">Deadline</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/forms/${id}/submissions/${a.id}`} className="font-medium hover:underline">
                      {(a.partner_contacts as unknown as { full_name: string } | null)?.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {(a.portfolio_companies as unknown as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {a.deadline ? new Date(a.deadline).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge className={cn("border-0 capitalize", STATUS_STYLES[a.status])}>
                      {a.status.replace("_", " ")}
                    </Badge>
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
