import { getFormLinkByToken } from "@/lib/leads/link-flow";
import { LeadFormFiller } from "./lead-form-filler";
import type { FormRecord } from "@/types";

const REASON_MESSAGES: Record<string, string> = {
  not_found: "This link doesn't exist. Double-check the URL you were sent.",
  expired: "This link has expired. Please reach out to request a new one.",
  submitted: "This link has already been used — thank you for your response.",
  revoked: "This link is no longer active.",
};

export default async function RespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getFormLinkByToken(token);

  if (!result.usable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-semibold text-veltron-charcoal">Link unavailable</h1>
          <p className="mt-3 text-sm text-text-muted">{REASON_MESSAGES[result.reason]}</p>
        </div>
      </div>
    );
  }

  const form = result.form as unknown as FormRecord;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-2xl font-semibold text-veltron-charcoal">{form.title}</h1>
        {form.description && <p className="mt-2 text-sm text-text-muted">{form.description}</p>}
        <div className="mt-8">
          <LeadFormFiller token={token} form={form} />
        </div>
      </div>
    </div>
  );
}
