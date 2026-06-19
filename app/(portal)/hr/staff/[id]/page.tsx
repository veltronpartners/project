import { notFound, redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, isDirector } from "@/lib/permissions";
import { OnboardingChecklist } from "@/components/hr/OnboardingChecklist";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ROLE_LABELS } from "@/types";
import { ProfileForm } from "./profile-form";
import type { LeaveRequest, OnboardingTask, StaffProfile, User } from "@/types";

export default async function StaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentStaffUser();
  if (!hasAccess(currentUser.role, "hr") || currentUser.role === "staff") redirect("/dashboard");

  const supabase = await createClient();
  const { data: staffRow } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (!staffRow) notFound();
  const staffUser = staffRow as User;

  const [{ data: profile }, { data: tasks }, { data: leave }, { data: team }] = await Promise.all([
    supabase.from("staff_profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("onboarding_tasks").select("*").eq("user_id", id),
    supabase.from("leave_requests").select("*").eq("user_id", id).order("start_date", { ascending: false }),
    supabase.from("users").select("id, full_name").neq("id", id).order("full_name"),
  ]);

  const canManage = currentUser.role === "director" || currentUser.role === "hr_officer";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{staffUser.full_name}</h1>
        <p className="text-sm text-text-muted">{ROLE_LABELS[staffUser.role]}</p>
      </div>

      <section className="space-y-3">
        <h3 className="font-heading text-sm font-semibold">Employment details</h3>
        {canManage ? (
          <ProfileForm
            staffUser={staffUser}
            profile={profile as StaffProfile | null}
            team={team ?? []}
            showSensitiveFields={isDirector(currentUser.role)}
          />
        ) : (
          <p className="text-sm text-text-muted">You don't have permission to view employment details.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Onboarding checklist</h3>
        <OnboardingChecklist userId={id} tasks={(tasks ?? []) as OnboardingTask[]} canManage={canManage} />
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Leave history</h3>
        {!leave || leave.length === 0 ? (
          <EmptyState message="No leave history yet." />
        ) : (
          <div className="space-y-2">
            {(leave as LeaveRequest[]).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  {l.leave_type ?? "leave"} · {new Date(l.start_date).toLocaleDateString()} –{" "}
                  {new Date(l.end_date).toLocaleDateString()}
                </span>
                <span className="capitalize text-text-muted">{l.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
