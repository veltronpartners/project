import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { CreateUserForm } from "./create-user-form";
import { UserRow } from "./user-row";
import type { User } from "@/types";

export default async function SettingsUsersPage() {
  const currentUser = await getCurrentStaffUser();
  if (!isDirector(currentUser.role)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: users } = await supabase.from("users").select("*").order("full_name");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">User Management</h1>

      <CreateUserForm />

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">2FA</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {((users ?? []) as User[]).map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === currentUser.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
