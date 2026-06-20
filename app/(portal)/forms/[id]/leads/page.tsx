import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { SubmissionAnswers } from "@/components/forms/SubmissionAnswers";
import { LeadReviewActions } from "./lead-review-actions";
import type { FormRecord, LeadFormSubmission } from "@/types";

const DECISION_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  move_to_intake: "bg-success/15 text-success",
  declined: "bg-danger/15 text-danger",
};

export default async function FormLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
  if (!form) notFound();

  const { data: leads } = await supabase
    .from("lead_form_submissions")
    .select("*")
    .eq("form_id", id)
    .order("created_at", { ascending: false });

  const rows = (leads ?? []) as LeadFormSubmission[];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Leads — {form.title}</h1>

      {rows.length === 0 ? (
        <EmptyState message="No responses yet from shareable links." />
      ) : (
        <div className="space-y-3">
          {rows.map((lead) => (
            <div key={lead.id} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{lead.respondent_name}</p>
                  <p className="text-xs text-text-muted">
                    {lead.respondent_email}
                    {lead.respondent_company && ` · ${lead.respondent_company}`}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Submitted {lead.submitted_at ? new Date(lead.submitted_at).toLocaleString() : "—"}
                  </p>
                </div>
                <Badge className={`border-0 capitalize ${DECISION_STYLES[lead.review_decision]}`}>
                  {lead.review_decision.replace("_", " ")}
                </Badge>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-veltron-gold hover:underline">View answers</summary>
                <div className="mt-2">
                  <SubmissionAnswers schema={(form as FormRecord).schema} answers={lead.answers} />
                </div>
              </details>

              {lead.review_decision === "pending" ? (
                <div className="mt-3">
                  <LeadReviewActions submissionId={lead.id} formId={id} />
                </div>
              ) : (
                lead.linked_engagement_id && (
                  <Link href="/intake" className="mt-3 inline-block text-xs text-veltron-gold hover:underline">
                    View in Engagement Intake →
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
