import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { DecisionButtons } from "./decision-buttons";

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: request } = await supabase.from("approval_requests").select("*").eq("id", id).maybeSingle();
  if (!request) notFound();

  const [{ data: requester }, { data: routedTo }] = await Promise.all([
    request.requested_by
      ? supabase.from("users").select("full_name").eq("id", request.requested_by).maybeSingle()
      : Promise.resolve({ data: null }),
    request.routed_to_user_id
      ? supabase.from("users").select("full_name").eq("id", request.routed_to_user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const canDecide =
    request.status === "pending" && (request.routed_to_user_id === user.id || user.role === "director");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-text-muted capitalize">{request.category.replace("_", " ")}</p>
        <h1 className="font-heading text-2xl font-semibold">{request.summary}</h1>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div>
          <dt className="text-text-muted">Status</dt>
          <dd className="capitalize">{request.status.replace("_", " ")}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Urgency</dt>
          <dd className="capitalize">{request.urgency}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Requested by</dt>
          <dd>{requester?.full_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Routed to</dt>
          <dd>{routedTo?.full_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Requested</dt>
          <dd>{new Date(request.created_at).toLocaleString()}</dd>
        </div>
        {request.decision_at && (
          <div>
            <dt className="text-text-muted">Decided</dt>
            <dd>{new Date(request.decision_at).toLocaleString()}</dd>
          </div>
        )}
      </dl>

      {request.decline_reason && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
          <span className="font-medium">Decline reason: </span>
          {request.decline_reason}
        </div>
      )}

      {canDecide && <DecisionButtons requestId={id} />}
    </div>
  );
}
