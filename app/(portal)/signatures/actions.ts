"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { generateSignerToken } from "@/lib/signatures/sign-flow";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

export async function createSignatureRequest(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const file = formData.get("file");
  const documentTitle = (formData.get("document_title") ?? "").toString().trim();
  const signingOrder = (formData.get("signing_order") ?? "sequential").toString();

  if (!(file instanceof File) || file.size === 0) return { error: "Choose a document to send for signature." };
  if (!documentTitle) return { error: "Document title is required." };

  const signerNames = formData.getAll("signer_name").map(String);
  const signerEmails = formData.getAll("signer_email").map(String);
  const signerInternalIds = formData.getAll("signer_internal_id").map(String);

  if (signerNames.length === 0 || signerNames.every((n) => !n.trim())) {
    return { error: "Add at least one signer." };
  }

  const supabase = await createClient();
  const storagePath = `signatures/${randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { data: request, error } = await supabase
    .from("signature_requests")
    .insert({
      document_title: documentTitle,
      source_document_url: storagePath,
      signing_method: "in_portal",
      signing_order: signingOrder,
      status: "sent",
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      engagement_id: emptyToNull(formData.get("engagement_id")),
      contract_id: emptyToNull(formData.get("contract_id")),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !request) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Couldn't create the signature request: " + (error?.message ?? "") };
  }

  const signerRows = signerNames
    .map((name, i) => ({ name: name.trim(), email: signerEmails[i]?.trim(), internalId: signerInternalIds[i] }))
    .filter((s) => s.name);

  for (let i = 0; i < signerRows.length; i++) {
    const s = signerRows[i];
    await supabase.from("signature_signers").insert({
      signature_request_id: request.id,
      signer_name: s.name,
      signer_email: s.email || "",
      is_internal: Boolean(s.internalId),
      internal_user_id: s.internalId || null,
      signing_sequence: i + 1,
      secure_link_token: generateSignerToken(),
    });

    if (s.internalId) {
      await createNotification({
        userId: s.internalId,
        type: "flagged_item",
        title: `Signature requested — ${documentTitle}`,
        link: `/signatures/${request.id}`,
      });
    }
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "signature_request",
    resourceId: request.id,
    resourceName: documentTitle,
  });

  revalidatePath("/signatures");
  redirect(`/signatures/${request.id}`);
}

export async function uploadSignedCopy(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const file = formData.get("file");
  const documentTitle = (formData.get("document_title") ?? "").toString().trim();
  const signedDate = (formData.get("externally_signed_date") ?? "").toString();
  const signedBy = (formData.get("externally_signed_by") ?? "").toString().trim();
  const tool = (formData.get("external_signing_tool") ?? "").toString();

  if (!(file instanceof File) || file.size === 0) return { error: "Choose the signed file to upload." };
  if (!documentTitle || !signedBy || !signedDate) {
    return { error: "Title, signed-by, and signed date are required." };
  }

  const supabase = await createClient();
  const storagePath = `signatures/${randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { data, error } = await supabase
    .from("signature_requests")
    .insert({
      document_title: documentTitle,
      source_document_url: storagePath,
      final_signed_document_url: storagePath,
      signing_method: "uploaded_external",
      status: "locked",
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      engagement_id: emptyToNull(formData.get("engagement_id")),
      contract_id: emptyToNull(formData.get("contract_id")),
      created_by: user.id,
      externally_signed_date: signedDate,
      externally_signed_by: signedBy,
      external_signing_tool: tool || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Couldn't save the record: " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "signature_request",
    resourceId: data.id,
    resourceName: documentTitle,
    newValue: { signing_method: "uploaded_external", signedBy },
  });

  revalidatePath("/signatures");
  redirect(`/signatures/${data.id}`);
}

export async function sendReminder(signerId: string) {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: signer } = await supabase
    .from("signature_signers")
    .select("internal_user_id, signer_name, signature_request_id")
    .eq("id", signerId)
    .maybeSingle();
  if (!signer) return;

  const { data: request } = await supabase
    .from("signature_requests")
    .select("document_title")
    .eq("id", signer.signature_request_id)
    .maybeSingle();

  if (signer.internal_user_id) {
    await createNotification({
      userId: signer.internal_user_id,
      type: "flagged_item",
      title: `Reminder: signature needed — ${request?.document_title ?? ""}`,
      link: `/signatures/${signer.signature_request_id}`,
    });
  }

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "signature_signer",
    resourceId: signerId,
    newValue: { reminder_sent: true },
  });
}

export async function getSignedSourceUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}
