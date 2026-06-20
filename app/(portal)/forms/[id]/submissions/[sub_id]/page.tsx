import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { SubmissionAnswers } from "@/components/forms/SubmissionAnswers";
import { ReviewButtons } from "@/components/forms/ReviewButtons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import type { FormRecord } from "@/types";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sub_id: string }>;
}) {
  const { id, sub_id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const [{ data: form }, { data: assignment }] = await Promise.all([
    supabase.from("forms").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("form_assignments")
      .select("*, partner_contacts(full_name)")
      .eq("id", sub_id)
      .maybeSingle(),
  ]);
  if (!form || !assignment) notFound();

  const { data: submission } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("assignment_id", sub_id)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            {(assignment.partner_contacts as unknown as { full_name: string } | null)?.full_name}
          </h1>
          <p className="text-sm text-text-muted">{form.title}</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {assignment.status.replace("_", " ")}
        </Badge>
      </div>

      {!submission ? (
        <EmptyState message="No submission yet — the partner hasn't started this form." />
      ) : (
        <>
          <SubmissionAnswers schema={(form as FormRecord).schema} answers={submission.answers} />
          {canEdit(user.role, "intake") && submission.is_complete && assignment.status === "submitted" && (
            <ReviewButtons submissionId={submission.id} assignmentId={assignment.id} />
          )}
        </>
      )}
    </div>
  );
}
