import { getCurrentPartner } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UploadForm } from "./upload-form";
import type { PartnerDocument, VaultDocument } from "@/types";

export default async function PartnerDocumentsPage() {
  const partner = await getCurrentPartner();
  const supabase = await createClient();

  const [{ data: shared }, { data: myUploads }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("portfolio_id", partner.portfolio_id)
      .eq("access_level", "internal"),
    supabase
      .from("partner_documents")
      .select("*")
      .eq("partner_contact_id", partner.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">My Documents</h1>

      <Tabs defaultValue="shared">
        <TabsList>
          <TabsTrigger value="shared">Shared by Veltron</TabsTrigger>
          <TabsTrigger value="uploads">My Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="mt-4 space-y-2">
          {!shared || shared.length === 0 ? (
            <EmptyState message="Nothing has been shared with you yet." />
          ) : (
            (shared as VaultDocument[]).map((d) => (
              <div key={d.id} className="rounded-md border border-border px-4 py-3 text-sm">
                {d.title}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="uploads" className="mt-4 space-y-4">
          <UploadForm />
          {!myUploads || myUploads.length === 0 ? (
            <EmptyState message="You haven't uploaded anything yet." />
          ) : (
            <div className="space-y-2">
              {(myUploads as PartnerDocument[]).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
                  <span>{d.title}</span>
                  <Badge variant="outline" className="capitalize">
                    {d.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
