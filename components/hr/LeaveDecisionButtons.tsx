"use client";

import { decideLeaveRequest } from "@/app/(portal)/hr/actions";
import { Button } from "@/components/ui/button";

export function LeaveDecisionButtons({ requestId }: { requestId: string }) {
  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={() => decideLeaveRequest(requestId, "approved")}>
        Approve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => decideLeaveRequest(requestId, "declined")}
      >
        Decline
      </Button>
    </div>
  );
}
