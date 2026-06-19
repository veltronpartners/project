"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  meeting_type: z.string().optional(),
  date: z.string().min(1, "Date and time are required"),
  duration_minutes: z.string().optional(),
  location: z.string().optional(),
  agenda: z.string().optional(),
});

export async function createMeeting(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "calendar")) {
    return { error: "You don't have permission to schedule a meeting." };
  }

  const parsed = meetingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const attendees = formData.getAll("attendees").map(String);
  const duration = emptyToNull(formData.get("duration_minutes"));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title: parsed.data.title,
      meeting_type: emptyToNull(formData.get("meeting_type")),
      date: new Date(parsed.data.date).toISOString(),
      duration_minutes: duration ? Number(duration) : null,
      location: emptyToNull(formData.get("location")),
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      project_id: emptyToNull(formData.get("project_id")),
      organiser_id: user.id,
      attendees,
      agenda: emptyToNull(formData.get("agenda")),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't schedule the meeting. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "meeting",
    resourceId: data.id,
    resourceName: parsed.data.title,
    newValue: parsed.data,
  });

  revalidatePath("/meetings");
  revalidatePath("/calendar");
  redirect(`/meetings/${data.id}`);
}

const notesSchema = z.object({
  key_decisions: z.string().optional(),
  notes: z.string().optional(),
  next_meeting: z.string().optional(),
});

export async function updateMeetingNotes(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = notesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return undefined;

  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({
      key_decisions: emptyToNull(formData.get("key_decisions")),
      notes: emptyToNull(formData.get("notes")),
      next_meeting: emptyToNull(formData.get("next_meeting")),
      status: "completed",
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "meeting",
    resourceId: id,
    newValue: parsed.data,
  });

  revalidatePath(`/meetings/${id}`);
  return undefined;
}

export async function cancelMeeting(id: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("meetings").update({ status: "cancelled" }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "meeting",
    resourceId: id,
    newValue: { status: "cancelled" },
  });

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${id}`);
  revalidatePath("/calendar");
}
