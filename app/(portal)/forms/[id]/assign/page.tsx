import { notFound, redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { AssignForm } from "./assign-form";

export default async function AssignFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) redirect(`/forms/${id}`);

  const supabase = await createClient();
  const { data: form } = await supabase.from("forms").select("id, title").eq("id", id).maybeSingle();
  if (!form) notFound();

  const { data: contacts } = await supabase
    .from("partner_contacts")
    .select("id, full_name, portfolio_id, portfolio_companies(name)")
    .eq("is_active", true);

  const contactRows = (contacts ?? []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    portfolioName: (c.portfolio_companies as unknown as { name: string } | null)?.name ?? "—",
  }));

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Assign &quot;{form.title}&quot;</h1>
      <AssignForm formId={id} contacts={contactRows} />
    </div>
  );
}
