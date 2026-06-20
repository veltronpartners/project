import Link from "next/link";
import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-muted text-text-muted",
  in_progress: "bg-warning/15 text-warning",
  submitted: "bg-veltron-gold-muted text-veltron-charcoal",
  reopened: "bg-danger/15 text-danger",
  accepted: "bg-success/15 text-success",
  expired: "bg-danger/15 text-danger",
};

export default async function PartnerFormsPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("form_assignments")
    .select("*, forms(title, description)")
    .eq("partner_contact_id", partner.id)
    .order("sent_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">My Forms</h1>

      {!assignments || assignments.length === 0 ? (
        <EmptyState message="No forms have been sent to you yet." />
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/partner/forms/${a.id}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <p className="font-medium">{(a.forms as unknown as { title: string } | null)?.title}</p>
                <p className="text-xs text-text-muted">
                  {a.deadline ? `Due ${new Date(a.deadline).toLocaleDateString()}` : "No deadline"}
                </p>
              </div>
              <Badge className={cn("border-0 capitalize", STATUS_STYLES[a.status])}>
                {a.status.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
