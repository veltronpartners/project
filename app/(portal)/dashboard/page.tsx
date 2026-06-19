import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { MeetingCard } from "@/components/dashboard/MeetingCard";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { ActivityFeedItem } from "@/components/dashboard/ActivityFeedItem";
import { HealthBadge } from "@/components/shared/HealthBadge";
import type { AuditLogEntry, Decision, PortfolioCompany } from "@/types";

// Minimal local shape — project_tasks isn't in types/index.ts yet (Projects module isn't built).
type ProjectTaskRow = { id: string; title: string; due_date: string | null; status: string };

async function safe<T>(promise: PromiseLike<{ data: T | null }>, fallback: T): Promise<T> {
  try {
    const { data } = await promise;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const announcements = await safe(
    supabase
      .from("announcements")
      .select("id, title, body, priority")
      .order("created_at", { ascending: false })
      .limit(3),
    [],
  );

  if (user.role === "director") {
    const [portfolios, decisions, activity, openIntakes, conflicts] = await Promise.all([
      safe<PortfolioCompany[]>(
        supabase.from("portfolio_companies").select("*").order("name"),
        [],
      ),
      safe<Decision[]>(
        supabase
          .from("decisions")
          .select("*")
          .not("review_date", "is", null)
          .order("review_date")
          .limit(5),
        [],
      ),
      safe<AuditLogEntry[]>(
        supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        [],
      ),
      safe<{ id: string }[]>(
        supabase.from("engagements").select("id").in("overall_status", ["pending", "in_progress"]),
        [],
      ),
      safe<{ id: string }[]>(
        supabase.from("conflict_register").select("id").eq("status", "open"),
        [],
      ),
    ]);

    const atRisk = portfolios.filter((p) => p.health_indicator === "red").length;

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold">Command Dashboard</h1>

        {announcements.map((a) => (
          <AnnouncementBanner key={a.id} title={a.title} body={a.body} priority={a.priority} />
        ))}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total portfolios" value={portfolios.length} />
          <StatCard label="At-risk portfolios" value={atRisk} />
          <StatCard label="Open engagement intakes" value={openIntakes.length} />
          <StatCard label="Open compliance flags" value={conflicts.length} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="mb-3 font-heading text-lg font-medium">Portfolio health</h2>
            {portfolios.length === 0 ? (
              <EmptyState message="No portfolio companies yet — add your first one from Portfolio → Add New Portfolio." />
            ) : (
              <div className="space-y-2">
                {portfolios.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <HealthBadge status={p.health_indicator} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-medium">Decisions due for review</h2>
            {decisions.length === 0 ? (
              <EmptyState message="No decisions are currently due for review." />
            ) : (
              <div className="space-y-2">
                {decisions.map((d) => (
                  <TaskCard
                    key={d.id}
                    title={`${d.log_id} — ${d.decision_summary}`}
                    dueDate={d.review_date}
                    status={d.status}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium">Recent activity</h2>
          {activity.length === 0 ? (
            <EmptyState message="Nothing has been logged yet." />
          ) : (
            <div className="rounded-md border border-border px-4">
              {activity.map((entry) => (
                <ActivityFeedItem
                  key={entry.id}
                  actor={entry.actor_id ?? "System"}
                  action={entry.action}
                  resourceName={entry.resource_name}
                  createdAt={entry.created_at}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (user.role === "veltron_lead") {
    const [portfolios, meetings] = await Promise.all([
      safe<PortfolioCompany[]>(
        supabase.from("portfolio_companies").select("*").eq("veltron_lead_id", user.id),
        [],
      ),
      safe<{ id: string; title: string; date: string }[]>(
        supabase
          .from("meetings")
          .select("id, title, date")
          .contains("attendees", [user.id])
          .gte("date", new Date().toISOString())
          .order("date")
          .limit(5),
        [],
      ),
    ]);

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold">My Dashboard</h1>

        {announcements.map((a) => (
          <AnnouncementBanner key={a.id} title={a.title} body={a.body} priority={a.priority} />
        ))}

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium">My portfolios</h2>
          {portfolios.length === 0 ? (
            <EmptyState message="No portfolio companies are assigned to you yet." />
          ) : (
            <div className="space-y-2">
              {portfolios.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <HealthBadge status={p.health_indicator} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium">Upcoming meetings</h2>
          {meetings.length === 0 ? (
            <EmptyState message="No upcoming meetings on your calendar." />
          ) : (
            <div className="space-y-2">
              {meetings.map((m) => (
                <MeetingCard key={m.id} title={m.title} date={m.date} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  const tasks = await safe<ProjectTaskRow[]>(
    supabase
      .from("project_tasks")
      .select("id, title, due_date, status")
      .eq("assignee_id", user.id)
      .order("due_date"),
    [],
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">My Dashboard</h1>

      {announcements.map((a) => (
        <AnnouncementBanner key={a.id} title={a.title} body={a.body} priority={a.priority} />
      ))}

      <section>
        <h2 className="mb-3 font-heading text-lg font-medium">My tasks</h2>
        {tasks.length === 0 ? (
          <EmptyState message="You have no open tasks." />
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <TaskCard key={t.id} title={t.title} dueDate={t.due_date} status={t.status} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
