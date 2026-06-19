"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

function canManageHr(role: string) {
  return role === "director" || role === "hr_officer";
}

const profileSchema = z.object({
  employment_type: z.string().optional(),
  start_date: z.string().optional(),
  contract_status: z.string().optional(),
  reporting_to: z.string().optional(),
  timezone: z.string().optional(),
  location_country: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

export async function upsertStaffProfile(
  userId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canManageHr(user.role)) {
    return { error: "Only HR or a Director can edit employment details." };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the form for errors." };

  const update: Record<string, unknown> = {
    employment_type: emptyToNull(formData.get("employment_type")),
    start_date: emptyToNull(formData.get("start_date")),
    contract_status: emptyToNull(formData.get("contract_status")),
    reporting_to: emptyToNull(formData.get("reporting_to")),
    timezone: emptyToNull(formData.get("timezone")),
    location_country: emptyToNull(formData.get("location_country")),
    emergency_contact_name: emptyToNull(formData.get("emergency_contact_name")),
    emergency_contact_phone: emptyToNull(formData.get("emergency_contact_phone")),
  };

  if (isDirector(user.role)) {
    update.remuneration = emptyToNull(formData.get("remuneration"));
    update.performance_notes = emptyToNull(formData.get("performance_notes"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_profiles")
    .upsert({ user_id: userId, ...update }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "staff_profile",
    resourceId: userId,
    newValue: update,
  });

  revalidatePath(`/hr/staff/${userId}`);
  return undefined;
}

export async function addOnboardingTask(userId: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  if (!canManageHr(user.role)) return { error: "Only HR or a Director can add onboarding tasks." };

  const taskName = (formData.get("task_name") ?? "").toString().trim();
  if (!taskName) return { error: "Task name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_tasks").insert({
    user_id: userId,
    task_name: taskName,
    category: emptyToNull(formData.get("category")),
    due_date: emptyToNull(formData.get("due_date")),
    assigned_to: emptyToNull(formData.get("assigned_to")),
  });
  if (error) return { error: error.message };

  revalidatePath(`/hr/staff/${userId}`);
  revalidatePath("/hr/onboarding");
  return undefined;
}

export async function updateOnboardingTaskStatus(
  taskId: string,
  userId: string,
  status: "pending" | "in_progress" | "complete",
) {
  const supabase = await createClient();
  await supabase
    .from("onboarding_tasks")
    .update({ status, completed_at: status === "complete" ? new Date().toISOString() : null })
    .eq("id", taskId);

  revalidatePath(`/hr/staff/${userId}`);
  revalidatePath("/hr/onboarding");
}

const leaveSchema = z.object({
  leave_type: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  reason: z.string().optional(),
});

export async function submitLeaveRequest(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Start and end dates are required." };

  const days =
    (new Date(parsed.data.end_date).getTime() - new Date(parsed.data.start_date).getTime()) /
      (1000 * 60 * 60 * 24) +
    1;
  if (days <= 0) return { error: "End date must be on or after the start date." };

  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").insert({
    user_id: user.id,
    leave_type: emptyToNull(formData.get("leave_type")),
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    days_count: days,
    reason: emptyToNull(formData.get("reason")),
  });
  if (error) return { error: error.message };

  const { data: hrStaff } = await supabase.from("users").select("id").eq("role", "hr_officer");
  const { data: directors } = await supabase.from("users").select("id").eq("role", "director");
  await Promise.all(
    [...(hrStaff ?? []), ...(directors ?? [])].map((staff) =>
      createNotification({
        userId: staff.id,
        type: "leave_request",
        title: `Leave request from ${user.full_name}`,
        message: `${parsed.data.start_date} to ${parsed.data.end_date}`,
        link: "/hr/leave",
      }),
    ),
  );

  revalidatePath("/hr/leave");
  return undefined;
}

export async function decideLeaveRequest(id: string, status: "approved" | "declined") {
  const user = await getCurrentStaffUser();
  if (!canManageHr(user.role)) return;

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("leave_requests")
    .select("user_id, start_date, end_date")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("leave_requests")
    .update({ status, approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", id);

  if (request) {
    await createNotification({
      userId: request.user_id,
      type: "leave_request",
      title: `Your leave request was ${status}`,
      message: `${request.start_date} to ${request.end_date}`,
      link: "/hr/leave",
    });
  }

  await logAudit({
    actorId: user.id,
    action: status === "approved" ? "approved" : "declined",
    resourceType: "leave_request",
    resourceId: id,
  });

  revalidatePath("/hr/leave");
}
