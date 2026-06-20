import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { GenerateLinkForm } from "./generate-link-form";
import { RevokeLinkButton } from "./revoke-link-button";
import type { FormLinkToken } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/15 text-success",
  submitted: "bg-veltron-gold-muted text-veltron-charcoal",
  expired: "bg-muted text-text-muted",
  revoked: "bg-danger/15 text-danger",
};

export default async function FormLinksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("id, title").eq("id", id).maybeSingle();
  if (!form) notFound();

  const { data: links } = await supabase
    .from("form_link_tokens")
    .select("*")
    .eq("form_id", id)
    .order("created_at", { ascending: false });

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const rows = (links ?? []) as FormLinkToken[];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Shareable Links — {form.title}</h1>

      <GenerateLinkForm formId={id} origin={origin} />

      {rows.length === 0 ? (
        <EmptyState message="No links generated yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Recipient</th>
                <th className="px-4 py-2 font-medium">Expires</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((link) => (
                <tr key={link.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {link.recipient_name || link.recipient_email || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-2 text-text-muted">{new Date(link.expires_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <Badge className={`border-0 capitalize ${STATUS_STYLES[link.status]}`}>{link.status}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    {link.status === "active" && <RevokeLinkButton linkId={link.id} formId={id} />}
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
