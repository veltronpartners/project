import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FormRecord } from "@/types";

export default async function FormsListPage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake") && user.role !== "director") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: forms }, { data: assignmentCounts }] = await Promise.all([
    supabase.from("forms").select("*").order("created_at", { ascending: false }),
    supabase.from("form_assignments").select("form_id"),
  ]);

  const countByForm = new Map<string, number>();
  for (const a of assignmentCounts ?? []) {
    countByForm.set(a.form_id, (countByForm.get(a.form_id) ?? 0) + 1);
  }

  const rows = (forms ?? []) as FormRecord[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Form Builder</h1>
        <Button asChild>
          <Link href="/forms/new">Create New Form</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No forms yet — create your first one." />
      ) : (
        <div className="space-y-2">
          {rows.map((f) => (
            <Link
              key={f.id}
              href={`/forms/${f.id}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <p className="font-medium">
                  {f.title} {f.is_template && <Badge variant="outline" className="ml-2">Template</Badge>}
                </p>
                <p className="text-xs text-text-muted">
                  {f.form_type?.replace("_", " ") ?? "custom"} · {countByForm.get(f.id) ?? 0} assigned
                </p>
              </div>
              <Badge variant={f.status === "active" ? "default" : "outline"} className="capitalize">
                {f.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
