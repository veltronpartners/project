"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

export async function uploadDocument(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  const file = formData.get("file");
  const title = (formData.get("title") ?? "").toString().trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (!title) {
    return { error: "Title is required." };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { error: "Files must be 25MB or smaller." };
  }

  const supabase = await createClient();
  const storagePath = `${randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) {
    return { error: "Upload failed: " + uploadError.message };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title,
      category: emptyToNull(formData.get("category")),
      description: emptyToNull(formData.get("description")),
      file_url: storagePath,
      file_type: file.type || null,
      file_size_kb: Math.round(file.size / 1024),
      portfolio_id: emptyToNull(formData.get("portfolio_id")),
      project_id: emptyToNull(formData.get("project_id")),
      engagement_id: emptyToNull(formData.get("engagement_id")),
      uploaded_by: user.id,
      access_level: emptyToNull(formData.get("access_level")) ?? "internal",
      tags: emptyToNull(formData.get("tags"))?.split(",").map((t) => t.trim()).filter(Boolean) ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Couldn't save the document record: " + (error?.message ?? "") };
  }

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "document",
    resourceId: data.id,
    resourceName: title,
  });

  revalidatePath("/documents");
  redirect(`/documents/${data.id}`);
}

export async function getSignedDocumentUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}
