import Link from "next/link";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/types";

export default async function AnnouncementsPage() {
  const user = await getCurrentStaffUser();
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (announcements ?? []) as Announcement[];

  let pendingCount = 0;
  if (isDirector(user.role)) {
    const { count } = await supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Announcements</h1>
        {isDirector(user.role) && (
          <Button asChild>
            <Link href="/announcements/new">Post Announcement</Link>
          </Button>
        )}
      </div>

      {pendingCount > 0 && (
        <div className="rounded-md border border-veltron-gold/30 bg-accent/30 p-3 text-sm">
          {pendingCount} announcement{pendingCount > 1 ? "s" : ""} waiting on your approval —{" "}
          <Link href="/approvals" className="text-veltron-gold underline">
            review in Approvals
          </Link>
          .
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState message="No announcements yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <AnnouncementBanner key={a.id} title={a.title} body={a.body} priority={a.priority} />
          ))}
        </div>
      )}
    </div>
  );
}
