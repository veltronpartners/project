"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";
import { routeApproval } from "@/lib/approvals/policy-engine";

export type FormState = { error?: string } | undefined;

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  priority: z.enum(["urgent", "normal", "info"]),
});

export async function createAnnouncement(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) {
    return { error: "Only a Director can post a company-wide announcement." };
  }

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const pinned = formData.get("pinned") === "on";
  const slackPosted = formData.get("slack_posted") === "on";
  const expiresAt = (formData.get("expires_at") ?? "").toString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      priority: parsed.data.priority,
      posted_by: user.id,
      pinned,
      slack_posted: slackPosted,
      expires_at: expiresAt || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't create the announcement. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "announcement",
    resourceId: data.id,
    resourceName: parsed.data.title,
    newValue: parsed.data,
  });

  await routeApproval({
    category: "announcement",
    resourceType: "announcement",
    resourceId: data.id,
    summary: `Publish announcement — ${parsed.data.title}`,
    requestedBy: user.id,
    urgency: parsed.data.priority === "urgent" ? "high" : "normal",
  });

  revalidatePath("/announcements");
  redirect("/announcements");
}
