import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";

export default async function UploadSignedCopyPage() {
  await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: portfolios } = await supabase.from("portfolio_companies").select("id, name").order("name");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Upload Signed Document</h1>
      <p className="text-sm text-text-muted">
        For documents signed outside the portal (wet ink, another e-sign tool, a government registrar) —
        files it in the Document Vault with the same linking as a native signature.
      </p>
      <UploadForm portfolios={portfolios ?? []} />
    </div>
  );
}
