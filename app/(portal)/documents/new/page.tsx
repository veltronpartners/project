import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { UploadForm } from "./upload-form";

export default async function UploadDocumentPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: portfolios } = await supabase.from("portfolio_companies").select("id, name").order("name");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Upload Document</h1>
      <UploadForm portfolios={portfolios ?? []} canSetAccessLevel={isDirector(user.role)} />
    </div>
  );
}
