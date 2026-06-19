import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import type { VaultDocument } from "@/types";

export default async function DocumentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await getCurrentStaffUser();
  const { q, category } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category", category);
  const { data: documents } = await query;
  const rows = (documents ?? []) as VaultDocument[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Document Vault</h1>
        <Button asChild>
          <Link href="/documents/new">Upload Document</Link>
        </Button>
      </div>

      <form className="flex gap-2" method="get">
        <Input name="q" placeholder="Search by title" defaultValue={q ?? ""} className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No documents yet — upload your first one." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-start gap-3 rounded-md border border-border p-4 hover:bg-muted/30"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.title}</p>
                <p className="text-xs text-text-muted">
                  {doc.category ?? "uncategorised"} · v{doc.version}
                </p>
                {doc.access_level !== "internal" && (
                  <Badge variant="outline" className="mt-1 text-xs capitalize">
                    {doc.access_level.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
