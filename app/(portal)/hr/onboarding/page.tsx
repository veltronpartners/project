import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import type { OnboardingTask, User } from "@/types";

export default async function OnboardingTrackerPage() {
  const currentUser = await getCurrentStaffUser();
  if (!hasAccess(currentUser.role, "hr") || currentUser.role === "staff") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: staff }, { data: tasks }] = await Promise.all([
    supabase.from("users").select("id, full_name").order("full_name"),
    supabase.from("onboarding_tasks").select("*").order("due_date"),
  ]);

  const tasksByUser = new Map<string, OnboardingTask[]>();
  for (const task of (tasks ?? []) as OnboardingTask[]) {
    const list = tasksByUser.get(task.user_id) ?? [];
    list.push(task);
    tasksByUser.set(task.user_id, list);
  }

  const staffWithTasks = ((staff ?? []) as Pick<User, "id" | "full_name">[]).filter((s) =>
    tasksByUser.has(s.id),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Onboarding Tracker</h1>

      {staffWithTasks.length === 0 ? (
        <EmptyState message="No staff currently have onboarding tasks. Add tasks from a staff member's profile." />
      ) : (
        <div className="space-y-4">
          {staffWithTasks.map((s) => {
            const tasks = tasksByUser.get(s.id) ?? [];
            const complete = tasks.filter((t) => t.status === "complete").length;
            return (
              <div key={s.id} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/hr/staff/${s.id}`} className="font-medium hover:underline">
                    {s.full_name}
                  </Link>
                  <span className="text-xs text-text-muted">
                    {complete} / {tasks.length} complete
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tasks.map((t) => (
                    <Badge
                      key={t.id}
                      variant={t.status === "complete" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {t.task_name}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
