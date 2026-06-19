import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthIndicator } from "@/types";

export default async function ProjectsListPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("internal_projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Projects</h1>
        {canEdit(user.role, "projects") && (
          <Button asChild>
            <Link href="/projects/new">New Project</Link>
          </Button>
        )}
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState message="No internal projects yet — start one with New Project." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <HealthBadge status={p.health_indicator as HealthIndicator | null} />
                  </div>
                  <div className="text-xs text-text-muted">
                    {p.type ?? "—"} · {p.scale ?? "—"} · {p.status}
                  </div>
                  <div className="space-y-1">
                    <Progress value={p.percent_complete ?? 0} />
                    <span className="text-xs text-text-muted">{p.percent_complete ?? 0}% complete</span>
                  </div>
                  {p.budget_estimated && (
                    <div className="text-xs text-text-muted">
                      Budget: {p.currency} {p.budget_used ?? 0} / {p.budget_estimated}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
