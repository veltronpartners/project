import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { Meeting } from "@/types";

export default async function CalendarPage() {
  await getCurrentStaffUser();
  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .neq("status", "cancelled")
    .order("date");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Calendar</h1>
      <CalendarView meetings={(meetings ?? []) as Meeting[]} />
    </div>
  );
}
