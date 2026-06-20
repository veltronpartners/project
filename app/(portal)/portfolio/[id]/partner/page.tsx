import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ContactForm } from "./contact-form";
import { ReplyForm } from "./reply-form";
import { ActionForm } from "./action-form";
import { ReportScheduleSelect } from "@/components/partner/ReportScheduleSelect";
import { PartnerDocumentReview } from "@/components/partner/PartnerDocumentReview";
import type {
  FormAssignment,
  PartnerAction,
  PartnerContact,
  PartnerDocument,
  PartnerMessage,
} from "@/types";
import { cn } from "@/lib/utils";

export default async function PortfolioPartnerTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: portfolio } = await supabase.from("portfolio_companies").select("id, name").eq("id", id).maybeSingle();
  if (!portfolio) notFound();

  const [{ data: contacts }, { data: assignments }, { data: documents }, { data: messages }, { data: actions }, { data: schedules }] =
    await Promise.all([
      supabase.from("partner_contacts").select("*").eq("portfolio_id", id),
      supabase.from("form_assignments").select("*, forms(title)").eq("portfolio_id", id).order("sent_at", { ascending: false }),
      supabase.from("partner_documents").select("*").eq("portfolio_id", id).order("created_at", { ascending: false }),
      supabase.from("partner_messages").select("*").eq("portfolio_id", id).order("created_at", { ascending: true }),
      supabase.from("partner_actions").select("*").eq("portfolio_id", id).order("due_date"),
      supabase.from("partner_report_schedule").select("*").eq("portfolio_id", id),
    ]);

  const editable = canEdit(user.role, "portfolio");
  const contactRows = (contacts ?? []) as PartnerContact[];
  const scheduleByContact = new Map((schedules ?? []).map((s) => [s.partner_contact_id, s]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Partner Management — {portfolio.name}</h1>

      <Tabs defaultValue="contacts">
        <TabsList className="flex-wrap">
          <TabsTrigger value="contacts">Partner Contacts</TabsTrigger>
          <TabsTrigger value="forms">Forms Sent</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4 space-y-4">
          {editable && <ContactForm portfolioId={id} />}
          {contactRows.length === 0 ? (
            <EmptyState message="No partner contacts yet." />
          ) : (
            <div className="space-y-2">
              {contactRows.map((c) => {
                const schedule = scheduleByContact.get(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {c.full_name} <Badge variant="outline" className="ml-2 capitalize">{c.contact_type}</Badge>
                      </p>
                      <p className="text-xs text-text-muted">
                        {c.email} {c.role_title && `· ${c.role_title}`}
                      </p>
                    </div>
                    {editable && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Report cadence</span>
                        <ReportScheduleSelect
                          portfolioId={id}
                          partnerContactId={c.id}
                          current={schedule?.is_active ? schedule.cadence : "off"}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="forms" className="mt-4 space-y-2">
          {!assignments || assignments.length === 0 ? (
            <EmptyState message="No forms sent to this partner yet." />
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
                <span>{(a.forms as unknown as { title: string } | null)?.title}</span>
                <Badge variant="outline" className="capitalize">{(a as unknown as FormAssignment).status.replace("_", " ")}</Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-2">
          {!documents || documents.length === 0 ? (
            <EmptyState message="No documents uploaded by this partner yet." />
          ) : (
            (documents as PartnerDocument[]).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-text-muted">{d.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{d.status.replace("_", " ")}</Badge>
                  {editable && d.status === "received" && <PartnerDocumentReview documentId={d.id} portfolioId={id} />}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-4">
          <div className="space-y-2">
            {!messages || messages.length === 0 ? (
              <EmptyState message="No messages yet." />
            ) : (
              (messages as PartnerMessage[]).map((m) => (
                <div key={m.id} className={cn("flex", m.sender_type === "veltron_staff" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-md rounded-lg px-3 py-2 text-sm",
                      m.sender_type === "veltron_staff" ? "bg-veltron-gold text-veltron-charcoal" : "bg-muted",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.message_text}</p>
                    <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {editable && <ReplyForm portfolioId={id} />}
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-4">
          {editable && <ActionForm portfolioId={id} contacts={contactRows} />}
          {!actions || actions.length === 0 ? (
            <EmptyState message="No action items assigned to this partner yet." />
          ) : (
            (actions as PartnerAction[]).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
                <span>{a.title}</span>
                <Badge variant="outline" className="capitalize">{a.status.replace("_", " ")}</Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
