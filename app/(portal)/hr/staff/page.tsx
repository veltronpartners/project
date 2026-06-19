import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ROLE_LABELS, type StaffProfile, type User } from "@/types";

export default async function StaffDirectoryPage() {
  const user = await getCurrentStaffUser();
  if (!hasAccess(user.role, "hr") || user.role === "staff") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: staff }, { data: profiles }] = await Promise.all([
    supabase.from("users").select("*").order("full_name"),
    supabase.from("staff_profiles").select("*"),
  ]);

  const profileByUserId = new Map(((profiles ?? []) as StaffProfile[]).map((p) => [p.user_id, p]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Staff Directory</h1>

      {!staff || staff.length === 0 ? (
        <EmptyState message="No staff yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(staff as User[]).map((s) => {
            const profile = profileByUserId.get(s.id);
            return (
              <Link
                key={s.id}
                href={`/hr/staff/${s.id}`}
                className="rounded-md border border-border p-4 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.full_name}</span>
                  <Badge variant={s.is_active ? "default" : "outline"}>
                    {s.is_active ? "Active" : "Deactivated"}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted">{ROLE_LABELS[s.role]}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {profile?.employment_type ?? "—"} · {profile?.contract_status ?? "no contract on file"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
