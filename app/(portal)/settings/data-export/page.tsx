import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { isDirector } from "@/lib/permissions";
import { ExportButtons } from "./export-buttons";

export default async function DataExportPage() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Data Export</h1>
      <p className="text-sm text-text-muted">
        Export any module as CSV, or pull a full JSON snapshot of the database — useful for board reporting,
        an accountant handoff, or migrating off the platform entirely. Veltron always owns and can extract its
        own data.
      </p>
      <ExportButtons />
    </div>
  );
}
