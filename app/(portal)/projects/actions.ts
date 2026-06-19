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

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  type: z.string().optional(),
  scale: z.string().optional(),
  lead_id: z.string().optional(),
  start_date: z.string().optional(),
  target_end_date: z.string().optional(),
  budget_estimated: z.string().optional(),
  in_scope: z.string().optional(),
  out_of_scope: z.string().optional(),
  success_criteria: z.string().optional(),
  top_priority: z.string().optional(),
  key_risk: z.string().optional(),
  notes: z.string().optional(),
});

export async function createProject(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "projects")) {
    return { error: "You don't have permission to create a project." };
  }

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internal_projects")
    .insert({
      name: parsed.data.name,
      type: emptyToNull(formData.get("type")),
      scale: emptyToNull(formData.get("scale")),
      lead_id: emptyToNull(formData.get("lead_id")) ?? user.id,
      start_date: emptyToNull(formData.get("start_date")),
      target_end_date: emptyToNull(formData.get("target_end_date")),
      budget_estimated: emptyToNull(formData.get("budget_estimated")),
      in_scope: emptyToNull(formData.get("in_scope")),
      out_of_scope: emptyToNull(formData.get("out_of_scope")),
      success_criteria: emptyToNull(formData.get("success_criteria")),
      top_priority: emptyToNull(formData.get("top_priority")),
      key_risk: emptyToNull(formData.get("key_risk")),
      notes: emptyToNull(formData.get("notes")),
      team_members: [user.id],
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't create the project. " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "project",
    resourceId: data.id,
    resourceName: parsed.data.name,
    newValue: parsed.data,
  });

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectOverview(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "projects")) {
    return { error: "You don't have permission to edit this project." };
  }

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const update = {
    name: parsed.data.name,
    type: emptyToNull(formData.get("type")),
    scale: emptyToNull(formData.get("scale")),
    lead_id: emptyToNull(formData.get("lead_id")),
    start_date: emptyToNull(formData.get("start_date")),
    target_end_date: emptyToNull(formData.get("target_end_date")),
    budget_estimated: emptyToNull(formData.get("budget_estimated")),
    in_scope: emptyToNull(formData.get("in_scope")),
    out_of_scope: emptyToNull(formData.get("out_of_scope")),
    success_criteria: emptyToNull(formData.get("success_criteria")),
    top_priority: emptyToNull(formData.get("top_priority")),
    key_risk: emptyToNull(formData.get("key_risk")),
    notes: emptyToNull(formData.get("notes")),
  };

  const { error } = await supabase.from("internal_projects").update(update).eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "project",
    resourceId: id,
    resourceName: parsed.data.name,
    newValue: update,
  });

  revalidatePath(`/projects/${id}`);
  return undefined;
}

export async function updateProjectProgress(id: string, percentComplete: number) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("internal_projects").update({ percent_complete: percentComplete }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "project",
    resourceId: id,
    newValue: { percent_complete: percentComplete },
  });

  revalidatePath(`/projects/${id}`);
}

export async function updateProjectHealth(id: string, status: "green" | "yellow" | "red") {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("internal_projects").update({ health_indicator: status }).eq("id", id);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "project",
    resourceId: id,
    newValue: { health_indicator: status },
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

const milestoneSchema = z.object({
  title: z.string().min(1),
  target_date: z.string().optional(),
});

export async function addMilestone(projectId: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "projects")) return { error: "You don't have permission to add milestones." };

  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId,
    title: parsed.data.title,
    target_date: emptyToNull(formData.get("target_date")),
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

export async function updateMilestoneStatus(
  milestoneId: string,
  projectId: string,
  status: "pending" | "in_progress" | "complete" | "delayed",
) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("project_milestones").update({ status }).eq("id", milestoneId);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "project_milestone",
    resourceId: milestoneId,
    newValue: { status },
  });

  revalidatePath(`/projects/${projectId}`);
}

const taskSchema = z.object({
  title: z.string().min(1),
  assignee_id: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.string().optional(),
});

export async function addProjectTask(projectId: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").insert({
    project_id: projectId,
    title: parsed.data.title,
    assignee_id: emptyToNull(formData.get("assignee_id")),
    priority: emptyToNull(formData.get("priority")) ?? "medium",
    due_date: emptyToNull(formData.get("due_date")),
  });
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "project_task",
    resourceName: parsed.data.title,
  });

  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: "pending" | "in_progress" | "complete" | "overdue",
) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  await supabase.from("project_tasks").update({ status }).eq("id", taskId);

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "project_task",
    resourceId: taskId,
    newValue: { status },
  });

  revalidatePath(`/projects/${projectId}`);
}

const budgetItemSchema = z.object({
  item_name: z.string().min(1),
  category: z.string().optional(),
  vendor: z.string().optional(),
  estimated: z.string().optional(),
  actual: z.string().optional(),
});

export async function addBudgetItem(projectId: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "projects") && user.role !== "finance_officer") {
    return { error: "You don't have permission to add budget items." };
  }
  const parsed = budgetItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Item name is required." };

  const supabase = await createClient();
  const estimated = emptyToNull(formData.get("estimated"));
  const actual = emptyToNull(formData.get("actual"));

  const { error } = await supabase.from("project_budget_items").insert({
    project_id: projectId,
    item_name: parsed.data.item_name,
    category: emptyToNull(formData.get("category")),
    vendor: emptyToNull(formData.get("vendor")),
    estimated: estimated ? Number(estimated) : null,
    actual: actual ? Number(actual) : null,
    date: new Date().toISOString().slice(0, 10),
  });
  if (error) return { error: error.message };

  if (actual) {
    const { data: project } = await supabase
      .from("internal_projects")
      .select("budget_used")
      .eq("id", projectId)
      .maybeSingle();
    await supabase
      .from("internal_projects")
      .update({ budget_used: (project?.budget_used ?? 0) + Number(actual) })
      .eq("id", projectId);
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "project_budget_item",
    resourceName: parsed.data.item_name,
  });

  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

const riskSchema = z.object({
  description: z.string().min(1),
  likelihood: z.string().optional(),
  impact: z.string().optional(),
  mitigation: z.string().optional(),
});

export async function addRisk(projectId: string, _prevState: FormState, formData: FormData) {
  const user = await getCurrentStaffUser();
  const parsed = riskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Description is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("project_risks").insert({
    project_id: projectId,
    description: parsed.data.description,
    likelihood: emptyToNull(formData.get("likelihood")),
    impact: emptyToNull(formData.get("impact")),
    mitigation: emptyToNull(formData.get("mitigation")),
    owner_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

export async function updateRiskStatus(
  riskId: string,
  projectId: string,
  status: "open" | "mitigated" | "resolved" | "accepted",
) {
  const supabase = await createClient();
  await supabase.from("project_risks").update({ status }).eq("id", riskId);
  revalidatePath(`/projects/${projectId}`);
}
