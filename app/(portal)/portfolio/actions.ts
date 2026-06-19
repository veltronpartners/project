"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";

export type FormState = { error?: string } | undefined;

const portfolioSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  legal_name: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  hq_location: z.string().optional(),
  stage: z.string().optional(),
  engagement_type: z.string().optional(),
  veltron_lead_id: z.string().optional(),
  reporting_cadence: z.string().optional(),
  top_priority: z.string().optional(),
  key_risk: z.string().optional(),
  notes: z.string().optional(),
});

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function createPortfolio(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) {
    return { error: "You don't have permission to add a portfolio company." };
  }

  const parsed = portfolioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_companies")
    .insert({
      name: parsed.data.name,
      legal_name: emptyToNull(parsed.data.legal_name),
      industry: emptyToNull(parsed.data.industry),
      website: emptyToNull(parsed.data.website),
      hq_location: emptyToNull(parsed.data.hq_location),
      stage: emptyToNull(parsed.data.stage),
      engagement_type: emptyToNull(parsed.data.engagement_type),
      veltron_lead_id: emptyToNull(parsed.data.veltron_lead_id),
      reporting_cadence: emptyToNull(parsed.data.reporting_cadence),
      top_priority: emptyToNull(parsed.data.top_priority),
      key_risk: emptyToNull(parsed.data.key_risk),
      notes: emptyToNull(parsed.data.notes),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't create the portfolio company. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "portfolio",
    resourceId: data.id,
    resourceName: parsed.data.name,
    newValue: parsed.data,
  });

  revalidatePath("/portfolio");
  redirect(`/portfolio/${data.id}`);
}

export async function updatePortfolioOverview(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) {
    return { error: "You don't have permission to edit this portfolio company." };
  }

  const parsed = portfolioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data: oldRow } = await supabase
    .from("portfolio_companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const update = {
    name: parsed.data.name,
    legal_name: emptyToNull(parsed.data.legal_name),
    industry: emptyToNull(parsed.data.industry),
    website: emptyToNull(parsed.data.website),
    hq_location: emptyToNull(parsed.data.hq_location),
    stage: emptyToNull(parsed.data.stage),
    engagement_type: emptyToNull(parsed.data.engagement_type),
    veltron_lead_id: emptyToNull(parsed.data.veltron_lead_id),
    reporting_cadence: emptyToNull(parsed.data.reporting_cadence),
    top_priority: emptyToNull(parsed.data.top_priority),
    key_risk: emptyToNull(parsed.data.key_risk),
    notes: emptyToNull(parsed.data.notes),
  };

  const { error } = await supabase.from("portfolio_companies").update(update).eq("id", id);
  if (error) {
    return { error: "Couldn't save changes. " + error.message };
  }

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "portfolio",
    resourceId: id,
    resourceName: parsed.data.name,
    oldValue: oldRow,
    newValue: update,
  });

  revalidatePath(`/portfolio/${id}`);
  return undefined;
}

export async function updateHealthIndicator(id: string, status: "green" | "yellow" | "red") {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) return;

  const supabase = await createClient();
  await supabase.from("portfolio_companies").update({ health_indicator: status }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "portfolio",
    resourceId: id,
    newValue: { health_indicator: status },
  });

  revalidatePath(`/portfolio/${id}`);
  revalidatePath("/portfolio");
}

const kpiSchema = z.object({
  kpi_name: z.string().min(1),
  target: z.string().optional(),
  current_value: z.string().optional(),
  unit: z.string().optional(),
});

export async function addKpi(portfolioId: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) {
    return { error: "You don't have permission to add KPIs." };
  }
  const parsed = kpiSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "KPI name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_kpis").insert({
    portfolio_id: portfolioId,
    kpi_name: parsed.data.kpi_name,
    target: emptyToNull(parsed.data.target),
    current_value: emptyToNull(parsed.data.current_value),
    unit: emptyToNull(parsed.data.unit),
    last_updated: new Date().toISOString().slice(0, 10),
  });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "portfolio_kpi",
    resourceName: parsed.data.kpi_name,
    newValue: parsed.data,
  });

  revalidatePath(`/portfolio/${portfolioId}`);
  return undefined;
}

const actionItemSchema = z.object({
  title: z.string().min(1),
  due_date: z.string().optional(),
  priority: z.string().optional(),
  owner_id: z.string().optional(),
});

export async function addActionItem(
  portfolioId: string,
  _prevState: FormState,
  formData: FormData,
) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "portfolio")) {
    return { error: "You don't have permission to add action items." };
  }
  const parsed = actionItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_actions").insert({
    portfolio_id: portfolioId,
    title: parsed.data.title,
    due_date: emptyToNull(parsed.data.due_date),
    priority: parsed.data.priority ? Number(parsed.data.priority) : null,
    owner_id: emptyToNull(parsed.data.owner_id),
  });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "portfolio_action",
    resourceName: parsed.data.title,
    newValue: parsed.data,
  });

  revalidatePath(`/portfolio/${portfolioId}`);
  return undefined;
}

export async function updateActionStatus(
  actionId: string,
  portfolioId: string,
  status: "pending" | "in_progress" | "complete" | "overdue",
) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_actions")
    .update({ status })
    .eq("id", actionId);
  if (error) return;

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "portfolio_action",
    resourceId: actionId,
    newValue: { status },
  });

  revalidatePath(`/portfolio/${portfolioId}`);
}
