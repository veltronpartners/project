import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Meeting } from "@/types";

export default async function MeetingsListPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: meetings } = await supabase.from("meetings").select("*").order("date", { ascending: false });
  const rows = (meetings ?? []) as Meeting[];

  const now = new Date();
  const upcoming = rows.filter((m) => new Date(m.date) >= now && m.status !== "cancelled");
  const past = rows.filter((m) => new Date(m.date) < now || m.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Meetings</h1>
        {canEdit(user.role, "calendar") && (
          <Button asChild>
            <Link href="/meetings/new">Schedule Meeting</Link>
          </Button>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-medium">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState message="No upcoming meetings." />
        ) : (
          <MeetingTable rows={upcoming} />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-medium">Past</h2>
        {past.length === 0 ? <EmptyState message="No past meetings." /> : <MeetingTable rows={past} />}
      </section>
    </div>
  );
}

function MeetingTable({ rows }: { rows: Meeting[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-t border-border hover:bg-muted/30">
              <td className="px-4 py-2">
                <Link href={`/meetings/${m.id}`} className="font-medium hover:underline">
                  {m.title}
                </Link>
              </td>
              <td className="px-4 py-2 text-text-muted">{m.meeting_type ?? "—"}</td>
              <td className="px-4 py-2 text-text-muted">
                {new Date(m.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </td>
              <td className="px-4 py-2">
                <Badge variant="outline" className="capitalize">
                  {m.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
