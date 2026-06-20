import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { Button } from "@/components/ui/button";
import { setFormStatus, duplicateForm } from "../actions";
import type { FormRecord } from "@/types";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: form } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
  if (!form) notFound();

  const editable = canEdit(user.role, "intake");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">{form.title}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/forms/${id}/submissions`}>Submissions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/forms/${id}/assign`}>Assign</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/forms/${id}/links`}>Shareable Links</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/forms/${id}/leads`}>Leads</Link>
          </Button>
          {editable && (
            <form action={duplicateForm.bind(null, id)}>
              <Button type="submit" variant="outline">
                Duplicate
              </Button>
            </form>
          )}
        </div>
      </div>

      {editable && (
        <div className="flex gap-2">
          {(["draft", "active", "archived"] as const).map((s) => (
            <form key={s} action={setFormStatus.bind(null, id, s)}>
              <Button type="submit" variant={form.status === s ? "default" : "outline"} size="sm">
                {s}
              </Button>
            </form>
          ))}
        </div>
      )}

      <FormBuilder form={form as FormRecord} />
    </div>
  );
}
