"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

function canManageCompliance(role: string) {
  return role === "director" || role === "compliance_officer";
}

const conflictSchema = z.object({
  conflict_type: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  parties_involved: z.string().optional(),
});

export async function declareConflict(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const parsed = conflictSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Description is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conflict_register")
    .insert({
      reported_by: user.id,
      conflict_type: emptyToNull(formData.get("conflict_type")),
      description: parsed.data.description,
      parties_involved: emptyToNull(formData.get("parties_involved")),
      related_portfolio_id: emptyToNull(formData.get("related_portfolio_id")),
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn't declare the conflict. " + (error?.message ?? "") };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "conflict",
    resourceId: data.id,
    resourceName: parsed.data.description,
  });

  const { data: complianceStaff } = await supabase
    .from("users")
    .select("id")
    .in("role", ["compliance_officer", "director"]);
  await Promise.all(
    (complianceStaff ?? []).map((s) =>
      createNotification({
        userId: s.id,
        type: "flagged_item",
        title: "New conflict of interest declared",
        message: parsed.data.description,
        link: "/compliance/conflicts",
      }),
    ),
  );

  revalidatePath("/compliance/conflicts");
  return undefined;
}

export async function resolveConflict(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canManageCompliance(user.role)) {
    return { error: "Only the Compliance Officer or a Director can resolve this." };
  }

  const resolution = (formData.get("resolution") ?? "").toString();
  const status = (formData.get("status") ?? "resolved").toString();

  const supabase = await createClient();
  const { error } = await supabase
    .from("conflict_register")
    .update({
      status,
      resolution: resolution || null,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
      reviewed_by: user.id,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "conflict",
    resourceId: id,
    newValue: { status, resolution },
  });

  revalidatePath("/compliance/conflicts");
  return undefined;
}

const contractSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contract_type: z.string().optional(),
  counterparty: z.string().optional(),
  signed_date: z.string().optional(),
  effective_date: z.string().optional(),
  expiry_date: z.string().optional(),
});

export async function createContract(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canManageCompliance(user.role)) {
    return { error: "Only the Compliance Officer or a Director can add contracts." };
  }

  const parsed = contractSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      title: parsed.data.title,
      contract_type: emptyToNull(formData.get("contract_type")),
      counterparty: emptyToNull(formData.get("counterparty")),
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      signed_date: emptyToNull(formData.get("signed_date")),
      effective_date: emptyToNull(formData.get("effective_date")),
      expiry_date: emptyToNull(formData.get("expiry_date")),
      status: emptyToNull(formData.get("status")) ?? "draft",
      signed_by_veltron: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn't add the contract. " + (error?.message ?? "") };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "contract",
    resourceId: data.id,
    resourceName: parsed.data.title,
  });

  revalidatePath("/compliance/contracts");
  return undefined;
}

export async function updateContractStatus(id: string, status: string) {
  const user = await getCurrentStaffUser();
  if (!canManageCompliance(user.role)) return;

  const supabase = await createClient();
  await supabase.from("contracts").update({ status }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "contract",
    resourceId: id,
    newValue: { status },
  });

  revalidatePath("/compliance/contracts");
}
