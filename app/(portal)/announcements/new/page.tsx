import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { isDirector } from "@/lib/permissions";
import { AnnouncementForm } from "./announcement-form";

export default async function NewAnnouncementPage() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) redirect("/announcements");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Post Announcement</h1>
      <AnnouncementForm />
    </div>
  );
}
