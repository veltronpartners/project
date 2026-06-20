import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RequestMeetingForm } from "./request-form";
import type { Meeting } from "@/types";

export default async function PartnerMeetingsPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .eq("portfolio_id", partner.portfolio_id)
    .order("date", { ascending: false });

  const rows = (meetings ?? []) as Meeting[];
  const now = new Date();
  const upcoming = rows.filter((m) => new Date(m.date) >= now);
  const past = rows.filter((m) => new Date(m.date) < now);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Meetings</h1>

      <RequestMeetingForm />

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Upcoming</h3>
        {upcoming.length === 0 ? (
          <EmptyState message="No upcoming meetings." />
        ) : (
          upcoming.map((m) => (
            <div key={m.id} className="rounded-md border border-border px-4 py-3 text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-text-muted">
                {new Date(m.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Past</h3>
        {past.length === 0 ? (
          <EmptyState message="No past meetings yet." />
        ) : (
          past.map((m) => (
            <div key={m.id} className="rounded-md border border-border px-4 py-3 text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-text-muted">{new Date(m.date).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
