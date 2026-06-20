import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { ProjectHealthSelector } from "@/components/projects/ProjectHealthSelector";
import { ProgressControl } from "@/components/projects/ProgressControl";
import { MilestoneForm } from "@/components/projects/MilestoneForm";
import { MilestoneStatusSelect } from "@/components/projects/MilestoneStatusSelect";
import { TaskForm } from "@/components/projects/TaskForm";
import { TaskKanban } from "@/components/projects/TaskKanban";
import { BudgetItemForm } from "@/components/projects/BudgetItemForm";
import { RiskForm } from "@/components/projects/RiskForm";
import { RiskStatusSelect } from "@/components/projects/RiskStatusSelect";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OverviewForm } from "./overview-form";
import type {
  InternalProject,
  ProjectBudgetItem,
  ProjectMilestone,
  ProjectRisk,
  ProjectTask,
} from "@/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: project } = await supabase.from("internal_projects").select("*").eq("id", id).maybeSingle();
  if (!project) notFound();

  const [{ data: milestones }, { data: tasks }, { data: budgetItems }, { data: risks }, { data: team }] =
    await Promise.all([
      supabase.from("project_milestones").select("*").eq("project_id", id).order("target_date"),
      supabase.from("project_tasks").select("*").eq("project_id", id),
      supabase.from("project_budget_items").select("*").eq("project_id", id).order("date", { ascending: false }),
      supabase.from("project_risks").select("*").eq("project_id", id),
      supabase.from("users").select("id, full_name").order("full_name"),
    ]);

  const editable = canEdit(user.role, "projects");
  const memberNameById = new Map((team ?? []).map((m) => [m.id, m.full_name]));
  const budgetUsed = (budgetItems ?? []).reduce((sum, item) => sum + (item.actual ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{(project as InternalProject).name}</h1>
          <p className="text-sm text-text-muted capitalize">{(project as InternalProject).status}</p>
        </div>
        <ProjectHealthSelector
          projectId={id}
          value={(project as InternalProject).health_indicator}
          disabled={!editable}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="risks">Risks &amp; Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <ProgressControl
            projectId={id}
            initialValue={(project as InternalProject).percent_complete}
            readOnly={!editable}
          />
          <OverviewForm project={project as InternalProject} team={team ?? []} readOnly={!editable} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4 space-y-4">
          {editable && <MilestoneForm projectId={id} />}
          {!milestones || milestones.length === 0 ? (
            <EmptyState message="No milestones yet." />
          ) : (
            <div className="space-y-2">
              {(milestones as ProjectMilestone[]).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="text-xs text-text-muted">
                      {m.target_date ? new Date(m.target_date).toLocaleDateString() : "No target date"}
                    </div>
                  </div>
                  <MilestoneStatusSelect milestoneId={m.id} projectId={id} status={m.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-4">
          <TaskForm projectId={id} members={team ?? []} />
          {!tasks || tasks.length === 0 ? (
            <EmptyState message="No tasks yet." />
          ) : (
            <TaskKanban projectId={id} tasks={tasks as ProjectTask[]} memberNameById={memberNameById} />
          )}
        </TabsContent>

        <TabsContent value="budget" className="mt-4 space-y-4">
          <div className="rounded-md border border-border p-4 text-sm">
            <span className="font-medium">
              {(project as InternalProject).currency} {budgetUsed.toLocaleString()}
            </span>{" "}
            used of{" "}
            <span className="font-medium">
              {(project as InternalProject).currency} {(project as InternalProject).budget_estimated?.toLocaleString() ?? "—"}
            </span>{" "}
            estimated
          </div>
          <BudgetItemForm projectId={id} />
          {!budgetItems || budgetItems.length === 0 ? (
            <EmptyState message="No budget line items yet." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Vendor</th>
                    <th className="px-3 py-2 font-medium">Estimated</th>
                    <th className="px-3 py-2 font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {(budgetItems as ProjectBudgetItem[]).map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2">{item.item_name}</td>
                      <td className="px-3 py-2 text-text-muted">{item.category ?? "—"}</td>
                      <td className="px-3 py-2 text-text-muted">{item.vendor ?? "—"}</td>
                      <td className="px-3 py-2">{item.estimated ?? "—"}</td>
                      <td className="px-3 py-2">{item.actual ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risks" className="mt-4 space-y-4">
          <RiskForm projectId={id} />
          {!risks || risks.length === 0 ? (
            <EmptyState message="No risks logged yet." />
          ) : (
            <div className="space-y-2">
              {(risks as ProjectRisk[]).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{r.description}</div>
                    <div className="text-xs text-text-muted">
                      Likelihood: {r.likelihood ?? "—"} · Impact: {r.impact ?? "—"}
                      {r.mitigation && ` · Mitigation: ${r.mitigation}`}
                    </div>
                  </div>
                  <RiskStatusSelect riskId={r.id} projectId={id} status={r.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
