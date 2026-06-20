import Link from "next/link";
import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";

export default async function PartnerDashboardPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const [{ data: portfolio }, { count: pendingForms }, { count: openActions }, { data: nextMeeting }] =
    await Promise.all([
      supabase.from("portfolio_companies").select("name, veltron_lead_id, next_checkin").eq("id", partner.portfolio_id).maybeSingle(),
      supabase
        .from("form_assignments")
        .select("id", { count: "exact", head: true })
        .eq("partner_contact_id", partner.id)
        .in("status", ["not_started", "in_progress", "reopened"]),
      supabase
        .from("partner_actions")
        .select("id", { count: "exact", head: true })
        .eq("partner_contact_id", partner.id)
        .in("status", ["pending", "in_progress"]),
      supabase
        .from("meetings")
        .select("title, date")
        .eq("portfolio_id", partner.portfolio_id)
        .gte("date", new Date().toISOString())
        .order("date")
        .limit(1)
        .maybeSingle(),
    ]);

  const { data: lead } = portfolio?.veltron_lead_id
    ? await supabase.from("users").select("full_name").eq("id", portfolio.veltron_lead_id).maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Welcome back, {partner.full_name}</h1>
        <p className="text-sm text-text-muted">{portfolio?.name}</p>
      </div>

      {lead && (
        <div className="rounded-md border border-border p-4">
          <p className="text-sm text-text-muted">Your Veltron Lead</p>
          <p className="font-medium">{lead.full_name}</p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/partner/messages">Send Message</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Forms awaiting you" value={pendingForms ?? 0} />
        <StatCard label="Open action items" value={openActions ?? 0} />
        <StatCard
          label="Next check-in"
          value={nextMeeting?.date ? new Date(nextMeeting.date).toLocaleDateString() : "—"}
        />
      </div>
    </div>
  );
}
