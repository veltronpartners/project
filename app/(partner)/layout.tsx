import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerTopbar } from "@/components/partner/PartnerTopbar";
import type { PartnerNotification } from "@/types";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const partner = await getCurrentPartner();
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("partner_notifications")
    .select("*")
    .eq("partner_contact_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex min-h-screen bg-background">
      <PartnerSidebar />
      <div className="flex flex-1 flex-col">
        <PartnerTopbar partner={partner} notifications={(notifications ?? []) as PartnerNotification[]} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
