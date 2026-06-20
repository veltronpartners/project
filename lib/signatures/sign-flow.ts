import "server-only";
import { randomBytes, randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function generateSignerToken(): string {
  return randomBytes(24).toString("hex");
}

/** Looks up a signer by their secure link token — bypasses RLS since
 * external signers never have a Supabase session. The token itself is the
 * authorization. */
export async function getSignerByToken(token: string) {
  const admin = createAdminClient();
  const { data: signer } = await admin
    .from("signature_signers")
    .select("*")
    .eq("secure_link_token", token)
    .maybeSingle();
  if (!signer) return null;

  const { data: request } = await admin
    .from("signature_requests")
    .select("*")
    .eq("id", signer.signature_request_id)
    .maybeSingle();
  if (!request) return null;

  return { signer, request };
}

export async function getSignedDocumentUrlForRequest(storagePath: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("documents").createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Records a signer's signature and advances the parent request's status.
 * Sequential requests only let the next-in-line signer through; parallel
 * requests let everyone sign independently.
 */
export async function recordSignature(params: {
  token: string;
  ipAddress: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const found = await getSignerByToken(params.token);
  if (!found) return { ok: false, error: "Invalid or expired signing link." };
  const { signer, request } = found;

  if (signer.status === "signed") return { ok: false, error: "This document has already been signed by you." };
  if (request.status === "locked") return { ok: false, error: "This document is already fully signed and locked." };

  if (request.signing_order === "sequential") {
    const { data: signers } = await admin
      .from("signature_signers")
      .select("*")
      .eq("signature_request_id", request.id)
      .order("signing_sequence");
    const pendingBefore = (signers ?? []).filter(
      (s) => s.signing_sequence !== null && s.signing_sequence < (signer.signing_sequence ?? 0) && s.status !== "signed",
    );
    if (pendingBefore.length > 0) {
      return { ok: false, error: "Earlier signers haven't completed yet — you'll be notified when it's your turn." };
    }
  }

  await admin
    .from("signature_signers")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signature_ip_address: params.ipAddress,
    })
    .eq("id", signer.id);

  const { data: allSigners } = await admin
    .from("signature_signers")
    .select("status")
    .eq("signature_request_id", request.id);

  const allSigned = (allSigners ?? []).every((s) => s.status === "signed");
  const anySigned = (allSigners ?? []).some((s) => s.status === "signed");

  await admin
    .from("signature_requests")
    .update({
      status: allSigned ? "locked" : anySigned ? "partially_signed" : request.status,
      final_signed_document_url: allSigned ? request.source_document_url : request.final_signed_document_url,
    })
    .eq("id", request.id);

  return { ok: true };
}

export { randomUUID };
