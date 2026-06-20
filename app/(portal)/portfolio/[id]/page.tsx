import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { HealthSelector } from "@/components/portfolio/HealthSelector";
import { KpiForm } from "@/components/portfolio/KpiForm";
import { ActionItemForm } from "@/components/portfolio/ActionItemForm";
import { ActionStatusSelect } from "@/components/portfolio/ActionStatusSelect";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { OverviewForm } from "./overview-form";
import type { Decision, Meeting, PortfolioAction, PortfolioCompany, PortfolioKpi, VaultDocument } from "@/types";

export default async function PortfolioProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: portfolio } = await supabase
    .from("portfolio_companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!portfolio) notFound();

  const [{ data: kpis }, { data: actions }, { data: decisions }, { data: staff }, { data: meetings }, { data: documents }] =
    await Promise.all([
      supabase.from("portfolio_kpis").select("*").eq("portfolio_id", id),
      supabase.from("portfolio_actions").select("*").eq("portfolio_id", id).order("priority"),
      supabase.from("decisions").select("*").eq("portfolio_id", id).order("date", { ascending: false }),
      supabase.from("users").select("id, full_name, role").order("full_name"),
      supabase.from("meetings").select("*").eq("portfolio_id", id).order("date", { ascending: false }),
      supabase.from("documents").select("*").eq("portfolio_id", id).order("created_at", { ascending: false }),
    ]);

  const editable = canEdit(user.role, "portfolio");
  const leads = (staff ?? []).filter((s) => s.role === "veltron_lead" || s.role === "director");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{(portfolio as PortfolioCompany).name}</h1>
          <p className="text-sm text-text-muted">{(portfolio as PortfolioCompany).industry ?? "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <HealthSelector
            portfolioId={id}
            value={(portfolio as PortfolioCompany).health_indicator}
            disabled={!editable}
          />
          <Button asChild variant="outline">
            <Link href={`/portfolio/${id}/partner`}>Partner Management</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs &amp; Metrics</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="decisions">Decision Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewForm
            portfolio={portfolio as PortfolioCompany}
            leads={leads}
            readOnly={!editable}
          />
        </TabsContent>

        <TabsContent value="kpis" className="mt-4 space-y-4">
          {editable && <KpiForm portfolioId={id} />}
          {!kpis || kpis.length === 0 ? (
            <EmptyState message="No KPIs tracked yet for this company." />
          ) : (
            <div className="space-y-3">
              {(kpis as PortfolioKpi[]).map((k) => {
                const target = Number(k.target);
                const current = Number(k.current_value);
                const pct =
                  !Number.isNaN(target) && !Number.isNaN(current) && target > 0
                    ? Math.min(100, Math.round((current / target) * 100))
                    : null;
                return (
                  <div key={k.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{k.kpi_name}</span>
                      <span className="text-text-muted">
                        {k.current_value ?? "—"} / {k.target ?? "—"} {k.unit ?? ""}
                      </span>
                    </div>
                    {pct !== null && <Progress value={pct} className="mt-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-4">
          {editable && <ActionItemForm portfolioId={id} members={staff ?? []} />}
          {!actions || actions.length === 0 ? (
            <EmptyState message="No action items yet." />
          ) : (
            <div className="space-y-2">
              {(actions as PortfolioAction[]).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-text-muted">
                      {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : "No due date"}
                      {a.priority ? ` · Priority ${a.priority}` : ""}
                    </div>
                  </div>
                  <ActionStatusSelect actionId={a.id} portfolioId={id} status={a.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meetings" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/meetings/new">Schedule Meeting</Link>
            </Button>
          </div>
          {!meetings || meetings.length === 0 ? (
            <EmptyState message="No meetings scheduled for this company yet." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-text-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(meetings as Meeting[]).map((m) => (
                    <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <Link href={`/meetings/${m.id}`} className="font-medium hover:underline">
                          {m.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-text-muted">{m.meeting_type ?? "—"}</td>
                      <td className="px-4 py-2 text-text-muted">
                        {new Date(m.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="capitalize">
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/documents/new">Upload Document</Link>
            </Button>
          </div>
          {!documents || documents.length === 0 ? (
            <EmptyState message="No documents uploaded for this company yet." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(documents as VaultDocument[]).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-start gap-3 rounded-md border border-border p-4 hover:bg-muted/30"
                >
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-text-muted">
                      {doc.category ?? "uncategorised"} · v{doc.version}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          {!decisions || decisions.length === 0 ? (
            <EmptyState message="No decisions have been logged for this company yet." />
          ) : (
            <div className="space-y-2">
              {(decisions as Decision[]).map((d) => (
                <div key={d.id} className="rounded-md border border-border px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {d.log_id} — {d.decision_summary}
                    </span>
                    <span className="text-text-muted">{d.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{d.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
