import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { notifyMany } from "@/lib/notifications";

/**
 * Finalizes the underlying resource once a Director/Acting CEO/delegated
 * approver decides on a request. Each category that routes through the
 * approval engine needs a case here — categories without one just record
 * the decision on approval_requests with no further side effects.
 */
export async function applyApprovalDecision(params: {
  category: string;
  resourceType: string;
  resourceId: string;
  decision: "approved" | "declined";
  decidedBy: string;
}) {
  const supabase = await createClient();

  if (params.category === "engagement_decision" && params.resourceType === "engagement") {
    const { data: engagement } = await supabase
      .from("engagements")
      .select("*")
      .eq("id", params.resourceId)
      .maybeSingle();
    if (!engagement) return;

    let linkedPortfolioId = engagement.linked_portfolio_id as string | null;

    if (params.decision === "approved" && engagement.final_decision === "Approved") {
      if (!linkedPortfolioId) {
        const { data: portfolio } = await supabase
          .from("portfolio_companies")
          .insert({
            name: engagement.company_name,
            industry: engagement.industry,
            engagement_type: engagement.engagement_type,
            veltron_lead_id: engagement.lead_id,
            onboarded_at: new Date().toISOString().slice(0, 10),
          })
          .select("id")
          .single();
        linkedPortfolioId = portfolio?.id ?? null;
      }
      await supabase
        .from("engagements")
        .update({ overall_status: "approved", linked_portfolio_id: linkedPortfolioId })
        .eq("id", params.resourceId);
    } else {
      await supabase.from("engagements").update({ overall_status: "declined" }).eq("id", params.resourceId);
    }

    await logAudit({
      actorId: params.decidedBy,
      action: params.decision === "approved" ? "approved" : "declined",
      resourceType: "engagement",
      resourceId: params.resourceId,
      resourceName: engagement.company_name,
    });
  }

  if (params.category === "announcement" && params.resourceType === "announcement") {
    const { data: announcement } = await supabase
      .from("announcements")
      .select("title")
      .eq("id", params.resourceId)
      .maybeSingle();
    if (!announcement) return;

    await supabase
      .from("announcements")
      .update({ status: params.decision === "approved" ? "published" : "declined" })
      .eq("id", params.resourceId);

    await logAudit({
      actorId: params.decidedBy,
      action: params.decision === "approved" ? "approved" : "declined",
      resourceType: "announcement",
      resourceId: params.resourceId,
      resourceName: announcement.title,
    });

    if (params.decision === "approved") {
      const { data: staff } = await supabase.from("users").select("id").eq("is_active", true);
      await notifyMany(
        (staff ?? []).map((s) => s.id),
        {
          type: "announcement",
          title: announcement.title,
          link: "/announcements",
        },
      );
    }
  }
}
