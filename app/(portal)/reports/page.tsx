import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, isDirector } from "@/lib/permissions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PortfolioHealthReport } from "@/components/reports/PortfolioHealthReport";
import { EngagementPipelineReport } from "@/components/reports/EngagementPipelineReport";
import { DecisionLogReport } from "@/components/reports/DecisionLogReport";
import { ProjectStatusReport } from "@/components/reports/ProjectStatusReport";
import { FinanceSummaryReport } from "@/components/reports/FinanceSummaryReport";
import { ComplianceStatusReport } from "@/components/reports/ComplianceStatusReport";
import { WeeklyOperationsReport } from "@/components/reports/WeeklyOperationsReport";
import type {
  ConflictEntry,
  Contract,
  Decision,
  Engagement,
  Expense,
  FinanceBudget,
  InternalProject,
  PortfolioCompany,
} from "@/types";

export default async function ReportsPage() {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "reports")) redirect("/dashboard");

  const supabase = await createClient();
  const isLead = user.role === "veltron_lead";
  const director = isDirector(user.role);
  const isFinance = user.role === "finance_officer";

  let portfolioQuery = supabase.from("portfolio_companies").select("*");
  let projectQuery = supabase.from("internal_projects").select("*");
  if (isLead) {
    portfolioQuery = portfolioQuery.eq("veltron_lead_id", user.id);
    projectQuery = projectQuery.eq("lead_id", user.id);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sixtyDaysOut = new Date();
  sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);

  const [
    { data: portfolios },
    { data: engagements },
    { data: decisions },
    { data: projects },
    { data: expenses },
    { data: budgets },
    { data: openConflicts },
    { data: expiringContracts },
    { count: pendingSignoffCount },
    { count: meetingsHeld },
    { count: tasksCompleted },
  ] = await Promise.all([
    portfolioQuery.order("name"),
    supabase.from("engagements").select("*"),
    supabase.from("decisions").select("*"),
    projectQuery,
    supabase.from("expenses").select("*"),
    supabase.from("finance_budgets").select("*"),
    supabase.from("conflict_register").select("*").eq("status", "open"),
    supabase
      .from("contracts")
      .select("*")
      .lte("expiry_date", sixtyDaysOut.toISOString().slice(0, 10))
      .neq("status", "expired")
      .neq("status", "terminated"),
    supabase
      .from("engagements")
      .select("id", { count: "exact", head: true })
      .in("overall_status", ["pending", "in_progress", "under_review"]),
    supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("date", sevenDaysAgo.toISOString()),
    supabase
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "complete")
      .gte("updated_at", sevenDaysAgo.toISOString()),
  ]);

  const { count: portfolioUpdates } = await supabase
    .from("portfolio_companies")
    .select("id", { count: "exact", head: true })
    .gte("last_checkin", sevenDaysAgo.toISOString().slice(0, 10));

  const { count: decisionsLogged } = await supabase
    .from("decisions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Reports</h1>

      <Tabs defaultValue="portfolio">
        <TabsList className="flex-wrap">
          <TabsTrigger value="portfolio">Portfolio Health</TabsTrigger>
          <TabsTrigger value="pipeline">Engagement Pipeline</TabsTrigger>
          <TabsTrigger value="decisions">Decision Log</TabsTrigger>
          <TabsTrigger value="projects">Project Status</TabsTrigger>
          {(director || isFinance) && <TabsTrigger value="finance">Finance Summary</TabsTrigger>}
          {director && <TabsTrigger value="compliance">Compliance Status</TabsTrigger>}
          {director && <TabsTrigger value="weekly">Weekly Ops Summary</TabsTrigger>}
        </TabsList>

        <TabsContent value="portfolio" className="mt-4">
          <PortfolioHealthReport rows={(portfolios ?? []) as PortfolioCompany[]} />
        </TabsContent>
        <TabsContent value="pipeline" className="mt-4">
          <EngagementPipelineReport rows={(engagements ?? []) as Engagement[]} />
        </TabsContent>
        <TabsContent value="decisions" className="mt-4">
          <DecisionLogReport rows={(decisions ?? []) as Decision[]} />
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <ProjectStatusReport rows={(projects ?? []) as InternalProject[]} />
        </TabsContent>
        {(director || isFinance) && (
          <TabsContent value="finance" className="mt-4">
            <FinanceSummaryReport
              expenses={(expenses ?? []) as Expense[]}
              budgets={(budgets ?? []) as FinanceBudget[]}
            />
          </TabsContent>
        )}
        {director && (
          <TabsContent value="compliance" className="mt-4">
            <ComplianceStatusReport
              openConflicts={(openConflicts ?? []) as ConflictEntry[]}
              expiringContracts={(expiringContracts ?? []) as Contract[]}
              pendingSignoffCount={pendingSignoffCount ?? 0}
            />
          </TabsContent>
        )}
        {director && (
          <TabsContent value="weekly" className="mt-4">
            <WeeklyOperationsReport
              portfolioUpdates={portfolioUpdates ?? 0}
              decisionsLogged={decisionsLogged ?? 0}
              meetingsHeld={meetingsHeld ?? 0}
              tasksCompleted={tasksCompleted ?? 0}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
