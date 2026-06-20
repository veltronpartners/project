import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/permissions";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";

export default async function HrOverviewPage() {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "hr") || user.role === "staff") redirect("/dashboard");

  const supabase = await createClient();
  const [{ count: staffCount }, { count: pendingOnboarding }, { count: pendingLeave }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("onboarding_tasks").select("id", { count: "exact", head: true }).neq("status", "complete"),
    supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">HR</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/hr/onboarding">Onboarding</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/hr/leave">Leave</Link>
          </Button>
          <Button asChild>
            <Link href="/hr/staff">Staff Directory</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active staff" value={staffCount ?? 0} />
        <StatCard label="Open onboarding tasks" value={pendingOnboarding ?? 0} />
        <StatCard label="Pending leave requests" value={pendingLeave ?? 0} />
      </div>
    </div>
  );
}
