"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { applyApprovalDecision } from "@/lib/approvals/apply";

export type FormState = { error?: string } | undefined;

export async function decideApproval(
  requestId: string,
  decision: "approved" | "declined" | "more_info_requested",
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "Approval request not found." };

  if (request.routed_to_user_id !== user.id && user.role !== "director") {
    return { error: "This request isn't routed to you." };
  }

  const declineReason = (formData.get("decline_reason") ?? "").toString();
  if (decision === "declined" && !declineReason) {
    return { error: "A decline reason is required." };
  }

  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: decision,
      decision_by: user.id,
      decision_at: new Date().toISOString(),
      decline_reason: decision === "declined" ? declineReason : null,
    })
    .eq("id", requestId);
  if (error) return { error: error.message };

  if (decision === "approved" || decision === "declined") {
    await applyApprovalDecision({
      category: request.category,
      resourceType: request.resource_type,
      resourceId: request.resource_id,
      decision,
      decidedBy: user.id,
    });
  }

  await logAudit({
    actorId: user.id,
    action: decision === "approved" ? "approved" : decision === "declined" ? "declined" : "updated",
    resourceType: "approval_request",
    resourceId: requestId,
    resourceName: request.summary,
  });

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${requestId}`);
  return undefined;
}
