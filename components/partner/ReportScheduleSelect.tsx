"use client";

import { toggleReportSchedule } from "@/app/(portal)/portfolio/[id]/partner/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReportScheduleSelect({
  portfolioId,
  partnerContactId,
  current,
}: {
  portfolioId: string;
  partnerContactId: string;
  current: string;
}) {
  return (
    <Select
      defaultValue={current}
      onValueChange={(v) => toggleReportSchedule(portfolioId, partnerContactId, v as "weekly" | "biweekly" | "monthly" | "off")}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="off">Off</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="biweekly">Biweekly</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
      </SelectContent>
    </Select>
  );
}
