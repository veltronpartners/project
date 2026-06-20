import { notFound } from "next/navigation";
import { getSignerByToken, getSignedDocumentUrlForRequest } from "@/lib/signatures/sign-flow";
import { AuthShell } from "@/components/shared/AuthShell";
import { SignForm } from "./sign-form";

export default async function PublicSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await getSignerByToken(token);
  if (!found) notFound();
  const { signer, request } = found;

  const previewUrl = await getSignedDocumentUrlForRequest(request.source_document_url);

  return (
    <AuthShell
      title={request.document_title}
      description={`Veltron Partners has requested your signature. Hi ${signer.signer_name}.`}
    >
      <div className="space-y-4">
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="text-veltron-gold underline">
            View document before signing
          </a>
        )}
        {signer.status === "signed" ? (
          <p className="rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
            You already signed this document on {signer.signed_at && new Date(signer.signed_at).toLocaleString()}.
          </p>
        ) : (
          <SignForm token={token} signerName={signer.signer_name} />
        )}
      </div>
    </AuthShell>
  );
}
