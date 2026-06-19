"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { isDirector } from "@/lib/permissions";

export type FormState = { error?: string } | undefined;

export async function updateApprovalPolicy(
  category: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can change approval policy." };

  const delegatedToUserId = (formData.get("delegated_to_user_id") ?? "").toString();
  const thresholdAmount = (formData.get("threshold_amount") ?? "").toString();

  const supabase = await createClient();
  const { error } = await supabase
    .from("approval_policies")
    .update({
      delegated_to_user_id: delegatedToUserId || null,
      threshold_amount: thresholdAmount ? Number(thresholdAmount) : null,
      updated_by: user.id,
    })
    .eq("category", category);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "approval_policy",
    resourceName: category,
    newValue: { delegated_to_user_id: delegatedToUserId || null, threshold_amount: thresholdAmount || null },
  });

  revalidatePath("/settings/approvals");
  return undefined;
}

export async function appointActingCeo(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return { error: "Only a Director can appoint an Acting CEO." };

  const delegatedToUserId = (formData.get("delegated_to_user_id") ?? "").toString();
  const endDate = (formData.get("end_date") ?? "").toString();
  if (!delegatedToUserId) return { error: "Select a staff member to appoint." };

  const supabase = await createClient();

  await supabase
    .from("acting_ceo_periods")
    .update({ is_active: false, ended_at: new Date().toISOString(), ended_by: user.id })
    .eq("is_active", true);

  const { error } = await supabase.from("acting_ceo_periods").insert({
    delegated_to_user_id: delegatedToUserId,
    appointed_by: user.id,
    end_date: endDate || null,
  });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "acting_ceo_period",
    resourceName: delegatedToUserId,
  });

  revalidatePath("/settings/approvals/acting-ceo");
  return undefined;
}

export async function endActingCeoPeriod() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) return;

  const supabase = await createClient();
  await supabase
    .from("acting_ceo_periods")
    .update({ is_active: false, ended_at: new Date().toISOString(), ended_by: user.id })
    .eq("is_active", true);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "acting_ceo_period",
    newValue: { ended: true },
  });

  revalidatePath("/settings/approvals/acting-ceo");
}
