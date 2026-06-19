import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { canEdit } from "@/lib/permissions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KbArticle } from "@/types";

const CATEGORIES: { value: KbArticle["category"]; label: string }[] = [
  { value: "policy", label: "Policy" },
  { value: "sop", label: "SOP" },
  { value: "guide", label: "How-To Guides" },
  { value: "template", label: "Templates" },
  { value: "faq", label: "FAQ" },
];

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentStaffUser();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("kb_articles").select("*").eq("is_published", true).order("title");
  if (q) query = query.ilike("title", `%${q}%`);
  const { data: articles } = await query;
  const rows = (articles ?? []) as KbArticle[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Knowledge Base</h1>
        {canEdit(user.role, "kb") && (
          <Button asChild>
            <Link href="/kb/new">New Article</Link>
          </Button>
        )}
      </div>

      <form className="flex gap-2" method="get">
        <Input name="q" placeholder="Search articles" defaultValue={q ?? ""} className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/kb/${c.value}`}
            className="rounded-full border border-border px-3 py-1 text-sm hover:bg-muted/40"
          >
            {c.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No articles found." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <Link
              key={a.id}
              href={`/kb/${a.id}`}
              className="rounded-md border border-border p-4 hover:bg-muted/30"
            >
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-xs capitalize text-text-muted">{a.category}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
