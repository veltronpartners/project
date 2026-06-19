import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { PortfolioForm } from "./portfolio-form";

export default async function NewPortfolioPage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) redirect("/portfolio");

  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("users")
    .select("id, full_name")
    .in("role", ["veltron_lead", "director"])
    .order("full_name");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Add New Portfolio Company</h1>
      <PortfolioForm leads={leads ?? []} />
    </div>
  );
}
