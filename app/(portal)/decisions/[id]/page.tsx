import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { StatusSelect } from "@/components/decisions/StatusSelect";
import { OutcomeNotesForm } from "@/components/decisions/OutcomeNotesForm";
import { SupersedeForm } from "@/components/decisions/SupersedeForm";
import type { Decision } from "@/types";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: decisionRow } = await supabase.from("decisions").select("*").eq("id", id).maybeSingle();
  if (!decisionRow) notFound();
  const decision = decisionRow as Decision;

  const [{ data: portfolio }, { data: decisionMaker }, { data: owner }] = await Promise.all([
    decision.portfolio_id
      ? supabase.from("portfolio_companies").select("id, name").eq("id", decision.portfolio_id).maybeSingle()
      : Promise.resolve({ data: null }),
    decision.decision_maker_id
      ? supabase.from("users").select("full_name").eq("id", decision.decision_maker_id).maybeSingle()
      : Promise.resolve({ data: null }),
    decision.owner_id
      ? supabase.from("users").select("full_name").eq("id", decision.owner_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const editable = canEdit(user.role, "decisions");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-sm text-text-muted">{decision.log_id}</p>
        <h1 className="font-heading text-2xl font-semibold">{decision.decision_summary}</h1>
      </div>

      <div className="flex items-center gap-3">
        <StatusSelect decisionId={id} status={decision.status} disabled={!editable} />
        {decision.superseded_by && (
          <span className="text-sm text-text-muted">Superseded by {decision.superseded_by}</span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div>
          <dt className="text-text-muted">Date</dt>
          <dd>{new Date(decision.date).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Category</dt>
          <dd className="capitalize">{decision.category}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Decision maker</dt>
          <dd>{decisionMaker?.full_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Owner</dt>
          <dd>{owner?.full_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Due date</dt>
          <dd>{decision.due_date ? new Date(decision.due_date).toLocaleDateString() : "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Review date</dt>
          <dd>{decision.review_date ? new Date(decision.review_date).toLocaleDateString() : "—"}</dd>
        </div>
        {portfolio && (
          <div className="col-span-2">
            <dt className="text-text-muted">Linked portfolio</dt>
            <dd>
              <Link href={`/portfolio/${portfolio.id}`} className="text-veltron-gold hover:underline">
                {portfolio.name}
              </Link>
            </dd>
          </div>
        )}
      </dl>

      <section className="space-y-1">
        <h3 className="font-heading text-sm font-semibold">Rationale</h3>
        <p className="text-sm text-foreground">{decision.rationale}</p>
      </section>

      <section className="space-y-1">
        <h3 className="font-heading text-sm font-semibold">Options considered</h3>
        <p className="text-sm text-foreground">{decision.options_considered}</p>
      </section>

      {decision.stakeholders_informed && (
        <section className="space-y-1">
          <h3 className="font-heading text-sm font-semibold">Stakeholders informed</h3>
          <p className="text-sm text-foreground">{decision.stakeholders_informed}</p>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">Outcome notes</h3>
        <OutcomeNotesForm decisionId={id} initialNotes={decision.outcome_notes} />
      </section>

      {editable && decision.status !== "superseded" && <SupersedeForm decisionId={id} />}
    </div>
  );
}
