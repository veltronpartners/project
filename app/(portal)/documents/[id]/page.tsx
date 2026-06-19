import { notFound } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getSignedDocumentUrl } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VaultDocument } from "@/types";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: docRow } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!docRow) notFound();
  const document = docRow as VaultDocument;

  const { data: uploader } = document.uploaded_by
    ? await supabase.from("users").select("full_name").eq("id", document.uploaded_by).maybeSingle()
    : { data: null };

  const signedUrl = document.file_url ? await getSignedDocumentUrl(document.file_url) : null;
  const isPdf = document.file_type === "application/pdf";
  const isImage = document.file_type?.startsWith("image/");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{document.title}</h1>
          <p className="text-sm text-text-muted capitalize">
            {document.category?.replace("_", " ") ?? "uncategorised"} · v{document.version}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {document.access_level.replace("_", " ")}
        </Badge>
      </div>

      {document.description && <p className="text-sm text-foreground">{document.description}</p>}

      {signedUrl ? (
        <div className="space-y-3">
          {isPdf && (
            <iframe src={signedUrl} className="h-[500px] w-full rounded-md border border-border" />
          )}
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt={document.title} className="max-h-[500px] rounded-md border border-border" />
          )}
          <Button asChild>
            <a href={signedUrl} download>
              Download
            </a>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-danger">Couldn&apos;t generate a preview link for this file.</p>
      )}

      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div>
          <dt className="text-text-muted">Uploaded by</dt>
          <dd>{uploader?.full_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Uploaded</dt>
          <dd>{new Date(document.created_at).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt className="text-text-muted">File size</dt>
          <dd>{document.file_size_kb ? `${document.file_size_kb} KB` : "—"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">File type</dt>
          <dd>{document.file_type ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
