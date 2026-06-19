import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { canEdit } from "@/lib/permissions";
import { ArticleForm } from "@/components/kb/ArticleForm";

export default async function NewArticlePage() {
  const user = await getCurrentStaffUser();
  if (!canEdit(user.role, "kb")) redirect("/kb");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">New Article</h1>
      <ArticleForm />
    </div>
  );
}
