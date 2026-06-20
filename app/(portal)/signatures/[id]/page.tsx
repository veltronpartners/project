import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getSignedSourceUrl } from "../actions";
import { SignerList } from "@/components/signatures/SignerList";
import { Badge } from "@/components/ui/badge";
import type { SignatureRequest, SignatureSigner } from "@/types";

export default async function SignatureRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: requestRow } = await supabase.from("signature_requests").select("*").eq("id", id).maybeSingle();
  if (!requestRow) notFound();
  const request = requestRow as SignatureRequest;

  const { data: signers } = await supabase
    .from("signature_signers")
    .select("*")
    .eq("signature_request_id", id)
    .order("signing_sequence");

  const previewUrl = await getSignedSourceUrl(
    request.final_signed_document_url ?? request.source_document_url,
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">{request.document_title}</h1>
        <Badge variant="outline" className="capitalize">
          {request.status.replace("_", " ")}
        </Badge>
      </div>

      {previewUrl && (
        <a href={previewUrl} target="_blank" rel="noreferrer" className="text-veltron-gold underline">
          View document
        </a>
      )}

      {request.signing_method === "uploaded_external" ? (
        <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
          <div>
            <dt className="text-text-muted">Signed by</dt>
            <dd>{request.externally_signed_by}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Date signed</dt>
            <dd>{request.externally_signed_date && new Date(request.externally_signed_date).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Method</dt>
            <dd>{request.external_signing_tool ?? "—"}</dd>
          </div>
        </dl>
      ) : (
        <section className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">
            Signers ({request.signing_order})
          </h3>
          <SignerList signers={(signers ?? []) as SignatureSigner[]} />
        </section>
      )}
    </div>
  );
}
