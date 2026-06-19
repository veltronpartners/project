"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { Meeting } from "@/types";

const TYPE_COLOR: Record<string, string> = {
  portfolio_checkin: "bg-veltron-gold",
  internal: "bg-success",
  external: "bg-warning",
  board: "bg-danger",
};

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function CalendarView({ meetings }: { meetings: Meeting[] }) {
  const [selected, setSelected] = useState<Date>(new Date());

  const meetingDates = meetings.map((m) => new Date(m.date));
  const dayMeetings = meetings.filter((m) => sameDay(new Date(m.date), selected));

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => date && setSelected(date)}
        modifiers={{ hasMeeting: meetingDates }}
        modifiersClassNames={{ hasMeeting: "font-bold underline" }}
        className="rounded-md border border-border"
      />
      <div className="space-y-2">
        <h3 className="font-heading text-sm font-semibold">
          {selected.toLocaleDateString(undefined, { dateStyle: "full" })}
        </h3>
        {dayMeetings.length === 0 ? (
          <EmptyState message="No meetings on this day." />
        ) : (
          <div className="space-y-2">
            {dayMeetings.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted/30"
              >
                <span className={`h-2 w-2 rounded-full ${TYPE_COLOR[m.meeting_type ?? "internal"]}`} />
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(m.date).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
