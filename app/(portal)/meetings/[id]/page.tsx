import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotesForm } from "./notes-form";
import { cancelMeeting } from "../actions";
import type { Meeting } from "@/types";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: meetingRow } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  if (!meetingRow) notFound();
  const meeting = meetingRow as Meeting;

  const attendeeIds = meeting.attendees ?? [];
  const { data: attendees } = attendeeIds.length
    ? await supabase.from("users").select("id, full_name").in("id", attendeeIds)
    : { data: [] as { id: string; full_name: string }[] };

  const editable = canEdit(user.role, "calendar");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{meeting.title}</h1>
          <p className="text-sm text-text-muted">
            {new Date(meeting.date).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {meeting.status}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div>
          <dt className="text-text-muted">Type</dt>
          <dd>{meeting.meeting_type ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Location</dt>
          <dd>{meeting.location ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-text-muted">Attendees</dt>
          <dd>{(attendees ?? []).map((a) => a.full_name).join(", ") || "—"}</dd>
        </div>
      </dl>

      {meeting.agenda && (
        <section className="space-y-1">
          <h3 className="font-heading text-sm font-semibold">Agenda</h3>
          <p className="text-sm text-foreground">{meeting.agenda}</p>
        </section>
      )}

      {editable && meeting.status !== "cancelled" && <NotesForm meeting={meeting} />}

      {editable && meeting.status === "scheduled" && (
        <form action={cancelMeeting.bind(null, id)}>
          <Button type="submit" variant="outline">
            Cancel meeting
          </Button>
        </form>
      )}
    </div>
  );
}
