import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { canEdit } from "@/lib/permissions";
import { FormBuilder } from "@/components/forms/FormBuilder";

export default async function NewFormPage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "intake")) redirect("/forms");

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Create New Form</h1>
      <FormBuilder />
    </div>
  );
}
