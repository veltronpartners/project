"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

const decisionSchema = z.object({
  date: z.string().min(1),
  category: z.enum([
    "partnership",
    "fundraising",
    "scope",
    "hiring",
    "legal",
    "financial",
    "strategy",
    "operations",
    "other",
  ]),
  decision_summary: z.string().min(1, "Decision summary is required"),
  rationale: z.string().min(1, "Rationale is required"),
  options_considered: z.string().min(1, "List at least one option considered"),
});

export async function createDecision(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "decisions")) {
    return { error: "You don't have permission to log a decision." };
  }

  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const ownerId = emptyToNull(formData.get("owner_id")) ?? user.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decisions")
    .insert({
      date: parsed.data.date,
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      project_id: emptyToNull(formData.get("project_id")),
      category: parsed.data.category,
      decision_summary: parsed.data.decision_summary,
      rationale: parsed.data.rationale,
      options_considered: parsed.data.options_considered,
      decision_maker_id: emptyToNull(formData.get("decision_maker_id")) ?? user.id,
      stakeholders_informed: emptyToNull(formData.get("stakeholders_informed")),
      status: emptyToNull(formData.get("status")) ?? "in_progress",
      due_date: emptyToNull(formData.get("due_date")),
      owner_id: ownerId,
      review_date: emptyToNull(formData.get("review_date")),
    })
    .select("id, log_id")
    .single();

  if (error || !data) {
    return { error: "Couldn't log the decision. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "decision",
    resourceId: data.id,
    resourceName: parsed.data.decision_summary,
    newValue: parsed.data,
  });

  if (ownerId !== user.id) {
    await createNotification({
      userId: ownerId,
      type: "decision_logged",
      title: `${data.log_id} — you're listed as owner`,
      message: parsed.data.decision_summary,
      link: `/decisions/${data.id}`,
    });
  }

  revalidatePath("/decisions");
  redirect(`/decisions/${data.id}`);
}

export async function updateDecisionStatus(id: string, status: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").update({ status }).eq("id", id);
  if (error) return;

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "decision",
    resourceId: id,
    newValue: { status },
  });

  revalidatePath(`/decisions/${id}`);
  revalidatePath("/decisions");
}

export async function addOutcomeNotes(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const outcomeNotes = (formData.get("outcome_notes") ?? "").toString();

  const supabase = await createClient();
  const { error } = await supabase.from("decisions").update({ outcome_notes: outcomeNotes }).eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "decision",
    resourceId: id,
    newValue: { outcome_notes: outcomeNotes },
  });

  revalidatePath(`/decisions/${id}`);
  return undefined;
}

export async function supersedeDecision(id: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "decisions")) {
    return { error: "You don't have permission to supersede this decision." };
  }

  const supabase = await createClient();
  const { data: original } = await supabase.from("decisions").select("*").eq("id", id).maybeSingle();
  if (!original) return { error: "Original decision not found." };

  const newSummary = (formData.get("decision_summary") ?? "").toString();
  const newRationale = (formData.get("rationale") ?? "").toString();
  if (!newSummary || !newRationale) return { error: "Summary and rationale are required." };

  const { data: created, error } = await supabase
    .from("decisions")
    .insert({
      date: new Date().toISOString().slice(0, 10),
      portfolio_id: original.portfolio_id,
      project_id: original.project_id,
      category: original.category,
      decision_summary: newSummary,
      rationale: newRationale,
      options_considered: original.options_considered,
      decision_maker_id: user.id,
      owner_id: user.id,
      status: "approved",
    })
    .select("id, log_id")
    .single();

  if (error || !created) return { error: "Couldn't create the superseding decision." };

  await supabase
    .from("decisions")
    .update({ status: "superseded", superseded_by: created.log_id })
    .eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "decision",
    resourceId: id,
    newValue: { superseded_by: created.log_id },
  });

  revalidatePath(`/decisions/${id}`);
  redirect(`/decisions/${created.id}`);
}
