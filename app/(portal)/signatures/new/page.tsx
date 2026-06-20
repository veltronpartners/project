import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { RequestForm } from "./request-form";

export default async function NewSignatureRequestPage() {
  await getCurrentStaffUser();
  const supabase = await createClient();
  const [{ data: team }, { data: portfolios }] = await Promise.all([
    supabase.from("users").select("id, full_name, email").order("full_name"),
    supabase.from("portfolio_companies").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">New Signature Request</h1>
      <RequestForm team={team ?? []} portfolios={portfolios ?? []} />
    </div>
  );
}
