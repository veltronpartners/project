import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function generateLinkToken(): string {
  return randomBytes(24).toString("hex");
}

type LinkLookupResult =
  | { usable: true; link: { id: string; form_id: string; status: string; expires_at: string }; form: { id: string; title: string; description: string | null; schema: unknown } }
  | { usable: false; reason: "submitted" | "expired" | "revoked" | "not_found" };

/** Looks up a public form link by token — bypasses RLS since the
 * prospect filling it out never has a Supabase session. The token
 * itself is the authorization. */
export async function getFormLinkByToken(token: string): Promise<LinkLookupResult> {
  const admin = createAdminClient();
  const { data: link } = await admin.from("form_link_tokens").select("*").eq("token", token).maybeSingle();
  if (!link) return { usable: false, reason: "not_found" };

  if (link.status === "submitted" || link.status === "revoked") {
    return { usable: false, reason: link.status };
  }

  if (link.status === "expired" || new Date(link.expires_at) < new Date()) {
    if (link.status !== "expired") {
      await admin.from("form_link_tokens").update({ status: "expired" }).eq("id", link.id);
    }
    return { usable: false, reason: "expired" };
  }

  const { data: form } = await admin.from("forms").select("*").eq("id", link.form_id).maybeSingle();
  if (!form) return { usable: false, reason: "not_found" };

  return { usable: true, link, form };
}

export async function uploadLeadFieldFile(
  token: string,
  fieldId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const admin = createAdminClient();
  const found = await getFormLinkByToken(token);
  if (!found.usable) return { error: "This link is no longer active." };

  if (file.size === 0) return { error: "Empty file." };
  if (file.size > 25 * 1024 * 1024) return { error: "Files must be 25MB or smaller." };

  const storagePath = `lead-uploads/${found.link.id}/${fieldId}-${randomBytes(8).toString("hex")}-${file.name}`;
  const { error } = await admin.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) return { error: "Upload failed: " + error.message };
  return { path: storagePath };
}

export async function getLeadFieldFileUrl(storagePath: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("documents").createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function recordLeadSubmission(params: {
  token: string;
  respondentName: string;
  respondentEmail: string;
  respondentCompany?: string;
  answers: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const found = await getFormLinkByToken(params.token);
  if (!found.usable) {
    return { ok: false, error: "This link is no longer active." };
  }

  const { data: submission, error } = await admin
    .from("lead_form_submissions")
    .insert({
      token_id: found.link.id,
      form_id: found.form.id,
      respondent_name: params.respondentName,
      respondent_email: params.respondentEmail,
      respondent_company: params.respondentCompany || null,
      answers: params.answers,
    })
    .select("id")
    .single();
  if (error || !submission) return { ok: false, error: "Couldn't record your response: " + (error?.message ?? "") };

  await admin
    .from("form_link_tokens")
    .update({ status: "submitted", submission_id: submission.id })
    .eq("id", found.link.id);

  return { ok: true };
}
