import Link from "next/link";
import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function PartnerReportsPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("form_assignments")
    .select("*, forms!inner(title, form_type)")
    .eq("partner_contact_id", partner.id)
    .eq("forms.form_type", "periodic_report")
    .order("sent_at", { ascending: false });

  const { data: schedule } = await supabase
    .from("partner_report_schedule")
    .select("*")
    .eq("partner_contact_id", partner.id)
    .eq("is_active", true)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">My Reports</h1>

      {schedule?.next_report_due && (
        <div className="rounded-md border border-veltron-gold/30 bg-accent/30 p-3 text-sm">
          Your next report is due {new Date(schedule.next_report_due).toLocaleDateString()} ({schedule.cadence}).
        </div>
      )}

      {!assignments || assignments.length === 0 ? (
        <EmptyState message="No progress reports requested yet." />
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={a.status === "not_started" || a.status === "in_progress" ? `/partner/forms/${a.id}` : "#"}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <p className="font-medium">{(a.forms as unknown as { title: string }).title}</p>
                <p className="text-xs text-text-muted">
                  Sent {a.sent_at ? new Date(a.sent_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {a.status.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
