import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { incrementViewCount } from "../actions";
import type { KbArticle } from "@/types";

const CATEGORIES: Record<string, string> = {
  policy: "Policy",
  sop: "SOP",
  guide: "How-To Guides",
  template: "Templates",
  faq: "FAQ",
};

export default async function KbSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  if (slug in CATEGORIES) {
    const { data: articles } = await supabase
      .from("kb_articles")
      .select("*")
      .eq("category", slug)
      .eq("is_published", true)
      .order("title");
    const rows = (articles ?? []) as KbArticle[];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/kb" className="hover:underline">
            Knowledge Base
          </Link>
          <span>/</span>
          <span>{CATEGORIES[slug]}</span>
        </div>
        <h1 className="font-heading text-2xl font-semibold">{CATEGORIES[slug]}</h1>

        {rows.length === 0 ? (
          <EmptyState message="No articles in this category yet." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((a) => (
              <Link key={a.id} href={`/kb/${a.id}`} className="rounded-md border border-border p-4 hover:bg-muted/30">
                <p className="font-medium">{a.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { data: articleRow } = await supabase.from("kb_articles").select("*").eq("id", slug).maybeSingle();
  if (!articleRow) notFound();
  const article = articleRow as KbArticle;

  await incrementViewCount(article.id);

  const { data: author } = article.author_id
    ? await supabase.from("users").select("full_name").eq("id", article.author_id).maybeSingle()
    : { data: null };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/kb" className="hover:underline">
          Knowledge Base
        </Link>
        <span>/</span>
        <Link href={`/kb/${article.category}`} className="hover:underline capitalize">
          {article.category && CATEGORIES[article.category]}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">{article.title}</h1>
        {canEdit(user.role, "kb") && (
          <Button asChild variant="outline">
            <Link href={`/kb/${article.id}/edit`}>Edit</Link>
          </Button>
        )}
      </div>

      <p className="text-xs text-text-muted">
        {author?.full_name && `By ${author.full_name} · `}
        Last updated {new Date(article.updated_at).toLocaleDateString()}
      </p>

      <article className="prose prose-sm max-w-none text-foreground prose-headings:font-heading prose-a:text-veltron-gold">
        <Markdown>{article.body}</Markdown>
      </article>
    </div>
  );
}
