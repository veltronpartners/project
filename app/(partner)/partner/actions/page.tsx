import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PartnerActionCard } from "@/components/partner/PartnerActionCard";
import type { PartnerAction } from "@/types";

export default async function PartnerActionsPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: actions } = await supabase
    .from("partner_actions")
    .select("*")
    .eq("partner_contact_id", partner.id)
    .order("due_date");

  const rows = (actions ?? []) as PartnerAction[];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">My Actions</h1>
      {rows.length === 0 ? (
        <EmptyState message="No action items assigned to you." />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <PartnerActionCard key={a.id} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}
