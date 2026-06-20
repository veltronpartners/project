"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { logAudit } from "@/lib/audit";
import { canEdit } from "@/lib/permissions";

export type FormState = { error?: string } | undefined;

function emptyToNull(value: FormDataEntryValue | null) {
  const str = value?.toString() ?? "";
  return str.length > 0 ? str : null;
}

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["policy", "sop", "guide", "template", "faq"]),
  body: z.string().min(1, "Body is required"),
});

export async function createArticle(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "kb")) {
    return { error: "Only a Director or Veltron Lead can create articles." };
  }

  const parsed = articleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const tags = emptyToNull(formData.get("tags"))
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kb_articles")
    .insert({
      title: parsed.data.title,
      category: parsed.data.category,
      body: parsed.data.body,
      author_id: user.id,
      last_edited_by: user.id,
      tags: tags ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn't create the article. " + (error?.message ?? "") };

  await logAudit({
    actorId: user.id,
    action: "created",
    resourceType: "kb_article",
    resourceId: data.id,
    resourceName: parsed.data.title,
  });

  revalidatePath("/kb");
  redirect(`/kb/${data.id}`);
}

export async function updateArticle(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "kb")) {
    return { error: "Only a Director or Veltron Lead can edit articles." };
  }

  const parsed = articleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const tags = emptyToNull(formData.get("tags"))
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      body: parsed.data.body,
      last_edited_by: user.id,
      tags: tags ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: user.id,
    action: "updated",
    resourceType: "kb_article",
    resourceId: id,
    resourceName: parsed.data.title,
  });

  revalidatePath(`/kb/${id}`);
  redirect(`/kb/${id}`);
}

export async function incrementViewCount(id: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_kb_view_count", { article_id: id });
}
