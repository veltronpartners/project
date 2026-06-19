import { notFound, redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { ArticleForm } from "@/components/kb/ArticleForm";
import type { KbArticle } from "@/types";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "kb")) redirect("/kb");

  const supabase = await createClient();
  const { data: article } = await supabase.from("kb_articles").select("*").eq("id", slug).maybeSingle();
  if (!article) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Edit Article</h1>
      <ArticleForm article={article as KbArticle} />
    </div>
  );
}
