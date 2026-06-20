import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SignatureRequest } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-text-muted",
  sent: "bg-warning/15 text-warning",
  partially_signed: "bg-veltron-gold-muted text-veltron-charcoal",
  fully_signed: "bg-success/15 text-success",
  locked: "bg-success/15 text-success",
};

export default async function SignaturesListPage() {
  await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("signature_requests")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = (requests ?? []) as SignatureRequest[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Signatures &amp; Contracts</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/signatures/upload">Upload Signed Copy</Link>
          </Button>
          <Button asChild>
            <Link href="/signatures/new">New Signature Request</Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No signature requests yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Document</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/signatures/${r.id}`} className="font-medium hover:underline">
                      {r.document_title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {r.signing_method === "in_portal" ? "In-portal" : "Uploaded"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge className={cn("border-0 capitalize", STATUS_STYLES[r.status])}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
