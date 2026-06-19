"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";
import { routeApproval } from "@/lib/approvals/policy-engine";
import { applyApprovalDecision } from "@/lib/approvals/apply";
import { notifyMany } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

const newIntakeSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  engagement_type: z.string().optional(),
  source: z.string().optional(),
  officer_id: z.string().optional(),
  lead_id: z.string().optional(),
  priority_level: z.string().optional(),
  target_decision_date: z.string().optional(),
});

export async function createIntake(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) {
    return { error: "You don't have permission to start a new intake." };
  }

  const parsed = newIntakeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .insert({
      company_name: parsed.data.company_name,
      industry: emptyToNull(formData.get("industry")),
      engagement_type: emptyToNull(formData.get("engagement_type")),
      source: emptyToNull(formData.get("source")),
      officer_id: emptyToNull(formData.get("officer_id")) ?? user.id,
      lead_id: emptyToNull(formData.get("lead_id")),
      priority_level: emptyToNull(formData.get("priority_level")) ?? "medium",
      target_decision_date: emptyToNull(formData.get("target_decision_date")),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't create the intake. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "engagement",
    resourceId: data.id,
    resourceName: parsed.data.company_name,
    newValue: parsed.data,
  });

  revalidatePath("/intake");
  redirect(`/intake/${data.id}/stage/1`);
}

export async function updateChecklistItem(
  itemId: string,
  engagementId: string,
  fields: { status?: string; officer_id?: string | null; date_done?: string | null; notes?: string },
) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const update: Record<string, unknown> = { ...fields };
  if (fields.status === "complete" && !fields.date_done) {
    update.date_done = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("engagement_checklist_items").update(update).eq("id", itemId);
  if (error) return;

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "engagement_checklist_item",
    resourceId: itemId,
    newValue: fields,
  });

  revalidatePath(`/intake/${engagementId}`);
}

export async function addEngagementNote(
  engagementId: string,
  stage: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const noteText = (formData.get("note_text") ?? "").toString().trim();
  if (!noteText) return { error: "Note can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("engagement_notes").insert({
    engagement_id: engagementId,
    stage,
    author_id: user.id,
    note_text: noteText,
  });
  if (error) return { error: error.message };

  revalidatePath(`/intake/${engagementId}/stage/${stage}`);
  return undefined;
}

export async function signOffStage(
  engagementId: string,
  stage: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) {
    return { error: "You don't have permission to sign off this stage." };
  }

  const supabase = await createClient();

  const { data: flagged } = await supabase
    .from("engagement_checklist_items")
    .select("id")
    .eq("engagement_id", engagementId)
    .eq("stage", stage)
    .eq("status", "flagged");

  if (flagged && flagged.length > 0) {
    return { error: `Resolve ${flagged.length} flagged item(s) before signing off this stage.` };
  }

  const remarks = (formData.get("remarks") ?? "").toString();

  const { error: signoffError } = await supabase.from("engagement_signoffs").insert({
    engagement_id: engagementId,
    stage,
    officer_name: user.full_name,
    officer_id: user.id,
    remarks: remarks || null,
  });
  if (signoffError) return { error: signoffError.message };

  const nextStage = Math.min(stage + 1, 6);
  const { error: updateError } = await supabase
    .from("engagements")
    .update({ current_stage: nextStage })
    .eq("id", engagementId);
  if (updateError) return { error: updateError.message };

  await logAudit({
    actorId: user.id,
    action: "signed_off",
    resourceType: "engagement",
    resourceId: engagementId,
    newValue: { stage, remarks },
  });

  const { data: engagementForNotify } = await supabase
    .from("engagements")
    .select("company_name, officer_id, lead_id")
    .eq("id", engagementId)
    .maybeSingle();
  if (engagementForNotify) {
    await notifyMany(
      [engagementForNotify.officer_id, engagementForNotify.lead_id].filter(
        (id): id is string => Boolean(id) && id !== user.id,
      ),
      {
        type: "stage_signoff",
        title: `Stage ${stage} signed off — ${engagementForNotify.company_name}`,
        message: `${user.full_name} signed off Stage ${stage}.`,
        link: `/intake/${engagementId}/stage/${nextStage}`,
      },
    );
  }

  revalidatePath(`/intake/${engagementId}`);
  redirect(stage < 6 ? `/intake/${engagementId}/stage/${nextStage}` : `/intake/${engagementId}/stage/6`);
}

const decisionSchema = z.object({
  final_decision: z.enum(["Approved", "Declined", "Pending Further Review"]),
  decline_reason: z.string().optional(),
  consensus_notes: z.string().optional(),
});

export async function recordFinalDecision(
  engagementId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) {
    return { error: "You don't have permission to record the final decision." };
  }

  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Select a final decision." };
  if (parsed.data.final_decision === "Declined" && !parsed.data.decline_reason) {
    return { error: "A decline reason is required when declining." };
  }

  const supabase = await createClient();
  const { data: engagement } = await supabase
    .from("engagements")
    .select("*")
    .eq("id", engagementId)
    .maybeSingle();
  if (!engagement) return { error: "Engagement not found." };

  // Approving/declining a new portfolio company is Tier 1 (Section 12.2) —
  // record the team's recommendation, then route it through the approval
  // queue rather than acting on it directly (Section 17: never bypass).
  const { error } = await supabase
    .from("engagements")
    .update({
      final_decision: parsed.data.final_decision,
      decline_reason: parsed.data.decline_reason || null,
      overall_status: "under_review",
    })
    .eq("id", engagementId);
  if (error) return { error: error.message };

  if (parsed.data.consensus_notes) {
    await supabase.from("engagement_notes").insert({
      engagement_id: engagementId,
      stage: 5,
      author_id: user.id,
      note_text: `Team consensus: ${parsed.data.consensus_notes}`,
    });
  }

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "engagement",
    resourceId: engagementId,
    resourceName: engagement.company_name,
    newValue: parsed.data,
  });

  if (parsed.data.final_decision !== "Pending Further Review") {
    const result = await routeApproval({
      category: "engagement_decision",
      resourceType: "engagement",
      resourceId: engagementId,
      summary: `${parsed.data.final_decision} — ${engagement.company_name}`,
      requestedBy: user.id,
    });
    if (result.autoApproved) {
      await applyApprovalDecision({
        category: "engagement_decision",
        resourceType: "engagement",
        resourceId: engagementId,
        decision: parsed.data.final_decision === "Approved" ? "approved" : "declined",
        decidedBy: user.id,
      });
    }
  }

  revalidatePath(`/intake/${engagementId}/stage/5`);
  return undefined;
}

export async function addToContacts(engagementId: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: engagement } = await supabase
    .from("engagements")
    .select("company_name, linked_portfolio_id")
    .eq("id", engagementId)
    .maybeSingle();
  if (!engagement) return;

  await supabase.from("contacts").insert({
    full_name: engagement.company_name,
    organisation: engagement.company_name,
    contact_type: "portfolio_contact",
    portfolio_id: engagement.linked_portfolio_id,
    added_by: user.id,
  });

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "contact",
    resourceName: engagement.company_name,
  });

  revalidatePath(`/intake/${engagementId}/stage/6`);
}

export async function logInDecisionLog(engagementId: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: engagement } = await supabase
    .from("engagements")
    .select("company_name, linked_portfolio_id, final_decision")
    .eq("id", engagementId)
    .maybeSingle();
  if (!engagement) return;

  await supabase.from("decisions").insert({
    portfolio_id: engagement.linked_portfolio_id,
    category: "partnership",
    decision_summary: `Onboarded ${engagement.company_name} following Engagement Intake approval`,
    rationale: `Final decision recorded as ${engagement.final_decision} at Stage 5 of Engagement Intake.`,
    options_considered: "Approve / Decline / Pending Further Review",
    decision_maker_id: user.id,
    owner_id: user.id,
    status: "approved",
  });

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "decision",
    resourceName: engagement.company_name,
  });

  revalidatePath(`/intake/${engagementId}/stage/6`);
}
