import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MessageForm } from "./message-form";
import type { PartnerMessage } from "@/types";
import { cn } from "@/lib/utils";

export default async function PartnerMessagesPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("partner_messages")
    .select("*")
    .eq("portfolio_id", partner.portfolio_id)
    .order("created_at", { ascending: true });

  const rows = (messages ?? []) as PartnerMessage[];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Messages</h1>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <EmptyState message="No messages yet — say hello." />
        ) : (
          rows.map((m) => (
            <div key={m.id} className={cn("flex", m.sender_type === "partner" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-md rounded-lg px-3 py-2 text-sm",
                  m.sender_type === "partner" ? "bg-veltron-gold text-veltron-charcoal" : "bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap">{m.message_text}</p>
                <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <MessageForm />
    </div>
  );
}
