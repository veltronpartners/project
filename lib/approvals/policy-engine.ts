import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ApprovalCategory =
  | "engagement_decision"
  | "user_management"
  | "announcement"
  | "hr_action"
  | "finance_budget"
  | "finance_expense"
  | "external_communication"
  | "partner_form"
  | "document_sharing"
  | "compliance_item"
  | "decision_log_entry"
  | "operations";

export type RouteResult =
  | { autoApproved: true }
  | { autoApproved: false; requestId: string; routedTo: string };

/** The Director, or the Acting CEO if a period is currently active (Section 12.3). */
export async function getActiveApprover(): Promise<{ userId: string; isActingCeo: boolean } | null> {
  const supabase = await createClient();

  const { data: activePeriod } = await supabase
    .from("acting_ceo_periods")
    .select("delegated_to_user_id, end_date")
    .eq("is_active", true)
    .maybeSingle();

  if (activePeriod && (!activePeriod.end_date || new Date(activePeriod.end_date) > new Date())) {
    return { userId: activePeriod.delegated_to_user_id as string, isActingCeo: true };
  }

  const { data: director } = await supabase
    .from("users")
    .select("id")
    .eq("role", "director")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return director ? { userId: director.id, isActingCeo: false } : null;
}

/**
 * Routes a Tier 1/2 action through the approval queue, or auto-approves
 * Tier 3 actions. Callers must NOT execute the underlying mutation until
 * this returns autoApproved: true OR the request is later approved
 * (Section 17: "never hard-code an approval bypass").
 */
export async function routeApproval(params: {
  category: ApprovalCategory;
  resourceType: string;
  resourceId: string;
  summary: string;
  requestedBy: string;
  amount?: number;
  urgency?: "low" | "normal" | "high";
}): Promise<RouteResult> {
  const supabase = await createClient();

  const { data: policy } = await supabase
    .from("approval_policies")
    .select("*")
    .eq("category", params.category)
    .maybeSingle();

  const tier = policy?.tier ?? 1;

  if (tier === 3) {
    return { autoApproved: true };
  }

  let routedTo: string | null = null;

  if (tier === 2 && policy?.delegated_to_user_id) {
    const withinThreshold =
      policy.threshold_amount == null ||
      params.amount == null ||
      params.amount <= policy.threshold_amount;
    if (withinThreshold) routedTo = policy.delegated_to_user_id as string;
  }

  if (!routedTo) {
    const approver = await getActiveApprover();
    if (!approver) {
      throw new Error("No Director or Acting CEO is configured to approve this request.");
    }
    routedTo = approver.userId;
  }

  const { data: request, error } = await supabase
    .from("approval_requests")
    .insert({
      category: params.category,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      summary: params.summary,
      requested_by: params.requestedBy,
      routed_to_user_id: routedTo,
      urgency: params.urgency ?? "normal",
    })
    .select("id")
    .single();

  if (error || !request) {
    throw new Error("Couldn't create the approval request: " + (error?.message ?? "unknown error"));
  }

  return { autoApproved: false, requestId: request.id, routedTo };
}
