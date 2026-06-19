import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { EditForm } from "./edit-form";
import { archiveContact } from "../actions";
import type { Contact } from "@/types";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: contactRow } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
  if (!contactRow) notFound();
  const contact = contactRow as Contact;

  const { data: portfolio } = contact.portfolio_id
    ? await supabase.from("portfolio_companies").select("id, name").eq("id", contact.portfolio_id).maybeSingle()
    : { data: null };

  const { data: documents } = contact.portfolio_id
    ? await supabase.from("documents").select("id, title").eq("portfolio_id", contact.portfolio_id)
    : { data: null };

  const editable = canEdit(user.role, "contacts");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{contact.full_name}</h1>
          <p className="text-sm text-text-muted">
            {contact.role_title ?? "—"} {contact.organisation ? `at ${contact.organisation}` : ""}
          </p>
        </div>
        {editable && contact.status !== "archived" && (
          <form action={archiveContact.bind(null, id)}>
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        )}
      </div>

      {portfolio && (
        <div className="rounded-md border border-border p-3 text-sm">
          Linked portfolio:{" "}
          <Link href={`/portfolio/${portfolio.id}`} className="text-veltron-gold hover:underline">
            {portfolio.name}
          </Link>
        </div>
      )}

      <EditForm contact={contact} readOnly={!editable} />

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Documents</h3>
        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((d) => (
              <Link
                key={d.id}
                href={`/documents/${d.id}`}
                className="block rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                {d.title}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            message={
              portfolio
                ? "No documents linked to this contact's portfolio company yet."
                : "Link this contact to a portfolio company to see its shared documents here."
            }
          />
        )}
      </section>
    </div>
  );
}
