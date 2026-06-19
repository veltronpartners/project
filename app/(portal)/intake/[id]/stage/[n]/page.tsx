import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { ChecklistItemRow } from "@/components/intake/ChecklistItemRow";
import { NotesForm } from "@/components/intake/NotesForm";
import { SignOffForm } from "@/components/intake/SignOffForm";
import { FinalDecisionForm } from "@/components/intake/FinalDecisionForm";
import { StageSixActions } from "@/components/intake/StageSixActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { Engagement, EngagementChecklistItem, EngagementNote, EngagementSignoff } from "@/types";

const STAGE_INFO: Record<number, { title: string; description: string }> = {
  1: { title: "Initial Screening", description: "Confirm source, fit, and assign an officer and lead." },
  2: { title: "Discovery & Information Gathering", description: "Collect founder, deck, and financial snapshot information." },
  3: { title: "Due Diligence", description: "Verify legal, financial, and reference information." },
  4: { title: "Terms & Structuring", description: "Draft engagement terms, cadence, and exit criteria." },
  5: { title: "Internal Decision", description: "Record the team's final decision on this engagement." },
  6: { title: "Onboarding", description: "Stand up the portfolio record, contacts, and decision log entry." },
};

export default async function IntakeStagePage({
  params,
}: {
  params: Promise<{ id: string; n: string }>;
}) {
  const { id, n } = await params;
  const stage = Number(n);
  if (!Number.isInteger(stage) || stage < 1 || stage > 6) notFound();

  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: engagementRow } = await supabase.from("engagements").select("*").eq("id", id).maybeSingle();
  if (!engagementRow) notFound();
  const engagement = engagementRow as Engagement;

  if (stage === 6 && engagement.overall_status !== "approved") {
    return (
      <div className="space-y-6">
        <IntakeStageHeader engagement={engagement} stage={stage} />
        <EmptyState
          message={
            engagement.final_decision === "Approved"
              ? "The team recommended approval — Stage 6 unlocks once a Director (or Acting CEO) approves it in the Approvals queue."
              : "Stage 6 — Onboarding unlocks once this engagement is recorded as Approved at Stage 5."
          }
        />
      </div>
    );
  }

  const [{ data: items }, { data: notes }, { data: signoff }, { data: team }] = await Promise.all([
    supabase
      .from("engagement_checklist_items")
      .select("*")
      .eq("engagement_id", id)
      .eq("stage", stage)
      .order("id"),
    supabase
      .from("engagement_notes")
      .select("*")
      .eq("engagement_id", id)
      .eq("stage", stage)
      .order("created_at"),
    supabase
      .from("engagement_signoffs")
      .select("*")
      .eq("engagement_id", id)
      .eq("stage", stage)
      .maybeSingle(),
    supabase.from("users").select("id, full_name").order("full_name"),
  ]);

  const editable = canEdit(user.role, "intake") && stage === engagement.current_stage;
  const isPastStage = stage < engagement.current_stage || Boolean(signoff);

  return (
    <div className="space-y-6">
      <IntakeStageHeader engagement={engagement} stage={stage} />

      <div className="space-y-3">
        {(items as EngagementChecklistItem[] | null)?.length ? (
          (items as EngagementChecklistItem[]).map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              engagementId={id}
              members={team ?? []}
              readOnly={!editable}
            />
          ))
        ) : (
          <EmptyState message="No checklist items for this stage." />
        )}
      </div>

      <section className="space-y-3">
        <h3 className="font-heading text-sm font-semibold">Officer notes &amp; comments</h3>
        {(notes as EngagementNote[] | null)?.map((note) => (
          <div key={note.id} className="rounded-md bg-accent/30 px-3 py-2 text-sm">
            {note.note_text}
          </div>
        ))}
        {editable && <NotesForm engagementId={id} stage={stage} />}
      </section>

      {stage === 5 && (
        <FinalDecisionForm engagementId={id} currentDecision={engagement.final_decision} />
      )}

      {stage === 6 && <StageSixActions engagementId={id} />}

      {signoff ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm">
          Signed off by {(signoff as EngagementSignoff).officer_name} on{" "}
          {new Date((signoff as EngagementSignoff).signed_at).toLocaleDateString()}
          {(signoff as EngagementSignoff).remarks ? ` — ${(signoff as EngagementSignoff).remarks}` : ""}
        </div>
      ) : (
        editable && <SignOffForm engagementId={id} stage={stage} officer={user} />
      )}

      {isPastStage && !signoff && (
        <p className="text-sm text-text-muted">This stage has been superseded by later progress.</p>
      )}
    </div>
  );
}

function IntakeStageHeader({ engagement, stage }: { engagement: Engagement; stage: number }) {
  const info = STAGE_INFO[stage];
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-text-muted font-mono">{engagement.ref_number}</p>
        <h1 className="font-heading text-2xl font-semibold">{engagement.company_name}</h1>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <Link
            key={s}
            href={`/intake/${engagement.id}/stage/${s}`}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-xs font-medium",
              s === stage
                ? "bg-veltron-gold text-veltron-charcoal"
                : s < engagement.current_stage
                  ? "bg-success/20 text-success"
                  : "bg-muted text-text-muted",
            )}
          >
            {s}
          </Link>
        ))}
      </div>
      <div>
        <h2 className="font-heading text-lg font-medium">{info.title}</h2>
        <p className="text-sm text-text-muted">{info.description}</p>
      </div>
    </div>
  );
}
