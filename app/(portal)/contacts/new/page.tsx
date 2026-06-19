import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { ContactForm } from "./contact-form";

export default async function NewContactPage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "contacts")) redirect("/contacts");

  const supabase = await createClient();
  const { data: portfolios } = await supabase.from("portfolio_companies").select("id, name").order("name");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Add Contact</h1>
      <ContactForm portfolios={portfolios ?? []} />
    </div>
  );
}
